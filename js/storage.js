const BEST_SCORE_KEY = "shooterPixel2048Best";

// 베스트 스코어를 로컬 스토리지에서 가져오는 함수
export function getBestScore() {
  return Number(localStorage.getItem(BEST_SCORE_KEY) || 0);
}

// 베스트 스코어를 로컬 스토리지에 저장하는 함수
export function saveBestScore(score) {
  localStorage.setItem(BEST_SCORE_KEY, String(score));
}
