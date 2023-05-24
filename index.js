// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'
import line from "@line/bot-sdk" // Messaging APIのSDKをインポート
import fs from 'fs'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

import {list, yoyaku, a_ninzu, c_ninzu} from './event.mjs'
import {confirm, cancel, change} from './confirm.mjs'
import {id} from './id.mjs'
import {info} from './info.mjs'

// -----------------------------------------------------------------------------
// パラメータ設定
const line_config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
    channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
}

// -----------------------------------------------------------------------------
// Webサーバー設定
const app = express()
const PORT = process.env.PORT || 3000

//publicとgraphはlanchにもたせる
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const imageDir = path.join(__dirname, process.env.QR_FILE)
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir)
}
app.use(express.static(imageDir))

const graphDir = path.join(__dirname, process.env.GRAPH_FILE)
if (!fs.existsSync(graphDir)) {
    fs.mkdirSync(graphDir)
}
app.use(express.static(graphDir))

app.use(express.urlencoded({
    extended: true
}))

// APIコールのためのクライアントインスタンスを作成
const bot = new line.Client(line_config)

//サーバーとローカルでsslの部分が変わる
const client = new pg.Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DBNM,
    password: process.env.PG_PSWD,
    port: process.env.PG_PORT
})

app.post("/", (req, res) => {
    app.render('index.js')
})

// -----------------------------------------------------------------------------
// ルーター設定
app.post('/bot/webhook', line.middleware(line_config), (req, res, next) => {
    // 先行してLINE側にステータスコード200でレスポンスする。
    res.sendStatus(200)

    // すべてのイベント処理のプロミスを格納する配列。
    let events_processed = []

    req.body.events.forEach((event) => {

        let event_data = {
            client : client,
            event : event,
            req : req,
            events_processed : events_processed,
            bot : bot,
            graphDir : graphDir,
            imageDir : imageDir
        }

        // この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
        if (event.type == "message" && event.message.type == "text") {
            // ユーザーからのテキストメッセージが「イベント一覧」だった場合のみ反応。
            if (event.message.text == process.env.EVENT_MESSAGE) {

                list(event_data)
            }
            // ユーザーからのテキストメッセージが「予約確認」だった場合のみ反応。
            else if (event.message.text == process.env.CONFIRM_MESSAGE) {

                confirm(event_data)
            }
            // ユーザーからのテキストメッセージが「会員ID」だった場合のみ反応。
            else if (event.message.text == process.env.ID_MESSAGE) {

                id(event_data)
            }
            // ユーザーからのテキストメッセージが「お知らせ」だった場合のみ反応。
            else if (event.message.text == process.env.INFO_MESSAGE) {

                info(event_data)
            }
        // この処理の対象をイベントタイプがポストバックだった場合。
        } else if (event.type == "postback") {
            // 予約テーブルへの挿入
            if (event.postback.data.split('=')[0] == "event_id") {

                yoyaku(event_data)
            }
            //　大人人数登録
            else if (event.postback.data.split('=')[0] == "a_ninzu") {

                a_ninzu(event_data)
            }
            //　小人人数登録
            else if (event.postback.data.split('=')[0] == "c_ninzu") {

                c_ninzu(event_data)          
            }
            //　予約取消
            else if (event.postback.data.split('=')[0] == "torikesi") {

                cancel(event_data)
            }
            //  予約日時変更
            else if (event.postback.data.split('=')[0] == "henko") {

                change(event_data)
            }
        }
        else {
            return
        }
    })

    // すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
    Promise.all(events_processed)
        .then((res) => {
            console.log(`${res.length} event(s) processed.`)
        })
        .catch((e) => {
            console.error(
                JSON.stringify({
                    message: e.message,
                    status: e.originalError.response.status,
                    data: e.originalError.response.data,
                })
            )
        })
})

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
})