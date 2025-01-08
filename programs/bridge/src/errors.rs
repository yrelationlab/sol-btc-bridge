use anchor_lang::prelude::*;

#[error_code]
pub enum MemooError {

    #[msg("TOKEN 0 BIGGER")]
    Token0Bigger,

    #[msg("Bind Token")]
    BindToken,

    #[msg("Deserialize Airdrop Message Error")]
    DeserializeAirdropMessageError,

    #[msg("Pool Authority Ata Missing")]
    PoolAuthorityAtaMissing,

    #[msg("Pool Token Ata Missing")]
    PoolTokenAtaMissing,

    #[msg("Expired")]
    Expired,

    #[msg("Invalid fee value")]
    InvalidFee,

    #[msg("Invalid buy too many tokens")]
    InvalidTooMany,

    #[msg("Balance is below the input")]
    BalanceTooSmall,

    #[msg("Input too samll to pay fee")]
    InputTooSmallThanFee,

    #[msg("Input too samll to buy 10 unit")]
    InputTooSmallThan10TimesIdoPrice,

    #[msg("Ido Buy Exceed Ido Total")]
    IdoBuyExceedIdoTotal,

    #[msg("Ido Buy Exceed Creator Buy Limit")]
    IdoBuyExceedIdoCreatorBuyLimit,

    #[msg("Pool Account A Error")]
    PoolAccountAError,
    
    #[msg("Pool Account Wsol Error")]
    PoolAccountWsolError,

    #[msg("Ido Buy Exceed User Buy Limit")]
    IdoBuyExceedIdoUserBuyLimit,

    #[msg("PreLaunchSecond < 0")]
    PreLaunchSecondLt0,

    #[msg("AdminMismatch")]
    AdminMismatch,

    #[msg("Platform Account Mismatch")]
    PlatformAccountMismatch,

    #[msg("Meme Config Is Not Initialized")]
    MemeConfigIsNotInitialized,

    #[msg("User Data Is Not Initialized")]
    UserDataIsNotInitialized,

    #[msg("Meme ID Mismatch")]
    MemeIDMismatch,

    #[msg("User Mismatch")]
    UserMismatch,

    #[msg("Airdrop Already Claimed")]
    AirdropAlreadyClaimed,

    #[msg("Creator Claim Exceed")]
    CreatorClaimExceed,

    #[msg("Creator Claim Permission Exceed")]
    CreatorClaimPermissionExceed,

    #[msg("Creator Claim Permission Smalller Than Before")]
    CreatorClaimPermissionSmalllerThanBefore,

    #[msg("Creator Claim Period Smalller Than Before")]
    CreatorClaimPeriodSmalllerThanBefore,

    #[msg("Creator Claim Exceed")]
    IdoUserClaimExceed,

    #[msg("Deal Hunter Claim Exceed")]
    DealHunterClaimExceed,

    #[msg("Not Admin Signature")]
    NotAdminSignature,

    #[msg("Verify Signature Fail")]
    VerifySignatureFail,

    #[msg("Meme User Data Config Is Not Initialized")]
    MemeUserDataConfigIsNotInitialized,

    #[msg("Meme User Data Meme Id Or User Is Mismatch")]
    MemeUserDataMemeIdOrUserMismatch,
    
    #[msg("IDO not started")]
    IdoNotStarted,

    #[msg("IDO not end")]
    IdoNotEnd,

    #[msg("IDO Ccount < 0")]
    MemeIdoCountLt0,

    #[msg("Admin Claim Fee Wsol Already")]
    AdminClaimFeeWsolAlready,

    #[msg("Platform Fee Recipient Mismatch")]
    PlatformFeeRecipientMismatch,

    #[msg("Admin Claim Fee Token Already")]
    AdminClaimFeeTokenAlready,

    #[msg("Platform Token Ata Missing")]
    PlatformTokenAtaMissing,

    #[msg("CpSwap Authority Ata Missing")]
    CpSwapAuthorityAtaMissing,

    #[msg("CpSwap Pool Ata Missing")]
    CpSwapPoolAtaMissing,

    #[msg("CpSwap Lp Mint Missing")]
    CpSwapLpMintMissing,

    #[msg("CpSwap Platform LP ATA Missing")]
    CpSwapPlatformLpAtaMissing,

    #[msg("CpSwap Vault Missing")]
    CpSwapVaultMissing,
 
    #[msg("CpSwap Pool Fee Missing")]
    CpSwapPoolFeeMissing,
    
    #[msg("CpSwap Observation State Missing")]
    CpSwapObservationStateMissing,

    #[msg("Meme Lp Is Not Empty")]
    MemeLpIsNotEmpty,

    #[msg("Deserialize Whitelist Message Error")]
    DeserializeWhitelistMessageError,

    #[msg("Deserialize Whitelist Percentage Not EQ 100")]
    DeserializeWhitelistPercentageNotEQ100,

    #[msg("Creator Missing")]
    CreatorMissing,

    #[msg("Whitelist Token ATA Missing")]
    WhitelistATAMissing,

    #[msg("Creator Account Mismatch")]
    CreatorAccountMismatch,

    #[msg("Creator Claim Permission Count Not Enough")]
    CreatorClaimPermissionCountNotEnough,

    #[msg("Platform Fee Recipient WSol ATA Missing")]
    PlatformFeeRecipientWSolATAMissing,

    #[msg("Platform Fee Recipient Token ATA Missing")]
    PlatformFeeRecipientTokenATAMissing,

    #[msg("Platform Fee Recipient Missing")]
    PlatformFeeRecipientMissing,

    #[msg("Ido Buy Count Not Enough")]
    MemeIdoBuyCountNotEnough,
    
    #[msg("User WSol ATA Missing")]
    UserWSolATAMissing,

    #[msg("Refund Money Not Eq Zero")]
    RefundMoneyNotEqZero,

    #[msg("Refund Flag Not Set")]
    RefundFlagNotSet,

    #[msg("Whitelist Already Claimed")]
    WhitelistAlreadyClaimed,
}
