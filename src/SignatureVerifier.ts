import { ethers } from 'ethers';
import { TransferObject, SignatureVerificationResult } from "./types";

export class SignatureVerifier {
    static verifySignature(transfer: TransferObject): SignatureVerificationResult {
        try {
            const messageHash = ethers.hashMessage(JSON.stringify(transfer));
            const recoveredAddress = ethers.verifyMessage(messageHash, transfer.signature);
            if (recoveredAddress === transfer.sender) {
                return { valid: true };
            }
            return { valid: false, error: 'Invalid signature' };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}
