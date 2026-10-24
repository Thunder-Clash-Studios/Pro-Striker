// ===== PRO STRIKER - globals.js =====
console.log('[ProStriker] globals.js loaded');

const TOURNAMENT_STATES = {
    MENU: 'TOURNAMENT_MENU',
    TEAM_SELECT: 'TOURNAMENT_TEAM_SELECT',
    GROUP_DRAW: 'TOURNAMENT_GROUP_DRAW',
    GROUP_STAGE: 'TOURNAMENT_GROUP_STAGE',
    MATCH_PREVIEW: 'TOURNAMENT_MATCH_PREVIEW',
    MATCH_RESULT: 'TOURNAMENT_MATCH_RESULT',
    KNOCKOUT_BRACKET: 'TOURNAMENT_BRACKET',
    CHAMPION: 'TOURNAMENT_CHAMPION'
};

let tournamentMode = false;
let tournamentState = 'TOURNAMENT_MENU';
let tournamentFormat = 32;
let tournamentSelectedTeam = null;
let tournamentPendingMatch = null;
let currentMatchTeamAId = null;
let currentMatchTeamBId = null;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== HI-DPI CANVAS SETUP =====
// The whole game is coded against a fixed 900x600 logical coordinate space
// (physics, hit-testing, UI layout all assume this). On Retina/high-DPI
// screens, if the canvas *pixel buffer* is only 900x600 but gets stretched
// across more physical screen pixels, the browser has to upscale it and
// everything looks soft/blurry. To fix that WITHOUT touching any gameplay
// math, we keep GAME_W/GAME_H as the logical size every script should keep
// using, but size the actual canvas backing store to 900*dpr x 600*dpr and
// scale the drawing context back down — so every existing draw call using
// 900x600 coordinates still lands in exactly the same place, just rendered
// at native sharpness.
const GAME_W = 900;
const GAME_H = 600;

function setupHiDPICanvas() {
    // PERF: capping devicePixelRatio at 3 meant a phone reporting DPR 3
    // (very common on mid-range Android) got a 2700x1800 backing store for
    // a game whose entire logical space is 900x600 — 9x the pixels to
    // shade, fill, and blur every frame versus a DPR-1 device, on hardware
    // that's usually also the weakest in the room. Sharper edges aren't
    // worth tanking the frame rate on exactly the devices least able to
    // afford it, so this scales the cap down on smaller/likely-mobile
    // viewports: full quality up to DPR 2 (crisp enough for virtually any
    // screen), capped at 1.5 beyond that. Desktop/tablet-sized viewports
    // are unaffected.
    const rawDpr = window.devicePixelRatio || 1;
    const isSmallViewport = Math.min(window.innerWidth, window.innerHeight) < 500;
    const dprCap = isSmallViewport ? 1.5 : 2;
    const dpr = Math.min(rawDpr, dprCap);
    canvas.width = Math.round(GAME_W * dpr);
    canvas.height = Math.round(GAME_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
}
setupHiDPICanvas();
window.addEventListener('resize', setupHiDPICanvas);
window.addEventListener('orientationchange', () => setTimeout(setupHiDPICanvas, 100));
const touchControlsElem = document.getElementById('touchControls');
const gameWrapperElem = document.getElementById('gameWrapper');
const goalFlashElem = document.getElementById('goalFlash');
const celebrationOverlay = document.getElementById('celebrationOverlay');

const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

let currentState = 'MENU';
let gameMode = '1v1';
let difficulty = 'EASY';
let score = { red: 0, blue: 0 };
let halfDuration = 45;
let matchClock = halfDuration;
let currentHalf = 1;
let matchState = 'PLAY';
let halftimeTimer = 0;
const HALFTIME_BREAK = 3;
let kickoffTeam = 'red';
let nextKickoffTeam = null;
let kickoffDelay = 0.5;

let matchStats = {
    possession: { red: 0, blue: 0 },
    shots: { red: 0, blue: 0 },
    passes: { red: 0, blue: 0 },
    tackles: { red: 0, blue: 0 },
    possessionTimer: { red: 0, blue: 0 },
    gkSaves: { red: 0, blue: 0 },
    winStreak: 0,
    totalMatches: 0
};

let overallStats = {
    EASY:        { matches: 0, goalsScored: 0, goalsConceded: 0, bestWinDiff: -Infinity, bestWinScore: '---', bestWinGoals: 0, worstDefeatDiff: Infinity, worstDefeatScore: '---', worstDefeatGoalsConceded: 0, possessionTotal: 0, passesTotal: 0, gkSavesTotal: 0 },
    MEDIUM:      { matches: 0, goalsScored: 0, goalsConceded: 0, bestWinDiff: -Infinity, bestWinScore: '---', bestWinGoals: 0, worstDefeatDiff: Infinity, worstDefeatScore: '---', worstDefeatGoalsConceded: 0, possessionTotal: 0, passesTotal: 0, gkSavesTotal: 0 },
    HARD:        { matches: 0, goalsScored: 0, goalsConceded: 0, bestWinDiff: -Infinity, bestWinScore: '---', bestWinGoals: 0, worstDefeatDiff: Infinity, worstDefeatScore: '---', worstDefeatGoalsConceded: 0, possessionTotal: 0, passesTotal: 0, gkSavesTotal: 0 },
    ELITE:       { matches: 0, goalsScored: 0, goalsConceded: 0, bestWinDiff: -Infinity, bestWinScore: '---', bestWinGoals: 0, worstDefeatDiff: Infinity, worstDefeatScore: '---', worstDefeatGoalsConceded: 0, possessionTotal: 0, passesTotal: 0, gkSavesTotal: 0 },
    WORLD_CLASS: { matches: 0, goalsScored: 0, goalsConceded: 0, bestWinDiff: -Infinity, bestWinScore: '---', bestWinGoals: 0, worstDefeatDiff: Infinity, worstDefeatScore: '---', worstDefeatGoalsConceded: 0, possessionTotal: 0, passesTotal: 0, gkSavesTotal: 0 }
};

let currentRank = 'Bronze';
const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
let rankPoints = 0;

let ball = {
    x: 450, y: 300, radius: 9,
    vx: 0, vy: 0,
    owner: null,
    speed: 13,
    cooldownPlayer: null,
    cooldownTimer: 0,
    trail: []
};

let players = [];
let arrowAngle = 0;
let gkSpeed = 2.5;
let gkDirection = { red: 1, blue: -1 };
let goalBannerTimer = 0;
let lastScorer = '';
// Team object for whoever just scored, when known (tournament mode only) —
// lets the GOAL! banner draw a real flag image via drawTeamFlag() instead
// of baking an emoji into the lastScorer string (which showed as raw
// two-letter codes like "BR"/"ES" wherever the emoji glyph wasn't
// supported). null for non-tournament matches (RED/BLUE have no flag).
let lastScorerTeam = null;
let particles = [];
let celebrationParticles = [];
let screenShake = { duration: 0, intensity: 0, x: 0, y: 0 };
let goalZoomScale = 1.0;

let menuBgParticles = [];
for (let i = 0; i < 40; i++) {
    menuBgParticles.push({
        x: Math.random() * 900,
        y: Math.random() * 600,
        radius: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        alpha: Math.random() * 0.5 + 0.2
    });
}

let aiTimer = 0;
let aiReactionTimer = 20;
let aiStartDelay = 60;
let aiDribbleTime = 0;
let aiPassCooldown = 0;
let gkTimer = 0;
let aiState = 'CHASE';
let aiStateTimer = 0;
let aiHoldBallTimer = 0;
let aiTargetOffset = { x: 0, y: 0 };
let aiTargetX = 0;
let aiTargetY = 0;
let isAIDecisive = false;
let aiCommitTimer = 0;
let activeLocks = {
    red: { player: null, timer: 0 },
    blue: { player: null, timer: 0 }
};

const posts = [
    { x: 25, y: 200, radius: 7 },
    { x: 25, y: 400, radius: 7 },
    { x: 875, y: 200, radius: 7 },
    { x: 875, y: 400, radius: 7 }
];

let pauseButton = { x: 860, y: 15, width: 30, height: 30, hover: false };
const keys = {
    w: false, a: false, s: false, d: false, space: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, enter: false,
    p: false, Escape: false, Shift: false, ShiftL: false, ShiftR: false
};

let isDraggingSlider = false;

// ===== STATS PERSISTENCE (localStorage) =====
// overallStats/rankPoints/currentRank are plain in-memory variables above —
// without this they reset to zero on every page reload. bestWinDiff/
// worstDefeatDiff default to -Infinity/Infinity, which JSON.stringify turns
// into null, so a replacer/reviver pair round-trips those two specifically
// rather than letting them silently break the record-comparison logic in
// updateOverallStats() after a reload.
const STATS_SAVE_KEY = 'prostriker_stats_v1';

function saveStats() {
    try {
        const replacer = (k, v) => (v === Infinity) ? '__Infinity__' : (v === -Infinity) ? '__-Infinity__' : v;
        CloudSync.setItem(STATS_SAVE_KEY, JSON.stringify({ overallStats, rankPoints, currentRank }, replacer));
    } catch (e) {
        console.debug('[ProStriker] Could not save stats:', e);
    }
}

function loadStats() {
    try {
        const raw = CloudSync.getItem(STATS_SAVE_KEY);
        if (!raw) return;
        const reviver = (k, v) => (v === '__Infinity__') ? Infinity : (v === '__-Infinity__') ? -Infinity : v;
        const data = JSON.parse(raw, reviver);
        if (data.overallStats) {
            for (const diff in overallStats) {
                if (data.overallStats[diff]) Object.assign(overallStats[diff], data.overallStats[diff]);
            }
        }
        if (typeof data.rankPoints === 'number') rankPoints = data.rankPoints;
        if (typeof data.currentRank === 'string') currentRank = data.currentRank;
    } catch (e) {
        console.debug('[ProStriker] Could not load saved stats:', e);
    }
}
loadStats();

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'undefined') r = 6;
        if (typeof r === 'number') r = {tl: r, tr: r, br: r, bl: r};
        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
    };
}

// ===== FOOTBALL ICON (real artwork, drawn instead of the procedural ball
// wherever it has finished loading; the procedural sprite in shop.js is the
// safety net if this ever fails to load, so the ball can never be blank) =====
const FootballImg = new Image();
let footballImgReady = false;
FootballImg.onload = () => { footballImgReady = true; };
FootballImg.onerror = () => { footballImgReady = false; console.warn('[Assets] images/football.png failed to load - using the procedural ball instead.'); };
FootballImg.src = 'images/football.png';
