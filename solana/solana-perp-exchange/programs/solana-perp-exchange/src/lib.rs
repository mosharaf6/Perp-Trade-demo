use anchor_lang::prelude::*;

declare_id!("HKvKmM9KFiQNT7fwKPJcU4qXbqGdB5xkNzqDJj7F9h4z");

// Seeds for PDAs
const EXCHANGE_STATE_SEED: &[u8] = b"exchange_state";
const VAULT_SEED: &[u8] = b"vault";
const USER_ACCOUNT_SEED: &[u8] = b"user_account";

// Default governance parameters
const DEFAULT_TRADING_FEE_RATE: u16 = 100; // 1% (100 basis points)
const DEFAULT_MAX_LEVERAGE: u8 = 10;
const DEFAULT_MIN_MARGIN: u64 = 1_000_000; // 0.001 SOL in lamports
const DEFAULT_LIQUIDATION_THRESHOLD: u16 = 8000; // 80% (8000 basis points)
const DEFAULT_ORACLE_VALIDITY_PERIOD: u64 = 300; // 5 minutes in seconds

#[program]
pub mod solana_perp_exchange {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, oracle_price: u64) -> Result<()> {
        let exchange_state = &mut ctx.accounts.exchange_state;
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        require!(oracle_price > 0, PerpExchangeError::InvalidPrice);

        // Initialize exchange state
        exchange_state.admin = ctx.accounts.admin.key();
        exchange_state.vault = vault.key();
        exchange_state.oracle_price = oracle_price;
        exchange_state.oracle_last_update = clock.unix_timestamp;
        exchange_state.total_long_positions = 0;
        exchange_state.total_short_positions = 0;
        exchange_state.total_volume = 0;
        exchange_state.collected_fees = 0;
        exchange_state.insurance_fund_balance = 0;
        exchange_state.is_paused = false;
        
        // Initialize governance parameters with defaults
        exchange_state.governance_params = GovernanceParams {
            trading_fee_rate: DEFAULT_TRADING_FEE_RATE,
            max_leverage: DEFAULT_MAX_LEVERAGE,
            min_margin: DEFAULT_MIN_MARGIN,
            liquidation_threshold: DEFAULT_LIQUIDATION_THRESHOLD,
            funding_interval: 3600,
            oracle_validity_period: DEFAULT_ORACLE_VALIDITY_PERIOD,
        };

        // Initialize vault
        vault.exchange_state = exchange_state.key();
        vault.total_balance = 0;
        vault.reserved_collateral = 0;
        vault.bump = ctx.bumps.vault;

        msg!("Exchange initialized with oracle price: {}", oracle_price);
        Ok(())
    }

    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        
        user_account.owner = ctx.accounts.user.key();
        user_account.collateral_balance = 0;
        user_account.total_fees_paid = 0;
        user_account.position = Position::default();

        msg!("User account created for: {}", ctx.accounts.user.key());
        Ok(())
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let vault = &mut ctx.accounts.vault;

        require!(amount > 0, PerpExchangeError::InvalidAmount);

        // Transfer SOL from user to vault
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? -= amount;
        **vault.to_account_info().try_borrow_mut_lamports()? += amount;

        // Update balances
        user_account.collateral_balance += amount;
        vault.total_balance += amount;

        msg!("Deposited {} lamports for user: {}", amount, ctx.accounts.user.key());
        Ok(())
    }

    pub fn withdraw_collateral(ctx: Context<WithdrawCollateral>, amount: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let vault = &mut ctx.accounts.vault;

        require!(amount > 0, PerpExchangeError::InvalidAmount);
        require!(
            user_account.collateral_balance >= amount,
            PerpExchangeError::InsufficientCollateral
        );

        // Transfer SOL from vault to user
        **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount;

        // Update balances
        user_account.collateral_balance -= amount;
        vault.total_balance -= amount;

        msg!("Withdrawn {} lamports for user: {}", amount, ctx.accounts.user.key());
        Ok(())
    }

    pub fn open_position(ctx: Context<OpenPosition>, params: OpenPositionParams) -> Result<()> {
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
        require!(!user_account.position.is_open, PerpExchangeError::PositionExists);
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

        // Create position
        user_account.position = Position {
            size: signed_size,
            margin: params.margin,
            entry_price: exchange_state.oracle_price,
            is_open: true,
            leverage: params.leverage,
            opened_at: clock.unix_timestamp,
        };

        // Update balances
        user_account.collateral_balance -= params.margin;
        vault.reserved_collateral += params.margin;

        // Update global stats
        if params.is_long {
            exchange_state.total_long_positions += position_size as u64;
        } else {
            exchange_state.total_short_positions += position_size as u64;
        }
        exchange_state.total_volume += position_size as u64;

        msg!("Position opened - User: {}, Size: {}, Margin: {}", 
             ctx.accounts.user.key(), signed_size, params.margin);
        Ok(())
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        let exchange_state = &mut ctx.accounts.exchange_state;
        let user_account = &mut ctx.accounts.user_account;
        let vault = &mut ctx.accounts.vault;

        require!(user_account.position.is_open, PerpExchangeError::NoPosition);

        // Extract position data
        let position_size = user_account.position.size;
        let position_margin = user_account.position.margin;
        let is_long = position_size > 0;
        let position_abs_size = position_size.abs() as u64;

        // Return margin to user (simplified - no P&L calculation for now)
        user_account.collateral_balance += position_margin;
        vault.reserved_collateral -= position_margin;

        // Update global stats
        if is_long {
            exchange_state.total_long_positions -= position_abs_size;
        } else {
            exchange_state.total_short_positions -= position_abs_size;
        }

        // Clear position
        user_account.position = Position::default();

        msg!("Position closed - User: {}", ctx.accounts.user.key());
        Ok(())
    }

    pub fn update_price(ctx: Context<UpdatePrice>, new_price: u64) -> Result<()> {
        let exchange_state = &mut ctx.accounts.exchange_state;
        let clock = Clock::get()?;

        require!(new_price > 0, PerpExchangeError::InvalidPrice);

        exchange_state.oracle_price = new_price;
        exchange_state.oracle_last_update = clock.unix_timestamp;

        msg!("Oracle price updated to: {}", new_price);
        Ok(())
    }
}

// Account structs
#[account]
pub struct ExchangeState {
    pub admin: Pubkey,
    pub vault: Pubkey,
    pub oracle_price: u64,
    pub oracle_last_update: i64,
    pub total_long_positions: u64,
    pub total_short_positions: u64,
    pub total_volume: u64,
    pub collected_fees: u64,
    pub insurance_fund_balance: u64,
    pub is_paused: bool,
    pub governance_params: GovernanceParams,
}

impl ExchangeState {
    pub const SPACE: usize = 8 + // discriminator
        32 + // admin
        32 + // vault
        8 + // oracle_price
        8 + // oracle_last_update
        8 + // total_long_positions
        8 + // total_short_positions
        8 + // total_volume
        8 + // collected_fees
        8 + // insurance_fund_balance
        1 + // is_paused
        GovernanceParams::SPACE; // governance_params
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GovernanceParams {
    pub trading_fee_rate: u16,
    pub max_leverage: u8,
    pub min_margin: u64,
    pub liquidation_threshold: u16,
    pub funding_interval: u64,
    pub oracle_validity_period: u64,
}

impl GovernanceParams {
    pub const SPACE: usize =
        2 + // trading_fee_rate
        1 + // max_leverage
        8 + // min_margin
        2 + // liquidation_threshold
        8 + // funding_interval
        8; // oracle_validity_period
}

#[account]
pub struct VaultAccount {
    pub exchange_state: Pubkey,
    pub total_balance: u64,
    pub reserved_collateral: u64,
    pub bump: u8,
}

impl VaultAccount {
    pub const SPACE: usize = 8 + // discriminator
        32 + // exchange_state
        8 + // total_balance
        8 + // reserved_collateral
        1; // bump
}

#[account]
pub struct UserAccount {
    pub owner: Pubkey,
    pub collateral_balance: u64,
    pub total_fees_paid: u64,
    pub position: Position,
}

impl UserAccount {
    pub const SPACE: usize = 8 + // discriminator
        32 + // owner
        8 + // collateral_balance
        8 + // total_fees_paid
        Position::SPACE; // position
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Position {
    pub size: i64, // Positive for long, negative for short
    pub margin: u64,
    pub entry_price: u64,
    pub is_open: bool,
    pub leverage: u8,
    pub opened_at: i64,
}

impl Position {
    pub const SPACE: usize =
        8 + // size
        8 + // margin
        8 + // entry_price
        1 + // is_open
        1 + // leverage
        8; // opened_at
}

// Context structs
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = ExchangeState::SPACE,
        seeds = [EXCHANGE_STATE_SEED],
        bump
    )]
    pub exchange_state: Account<'info, ExchangeState>,

    #[account(
        init,
        payer = admin,
        space = VaultAccount::SPACE,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(
        init,
        payer = user,
        space = UserAccount::SPACE,
        seeds = [USER_ACCOUNT_SEED, user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
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

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawCollateral<'info> {
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

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(
        mut,
        seeds = [EXCHANGE_STATE_SEED],
        bump,
        constraint = exchange_state.admin == admin.key() @ PerpExchangeError::UnauthorizedAdmin
    )]
    pub exchange_state: Account<'info, ExchangeState>,

    #[account(mut)]
    pub admin: Signer<'info>,
}

// Parameter structs
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OpenPositionParams {
    pub is_long: bool,
    pub margin: u64,
    pub leverage: u8,
}

// Error codes
#[error_code]
pub enum PerpExchangeError {
    #[msg("Invalid price provided")]
    InvalidPrice,
    
    #[msg("Invalid amount provided")]
    InvalidAmount,
    
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
    
    #[msg("Invalid leverage provided")]
    InvalidLeverage,
    
    #[msg("Position already exists")]
    PositionExists,
    
    #[msg("No position to close")]
    NoPosition,
    
    #[msg("Oracle price is stale")]
    StaleOracle,
    
    #[msg("Math overflow")]
    MathOverflow,
    
    #[msg("Unauthorized user")]
    UnauthorizedUser,
    
    #[msg("Unauthorized admin")]
    UnauthorizedAdmin,
    
    #[msg("Trading is paused")]
    TradingPaused,
    
    #[msg("Position is underwater")]
    PositionUnderwater,
    
    #[msg("Invalid liquidation")]
    InvalidLiquidation,
    
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
}
