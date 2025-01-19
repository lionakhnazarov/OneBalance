import { BalanceTracker } from "./BalanceTracker";
import {TransferObject, Tx} from "./types";
import {RedisClientType} from "redis";

export class CrossChainExecutor {
    private solverApiUrl: string;
    private balanceTracker: BalanceTracker;

    constructor(solverApiUrl: string, redisClient: RedisClientType) {
        this.solverApiUrl = solverApiUrl;
        this.balanceTracker = new BalanceTracker(redisClient);
    }

    async executeTransfer(transfer: TransferObject): Promise<void> {
        const { sender, token, refund } = transfer;

        // Lock tokens before execution
        await this.balanceTracker.lockTokens(sender, token.address, token.amount);

        try {
            // Make a request to the solver to initiate the cross-chain transfer
            const solverResponse = await this.initiateCrossChainTransfer(transfer);

            if (solverResponse.status === 'success') {
                // Wait for execution status from solver
                const executionStatus = await this.waitForExecutionStatus(solverResponse.txHash);

                if (executionStatus === 'done') {
                    // Execute refund transaction
                    await this.executeRefund(refund.tx);
                } else {
                    throw new Error('Cross-chain execution failed');
                }
            } else {
                throw new Error('Solver request failed');
            }
        } finally {
            // Unlock tokens after execution (even in case of failure)
            await this.balanceTracker.unlockTokens(sender, token.address, token.amount);
        }
    }

    private async initiateCrossChainTransfer(transfer: TransferObject) {
        // Logic to interact with the solver API for initiating the cross-chain transfer
        // Placeholder for actual API interaction
        return { status: 'success', txHash: 'dummy-tx-hash' };
    }

    private async waitForExecutionStatus(txHash: string): Promise<string> {
        // Wait for the reorg and execution confirmation from the solver
        return 'done'; // Placeholder for actual status check logic
    }

    private async executeRefund(tx: Tx): Promise<void> {
        // Logic to execute refund transaction
        console.log('Executing refund transaction:', tx);
    }
}
