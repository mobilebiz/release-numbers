# 不要な電話番号の一括削除

このプログラムを使うことで、自分の持っているアカウント（サブアカウントを含む）の中の不要と思われる電話番号を一括で削除することができます。  
削除の条件は、過去数ヶ月（指定ができます。デフォルトは３ヶ月）間に発着信の利用がなかった番号となります。  
米国番号については、メッセージの送信がなかったものを対象とします。

## 前提（動作確認済み）条件

- Node.js バージョン 16.13以上
- npm 8.1.0以上

## セットアップ

```zsh
git clone https://github.com/mobilebiz/release-numbers.git
cd release-numbers
yarn install # or npm install
```

## 環境変数の設定

```zsh
cp .env.example .env
```

`.env`を以下の内容で更新してください。

Key|Value
:--|:--
TWILIO_ACCOUNT_SID|対象とするマスターアカウントのAccountSid
TWILIO_AUTH_TOKEN|同じくAuthToken
SINCE_MONTHS|何ヶ月前から利用されていない番号を検索の対象とするか

## 実行

```zsh
node index.js [delete]
```

`delete`パラメータを付与した場合は、実際に削除が行われます。付与していない場合は、削除はしないで対象となる番号が表示されます。

## 実行例

```sh
*** Proxy(active) ***
call: +19095527889 0件（in:0, out:0）
message: +19095527889 0件
delete: +19095527889
call: +815031964003 0件（in:0, out:0）
delete: +815031964003
call: +815031964002 0件（in:0, out:0）
delete: +815031964002
call: +815031964004 0件（in:0, out:0）
delete: +815031964004
*** TaskRouter(active) ***
*** CallCenterVerification(suspended) ***
Error: Unable to update Status for subaccount, subaccount has been suspended by Twilio.
*** line_developer(active) ***
call: +81503186**** 1件（in:1, out:0）
call: +12059004533 0件（in:0, out:0）
message: +12059004533 0件
delete: +12059004533
```

## 制限事項

サブアカウントが`suspended`になっている場合、一度ステータスを変更してから処理を行いますが、TwilioによってサスペンドされているサブアカウントについてはAPI経由での変更ができないため、スキップするようになっています。
