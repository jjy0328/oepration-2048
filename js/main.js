import { Game2048 } from "./game.js";
import {
  getNickname,
  isLeaderboardOnline,
  loadTopScores,
  saveNickname,
  submitScore,
} from "./leaderboard.js";
import { ShooterBattle } from "./shooter.js";
import { hideMissionFail, setMessage, showMissionFail } from "./render.js";

let gameEnded = false;
let gameStarted = false;
let shooterStarted = false;
let currentScreen = "home";
let playerNickname = getNickname();
let lastSubmittedScore = 0;
let pendingScoreSubmit = null;

function endGame(message) {
  if (gameEnded) return;

  gameEnded = true;
  shooter.stop();
  setMessage(message);
  showMissionFail(message);
  submitCurrentScore();
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
const nicknameForm = document.getElementById("nickname-form");
const nicknameInput = document.getElementById("nickname-input");
const nicknameStatus = document.getElementById("nickname-status");
const leaderboardList = document.getElementById("leaderboard-list");
const battleLeaderboardList = document.getElementById("battle-leaderboard-list");
const leaderboardStatus = document.getElementById("leaderboard-status");
const currentPlayerElement = document.getElementById("current-player");
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
  onMissionClear() {
    endGame("MISSION CLEAR: 2048");
  },
  onScoreChange({ score, gained, reset }) {
    if (reset) {
      shooter.reset();
      return;
    }

    shooter.setScore(score, gained);
    scheduleScoreSubmit(score);
  },
});

function setNicknameStatus(text) {
  nicknameStatus.textContent = text;
}

function syncNicknameUi() {
  nicknameInput.value = playerNickname;
  currentPlayerElement.textContent = playerNickname || "NO PILOT";
  setNicknameStatus(
    playerNickname ? `PILOT: ${playerNickname}` : "닉네임을 먼저 입력하세요",
  );
}

function renderLeaderboardList(listElement, scores) {
  listElement.innerHTML = "";

  if (!scores.length) {
    const item = document.createElement("li");
    item.className = "leaderboard-empty";
    item.textContent = "NO SCORE";
    listElement.appendChild(item);
    return;
  }

  scores.slice(0, 10).forEach((entry, index) => {
    const item = document.createElement("li");
    const rank = document.createElement("b");
    const nickname = document.createElement("span");
    const score = document.createElement("strong");

    rank.textContent = String(index + 1).padStart(2, "0");
    nickname.textContent = entry.nickname;
    score.textContent = entry.score;

    item.append(rank, nickname, score);
    listElement.appendChild(item);
  });
}

function renderLeaderboard(scores) {
  renderLeaderboardList(leaderboardList, scores);
  renderLeaderboardList(battleLeaderboardList, scores);
}

async function refreshLeaderboard() {
  leaderboardStatus.textContent = "LOADING";

  try {
    const scores = await loadTopScores();

    renderLeaderboard(scores);
    leaderboardStatus.textContent = isLeaderboardOnline() ? "SUPABASE" : "LOCAL";
  } catch (error) {
    leaderboardStatus.textContent = "LOAD FAILED";
    console.error(error);
  }
}

async function submitCurrentScore() {
  if (pendingScoreSubmit) {
    clearTimeout(pendingScoreSubmit);
    pendingScoreSubmit = null;
  }

  if (!playerNickname) return;

  const score = game.getScore();

  if (score <= 0 || score <= lastSubmittedScore) return;

  try {
    await submitScore(playerNickname, score);
    lastSubmittedScore = score;
    await refreshLeaderboard();
  } catch (error) {
    leaderboardStatus.textContent = "SAVE FAILED";
    console.error(error);
  }
}

function scheduleScoreSubmit(score) {
  if (!playerNickname || score <= 0 || score <= lastSubmittedScore) return;

  if (pendingScoreSubmit) {
    clearTimeout(pendingScoreSubmit);
  }

  pendingScoreSubmit = setTimeout(() => {
    pendingScoreSubmit = null;
    submitCurrentScore();
  }, 700);
}

function updateNicknameFromInput() {
  const nextNickname = saveNickname(nicknameInput.value);

  if (!nextNickname) {
    playerNickname = "";
    setNicknameStatus("닉네임을 입력하세요");
    return false;
  }

  playerNickname = nextNickname;
  syncNicknameUi();
  return true;
}

function showScreen(name) {
  currentScreen = name;

  Object.entries(screens).forEach(([screenName, element]) => {
    const isActive = screenName === name;
    element.classList.toggle("is-active", isActive);
    element.setAttribute("aria-hidden", String(!isActive));
  });
}

function startSoloGame() {
  if (!playerNickname && !updateNicknameFromInput()) {
    nicknameInput.focus();
    return;
  }

  gameEnded = false;
  lastSubmittedScore = 0;
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

  submitCurrentScore();
  gameEnded = false;
  lastSubmittedScore = 0;
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

function playMove(direction) {
  if (paused || gameEnded) return;

  shooter.nudgePlayer(direction);
  game.move(direction);
}

pauseButton.addEventListener("click", togglePause);
nicknameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateNicknameFromInput();
});
document.getElementById("home").addEventListener("click", () => {
  if (gameStarted && !gameEnded) {
    submitCurrentScore();
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

let touchStartX = 0;
let touchStartY = 0;
let touchTracking = false;

document.addEventListener(
  "touchstart",
  (event) => {
    if (currentScreen !== "game" || !event.touches.length) return;
    if (!event.target.closest("#board, #battle")) return;

    touchTracking = true;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  },
  { passive: true },
);

document.addEventListener(
  "touchmove",
  (event) => {
    if (currentScreen !== "game" || !touchTracking) return;
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener(
  "touchend",
  (event) => {
    if (currentScreen !== "game" || !touchTracking) return;

    touchTracking = false;
    const touch = event.changedTouches[0];
    if (!touch) return;

    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    const swipeThreshold = 24;

    if (Math.max(absX, absY) < swipeThreshold) return;

    event.preventDefault();
    const direction =
      absX > absY ? (diffX > 0 ? "R" : "L") : diffY > 0 ? "D" : "U";
    playMove(direction);
  },
  { passive: false },
);

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
  playMove(direction);
});

syncNicknameUi();
refreshLeaderboard();
