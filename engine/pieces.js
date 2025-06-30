// Satranç Taşları Mantığı - pieces.js

class ChessPiece {
    constructor(type, color, row, col) {
        this.type = type;
        this.color = color;
        this.row = row;
        this.col = col;
        this.hasMoved = false;
        this.value = PIECE_VALUES[type];
    }

    // Taş Sembolünü Al
    getSymbol() {
        const key = this.color === COLORS.WHITE ? this.type.charAt(0).toUpperCase() : this.type.charAt(0).toLowerCase();
        return PIECE_SYMBOLS[key] ? PIECE_SYMBOLS[key].symbol : '?';
    }

    // Taş Notasyonunu Al
    getNotation() {
        const key = this.color === COLORS.WHITE ? this.type.charAt(0).toUpperCase() : this.type.charAt(0).toLowerCase();
        return key;
    }

    // Geçerli Hamleleri Al
    getValidMoves(board, gameState) {
        switch (this.type) {
            case PIECE_TYPES.PAWN:
                return this.getPawnMoves(board, gameState);
            case PIECE_TYPES.ROOK:
                return this.getRookMoves(board);
            case PIECE_TYPES.BISHOP:
                return this.getBishopMoves(board);
            case PIECE_TYPES.QUEEN:
                return this.getQueenMoves(board);
            case PIECE_TYPES.KING:
                return this.getKingMoves(board, gameState);
            case PIECE_TYPES.KNIGHT:
                return this.getKnightMoves(board);
            default:
                return [];
        }
    }

    // Piyon Hamleleri
    getPawnMoves(board, gameState) {
        const moves = [];
        const direction = this.color === COLORS.WHITE ? -1 : 1;
        const startRow = this.color === COLORS.WHITE ? 6 : 1;
        const promotionRow = this.color === COLORS.WHITE ? 0 : 7;

        // İleri hareket
        const oneStep = this.row + direction;
        if (isValidPosition(oneStep, this.col) && isEmpty(board, oneStep, this.col)) {
            moves.push({
                to: { row: oneStep, col: this.col },
                type: oneStep === promotionRow ? MOVE_TYPES.PROMOTION : MOVE_TYPES.NORMAL
            });

            // İki kare ileri (başlangıç pozisyonu)
            if (this.row === startRow) {
                const twoStep = this.row + 2 * direction;
                if (isValidPosition(twoStep, this.col) && isEmpty(board, twoStep, this.col)) {
                    moves.push({
                        to: { row: twoStep, col: this.col },
                        type: MOVE_TYPES.NORMAL
                    });
                }
            }
        }

        // Çapraz saldırılar
        [-1, 1].forEach(colOffset => {
            const attackRow = this.row + direction;
            const attackCol = this.col + colOffset;

            if (isValidPosition(attackRow, attackCol)) {
                // Normal saldırı
                if (isEnemy(board, attackRow, attackCol, this.color)) {
                    moves.push({
                        to: { row: attackRow, col: attackCol },
                        type: attackRow === promotionRow ? MOVE_TYPES.PROMOTION : MOVE_TYPES.CAPTURE
                    });
                }

                // En passant
                if (gameState.enPassant && 
                    gameState.enPassant.row === attackRow && 
                    gameState.enPassant.col === attackCol) {
                    moves.push({
                        to: { row: attackRow, col: attackCol },
                        type: MOVE_TYPES.EN_PASSANT
                    });
                }
            }
        });

        return moves;
    }

    // Kale Hamleleri
    getRookMoves(board) {
        const moves = [];
        const directions = [DIRECTIONS.NORTH, DIRECTIONS.SOUTH, DIRECTIONS.EAST, DIRECTIONS.WEST];

        directions.forEach(([dr, dc]) => {
            let newRow = this.row + dr;
            let newCol = this.col + dc;

            while (isValidPosition(newRow, newCol)) {
                if (isEmpty(board, newRow, newCol)) {
                    moves.push({
                        to: { row: newRow, col: newCol },
                        type: MOVE_TYPES.NORMAL
                    });
                } else {
                    if (isEnemy(board, newRow, newCol, this.color)) {
                        moves.push({
                            to: { row: newRow, col: newCol },
                            type: MOVE_TYPES.CAPTURE
                        });
                    }
                    break; // Taş varsa dur
                }

                newRow += dr;
                newCol += dc;
            }
        });

        return moves;
    }

    // Fil Hamleleri
    getBishopMoves(board) {
        const moves = [];
        const directions = [DIRECTIONS.NORTHEAST, DIRECTIONS.NORTHWEST, DIRECTIONS.SOUTHEAST, DIRECTIONS.SOUTHWEST];

        directions.forEach(([dr, dc]) => {
            let newRow = this.row + dr;
            let newCol = this.col + dc;

            while (isValidPosition(newRow, newCol)) {
                if (isEmpty(board, newRow, newCol)) {
                    moves.push({
                        to: { row: newRow, col: newCol },
                        type: MOVE_TYPES.NORMAL
                    });
                } else {
                    if (isEnemy(board, newRow, newCol, this.color)) {
                        moves.push({
                            to: { row: newRow, col: newCol },
                            type: MOVE_TYPES.CAPTURE
                        });
                    }
                    break; // Taş varsa dur
                }

                newRow += dr;
                newCol += dc;
            }
        });

        return moves;
    }

    // Vezir Hamleleri
    getQueenMoves(board) {
        return [...this.getRookMoves(board), ...this.getBishopMoves(board)];
    }

    // At Hamleleri
    getKnightMoves(board) {
        const moves = [];

        KNIGHT_MOVES.forEach(([dr, dc]) => {
            const newRow = this.row + dr;
            const newCol = this.col + dc;

            if (isValidPosition(newRow, newCol)) {
                if (isEmpty(board, newRow, newCol)) {
                    moves.push({
                        to: { row: newRow, col: newCol },
                        type: MOVE_TYPES.NORMAL
                    });
                } else if (isEnemy(board, newRow, newCol, this.color)) {
                    moves.push({
                        to: { row: newRow, col: newCol },
                        type: MOVE_TYPES.CAPTURE
                    });
                }
            }
        });

        return moves;
    }

    // Kral Hamleleri
    getKingMoves(board, gameState) {
        const moves = [];

        // Normal kral hamleleri
        KING_MOVES.forEach(([dr, dc]) => {
            const newRow = this.row + dr;
            const newCol = this.col + dc;

            if (isValidPosition(newRow, newCol)) {
                if (isEmpty(board, newRow, newCol)) {
                    moves.push({
                        to: { row: newRow, col: newCol },
                        type: MOVE_TYPES.NORMAL
                    });
                } else if (isEnemy(board, newRow, newCol, this.color)) {
                    moves.push({
                        to: { row: newRow, col: newCol },
                        type: MOVE_TYPES.CAPTURE
                    });
                }
            }
        });

        // Rok hamleleri
        if (!this.hasMoved && !isInCheck(board, this.color)) {
            // Kısa rok
            if (this.canCastle(board, gameState, true)) {
                moves.push({
                    to: { row: this.row, col: this.col + 2 },
                    type: MOVE_TYPES.CASTLE_KINGSIDE
                });
            }

            // Uzun rok
            if (this.canCastle(board, gameState, false)) {
                moves.push({
                    to: { row: this.row, col: this.col - 2 },
                    type: MOVE_TYPES.CASTLE_QUEENSIDE
                });
            }
        }

        return moves;
    }

    // Rok Kontrolü
    canCastle(board, gameState, isKingSide) {
        const castlingRights = gameState.castling[this.color];
        
        // Kral hareket etmiş mi?
        if (castlingRights.kingMoved) return false;

        // Kale hareket etmiş mi?
        if (isKingSide && castlingRights.kingSideRookMoved) return false;
        if (!isKingSide && castlingRights.queenSideRookMoved) return false;

        // Yol kontrolü
        const direction = isKingSide ? 1 : -1;
        const steps = isKingSide ? 2 : 3;

        for (let i = 1; i <= steps; i++) {
            const col = this.col + (i * direction);
            if (!isEmpty(board, this.row, col)) return false;
        }

        // Şah kontrolü
        for (let i = 1; i <= 2; i++) {
            const col = this.col + (i * direction);
            const tempBoard = copyBoard(board);
            tempBoard[this.row][col] = tempBoard[this.row][this.col];
            tempBoard[this.row][this.col] = null;

            if (isInCheck(tempBoard, this.color)) return false;
        }

        return true;
    }

    // Pozisyonu Güncelle
    moveTo(row, col) {
        this.row = row;
        this.col = col;
        this.hasMoved = true;
    }

    // Kopyala
    copy() {
        const copy = new ChessPiece(this.type, this.color, this.row, this.col);
        copy.hasMoved = this.hasMoved;
        return copy;
    }

    // Saldırı Alanları
    getAttackSquares(board) {
        const attacks = [];
        
        switch (this.type) {
            case PIECE_TYPES.PAWN:
                const direction = this.color === COLORS.WHITE ? -1 : 1;
                [-1, 1].forEach(colOffset => {
                    const attackRow = this.row + direction;
                    const attackCol = this.col + colOffset;
                    if (isValidPosition(attackRow, attackCol)) {
                        attacks.push({ row: attackRow, col: attackCol });
                    }
                });
                break;
                
            case PIECE_TYPES.KING:
                KING_MOVES.forEach(([dr, dc]) => {
                    const newRow = this.row + dr;
                    const newCol = this.col + dc;
                    if (isValidPosition(newRow, newCol)) {
                        attacks.push({ row: newRow, col: newCol });
                    }
                });
                break;
                
            default:
                // Diğer taşlar için normal hamle hesaplama
                const moves = this.getValidMoves(board, {});
                moves.forEach(move => {
                    attacks.push(move.to);
                });
                break;
        }
        
        return attacks;
    }

    // Taş Değeri (Pozisyonel)
    getPositionalValue() {
        if (!POSITION_VALUES[this.type]) return 0;
        
        const row = this.color === COLORS.WHITE ? 7 - this.row : this.row;
        return POSITION_VALUES[this.type][row][this.col] / 100;
    }

    // Taş Güvenli mi?
    isSafe(board) {
        const enemyColor = this.color === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        
        // Düşman taşlarının saldırabileceği kareleri kontrol et
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && getPieceColor(piece) === enemyColor) {
                    const enemyPiece = new ChessPiece(
                        getPieceType(piece), 
                        enemyColor, 
                        row, 
                        col
                    );
                    const attacks = enemyPiece.getAttackSquares(board);
                    
                    if (attacks.some(attack => attack.row === this.row && attack.col === this.col)) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    // Hareket Kabiliyeti Skoru
    getMobilityScore(board, gameState) {
        return this.getValidMoves(board, gameState).length;
    }
}

// Taş Fabrika Sınıfı
class PieceFactory {
    static createPiece(notation, row, col) {
        const pieceInfo = PIECE_SYMBOLS[notation];
        if (!pieceInfo) return null;
        
        return new ChessPiece(pieceInfo.type, pieceInfo.color, row, col);
    }

    static createFromBoard(board) {
        const pieces = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const notation = board[row][col];
                if (notation) {
                    const piece = PieceFactory.createPiece(notation, row, col);
                    if (piece) pieces.push(piece);
                }
            }
        }
        
        return pieces;
    }

    static getInitialSetup() {
        const pieces = [];
        
        // Beyaz taşlar
        const whiteBackRow = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
        whiteBackRow.forEach((notation, col) => {
            pieces.push(PieceFactory.createPiece(notation, 7, col));
        });
        
        for (let col = 0; col < 8; col++) {
            pieces.push(PieceFactory.createPiece('P', 6, col));
        }
        
        // Siyah taşlar
        const blackBackRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
        blackBackRow.forEach((notation, col) => {
            pieces.push(PieceFactory.createPiece(notation, 0, col));
        });
        
        for (let col = 0; col < 8; col++) {
            pieces.push(PieceFactory.createPiece('p', 1, col));
        }
        
        return pieces;
    }
}

// Taş Değerlendirme Yardımcıları
class PieceEvaluator {
    // Taş Aktivitesi
    static evaluateActivity(piece, board, gameState) {
        let score = 0;
        
        // Hareket kabiliyeti
        const mobility = piece.getMobilityScore(board, gameState);
        score += mobility * 2;
        
        // Merkez kontrolü
        if (piece.type !== PIECE_TYPES.PAWN && piece.type !== PIECE_TYPES.KING) {
            const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
            if (centerSquares.some(([r, c]) => r === piece.row && c === piece.col)) {
                score += 20;
            }
        }
        
        return score;
    }

    // Taş Güvenliği
    static evaluateSafety(piece, board) {
        let score = 0;
        
        if (piece.isSafe(board)) {
            score += 10;
        } else {
            score -= piece.value * 0.5;
        }
        
        return score;
    }

    // Taş Koordinasyonu
    static evaluateCoordination(piece, board) {
        let score = 0;
        const friendlyColor = piece.color;
        
        // Aynı renkten taşları say
        let supportingPieces = 0;
        const attacks = piece.getAttackSquares(board);
        
        attacks.forEach(attack => {
            const supportedPiece = board[attack.row][attack.col];
            if (supportedPiece && getPieceColor(supportedPiece) === friendlyColor) {
                supportingPieces++;
            }
        });
        
        score += supportingPieces * 5;
        
        return score;
    }

    // Gelişim Skoru
    static evaluateDevelopment(piece) {
        if (piece.type === PIECE_TYPES.KNIGHT || piece.type === PIECE_TYPES.BISHOP) {
            const backRank = piece.color === COLORS.WHITE ? 7 : 0;
            if (piece.row !== backRank) {
                return 15; // Geliştirme bonusu
            }
        }
        
        return 0;
    }
}