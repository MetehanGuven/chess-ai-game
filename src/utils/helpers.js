// Yardımcı Fonksiyonlar - helpers.js

// Koordinat Dönüştürme Fonksiyonları
function indexToPosition(index) {
    const row = Math.floor(index / 8);
    const col = index % 8;
    return { row, col };
}

function positionToIndex(row, col) {
    return row * 8 + col;
}

function positionToNotation(row, col) {
    return FILES[col] + RANKS[row];
}

function notationToPosition(notation) {
    const file = notation[0];
    const rank = notation[1];
    const col = FILES.indexOf(file);
    const row = RANKS.indexOf(rank);
    return { row, col };
}

// Tahta Kontrolü Fonksiyonları
function isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isEmpty(board, row, col) {
    return !isValidPosition(row, col) ? false : board[row][col] === null;
}

function isEnemy(board, row, col, color) {
    if (!isValidPosition(row, col) || isEmpty(board, row, col)) return false;
    const piece = PIECE_SYMBOLS[board[row][col]];
    return piece && piece.color !== color;
}

function isFriendly(board, row, col, color) {
    if (!isValidPosition(row, col) || isEmpty(board, row, col)) return false;
    const piece = PIECE_SYMBOLS[board[row][col]];
    return piece && piece.color === color;
}

// Taş Rengi Fonksiyonları
function getPieceColor(piece) {
    if (!piece) return null;
    const pieceInfo = PIECE_SYMBOLS[piece];
    return pieceInfo ? pieceInfo.color : null;
}

function isWhitePiece(piece) {
    return getPieceColor(piece) === COLORS.WHITE;
}

function isBlackPiece(piece) {
    return getPieceColor(piece) === COLORS.BLACK;
}

// Taş Tipi Fonksiyonları
function getPieceType(piece) {
    if (!piece) return null;
    const pieceInfo = PIECE_SYMBOLS[piece];
    return pieceInfo ? pieceInfo.type : null;
}

function isPawn(piece) {
    return getPieceType(piece) === PIECE_TYPES.PAWN;
}

function isKing(piece) {
    return getPieceType(piece) === PIECE_TYPES.KING;
}

function isRook(piece) {
    return getPieceType(piece) === PIECE_TYPES.ROOK;
}

// Tahta Kopyalama
function copyBoard(board) {
    return board.map(row => [...row]);
}

// Kral Pozisyonu Bulma
function findKing(board, color) {
    const kingSymbol = color === COLORS.WHITE ? 'K' : 'k';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === kingSymbol) {
                return { row, col };
            }
        }
    }
    return null;
}

// Şah Kontrolü
function isInCheck(board, color) {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;
    
    const enemyColor = color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Tüm düşman taşlarının saldırabileceği kareleri kontrol et
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && getPieceColor(piece) === enemyColor) {
                const attacks = getPieceAttacks(board, row, col);
                if (attacks.some(attack => attack.row === kingPos.row && attack.col === kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Taş Saldırı Alanları
function getPieceAttacks(board, row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    
    const pieceType = getPieceType(piece);
    const color = getPieceColor(piece);
    
    switch (pieceType) {
        case PIECE_TYPES.PAWN:
            return getPawnAttacks(row, col, color);
        case PIECE_TYPES.ROOK:
            return getRookAttacks(board, row, col);
        case PIECE_TYPES.BISHOP:
            return getBishopAttacks(board, row, col);
        case PIECE_TYPES.QUEEN:
            return getQueenAttacks(board, row, col);
        case PIECE_TYPES.KING:
            return getKingAttacks(row, col);
        case PIECE_TYPES.KNIGHT:
            return getKnightAttacks(row, col);
        default:
            return [];
    }
}

// Piyon Saldırı Alanları
function getPawnAttacks(row, col, color) {
    const attacks = [];
    const direction = color === COLORS.WHITE ? -1 : 1;
    
    // Çapraz saldırılar
    const leftAttack = { row: row + direction, col: col - 1 };
    const rightAttack = { row: row + direction, col: col + 1 };
    
    if (isValidPosition(leftAttack.row, leftAttack.col)) {
        attacks.push(leftAttack);
    }
    if (isValidPosition(rightAttack.row, rightAttack.col)) {
        attacks.push(rightAttack);
    }
    
    return attacks;
}

// Kale Saldırı Alanları
function getRookAttacks(board, row, col) {
    const attacks = [];
    const directions = [DIRECTIONS.NORTH, DIRECTIONS.SOUTH, DIRECTIONS.EAST, DIRECTIONS.WEST];
    
    for (const [dr, dc] of directions) {
        let newRow = row + dr;
        let newCol = col + dc;
        
        while (isValidPosition(newRow, newCol)) {
            attacks.push({ row: newRow, col: newCol });
            
            // Taş varsa dur
            if (!isEmpty(board, newRow, newCol)) break;
            
            newRow += dr;
            newCol += dc;
        }
    }
    
    return attacks;
}

// Fil Saldırı Alanları
function getBishopAttacks(board, row, col) {
    const attacks = [];
    const directions = [DIRECTIONS.NORTHEAST, DIRECTIONS.NORTHWEST, DIRECTIONS.SOUTHEAST, DIRECTIONS.SOUTHWEST];
    
    for (const [dr, dc] of directions) {
        let newRow = row + dr;
        let newCol = col + dc;
        
        while (isValidPosition(newRow, newCol)) {
            attacks.push({ row: newRow, col: newCol });
            
            // Taş varsa dur
            if (!isEmpty(board, newRow, newCol)) break;
            
            newRow += dr;
            newCol += dc;
        }
    }
    
    return attacks;
}

// Vezir Saldırı Alanları
function getQueenAttacks(board, row, col) {
    return [...getRookAttacks(board, row, col), ...getBishopAttacks(board, row, col)];
}

// At Saldırı Alanları
function getKnightAttacks(row, col) {
    const attacks = [];
    
    for (const [dr, dc] of KNIGHT_MOVES) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (isValidPosition(newRow, newCol)) {
            attacks.push({ row: newRow, col: newCol });
        }
    }
    
    return attacks;
}

// Kral Saldırı Alanları
function getKingAttacks(row, col) {
    const attacks = [];
    
    for (const [dr, dc] of KING_MOVES) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (isValidPosition(newRow, newCol)) {
            attacks.push({ row: newRow, col: newCol });
        }
    }
    
    return attacks;
}

// Hamle Geçerliliği Kontrolü
function isValidMove(board, fromRow, fromCol, toRow, toCol, gameState) {
    // Temel kontroller
    if (!isValidPosition(fromRow, fromCol) || !isValidPosition(toRow, toCol)) return false;
    if (fromRow === toRow && fromCol === toCol) return false;
    
    const piece = board[fromRow][fromCol];
    if (!piece) return false;
    
    const pieceColor = getPieceColor(piece);
    const targetPiece = board[toRow][toCol];
    
    // Kendi taşına saldırı kontrolü
    if (targetPiece && getPieceColor(targetPiece) === pieceColor) return false;
    
    // Taşın hareket kurallarına uygunluk kontrolü
    if (!isPieceMoveValid(board, fromRow, fromCol, toRow, toCol, gameState)) return false;
    
    // Şah kontrolü - hareket sonrası kral şahta kalmamalı
    const tempBoard = copyBoard(board);
    tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
    tempBoard[fromRow][fromCol] = null;
    
    if (isInCheck(tempBoard, pieceColor)) return false;
    
    return true;
}

// Taş Hareket Kuralları Kontrolü
function isPieceMoveValid(board, fromRow, fromCol, toRow, toCol, gameState) {
    const piece = board[fromRow][fromCol];
    const pieceType = getPieceType(piece);
    const pieceColor = getPieceColor(piece);
    
    switch (pieceType) {
        case PIECE_TYPES.PAWN:
            return isPawnMoveValid(board, fromRow, fromCol, toRow, toCol, gameState);
        case PIECE_TYPES.ROOK:
            return isRookMoveValid(board, fromRow, fromCol, toRow, toCol);
        case PIECE_TYPES.BISHOP:
            return isBishopMoveValid(board, fromRow, fromCol, toRow, toCol);
        case PIECE_TYPES.QUEEN:
            return isQueenMoveValid(board, fromRow, fromCol, toRow, toCol);
        case PIECE_TYPES.KING:
            return isKingMoveValid(board, fromRow, fromCol, toRow, toCol, gameState);
        case PIECE_TYPES.KNIGHT:
            return isKnightMoveValid(fromRow, fromCol, toRow, toCol);
        default:
            return false;
    }
}

// Piyon Hareket Kontrolü
function isPawnMoveValid(board, fromRow, fromCol, toRow, toCol, gameState) {
    const piece = board[fromRow][fromCol];
    const pieceColor = getPieceColor(piece);
    const direction = pieceColor === COLORS.WHITE ? -1 : 1;
    const startRow = pieceColor === COLORS.WHITE ? 6 : 1;
    
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    // İleri hareket
    if (colDiff === 0) {
        // Bir kare ileri
        if (rowDiff === direction && isEmpty(board, toRow, toCol)) return true;
        // İki kare ileri (başlangıç pozisyonu)
        if (fromRow === startRow && rowDiff === 2 * direction && 
            isEmpty(board, toRow, toCol) && isEmpty(board, fromRow + direction, fromCol)) return true;
    }
    // Çapraz saldırı
    else if (colDiff === 1 && rowDiff === direction) {
        // Normal saldırı
        if (!isEmpty(board, toRow, toCol) && isEnemy(board, toRow, toCol, pieceColor)) return true;
        // En passant
        if (gameState.enPassant && gameState.enPassant.row === toRow && gameState.enPassant.col === toCol) return true;
    }
    
    return false;
}

// Kale Hareket Kontrolü
function isRookMoveValid(board, fromRow, fromCol, toRow, toCol) {
    // Yatay veya dikey hareket
    if (fromRow !== toRow && fromCol !== toCol) return false;
    
    // Yol kontrolü
    return isPathClear(board, fromRow, fromCol, toRow, toCol);
}

// Fil Hareket Kontrolü
function isBishopMoveValid(board, fromRow, fromCol, toRow, toCol) {
    // Çapraz hareket
    if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
    
    // Yol kontrolü
    return isPathClear(board, fromRow, fromCol, toRow, toCol);
}

// Vezir Hareket Kontrolü
function isQueenMoveValid(board, fromRow, fromCol, toRow, toCol) {
    return isRookMoveValid(board, fromRow, fromCol, toRow, toCol) || 
           isBishopMoveValid(board, fromRow, fromCol, toRow, toCol);
}

// At Hareket Kontrolü
function isKnightMoveValid(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

// Kral Hareket Kontrolü
function isKingMoveValid(board, fromRow, fromCol, toRow, toCol, gameState) {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    
    // Normal kral hareketi
    if (rowDiff <= 1 && colDiff <= 1) return true;
    
    // Rok kontrolü
    if (rowDiff === 0 && colDiff === 2) {
        return isCastlingValid(board, fromRow, fromCol, toRow, toCol, gameState);
    }
    
    return false;
}

// Rok Kontrolü
function isCastlingValid(board, fromRow, fromCol, toRow, toCol, gameState) {
    const piece = board[fromRow][fromCol];
    const pieceColor = getPieceColor(piece);
    
    // Kral hareket etmiş mi?
    if (gameState.castling[pieceColor].kingMoved) return false;
    
    const isKingSide = toCol > fromCol;
    const rookCol = isKingSide ? 7 : 0;
    
    // Kale hareket etmiş mi?
    if (isKingSide && gameState.castling[pieceColor].kingSideRookMoved) return false;
    if (!isKingSide && gameState.castling[pieceColor].queenSideRookMoved) return false;
    
    // Yol temiz mi?
    const startCol = Math.min(fromCol, rookCol);
    const endCol = Math.max(fromCol, rookCol);
    
    for (let col = startCol + 1; col < endCol; col++) {
        if (!isEmpty(board, fromRow, col)) return false;
    }
    
    // Kral şahta mı veya geçeceği kareler şahta mı?
    if (isInCheck(board, pieceColor)) return false;
    
    const step = isKingSide ? 1 : -1;
    for (let i = 1; i <= 2; i++) {
        const tempBoard = copyBoard(board);
        tempBoard[fromRow][fromCol + i * step] = tempBoard[fromRow][fromCol];
        tempBoard[fromRow][fromCol] = null;
        
        if (isInCheck(tempBoard, pieceColor)) return false;
    }
    
    return true;
}

// Yol Temizliği Kontrolü
function isPathClear(board, fromRow, fromCol, toRow, toCol) {
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    
    let currentRow = fromRow + rowStep;
    let currentCol = fromCol + colStep;
    
    while (currentRow !== toRow || currentCol !== toCol) {
        if (!isEmpty(board, currentRow, currentCol)) return false;
        currentRow += rowStep;
        currentCol += colStep;
    }
    
    return true;
}

// Oyun Durumu Kontrolü
function getGameStatus(board, color, gameState) {
    if (isInCheck(board, color)) {
        if (hasValidMoves(board, color, gameState)) {
            return GAME_STATUS.CHECK;
        } else {
            return GAME_STATUS.CHECKMATE;
        }
    } else {
        if (hasValidMoves(board, color, gameState)) {
            return GAME_STATUS.PLAYING;
        } else {
            return GAME_STATUS.STALEMATE;
        }
    }
}

// Geçerli Hamle Varlığı Kontrolü
function hasValidMoves(board, color, gameState) {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece && getPieceColor(piece) === color) {
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(board, fromRow, fromCol, toRow, toCol, gameState)) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

// Zaman Formatı
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Ses Çalma
function playSound(soundType) {
    try {
        const audio = new Audio(SOUNDS[soundType]);
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ses çalınamazsa hata vermesin
    } catch (error) {
        // Ses dosyası yoksa sessizce devam et
    }
}