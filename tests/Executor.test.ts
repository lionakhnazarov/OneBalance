import { CrossChainExecutor } from '../src/CrossChainExecutor';
import { BalanceTracker } from '../src/BalanceTracker';
 import {Address, Token, TransferObject, Tx} from '../src/types';
import Redis from 'redis-mock';
import { ethers } from 'ethers';

jest.mock('axios'); // Mock Axios for testing solver API calls
import axios from 'axios';
import {RedisClientType} from "redis";


describe('CrossChainExecutor', () => {
    let crossChainExecutor: CrossChainExecutor;
    let balanceTracker: BalanceTracker;
    const redisClient = Redis.createClient();
    const user = '0xUserAddress';
    const tokenAddress = '0xTokenAddress';

    beforeEach(() => {
        const balanceTrack = new BalanceTracker(redisClient);
        const lockTokens = jest.fn(() => {
            return
        })
        balanceTrack.lockTokens = lockTokens.bind(balanceTrack)

        balanceTracker = balanceTrack
        crossChainExecutor = new CrossChainExecutor('http://solver-api-url', redisClient as unknown as RedisClientType);
    });

    it('should execute a valid cross-chain transfer', async () => {
        // Mock solver API response
        const post = jest.fn().mockImplementation(() => {
            return { data: { status: 'success', txHash: 'dummy-tx-hash' } }
        })
        axios.post = post.bind(axios)
        const get = jest.fn().mockImplementation(() => {
            return { data: { status: 'done' } }
        })
        axios.get = get.bind(axios)

        const transfer: TransferObject = {
            sender: user,
            token: { address: tokenAddress, amount: 50 },
            targetChain: { chainId: 1, receiver: '0xReceiverAddress' },
            refund: { chainId: 1, tx: { to: '0xRefundAddress', data: '0x', value: 0 }, signedTx: '0x' },
            signature: await ethers.Wallet.createRandom().signMessage('dummy-message'),
        };

        // Mock balance update
        await balanceTracker.updateUserBalance(user, tokenAddress, 100);

        await crossChainExecutor.executeTransfer(transfer);

        // Check that tokens were locked during the execution
        const finalBalance = await balanceTracker.getUserBalance(user, tokenAddress);
        expect(finalBalance).toBe(50); // After lock, remaining balance is 50

        // Ensure the refund logic was invoked
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('refund'), expect.objectContaining({ to: '0xRefundAddress' }));
    });

    it('should throw an error if solver request fails', async () => {
        // Mock solver API failure response
        const post = jest.fn().mockImplementation(() => {
            return { data: { status: 'failed' } }
        })
        axios.post = post.bind(axios)
        const transfer: TransferObject = {
            sender: user,
            token: { address: tokenAddress, amount: 50 },
            targetChain: { chainId: 1, receiver: '0xReceiverAddress' },
            refund: { chainId: 1, tx: { to: '0xRefundAddress', data: '0x', value: 0 }, signedTx: '0x' },
            signature: await ethers.Wallet.createRandom().signMessage('dummy-message'),
        };

        await expect(crossChainExecutor.executeTransfer(transfer)).rejects.toThrow('Solver request failed');
    });

    it('should handle insufficient balance during transfer execution', async () => {
        await balanceTracker.updateUserBalance(user, tokenAddress, 20); // Only 20 tokens available

        const transfer: TransferObject = {
            sender: user,
            token: { address: tokenAddress, amount: 50 }, // Request for 50 tokens
            targetChain: { chainId: 1, receiver: '0xReceiverAddress' },
            refund: { chainId: 1, tx: { to: '0xRefundAddress', data: '0x', value: 0 }, signedTx: '0x' },
            signature: await ethers.Wallet.createRandom().signMessage('dummy-message'),
        };

        await expect(crossChainExecutor.executeTransfer(transfer)).rejects.toThrow('Insufficient balance');
    });
});
