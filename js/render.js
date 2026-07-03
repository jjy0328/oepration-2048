import { palette } from "./palette.js";

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best");
const messageElement = document.getElementById("msg");
const powerElement = document.getElementById("power");
const missionOverlayElement = document.getElementById("mission-overlay");
const missionOverlayTitleElement = missionOverlayElement.querySelector("strong");

// 보드 데이터를 화면으로 변환
export function drawBoard(board) {
  boardElement.innerHTML = "";

  board.flat().forEach((value) => {
    const cell = document.createElement("div");
    cell.className = `cell${value ? " tile" : ""}`;

    const span = document.createElement("span");
    span.textContent = value || "";

    cell.appendChild(span);

    if (value) {
      const [backgroundColor, color] = palette[value] || ["#FFF0A8", "#172033"];
      cell.style.background = backgroundColor;
      cell.style.color = color;
    }

    boardElement.appendChild(cell);
  });
}

export function updateScore(score) {
  scoreElement.textContent = score;
}

export function updateBestScore(best) {
  bestElement.textContent = best;
}

export function updatePower(power) {
  powerElement.textContent = `LV ${power}`;
}

export function setMessage(text) {
  messageElement.textContent = text;
}

export function showMissionFail(title = "MISSION FAILED") {
  missionOverlayTitleElement.textContent = title;
  missionOverlayElement.classList.add("is-visible");
  missionOverlayElement.setAttribute("aria-hidden", "false");
}

export function hideMissionFail() {
  missionOverlayElement.classList.remove("is-visible");
  missionOverlayElement.setAttribute("aria-hidden", "true");
}

export function showPlus(amount) {
  const rect = boardElement.getBoundingClientRect();

  const element = document.createElement("div");
  element.className = "floating-plus";
  element.textContent = `+${amount}`;
  element.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
  element.style.top = `${rect.top + 10 + window.scrollY}px`;

  document.body.appendChild(element);

  setTimeout(() => {
    element.remove();
  }, 720);
}
