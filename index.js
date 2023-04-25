// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'; 
import { Client, middleware } from "@line/bot-sdk"; // Messaging APIのSDKをインポート
import fs from 'fs';
import pg from 'pg';
import QRCode from 'qrcode'; 
import getRandomValues from 'get-random-values';
import path from 'path';
import { fileURLToPath } from 'url';
import { error } from 'console';


// -----------------------------------------------------------------------------
// パラメータ設定
const line_config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
    channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
};

// -----------------------------------------------------------------------------
// Webサーバー設定
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageDir = path.join(__dirname, 'public');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir);
}
app.use(express.static(imageDir));

// APIコールのためのクライアントインスタンスを作成
const bot = new Client(line_config);
const client = new pg.Pool({
    user: 'unis',
    host: 'dpg-cgvn4qodh87joksvpj70-a',
    database: 'event_f91d',
    password: 'gbFeZ4j0o2mXOlCdCw0qF4TMaYTkldcn',
    port: 5432
});

app.post("/", (req, res)=> {
    app.render('index.js');
})

app.listen(process.env.PORT || 3000);

// -----------------------------------------------------------------------------
// ルーター設定
app.post('/bot/webhook', middleware(line_config), (req, res, next) => {
    // 先行してLINE側にステータスコード200でレスポンスする。
    res.sendStatus(200);

    // すべてのイベント処理のプロミスを格納する配列。
     let events_processed = [];

    req.body.events.forEach((event) => {
        // この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
        if (event.type == "message" && event.message.type == "text"){
            // ユーザーからのテキストメッセージが「こんにちは」だった場合のみ反応。
            if (event.message.text == "イベント情報"){
                //データを取りだす
                const bufferData = fs.readFileSync('yoyaku.json')
                // データを文字列に変換
                const dataJSON = bufferData.toString()
                //JSONのデータをJavascriptのオブジェクトに
                const data = JSON.parse(dataJSON)
                console.log(data)
                data.contents.header.contents[0].text = '鹿児島会場'
                // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                events_processed.push(bot.replyMessage(event.replyToken, data));
            }


            else if (event.message.text == "会員ID") {                  
                //画像ファイル名としてランダムな文字列作成
                let S="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                let array = new Uint8Array(16);
                let QRfile = Array.from(getRandomValues(array)).map((n)=>S[n%S.length]).join('')
                console.log(getRandomValues(array));

                const query = {
                    text: "SELECT user_id FROM t_yoyaku WHERE user_id = $1",
                    values:[event.source.userId],
                };

                var userid;
                client.connect(function (err, client) {
                    if (err) {
                      console.log(err);
                    } else {
                      client
                        .query(query)
                        .then((res) => {
                            console.log(res.rows[0].user_id);
                            userid = res.rows[0].user_id;
                        })
                        .catch((e) => {
                          console.error(e.stack);
                        });
                    }
                })

                console.log(userid)
              
                //フォルダに保存
                QRCode.toFile(path.join(imageDir, QRfile + '.png'), userid, (error) => {
                if (error) {
                    console.log(error);
                    return;
                }

                //ファイルのURLを生成し送信・拡張子注意
                let message = {
                    type: "image",
                    originalContentUrl: 'https://linedemo.onrender.com/'+ QRfile + '.png',
                    previewImageUrl: 'https://linedemo.onrender.com/'+ QRfile + '.png'
                }
                events_processed.push(bot.replyMessage(event.replyToken, message));
                });
                // try {
                //     fs.rmdir(imageDir, { recursive: true },(error));{
                //         if(error){
                //             console.log(error);
                //             return;
                //         }
                //     }
                //     console.log('削除しました。');
                //     } catch (error) {
                //         console.log('削除エラー');
                //     throw error;
                //     }
            }
        } else if (event.type == "postback" && event.postback.data.split('=')[0] == "event_id"){
            console.log(event.postback.params.time);
  
            // DB登録処理
            const query = {
                text: 'INSERT INTO t_yoyaku(event_id, user_id, reserve_time) VALUES($1, $2, $3)',
                values: [event.postback.data.split('=')[1], event.source.userId, event.postback.params.time],
            }

            client.connect(function (err, client) {
                if (err) {
                  console.log(err);
                } else {
                  client
                    .query(query)
                    .then(() => {
                      console.log('Data Inserted.');
                    })
                    .catch((e) => {
                      console.error(e.stack);
                    });
                }
            });

            let message = {
                type: 'text',
                text: '予約が完了しました'
            };
            events_processed.push(bot.replyMessage(event.replyToken, message));
        }
        else {
            const message = {
                type: 'text',
                text: 'Hello World!'
            };
            events_processed.push(bot.replyMessage(event.replyToken, message));
        }
    });

    // すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
    Promise.all(events_processed).then(
        (response) => {
            console.log(`${response.length} event(s) processed.`);
        }
    );
});