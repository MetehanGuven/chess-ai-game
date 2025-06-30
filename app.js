
class ChessApp {
    constructor() {
        this.chessBoard = new ChessBoard();
        this.ai = new ChessAI(3);
        this.boardElement = null;
        this.gameTimer = null;
        this.gameStartTime = Date.now();
        
        this.init();
    }

    // Uygulamayı Başlat
    init() {
        console.log('App init başladı'); // Debug
        
        this.boardElement = document.getElementById('chess-board');
        this.setupEventListeners();
        this.createBoard(); // Bu zaten updateBoard() çağırıyor
        // this.updateDisplay(); // BUNU KALDIRDIK - Çifte çağrım olmasın
        this.startGameTimer();
        
        console.log('App init tamamlandı'); // Debug
    }

    // Event Listeners Kurulumu
    setupEventListeners() {
        // Yeni Oyun Butonu
        document.getElementById('new-game').addEventListener('click', () => {
            this.newGame();
        });

        // Geri Al Butonu
        document.getElementById('undo-move').addEventListener('click', () => {
            this.undoMove();
        });

        // İpucu Butonu
        document.getElementById('hint').addEventListener('click', () => {
            this.showHint();
        });

        // Zorluk Seviyesi
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.ai.setDifficulty(parseInt(e.target.value));
        });

        // Klavye Kısayolları
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'n':
                case 'N':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.newGame();
                    }
                    break;
                case 'z':
                case 'Z':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.undoMove();
                    }
                    break;
                case 'h':
                case 'H':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.showHint();
                    }
                    break;
            }
        });
    }

    // Satranç Tahtasını Oluştur
    createBoard() {
        console.log('createBoard çağrıldı'); // Debug
        
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                // Kare Tıklama Eventi
                square.addEventListener('click', (e) => {
                    const clickedRow = parseInt(e.currentTarget.dataset.row);
                    const clickedCol = parseInt(e.currentTarget.dataset.col);
                    this.handleSquareClick(clickedRow, clickedCol);
                });

                this.boardElement.appendChild(square);
            }
        }
        
        console.log('Kareler oluşturuldu, şimdi taşlar yerleştirilecek'); // Debug
        
        // Taşları direkt burada yerleştir
        this.placeInitialPieces();
    }

    // İlk Taşları Yerleştir
    placeInitialPieces() {
        if (this.piecesAlreadyPlaced) return;
    this.piecesAlreadyPlaced = true;
        console.log('placeInitialPieces çağrıldı');
        
        const initialBoard = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.getSquareElement(row, col);
                const piece = initialBoard[row][col];
                
                if (square) {
                    // TAMAMEN TEMİZLE - TÜM ÇOCUKLARI SİL
                    while (square.firstChild) {
                        square.removeChild(square.firstChild);
                    }
                    
                    if (piece) {
                        console.log(`Taş yerleştiriliyor: ${piece} - pozisyon: ${row},${col}`);
                        console.log(`Kare içeriği ÖNCE:`, square.innerHTML);
                        
                        const pieceInfo = PIECE_SYMBOLS[piece];
                        if (pieceInfo) {
                            const pieceElement = document.createElement('div');
                            pieceElement.className = `chess-piece ${pieceInfo.color}-piece piece-${pieceInfo.type}`;
                            square.appendChild(pieceElement);
                            
                            console.log(`Kare içeriği SONRA:`, square.innerHTML);
                            console.log(`Kare çocuk sayısı:`, square.children.length);
                        }
                    }
                }
            }
        }
        
        console.log('Taşlar yerleştirildi');
    }

    // Kare Tıklama İşleyicisi
    handleSquareClick(row, col) {
        if (this.chessBoard.isGameOver()) return;
        if (this.chessBoard.currentPlayer !== COLORS.WHITE) return;
        if (this.ai.isThinking) return;

        const moved = this.chessBoard.selectSquare(row, col);
        
        if (moved) {
            this.updateDisplay();
            
            // AI hamlesi için bekle
            if (!this.chessBoard.isGameOver() && this.chessBoard.currentPlayer === COLORS.BLACK) {
                setTimeout(() => {
                    this.makeAIMove();
                }, 750);
            }
        } else {
            this.updateDisplay();
        }
    }

    // AI Hamlesini Yap
    async makeAIMove() {
        if (this.chessBoard.isGameOver()) return;
        if (this.chessBoard.currentPlayer !== COLORS.BLACK) return;

        this.showThinkingIndicator(true);
        
        try {
            const move = await this.ai.findBestMove(
                this.chessBoard.getBoardCopy(), 
                this.chessBoard.gameState
            );

            if (move) {
                const success = this.chessBoard.makeMove(
                    move.from.row, 
                    move.from.col, 
                    move.to.row, 
                    move.to.col
                );

                if (success) {
                    this.animateMove(move);
                    this.updateDisplay();
                }
            }
        } catch (error) {
            console.error('AI hamle hatası:', error);
        }

        this.showThinkingIndicator(false);
    }

    // Hamle Animasyonu
    animateMove(move) {
        const fromSquare = this.getSquareElement(move.from.row, move.from.col);
        const toSquare = this.getSquareElement(move.to.row, move.to.col);
        
        if (fromSquare && toSquare) {
            const piece = fromSquare.querySelector('.chess-piece');
            if (piece) {
                piece.classList.add('moving');
                setTimeout(() => {
                    piece.classList.remove('moving');
                }, 300);
            }
        }
    }

    // Kare Elementini Al
    getSquareElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    // Ekranı Güncelle
    updateDisplay() {
        this.updateBoard();
        this.updateGameStatus();
        this.updateTurnIndicator();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateMoveCount();
    }

    // Tahtayı Güncelle
    updateBoard() {
        // Önce tüm kareleri temizle
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.getSquareElement(row, col);
                const piece = this.chessBoard.getPiece(row, col);
                
                // Kare stillerini temizle
                square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                
                // Seçili kare
                if (this.chessBoard.selectedSquare && 
                    this.chessBoard.selectedSquare.row === row && 
                    this.chessBoard.selectedSquare.col === col) {
                    square.classList.add('selected');
                }
                
                // Geçerli hamleler
                if (this.chessBoard.validMoves.some(move => move.row === row && move.col === col)) {
                    if (piece && getPieceColor(piece) !== this.chessBoard.currentPlayer) {
                        square.classList.add('attack-move');
                    } else {
                        square.classList.add('valid-move');
                    }
                }
                
                // Son hamle vurgulama
                if (this.chessBoard.moveHistory.length > 0) {
                    const lastMove = this.chessBoard.moveHistory[this.chessBoard.moveHistory.length - 1];
                    if ((lastMove.from.row === row && lastMove.from.col === col) ||
                        (lastMove.to.row === row && lastMove.to.col === col)) {
                        square.classList.add('last-move');
                    }
                }
                
                // Şah durumu
                if (piece && getPieceType(piece) === PIECE_TYPES.KING) {
                    const kingColor = getPieceColor(piece);
                    if (isInCheck(this.chessBoard.board, kingColor)) {
                        square.classList.add('check');
                    }
                }
                
                // Taş görüntüleme - SADECE BİR KEZ
                square.innerHTML = ''; // Önce temizle
                
                if (piece) {
                    const pieceInfo = PIECE_SYMBOLS[piece];
                    
                    if (pieceInfo) {
                        const pieceElement = document.createElement('div');
                        pieceElement.className = `chess-piece ${pieceInfo.color}-piece piece-${pieceInfo.type}`;

                        square.appendChild(pieceElement);
                    }
                }
            }
        }
    }

    // Oyun Durumunu Güncelle
    updateGameStatus() {
        const statusElement = document.getElementById('game-status');
        let statusText = '';
        
        switch (this.chessBoard.gameStatus) {
            case GAME_STATUS.PLAYING:
                statusText = 'Oyun Devam Ediyor';
                break;
            case GAME_STATUS.CHECK:
                const checkColor = this.chessBoard.currentPlayer === COLORS.WHITE ? 'Beyaz' : 'Siyah';
                statusText = `${checkColor} Şahta!`;
                break;
            case GAME_STATUS.CHECKMATE:
                const winner = this.chessBoard.currentPlayer === COLORS.WHITE ? 'Siyah' : 'Beyaz';
                statusText = `Şah Mat! ${winner} Kazandı!`;
                break;
            case GAME_STATUS.STALEMATE:
                statusText = 'Pat! Berabere!';
                break;
            case GAME_STATUS.DRAW:
                statusText = 'Berabere!';
                break;
        }
        
        statusElement.textContent = statusText;
        statusElement.className = 'status-display';
        
        // Durum sınıfı ekle
        if (this.chessBoard.gameStatus === GAME_STATUS.CHECK) {
            statusElement.classList.add('status-check');
        } else if (this.chessBoard.gameStatus === GAME_STATUS.CHECKMATE) {
            statusElement.classList.add('status-checkmate');
        } else if (this.chessBoard.gameStatus === GAME_STATUS.STALEMATE || this.chessBoard.gameStatus === GAME_STATUS.DRAW) {
            statusElement.classList.add('status-stalemate');
        }
    }

    // Sıra Göstergesini Güncelle
    updateTurnIndicator() {
        const turnElement = document.getElementById('turn-indicator');
        const currentPlayerText = this.chessBoard.currentPlayer === COLORS.WHITE ? 'Beyaz' : 'Siyah';
        turnElement.textContent = `Sıra: ${currentPlayerText}`;
    }

    // Hamle Geçmişini Güncelle
    updateMoveHistory() {
        const movesElement = document.getElementById('moves-list');
        movesElement.innerHTML = '';
        
        for (let i = 0; i < this.chessBoard.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.chessBoard.moveHistory[i];
            const blackMove = this.chessBoard.moveHistory[i + 1];
            
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            
            let moveText = `<span class="move-number">${moveNumber}.</span> `;
            moveText += whiteMove ? whiteMove.notation : '';
            
            if (blackMove) {
                moveText += ` ${blackMove.notation}`;
            }
            
            moveItem.innerHTML = moveText;
            movesElement.appendChild(moveItem);
        }
        
        // En son hamleye kaydır
        movesElement.scrollTop = movesElement.scrollHeight;
    }

    // Ele Alınan Taşları Güncelle
    updateCapturedPieces() {
        const capturedWhiteElement = document.getElementById('captured-white');
        const capturedBlackElement = document.getElementById('captured-black');
        
        capturedWhiteElement.innerHTML = '';
        capturedBlackElement.innerHTML = '';
        
        // Ele alınan taşları hesapla
        const capturedPieces = this.getCapturedPieces();
        
        capturedPieces.white.forEach(piece => {
            const pieceElement = document.createElement('span');
            pieceElement.className = 'captured-piece white-piece';
            const pieceInfo = PIECE_SYMBOLS[piece];
            if (pieceInfo) {
                pieceElement.innerHTML = pieceInfo.symbol;
            }
            capturedWhiteElement.appendChild(pieceElement);
        });
        
        capturedPieces.black.forEach(piece => {
            const pieceElement = document.createElement('span');
            pieceElement.className = 'captured-piece black-piece';
            const pieceInfo = PIECE_SYMBOLS[piece];
            if (pieceInfo) {
                pieceElement.HTML = pieceInfo.symbol;
            }
            capturedBlackElement.appendChild(pieceElement);
        });
    }

    // Ele Alınan Taşları Hesapla
    getCapturedPieces() {
        const captured = { white: [], black: [] };
        
        this.chessBoard.moveHistory.forEach(move => {
            if (move.captured) {
                const capturedColor = getPieceColor(move.captured);
                if (capturedColor === COLORS.WHITE) {
                    captured.white.push(move.captured);
                } else {
                    captured.black.push(move.captured);
                }
            }
        });
        
        return captured;
    }

    // Hamle Sayısını Güncelle
    updateMoveCount() {
        const moveCountElement = document.getElementById('move-count');
        moveCountElement.textContent = this.chessBoard.moveCount;
    }

    // Düşünme Göstergesini Göster/Gizle
    showThinkingIndicator(show) {
        let indicator = document.querySelector('.thinking-indicator');
        
        if (show && !indicator) {
            indicator = document.createElement('div');
            indicator.className = 'thinking-indicator';
            indicator.textContent = 'AI Düşünüyor...';
            document.querySelector('.chess-board-container').appendChild(indicator);
        } else if (!show && indicator) {
            indicator.remove();
        }
    }

    // Yeni Oyun Başlat
    newGame() {
        if (confirm('Yeni oyun başlatmak istediğinizden emin misiniz?')) {
            this.chessBoard.newGame();
            this.gameStartTime = Date.now();
            this.updateDisplay();
            
            // Düşünme göstergesini temizle
            this.showThinkingIndicator(false);
        }
    }

    // Hamle Geri Al
    undoMove() {
        if (this.chessBoard.moveHistory.length === 0) return;
        if (this.ai.isThinking) return;
        
        // İki hamle geri al (oyuncu ve AI)
        if (this.chessBoard.undoMove()) {
            if (this.chessBoard.currentPlayer === COLORS.BLACK && this.chessBoard.moveHistory.length > 0) {
                this.chessBoard.undoMove();
            }
            this.updateDisplay();
        }
    }

    // İpucu Göster
    async showHint() {
        if (this.chessBoard.currentPlayer !== COLORS.WHITE) return;
        if (this.chessBoard.isGameOver()) return;
        if (this.ai.isThinking) return;

        try {
            const hint = await this.ai.getHint(
                this.chessBoard.getBoardCopy(), 
                this.chessBoard.gameState, 
                COLORS.WHITE
            );

            if (hint) {
                this.highlightHint(hint);
                setTimeout(() => {
                    this.clearHintHighlight();
                }, 3000);
            }
        } catch (error) {
            console.error('İpucu hatası:', error);
        }
    }

    // İpucu Vurgulama
    highlightHint(hint) {
        const fromSquare = this.getSquareElement(hint.from.row, hint.from.col);
        const toSquare = this.getSquareElement(hint.to.row, hint.to.col);
        
        if (fromSquare) fromSquare.classList.add('hint-from');
        if (toSquare) toSquare.classList.add('hint-to');
    }

    // İpucu Vurgulamasını Temizle
    clearHintHighlight() {
        document.querySelectorAll('.hint-from, .hint-to').forEach(square => {
            square.classList.remove('hint-from', 'hint-to');
        });
    }

    // Oyun Zamanlayıcısını Başlat
    startGameTimer() {
        this.gameTimer = setInterval(() => {
            const gameTime = this.chessBoard.getGameTime();
            document.getElementById('game-time').textContent = formatTime(gameTime);
        }, 1000);
    }

    // Zamanlayıcıyı Durdur
    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }
}

// Sayfa yüklendiğinde uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => {
    window.chessApp = new ChessApp();
    
    console.log('🎯 Chess.com Tarzı Satranç Oyunu Hazır!');
    console.log('📋 Kısayollar:');
    console.log('   Ctrl+N: Yeni Oyun');
    console.log('   Ctrl+Z: Geri Al');
    console.log('   Ctrl+H: İpucu');
    console.log('🎮 İyi oyunlar!');
});