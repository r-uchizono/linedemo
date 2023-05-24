export function message(){
    let info_errmessage = {
        type: "text",
        text: "本日実施のイベントはありません。"
    }

    let errmessage = {
        type: "text",
        text: "お客様情報が未登録です。"
    }

    let event_message = {
        type: 'text',
        text: '予約が完了しました'
    }

    let cancel_message = {
        type: 'text',
        text: '取消が完了しました'
    }

    let change_message = {
        type: 'text',
        text: '変更が完了しました'
    }

    let qr_message = {
        type: 'text',
        text: 'イベント受付にてご提示ください'
    }

    let qr_errmessage = {
        type: 'text',
        text: 'QRコードを取得できませんでした'
    }

    return{
        info_errmessage : info_errmessage,
        errmessage : errmessage,
        event_message : event_message,
        cancel_message : cancel_message,
        change_message : change_message,
        qr_message : qr_message,
        qr_errmessage : qr_errmessage
    }
}

export function arg_message(argument){
    let life_message = {
        type: 'text',
        text: argument
    }

    let info_message = {
        type: "text",
        text: argument
    }

    return{
        life_message : life_message,
        info_message : info_message,
    }    
}