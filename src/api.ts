import type { Memo, MemoInput } from '../shared/memo'

// 入力エラー（項目名 → メッセージ）
export class ValidationError extends Error {
  errors: Record<string, string>
  constructor(errors: Record<string, string>) {
    super('入力内容を確認してください')
    this.errors = errors
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}))
    if (body.errors) throw new ValidationError(body.errors)
  }
  if (!res.ok) throw new Error(`通信に失敗しました（${res.status}）`)
  return (res.status === 204 ? undefined : await res.json()) as T
}

export const api = {
  list: () => request<Memo[]>('/api/memos'),
  create: (input: MemoInput) =>
    request<Memo>('/api/memos', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: MemoInput) =>
    request<Memo>(`/api/memos/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: number) => request<void>(`/api/memos/${id}`, { method: 'DELETE' }),
}
