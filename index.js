// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'; 

import fetch from 'node-fetch';
const server = express();
import { Client, middleware } from "@line/bot-sdk"; // Messaging APIのSDKをインポート
import fs from 'fs';

// -----------------------------------------------------------------------------
// パラメータ設定
const line_config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
    channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
};

// -----------------------------------------------------------------------------
// Webサーバー設定
server.listen(process.env.PORT || 3000);

// APIコールのためのクライアントインスタンスを作成
const bot = new Client(line_config);

// -----------------------------------------------------------------------------
// ルーター設定
server.post('/', middleware(line_config), (req, res, next) => {
    console.log('テスト');
    // 先行してLINE側にステータスコード200でレスポンスする。
    res.sendStatus(200);
});

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
                // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                //データを取りだす
                const bufferData = fs.readFileSync('yoyaku.json')

                // データを文字列に変換
                const dataJSON = bufferData.toString()
                //JSONのデータをJavascriptのオブジェクトに
                const data = JSON.parse(dataJSON)
                console.log(data)

                //if (鹿児島だったら) {
                    console.log(data.contents.header);
                    console.log(data.contents.header.contents);

                    data.contents.header.contents[0].text = '鹿児島会場'

                    console.log(data.contents.header.contents[0].text);
                    console.log(data.contents.header.contents);

                events_processed.push(bot.replyMessage(event.replyToken, data));
            }
        }
        if(event.type != "message"){      
          const message = {
            type: 'text',
            text: 'Hello World!'
          };
          
          events_processed.push(bot.replyMessage(event.replyToken, message));
        }
    });



    // function doPost(e) {
    //     /* レスポンスを取得 */
    //     const responseLine = e.postData.getDataAsString();
    //     /* JSON形式に変換する */
    //     const responseLineJson = JSON.parse(responseLine).events[0];
    
    //     /* スクリプトプロパティのオブジェクトを取得 */
    //     const prop = PropertiesService.getScriptProperties().getProperties();
    
    //     /* レスポンスをLINEに送る */
    //     UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    //         'headers': {
    //             'Content-Type': 'application/json',
    //             'Authorization': 'Bearer ' + prop.TOKEN, // スクリプトプロパティにトークンは事前に追加しておく
    //         },
    //         'method': 'POST',
    //         'payload': JSON.stringify({
    //             "to": prop.DEBUGID, // スクリプトプロパティに送信先IDは事前に追加しておく
    //             "messages": [{
    //                 "type": "text",
    //                 "text": responseLine // レスポンスを送る
    //             }],
    //             "notificationDisabled": false // trueだとユーザーに通知されない
    //         }),
    //     });
    // }


    // すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
    Promise.all(events_processed).then(
        (response) => {
            console.log(`${response.length} event(s) processed.`);
        }
    );

    //   }).then(promise => Promise.all(events_processed).then(
    //      (response) => {
    //          console.log(`${response.length} event(s) processed.`);
    //      }
    //  ));
    // イベントオブジェクトを順次処理。
    /*req.body.events.forEach((event) => {
        // この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
        if (event.type == "message" && event.message.type == "text"){
            // ユーザーからのテキストメッセージが「こんにちは」だった場合のみ反応。
            if (event.message.text == "こんにちは"){
                // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                events_processed.push(bot.replyMessage(event.replyToken, {   
                    type: "flex",
                    altText: "this is a flex message",
                    contents: {
                    type: "bubble",
                    header: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                            type: "text",
                            text: "○○/○○会場",
                            size: "xl",
                            position: "relative",
                            align: "center",
                            color: "#FFFFFF"
                            }
                        ]
                        },
                        body: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                            type: "text",
                            text: "OOOO年OO月OO日（O）",
                            size: "lg",
                            margin: "none"
                            },
                            {
                            type: "text",
                            text: "開催場所　○○:○○～○○:○○",
                            size: "sm"
                            },
                            {
                            type: "text",
                            text: "場所　○○○○",
                            size: "sm"
                            },
                            {
                            type: "text",
                            text: "　　　○○○○",
                            size: "sm"
                            }
                        ],
                        backgroundColor: "#fbdac8"
                        },
                        footer: {
                        type: "box",
                        layout: "vertical",
                        contents: [
                            {
                            type: "button",
                            action: {
                                type: "postback",
                                label: "イベント予約>>",
                                data: "yoyaku"
                            },
                            color: "#FFFFFF"
                            }
                        ]
                        },
                        styles: {
                        header: {
                            backgroundColor: "#f3981d"
                        },
                        footer: {
                            backgroundColor: "#f3981d"
                        }
                        }
                    }
                                                     
                }));
            }
        }
    });
    */

    // すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
    /*Promise.all(events_processed).then(
        (response) => {
            console.log(`${response.length} event(s) processed.`);
        }
    );
    */
});