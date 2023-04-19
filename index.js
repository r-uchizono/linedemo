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
    });

    server.post((e) => {
        // スクリプトプロパティのオブジェクトを格納
       PropertiesService.getScriptProperties().setProperties({
         "TOKEN": "nECvQRB+BXql3hB78/VCyU9P1BuT4n0QIECFxsUBiocpOwrtTLrp+zgwdem+cRuTA/MnYsIzE3WScgrq//AWOxU6pQsqGzySlI3t+92Ia73pxu36G78AqNNYnj8JNHb0SfSWcoLuDfWCqpvHj0f0FAdB04t89/1O/w1cDnyilFU=",
         "USERID": '1660859088',
         "REPLYURL": "https://api.line.me/v2/bot/message/reply"
       });
        // スクリプトプロパティのオブジェクトを取得
        const prop = PropertiesService.getScriptProperties().getProperties();
        // レスポンス取得
        const responseLine = e.postData.getDataAsString();
        // JSON形式に変換する
      var resDatetime = JSON.parse(responseLine).events[0].postback.params.datetime;
      var replyToken = JSON.parse(responseLine).events[0]['replyToken'];
    
        UrlFetchApp.fetch(prop.REPLYURL, {
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + prop.TOKEN, // スクリプトプロパティにトークンは事前に追加しておく
            },
            'method': 'POST',
            'payload': JSON.stringify({
          'replyToken': replyToken,
                "messages": [{
                    "type": "text",
                    "text": resDatetime // レスポンスを送る
                }],
                "notificationDisabled": false // trueだとユーザーに通知されない
            }),
        });
    });



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