// ============================================================
//  稼働状況の判定ロジック（閲覧ページ・管理画面の共通部品）
//
//  ポイント：閲覧ページはデータベースに一切書き込まない。
//  「手動で設定した状態」と「登録済みスケジュール」と「現在時刻」から、
//  表示すべき状態をその場で計算する。
//  → データベースを「誰でも読めるが、職員しか書けない」設定にできる。
// ============================================================
(function () {
  const SEV = { open: 0, notice: 1, closed: 2 };

  function schedList(raw) {
    return Object.entries(raw || {}).map(([key, s]) => ({ key, ...s }))
      .filter(s => s.closedAt && s.reopenAt)
      .sort((a, b) => a.closedAt.localeCompare(b.closedAt));
  }

  // 手動設定の状態（再開予定日時を過ぎていれば「稼働中」に戻す）
  function manualState(m, now) {
    m = m || { status: "open" };
    if (m.status === "closed" && m.reopen_mode === "datetime" && m.reopen && now >= Date.parse(m.reopen)) {
      return { status: "open", source: "manual-expired" };
    }
    return { ...m, status: m.status || "open", source: "manual" };
  }

  // スケジュールから見た状態（該当なしなら null）
  function scheduleState(list, now) {
    const closing = list.find(s => now >= Date.parse(s.closedAt) && now < Date.parse(s.reopenAt));
    if (closing) return { status: "closed", period: "", reason: closing.reason || "", reopen: closing.reopenAt,
      reopen_mode: "datetime", source: "schedule", schedKey: closing.key };
    const notice = list.find(s => s.noticeAt && now >= Date.parse(s.noticeAt) && now < Date.parse(s.closedAt));
    if (notice) return { status: "notice", notice_period: `${fmtDt(notice.closedAt)} 〜 ${fmtDt(notice.reopenAt)}（停止予定）`,
      notice_msg: notice.noticeMsg || "", source: "schedule", schedKey: notice.key };
    return null;
  }

  // 最終的に表示する状態：手動とスケジュールのうち「より止まっている方」を採用
  function effective(manual, schedRaw, now) {
    now = now || Date.now();
    const m = manualState(manual, now);
    const s = scheduleState(schedList(schedRaw), now);
    if (s && SEV[s.status] > SEV[m.status]) return s;
    return m;
  }

  function upcoming(schedRaw, now) {
    now = now || Date.now();
    return schedList(schedRaw).filter(s => Date.parse(s.reopenAt) > now);
  }

  function fmtDt(iso) {
    if (!iso) return "";
    const dt = new Date(iso);
    return dt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "long", day: "numeric", weekday: "short" }) + " " +
      dt.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" });
  }
  function fmtReopen(d) {
    const mode = d.reopen_mode || "none";
    if (mode === "undecided") return "未定";
    if (mode === "none" || !d.reopen) return "";
    const dt = new Date(d.reopen);
    const dateStr = dt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric", weekday: "short" });
    if (mode === "dateonly") return dateStr + "（時間未定）";
    return dateStr + " " + dt.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }) + " 頃";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // デモ版の表示（両ページ共通）
  if (window.FS_CONFIG && window.FS_CONFIG.demo) {
    document.addEventListener("DOMContentLoaded", () => {
      document.title = "【デモ版】" + document.title;
      const st = document.createElement("style");
      st.textContent = `
        .demo-badge { display:inline-block; vertical-align:middle; margin-left:8px; background:#ffd23f; color:#3d2e00;
          font-size:12px; font-weight:800; padding:3px 10px; border-radius:20px; white-space:nowrap; }
        .demo-pill { position:fixed; left:12px; bottom:12px; z-index:10000; background:#ffd23f; color:#3d2e00; font-size:12px;
          font-weight:800; padding:6px 12px; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,.25); pointer-events:none; }
        .demo-bar { background:#fff3c4; color:#6b4f00; font-size:13px; text-align:center; padding:6px 12px; }`;
      document.head.appendChild(st);
      const h1 = document.querySelector("header h1");
      if (h1) h1.insertAdjacentHTML("beforeend", '<span class="demo-badge">デモ版</span>');
      const header = document.querySelector("header");
      if (header) header.insertAdjacentHTML("afterend", '<div class="demo-bar">デモモード：データはこのブラウザ内にのみ保存され、本番の表示には影響しません</div>');
      document.body.insertAdjacentHTML("beforeend", '<div class="demo-pill" aria-hidden="true">デモ版・正式な情報ではありません</div>');
    });
  }

  window.FS = { effective, upcoming, schedList, manualState, fmtDt, fmtReopen, esc };
})();
