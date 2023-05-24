import moment from 'moment'
import { createCanvas } from 'canvas'
import Chart from 'chart.js/auto'
import fs from 'fs'
import getRandomValues from 'get-random-values'
import { graphquery, graphtimequery } from './query.mjs'

//  グラフ作成
export function graph(event_cd, kaisaiti_cd, g_date, client, graphDir){
    let time_query = graphtimequery(g_date, event_cd, kaisaiti_cd)

    client.query(time_query.query_time)
        .then((res) => {
            
            let row
            if(res.rows[0].case.minutes && res.rows[0].case.minutes != '00'){
                row = Math.ceil((res.rows[0].case.hours + 1) / 2)
            }
            else{
                row = Math.ceil(res.rows[0].case.hours / 2)
            }

            let select = ""
            let selectdata = ""
            let start = res.rows[0].start
            let startTime = moment(start, 'HH:mm:ss');
            let end 
            let first = 0

            for (let i = 0; i < row; i++) {
                startTime.add(2, 'hours');
                end = startTime.format('HH:mm:ss')

                select = 
                "( SELECT" +
                "      SUM(reserve_a_count) + SUM(reserve_c_count) " +
                "  FROM" +
                "      t_yoyaku " +
                "  WHERE" +
                "      reserve_time BETWEEN '" + g_date + " " + start + "' AND '" + g_date + " " + end  + "') as " + '"' + start.slice(0,5) + '~"'

                if(first != 0){
                    select  = ',' + select
                }
                selectdata = selectdata + select                                            
                first = 1
                start = end
            }

            let graph_query = graphquery(selectdata, event_cd)

            client.query(graph_query.query_graph)
            .then((res) => { 
                let canvas = createCanvas(400, 400);
                let ctx = canvas.getContext('2d');

                let graphdata = {
                datasets: [{
                    label: '来場者予定グラフ',
                    data: res.rows[0],
                    backgroundColor: [
                    'rgba(255, 99, 132, 0.2)'
                    ],
                    borderColor: [
                    'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1,
                }]
                }; 
                
                let chart = new Chart(ctx, {
                type: 'bar',
                data: graphdata,
                options: {
                    scales: {
                        y: {
                            display: false
                        },
                        x: {
                            display: true
                        }
                    },
                    plugins: {
                        legend: {
                        display: false,
                        },
                        }
                    }
                })

                let file = kaisaiti_cd + g_date

                let out = fs.createWriteStream(graphDir + '/' + file +'.png');
                let stream = canvas.createPNGStream();
                stream.pipe(out);
            })
        })
}

//  日時編集
export function date_format(previous_date){
    let date = new Date(previous_date)
    let year = date.getFullYear()
    let month = (date.getMonth() + 1).toString().padStart(2, '0')
    let day = (date.getDate()).toString().padStart(2, '0')
    let dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
    let formattedDate = `${year}年${month}月${day}日（${dayOfWeek}）`
    let dataDate = `${year}/${month}/${day}`
    let dataTime = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' })
    let dataDate_id = `${month}/${day}`

    return {
        formattedDate: formattedDate,
        dataDate: dataDate,
        dataTime: dataTime,
        dataDate_id : dataDate_id
    }
}

//  ランダム文字列成形
export function random(){
    //画像ファイル名としてランダムな文字列作成
    let S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let array = new Uint8Array(16)
    let file = Array.from(getRandomValues(array)).map((n) => S[n % S.length]).join('')

    return {
        file : file
    }
}

export function time_format(time){
    let datetime = new Date('2023-04-01T' + time)
    let formattedTime = datetime.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' }) 

    return {
        formattedTime: formattedTime
    }
}