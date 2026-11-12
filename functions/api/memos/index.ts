import { memoInputSchema } from '../../../shared/memo'
import { type Env, type MemoRow, json, toMemo, validationError } from '../../../server/db'

// 一覧
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM memos ORDER BY date DESC, id DESC',
  ).all<MemoRow>()
  return json(results.map(toMemo))
}

// 登録
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const parsed = memoInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)

  const m = parsed.data
  const row = await env.DB.prepare(
    `INSERT INTO memos (date, flag, content, url, review_date, status)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
  )
    .bind(m.date, m.flag, m.content, m.url, m.reviewDate, m.status)
    .first<MemoRow>()
  return json(toMemo(row!), 201)
}
