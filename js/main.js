import { Game2048 } from "./game.js";

const game = new Game2048();

game.init();

document.getElementById("restart").addEventListener("click", () => {
  game.init();
});

// 키보드 이벤트 처리
document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowLeft: "L",
    ArrowRight: "R",
    ArrowUp: "U",
    ArrowDown: "D",
  };

  const direction = keyMap[event.key];

  if (!direction) return;

  event.preventDefault();
  game.move(direction);
});
