use anchor_lang::prelude::*;
use crate::state::{ExchangeState, UserAccount, VaultAccount, Position};
use crate::constants::*;
use crate::error::PerpExchangeError;

/// Open a perpetual position
#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(
        mut,
        seeds = [EXCHANGE_STATE_SEED],
        bump
    )]
    pub exchange_state: Account<'info, ExchangeState>,

    #[account(
        mut,
        seeds = [USER_ACCOUNT_SEED, user.key().as_ref()],
        bump,
        constraint = user_account.owner == user.key() @ PerpExchangeError::UnauthorizedUser
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}

/// Parameters for opening a position
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OpenPositionParams {
    pub is_long: bool,
    pub margin: u64,
    pub leverage: u8,
}

pub fn open_position(
    ctx: Context<OpenPosition>,
    params: OpenPositionParams,
) -> Result<()> {
    let exchange_state = &mut ctx.accounts.exchange_state;
    let user_account = &mut ctx.accounts.user_account;
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;

    // Validate inputs
    require!(params.margin > 0, PerpExchangeError::InvalidAmount);
    require!(
        params.leverage > 0 && params.leverage <= exchange_state.governance_params.max_leverage,
        PerpExchangeError::InvalidLeverage
    );
    require!(
        params.margin >= exchange_state.governance_params.min_margin,
        PerpExchangeError::MarginTooLow
    );

    // Check user doesn't have existing position
    require!(!user_account.position.is_open, PerpExchangeError::PositionExists);

    // Check user has sufficient collateral
    require!(
        user_account.collateral_balance >= params.margin,
        PerpExchangeError::InsufficientCollateral
    );

    // Check oracle price is fresh
    let oracle_age = clock.unix_timestamp - exchange_state.oracle_last_update;
    require!(
        oracle_age <= exchange_state.governance_params.oracle_validity_period as i64,
        PerpExchangeError::StaleOracle
    );

    // Calculate position size
    let position_size = (params.margin as u128)
        .checked_mul(params.leverage as u128)
        .ok_or(PerpExchangeError::MathOverflow)?;
    
    let signed_size = if params.is_long {
        position_size as i64
    } else {
        -(position_size as i64)
    };

    // Calculate trading fee
    let trading_fee = (params.margin as u128)
        .checked_mul(exchange_state.governance_params.trading_fee_rate as u128)
        .ok_or(PerpExchangeError::MathOverflow)?
        .checked_div(10000)
        .ok_or(PerpExchangeError::MathOverflow)? as u64;

    // Check user has enough collateral including fees
    let total_required = params.margin
        .checked_add(trading_fee)
        .ok_or(PerpExchangeError::MathOverflow)?;
    
    require!(
        user_account.collateral_balance >= total_required,
        PerpExchangeError::InsufficientCollateral
    );

    // Create position
    user_account.position = Position {
        size: signed_size,
        margin: params.margin,
        entry_price: exchange_state.oracle_price,
        is_open: true,
        leverage: params.leverage,
        opened_at: clock.unix_timestamp,
    };

    // Deduct margin and fees from user balance
    user_account.collateral_balance = user_account.collateral_balance
        .checked_sub(total_required)
        .ok_or(PerpExchangeError::MathOverflow)?;
    
    user_account.total_fees_paid = user_account.total_fees_paid
        .checked_add(trading_fee)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Update vault reserved collateral
    vault.reserved_collateral = vault.reserved_collateral
        .checked_add(params.margin)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Update exchange statistics
    exchange_state.collected_fees = exchange_state.collected_fees
        .checked_add(trading_fee)
        .ok_or(PerpExchangeError::MathOverflow)?;
    
    if params.is_long {
        exchange_state.total_long_positions = exchange_state.total_long_positions
            .checked_add(position_size as u64)
            .ok_or(PerpExchangeError::MathOverflow)?;
    } else {
        exchange_state.total_short_positions = exchange_state.total_short_positions
            .checked_add(position_size as u64)
            .ok_or(PerpExchangeError::MathOverflow)?;
    }

    let notional_value = position_size as u64;
    exchange_state.total_volume = exchange_state.total_volume
        .checked_add(notional_value)
        .ok_or(PerpExchangeError::MathOverflow)?;

    msg!(
        "Position opened - User: {}, Size: {}, Margin: {}, Price: {}",
        ctx.accounts.user.key(),
        signed_size,
        params.margin,
        exchange_state.oracle_price
    );

    Ok(())
}

/// Close a perpetual position
#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(
        mut,
        seeds = [EXCHANGE_STATE_SEED],
        bump
    )]
    pub exchange_state: Account<'info, ExchangeState>,

    #[account(
        mut,
        seeds = [USER_ACCOUNT_SEED, user.key().as_ref()],
        bump,
        constraint = user_account.owner == user.key() @ PerpExchangeError::UnauthorizedUser
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}

pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
    let exchange_state = &mut ctx.accounts.exchange_state;
    let user_account = &mut ctx.accounts.user_account;
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;

    // Check user has open position
    require!(user_account.position.is_open, PerpExchangeError::NoPosition);

    // Check oracle price is fresh
    let oracle_age = clock.unix_timestamp - exchange_state.oracle_last_update;
    require!(
        oracle_age <= exchange_state.governance_params.oracle_validity_period as i64,
        PerpExchangeError::StaleOracle
    );

    // Extract position data before borrowing mutably
    let position_size = user_account.position.size;
    let position_margin = user_account.position.margin;
    let position_entry_price = user_account.position.entry_price;
    let is_long = position_size > 0;
    let position_abs_size = (position_size.abs()) as u64;

    // Calculate P&L
    let price_diff = if is_long {
        exchange_state.oracle_price as i128 - position_entry_price as i128
    } else {
        position_entry_price as i128 - exchange_state.oracle_price as i128
    };

    let pnl = (position_abs_size as i128)
        .checked_mul(price_diff)
        .ok_or(PerpExchangeError::MathOverflow)?
        .checked_div(position_entry_price as i128)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Calculate trading fee for closing
    let close_fee = (position_margin as u128)
        .checked_mul(exchange_state.governance_params.trading_fee_rate as u128)
        .ok_or(PerpExchangeError::MathOverflow)?
        .checked_div(10000)
        .ok_or(PerpExchangeError::MathOverflow)? as u64;

    // Calculate final margin after P&L and fees
    let margin_with_pnl = (position_margin as i128)
        .checked_add(pnl)
        .ok_or(PerpExchangeError::MathOverflow)?;
    
    let final_margin = margin_with_pnl
        .checked_sub(close_fee as i128)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Return collateral to user (can be negative if loss exceeds margin)
    if final_margin > 0 {
        user_account.collateral_balance = user_account.collateral_balance
            .checked_add(final_margin as u64)
            .ok_or(PerpExchangeError::MathOverflow)?;
    } else {
        // Position was liquidated with loss exceeding margin
        // In a real implementation, this would trigger insurance fund usage
        msg!("Position closed with total loss exceeding margin");
    }

    // Update vault reserved collateral
    vault.reserved_collateral = vault.reserved_collateral
        .checked_sub(position_margin)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Update exchange statistics
    exchange_state.collected_fees = exchange_state.collected_fees
        .checked_add(close_fee)
        .ok_or(PerpExchangeError::MathOverflow)?;

    if is_long {
        exchange_state.total_long_positions = exchange_state.total_long_positions
            .checked_sub(position_abs_size)
            .ok_or(PerpExchangeError::MathOverflow)?;
    } else {
        exchange_state.total_short_positions = exchange_state.total_short_positions
            .checked_sub(position_abs_size)
            .ok_or(PerpExchangeError::MathOverflow)?;
    }

    user_account.total_fees_paid = user_account.total_fees_paid
        .checked_add(close_fee)
        .ok_or(PerpExchangeError::MathOverflow)?;

    exchange_state.total_volume = exchange_state.total_volume
        .checked_add(position_abs_size)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Clear position
    user_account.position = Default::default();

    msg!(
        "Position closed - User: {}, P&L: {}, Final margin: {}",
        ctx.accounts.user.key(),
        pnl,
        final_margin
    );

    Ok(())
}

/// Liquidate an under-collateralized position
#[derive(Accounts)]
pub struct LiquidatePosition<'info> {
    #[account(
        mut,
        seeds = [EXCHANGE_STATE_SEED],
        bump
    )]
    pub exchange_state: Account<'info, ExchangeState>,

    #[account(
        mut,
        seeds = [USER_ACCOUNT_SEED, position_owner.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    /// The user whose position is being liquidated
    /// CHECK: This is validated through the user_account PDA
    pub position_owner: AccountInfo<'info>,

    /// The liquidator (can be anyone)
    #[account(mut)]
    pub liquidator: Signer<'info>,
}

pub fn liquidate_position(ctx: Context<LiquidatePosition>) -> Result<()> {
    let exchange_state = &mut ctx.accounts.exchange_state;
    let user_account = &mut ctx.accounts.user_account;
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;

    // Check user has open position
    require!(user_account.position.is_open, PerpExchangeError::NoPosition);

    // Check oracle price is fresh
    let oracle_age = clock.unix_timestamp - exchange_state.oracle_last_update;
    require!(
        oracle_age <= exchange_state.governance_params.oracle_validity_period as i64,
        PerpExchangeError::StaleOracle
    );

    let position = &user_account.position;
    let is_long = position.is_long();

    // Calculate current P&L
    let price_diff = if is_long {
        exchange_state.oracle_price as i128 - position.entry_price as i128
    } else {
        position.entry_price as i128 - exchange_state.oracle_price as i128
    };

    let pnl = (position.get_abs_size() as i128)
        .checked_mul(price_diff)
        .ok_or(PerpExchangeError::MathOverflow)?
        .checked_div(position.entry_price as i128)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Calculate current margin value
    let current_margin_value = (position.margin as i128)
        .checked_add(pnl)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Check if position is liquidatable
    let liquidation_threshold = (position.margin as u128)
        .checked_mul(exchange_state.governance_params.liquidation_threshold as u128)
        .ok_or(PerpExchangeError::MathOverflow)?
        .checked_div(10000)
        .ok_or(PerpExchangeError::MathOverflow)? as i128;

    require!(
        current_margin_value <= liquidation_threshold,
        PerpExchangeError::PositionNotLiquidatable
    );

    // Liquidation fee for liquidator (e.g., 1% of position margin)
    let liquidation_reward = position.margin
        .checked_mul(100)
        .ok_or(PerpExchangeError::MathOverflow)?
        .checked_div(10000)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Update vault and exchange state
    vault.reserved_collateral = vault.reserved_collateral
        .checked_sub(position.margin)
        .ok_or(PerpExchangeError::MathOverflow)?;

    // Update global position counts
    if is_long {
        exchange_state.total_long_positions = exchange_state.total_long_positions
            .checked_sub(position.get_abs_size())
            .ok_or(PerpExchangeError::MathOverflow)?;
    } else {
        exchange_state.total_short_positions = exchange_state.total_short_positions
            .checked_sub(position.get_abs_size())
            .ok_or(PerpExchangeError::MathOverflow)?;
    }

    // If there's remaining margin after liquidation, it goes to insurance fund
    if current_margin_value > liquidation_reward as i128 {
        let insurance_contribution = (current_margin_value as u64)
            .checked_sub(liquidation_reward)
            .ok_or(PerpExchangeError::MathOverflow)?;
        
        exchange_state.insurance_fund_balance = exchange_state.insurance_fund_balance
            .checked_add(insurance_contribution)
            .ok_or(PerpExchangeError::MathOverflow)?;
    }

    // Clear position
    user_account.position = Default::default();

    msg!(
        "Position liquidated - Owner: {}, Liquidator: {}, Reward: {}",
        ctx.accounts.position_owner.key(),
        ctx.accounts.liquidator.key(),
        liquidation_reward
    );

    Ok(())
}
