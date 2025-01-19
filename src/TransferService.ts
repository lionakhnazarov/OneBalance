import { BalanceTracker } from './BalanceTracker';
import { CrossChainExecutor } from './CrossChainExecutor';
import { SignatureVerifier } from './SignatureVerifier';
import { TransferObject } from "./types";

export class TransferService {
    private balanceTracker: BalanceTracker;
    private crossChainExecutor: CrossChainExecutor;

    constructor(balanceTracker: BalanceTracker, crossChainExecutor: CrossChainExecutor) {
        this.balanceTracker = balanceTracker;
        this.crossChainExecutor = crossChainExecutor;
    }

    async processTransferRequest(transfer: TransferObject): Promise<string> {
        const signatureVerification = SignatureVerifier.verifySignature(transfer);
        if (!signatureVerification.valid) {
            throw new Error(`Invalid signature: ${signatureVerification.error}`);
        }

        const senderBalance = await this.balanceTracker.getUserBalance(transfer.sender, transfer.token.address);
        if (senderBalance < transfer.token.amount) {
            throw new Error('Insufficient balance');
        }

        // Process the transfer (lock tokens, execute cross-chain transfer, refund, etc.)
        await this.crossChainExecutor.executeTransfer(transfer);

        return 'Transfer successful';
    }
}
