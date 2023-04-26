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
            // ユーザーからのテキストメッセージが「新規予約」だった場合のみ反応。
            if (event.message.text == "新規予約"){
                //データを取りだす
                const bufferData = fs.readFileSync('yoyaku.json')
                // データを文字列に変換
                const dataJSON = bufferData.toString()
                //JSONのデータをJavascriptのオブジェクトに
                const data = JSON.parse(dataJSON)

                const query_event_base = {
                    text: "SELECT *" +
                          "  FROM m_event_base t1 " +
                          " WHERE current_date BETWEEN t1.start_ymd AND t1.end_ymd" +
                          "    OR current_date < t1.start_ymd" +
                          " ORDER BY t1.start_ymd",
                };

                client.connect(function (err, client) {
                    if (err) {
                      console.log(err);
                    } else {
                      client
                        .query(query_event_base)
                        .then((res) => {
                            console.log(res.rows[0].event_cd);
                            const query_event = {
                                text: "SELECT *" +
                                      "  FROM m_event t1" +
                                      " INNER JOIN m_kaisaiti t2" +
                                      "    ON t1.kaisaiti_cd = t2.kaisaiti_cd" +
                                      " WHERE t1.event_cd = $1" +
                                      " ORDER BY t1.first_day",
                                values:[res.rows[0].event_cd],
                            };  
                            let event_nm = res.rows[0].event_nm

                            client.query(query_event)
                            .then((res) => {
                                console.log(res.rows.length);

                                // res.rows.forEach(function(values){
                                    
                                // })

                                data.contents = [data.contents,data.contents]
                                console.log(data.contents);
                                console.log(data.contents[0]);

                                const f_stime = new Date('2023-04-01T' + res.rows[0].first_start_time);
                                const f_etime = new Date('2023-04-01T' + res.rows[0].first_end_time);
                                const s_stime = new Date('2023-04-01T' + res.rows[0].second_start_time);
                                const s_etime = new Date('2023-04-01T' + res.rows[0].second_end_time);
                                const F_SformattedTime = f_stime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric'}); // ロケールに基づいた形式の時間に変換する
                                const F_EformattedTime = f_etime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric'});
                                const S_SformattedTime = s_stime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric'}); // ロケールに基づいた形式の時間に変換する
                                const S_EformattedTime = s_etime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric'});
                                
                                const f_date = new Date(res.rows[0].first_day);
                                const f_year = f_date.getFullYear();
                                const f_month = ('0' + (f_date.getMonth() + 1)).slice(-2);
                                const f_day = ('0' + f_date.getDate()).slice(-2);
                                const f_dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][f_date.getDay()];
                                const f_formattedDate = `${f_year}年${f_month}月${f_day}日（${f_dayOfWeek}）`;
                                const s_date = new Date(res.rows[0].second_day);
                                const s_year = s_date.getFullYear();
                                const s_month = ('0' + (s_date.getMonth() + 1)).slice(-2);
                                const s_day = ('0' + s_date.getDate()).slice(-2);
                                const s_dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][s_date.getDay()];
                                const s_formattedDate = `${s_year}年${s_month}月${s_day}日（${s_dayOfWeek}）`;

                                data.contents[0].header.contents[0].text = event_nm + '/' + res.rows[0].kaisaiti_nm + '会場';
                                data.contents[0].body.contents[0].text = res.rows[0].first_day;
                                data.contents[0].body.contents[1].text = '開催時間　' + F_SformattedTime + '～' + F_EformattedTime;
                                data.contents[0].body.contents[2].text = '場所　' + res.rows[0].place_name;
                                data.contents[0].body.contents[3].text = '　　　' + res.rows[0].place_address;
                                data.contents[1].header.contents[0].text = event_nm + '/' + res.rows[0].kaisaiti_nm + '会場';
                                data.contents[1].body.contents[0].text = res.rows[0].second_day;
                                data.contents[1].body.contents[1].text = '開催時間　' + S_SformattedTime + '～' + S_EformattedTime;
                                data.contents[1].body.contents[2].text = '場所　' + res.rows[0].place_name;
                                data.contents[1].body.contents[3].text = '　　　' + res.rows[0].place_address;

                                console.log(data.contents[0].body.contents[0].text);
                                console.log(data.contents[1].body.contents[0].text);
                                // console.log(data.contents[0].body.contents[0]);
                                // console.log(data.contents[1].body.contents[0]);
                                // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                                events_processed.push(bot.replyMessage(event.replyToken, data));
                            })
                        })
                    }
                })

            }
            else if (event.message.text == "予約確認"){
                //データを取りだす
                const bufferData = fs.readFileSync('kakunin.json')
                // データを文字列に変換
                const dataJSON = bufferData.toString()
                //JSONのデータをJavascriptのオブジェクトに
                const data = JSON.parse(dataJSON)
                console.log(data)
                //data.contents.header.contents[0].text = '鹿児島会場'
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

                let userid;
                client.connect(function (err, client) {
                    if (err) {
                      console.log(err);
                    } else {
                      client
                        .query(query)
                        .then((res) => {
                            console.log(res.rows[0].user_id);
                            userid = res.rows[0].user_id;
              
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

                        })
                        .catch((e) => {
                            console.error(e.stack);
                            let errmessage = {
                                type: "text",
                                text: "お客様情報が未登録です。"
                            };
                          events_processed.push(bot.replyMessage(event.replyToken, errmessage));
                        });
                    }
                })

                
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