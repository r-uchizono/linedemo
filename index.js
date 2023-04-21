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
                        originalContentUrl: 'https://example.com/path?q=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAklEQVR4AewaftIAAAORSURBVO3BQY7kRgADwWRB%2F%2F9yeg8%2B8CRAUPd4x2BE%2FIOZfx1mymGmHGbKYaYcZsphphxmymGmHGbKYaYcZsphphxmymGmHGbKxUtJ%2BEkqLQlNpSXhCZWWhCdUWhJ%2Bksobh5lymCmHmXLxYSqflIQ7Ki0JTeWJJDSVT1L5pCR80mGmHGbKYaZcfFkSnlD5piTcUbmThDsqTyThCZVvOsyUw0w5zJSLXy4JTaUloancScITKv8nh5lymCmHmXLxP5OEO0loKm8koan8ZoeZcpgph5ly8WUqP0nlThJaEu6o3EnCGyp%2Fk8NMOcyUw0y5%2BLAk%2FE2S0FRaEppKS0JTeSMJf7PDTDnMlMNMuXhJ5TdTeSIJTeWOym9ymCmHmXKYKRcvJaGpPJGEptKS8EQSmsqdJDSVN5LwSSp3ktBU3jjMlMNMOcyUi5dUWhLuqDSVloSm8kQS7iShqbyRhKbyRBKayp0kNJVPOsyUw0w5zJSLL1NpSbij0pJwR6WptCQ0lZaEN1TuJOGTVL7pMFMOM%2BUwU%2BIfvJCEJ1RaEu6o3ElCU7mThKbyRBLuqLQkNJUnktBUvukwUw4z5TBT4h98URKeUGlJuKPyRBKaSkvCHZU7SXhCpSXhDZU3DjPlMFMOM%2BXipSQ0lSdUWhKaSkvCnSTcUWlJaCotCS0Jd1SeSMIdlZ90mCmHmXKYKfEPflAS7qi0JDSVJ5LwTSqflIQ7Kt90mCmHmXKYKRc%2FTKUl4Y7KnSS8odKS0FTuJOGOyicloal80mGmHGbKYaZcvJSEN1TuJKGpNJU3kvBNSXhCpSXhThKayhuHmXKYKYeZEv%2FgF0vCEyp3kvCGyhNJaCp3ktBUPukwUw4z5TBTLl5Kwk9SuaPyhsoTSbiThKZyJwl3VL7pMFMOM%2BUwUy4%2BTOWTknBHpSXhjkpLQlNpSWgqT6g8odKS0JLQVD7pMFMOM%2BUwUy6%2BLAlPqDyRhDsqLQlNpSXhjSS8kYQnktBU3jjMlMNMOcyUi19OpSXhjkpLQlN5QqUl4QmVJ5LwTYeZcpgph5ly8T%2Bj0pLwRBK%2BSeWJJNxR%2BaTDTDnMlMNMufgylf%2BSSktCU2lJaCotCU3ljSQ0lf%2FSYaYcZsphplx8WBJ%2BUhKeUGlJeELlThLeSMITSWgqbxxmymGmHGZK%2FIOZfx1mymGmHGbKYaYcZsphphxmymGmHGbKYaYcZsphphxmymGmHGbKP%2BJIjRuoZK%2FEAAAAAElFTkSuQmCC',
                        previewImageUrl: 'https://example.com/path?q=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAklEQVR4AewaftIAAAORSURBVO3BQY7kRgADwWRB%2F%2F9yeg8%2B8CRAUPd4x2BE%2FIOZfx1mymGmHGbKYaYcZsphphxmymGmHGbKYaYcZsphphxmymGmHGbKxUtJ%2BEkqLQlNpSXhCZWWhCdUWhJ%2Bksobh5lymCmHmXLxYSqflIQ7Ki0JTeWJJDSVT1L5pCR80mGmHGbKYaZcfFkSnlD5piTcUbmThDsqTyThCZVvOsyUw0w5zJSLXy4JTaUloancScITKv8nh5lymCmHmXLxP5OEO0loKm8koan8ZoeZcpgph5ly8WUqP0nlThJaEu6o3EnCGyp%2Fk8NMOcyUw0y5%2BLAk%2FE2S0FRaEppKS0JTeSMJf7PDTDnMlMNMuXhJ5TdTeSIJTeWOym9ymCmHmXKYKRcvJaGpPJGEptKS8EQSmsqdJDSVN5LwSSp3ktBU3jjMlMNMOcyUi5dUWhLuqDSVloSm8kQS7iShqbyRhKbyRBKayp0kNJVPOsyUw0w5zJSLL1NpSbij0pJwR6WptCQ0lZaEN1TuJOGTVL7pMFMOM%2BUwU%2BIfvJCEJ1RaEu6o3ElCU7mThKbyRBLuqLQkNJUnktBUvukwUw4z5TBT4h98URKeUGlJuKPyRBKaSkvCHZU7SXhCpSXhDZU3DjPlMFMOM%2BXipSQ0lSdUWhKaSkvCnSTcUWlJaCotCS0Jd1SeSMIdlZ90mCmHmXKYKfEPflAS7qi0JDSVJ5LwTSqflIQ7Kt90mCmHmXKYKRc%2FTKUl4Y7KnSS8odKS0FTuJOGOyicloal80mGmHGbKYaZcvJSEN1TuJKGpNJU3kvBNSXhCpSXhThKayhuHmXKYKYeZEv%2FgF0vCEyp3kvCGyhNJaCp3ktBUPukwUw4z5TBTLl5Kwk9SuaPyhsoTSbiThKZyJwl3VL7pMFMOM%2BUwUy4%2BTOWTknBHpSXhjkpLQlNpSWgqT6g8odKS0JLQVD7pMFMOM%2BUwUy6%2BLAlPqDyRhDsqLQlNpSXhjSS8kYQnktBU3jjMlMNMOcyUi19OpSXhjkpLQlN5QqUl4QmVJ5LwTYeZcpgph5ly8T%2Bj0pLwRBK%2BSeWJJNxR%2BaTDTDnMlMNMufgylf%2BSSktCU2lJaCotCU3ljSQ0lf%2FSYaYcZsphplx8WBJ%2BUhKeUGlJeELlThLeSMITSWgqbxxmymGmHGZK%2FIOZfx1mymGmHGbKYaYcZsphphxmymGmHGbKYaYcZsphphxmymGmHGbKP%2BJIjRuoZK%2FEAAAAAElFTkSuQmCC'
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