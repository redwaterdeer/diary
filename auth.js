const MASTER_ACCOUNT = {
  id: "redwaterdeer",
  password: "10qp29wo!Q",
};

const USERS_KEY = "diaryUsers";

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUser(id) {
  if (id === MASTER_ACCOUNT.id) {
    return MASTER_ACCOUNT;
  }
  return getUsers().find((user) => user.id === id) || null;
}

function registerUser(id, password) {
  if (id === MASTER_ACCOUNT.id) {
    return { ok: false, message: "이미 사용 중인 아이디입니다." };
  }

  const users = getUsers();
  if (users.some((user) => user.id === id)) {
    return { ok: false, message: "이미 사용 중인 아이디입니다." };
  }

  users.push({ id, password });
  saveUsers(users);
  return { ok: true };
}

function loginUser(id, password) {
  const user = findUser(id);
  if (!user || user.password !== password) {
    return { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }
  return { ok: true, user };
}
