import { ethers } from 'ethers';
 
export const eth_signer: ethers.Wallet = ethers.Wallet.createRandom();

 /// Sample Create Signature function that signs with ethers signMessage
 export async function createSignature(
    name: string,
    age: number,
    signer = eth_signer
  ): Promise<string> {
    // keccak256 hash of the message
    const messageHash: string = ethers.utils.solidityKeccak256(
        ['string', 'uint16'],
        [name, age]
    );
  
    // get hash as Uint8Array of size 32
    const messageHashBytes: Uint8Array = ethers.utils.arrayify(messageHash);
  
    // Signed message that is actually this:
    // sign(keccak256("\x19Ethereum Signed Message:\n" + len(messageHash) + messageHash)))
    const signature = await signer.signMessage(messageHashBytes);
  
    return signature;
  }
  