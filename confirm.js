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

                                let count = 12
                                let end = 0
                                let start = 0

                                let row = Math.ceil(res.rows.length / count)

                                for (let I = 0; I < row; I++) {
                                    console.log("roop start")
                                    if (res.rows.length <= count) {
                                        end = res.rows.length
                                    }
                                    else {
                                        if (res.rows.length - end > count) {
                                            end = (I + 1) * count
                                        }
                                        else {
                                            end = res.rows.length
                                        }

                                        start = (I) * count
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