/* PC ↔ 모바일 실시간 공유 저장소 (설정 없이 동작)
 * - localStorage: 계정별 분리 캐시
 * - Gun.js 공개 피어: 동일 로그인 계정끼리만 동기화
 */
(function (global) {
  const LEGACY_ENTRIES_KEY = "diaryEntries";
  const LEGACY_SYNC_META_KEY = "diaryEntriesSyncMeta";
  const LOCAL_SAVE_GUARD_KEY = "diaryLocalSaveAt";
  const APP_ROOT = "todays-ssum-diary-v3";

  const peers = [
    "https://gun-manhattan.herokuapp.com/gun",
    "https://peer.wallie.io/gun",
  ];

  let gunNode = null;
  let gunBoundUser = "";
  let applyingRemote = false;
  const listeners = new Set();

  function toTime(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

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

  function entriesKey() {
    return "diaryEntries__" + sanitizeUser(currentUserId());
  }

  function syncMetaKey() {
    return "diaryEntriesSyncMeta__" + sanitizeUser(currentUserId());
  }

  function recentVersesKey() {
    return "recentBibleVerses__" + sanitizeUser(currentUserId());
  }

  function diaryDatesKey() {
    return "diaryDates__" + sanitizeUser(currentUserId());
  }

  function markLocalSave(updatedAt) {
    try {
      sessionStorage.setItem(
        LOCAL_SAVE_GUARD_KEY + "__" + sanitizeUser(currentUserId()),
        String(updatedAt || Date.now())
      );
    } catch {
      /* ignore */
    }
  }

  function isRecentLocalSave(ms) {
    try {
      const savedAt = toTime(
        sessionStorage.getItem(
          LOCAL_SAVE_GUARD_KEY + "__" + sanitizeUser(currentUserId())
        )
      );
      return !!(savedAt && Date.now() - savedAt < (ms || 8000));
    } catch {
      return false;
    }
  }

  function roomPath() {
    return APP_ROOT + "/" + sanitizeUser(currentUserId());
  }

  function migrateLegacyForCurrentUser() {
    const uid = sanitizeUser(currentUserId());
    if (!uid || uid === "guest") return;

    try {
      if (!localStorage.getItem(entriesKey())) {
        const legacy = localStorage.getItem(LEGACY_ENTRIES_KEY);
        if (legacy) {
          localStorage.setItem(entriesKey(), legacy);
        }
      }
      if (!localStorage.getItem(syncMetaKey())) {
        const legacyMeta = localStorage.getItem(LEGACY_SYNC_META_KEY);
        if (legacyMeta) {
          localStorage.setItem(syncMetaKey(), legacyMeta);
        }
      }
      // 공용 키 제거 → 다른 계정이 열람하지 못하도록
      localStorage.removeItem(LEGACY_ENTRIES_KEY);
      localStorage.removeItem(LEGACY_SYNC_META_KEY);
      localStorage.removeItem("diaryDates");
      localStorage.removeItem("recentBibleVerses");
    } catch {
      /* ignore */
    }
  }

  function readLocal() {
    migrateLegacyForCurrentUser();
    try {
      const raw = localStorage.getItem(entriesKey());
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function readMeta() {
    try {
      return JSON.parse(localStorage.getItem(syncMetaKey()) || "{}");
    } catch {
      return {};
    }
  }

  function writeLocal(entries, updatedAt) {
    try {
      localStorage.setItem(entriesKey(), JSON.stringify(entries || {}));
    } catch (err) {
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
      localStorage.setItem(entriesKey(), JSON.stringify(slim));
      entries = slim;
    }
    const meta = readMeta();
    meta.updatedAt = updatedAt || Date.now();
    localStorage.setItem(syncMetaKey(), JSON.stringify(meta));
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
    if (typeof Gun === "undefined") return null;
    const uid = sanitizeUser(currentUserId());
    if (gunNode && gunBoundUser === uid) return gunNode;
    try {
      const gun = Gun({ peers: peers, localStorage: false });
      gunBoundUser = uid;
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
    markLocalSave(updatedAt);
    notify(entries);

    const node = getGunNode();
    if (node && !applyingRemote) {
      try {
        node.put({
          json: JSON.stringify(entries || {}),
          updatedAt: updatedAt,
          owner: sanitizeUser(currentUserId()),
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

    const owner = sanitizeUser(currentUserId());
    node.on((data) => {
      if (isRecentLocalSave(8000)) {
        notify(readLocal());
        return;
      }

      if (!data || typeof data.json !== "string") return;
      // 다른 계정 데이터 차단
      if (data.owner && sanitizeUser(data.owner) !== owner) return;

      const remoteAt = toTime(data.updatedAt);
      const localAt = toTime(readMeta().updatedAt);
      if (!remoteAt || remoteAt <= localAt) {
        notify(readLocal());
        return;
      }

      let remoteEntries;
      try {
        remoteEntries = JSON.parse(data.json);
      } catch {
        return;
      }
      if (!remoteEntries || typeof remoteEntries !== "object") return;

      applyingRemote = true;
      try {
        const saved = writeLocal(remoteEntries, remoteAt);
        notify(saved || remoteEntries);
      } finally {
        applyingRemote = false;
      }
    });

    return () => listeners.delete(callback);
  }

  function getRecentVerses() {
    try {
      const raw = localStorage.getItem(recentVersesKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setRecentVerses(list) {
    localStorage.setItem(recentVersesKey(), JSON.stringify(list || []));
  }

  function getDiaryDates() {
    try {
      const raw = localStorage.getItem(diaryDatesKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setDiaryDates(list) {
    localStorage.setItem(diaryDatesKey(), JSON.stringify(list || []));
  }

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
    getRecentVerses: getRecentVerses,
    setRecentVerses: setRecentVerses,
    getDiaryDates: getDiaryDates,
    setDiaryDates: setDiaryDates,
  };
})(window);
