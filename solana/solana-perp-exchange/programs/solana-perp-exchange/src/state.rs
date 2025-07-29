use anchor_lang::prelude::*;

/// Global exchange state - equivalent to multiple Solidity contracts combined
#[account]
#[derive(Default)]
pub struct ExchangeState {
    /// Authority (admin) of the exchange
    pub admin: Pubkey,
    /// Vault address
    pub vault: Pubkey,
    /// Price oracle data
    pub oracle_price: u64,
    pub oracle_last_update: i64,
    /// Funding rate data
    pub funding_rate: i64, // signed funding rate (positive = longs pay shorts)
    pub funding_last_update: i64,
    /// Fee collection
    pub collected_fees: u64,
    /// Insurance fund balance
    pub insurance_fund_balance: u64,
    /// Trading pause state
    pub is_paused: bool,
    /// Governance parameters
    pub governance_params: GovernanceParams,
    /// Global statistics
    pub total_long_positions: u64,
    pub total_short_positions: u64,
    pub total_volume: u64,
}

impl ExchangeState {
    pub const SPACE: usize = 8 + // discriminator
        32 + // admin
        32 + // vault
        8 + 8 + // oracle
        8 + 8 + // funding
        8 + // collected_fees
        8 + // insurance_fund_balance
        1 + // is_paused
        GovernanceParams::SPACE + // governance_params
        8 + 8 + 8; // global stats
}

/// User account state - equivalent to Solidity mappings per user
#[account]
#[derive(Default)]
pub struct UserAccount {
    /// Owner of this account
    pub owner: Pubkey,
    /// Collateral balance (in lamports/native token)
    pub collateral_balance: u64,
    /// Current position (only one position per user for simplicity)
    pub position: Position,
    /// Funding payments owed/earned
    pub funding_payment: i64,
    /// Total fees paid
    pub total_fees_paid: u64,
    /// Account creation timestamp
    pub created_at: i64,
}

impl UserAccount {
    pub const SPACE: usize = 8 + // discriminator
        32 + // owner
        8 + // collateral_balance
        Position::SPACE + // position
        8 + // funding_payment
        8 + // total_fees_paid
        8; // created_at
}

/// Position data structure
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Position {
    /// Position size (signed: positive = long, negative = short)
    pub size: i64,
    /// Margin amount
    pub margin: u64,
    /// Entry price
    pub entry_price: u64,
    /// Position is active
    pub is_open: bool,
    /// Leverage used
    pub leverage: u8,
    /// Timestamp when position was opened
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

    pub fn is_long(&self) -> bool {
        self.size > 0
    }

    pub fn is_short(&self) -> bool {
        self.size < 0
    }

    pub fn get_abs_size(&self) -> u64 {
        self.size.abs() as u64
    }
}

/// Governance parameters - equivalent to Solidity governance contract
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct GovernanceParams {
    /// Trading fee rate (in basis points, e.g., 10 = 0.1%)
    pub trading_fee_rate: u16,
    /// Liquidation threshold (in basis points, e.g., 8000 = 80%)
    pub liquidation_threshold: u16,
    /// Maximum leverage allowed
    pub max_leverage: u8,
    /// Minimum margin requirement
    pub min_margin: u64,
    /// Funding rate update interval (seconds)
    pub funding_interval: u32,
    /// Price oracle validity period (seconds)
    pub oracle_validity_period: u32,
}

impl GovernanceParams {
    pub const SPACE: usize = 
        2 + // trading_fee_rate
        2 + // liquidation_threshold
        1 + // max_leverage
        8 + // min_margin
        4 + // funding_interval
        4; // oracle_validity_period
}

/// Vault account for holding collateral - equivalent to Solidity Vault contract
#[account]
#[derive(Default)]
pub struct VaultAccount {
    /// Exchange state this vault belongs to
    pub exchange_state: Pubkey,
    /// Total balance in the vault
    pub total_balance: u64,
    /// Reserved collateral (for open positions)
    pub reserved_collateral: u64,
    /// Vault bump seed
    pub bump: u8,
}

impl VaultAccount {
    pub const SPACE: usize = 8 + // discriminator
        32 + // exchange_state
        8 + // total_balance
        8 + // reserved_collateral
        1; // bump
}
