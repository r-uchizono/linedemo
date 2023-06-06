// お知らせメッセージ
export function b_infoquery(){
    let query = {
        text: "SELECT *" +
            "  FROM m_event_base" +
            " WHERE (current_date BETWEEN start_ymd AND end_ymd" +
            "    OR current_date < start_ymd)" +
            "   AND kaisai_flg = TRUE" +
            " ORDER BY start_ymd",
    }
    return{
        query_base : query
    }
}

export function u_infoquery(argument, argument2){
    let query = {
        text: "SELECT *" +
            "  FROM m_user" +
            " WHERE user_id = $1" +
            "   AND event_cd = $2",
        values: [argument, argument2],
    }
    return{
        query_user : query
    }
}

export function infoquery(argument){
    let query = {
        text: "SELECT naiyo"+
                "  FROM t_oshirase" +
                " WHERE kaisai_day = $1",
                values: [argument],
    }
    return{
        info_query : query
    }
}

// イベント一覧メッセージ
export function b_eventquery(){
    let query = {
        text: "SELECT *" +
            "  FROM m_event_base t1 " +
            " WHERE (current_date BETWEEN t1.start_ymd AND t1.end_ymd" +
            "    OR current_date < t1.start_ymd)" +
            "   AND t1.kaisai_flg = TRUE" +
            " ORDER BY t1.start_ymd",
    }
    return{
        query_base : query
    }
}

export function u_eventquery(argument, argument2){
    let query = {
        text: "SELECT *" +
            "  FROM m_user m1 " +
            "  LEFT OUTER JOIN" +
            "       m_eigyo_e e1" +
            "    ON m1.eigyo_cd = e1.eigyo_cd" +
            " WHERE m1.user_id = $1" +
            "   AND m1.event_cd = $2",
        values: [argument, argument2],
    }
    return{
        query_user : query
    }
}

export function e_eventquery(argument, argument2, argument3){
    let e_query = {
        text: "SELECT e1.*" +
            "     , k.kaisaiti_nm" +
            "     , t1.id as t1_id" +
            "     , t2.id as t2_id" +
            "  FROM m_event e1" +
            " INNER JOIN m_kaisaiti k" +
            "    ON e1.kaisaiti_cd = k.kaisaiti_cd" +
            "  LEFT OUTER JOIN" +
            "       m_event_eigyo e2" +
            "    ON k.kaisaiti_cd = e2.kaisaiti_cd" +
            "   AND e2.event_cd = $2" +
            "   AND e2.eigyo_cd = $3" +
            "  LEFT OUTER JOIN" +
            "       t_yoyaku t1" +
            "    ON e1.event_cd = t1.event_cd" +
            "   AND e1.kaisaiti_cd = t1.kaisaiti_cd" +
            "   AND e1.first_day = date_trunc('day',t1.reserve_time)" +
            "   AND t1.user_id = $1" +
            "  LEFT OUTER JOIN" +
            "       t_yoyaku t2" +
            "    ON e1.event_cd = t2.event_cd" +
            "   AND e1.kaisaiti_cd = t2.kaisaiti_cd" +
            "   AND e1.second_day = date_trunc('day',t2.reserve_time)" +
            "   AND t2.user_id = $1" +
            " WHERE e1.event_cd = $2" +
            " ORDER BY" +
            " CASE" +
            "  WHEN e2.eigyo_cd = $3 THEN 0" +
            "  ELSE 1" +
            " END," +
            "       e1.first_day",
        values: [argument, argument2, argument3],
    }
    return{
        query_event : e_query     
    }
}

export function entryquery(argument, argument2, argument3, argument4){
    let query = {
        text: 'INSERT' + 
            '  INTO t_yoyaku(event_cd, kaisaiti_cd, user_id, reserve_time) ' +
            'VALUES($1, $2, $3, $4)',
        values: [argument, argument2, argument3, argument4],
    }
    return{
        query_entry : query
    }
}

export function setidquery(){
    let query = {
        text: "SELECT " + 
            "    setval" +
            "       ('t_yoyaku_id_seq'," +
            "       (SELECT MAX(id)" + 
            "          FROM t_yoyaku))",
    }
    return{
        query_id : query
    }
}

export function countquery(argument, argument2){
    let a_query = {
        text: 'UPDATE t_yoyaku' +
            '   SET reserve_a_count = $1' +
            ' WHERE id = $2',
        values: [argument, argument2],
    }
    let c_query = {
        text: 'UPDATE t_yoyaku' +
            '   SET reserve_c_count = $1' +
            ' WHERE id = $2',
        values: [argument, argument2],
    }
    return{
        query_a : a_query,
        query_c : c_query
    }
}

// 確認メッセージ
export function b_confirmquery(){
    let query = {
        text: "SELECT *" +
            "  FROM m_event_base t1 " +
            " WHERE (current_date BETWEEN t1.start_ymd AND t1.end_ymd" +
            "    OR current_date < t1.start_ymd)" +
            "   AND t1.kaisai_flg = TRUE" +
            " ORDER BY t1.start_ymd",
    }
    return{
        query_base : query
    }
}

export function u_confirmquery(argument, argument2){
    let query = {
        text: "SELECT *" +
            "  FROM m_user" +
            " WHERE user_id = $1" +
            "   AND event_cd = $2",
        values: [argument, argument2],
    }
    return{
        query_user : query
    }
}

export function y_confirmquery(argument, argument2){
    let query = {
        text: "SELECT *" +
            "  FROM t_yoyaku t1" +
            " INNER JOIN" +
            "       m_event m1" +
            "    ON t1.event_cd = m1.event_cd" +
            "   AND t1.kaisaiti_cd = m1.kaisaiti_cd" +
            " INNER JOIN" +
            "       m_event_base m2" +
            "    ON m1.event_cd = m2.event_cd" +
            " INNER JOIN m_kaisaiti k" +
            "    ON m1.kaisaiti_cd = k.kaisaiti_cd" +
            " WHERE t1.user_id = $1" + 
            "   AND t1.event_cd = $2" +
            " ORDER BY t1.reserve_time",
        values: [argument, argument2],
    }
    return{
        query_yoyaku : query
    }
}

export function getquery(argument){
    let query = {
        text: 'SELECT *' +
            '  FROM t_yoyaku' +
            ' WHERE id = $1',
        values: [argument],
    }
    return{
        query_get : query
    }
}

export function cancelquery(argument){
    let query = {
        text: 'DELETE' +
            '  FROM t_yoyaku' +
            ' WHERE id = $1',
        values: [argument],
    }
    return{
        query_delete : query
    }
}

export function changequery(argument, argument2){
    let query = {
        text: 'UPDATE t_yoyaku' +
            '   SET reserve_time = $1' +
            ' WHERE id = $2',
        values: [argument, argument2],
    }
    return{
        query_change: query
    }
}

// 会員IDメッセージ
export function lifetimequery(argument, argument2){
    let query = {
        text: 'UPDATE m_user' +
            '   SET qr_expiration_date = $1' +
            ' WHERE user_id = $2',
        values: [argument, argument2],
    }
    return{
        query_time : query
    }
}

export function getuserquery(argument){
    let query = {
        text: "SELECT user_id, qr_expiration_date" + 
            "  FROM m_user m1" +
            " INNER JOIN m_event_base e1" +
            "    ON m1.event_cd = e1.event_cd" +
            " WHERE user_id = $1",
        values: [argument],
    }
    return{
        query_id : query
    }
}

export function qrcodequery(argument, argument2){
    let query = {
        text: 'UPDATE m_user' +
            '   SET qr_code = $1' +
            ' WHERE user_id = $2',
        values: [argument, argument2],
    }
    return{
        query_qr : query
    }
}

// 開催イベント情報メッセージ
export function b_heldquery(){
    let query = {
        text: "SELECT *" +
            "  FROM m_event_base" +
            " WHERE (current_date BETWEEN start_ymd AND end_ymd" +
            "    OR current_date < start_ymd)" +
            "   AND kaisai_flg = TRUE" +
            " ORDER BY start_ymd",
    }
    return{
        query_base : query
    }
}

export function u_heldquery(argument, argument2){
    let query = {
        text: "SELECT *" +
            "  FROM m_user" +
            " WHERE user_id = $1" +
            "   AND event_cd = $2",
        values: [argument, argument2],
    }
    return{
        query_user : query
    }
}

export function heldquery(argument, argument2){
    let query = {
        text: "SELECT e1.*" +
            "     , k.kaisaiti_nm" +
            "     , t1.id as t1_id" +
            "     , t2.id as t2_id" +
            "  FROM m_event e1" +
            " INNER JOIN m_kaisaiti k" +
            "    ON e1.kaisaiti_cd = k.kaisaiti_cd" +
            "  LEFT OUTER JOIN" +
            "       t_yoyaku t1" +
            "    ON e1.event_cd = t1.event_cd" +
            "   AND e1.kaisaiti_cd = t1.kaisaiti_cd" +
            "   AND e1.first_day = date_trunc('day',t1.reserve_time)" +
            "   AND t1.user_id = $1" +
            "  LEFT OUTER JOIN" +
            "       t_yoyaku t2" +
            "    ON e1.event_cd = t2.event_cd" +
            "   AND e1.kaisaiti_cd = t2.kaisaiti_cd" +
            "   AND e1.second_day = date_trunc('day',t2.reserve_time)" +
            "   AND t2.user_id = $1" +
            " WHERE e1.event_cd = $2" +
            "   AND (e1.second_day = current_date" +
            "   OR e1.first_day = current_date)",
        values: [argument, argument2],
    }
    return{
        query_held : query     
    }
}

// グラフ作成
export function graphtimequery(argument, argument2, argument3){
    let query = {
        text: "SELECT " + 
            "      CASE" +  
            "          WHEN first_day = $1" +
            "               THEN first_start_time" +
            "          ELSE second_start_time" + 
            "          END as start, " +
            "      CASE" +  
            "          WHEN first_day = $1" +
            "               THEN first_end_time - first_start_time" +
            "          ELSE second_end_time - second_start_time" + 
            "          END " +
            "    FROM m_event " +
            "   WHERE event_cd = $2" +
            "     AND kaisaiti_cd = $3" +
            "     AND ( first_day = $1" +
            "      OR second_day = $1)",
        values: [argument, argument2, argument3],
    }
    return{
        query_time : query
    }
}

export function graphquery(argument, argument2){
    let query = {
        text: "SELECT " + 
                    argument +
            "  FROM t_yoyaku t1 " +
            " WHERE event_cd = $1 " +
            " GROUP BY event_cd",
        values: [argument2],
    }
    return{
        query_graph : query
    }
}