import date_fns_timezone from 'date-fns-timezone'
import { message, arg_message } from './message.mjs'
import { b_infoquery, infoquery, u_infoquery } from './query.mjs'

const FORMAT = 'YYYY/MM/DD HH:mm:ss'
const TIME_ZONE_TOKYO = 'Asia/Tokyo'

export function info(event_data) {
    let errmessage = message()
    let basequery = b_infoquery()

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(basequery.query_base)
                .then((res) => {
                    let event_cd = res.rows[0].event_cd

                    let userquery = u_infoquery(event_data.event.source.userId, event_cd)
                    return Promise.all([client.query(userquery.query_user), event_cd])
                }).then(([res, event_cd]) => {
                    let lnfoTime = new Date()
                    let newTime = date_fns_timezone.formatToTimeZone(lnfoTime, FORMAT, { timeZone: TIME_ZONE_TOKYO })

                    let info_query = infoquery(newTime)

                    client.query(info_query.info_query)
                        .then((res) => {

                            let infomessage = arg_message(res.rows[0].naiyo)

                            event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, infomessage.info_message))
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
