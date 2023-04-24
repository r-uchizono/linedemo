// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'; 
import { Client, middleware } from "@line/bot-sdk"; // Messaging APIのSDKをインポート
import fs from 'fs';
import pg from 'pg';
import QRCode from 'qrcode'; 
import crypto from 'crypto'
import getRandomValues from 'get-random-values';
import path from 'path';

// -----------------------------------------------------------------------------
// パラメータ設定
const line_config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
    channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
};

// -----------------------------------------------------------------------------
// Webサーバー設定
const server = express();
server.listen(process.env.PORT || 3000);

// APIコールのためのクライアントインスタンスを作成
const bot = new Client(line_config);
const client = new pg.Pool({
    user: 'unis',
    host: 'dpg-cgvn4qodh87joksvpj70-a',
    database: 'event_f91d',
    password: 'gbFeZ4j0o2mXOlCdCw0qF4TMaYTkldcn',
    port: 5432
});

// -----------------------------------------------------------------------------
// ルーター設定
server.post('/bot/webhook', middleware(line_config), (req, res, next) => {
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


            else if (event.message.text == "会員ID"){                  
                const QRDir = 'test'
                //フォルダ存在チェック　pathにフォルダ情報
                if( fs.existsSync( QRDir ) ){ 
                    console.log( "存在します。"); 
                }else{ 
                    console.log( "存在しません。"); 
                    //フォルダ作成　なかったときのみ作成、あったらそのまま使用する
                    fs.mkdirSync('test');
                }

                //画像ファイル名としてランダムな文字列作成
                var S="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                var N=16

                const array = new Uint8Array(N);
                var tt = Array.from(getRandomValues(array)).map((n)=>S[n%S.length]).join('')
                console.log(getRandomValues(array));

                console.log(tt);
                const QRfile = tt

                //フォルダに保存
                QRCode.toFile(path.join(QRDir, QRfile + '.png'), 'test qr code sample.', (error) => {
                    if (error) {
                      console.log(error);
                      return;
                    }

                    if( fs.existsSync(path.join(QRDir, QRfile + '.png')) ){ 
                        console.log( "存在します。"); 
                    }else{ 
                        console.log( "存在しません。"); 
                    }

                    //ファイルのURLを生成し送信・拡張子注意
                    let message = {
                        type: "image",
                        originalContentUrl: path.join(QRDir ,QRfile + '.png'),
                        previewImageUrl: path.join(QRDir ,QRfile + '.png')
                    }
                    console.log(path.join(QRDir, QRfile + '.png'))
                    console.log(message)
                    events_processed.push(bot.replyMessage(event.replyToken, message));
                });
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