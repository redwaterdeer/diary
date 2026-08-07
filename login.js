const loginForm = document.getElementById("loginForm");
const fieldId = document.getElementById("fieldId");
const fieldPw = document.getElementById("fieldPw");
const loginBtn = document.getElementById("loginBtn");

let loginId = null;
let loginPw = null;

function createFieldInput(options) {
  const input = document.createElement("input");
  input.type = "text";
  input.id = options.id;
  input.className = options.className || "";
  // iOS 키체인/암호채우기가 로그인 필드로 인식하지 않도록
  input.setAttribute("autocomplete", "one-time-code");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("spellcheck", "false");
  input.setAttribute("inputmode", "text");
  input.setAttribute("data-lpignore", "true");
  input.setAttribute("data-1p-ignore", "true");
  input.setAttribute("data-form-type", "other");
  input.setAttribute("name", options.name);
  input.value = "";
  return input;
}

function ensureInputs() {
  if (!loginId) {
    loginId = createFieldInput({
      id: "loginId",
      name: "x_" + Math.random().toString(36).slice(2, 8),
    });
    fieldId.appendChild(loginId);
  }
  if (!loginPw) {
    loginPw = createFieldInput({
      id: "loginPw",
      name: "y_" + Math.random().toString(36).slice(2, 8),
      className: "field-secret",
    });
    fieldPw.appendChild(loginPw);
  }
}

function focusField(field, input) {
  ensureInputs();
  const target = input || (field === fieldId ? loginId : loginPw);
  target.focus();
}

// 탭할 때까지 input을 DOM에 두지 않아 초기 로드 시 키체인 시트를 막음
fieldId.addEventListener("pointerdown", (event) => {
  if (event.target === loginId) return;
  event.preventDefault();
  focusField(fieldId, null);
});
fieldPw.addEventListener("pointerdown", (event) => {
  if (event.target === loginPw) return;
  event.preventDefault();
  focusField(fieldPw, null);
});

function doLogin() {
  ensureInputs();
  const name = String(loginId.value || "").trim();
  const password = String(loginPw.value || "");

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
  if (event.key === "Enter") {
    event.preventDefault();
    doLogin();
  }
});
