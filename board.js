// Satranç Tahtası Mantığı - board.js

class ChessBoard {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = COLORS.WHITE;
        this.gameState = this.initializeGameState();
        this.moveHistory = [];
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameStatus = GAME_STATUS.PLAYING;
        this.moveCount = 0;
        this.gameStartTime = Date.now();
    }

    // Tahta Başlatma
    initializeBoard() {
        return [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
    }

    // Oyun Durumu Başlatma
    initializeGameState() {
        return {
            castling: {
                [COLORS.WHITE]: {
                    kingMoved: false,
                    kingSideRookMoved: false,
                    queenSideRookMoved: false
                },
                [COLORS.BLACK]: {
                    kingMoved: false,
                    kingSideRookMoved: false,
                    queenSideRookMoved: false
                }
            },
            enPassant: null,
            halfMoveClock: 0,
            fullMoveNumber: 1
        };
    }

    // Taşları Yerleştirme
    setPiece(row, col, piece) {
        if (isValidPosition(row, col)) {
            this.board[row][col] = piece;
        }
    }

    // Taş Alma
    getPiece(row, col) {
        if (isValidPosition(row, col)) {
            return this.board[row][col];
        }
        return null;
    }

    // Kare Seçimi
    selectSquare(row, col) {
        const piece = this.getPiece(row, col);
        
        // Eğer seçili kare varsa ve tıklanan kare geçerli hamle ise hamle yap
        if (this.selectedSquare && this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
            this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            this.clearSelection();
            return true;
        }
        
        // Eğer oyuncunun taşı ise seç
        if (piece && getPieceColor(piece) === this.currentPlayer) {
            this.selectedSquare = { row, col };
            this.validMoves = this.getValidMovesForPiece(row, col);
            return true;
        }
        
        // Seçimi temizle
        this.clearSelection();
        return false;
    }

    // Seçimi Temizle
    clearSelection() {
        this.selectedSquare = null;
        this.validMoves = [];
    }

    // Taş İçin Geçerli Hamleleri Al
    getValidMovesForPiece(row, col) {
        const moves = [];
        const piece = this.getPiece(row, col);
        
        if (!piece || getPieceColor(piece) !== this.currentPlayer) {
            return moves;
        }

        for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
                if (this.isValidMove(row, col, toRow, toCol)) {
                    moves.push({ row: toRow, col: toCol });
                }
            }
        }

        return moves;
    }

    // Hamle Geçerliliği Kontrolü
    isValidMove(fromRow, fromCol, toRow, toCol) {
        return isValidMove(this.board, fromRow, fromCol, toRow, toCol, this.gameState);
    }

    // Hamle Yapma
    makeMove(fromRow, fromCol, toRow, toCol) {
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) {
            return false;
        }

        const piece = this.getPiece(fromRow, fromCol);
        const capturedPiece = this.getPiece(toRow, toCol);
        const pieceType = getPieceType(piece);
        const pieceColor = getPieceColor(piece);

        // Hamle bilgilerini kaydet
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece,
            captured: capturedPiece,
            type: MOVE_TYPES.NORMAL,
            notation: this.getMoveNotation(fromRow, fromCol, toRow, toCol, piece, capturedPiece)
        };

        // Özel hamle tiplerini kontrol et
        if (pieceType === PIECE_TYPES.KING && Math.abs(toCol - fromCol) === 2) {
            move.type = toCol > fromCol ? MOVE_TYPES.CASTLE_KINGSIDE : MOVE_TYPES.CASTLE_QUEENSIDE;
            this.performCastling(fromRow, fromCol, toRow, toCol);
        } else if (pieceType === PIECE_TYPES.PAWN && this.gameState.enPassant && 
                   toRow === this.gameState.enPassant.row && toCol === this.gameState.enPassant.col) {
            move.type = MOVE_TYPES.EN_PASSANT;
            move.captured = this.getPiece(fromRow, toCol);
            this.board[fromRow][toCol] = null; // En passant ile alınan piyonu kaldır
        } else {
            // Normal hamle
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
        }

        // Piyon terfi kontrolü
        if (pieceType === PIECE_TYPES.PAWN && (toRow === 0 || toRow === 7)) {
            move.type = MOVE_TYPES.PROMOTION;
            const promotedPiece = pieceColor === COLORS.WHITE ? 'Q' : 'q'; // Otomatik vezir terfi
            this.board[toRow][toCol] = promotedPiece;
            move.promoted = promotedPiece;
        }

        // Oyun durumu güncellemeleri
        this.updateGameState(move);
        this.moveHistory.push(move);
        this.moveCount++;

        // Sıra değiştir
        this.currentPlayer = this.currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

        // Oyun durumunu kontrol et
        this.gameStatus = getGameStatus(this.board, this.currentPlayer, this.gameState);

        // Ses efekti
        if (move.captured) {
            playSound('CAPTURE');
        } else if (move.type === MOVE_TYPES.CASTLE_KINGSIDE || move.type === MOVE_TYPES.CASTLE_QUEENSIDE) {
            playSound('CASTLE');
        } else {
            playSound('MOVE');
        }

        if (this.gameStatus === GAME_STATUS.CHECK) {
            playSound('CHECK');
        } else if (this.gameStatus === GAME_STATUS.CHECKMATE || this.gameStatus === GAME_STATUS.STALEMATE) {
            playSound('GAME_END');
        }

        return true;
    }

    // Rok Gerçekleştirme
    performCastling(fromRow, fromCol, toRow, toCol) {
        const isKingSide = toCol > fromCol;
        const rookFromCol = isKingSide ? 7 : 0;
        const rookToCol = isKingSide ? toCol - 1 : toCol + 1;

        // Kral hamlesi
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;

        // Kale hamlesi
        this.board[fromRow][rookToCol] = this.board[fromRow][rookFromCol];
        this.board[fromRow][rookFromCol] = null;
    }

    // Oyun Durumu Güncelleme
    updateGameState(move) {
        const piece = move.piece;
        const pieceType = getPieceType(piece);
        const pieceColor = getPieceColor(piece);

        // Rok hakları güncelleme
        if (pieceType === PIECE_TYPES.KING) {
            this.gameState.castling[pieceColor].kingMoved = true;
        } else if (pieceType === PIECE_TYPES.ROOK) {
            if (move.from.col === 0) {
                this.gameState.castling[pieceColor].queenSideRookMoved = true;
            } else if (move.from.col === 7) {
                this.gameState.castling[pieceColor].kingSideRookMoved = true;
            }
        }

        // En passant güncelleme
        if (pieceType === PIECE_TYPES.PAWN && Math.abs(move.to.row - move.from.row) === 2) {
            this.gameState.enPassant = {
                row: (move.from.row + move.to.row) / 2,
                col: move.from.col
            };
        } else {
            this.gameState.enPassant = null;
        }

        // Yarı hamle saati (50 hamle kuralı için)
        if (pieceType === PIECE_TYPES.PAWN || move.captured) {
            this.gameState.halfMoveClock = 0;
        } else {
            this.gameState.halfMoveClock++;
        }

        // Tam hamle sayısı
        if (pieceColor === COLORS.BLACK) {
            this.gameState.fullMoveNumber++;
        }
    }

    // Hamle Notasyonu Oluşturma
    getMoveNotation(fromRow, fromCol, toRow, toCol, piece, capturedPiece) {
        const pieceType = getPieceType(piece);
        const fromNotation = positionToNotation(fromRow, fromCol);
        const toNotation = positionToNotation(toRow, toCol);

        let notation = '';

        // Taş sembolü (piyon hariç)
        if (pieceType !== PIECE_TYPES.PAWN) {
            notation += pieceType.charAt(0).toUpperCase();
        }

        // Saldırı notasyonu
        if (capturedPiece) {
            if (pieceType === PIECE_TYPES.PAWN) {
                notation += fromNotation.charAt(0); // Piyon saldırısında başlangıç sütunu
            }
            notation += 'x';
        }

        notation += toNotation;

        return notation;
    }

    // Hamle Geri Alma
    undoMove() {
        if (this.moveHistory.length === 0) return false;

        const lastMove = this.moveHistory.pop();
        
        // Taşı geri yerleştir
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        
        if (lastMove.type === MOVE_TYPES.CASTLE_KINGSIDE || lastMove.type === MOVE_TYPES.CASTLE_QUEENSIDE) {
            // Rok geri alma
            const isKingSide = lastMove.type === MOVE_TYPES.CASTLE_KINGSIDE;
            const rookFromCol = isKingSide ? lastMove.to.col - 1 : lastMove.to.col + 1;
            const rookToCol = isKingSide ? 7 : 0;
            
            this.board[lastMove.to.row][lastMove.to.col] = null;
            this.board[lastMove.from.row][rookToCol] = this.board[lastMove.from.row][rookFromCol];
            this.board[lastMove.from.row][rookFromCol] = null;
        } else if (lastMove.type === MOVE_TYPES.EN_PASSANT) {
            // En passant geri alma
            this.board[lastMove.to.row][lastMove.to.col] = null;
            this.board[lastMove.from.row][lastMove.to.col] = lastMove.captured;
        } else {
            // Normal hamle geri alma
            this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
        }

        // Sıra değiştir
        this.currentPlayer = this.currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        this.moveCount--;

        // Oyun durumunu güncelle
        this.gameStatus = getGameStatus(this.board, this.currentPlayer, this.gameState);

        return true;
    }

    // Yeni Oyun Başlatma
    newGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = COLORS.WHITE;
        this.gameState = this.initializeGameState();
        this.moveHistory = [];
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameStatus = GAME_STATUS.PLAYING;
        this.moveCount = 0;
        this.gameStartTime = Date.now();
    }

    // Tüm Geçerli Hamleleri Al
    getAllValidMoves(color = this.currentPlayer) {
        const moves = [];
        
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = this.getPiece(fromRow, fromCol);
                if (piece && getPieceColor(piece) === color) {
                    const pieceMoves = this.getValidMovesForPiece(fromRow, fromCol);
                    pieceMoves.forEach(move => {
                        moves.push({
                            from: { row: fromRow, col: fromCol },
                            to: { row: move.row, col: move.col },
                            piece: piece
                        });
                    });
                }
            }
        }
        
        return moves;
    }

    // Tahta Değerlendirmesi (AI için)
    evaluateBoard() {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece) {
                    const pieceType = getPieceType(piece);
                    const pieceColor = getPieceColor(piece);
                    const pieceValue = PIECE_VALUES[pieceType];
                    
                    // Pozisyon değeri ekle
                    let positionValue = 0;
                    if (POSITION_VALUES[pieceType]) {
                        const posRow = pieceColor === COLORS.WHITE ? row : 7 - row;
                        positionValue = POSITION_VALUES[pieceType][posRow][col] / 100;
                    }
                    
                    const totalValue = pieceValue + positionValue;
                    
                    if (pieceColor === COLORS.WHITE) {
                        score += totalValue;
                    } else {
                        score -= totalValue;
                    }
                }
            }
        }
        
        return score;
    }

    // Oyun Bitmiş mi Kontrolü
    isGameOver() {
        return this.gameStatus === GAME_STATUS.CHECKMATE || 
               this.gameStatus === GAME_STATUS.STALEMATE ||
               this.gameStatus === GAME_STATUS.DRAW;
    }

    // Şah Durumu Kontrolü
    isInCheck(color = this.currentPlayer) {
        return isInCheck(this.board, color);
    }

    // Oyun Süresini Al
    getGameTime() {
        return Math.floor((Date.now() - this.gameStartTime) / 1000);
    }

    // Tahta Kopyasını Al
    getBoardCopy() {
        return copyBoard(this.board);
    }

    // FEN Notasyonu Oluşturma (gelişmiş özellik)
    toFEN() {
        let fen = '';
        
        // Tahta durumu
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += piece;
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            if (row < 7) fen += '/';
        }
        
        // Aktif oyuncu
        fen += ' ' + (this.currentPlayer === COLORS.WHITE ? 'w' : 'b');
        
        // Rok hakları
        fen += ' ';
        let castling = '';
        if (!this.gameState.castling[COLORS.WHITE].kingMoved) {
            if (!this.gameState.castling[COLORS.WHITE].kingSideRookMoved) castling += 'K';
            if (!this.gameState.castling[COLORS.WHITE].queenSideRookMoved) castling += 'Q';
        }
        if (!this.gameState.castling[COLORS.BLACK].kingMoved) {
            if (!this.gameState.castling[COLORS.BLACK].kingSideRookMoved) castling += 'k';
            if (!this.gameState.castling[COLORS.BLACK].queenSideRookMoved) castling += 'q';
        }
        fen += castling || '-';
        
        // En passant
        fen += ' ';
        if (this.gameState.enPassant) {
            fen += positionToNotation(this.gameState.enPassant.row, this.gameState.enPassant.col);
        } else {
            fen += '-';
        }
        
        // Yarı hamle ve tam hamle sayıları
        fen += ' ' + this.gameState.halfMoveClock;
        fen += ' ' + this.gameState.fullMoveNumber;
        
        return fen;
    }
}