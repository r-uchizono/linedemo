// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'
import line from "@line/bot-sdk" // Messaging APIのSDKをインポート
import fs from 'fs'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto-js'

import { list, yoyaku, a_ninzu, c_ninzu } from './event.mjs'
import { confirm, cancel, change } from './confirm.mjs'
import { id } from './id.mjs'
import { info } from './info.mjs'
import { held } from './held.mjs'

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
app.use(express.static('public'))

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

        console.log("event.source.userId:", event.source.userId);
        let tempId = crypto.AES.encrypt(event.source.userId, 'key');
        event.source.userId = tempId.toString();
        console.log("event.source.userId:", event.source.userId);
        let event_data = {
            client: client,
            event: event,
            req: req,
            events_processed: events_processed,
            bot: bot,
            graphDir: graphDir,
            imageDir: imageDir
        }

        console.log('event:', event);

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
            // ユーザーからのテキストメッセージが「お知らせ」だった場合のみ反応。
            else if (event.message.text == process.env.HELD_MESSAGE) {

                held(event_data)
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
})

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
})

// お客様情報登録LIFF用
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post('/api', (req, res) => getUserInfo(req, res));
app.post('/toroku', (req, res) => setUserInfo(req, res));

const getUserInfo = (req, res) => {
    const data = req.body;
    const postData = `id_token=${data.id_token}&client_id=${process.env.LIFF_LOGIN}`;
    console.log('postData:', postData);
    fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: postData
    }).then(response => {
        response.json().then(json => {
            const userName = json.name;
            let lineId = "";
            async_digestMessage(json.sub).then(
                shatxt => {
                    return shatxt;
                }
            ).then(shatxt => {
                lineId = shatxt;
                console.log(lineId);
                const query = {
                    text: "SELECT *" +
                        "  FROM m_user" +
                        " WHERE user_id = $1",
                    values: [lineId],
                }
            }).then(query => {
                return client.query(query)
            }).then(data => {
                let obj;
                if (data.rows.length > 0) {
                    console.log("GetData Succes");
                    console.log('data.rows[0]:', data.rows[0]);
                    obj = {
                        torihikisa_nm: data.rows[0].torihikisa_nm,
                        user_nm: userName,
                        torihikisa_cd: data.rows[0].torihikisa_cd,
                        user_id: lineId,
                    }
                } else {
                    console.log("GetData failed");
                    obj = {
                        torihikisa_nm: "aaa",
                        user_nm: userName,
                        torihikisa_cd: "",
                        user_id: lineId,
                    }
                }

                res.status(200).send(obj);
            }).catch(e => console.log(e));
        });
    }).catch(e => console.log(e));
}

const setUserInfo = (req, res) => {
    const data = req.body;
    const query = {
        text: " INSERT " +
            " INTO public.m_user( " +
            "     user_id " +
            "     , event_cd " +
            "     , eigyo_cd " +
            "     , torihikisa_nm " +
            "     , torihikisa_cd " +
            "     , user_nm " +
            " ) " +
            " VALUES ( " +
            "     $1 " +
            "     , $2 " +
            "     , $3 " +
            "     , $4 " +
            "     , $5 " +
            "     , $6 " +
            " ) ",

        values: [data.user_id, "2023B", "200", data.torihikisa_nm, data.torihikisa_cd, data.user_nm],
    }



    client.query(query)
        .then(() => {
            res.status(200).send({ status: "OK" });
        }).catch(e => console.log(e));
}

function async_digestMessage(message) {
    return new Promise(function (resolve) {
        var msgUint8 = new TextEncoder("utf-8").encode(message);
        crypto.subtle.digest('SHA-256', msgUint8).then(
            function (hashBuffer) {
                var hashArray = Array.from(new Uint8Array(hashBuffer));
                var hashHex = hashArray.map(function (b) { return b.toString(16).padStart(2, '0') }).join('');
                return resolve(hashHex);
            });
    })
}