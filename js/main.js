// ===== PRO STRIKER - main.js =====
console.log('[ProStriker] main.js loaded - ULTIMATE EDITION WITH TOURNAMENT');

// ===== "Common HTML5 fixes" =====
// These window/document-level listeners are a standard fix for unwanted
// page scroll and the right-click context menu breaking immersion during
// play, useful on any host, not just one platform. Keydown scroll (Space/
// Arrow keys/Enter) is already prevented per-key inside input.js's keydown
// handler (Escape is deliberately left alone there — many game portals and
// embeds reserve Escape to exit their own fullscreen), and canvas wheel
// events are already handled for in-game scrolling (tournament screens).
// This just closes the remaining gap: mouse-wheel scroll anywhere else on
// the page, and the browser's right-click menu.
window.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });

document.addEventListener('contextmenu', (event) => event.preventDefault());

let gameRunning = false;
let celebrationTimer = 0;
let isCelebrating = false;
let tournamentShootout = null;
let localPenaltyResult = null;
let localExtraTimePlayed = false;

// Fires the one-shot stadium-crowd glow (style.css: .goal-glow) on
// whichever side just scored. Removes the class first and forces a reflow
// so consecutive goals on the same side restart the animation instead of
// no-op'ing (adding a class that's already present doesn't retrigger a
// CSS animation).
function triggerGoalGlow(side) {
    const el = document.querySelector(`.stadium-crowd.${side}`);
    if (!el) return;
    el.classList.remove('goal-glow');
    void el.offsetWidth;
    el.classList.add('goal-glow');
}
function clearTournamentContinueState() {
    window._pendingContinueOffer = null;
    window._endFlow = null;
    window._continueAdBtn = null;
}

function getTournamentExtraState(match) {
    if (!match) return null;
    if (!match.tournamentState) {
        match.tournamentState = {
            active: false,
            count: 0,
            maxPeriods: 1,
            rewardedResume: false,
            settled: false,
            finalTieBreak: false,
            penaltyScoreA: null,
            penaltyScoreB: null,
            penaltyWinnerTeamId: null
        };
    }
    const extraState = match.tournamentState;
    extraState.maxPeriods = 1;
    if (extraState.penaltyScoreA === undefined) extraState.penaltyScoreA = null;
    if (extraState.penaltyScoreB === undefined) extraState.penaltyScoreB = null;
    if (extraState.penaltyWinnerTeamId === undefined) extraState.penaltyWinnerTeamId = null;
    return match.tournamentState;
}

const PENALTY_GOAL_Y_MIN = 200;
const PENALTY_GOAL_Y_MAX = 400;
const PENALTY_AIM_Y_MIN = 180;
const PENALTY_AIM_Y_MAX = 420;
const PENALTY_TIMING_SPEED = 1.25;
const PENALTY_TIMING_GREEN_HALF_WIDTH = 0.07;

function resetPenaltyTiming(shootout) {
    shootout.timingPosition = Math.random();
    shootout.timingDirection = Math.random() < 0.5 ? -1 : 1;
    shootout.timingGreenHalfWidth = PENALTY_TIMING_GREEN_HALF_WIDTH;
    shootout.timingGreenCenter = PENALTY_TIMING_GREEN_HALF_WIDTH +
        Math.random() * (1 - PENALTY_TIMING_GREEN_HALF_WIDTH * 2);
    shootout.timingPerfect = false;
}

function setLocalPenaltyTurn(shootout, team) {
    const isRed = team === 'red';
    const shooter = getPenaltyShooter(shootout, isRed ? 'player' : 'opponent', shootout.round);
    if (!shooter) {
        console.error(`[Penalty] Cannot continue local shootout: missing ${team} shooter`);
        return false;
    }

    shootout.localCurrentTeam = team;
    shootout.phase = isRed ? 'shoot' : 'localShoot';
    shootout.playerShooter = isRed ? shooter : shootout.playerShooter;
    shootout.opponentShooter = isRed ? shootout.opponentShooter : shooter;
    shooter.x = isRed ? 690 : 210;
    shooter.y = 300;
    shootout.playerGoalkeeper.x = 50;
    shootout.playerGoalkeeper.y = 300;
    shootout.opponentGoalkeeper.x = 850;
    shootout.opponentGoalkeeper.y = 300;
    shootout.shotTargetY = null;
    shootout.impactType = null;
    shootout.impactTimer = 0;
    resetPenaltyTiming(shootout);
    ball.owner = shooter;
    ball.x = shooter.x + (isRed ? 20 : -20);
    ball.y = 300;
    ball.vx = 0;
    ball.vy = 0;
    ball.trail = [];
    shootout.message = isRed ? 'PLAYER 1 · SHOOT' : 'PLAYER 2 · SHOOT';
    return true;
}

function finishLocalPenaltyShootout(shootout) {
    const winner = shootout.playerGoals > shootout.opponentGoals ? 'PLAYER 1' : 'PLAYER 2';
    localPenaltyResult = {
        winner,
        playerGoals: shootout.playerGoals,
        opponentGoals: shootout.opponentGoals
    };
    matchStats.winStreak = 0;
    matchStats.totalMatches++;
    updateRank();
    saveStats();
    if (typeof AdManager !== 'undefined') AdManager.recordNormalMatchCompleted();
    if (typeof Shop !== 'undefined') {
        try { Shop.awardLocal(); }
        catch (e) { console.warn('[Shop] local shootout reward failed', e); }
    }
    if (typeof Progress !== 'undefined') {
        try {
            Progress.onMatchEnd({
                mode: '1v1',
                outcome: null,
                goalsFor: score.red,
                goalsAgainst: score.blue,
                gkSaves: matchStats.gkSaves.red,
                difficulty: null,
                tournamentRoundsSurvived: 0,
                tournamentWon: false
            });
        } catch (e) { console.warn('[Progress] local shootout match-end update failed', e); }
    }
    shootout.phase = 'complete';
    shootout.timer = 1.4;
    shootout.message = `${winner} WINS`;
    SoundManager.playSFX('whistleStop', 0.8);
}

function advanceLocalPenaltyShootout(shootout, team) {
    shootout.localKicksThisRound++;
    if (shootout.localKicksThisRound < 2) {
        setLocalPenaltyTurn(shootout, team === 'red' ? 'blue' : 'red');
        return;
    }

    const roundsRemaining = Math.max(0, 5 - shootout.round);
    const playerClinched = shootout.round <= 5 && shootout.playerGoals > shootout.opponentGoals + roundsRemaining;
    const opponentClinched = shootout.round <= 5 && shootout.opponentGoals > shootout.playerGoals + roundsRemaining;
    const regularTimeComplete = shootout.round >= 5 && shootout.playerGoals !== shootout.opponentGoals;
    if (playerClinched || opponentClinched || regularTimeComplete) {
        finishLocalPenaltyShootout(shootout);
        return;
    }

    shootout.round++;
    shootout.suddenDeath = shootout.round > 5;
    shootout.localKicksThisRound = 0;
    setLocalPenaltyTurn(shootout, shootout.localFirstTeam);
}

function getPenaltyTimingTargetY(position) {
    const normalizedPosition = Math.max(0, Math.min(1, position));
    return PENALTY_AIM_Y_MIN + normalizedPosition * (PENALTY_AIM_Y_MAX - PENALTY_AIM_Y_MIN);
}

function isPerfectPenaltyTiming(shootout) {
    return Math.abs(shootout.timingPosition - shootout.timingGreenCenter) <= shootout.timingGreenHalfWidth;
}

function getPenaltyShooter(shootout, side, roundNumber) {
    const roster = side === 'player' ? shootout.playerShooters : shootout.opponentShooters;
    if (!Array.isArray(roster) || roster.length === 0) return null;
    return roster[(Math.max(1, roundNumber) - 1) % roster.length];
}

function setPenaltyPositions(shootout) {
    if (!shootout) return;
    const playerShooter = shootout.playerShooter || getPenaltyShooter(shootout, 'player', shootout.round);
    const opponentShooter = shootout.opponentShooter || getPenaltyShooter(shootout, 'opponent', shootout.round);
    if (playerShooter) { playerShooter.x = 690; playerShooter.y = 300; }
    if (opponentShooter) { opponentShooter.x = 210; opponentShooter.y = 300; }
    shootout.playerShooter = playerShooter;
    shootout.opponentShooter = opponentShooter;
    shootout.playerGoalkeeper.x = 50;
    shootout.playerGoalkeeper.y = shootout.keeperY;
    shootout.opponentGoalkeeper.x = 850;
    shootout.opponentGoalkeeper.y = shootout.keeperDiveY || 300;
}

function beginPenaltyShootout() {
    const playerShooters = players.filter(p => p.team === 'red' && !p.isGk && !p.ejecting);
    const opponentShooters = players.filter(p => p.team === 'blue' && !p.isGk && !p.ejecting);
    const playerGoalkeeper = players.find(p => p.team === 'red' && p.isGk);
    const opponentGoalkeeper = players.find(p => p.team === 'blue' && p.isGk);
    if (!playerShooters.length || !opponentShooters.length || !playerGoalkeeper || !opponentGoalkeeper) {
        console.error('[Penalty] Cannot start shootout: incomplete player roster');
        return;
    }

    // A shootout is a dedicated state. Release any gameplay keys that might
    // have been held when full time transitioned into penalties.
    if (typeof releaseAllInputs === 'function') releaseAllInputs();

    const isLocal = !tournamentMode;
    const shootout = {
        isLocal,
        playerGoals: 0,
        opponentGoals: 0,
        round: 1,
        phase: isLocal
            ? 'shoot'
            : (Math.random() < 0.5 ? 'shoot' : 'keeper'),
        timer: 0,
        aimY: 300,
        keeperY: 300,
        goalkeeperY: 300,
        keeperDiveY: 300,
        shotTargetY: null,
        timingPosition: 0.5,
        timingDirection: 1,
        timingPerfect: false,
        playerShooters,
        opponentShooters,
        playerShooter: playerShooters[0],
        opponentShooter: opponentShooters[0],
        playerGoalkeeper,
        opponentGoalkeeper,
        playerHistory: [],
        opponentHistory: [],
        shotSaved: false,
        shotMissed: false,
        shotGoal: false,
        opponentSaved: false,
        opponentMissed: false,
        opponentGoal: false,
        message: '',
        suddenDeath: false,
        playerShootsFirst: true,
        localFirstTeam: null,
        localCurrentTeam: null,
        localKicksThisRound: 0,
        impactTimer: 0,
        impactType: null,
        completedAt: 0
    };
    resetPenaltyTiming(shootout);
    shootout.playerShootsFirst = shootout.phase === 'shoot';
    if (isLocal) {
        localPenaltyResult = null;
        shootout.localFirstTeam = shootout.phase === 'shoot' ? 'red' : 'blue';
    }
    tournamentShootout = shootout;

    const waitingPlayers = players.filter(p => !p.isGk && p !== shootout.playerShooter && p !== shootout.opponentShooter);
    waitingPlayers.forEach((p, index) => {
        p.x = 430;
        p.y = 205 + index * 38;
    });
    setPenaltyPositions(shootout);

    if (isLocal) {
        setLocalPenaltyTurn(shootout, shootout.localFirstTeam);
    } else {
        ball.owner = shootout.phase === 'shoot' ? shootout.playerShooter : shootout.opponentShooter;
        ball.x = shootout.phase === 'shoot' ? shootout.playerShooter.x + 20 : shootout.opponentShooter.x - 20;
    }
    ball.y = 300;
    ball.vx = 0; ball.vy = 0; ball.trail = [];
    currentState = 'PENALTY_SHOOTOUT';
    matchState = 'PENALTIES';
    if (!isLocal) shootout.message = shootout.phase === 'shoot' ? 'YOUR KICK' : 'OPPONENT KICK · CHOOSE YOUR DIVE';
    SoundManager.playSFX('whistleStart', 0.8);
    updateTouchUI();
}

function getPenaltyDifficultySkill() {
    const config = typeof getAIConfigByDifficulty === 'function'
        ? getAIConfigByDifficulty(difficulty)
        : null;
    const shotRate = config && typeof config.perfectShotRate === 'number' ? config.perfectShotRate : 0.35;
    return Math.max(0, Math.min(1, (shotRate - 0.2) / 0.45));
}

function clampPenaltyTarget(y) {
    return Math.max(PENALTY_AIM_Y_MIN, Math.min(PENALTY_AIM_Y_MAX, y));
}

function takeLocalPenaltyShot(shootout) {
    const isRed = shootout.phase === 'shoot';
    const skill = getPenaltyDifficultySkill();
    const timingPerfect = isPerfectPenaltyTiming(shootout);
    const shooter = getPenaltyShooter(shootout, isRed ? 'player' : 'opponent', shootout.round);
    const goalkeeper = isRed ? shootout.opponentGoalkeeper : shootout.playerGoalkeeper;
    const goalX = isRed ? 870 : 30;
    if (!shooter || !goalkeeper) {
        console.error('[Penalty] Cannot take local kick: incomplete player roster');
        return;
    }

    shootout.timingPerfect = timingPerfect;
    shootout.shotMissed = false;
    shootout.shotSaved = false;
    shootout.shotGoal = false;
    shootout.opponentMissed = false;
    shootout.opponentSaved = false;
    shootout.opponentGoal = false;
    const aimPosition = timingPerfect ? shootout.timingGreenCenter : shootout.timingPosition;
    shootout.shotTargetY = clampPenaltyTarget(getPenaltyTimingTargetY(aimPosition));
    const outsideGoal = shootout.shotTargetY < PENALTY_GOAL_Y_MIN || shootout.shotTargetY > PENALTY_GOAL_Y_MAX;
    const luckyGrayGoal = !timingPerfect && Math.random() < 0.01;
    const missed = outsideGoal;
    const keeperReadsShot = Math.random() < 0.03 + skill * 0.2;
    const grayShotSaved = !timingPerfect && !luckyGrayGoal && !outsideGoal;
    const keeperDiveY = grayShotSaved
        ? shootout.shotTargetY
        : keeperReadsShot
            ? clampPenaltyTarget(shootout.shotTargetY + (Math.random() - 0.5) * (105 - skill * 35))
            : PENALTY_AIM_Y_MIN + Math.random() * (PENALTY_AIM_Y_MAX - PENALTY_AIM_Y_MIN);

    shootout.diveStartX = goalkeeper.x;
    shootout.diveEndX = isRed
        ? Math.min(862, goalkeeper.x + 12 + skill * 7)
        : Math.max(38, goalkeeper.x - 12 - skill * 7);
    shootout.diveStartY = goalkeeper.y;
    shootout.diveEndY = keeperDiveY;
    const saved = grayShotSaved || (!timingPerfect && !missed && Math.hypot(
        shootout.diveEndX - goalX,
        shootout.diveEndY - shootout.shotTargetY
    ) <= goalkeeper.radius + ball.radius + 4 && !luckyGrayGoal);
    const scored = !missed && !saved;

    if (isRed) {
        shootout.shotMissed = missed;
        shootout.shotSaved = saved;
        shootout.shotGoal = scored;
    } else {
        shootout.opponentMissed = missed;
        shootout.opponentSaved = saved;
        shootout.opponentGoal = scored;
    }
    shootout.shotOutcome = scored ? 'goal' : saved ? 'save' : 'miss';
    shootout.phase = isRed ? 'playerFlight' : 'opponentFlight';
    shootout.flightDuration = 0.58 - skill * 0.16;
    shootout.timer = shootout.flightDuration;
    shootout.startX = shooter.x + (isRed ? 20 : -20);
    shootout.endX = saved ? shootout.diveEndX : goalX;
    shootout.startY = shooter.y;
    shootout.flightStartY = shootout.startY;
    shootout.flightEndY = saved
        ? shootout.diveEndY
        : shootout.shotTargetY < PENALTY_GOAL_Y_MIN
            ? PENALTY_GOAL_Y_MIN - 26
            : shootout.shotTargetY > PENALTY_GOAL_Y_MAX
                ? PENALTY_GOAL_Y_MAX + 26
                : shootout.shotTargetY;
    shootout.divingGoalkeeper = goalkeeper;
    shootout.message = 'SHOT!';
    ball.owner = null;
    ball.x = shootout.startX;
    ball.y = shootout.startY;
    ball.vx = 0;
    ball.vy = 0;
    ball.trail = [];
    SoundManager.playSFX('kick', 0.8);
}

function takeTournamentPenalty() {
    const shootout = tournamentShootout;
    if (!shootout) return;

    if (shootout.isLocal && (shootout.phase === 'shoot' || shootout.phase === 'localShoot')) {
        takeLocalPenaltyShot(shootout);
        return;
    }

    if (shootout.phase === 'shoot') {
        const skill = getPenaltyDifficultySkill();
        const timingPerfect = isPerfectPenaltyTiming(shootout);
        shootout.timingPerfect = timingPerfect;
        shootout.playerShooter = getPenaltyShooter(shootout, 'player', shootout.round) || shootout.playerShooter;
        setPenaltyPositions(shootout);
        const aimPosition = timingPerfect ? shootout.timingGreenCenter : shootout.timingPosition;
        shootout.shotTargetY = clampPenaltyTarget(getPenaltyTimingTargetY(aimPosition));

        // Outside the green timing zone, shots almost always miss; a rare
        // 1% lucky strike can still score if the aim is inside the posts.
        const outsideGoal = shootout.shotTargetY < PENALTY_GOAL_Y_MIN || shootout.shotTargetY > PENALTY_GOAL_Y_MAX;
        const luckyGrayGoal = !timingPerfect && Math.random() < 0.01;
        const shotMissed = outsideGoal;
        shootout.shotMissed = shotMissed;

        const keeperReadsShot = Math.random() < 0.03 + skill * 0.20;
        const grayShotSaved = !timingPerfect && !luckyGrayGoal && !outsideGoal;
        shootout.keeperDiveY = grayShotSaved
            ? shootout.shotTargetY
            : keeperReadsShot
                ? clampPenaltyTarget(shootout.shotTargetY + (Math.random() - 0.5) * (105 - skill * 35))
                : PENALTY_AIM_Y_MIN + Math.random() * (PENALTY_AIM_Y_MAX - PENALTY_AIM_Y_MIN);
        shootout.diveStartX = shootout.opponentGoalkeeper.x;
        shootout.diveEndX = Math.min(862, shootout.diveStartX + 12 + skill * 7);
        shootout.diveStartY = shootout.opponentGoalkeeper.y;
        shootout.diveEndY = shootout.keeperDiveY;

        const saveDistance = Math.hypot(
            shootout.diveEndX - 870,
            shootout.diveEndY - shootout.shotTargetY
        );
        shootout.shotSaved = grayShotSaved || (!timingPerfect && !luckyGrayGoal && !shotMissed &&
            saveDistance <= shootout.opponentGoalkeeper.radius + ball.radius + 4);
        shootout.shotGoal = !shootout.shotMissed && !shootout.shotSaved;
        shootout.shotOutcome = shootout.shotGoal ? 'goal' : shootout.shotSaved ? 'save' : 'miss';
        shootout.phase = 'playerFlight';
        shootout.flightDuration = 0.58 - skill * 0.16;
        shootout.timer = shootout.flightDuration;
        shootout.startX = shootout.playerShooter.x + 20;
        shootout.endX = shootout.shotSaved ? shootout.diveEndX : 870;
        shootout.startY = shootout.playerShooter.y;
        shootout.flightStartY = shootout.startY;
        shootout.flightEndY = shootout.shotSaved
            ? shootout.diveEndY
            : shootout.shotTargetY < PENALTY_GOAL_Y_MIN
                ? PENALTY_GOAL_Y_MIN - 26
                : shootout.shotTargetY > PENALTY_GOAL_Y_MAX
                    ? PENALTY_GOAL_Y_MAX + 26
                    : shootout.shotTargetY;
        shootout.divingGoalkeeper = shootout.opponentGoalkeeper;
        shootout.message = 'SHOT!';
        ball.owner = null;
        ball.x = shootout.startX; ball.y = shootout.startY;
        ball.vx = 0; ball.vy = 0; ball.trail = [];
        SoundManager.playSFX('kick', 0.8);
        return;
    }

    if (shootout.phase === 'keeper') {
        const skill = getPenaltyDifficultySkill();
        const timingPerfect = isPerfectPenaltyTiming(shootout);
        shootout.timingPerfect = timingPerfect;
        shootout.opponentShooter = getPenaltyShooter(shootout, 'opponent', shootout.round) || shootout.opponentShooter;
        setPenaltyPositions(shootout);

        const aimPosition = timingPerfect ? shootout.timingGreenCenter : shootout.timingPosition;
        shootout.shotTargetY = clampPenaltyTarget(getPenaltyTimingTargetY(aimPosition));
        const luckyGraySave = !timingPerfect && Math.random() < 0.01;
        const outsideGoal = shootout.shotTargetY < PENALTY_GOAL_Y_MIN || shootout.shotTargetY > PENALTY_GOAL_Y_MAX;
        shootout.opponentMissed = outsideGoal;
        shootout.diveStartX = shootout.playerGoalkeeper.x;
        shootout.diveEndX = Math.max(38, shootout.diveStartX - 12 - skill * 7);
        shootout.diveStartY = shootout.playerGoalkeeper.y;
        shootout.diveEndY = shootout.keeperY;
        shootout.opponentSaved = !shootout.opponentMissed && (timingPerfect || luckyGraySave);
        // A non-missed, non-saved shot is on target and therefore a goal.
        shootout.opponentGoal = !shootout.opponentMissed && !shootout.opponentSaved;
        shootout.phase = 'opponentFlight';
        shootout.flightDuration = 0.58 - skill * 0.16;
        shootout.timer = shootout.flightDuration;
        shootout.startX = shootout.opponentShooter.x - 20;
        shootout.endX = shootout.opponentSaved ? shootout.diveEndX : 30;
        shootout.startY = shootout.opponentShooter.y;
        shootout.flightStartY = shootout.startY;
        shootout.flightEndY = shootout.opponentSaved
            ? shootout.diveEndY
            : shootout.opponentMissed
                ? (shootout.shotTargetY <= 300 ? PENALTY_GOAL_Y_MIN - 28 : PENALTY_GOAL_Y_MAX + 28)
                : shootout.shotTargetY;
        shootout.divingGoalkeeper = shootout.playerGoalkeeper;
        shootout.message = 'SHOT!';
        ball.owner = null;
        ball.x = shootout.startX; ball.y = shootout.startY;
        ball.vx = 0; ball.vy = 0; ball.trail = [];
        SoundManager.playSFX('kick', 0.8);
    }
}

function finishTournamentShootout() {
    const shootout = tournamentShootout;
    const match = tournamentPendingMatch;
    if (!shootout || !match || shootout.playerGoals === shootout.opponentGoals) return;

    const extraState = getTournamentExtraState(match);
    const playerIsTeamA = tournamentSelectedTeam === match.teamA.id;
    extraState.penaltyScoreA = playerIsTeamA ? shootout.playerGoals : shootout.opponentGoals;
    extraState.penaltyScoreB = playerIsTeamA ? shootout.opponentGoals : shootout.playerGoals;
    extraState.penaltyWinnerTeamId = shootout.playerGoals > shootout.opponentGoals
        ? tournamentSelectedTeam
        : (playerIsTeamA ? match.teamB.id : match.teamA.id);
    extraState.active = false;
    extraState.settled = true;
    extraState.finalTieBreak = true;
    extraState.count = extraState.maxPeriods;
    // Shootouts bypass the normal full-time branch, so choose the result music
    // here instead of leaving MATCH_END with the previous match's music.
    window._matchMusic = shootout.playerGoals > shootout.opponentGoals ? 'victory' : 'defeat';
    shootout.phase = 'complete';
    shootout.timer = 1.4;
    shootout.message = shootout.playerGoals > shootout.opponentGoals ? 'SHOOTOUT WON' : 'SHOOTOUT LOST';
}

function updateTournamentShootout(dt) {
    const shootout = tournamentShootout;
    if (!shootout) return;

    if (shootout.impactTimer > 0) shootout.impactTimer = Math.max(0, shootout.impactTimer - dt);

    if (shootout.phase === 'shoot' || shootout.phase === 'keeper' || shootout.phase === 'localShoot') {
        shootout.timingPosition += shootout.timingDirection * PENALTY_TIMING_SPEED * dt;
        if (shootout.timingPosition >= 1) {
            shootout.timingPosition = 1;
            shootout.timingDirection = -1;
        } else if (shootout.timingPosition <= 0) {
            shootout.timingPosition = 0;
            shootout.timingDirection = 1;
        }
        if (shootout.phase === 'shoot' || shootout.phase === 'localShoot') {
            const isRedShooter = shootout.phase === 'shoot';
            const shooter = isRedShooter
                ? getPenaltyShooter(shootout, 'player', shootout.round)
                : getPenaltyShooter(shootout, 'opponent', shootout.round);
            if (!shooter) {
                console.error('[Penalty] Cannot update shootout: missing active shooter');
                return;
            }
            if (isRedShooter) shootout.playerShooter = shooter;
            else shootout.opponentShooter = shooter;
            shootout.aimY = getPenaltyTimingTargetY(shootout.timingPosition);
            ball.owner = shooter;
            ball.x = shooter.x + (isRedShooter ? 20 : -20);
            ball.y = shooter.y;
        } else {
            shootout.keeperY = getPenaltyTimingTargetY(shootout.timingPosition);
            shootout.playerGoalkeeper.y = shootout.keeperY;
            shootout.opponentShooter = getPenaltyShooter(shootout, 'opponent', shootout.round) || shootout.opponentShooter;
            ball.owner = shootout.opponentShooter;
            ball.x = shootout.opponentShooter.x - 20;
            ball.y = shootout.opponentShooter.y;
        }
        if ((keys.space && (shootout.phase === 'shoot' || shootout.phase === 'keeper')) ||
            (keys.enter && shootout.isLocal && shootout.phase === 'localShoot')) {
            keys.space = false;
            keys.enter = false;
            takeTournamentPenalty();
        }
        return;
    }

    if (shootout.phase === 'playerFlight' || shootout.phase === 'opponentFlight') {
        shootout.timer = Math.max(0, shootout.timer - dt);
        const flight = shootout.flightDuration > 0 ? 1 - shootout.timer / shootout.flightDuration : 1;
        const eased = flight * flight * (3 - 2 * flight);
        ball.x = shootout.startX + (shootout.endX - shootout.startX) * eased;
        ball.y = shootout.flightStartY + (shootout.flightEndY - shootout.flightStartY) * eased;
        shootout.divingGoalkeeper.y = shootout.diveStartY + (shootout.diveEndY - shootout.diveStartY) * eased;
        shootout.divingGoalkeeper.x = shootout.diveStartX + (shootout.diveEndX - shootout.diveStartX) * eased;
        if (shootout.timer === 0) {
            shootout.phase = shootout.phase === 'playerFlight' ? 'playerResult' : 'opponentResult';
            shootout.timer = 1.0;
            if (shootout.phase === 'playerResult') {
                shootout.message = shootout.isLocal
                    ? shootout.shotGoal ? 'PLAYER 1 SCORES!' : shootout.shotSaved ? 'SAVED!' : 'PLAYER 1 MISSES!'
                    : shootout.shotGoal
                        ? 'GOAL!'
                        : shootout.shotSaved
                            ? 'SAVED!'
                            : shootout.shotTargetY < PENALTY_GOAL_Y_MIN
                                ? 'MISS · HIGH'
                                : shootout.shotTargetY > PENALTY_GOAL_Y_MAX
                                    ? 'MISS · LOW'
                                    : 'MISS!';
                shootout.impactType = shootout.shotGoal ? 'goal' : shootout.shotSaved ? 'save' : 'miss';
                shootout.impactTimer = 0.46;
                if (shootout.shotGoal) {
                    SoundManager.playSFX('goalNet', 0.65);
                    SoundManager.playSFX('goalCheer', 0.72);
                } else {
                    SoundManager.playSFX('kick', shootout.shotSaved ? 0.35 : 0.24);
                }
            } else {
                shootout.message = shootout.isLocal
                    ? shootout.opponentGoal ? 'PLAYER 2 SCORES!' : shootout.opponentSaved ? 'SAVED!' : 'PLAYER 2 MISSES!'
                    : shootout.opponentGoal
                        ? 'OPPONENT SCORES'
                        : shootout.opponentSaved
                            ? 'YOU SAVED IT!'
                            : shootout.shotTargetY < PENALTY_GOAL_Y_MIN
                                ? 'OPPONENT MISS · HIGH'
                                : shootout.shotTargetY > PENALTY_GOAL_Y_MAX
                                    ? 'OPPONENT MISS · LOW'
                                    : 'OPPONENT MISS!';
                shootout.impactType = shootout.opponentGoal ? 'conceded' : shootout.opponentSaved ? 'save' : 'miss';
                shootout.impactTimer = 0.46;
                if (shootout.opponentGoal) {
                    SoundManager.playSFX('goalNet', 0.65);
                    SoundManager.playSFX('goalCheer', 0.72);
                } else {
                    SoundManager.playSFX('kick', shootout.opponentSaved ? 0.35 : 0.24);
                }
            }
        }
        return;
    }

    shootout.timer -= dt;
    if (shootout.timer > 0) return;

    const finishCurrentKickPair = () => {
        const kicksTaken = Math.min(shootout.playerHistory.length, shootout.opponentHistory.length);
        const roundsRemainingAfterCurrent = Math.max(0, 5 - shootout.round);
        const playerClinched = shootout.round <= 5 && shootout.playerGoals > shootout.opponentGoals + roundsRemainingAfterCurrent;
        const opponentClinched = shootout.round <= 5 && shootout.opponentGoals > shootout.playerGoals + roundsRemainingAfterCurrent;
        const regularTimeComplete = shootout.round >= 5 && shootout.playerGoals !== shootout.opponentGoals;

        if (playerClinched || opponentClinched || regularTimeComplete) {
            finishTournamentShootout();
            return true;
        }

        shootout.round++;
        shootout.suddenDeath = shootout.round > 5;
        shootout.playerShooter = getPenaltyShooter(shootout, 'player', shootout.round) || shootout.playerShooter;
        shootout.opponentShooter = getPenaltyShooter(shootout, 'opponent', shootout.round) || shootout.opponentShooter;
        shootout.playerShooter.x = 690;
        shootout.playerShooter.y = 300;
        shootout.opponentShooter.x = 210;
        shootout.opponentShooter.y = 300;
        shootout.opponentGoalkeeper.x = 850;
        shootout.opponentGoalkeeper.y = 300;
        shootout.playerGoalkeeper.x = 50;
        shootout.playerGoalkeeper.y = 300;
        shootout.keeperY = 300;
        shootout.goalkeeperY = 300;
        shootout.aimY = 300;
        shootout.impactType = null;
        shootout.impactTimer = 0;
        ball.owner = shootout.playerShootsFirst ? shootout.playerShooter : shootout.opponentShooter;
        ball.x = shootout.playerShootsFirst ? shootout.playerShooter.x + 20 : shootout.opponentShooter.x - 20;
        ball.y = 300;
        shootout.phase = shootout.playerShootsFirst ? 'shoot' : 'keeper';
        shootout.shotTargetY = null;
        resetPenaltyTiming(shootout);
        shootout.message = shootout.phase === 'shoot'
            ? (shootout.suddenDeath ? `SUDDEN DEATH · KICK ${shootout.round - 5}: YOUR KICK` : 'YOUR KICK')
            : (shootout.suddenDeath ? `SUDDEN DEATH · KICK ${shootout.round - 5}: OPPONENT KICK` : 'OPPONENT KICK · CHOOSE YOUR DIVE');
        return false;
    };

    if (shootout.phase === 'playerResult') {
        if (shootout.shotGoal) shootout.playerGoals++;
        shootout.playerHistory.push({
            made: !!shootout.shotGoal,
            saved: !!shootout.shotSaved,
            missed: !!shootout.shotMissed,
            shooterId: shootout.playerShooter.id,
            shirt: shootout.playerShooter.num
        });
        if (shootout.isLocal) {
            advanceLocalPenaltyShootout(shootout, 'red');
            return;
        }

        // If the player was the first kicker, the opponent answers in the same
        // round. If the opponent kicked first, this player kick finishes the
        // paired round and the next round begins with the opponent again.
        if (shootout.playerShootsFirst) {
            shootout.keeperY = 300;
            shootout.playerGoalkeeper.x = 50;
            shootout.playerGoalkeeper.y = 300;
            shootout.opponentGoalkeeper.x = 850;
            shootout.opponentGoalkeeper.y = 300;
            shootout.opponentShooter = getPenaltyShooter(shootout, 'opponent', shootout.round) || shootout.opponentShooter;
            shootout.opponentShooter.x = 210;
            shootout.opponentShooter.y = 300;
            ball.owner = shootout.opponentShooter;
            ball.x = shootout.opponentShooter.x - 20;
            ball.y = 300;
            shootout.phase = 'keeper';
            shootout.shotTargetY = null;
            resetPenaltyTiming(shootout);
            shootout.message = shootout.suddenDeath ? 'SUDDEN DEATH · OPPONENT KICK · CHOOSE YOUR DIVE' : 'OPPONENT KICK · CHOOSE YOUR DIVE';
        } else {
            if (!shootout.suddenDeath && shootout.round < 5 && shootout.playerGoals !== shootout.opponentGoals) {
                // No early finish here: the current round is only settled after
                // both kicks, preserving the normal five-kick structure.
            }
            finishCurrentKickPair();
        }
    } else if (shootout.phase === 'opponentResult') {
        if (shootout.opponentGoal) shootout.opponentGoals++;
        shootout.opponentHistory.push({
            made: !!shootout.opponentGoal,
            saved: !!shootout.opponentSaved,
            missed: !!shootout.opponentMissed,
            shooterId: shootout.opponentShooter.id,
            shirt: shootout.opponentShooter.num
        });
        if (shootout.isLocal) {
            advanceLocalPenaltyShootout(shootout, 'blue');
            return;
        }

        // If the opponent was first, the player still has to take their kick
        // before the round can be resolved. Otherwise both kicks are complete.
        if (shootout.playerShootsFirst) {
            finishCurrentKickPair();
        } else {
            shootout.playerShooter = getPenaltyShooter(shootout, 'player', shootout.round) || shootout.playerShooter;
            shootout.playerShooter.x = 690;
            shootout.playerShooter.y = 300;
            shootout.opponentGoalkeeper.x = 850;
            shootout.opponentGoalkeeper.y = 300;
            shootout.aimY = 300;
            shootout.impactType = null;
            shootout.impactTimer = 0;
            ball.owner = shootout.playerShooter;
            ball.x = shootout.playerShooter.x + 20;
            ball.y = 300;
            shootout.phase = 'shoot';
            shootout.shotTargetY = null;
            resetPenaltyTiming(shootout);
            shootout.message = shootout.suddenDeath ? `SUDDEN DEATH · YOUR KICK` : 'YOUR KICK';
        }
    } else if (shootout.phase === 'complete') {
        tournamentShootout = null;
        matchState = 'MATCH_END';
        currentState = 'MATCH_END';
        currentHalf = 2;
        matchClock = 0;
        if (shootout.isLocal) {
            lastScorer = `${localPenaltyResult ? localPenaltyResult.winner : shootout.message} WINS THE SHOOTOUT!`;
            lastScorerTeam = null;
            window._matchMusic = 'victory';
            SoundManager.playMusic(window._matchMusic);
        }
        if (typeof updateTouchUI === 'function') updateTouchUI();
        SoundManager.playSFX('whistleStop', 0.8);
    }
}

// Called after a watched rewarded ad: same score, +45s, player kicks off
function resumeTournamentMatchWithBonus() {
    const match = tournamentPendingMatch;
    if (!match) return;
    const extra = getTournamentExtraState(match);
    if (extra) {
        extra.active = true;
        extra.rewardedResume = true;
        extra.count = Math.max(extra.count, 1);
    }
    clearTournamentContinueState();
    matchClock = AdManager.getBonusSeconds();
    matchState = 'PLAY';
    currentState = 'PLAY';
    kickoffDelay = 0.5;
    const playerIsA = tournamentSelectedTeam === match.teamA.id;
    nextKickoffTeam = playerIsA ? 'red' : 'blue';
    resetField();
    SoundManager.stopMusic();
    SoundManager.resumeCrowd();
    SoundManager.playSFX('whistleStart', 0.7);
    updateTouchUI();
}
function triggerGoal(bannerText, concedingTeam, goalX, goalY, scorerTeam) {
    try {
        lastScorer = bannerText || '';
        lastScorerTeam = scorerTeam || null;
        // Shots are incremented at the moment an attacking attempt is taken.
        // A goal therefore no longer masquerades as a shot, and misses/saves are
        // recorded correctly too.
        screenShake = { duration: 32, intensity: 22, x: 0, y: 0 };
        goalZoomScale = 2.8;
        if (ball) { ball.vx = 0; ball.vy = 0; ball.owner = null; }
        if (typeof SoundManager !== 'undefined') {
            try { SoundManager.playGoalSounds(); } catch(e) {}
            try { SoundManager.stopMusic(); } catch(e) {}
        }
        if (gameWrapperElem) {
            gameWrapperElem.classList.remove('shake-impact');
            void gameWrapperElem.offsetWidth;
            gameWrapperElem.classList.add('shake-impact');
        }
        const teamColor = (concedingTeam === 'red') ? '#ff5252' : '#48dbfb';
        spawnCelebration(goalX, goalY, teamColor);
        // concedingTeam names who was scored AGAINST, so the scoring side's
        // crowd band is the opposite one: red conceded -> blue (right side)
        // scored, and vice versa. Retriggerable: remove+reflow+add so back
        // to back goals on the same side still restart the animation.
        triggerGoalGlow(concedingTeam === 'red' ? 'right' : 'left');
        if (goalFlashElem) {
            goalFlashElem.classList.remove('active');
            void goalFlashElem.offsetWidth;
            goalFlashElem.classList.add('active');
        }
        const overlay = document.getElementById('celebrationOverlay');
        if (overlay) { overlay.classList.add('active'); setTimeout(() => overlay.classList.remove('active'), 1000); }
        let scorer = ball.cooldownPlayer || ball.owner;
        if (scorer) {
            const targetX = concedingTeam === 'red' ? 875 : 25;
            scorer.ejecting = true;
            scorer.ejectTargetX = targetX;
            scorer.ejectTargetY = 300 + (Math.random() - 0.5) * 100;
            isCelebrating = true;
            celebrationTimer = 60;
        }
        nextKickoffTeam = concedingTeam;
        console.log('[GOAL]', bannerText);
    } catch(e) { console.error(e); }
}

function spawnCelebration(x, y, color) {
    const colors = [color, '#f1c40f', '#ffffff', '#ff9f43', '#e056fd', '#2ecc71', '#3498db'];
    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 25 + 5;
        celebrationParticles.push({
            x: x + (Math.random()-0.5)*50,
            y: y + (Math.random()-0.5)*50,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed - 3,
            size: Math.random()*10 + 4,
            color: colors[Math.floor(Math.random()*colors.length)],
            rotation: Math.random()*Math.PI*2,
            vRot: (Math.random()-0.5)*0.4,
            life: 150 + Math.random()*50,
            gravity: 0.15 + Math.random()*0.1,
            bounce: 0.6 + Math.random()*0.3
        });
    }
}

function updateCelebration(dtFrames = 1) {
    const dt = Math.max(0, Math.min(4, dtFrames));
    for (let i = celebrationParticles.length - 1; i >= 0; i--) {
        const p = celebrationParticles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.vx *= Math.pow(0.99, dt); p.vy *= Math.pow(0.99, dt);
        p.rotation += p.vRot * dt;
        if (p.y > 580) { p.y = 580; p.vy *= Math.pow(p.bounce, dt); if (dt > 0) p.vy *= -1; p.vx *= Math.pow(0.95, dt); }
        p.life -= dt;
        if (p.life <= 0 || p.y < -50) celebrationParticles.splice(i, 1);
    }
}

function createPlayers(teamAId, teamBId) {
    players = [];
    const create = (id, team, x, y, isGk, num, col, gradCol, teamId) => ({
        id, team, x, y, radius: 16,
        color: col, gradColor: gradCol,
        isGk, num,
        teamId: teamId ?? null,
        ejecting: false, ejectTargetX: 0, ejectTargetY: 0,
        stamina: 1.0,
        celebration: false,
        celebrationTimer: 0,
        aiDirX: 0,
        aiDirY: 0
    });

    if (tournamentMode && teamAId !== undefined && teamBId !== undefined && teamAId !== null && teamBId !== null) {
        const teamA = TOURNAMENT_TEAMS.find(t => t.id === teamAId);
        const teamB = TOURNAMENT_TEAMS.find(t => t.id === teamBId);
        if (teamA && teamB) {
            // See KIT CLASH RESOLUTION in physics.js: teamB gets an away color
            // when its real kit color is too close to teamA's.
            const teamBColor = resolveAwayColor(teamA.color, teamB.color);
            const darkA = darkenColor(teamA.color);
            const darkB = darkenColor(teamBColor);
            players.push(create(0,'red',50,300,true,'1', teamA.color, darkA, teamA.id));
            players.push(create(1,'red',250,150,false,'7', teamA.color, darkA, teamA.id));
            players.push(create(2,'red',250,450,false,'9', teamA.color, darkA, teamA.id));
            players.push(create(3,'red',380,300,false,'10', teamA.color, darkA, teamA.id));
            players.push(create(4,'blue',850,300,true,'1', teamBColor, darkB, teamB.id));
            players.push(create(5,'blue',650,150,false,'8', teamBColor, darkB, teamB.id));
            players.push(create(6,'blue',650,450,false,'11', teamBColor, darkB, teamB.id));
            players.push(create(7,'blue',520,300,false,'10', teamBColor, darkB, teamB.id));
            return;
        }
    }

    players.push(create(0,'red',50,300,true,'1','#e74c3c','#c0392b'));
    players.push(create(1,'red',250,150,false,'7','#ff5252','#d63031'));
    players.push(create(2,'red',250,450,false,'9','#ff5252','#d63031'));
    players.push(create(3,'red',380,300,false,'10','#ff5252','#d63031'));
    players.push(create(4,'blue',850,300,true,'1','#3498db','#2980b9'));
    players.push(create(5,'blue',650,150,false,'8','#48dbfb','#0984e3'));
    players.push(create(6,'blue',650,450,false,'11','#48dbfb','#0984e3'));
    players.push(create(7,'blue',520,300,false,'10','#48dbfb','#0984e3'));
}

function darkenColor(hex) {
    let r = parseInt(hex.slice(1,3), 16);
    let g = parseInt(hex.slice(3,5), 16);
    let b = parseInt(hex.slice(5,7), 16);
    r = Math.max(0, r - 40);
    g = Math.max(0, g - 40);
    b = Math.max(0, b - 40);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function initMatch(teamAId, teamBId) {
    score = { red:0, blue:0 };
    localPenaltyResult = null;
    localExtraTimePlayed = false;
    matchStats = {
        possession:{red:0, blue:0},
        shots:{red:0, blue:0},
        passes:{red:0, blue:0},
        tackles:{red:0, blue:0},
        possessionTimer:{red:0, blue:0},
        gkSaves:{red:0, blue:0},
        winStreak: matchStats.winStreak || 0,
        totalMatches: matchStats.totalMatches || 0
    };
    nextKickoffTeam = kickoffTeam;
    matchClock = halfDuration;
    currentHalf = 1;
    matchState = 'PLAY';
    halftimeTimer = 0;
    kickoffDelay = 0.5;
    isCelebrating = false;
    celebrationTimer = 0;
    celebrationParticles = [];
    if (tournamentPendingMatch) {
        const extra = getTournamentExtraState(tournamentPendingMatch);
        if (extra) {
            extra.active = false;
            extra.count = 0;
            extra.rewardedResume = false;
            extra.settled = false;
        }
    }

    if (tournamentMode && teamAId !== undefined && teamBId !== undefined && teamAId !== null && teamBId !== null) {
        currentMatchTeamAId = teamAId;
        currentMatchTeamBId = teamBId;
        createPlayers(teamAId, teamBId);
        let outfielders = players.filter(p => p.team === 'red' && !p.isGk);
        if (outfielders.length > 0) {
            ball.owner = outfielders[Math.floor(Math.random() * outfielders.length)];
        } else {
            ball.owner = null;
        }
    } else {
        currentMatchTeamAId = null;
        currentMatchTeamBId = null;
        createPlayers();
        resetField();
        return;
    }

    ball.x = 450; ball.y = 300; ball.vx = 0; ball.vy = 0;
    ball.cooldownPlayer = null; ball.cooldownTimer = 0;
    ball.trail = [];

    aiTimer = 0; aiDribbleTime = 0; aiPassCooldown = 0; aiHoldBallTimer = 0;
    aiState = 'CHASE'; aiStateTimer = 0; gkTimer = 0;
    // ===== BUGFIX: these were hardcoded (42 / 20) for every difficulty, so
    // EASY and WORLD_CLASS "woke up" and reacted to the ball at the exact
    // same speed even though ai.js defines very different reactionDelay /
    // aiStartDelay per tier. Now pulled from the active config so higher
    // difficulties genuinely react faster, as intended.
    {
        const _c = getAIConfigByDifficulty(difficulty);
        aiStartDelay = _c.aiStartDelay;
        aiReactionTimer = _c.reactionDelay;
    }
    activeLocks.red = { player: null, timer: 0 };
    activeLocks.blue = { player: null, timer: 0 };
    players.forEach(p => { p.aiDirX = 0; p.aiDirY = 0; });
}

function resetField() {
    createPlayers(currentMatchTeamAId, currentMatchTeamBId);
    ball.x = 450; ball.y = 300; ball.vx = 0; ball.vy = 0;
    ball.cooldownPlayer = null; ball.cooldownTimer = 0;
    ball.trail = [];
    aiTimer = 0; aiDribbleTime = 0; aiPassCooldown = 0; aiHoldBallTimer = 0;
    aiState = 'CHASE'; aiStateTimer = 0; gkTimer = 0;
    // ===== BUGFIX: see note in initMatch() — was hardcoded (42 / 20).
    {
        const _c = getAIConfigByDifficulty(difficulty);
        aiStartDelay = _c.aiStartDelay;
        aiReactionTimer = _c.reactionDelay;
    }
    activeLocks.red = { player: null, timer: 0 };
    activeLocks.blue = { player: null, timer: 0 };
    let outfielders = players.filter(p => !p.isGk);
    if (nextKickoffTeam) {
        outfielders = outfielders.filter(p => p.team === nextKickoffTeam);
    }
    ball.owner = outfielders[Math.floor(Math.random() * outfielders.length)];
}

// ===== REMOVED DUPLICATE startTournamentMatch() =====
// The correct version is in input.js with markPlayerMatch()

// Sprint is per side: in 1v1 the left Shift sprints RED and the right Shift
// sprints BLUE (before, either Shift sprinted BOTH players at once). Against
// the computer either Shift key sprints the human (RED).
function sprintRed() { return gameMode === '1v1' ? !!keys.ShiftL : !!(keys.ShiftL || keys.ShiftR); }
function sprintBlue() { return gameMode === '1v1' && !!keys.ShiftR; }

function update(dt) {
    if (currentState === 'PAUSED') return;

    // Frame-rate independence: every movement constant in this file (ball
    // speed, player/AI speed, goalkeeper speed) was tuned assuming a fixed
    // ~60fps tick — e.g. "ball.x += ball.vx" just adds vx once per tick,
    // which moves the ball proportionally faster on a 144Hz/165Hz display
    // since the loop simply runs more often. dtFrames converts real elapsed
    // time into "how many 60fps-frame-equivalents just happened" — exactly
    // 1.0 at 60fps (so nothing changes there), and scaled correctly at any
    // other refresh rate. This is the same conversion already used
    // elsewhere in this file (see goalBannerTimer/aiStateTimer below) —
    // multiplying every position update below by dtFrames extends that
    // existing convention to movement instead of introducing a new one.
    const dtFrames = dt * 60;

    // PERF FIX (mobile FPS): this used to call
    // getAIConfigByDifficulty(difficulty) here, unconditionally, every
    // single frame in every game state (including sitting on the menu) —
    // but the result was never used anywhere below. It was pure waste:
    // an object allocation plus two console.log calls, 60 times a second,
    // forever. See the PERF FIX comment at the top of ai.js for why that
    // console spam hit mobile hardware especially hard. The AI config is
    // still fetched exactly where it's actually needed further down (now a
    // cheap cached lookup either way).

    if (currentState === 'TUTORIAL') { TutorialManager.update(dt); return; }
    if (currentState === 'TUTORIAL_COMPLETE') return;
    if (currentState === 'PENALTY_SHOOTOUT') { updateTournamentShootout(dt); return; }

    if (currentState === 'TOURNAMENT_CONTINUE_OFFER') {
        const flow = window._endFlow;
        const offer = window._pendingContinueOffer;
        if (flow && flow.offer && offer && !offer.finalized) {
            const hasAdRequest = typeof AdManager !== 'undefined' && AdManager.isAdRequestInFlight();
            if (!hasAdRequest) flow.t += dt;
            if (flow.t >= flow.duration) {
                flow.offer = false;
                flow.t = 999;
                declineTournamentContinueOffer();
            }
        }
        return;
    }

    updateParticles(dtFrames);
    updateCelebration(dtFrames);
    if (screenShake.duration > 0) {
        screenShake.duration = Math.max(0, screenShake.duration - dtFrames);
        let damp = screenShake.duration / 32;
        screenShake.x = (Math.random()-0.5)*screenShake.intensity*damp;
        screenShake.y = (Math.random()-0.5)*screenShake.intensity*damp;
    } else { screenShake.x = 0; screenShake.y = 0; }
    if (goalZoomScale > 1.0) {
        goalZoomScale += (1.0 - goalZoomScale) * (1 - Math.pow(0.84, dtFrames));
        if (goalZoomScale < 1.001) goalZoomScale = 1.0;
    }

        // ===== TOURNAMENT MATCH END =====
    if (currentState === 'MATCH_END' && tournamentMode && tournamentPendingMatch) {
        const pending = tournamentPendingMatch;
        const isGroup = pending.type === 'group';
        const playerIsA = tournamentSelectedTeam === pending.teamA.id;
        const teamAScore = playerIsA ? score.red : score.blue;
        const teamBScore = playerIsA ? score.blue : score.red;
        const roundIdx = pending.roundIndex !== undefined ? pending.roundIndex : pending.round;
        const isFinal = !isGroup && roundIdx === 3;
        const penaltyWinnerTeamId = pending.tournamentState && pending.tournamentState.penaltyWinnerTeamId;
        const playerLost = penaltyWinnerTeamId
            ? penaltyWinnerTeamId !== tournamentSelectedTeam
            : (playerIsA ? (teamAScore < teamBScore) : (teamBScore < teamAScore));

        if (playerLost && !isGroup && !isFinal && typeof AdManager !== 'undefined' && AdManager.canOfferTournamentContinue(pending.uid, isFinal, isGroup)) {
            const offer = {
                uid: pending.uid,
                roundIndex: roundIdx,
                teamA: pending.teamA,
                teamB: pending.teamB,
                teamAScore,
                teamBScore,
                groupId: pending.groupId || null,
                isGroup,
                teamAId: pending.teamA.id,
                teamBId: pending.teamB.id
            };
            window._pendingContinueOffer = offer;
            window._endFlow = { uid: pending.uid, t: 0, offer: true, duration: AdManager.getOfferSeconds() };
            currentState = 'TOURNAMENT_CONTINUE_OFFER';
            updateTouchUI();
            SoundManager.updateMusicForState(currentState);
            return;
        }

        if (!window._endFlow || window._endFlow.uid !== pending.uid) {
            window._endFlow = { uid: pending.uid, t: 0, offer: false, duration: 0 };
        }
        const flow = window._endFlow;
        const adBusy = typeof AdManager !== 'undefined' && AdManager.isAdRequestInFlight();
        if (!adBusy) flow.t += dt;
        if (flow.t < 1.5) return;

        window._endFlow = null;
        window._continueAdBtn = null;
        TournamentManager.recordPlayerMatchResult(
            pending.uid, teamAScore, teamBScore, isGroup,
            isGroup ? pending.groupId : null, isGroup ? null : roundIdx
        );
        // ===== SHOP: coins for a played (not forfeited) tournament match =====
        const plScore = playerIsA ? teamAScore : teamBScore, opScore = playerIsA ? teamBScore : teamAScore;
        const shootoutWinnerTeamId = pending.tournamentState && pending.tournamentState.penaltyWinnerTeamId;
        const plOutcome = shootoutWinnerTeamId
            ? (shootoutWinnerTeamId === tournamentSelectedTeam ? 'win' : 'loss')
            : (plScore > opScore ? 'win' : (plScore === opScore ? 'draw' : 'loss'));
        if (typeof Shop !== 'undefined') {
            try {
                Shop.awardTournament(plOutcome, !isGroup, isFinal, pending.uid);
            } catch (e) { console.warn('[Shop] award failed', e); }
        }
        if (typeof Progress !== 'undefined') {
            try {
                const roundsSurvived = plOutcome === 'win' ? (isGroup ? 1 : (roundIdx + 1)) : 0;
                const wonChampionship = !!(TournamentManager.champion && TournamentManager.champion.id === tournamentSelectedTeam);
                const playerGkSaves = playerIsA ? matchStats.gkSaves.red : matchStats.gkSaves.blue;
                Progress.onMatchEnd({
                    mode: 'tournament', outcome: plOutcome,
                    goalsFor: plScore, goalsAgainst: opScore,
                    gkSaves: playerGkSaves,
                    difficulty: null,
                    tournamentRoundsSurvived: roundsSurvived,
                    tournamentWon: wonChampionship
                });
            } catch (e) { console.warn('[Progress] onMatchEnd failed', e); }
        }

        tournamentPendingMatch = null;
        currentState = 'TOURNAMENT_RESULT';
        updateTouchUI();
        SoundManager.updateMusicForState(currentState);
        return;
    }

    if (currentState === 'MATCH_END') return;

    if (matchState === 'HALFTIME') {
        halftimeTimer -= dt;
        if (halftimeTimer <= 0) {
            SoundManager.playSFX('whistleStart', 0.7);
            currentHalf = 2;
            matchClock = halfDuration;
            matchState = 'PLAY';
            kickoffDelay = 0.5;
            nextKickoffTeam = (kickoffTeam === 'red') ? 'blue' : 'red';
            resetField();
            SoundManager.resumeCrowd();
        }
        return;
    }

    if (currentState === 'GOAL_SCORED') {
        goalBannerTimer += dt * 60;
        if (goalBannerTimer > 110) {
            goalBannerTimer = 0;
            resetField();
            currentState = 'PLAY';
            SoundManager.resumeCrowd();
            SoundManager.playSFX('whistleStart', 0.7);
        }
        return;
    }

    if (currentState !== 'PLAY') return;

    if (kickoffDelay > 0) {
        if (kickoffDelay < 0.1 && kickoffDelay > 0) SoundManager.playSFX('whistleStart', 0.7);
        kickoffDelay -= dt;
    } else {
        matchClock -= dt;
        if (matchClock <= 0) {
            matchClock = 0;
            if (currentHalf === 1) {
                SoundManager.playSFX('whistleStop', 0.7);
                matchState = 'HALFTIME';
                halftimeTimer = HALFTIME_BREAK;
                // BUGFIX: same class of bug as MATCH_END/TOURNAMENT_RESULT above —
                // reached from inside the game loop, so the touch controls never
                // got hidden for the halftime break without this.
                updateTouchUI();
                return;
            } else {
                // ===== FULL TIME =====
                const isKnockout = tournamentMode && tournamentPendingMatch && tournamentPendingMatch.type === 'knockout';
                const isDraw = (score.red === score.blue);
                const extraState = (tournamentMode && tournamentPendingMatch) ? getTournamentExtraState(tournamentPendingMatch) : null;
                if (!tournamentMode && gameMode === '1v1' && isDraw) {
                    if (localExtraTimePlayed) {
                        beginPenaltyShootout();
                    } else {
                        localExtraTimePlayed = true;
                        matchClock = halfDuration;
                        kickoffDelay = 0.5;
                        nextKickoffTeam = (kickoffTeam === 'red') ? 'blue' : 'red';
                        resetField();
                        SoundManager.playSFX('whistleStart', 0.7);
                    }
                    return;
                }
                if (isKnockout && isDraw && !(extraState && extraState.settled)) {
                    const maxPeriods = extraState && typeof extraState.maxPeriods === 'number' ? extraState.maxPeriods : 1;
                    if (extraState && extraState.count >= maxPeriods) {
                        beginPenaltyShootout();
                        return;
                    } else {
                        if (extraState) {
                            extraState.count += 1;
                            extraState.active = true;
                            extraState.settled = false;
                            extraState.finalTieBreak = false;
                        }
                        console.log(`[Match] Extra time period #${(extraState ? extraState.count : 1)}: ${halfDuration} seconds added.`);
                        SoundManager.playSFX('whistleStart', 0.7);
                        matchClock = halfDuration;
                        kickoffDelay = 0.5;
                        nextKickoffTeam = (kickoffTeam === 'red') ? 'blue' : 'red';
                        resetField();
                        SoundManager.resumeCrowd();
                        return;
                    }
                }

                // If it's not a knockout, or not a draw → normal match end
                SoundManager.playSFX('whistleStop', 0.7);
                const isVSComputer = gameMode === 'pve';
                const winner = (score.red > score.blue) ? 'RED' : (score.blue > score.red) ? 'BLUE' : 'DRAW';
               
                if (isVSComputer && !tournamentMode) {
                    updateOverallStats(difficulty, winner);
                }
               
                // ===== FIXED: Play victory/defeat music in tournament mode too =====
if (isVSComputer || tournamentMode) {
    let playerWon = false;
    if (tournamentMode && tournamentPendingMatch) {
        const penaltyWinner = tournamentPendingMatch.tournamentState && tournamentPendingMatch.tournamentState.penaltyWinnerTeamId;
        if (penaltyWinner) {
            playerWon = penaltyWinner === tournamentSelectedTeam;
        } else if (tournamentSelectedTeam === tournamentPendingMatch.teamA.id) {
            playerWon = score.red > score.blue;
        } else {
            playerWon = score.blue > score.red;
        }
    } else {
        playerWon = (winner === 'RED');
    }
    window._matchMusic = playerWon ? 'victory' : 'defeat';
} else {
    window._matchMusic = 'victory';
}
// Remembered so SoundManager.updateMusicForState('MATCH_END') (which runs on
// every tap / key press and from updateTouchUI below) keeps the SAME track.
// It used to re-pick from the stale last-goal banner text instead, so a
// tournament win could swap to the defeat music on the very next tap.
SoundManager.playMusic(window._matchMusic);
               
                matchState = 'MATCH_END';
                currentState = 'MATCH_END';
                // BUGFIX: same issue as the TOURNAMENT_RESULT transition above —
                // full-time is reached inside the game loop, so without this call
                // the touch joystick/shoot buttons from the match stayed visible
                // on top of the match-end screen until some unrelated tap/key
                // happened to trigger updateTouchUI() elsewhere.
                updateTouchUI();
               
                let winnerText = '';
                if (tournamentMode) {
                    winnerText = '';
                } else {
                    if (score.red > score.blue) winnerText = 'RED TEAM WINS!';
                    else if (score.blue > score.red) winnerText = 'BLUE TEAM WINS!';
                    else winnerText = 'DRAW!';
                }
                lastScorer = winnerText;
                lastScorerTeam = null;
               
                // BUGFIX: rank points used to move on 1v1 (two people on one keyboard)
                // too, so either player "winning" changed the one shared rank.
                // Rank is now earned/lost against the computer only.
                if (winner === 'RED' && isVSComputer && !tournamentMode) {
                    matchStats.winStreak++;
                    rankPoints += 10;
                } else if (winner === 'BLUE' && isVSComputer && !tournamentMode) {
                    matchStats.winStreak = 0;
                    rankPoints = Math.max(0, rankPoints - 5);
                } else {
                    matchStats.winStreak = 0;
                }
                matchStats.totalMatches++;
                updateRank();
                saveStats();
                // ===== AD STRATEGY: normal match completed =====
                // Only non-tournament matches (1v1 and VS Computer) count
                // toward Pro Striker's own "every N matches" midgame ad
                // pacing — see AdManager.recordNormalMatchCompleted() for
                // why tournament matches are deliberately excluded here.
                // The ad itself is only ever requested once the player has
                // acknowledged this MATCH_END screen (see input.js), never
                // as a surprise on top of the result.
                if (!tournamentMode && typeof AdManager !== 'undefined') {
                    AdManager.recordNormalMatchCompleted();
                }
                // ===== SHOP: coins for finishing a match =====
                if (!tournamentMode && typeof Shop !== 'undefined') {
                    try {
                        if (gameMode === 'pve') Shop.awardPve(winner === 'RED' ? 'win' : (winner === 'BLUE' ? 'loss' : 'draw'), score.red, difficulty);
                        else Shop.awardLocal();
                    } catch (e) { console.warn('[Shop] award failed', e); }
                }
                // ===== PROGRESS: Career Stats / Challenges / XP / Trophies / Mystery =====
                // 1v1 has no "opponent" so outcome is null (Career Stats only
                // counts wins/draws/losses for VS Computer, per the spec).
                if (!tournamentMode && typeof Progress !== 'undefined') {
                    try {
                        Progress.onMatchEnd({
                            mode: gameMode === 'pve' ? 'pve' : '1v1',
                            outcome: gameMode === 'pve' ? (winner === 'RED' ? 'win' : (winner === 'BLUE' ? 'loss' : 'draw')) : null,
                            goalsFor: score.red, goalsAgainst: score.blue,
                            gkSaves: matchStats.gkSaves.red,
                            difficulty: gameMode === 'pve' ? difficulty : null,
                            tournamentRoundsSurvived: 0, tournamentWon: false
                        });
                    } catch (e) { console.warn('[Progress] onMatchEnd failed', e); }
                }
                return;
            }
        }
    }

    // Locks
    if (activeLocks.red.timer > 0) activeLocks.red.timer -= dtFrames;
    if (activeLocks.blue.timer > 0) activeLocks.blue.timer -= dtFrames;

    // Ejecting players
    for (let p of players) {
        if (p.ejecting) {
            let dx = p.ejectTargetX - p.x, dy = p.ejectTargetY - p.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 5) { p.x = p.ejectTargetX; p.y = p.ejectTargetY; p.ejecting = false; }
            else { let speed = 5 + dist*0.05; if (speed>8) speed=8; speed *= dtFrames; p.x += (dx/dist)*speed; p.y += (dy/dist)*speed; }
        }
        if (!(p.team === 'red' ? sprintRed() : sprintBlue())) p.stamina = Math.min(1, p.stamina + 0.002 * dtFrames);
    }

    // These countdowns are authored in 60fps frames; dtFrames keeps them
    // real-time on 90/120/144Hz screens (they used to tick once per rendered frame).
    if (ball.cooldownTimer > 0) { ball.cooldownTimer -= dtFrames; if (ball.cooldownTimer <= 0) ball.cooldownPlayer = null; }
    if (aiStartDelay > 0) aiStartDelay -= dtFrames;
    if (aiReactionTimer > 0) aiReactionTimer -= dtFrames;
    if (aiPassCooldown > 0) aiPassCooldown -= dtFrames;

    // GK movement
    for (let p of players) {
        if (p.isGk && ball.owner !== p) {
            if (p.team === 'red') {
                p.y += gkSpeed * gkDirection.red * dtFrames;
                if (p.y <= 210) { p.y = 210; gkDirection.red = 1; }
                else if (p.y >= 390) { p.y = 390; gkDirection.red = -1; }
                p.x = 50;
            } else {
                p.y += gkSpeed * gkDirection.blue * dtFrames;
                if (p.y <= 210) { p.y = 210; gkDirection.blue = 1; }
                else if (p.y >= 390) { p.y = 390; gkDirection.blue = -1; }
                p.x = 850;
            }
        }
    }

    let activeRed = getActivePlayer('red');
    let activeBlue = getActivePlayer('blue');
    let playerSpeed = 4.5;
    let redGkHasBall = ball.owner && ball.owner.team === 'red' && ball.owner.isGk;
    let blueGkHasBall = ball.owner && ball.owner.team === 'blue' && ball.owner.isGk;

    if (activeRed && !activeRed.ejecting) {
        let nextX = activeRed.x, nextY = activeRed.y;
        let speed = playerSpeed * (0.7 + 0.3 * activeRed.stamina) * dtFrames;
        if (sprintRed()) { speed *= 1.5; activeRed.stamina -= 0.004 * dtFrames; if (activeRed.stamina < 0) activeRed.stamina = 0; }
        const redInputX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
        const redInputY = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
        const redInputLen = Math.hypot(redInputX, redInputY);
        if (redInputLen > 0) {
            nextX += (redInputX / redInputLen) * speed;
            nextY += (redInputY / redInputLen) * speed;
        }
        activeRed.x = nextX; activeRed.y = nextY;
        if (activeRed.isGk) {
            activeRed.x = Math.max(25+activeRed.radius, Math.min(100-activeRed.radius, activeRed.x));
            activeRed.y = Math.max(150+activeRed.radius, Math.min(450-activeRed.radius, activeRed.y));
        } else {
            activeRed.x = Math.max(25+activeRed.radius, Math.min(875-activeRed.radius, activeRed.x));
            activeRed.y = Math.max(activeRed.radius, Math.min(GAME_H-activeRed.radius, activeRed.y));
            if (blueGkHasBall) resolveBoxCollision(activeRed, {minX:775, maxX:875, minY:150, maxY:450});
        }
    }

    if (activeBlue && !activeBlue.ejecting) {
        let nextX = activeBlue.x, nextY = activeBlue.y;
        if (gameMode === '1v1') {
            let speed = playerSpeed * (0.7 + 0.3 * activeBlue.stamina) * dtFrames;
            if (sprintBlue()) { speed *= 1.5; activeBlue.stamina -= 0.004 * dtFrames; if (activeBlue.stamina < 0) activeBlue.stamina = 0; }
            const blueInputX = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
            const blueInputY = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
            const blueInputLen = Math.hypot(blueInputX, blueInputY);
            if (blueInputLen > 0) {
                nextX += (blueInputX / blueInputLen) * speed;
                nextY += (blueInputY / blueInputLen) * speed;
            }
        } else {
            if (aiReactionTimer <= 0 && aiStartDelay <= 0) {
                let aiCfg = getAIConfigByDifficulty(difficulty);
                let aiSpeed = playerSpeed * aiCfg.speedMultiplier * (0.7 + 0.3 * activeBlue.stamina) * dtFrames;
                if (ball.owner === activeBlue) {
                    aiHoldBallTimer += dtFrames;
                    aiDribbleTime += 0.04 * dtFrames;
                    let curveY = 300 + Math.sin(aiDribbleTime) * 130;
                    if (activeBlue.x > 160) nextX -= aiSpeed;
                    if (activeBlue.y < curveY - 15) nextY += aiSpeed;
                    else if (activeBlue.y > curveY + 15) nextY -= aiSpeed;
                    arrowAngle = Math.atan2(300 - activeBlue.y, 25 - activeBlue.x);
                    let isCloseToGoal = activeBlue.x < aiCfg.shootRange;
                    if (aiPassCooldown <= 0 && activeBlue.x > 380) {
                        let teammates = players.filter(p => p.team === 'blue' && !p.isGk && p !== activeBlue);
                        let randomTeammate = teammates[Math.floor(Math.random() * teammates.length)];
                        let distToHuman = activeRed ? Math.hypot(activeRed.x - activeBlue.x, activeRed.y - activeBlue.y) : 999;
                        if (randomTeammate && (distToHuman < aiCfg.passTriggerDist || Math.random() < 0.005)) {
                            let passAngle = Math.atan2(randomTeammate.y - activeBlue.y, randomTeammate.x - activeBlue.x);
                            if (Math.random() < (1 - aiCfg.perfectPassRate)) passAngle += (Math.random()-0.5)*aiCfg.passError;
                            arrowAngle = passAngle;
                            shootBall(activeBlue, false);
                            aiPassCooldown = aiCfg.passCooldown;
                        }
                    }
                    let forcePanicShot = (isCloseToGoal && aiHoldBallTimer > aiCfg.panicTimer);
                    if ((forcePanicShot || (isCloseToGoal && Math.random() < 0.03)) && ball.owner === activeBlue) {
                        if (Math.random() < (1 - aiCfg.perfectShotRate)) arrowAngle += Math.random()>0.5 ? aiCfg.missError : -aiCfg.missError;
                        shootBall(activeBlue, true);
                        aiHoldBallTimer = 0;
                        aiPassCooldown = 60;
                    }
                } else {
                    aiHoldBallTimer = 0;
                    const isBallLoose = !ball.owner;
                    const ballInAIHalf = ball.x < 450;
                    const ballInHumanHalf = ball.x > 450;
                    aiStateTimer -= dt * 60;
                    if (aiStateTimer <= 0 || isBallLoose) {
                        let roll = Math.random();
                        if (isBallLoose) {
                            aiState = 'CHASE';
                            aiTargetOffset = { x: (Math.random()-0.5)*30, y: (Math.random()-0.5)*30 };
                            aiCommitTimer = 30;
                        } else if (ballInAIHalf) {
                            // BUGFIX: hesitateRate from ai.js was never actually consulted —
                            // the HESITATE branch was just "whatever's left over" from the
                            // other two rolls, so lower-difficulty AIs didn't hesitate more
                            // often like their config implies. Now hesitateRate directly
                            // gates a dedicated roll before the chase/retreat split.
                            if (roll < aiCfg.hesitateRate) { aiState = 'HESITATE'; aiCommitTimer = 15; }
                            else if (roll < aiCfg.hesitateRate + aiCfg.retreatRate) { aiState = 'RETREAT'; aiCommitTimer = 25; }
                            else { aiState = 'CHASE'; aiTargetOffset = { x:(Math.random()-0.5)*40, y:(Math.random()-0.5)*40 }; aiCommitTimer = 20; }
                        } else if (ballInHumanHalf) {
                            if (roll < aiCfg.hesitateRate) { aiState = 'HESITATE'; aiCommitTimer = 10; }
                            else if (roll < aiCfg.hesitateRate + aiCfg.chaseRate) { aiState = 'CHASE'; aiTargetOffset = { x:(Math.random()-0.5)*50, y:(Math.random()-0.5)*50 }; aiCommitTimer = 30; }
                            else { aiState = 'RETREAT'; aiCommitTimer = 15; }
                        }
                        if (aiCommitTimer < 15) aiCommitTimer = 15;
                        if (aiState === 'CHASE') { aiTargetX = ball.x + aiTargetOffset.x; aiTargetY = ball.y + aiTargetOffset.y; }
                        else if (aiState === 'RETREAT') { aiTargetX = aiCfg.retreatDistance + (Math.random()-0.5)*40; aiTargetY = 300 + (Math.random()-0.5)*80; }
                        else { aiTargetX = activeBlue.x + (Math.random()-0.5)*60; aiTargetY = activeBlue.y + (Math.random()-0.5)*60; }
                        aiStateTimer = Math.floor(Math.random()*20) + aiCfg.stateSwitchCooldown;
                    }
                    if (aiCommitTimer > 0) aiCommitTimer -= dtFrames;
                    if (aiState === 'CHASE' || aiCommitTimer > 0 || isBallLoose) {
                        let dx = aiTargetX - activeBlue.x, dy = aiTargetY - activeBlue.y;
                        let distToTarget = Math.hypot(dx, dy);
                        if (distToTarget > 15) {
                            let moveSpeed = aiSpeed * (0.8 + Math.random()*0.3);
                            if (isBallLoose) moveSpeed *= 1.3;
                            if (aiState === 'CHASE' && aiCommitTimer > 20) moveSpeed *= 1.1;
                            if (distToTarget > 100) moveSpeed *= 1.2;
                            // BUGFIX: chaseAggressiveness was defined per-difficulty in ai.js
                            // (1.0 on EASY up to 2.0 on WORLD_CLASS) but never used anywhere —
                            // higher difficulties now close down loose balls noticeably harder.
                            if (aiState === 'CHASE' && isBallLoose) moveSpeed *= (0.7 + aiCfg.chaseAggressiveness * 0.3);
                            const desiredX = dx / distToTarget;
                            const desiredY = dy / distToTarget;
                            const smoothAlpha = Math.max(0.28, Math.min(0.52, 0.55 - aiCfg.movementSmoothness * 0.35));
                            activeBlue.aiDirX += (desiredX - activeBlue.aiDirX) * smoothAlpha;
                            activeBlue.aiDirY += (desiredY - activeBlue.aiDirY) * smoothAlpha;
                            const smoothedLen = Math.hypot(activeBlue.aiDirX, activeBlue.aiDirY) || 1;
                            activeBlue.aiDirX /= smoothedLen;
                            activeBlue.aiDirY /= smoothedLen;
                            nextX += activeBlue.aiDirX * moveSpeed;
                            nextY += activeBlue.aiDirY * moveSpeed;
                        }
                    } else {
                        let dx = aiTargetX - activeBlue.x, dy = aiTargetY - activeBlue.y;
                        let distToTarget = Math.hypot(dx, dy);
                        if (distToTarget > 20) {
                            const desiredX = dx / distToTarget;
                            const desiredY = dy / distToTarget;
                            const smoothAlpha = Math.max(0.28, Math.min(0.52, 0.55 - aiCfg.movementSmoothness * 0.35));
                            activeBlue.aiDirX += (desiredX - activeBlue.aiDirX) * smoothAlpha;
                            activeBlue.aiDirY += (desiredY - activeBlue.aiDirY) * smoothAlpha;
                            const smoothedLen = Math.hypot(activeBlue.aiDirX, activeBlue.aiDirY) || 1;
                            activeBlue.aiDirX /= smoothedLen;
                            activeBlue.aiDirY /= smoothedLen;
                            nextX += activeBlue.aiDirX * aiSpeed * 0.3;
                            nextY += activeBlue.aiDirY * aiSpeed * 0.3;
                        }
                    }
                }
            }
        }
        activeBlue.x = nextX; activeBlue.y = nextY;
        if (activeBlue.isGk) {
            activeBlue.x = Math.max(800+activeBlue.radius, Math.min(875-activeBlue.radius, activeBlue.x));
            activeBlue.y = Math.max(150+activeBlue.radius, Math.min(450-activeBlue.radius, activeBlue.y));
        } else {
            activeBlue.x = Math.max(25+activeBlue.radius, Math.min(875-activeBlue.radius, activeBlue.x));
            activeBlue.y = Math.max(activeBlue.radius, Math.min(GAME_H-activeBlue.radius, activeBlue.y));
            if (redGkHasBall) resolveBoxCollision(activeBlue, {minX:25, maxX:125, minY:150, maxY:450});
        }
    }

    if (ball.owner) {
        ball.x = ball.owner.x;
        ball.y = ball.owner.y;
        if (ball.owner.team === 'red') matchStats.possessionTimer.red += dt;
        else matchStats.possessionTimer.blue += dt;
        if (ball.owner.isGk) {
            gkTimer -= dtFrames;
            let gk = ball.owner;
            let canPass = gkTimer <= 300;
            if (!(gameMode === 'pve' && gk.team === 'blue')) arrowAngle += 0.08 * dtFrames;
            if (gkTimer <= 0) {
                if (gameMode === 'pve' && gk.team === 'blue') doAiGkPass(gk);
                else shootBall(gk, false);
            } else if (canPass) {
                if (gk.team === 'red' && keys.space) { shootBall(gk, false); keys.space = false; }
                else if (gk.team === 'blue') {
                    if (gameMode === '1v1' && keys.enter) { shootBall(gk, false); keys.enter = false; }
                    else if (gameMode === 'pve') { aiTimer += dtFrames; if (aiTimer > 50) { doAiGkPass(gk); aiTimer = 0; } }
                }
            }
        } else {
            if (!(gameMode === 'pve' && ball.owner.team === 'blue')) arrowAngle += 0.08 * dtFrames;
            if (ball.owner.team === 'red' && keys.space) {
                shootBall(ball.owner, true);
                keys.space = false;
            } else if (ball.owner.team === 'blue' && gameMode === '1v1' && keys.enter) {
                shootBall(ball.owner, true);
                keys.enter = false;
            }
        }
    } else {
        ball.x += ball.vx * dtFrames;
        ball.y += ball.vy * dtFrames;
        // Math.pow (not a plain *dtFrames scale) because this is a per-tick
        // multiplicative decay, not a linear one — exponentiating by dtFrames
        // is what keeps the total real-time deceleration rate the same
        // regardless of how many ticks it gets applied over. At dtFrames=1
        // (60fps) this reduces to exactly 0.985, same as before.
        ball.vx *= Math.pow(0.985, dtFrames);
        ball.vy *= Math.pow(0.985, dtFrames);
        if (Math.hypot(ball.vx, ball.vy) > 2) {
            ball.trail.push({x: ball.x, y: ball.y, life: 15});
            if (ball.trail.length > 20) ball.trail.shift();
        }
        ball.trail = ball.trail.filter(t => t.life > 0);
        for (let t of ball.trail) t.life -= dtFrames;
        if (Math.hypot(ball.vx, ball.vy) > 6 && Math.random() < 0.4) {
            particles.push({
                x: ball.x, y: ball.y,
                vx: (Math.random()-0.5)*2,
                vy: (Math.random()-0.5)*2,
                size: Math.random()*4+2,
                color: 'rgba(255,255,255,0.5)',
                rotation:0, vRot:0, life:15
            });
        }
        for (let post of posts) {
            let dist = Math.hypot(ball.x - post.x, ball.y - post.y);
            if (dist < ball.radius + post.radius) {
                let angle = Math.atan2(ball.y - post.y, ball.x - post.x);
                let speed = Math.max(4, Math.hypot(ball.vx, ball.vy));
                ball.vx = Math.cos(angle)*speed;
                ball.vy = Math.sin(angle)*speed;
                let overlap = (ball.radius + post.radius) - dist + 1;
                ball.x += Math.cos(angle)*overlap;
                ball.y += Math.sin(angle)*overlap;
                SoundManager.playSFX('kick', 0.3);
            }
        }
        if (ball.y <= ball.radius) { ball.y = ball.radius; ball.vy *= -1; }
        else if (ball.y >= GAME_H - ball.radius) { ball.y = GAME_H - ball.radius; ball.vy *= -1; }

        if (ball.x - ball.radius <= 25) {
            if (ball.y >= 200 && ball.y <= 400) {
                if (ball.y - ball.radius <= 200) { ball.y = 200 + ball.radius; ball.vy *= -1; }
                else if (ball.y + ball.radius >= 400) { ball.y = 400 - ball.radius; ball.vy *= -1; }
                // BUGFIX: this used to require the ball to reach x<=5 (deep past the
                // drawn goal line at x=25 and the goal posts) before counting a goal.
                // There's no net mesh drawn to justify that extra 20px of travel, so
                // the ball would visibly cross the line, keep going toward the canvas
                // edge, and could bounce off a post or get squeezed against the edge
                // before ever registering — goals felt delayed or occasionally never
                // triggered. Now it scores right at the line, matching the pitch
                // stroke/posts the player actually sees.
                if (ball.x - ball.radius <= 25) {
                    score.blue++;
                    let scorerName = 'BLUE TEAM SCORES!';
                    let scorerTeam = null;
                    if (tournamentMode && tournamentPendingMatch) {
                        const match = tournamentPendingMatch;
                        const teamA = match.teamA;
                        const teamB = match.teamB;
                        const playerTeamId = tournamentSelectedTeam;
                        if (teamA && teamB) {
                            let blueTeam = (teamB.id === playerTeamId) ? teamB : teamA;
                            if (teamA.id === playerTeamId) blueTeam = teamB;
                            else if (teamB.id === playerTeamId) blueTeam = teamA;
                            scorerTeam = blueTeam;
                            scorerName = blueTeam.name + ' SCORES!';
                        }
                    }
                    triggerGoal(scorerName, 'red', 25, ball.y, scorerTeam);
                    currentState = 'GOAL_SCORED';
                    goalBannerTimer = 0;
                    return;
                }
            } else { ball.x = 25 + ball.radius; ball.vx *= -1; }
        }
        if (ball.x + ball.radius >= 875) {
            if (ball.y >= 200 && ball.y <= 400) {
                if (ball.y - ball.radius <= 200) { ball.y = 200 + ball.radius; ball.vy *= -1; }
                else if (ball.y + ball.radius >= 400) { ball.y = 400 - ball.radius; ball.vy *= -1; }
                // BUGFIX: see matching note on the blue goal above — was 895, now
                // scores right at the drawn goal line (x=875) instead of 20px deeper.
                if (ball.x + ball.radius >= 875) {
                    score.red++;
                    let scorerName = 'RED TEAM SCORES!';
                    let scorerTeam = null;
                    if (tournamentMode && tournamentPendingMatch) {
                        const match = tournamentPendingMatch;
                        const teamA = match.teamA;
                        const teamB = match.teamB;
                        const playerTeamId = tournamentSelectedTeam;
                        if (teamA && teamB) {
                            let redTeam = (teamA.id === playerTeamId) ? teamA : teamB;
                            if (teamA.id === playerTeamId) redTeam = teamA;
                            else if (teamB.id === playerTeamId) redTeam = teamB;
                            scorerTeam = redTeam;
                            scorerName = redTeam.name + ' SCORES!';
                        }
                    }
                    triggerGoal(scorerName, 'blue', 875, ball.y, scorerTeam);
                    currentState = 'GOAL_SCORED';
                    goalBannerTimer = 0;
                    return;
                }
            } else { ball.x = 875 - ball.radius; ball.vx *= -1; }
        }

        for (let p of players) {
            if (p.ejecting || ball.cooldownPlayer === p) continue;
            let dist = Math.hypot(p.x - ball.x, p.y - ball.y);
            if (dist < p.radius + ball.radius) {
                const prevOwner = ball.cooldownPlayer;
                const isPass = prevOwner && prevOwner !== p && prevOwner.team === p.team;
                window._gkStealInProgress = p.isGk && prevOwner && prevOwner.team !== p.team;
                ball.owner = p;
                ball.vx = 0; ball.vy = 0;
                ball.trail = [];
                if (p.isGk) {
                    // ===== BUGFIX: was always 360 frames regardless of difficulty.
                    // The AI blue GK now holds for gkHoldTime from the active
                    // difficulty config (e.g. WORLD_CLASS releases faster at 320
                    // vs EASY's 360), matching ai.js's intent. The human red GK
                    // always gets the full 360 since the player controls release
                    // via the shoot key anyway.
                    gkTimer = (gameMode === 'pve' && p.team === 'blue') ? getAIConfigByDifficulty(difficulty).gkHoldTime : 360;
                    if (prevOwner && prevOwner.team !== p.team) {
                        let shooter = prevOwner;
                        let target = null;
                        if (p.team === 'blue' && shooter.x > 775 && shooter.y > 150 && shooter.y < 450) {
                            target = getEjectTarget(shooter, {minX:775, maxX:875, minY:150, maxY:450});
                        } else if (p.team === 'red' && shooter.x < 125 && shooter.y > 150 && shooter.y < 450) {
                            target = getEjectTarget(shooter, {minX:25, maxX:125, minY:150, maxY:450});
                        }
                        if (target) { shooter.ejecting = true; shooter.ejectTargetX = target.x; shooter.ejectTargetY = target.y; }
                        if (p.team === 'red') matchStats.gkSaves.red++;
                        else matchStats.gkSaves.blue++;
                    }
                } else {
                    if (isPass && p.team === 'red') { matchStats.passes.red++; }
                    else if (isPass && p.team === 'blue') { matchStats.passes.blue++; }
                }
                if (!(gameMode === 'pve' && p.team === 'blue')) arrowAngle = 0;
                ball.cooldownPlayer = null;
                setTimeout(() => { window._gkStealInProgress = false; }, 50);
                break;
            }
        }
    }

    if (ball.owner && !ball.owner.isGk) {
        let gkClaimed = false;
        let opponentGk = players.find(p => p.isGk && p.team !== ball.owner.team);
        if (opponentGk) {
            let dist = Math.hypot(ball.owner.x - opponentGk.x, ball.owner.y - opponentGk.y);
            if (dist < ball.owner.radius + opponentGk.radius + 2) {
                window._gkStealInProgress = true;
                let offender = ball.owner;
                ball.owner = opponentGk;
                // Same difficulty-aware gkHoldTime fix as above.
                gkTimer = (gameMode === 'pve' && opponentGk.team === 'blue') ? getAIConfigByDifficulty(difficulty).gkHoldTime : 360;
                ball.trail = [];
                let target = null;
                if (opponentGk.team === 'blue') target = getEjectTarget(offender, {minX:775, maxX:875, minY:150, maxY:450});
                else target = getEjectTarget(offender, {minX:25, maxX:125, minY:150, maxY:450});
                offender.ejecting = true;
                offender.ejectTargetX = target.x;
                offender.ejectTargetY = target.y;
                gkClaimed = true;
                if (opponentGk.team === 'red') matchStats.gkSaves.red++;
                else matchStats.gkSaves.blue++;
                setTimeout(() => { window._gkStealInProgress = false; }, 50);
            }
        }
        if (!gkClaimed) {
            let defender = ball.owner.team === 'red' ? getActivePlayer('blue') : getActivePlayer('red');
            if (defender && !defender.ejecting) {
                let dist = Math.hypot(ball.owner.x - defender.x, ball.owner.y - defender.y);
                if (dist < ball.owner.radius + defender.radius + 2) {
                    let tackler = ball.owner;
                    ball.owner = null;
                    let tackleAngle = Math.atan2(defender.y - ball.y, defender.x - ball.x) + Math.PI;
                    ball.vx = Math.cos(tackleAngle) * 9;
                    ball.vy = Math.sin(tackleAngle) * 9;
                    ball.cooldownPlayer = tackler;
                    ball.cooldownTimer = 15;
                    // BUGFIX: was hardcoded 20 — now scales with difficulty's reactionDelay.
                    aiReactionTimer = getAIConfigByDifficulty(difficulty).reactionDelay;
                    SoundManager.playSFX('kick', 0.6);
                    matchStats.tackles[defender.team]++;
                }
            }
        }
    }

    const totalTime = matchStats.possessionTimer.red + matchStats.possessionTimer.blue;
    if (totalTime > 0) {
        matchStats.possession.red = matchStats.possessionTimer.red / totalTime;
        matchStats.possession.blue = matchStats.possessionTimer.blue / totalTime;
    }
}

function shootBall(passer, countsAsShot = false) {
    if (!window._gkStealInProgress) SoundManager.playSFX('kick', 0.8);
    const spawnDist = passer.radius + ball.radius + 6;
    ball.x = passer.x + Math.cos(arrowAngle) * spawnDist;
    ball.y = passer.y + Math.sin(arrowAngle) * spawnDist;
    const power = 13;
    ball.vx = Math.cos(arrowAngle) * power;
    ball.vy = Math.sin(arrowAngle) * power;
    ball.cooldownPlayer = passer;
    ball.cooldownTimer = 20;
    ball.owner = null;
    ball.trail = [];
    // Stats integrity: shootBall() is also the shared path for passes and goalkeeper
    // clearances, so only explicit attacking attempts count as shots.
    if (countsAsShot && passer && passer.team && matchStats && matchStats.shots) {
        matchStats.shots[passer.team]++;
    }
    if (passer.isGk) gkTimer = 0;
    // BUGFIX: was hardcoded 20 — now scales with difficulty's reactionDelay.
    aiReactionTimer = getAIConfigByDifficulty(difficulty).reactionDelay;
}

function doAiGkPass(gk) {
    if (Math.random() < 0.50) {
        let teammates = players.filter(p => p.team === gk.team && !p.isGk);
        let target = teammates[Math.floor(Math.random() * teammates.length)];
        if (target) arrowAngle = Math.atan2(target.y - gk.y, target.x - gk.x);
        else arrowAngle = Math.atan2((Math.random()-0.5), -1);
    } else arrowAngle = Math.atan2((Math.random()-0.5), -1);
    shootBall(gk, false);
}

function updateOverallStats(diff, winner) {
    const stats = overallStats[diff];
    if (!stats) return;
    stats.matches++;
    // BUGFIX: the human is ALWAYS red in VS Computer (blue is the computer).
    // These used to pick a side based on who won, so after a LOSS the computer's
    // goals were counted as "Goals For", the "Worst Loss" score came out reversed
    // (and never updated to a worse loss), and possession / passes / saves were
    // read from the computer's side. Always read the human's (red) side instead.
    const playerGoals = score.red;
    const opponentGoals = score.blue;
    stats.goalsScored += playerGoals;
    stats.goalsConceded += opponentGoals;
    const goalDiff = playerGoals - opponentGoals;
    if (winner === 'RED') {
        if (goalDiff > stats.bestWinDiff || (goalDiff === stats.bestWinDiff && playerGoals > stats.bestWinGoals)) {
            stats.bestWinDiff = goalDiff;
            stats.bestWinScore = `${playerGoals} - ${opponentGoals}`;
            stats.bestWinGoals = playerGoals;
        }
    }
    if (winner === 'BLUE') {
        if (goalDiff < stats.worstDefeatDiff || (goalDiff === stats.worstDefeatDiff && opponentGoals > stats.worstDefeatGoalsConceded)) {
            stats.worstDefeatDiff = goalDiff;
            stats.worstDefeatScore = `${playerGoals} - ${opponentGoals}`;
            stats.worstDefeatGoalsConceded = opponentGoals;
        }
    }
    stats.possessionTotal += matchStats.possession.red;
    stats.passesTotal += matchStats.passes.red;
    // "Opp GK Saves" = saves made by the computer's goalkeeper (blue) against you
    stats.gkSavesTotal += matchStats.gkSaves.blue;
}

function updateRank() {
    const thresholds = [0, 50, 150, 300, 500];
    let newRank = 'Bronze';
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (rankPoints >= thresholds[i]) { newRank = ranks[i]; break; }
    }
    currentRank = newRank;
}

// CrazyGames (and analytics on other portals) need to know when the player is
// actually playing. PlatformSDK.onGameplayStart/Stop existed but nothing ever
// called them. Live play = an unpaused match that is not in halftime, a goal
// celebration, a result screen, or an ad.
let _gameplayActive = false;
function syncGameplayPing() {
    const adBusy = typeof AdManager !== 'undefined' && AdManager.isAdRequestInFlight();
    const active = (currentState === 'PLAY' && matchState === 'PLAY' || currentState === 'PENALTY_SHOOTOUT') && !adBusy;
    if (active === _gameplayActive) return;
    _gameplayActive = active;
    try { if (active) PlatformSDK.onGameplayStart(); else PlatformSDK.onGameplayStop(); } catch (e) {}
}

let lastTime = 0;
let _lastLoopState = null;
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;
    if (currentState !== _lastLoopState) {
        // 0.7s input lock when a result screen opens (stops accidental skips)
        if (currentState === 'MATCH_END' || currentState === 'TOURNAMENT_RESULT') {
            window._inputLockUntil = performance.now() + 700;
        }
        _lastLoopState = currentState;
    }
    // A throw inside update() used to abort gameLoop before requestAnimationFrame
    // was re-armed, freezing the whole game for good. Log it and keep running.
    try { update(dt); } catch (err) {
        if (!window._updateErrLogged) { window._updateErrLogged = true; console.error('[ProStriker] update() error (loop kept alive):', err); }
    }
    draw();
    try { syncGameplayPing(); } catch (e) {}
    // Cheap per-frame safety net: guarantees the joystick/shoot controls can
    // never stay stuck on screen for more than one frame after leaving a
    // match, even if some future code path forgets to call updateTouchUI()
    // after changing currentState (see updateTouchUI in input.js for the
    // full explanation — this was exactly the "buttons stuck after a vs-
    // Computer match" bug).
    if (typeof syncTouchControlsVisibility === 'function') syncTouchControlsVisibility();
    requestAnimationFrame(gameLoop);
}

function bootstrap() {
    if (gameRunning) return;
    try {
        console.log('[ProStriker] Bootstrapping...');
        initSoundOnInteraction();
        const depsReady = typeof initMatch === 'function' && typeof updateTouchUI === 'function';
        if (!depsReady) { setTimeout(bootstrap, 50); return; }
        initMatch();
        updateTouchUI();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        gameRunning = true;
        console.log('[ProStriker] Pro Striker ULTIMATE EDITION loaded!');

        // Platform/ad SDK detection runs in parallel with gameplay starting
        // — it must never block the first frame or the loading screen.
        // Ad-related UI (see AdManager/renderer ad-offer code) simply
        // stays hidden/inert until this resolves, exactly like any other
        // async asset that isn't ready yet.
        if (typeof PlatformSDK !== 'undefined') {
            PlatformSDK.init()
                .then(() => { if (typeof CloudSync !== 'undefined') CloudSync.trySwitchToCloud(); })
                .catch(e => console.error('[ProStriker] PlatformSDK init failed:', e));
        }
    } catch(e) { console.error('[ProStriker] Bootstrap error:', e); }
}

window.bootstrap = bootstrap;

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => { if (typeof window.bootstrap === 'function') window.bootstrap(); }, 0);
} else {
    window.addEventListener('load', () => { if (typeof window.bootstrap === 'function') window.bootstrap(); });
}