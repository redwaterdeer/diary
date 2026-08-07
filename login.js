const form = document.getElementById("loginForm");
const loginId = document.getElementById("loginId");
const loginPw = document.getElementById("loginPw");

// 자동완성/키체인 채움 방지
form.reset();
loginId.value = "";
loginPw.value = "";
form.querySelectorAll(".autofill-trap").forEach((el) => {
  el.value = "";
  el.setAttribute("readonly", "readonly");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

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

  // 로그인 성공 시 3번 화면으로 이동
  sessionStorage.setItem("diaryUser", name);
  window.location.href = "view.html";
});
