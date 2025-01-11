use anchor_lang::prelude::*;
#[error_code]
pub enum BridgeError {
    #[msg("Invalid supported token addresses")]
    InvalidSupportedTokenAddresses,
    #[msg("Invalid token fee percentage")]
    InvalidTokenFeePercentage,
    #[msg("Invalid token minimum amount")]
    InvalidTokenMinimumAmount,
    #[msg("Invalid token prices")]
    InvalidTokenPrices,
    #[msg("Invalid admin address")]
    InvalidAdminAddress,
    #[msg("Invalid fee recipient address")]
    InvalidFeeRecipientAddress,
    #[msg("Cannot support self")]
    CannotSupportSelf,
    #[msg("Token Config Address Missing")]
    TokenConfigAddressMissing,
    #[msg("Token Config Address Missing")]
    SupportedChainAddressMissing,
    #[msg("Deserialize Airdrop Message Error")]
    DeserializeAirdropMessageError,
    #[msg("Deserialize Whitelist Message Error")]
    DeserializeWhitelistMessageError,
    #[msg("Deserialization Error")]
    DeserializationError,
    #[msg("Bridge Config Serialization Error")]
    BridgeConfigSerializationError,
    #[msg("Supported Chain Serialization Error")]
    SupportedChainSerializationError,

    #[msg("Committee Length Exceeds Limit")]
    CommitteeLengthExceedsLimit,
    #[msg("Committee And Stake Length Mismatch")]
    CommitteeAndStakeLengthMismatch,
    #[msg("Insufficient Total Stake")]
    InsufficientTotalStake
}
