// Ana Oyun Mantığı - game.js

class ChessGame {
    constructor() {
        this.board = new ChessBoard();
        this.moveGenerator = new MoveGenerator();
        this.moveHistory = new MoveHistory();
        this.gameState = this.initializeGameState();
        this.players = {
            [COLORS.WHITE]: { type: 'human', name: 'Oyuncu' },
            [COLORS.BLACK]: { type: 'ai', name: 'AI', difficulty: 3 }
        };
        this.gameStartTime = Date.now();
        this.gameEndTime = null;
        this.gameResult = null;
        this.observers = [];
        
        this.init();
    }

    // Oyunu Başlat
    init() {
        this.updateGameStatus();
        this.notifyObservers('gameStart');
    }

    // Oyun Durumu Başlatma
    initializeGameState() {
        return {
            currentPlayer: COLORS.WHITE,
            status: GAME_STATUS.PLAYING,
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
            fullMoveNumber: 1,
            moveCount: 0
        };
    }

    // Hamle Yap
    makeMove(fromRow, fromCol, toRow, toCol, promotion = 'Q') {
        if (this.isGameOver()) return false;
        
        const piece = this.board.getPiece(fromRow, fromCol);
        if (!piece) return false;
        
        const pieceColor = getPieceColor(piece);
        if (pieceColor !== this.gameState.currentPlayer) return false;
        
        // Hamle oluştur
        const move = this.createMove(fromRow, fromCol, toRow, toCol, promotion);
        if (!move) return false;
        
        // Hamleyi doğrula
        if (!this.isValidMove(move)) return false;
        
        // Hamleyi uygula
        this.applyMove(move);
        
        // Oyun durumunu güncelle
        this.updateGameStatus();
        
        // Gözlemcilere bildir
        this.notifyObservers('moveExecuted', { move });
        
        return true;
    }

    // Hamle Oluştur
    createMove(fromRow, fromCol, toRow, toCol, promotion) {
        const piece = this.board.getPiece(fromRow, fromCol);
        const captured = this.board.getPiece(toRow, toCol);
        const pieceType = getPieceType(piece);
        
        let moveType = MOVE_TYPES.NORMAL;
        
        // Saldırı kontrolü
        if (captured) {
            moveType = MOVE_TYPES.CAPTURE;
        }
        
        // Özel hamle tipleri
        if (pieceType === PIECE_TYPES.KING && Math.abs(toCol - fromCol) === 2) {
            moveType = toCol > fromCol ? MOVE_TYPES.CASTLE_KINGSIDE : MOVE_TYPES.CASTLE_QUEENSIDE;
        } else if (pieceType === PIECE_TYPES.PAWN) {
            // En passant kontrolü
            if (this.gameState.enPassant && 
                toRow === this.gameState.enPassant.row && 
                toCol === this.gameState.enPassant.col) {
                moveType = MOVE_TYPES.EN_PASSANT;
            }
            // Piyon terfi kontrolü
            else if (toRow === 0 || toRow === 7) {
                moveType = MOVE_TYPES.PROMOTION;
            }
        }
        
        const move = new ChessMove(
            { row: fromRow, col: fromCol },
            { row: toRow, col: toCol },
            piece,
            captured,
            moveType
        );
        
        // Piyon terfi
        if (moveType === MOVE_TYPES.PROMOTION) {
            const pieceColor = getPieceColor(piece);
            const promotionPieces = {
                'Q': pieceColor === COLORS.WHITE ? 'Q' : 'q',
                'R': pieceColor === COLORS.WHITE ? 'R' : 'r',
                'B': pieceColor === COLORS.WHITE ? 'B' : 'b',
                'N': pieceColor === COLORS.WHITE ? 'N' : 'n'
            };
            move.promoted = promotionPieces[promotion] || promotionPieces['Q'];
        }
        
        return move;
    }

    // Hamle Geçerliliği Kontrolü
    isValidMove(move) {
        // Temel kontroller
        if (!isValidPosition(move.from.row, move.from.col) || 
            !isValidPosition(move.to.row, move.to.col)) return false;
        
        // Aynı kare kontrolü
        if (move.from.row === move.to.row && move.from.col === move.to.col) return false;
        
        // Geçerli hamleler listesinde var mı?
        const validMoves = this.getValidMoves(move.from.row, move.from.col);
        return validMoves.some(validMove => 
            validMove.to.row === move.to.row && validMove.to.col === move.to.col
        );
    }

    // Hamleyi Uygula
    applyMove(move) {
        // Notasyon oluştur
        const allMoves = this.moveGenerator.generateAllMoves(
            this.board.board, 
            this.gameState, 
            this.gameState.currentPlayer
        );
        move.generateNotation(this.board.board, allMoves);
        
        // Hamleyi tahtaya uygula
        const result = move.apply(this.board.board, this.gameState);
        this.board.board = result.board;
        this.gameState = { ...this.gameState, ...result.gameState };
        
        // Hamle geçmişine ekle
        this.moveHistory.addMove(move);
        
        // Hamle sayısını artır
        this.gameState.moveCount++;
        
        // Sıra değiştir
        this.gameState.currentPlayer = this.gameState.currentPlayer === COLORS.WHITE ? 
            COLORS.BLACK : COLORS.WHITE;
        
        // Ses efekti
        this.playMoveSound(move);
    }

    // Hamle Ses Efekti
    playMoveSound(move) {
        if (move.captured) {
            playSound('CAPTURE');
        } else if (move.type === MOVE_TYPES.CASTLE_KINGSIDE || 
                   move.type === MOVE_TYPES.CASTLE_QUEENSIDE) {
            playSound('CASTLE');
        } else {
            playSound('MOVE');
        }
    }

    // Geçerli Hamleleri Al
    getValidMoves(row, col) {
        const piece = this.board.getPiece(row, col);
        if (!piece || getPieceColor(piece) !== this.gameState.currentPlayer) {
            return [];
        }
        
        return this.moveGenerator.generatePieceMoves(this.board.board, this.gameState, row, col)
            .filter(move => {
                const { board: newBoard } = move.apply(this.board.board, this.gameState);
                return !isInCheck(newBoard, this.gameState.currentPlayer);
            });
    }

    // Tüm Geçerli Hamleleri Al
    getAllValidMoves(color = this.gameState.currentPlayer) {
        return this.moveGenerator.generateAllMoves(this.board.board, this.gameState, color);
    }

    // Hamle Geri Al
    undoMove() {
        const move = this.moveHistory.undo();
        if (!move) return false;
        
        // Tahtayı önceki duruma döndür
        this.rebuildBoardFromHistory();
        
        // Oyun durumunu güncelle
        this.updateGameStatus();
        
        // Gözlemcilere bildir
        this.notifyObservers('moveUndone', { move });
        
        return true;
    }

    // Tahtayı Geçmişten Yeniden Oluştur
    rebuildBoardFromHistory() {
        // Başlangıç durumuna döndür
        this.board = new ChessBoard();
        this.gameState = this.initializeGameState();
        
        // Tüm hamleleri tekrar uygula
        const moves = this.moveHistory.getMovesFrom(0);
        this.moveHistory.clear();
        
        moves.forEach(move => {
            this.applyMove(move);
        });
        
        // Son durumu düzelt
        if (moves.length > 0) {
            this.gameState.currentPlayer = moves.length % 2 === 0 ? COLORS.WHITE : COLORS.BLACK;
        }
    }

    // Oyun Durumunu Güncelle
    updateGameStatus() {
        const currentPlayer = this.gameState.currentPlayer;
        
        // Şah kontrolü
        if (isInCheck(this.board.board, currentPlayer)) {
            // Geçerli hamle var mı?
            const validMoves = this.getAllValidMoves(currentPlayer);
            if (validMoves.length === 0) {
                this.gameState.status = GAME_STATUS.CHECKMATE;
                this.gameResult = {
                    result: 'checkmate',
                    winner: currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE,
                    loser: currentPlayer
                };
                this.gameEndTime = Date.now();
                playSound('GAME_END');
            } else {
                this.gameState.status = GAME_STATUS.CHECK;
                playSound('CHECK');
            }
        } else {
            // Pat kontrolü
            const validMoves = this.getAllValidMoves(currentPlayer);
            if (validMoves.length === 0) {
                this.gameState.status = GAME_STATUS.STALEMATE;
                this.gameResult = {
                    result: 'stalemate',
                    winner: null,
                    reason: 'No legal moves available'
                };
                this.gameEndTime = Date.now();
                playSound('GAME_END');
            } else {
                this.gameState.status = GAME_STATUS.PLAYING;
            }
        }
        
        // Diğer beraberlik kontrolleri
        if (this.gameState.status === GAME_STATUS.PLAYING) {
            if (this.isDrawByRepetition()) {
                this.gameState.status = GAME_STATUS.DRAW;
                this.gameResult = {
                    result: 'draw',
                    reason: 'Threefold repetition'
                };
                this.gameEndTime = Date.now();
            } else if (this.isDrawByFiftyMoveRule()) {
                this.gameState.status = GAME_STATUS.DRAW;
                this.gameResult = {
                    result: 'draw',
                    reason: 'Fifty move rule'
                };
                this.gameEndTime = Date.now();
            } else if (this.isDrawByInsufficientMaterial()) {
                this.gameState.status = GAME_STATUS.DRAW;
                this.gameResult = {
                    result: 'draw',
                    reason: 'Insufficient material'
                };
                this.gameEndTime = Date.now();
            }
        }
    }

    // Tekrarlanan Pozisyon Beraberliği
    isDrawByRepetition() {
        return this.moveHistory.hasThreefoldRepetition();
    }

    // 50 Hamle Kuralı
    isDrawByFiftyMoveRule() {
        return this.gameState.halfMoveClock >= 100; // 50 tam hamle = 100 yarı hamle
    }

    // Yetersiz Materyal Beraberliği
    isDrawByInsufficientMaterial() {
        const pieces = { white: [], black: [] };
        
        // Tahtadaki tüm taşları say
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece) {
                    const color = getPieceColor(piece);
                    const type = getPieceType(piece);
                    pieces[color].push(type);
                }
            }
        }
        
        // Kral vs Kral
        if (pieces.white.length === 1 && pieces.black.length === 1) {
            return true;
        }
        
        // Kral + At/Fil vs Kral
        if ((pieces.white.length === 2 && pieces.black.length === 1) ||
            (pieces.white.length === 1 && pieces.black.length === 2)) {
            const longerSide = pieces.white.length === 2 ? pieces.white : pieces.black;
            const minorPieces = longerSide.filter(p => p === PIECE_TYPES.KNIGHT || p === PIECE_TYPES.BISHOP);
            if (minorPieces.length === 1) return true;
        }
        
        // Kral + Fil vs Kral + Fil (aynı renk kareler)
        if (pieces.white.length === 2 && pieces.black.length === 2) {
            const whiteBishops = pieces.white.filter(p => p === PIECE_TYPES.BISHOP);
            const blackBishops = pieces.black.filter(p => p === PIECE_TYPES.BISHOP);
            
            if (whiteBishops.length === 1 && blackBishops.length === 1) {
                // Fillerin aynı renk karelerde olup olmadığını kontrol et
                const whiteBishopSquare = this.findPieceSquare(COLORS.WHITE, PIECE_TYPES.BISHOP);
                const blackBishopSquare = this.findPieceSquare(COLORS.BLACK, PIECE_TYPES.BISHOP);
                
                if (whiteBishopSquare && blackBishopSquare) {
                    const whiteSquareColor = (whiteBishopSquare.row + whiteBishopSquare.col) % 2;
                    const blackSquareColor = (blackBishopSquare.row + blackBishopSquare.col) % 2;
                    return whiteSquareColor === blackSquareColor;
                }
            }
        }
        
        return false;
    }

    // Belirli Taşın Pozisyonunu Bul
    findPieceSquare(color, pieceType) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece && getPieceColor(piece) === color && getPieceType(piece) === pieceType) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    // Oyun Bitmiş mi?
    isGameOver() {
        return this.gameState.status === GAME_STATUS.CHECKMATE ||
               this.gameState.status === GAME_STATUS.STALEMATE ||
               this.gameState.status === GAME_STATUS.DRAW;
    }

    // Yeni Oyun Başlat
    newGame() {
        this.board = new ChessBoard();
        this.moveHistory = new MoveHistory();
        this.gameState = this.initializeGameState();
        this.gameStartTime = Date.now();
        this.gameEndTime = null;
        this.gameResult = null;
        
        this.updateGameStatus();
        this.notifyObservers('gameReset');
    }

    // Pozisyon Değerlendirmesi
    evaluatePosition() {
        let evaluation = 0;
        
        // Materyal değerlendirmesi
        evaluation += this.evaluateMaterial();
        
        // Pozisyonel değerlendirme
        evaluation += this.evaluatePosition_internal();
        
        // Kral güvenliği
        evaluation += this.evaluateKingSafety();
        
        // Piyon yapısı
        evaluation += this.evaluatePawnStructure();
        
        return evaluation;
    }

    // Materyal Değerlendirmesi
    evaluateMaterial() {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece) {
                    const pieceType = getPieceType(piece);
                    const pieceColor = getPieceColor(piece);
                    const value = PIECE_VALUES[pieceType];
                    
                    if (pieceColor === COLORS.WHITE) {
                        score += value;
                    } else {
                        score -= value;
                    }
                }
            }
        }
        
        return score;
    }

    // Pozisyonel Değerlendirme
    evaluatePosition_internal() {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece) {
                    const pieceType = getPieceType(piece);
                    const pieceColor = getPieceColor(piece);
                    
                    if (POSITION_VALUES[pieceType]) {
                        const posRow = pieceColor === COLORS.WHITE ? 7 - row : row;
                        const posValue = POSITION_VALUES[pieceType][posRow][col] / 100;
                        
                        if (pieceColor === COLORS.WHITE) {
                            score += posValue;
                        } else {
                            score -= posValue;
                        }
                    }
                }
            }
        }
        
        return score;
    }

    // Kral Güvenliği Değerlendirmesi
    evaluateKingSafety() {
        let score = 0;
        
        const whiteKing = findKing(this.board.board, COLORS.WHITE);
        const blackKing = findKing(this.board.board, COLORS.BLACK);
        
        if (whiteKing) {
            score += this.getKingSafetyScore(whiteKing, COLORS.WHITE);
        }
        
        if (blackKing) {
            score -= this.getKingSafetyScore(blackKing, COLORS.BLACK);
        }
        
        return score;
    }

    // Kral Güvenlik Skoru
    getKingSafetyScore(kingPos, color) {
        let safety = 0;
        
        // Kralın etrafındaki koruyucu taşları say
        for (const [dr, dc] of KING_MOVES) {
            const row = kingPos.row + dr;
            const col = kingPos.col + dc;
            
            if (isValidPosition(row, col)) {
                const piece = this.board.getPiece(row, col);
                if (piece && getPieceColor(piece) === color) {
                    safety += 10;
                }
            }
        }
        
        return safety;
    }

    // Piyon Yapısı Değerlendirmesi
    evaluatePawnStructure() {
        let score = 0;
        
        // İkili piyon cezası
        for (let col = 0; col < 8; col++) {
            let whitePawns = 0;
            let blackPawns = 0;
            
            for (let row = 0; row < 8; row++) {
                const piece = this.board.getPiece(row, col);
                if (piece && getPieceType(piece) === PIECE_TYPES.PAWN) {
                    if (getPieceColor(piece) === COLORS.WHITE) {
                        whitePawns++;
                    } else {
                        blackPawns++;
                    }
                }
            }
            
            if (whitePawns > 1) score -= (whitePawns - 1) * 50;
            if (blackPawns > 1) score += (blackPawns - 1) * 50;
        }
        
        return score;
    }

    // FEN Notasyonu Oluştur
    toFEN() {
        let fen = '';
        
        // Tahta durumu
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
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
        fen += ' ' + (this.gameState.currentPlayer === COLORS.WHITE ? 'w' : 'b');
        
        // Rok hakları
        fen += ' ';
        let castling = '';
        const whiteCastling = this.gameState.castling[COLORS.WHITE];
        const blackCastling = this.gameState.castling[COLORS.BLACK];
        
        if (!whiteCastling.kingMoved) {
            if (!whiteCastling.kingSideRookMoved) castling += 'K';
            if (!whiteCastling.queenSideRookMoved) castling += 'Q';
        }
        if (!blackCastling.kingMoved) {
            if (!blackCastling.kingSideRookMoved) castling += 'k';
            if (!blackCastling.queenSideRookMoved) castling += 'q';
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

    // PGN Formatı
    toPGN(gameInfo = {}) {
        let pgn = '';
        
        // Oyun bilgileri
        const defaultInfo = {
            Event: 'Casual Game',
            Site: 'Browser Chess',
            Date: new Date().toISOString().split('T')[0],
            Round: '1',
            White: this.players[COLORS.WHITE].name,
            Black: this.players[COLORS.BLACK].name,
            Result: this.getGameResultString()
        };
        
        const info = { ...defaultInfo, ...gameInfo };
        
        Object.entries(info).forEach(([key, value]) => {
            pgn += `[${key} "${value}"]\n`;
        });
        
        pgn += '\n';
        
        // Hamleler
        pgn += this.moveHistory.toPGN();
        
        // Sonuç
        pgn += ' ' + this.getGameResultString();
        
        return pgn;
    }

    // Oyun Sonucu String'i
    getGameResultString() {
        if (!this.gameResult) return '*';
        
        switch (this.gameResult.result) {
            case 'checkmate':
                return this.gameResult.winner === COLORS.WHITE ? '1-0' : '0-1';
            case 'stalemate':
            case 'draw':
                return '1/2-1/2';
            default:
                return '*';
        }
    }

    // Oyun Süresi
    getGameDuration() {
        const endTime = this.gameEndTime || Date.now();
        return Math.floor((endTime - this.gameStartTime) / 1000);
    }

    // Oyun İstatistikleri
    getGameStats() {
        return {
            moves: this.moveHistory.getCount(),
            duration: this.getGameDuration(),
            status: this.gameState.status,
            result: this.gameResult,
            currentPlayer: this.gameState.currentPlayer,
            evaluation: this.evaluatePosition(),
            fen: this.toFEN()
        };
    }

    // Gözlemci Ekleme
    addObserver(observer) {
        this.observers.push(observer);
    }

    // Gözlemci Çıkarma
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    // Gözlemcilere Bildirim
    notifyObservers(event, data = {}) {
        this.observers.forEach(observer => {
            if (typeof observer[event] === 'function') {
                observer[event](data);
            } else if (typeof observer.notify === 'function') {
                observer.notify(event, data);
            }
        });
    }

    // Oyuncu Ayarlama
    setPlayer(color, playerConfig) {
        this.players[color] = { ...this.players[color], ...playerConfig };
    }

    // Hamle Önerisi Al
    async getSuggestion(color = this.gameState.currentPlayer) {
        const ai = new ChessAI(2); // Orta seviye öneri
        return await ai.findBestMove(this.board.board, this.gameState);
    }

    // Pozisyon Analizi
    analyzePosition(depth = 3) {
        const ai = new ChessAI(depth);
        const evaluation = ai.evaluatePosition(this.board.board, this.gameState);
        const bestMove = ai.findBestMove(this.board.board, this.gameState);
        const tacticalMoves = ai.findTacticalMoves(this.board.board, this.gameState, this.gameState.currentPlayer);
        
        return {
            evaluation,
            bestMove,
            tacticalMoves,
            isEndgame: ai.isEndgame(this.board.board),
            threatenedPieces: this.findThreatenedPieces(),
            openingPhase: this.moveHistory.getCount() < 20
        };
    }

    // Tehdit Altındaki Taşları Bul
    findThreatenedPieces() {
        const threatened = [];
        const currentColor = this.gameState.currentPlayer;
        const enemyColor = currentColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        
        // Düşman taşlarının saldırabileceği kareleri bul
        const enemyAttacks = new Set();
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece && getPieceColor(piece) === enemyColor) {
                    const pieceObj = PieceFactory.createPiece(piece, row, col);
                    const attacks = pieceObj.getAttackSquares(this.board.board);
                    attacks.forEach(attack => {
                        enemyAttacks.add(`${attack.row},${attack.col}`);
                    });
                }
            }
        }
        
        // Hangi dostane taşlar tehdit altında?
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece && getPieceColor(piece) === currentColor) {
                    if (enemyAttacks.has(`${row},${col}`)) {
                        threatened.push({
                            piece,
                            position: { row, col },
                            type: getPieceType(piece),
                            value: PIECE_VALUES[getPieceType(piece)]
                        });
                    }
                }
            }
        }
        
        return threatened.sort((a, b) => b.value - a.value);
    }
}