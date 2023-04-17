// -----------------------------------------------------------------------------
// モジュールのインポート
//import fetch from 'node-fetch';
//import server from 'express'; 
//import line from '@line/bot-sdk';

import fetch from 'node-fetch';
//const server = require("express")();
import { Client, middleware } from "@line/bot-sdk"; // Messaging APIのSDKをインポート


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

      fetch("yoyaku.json")
      .then(res => res.json)
      .then(data => {
          req.body.events.forEach((event) => {
              // この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
              if (event.type == "message" && event.message.type == "text"){
                  // ユーザーからのテキストメッセージが「こんにちは」だった場合のみ反応。
                  if (event.message.text == "こんにちは"){
                      // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                      events_processed.push(bot.replyMessage(event.replyToken, data));
                  }
              }
          });
      }).then(promise => Promise.all(events_processed).then(
         (response) => {
             console.log(`${response.length} event(s) processed.`);
         }
     ));
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
    Promise.all(events_processed).then(
        (response) => {
            console.log(`${response.length} event(s) processed.`);
        }
    );
    
});