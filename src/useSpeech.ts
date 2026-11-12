import { useEffect, useRef, useState } from 'react'

// ブラウザ標準の音声認識（Chrome / Safari は webkit 接頭辞付き）
// 型定義が標準に無いため、使う部分だけ最小限で定義する
interface RecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type RecognitionCtor = new () => Recognition

const Ctor: RecognitionCtor | undefined =
  (window as unknown as { SpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition

const ERROR_MESSAGE: Record<string, string> = {
  'not-allowed': 'マイクの使用が許可されていません。ブラウザの設定を確認してください',
  'no-speech': '音声が聞き取れませんでした',
  network: '音声認識サービスに接続できませんでした',
}

/**
 * 確定した文字列を onFinal で受け取る。認識途中の文字列は interim で返す
 */
export function useSpeech(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')
  const recRef = useRef<Recognition | null>(null)
  const onFinalRef = useRef(onFinal)
  useEffect(() => {
    onFinalRef.current = onFinal
  })

  // 画面を閉じたら録音も止める
  useEffect(() => () => recRef.current?.stop(), [])

  function start() {
    if (!Ctor) return
    setError('')
    const rec = new Ctor()
    rec.lang = 'ja-JP'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let pending = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) onFinalRef.current(r[0].transcript)
        else pending += r[0].transcript
      }
      setInterim(pending)
    }
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setError(ERROR_MESSAGE[e.error] ?? `音声認識でエラーが発生しました（${e.error}）`)
    }
    rec.onend = () => {
      setListening(false)
      setInterim('')
      recRef.current = null
    }
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  function stop() {
    recRef.current?.stop()
  }

  return { supported: !!Ctor, listening, interim, error, start, stop }
}
