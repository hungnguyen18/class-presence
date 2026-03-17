import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables',
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function invokeEdgeFunction<TResponse>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<{ data: TResponse | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(functionName, { body })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as TResponse, error: null }
}
