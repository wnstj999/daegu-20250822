  const box = document.getElementById("box-container");

  // 모든 마우스 관련 이벤트
  const mouseEvents = [
    "click",        // 클릭
    "dblclick",     // 더블 클릭
    "mouseenter",   // 영역 안에 처음 진입
    "mouseleave",   // 영역 밖으로 나감
    "mouseover",    // 요소 위로 올라감 (자식까지 감지)
    "mouseout",     // 요소 밖으로 나감 (자식까지 감지)
    "mousemove",    // 이동
    "mousedown",    // 버튼 누름
    "mouseup",      // 버튼 뗌
    "contextmenu"   // 우클릭 메뉴
  ];

  // 이벤트 핸들러
  function handleMouseEvent(e) {
    console.log(`이벤트 발생: ${e.type}`);
    box.innerText = `이벤트: ${e.type}`;
  }

  // 모든 이벤트 등록
  mouseEvents.forEach(event => {
    box.addEventListener(event, handleMouseEvent);
  });

