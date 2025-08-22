// 간단한 로그인 모듈 (바닐라 JS)

// 더미 계정
const dummyUser = {
  username: "admin",
  password: "1234"
};

const form = document.querySelector("#loginForm");
const message = document.querySelector("#message");

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const username = document.querySelector("#username").value.trim();
  const password = document.querySelector("#password").value.trim();

  // 초기화 (클래스 제거)
  message.className = "";

  if (username === dummyUser.username && password === dummyUser.password) {
    message.classList.add("success");
    message.textContent = "✅ 로그인 성공!";
    // window.location.href = "dashboard.html";
  } else {
    message.classList.add("error");
    message.textContent = "❌ 아이디 또는 비밀번호가 올바르지 않습니다.";
  }
});
