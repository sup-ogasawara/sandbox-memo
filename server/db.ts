import type { Memo } from '../shared/memo'

export interface Env {
  DB: D1Database
}

// DB の 1 行（列名はスネークケース）
export interface MemoRow {
  id: number
  date: string
  flag: Memo['flag']
  content: string
  url: string
  review_date: string
  status: Memo['status']
  updated_at: string
}

export function toMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    date: row.date,
    flag: row.flag,
    content: row.content,
    url: row.url,
    reviewDate: row.review_date,
    status: row.status,
    updatedAt: row.updated_at,
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

// zod のエラーを「項目名 → メッセージ」の形にそろえる
export function validationError(issues: { path: PropertyKey[]; message: string }[]): Response {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '_')
    errors[key] ??= issue.message
  }
  return json({ errors }, 400)
}
