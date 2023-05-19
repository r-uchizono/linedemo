exports.list = function(req, res){
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

                                    let count = 6
                                    let end = 0
                                    let start = 0

                                    let row = Math.ceil(res.rows.length / count)

                                    let S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                                    let array = new Uint8Array(16)
                                    let file = Array.from(getRandomValues(array)).map((n) => S[n % S.length]).join('')

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

exports.yoyaku = function(req, res){
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

exports.a_ninzu = function(req, res){
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

exports.c_ninzu = function(req, res){
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