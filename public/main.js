// ���W���[���̃C���|�[�g
//import express from 'express';
////import './style.css';
////import liff from '@line/liff';

////const idToken = liff.getIDToken();

////liff
////  .init({
////    liffId: import.meta.env.VITE_LIFF_ID
////  })
////  .then(() => {
////    document.querySelector('#app').innerHTML = `
////    <h1>create-liff-app</h1>
////    <p>LIFF init succeeded.</p>
////    <a href="https://developers.line.biz/ja/docs/liff/" target="_blank" rel="noreferrer">
////      LIFF Documentation
////    </a>
////  `;
////  })
////  .catch((error) => {
////    document.querySelector('#app').innerHTML = `
////    <h1>create-liff-app</h1>
////    <p>LIFF init failed.</p>
////    <p><code>${error}</code></p>
////    <a href="https://developers.line.biz/ja/docs/liff/" target="_blank" rel="noreferrer">
////      LIFF Documentation
////    </a>
////  `;
////  });


//// Web�T�[�o�[�ݒ�
//const app = express();

////�T�[�o�[�ƃ��[�J����ssl�̕������ς��
//const client = new Client({
//    user: "unis",
//    host: "dpg-cgvn4qodh87joksvpj70-a.oregon-postgres.render.com",
//    database: "event_f91d",
//    password: "gbFeZ4j0o2mXOlCdCw0qF4TMaYTkldcn",
//    port: "5432"
//})

/*const name = '���O���s���ł�';*/
window.onload = () => {
    const myLiffId = '1660891355-wrO0ydxA';

    //p�v�f�̎擾
    //LIFF�ŗ����グ�Ă��邩�ǂ����̔���
    if (liff.isInClient()) {
        liff.init({
            liffId: myLiffId,
            withLoginOnExternalBrowser: true,
        }).then(() => {
            //id�g�[�N���ɂ��N����̎擾
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
                        const displayName = document.getElementById('customerName');
                        const displayUserId = document.getElementById('userId');
                        const displayCompanyName = document.getElementById('companyName');
                        const displayContactPerson = document.getElementById('contactPerson');
                        displayName.value = json.customerName;
                        displayUserId.value = json.userId;
                        displayCompanyName.value = json.companyName;
                        displayContactPerson.value = json.contactPerson;
                    })
            }).catch(e => console.log(e));

            //getProfile();
        }).catch((err) => {
            alert(err);
        });
    }
}

//form�v�f��id�������擾���A�ϐ�form�ɑ��
let from = document.getElementById('form');
form.onsubmit = function (event) {
    event.preventDefault();
    console.log(form.userId.value)
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
//        console.log('�����P');
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

function sendMessage(message) {
    liff
        .sendMessages([
            {
                type: "text",
                text: message,
            },
        ])
        .then(() => {
            alert("message sent");
        })
        .catch((err) => {
            alert(err);
        });
}

function scanCode() {
    liff
        .scanCodeV2()
        .then((result) => {
            alert(result);
        })
        .catch((err) => {
            alert(err);
        });
}
function friendshipFlag() {
    liff.getFriendship().then((data) => {
        alert(data.friendFlag);
    })
        .catch((err) => {
            alert(err);
        });
}
