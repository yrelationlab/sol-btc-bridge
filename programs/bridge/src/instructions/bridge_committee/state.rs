
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct BridgeCommittee {
    pub index: u8,
    pub stake_amount: u16,
    pub is_blocklisted: bool,
    /// padding
    pub padding: [u64; 16],
}
impl BridgeCommittee {
    pub const LEN: usize = 8
        + 1 // index
        + 2 // stakeAmount
        + 1 // isBlocklisted
        + BridgeCommittee::LEN_OF_PADDING * 8 // padding
        ;
    pub const LEN_OF_PADDING: usize = 16; //128 bytes padding

}
#[account]
#[derive(Default)]
pub struct Submitter {
    pub member: Pubkey,
    pub is_submitter: bool,
    /// padding
    pub padding: [u64; 16],
}
impl Submitter {
    pub const LEN: usize = 8
    + 32 // member
    + 1 // isSubmitter
    + Submitter::LEN_OF_PADDING * 8 // padding
    ;
    pub const LEN_OF_PADDING: usize = 16; //128 bytes padding
}
