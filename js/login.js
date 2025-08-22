const dummyUser = {
  username: "admin",
  password: "1234"
};

document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault(); // 폼 제출 시 새로고침 방지

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("message");

  if (username === dummyUser.username && password === dummyUser.password) {
    message.style.color = "green";
    message.textContent = "로그인 성공!";
    // 여기서 다른 페이지로 이동 가능
    // window.location.href = "dashboard.html";
  } else {
    message.style.color = "red";
    message.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
  }});