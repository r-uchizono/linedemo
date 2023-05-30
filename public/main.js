
window.onload = () => {
    const myLiffId = '1660891355-wrO0ydxA';

    //p要素の取得
    //LIFFで立ち上げているかどうかの判定
    if (liff.isInClient()) {
        liff.init({
            liffId: myLiffId,
            withLoginOnExternalBrowser: true,
        }).then(() => {
            //idトークンによる年齢情報の取得
            const idToken = liff.getIDToken();
            const jsonData = JSON.stringify({
                id_token: idToken
            });

            fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonData,
                creadentials: 'same-origin'
            }).then(res => {
                res.json()
                    .then(json => {
                        const displayName = document.getElementById('user_nm');
                        const displayUserId = document.getElementById('user_id');
                        const displayCompanyName = document.getElementById('torihikisa_nm');
                        const displayContactPerson = document.getElementById('torihikisa_cd');
                        displayName.value = json.user_nm;
                        displayUserId.value = json.user_id;
                        displayCompanyName.value = json.torihikisa_nm;
                        displayContactPerson.value = json.torihikisa_cd;

                        const loader = document.getElementById('loader');
                        loader.classList.add('loaded');
                    })
            }).catch((e) => {
                console.log(e);
                const loader = document.getElementById('loader');
                loader.classList.add('loaded');
            });

        }).catch((err) => {
            console.log(err);
            const loader = document.getElementById('loader');
            loader.classList.add('loaded');
        });
    }
}

let from = document.getElementById('form');
form.onsubmit = function (event) {
    event.preventDefault();
    const jsonData = JSON.stringify({
        torihikisa_nm: form.torihikisa_nm.value,
        user_nm: form.user_nm.value,
        torihikisa_cd: form.torihikisa_cd.value,
        user_id: form.user_id.value,
    });

    fetch('/toroku', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: jsonData,
        creadentials: 'same-origin'
    }).then(res => {
        res.json()
            .then(json => {
                alert("OK");
            })
    }).catch(e => console.log(e));
}
//const liffId = "1660891355-wrO0ydxA";
//liff.init({
//    liffId: liffId,
//    withLoginOnExternalBrowser: true,
//}).then(() => {
//    getProfile();
//}).catch((err) => {
//    alert(err);
//})

//let query = {
//    text: "SELECT *" +
//        "  FROM m_event_base" +
//        " WHERE current_date BETWEEN start_ymd AND end_ymd" +
//        "    OR current_date < start_ymd" +
//        " ORDER BY start_ymd"
//}

//client
//    .query(query)
//    .then((res) => {
//        console.log('処理１');
//    });

function getProfile() {
    liff.getProfile()
        .then((profile) => {
            const name = profile.displayName;
            const displayName = document.getElementById('customerName');
            const displayUserId = document.getElementById('userId');
            displayName.value = name;
            displayUserId.value = profile.userId;
        })
        .catch((err) => {
            alert(err)
        });
}

//function sendMessage(message) {
//    liff
//        .sendMessages([
//            {
//                type: "text",
//                text: message,
//            },
//        ])
//        .then(() => {
//            alert("message sent");
//        })
//        .catch((err) => {
//            alert(err);
//        });
//}

//function scanCode() {
//    liff
//        .scanCodeV2()
//        .then((result) => {
//            alert(result);
//        })
//        .catch((err) => {
//            alert(err);
//        });
//}
//function friendshipFlag() {
//    liff.getFriendship().then((data) => {
//        alert(data.friendFlag);
//    })
//        .catch((err) => {
//            alert(err);
//        });
//}
