import { z } from 'zod'

// 画面と API で共通の入力ルール
export const FLAGS = ['business', 'private'] as const
export const STATUSES = ['unconfirmed', 'confirmed'] as const

export const FLAG_LABEL: Record<(typeof FLAGS)[number], string> = {
  business: 'ビジネス',
  private: 'プライベート',
}
export const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  unconfirmed: '未確認',
  confirmed: '確認済',
}

export const memoInputSchema = z.object({
  date: z.iso.date({ error: '「いつ」を入力してください' }),
  flag: z.enum(FLAGS, { error: 'フラグを選んでください' }),
  content: z
    .string()
    .trim()
    .min(1, { error: '内容を入力してください' })
    .max(5000, { error: '内容は 5000 文字以内にしてください' }),
  // javascript: などのリンクを防ぐため http / https のみ許可
  url: z.union([
    z.literal(''),
    z.url({ protocol: /^https?$/, error: 'URL は http:// か https:// で始めてください' }),
  ]),
  reviewDate: z.union([z.literal(''), z.iso.date({ error: '確認日の形式が正しくありません' })]),
  status: z.enum(STATUSES),
})

export type MemoInput = z.infer<typeof memoInputSchema>
export type Memo = MemoInput & { id: number; updatedAt: string }
