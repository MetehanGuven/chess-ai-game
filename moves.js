// Hamle Sistemi - moves.js

class ChessMove {
    constructor(from, to, piece, captured = null, type = MOVE_TYPES.NORMAL) {
        this.from = from;
        this.to = to;
        this.piece = piece;
        this.captured = captured;
        this.type = type;
        this.promoted = null;
        this.notation = '';
        this.timestamp = Date.now();
        this.evaluation = 0;
    }

    // Algebraic Notation Oluştur
    generateNotation(board, allMoves = []) {
        const piece = this.piece;
        const pieceType = getPieceType(piece);
        const pieceColor = getPieceColor(piece);
        
        let notation = '';
        
        // Özel hamleler
        if (this.type === MOVE_TYPES.CASTLE_KINGSIDE) {
            notation = 'O-O';
        } else if (this.type === MOVE_TYPES.CASTLE_QUEENSIDE) {
            notation = 'O-O-O';
        } else {
            // Normal hamleler
            
            // Taş sembolü (piyon hariç)
            if (pieceType !== PIECE_TYPES.PAWN) {
                notation += pieceType.charAt(0).toUpperCase();
                
                // Belirsizlik giderme
                const ambiguousMoves = allMoves.filter(move => 
                    move !== this &&
                    getPieceType(move.piece) === pieceType &&
                    move.to.row === this.to.row &&
                    move.to.col === this.to.col
                );
                
                if (ambiguousMoves.length > 0) {
                    // Dosya ile ayırt et
                    const sameFile = ambiguousMoves.some(move => move.from.col === this.from.col);
                    if (!sameFile) {
                        notation += FILES[this.from.col];
                    } else {
                        // Sıra ile ayırt et
                        notation += RANKS[this.from.row];
                    }
                }
            }
            
            // Saldırı
            if (this.captured || this.type === MOVE_TYPES.EN_PASSANT) {
                if (pieceType === PIECE_TYPES.PAWN) {
                    notation += FILES[this.from.col];
                }
                notation += 'x';
            }
            
            // Hedef kare
            notation += positionToNotation(this.to.row, this.to.col);
            
            // Piyon terfi
            if (this.type === MOVE_TYPES.PROMOTION) {
                const promotedType = getPieceType(this.promoted);
                notation += '=' + promotedType.charAt(0).toUpperCase();
            }
            
            // En passant
            if (this.type === MOVE_TYPES.EN_PASSANT) {
                notation += ' e.p.';
            }
        }
        
        this.notation = notation;
        return notation;
    }

    // Hamleyi Uygula
    apply(board, gameState) {
        const newBoard = copyBoard(board);
        const newGameState = JSON.parse(JSON.stringify(gameState));
        
        // Temel hamle
        newBoard[this.to.row][this.to.col] = this.piece;
        newBoard[this.from.row][this.from.col] = null;
        
        // Özel hamle tipleri
        switch (this.type) {
            case MOVE_TYPES.CASTLE_KINGSIDE:
                this.applyCastling(newBoard, true);
                break;
            case MOVE_TYPES.CASTLE_QUEENSIDE:
                this.applyCastling(newBoard, false);
                break;
            case MOVE_TYPES.EN_PASSANT:
                newBoard[this.from.row][this.to.col] = null;
                break;
            case MOVE_TYPES.PROMOTION:
                newBoard[this.to.row][this.to.col] = this.promoted;
                break;
        }
        
        // Oyun durumu güncellemeleri
        this.updateGameState(newGameState);
        
        return { board: newBoard, gameState: newGameState };
    }

    // Rok Uygulama
    applyCastling(board, isKingSide) {
        const rookFromCol = isKingSide ? 7 : 0;
        const rookToCol = isKingSide ? this.to.col - 1 : this.to.col + 1;
        
        board[this.from.row][rookToCol] = board[this.from.row][rookFromCol];
        board[this.from.row][rookFromCol] = null;
    }

    // Oyun Durumu Güncelle
    updateGameState(gameState) {
        const pieceType = getPieceType(this.piece);
        const pieceColor = getPieceColor(this.piece);
        
        // Rok hakları
        if (pieceType === PIECE_TYPES.KING) {
            gameState.castling[pieceColor].kingMoved = true;
        } else if (pieceType === PIECE_TYPES.ROOK) {
            if (this.from.col === 0) {
                gameState.castling[pieceColor].queenSideRookMoved = true;
            } else if (this.from.col === 7) {
                gameState.castling[pieceColor].kingSideRookMoved = true;
            }
        }
        
        // En passant
        if (pieceType === PIECE_TYPES.PAWN && Math.abs(this.to.row - this.from.row) === 2) {
            gameState.enPassant = {
                row: (this.from.row + this.to.row) / 2,
                col: this.from.col
            };
        } else {
            gameState.enPassant = null;
        }
        
        // Yarı hamle saati
        if (pieceType === PIECE_TYPES.PAWN || this.captured) {
            gameState.halfMoveClock = 0;
        } else {
            gameState.halfMoveClock++;
        }
        
        // Tam hamle sayısı
        if (pieceColor === COLORS.BLACK) {
            gameState.fullMoveNumber++;
        }
    }

    // Hamle Değerlendirmesi
    evaluate(board, gameState) {
        let score = 0;
        
        // Materyal kazancı/kaybı
        if (this.captured) {
            score += PIECE_VALUES[getPieceType(this.captured)];
        }
        
        // Pozisyonel değer
        const pieceType = getPieceType(this.piece);
        if (POSITION_VALUES[pieceType]) {
            const pieceColor = getPieceColor(this.piece);
            const fromRow = pieceColor === COLORS.WHITE ? 7 - this.from.row : this.from.row;
            const toRow = pieceColor === COLORS.WHITE ? 7 - this.to.row : this.to.row;
            
            const fromValue = POSITION_VALUES[pieceType][fromRow][this.from.col];
            const toValue = POSITION_VALUES[pieceType][toRow][this.to.col];
            
            score += (toValue - fromValue) / 100;
        }
        
        // Merkez kontrolü
        const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
        if (centerSquares.some(([r, c]) => r === this.to.row && c === this.to.col)) {
            score += 20;
        }
        
        // Geliştirme bonusu
        if (pieceType === PIECE_TYPES.KNIGHT || pieceType === PIECE_TYPES.BISHOP) {
            const pieceColor = getPieceColor(this.piece);
            const backRank = pieceColor === COLORS.WHITE ? 7 : 0;
            if (this.from.row === backRank) {
                score += 15;
            }
        }
        
        // Şah verme bonusu
        const { board: newBoard } = this.apply(board, gameState);
        const enemyColor = getPieceColor(this.piece) === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        if (isInCheck(newBoard, enemyColor)) {
            score += 50;
        }
        
        this.evaluation = score;
        return score;
    }

    // Hamle Eşitliği
    equals(other) {
        return this.from.row === other.from.row &&
               this.from.col === other.from.col &&
               this.to.row === other.to.row &&
               this.to.col === other.to.col &&
               this.piece === other.piece;
    }

    // String Temsili
    toString() {
        return this.notation || `${positionToNotation(this.from.row, this.from.col)}-${positionToNotation(this.to.row, this.to.col)}`;
    }

    // Kopyala
    copy() {
        const copy = new ChessMove(
            { ...this.from },
            { ...this.to },
            this.piece,
            this.captured,
            this.type
        );
        copy.promoted = this.promoted;
        copy.notation = this.notation;
        copy.evaluation = this.evaluation;
        return copy;
    }
}

// Hamle Üretici Sınıfı
class MoveGenerator {
    constructor() {
        this.generatedMoves = [];
    }

    // Tüm Geçerli Hamleleri Üret
    generateAllMoves(board, gameState, color) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && getPieceColor(piece) === color) {
                    const pieceMoves = this.generatePieceMoves(board, gameState, row, col);
                    moves.push(...pieceMoves);
                }
            }
        }
        
        return this.filterLegalMoves(board, moves, color);
    }

    // Belirli Taş İçin Hamleleri Üret
    generatePieceMoves(board, gameState, row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        
        const pieceObj = PieceFactory.createPiece(piece, row, col);
        const validMoves = pieceObj.getValidMoves(board, gameState);
        
        return validMoves.map(move => new ChessMove(
            { row, col },
            move.to,
            piece,
            board[move.to.row][move.to.col],
            move.type
        ));
    }

    // Yasal Hamleleri Filtrele (Şah kontrolü)
    filterLegalMoves(board, moves, color) {
        return moves.filter(move => {
            const { board: newBoard } = move.apply(board, {});
            return !isInCheck(newBoard, color);
        });
    }

    // Saldırı Hamlelerini Üret
    generateCaptures(board, gameState, color) {
        const allMoves = this.generateAllMoves(board, gameState, color);
        return allMoves.filter(move => 
            move.captured || move.type === MOVE_TYPES.EN_PASSANT
        );
    }

    // Sessiz Hamleleri Üret (Saldırısız)
    generateQuietMoves(board, gameState, color) {
        const allMoves = this.generateAllMoves(board, gameState, color);
        return allMoves.filter(move => 
            !move.captured && move.type !== MOVE_TYPES.EN_PASSANT
        );
    }

    // Şah Kaçış Hamlelerini Üret
    generateCheckEvasions(board, gameState, color) {
        if (!isInCheck(board, color)) return [];
        
        const allMoves = this.generateAllMoves(board, gameState, color);
        return allMoves.filter(move => {
            const { board: newBoard } = move.apply(board, gameState);
            return !isInCheck(newBoard, color);
        });
    }

    // Hamleleri Sırala (En İyi Önce)
    sortMoves(moves, board) {
        return moves.sort((a, b) => {
            // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
            if (a.captured && b.captured) {
                const aValue = PIECE_VALUES[getPieceType(a.captured)] - PIECE_VALUES[getPieceType(a.piece)] / 10;
                const bValue = PIECE_VALUES[getPieceType(b.captured)] - PIECE_VALUES[getPieceType(b.piece)] / 10;
                return bValue - aValue;
            }
            
            // Saldırı hamleleri önce
            if (a.captured && !b.captured) return -1;
            if (!a.captured && b.captured) return 1;
            
            // Merkez hamleleri önce
            const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
            const aCenter = centerSquares.some(([r, c]) => r === a.to.row && c === a.to.col);
            const bCenter = centerSquares.some(([r, c]) => r === b.to.row && c === b.to.col);
            
            if (aCenter && !bCenter) return -1;
            if (!aCenter && bCenter) return 1;
            
            // Değerlendirme skoruna göre
            return (b.evaluation || 0) - (a.evaluation || 0);
        });
    }

    // Taktiksel Hamleleri Bul
    findTacticalMoves(board, gameState, color) {
        const tacticalMoves = [];
        const allMoves = this.generateAllMoves(board, gameState, color);
        
        for (const move of allMoves) {
            const { board: newBoard } = move.apply(board, gameState);
            
            // Çatal (Fork)
            if (this.isForkMove(move, newBoard)) {
                move.tactical = 'fork';
                tacticalMoves.push(move);
            }
            
            // Çivi (Pin)
            if (this.isPinMove(move, board, newBoard)) {
                move.tactical = 'pin';
                tacticalMoves.push(move);
            }
            
            // Keşif Saldırısı
            if (this.isDiscoveredAttack(move, board, newBoard)) {
                move.tactical = 'discovered_attack';
                tacticalMoves.push(move);
            }
            
            // Çifte Saldırı
            if (this.isDoubleAttack(move, newBoard)) {
                move.tactical = 'double_attack';
                tacticalMoves.push(move);
            }
        }
        
        return tacticalMoves;
    }

    // Çatal Kontrolü
    isForkMove(move, board) {
        const piece = move.piece;
        const pieceType = getPieceType(piece);
        const pieceColor = getPieceColor(piece);
        
        if (pieceType === PIECE_TYPES.KNIGHT) {
            const attacks = getKnightAttacks(move.to.row, move.to.col);
            let valuableTargets = 0;
            
            for (const attack of attacks) {
                const target = board[attack.row][attack.col];
                if (target && getPieceColor(target) !== pieceColor) {
                    const targetType = getPieceType(target);
                    if (targetType === PIECE_TYPES.KING || 
                        PIECE_VALUES[targetType] > PIECE_VALUES[pieceType]) {
                        valuableTargets++;
                    }
                }
            }
            
            return valuableTargets >= 2;
        }
        
        return false;
    }

    // Çivi Kontrolü
    isPinMove(move, oldBoard, newBoard) {
        // Basitleştirilmiş çivi kontrolü
        const pieceColor = getPieceColor(move.piece);
        const enemyColor = pieceColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        const enemyKing = findKing(newBoard, enemyColor);
        
        if (!enemyKing) return false;
        
        // Hamle yapılan taş ile düşman kral arasında doğru var mı?
        const directions = [
            ...Object.values(DIRECTIONS),
        ];
        
        for (const [dr, dc] of directions) {
            if (this.isOnLine(move.to, enemyKing, dr, dc)) {
                // Aralarında başka taş var mı?
                let piecesBetween = 0;
                let currentRow = move.to.row + dr;
                let currentCol = move.to.col + dc;
                
                while (currentRow !== enemyKing.row || currentCol !== enemyKing.col) {
                    if (newBoard[currentRow][currentCol]) piecesBetween++;
                    currentRow += dr;
                    currentCol += dc;
                }
                
                if (piecesBetween === 1) return true;
            }
        }
        
        return false;
    }

    // Keşif Saldırısı Kontrolü
    isDiscoveredAttack(move, oldBoard, newBoard) {
        // Hareket eden taş bir çizgi açtı mı?
        const pieceColor = getPieceColor(move.piece);
        
        // Eski pozisyondan yeni pozisyona kadar olan çizgiyi kontrol et
        const rowDiff = move.to.row - move.from.row;
        const colDiff = move.to.col - move.from.col;
        
        if (rowDiff !== 0 || colDiff !== 0) {
            // Eski pozisyonun arkasında taş var mı?
            const dr = rowDiff > 0 ? -1 : rowDiff < 0 ? 1 : 0;
            const dc = colDiff > 0 ? -1 : colDiff < 0 ? 1 : 0;
            
            let checkRow = move.from.row + dr;
            let checkCol = move.from.col + dc;
            
            while (isValidPosition(checkRow, checkCol)) {
                const piece = oldBoard[checkRow][checkCol];
                if (piece && getPieceColor(piece) === pieceColor) {
                    const pieceType = getPieceType(piece);
                    // Bu taş şimdi saldırabilir mi?
                    if (pieceType === PIECE_TYPES.ROOK || 
                        pieceType === PIECE_TYPES.QUEEN ||
                        pieceType === PIECE_TYPES.BISHOP) {
                        return true;
                    }
                    break;
                }
                checkRow += dr;
                checkCol += dc;
            }
        }
        
        return false;
    }

    // Çifte Saldırı Kontrolü
    isDoubleAttack(move, board) {
        const piece = move.piece;
        const pieceColor = getPieceColor(piece);
        const enemyColor = pieceColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        
        // Hamle yapan taşın saldırdığı kareleri al
        const pieceObj = PieceFactory.createPiece(piece, move.to.row, move.to.col);
        const attacks = pieceObj.getAttackSquares(board);
        
        let attackedPieces = 0;
        for (const attack of attacks) {
            const target = board[attack.row][attack.col];
            if (target && getPieceColor(target) === enemyColor) {
                attackedPieces++;
            }
        }
        
        return attackedPieces >= 2;
    }

    // İki nokta arasında çizgi kontrolü
    isOnLine(pos1, pos2, dr, dc) {
        const rowDiff = pos2.row - pos1.row;
        const colDiff = pos2.col - pos1.col;
        
        // Aynı yön mü?
        if (dr === 0 && dc === 0) return false;
        if (dr !== 0 && Math.sign(rowDiff) !== Math.sign(dr)) return false;
        if (dc !== 0 && Math.sign(colDiff) !== Math.sign(dc)) return false;
        
        // Çizgi üzerinde mi?
        if (dr === 0) return rowDiff === 0;
        if (dc === 0) return colDiff === 0;
        
        return Math.abs(rowDiff / dr) === Math.abs(colDiff / dc);
    }
}

// Hamle Geçmişi Yöneticisi
class MoveHistory {
    constructor() {
        this.moves = [];
        this.currentIndex = -1;
    }

    // Hamle Ekle
    addMove(move) {
        // Eğer geçmişte geri gittikse, o noktadan sonrasını sil
        if (this.currentIndex < this.moves.length - 1) {
            this.moves = this.moves.slice(0, this.currentIndex + 1);
        }
        
        this.moves.push(move);
        this.currentIndex++;
    }

    // Son Hamleyi Al
    getLastMove() {
        return this.currentIndex >= 0 ? this.moves[this.currentIndex] : null;
    }

    // Geri Al
    undo() {
        if (this.currentIndex >= 0) {
            const move = this.moves[this.currentIndex];
            this.currentIndex--;
            return move;
        }
        return null;
    }

    // İleri Al
    redo() {
        if (this.currentIndex < this.moves.length - 1) {
            this.currentIndex++;
            return this.moves[this.currentIndex];
        }
        return null;
    }

    // Geçmiş Temizle
    clear() {
        this.moves = [];
        this.currentIndex = -1;
    }

    // Hamle Sayısı
    getCount() {
        return this.currentIndex + 1;
    }

    // Tam Hamle Sayısı
    getFullMoveCount() {
        return Math.ceil((this.currentIndex + 1) / 2);
    }

    // PGN Formatı
    toPGN() {
        let pgn = '';
        
        for (let i = 0; i <= this.currentIndex; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.moves[i];
            const blackMove = this.moves[i + 1];
            
            pgn += `${moveNumber}. `;
            if (whiteMove) pgn += whiteMove.notation;
            if (blackMove) pgn += ` ${blackMove.notation}`;
            if (i < this.currentIndex - 1) pgn += ' ';
        }
        
        return pgn;
    }

    // Belirli Pozisyondan Hamleleri Al
    getMovesFrom(index) {
        return this.moves.slice(index, this.currentIndex + 1);
    }

    // Varyasyon Oluştur
    createVariation(fromIndex, moves) {
        const variation = new MoveHistory();
        
        // Ana çizgiden belirtilen noktaya kadar kopyala
        for (let i = 0; i <= fromIndex; i++) {
            variation.addMove(this.moves[i]);
        }
        
        // Yeni hamleleri ekle
        moves.forEach(move => variation.addMove(move));
        
        return variation;
    }

    // Tekrarlanan Pozisyon Kontrolü
    hasThreefoldRepetition() {
        if (this.moves.length < 8) return false;
        
        const positions = new Map();
        let currentBoard = copyBoard(INITIAL_BOARD);
        let currentGameState = {
            castling: {
                [COLORS.WHITE]: { kingMoved: false, kingSideRookMoved: false, queenSideRookMoved: false },
                [COLORS.BLACK]: { kingMoved: false, kingSideRookMoved: false, queenSideRookMoved: false }
            },
            enPassant: null
        };
        
        for (let i = 0; i <= this.currentIndex; i++) {
            const move = this.moves[i];
            const result = move.apply(currentBoard, currentGameState);
            currentBoard = result.board;
            currentGameState = result.gameState;
            
            // Pozisyonu string'e çevir (basitleştirilmiş)
            const positionKey = this.boardToString(currentBoard, currentGameState);
            const count = positions.get(positionKey) || 0;
            positions.set(positionKey, count + 1);
            
            if (count >= 2) return true;
        }
        
        return false;
    }

    // Tahta String Temsili
    boardToString(board, gameState) {
        let str = '';
        
        // Tahta durumu
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                str += board[row][col] || '.';
            }
        }
        
        // Rok hakları
        str += gameState.castling[COLORS.WHITE].kingMoved ? '0' : '1';
        str += gameState.castling[COLORS.WHITE].kingSideRookMoved ? '0' : '1';
        str += gameState.castling[COLORS.WHITE].queenSideRookMoved ? '0' : '1';
        str += gameState.castling[COLORS.BLACK].kingMoved ? '0' : '1';
        str += gameState.castling[COLORS.BLACK].kingSideRookMoved ? '0' : '1';
        str += gameState.castling[COLORS.BLACK].queenSideRookMoved ? '0' : '1';
        
        // En passant
        if (gameState.enPassant) {
            str += positionToNotation(gameState.enPassant.row, gameState.enPassant.col);
        }
        
        return str;
    }
}

// Notasyon Çözümleyici
class NotationParser {
    // Algebraic Notation'ı Çözümle
    static parseMove(notation, board, color) {
        notation = notation.trim();
        
        // Rok kontrolleri
        if (notation === 'O-O' || notation === '0-0') {
            return this.parseCastle(board, color, true);
        }
        if (notation === 'O-O-O' || notation === '0-0-0') {
            return this.parseCastle(board, color, false);
        }
        
        // Diğer hamleler için parsing
        let pieceType = PIECE_TYPES.PAWN;
        let fromFile = null;
        let fromRank = null;
        let capture = false;
        let promotion = null;
        
        let index = 0;
        
        // Taş tipi
        if (/[KQRBN]/.test(notation[0])) {
            const pieceMap = {
                'K': PIECE_TYPES.KING,
                'Q': PIECE_TYPES.QUEEN,
                'R': PIECE_TYPES.ROOK,
                'B': PIECE_TYPES.BISHOP,
                'N': PIECE_TYPES.KNIGHT
            };
            pieceType = pieceMap[notation[0]];
            index++;
        }
        
        // Belirsizlik giderici
        if (index < notation.length && /[a-h1-8]/.test(notation[index])) {
            if (/[a-h]/.test(notation[index])) {
                fromFile = notation[index];
                index++;
            }
            if (index < notation.length && /[1-8]/.test(notation[index])) {
                fromRank = notation[index];
                index++;
            }
        }
        
        // Saldırı
        if (index < notation.length && notation[index] === 'x') {
            capture = true;
            index++;
        }
        
        // Hedef kare
        if (index + 1 < notation.length) {
            const toFile = notation[index];
            const toRank = notation[index + 1];
            const toCol = FILES.indexOf(toFile);
            const toRow = RANKS.indexOf(toRank);
            
            index += 2;
            
            // Piyon terfi
            if (index < notation.length && notation[index] === '=') {
                index++;
                if (index < notation.length) {
                    const promotionMap = {
                        'Q': PIECE_TYPES.QUEEN,
                        'R': PIECE_TYPES.ROOK,
                        'B': PIECE_TYPES.BISHOP,
                        'N': PIECE_TYPES.KNIGHT
                    };
                    promotion = promotionMap[notation[index]];
                }
            }
            
            // Uygun hamleyi bul
            return this.findMatchingMove(board, color, pieceType, fromFile, fromRank, toRow, toCol, capture, promotion);
        }
        
        return null;
    }

    // Eşleşen Hamleyi Bul
    static findMatchingMove(board, color, pieceType, fromFile, fromRank, toRow, toCol, capture, promotion) {
        const generator = new MoveGenerator();
        const allMoves = generator.generateAllMoves(board, {}, color);
        
        return allMoves.find(move => {
            const movePieceType = getPieceType(move.piece);
            const moveFromCol = move.from.col;
            const moveFromRow = move.from.row;
            
            // Taş tipi eşleşmesi
            if (movePieceType !== pieceType) return false;
            
            // Hedef kare eşleşmesi
            if (move.to.row !== toRow || move.to.col !== toCol) return false;
            
            // Dosya filtresi
            if (fromFile && FILES[moveFromCol] !== fromFile) return false;
            
            // Sıra filtresi
            if (fromRank && RANKS[moveFromRow] !== fromRank) return false;
            
            // Saldırı eşleşmesi
            if (capture && !move.captured) return false;
            if (!capture && move.captured) return false;
            
            return true;
        });
    }

    // Rok Çözümleme
    static parseCastle(board, color, isKingSide) {
        const row = color === COLORS.WHITE ? 7 : 0;
        const kingCol = 4;
        const toCol = isKingSide ? 6 : 2;
        
        const king = board[row][kingCol];
        if (!king || getPieceType(king) !== PIECE_TYPES.KING) return null;
        
        return new ChessMove(
            { row, col: kingCol },
            { row, col: toCol },
            king,
            null,
            isKingSide ? MOVE_TYPES.CASTLE_KINGSIDE : MOVE_TYPES.CASTLE_QUEENSIDE
        );
    }
}