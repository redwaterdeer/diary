const loginForm = document.getElementById("loginForm");
const fieldId = document.getElementById("fieldId");
const fieldPw = document.getElementById("fieldPw");
const loginId = document.getElementById("loginId");
const loginPw = document.getElementById("loginPw");
const loginBtn = document.getElementById("loginBtn");

// contenteditable 비밀번호 실값 (화면에 ●만 표시)
let secretValue = "";

function placeCaretEnd(el) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function renderSecret() {
  loginPw.textContent = "•".repeat(secretValue.length);
  placeCaretEnd(loginPw);
}

function getIdValue() {
  return String(loginId.textContent || "").replace(/\u00a0/g, " ").trim();
}

// 이름 칸: 줄바꿈 방지
loginId.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    loginPw.focus();
  }
});

loginId.addEventListener("paste", (event) => {
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData).getData("text");
  document.execCommand("insertText", false, String(text || "").replace(/\r?\n/g, ""));
});

// 비밀번호 칸: input이 아니므로 iOS 암호채우기 대상이 아님
loginPw.addEventListener("beforeinput", (event) => {
  event.preventDefault();
  const type = event.inputType || "";

  if (type === "insertText" || type === "insertCompositionText") {
    const data = event.data || "";
    if (data) secretValue += data.replace(/\r?\n/g, "");
  } else if (type === "insertFromPaste") {
    const data = event.data || "";
    if (data) secretValue += data.replace(/\r?\n/g, "");
  } else if (
    type === "deleteContentBackward" ||
    type === "deleteContent"
  ) {
    secretValue = secretValue.slice(0, -1);
  } else if (type === "deleteContentForward") {
    // 커서를 끝으로만 쓰므로 동일 처리
    secretValue = secretValue.slice(0, -1);
  } else if (type === "deleteByCut") {
    secretValue = "";
  }

  renderSecret();
});

loginPw.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    doLogin();
    return;
  }
  // 일부 iOS에서 beforeinput이 안 오는 키 대응
  if (event.key === "Backspace") {
    event.preventDefault();
    secretValue = secretValue.slice(0, -1);
    renderSecret();
  }
});

loginPw.addEventListener("paste", (event) => {
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData).getData("text");
  secretValue += String(text || "").replace(/\r?\n/g, "");
  renderSecret();
});

// 필드 빈 영역 탭 시 포커스
fieldId.addEventListener("pointerdown", (event) => {
  if (event.target === loginId) return;
  event.preventDefault();
  loginId.focus();
  placeCaretEnd(loginId);
});
fieldPw.addEventListener("pointerdown", (event) => {
  if (event.target === loginPw) return;
  event.preventDefault();
  loginPw.focus();
  placeCaretEnd(loginPw);
});

function doLogin() {
  const name = getIdValue();
  const password = secretValue;

  if (!name || !password) {
    alert("이름과 비밀번호를 입력해 주세요.");
    return;
  }

  const result = loginUser(name, password);
  if (!result.ok) {
    alert(result.message);
    return;
  }

  sessionStorage.setItem("diaryUser", name);
  window.location.href = "view.html";
}

loginBtn.addEventListener("click", doLogin);

loginForm.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && document.activeElement === loginId) {
    event.preventDefault();
    loginPw.focus();
  }
});
