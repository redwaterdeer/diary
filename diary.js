const WEEKDAYS = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

const DIARY_KEY = "diaryDates";
const DIARY_ENTRIES_KEY = "diaryEntries";
const RECENT_VERSES_KEY = "recentBibleVerses";
const RECENT_LIMIT = 8;

const dateEl = document.getElementById("diaryDate");
const dateInput = document.getElementById("diaryDateInput");
const titleInput = document.getElementById("diaryTitle");
const contentInput = document.getElementById("diaryContent");
const noteInput = document.getElementById("diaryNote");
const galleryBtn = document.getElementById("diaryGalleryBtn");
const cameraBtn = document.getElementById("diaryCameraBtn");
const galleryInput = document.getElementById("diaryGalleryInput");
const cameraInput = document.getElementById("diaryCameraInput");
const photoPreview = document.getElementById("diaryPhotoPreview");
const photoText = document.getElementById("diaryPhotoText");
const photoBox = document.getElementById("diaryPhotoBox");
const bibleBtn = document.getElementById("bibleBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const deleteDialog = document.getElementById("deleteDialog");
const deleteYes = document.getElementById("deleteYes");
const deleteNo = document.getElementById("deleteNo");
const saveOkDialog = document.getElementById("saveOkDialog");
const saveOkBtn = document.getElementById("saveOkBtn");
const isNewScreen = /diary-new\.html/i.test(
  (window.location.pathname || "").split("?")[0]
);

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseDateParam() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("date");
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // 7번 신규 등록은 오늘 날짜, 5번은 기존 기본값 유지
  return isNewScreen ? new Date() : new Date(2026, 6, 17);
}

function formatDateLabel(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const w = WEEKDAYS[date.getDay()];
  return `${y}년 ${m}월 ${d}일 ${w}`;
}

function toKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function toInputValue(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function getEntries() {
  if (window.DiaryStore) return DiaryStore.getEntries();
  try {
    const raw = localStorage.getItem(DIARY_ENTRIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEntries(entries) {
  if (window.DiaryStore) {
    return DiaryStore.saveEntries(entries);
  }
  localStorage.setItem(DIARY_ENTRIES_KEY, JSON.stringify(entries));
  return Promise.resolve(true);
}

function markDiaryDate(key) {
  let dates = [];
  try {
    dates = JSON.parse(localStorage.getItem(DIARY_KEY) || "[]");
  } catch {
    dates = [];
  }
  if (!dates.includes(key)) {
    dates.push(key);
    localStorage.setItem(DIARY_KEY, JSON.stringify(dates));
  }
}

function clearForm() {
  titleInput.value = "";
  contentInput.value = "";
  noteInput.value = "";
  photoPreview.src = "";
  photoPreview.hidden = true;
  photoText.hidden = false;
  photoBox.classList.remove("has-photo");
  if (galleryInput) galleryInput.value = "";
  if (cameraInput) cameraInput.value = "";
}

function loadEntry(key) {
  const entry = getEntries()[key];
  titleInput.value = entry?.title || "";
  contentInput.value = entry?.content || "";
  noteInput.value = entry?.note || "";
  if (entry?.photo) {
    photoPreview.src = entry.photo;
    photoPreview.hidden = false;
    photoText.hidden = true;
    photoBox.classList.add("has-photo");
  } else {
    photoPreview.src = "";
    photoPreview.hidden = true;
    photoText.hidden = false;
    photoBox.classList.remove("has-photo");
  }
}

let selectedDate = parseDateParam();
let dateKey = toKey(selectedDate);
dateEl.textContent = formatDateLabel(selectedDate);
if (dateInput) {
  dateInput.value = toInputValue(selectedDate);
}
// 6번 「신규 등록」→ 7번은 기존 저장 내용 없이 빈 화면으로 시작
if (isNewScreen) {
  clearForm();
} else {
  loadEntry(dateKey);
}

if (isNewScreen && dateEl && dateInput) {
  dateEl.addEventListener("click", () => {
    dateInput.classList.add("is-open");
    dateInput.focus();
    if (typeof dateInput.showPicker === "function") {
      try {
        dateInput.showPicker();
      } catch {
        /* ignore */
      }
    }
  });

  dateInput.addEventListener("change", () => {
    if (!dateInput.value) return;
    const [y, m, d] = dateInput.value.split("-").map(Number);
    selectedDate = new Date(y, m - 1, d);
    dateKey = toKey(selectedDate);
    dateEl.textContent = formatDateLabel(selectedDate);
    loadEntry(dateKey);
    dateInput.classList.remove("is-open");
  });

  dateInput.addEventListener("blur", () => {
    dateInput.classList.remove("is-open");
  });
}

galleryBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  galleryInput.value = "";
  galleryInput.click();
});

cameraBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  cameraInput.value = "";
  cameraInput.click();
});

// 미리보기 상태에서 다시 선택하려면 영역 탭
photoBox.addEventListener("click", () => {
  if (!photoPreview.hidden) {
    photoText.hidden = false;
  }
});

async function applySelectedPhoto(file) {
  if (!file) return;
  try {
    const dataUrl = window.DiaryStore
      ? await DiaryStore.compressImageFile(file, 960, 0.72)
      : await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("read fail"));
          reader.readAsDataURL(file);
        });
    photoPreview.src = dataUrl;
    photoPreview.hidden = false;
    photoText.hidden = true;
    photoBox.classList.add("has-photo");
  } catch {
    alert("사진을 불러오지 못했습니다. 다시 시도해 주세요.");
  }
}

galleryInput.addEventListener("change", async () => {
  const file = galleryInput.files && galleryInput.files[0];
  await applySelectedPhoto(file);
});

cameraInput.addEventListener("change", async () => {
  const file = cameraInput.files && cameraInput.files[0];
  await applySelectedPhoto(file);
});

const BIBLE_VERSES = [
  {
    keywords: ["기쁨", "기쁘", "즐거", "행복", "감사", "덕분에", "축복", "좋은", "좋았"],
    verses: [
      "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 (데살로니가전서 5:16-18)",
      "여호와께 감사하며 그의 이름을 불러 아뢰며 그가 행하신 일을 만민 중에 알릴지어다 (시편 105:1)",
      "이 날에서 저 날까지 여호와의 인자하심과 사람의 신실하심을 선포하리로다 (시편 92:2)",
    ],
  },
  {
    keywords: ["힘들", "지쳤", "피곤", "어려", "힘드", "고통", "아픔", "슬프", "눈물", "울었"],
    verses: [
      "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라 (마태복음 11:28)",
      "하나님은 우리의 피난처시요 힘이시니 환난 중에 만날 큰 도움이시라 (시편 46:1)",
      "우는 자들이 복이 있나니 너희가 웃을 것임이요 (누가복음 6:21)",
    ],
  },
  {
    keywords: ["걱정", "불안", "두려", "무섭", "초조", "염려", "근심"],
    verses: [
      "아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라 (빌립보서 4:6)",
      "너희 염려를 다 주께 맡기라 이는 그가 너희를 돌보심이라 (베드로전서 5:7)",
      "너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 (잠언 3:5)",
    ],
  },
  {
    keywords: ["사랑", "보고싶", "가족", "친구", "연인", "마음", "따뜻"],
    verses: [
      "사랑은 오래 참고 사랑은 온유하며 시기하지 아니하며 사랑은 자랑하지 아니하며 교만하지 아니하며 (고린도전서 13:4)",
      "우리가 사랑함은 그가 먼저 우리를 사랑하셨음이라 (요한일서 4:19)",
      "새 계명을 너희에게 주노니 서로 사랑하라 내가 너희를 사랑한 것 같이 너희도 서로 사랑하라 (요한복음 13:34)",
    ],
  },
  {
    keywords: ["용서", "미안", "잘못", "후회", "화해", "용서해"],
    verses: [
      "서로 친절하게 하며 불쌍히 여기며 서로 용서하기를 하나님이 그리스도 안에서 너희를 용서하심과 같이 하라 (에베소서 4:32)",
      "너희가 사람의 잘못을 용서하면 너희 하늘 아버지께서도 너희 잘못을 용서하시려니와 (마태복음 6:14)",
      "비판하지 말라 그리하면 너희가 비판을 받지 않을 것이요 (누가복음 6:37)",
    ],
  },
  {
    keywords: ["평안", "평화", "안정", "쉼", "휴식", "여유"],
    verses: [
      "여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다 (시편 23:1-2)",
      "평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라 (요한복음 14:27)",
      "모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라 (빌립보서 4:7)",
    ],
  },
  {
    keywords: ["용기", "도전", "시작", "결심", "희망", "꿈", "목표", "힘내", "노력"],
    verses: [
      "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 (이사야 41:10)",
      "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라 (빌립보서 4:13)",
      "여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 (이사야 40:31)",
    ],
  },
  {
    keywords: ["외로", "혼자", "쓸쓸", "고독", "떠나"],
    verses: [
      "내가 너희를 고아와 같이 버려두지 아니하고 너희에게로 오리라 (요한복음 14:18)",
      "내가 세상 끝날까지 너희와 항상 함께 있으리라 (마태복음 28:20)",
      "여호와는 마음이 상한 자를 가까이 하시고 충심으로 통회하는 자를 구원하시는도다 (시편 34:18)",
    ],
  },
  {
    keywords: ["기도", "예배", "하나님", "주님", "교회", "말씀", "믿"],
    verses: [
      "너희가 내 안에 거하고 내 말이 너희 안에 거하면 무엇이든지 원하는 대로 구하라 그리하면 이루리라 (요한복음 15:7)",
      "구하는 이마다 받을 것이요 찾는 이가 찾을 것이요 두드리는 이에게 열릴 것이니라 (마태복음 7:8)",
      "믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니 (히브리서 11:1)",
    ],
  },
  {
    keywords: ["자연", "하늘", "바다", "산", "꽃", "비", "날씨", "산책", "여행"],
    verses: [
      "하늘이 하나님의 영광을 선포하고 궁창이 그의 손으로 하신 일을 나타내는도다 (시편 19:1)",
      "땅과 거기에 충만한 것과 세계와 그 가운데에 사는 자들은 다 여호와의 것이로다 (시편 24:1)",
      "여호와 우리 주여 주의 이름이 온 땅에 어찌 그리 아름다운지요 (시편 8:1)",
    ],
  },
  {
    keywords: ["일", "직장", "공부", "시험", "학교", "과제", "바빴", "분주"],
    verses: [
      "너희가 먹든지 마시든지 무엇을 하든지 다 하나님의 영광을 위하여 하라 (고린도전서 10:31)",
      "네가 무슨 일을 하든지 마음을 다하여 주께 하듯 하고 사람에게 하듯 하지 말라 (골로새서 3:23)",
      "네가 죽도록 충성하라 그리하면 내가 생명의 관을 네게 주리라 (요한계시록 2:10)",
    ],
  },
];

const DEFAULT_VERSES = [
  "여호와께서 너를 지켜 모든 환난을 면하게 하시며 또 네 영혼을 지키시리로다 (시편 121:7)",
  "여호와는 네게 복을 주시고 너를 지키시기를 원하며 (민수기 6:24)",
  "그는 해 뜨는 데부터 해 지는 데까지 여호와의 이름이 찬양 받으실 일로다 (시편 113:3)",
];

function getRecentVerses() {
  try {
    const raw = localStorage.getItem(RECENT_VERSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function rememberVerse(verse) {
  const recent = getRecentVerses().filter((item) => item !== verse);
  recent.unshift(verse);
  localStorage.setItem(
    RECENT_VERSES_KEY,
    JSON.stringify(recent.slice(0, RECENT_LIMIT))
  );
}

function pickUnusedVerse(candidates) {
  const recent = getRecentVerses();
  const unused = candidates.filter((verse) => !recent.includes(verse));
  const pool = unused.length > 0 ? unused : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

function findBibleVerse(text) {
  const source = String(text || "").trim();
  if (!source) return null;

  let bestGroup = null;
  let bestScore = 0;

  BIBLE_VERSES.forEach((item) => {
    let score = 0;
    item.keywords.forEach((keyword) => {
      if (source.includes(keyword)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      bestGroup = item;
    }
  });

  const candidates =
    bestScore > 0 && bestGroup ? bestGroup.verses : DEFAULT_VERSES;
  return pickUnusedVerse(candidates);
}

bibleBtn.addEventListener("click", () => {
  const diaryText = `${titleInput.value} ${contentInput.value}`.trim();

  if (!diaryText) {
    alert("일기 제목이나 내용을 먼저 작성해 주세요.");
    return;
  }

  const verse = findBibleVerse(diaryText);
  noteInput.value = verse;
  rememberVerse(verse);
});

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  try {
    const entries = getEntries();
    entries[dateKey] = {
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      note: noteInput.value.trim(),
      photo: photoPreview.hidden ? "" : photoPreview.src,
    };
    await saveEntries(entries);
    markDiaryDate(dateKey);

    if (isNewScreen && saveOkDialog && saveOkBtn) {
      saveOkDialog.hidden = false;
      const finish = () => {
        saveOkDialog.hidden = true;
        window.location.href = "feed.html";
      };
      saveOkBtn.onclick = finish;
    } else {
      alert("일기가 등록되었습니다.");
      window.location.href = "calendar.html";
    }
  } catch (err) {
    console.error(err);
    alert(
      "저장에 실패했습니다. 사진 용량이 크면 사진을 빼거나 다시 촬영해 주세요."
    );
    saveBtn.disabled = false;
  }
});

if (deleteBtn && deleteDialog && deleteYes && deleteNo) {
  deleteBtn.addEventListener("click", () => {
    deleteDialog.hidden = false;
  });

  deleteNo.addEventListener("click", () => {
    deleteDialog.hidden = true;
  });

  deleteYes.addEventListener("click", async () => {
    deleteYes.disabled = true;
    try {
      const entries = getEntries();
      delete entries[dateKey];
      await saveEntries(entries);
      deleteDialog.hidden = true;
      window.location.href = isNewScreen ? "feed.html" : "calendar.html";
    } catch (err) {
      console.error(err);
      alert("삭제에 실패했습니다. 다시 시도해 주세요.");
      deleteYes.disabled = false;
    }
  });
}
