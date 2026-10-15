// ============================================================
//  読谷村 サービス稼働状況　共通設定
// ============================================================
window.FS_CONFIG = {
  // 既存の Firebase プロジェクト（yomitan-facility-status）
  firebaseConfig: {
    apiKey: "AIzaSyDNdtr1D4GhzQ7aWoBlAFYkTGLioPlk4io",
    authDomain: "yomitan-facility-status.firebaseapp.com",
    databaseURL: "https://yomitan-facility-status-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "yomitan-facility-status",
    storageBucket: "yomitan-facility-status.firebasestorage.app",
    messagingSenderId: "518782906626",
    appId: "1:518782906626:web:46d3da5ec985eb6e97121b"
  },

  // サービスの一覧
  //   notice   : 「予告」状態を使うか
  //   schedule : 日時指定のスケジュール自動切替を使うか
  services: [
    { id: "gomi",    label: "ごみ収集",         icon: "🗑️", notice: false, schedule: false },
    { id: "kusaki",  label: "草木資源化施設",   icon: "🌿", notice: true,  schedule: true  },
    { id: "conveni", label: "コンビニ交付",     icon: "🏛️", notice: true,  schedule: true  }
  ]
};

// apiKey が空、または URL に ?demo を付けたときはデモモード
// （データはこのブラウザ内だけに保存され、本番のデータベースには触れません）
window.FS_CONFIG.demo = !window.FS_CONFIG.firebaseConfig.apiKey || /[?&]demo\b/.test(location.search);
