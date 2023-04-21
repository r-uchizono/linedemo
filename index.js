// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'; 
import { Client, middleware } from "@line/bot-sdk"; // Messaging APIのSDKをインポート
import fs from 'fs';
import pg from 'pg';
import QRCode from 'qrcode'; 
import { error } from 'console';

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
                QRCode.toDataURL('test qr code sample.', (error, url) => {
                    if (error) {
                      console.log(error);
                      console.log(url);
                      return;
                    }



                    //  const base64Str = url 
                    //     .replace("data:image/png;base64,",""); 

                    // fs.promises.writeFile("test.jpeg", base64Str, { encoding: "base64" });

                    // function Base64ToImage(base64img, callback) 
                    // {
                    //      var img = new Image(); 
                    //      img.onload = function() { 
                    //         callback(img); 
                    //     }; 
                    //     img.src = base64img; 
                    // }

                    // Base64ToImage(url, function(img) { 
                    //     console.log(img)
                    // });

                    let message = {
                        type: 'imaga',
                        originalContentUrl: 'https://www.bing.com/images/search?view=detailV2&ccid=JP9%2fF7uS&id=D1A9758696F11553964B74CD15044F78458B172E&thid=OIP.JP9_F7uSkjKqjwHjhHqXawHaDt&mediaurl=https%3a%2f%2fmedia.istockphoto.com%2fvectors%2fbusiness-stamp-illustration-sample-vector-id932071254&exph=512&expw=1024&q=%e3%82%b5%e3%83%b3%e3%83%97%e3%83%ab%e7%94%bb%e5%83%8f%e3%80%80%e7%84%a1%e6%96%99&simid=608011359214250321&FORM=IRPRST&ck=C871B98C17250A6744E4458804D3D5CF&selectedIndex=5&ajaxhist=0&ajaxserp=0',
                        previewImageUrl: 'https://www.bing.com/images/search?view=detailV2&ccid=JP9%2fF7uS&id=D1A9758696F11553964B74CD15044F78458B172E&thid=OIP.JP9_F7uSkjKqjwHjhHqXawHaDt&mediaurl=https%3a%2f%2fmedia.istockphoto.com%2fvectors%2fbusiness-stamp-illustration-sample-vector-id932071254&exph=512&expw=1024&q=%e3%82%b5%e3%83%b3%e3%83%97%e3%83%ab%e7%94%bb%e5%83%8f%e3%80%80%e7%84%a1%e6%96%99&simid=608011359214250321&FORM=IRPRST&ck=C871B98C17250A6744E4458804D3D5CF&selectedIndex=5&ajaxhist=0&ajaxserp=0'
                    }
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