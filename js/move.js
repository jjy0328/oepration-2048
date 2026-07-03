// 한 줄을 왼쪽으로 밀고 합치는 함수
export function slide(row) {
  const filteredRow = row.filter(Boolean);
  let gained = 0;

  for (let i = 0; i < filteredRow.length - 1; i++) {
    if (filteredRow[i] === filteredRow[i + 1]) {
      filteredRow[i] *= 2;
      gained += filteredRow[i];
      filteredRow.splice(i + 1, 1);
    }
  }

  while (filteredRow.length < 4) {
    filteredRow.push(0);
  }

  return {
    row: filteredRow,
    gained,
  };
}

// 상하좌우 움직이는 함수
export function moveBoard(board, direction) {
  const nextBoard = board.map((row) => [...row]);
  let gained = 0;

  // 왼쪽 이동
  if (direction === "L") {
    for (let r = 0; r < 4; r++) {
      const result = slide(nextBoard[r]);
      nextBoard[r] = result.row;
      gained += result.gained;
    }
  }

  // 오른쪽 이동
  if (direction === "R") {
    for (let r = 0; r < 4; r++) {
      // 오른쪽으로 이동할 때는 배열을 뒤집어서 왼쪽으로 이동한 후 다시 뒤집는다.
      const result = slide([...nextBoard[r]].reverse());
      nextBoard[r] = result.row.reverse();
      gained += result.gained;
    }
  }

  // 위쪽 이동
  if (direction === "U") {
    for (let c = 0; c < 4; c++) {
      // 각 열을 추출하여 slide 함수를 적용
      const column = [
        nextBoard[0][c],
        nextBoard[1][c],
        nextBoard[2][c],
        nextBoard[3][c],
      ];

      const result = slide(column);

      for (let r = 0; r < 4; r++) {
        nextBoard[r][c] = result.row[r];
      }

      gained += result.gained;
    }
  }

  // 아래쪽 이동
  if (direction === "D") {
    for (let c = 0; c < 4; c++) {
      const column = [
        nextBoard[0][c],
        nextBoard[1][c],
        nextBoard[2][c],
        nextBoard[3][c],
      ];

      // 아래쪽으로 이동할 때는 배열을 뒤집어서 위쪽으로 이동한 후 다시 뒤집는다.
      const result = slide([...column].reverse());
      const reversed = result.row.reverse();

      for (let r = 0; r < 4; r++) {
        nextBoard[r][c] = reversed[r];
      }

      gained += result.gained;
    }
  }

  const moved = JSON.stringify(board) !== JSON.stringify(nextBoard);

  return {
    board: nextBoard,
    gained,
    moved,
  };
}

// 더 움직일 수 있는지 검사
export function canMove(board) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      // 빈 칸이 있으면 이동 가능
      if (!board[r][c]) return true;
      // 오른쪽 숫자와 같으면 합칠 수 있으므로 이동 가능.
      if (c < 3 && board[r][c] === board[r][c + 1]) return true;
      // 아래쪽 숫자와 같으면 합칠 수 있으므로 이동 가능.
      if (r < 3 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}
