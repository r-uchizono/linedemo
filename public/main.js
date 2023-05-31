
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

document.addEventListener("DOMContentLoaded", function () {
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    document.getElementById('wrap').style.display = 'none';
    document.getElementById('loading').style.height = h + "px";
    document.getElementById('loading').style.display = 'block';
    document.getElementById('spinner').style.height = h + "px";
    document.getElementById('spinner').style.display = 'block';
});

window.addEventListener('load', function () {
    document.getElementById('wrap').style.display = 'block';
    setTimeout(function () {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('spinner').style.display = 'none';
    }, 500);
});

// 5秒たったら強制的にロード画面を非表示
setTimeout(function () {
    stopload();
}, 5000);

function stopload() {
    document.getElementById('wrap').style.display = 'block';
    setTimeout(function () {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('spinner').style.display = 'none';
    }, 500);
}
