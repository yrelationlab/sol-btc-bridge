use anchor_lang::prelude::*;
#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient Stake")]
    InsufficientStake,
    #[msg("Invalid Message Type")]
    InvalidMessageType,
    #[msg("Invalid Op Code")]
    InvalidOpCode,
    #[msg("Invalid Supported Token Addresses")]
    InvalidSupportedTokenAddresses,
    #[msg("Invalid Token Fee Percentage")]
    InvalidTokenFeePercentage,
    #[msg("Invalid Ids Length")]
    InvalidIdsLength,
    #[msg("Invalid Token Minimum Amount")]
    InvalidTokenMinimumAmount,
    #[msg("Invalid Token Ids")]
    InvalidTokenIds,
    #[msg("Invalid Admin Address")]
    InvalidAdminAddress,
    #[msg("Invalid Fee Recipient Address")]
    InvalidFeeRecipientAddress,
    #[msg("Cannot Support Self")]
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
    SupportedChainNotInitialized,
    #[msg("Message Op Type Mismatch")]
    MessageOpTypeMismatch,
    #[msg("Bridge Config Not Initialized")]
    BridgeConfigNotInitialized,
    #[msg("Chain Id Mismatch")]
    ChainIdMismatch,
    #[msg("Duplicate Signature")]
    DuplicateSignature,
    #[msg("Submitter Not Initialized")]
    SubmitterNotInitialized,
    #[msg("Not A Submitter")]
    NotSubmitter,
    #[msg("Signature verification failed")]
    SigVerificationFailed,
    #[msg("InstructionMissing")]
    InstructionMissing,
    #[msg("Invalid Signer")]
    InvalidSigner,
    #[msg("Invalid Nonce")]
    InvalidNonce,
    #[msg("Withdraw Paused")]
    WithdrawPaused,
    #[msg("Invalid Address")]
    InvalidAddress,
    #[msg("Invalid Min Amount")]
    InvalidMinAmount,
    #[msg("Invalid User Address")]
    InvalidUserAddress,
    #[msg("Invalid Fee Recipient")]
    InvalidFeeRecipient,
    #[msg("Lack Target Mint")]
    LackTargetMint,
    #[msg("ChainId Should Diff From Solana Chain Id")]
    ChainIdShouldDiffFromSolanaChainId,
}
