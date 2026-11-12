// 端末のタイムゾーンでの今日（YYYY-MM-DD）
export function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 2026-11-12 → 2026/11/12
export function formatDate(value: string): string {
  return value ? value.replaceAll('-', '/') : '—'
}
