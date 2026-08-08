/* PC ↔ 모바일 실시간 공유 저장소 (설정 없이 동작)
 * - localStorage: 기내 캐시
 * - Gun.js 공개 피어: 동일 로그인 계정끼리 실시간 동기화
 */
(function (global) {
  const DIARY_ENTRIES_KEY = "diaryEntries";
  const SYNC_META_KEY = "diaryEntriesSyncMeta";
  const APP_ROOT = "todays-ssum-diary-v2";

  const peers = [
    "https://gun-manhattan.herokuapp.com/gun",
    "https://peer.wallie.io/gun",
  ];

  let gunNode = null;
  let applyingRemote = false;
  const listeners = new Set();

  function sanitizeUser(id) {
    return String(id || "guest").replace(/[^\w\-가-힣]/g, "_").slice(0, 64);
  }

  function currentUserId() {
    try {
      return (
        sessionStorage.getItem("diaryUser") ||
        localStorage.getItem("diaryUser") ||
        "guest"
      );
    } catch {
      return "guest";
    }
  }

  function roomPath() {
    return APP_ROOT + "/" + sanitizeUser(currentUserId());
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(DIARY_ENTRIES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function readMeta() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function writeLocal(entries, updatedAt) {
    try {
      localStorage.setItem(DIARY_ENTRIES_KEY, JSON.stringify(entries || {}));
    } catch (err) {
      // 용량 초과 시 사진 없는 버전으로 재시도
      const slim = {};
      Object.keys(entries || {}).forEach((key) => {
        const e = entries[key] || {};
        slim[key] = {
          title: e.title || "",
          content: e.content || "",
          note: e.note || "",
          photo: "",
        };
      });
      localStorage.setItem(DIARY_ENTRIES_KEY, JSON.stringify(slim));
      entries = slim;
    }
    const meta = readMeta();
    meta.updatedAt = updatedAt || Date.now();
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
    return entries;
  }

  function notify(entries) {
    listeners.forEach((fn) => {
      try {
        fn(entries);
      } catch {
        /* ignore */
      }
    });
  }

  function getGunNode() {
    if (gunNode) return gunNode;
    if (typeof Gun === "undefined") return null;
    try {
      const gun = Gun({ peers: peers, localStorage: false });
      gunNode = gun.get(roomPath()).get("entries");
      return gunNode;
    } catch {
      return null;
    }
  }

  function getEntries() {
    return readLocal();
  }

  function saveEntries(entries) {
    const updatedAt = Date.now();
    entries = writeLocal(entries, updatedAt) || entries;
    notify(entries);

    // 원격 동기화는 이동을 막지 않도록 비차단으로 전송
    const node = getGunNode();
    if (node && !applyingRemote) {
      try {
        node.put({
          json: JSON.stringify(entries || {}),
          updatedAt: updatedAt,
        });
      } catch (err) {
        console.warn("동기화 전송 예외:", err);
      }
    }
    return Promise.resolve(true);
  }

  function subscribeEntries(callback) {
    if (typeof callback === "function") {
      listeners.add(callback);
      callback(readLocal());
    }

    const node = getGunNode();
    if (!node) {
      return () => listeners.delete(callback);
    }

    node.on((data) => {
      if (!data || typeof data.json !== "string") return;
      const remoteAt = Number(data.updatedAt) || 0;
      const localAt = Number(readMeta().updatedAt) || 0;
      if (remoteAt && remoteAt < localAt) return;

      let remoteEntries;
      try {
        remoteEntries = JSON.parse(data.json);
      } catch {
        return;
      }
      if (!remoteEntries || typeof remoteEntries !== "object") return;

      applyingRemote = true;
      try {
        const saved = writeLocal(remoteEntries, remoteAt || Date.now());
        notify(saved || remoteEntries);
      } finally {
        applyingRemote = false;
      }
    });

    return () => listeners.delete(callback);
  }

  /** 사진 dataURL 압축 — 모바일 localStorage 용량/등록 실패 방지 */
  function compressImageFile(file, maxSide, quality) {
    maxSide = maxSide || 960;
    quality = quality || 0.72;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          const scale = Math.min(1, maxSide / Math.max(w, h));
          w = Math.max(1, Math.round(w * scale));
          h = Math.max(1, Math.round(h * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("사진 형식을 확인할 수 없습니다."));
        img.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  global.DiaryStore = {
    getEntries: getEntries,
    saveEntries: saveEntries,
    subscribeEntries: subscribeEntries,
    compressImageFile: compressImageFile,
    currentUserId: currentUserId,
  };
})(window);
