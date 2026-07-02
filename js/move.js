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

export function moveBoard(board, direction) {
  const nextBoard = board.map((row) => [...row]);
  let gained = 0;

  if (direction === "L") {
    for (let r = 0; r < 4; r++) {
      const result = slide(nextBoard[r]);
      nextBoard[r] = result.row;
      gained += result.gained;
    }
  }

  if (direction === "R") {
    for (let r = 0; r < 4; r++) {
      const result = slide([...nextBoard[r]].reverse());
      nextBoard[r] = result.row.reverse();
      gained += result.gained;
    }
  }

  if (direction === "U") {
    for (let c = 0; c < 4; c++) {
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

  if (direction === "D") {
    for (let c = 0; c < 4; c++) {
      const column = [
        nextBoard[0][c],
        nextBoard[1][c],
        nextBoard[2][c],
        nextBoard[3][c],
      ];

      const result = slide(column);
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

export function canMove(board) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) return true;
      if (c < 3 && board[r][c] === board[r][c + 1]) return true;
      if (r < 3 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}
