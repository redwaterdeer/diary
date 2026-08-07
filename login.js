const form = document.getElementById("loginForm");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const password = String(data.get("password") || "");

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
