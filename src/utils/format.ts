import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) {
    return 'Never'
  }
  return dayjs(lastSeen).fromNow()
}
