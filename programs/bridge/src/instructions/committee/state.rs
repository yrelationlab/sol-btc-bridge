use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Committee {
    pub is_initialized: bool, // 1 byte
    pub index: Pubkey,
    pub stake_amount: u16,
    pub is_blocklisted: bool,
    /// padding
    pub padding: [u64; 10],
}
impl Committee {
    pub const LEN: usize =
        8 +
        1 + // isInitialized
        32 + // index
        2 + // stakeAmount
        1 + // isBlocklisted
        Committee::LEN_OF_PADDING * 8; // padding
    pub const LEN_OF_PADDING: usize = 10; //128 bytes padding
}
#[account]
#[derive(Default)]
pub struct Submitter {
    pub is_initialized: bool, // 1 byte
    pub submitter: Pubkey,
    pub is_submitter: bool,
    /// padding
    pub padding: [u64; 10],
}
impl Submitter {
    pub const LEN: usize =
        8 +
        1 + // isInitialized
        32 + // member
        1 + // isSubmitter
        Submitter::LEN_OF_PADDING * 8; // padding
    pub const LEN_OF_PADDING: usize = 10; //128 bytes padding
}
