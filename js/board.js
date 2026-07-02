// 데이터만 관리하고 DOM은 관리하지 않는 모듈
export let board = [];

export function createBoard() {
  board = Array.from({ length: 4 }, () => Array(4).fill(0));
}

export function addRandomTile() {}
