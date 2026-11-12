import { memoInputSchema } from '../../../shared/memo'
import { type Env, type MemoRow, json, toMemo, validationError } from '../../../server/db'

function parseId(raw: string | string[]): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

// 更新
export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = parseId(params.id)
  if (id === null) return json({ error: 'ID が正しくありません' }, 400)

  const parsed = memoInputSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return validationError(parsed.error.issues)

  const m = parsed.data
  const row = await env.DB.prepare(
    `UPDATE memos
        SET date = ?, flag = ?, content = ?, url = ?, review_date = ?, status = ?,
            updated_at = datetime('now')
      WHERE id = ? RETURNING *`,
  )
    .bind(m.date, m.flag, m.content, m.url, m.reviewDate, m.status, id)
    .first<MemoRow>()
  if (!row) return json({ error: '見つかりません' }, 404)
  return json(toMemo(row))
}

// 削除
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = parseId(params.id)
  if (id === null) return json({ error: 'ID が正しくありません' }, 400)

  const result = await env.DB.prepare('DELETE FROM memos WHERE id = ?').bind(id).run()
  if (result.meta.changes === 0) return json({ error: '見つかりません' }, 404)
  return new Response(null, { status: 204 })
}
