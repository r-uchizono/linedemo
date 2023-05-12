１．デバッグ準備（1度のみ）  
コマンドを実行
```
> npm install -g ngrok
```
プロジェクトフォルダ＞.vscode>launch.json内のLINE_ACCESS_TOKEN、LINE_CHANNEL_SECRETを環境に合わせて変更すること


２．デバッグ時
コマンドを実行
```
> ngrok http 3000

Announcing ngrok-rs: The ngrok agent as a Rust crate: https://ngrok.com/rust                                                                                                                                                                    Session Status                online                                                                                    Session Expires               1 hour, 38 minutes                                                                        Terms of Service              https://ngrok.com/tos                                                                     Version                       3.2.2                                                                                     Region                        Japan (jp)                                                                                Latency                       32ms                                                                                      Web Interface                 http://127.0.0.1:4040                                                                     Forwarding                    https://XXXXX.jp.ngrok.io -> http://localhost:3000 
```
Forwardingに記載された外部公開用URL＋/bot/webhookのURLをLINE DeveloperのWebhook URLへ設定する  
終わるときは×で閉じる  
再度立ち上げると外部公開用URLが変わるのでWebhook URLの再設定が必要