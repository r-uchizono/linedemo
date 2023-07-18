// -----------------------------------------------------------------------------
// モジュールのインポート
import express from 'express'
import line from "@line/bot-sdk" // Messaging APIのSDKをインポート
import fs from 'fs'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

import { list, yoyaku, a_ninzu, c_ninzu } from './event.mjs'
import { confirm, cancel, change } from './confirm.mjs'
import { id } from './id.mjs'
import { info } from './info.mjs'
import { held } from './held.mjs'
import log4js from 'log4js'

const logger = log4js.getLogger()



log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    app: { type: 'file', filename: 'application.log' }
  },
  categories: {
    default: { appenders: ['out', 'app'], level: 'debug' }
  }
})

//log4js.shutdown((err) => {
//  if (err) throw err
//  process.exit(0)
//})
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


  logger.level = 'all'

  logger.trace('Some trace messages')
  logger.debug('Some debug messages')
  logger.info('Some info messages')
  logger.warn('Some warn messages')
  logger.error('Some error messages')
  logger.fatal('Some fatal messages')

  // 先行してLINE側にステータスコード200でレスポンスする。
  res.sendStatus(200)

  // すべてのイベント処理のプロミスを格納する配列。
  let events_processed = []

  req.body.events.forEach((event) => {

    console.log("event.source.userId:", event.source.userId);
    event.source.userId = createHash('sha256').update(event.source.userId).digest('hex');
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
app.post('/toroku', (req, res) => addUserInfo(req, res));
app.post('/koshin', (req, res) => updateUserInfo(req, res));
app.post('/getTantoInfo', (req, res) => getTantoInfo(req, res));

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
      console.log("json", json);
      const userName = json.name;
      let lineId = createHash('sha256').update(json.sub).digest('hex');
      const query = {
        text: "SELECT *" +
          "  FROM m_user" +
          " WHERE user_id = $1",
        values: [lineId],
      }
      client.query(query)
        .then(data => {
          let obj;
          if (data.rows.length > 0) {
            console.log("GetData Succes");
            console.log('data.rows[0]:', data.rows[0]);
            obj = {
              tokuisaki_nm: data.rows[0].tokuisaki_nm,
              user_nm: data.rows[0].user_nm,
              tokuisaki_cd: data.rows[0].tokuisaki_cd,
              user_id: data.rows[0].user_id,
              event_cd: data.rows[0].event_cd,
              eigyo_cd: data.rows[0].eigyo_cd,
              add_flg: "0"
            }
          } else {
            console.log("GetData failed");
            obj = {
              tokuisaki_nm: "",
              user_nm: "",
              tokuisaki_cd: "",
              user_id: lineId,
              add_flg: "1"
            }
          }

          res.status(200).send(obj);
        }).catch(e => console.log(e));
    });
  }).catch(e => console.log(e));
}

const addUserInfo = (req, res) => {
  const data = req.body;
  const query = {
    text: " INSERT " +
      " INTO public.m_user( " +
      "     user_id " +
      "     , event_cd " +
      "     , eigyo_cd " +
      "     , tokuisaki_nm " +
      "     , tokuisaki_cd " +
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

    values: [data.user_id, data.event_cd, data.eigyo_cd, data.tokuisaki_nm, data.tokuisaki_cd, data.user_nm],
  }

  client.query(query)
    .then(() => {
      res.status(200).send({ status: "OK" });
    }).catch(e => console.log(e));
}

const updateUserInfo = (req, res) => {
  const data = req.body;
  const query = {
    text: " UPDATE public.m_user" +
      "    SET event_cd = $1, " +
      "        eigyo_cd = $2, " +
      "        tokuisaki_nm = $3, " +
      "        tokuisaki_cd = $4, " +
      "        user_nm = $5" +
      "  WHERE user_id = $6",
    values: [data.event_cd, data.eigyo_cd, data.tokuisaki_nm, data.tokuisaki_cd, data.user_nm, data.user_id],
  }

  client.query(query)
    .then(() => {
      res.status(200).send({ status: "OK" });
    }).catch(e => console.log(e));
}


const getTantoInfo = (req, res) => {
  const data = req.body;
  console.log("getTantoInfo data:", data);
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
      //let lineId = createHash('sha256').update(json.sub).digest('hex');
      let lineId = json.sub;
      const query = {
        text: "SELECT *" +
          "  FROM m_syain" +
          " WHERE kain_cd = $1",
        values: [data.kain_cd],
      }
      client.query(query)
        .then(data => {
          let obj;
          if (data.rows.length > 0) {
            obj = {
              id: data.rows[0].id,
              name: data.rows[0].name,
              lineId: lineId,
            }
          } else {
            console.log("GetData failed");
            obj = {
              id: "",
              name: "",
              lineId: lineId,
            }
          }

          res.status(200).send(obj);
        }).catch(e => console.log(e));
    });
  }).catch(e => console.log(e));
}