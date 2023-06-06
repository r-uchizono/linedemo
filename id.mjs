import date_fns_timezone from 'date-fns-timezone'
import QRCode from 'qrcode'
import path from 'path'
import { date_format, random } from './common.mjs'
import { arg_message, message } from './message.mjs'
import { getuserquery, lifetimequery, qrcodequery } from './query.mjs'

const FORMAT = 'YYYY/MM/DD HH:mm:ss'
const TIME_ZONE_TOKYO = 'Asia/Tokyo'
const LIFE_TIME = Number(process.env.LIMIT_TIME)

export function id(event_data) {
    //画像ファイル名としてランダムな文字列作成
    let random_data = random()

    let lifeTime = new Date().setHours(new Date().getHours() + LIFE_TIME)
    let newTime = date_fns_timezone.formatToTimeZone(lifeTime, FORMAT, { timeZone: TIME_ZONE_TOKYO })

    let time_query = lifetimequery(newTime, event_data.event.source.userId)
    let errmessage = message()

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(time_query.query_time)
                .then(() => {
                    console.log('処理１')

                    const id_query = getuserquery(event_data.event.source.userId)

                    return client.query(id_query.query_id)
                })
                .then((res) => {
                    console.log('処理２')

                    let QrTime = new Date()
                    let newQrTime = date_fns_timezone.formatToTimeZone(QrTime, FORMAT, { timeZone: TIME_ZONE_TOKYO })
                    let qrdate = date_format(newQrTime)
                    let qrcode = qrdate.dateDate_qr + random_data.file
                    //フォルダに保存
                    QRCode.toFile(path.join(event_data.imageDir, random_data.file + '.png'), qrcode, (error) => {
                        try {
                            console.log('処理３')

                            if (error) { throw error }

                            let qr_query = qrcodequery(qrcode, event_data.event.source.userId)
                            client.query(qr_query.query_qr)

                            //ファイルのURLを生成し送信・拡張子注意
                            let qrmessage = {
                                type: "image",
                                originalContentUrl: 'https://' + event_data.req.get('host') + '/' + random_data.file + '.png',
                                previewImageUrl: 'https://' + event_data.req.get('host') + '/' + random_data.file + '.png'
                            }

                            let idmessage = message()

                            let result = date_format(res.rows[0].qr_expiration_date)

                            let lifemessage = arg_message('有効期限：' + result.dataDate_id + " " + result.dataTime)

                            event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, [qrmessage, idmessage.qr_message, lifemessage.life_message]))

                        } catch (e) {
                            console.error(e.stack)
                            event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.qr_errmessage))
                        }
                    })
                }).catch((e) => {
                    console.error(e.stack)
                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.errmessage))
                })
        }
    })

}