// UI 모듈: 버튼 구성/렌더 + 이벤트 위임 + 동적 업데이트
const UI = (() => {
  const containerId = "btn-container";

  // 버튼 정의(필요 시 여러 개 추가 가능)
  const buttons = [
    {
      id: "copy-btn",
      label: "안녕하세요....", // ← 라벨 JS에서 설정
      className:
        "px-8 py-8 bg-yellow-600 text-white rounded-lg hover:bg-purple-700 transition",
      onClick: () => copyTemplate("이 텍스트가 복사됩니다!")
    }
  ];

  // id → handler 매핑(위임 처리용)
  const actions = {};

  function init() {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 클릭 이벤트 위임
    container.addEventListener("click", handleClick);

    // 초기 렌더
    render(container);
  }

  function render(container) {
    container.innerHTML = "";
    buttons.forEach((b) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = b.id;
      btn.textContent = b.label;      // ← 라벨 적용
      btn.className = b.className;    // ← 클래스 적용
      btn.dataset.action = b.id;

      // 액션 등록
      if (typeof b.onClick === "function") {
        actions[b.id] = b.onClick;
      }

      container.appendChild(btn);
    });
  }

  function handleClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const fn = actions[btn.dataset.action];
    if (typeof fn === "function") fn();
  }

  // 동적으로 라벨/클래스 변경 API (원하는 시점에 호출 가능)
  function setLabel(id, label) {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  }

  function setClass(id, className) {
    const el = document.getElementById(id);
    if (el) el.className = className;
  }

  // 외부 사용 API 노출
  return { init, setLabel, setClass };
})();

// 실제 기능: 클립보드 복사(폴백 포함)
async function copyTemplate(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // 폴백: 임시 textarea
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    alert("복사 완료!");
  } catch (err) {
    console.error("복사 실패:", err);
    alert("복사에 실패했습니다.");
  }
}

// DOM 준비되면 초기화
document.addEventListener("DOMContentLoaded", UI.init);

// ▼ 예시: 동적으로 라벨/클래스 변경
// UI.setLabel("copy-btn", "복사하기");
// UI.setClass("copy-btn", "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition");
