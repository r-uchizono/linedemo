var urlQuery = "";
// 読込
window.onload = () => {
  urlQuery = (function () {
    var queryString, queryItems, queryItem,
      i, length, matchs, key, pkey, skey, value, list, hash, params = {};

    // クエリストリングの取得
    queryString = decodeURIComponent(window.location.search) || '';
    queryString = queryString.substr(1, queryString.length);

    // パラメター毎に分解
    queryItems = queryString.split('&');

    // 各パラメターをキー&バリューに分解
    for (i = 0, length = queryItems.length; i < length; i++) {
      // 1組取り出し
      queryItem = (queryItems[i] || '').split('=');

      // キー&バリューに分解
      key = queryItem[0];
      value = queryItem[1] ? window.decodeURIComponent(queryItem[1]) : undefined;

      // キー文字列によってオブジェクトの作り方を変える
      matchs = (/([\w$]*)\[([\w$]*)\]/g).exec(key);
      if (matchs === null) {
        // 単純なキー&バリュー
        params[key] = value;
      } else {
        pkey = matchs[1];
        skey = matchs[2];
        if (!skey) {
          // 配列にバリューを格納
          list = params[pkey] = params[pkey] || [];
          list[list.length] = value;
        } else {
          // ハッシュにサブキーとバリューを格納
          hash = params[pkey] = params[pkey] || {};
          hash[skey] = value;
        }
      }
    }

    return params;
  })();
  const myLiffId = '1661543487-qvPZ7elR';

  //LIFFで立ち上げているかどうかの判定
  if (liff.isInClient()) {
    liff.init({
      liffId: myLiffId,
      withLoginOnExternalBrowser: true,
    }).then(() => {
      //idトークンによる年齢情報の取得
      const idToken = liff.getIDToken();
      if (!urlQuery.yoyakuId) {
        const jsonData = JSON.stringify({
          id_token: idToken,
          event_cd: urlQuery.event_cd
        });
        fetch('/getYoyakuUserInfo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: jsonData,
          creadentials: 'same-origin'
        }).then(res => {
          res.json()
            .then(json => {
              // 取得したユーザーの値を設定
              const diaplayUserId = document.getElementById('user_id');
              const diaplayUserNm = document.getElementById('user_nm');
              const diaplayTokuisakiCd = document.getElementById('tokuisaki_cd');
              const diaplayTokuisakiNm = document.getElementById('tokuisaki_nm');
              const diaplayTantoCd = document.getElementById('tanto_cd');
              const diaplayTantoNm = document.getElementById('tanto_nm');
              diaplayUserId.value = json.user_id;
              diaplayUserNm.value = json.user_nm;
              diaplayTokuisakiCd.value = json.tokuisaki_cd;
              diaplayTokuisakiNm.value = json.tokuisaki_nm;
              diaplayTantoCd.value = json.tanto_cd;
              diaplayTantoNm.value = json.tanto_nm;

              // URLパラメータの値を設定
              const diaplayEventCd = document.getElementById('event_cd');
              const diaplayEventName = document.getElementById('event_nm');
              const diaplayKaisaitiCd = document.getElementById('kaisaiti_cd');
              const diaplayKaisaiNm = document.getElementById('kaisai_nm');
              const diaplayKaisaiDay = document.getElementById('kaisaiDay');
              const diaplayKaisaiStartTime = document.getElementById('kaisaiStartTime');
              const diaplayKaisaiEndTime = document.getElementById('kaisaiEndTime');
              diaplayEventCd.value = urlQuery.event_cd;
              diaplayEventName.value = urlQuery.event_nm;
              diaplayKaisaitiCd.value = urlQuery.kaisaiti_cd;
              diaplayKaisaiNm.value = urlQuery.kaisaiti_nm;
              var kaisaiDate = new Date(urlQuery.kaisaiDay);
              var kaisaiStartArray = urlQuery.kaisaiStartTime.split(":");
              var kaisaiEndArray = urlQuery.kaisaiEndTime.split(":");
              var kaisaiStartDate = new Date(kaisaiDate.getFullYear(), kaisaiDate.getMonth(), kaisaiDate.getDate(), kaisaiStartArray[0], kaisaiStartArray[1], kaisaiStartArray[2]);
              var kaisaiEndDate = new Date(kaisaiDate.getFullYear(), kaisaiDate.getMonth(), kaisaiDate.getDate(), kaisaiEndArray[0], kaisaiEndArray[1], kaisaiEndArray[2]);
              diaplayKaisaiDay.value = kaisaiDate.toString();
              diaplayKaisaiStartTime.value = kaisaiStartDate.toString();
              diaplayKaisaiEndTime.value = kaisaiEndDate.toString();

              // 予約時間の制御
              const diaplayReserveTime = document.getElementById('reserveTime');
              diaplayReserveTime.min = kaisaiStartArray[0] + ":" + kaisaiStartArray[1];
              diaplayReserveTime.max = kaisaiEndArray[0] + ":" + kaisaiEndArray[1];

              document.getElementById('wrap').style.display = 'block';
              stopload();
            })
        }).catch((e) => {
          console.log(e);
          stopload();
        });
      } else {
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
              const diaplayEventCd = document.getElementById('event_cd');
              const diaplayEventName = document.getElementById('event_nm');
              const diaplayKaisaitiCd = document.getElementById('kaisaiti_cd');
              const diaplayKaisaiStartTime = document.getElementById('kaisaiStartTime');
              const diaplayKaisaiEndTime = document.getElementById('kaisaiEndTime');
              diaplayEventCd.value = urlQuery.event_cd;
              diaplayEventName.value = urlQuery.event_nm;
              diaplayKaisaitiCd.value = urlQuery.kaisaiti_cd;
              diaplayKaisaiStartTime.value = urlQuery.kaisaiStartTime;
              diaplayKaisaiEndTime.value = urlQuery.kaisaiEndTime;

              document.getElementById('wrap').style.display = 'block';
              stopload();
            })
        }).catch((e) => {
          console.log(e);
          stopload();
        });

      }

    }).catch((err) => {
      console.log(err);
      stopload();
    });
  } else {
    document.getElementById('wrap_web').style.display = 'block';
    stopload();
  }
}

// submitイベント取得のため
let from = document.getElementById('form');
form.onsubmit = function (event) {
  document.getElementById('toroku_btn').disabled = "disabled";
  event.preventDefault();

  var kaisaiDate = new Date(urlQuery.kaisaiDay);
  var reserveTimeArray = form.reserveTime.value.split(":");
  var reserveDate = new Date(kaisaiDate.getFullYear(), kaisaiDate.getMonth(), kaisaiDate.getDate(), reserveTimeArray[0], reserveTimeArray[1], "00");

  var year = reserveDate.getFullYear();
  var month = (reserveDate.getMonth() + 1).toString().padStart(2, '0');
  var day = reserveDate.getDate().toString().padStart(2, '0');
  var hours = reserveDate.getHours().toString().padStart(2, '0');
  var minutes = reserveDate.getMinutes().toString().padStart(2, '0');
  var seconds = "00.000";

  const jsonData = JSON.stringify({
    event_cd: form.event_cd.value,
    kaisaicd: form.kaisaiti_cd.value,
    user_id: form.user_id.value,
    user_nm: form.user_nm.value,
    tcd: form.tokuisaki_cd.value,
    tname: form.tokuisaki_nm.value,
    incd: form.tanto_cd.value,
    inname: form.tanto_nm.value,
    reservetime: year + "/" + month + "/" + day + " " + hours + ":" + minutes + ":" + seconds,
    aCount: form.aCount.value,
    cCount: form.cCount.value
  });

  let apiString = '/addYoyakuInfo';

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
        if (json.status == "OK") {
          document.getElementById('succesLbl').style.display = 'block';
          document.getElementById('failedLbl').style.display = 'none';
          document.getElementById('toroku_btn').disabled = null;
        } else {
          document.getElementById('succesLbl').style.display = 'none';
          document.getElementById('failedLbl').style.display = 'block';
          document.getElementById('toroku_btn').disabled = null;
        }
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
  document.getElementById('wrap_web').style.display = 'none';
  document.getElementById('succesLbl').style.display = 'none';
  document.getElementById('failedLbl').style.display = 'none';
  document.getElementById('succesLbl2').style.display = 'none';
  document.getElementById('failedLbl2').style.display = 'none';
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