// GameControls.js - Oyun Kontrolleri

class GameControlsComponent {
    constructor(chessApp) {
        this.app = chessApp;
        this.isAIThinking = false;
        this.setupControls();
        this.setupKeyboardShortcuts();
    }

    // Kontrolleri Kur
    setupControls() {
        // Yeni oyun butonu
        this.setupButton('new-game', () => {
            this.confirmAction('Yeni oyun başlatmak istediğinizden emin misiniz?', () => {
                this.app.newGame();
                this.showNotification('Yeni oyun başlatıldı!', 'success');
            });
        });

        // Geri alma butonu
        this.setupButton('undo-move', () => {
            if (this.app.chessBoard.moveHistory.length === 0) {
                this.showNotification('Geri alınacak hamle yok!', 'warning');
                return;
            }
            
            if (this.isAIThinking) {
                this.showNotification('AI düşünürken geri alamazsınız!', 'warning');
                return;
            }

            const success = this.app.undoMove();
            if (success) {
                this.showNotification('Hamle geri alındı', 'info');
            } else {
                this.showNotification('Hamle geri alınamadı!', 'error');
            }
        });


        // Zorluk seviyesi
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                const level = parseInt(e.target.value);
                this.app.ai.setDifficulty(level);
                const levelName = AI_LEVELS[level].name;
                this.showNotification(`Zorluk seviyesi: ${levelName}`, 'info');
            });
        }

        // Oyun analizi butonu (opsiyonel)
        this.createAnalysisButton();
        
        // Pozisyon kaydetme butonu
        this.createSavePositionButton();
        
        // Pozisyon yükleme butonu
        this.createLoadPositionButton();
    }

    // Buton Kurulumu
    setupButton(id, handler) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', handler);
        }
    }

    // Klavye Kısayolları
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl tuşu kombinasyonları
            if (e.ctrlKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        document.getElementById('new-game')?.click();
                        break;
                    case 'z':
                        e.preventDefault();
                        document.getElementById('undo-move')?.click();
                        break;
                    case 'h':
                        e.preventDefault();
                        document.getElementById('hint')?.click();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveGameState();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.loadGameState();
                        break;
                }
            }
            
            // Tek tuş kısayolları
            switch (e.key) {
                case 'Escape':
                    this.app.chessBoard.clearSelection();
                    this.app.updateDisplay();
                    break;
                case 'f':
                case 'F':
                    this.toggleFullscreen();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    const level = parseInt(e.key);
                    document.getElementById('difficulty').value = level;
                    document.getElementById('difficulty').dispatchEvent(new Event('change'));
                    break;
            }
        });
    }

    // Analiz Butonu Oluştur
    createAnalysisButton() {
        const controlGroup = document.querySelector('.control-group');
        if (controlGroup) {
            const analysisBtn = document.createElement('button');
            analysisBtn.id = 'analyze-position';
            analysisBtn.className = 'btn btn-info';
            analysisBtn.textContent = 'Pozisyon Analizi';
            
            analysisBtn.addEventListener('click', async () => {
                this.setButtonLoading('analyze-position', true);
                
                try {
                    const analysis = await this.analyzeCurrentPosition();
                    this.showAnalysisResults(analysis);
                } catch (error) {
                    this.showNotification('Analiz yapılamadı!', 'error');
                } finally {
                    this.setButtonLoading('analyze-position', false);
                }
            });
            
            controlGroup.appendChild(analysisBtn);
        }
    }

    // Pozisyon Kaydetme Butonu
    createSavePositionButton() {
        const controlGroup = document.querySelector('.control-group');
        if (controlGroup) {
            const saveBtn = document.createElement('button');
            saveBtn.id = 'save-position';
            saveBtn.className = 'btn btn-secondary';
            saveBtn.textContent = 'Pozisyon Kaydet';
            
            saveBtn.addEventListener('click', () => {
                this.saveGameState();
            });
            
            controlGroup.appendChild(saveBtn);
        }
    }

    // Pozisyon Yükleme Butonu
    createLoadPositionButton() {
        const controlGroup = document.querySelector('.control-group');
        if (controlGroup) {
            const loadBtn = document.createElement('button');
            loadBtn.id = 'load-position';
            loadBtn.className = 'btn btn-secondary';
            loadBtn.textContent = 'Pozisyon Yükle';
            
            loadBtn.addEventListener('click', () => {
                this.loadGameState();
            });
            
            controlGroup.appendChild(loadBtn);
        }
    }

    // Buton Durumunu Ayarla
    enableButton(id, enabled = true) {
        const button = document.getElementById(id);
        if (button) {
            button.disabled = !enabled;
            if (enabled) {
                button.classList.remove('disabled');
            } else {
                button.classList.add('disabled');
            }
        }
    }

    // Buton Yüklenme Durumu
    setButtonLoading(id, loading = true) {
        const button = document.getElementById(id);
        if (button) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
                button.dataset.originalText = button.textContent;
                button.textContent = 'Yükleniyor...';
            } else {
                button.classList.remove('loading');
                button.disabled = false;
                if (button.dataset.originalText) {
                    button.textContent = button.dataset.originalText;
                }
            }
        }
    }

    // AI Düşünme Durumunu Ayarla
    setAIThinking(thinking) {
        this.isAIThinking = thinking;
        
        // Butonları devre dışı bırak
        this.enableButton('undo-move', !thinking);
        this.enableButton('hint', !thinking);
        this.enableButton('new-game', !thinking);
        
        // Zorluk seçimini devre dışı bırak
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.disabled = thinking;
        }
    }

    // Onay Penceresi
    confirmAction(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }

    // Bildirim Göster
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Bildirim sayacı varsa temizle
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        document.body.appendChild(notification);
        
        // Animasyon
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Otomatik temizleme
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        // Tıklama ile kapatma
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // Oyun Durumunu Kaydet
    saveGameState() {
        try {
            const gameState = {
                fen: this.app.chessBoard.toFEN(),
                pgn: this.app.chessBoard.moveHistory.toPGN(),
                timestamp: Date.now(),
                difficulty: this.app.ai.difficulty
            };
            
            localStorage.setItem('chessGameState', JSON.stringify(gameState));
            this.showNotification('Oyun kaydedildi!', 'success');
        } catch (error) {
            this.showNotification('Kaydetme başarısız!', 'error');
        }
    }

    // Oyun Durumunu Yükle
    loadGameState() {
        try {
            const savedState = localStorage.getItem('chessGameState');
            if (!savedState) {
                this.showNotification('Kaydedilmiş oyun bulunamadı!', 'warning');
                return;
            }
            
            const gameState = JSON.parse(savedState);
            this.confirmAction('Kaydedilmiş oyunu yüklemek istediğinizden emin misiniz?', () => {
                // FEN'den pozisyonu yükle (basitleştirilmiş)
                this.app.newGame();
                this.app.ai.setDifficulty(gameState.difficulty || 3);
                document.getElementById('difficulty').value = gameState.difficulty || 3;
                
                this.showNotification('Oyun yüklendi!', 'success');
            });
        } catch (error) {
            this.showNotification('Yükleme başarısız!', 'error');
        }
    }

    // Pozisyon Analizi
    async analyzeCurrentPosition() {
        const game = new ChessGame();
        game.board = this.app.chessBoard;
        game.gameState = this.app.chessBoard.gameState;
        
        return game.analyzePosition(3);
    }

    // Analiz Sonuçlarını Göster
    showAnalysisResults(analysis) {
        const modal = document.createElement('div');
        modal.className = 'analysis-modal';
        modal.innerHTML = `
            <div class="modal-content analysis-content">
                <h3>Pozisyon Analizi</h3>
                <div class="analysis-details">
                    <div class="analysis-item">
                        <strong>Değerlendirme:</strong> 
                        ${analysis.evaluation > 0 ? '+' : ''}${analysis.evaluation.toFixed(2)}
                    </div>
                    <div class="analysis-item">
                        <strong>En İyi Hamle:</strong> 
                        ${analysis.bestMove ? analysis.bestMove.notation || 'Hesaplanıyor...' : 'Bulunamadı'}
                    </div>
                    <div class="analysis-item">
                        <strong>Oyun Aşaması:</strong> 
                        ${analysis.isEndgame ? 'Son Oyun' : analysis.openingPhase ? 'Açılış' : 'Orta Oyun'}
                    </div>
                    <div class="analysis-item">
                        <strong>Tehdit Altındaki Taşlar:</strong> 
                        ${analysis.threatenedPieces.length}
                    </div>
                    <div class="analysis-item">
                        <strong>Taktiksel Fırsatlar:</strong> 
                        ${analysis.tacticalMoves.length}
                    </div>
                </div>
                <button id="close-analysis" class="btn btn-primary">Kapat</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Kapatma eventi
        document.getElementById('close-analysis').addEventListener('click', () => {
            modal.remove();
        });
        
        // Dışarı tıklama ile kapatma
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Tam Ekran Geçişi
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                this.showNotification('Tam ekran desteklenmiyor!', 'warning');
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Temizlik
    destroy() {
        // Event listener'ları temizle
        document.removeEventListener('keydown', this.keydownHandler);
    }
}