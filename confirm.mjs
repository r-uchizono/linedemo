import fs from 'fs'
import {date_format, graph, time_format} from './common.mjs'
import {message} from './message.mjs'
import { b_confirmquery, cancelquery, changequery, getquery, u_confirmquery, y_confirmquery } from './query.mjs'

export function confirm(event_data){
    let errmessage = message()
    //データを取りだす
    let bufferData = fs.readFileSync('kakunin.json')
    // データを文字列に変換
    let dataJSON = bufferData.toString()
    //JSONのデータをJavascriptのオブジェクトに
    let data = JSON.parse(dataJSON)
    let data_message = []
    data[0].contents.contents = []

    let basequery = b_confirmquery()

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(basequery.query_base)
                .then((res) => {
                    let event_cd = res.rows[0].event_cd

                    let userquery = u_confirmquery(event_data.event.source.userId, event_cd)
                    return Promise.all([client.query(userquery.query_user), event_cd])

                }).then(([res, event_cd]) => {
                    console.log("res.rows", res.rows);
                    let yoyakuquery = y_confirmquery(res.rows[0].user_id, event_cd)

                    return client.query(yoyakuquery.query_yoyaku)
                }).then((res) => {
                    //繰り返し出る固定値は設定へ
                    let count = Number(process.env.MESSAGE_COUNT) * 2
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

                            let F_SformattedTime = time_format(res.rows[i].first_start_time)
                            let F_EformattedTime = time_format(res.rows[i].first_end_time)
                            let S_SformattedTime = time_format(res.rows[i].second_start_time)
                            let S_EformattedTime = time_format(res.rows[i].second_end_time)

                            let EventJson = JSON.parse(dataJSON)[0].contents.contents[0]
                            EventJson.header.contents[0].text = res.rows[i].event_nm + '/' + res.rows[i].kaisaiti_nm + '会場'
                            EventJson.body.contents[0].text = result.formattedDate

                            if(result.dataDate == f_result.dataDate){
                                EventJson.body.contents[1].text = '開催時間　' + F_SformattedTime.formattedTime + '～' + F_EformattedTime.formattedTime
                                EventJson.footer.contents[1].action.initial = F_SformattedTime.formattedTime
                                EventJson.footer.contents[1].action.min = F_SformattedTime.formattedTime
                                EventJson.footer.contents[1].action.max = F_EformattedTime.formattedTime
                            }
                            else{
                                EventJson.body.contents[1].text = '開催時間　' + S_SformattedTime.formattedTime + '～' + S_EformattedTime.formattedTime
                                EventJson.footer.contents[1].action.initial = S_SformattedTime.formattedTime
                                EventJson.footer.contents[1].action.min = S_SformattedTime.formattedTime
                                EventJson.footer.contents[1].action.max = S_EformattedTime.formattedTime
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

                    if(row == 0)
                    {
                        event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.confirm_errmessage))
                    }
                    else{
                        event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, data_message))
                    }
                    
                }).catch((e) => {
                    console.error(e.stack)

                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.errmessage))
                })
            }
        })
}

export function cancel(event_data){
    let get_query = getquery(event_data.event.postback.data.split('=')[1])

    let cancel_query = cancelquery(event_data.event.postback.data.split('=')[1])

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(get_query.query_get)
                .then((res) => {
                    let event_cd = res.rows[0].event_cd
                    let kaisaiti_cd = res.rows[0].kaisaiti_cd  
                    
                    return Promise.all([client.query(cancel_query.query_delete), event_cd, kaisaiti_cd])
                }).then(([res, event_cd, kaisaiti_cd]) => {

                    console.log('Data Deleted.')

                    let cancelmessage = message() 
                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, cancelmessage.cancel_message))

                    graph(event_cd, kaisaiti_cd, event_data.event.postback.data.split('=')[2].replace(/\//g, '_'), client, event_data.graphDir)
                       
                })
                .catch((e) => {
                    console.error(e.stack)
                })
        }
    })
}

export function change(event_data){
    let change_query = changequery(event_data.event.postback.data.split('=')[2] + ' ' + event_data.event.postback.params.time + ':00.000', event_data.event.postback.data.split('=')[1])

    event_data.client.connect(function (err, client) {
        if (err) {
            console.log(err)
        } else {
            client
                .query(change_query.query_change)
                .then(() => {
                    console.log('Data Updated.')

                    let changemessage = message()
    
                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, changemessage.change_message))     

                    let get_query = getquery(event_data.event.postback.data.split('=')[1])

                    return client.query(get_query.query_get)
                }).then((res) => {

                    let event_cd = res.rows[0].event_cd
                    let kaisaiti_cd = res.rows[0].kaisaiti_cd

                    graph(event_cd, kaisaiti_cd, event_data.event.postback.data.split('=')[2].replace(/\//g, '_'), client, event_data.graphDir)
                        
                })
                .catch((e) => {
                    console.error(e.stack)
                })
        }
    })
}