/// This mod contains functions that validate that an instruction
/// is constructed the way we expect. In this case, this is for
/// `Ed25519Program.createInstructionWithPublicKey()` and
/// `Secp256k1Program.createInstructionWithEthAddress()` instructions.

pub mod ed25519;
pub mod utils;
pub mod msgs;



pub use ed25519::*;
pub use utils::*;
pub use msgs::*;
