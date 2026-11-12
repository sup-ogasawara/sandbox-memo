-- 動作確認用のダミーデータ（実在の人物・会社・案件は含めない）
INSERT INTO memos (date, flag, content, url, review_date, status) VALUES
  ('2026-11-05', 'business', '勉強会で聞いた「指示は ゴール→前提→出力 の順」を次の依頼で試す', '', '2026-11-12', 'unconfirmed'),
  ('2026-11-08', 'private', '週末に読む本の候補をまとめる', 'https://example.com/books', '2026-11-20', 'unconfirmed'),
  ('2026-11-10', 'business', 'テスト用の架空データを AI に生成させる手順をメモ化', '', '2026-11-10', 'confirmed');
