// GameStatus.js - Oyun Durumu Bileşeni

class GameStatusComponent {
    constructor() {
        this.statusElement = document.getElementById('game-status');
        this.turnElement = document.getElementById('turn-indicator');
        this.timeElement = document.getElementById('game-time');
        this.moveCountElement = document.getElementById('move-count');
        this.capturedWhiteElement = document.getElementById('captured-white');
        this.capturedBlackElement = document.getElementById('captured-black');
        
        this.gameTimer = null;
        this.startTime = Date.now();
        this.animations = [];
        
        this.init();
    }

    // Başlatma
    init() {
        this.startGameTimer();
        this.setupStatusAnimations();
    }

    // Oyun Durumunu Güncelle
    updateStatus(gameStatus, currentPlayer, isInCheck = false) {
        let statusText = '';
        let statusClass = 'status-playing';
        
        switch (gameStatus) {
            case GAME_STATUS.PLAYING:
                if (isInCheck) {
                    const checkColor = currentPlayer === COLORS.WHITE ? 'Beyaz' : 'Siyah';
                    statusText = `🚨 ${checkColor} Şahta!`;
                    statusClass = 'status-check';
                } else {
                    statusText = '🎮 Oyun Devam Ediyor';
                    statusClass = 'status-playing';
                }
                break;
                
            case GAME_STATUS.CHECK:
                const checkColor = currentPlayer === COLORS.WHITE ? 'Beyaz' : 'Siyah';
                statusText = `⚠️ ${checkColor} Şahta!`;
                statusClass = 'status-check';
                break;
                
            case GAME_STATUS.CHECKMATE:
                const winner = currentPlayer === COLORS.WHITE ? 'Siyah' : 'Beyaz';
                statusText = `👑 Şah Mat! ${winner} Kazandı!`;
                statusClass = 'status-checkmate';
                this.celebrateWin(winner);
                break;
                
            case GAME_STATUS.STALEMATE:
                statusText = '🤝 Pat! Oyun Berabere!';
                statusClass = 'status-stalemate';
                this.showDrawAnimation();
                break;
                
            case GAME_STATUS.DRAW:
                statusText = '🤝 Berabere!';
                statusClass = 'status-draw';
                this.showDrawAnimation();
                break;
                
            default:
                statusText = '❓ Bilinmeyen Durum';
                statusClass = 'status-unknown';
        }
        
        if (this.statusElement) {
            this.statusElement.textContent = statusText;
            this.statusElement.className = `status-display ${statusClass}`;
            
            // Animasyon ekle
            this.animateStatusChange(statusClass);
        }
    }

    // Sıra Göstergesini Güncelle
    updateTurn(currentPlayer) {
        if (!this.turnElement) return;
        
        const playerText = currentPlayer === COLORS.WHITE ? 'Beyaz' : 'Siyah';
        const playerIcon = currentPlayer === COLORS.WHITE ? '⚪' : '⚫';
        
        this.turnElement.innerHTML = `${playerIcon} Sıra: <strong>${playerText}</strong>`;
        this.turnElement.className = `turn-indicator turn-${currentPlayer}`;
        
        // Sıra değişim animasyonu
        this.animateTurnChange();
    }

    // Oyun Süresini Güncelle
    updateTime(seconds) {
        if (this.timeElement) {
            this.timeElement.textContent = formatTime(seconds);
        }
    }

    // Hamle Sayısını Güncelle
    updateMoveCount(count) {
        if (this.moveCountElement) {
            this.moveCountElement.textContent = count.toString();
            
            // Hamle sayısı animasyonu
            this.animateCounter(this.moveCountElement);
        }
    }

    // Ele Alınan Taşları Güncelle
    updateCapturedPieces(capturedPieces) {
        this.updateCapturedGroup(this.capturedWhiteElement, capturedPieces.white, 'white');
        this.updateCapturedGroup(this.capturedBlackElement, capturedPieces.black, 'black');
    }

    // Ele Alınan Taş Grubunu Güncelle
    updateCapturedGroup(element, pieces, color) {
        if (!element) return;
        
        element.innerHTML = '';
        
        // Taş değerine göre sırala
        const sortedPieces = pieces.sort((a, b) => {
            const aValue = PIECE_VALUES[getPieceType(a)] || 0;
            const bValue = PIECE_VALUES[getPieceType(b)] || 0;
            return bValue - aValue;
        });
        
        sortedPieces.forEach((piece, index) => {
            const pieceElement = document.createElement('span');
            pieceElement.className = `captured-piece ${color}-piece`;
            pieceElement.textContent = PIECE_SYMBOLS[piece].symbol;
            pieceElement.title = `${getPieceType(piece)} (${PIECE_VALUES[getPieceType(piece)]} puan)`;
            
            // Animasyonlu ekleme
            setTimeout(() => {
                pieceElement.classList.add('fade-in');
                element.appendChild(pieceElement);
            }, index * 100);
        });
        
        // Toplam değeri göster
        const totalValue = sortedPieces.reduce((sum, piece) => {
            return sum + (PIECE_VALUES[getPieceType(piece)] || 0);
        }, 0);
        
        if (totalValue > 0) {
            const valueElement = document.createElement('span');
            valueElement.className = 'captured-total';
            valueElement.textContent = `(+${totalValue})`;
            element.appendChild(valueElement);
        }
    }

    // AI Düşünme Göstergesi
    showAIThinking(show = true) {
        let indicator = document.querySelector('.ai-thinking');
        
        if (show && !indicator) {
            indicator = document.createElement('div');
            indicator.className = 'ai-thinking';
            indicator.innerHTML = `
                <div class="thinking-content">
                    <div class="thinking-spinner"></div>
                    <span class="thinking-text">AI Düşünüyor</span>
                    <div class="thinking-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            
            document.querySelector('.game-status').appendChild(indicator);
            
            // Animasyonla göster
            setTimeout(() => indicator.classList.add('show'), 50);
        } else if (!show && indicator) {
            indicator.classList.remove('show');
            setTimeout(() => indicator.remove(), 300);
        }
    }

    // Oyun Zamanlayıcısını Başlat
    startGameTimer() {
        this.gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTime(elapsed);
        }, 1000);
    }

    // Zamanlayıcıyı Durdur
    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    // Zamanlayıcıyı Yeniden Başlat
    resetGameTimer() {
        this.stopGameTimer();
        this.startTime = Date.now();
        this.startGameTimer();
    }

    // Durum Değişim Animasyonu
    animateStatusChange(statusClass) {
        if (!this.statusElement) return;
        
        this.statusElement.classList.add('status-change');
        
        setTimeout(() => {
            this.statusElement.classList.remove('status-change');
        }, 500);
        
        // Özel animasyonlar
        if (statusClass === 'status-check') {
            this.pulseAnimation(this.statusElement, 'pulse-red');
        } else if (statusClass === 'status-checkmate') {
            this.pulseAnimation(this.statusElement, 'pulse-gold');
        }
    }

    // Sıra Değişim Animasyonu
    animateTurnChange() {
        if (!this.turnElement) return;
        
        this.turnElement.classList.add('turn-change');
        
        setTimeout(() => {
            this.turnElement.classList.remove('turn-change');
        }, 300);
    }

    // Sayaç Animasyonu
    animateCounter(element) {
        if (!element) return;
        
        element.classList.add('counter-update');
        
        setTimeout(() => {
            element.classList.remove('counter-update');
        }, 400);
    }

    // Pulse Animasyonu
    pulseAnimation(element, className) {
        element.classList.add(className);
        
        setTimeout(() => {
            element.classList.remove(className);
        }, 1000);
    }

    // Kazanma Kutlaması
    celebrateWin(winner) {
        this.createCelebrationEffect();
        
        // Konfeti efekti
        setTimeout(() => {
            this.showConfetti();
        }, 500);
        
        // Ses efekti
        playSound('GAME_END');
    }

    // Beraberlik Animasyonu
    showDrawAnimation() {
        const drawEffect = document.createElement('div');
        drawEffect.className = 'draw-effect';
        drawEffect.textContent = '🤝';
        
        document.body.appendChild(drawEffect);
        
        setTimeout(() => {
            drawEffect.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            drawEffect.remove();
        }, 2000);
    }

    // Kutlama Efekti Oluştur
    createCelebrationEffect() {
        const celebration = document.createElement('div');
        celebration.className = 'celebration-overlay';
        celebration.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-crown">👑</div>
                <div class="celebration-text">Tebrikler!</div>
                <div class="celebration-sparkles">
                    <span>✨</span><span>🎉</span><span>✨</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            celebration.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            celebration.remove();
        }, 4000);
    }

    // Konfeti Göster
    showConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
            }, i * 50);
        }
    }

    // Konfeti Parçası Oluştur
    createConfettiPiece(color) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.backgroundColor = color;
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }

    // Oyun Sonu Modal Göster
    showGameEndModal(gameStatus, currentPlayer, gameStats) {
        let title = '';
        let message = '';
        let icon = '';
        
        switch (gameStatus) {
            case GAME_STATUS.CHECKMATE:
                const winner = currentPlayer === COLORS.WHITE ? 'Siyah' : 'Beyaz';
                title = 'Oyun Bitti!';
                message = `${winner} kazandı! Şah mat!`;
                icon = '👑';
                break;
            case GAME_STATUS.STALEMATE:
                title = 'Pat Durumu!';
                message = 'Hiç geçerli hamle kalmadı. Oyun berabere!';
                icon = '🤝';
                break;
            case GAME_STATUS.DRAW:
                title = 'Beraberlik!';
                message = 'Oyun berabere bitti.';
                icon = '🤝';
                break;
        }
        
        const modal = document.createElement('div');
        modal.className = 'game-end-modal';
        modal.innerHTML = `
            <div class="modal-content game-end-content">
                <div class="game-end-icon">${icon}</div>
                <h2 class="game-end-title">${title}</h2>
                <p class="game-end-message">${message}</p>
                
                <div class="game-stats">
                    <div class="stat-item">
                        <span class="stat-label">Süre:</span>
                        <span class="stat-value">${formatTime(gameStats.duration)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Hamleler:</span>
                        <span class="stat-value">${gameStats.moves}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Değerlendirme:</span>
                        <span class="stat-value">${gameStats.evaluation > 0 ? '+' : ''}${gameStats.evaluation.toFixed(1)}</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button id="new-game-modal" class="btn btn-primary">
                        <span class="btn-icon">🆕</span>
                        Yeni Oyun
                    </button>
                    <button id="review-game" class="btn btn-secondary">
                        <span class="btn-icon">📊</span>
                        Oyunu İncele
                    </button>
                    <button id="close-modal" class="btn btn-secondary">
                        <span class="btn-icon">❌</span>
                        Kapat
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Modal animasyonu
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
        
        // Event listener'lar
        this.setupModalEvents(modal, gameStats);
    }

    // Modal Event'lerini Kur
    setupModalEvents(modal, gameStats) {
        // Yeni oyun
        document.getElementById('new-game-modal')?.addEventListener('click', () => {
            modal.remove();
            window.chessApp.newGame();
        });
        
        // Oyunu incele
        document.getElementById('review-game')?.addEventListener('click', () => {
            modal.remove();
            this.showGameReview(gameStats);
        });
        
        // Kapat
        document.getElementById('close-modal')?.addEventListener('click', () => {
            modal.remove();
        });
        
        // Modal dışına tıklama
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // ESC tuşu
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // Oyun İnceleme Modal
    showGameReview(gameStats) {
        const modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="modal-content review-content">
                <h3>📊 Oyun İncelemesi</h3>
                
                <div class="review-tabs">
                    <button class="tab-btn active" data-tab="stats">İstatistikler</button>
                    <button class="tab-btn" data-tab="moves">Hamleler</button>
                    <button class="tab-btn" data-tab="analysis">Analiz</button>
                </div>
                
                <div class="review-content-area">
                    <div class="tab-content active" id="stats-tab">
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-number">${gameStats.moves}</div>
                                <div class="stat-label">Toplam Hamle</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${formatTime(gameStats.duration)}</div>
                                <div class="stat-label">Oyun Süresi</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${gameStats.evaluation.toFixed(1)}</div>
                                <div class="stat-label">Son Değerlendirme</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${Math.round(gameStats.moves / (gameStats.duration / 60))}</div>
                                <div class="stat-label">Dakika/Hamle</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="moves-tab">
                        <div class="moves-review">
                            <div class="pgn-display">${gameStats.pgn || 'PGN mevcut değil'}</div>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="analysis-tab">
                        <div class="analysis-summary">
                            <p>Oyun analizi özelliği geliştirme aşamasında...</p>
                            <div class="feature-preview">
                                <span class="preview-item">🎯 Hamle doğruluğu</span>
                                <span class="preview-item">🔍 Kritik anlar</span>
                                <span class="preview-item">📈 Değerlendirme grafiği</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button id="download-pgn" class="btn btn-info">📁 PGN İndir</button>
                    <button id="close-review" class="btn btn-secondary">Kapat</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Tab switching
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Aktif tab'i değiştir
                modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                modal.querySelector(`#${btn.dataset.tab}-tab`).classList.add('active');
            });
        });
        
        // PGN indirme
        document.getElementById('download-pgn')?.addEventListener('click', () => {
            this.downloadPGN(gameStats.pgn);
        });
        
        // Kapatma
        document.getElementById('close-review')?.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // PGN İndirme
    downloadPGN(pgn) {
        if (!pgn) return;
        
        const blob = new Blob([pgn], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chess-game-${new Date().toISOString().split('T')[0]}.pgn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('PGN dosyası indirildi!', 'success');
    }

    // Durum Animasyonlarını Kur
    setupStatusAnimations() {
        // CSS animasyonları için gerekli stilleri ekle
        if (!document.querySelector('#status-animations')) {
            const style = document.createElement('style');
            style.id = 'status-animations';
            style.textContent = `
                .status-change {
                    transform: scale(1.05);
                    transition: all 0.3s ease;
                }
                
                .turn-change {
                    transform: translateX(5px);
                    transition: all 0.3s ease;
                }
                
                .counter-update {
                    color: #e74c3c;
                    transform: scale(1.2);
                    transition: all 0.4s ease;
                }
                
                .pulse-red {
                    animation: pulseRed 1s ease-in-out;
                }
                
                .pulse-gold {
                    animation: pulseGold 1s ease-in-out;
                }
                
                .fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                
                @keyframes pulseRed {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
                    50% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
                }
                
                @keyframes pulseGold {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
                    50% { box-shadow: 0 0 0 15px rgba(255, 215, 0, 0); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Bildirim Göster
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Temizlik
    destroy() {
        this.stopGameTimer();
        this.animations.forEach(animation => {
            if (animation.cancel) animation.cancel();
        });
        this.animations = [];
    }
}