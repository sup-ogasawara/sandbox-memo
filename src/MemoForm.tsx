import { useState } from 'react'
import {
  FLAGS,
  FLAG_LABEL,
  type Memo,
  type MemoInput,
  STATUSES,
  STATUS_LABEL,
  memoInputSchema,
} from '../shared/memo'
import { ValidationError } from './api'
import { today } from './date'
import { useSpeech } from './useSpeech'

interface Props {
  memo: Memo | null // null のときは新規登録
  onSave: (input: MemoInput) => Promise<void>
  onDelete: (memo: Memo) => Promise<void>
  onClose: () => void
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

export function MemoForm({ memo, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<MemoInput>(
    memo
      ? { date: memo.date, flag: memo.flag, content: memo.content, url: memo.url, reviewDate: memo.reviewDate, status: memo.status }
      : { date: today(), flag: 'business', content: '', url: '', reviewDate: '', status: 'unconfirmed' },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof MemoInput>(key: K, value: MemoInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // 音声で確定した文字を内容の末尾に足す
  const speech = useSpeech((text) =>
    setForm((f) => ({ ...f, content: f.content ? `${f.content}\n${text}` : text })),
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    speech.stop()
    const parsed = memoInputSchema.safeParse(form)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message
      setErrors(next)
      return
    }
    setSaving(true)
    try {
      await onSave(parsed.data)
    } catch (err) {
      if (err instanceof ValidationError) setErrors(err.errors)
      else setErrors({ _: err instanceof Error ? err.message : '保存に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-bold">{memo ? '備忘録を編集' : '備忘録を登録'}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-2xl leading-none text-slate-500 hover:bg-slate-100" aria-label="閉じる">
            ×
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="いつ" error={errors.date}>
              <input type="date" className={inputClass} value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label="確認日（振返日）" error={errors.reviewDate}>
              <input type="date" className={inputClass} value={form.reviewDate} onChange={(e) => set('reviewDate', e.target.value)} />
            </Field>
          </div>

          <Field label="フラグ" error={errors.flag} group>
            <Segmented options={FLAGS} labels={FLAG_LABEL} value={form.flag} onChange={(v) => set('flag', v)} />
          </Field>

          <Field label="内容" error={errors.content} group>
            <textarea
              aria-label="内容"
              rows={6}
              className={inputClass}
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder="手で入力するか、下のマイクボタンで話してください"
            />
            {speech.interim && <p className="mt-1 text-sm text-slate-500">認識中：{speech.interim}</p>}
            {speech.supported ? (
              <button
                type="button"
                onClick={speech.listening ? speech.stop : speech.start}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium sm:w-auto ${
                  speech.listening ? 'animate-pulse bg-rose-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span aria-hidden>{speech.listening ? '■' : '🎤'}</span>
                {speech.listening ? '録音を止める' : '音声で入力'}
              </button>
            ) : (
              <p className="mt-1 text-sm text-slate-500">このブラウザは音声入力に対応していません（Chrome か Safari で使えます）</p>
            )}
            {speech.error && <p className="mt-1 text-sm text-rose-600">{speech.error}</p>}
          </Field>

          <Field label="URL" error={errors.url}>
            <input type="url" inputMode="url" className={inputClass} value={form.url} onChange={(e) => set('url', e.target.value.trim())} placeholder="https://" />
          </Field>

          <Field label="ステータス" error={errors.status} group>
            <Segmented options={STATUSES} labels={STATUS_LABEL} value={form.status} onChange={(v) => set('status', v)} />
          </Field>

          {errors._ && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{errors._}</p>}
        </div>

        <footer className="flex items-center gap-2 border-t border-slate-200 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {memo && (
            <button
              type="button"
              onClick={() => onDelete(memo)}
              className="rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50"
            >
              削除
            </button>
          )}
          <button type="button" onClick={onClose} className="ml-auto rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">
            キャンセル
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '保存中…' : '保存'}
          </button>
        </footer>
      </form>
    </div>
  )
}

// ボタンを含む項目は label で囲むと見出しのクリックでボタンが押されるため div にする
function Field({ label, error, group, children }: { label: string; error?: string; group?: boolean; children: React.ReactNode }) {
  const Tag = group ? 'div' : 'label'
  return (
    <Tag className="block" {...(group ? { role: 'group', 'aria-label': label } : {})}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-rose-600">{error}</span>}
    </Tag>
  )
}

function Segmented<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[]
  labels: Record<T, string>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            value === o ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  )
}
