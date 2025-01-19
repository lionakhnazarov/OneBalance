import * as Redis from 'redis';
import { UserBalance, Address } from "./types";

export class BalanceTracker {
    private inMemoryStore: Map<string, UserBalance> = new Map();
    private redisClient: Redis.RedisClientType;

    constructor(redisClient: any) {
        this.redisClient = redisClient;
    }

    async getUserBalance(user: Address, tokenAddress: Address): Promise<number> {
        const key = `${user}:${tokenAddress}`;
        const cachedBalance = await this.redisClient.get(key);

        if (cachedBalance !== null) {
            return parseInt(cachedBalance, 10);
        }

        return this.inMemoryStore.get(user)?.[tokenAddress] ?? 0;
    }

    async updateUserBalance(user: Address, tokenAddress: Address, amount: number): Promise<void> {
        const key = `${user}:${tokenAddress}`;

        // Update in-memory store
        if (!this.inMemoryStore.has(user)) {
            this.inMemoryStore.set(user, {});
        }

        this.inMemoryStore.get(user)![tokenAddress] = amount;

        // Update Redis for persistence
        await this.redisClient.set(key, amount.toString());
    }

    // Lock tokens in memory and redis
    async lockTokens(user: Address, tokenAddress: Address, amount: number): Promise<void> {
        const currentBalance = await this.getUserBalance(user, tokenAddress);

        if (currentBalance < amount) {
            throw new Error("Insufficient balance");
        }

        await this.updateUserBalance(user, tokenAddress, currentBalance - amount);
    }

    // Unlock tokens
    async unlockTokens(user: Address, tokenAddress: Address, amount: number): Promise<void> {
        const currentBalance = await this.getUserBalance(user, tokenAddress);
        await this.updateUserBalance(user, tokenAddress, currentBalance + amount);
    }
}
