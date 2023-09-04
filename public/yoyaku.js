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
            const diaplayEventName = document.getElementById('event_nm');
            const diaplayKaisaiNm = document.getElementById('kaisai_nm');
            const diaplayKaisaiDay = document.getElementById('kaisaiDay');
            const diaplayKaisaiStartTime = document.getElementById('kaisaiStartTime');
            const diaplayKaisaiEndTime = document.getElementById('kaisaiEndTime');
            const diaplayKaisaiDate = document.getElementById('kaisaiDateDisplay');
            diaplayEventName.value = urlQuery.event_nm;
            diaplayKaisaiNm.value = urlQuery.kaisaiti_nm;
            let kaisaiDate = new Date(urlQuery.kaisaiDay);
            let kaisaiStartArray = urlQuery.kaisaiStartTime.split(":");
            let kaisaiEndArray = urlQuery.kaisaiEndTime.split(":");
            let kaisaiStartDate = new Date(kaisaiDate.getFullYear(), kaisaiDate.getMonth(), kaisaiDate.getDate(), kaisaiStartArray[0], kaisaiStartArray[1], kaisaiStartArray[2]);
            let kaisaiEndDate = new Date(kaisaiDate.getFullYear(), kaisaiDate.getMonth(), kaisaiDate.getDate(), kaisaiEndArray[0], kaisaiEndArray[1], kaisaiEndArray[2]);
            diaplayKaisaiDay.value = kaisaiDate.toString();
            diaplayKaisaiStartTime.value = kaisaiStartDate.toString();
            diaplayKaisaiEndTime.value = kaisaiEndDate.toString();
            diaplayKaisaiDate.value = kaisaiDate.getFullYear() + "-" + (kaisaiDate.getMonth() + 1).toString().padStart(2, '0') + "-" + kaisaiDate.getDate().toString().padStart(2, '0');

            // 予約時間の制御
            const diaplayReserveTime = document.getElementById('reserveTime');
            diaplayReserveTime.min = kaisaiStartArray[0] + ":" + kaisaiStartArray[1];
            diaplayReserveTime.max = kaisaiEndArray[0] + ":" + kaisaiEndArray[1];

            if (!urlQuery.yoyaku_id) {
              // URLパラメータの値を設定
              const diaplayEventCd = document.getElementById('event_cd');
              const diaplayKaisaitiCd = document.getElementById('kaisaiti_cd');
              diaplayEventCd.value = urlQuery.event_cd;
              diaplayKaisaitiCd.value = urlQuery.kaisaiti_cd;
            } else {
              const getYoyakuInfo_jsonData = JSON.stringify({
                yoyaku_id: urlQuery.yoyaku_id
              });

              fetch('/getYoyakuInfo', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: getYoyakuInfo_jsonData,
                creadentials: 'same-origin'
              }).then(yoyaku => {
                yoyaku.json()
                  .then(yoyakuJson => {
                    // URLパラメータの値を設定
                    const diaplayYoyakuId = document.getElementById('yoyakuId');
                    diaplayYoyakuId.value = urlQuery.yoyaku_id;

                    // 取得した予約情報の値を設定
                    const diaplayEventCd = document.getElementById('event_cd');
                    const diaplayKaisaitiCd = document.getElementById('kaisaiti_cd');
                    const diaplayReserveTime = document.getElementById('reserveTime');
                    const diaplayACount = document.getElementById('aCount');
                    const diaplayCCount = document.getElementById('cCount');

                    let yoyakuDate = new Date(yoyakuJson.reserve_time);
                    diaplayReserveTime.value = yoyakuDate.getHours().toString().padStart(2, '0') + ":" + yoyakuDate.getMinutes().toString().padStart(2, '0');
                    diaplayEventCd.value = yoyakuJson.event_cd;
                    diaplayKaisaitiCd.value = yoyakuJson.kaisaiti_cd;
                    diaplayACount.value = yoyakuJson.reserve_a_count;
                    diaplayCCount.value = yoyakuJson.reserve_c_count;

                  }).catch((e) => {
                    console.log(e);
                    stopload();
                  });
              }).catch((err) => {
                console.log(err);
                stopload();
              });
            }

            document.getElementById('wrap').style.display = 'block';
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

  let kaisaiDate = new Date(urlQuery.kaisaiDay);
  let reserveTimeArray = form.reserveTime.value.split(":");
  let reserveDate = new Date(kaisaiDate.getFullYear(), kaisaiDate.getMonth(), kaisaiDate.getDate(), reserveTimeArray[0], reserveTimeArray[1], "00");

  let year = reserveDate.getFullYear();
  let month = (reserveDate.getMonth() + 1).toString().padStart(2, '0');
  let day = reserveDate.getDate().toString().padStart(2, '0');
  let hours = reserveDate.getHours().toString().padStart(2, '0');
  let minutes = reserveDate.getMinutes().toString().padStart(2, '0');
  let seconds = "00.000";

  if (form.yoyakuId.value) {
    // 予約更新
    const jsonData = JSON.stringify({
      yoyaku_id: form.yoyakuId.value,
      reservetime: year + "/" + month + "/" + day + " " + hours + ":" + minutes + ":" + seconds,
      aCount: form.aCount.value,
      cCount: form.cCount.value
    });

    fetch('/updateYoyakuInfo', {
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
  } else {
    // 予約追加
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

    fetch('/addYoyakuInfo', {
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
            document.getElementById('toroku_btn').style.display = 'none';
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

  
}

document.addEventListener("DOMContentLoaded", function () {
  var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

  document.getElementById('wrap').style.display = 'none';
  document.getElementById('wrap_web').style.display = 'none';
  document.getElementById('succesLbl').style.display = 'none';
  document.getElementById('failedLbl').style.display = 'none';
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