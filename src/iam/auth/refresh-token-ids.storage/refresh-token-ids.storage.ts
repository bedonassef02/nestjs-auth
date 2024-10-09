import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from "@nestjs/common";
import Redis from "ioredis";

export class IvalidatedRefreshTokenError extends Error{

}

@Injectable()
export class RefreshTokenIdsStorage implements OnApplicationBootstrap, OnApplicationShutdown {
    // TODO: we should move this into redis module
    private redisClient: Redis;
    onApplicationBootstrap() {
        this.redisClient = new Redis({
            host: 'localhost',
            port: 6379
        });
    }

    onApplicationShutdown(signal?: string) {
        if (this.redisClient) {
            return this.redisClient.quit();
        }
    }


    async insert(userId: number, tokenId: string): Promise<void> {
        await this.redisClient.set(this.getKey(userId), tokenId);
    }
    async validate(userId: number, tokenId: string): Promise<boolean> {
        const storedId = await this.redisClient.get(this.getKey(userId));
        if(storedId !== tokenId){
            throw new IvalidatedRefreshTokenError()
        }
        return storedId === tokenId;
    }
    async invalidate(userId: number): Promise<void> {
        await this.redisClient.del(this.getKey(userId));
    }
    private getKey(userId: number): string {
        return `user-${userId}`;
    }

}
