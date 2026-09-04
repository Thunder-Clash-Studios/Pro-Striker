// ===== PRO STRIKER - ai.js =====
console.log('[ProStriker] ai.js loaded');

// ============================================================
// PERF FIX (mobile FPS / CrazyGames phone preview): getAIConfig() and
// getAIConfigByDifficulty() used to be called unconditionally EVERY FRAME
// from main.js's update(dt) loop (once always, and again during PvE while
// the AI is active) — and every single call built a brand-new config
// object from scratch AND fired two console.log() calls. That's ~120
// console.log calls/sec + 60 object allocations/sec, forever, even sitting
// on the menu. Desktop devtools swallow that for free; CrazyGames' phone/
// QR preview pipes console output over a remote logging bridge that is
// dramatically slower per-call on real mobile hardware, so this alone was
// very likely the majority of the "PC smooth, phone preview laggy" gap.
// Fix: removed the per-call logging entirely, and cache one config object
// per difficulty so repeated calls with the same difficulty are a free
// object-lookup instead of a rebuild.
// ============================================================
const _aiConfigCache = {};

function getAIConfig(difficulty) {
    if (_aiConfigCache[difficulty]) return _aiConfigCache[difficulty];
    const cfg = buildAIConfig(difficulty);
    _aiConfigCache[difficulty] = cfg;
    return cfg;
}

function buildAIConfig(difficulty) {
    if (difficulty === 'EASY') {
        return {
            speedMultiplier: 0.58,
            shootRange: 360,
            panicTimer: 120,
            perfectShotRate: 0.35,
            missError: 0.5,
            passTriggerDist: 70,
            perfectPassRate: 0.50,
            passError: 1.2,
            passCooldown: 140,
            gkHoldTime: 360,
            reactionDelay: 20,
            chaseRate: 0.45,
            retreatRate: 0.45,
            hesitateRate: 0.10,
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 35,
            movementSmoothness: 0.3,
            retreatDistance: 620,
            chaseAggressiveness: 1.0,
            aiStartDelay: 60
        };
    } else if (difficulty === 'MEDIUM') {
        return {
            speedMultiplier: 0.72,
            shootRange: 360,
            panicTimer: 100,
            perfectShotRate: 0.50,
            missError: 0.5,
            passTriggerDist: 100,
            perfectPassRate: 0.60,
            passError: 1.0,
            passCooldown: 110,
            gkHoldTime: 360,
            reactionDelay: 12,
            chaseRate: 0.55,
            retreatRate: 0.35,
            hesitateRate: 0.10,
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 40,
            movementSmoothness: 0.4,
            retreatDistance: 600,
            chaseAggressiveness: 1.2,
            aiStartDelay: 60
        };
    } else if (difficulty === 'HARD') {
        return {
            speedMultiplier: 0.86,
            shootRange: 360,
            panicTimer: 80,
            perfectShotRate: 0.60,
            missError: 0.4,
            passTriggerDist: 130,
            perfectPassRate: 0.70,
            passError: 0.8,
            passCooldown: 80,
            gkHoldTime: 360,
            reactionDelay: 6,
            chaseRate: 0.70,
            retreatRate: 0.25,
            hesitateRate: 0.05,
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 45,
            movementSmoothness: 0.50,
            retreatDistance: 580,
            chaseAggressiveness: 1.5,
            aiStartDelay: 36 // 0.6 seconds
        };
    } else if (difficulty === 'ELITE') {
        return buildEliteAIConfig();
    } else if (difficulty === 'WORLD_CLASS') {
        return buildWorldClassAIConfig();
    } else {
        return {
            speedMultiplier: 0.72,
            shootRange: 360,
            panicTimer: 100,
            perfectShotRate: 0.50,
            missError: 0.5,
            passTriggerDist: 100,
            perfectPassRate: 0.60,
            passError: 1.0,
            passCooldown: 110,
            gkHoldTime: 360,
            reactionDelay: 12,
            chaseRate: 0.55,
            retreatRate: 0.35,
            hesitateRate: 0.10,
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 40,
            movementSmoothness: 0.4,
            retreatDistance: 600,
            chaseAggressiveness: 1.2,
            aiStartDelay: 60
        };
    }
}

function getAIConfigByTier(tier) {
    const aiMap = {
        'UNDERDOG': 'EASY',
        'CHALLENGER': 'MEDIUM',
        'COMPETITIVE': 'HARD',
        'ELITE': 'ELITE',
        'WORLD_CLASS': 'WORLD_CLASS'
    };
    const difficulty = aiMap[tier] || 'MEDIUM';
    return getAIConfigByDifficulty(difficulty);
}

function getAIConfigByDifficulty(difficulty) {
    // Every branch now resolves through getAIConfig(), which caches by
    // difficulty — this function itself is safe to call every frame (as
    // main.js's update() does during PvE) since it no longer builds
    // anything or logs anything on repeat calls.
    switch(difficulty) {
        case 'EASY': return getAIConfig('EASY');
        case 'MEDIUM': return getAIConfig('MEDIUM');
        case 'HARD': return getAIConfig('HARD');
        case 'ELITE': return getAIConfig('ELITE');
        case 'WORLD_CLASS': return getAIConfig('WORLD_CLASS');
        default:
            return getAIConfig('MEDIUM');
    }
}

function buildEliteAIConfig() {
    return {
        speedMultiplier: 0.94,
        shootRange: 370,
        panicTimer: 65,
        perfectShotRate: 0.70,
        missError: 0.30,
        passTriggerDist: 150,
        perfectPassRate: 0.80,
        passError: 0.6,
        passCooldown: 60,
        gkHoldTime: 340,
        reactionDelay: 4,
        chaseRate: 0.80,
        retreatRate: 0.15,
        hesitateRate: 0.05,
        lockThreshold: 28,
        lockTimer: 20,
        stateSwitchCooldown: 50,
        movementSmoothness: 0.55,
        retreatDistance: 560,
        chaseAggressiveness: 1.8,
        aiStartDelay: 36 // 0.6 seconds
    };
}

function buildWorldClassAIConfig() {
    return {
        speedMultiplier: 0.98,
        shootRange: 380,
        panicTimer: 50,
        perfectShotRate: 0.80,
        missError: 0.20,
        passTriggerDist: 170,
        perfectPassRate: 0.88,
        passError: 0.4,
        passCooldown: 45,
        gkHoldTime: 320,
        reactionDelay: 2,
        chaseRate: 0.90,
        retreatRate: 0.08,
        hesitateRate: 0.02,
        lockThreshold: 30,
        lockTimer: 22,
        stateSwitchCooldown: 55,
        movementSmoothness: 0.60,
        retreatDistance: 540,
        chaseAggressiveness: 2.0,
        aiStartDelay: 36 // 0.6 seconds
    };
}
