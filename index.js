// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'; 
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
const server = express();
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
        } else if (event.type == "postback" && event.postback.data.split('&')[0] == "yoyaku"){
            console.log(event.source.userId);
            console.log(event.postback.params.datetime);
            events_processed.push(bot.replyMessage(event.replyToken, '予約が完了しました'));
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