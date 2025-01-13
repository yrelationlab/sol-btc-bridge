use anchor_lang::prelude::*;
#[error_code]
pub enum BridgeError {
    #[msg("Invalid supported token addresses")]
    InvalidSupportedTokenAddresses,
    #[msg("Invalid token fee percentage")]
    InvalidTokenFeePercentage,
    #[msg("Invalid Ids Length")]
    InvalidIdsLength,
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
    InsufficientTotalStake,
    #[msg("Committee Config Address Missing")]
    CommitteeConfigAddressMissing,
    #[msg("Bridge Committee Serialization Error")]
    BridgeCommitteeSerializationError,
    #[msg("Submitter Config Address Missing")]
    SubmitterConfigAddressMissing,

    #[msg("Expired")]
    Expired,
    #[msg("InvalidPay load Length")]
    InvalidPayloadLength,
    #[msg("Failed To  Parse Token Price")]
    FailedToParseTokenPrice,
    #[msg("Insufficient Signatures")]
    InsufficientSignatures,
    #[msg("Deserialize Message Error")]
    DeserializeMessageError,
    #[msg("Message Mismatch")]
    MessageMismatch,

    #[msg("Supported Chain Not Initialized")]
    SupportedChainNotInitialized

}
