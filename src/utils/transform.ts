/**
 * Converts a snake_case string to camelCase.
 */
export function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

/**
 * Recursively transforms all keys in a Supabase row (snake_case) to camelCase.
 * Handles nested objects and arrays.
 */
export function snakeToCamel<T>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => snakeToCamel(item)) as T
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    const entries = Object.entries(obj as Record<string, unknown>)
    for (let i = 0; i < entries.length; i += 1) {
      const [key, value] = entries[i]!
      const camelKey = snakeToCamelKey(key)
      result[camelKey] =
        typeof value === 'object' && value !== null ? snakeToCamel(value) : value
    }
    return result as T
  }

  return obj as T
}

/**
 * Transform a Supabase row with a joined relation (e.g., cp_rooms)
 * into a camelCase interface with a named relation field.
 */
export function transformWithRelation<T>(
  row: Record<string, unknown>,
  snakeRelationKey: string,
  camelRelationKey: string,
): T {
  const transformed = snakeToCamel<Record<string, unknown>>(row)
  const relation = snakeToCamel<unknown>(row[snakeRelationKey])
  delete transformed[snakeToCamelKey(snakeRelationKey)]
  transformed[camelRelationKey] = relation
  return transformed as T
}
