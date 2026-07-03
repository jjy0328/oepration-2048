import { moveBoard, canMove } from "./move.js";
import { getBestScore, saveBestScore } from "./storage.js";
import {
  drawBoard,
  updateScore,
  updateBestScore,
  setMessage,
  hideMissionFail,
  showMissionFail,
  showPlus,
} from "./render.js";

export class Game2048 {
  constructor(options = {}) {
    this.board = [];
    this.score = 0;
    this.best = getBestScore();
    this.onScoreChange = options.onScoreChange || (() => {});
    this.onMissionFail = options.onMissionFail || (() => {});
    this.onMissionClear = options.onMissionClear || (() => {});
  }

  init() {
    this.board = this.createEmptyBoard();
    this.score = 0;

    this.addRandomTile();
    this.addRandomTile();

    setMessage("");
    hideMissionFail();
    this.render();
    this.onScoreChange({ score: this.score, best: this.best, gained: 0, reset: true });
  }

  createEmptyBoard() {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
  }

  addRandomTile() {
    const emptyCells = [];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!this.board[r][c]) {
          emptyCells.push([r, c]);
        }
      }
    }

    if (!emptyCells.length) return;

    const [row, col] =
      emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.board[row][col] = Math.random() < 0.9 ? 2 : 4;
  }

  move(direction) {
    const result = moveBoard(this.board, direction);

    if (!result.moved) {
      this.checkGameState();
      return;
    }

    this.board = result.board;
    this.score += result.gained;

    if (result.gained) {
      showPlus(result.gained);
    }

    if (this.score > this.best) {
      this.best = this.score;
      saveBestScore(this.best);
    }

    this.addRandomTile();
    this.render();
    this.onScoreChange({
      score: this.score,
      best: this.best,
      gained: result.gained,
      reset: false,
    });
    this.checkGameState();
  }

  checkGameState() {
    if (this.board.flat().includes(2048)) {
      setMessage("MISSION CLEAR: 2048");
      this.onMissionClear();
      return;
    }

    if (!canMove(this.board)) {
      setMessage("MISSION FAILED");
      showMissionFail();
      this.onMissionFail();
    }
  }

  render() {
    drawBoard(this.board);
    updateScore(this.score);
    updateBestScore(this.best);
  }

  getScore() {
    return this.score;
  }
}
