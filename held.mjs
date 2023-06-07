import fs from 'fs'
import { date_format, time_format } from './common.mjs'
import { message } from './message.mjs'
import { b_heldquery, u_heldquery, heldquery } from './query.mjs'
import date_fns_timezone from 'date-fns-timezone'

const FORMAT = 'YYYY/MM/DD HH:mm:ss'
const TIME_ZONE_TOKYO = 'Asia/Tokyo'

export function held(event_data) {
    let errmessage = message()

    let basequery = b_heldquery()
    let event_nm

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(basequery.query_base)
                .then((res) => {
                    let event_cd = res.rows[0].event_cd
                    event_nm = res.rows[0].event_nm

                    let userquery = u_heldquery(event_data.event.source.userId, event_cd)
                    return Promise.all([client.query(userquery.query_user), event_cd])
                }).then(([res, event_cd]) => {
                    let userid = res.rows[0].user_id
                    let held_query = heldquery(userid, event_cd)

                    client.query(held_query.query_held)
                        .then((res) => {
                            if(res.rows.length == 0){
                                event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.noenent_errmessage))
                                return
                            }
                            //データを取りだす
                            let bufferData = fs.readFileSync('held.json')
                            // データを文字列に変換
                            let dataJSON = bufferData.toString()
                            //JSONのデータをJavascriptのオブジェクトに
                            let data = JSON.parse(dataJSON)

                            let today = new Date()
                            let newTime = date_fns_timezone.formatToTimeZone(today, FORMAT, { timeZone: TIME_ZONE_TOKYO })
                            let result = date_format(newTime)
                            let f_result = date_format(res.rows[0].first_day)

                            let F_SformattedTime = time_format(res.rows[0].first_start_time)
                            let F_EformattedTime = time_format(res.rows[0].first_end_time)
                            let S_SformattedTime = time_format(res.rows[0].second_start_time)
                            let S_EformattedTime = time_format(res.rows[0].second_end_time)

                            let kasaiti_nm = res.rows[0].kaisaiti_nm + '会場'
                            let date = result.formattedDate
                            let time
                            let reservation
                            if (result.dataDate == f_result.dataDate) {
                                time = F_SformattedTime.formattedTime + '～' + F_EformattedTime.formattedTime
                                reservation = res.rows[0].t1_id
                            }
                            else {
                                time = S_SformattedTime.formattedTime + '～' + S_EformattedTime.formattedTime
                                reservation = res.rows[0].t2_id
                            }
                            let place = res.rows[0].place_name
                            let address = res.rows[0].place_address

                            data.contents.body.contents[0].text = 'イベント　' + event_nm
                            data.contents.body.contents[1].text = '開催会場　' + kasaiti_nm
                            data.contents.body.contents[2].text = '開催日程　' + date
                            data.contents.body.contents[3].text = '開催時間　' + time
                            data.contents.body.contents[4].text = '開催場所　' + place
                            data.contents.body.contents[5].action.label = address
                            data.contents.body.contents[5].action.uri = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address)

                            if (reservation != null) {
                                event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, data))
                            }
                            else{
                                event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, [data, errmessage.held_message]))
                            }

                        }).catch((e) => {
                            console.error(e.stack)

                            event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.info_errmessage))
                        })
                }).catch((e) => {
                    console.error(e.stack)

                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.errmessage))
                })
        }
    })
}