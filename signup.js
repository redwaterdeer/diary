const form = document.getElementById("signupForm");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const password = String(data.get("password") || "");

  if (!name || !password) {
    alert("이름과 비밀번호를 입력해 주세요.");
    return;
  }

  const result = registerUser(name, password);
  if (!result.ok) {
    alert(result.message);
    return;
  }

  alert(`${name}님, 등록이 완료되었습니다.`);
  window.location.href = "index.html";
});
