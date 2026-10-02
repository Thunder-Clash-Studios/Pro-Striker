// ===== PRO STRIKER - tutorial.js =====
// A guided, unfailable 7-step tutorial that runs on the real pitch using the
// same players/ball/render primitives as a normal match (drawPitch,
// drawPlayerToken, drawMatchBall, drawGoalStructures, getActivePlayer) so it
// looks and feels exactly like the real game — just with the AI frozen/
// simplified per step and no scoring/clock/rank attached.
//
// Reached two ways, both always available (no forced first-launch popup):
//   - "TUTORIAL" row on the main menu (see menu.js) — every time, no gating.
//   - Completing it once pays a one-time +500 coins via Shop._grant(), same
//     reward-breakdown path as any other payout. Replaying afterward (for
//     practice) still runs the full 7 steps but pays nothing — this is
//     called out explicitly on the completion screen so it never reads as
//     a bug.
console.log('[ProStriker] tutorial.js loaded');

const TUTORIAL_SEEN_KEY = 'prostriker_tutorialSeen_v1';
const TUTORIAL_REWARD_KEY = 'prostriker_tutorialRewardClaimed_v1';
const TUTORIAL_REWARD_COINS = 500;
const TUTORIAL_ACCENT = '#1fd15c';

const TutorialManager = {
    stepIndex: 0,
    stepTimer: 0,        // frames spent on the current step (60fps-equivalent)
    stepDone: false,      // objective met — short celebratory pause before advancing
    stepDoneTimer: 0,
    justClaimedReward: false,
    _bonusActive: false,
    _activeDisplay: null, // the player to highlight as "YOU" this frame — set once in update(), read in draw(). Never call getActivePlayer() from draw(): it has side effects (activeLocks) and must only run once per frame.
    _retryPromptShown: false, // true while the "TACKLED! Retry?" prompt is up — pauses the step's own update() until the player picks Retry or Keep Playing.
    _retryPromptDelay: 0,
    _stepCompleteDelay: 75,

    // ---------- persistence ----------
    hasSeenTutorial() {
        try { return CloudSync.getItem(TUTORIAL_SEEN_KEY) === '1'; } catch (e) { return false; }
    },
    markSeen() {
        try { CloudSync.setItem(TUTORIAL_SEEN_KEY, '1'); } catch (e) {}
    },
    rewardClaimed() {
        try { return CloudSync.getItem(TUTORIAL_REWARD_KEY) === '1'; } catch (e) { return false; }
    },
    markRewardClaimed() {
        try { CloudSync.setItem(TUTORIAL_REWARD_KEY, '1'); } catch (e) {}
    },

    // ---------- lifecycle ----------
    start(fromBonus) {
        initSoundOnInteraction();
        this.stepIndex = fromBonus ? 6 : 0;
        this._bonusActive = !!fromBonus;
        this.stepDone = false;
        this.stepDoneTimer = 0;
        this.justClaimedReward = false;
        currentState = 'TUTORIAL';
        this._enterStep(this.stepIndex);
        updateTouchUI();
        SoundManager.updateMusicForState('PLAY');
    },

    exitToMenu() {
        currentState = 'MENU';
        updateTouchUI();
    },

    skipStep() {
        SoundManager.playSFX('menuClick');
        this._advance();
    },

    skipTutorial() {
        SoundManager.playSFX('menuClick');
        this.markSeen();
        this.exitToMenu();
    },

    // ---------- steps ----------
    // Each step is a scaled-down mini-scenario on the real pitch. Only ONE
    // side (red, human-controlled) can act; the opponent (if present) is
    // slow-moving or frozen, so a step can be completed but never failed —
    // matches the spec's "cannot be failed, only completed".
    get STEPS() {
        return [
            {
                id: 'movement',
                title: 'MOVEMENT',
                instruction: isMobileDevice ? 'Drag the joystick to reach the glowing zone' : 'Press WASD to reach the glowing zone',
                setup: () => {
                    players = [];
                    players.push(this._mk(0, 'red', 200, 300, false, '7'));
                    ball.owner = null; ball.x = -1000; ball.y = -1000; ball.vx = 0; ball.vy = 0;
                    this._zone = { x: 700, y: 300, r: 46 };
                },
                update: () => {
                    const p = players[0];
                    this._moveHuman(p, 3.0);
                    this._activeDisplay = p;
                    const dist = Math.hypot(p.x - this._zone.x, p.y - this._zone.y);
                    return dist < this._zone.r;
                },
                draw: () => {
                    this._drawZone(this._zone.x, this._zone.y, this._zone.r);
                }
            },
            {
                id: 'passing',
                title: 'PASSING',
                instruction: isMobileDevice ? 'Move close, then aim and tap SHOOT to pass to the glowing teammate' : 'Hold the ball to aim, then press SPACE to pass to the glowing teammate',
                setup: () => {
                    players = [];
                    players.push(this._mk(0, 'red', 200, 300, false, '7'));
                    players.push(this._mk(1, 'red', 550, 300, false, '9'));
                    ball.owner = players[0]; ball.vx = 0; ball.vy = 0; ball.trail = [];
                    // Start aimed roughly at the teammate so the sweep begins somewhere
                    // reasonable, but from here on the player times the shot themselves —
                    // same continuous sweep + SPACE-to-fire as a real match, not an
                    // auto-aimed pass.
                    arrowAngle = Math.atan2(players[1].y - players[0].y, players[1].x - players[0].x);
                },
                update: () => {
                    const p = players[0];
                    this._moveHuman(p, 2.6);
                    this._activeDisplay = p;
                    if (ball.owner === p) {
                        ball.x = p.x; ball.y = p.y;
                        arrowAngle += 0.08 * this._dtFrames; // same sweep rate as a real match
                        if (keys.space) { shootTutorialBall(p); keys.space = false; }
                    } else if (!ball.owner) {
                        this._simpleBallFlight();
                        this._checkReceive(players[1]);
                        this._checkReclaim(p);
                    }
                    return ball.owner === players[1];
                },
                draw: () => {
                    this._drawGlowRing(players[1]);
                    this._drawAimArrow();
                }
            },
            {
                id: 'shooting',
                title: 'SHOOTING',
                instruction: isMobileDevice ? 'Get close to goal, aim, and tap SHOOT to score' : 'Get close to goal, aim with the sweeping arrow, and press SPACE to shoot',
                setup: () => {
                    players = [];
                    players.push(this._mk(0, 'red', 620, 300, false, '10'));
                    ball.owner = players[0]; ball.vx = 0; ball.vy = 0; ball.trail = [];
                    arrowAngle = 0; // straight at goal to start
                },
                update: () => {
                    const p = players[0];
                    this._moveHuman(p, 2.6);
                    this._activeDisplay = p;
                    if (ball.owner === p) {
                        ball.x = p.x; ball.y = p.y;
                        arrowAngle += 0.08 * this._dtFrames;
                        if (keys.space) { shootTutorialBall(p); keys.space = false; }
                    } else if (!ball.owner) {
                        this._simpleBallFlight();
                        if (ball.x + ball.radius >= 875 && ball.y > 200 && ball.y < 400) return true;
                        this._checkReclaim(p);
                    }
                    return false;
                },
                draw: () => {
                    this._drawAimArrow();
                }
            },
            {
                id: 'switching',
                title: 'PLAYER SWITCHING',
                instruction: 'Move away from the ball; your closer teammate takes control. Then move them a little.',
                setup: () => {
                    players = [];
                    players.push(this._mk(0, 'red', 250, 300, false, '7'));
                    players.push(this._mk(1, 'red', 500, 300, false, '5'));
                    ball.owner = null; ball.x = 350; ball.y = 300; ball.vx = 0; ball.vy = 0; ball.trail = [];
                    activeLocks.red = { player: null, timer: 0 };
                    this._switchControlled = players[0];
                    this._switchHandedOver = false;
                    this._switchMoved = 0;
                    this._switchLastX = players[1].x;
                    this._switchLastY = players[1].y;
                },
                update: () => {
                    const from = players[0], to = players[1];
                    if (!this._switchHandedOver) {
                        this._switchControlled = from;
                        this._moveHuman(from, 2.8);
                        this._activeDisplay = from;
                        const fromDistance = Math.hypot(from.x - ball.x, from.y - ball.y);
                        const toDistance = Math.hypot(to.x - ball.x, to.y - ball.y);
                        if (fromDistance > toDistance + 30) {
                            this._switchHandedOver = true;
                            this._switchControlled = to;
                            this._switchLastX = to.x; this._switchLastY = to.y;
                            SoundManager.playSFX('menuClick');
                        }
                        return false;
                    }
                    this._switchControlled = to;
                    this._moveHuman(to, 2.8);
                    this._activeDisplay = to;
                    this._switchMoved += Math.hypot(to.x - this._switchLastX, to.y - this._switchLastY);
                    this._switchLastX = to.x; this._switchLastY = to.y;
                    return this._switchMoved > 60;
                },
                draw: () => {
                    if (!this._switchHandedOver) this._drawGlowRing(ball);
                }
            },
            {
                id: 'tackling',
                title: 'TACKLING',
                instruction: isMobileDevice ? 'Catch up to the slow defender and bump into them to win the ball' : 'Catch up to the slow defender (WASD) and bump into them to win the ball',
                setup: () => {
                    players = [];
                    players.push(this._mk(0, 'red', 150, 300, false, '7'));
                    players.push(this._mk(1, 'blue', 500, 300, false, '4'));
                    ball.owner = players[1]; ball.vx = 0; ball.vy = 0; ball.trail = [];
                },
                update: () => {
                    const p = players[0];
                    const opp = players[1];
                    this._moveHuman(p, 3.0);
                    this._activeDisplay = p;
                    // Slow-moving opponent: drifts gently, never sprints away —
                    // a step that can be completed but not failed.
                    opp.x += Math.sin(this.stepTimer * 0.03) * 0.6;
                    if (ball.owner === opp) { ball.x = opp.x; ball.y = opp.y; }
                    const dist = Math.hypot(p.x - opp.x, p.y - opp.y);
                    if (dist < p.radius + opp.radius + 2 && ball.owner === opp) {
                        const tackleAngle = Math.atan2(p.y - opp.y, p.x - opp.x);
                        ball.owner = null;
                        ball.vx = Math.cos(tackleAngle) * 5;
                        ball.vy = Math.sin(tackleAngle) * 5;
                        ball.trail = [];
                        SoundManager.playSFX('kick', 0.5);
                        return true;
                    }
                    return false;
                },
                draw: () => {}
            },
            {
                id: 'goalkeeper',
                title: 'GOALKEEPER',
                instruction: 'Watch your keeper save it, then aim and press SPACE to clear the ball',
                setup: () => {
                    players = [];
                    players.push(this._mk(0, 'red', 50, 300, true, '1'));
                    players.push(this._mk(1, 'blue', 400, 300, false, '9'));
                    // Put the ball ON the shooter. It used to be left wherever the
                    // previous step parked it (often off-canvas at -1000,-1000), so the
                    // shot spawned there, got clamped into the corner and never reached
                    // the keeper - the step then looped forever.
                    ball.owner = players[1]; ball.x = players[1].x; ball.y = players[1].y;
                    ball.vx = 0; ball.vy = 0; ball.trail = [];
                    this._gkShotFired = false;
                    this._gkSaved = false;
                    this._gkShotTimer = 60; // ~1s at 60fps before the shot comes in
                    // The keeper is never player-steered here or in a real match — it
                    // always patrols the goal line on its own (see the "GK movement"
                    // block in main.js). Mirror that exact patrol so this step teaches
                    // what actually happens in-game instead of a control that doesn't
                    // exist.
                    this._gkPatrolDir = 1;
                },
                update: () => {
                    const gk = players[0];
                    const shooter = players[1];

                    // Same automatic patrol as a real match's goalkeeper — nothing for
                    // the human to steer here, on purpose.
                    if (!this._gkSaved && !this._gkShotFired) {
                        gk.y += gkSpeed * this._gkPatrolDir * this._dtFrames;
                        if (gk.y <= 210) { gk.y = 210; this._gkPatrolDir = 1; }
                        else if (gk.y >= 390) { gk.y = 390; this._gkPatrolDir = -1; }
                    }

                    if (!this._gkShotFired) {
                        this._gkShotTimer -= this._dtFrames;
                        if (this._gkShotTimer <= 0) {
                            this._gkShotFired = true;
                            // Hold the keeper in place and aim directly at them so the
                            // tutorial save cannot turn into a long retry loop.
                            const targetY = gk.y;
                            const ang = Math.atan2(targetY - shooter.y, 25 - shooter.x);
                            ball.owner = null;
                            ball.x = shooter.x; ball.y = shooter.y;
                            const power = 7.5;
                            ball.vx = Math.cos(ang) * power;
                            ball.vy = Math.sin(ang) * power;
                            SoundManager.playSFX('kick', 0.7);
                        }
                        return false;
                    }

                    if (!this._gkSaved) {
                        this._simpleBallFlight();
                        const distToGk = Math.hypot(ball.x - gk.x, ball.y - gk.y);
                        if (distToGk < gk.radius + ball.radius + 4) {
                            // The save itself — a real match makes this an automatic
                            // ball/keeper collision, so it stays automatic here too.
                            ball.owner = gk; ball.vx = 0; ball.vy = 0; ball.trail = [];
                            SoundManager.playSFX('kick', 0.5);
                            this._gkSaved = true;
                            arrowAngle = Math.atan2(300 - gk.y, 875 - gk.x); // start aimed upfield
                            return false;
                        }
                        if (ball.x - ball.radius <= 25) {
                            // Missed the keeper entirely — give it right back so the
                            // step still can't be failed.
                            ball.owner = shooter; ball.x = shooter.x; ball.y = shooter.y;
                            ball.vx = 0; ball.vy = 0; ball.trail = [];
                            this._gkShotFired = false;
                            this._gkShotTimer = 70;
                        }
                        return false;
                    }

                    // Ball is safely in the keeper's hands — now the human's actual
                    // job: aim the clearance and fire it, the one real keeper action
                    // that exists in this game.
                    this._activeDisplay = gk;
                    ball.x = gk.x; ball.y = gk.y;
                    arrowAngle += 0.08 * this._dtFrames;
                    if (keys.space) {
                        shootTutorialBall(gk);
                        keys.space = false;
                        return true;
                    }
                    return false;
                },
                draw: () => {
                    // Telegraph the incoming shot so it never feels like it "just
                    // happens" — a shrinking ring on the shooter counts down to the kick.
                    if (!this._gkShotFired && players[1]) {
                        const t = Math.max(0, this._gkShotTimer / 60);
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(players[1].x, players[1].y, players[1].radius + 6 + t * 18, 0, Math.PI * 2);
                        ctx.strokeStyle = 'rgba(255,82,82,0.85)';
                        ctx.lineWidth = 3;
                        ctx.shadowColor = '#ff5252';
                        ctx.shadowBlur = 10;
                        ctx.stroke();
                        ctx.restore();
                    }
                    if (this._gkSaved) this._drawAimArrow();
                }
            },
            {
                id: 'final',
                title: 'FINAL CHALLENGE',
                instruction: 'Get the ball past the defender, aim, and score!',
                setup: () => {
                    players = [];
                    players.push(this._mk(0, 'red', 200, 300, false, '10'));
                    players.push(this._mk(1, 'blue', 480, 300, false, '4'));
                    ball.owner = players[0]; ball.vx = 0; ball.vy = 0; ball.trail = [];
                    arrowAngle = 0;
                    this._defTackleFlash = 0;
                },
                update: () => {
                    const p = players[0];
                    const opp = players[1];
                    this._moveHuman(p, 2.8);
                    this._activeDisplay = p;

                    // Defender actually closes in on the ball carrier — same idea as
                    // a real match's AI (which chases the ball, not a fixed patrol),
                    // just slow enough to always be beatable so the step still can't
                    // be failed, only made harder to breeze through.
                    const chaseTarget = ball.owner || ball;
                    const dx = chaseTarget.x - opp.x, dy = chaseTarget.y - opp.y;
                    const chaseDist = Math.hypot(dx, dy);
                    if (chaseDist > 4) {
                        const defSpeed = 1.4;
                        opp.x += (dx / chaseDist) * defSpeed * this._dtFrames;
                        opp.y += (dy / chaseDist) * defSpeed * this._dtFrames;
                    }
                    opp.x = Math.max(25 + opp.radius, Math.min(875 - opp.radius, opp.x));
                    opp.y = Math.max(opp.radius, Math.min(GAME_H - opp.radius, opp.y));

                    if (this._defTackleFlash > 0) this._defTackleFlash -= this._dtFrames;

                    if (ball.owner === p) {
                        ball.x = p.x; ball.y = p.y;
                        arrowAngle += 0.08 * this._dtFrames;
                        // Same proximity tackle as a real match: get too close to the
                        // defender while carrying the ball and it's knocked loose —
                        // no permanent setback, it just becomes a loose ball nearby.
                        const distToDef = Math.hypot(p.x - opp.x, p.y - opp.y);
                        if (distToDef < p.radius + opp.radius + 2) {
                            ball.owner = null;
                            const tackleAngle = Math.atan2(p.y - opp.y, p.x - opp.x);
                            ball.vx = Math.cos(tackleAngle) * 5;
                            ball.vy = Math.sin(tackleAngle) * 5;
                            this._defTackleFlash = 30;
                            SoundManager.playSFX('kick', 0.6);
                            this.showRetryPrompt(60);
                        } else if (keys.space) {
                            shootTutorialBall(p);
                            keys.space = false;
                        }
                    } else if (!ball.owner) {
                        this._simpleBallFlight();
                        if (ball.x + ball.radius >= 875 && ball.y > 200 && ball.y < 400) return true;
                        this._checkReclaim(p);
                    }
                    return false;
                },
                draw: () => {
                    if (this._defTackleFlash > 0 && players[1]) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(players[1].x, players[1].y, players[1].radius + 8, 0, Math.PI * 2);
                        ctx.strokeStyle = 'rgba(255,82,82,0.85)';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        ctx.restore();
                    }
                    this._drawAimArrow();
                }
            }
        ];
    },

    _mk(id, team, x, y, isGk, num) {
        const red = team === 'red';
        return {
            id, team, x, y, radius: 16,
            color: red ? '#ff5252' : '#48dbfb', gradColor: red ? '#d63031' : '#0984e3',
            isGk, num, teamId: null,
            ejecting: false, ejectTargetX: 0, ejectTargetY: 0,
            stamina: 1.0, celebration: false, celebrationTimer: 0
        };
    },

    // Shared WASD / left-joystick movement for whichever player the current
    // step puts the human in control of. Bounded to the pitch like a real match.
    _moveHuman(p, speed) {
        // Scaled by dtFrames so the walking speed is the same on 60/120/144Hz
        // screens (it used to move a fixed amount per rendered frame), and
        // diagonals are normalised so W+D isn't ~41% faster than W alone.
        let dx = 0, dy = 0;
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;
        if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
        const step = speed * (this._dtFrames || 1);
        const nx = p.x + dx * step, ny = p.y + dy * step;
        p.x = Math.max(25 + p.radius, Math.min(875 - p.radius, nx));
        p.y = Math.max(p.radius, Math.min(GAME_H - p.radius, ny));
    },

    // Trimmed-down version of the real match's loose-ball flight: moves,
    // decays, bounces off all four walls (so a miss can never send the ball
    // off-canvas and strand the step). No posts/tackles/AI — steps that need
    // those handle them explicitly.
    _simpleBallFlight() {
        const f = this._dtFrames || 1;
        ball.x += ball.vx * f; ball.y += ball.vy * f;
        const decay = Math.pow(0.985, f);
        ball.vx *= decay; ball.vy *= decay;
        if (ball.y <= ball.radius) { ball.y = ball.radius; ball.vy *= -1; }
        else if (ball.y >= GAME_H - ball.radius) { ball.y = GAME_H - ball.radius; ball.vy *= -1; }
        if (ball.x <= ball.radius) { ball.x = ball.radius; ball.vx *= -1; }
        else if (ball.x >= GAME_W - ball.radius) { ball.x = GAME_W - ball.radius; ball.vx *= -1; }
        if (Math.hypot(ball.vx, ball.vy) > 2) {
            ball.trail.push({ x: ball.x, y: ball.y, life: 15 });
            if (ball.trail.length > 20) ball.trail.shift();
        }
        ball.trail = ball.trail.filter(t => t.life > 0);
        for (const t of ball.trail) t.life -= f;
    },

    // Lets the human reclaim a loose ball just by walking up to it — used by
    // any step where a miss (wide shot, overhit pass) would otherwise strand
    // the ball with no way to try again except Skip Step.
    _checkReclaim(p) {
        if (ball.owner) return;
        const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
        if (dist < p.radius + ball.radius) {
            ball.owner = p; ball.vx = 0; ball.vy = 0; ball.trail = [];
        }
    },

    _checkReceive(target) {
        const dist = Math.hypot(ball.x - target.x, ball.y - target.y);
        if (dist < target.radius + ball.radius) {
            ball.owner = target; ball.vx = 0; ball.vy = 0; ball.trail = [];
        }
    },

    _drawZone(x, y, r) {
        const t = Date.now() * 0.004;
        const pulse = 0.75 + Math.sin(t) * 0.2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(31,209,92,${0.18 * pulse})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(31,209,92,${0.9 * pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = TUTORIAL_ACCENT;
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
    },

    _drawGlowRing(p) {
        if (!p) return;
        const t = Date.now() * 0.006;
        const r = p.radius + 12 + Math.sin(t) * 3;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = TUTORIAL_ACCENT;
        ctx.lineWidth = 3;
        ctx.shadowColor = TUTORIAL_ACCENT;
        ctx.shadowBlur = 12;
        ctx.setLineDash([7, 5]);
        ctx.stroke();
        ctx.restore();
    },

    // Same sweeping aim indicator as a real match (see draw()'s PLAY branch in
    // renderer.js) — only drawn while the human is actually holding the ball,
    // so it's clear aiming is live and SPACE fires wherever it's currently
    // pointing, not automatically at whatever's highlighted.
    _drawAimArrow() {
        if (!ball.owner || ball.owner.team !== 'red') return;
        const owner = ball.owner;
        ctx.save();
        let startX = owner.x + Math.cos(arrowAngle) * 22;
        let startY = owner.y + Math.sin(arrowAngle) * 22;
        let endX = owner.x + Math.cos(arrowAngle) * 65;
        let endY = owner.y + Math.sin(arrowAngle) * 65;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#f1c40f';
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 8;
        ctx.stroke();
        let tipAngle1 = arrowAngle + Math.PI * 0.85;
        let tipAngle2 = arrowAngle - Math.PI * 0.85;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX + Math.cos(tipAngle1) * 11, endY + Math.sin(tipAngle1) * 11);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX + Math.cos(tipAngle2) * 11, endY + Math.sin(tipAngle2) * 11);
        ctx.stroke();
        ctx.restore();
    },

    // ---------- per-step lifecycle ----------
    _enterStep(i) {
        const step = this.STEPS[i];
        this.stepTimer = 0;
        this.stepDone = false;
        this.stepDoneTimer = 0;
        this._activeDisplay = null;
        this._retryPromptShown = false;
        this._retryPromptDelay = 0;
        // A SPACE still held/queued from the previous step must not instantly fire
        // the first shot of this one (players hadn't aimed yet).
        keys.space = false;
        this._dtFrames = this._dtFrames || 1;
        step.setup();
    },

    _advance() {
        if (this.stepIndex >= this.STEPS.length - 1) {
            this._finish();
            return;
        }
        this.stepIndex++;
        this._enterStep(this.stepIndex);
    },

    // Any step can call this when the human loses a fair contest (currently
    // just the Final Challenge's defender tackle) to offer a clean restart
    // instead of leaving them to untangle a scramble.
    showRetryPrompt(delayFrames = 0) {
        this._retryPromptDelay = delayFrames;
        if (delayFrames <= 0) {
            this._retryPromptShown = true;
            SoundManager.playSFX('menuClick');
        }
    },

    retryStep() {
        SoundManager.playSFX('menuClick');
        this._enterStep(this.stepIndex);
    },

    dismissRetryPrompt() {
        SoundManager.playSFX('menuClick');
        this._retryPromptShown = false;
    },

    _finish() {
        this.markSeen();
        if (!this.rewardClaimed()) {
            Shop._grant(TUTORIAL_REWARD_COINS, ['TUTORIAL COMPLETE +' + TUTORIAL_REWARD_COINS], null);
            this.markRewardClaimed();
            this.justClaimedReward = true;
        } else {
            this.justClaimedReward = false;
        }
        currentState = 'TUTORIAL_COMPLETE';
        updateTouchUI();
    },

    // ---------- frame update ----------
    update(dt) {
        const dtFrames = dt * 60;
        this._dtFrames = dtFrames;
        this.stepTimer += dtFrames;
        const step = this.STEPS[this.stepIndex];

        if (this._retryPromptShown) return; // frozen behind the retry prompt

        if (this._retryPromptDelay > 0) {
            this._simpleBallFlight();
            this._retryPromptDelay -= dtFrames;
            if (this._retryPromptDelay <= 0) this.showRetryPrompt();
            return;
        }

        if (this.stepDone) {
            this.stepDoneTimer += dtFrames;
            if (!ball.owner && Math.hypot(ball.vx, ball.vy) > 0.1) this._simpleBallFlight();
            else if (ball.owner) {
                ball.x = ball.owner.x;
                ball.y = ball.owner.y;
            }
            if (this.stepDoneTimer > this._stepCompleteDelay) this._advance();
            return;
        }

        const done = step.update();
        if (done) {
            SoundManager.playSFX('confirm');
            this.stepDone = true;
            this.stepDoneTimer = 0;
        }
    },

    // ---------- draw ----------
    draw() {
        drawPitch();

        for (const p of players) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 0.9, p.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Never call getActivePlayer() here — it's called once per frame inside
        // each step's update() (where relevant) and the result stashed in
        // _activeDisplay. Calling it again here would be a second call in the
        // same frame and could re-roll its internal equidistant-players lock.
        const activeRed = this._activeDisplay;
        if (activeRed && !activeRed.ejecting) drawActiveIndicator(activeRed, 'YOU', TUTORIAL_ACCENT);

        for (const p of players) drawPlayerToken(p);

        drawGoalStructures();

        const step = this.STEPS[this.stepIndex];
        if (step.draw) step.draw();

        if (ball.x > -500) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(ball.x, ball.y + ball.radius * 0.7, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            drawMatchBall(ball);
        }

        this._drawHud(step);

        if (this._retryPromptShown) this._drawRetryPrompt();
    },

    _drawRetryPrompt() {
        ctx.save();
        ctx.fillStyle = 'rgba(5,10,20,0.6)';
        ctx.fillRect(0, 0, GAME_W, GAME_H);

        const w = 380, h = 160, x = (GAME_W - w) / 2, y = (GAME_H - h) / 2;
        drawGlassPanel(x, y, w, h, 20, hexToRgba('#ff5252', 0.5));

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff5252';
        ctx.font = '900 20px Outfit, sans-serif';
        ctx.fillText('TACKLED!', GAME_W / 2, y + 42);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.fillText('The defender won the ball. Retry the step from the start?', GAME_W / 2, y + 66);

        const btnY = y + 92;
        drawPillButton(x + 30, btnY, 150, 42, '↺ RETRY STEP', TUTORIAL_ACCENT, { fontSize: 14 });
        window._tutRetryBtn = { x: x + 30, y: btnY, w: 150, h: 42 };

        drawPillButton(x + 200, btnY, 150, 42, 'KEEP PLAYING', 'rgba(255,255,255,0.55)', { fontSize: 13 });
        window._tutKeepPlayingBtn = { x: x + 200, y: btnY, w: 150, h: 42 };

        ctx.restore();
    },

    _drawHud(step) {
        // Top-left badge: unmistakably "you are in the tutorial", not just a
        // step counter — a dashed border + target icon echo the menu banner
        // so the visual identity carries through into the mini-game itself.
        ctx.save();
        drawGlassPanel(15, 15, 190, 44, 12, hexToRgba(TUTORIAL_ACCENT, 0.6));
        ctx.strokeStyle = hexToRgba(TUTORIAL_ACCENT, 0.8);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.roundRect(18, 18, 184, 38, 10);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.textAlign = 'left';
        ctx.fillStyle = TUTORIAL_ACCENT;
        ctx.font = '900 12px Outfit, sans-serif';
        ctx.fillText('🎯 TUTORIAL', 28, 32);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '700 11px Outfit, sans-serif';
        ctx.fillText(`STEP ${this.stepIndex + 1} / ${this.STEPS.length}`, 28, 47);
        ctx.restore();

        // Instruction banner, bottom-center — persistent per the spec. Sized
        // and positioned so it (and the skip buttons below it) fit entirely
        // inside the 900x600 canvas with margin to spare, on every device.
        const bannerY = 492;
        const bannerH = 54;
        drawGlassPanel(150, bannerY, 600, bannerH, 16, hexToRgba(TUTORIAL_ACCENT, 0.45));
        ctx.textAlign = 'center';
        ctx.fillStyle = TUTORIAL_ACCENT;
        ctx.font = '800 14px Outfit, sans-serif';
        ctx.fillText(step.title, 450, bannerY + 21);
        ctx.fillStyle = this.stepDone ? '#ffffff' : 'rgba(255,255,255,0.85)';
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.fillText(this.stepDone ? "NICE! MOVING ON..." : step.instruction, 450, bannerY + 41);

        // Skip Step / Skip Tutorial — always available, per the spec. Sit in
        // their own row below the banner with a clear gap on both sides —
        // no overlap with the banner, nothing closer than 20px to the bottom
        // edge of the canvas.
        const skipY = bannerY - 42;
        drawPillButton(20, skipY, 140, 30, 'SKIP STEP', 'rgba(255,255,255,0.6)', {
            active: !!(window._uiHover && window._uiHover.tutorialSkipStep),
            fontSize: 12
        });
        window._tutSkipStepBtn = { x: 20, y: skipY, w: 140, h: 30 };

        drawPillButton(740, skipY, 140, 30, 'SKIP TUTORIAL', '#ff5252', {
            active: !!(window._uiHover && window._uiHover.tutorialSkipAll),
            fontSize: 12
        });
        window._tutSkipAllBtn = { x: 740, y: skipY, w: 140, h: 30 };
    },

    // ---------- completion screen ----------
    drawComplete() {
        drawMenuBackground();
        ctx.save();
        drawGlassPanel(200, 130, 500, 340, 24, hexToRgba(TUTORIAL_ACCENT, 0.4));

        ctx.textAlign = 'center';
        drawGlowTitle(this._bonusActive ? '🏆 CHALLENGE COMPLETE!' : '🎉 TUTORIAL COMPLETE!', 450, 195, TUTORIAL_ACCENT, 30);

        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 15px Outfit, sans-serif';
        ctx.fillText("You're ready to take the pitch.", 450, 228);

        if (this.justClaimedReward) {
            drawGlassPanel(300, 260, 300, 70, 16, 'rgba(255,198,54,0.5)');
            ctx.fillStyle = '#ffc636';
            ctx.font = '900 26px Outfit, sans-serif';
            ctx.fillText(`+${TUTORIAL_REWARD_COINS} COINS`, 450, 302);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '600 11px Outfit, sans-serif';
            ctx.fillText('ONE-TIME TUTORIAL REWARD', 450, 320);
        } else {
            drawGlassPanel(300, 260, 300, 70, 16, 'rgba(255,255,255,0.2)');
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '700 15px Outfit, sans-serif';
            ctx.fillText('Practice complete!', 450, 290);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '600 11px Outfit, sans-serif';
            ctx.fillText('Reward already claimed — no coins this time', 450, 308);
        }

        drawPillButton(325, 400, 250, 46, '← BACK TO MENU', TUTORIAL_ACCENT, { fontSize: 17 });
        window._backBtn = { x: 325, y: 400, w: 250, h: 46 };

        ctx.restore();
    }
};

// Ball-flight kickoff shared by the passing/shooting/final steps — mirrors
// shootBall() from main.js but stays self-contained here so tutorial.js
// never depends on a real match being in progress.
function shootTutorialBall(passer) {
    SoundManager.playSFX('kick', 0.8);
    const spawnDist = passer.radius + ball.radius + 6;
    ball.x = passer.x + Math.cos(arrowAngle) * spawnDist;
    ball.y = passer.y + Math.sin(arrowAngle) * spawnDist;
    const power = 12;
    ball.vx = Math.cos(arrowAngle) * power;
    ball.vy = Math.sin(arrowAngle) * power;
    ball.owner = null;
    ball.trail = [];
}
