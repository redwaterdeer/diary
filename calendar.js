const grid = document.getElementById("calendarGrid");
const yearEl = document.getElementById("calYear");
const monthEl = document.getElementById("calMonth");
const yearToggle = document.getElementById("yearToggle");
const monthToggle = document.getElementById("monthToggle");
const yearDropdown = document.getElementById("yearDropdown");
const monthDropdown = document.getElementById("monthDropdown");

const DIARY_KEY = "diaryDates";
const DIARY_ENTRIES_KEY = "diaryEntries";
const YEAR_START = 2020;
const YEAR_END = 2035;

const now = new Date();
let viewYear = now.getFullYear();
let viewMonth = now.getMonth();

function getDiaryEntries() {
  if (window.DiaryStore) return DiaryStore.getEntries();
  try {
    const raw = localStorage.getItem(DIARY_ENTRIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toKey(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

// 실제로 작성·등록된 일기만 연한 주황 음영 표시
function hasDiary(year, monthIndex, day) {
  const entry = getDiaryEntries()[toKey(year, monthIndex, day)];
  if (!entry) return false;
  return !!(entry.title || entry.content || entry.note || entry.photo);
}

function buildWeeks(year, month) {
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const cells = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrev - i,
      current: false,
      year: prevYear,
      month: prevMonth,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, year, month });
  }

  let next = 1;
  while (cells.length < 42) {
    cells.push({
      day: next++,
      current: false,
      year: nextYear,
      month: nextMonth,
    });
  }

  const weeks = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }
  return weeks;
}

function updateHeader() {
  yearEl.textContent = `${viewYear}년`;
  monthEl.textContent = `${pad2(viewMonth + 1)}월`;
}

function render() {
  updateHeader();
  const weeks = buildWeeks(viewYear, viewMonth);
  grid.innerHTML = "";

  weeks.forEach((week) => {
    const row = document.createElement("div");
    row.className = "calendar-row";

    week.forEach((cell) => {
      const day = document.createElement("button");
      day.type = "button";
      day.className = "calendar-day";
      if (!cell.current) day.classList.add("is-other");
      const isToday =
        cell.year === now.getFullYear() &&
        cell.month === now.getMonth() &&
        cell.day === now.getDate();
      if (isToday) day.classList.add("is-today");
      // 옅은 주황 음영 = 일기 등록일
      if (hasDiary(cell.year, cell.month, cell.day)) {
        day.classList.add("is-mark");
        day.title = "일기 등록일";
      }
      day.textContent = pad2(cell.day);
      day.addEventListener("click", () => {
        const key = toKey(cell.year, cell.month, cell.day);
        window.location.href = `diary.html?date=${key}`;
      });
      row.appendChild(day);
    });

    grid.appendChild(row);
  });
}

function closeDropdowns() {
  [yearDropdown, monthDropdown].forEach((el) => {
    el.hidden = true;
    el.classList.remove("is-fixed");
    el.style.top = "";
    el.style.left = "";
    el.style.right = "";
    el.style.width = "";
  });
  yearToggle.setAttribute("aria-expanded", "false");
  monthToggle.setAttribute("aria-expanded", "false");
}

function placeDropdown(dropdown, anchor, alignRight) {
  const rect = anchor.getBoundingClientRect();
  const width = Math.max(rect.width, 120);
  dropdown.classList.add("is-fixed");
  dropdown.style.top = `${Math.round(rect.bottom + 6)}px`;
  dropdown.style.width = `${Math.round(width)}px`;
  if (alignRight) {
    dropdown.style.left = `${Math.round(rect.right - width)}px`;
    dropdown.style.right = "auto";
  } else {
    dropdown.style.left = `${Math.round(rect.left)}px`;
    dropdown.style.right = "auto";
  }
}

function fillYearDropdown() {
  yearDropdown.innerHTML = "";
  // 월 드롭다운과 같이 작은 값 → 큰 값 순
  for (let y = YEAR_START; y <= YEAR_END; y++) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${y}년`;
    if (y === viewYear) btn.classList.add("is-selected");
    btn.addEventListener("click", () => {
      viewYear = y;
      closeDropdowns();
      render();
    });
    li.appendChild(btn);
    yearDropdown.appendChild(li);
  }
}

function fillMonthDropdown() {
  monthDropdown.innerHTML = "";
  for (let m = 0; m < 12; m++) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${pad2(m + 1)}월`;
    if (m === viewMonth) btn.classList.add("is-selected");
    btn.addEventListener("click", () => {
      viewMonth = m;
      closeDropdowns();
      render();
    });
    li.appendChild(btn);
    monthDropdown.appendChild(li);
  }
}

yearToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  const willOpen = yearDropdown.hidden;
  closeDropdowns();
  if (willOpen) {
    fillYearDropdown();
    yearDropdown.hidden = false;
    yearToggle.setAttribute("aria-expanded", "true");
    placeDropdown(yearDropdown, yearToggle.parentElement, false);
    const selected = yearDropdown.querySelector(".is-selected");
    if (selected) selected.scrollIntoView({ block: "nearest" });
  }
});

monthToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  const willOpen = monthDropdown.hidden;
  closeDropdowns();
  if (willOpen) {
    fillMonthDropdown();
    monthDropdown.hidden = false;
    monthToggle.setAttribute("aria-expanded", "true");
    placeDropdown(monthDropdown, monthToggle.parentElement, true);
    const selected = monthDropdown.querySelector(".is-selected");
    if (selected) selected.scrollIntoView({ block: "nearest" });
  }
});

document.addEventListener("click", () => {
  closeDropdowns();
});

yearDropdown.addEventListener("click", (event) => event.stopPropagation());
monthDropdown.addEventListener("click", (event) => event.stopPropagation());
// 드롭다운 내부 스크롤이 페이지로 전달되지 않게
yearDropdown.addEventListener(
  "touchmove",
  (event) => {
    event.stopPropagation();
  },
  { passive: true }
);
monthDropdown.addEventListener(
  "touchmove",
  (event) => {
    event.stopPropagation();
  },
  { passive: true }
);

// 예전 샘플 음영 데이터 제거 (실제 작성 일기만 표시)
localStorage.removeItem(DIARY_KEY);
render();

if (window.DiaryStore) {
  DiaryStore.subscribeEntries(() => {
    render();
  });
}
