import date_fns_timezone from 'date-fns-timezone'
import {message, arg_message} from './message.mjs'
import {infoquery} from './query.mjs'

const FORMAT = 'YYYY/MM/DD HH:mm:ss'
const TIME_ZONE_TOKYO = 'Asia/Tokyo'

export function info(event_data){ 
    let lifeTime = new Date()
    let newTime = date_fns_timezone.formatToTimeZone(lifeTime, FORMAT, { timeZone: TIME_ZONE_TOKYO})

    let info_query = infoquery(newTime)

    event_data.client.connect(function (err, client) {
    if (err) {
        console.log(err)
    } else {
        client
            .query(info_query.info_query)
            .then((res) => {

                let infomessage = arg_message(res.rows[0].naiyo)

                event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, infomessage.info_message))
            }).catch((e) => {
                console.error(e.stack)

                let errmessage = message()
                event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.info_errmessage))
            })
        }
    })
}
