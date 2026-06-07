import { redis } from '@/lib/redis'

export async function invalidateMoneyCache(userId: string) {
  const patterns = ['accounts', 'transactions', 'categories', 'goals', 'ledger', 'bills', 'reminders']
  for (const pattern of patterns) {
    const keys = await redis.keys(`${pattern}:${userId}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}
