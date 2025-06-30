// Yapay Zeka Motoru - ai.js

class ChessAI {
    constructor(difficulty = 3) {
        this.difficulty = difficulty;
        this.maxDepth = AI_LEVELS[difficulty].depth;
        this.isThinking = false;
        this.nodesEvaluated = 0;
    }

    // Zorluk Seviyesi Ayarlama
    setDifficulty(level) {
        this.difficulty = level;
        this.maxDepth = AI_LEVELS[level].depth;
    }

    // En İyi Hamleyi Bul
    async findBestMove(board, gameState) {
        this.isThinking = true;
        this.nodesEvaluated = 0;
        
        const startTime = Date.now();
        
        try {
            // Minimax algoritması ile en iyi hamleyi bul
            const result = await this.minimax(board, gameState, this.maxDepth, -Infinity, Infinity, true);
            
            const endTime = Date.now();
            const thinkTime = endTime - startTime;
            
            console.log(`AI Düşünme Süresi: ${thinkTime}ms`);
            console.log(`Değerlendirilen Düğüm: ${this.nodesEvaluated}`);
            console.log(`Saniyede Düğüm: ${Math.round(this.nodesEvaluated / (thinkTime / 1000))}`);
            
            this.isThinking = false;
            return result.move;
        } catch (error) {
            console.error('AI hatası:', error);
            this.isThinking = false;
            return this.getRandomMove(board, gameState);
        }
    }

    // Minimax Algoritması (Alpha-Beta Budama ile)
    async minimax(board, gameState, depth, alpha, beta, isMaximizing) {
        this.nodesEvaluated++;
        
        // Terminal düğüm kontrolü
        if (depth === 0 || this.isTerminalPosition(board, gameState)) {
            return {
                score: this.evaluatePosition(board, gameState),
                move: null
            };
        }

        const color = isMaximizing ? COLORS.BLACK : COLORS.WHITE;
        const moves = this.getAllValidMoves(board, gameState, color);
        
        // Hamle sıralama (daha iyi hamleleri önce değerlendir)
        moves.sort((a, b) => this.scoreMoveForOrdering(board, b) - this.scoreMoveForOrdering(board, a));

        let bestMove = null;
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const newGameState = this.updateGameState(gameState, move);
                
                const result = await this.minimax(newBoard, newGameState, depth - 1, alpha, beta, false);
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) {
                    break; // Alpha-Beta budama
                }
                
                // Async yapı için kısa bekle
                if (this.nodesEvaluated % 1000 === 0) {
                    await this.sleep(0);
                }
            }
            
            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;
            
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const newGameState = this.updateGameState(gameState, move);
                
                const result = await this.minimax(newBoard, newGameState, depth - 1, alpha, beta, true);
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) {
                    break; // Alpha-Beta budama
                }
                
                // Async yapı için kısa bekle
                if (this.nodesEvaluated % 1000 === 0) {
                    await this.sleep(0);
                }
            }
            
            return { score: minScore, move: bestMove };
        }
    }

    // Pozisyon Değerlendirmesi
    evaluatePosition(board, gameState) {
        let score = 0;
        
        // Temel taş değerleri
        score += this.getMaterialScore(board);
        
        // Pozisyon değerleri
        score += this.getPositionalScore(board);
        
        // Kral güvenliği
        score += this.getKingSafetyScore(board);
        
        // Merkez kontrolü
        score += this.getCenterControlScore(board);
        
        // Hareket kabiliyeti
        score += this.getMobilityScore(board, gameState);
        
        // Özel durumlar
        if (isInCheck(board, COLORS.WHITE)) score -= 50;
        if (isInCheck(board, COLORS.BLACK)) score += 50;
        
        return score;
    }

    // Materyal Skorunu Hesapla
    getMaterialScore(board) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const pieceType = getPieceType(piece);
                    const pieceColor = getPieceColor(piece);
                    const value = PIECE_VALUES[pieceType];
                    
                    if (pieceColor === COLORS.WHITE) {
                        score -= value;
                    } else {
                        score += value;
                    }
                }
            }
        }
        
        return score;
    }

    // Pozisyonel Skoru Hesapla
    getPositionalScore(board) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const pieceType = getPieceType(piece);
                    const pieceColor = getPieceColor(piece);
                    
                    if (POSITION_VALUES[pieceType]) {
                        const posRow = pieceColor === COLORS.WHITE ? 7 - row : row;
                        const posValue = POSITION_VALUES[pieceType][posRow][col] / 10;
                        
                        if (pieceColor === COLORS.WHITE) {
                            score -= posValue;
                        } else {
                            score += posValue;
                        }
                    }
                }
            }
        }
        
        return score;
    }

    // Kral Güvenliği Skoru
    getKingSafetyScore(board) {
        let score = 0;
        
        const whiteKing = findKing(board, COLORS.WHITE);
        const blackKing = findKing(board, COLORS.BLACK);
        
        if (whiteKing) {
            score -= this.evaluateKingSafety(board, whiteKing, COLORS.WHITE);
        }
        
        if (blackKing) {
            score += this.evaluateKingSafety(board, blackKing, COLORS.BLACK);
        }
        
        return score;
    }

    // Kral Güvenliği Değerlendirmesi
    evaluateKingSafety(board, kingPos, color) {
        let safety = 0;
        
        // Kralın etrafındaki koruyucu taşları say
        for (const [dr, dc] of KING_MOVES) {
            const row = kingPos.row + dr;
            const col = kingPos.col + dc;
            
            if (isValidPosition(row, col)) {
                const piece = board[row][col];
                if (piece && getPieceColor(piece) === color) {
                    safety += 10;
                }
            }
        }
        
        return safety;
    }

    // Merkez Kontrolü Skoru
    getCenterControlScore(board) {
        let score = 0;
        const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
        
        for (const [row, col] of centerSquares) {
            const piece = board[row][col];
            if (piece) {
                const pieceColor = getPieceColor(piece);
                const bonus = 20;
                
                if (pieceColor === COLORS.WHITE) {
                    score -= bonus;
                } else {
                    score += bonus;
                }
            }
        }
        
        return score;
    }

    // Hareket Kabiliyeti Skoru
    getMobilityScore(board, gameState) {
        const whiteMoves = this.getAllValidMoves(board, gameState, COLORS.WHITE).length;
        const blackMoves = this.getAllValidMoves(board, gameState, COLORS.BLACK).length;
        
        return (blackMoves - whiteMoves) * 1;
    }

    // Geçerli Hamleleri Al
    getAllValidMoves(board, gameState, color) {
        const moves = [];
        
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = board[fromRow][fromCol];
                if (piece && getPieceColor(piece) === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (isValidMove(board, fromRow, fromCol, toRow, toCol, gameState)) {
                                moves.push({
                                    from: { row: fromRow, col: fromCol },
                                    to: { row: toRow, col: toCol },
                                    piece: piece,
                                    captured: board[toRow][toCol]
                                });
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    }

    // Hamle Yapma (Simülasyon)
    makeMove(board, move) {
        const newBoard = copyBoard(board);
        const piece = move.piece;
        const pieceType = getPieceType(piece);
        
        // Temel hamle
        newBoard[move.to.row][move.to.col] = piece;
        newBoard[move.from.row][move.from.col] = null;
        
        // Özel hamleler
        if (pieceType === PIECE_TYPES.KING && Math.abs(move.to.col - move.from.col) === 2) {
            // Rok
            const isKingSide = move.to.col > move.from.col;
            const rookFromCol = isKingSide ? 7 : 0;
            const rookToCol = isKingSide ? move.to.col - 1 : move.to.col + 1;
            
            newBoard[move.from.row][rookToCol] = newBoard[move.from.row][rookFromCol];
            newBoard[move.from.row][rookFromCol] = null;
        }
        
        return newBoard;
    }

    // Oyun Durumu Güncelleme (Simülasyon)
    updateGameState(gameState, move) {
        const newGameState = JSON.parse(JSON.stringify(gameState));
        const piece = move.piece;
        const pieceType = getPieceType(piece);
        const pieceColor = getPieceColor(piece);
        
        // Rok hakları
        if (pieceType === PIECE_TYPES.KING) {
            newGameState.castling[pieceColor].kingMoved = true;
        } else if (pieceType === PIECE_TYPES.ROOK) {
            if (move.from.col === 0) {
                newGameState.castling[pieceColor].queenSideRookMoved = true;
            } else if (move.from.col === 7) {
                newGameState.castling[pieceColor].kingSideRookMoved = true;
            }
        }
        
        // En passant
        if (pieceType === PIECE_TYPES.PAWN && Math.abs(move.to.row - move.from.row) === 2) {
            newGameState.enPassant = {
                row: (move.from.row + move.to.row) / 2,
                col: move.from.col
            };
        } else {
            newGameState.enPassant = null;
        }
        
        return newGameState;
    }

    // Terminal Pozisyon Kontrolü
    isTerminalPosition(board, gameState) {
        const status = getGameStatus(board, COLORS.BLACK, gameState);
        return status === GAME_STATUS.CHECKMATE || status === GAME_STATUS.STALEMATE;
    }

    // Hamle Sıralama Skorlama
    scoreMoveForOrdering(board, move) {
        let score = 0;
        
        // Saldırı hamlelerine öncelik
        if (move.captured) {
            const capturedValue = PIECE_VALUES[getPieceType(move.captured)];
            const attackerValue = PIECE_VALUES[getPieceType(move.piece)];
            score += capturedValue - attackerValue / 10; // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
        }
        
        // Merkez karelerine hamle bonus
        const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
        if (centerSquares.some(([r, c]) => r === move.to.row && c === move.to.col)) {
            score += 20;
        }
        
        // Taş geliştirme bonus
        const piece = move.piece;
        const pieceType = getPieceType(piece);
        const pieceColor = getPieceColor(piece);
        
        if (pieceType === PIECE_TYPES.KNIGHT || pieceType === PIECE_TYPES.BISHOP) {
            const backRank = pieceColor === COLORS.BLACK ? 0 : 7;
            if (move.from.row === backRank) {
                score += 15; // Geliştirme bonusu
            }
        }
        
        return score;
    }

    // Rastgele Hamle Al (Fallback)
    getRandomMove(board, gameState) {
        const moves = this.getAllValidMoves(board, gameState, COLORS.BLACK);
        if (moves.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * moves.length);
        return moves[randomIndex];
    }

    // İpucu Ver
    getHint(board, gameState, playerColor) {
        return tempAI.findBestMove(board, gameState);
    }

    // Async Bekle Fonksiyonu
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Düşünme Durumu
    isThinkingNow() {
        return this.isThinking;
    }

    // Açılış Kitabı (Temel)
    getOpeningMove(board, moveHistory) {
        const openingMoves = {
            // İlk hamle
            'start': ['e2e4', 'd2d4', 'Ng1f3', 'c2c4'],
            
            // E4'e cevaplar
            'e2e4': ['e7e5', 'c7c5', 'e7e6', 'c7c6'],
            
            // D4'e cevaplar
            'd2d4': ['d7d5', 'Ng8f6', 'e7e6', 'c7c5'],
            
            // Nf3'e cevaplar
            'Ng1f3': ['d7d5', 'Ng8f6', 'c7c5', 'e7e6']
        };

        // Açılış aşamasında mı (ilk 10 hamle)
        if (moveHistory.length < 10) {
            let key = 'start';
            
            if (moveHistory.length > 0) {
                const lastMove = moveHistory[moveHistory.length - 1];
                key = lastMove.notation;
            }
            
            if (openingMoves[key]) {
                const possibleMoves = openingMoves[key];
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                
                // Notasyonu hamle objesine çevir
                return this.notationToMove(board, randomMove);
            }
        }
        
        return null;
    }

    // Notasyonu Hamle Objesine Çevir
    notationToMove(board, notation) {
        // Basit notasyon çevirici (geliştirilmesi gerekiyor)
        try {
            if (notation.length === 4) {
                const fromFile = notation[0];
                const fromRank = notation[1];
                const toFile = notation[2];
                const toRank = notation[3];
                
                const fromCol = FILES.indexOf(fromFile);
                const fromRow = RANKS.indexOf(fromRank);
                const toCol = FILES.indexOf(toFile);
                const toRow = RANKS.indexOf(toRank);
                
                const piece = board[fromRow][fromCol];
                
                return {
                    from: { row: fromRow, col: fromCol },
                    to: { row: toRow, col: toCol },
                    piece: piece,
                    captured: board[toRow][toCol]
                };
            }
        } catch (error) {
            console.log('Notasyon çeviri hatası:', error);
        }
        
        return null;
    }

    // Son Oyun Değerlendirmesi
    isEndgame(board) {
        let pieceCount = 0;
        let queenCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    pieceCount++;
                    if (getPieceType(piece) === PIECE_TYPES.QUEEN) {
                        queenCount++;
                    }
                }
            }
        }
        
        // 12'den az taş varsa veya vezir yoksa son oyun
        return pieceCount <= 12 || queenCount === 0;
    }

    // Taktiksel Motif Arama
    findTacticalMoves(board, gameState, color) {
        const moves = this.getAllValidMoves(board, gameState, color);
        const tacticalMoves = [];
        
        for (const move of moves) {
            const newBoard = this.makeMove(board, move);
            
            // Çatal (Fork) kontrolü
            if (this.isFork(newBoard, move)) {
                tacticalMoves.push({ ...move, tactic: 'fork' });
            }
            
            // Çivi (Pin) kontrolü
            if (this.isPin(newBoard, move)) {
                tacticalMoves.push({ ...move, tactic: 'pin' });
            }
            
            // Keşif saldırısı kontrolü
            if (this.isDiscoveredAttack(board, newBoard, move)) {
                tacticalMoves.push({ ...move, tactic: 'discovered_attack' });
            }
        }
        
        return tacticalMoves;
    }

    // Çatal Kontrolü
    isFork(board, move) {
        const piece = move.piece;
        const pieceType = getPieceType(piece);
        const pieceColor = getPieceColor(piece);
        
        if (pieceType === PIECE_TYPES.KNIGHT) {
            const attacks = getKnightAttacks(move.to.row, move.to.col);
            let attackedPieces = 0;
            
            for (const attack of attacks) {
                const targetPiece = board[attack.row][attack.col];
                if (targetPiece && getPieceColor(targetPiece) !== pieceColor) {
                    const targetType = getPieceType(targetPiece);
                    if (targetType === PIECE_TYPES.KING || PIECE_VALUES[targetType] > PIECE_VALUES[pieceType]) {
                        attackedPieces++;
                    }
                }
            }
            
            return attackedPieces >= 2;
        }
        
        return false;
    }

    // Çivi Kontrolü
    isPin(board, move) {
        // Basit çivi kontrolü - geliştirilmesi gerekiyor
        return false;
    }

    // Keşif Saldırısı Kontrolü
    isDiscoveredAttack(oldBoard, newBoard, move) {
        // Basit keşif saldırısı kontrolü - geliştirilmesi gerekiyor
        return false;
    }

    // Pozisyonel Değerlendirme İyileştirmeleri
    getAdvancedPositionalScore(board) {
        let score = 0;
        
        // Piyon yapısı
        score += this.evaluatePawnStructure(board);
        
        // Taş koordinasyonu
        score += this.evaluatePieceCoordination(board);
        
        // Kare kontrolü
        score += this.evaluateSquareControl(board);
        
        return score;
    }

    // Piyon Yapısı Değerlendirmesi
    evaluatePawnStructure(board) {
        let score = 0;
        
        // İkili piyon cezası
        for (let col = 0; col < 8; col++) {
            let whitePawns = 0;
            let blackPawns = 0;
            
            for (let row = 0; row < 8; row++) {
                const piece = board[row][col];
                if (piece && getPieceType(piece) === PIECE_TYPES.PAWN) {
                    if (getPieceColor(piece) === COLORS.WHITE) {
                        whitePawns++;
                    } else {
                        blackPawns++;
                    }
                }
            }
            
            if (whitePawns > 1) score += (whitePawns - 1) * 50; // Beyaz için ceza
            if (blackPawns > 1) score -= (blackPawns - 1) * 50; // Siyah için ceza
        }
        
        return score;
    }

    // Taş Koordinasyonu
    evaluatePieceCoordination(board) {
        // Taşların birbirini ne kadar iyi desteklediğini değerlendir
        return 0; // Basit implementasyon
    }

    // Kare Kontrolü
    evaluateSquareControl(board) {
        // Hangi karelerin kim tarafından kontrol edildiğini değerlendir
        return 0; // Basit implementasyon
    }

    // Zaman Yönetimi
    shouldStopThinking(startTime, maxTime = 5000) {
        return Date.now() - startTime > maxTime;
    }
}