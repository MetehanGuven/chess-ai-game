// Satranç Oyunu Sabitleri - constants.js

// Taş Tipleri
const PIECE_TYPES = {
    PAWN: 'pawn',
    ROOK: 'rook',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    QUEEN: 'queen',
    KING: 'king'
};

// Oyuncu Renkleri
const COLORS = {
    WHITE: 'white',
    BLACK: 'black'
};

// Taş Değerleri (AI için)
const PIECE_VALUES = {
    [PIECE_TYPES.PAWN]: 1,
    [PIECE_TYPES.KNIGHT]: 3,
    [PIECE_TYPES.BISHOP]: 3,
    [PIECE_TYPES.ROOK]: 5,
    [PIECE_TYPES.QUEEN]: 9,
    [PIECE_TYPES.KING]: 1000
};

// Başlangıç Taş Dizilimi - DÜZELTİLDİ
const INITIAL_BOARD = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// Taş Sembol Haritası
const PIECE_SYMBOLS = {
    // Beyaz Taşlar
    'K': { type: PIECE_TYPES.KING, color: COLORS.WHITE, symbol: '♔' },
    'Q': { type: PIECE_TYPES.QUEEN, color: COLORS.WHITE, symbol: '♕' },
    'R': { type: PIECE_TYPES.ROOK, color: COLORS.WHITE, symbol: '♖' },
    'B': { type: PIECE_TYPES.BISHOP, color: COLORS.WHITE, symbol: '♗' },
    'N': { type: PIECE_TYPES.KNIGHT, color: COLORS.WHITE, symbol: '♘' },
    'P': { type: PIECE_TYPES.PAWN, color: COLORS.WHITE, symbol: '♙' },
    
    // Siyah Taşlar
    'k': { type: PIECE_TYPES.KING, color: COLORS.BLACK, symbol: '♚' },
    'q': { type: PIECE_TYPES.QUEEN, color: COLORS.BLACK, symbol: '♛' },
    'r': { type: PIECE_TYPES.ROOK, color: COLORS.BLACK, symbol: '♜' },
    'b': { type: PIECE_TYPES.BISHOP, color: COLORS.BLACK, symbol: '♝' },
    'n': { type: PIECE_TYPES.KNIGHT, color: COLORS.BLACK, symbol: '♞' },
    'p': { type: PIECE_TYPES.PAWN, color: COLORS.BLACK, symbol: '♟' }
};

// Oyun Durumları
const GAME_STATUS = {
    PLAYING: 'playing',
    CHECK: 'check',
    CHECKMATE: 'checkmate',
    STALEMATE: 'stalemate',
    DRAW: 'draw'
};

// Hamle Tipleri
const MOVE_TYPES = {
    NORMAL: 'normal',
    CAPTURE: 'capture',
    CASTLE_KINGSIDE: 'castle_kingside',
    CASTLE_QUEENSIDE: 'castle_queenside',
    EN_PASSANT: 'en_passant',
    PROMOTION: 'promotion'
};

// Yön Vektörleri
const DIRECTIONS = {
    NORTH: [-1, 0],
    SOUTH: [1, 0],
    EAST: [0, 1],
    WEST: [0, -1],
    NORTHEAST: [-1, 1],
    NORTHWEST: [-1, -1],
    SOUTHEAST: [1, 1],
    SOUTHWEST: [1, -1]
};

// At Hareket Vektörleri
const KNIGHT_MOVES = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
];

// Kral Hareket Vektörleri
const KING_MOVES = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// AI Zorluk Seviyeleri
const AI_LEVELS = {
    1: { depth: 1, name: 'Kolay' },
    2: { depth: 2, name: 'Orta' },
    3: { depth: 3, name: 'Zor' },
    4: { depth: 4, name: 'Uzman' },
    5: { depth: 5, name: 'Usta' }
};

// Pozisyon Değerlendirme Tabloları
const POSITION_VALUES = {
    [PIECE_TYPES.PAWN]: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    
    [PIECE_TYPES.KNIGHT]: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    
    [PIECE_TYPES.BISHOP]: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    
    [PIECE_TYPES.ROOK]: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    
    [PIECE_TYPES.QUEEN]: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    
    [PIECE_TYPES.KING]: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

// Satranç Notasyonu
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Ses Dosyaları
const SOUNDS = {
    MOVE: 'sounds/move.mp3',
    CAPTURE: 'sounds/capture.mp3',
    CHECK: 'sounds/check.mp3',
    CASTLE: 'sounds/castle.mp3',
    GAME_END: 'sounds/game-end.mp3'
};

// Animasyon Süreleri (ms)
const ANIMATION_DURATION = {
    MOVE: 300,
    CAPTURE: 200,
    CHECK: 500,
    PROMOTION: 600
};

// Tahta Boyutları
const BOARD_SIZE = 8;