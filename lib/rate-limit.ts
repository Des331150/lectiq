import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const authLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 m"), prefix: "ratelimit:auth" });
const uploadLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "ratelimit:upload" });
const apiLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"), prefix: "ratelimit:api" });

type LimitType = "auth" | "upload" | "api";

export async function checkRateLimit(type: LimitType, identifier: string): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const limiters = { auth: authLimiter, upload: uploadLimiter, api: apiLimiter };
  const limiter = limiters[type];
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { allowed: success, remaining, reset };
}
