export const CLASS_ICON_MAP: Record<string, string> = {
  iot: 'mdi-access-point',
  ai: 'mdi-robot-outline',
  blockchain: 'mdi-link-variant',
}

export const CLASS_COLOR_MAP: Record<string, string> = {
  iot: 'info',
  ai: 'secondary',
  blockchain: 'primary',
}

export const DEFAULT_CLASS_ICON = 'mdi-book-open-variant'
export const DEFAULT_CLASS_COLOR = 'primary'

export function getClassTheme(subjectName: string): { icon: string; color: string } {
  const lower = subjectName.toLowerCase()
  for (const [keyword, icon] of Object.entries(CLASS_ICON_MAP)) {
    if (lower.includes(keyword)) {
      return { icon, color: CLASS_COLOR_MAP[keyword] ?? DEFAULT_CLASS_COLOR }
    }
  }
  return { icon: DEFAULT_CLASS_ICON, color: DEFAULT_CLASS_COLOR }
}
