import fs from 'fs'
import {date_format, random, graph, time_format} from './common.mjs'
import {message} from './message.mjs'
import { b_eventquery, countquery, e_eventquery, getentryquery, entryquery, setidquery, u_eventquery } from './query.mjs'
import date_fns_timezone from 'date-fns-timezone'
import * as dotenv from 'dotenv'

dotenv.config()

const FORMAT = 'YYYY/MM/DD HH:mm:ss'
const TIME_ZONE_TOKYO = 'Asia/Tokyo'

export function list(event_data) {
    console.log('function list Start▼')
    console.log('接続前 totalCount:' + event_data.client.totalCount + ' idleCount:' + event_data.client.idleCount + ' waitingCount:' + event_data.client.waitingCount)
    let errmessage = message()
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
        console.log('接続後 totalCount:' + event_data.client.totalCount + ' idleCount:' + event_data.client.idleCount + ' waitingCount:' + event_data.client.waitingCount)
        if (err) {
            console.log('DBConnectError:', err)
            console.log('function list End▲')
        } else {
            console.log('DBConnectSuccess')
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

                            let address = res.rows[i].place_address

                            if(new_result.dataDate <= f_result.dataDate){

                                let firstEventJson = JSON.parse(dataJSON)[0].contents.contents[0]
                                firstEventJson.header.contents[0].text = event_nm + '/' + res.rows[i].kaisaiti_nm + '会場'
                                firstEventJson.body.contents[0].text = f_result.formattedDate
                                firstEventJson.body.contents[1].text = '開催時間　' + F_SformattedTime.formattedTime + '～' + F_EformattedTime.formattedTime
                                firstEventJson.body.contents[2].text = '場所　' + res.rows[i].place_name
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
                                else
                                {
                                    firstEventJson.footer.contents[0].action.uri = "https://liff.line.me/1661543487-qvPZ7elR?event_cd=" + res.rows[i].event_cd + "&event_nm=" + encodeURIComponent(event_nm) + "&kaisaiti_cd=" + res.rows[i].kaisaiti_cd + "&kaisaiti_nm=" + encodeURIComponent(res.rows[i].kaisaiti_nm) + "&kaisaiDay=" + encodeURIComponent(res.rows[i].first_day) + "&kaisaiStartTime=" + res.rows[i].first_start_time + "&kaisaiEndTime=" + res.rows[i].first_end_time
                                }
                                                                    
                                let f_file = res.rows[i].kaisaiti_cd + f_result.dataDate.replace(/\//g, '_')

                                firstEventJson.hero.url = 'https://' + process.env.HOST_NAME + '/' + f_file + '.png?xxx=' + random_data.file 
                                // firstEventJson.hero.url = 'https://' + event_data.req.get('host') + '/' + f_file + '.png?xxx=' + random_data.file 

                                data[0].contents.contents.push({ ...firstEventJson })
                            }

                            if (res.rows[i].second_day != null) {

                                let s_result = date_format(res.rows[i].second_day)

                                if(new_result.dataDate <= s_result.dataDate){

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
                                    else
                                    {
                                        secondEventJson.footer.contents[0].action.uri = "https://liff.line.me/1661543487-qvPZ7elR?event_cd=" + res.rows[i].event_cd + "&event_nm=" + encodeURIComponent(event_nm) + "&kaisaiti_cd=" + res.rows[i].kaisaiti_cd + "&kaisaiti_nm=" + encodeURIComponent(res.rows[i].kaisaiti_nm) + "&kaisaiDay=" + encodeURIComponent(res.rows[i].second_day) + "&kaisaiStartTime=" + res.rows[i].second_start_time + "&kaisaiEndTime=" + res.rows[i].second_end_time
                                    }
                                    
                                    let s_file = res.rows[i].kaisaiti_cd + s_result.dataDate.replace(/\//g, '_')

                                    secondEventJson.hero.url = 'https://' + process.env.HOST_NAME + '/' + s_file + '.png?xxx=' + random_data.file
                                    // secondEventJson.hero.url = 'https://' + event_data.req.get('host') + '/' + s_file + '.png?xxx=' + random_data.file
                                    data[0].contents.contents.push({ ...secondEventJson })
                                    }
                            }
                        }

                        data_message.push({ ...data[0] })
                        data = JSON.parse(dataJSON)
                        data[0].contents.contents = []
                    }

                    if(row == 0)
                    {
                        event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.noenent_errmessage))
                    }
                    else{
                        event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, data_message))
                    }
                    client.release();
                    console.log('切断後 totalCount:' + event_data.client.totalCount + ' idleCount:' + event_data.client.idleCount + ' waitingCount:' + event_data.client.waitingCount)
                    console.log('function list End▲')
                }).catch((e) => {
                    console.error(e.stack)
                    console.log('切断後 totalCount:' + event_data.client.totalCount + ' idleCount:' + event_data.client.idleCount + ' waitingCount:' + event_data.client.waitingCount)
                    console.log('function list End▲')
                    event_data.events_processed.push(event_data.bot.replyMessage(event_data.event.replyToken, errmessage.errmessage))
                    client.release();
                })
                
        }
    })
}