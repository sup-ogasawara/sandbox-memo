// サイト全体に Basic 認証をかける
// 認証情報は環境変数（BASIC_AUTH_USER / BASIC_AUTH_PASS）から読み、コードには書かない
interface Env {
  BASIC_AUTH_USER?: string
  BASIC_AUTH_PASS?: string
}

// 文字列を比較にかかる時間が内容で変わらないように比べる
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const x = enc.encode(a)
  const y = enc.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  }
  return diff === 0
}

function unauthorized(): Response {
  return new Response('認証が必要です', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="memo", charset="UTF-8"' },
  })
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { BASIC_AUTH_USER: user, BASIC_AUTH_PASS: pass } = context.env
  // 設定漏れのまま公開されないよう、未設定なら閉じる
  if (!user || !pass) {
    return new Response('認証の設定がありません', { status: 500 })
  }

  const header = context.request.headers.get('Authorization') ?? ''
  if (!header.startsWith('Basic ')) return unauthorized()

  let decoded = ''
  try {
    decoded = new TextDecoder().decode(
      Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0)),
    )
  } catch {
    return unauthorized()
  }
  const sep = decoded.indexOf(':')
  const okUser = safeEqual(decoded.slice(0, sep), user)
  const okPass = safeEqual(decoded.slice(sep + 1), pass)
  if (sep < 0 || !okUser || !okPass) return unauthorized()

  const res = await context.next()
  // 検索エンジンに載せない
  const headers = new Headers(res.headers)
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}
