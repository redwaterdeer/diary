const viewScreen = document.querySelector(".view-screen");
const btnCalendar = document.getElementById("btnCalendar");
const btnFeed = document.getElementById("btnFeed");
const iconCalendar = document.getElementById("iconCalendar");
const iconFeed = document.getElementById("iconFeed");

const icons = {
  calendarPlain: "images/s3-cal-plain.png?v=2",
  feedPlain: "images/s3-feed-plain.png",
  calendarActive: "images/s3-cal-active.png?v=2",
  feedActive: "images/s3-feed-active.png",
};

let navigating = false;

function setMode(mode) {
  viewScreen.dataset.mode = mode;

  if (mode === "calendar") {
    iconCalendar.src = icons.calendarActive;
    iconFeed.src = icons.feedPlain;
    btnCalendar.classList.add("is-active");
    btnFeed.classList.remove("is-active");
  } else if (mode === "feed") {
    iconCalendar.src = icons.calendarPlain;
    iconFeed.src = icons.feedActive;
    btnCalendar.classList.remove("is-active");
    btnFeed.classList.add("is-active");
  } else {
    iconCalendar.src = icons.calendarPlain;
    iconFeed.src = icons.feedPlain;
    btnCalendar.classList.remove("is-active");
    btnFeed.classList.remove("is-active");
  }
}

btnCalendar.addEventListener("click", () => {
  if (navigating) return;
  navigating = true;
  setMode("calendar");
  // 컬러 전환 후 0.25초 뒤 4번 화면으로 이동
  setTimeout(() => {
    window.location.href = "calendar.html";
  }, 250);
});

btnFeed.addEventListener("click", () => {
  if (navigating) return;
  navigating = true;
  setMode("feed");
  setTimeout(() => {
    window.location.href = "feed.html";
  }, 250);
});

Object.values(icons).forEach((src) => {
  const img = new Image();
  img.src = src;
});

setMode("default");
