import { Game2048 } from "./game.js";
import { ShooterBattle } from "./shooter.js";
import { setMessage, showMissionFail } from "./render.js";

let gameEnded = false;

function endGame(message) {
  gameEnded = true;
  shooter.stop();
  setMessage(message);
  showMissionFail();
}

const shooter = new ShooterBattle(
  document.getElementById("battle"),
  document.getElementById("power"),
  document.querySelector(".enemy-hp span"),
  document.querySelector(".player-hp span"),
  {
    onPlayerDestroyed() {
      endGame("SHIP DESTROYED");
    },
  },
);
const pauseButton = document.getElementById("pause");
const pauseHud = document.getElementById("pause-hud");
let paused = false;

const game = new Game2048({
  onMissionFail() {
    endGame("MISSION FAILED");
  },
  onScoreChange({ score, gained, reset }) {
    if (reset) {
      shooter.reset();
      return;
    }

    shooter.setScore(score, gained);
  },
});

game.init();
shooter.start();

function restartGame() {
  gameEnded = false;
  setPaused(false);
  game.init();
}

function setPaused(nextPaused) {
  paused = nextPaused;
  shooter.setPaused(paused);
  pauseButton.textContent = paused ? "RESUME" : "PAUSE";
  pauseHud.classList.toggle("is-visible", paused);
  setMessage(paused ? "PAUSED" : "");
}

function togglePause() {
  setPaused(!paused);
}

pauseButton.addEventListener("click", togglePause);
document.getElementById("restart").addEventListener("click", restartGame);
document.getElementById("overlay-restart").addEventListener("click", restartGame);

// 키보드 이벤트 처리
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (gameEnded) return;
    togglePause();
    return;
  }

  const keyMap = {
    ArrowLeft: "L",
    ArrowRight: "R",
    ArrowUp: "U",
    ArrowDown: "D",
  };

  const direction = keyMap[event.key];

  if (!direction) return;

  event.preventDefault();
  if (paused || gameEnded) return;

  shooter.nudgePlayer(direction);
  game.move(direction);
});
