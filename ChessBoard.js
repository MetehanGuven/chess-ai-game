// ChessBoard.js - Tahta Bileşeni

class ChessBoardComponent {
    constructor(boardElement, chessBoard) {
        this.element = boardElement;
        this.chessBoard = chessBoard;
        this.draggedPiece = null;
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        this.element.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('chess-piece')) {
                this.draggedPiece = e.target.closest('.chess-square');
                e.target.classList.add('dragging');
            }
        });

        this.element.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('chess-piece')) {
                e.target.classList.remove('dragging');
                this.draggedPiece = null;
            }
        });

        this.element.addEventListener('dragover', (e) => {
            e.preventDefault();
            const square = e.target.closest('.chess-square');
            if (square) {
                square.classList.add('drop-target');
            }
        });

        this.element.addEventListener('dragleave', (e) => {
            const square = e.target.closest('.chess-square');
            if (square) {
                square.classList.remove('drop-target');
            }
        });

        this.element.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetSquare = e.target.closest('.chess-square');
            
            if (targetSquare && this.draggedPiece) {
                const fromRow = parseInt(this.draggedPiece.dataset.row);
                const fromCol = parseInt(this.draggedPiece.dataset.col);
                const toRow = parseInt(targetSquare.dataset.row);
                const toCol = parseInt(targetSquare.dataset.col);
                
                this.chessBoard.selectSquare(fromRow, fromCol);
                this.chessBoard.selectSquare(toRow, toCol);
            }
            
            // Temizlik
            document.querySelectorAll('.drop-target').forEach(sq => {
                sq.classList.remove('drop-target');
            });
        });
    }

    // Tahta Temizle
    clearHighlights() {
        document.querySelectorAll('.chess-square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'attack-move', 'last-move', 'hint-from', 'hint-to');
        });
    }

    // Kare Vurgula
    highlightSquare(row, col, className) {
        const square = this.getSquareElement(row, col);
        if (square) {
            square.classList.add(className);
        }
    }

    // Kare Elementini Al
    getSquareElement(row, col) {
        return this.element.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    // Hamle Animasyonu
    animateMove(fromRow, fromCol, toRow, toCol) {
        const fromSquare = this.getSquareElement(fromRow, fromCol);
        const toSquare = this.getSquareElement(toRow, toCol);
        
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

    // Tahta Boyutunu Ayarla
    resize() {
        // Responsive boyutlandırma
        const containerWidth = this.element.parentElement.clientWidth;
        const squareSize = Math.min(containerWidth / 8, 60);
        
        this.element.style.gridTemplateColumns = `repeat(8, ${squareSize}px)`;
        this.element.style.gridTemplateRows = `repeat(8, ${squareSize}px)`;
    }

    // Touch Desteği
    setupTouchSupport() {
        let touchStartSquare = null;
        
        this.element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const square = e.target.closest('.chess-square');
            if (square) {
                touchStartSquare = square;
                square.classList.add('touch-active');
            }
        });

        this.element.addEventListener('touchend', (e) => {
            e.preventDefault();
            const square = e.target.closest('.chess-square');
            
            if (touchStartSquare) {
                touchStartSquare.classList.remove('touch-active');
                
                if (square && square !== touchStartSquare) {
                    // Hamle yap
                    const fromRow = parseInt(touchStartSquare.dataset.row);
                    const fromCol = parseInt(touchStartSquare.dataset.col);
                    const toRow = parseInt(square.dataset.row);
                    const toCol = parseInt(square.dataset.col);
                    
                    this.chessBoard.selectSquare(fromRow, fromCol);
                    this.chessBoard.selectSquare(toRow, toCol);
                } else if (square) {
                    // Kare seç
                    const row = parseInt(square.dataset.row);
                    const col = parseInt(square.dataset.col);
                    this.chessBoard.selectSquare(row, col);
                }
                
                touchStartSquare = null;
            }
        });
    }

    // Temizlik
    destroy() {
        // Event listener'ları temizle
        this.element.removeEventListener('dragstart', this.dragStartHandler);
        this.element.removeEventListener('dragend', this.dragEndHandler);
        this.element.removeEventListener('dragover', this.dragOverHandler);
        this.element.removeEventListener('dragleave', this.dragLeaveHandler);
        this.element.removeEventListener('drop', this.dropHandler);
    }
}