//画像ファイル名としてランダムな文字列作成
let S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
let array = new Uint8Array(16)
let QRfile = Array.from(getRandomValues(array)).map((n) => S[n % S.length]).join('')
console.log(getRandomValues(array))

let lifeTime = new Date().setHours(new Date().getHours() + LIFE_TIME)
let newTime = date_fns_timezone.formatToTimeZone(lifeTime, FORMAT, { timeZone: TIME_ZONE_TOKYO})

let query_kigen = {
    text: 'UPDATE m_user' +
        '   SET qr_expiration_date = $1' +
        ' WHERE user_id = $2',
    values: [newTime, event.source.userId],
}

let userid
client.connect(function (err, client) {
    if (err) {
        console.log(err)
    } else {
        client
            .query(query_kigen)
            .then(() => {
                console.log('Data Updated.')

                let query = {
                    text: "SELECT user_id, qr_expiration_date" + 
                          "  FROM m_user m1" +
                          " INNER JOIN m_event_base e1" +
                          "    ON m1.event_cd = e1.event_cd" +
                          " WHERE user_id = $1",
                    values: [event.source.userId],
                }

                client.query(query)
                    .then((res) => {
                        userid = res.rows[0].user_id

                        //フォルダに保存
                        QRCode.toFile(path.join(imageDir, QRfile + '.png'), userid, (error) => {
                            if (error) {
                                console.error(error)
                                return
                            }

                            //ファイルのURLを生成し送信・拡張子注意
                            let message = {
                                type: "image",
                                originalContentUrl: 'https://' + req.get('host') + '/' + QRfile + '.png',
                                previewImageUrl: 'https://' + req.get('host') + '/' + QRfile + '.png'
                            }

                            let addmessage = {
                                type: 'text',
                                text: 'イベント受付にてご提示ください'
                            }

                            let date = new Date(res.rows[0].qr_expiration_date)
                            let month = ('0' + (date.getMonth() + 1)).slice(-2)
                            let day = ('0' + date.getDate()).slice(-2)
                            let dataDate = `${month}/${day}`
                            let formattedTime = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: 'numeric' }) // ロケールに基づいた形式の時間に変換する

                            let addmessage2 = {
                                type: 'text',
                                text: '有効期限：' + dataDate + " " + formattedTime
                            };
            
                            events_processed.push(bot.replyMessage(event.replyToken, [message, addmessage, addmessage2])) 
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
            .catch((e) => {
                console.error(e.stack)
                let errmessage = {
                    type: "text",
                    text: "お客様情報が未登録です。"
                }
                events_processed.push(bot.replyMessage(event.replyToken, errmessage))
            })
    }
})