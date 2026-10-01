// ===== PRO STRIKER - ai.js (REBALANCED DIFFICULTY v2) =====
console.log('[ProStriker] ai.js loaded');

const _aiConfigCache = {};

function getAIConfig(difficulty) {
    if (_aiConfigCache[difficulty]) return _aiConfigCache[difficulty];
    const cfg = buildAIConfig(difficulty);
    _aiConfigCache[difficulty] = cfg;
    return cfg;
}

function buildAIConfig(difficulty) {
    if (difficulty === 'EASY') {
        // FIXED: was passive/frozen and never tackled. Lowered retreat/hesitate
        // so he actually closes on the ball, raised chaseAggressiveness so he
        // commits to tackles instead of just standing near the ball, shortened
        // aiStartDelay/reactionDelay so movement isn't stop-start/choppy, and
        // dropped perfectShotRate (was scoring too cleanly for "beginner").
        return {
            speedMultiplier: 0.50,
            shootRange: 320,
            panicTimer: 160,
            perfectShotRate: 0.20,
            missError: 0.78,
            passTriggerDist: 55,
            perfectPassRate: 0.35,
            passError: 1.6,
            passCooldown: 170,
            gkHoldTime: 400,
            reactionDelay: 14,
            chaseRate: 0.55,
            retreatRate: 0.25,
            hesitateRate: 0.08,
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 28,
            movementSmoothness: 0.25,
            retreatDistance: 620,
            chaseAggressiveness: 1.3,
            aiStartDelay: 40
        };
    } else if (difficulty === 'MEDIUM') {
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
    } else if (difficulty === 'HARD') {
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
        aiStartDelay: 36
    };
}

function buildWorldClassAIConfig() {
    return {
        speedMultiplier: 0.90,
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
        stateSwitchCooldown: 50,
        movementSmoothness: 0.55,
        retreatDistance: 565,
        chaseAggressiveness: 1.7,
        aiStartDelay: 36
    };
}