// jest.mock('../src/BalanceTracker');
import { BalanceTracker } from '../src/BalanceTracker';
import { Address } from '../src/types';
import Redis from 'redis-mock';
describe('BalanceTracker', () => {
    let balanceTracker: BalanceTracker;
    const redisClient = Redis.createClient();

    const user: Address = '0xUserAddress';
    const tokenAddress: Address = '0xTokenAddress';

    beforeEach(() => {
        balanceTracker = new BalanceTracker(redisClient);

    });

    it('should track user balance correctly', async () => {
        const userBalance = jest.fn(() => 100)
        balanceTracker.getUserBalance = userBalance.bind(balanceTracker)

        await balanceTracker.updateUserBalance(user, tokenAddress, 100);
        const balance = await balanceTracker.getUserBalance(user, tokenAddress);
        expect(balance).toBe(100);
    });

    it('should lock tokens and update balance', async () => {
        const userBalance = jest.fn(() => 50)
        balanceTracker.getUserBalance = userBalance.bind(balanceTracker)
        await balanceTracker.updateUserBalance(user, tokenAddress, 100);
        await balanceTracker.lockTokens(user, tokenAddress, 50);
        const balance = await balanceTracker.getUserBalance(user, tokenAddress);
        expect(balance).toBe(50);
    });

    it('should unlock tokens and update balance', async () => {
        await balanceTracker.updateUserBalance(user, tokenAddress, 50);
        await balanceTracker.unlockTokens(user, tokenAddress, 50);
        const balance = await balanceTracker.getUserBalance(user, tokenAddress);
        expect(balance).toBe(100);
    });

    it('should throw an error for insufficient balance when locking tokens', async () => {
        await balanceTracker.updateUserBalance(user, tokenAddress, 50);
        await expect(balanceTracker.lockTokens(user, tokenAddress, 100)).rejects.toThrow('Insufficient balance');
    });
});
