
// 読込
window.onload = () => {
    //const myLiffId = '1660891355-wrO0ydxA';
    const myLiffId = '1660863634-BnGNVK4d';

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
                        const displayCompanyName = document.getElementById('tokuisaki_nm');
                        const displayContactPerson = document.getElementById('tokuisaki_cd');
                        displayName.value = json.user_nm;
                        displayUserId.value = json.user_id;
                        displayCompanyName.value = json.tokuisaki_nm;
                        displayContactPerson.value = json.tokuisaki_cd;

                        stopload();
                    })
            }).catch((e) => {
                console.log(e);
                stopload();
            });

        }).catch((err) => {
            console.log(err);
            stopload();
        });
    }
}

// submitイベント取得のため
let from = document.getElementById('form');
form.onsubmit = function (event) {
    document.getElementById('toroku_btn').disabled = "disabled";
    if (!form.tokuisaki_nm.value && form.user_nm.value && form.tokuisaki_cd.value) {
        document.getElementById('toroku_btn').disabled = "disabled";
        return;
    }
    event.preventDefault();
    const jsonData = JSON.stringify({
        tokuisaki_nm: form.tokuisaki_nm.value,
        user_nm: form.user_nm.value,
        tokuisaki_cd: form.tokuisaki_cd.value,
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
                document.getElementById('succesLbl').style.display = 'block';
                document.getElementById('failedLbl').style.display = 'none';
                document.getElementById('toroku_btn').disabled = null;
            })
    }).catch((e) => {
        console.log(e);
        document.getElementById('succesLbl').style.display = 'none';
        document.getElementById('failedLbl').style.display = 'block';
        document.getElementById('toroku_btn').disabled = null;
    });
}

document.addEventListener("DOMContentLoaded", function () {
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    document.getElementById('wrap').style.display = 'none';
    document.getElementById('succesLbl').style.display = 'none';
    document.getElementById('failedLbl').style.display = 'none';
    document.getElementById('loading').style.height = h + "px";
    document.getElementById('loading').style.display = 'block';
    document.getElementById('spinner').style.height = h + "px";
    document.getElementById('spinner').style.display = 'block';
});

function stopload() {
    document.getElementById('wrap').style.display = 'block';
    setTimeout(function () {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('spinner').style.display = 'none';
    }, 500);
}
