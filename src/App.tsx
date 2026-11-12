import { useEffect, useMemo, useState } from 'react'
import { FLAG_LABEL, type Memo, type MemoInput, STATUS_LABEL } from '../shared/memo'
import { api } from './api'
import { formatDate, today } from './date'
import { MemoForm } from './MemoForm'

type FlagFilter = 'all' | Memo['flag']
type StatusFilter = 'all' | Memo['status']

// 未確認のまま振返日を迎えたもの
const isDue = (m: Memo, now: string) => m.status === 'unconfirmed' && m.reviewDate !== '' && m.reviewDate <= now

export default function App() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flag, setFlag] = useState<FlagFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('unconfirmed')
  const [keyword, setKeyword] = useState('')
  const [editing, setEditing] = useState<Memo | 'new' | null>(null)

  useEffect(() => {
    api
      .list()
      .then(setMemos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const now = today()
  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return memos
      .filter((m) => flag === 'all' || m.flag === flag)
      .filter((m) => status === 'all' || m.status === status)
      .filter((m) => !kw || m.content.toLowerCase().includes(kw) || m.url.toLowerCase().includes(kw))
      // 振り返りが必要なものを先頭に、それ以外は新しい順
      .sort((a, b) => Number(isDue(b, now)) - Number(isDue(a, now)) || b.date.localeCompare(a.date) || b.id - a.id)
  }, [memos, flag, status, keyword, now])
  const dueCount = memos.filter((m) => isDue(m, now)).length

  async function save(input: MemoInput) {
    if (editing === 'new') {
      const created = await api.create(input)
      setMemos((list) => [created, ...list])
    } else if (editing) {
      const updated = await api.update(editing.id, input)
      setMemos((list) => list.map((m) => (m.id === updated.id ? updated : m)))
    }
    setEditing(null)
  }

  async function remove(memo: Memo) {
    if (!confirm('この備忘録を削除します。よろしいですか？')) return
    try {
      await api.remove(memo.id)
      setMemos((list) => list.filter((m) => m.id !== memo.id))
      setEditing(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : '削除に失敗しました')
    }
  }

  // 一覧から直接「確認済」に切り替える
  async function toggleStatus(memo: Memo) {
    const { id: _id, updatedAt: _u, ...input } = memo
    try {
      const updated = await api.update(memo.id, {
        ...input,
        status: memo.status === 'confirmed' ? 'unconfirmed' : 'confirmed',
      })
      setMemos((list) => list.map((m) => (m.id === updated.id ? updated : m)))
    } catch (e) {
      alert(e instanceof Error ? e.message : '更新に失敗しました')
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <h1 className="text-lg font-bold">備忘録</h1>
          {dueCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800">
              振り返り {dueCount} 件
            </span>
          )}
          <button
            onClick={() => setEditing('new')}
            className="ml-auto hidden rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 sm:block"
          >
            ＋ 新規登録
          </button>
        </div>

        <div className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 pb-3">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="内容・URL で検索"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base sm:w-64"
          />
          <Select value={flag} onChange={(v) => setFlag(v as FlagFilter)} label="フラグ">
            <option value="all">すべてのフラグ</option>
            <option value="business">{FLAG_LABEL.business}</option>
            <option value="private">{FLAG_LABEL.private}</option>
          </Select>
          <Select value={status} onChange={(v) => setStatus(v as StatusFilter)} label="ステータス">
            <option value="all">すべてのステータス</option>
            <option value="unconfirmed">{STATUS_LABEL.unconfirmed}</option>
            <option value="confirmed">{STATUS_LABEL.confirmed}</option>
          </Select>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 pb-28 sm:pb-8">
        {loading && <p className="py-10 text-center text-slate-500">読み込み中…</p>}
        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-rose-700">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="py-10 text-center text-slate-500">該当する備忘録はありません</p>
        )}

        {visible.length > 0 && (
          <>
            {/* スマホ：カード表示 */}
            <ul className="space-y-3 sm:hidden">
              {visible.map((m) => (
                <li key={m.id}>
                  <MemoCard memo={m} due={isDue(m, now)} onOpen={() => setEditing(m)} onToggle={() => toggleStatus(m)} />
                </li>
              ))}
            </ul>

            {/* PC：表形式 */}
            <table className="hidden w-full overflow-hidden rounded-xl bg-white text-sm shadow-sm sm:table">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="w-28 px-3 py-2 font-medium">いつ</th>
                  <th className="w-28 px-3 py-2 font-medium">フラグ</th>
                  <th className="px-3 py-2 font-medium">内容</th>
                  <th className="w-28 px-3 py-2 font-medium">確認日</th>
                  <th className="w-28 px-3 py-2 font-medium">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setEditing(m)}
                    className={`cursor-pointer border-t border-slate-100 hover:bg-indigo-50/50 ${isDue(m, now) ? 'bg-amber-50' : ''}`}
                  >
                    <td className="px-3 py-2 align-top whitespace-nowrap">{formatDate(m.date)}</td>
                    <td className="px-3 py-2 align-top"><FlagBadge flag={m.flag} /></td>
                    <td className="px-3 py-2 align-top">
                      <p className="line-clamp-2 whitespace-pre-wrap">{m.content}</p>
                      {m.url && <MemoLink url={m.url} />}
                    </td>
                    <td className={`px-3 py-2 align-top whitespace-nowrap ${isDue(m, now) ? 'font-bold text-amber-700' : ''}`}>
                      {formatDate(m.reviewDate)}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <StatusButton status={m.status} onClick={() => toggleStatus(m)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>

      {/* スマホ：画面下の登録ボタン */}
      <button
        onClick={() => setEditing('new')}
        className="fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-3xl text-white shadow-lg sm:hidden"
        aria-label="新規登録"
      >
        ＋
      </button>

      {editing && (
        <MemoForm
          memo={editing === 'new' ? null : editing}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function MemoCard({ memo, due, onOpen, onToggle }: { memo: Memo; due: boolean; onOpen: () => void; onToggle: () => void }) {
  return (
    <div
      onClick={onOpen}
      className={`rounded-xl border bg-white p-4 shadow-sm active:bg-slate-50 ${due ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
    >
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="text-slate-500">{formatDate(memo.date)}</span>
        <FlagBadge flag={memo.flag} />
        <span className="ml-auto">
          <StatusButton status={memo.status} onClick={onToggle} />
        </span>
      </div>
      <p className="line-clamp-3 whitespace-pre-wrap">{memo.content}</p>
      {memo.url && <MemoLink url={memo.url} />}
      {memo.reviewDate && (
        <p className={`mt-2 text-sm ${due ? 'font-bold text-amber-700' : 'text-slate-500'}`}>
          確認日 {formatDate(memo.reviewDate)}{due && '（振り返り）'}
        </p>
      )}
    </div>
  )
}

function FlagBadge({ flag }: { flag: Memo['flag'] }) {
  const color = flag === 'business' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{FLAG_LABEL[flag]}</span>
}

function StatusButton({ status, onClick }: { status: Memo['status']; onClick: () => void }) {
  const confirmed = status === 'confirmed'
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title="クリックで切り替え"
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        confirmed ? 'border-slate-200 bg-slate-100 text-slate-500' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
      }`}
    >
      {confirmed ? '✓ ' : ''}{STATUS_LABEL[status]}
    </button>
  )
}

function MemoLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="mt-1 block truncate text-sm text-indigo-600 underline"
    >
      {url}
    </a>
  )
}

function Select({ value, onChange, label, children }: { value: string; onChange: (v: string) => void; label: string; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:flex-none"
    >
      {children}
    </select>
  )
}
