const WEEKDAYS = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

const DIARY_ENTRIES_KEY = "diaryEntries";
const feedList = document.getElementById("feedList");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateLabel(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${y}년 ${pad2(m)}월 ${pad2(d)}일 ${WEEKDAYS[date.getDay()]}`;
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

function renderFeed() {
  const entries = getEntries();
  const keys = Object.keys(entries).sort((a, b) => (a > b ? 1 : -1));

  feedList.innerHTML = "";

  if (keys.length === 0) {
    const empty = document.createElement("p");
    empty.className = "feed-empty";
    empty.textContent = "등록된 일기가 없습니다.";
    feedList.appendChild(empty);
    return;
  }

  keys.forEach((key) => {
    const entry = entries[key] || {};
    const card = document.createElement("article");
    card.className = "feed-card";
    card.addEventListener("click", () => {
      window.location.href = `diary.html?date=${key}`;
    });

    card.innerHTML = `
      <div class="feed-date">${formatDateLabel(key)}</div>
      <div class="feed-title-row">
        <span class="feed-title-label">제목</span>
        <span class="feed-title-text"></span>
      </div>
      <div class="feed-body">
        <div class="feed-photo"></div>
        <div class="feed-content"></div>
      </div>
      <div class="feed-verse"></div>
    `;

    card.querySelector(".feed-title-text").textContent = entry.title || "";
    card.querySelector(".feed-content").textContent = entry.content || "";
    card.querySelector(".feed-verse").textContent = entry.note || "";

    const photoEl = card.querySelector(".feed-photo");
    if (entry.photo) {
      const img = document.createElement("img");
      img.src = entry.photo;
      img.alt = "";
      photoEl.appendChild(img);
      photoEl.classList.add("has-photo");
    }

    feedList.appendChild(card);
  });
}

renderFeed();

if (window.DiaryStore) {
  DiaryStore.subscribeEntries(() => {
    renderFeed();
  });
}
