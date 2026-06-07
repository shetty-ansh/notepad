import { createClient } from "@/lib/supabase/server"
import { cache } from "react"

const getUserId = cache(async (): Promise<string> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? ''
})

export async function getAuthSession() {
    const supabase = await createClient()
    const userId = await getUserId()
    return { supabase, userId }

}