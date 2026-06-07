import { Redis } from '@upstash/redis'

/**
 * Initializes the Upstash Redis client.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to be set in environment variables.
 * 
 * You can create a free Redis database at https://console.upstash.com
 */
export const redis = Redis.fromEnv()
