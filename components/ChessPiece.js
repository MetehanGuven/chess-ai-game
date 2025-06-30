// ChessPiece.js - Taş Bileşeni

class ChessPieceComponent {
    constructor(piece, position) {
        this.piece = piece;
        this.position = position;
        this.element = null;
        this.isDragging = false;
        this.animationQueue = [];
        this.createElement();
    }

    // Taş Elementini Oluştur
    createElement() {
        this.element = document.createElement('div');
        this.element.className = this.getClassNames();
        this.element.draggable = true;
        this.element.textContent = this.getSymbol();
        
        this.setupEventListeners();
        return this.element;
    }

    // CSS Sınıflarını Al
    getClassNames() {
        const pieceInfo = PIECE_SYMBOLS[this.piece];
        if (!pieceInfo) return 'chess-piece';
        
        return `chess-piece ${pieceInfo.color}-piece piece-${pieceInfo.type}`;
    }

    // Taş Sembolünü Al
    getSymbol() {
        const pieceInfo = PIECE_SYMBOLS[this.piece];
        return pieceInfo ? pieceInfo.symbol : '?';
    }

    // Event Listener'ları Kur
    setupEventListeners() {
        // Drag başlangıcı
        this.element.addEventListener('dragstart', (e) => {
            this.isDragging = true;
            this.element.classList.add('dragging');
            
            // Drag verisi
            e.dataTransfer.setData('text/plain', JSON.stringify(this.position));
            e.dataTransfer.effectAllowed = 'move';
        });

        // Drag bitişi
        this.element.addEventListener('dragend', (e) => {
            this.isDragging = false;
            this.element.classList.remove('dragging');
        });

        // Mouse over efekti
        this.element.addEventListener('mouseenter', () => {
            if (!this.isDragging) {
                this.element.classList.add('hover');
            }
        });

        // Mouse leave efekti
        this.element.addEventListener('mouseleave', () => {
            this.element.classList.remove('hover');
        });

        // Touch desteği
        this.element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.element.classList.add('touch-active');
        });

        this.element.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.element.classList.remove('touch-active');
        });
    }

    // Pozisyonu Güncelle
    updatePosition(newPosition) {
        this.position = newPosition;
    }

    // Animasyon Uygula
    animate(animationType, duration = 300) {
        return new Promise((resolve) => {
            this.element.classList.add(animationType);
            
            setTimeout(() => {
                this.element.classList.remove(animationType);
                resolve();
            }, duration);
        });
    }

    // Hamle Animasyonu
    async animateMove(fromSquare, toSquare) {
        const fromRect = fromSquare.getBoundingClientRect();
        const toRect = toSquare.getBoundingClientRect();
        
        const deltaX = toRect.left - fromRect.left;
        const deltaY = toRect.top - fromRect.top;
        
        // CSS transform ile hareket
        this.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        this.element.style.transition = 'transform 0.3s ease-out';
        this.element.style.zIndex = '1000';
        
        // Animasyon tamamlandığında temizle
        setTimeout(() => {
            this.element.style.transform = '';
            this.element.style.transition = '';
            this.element.style.zIndex = '';
        }, 300);
        
        return this.animate('moving', 300);
    }

    // Saldırı Animasyonu
    animateAttack() {
        return this.animate('attacking', 200);
    }

    // Ele Alınma Animasyonu
    animateCapture() {
        return this.animate('captured', 400);
    }

    // Piyon Terfi Animasyonu
    animatePromotion(newPiece) {
        return new Promise((resolve) => {
            this.animate('promoting', 500).then(() => {
                this.piece = newPiece;
                this.element.className = this.getClassNames();
                this.element.textContent = this.getSymbol();
                resolve();
            });
        });
    }

    // Şah Uyarı Animasyonu
    animateCheck() {
        return this.animate('check-warning', 1000);
    }

    // Taşı Vurgula
    highlight(type = 'selected') {
        this.element.classList.add(`highlight-${type}`);
    }

    // Vurgulamayı Kaldır
    removeHighlight() {
        const highlightClasses = Array.from(this.element.classList)
            .filter(cls => cls.startsWith('highlight-'));
        
        highlightClasses.forEach(cls => {
            this.element.classList.remove(cls);
        });
    }

    // Taş Aktif mi?
    setActive(active) {
        if (active) {
            this.element.classList.add('active');
        } else {
            this.element.classList.remove('active');
        }
    }

    // Taş Görünürlüğü
    setVisible(visible) {
        this.element.style.opacity = visible ? '1' : '0';
    }

    // Taşı Yok Et
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    // Taş Bilgilerini Al
    getInfo() {
        const pieceInfo = PIECE_SYMBOLS[this.piece];
        return {
            piece: this.piece,
            type: pieceInfo ? pieceInfo.type : null,
            color: pieceInfo ? pieceInfo.color : null,
            position: this.position,
            value: pieceInfo ? PIECE_VALUES[pieceInfo.type] : 0
        };
    }

    // Taş Kopyala
    clone() {
        return new ChessPieceComponent(this.piece, { ...this.position });
    }

    // Özel Efektler
    addGlowEffect(color = 'gold') {
        this.element.style.filter = `drop-shadow(0 0 10px ${color})`;
        setTimeout(() => {
            this.element.style.filter = '';
        }, 1000);
    }

    // Titreşim Efekti
    shake() {
        this.element.classList.add('shake');
        setTimeout(() => {
            this.element.classList.remove('shake');
        }, 500);
    }

    // Parlama Efekti
    flash(color = 'yellow') {
        const originalBackground = this.element.style.backgroundColor;
        this.element.style.backgroundColor = color;
        this.element.style.transition = 'background-color 0.2s';
        
        setTimeout(() => {
            this.element.style.backgroundColor = originalBackground;
        }, 200);
    }

    // Büyütme Efekti
    emphasize() {
        this.element.classList.add('emphasized');
        setTimeout(() => {
            this.element.classList.remove('emphasized');
        }, 1000);
    }

    // Yavaş Solma
    fadeOut(duration = 500) {
        return new Promise((resolve) => {
            this.element.style.transition = `opacity ${duration}ms ease-out`;
            this.element.style.opacity = '0';
            
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    // Yavaş Belirme
    fadeIn(duration = 500) {
        return new Promise((resolve) => {
            this.element.style.opacity = '0';
            this.element.style.transition = `opacity ${duration}ms ease-in`;
            
            setTimeout(() => {
                this.element.style.opacity = '1';
                setTimeout(() => {
                    this.element.style.transition = '';
                    resolve();
                }, duration);
            }, 10);
        });
    }
}