import { Game2048 } from "./game.js";
import { ShooterBattle } from "./shooter.js";
import { hideMissionFail, setMessage, showMissionFail } from "./render.js";

let gameEnded = false;
let gameStarted = false;
let shooterStarted = false;
let currentScreen = "home";

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
const screens = {
  home: document.getElementById("home-screen"),
  tutorial: document.getElementById("tutorial-screen"),
  coming: document.getElementById("coming-screen"),
  game: document.getElementById("game-screen"),
};
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

function showScreen(name) {
  currentScreen = name;

  Object.entries(screens).forEach(([screenName, element]) => {
    const isActive = screenName === name;
    element.classList.toggle("is-active", isActive);
    element.setAttribute("aria-hidden", String(!isActive));
  });
}

function startSoloGame() {
  gameEnded = false;
  gameStarted = true;
  showScreen("game");
  hideMissionFail();
  setPaused(false);
  game.init();

  if (!shooterStarted) {
    shooter.start();
    shooterStarted = true;
  }
}

function restartGame() {
  if (!gameStarted) {
    startSoloGame();
    return;
  }

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
document.getElementById("home").addEventListener("click", () => {
  if (gameStarted && !gameEnded) {
    setPaused(true);
  }

  hideMissionFail();
  showScreen("home");
});
document.getElementById("restart").addEventListener("click", restartGame);
document.getElementById("overlay-restart").addEventListener("click", restartGame);
document.getElementById("solo-mode").addEventListener("click", startSoloGame);
document.getElementById("tutorial-start").addEventListener("click", startSoloGame);
document.getElementById("tutorial-mode").addEventListener("click", () => {
  showScreen("tutorial");
});
document.getElementById("dual-mode").addEventListener("click", () => {
  showScreen("coming");
});
document.querySelectorAll(".back-home").forEach((button) => {
  button.addEventListener("click", () => {
    showScreen("home");
  });
});

// 키보드 이벤트 처리
document.addEventListener("keydown", (event) => {
  if (currentScreen !== "game") return;

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
