import { TransferService } from '../src/TransferService';
import { BalanceTracker } from '../src/BalanceTracker';
import { CrossChainExecutor } from '../src/CrossChainExecutor';
import Redis from 'redis-mock';
import { ethers } from 'ethers';
jest.mock('axios'); // Mock Axios for testing solver API calls
import axios from 'axios';

describe('End-to-End Test', () => {
    let transferService: TransferService;
    let balanceTracker: BalanceTracker;
    let crossChainExecutor: CrossChainExecutor;
    const redisClient = Redis.createClient();
    const user = '0xUserAddress';
    const tokenAddress = '0xTokenAddress';

    beforeEach(() => {
        balanceTracker = new BalanceTracker(redisClient);
        crossChainExecutor = new CrossChainExecutor('http://solver-api-url', redisClient);
        transferService = new TransferService(balanceTracker, crossChainExecutor);
    });

    it('should process a valid cross-chain transfer successfully', async () => {
        const transfer = {
            sender: user,
            token: { address: tokenAddress, amount: 50 },
            targetChain: { chainId: 1, receiver: '0xReceiverAddress' },
            refund: { chainId: 1, tx: { to: '0xRefundAddress', data: '0x', value: 0 }, signedTx: '0x' },
            signature: await ethers.Wallet.createRandom().signMessage('dummy-message'),
        };

        // Mock initial balance and API responses
        await balanceTracker.updateUserBalance(user, tokenAddress, 100);

        const post = jest.fn().mockImplementation(() => {
            return { data: { status: 'success', txHash: 'dummy-tx-hash' } }
        })
        axios.post = post.bind(axios)
        // axios.post.mockResolvedValueOnce({ data: { status: 'success', txHash: 'dummy-tx-hash' } });
        // axios.get.mockResolvedValueOnce({ data: { status: 'done' } });

        const get = jest.fn().mockImplementation(() => {
            return { data: { status: 'done' } }
        })
        axios.get = get.bind(axios)

        const result = await transferService.processTransferRequest(transfer);

        // Assert that the transfer was successful and the balance was updated
        expect(result).toBe('Transfer successful');
        const finalBalance = await balanceTracker.getUserBalance(user, tokenAddress);
        expect(finalBalance).toBe(50); // 50 tokens locked
    });
});