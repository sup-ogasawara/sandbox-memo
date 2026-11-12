# 備忘録（sandbox-memo）

思いついたこと・あとで見返したいことを残す備忘録アプリです。
PC とスマートフォンのどちらからでも、同じデータを見て・登録して・直せます。

AI ワークショップの宿題（レベル 2）として作成しました。**データはすべてダミーです。**

## できること

- 備忘録の一覧・登録・編集・削除
- 内容は手入力のほか、🎤 ボタンで音声から文字起こしして入力できる
- フラグ（ビジネス／プライベート）・ステータス（未確認／確認済）での絞り込みと、キーワード検索
- 確認日（振返日）を迎えた未確認のものを一覧の先頭に強調表示
- 一覧のステータスをクリックすると、その場で未確認 ⇔ 確認済を切り替え

## 管理項目

| 項目 | 型 | 必須 | 備考 |
| --- | --- | --- | --- |
| いつ | 日付 | ○ | 新規登録時は今日 |
| フラグ | 選択 | ○ | ビジネス／プライベート |
| 内容 | テキスト | ○ | 5000 文字まで |
| URL | テキスト | | http:// か https:// のみ |
| 確認日（振返日） | 日付 | | |
| ステータス | 選択 | ○ | 未確認／確認済 |

## 使い方

1. 公開 URL を開き、ID とパスワードを入れる（Basic 認証）
2. 右上の「＋ 新規登録」（スマホは右下の ＋）から登録する
3. 音声で入力するときは「🎤 音声で入力」を押して話し、終わったら「録音を止める」

> 音声入力はブラウザの音声認識を使います。Chrome（PC・Android）と Safari（iPhone）で動き、Firefox では使えません。
> 話した音声は Google / Apple のサーバーに送られて文字になるため、機密情報は声で入れないでください。

## 構成

| 役割 | 技術 |
| --- | --- |
| 画面 | React + TypeScript + Vite + Tailwind CSS |
| 入力チェック | zod（画面と API で同じルールを共有：`shared/memo.ts`） |
| API | Cloudflare Pages Functions（`functions/`） |
| データベース | Cloudflare D1（`schema.sql`） |
| 認証 | Basic 認証（`functions/_middleware.ts`。ID・パスワードは環境変数） |
| パッケージ管理 | pnpm |

## 手元で動かす

```bash
pnpm install
pnpm db:init:local      # 手元の D1 にテーブルを作る
pnpm db:seed:local      # ダミーデータを入れる（任意）
```

`.dev.vars` を作って、手元用の ID とパスワードを書きます（Git には記録されません）。

```
BASIC_AUTH_USER=demo
BASIC_AUTH_PASS=（任意の文字列）
```

```bash
pnpm preview            # ビルドして http://localhost:8788 で起動
```

画面を直しながら確認したいときは、ターミナルを 2 つ使います。

```bash
pnpm dev:api            # API（http://localhost:8788）
pnpm dev                # 画面（http://localhost:5173。/api は 8788 に転送）
```

## 公開（Cloudflare Pages）

1. `wrangler d1 create sandbox-memo` で D1 を作り、表示された ID を `wrangler.toml` の `database_id` に入れる
2. `pnpm db:init:remote` で本番の D1 にテーブルを作る
3. Pages プロジェクトの環境変数に `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` を登録する
4. `pnpm deploy`

検索エンジンに載らないよう、`robots.txt`・`<meta name="robots">`・`X-Robots-Tag` で noindex にしています。

## AI にどう頼んだか

Claude Code（VSCode 拡張）に、次の順で依頼しました。

1. ワークショップ資料を読ませ、宿題でやることを整理させた
2. 管理項目と「PC とスマホで使う」「音声入力したい」を伝え、設計案と確認事項を出させた
3. 確認事項（データ共有の有無、時刻の要否、ステータスの種類など）に答えてから実装させた
4. 認証・登録・更新・削除・入力チェックを curl で、画面を PC 幅とスマホ幅のスクリーンショットで確認させた

<!-- ここに自分の言葉で 3 行足す（宿題の要件） -->
