import fs from 'fs'
import {date_format, random, graph, time_format} from './common.mjs'
import {message} from './message.mjs'
import { b_eventquery, countquery, e_eventquery, entryquery, setidquery, u_eventquery } from './query.mjs'
import date_fns_timezone from 'date-fns-timezone'

export function list(event_data) {
    //データを取りだす
    let bufferData = fs.readFileSync('yoyaku.json')
    // データを文字列に変換
    let dataJSON = bufferData.toString()
    //JSONのデータをJavascriptのオブジェクトに
    let data = JSON.parse(dataJSON)
    let data_message = []
    data[0].contents.contents = []

    let basequery = b_eventquery()

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(basequery.query_base)
                .then((res) => {
                    console.log("1res.rows:", res.rows);
                    let userquery = u_eventquery(event_data.event.source.userId, res.rows[0].event_cd,"")

                    let event_nm = res.rows[0].event_nm
                    
                    console.log("userquery:", userquery);
                    console.log("userquery.query_user:", userquery.query_user);
                    return Promise.all([client.query(userquery.query_user), event_nm])

                }).then(([res, event_nm]) => {
                    console.log("2res.rows:", res.rows);
                    let eventquery = e_eventquery(event_data.event.source.userId, res.rows[0].event_cd, res.rows[0].eigyo_cd)

                    return Promise.all([client.query(eventquery.query_event), event_nm])
                }).then(([res, event_nm]) => {
                    let count = Number(process.env.MESSAGE_COUNT)
                    let end = 0
                    let start = 0

                    let row = Math.ceil(res.rows.length / count)

                    //画像ファイル名としてランダムな文字列作成
                    let random_data =  random()

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

                            let F_SformattedTime = time_format(res.rows[i].first_start_time)
                            let F_EformattedTime = time_format(res.rows[i].first_end_time)
                            let S_SformattedTime = time_format(res.rows[i].second_start_time)
                            let S_EformattedTime = time_format(res.rows[i].second_end_time)

                            let date = new Date()
                            let newdate = date_fns_timezone.formatToTimeZone(date, FORMAT, { timeZone: TIME_ZONE_TOKYO })
                            let new_result = date_format(newdate)
                            let f_result = date_format(res.rows[i].first_day)

                            if(new_result.dataDate <= f_result.dataDate){

                                let firstEventJson = JSON.parse(dataJSON)[0].contents.contents[0]
                                firstEventJson.header.contents[0].text = event_nm + '/' + res.rows[i].kaisaiti_nm + '会場'
                                firstEventJson.body.contents[0].text = f_result.formattedDate
                                firstEventJson.body.contents[1].text = '開催時間　' + F_SformattedTime.formattedTime + '～' + F_EformattedTime.formattedTime
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
                                            "label": "予約済み",
                                            "data": "dummy"
                                        }
                                    }
                                }
                                else {
                                    firstEventJson.footer.contents[0].action.data = 'event_id=' + res.rows[i].event_cd + '=' + res.rows[i].kaisaiti_cd + '=' + f_result.dataDate
                                }

                                let f_file = res.rows[i].kaisaiti_cd + f_result.dataDate.replace(/\//g, '_')

                                firstEventJson.hero.url = 'https://' + event_data.req.get('host') + '/' + f_file + '.png?xxx=' + random_data.file 

                                data[0].contents.contents.push({ ...firstEventJson })
                            }

                            if (res.rows[i].second_day != null) {

                                let s_result = date_format(res.rows[i].second_day)

                                let secondEventJson = JSON.parse(dataJSON)[0].contents.contents[0]
                                secondEventJson.header.contents[0].text = event_nm + '/' + res.rows[i].kaisaiti_nm + '会場'
                                secondEventJson.body.contents[0].text = s_result.formattedDate
                                secondEventJson.body.contents[1].text = '開催時間　' + S_SformattedTime.formattedTime + '～' + S_EformattedTime.formattedTime
                                secondEventJson.body.contents[2].text = '場所　' + res.rows[i].place_name
                                secondEventJson.body.contents[3].action.label = address
                                secondEventJson.body.contents[3].action.uri = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address)
                                if (res.rows[i].t2_id != null) {
                                    secondEventJson.footer.contents = []
                                    secondEventJson.footer.contents[0] = {
                                        "type": "button",
                                        "action": {
                                            "type": "postback",
                                            "label": "予約済み",
                                            "data": "dummy"
                                        }
                                    }
                                }
                                else {
                                    secondEventJson.footer.contents[0].action.data = 'event_id=' + res.rows[i].event_cd + '=' + res.rows[i].kaisaiti_cd + '=' + s_result.dataDate
                                }

                                let s_file = res.rows[i].kaisaiti_cd + s_result.dataDate.replace(/\//g, '_')

                                secondEventJson.hero.url = 'https://' + event_data.req.get('host') + '/' + s_file + '.png?xxx=' + random_data.file
                                data[0].contents.contents.push({ ...secondEventJson })
                            }
                        }

                        data_message.push({ ...data[0] })
                        data = JSON.parse(dataJSON)
                        data[0].contents.contents = []
                    }
                    // replyMessage()で返信し、そのプロミスをevents_processedに追加。
                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, data_message))

                }).catch((e) => {
                    console.error(e.stack)
                    let errmessage = message()
                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.errmessage))
                })
                
        }
    })
}

export function yoyaku(event_data){
    // DB登録処理
    let entry_query = entryquery(event_data.event.postback.data.split('=')[1], event_data.event.postback.data.split('=')[2], event_data.event.source.userId, event_data.event.postback.data.split('=')[3] + ' ' + event_data.event.postback.params.time + ':00.000')

    let setid_query = setidquery()

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(entry_query.query_entry)
                .then(() => {
                    console.log('Data Inserted.')

                    return client.query(setid_query.query_id)
                }).then((res) => {
                    //データを取りだす
                    let bufferData = fs.readFileSync('a_ninzu.json')
                    // データを文字列に変換
                    let dataJSON = bufferData.toString()
                    //JSONのデータをJavascriptのオブジェクトに
                    let data = JSON.parse(dataJSON)

                    var post = event_data.event.postback.data.split('=')
                    for (let i = 1; i < 11; i++) {
                        data.contents.body.contents[i].action.data = 'a_ninzu=' + i + '=' + res.rows[0].setval + '=' + post.slice(1)
                    }
                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, data))
                }).catch((e) => {
                    console.error(e.stack)
                })
        }
    })
}

export function a_ninzu(event_data){
    let a_query = countquery(event_data.event.postback.data.split('=')[1], event_data.event.postback.data.split('=')[2])

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(a_query.query_a)
                .then(() => {
                    console.log('Data Updated.')
                    //データを取りだす
                    let bufferData = fs.readFileSync('c_ninzu.json')
                    // データを文字列に変換
                    let dataJSON = bufferData.toString()
                    //JSONのデータをJavascriptのオブジェクトに
                    let data = JSON.parse(dataJSON)

                    var post = event_data.event.postback.data.split('=')
                    for (let i = 0; i < 10; i++) {
                        data.contents.body.contents[i + 1].action.data = 'c_ninzu=' + i + '=' + post.slice(2)
                    }

                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, data))
                }).catch((e) => {
                    console.error(e.stack)
                })
        }
    })
}

export function c_ninzu(event_data){
    let post = event_data.event.postback.data.replace(/,/g, '=')
    let c_query = countquery(post.split('=')[1], post.split('=')[2])
    console.log(post)
    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(c_query.query_c)
                .then(() => {
                    console.log('Data Updated.')

                    graph(post.split('=')[3], post.split('=')[4], post.split('=')[5].replace(/\//g, '_'), client, event_data.graphDir)

                }).catch((e) => {
                    console.error(e.stack)
                })
        }
    })

    let eventmessage = message()

    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, eventmessage.event_message))    
}