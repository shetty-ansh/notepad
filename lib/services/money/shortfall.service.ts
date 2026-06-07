import type { SupabaseClient } from '@supabase/supabase-js'

export async function resolveProvisionShortfall(accountId: string | null, userId: string, supabase: SupabaseClient): Promise<void> {
  if (!accountId) return
  const { data: account } = await supabase.from('accounts').select('balance').eq('id', accountId).eq('user_id', userId).single()
  if (!account) return

  const currentBalance = account.balance || 0

  const { data: provisions } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .eq('user_id', userId)
    .eq('type', 'provision')
    .order('created_at', { ascending: false })

  if (!provisions || provisions.length === 0) return

  const totalProvisioned = provisions.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  if (currentBalance >= totalProvisioned) return

  let shortfall = totalProvisioned - currentBalance

  for (const prov of provisions) {
    if (shortfall <= 0) break

    const currentProvAmount = prov.amount || 0
    if (currentProvAmount <= 0) continue

    const deduction = Math.min(shortfall, currentProvAmount)
    const newProvAmount = currentProvAmount - deduction

    if (newProvAmount <= 0) {
      await supabase.from('transactions').delete().eq('id', prov.id).eq('user_id', userId)
    } else {
      await supabase.from('transactions').update({ amount: newProvAmount }).eq('id', prov.id).eq('user_id', userId)
    }

    if (prov.goal_id) {
      const { data: goal } = await supabase.from('goals').select('saved_amount').eq('id', prov.goal_id).eq('user_id', userId).single()
      if (goal) {
        const newGoalSavedAmount = Math.max(0, (goal.saved_amount || 0) - deduction)
        await supabase.from('goals').update({ saved_amount: newGoalSavedAmount }).eq('id', prov.goal_id).eq('user_id', userId)
      }
    }

    shortfall -= deduction
  }
}
