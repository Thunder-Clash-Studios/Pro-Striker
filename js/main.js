// ===== PRO STRIKER - main.js =====
console.log('[ProStriker] main.js loaded - ULTIMATE EDITION WITH TOURNAMENT');

let gameRunning = false;
let celebrationTimer = 0;
let isCelebrating = false;

function triggerGoal(bannerText, concedingTeam, goalX, goalY) {
    try {
        lastScorer = bannerText || '';
        if (concedingTeam === 'red') matchStats.shots.blue++;
        else matchStats.shots.red++;
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

function updateCelebration() {
    for (let i = celebrationParticles.length - 1; i >= 0; i--) {
        const p = celebrationParticles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99; p.vy *= 0.99;
        p.rotation += p.vRot;
        p.life--;
        if (p.y > 580) { p.y = 580; p.vy *= -p.bounce; p.vx *= 0.95; }
        if (p.life <= 0 || p.y < -50) celebrationParticles.splice(i, 1);
    }
}

function createPlayers(teamAId, teamBId) {
    players = [];
    const create = (id, team, x, y, isGk, num, col, gradCol, teamId) => ({
        id, team, x, y, radius: 16,
        color: col, gradColor: gradCol,
        isGk, num,
        teamId: teamId || null,
        ejecting: false, ejectTargetX: 0, ejectTargetY: 0,
        stamina: 1.0,
        celebration: false,
        celebrationTimer: 0
    });

    if (tournamentMode && teamAId !== undefined && teamBId !== undefined && teamAId !== null && teamBId !== null) {
        const teamA = TOURNAMENT_TEAMS.find(t => t.id === teamAId);
        const teamB = TOURNAMENT_TEAMS.find(t => t.id === teamBId);
        if (teamA && teamB) {
            const darkA = darkenColor(teamA.color);
            const darkB = darkenColor(teamB.color);
            players.push(create(0,'red',50,300,true,'1', teamA.color, darkA, teamA.id));
            players.push(create(1,'red',250,150,false,'7', teamA.color, darkA, teamA.id));
            players.push(create(2,'red',250,450,false,'9', teamA.color, darkA, teamA.id));
            players.push(create(3,'red',380,300,false,'10', teamA.color, darkA, teamA.id));
            players.push(create(4,'blue',850,300,true,'1', teamB.color, darkB, teamB.id));
            players.push(create(5,'blue',650,150,false,'8', teamB.color, darkB, teamB.id));
            players.push(create(6,'blue',650,450,false,'11', teamB.color, darkB, teamB.id));
            players.push(create(7,'blue',520,300,false,'10', teamB.color, darkB, teamB.id));
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
    window._extraTimeActive = false;
    window._extraTimeCount = 0;

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

function update(dt) {
    if (currentState === 'PAUSED') return;
   
    const ai = getAIConfigByDifficulty(difficulty);
   
    updateParticles();
    updateCelebration();
    if (screenShake.duration > 0) {
        screenShake.duration--;
        let damp = screenShake.duration / 32;
        screenShake.x = (Math.random()-0.5)*screenShake.intensity*damp;
        screenShake.y = (Math.random()-0.5)*screenShake.intensity*damp;
    } else { screenShake.x = 0; screenShake.y = 0; }
    if (goalZoomScale > 1.0) goalZoomScale += (1.0 - goalZoomScale)*0.16;

    // ===== TOURNAMENT MATCH END =====
    if (currentState === 'MATCH_END' && tournamentMode && tournamentPendingMatch) {
        const pending = tournamentPendingMatch;
        const isGroup = pending.type === 'group';
        const playerTeamId = tournamentSelectedTeam;
        const teamAId = pending.teamA.id;
        const teamBId = pending.teamB.id;
        let teamAScore, teamBScore;

        if (playerTeamId === teamAId) {
            teamAScore = score.red;
            teamBScore = score.blue;
        } else {
            teamAScore = score.blue;
            teamBScore = score.red;
        }

        TournamentManager.recordPlayerMatchResult(
            pending.uid,
            teamAScore,
            teamBScore,
            isGroup,
            isGroup ? pending.groupId : null,
            isGroup ? null : (pending.roundIndex !== undefined ? pending.roundIndex : pending.round)
        );

        tournamentPendingMatch = null;
        currentState = 'TOURNAMENT_RESULT';
        // BUGFIX: this transition out of PLAY happens inside the game loop
        // (update()), not from an input.js click/key handler, so it never
        // used to call updateTouchUI(). That left the joystick/shoot touch
        // controls from the just-finished match visibly stuck on screen
        // over the tournament result screen. Every other state exit already
        // goes through a handler that calls updateTouchUI() — this was the
        // one gap.
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
                const isExtraTimeActive = window._extraTimeActive || false;
                const extraTimeCount = window._extraTimeCount || 0;

                if (isKnockout && isDraw) {
                    // ===== EXTRA TIME – ADD ANOTHER 45 SECONDS =====
                    console.log(`[Match] Extra time period #${extraTimeCount + 1}: 45 seconds added.`);
                    SoundManager.playSFX('whistleStart', 0.7);
                    matchClock = 45;
                    kickoffDelay = 0.5;
                    nextKickoffTeam = (kickoffTeam === 'red') ? 'blue' : 'red';
                    resetField();
                    SoundManager.resumeCrowd();
                    window._extraTimeActive = true;
                    window._extraTimeCount = (extraTimeCount || 0) + 1;
                    return;
                }

                // If it's not a knockout, or not a draw → normal match end
                window._extraTimeActive = false;
                window._extraTimeCount = 0;
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
        const playerTeamId = tournamentSelectedTeam;
        const teamAId = tournamentPendingMatch.teamA.id;
        // If player is team A and red score > blue score, OR player is team B and blue score > red score
        if (playerTeamId === teamAId) {
            playerWon = (score.red > score.blue);
        } else {
            playerWon = (score.blue > score.red);
        }
    } else {
        playerWon = (winner === 'RED');
    }
    if (playerWon) {
        SoundManager.playMusic('victory');
    } else {
        SoundManager.playMusic('defeat');
    }
} else {
    SoundManager.playMusic('victory');
}
               
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
                    winnerText = `⚽ ${score.red} - ${score.blue}`;
                } else {
                    if (score.red > score.blue) winnerText = '🏆 RED TEAM WINS!';
                    else if (score.blue > score.red) winnerText = '🏆 BLUE TEAM WINS!';
                    else winnerText = '🤝 DRAW!';
                }
                lastScorer = winnerText;
               
                if (winner === 'RED' && !tournamentMode) {
                    matchStats.winStreak++;
                    rankPoints += 10;
                } else if (winner === 'BLUE' && !tournamentMode) {
                    matchStats.winStreak = 0;
                    rankPoints = Math.max(0, rankPoints - 5);
                } else {
                    matchStats.winStreak = 0;
                }
                matchStats.totalMatches++;
                updateRank();
                return;
            }
        }
    }

    // Locks
    if (activeLocks.red.timer > 0) activeLocks.red.timer--;
    if (activeLocks.blue.timer > 0) activeLocks.blue.timer--;

    // Ejecting players
    for (let p of players) {
        if (p.ejecting) {
            let dx = p.ejectTargetX - p.x, dy = p.ejectTargetY - p.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 5) { p.x = p.ejectTargetX; p.y = p.ejectTargetY; p.ejecting = false; }
            else { let speed = 5 + dist*0.05; if (speed>8) speed=8; p.x += (dx/dist)*speed; p.y += (dy/dist)*speed; }
        }
        if (!keys.Shift) p.stamina = Math.min(1, p.stamina + 0.002);
    }

    if (ball.cooldownTimer > 0) { ball.cooldownTimer--; if (ball.cooldownTimer <= 0) ball.cooldownPlayer = null; }
    if (aiStartDelay > 0) aiStartDelay--;
    if (aiReactionTimer > 0) aiReactionTimer--;
    if (aiPassCooldown > 0) aiPassCooldown--;

    // GK movement
    for (let p of players) {
        if (p.isGk && ball.owner !== p) {
            if (p.team === 'red') {
                p.y += gkSpeed * gkDirection.red;
                if (p.y <= 210) { p.y = 210; gkDirection.red = 1; }
                else if (p.y >= 390) { p.y = 390; gkDirection.red = -1; }
                p.x = 50;
            } else {
                p.y += gkSpeed * gkDirection.blue;
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
        let speed = playerSpeed * (0.7 + 0.3 * activeRed.stamina);
        if (keys.Shift) { speed *= 1.5; activeRed.stamina -= 0.004; if (activeRed.stamina < 0) activeRed.stamina = 0; }
        if (keys.w) nextY -= speed;
        if (keys.s) nextY += speed;
        if (keys.a) nextX -= speed;
        if (keys.d) nextX += speed;
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
            let speed = playerSpeed * (0.7 + 0.3 * activeBlue.stamina);
            if (keys.Shift) { speed *= 1.5; activeBlue.stamina -= 0.004; if (activeBlue.stamina < 0) activeBlue.stamina = 0; }
            if (keys.ArrowUp) nextY -= speed;
            if (keys.ArrowDown) nextY += speed;
            if (keys.ArrowLeft) nextX -= speed;
            if (keys.ArrowRight) nextX += speed;
        } else {
            if (aiReactionTimer <= 0 && aiStartDelay <= 0) {
                let aiCfg = getAIConfigByDifficulty(difficulty);
                let aiSpeed = playerSpeed * aiCfg.speedMultiplier * (0.7 + 0.3 * activeBlue.stamina);
                if (ball.owner === activeBlue) {
                    aiHoldBallTimer++;
                    aiDribbleTime += 0.04;
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
                            shootBall(activeBlue);
                            aiPassCooldown = aiCfg.passCooldown;
                        }
                    }
                    let forcePanicShot = (isCloseToGoal && aiHoldBallTimer > aiCfg.panicTimer);
                    if ((forcePanicShot || (isCloseToGoal && Math.random() < 0.03)) && ball.owner === activeBlue) {
                        if (Math.random() < (1 - aiCfg.perfectShotRate)) arrowAngle += Math.random()>0.5 ? aiCfg.missError : -aiCfg.missError;
                        shootBall(activeBlue);
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
                    if (aiCommitTimer > 0) aiCommitTimer--;
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
                            nextX += (dx/distToTarget)*moveSpeed;
                            nextY += (dy/distToTarget)*moveSpeed;
                        }
                    } else {
                        let dx = aiTargetX - activeBlue.x, dy = aiTargetY - activeBlue.y;
                        let distToTarget = Math.hypot(dx, dy);
                        if (distToTarget > 20) {
                            nextX += (dx/distToTarget)*aiSpeed*0.3;
                            nextY += (dy/distToTarget)*aiSpeed*0.3;
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
            gkTimer--;
            let gk = ball.owner;
            let canPass = gkTimer <= 300;
            if (!(gameMode === 'pve' && gk.team === 'blue')) arrowAngle += 0.08;
            if (gkTimer <= 0) {
                if (gameMode === 'pve' && gk.team === 'blue') doAiGkPass(gk);
                else shootBall(gk);
            } else if (canPass) {
                if (gk.team === 'red' && keys.space) { shootBall(gk); keys.space = false; }
                else if (gk.team === 'blue') {
                    if (gameMode === '1v1' && keys.enter) { shootBall(gk); keys.enter = false; }
                    else if (gameMode === 'pve') { aiTimer++; if (aiTimer > 50) { doAiGkPass(gk); aiTimer = 0; } }
                }
            }
        } else {
            if (!(gameMode === 'pve' && ball.owner.team === 'blue')) arrowAngle += 0.08;
            if (ball.owner.team === 'red' && keys.space) {
                shootBall(ball.owner);
                keys.space = false;
            } else if (ball.owner.team === 'blue' && gameMode === '1v1' && keys.enter) {
                shootBall(ball.owner);
                keys.enter = false;
            }
        }
    } else {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.985;
        ball.vy *= 0.985;
        if (Math.hypot(ball.vx, ball.vy) > 2) {
            ball.trail.push({x: ball.x, y: ball.y, life: 15});
            if (ball.trail.length > 20) ball.trail.shift();
        }
        ball.trail = ball.trail.filter(t => t.life > 0);
        for (let t of ball.trail) t.life--;
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
                    if (tournamentMode && tournamentPendingMatch) {
                        const match = tournamentPendingMatch;
                        const teamA = match.teamA;
                        const teamB = match.teamB;
                        const playerTeamId = tournamentSelectedTeam;
                        if (teamA && teamB) {
                            let blueTeam = (teamB.id === playerTeamId) ? teamB : teamA;
                            if (teamA.id === playerTeamId) blueTeam = teamB;
                            else if (teamB.id === playerTeamId) blueTeam = teamA;
                            scorerName = blueTeam.flag + ' ' + blueTeam.name + ' SCORES!';
                        }
                    }
                    triggerGoal(scorerName, 'red', 25, ball.y);
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
                    if (tournamentMode && tournamentPendingMatch) {
                        const match = tournamentPendingMatch;
                        const teamA = match.teamA;
                        const teamB = match.teamB;
                        const playerTeamId = tournamentSelectedTeam;
                        if (teamA && teamB) {
                            let redTeam = (teamA.id === playerTeamId) ? teamA : teamB;
                            if (teamA.id === playerTeamId) redTeam = teamA;
                            else if (teamB.id === playerTeamId) redTeam = teamB;
                            scorerName = redTeam.flag + ' ' + redTeam.name + ' SCORES!';
                        }
                    }
                    triggerGoal(scorerName, 'blue', 875, ball.y);
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

function shootBall(passer) {
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
    shootBall(gk);
}

function updateOverallStats(diff, winner) {
    const stats = overallStats[diff];
    if (!stats) return;
    stats.matches++;
    const playerGoals = (winner === 'RED') ? score.red : score.blue;
    const opponentGoals = (winner === 'RED') ? score.blue : score.red;
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
    const poss = (winner === 'RED') ? matchStats.possession.red : matchStats.possession.blue;
    stats.possessionTotal += poss;
    const passes = (winner === 'RED') ? matchStats.passes.red : matchStats.passes.blue;
    stats.passesTotal += passes;
    const oppGkSaves = (winner === 'RED') ? matchStats.gkSaves.blue : matchStats.gkSaves.red;
    stats.gkSavesTotal += oppGkSaves;
}

function updateRank() {
    const thresholds = [0, 50, 150, 300, 500];
    let newRank = 'Bronze';
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (rankPoints >= thresholds[i]) { newRank = ranks[i]; break; }
    }
    currentRank = newRank;
}

let lastTime = 0;
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;
    update(dt);
    draw();
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
    } catch(e) { console.error('[ProStriker] Bootstrap error:', e); }
}

window.bootstrap = bootstrap;

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => { if (typeof window.bootstrap === 'function') window.bootstrap(); }, 0);
} else {
    window.addEventListener('load', () => { if (typeof window.bootstrap === 'function') window.bootstrap(); });
}
