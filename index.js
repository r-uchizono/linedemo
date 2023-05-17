// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'
import line from "@line/bot-sdk" // Messaging APIのSDKをインポート
import fs from 'fs'
import pg from 'pg'
import QRCode from 'qrcode'
import getRandomValues from 'get-random-values'
import path from 'path'
import { fileURLToPath } from 'url'
import Chart from 'chart.js/auto'
import { createCanvas } from 'canvas'
import moment from 'moment'
import date_fns_timezone from 'date-fns-timezone'

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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const imageDir = path.join(__dirname, 'public')
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir)
}
app.use(express.static(imageDir))
app.use(express.urlencoded({
    extended: true
}))


// APIコールのためのクライアントインスタンスを作成
const bot = new line.Client(line_config)
//ローカル用
// const client = new pg.Pool({
//     user: process.env.PG_USER,
//     host: process.env.PG_HOST,
//     database: process.env.PG_DBNM,
//     password: process.env.PG_PSWD,
//     port: process.env.PG_PORT,
//     ssl: true 
// })

const client = new pg.Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DBNM,
    password: process.env.PG_PSWD,
    port: process.env.PG_PORT
})

// const client = new pg.Pool({
//     user: 'unis',
//     host: 'dpg-cgvn4qodh87joksvpj70-a',
//     database: 'event_f91d',
//     password: 'gbFeZ4j0o2mXOlCdCw0qF4TMaYTkldcn',
//     port: 5432 
// }) 

const FORMAT = 'YYYY/MM/DD HH:mm:ss'
const TIME_ZONE_TOKYO = 'Asia/Tokyo'
const LIFE_TIME = Number(process.env.LIMIT_TIME)


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
        // この処理の対象をイベントタイプがメッセージで、かつ、テキストタイプだった場合に限定。
        if (event.type == "message" && event.message.type == "text") {
            // ユーザーからのテキストメッセージが「イベント一覧」だった場合のみ反応。
            if (event.message.text == "イベント一覧") {
                //データを取りだす
                let bufferData = fs.readFileSync('yoyaku.json')
                // データを文字列に変換
                let dataJSON = bufferData.toString()
                //JSONのデータをJavascriptのオブジェクトに
                let data = JSON.parse(dataJSON)
                let data_message = []
                data[0].contents.contents = []

                let query_event_base = {
                    text: "SELECT *" +
                        "  FROM m_event_base t1 " +
                        " WHERE current_date BETWEEN t1.start_ymd AND t1.end_ymd" +
                        "    OR current_date < t1.start_ymd" +
                        " ORDER BY t1.start_ymd",
                }

                client.connect(function (err, client) {
                    if (err) {
                        console.log(err)
                    } else {
                        client
                            .query(query_event_base)
                            .then((res) => {
                                console.log(res.rows[0].event_cd)

                                let query_user = {
                                    text: "SELECT *" +
                                        "  FROM m_user m1 " +
                                        "  LEFT OUTER JOIN" +
                                        "       m_eigyo_e e1" +
                                        "    ON m1.eigyo_cd = e1.eigyo_cd" +
                                        " WHERE m1.user_id = $1" +
                                        "   AND m1.event_cd = $2",
                                    values: [event.source.userId, res.rows[0].event_cd],
                                }

                                let event_nm = res.rows[0].event_nm

                                client.query(query_user)
                                    .then((res) => {
                                        let query_event = {
                                            text: "SELECT e1.*" +
                                                "     , k.kaisaiti_nm" +
                                                "     , t1.id as t1_id" +
                                                "     , t2.id as t2_id" +
                                                "  FROM m_event e1" +
                                                " INNER JOIN m_kaisaiti k" +
                                                "    ON e1.kaisaiti_cd = k.kaisaiti_cd" +
                                                "  LEFT OUTER JOIN" +
                                                "       m_event_eigyo e2" +
                                                "    ON k.kaisaiti_cd = e2.kaisaiti_cd" +
                                                "   AND e2.event_cd = $2" +
                                                "   AND e2.eigyo_cd = $3" +
                                                "  LEFT OUTER JOIN" +
                                                "       t_yoyaku t1" +
                                                "    ON e1.event_cd = t1.event_cd" +
                                                "   AND e1.kaisaiti_cd = t1.kaisaiti_cd" +
                                                "   AND e1.first_day = date_trunc('day',t1.reserve_time)" +
                                                "   AND t1.user_id = $1" +
                                                "  LEFT OUTER JOIN" +
                                                "       t_yoyaku t2" +
                                                "    ON e1.event_cd = t2.event_cd" +
                                                "   AND e1.kaisaiti_cd = t2.kaisaiti_cd" +
                                                "   AND e1.second_day = date_trunc('day',t2.reserve_time)" +
                                                "   AND t2.user_id = $1" +
                                                " WHERE e1.event_cd = $2" +
                                                " ORDER BY" +
                                                " CASE" +
                                                "  WHEN e2.eigyo_cd = $3 THEN 0" +
                                                "  ELSE 1" +
                                                " END," +
                                                "       e1.first_day",
                                            values: [event.source.userId, res.rows[0].event_cd, res.rows[0].eigyo_cd],
                                        }

                                        client.query(query_event)
                                            .then((res) => {

                                                let end = 0
                                                let start = 0

                                                let row = Math.ceil(res.rows.length / 6)
                                                console.log(row)

                                                let S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                                let array = new Uint8Array(16)
                                                let file = Array.from(getRandomValues(array)).map((n) => S[n % S.length]).join('')

                                                for (let I = 0; I < row; I++) {
                                                    console.log("roop start")
                                                    if (res.rows.length <= 6) {
                                                        end = res.rows.length
                                                    }
                                                    else {
                                                        if (res.rows.length - end > 6) {
                                                            end = (I + 1) * 6
                                                        }
                                                        else {
                                                            end = res.rows.length
                                                        }

                                                        start = (I) * 6
                                                    }

                                                    for (let i = start; i < end; i++) {

                                                        let f_stime = new Date('2023-04-01T' + res.rows[i].first_start_time)
                                                        let f_etime = new Date('2023-04-01T' + res.rows[i].first_end_time)
                                                        let s_stime = new Date('2023-04-01T' + res.rows[i].second_start_time)
                                                        let s_etime = new Date('2023-04-01T' + res.rows[i].second_end_time)
                                                        let F_SformattedTime = f_stime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' }) // ロケールに基づいた形式の時間に変換する
                                                        let F_EformattedTime = f_etime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
                                                        let S_SformattedTime = s_stime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' }) // ロケールに基づいた形式の時間に変換する
                                                        let S_EformattedTime = s_etime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })

                                                        let f_result = date_format(res.rows[i].first_day)

                                                        let firstEventJson = JSON.parse(dataJSON)[0].contents.contents[0]
                                                        firstEventJson.header.contents[0].text = event_nm + '/' + res.rows[i].kaisaiti_nm + '会場'
                                                        firstEventJson.body.contents[0].text = f_result.formattedDate
                                                        firstEventJson.body.contents[1].text = '開催時間　' + F_SformattedTime + '～' + F_EformattedTime
                                                        firstEventJson.body.contents[2].text = '場所　' + res.rows[i].place_name
                                                        let address = res.rows[i].place_address
                                                        firstEventJson.body.contents[3].action.label = address
                                                        firstEventJson.body.contents[3].action.uri = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address)
                                                        if (res.rows[i].t1_id != null) {
                                                            firstEventJson.footer.contents = []
                                                            firstEventJson.footer.contents[0] = {
                                                                "type": "button",
                                                                "action": {
                                                                    "type": "postback",
                                                                    "label": "予約済みです",
                                                                    "data": "dummy"
                                                                }
                                                            }
                                                        }
                                                        else {
                                                            firstEventJson.footer.contents[0].action.data = 'event_id=' + res.rows[i].event_cd + '=' + res.rows[i].kaisaiti_cd + '=' + f_result.dataDate
                                                        }

                                                        let f_file = res.rows[i].kaisaiti_cd + f_result.dataDate.replace(/\//g, '_')

                                                        firstEventJson.hero.url = 'https://' + req.get('host') + '/' + f_file + '.png?xxx=' + file 

                                                        data[0].contents.contents.push({ ...firstEventJson })

                                                        if (res.rows[i].second_day != null) {

                                                            let s_result = date_format(res.rows[i].second_day)

                                                            let secondEventJson = JSON.parse(dataJSON)[0].contents.contents[0]
                                                            secondEventJson.header.contents[0].text = event_nm + '/' + res.rows[i].kaisaiti_nm + '会場'
                                                            secondEventJson.body.contents[0].text = s_result.formattedDate
                                                            secondEventJson.body.contents[1].text = '開催時間　' + S_SformattedTime + '～' + S_EformattedTime
                                                            secondEventJson.body.contents[2].text = '場所　' + res.rows[i].place_name
                                                            secondEventJson.body.contents[3].action.label = address
                                                            secondEventJson.body.contents[3].action.uri = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address)
                                                            if (res.rows[i].t2_id != null) {
                                                                secondEventJson.footer.contents = []
                                                                secondEventJson.footer.contents[0] = {
                                                                    "type": "button",
                                                                    "action": {
                                                                        "type": "postback",
                                                                        "label": "予約済みです",
                                                                        "data": "dummy"
                                                                    }
                                                                }
                                                            }
                                                            else {
                                                                secondEventJson.footer.contents[0].action.data = 'event_id=' + res.rows[i].event_cd + '=' + res.rows[i].kaisaiti_cd + '=' + s_result.dataDate
                                                            }

                                                            let s_file = res.rows[i].kaisaiti_cd + s_result.dataDate.replace(/\//g, '_')

                                                            secondEventJson.hero.url = 'https://' + req.get('host') + '/' + s_file + '.png?xxx=' + file
                                                            data[0].contents.contents.push({ ...secondEventJson })
                                                        }
                                                    }

                                                    data_message.push({ ...data[0] })
                                                    data = JSON.parse(dataJSON)
                                                    data[0].contents.contents = []
                                                }
                                                // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                                                events_processed.push(bot.replyMessage(event.replyToken, data_message))


                                            })

                                    }).catch((e) => {
                                        console.error(e.stack)
                                        let errmessage = {
                                            type: "text",
                                            text: "お客様情報が未登録です。"
                                        }
                                        events_processed.push(bot.replyMessage(event.replyToken, errmessage))
                                    })
                            })
                    }
                })
            }
            // ユーザーからのテキストメッセージが「予約確認」だった場合のみ反応。
            else if (event.message.text == "予約確認") {
                //データを取りだす
                let bufferData = fs.readFileSync('kakunin.json')
                // データを文字列に変換
                let dataJSON = bufferData.toString()
                //JSONのデータをJavascriptのオブジェクトに
                let data = JSON.parse(dataJSON)
                let data_message = []
                data[0].contents.contents = []

                let query_event_base = {
                    text: "SELECT *" +
                        "  FROM m_event_base t1 " +
                        " WHERE current_date BETWEEN t1.start_ymd AND t1.end_ymd" +
                        "    OR current_date < t1.start_ymd" +
                        " ORDER BY t1.start_ymd",
                }

                client.connect(function (err, client) {
                    if (err) {
                        console.log(err)
                    } else {
                        client
                            .query(query_event_base)
                            .then((res) => {
                                let event_cd = res.rows[0].event_cd
                
                                let query_user = {
                                    text: "SELECT *" +
                                        "  FROM m_user" +
                                        " WHERE user_id = $1",
                                    values: [event.source.userId],
                                }

                                client.query(query_user)
                                    .then((res) => {
                                        let query_yoyaku = {
                                            text: "SELECT *" +
                                                "  FROM t_yoyaku t1" +
                                                " INNER JOIN" +
                                                "       m_event m1" +
                                                "    ON t1.event_cd = m1.event_cd" +
                                                "   AND t1.kaisaiti_cd = m1.kaisaiti_cd" +
                                                " INNER JOIN" +
                                                "       m_event_base m2" +
                                                "    ON m1.event_cd = m2.event_cd" +
                                                " INNER JOIN m_kaisaiti k" +
                                                "    ON m1.kaisaiti_cd = k.kaisaiti_cd" +
                                                " WHERE t1.user_id = $1" + 
                                                "   AND t1.event_cd = $2" +
                                                " ORDER BY t1.reserve_time",
                                            values: [res.rows[0].user_id, event_cd],
                                        }

                                        client.query(query_yoyaku)
                                            .then((res) => {
                                                let end = 0
                                                let start = 0

                                                let row = Math.ceil(res.rows.length / 12)
                                                console.log(row)

                                                for (let I = 0; I < row; I++) {
                                                    console.log("roop start")
                                                    if (res.rows.length <= 12) {
                                                        end = res.rows.length
                                                    }
                                                    else {
                                                        if (res.rows.length - end > 12) {
                                                            end = (I + 1) * 12
                                                        }
                                                        else {
                                                            end = res.rows.length
                                                        }

                                                        start = (I) * 12
                                                    }
                                                    for (let i = start; i < end; i++) {

                                                        let result = date_format(res.rows[i].reserve_time)
                                                        let f_result = date_format(res.rows[i].first_day)
                                                        
                                                        let f_stime = new Date('2023-04-01T' + res.rows[i].first_start_time)
                                                        let f_etime = new Date('2023-04-01T' + res.rows[i].first_end_time)
                                                        let s_stime = new Date('2023-04-01T' + res.rows[i].second_start_time)
                                                        let s_etime = new Date('2023-04-01T' + res.rows[i].second_end_time)
                                                        let F_SformattedTime = f_stime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' }) // ロケールに基づいた形式の時間に変換する
                                                        let F_EformattedTime = f_etime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
                                                        let S_SformattedTime = s_stime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' }) // ロケールに基づいた形式の時間に変換する
                                                        let S_EformattedTime = s_etime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })

                                                        let EventJson = JSON.parse(dataJSON)[0].contents.contents[0]
                                                        EventJson.header.contents[0].text = res.rows[i].event_nm + '/' + res.rows[i].kaisaiti_nm + '会場'
                                                        EventJson.body.contents[0].text = result.formattedDate

                                                        console.log(result.dataDate)
                                                        console.log(f_result.dataDate)

                                                        if(result.dataDate == f_result.dataDate){
                                                            EventJson.body.contents[1].text = '開催時間　' + F_SformattedTime + '～' + F_EformattedTime
                                                        }
                                                        else{
                                                            EventJson.body.contents[1].text = '開催時間　' + S_SformattedTime + '～' + S_EformattedTime
                                                        }
                                                        EventJson.body.contents[2].text = '開催場所　' + res.rows[i].place_name
                                                        let address = res.rows[i].place_address
                                                        EventJson.body.contents[3].action.label = address
                                                        EventJson.body.contents[3].action.uri = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address)
                                                        EventJson.body.contents[4].text = '予約時間　' + result.dataTime
                                                        EventJson.body.contents[6].text = '　　大人：' + res.rows[i].reserve_a_count + '名'
                                                        EventJson.body.contents[7].text = '　　小人：' + res.rows[i].reserve_c_count + '名'

                                                        EventJson.footer.contents[0].action.data = 'torikesi=' + res.rows[i].id  + '=' + result.dataDate
                                                        EventJson.footer.contents[1].action.data = 'henko=' + res.rows[i].id + '=' + result.dataDate

                                                        data[0].contents.contents.push({ ...EventJson })
                                                    }

                                                    data_message.push({ ...data[0] })
                                                    data = JSON.parse(dataJSON)
                                                    data[0].contents.contents = []
                                                }

                                               // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                                                events_processed.push(bot.replyMessage(event.replyToken, data_message))

                                            })

                                    }).catch((e) => {
                                        console.error(e.stack)
                                        let errmessage = {
                                            type: "text",
                                            text: "お客様情報が未登録です。"
                                        }
                                        events_processed.push(bot.replyMessage(event.replyToken, errmessage))
                                    })
                            })
                        }
                    })
            }
            // ユーザーからのテキストメッセージが「会員ID」だった場合のみ反応。
            else if (event.message.text == "会員ID") {
                //画像ファイル名としてランダムな文字列作成
                let S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                let array = new Uint8Array(16)
                let QRfile = Array.from(getRandomValues(array)).map((n) => S[n % S.length]).join('')
                console.log(getRandomValues(array))

                let lifeTime = new Date().setHours(new Date().getHours() + LIFE_TIME)
                let newTime = date_fns_timezone.formatToTimeZone(lifeTime, FORMAT, { timeZone: TIME_ZONE_TOKYO})
                
                console.log(newTime)
                
                let query_kigen = {
                    text: 'UPDATE m_user' +
                        '   SET qr_expiration_date = $1' +
                        ' WHERE user_id = $2',
                    values: [newTime, event.source.userId],
                }

                let userid
                client.connect(function (err, client) {
                    if (err) {
                        console.log(err)
                    } else {
                        client
                            .query(query_kigen)
                            .then(() => {
                                console.log('Data Updated.')

                                let query = {
                                    text: "SELECT user_id, qr_expiration_date FROM m_user WHERE user_id = $1",
                                    values: [event.source.userId],
                                }

                                client.query(query)
                                    .then((res) => {
                                        console.log(res.rows[0].user_id)
                                        userid = res.rows[0].user_id

                                        //フォルダに保存
                                        QRCode.toFile(path.join(imageDir, QRfile + '.png'), userid, (error) => {
                                            if (error) {
                                                console.error(error)
                                                return
                                            }

                                            console.log(req.protocol + '://' + req.get('host') + '/' + QRfile + '.png')

                                            //ファイルのURLを生成し送信・拡張子注意
                                            let message = {
                                                type: "image",
                                                originalContentUrl: 'https://' + req.get('host') + '/' + QRfile + '.png',
                                                previewImageUrl: 'https://' + req.get('host') + '/' + QRfile + '.png'
                                            }

                                            let addmessage = {
                                                type: 'text',
                                                text: 'イベント受付にてご提示ください'
                                            }

                                            let date = new Date(res.rows[0].qr_expiration_date)
                                            let month = ('0' + (date.getMonth() + 1)).slice(-2)
                                            let day = ('0' + date.getDate()).slice(-2)
                                            let dataDate = `${month}/${day}`
                                            let formattedTime = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' }) // ロケールに基づいた形式の時間に変換する
            
                                            let addmessage2 = {
                                                type: 'text',
                                                text: '有効期限：' + dataDate + " " + formattedTime
                                            };
                            
                                            events_processed.push(bot.replyMessage(event.replyToken, [message, addmessage, addmessage2])) 
                                        })

                                    })    
                            })                        
                            .catch((e) => {
                                console.error(e.stack)
                                let errmessage = {
                                    type: "text",
                                    text: "お客様情報が未登録です。"
                                }
                                events_processed.push(bot.replyMessage(event.replyToken, errmessage))
                            })
                    }
                })


            }
            // この処理の対象をイベントタイプがポストバックだった場合。
        } else if (event.type == "postback") {
            // 「イベント一覧」の場合
            if (event.postback.data.split('=')[0] == "event_id") {
                // DB登録処理
                let query = {
                    text: 'INSERT INTO t_yoyaku(event_cd, kaisaiti_cd, user_id, reserve_time) VALUES($1, $2, $3, $4)',
                    values: [event.postback.data.split('=')[1], event.postback.data.split('=')[2], event.source.userId, event.postback.data.split('=')[3] + ' ' + event.postback.params.time + ':00.000'],
                }

                let query_id = {
                    text: "SELECT setval('t_yoyaku_id_seq', (SELECT MAX(id) FROM t_yoyaku))",
                }

                client.connect(function (err, client) {
                    if (err) {
                        console.log(err)
                    } else {
                        client
                            .query(query)
                            .then(() => {
                                console.log('Data Inserted.')
                                client.query(query_id)
                                    .then((res) => {
                                        //データを取りだす
                                        let bufferData = fs.readFileSync('a_ninzu.json')
                                        // データを文字列に変換
                                        let dataJSON = bufferData.toString()
                                        //JSONのデータをJavascriptのオブジェクトに
                                        let data = JSON.parse(dataJSON)

                                        var post = event.postback.data.split('=')
                                        for (let i = 1; i < 10; i++) {
                                            data.contents.body.contents[i].action.data = 'a_ninzu=' + i + '=' + res.rows[0].setval + '=' + post.slice(1)
                                        }
                                        events_processed.push(bot.replyMessage(event.replyToken, data))
                                    })
                            })
                            .catch((e) => {
                                console.error(e.stack)
                            })
                    }
                })
            }
            else if (event.postback.data.split('=')[0] == "a_ninzu") {

                let query = {
                    text: 'UPDATE t_yoyaku' +
                        '   SET reserve_a_count = $1' +
                        ' WHERE id = $2',
                    values: [event.postback.data.split('=')[1], event.postback.data.split('=')[2]],
                }
                client.connect(function (err, client) {
                    if (err) {
                        console.log(err)
                    } else {
                        client
                            .query(query)
                            .then(() => {
                                console.log('Data Updated.')
                                //データを取りだす
                                let bufferData = fs.readFileSync('c_ninzu.json')
                                // データを文字列に変換
                                let dataJSON = bufferData.toString()
                                //JSONのデータをJavascriptのオブジェクトに
                                let data = JSON.parse(dataJSON)

                                var post = event.postback.data.split('=')
                                for (let i = 0; i < 10; i++) {
                                    data.contents.body.contents[i + 1].action.data = 'c_ninzu=' + i + '=' + post.slice(2)
                                }

                                events_processed.push(bot.replyMessage(event.replyToken, data))
                            })
                    }
                })

            }
            else if (event.postback.data.split('=')[0] == "c_ninzu") {

                let post = event.postback.data.replace(/,/g, '=')
                // DB登録処理
                let query = {
                    text: 'UPDATE t_yoyaku' +
                        '   SET reserve_c_count = $1' +
                        ' WHERE id = $2',
                    values: [post.split('=')[1], post.split('=')[2]],
                }

                client.connect(function (err, client) {
                    if (err) {
                        console.log(err)
                    } else {
                        client
                            .query(query)
                            .then(() => {
                                console.log('Data Updated.')

                                graph(post.split('=')[3], post.split('=')[4], post.split('=')[5].replace(/\//g, '_'))

                            })
                            .catch((e) => {
                                console.error(e.stack)
                            })
                    }
                })

                let message = {
                    type: 'text',
                    text: '予約が完了しました'
                }

                events_processed.push(bot.replyMessage(event.replyToken, message))                
            }
            else if (event.postback.data.split('=')[0] == "torikesi") {
                // DB処理
                let query_yoyaku = {
                    text: 'SELECT *' +
                          '  FROM t_yoyaku' +
                          ' WHERE id = $1',
                    values: [event.postback.data.split('=')[1]],
                }

                let query = {
                    text: 'DELETE' +
                          '  FROM t_yoyaku' +
                          ' WHERE id = $1',
                    values: [event.postback.data.split('=')[1]],
                }

                client.connect(function (err, client) {
                    if (err) {
                        console.log(err)
                    } else {
                        client
                            .query(query_yoyaku)
                            .then((res) => {
                                let event_cd = res.rows[0].event_cd
                                let kaisaiti_cd = res.rows[0].kaisaiti_cd    

                                client.query(query)
                                    .then(() => {
                                        console.log('Data Deleted.')

                                        let message = {
                                            type: 'text',
                                            text: '取消が完了しました'
                                        }
                        
                                        events_processed.push(bot.replyMessage(event.replyToken, message))

                                        graph(event_cd, kaisaiti_cd, event.postback.data.split('=')[2].replace(/\//g, '_'))
                                    })
                            })
                            .catch((e) => {
                                console.error(e.stack)
                            })
                    }
                })
            }
            else if (event.postback.data.split('=')[0] == "henko") {
                // DB登録処理
                let query = {
                    text: 'UPDATE t_yoyaku' +
                          '   SET reserve_time = $1' +
                          ' WHERE id = $2',
                    values: [event.postback.data.split('=')[2] + ' ' + event.postback.params.time + ':00.000', event.postback.data.split('=')[1]],
                }

                client.connect(function (err, client) {
                    if (err) {
                        console.log(err)
                    } else {
                        client
                            .query(query)
                            .then(() => {
                                console.log('Data Updated.')

                                let message = {
                                    type: 'text',
                                    text: '変更が完了しました'
                                }
                
                                events_processed.push(bot.replyMessage(event.replyToken, message))     

                                let query_yoyaku = {
                                    text: 'SELECT *' +
                                          '  FROM t_yoyaku' +
                                          ' WHERE id = $1',
                                    values: [event.postback.data.split('=')[1]],
                                }

                                client.query(query_yoyaku)
                                    .then((res) => {

                                        let event_cd = res.rows[0].event_cd
                                        let kaisaiti_cd = res.rows[0].kaisaiti_cd

                                        graph(event_cd, kaisaiti_cd, event.postback.data.split('=')[2].replace(/\//g, '_'))

                                    })
                            })
                            .catch((e) => {
                                console.error(e.stack)
                            })
                    }
                })
            }
        }
        else {
            return
        }
    })

    //すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
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


function graph(event_cd, kaisaiti_cd, g_date){
    let query_time = {
        text: "SELECT " + 
            "      CASE" +  
            "          WHEN first_day = $1" +
            "               THEN first_start_time" +
            "          ELSE second_start_time" + 
            "          END as start, " +
            "      CASE" +  
            "          WHEN first_day = $1" +
            "               THEN first_end_time - first_start_time" +
            "          ELSE second_end_time - second_start_time" + 
            "          END " +
            "    FROM m_event " +
            "   WHERE event_cd = $2" +
            "     AND kaisaiti_cd = $3" +
            "     AND ( first_day = $1" +
            "      OR second_day = $1)",
        values: [g_date, event_cd, kaisaiti_cd],
    }

    client.query(query_time)
        .then((res) => {
            let row = Math.ceil(res.rows[0].case.hours / 2)

            let select = ""
            let selectdata = ""
            let start = res.rows[0].start
            let startTime = moment(start, 'HH:mm:ss');
            let end 
            let first = 0

            for (let i = 0; i < row; i++) {
                startTime.add(2, 'hours');
                end = startTime.format('HH:mm:ss')

                select = 
                "( SELECT" +
                "      SUM(reserve_a_count) + SUM(reserve_c_count) " +
                "  FROM" +
                "      t_yoyaku " +
                "  WHERE" +
                "      reserve_time BETWEEN '" + g_date + " " + start + "' AND '" + g_date + " " + end  + "') as " + '"' + start.slice(0,5) + '~"'

                if(first != 0){
                    select  = ',' + select
                }
                selectdata = selectdata + select                                            
                first = 1
                start = end
            }

            let query_graph = {
                text: "SELECT " + 
                            selectdata +
                      "  FROM t_yoyaku t1 " +
                      " WHERE event_cd = $1 " +
                      " GROUP BY event_cd",
                values: [event_cd],
            }

            client.query(query_graph)
            .then((res) => { 
                let canvas = createCanvas(400, 400);
                let ctx = canvas.getContext('2d');

                let graphdata = {
                datasets: [{
                    label: '来場者予定グラフ',
                    data: res.rows[0],
                    backgroundColor: [
                    'rgba(255, 99, 132, 0.2)'
                    ],
                    borderColor: [
                    'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1,
                }]
                }; 
                
                let chart = new Chart(ctx, {
                type: 'bar',
                data: graphdata,
                options: {
                    scales: {
                        y: {
                            display: false
                        },
                        x: {
                            display: true
                        }
                    },
                    plugins: {
                        legend: {
                        display: false,
                        },
                        }
                    }
                })

                let file = kaisaiti_cd + g_date

                let graphDir = path.join(__dirname, 'graph')
                if (!fs.existsSync(graphDir)) {
                    fs.mkdirSync(graphDir)
                }
                app.use(express.static(graphDir))

                let out = fs.createWriteStream(graphDir + '/' + file +'.png');
                let stream = canvas.createPNGStream();
                stream.pipe(out);
            })
        })
}

function date_format(previous_date){
    let date = new Date(previous_date)
    let year = date.getFullYear()
    let month = ('0' + (date.getMonth() + 1)).slice(-2)
    let day = ('0' + date.getDate()).slice(-2)
    let dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
    let formattedDate = `${year}年${month}月${day}日（${dayOfWeek}）`
    let dataDate = `${year}/${month}/${day}`
    let dataTime = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })

    return {
        formattedDate: formattedDate,
        dataDate: dataDate,
        dataTime: dataTime
    }
}