
// �Ǎ�
window.onload = () => {
  var urlQuery = (function () {
    var queryString, queryItems, queryItem,
      i, length, matchs, key, pkey, skey, value, list, hash, params = {};

    // �N�G���X�g�����O�̎擾
    queryString = window.location.search || '';
    queryString = queryString.substr(1, queryString.length);

    // �p�����^�[���ɕ���
    queryItems = queryString.split('&');

    // �e�p�����^�[���L�[&�o�����[�ɕ���
    for (i = 0, length = queryItems.length; i < length; i++) {
      // 1�g���o��
      queryItem = (queryItems[i] || '').split('=');

      // �L�[&�o�����[�ɕ���
      key = queryItem[0];
      value = queryItem[1] ? window.decodeURIComponent(queryItem[1]) : undefined;

      // �L�[������ɂ���ăI�u�W�F�N�g�̍�����ς���
      matchs = (/([\w$]*)\[([\w$]*)\]/g).exec(key);
      if (matchs === null) {
        // �P���ȃL�[&�o�����[
        params[key] = value;
      } else {
        pkey = matchs[1];
        skey = matchs[2];
        if (!skey) {
          // �z��Ƀo�����[���i�[
          list = params[pkey] = params[pkey] || [];
          list[list.length] = value;
        } else {
          // �n�b�V���ɃT�u�L�[�ƃo�����[���i�[
          hash = params[pkey] = params[pkey] || {};
          hash[skey] = value;
        }
      }
    }

    return params;
  })();
  const myLiffId = '1660863634-BnGNVK4d';

  console.log("testLog");
  //p�v�f�̎擾
  //LIFF�ŗ����グ�Ă��邩�ǂ����̔���
  if (liff.isInClient()) {
    liff.init({
      liffId: myLiffId,
      withLoginOnExternalBrowser: true,
    }).then(() => {
      //id�g�[�N���ɂ��N����̎擾
      const idToken = liff.getIDToken();
      console.log("urlQuery.kain_cd�F" + urlQuery.kain_cd);
      //if (!urlQuery.kain_cd) {
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
              const displayEventCd = document.getElementById('event_cd');
              const displayEigyoCd = document.getElementById('eigyo_cd');
              const displayAddFlg = document.getElementById('add_flg');
              if (!json.user_nm && !urlQuery.event_cd) {
                document.getElementById('form').style.display = 'none';
                document.getElementById('notQRlbl').style.display = 'block';
              } else {
                displayName.value = json.user_nm;
                displayUserId.value = json.user_id;
                displayCompanyName.value = json.tokuisaki_nm;
                displayContactPerson.value = json.tokuisaki_cd;
                displayEventCd.value = urlQuery.event_cd ? urlQuery.event_cd : json.event_cd;
                displayEigyoCd.value = urlQuery.eigyo_cd ? urlQuery.eigyo_cd : json.eigyo_cd;
                displayAddFlg.value = json.add_flg;
              }

              document.getElementById('wrap').style.display = 'block';
              stopload();
            })
        }).catch((e) => {
          console.log(e);
          stopload();
        });
      //} else {

      //  console.log("getTantoInfo");
      //  const jsonData = JSON.stringify({
      //    id_token: idToken,
      //    kain_cd: json.kain_cd
      //  });
      //  fetch('/getTantoInfo', {
      //    method: 'POST',
      //    headers: {
      //      'Content-Type': 'application/json'
      //    },
      //    body: jsonData,
      //    creadentials: 'same-origin'
      //  }).then(res => {
      //    res.json()
      //      .then(json => {
      //        const displayKainCd = document.getElementById('kain_cd');
      //        const displayTantoNm = document.getElementById('tanto_nm');
      //        const displayTantoId = document.getElementById('tanto_id');
      //        displayKainCd.value = json.id;
      //        displayTantoNm.value = json.name;
      //        displayTantoId.value = json.lineId;

      //        document.getElementById('wrap2').style.display = 'block';
      //        stopload();
      //      })
      //  }).catch((e) => {
      //    console.log(e);
      //    stopload();
      //  });
      //}

    }).catch((err) => {
      console.log(err);
      stopload();
    });
  } else {
    document.getElementById('wrap_web').style.display = 'block';
    stopload();
  }
}

// submit�C�x���g�擾�̂���
let from = document.getElementById('form');
form.onsubmit = function (event) {
  document.getElementById('toroku_btn').disabled = "disabled";
  event.preventDefault();
  const jsonData = JSON.stringify({
    tokuisaki_nm: form.tokuisaki_nm.value,
    user_nm: form.user_nm.value,
    tokuisaki_cd: form.tokuisaki_cd.value,
    user_id: form.user_id.value,
    event_cd: form.event_cd.value,
    eigyo_cd: form.eigyo_cd.value,
  });

  let apiString = form.add_flg.value === "1" ? '/toroku' : '/koshin';

  fetch(apiString, {
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
  document.getElementById('wrap2').style.display = 'none';
  document.getElementById('wrap_web').style.display = 'none';
  document.getElementById('succesLbl').style.display = 'none';
  document.getElementById('failedLbl').style.display = 'none';
  document.getElementById('notQRlbl').style.display = 'none';
  document.getElementById('loading').style.height = h + "px";
  document.getElementById('loading').style.display = 'block';
  document.getElementById('spinner').style.height = h + "px";
  document.getElementById('spinner').style.display = 'block';
});

function stopload() {
  setTimeout(function () {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('spinner').style.display = 'none';
  }, 500);
}