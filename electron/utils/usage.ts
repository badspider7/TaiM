export interface UsageRecord {
  name: string
  file: string
  iconFile: string
  actionDes: string
  startTime: string
  duration: number
}

export function localTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// Split at local hour boundaries so midnight and multi-hour sessions stay in the correct buckets.
export function splitInterval(start: number, end: number) {
  const segments: { startTime: string, duration: number }[] = []
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return segments
  while (start < end) {
    const boundary = new Date(start)
    boundary.setMinutes(60, 0, 0)
    const next = Math.min(end, boundary.getTime())
    segments.push({ startTime: `${localTime(new Date(start)).slice(0, 13)}:00:00`, duration: (next - start) / 1000 })
    start = next
  }
  return segments
}
