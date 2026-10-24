// ===== PRO STRIKER - ai.js (UNIFORM SPEED v3) =====
console.log('[ProStriker] ai.js loaded');

// SPEED RULE: the AI always moves at 4.5 * speedMultiplier, in every situation
// (with ball, chasing, loose ball). Difficulty comes from reaction time,
// shooting/passing accuracy and how often it chases, not from raw speed.
// Player speed is 4.5, so every AI is at or below the player's speed.
//
// AGGRESSIVE state (Elite/World Class only): when the PLAYER has the ball, a
// share of the AI's normal CHASE rolls becomes an AGGRESSIVE lunge — it targets
// the player's CURRENT position every frame, at aggressiveSpeed, for ~25 frames,
// then falls back to CHASE. aggressiveSpeed is always < 4.5 (never faster than
// the player). Does NOT apply to loose balls or when the AI has the ball.

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
            speedMultiplier: 0.62,
            shootRange: 320,
            panicTimer: 160,
            perfectShotRate: 0.20,
            missError: 0.78,
            passTriggerDist: 55,
            perfectPassRate: 0.35,
            passError: 1.6,
            passCooldown: 170,
            gkHoldTime: 400,
            reactionDelay: 16,
            chaseRate: 0.55,
            retreatRate: 0.25,
            hesitateRate: 0.08,
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 50,
            movementSmoothness: 0.25,
            retreatDistance: 620,
            aggressiveRate: 0.00,
            aggressiveSpeed: 0,
            aiStartDelay: 40
        };
    } else if (difficulty === 'MEDIUM') {
        return {
            speedMultiplier: 0.72,
            shootRange: 360,
            panicTimer: 120,
            perfectShotRate: 0.35,
            missError: 0.5,
            passTriggerDist: 70,
            perfectPassRate: 0.50,
            passError: 1.2,
            passCooldown: 140,
            gkHoldTime: 360,
            reactionDelay: 14,
            chaseRate: 0.45,
            retreatRate: 0.45,
            hesitateRate: 0.10,
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 42,
            movementSmoothness: 0.3,
            retreatDistance: 620,
            aggressiveRate: 0.00,
            aggressiveSpeed: 0,
            aiStartDelay: 60
        };
    } else if (difficulty === 'HARD') {
        return {
            speedMultiplier: 0.82,
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
            stateSwitchCooldown: 35,
            movementSmoothness: 0.4,
            retreatDistance: 600,
            aggressiveRate: 0.00,
            aggressiveSpeed: 0,
            aiStartDelay: 60
        };
    } else if (difficulty === 'ELITE') {
        return buildEliteAIConfig();
    } else if (difficulty === 'WORLD_CLASS') {
        return buildWorldClassAIConfig();
    } else {
        return getAIConfig('MEDIUM');
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
    return getAIConfigByDifficulty(aiMap[tier] || 'MEDIUM');
}

function getAIConfigByDifficulty(difficulty) {
    switch (difficulty) {
        case 'EASY': return getAIConfig('EASY');
        case 'MEDIUM': return getAIConfig('MEDIUM');
        case 'HARD': return getAIConfig('HARD');
        case 'ELITE': return getAIConfig('ELITE');
        case 'WORLD_CLASS': return getAIConfig('WORLD_CLASS');
        default: return getAIConfig('MEDIUM');
    }
}

function getEliteAIConfig() { return getAIConfig('ELITE'); }
function getWorldClassAIConfig() { return getAIConfig('WORLD_CLASS'); }

function buildEliteAIConfig() {
    return {
        speedMultiplier: 0.88,
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
        stateSwitchCooldown: 29,
        movementSmoothness: 0.50,
        retreatDistance: 580,
        aggressiveRate: 0.50,
        aggressiveSpeed: 4.25,
        aiStartDelay: 36
    };
}

function buildWorldClassAIConfig() {
    return {
        speedMultiplier: 0.92,
        shootRange: 370,
        panicTimer: 70,
        perfectShotRate: 0.65,
        missError: 0.35,
        passTriggerDist: 150,
        perfectPassRate: 0.78,
        passError: 0.65,
        passCooldown: 65,
        gkHoldTime: 345,
        reactionDelay: 5,
        chaseRate: 0.78,
        retreatRate: 0.17,
        hesitateRate: 0.05,
        lockThreshold: 28,
        lockTimer: 20,
        stateSwitchCooldown: 24,
        movementSmoothness: 0.55,
        retreatDistance: 565,
        aggressiveRate: 0.50,
        aggressiveSpeed: 4.45,
        aiStartDelay: 36
    };
}