(function () {
  function bindBackLinks() {
    document.querySelectorAll("a").forEach((anchor) => {
      if (anchor.textContent.trim() !== "이전") return;
      if (anchor.dataset.backBound) return;
      anchor.dataset.backBound = "1";

      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        const fallback = anchor.getAttribute("href");
        if (fallback && fallback !== "#") {
          window.location.href = fallback;
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindBackLinks);
  } else {
    bindBackLinks();
  }
})();
