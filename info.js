let lifeTime = new Date()
let newTime = date_fns_timezone.formatToTimeZone(lifeTime, FORMAT, { timeZone: TIME_ZONE_TOKYO})

let query = {
text: "SELECT naiyo"+
        "  FROM t_oshirase" +
        " WHERE kaisai_day = $1",
        values: [newTime],
}

client.connect(function (err, client) {
if (err) {
    console.log(err)
} else {
    client
        .query(query)
        .then((res) => {

            console.log(res.rows[0].naiyo)

            let message = {
                type: "text",
                text: res.rows[0].naiyo
            }
            events_processed.push(bot.replyMessage(event.replyToken, message))
        }).catch((e) => {
            console.error(e.stack)
            let errmessage = {
                type: "text",
                text: "本日実施のイベントはありません。"
            }
            events_processed.push(bot.replyMessage(event.replyToken, errmessage))
        })
    }
})
