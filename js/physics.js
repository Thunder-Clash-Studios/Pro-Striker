// ===== PRO STRIKER - physics.js =====
console.log('[ProStriker] physics.js loaded');

function spawnGoalConfetti(originX, originY, primaryColor = '#f1c40f') {
    particles = [];
    const colors = [primaryColor, '#f1c40f', '#ffffff', '#ff9f43', '#e056fd'];
    for (let i = 0; i < 140; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 22 + 4;
        particles.push({
            x: originX, y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.3,
            life: 110
        });
    }
}

function updateParticles(dtFrames = 1) {
    // Particle velocities/lifetimes were authored as 60fps frame units.
    // Scale their motion and lifetime by the same frame-equivalent delta so
    // celebration effects last the same real-world duration at 60/120/144Hz.
    const dt = Math.max(0, Math.min(4, dtFrames));
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.22 * dt;
        p.vx *= Math.pow(0.96, dt);
        p.vy *= Math.pow(0.96, dt);
        p.rotation += p.vRot * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// targetCtx optional (defaults to the main game canvas ctx) so this can also
// render onto an offscreen sprite canvas, e.g. the cached player-token
// sprites built in renderer.js's getPlayerSprite().
function drawStar(cx, cy, spikes, outerRadius, innerRadius, targetCtx) {
    const c = targetCtx || ctx;
    let rot = Math.PI / 2 * 3;
    let x = cx, y = cy;
    let step = Math.PI / spikes;
    c.beginPath();
    c.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
    }
    c.lineTo(cx, cy - outerRadius);
    c.closePath();
    c.fillStyle = '#f1c40f';
    c.fill();
}

function getActivePlayer(team) {
    if (ball.owner && ball.owner.team === team) return ball.owner;
    let lock = activeLocks[team];
    if (lock.timer > 0 && lock.player && !lock.player.ejecting) return lock.player;
    let eligible = players.filter(p => p.team === team && !p.isGk && !p.ejecting);
    if (eligible.length === 0) return null;
    let candidates = eligible.map(p => {
        return { player: p, dist: Math.hypot(p.x - ball.x, p.y - ball.y) };
    });
    candidates.sort((a,b) => a.dist - b.dist);
    let chosen = candidates[0].player;
    // Active-player lock tuning belongs to the AI side in VS Computer;
    // local 1v1 remains on the original neutral values so difficulty cannot
    // leak into two-human control. Tournament matches use the same rule: the
    // human side stays neutral, while the computer side uses its tier config.
    const lockCfg = (gameMode === 'pve' && team === 'blue' && typeof getAIConfigByDifficulty === 'function')
        ? getAIConfigByDifficulty(difficulty)
        : null;
    const threshold = lockCfg && Number.isFinite(lockCfg.lockThreshold) ? lockCfg.lockThreshold : 25;
    const lockFrames = lockCfg && Number.isFinite(lockCfg.lockTimer) ? lockCfg.lockTimer : 18;
    let equidistantGroup = candidates.filter(c => c.dist - candidates[0].dist <= threshold);
    if (equidistantGroup.length >= 2) {
        let randomIndex = Math.floor(Math.random() * equidistantGroup.length);
        chosen = equidistantGroup[randomIndex].player;
        lock.player = chosen;
        lock.timer = lockFrames;
    } else {
        lock.player = chosen;
        lock.timer = 0;
    }
    return chosen;
}

function resolveBoxCollision(player, box) {
    let closestX = Math.max(box.minX, Math.min(player.x, box.maxX));
    let closestY = Math.max(box.minY, Math.min(player.y, box.maxY));
    let dx = player.x - closestX;
    let dy = player.y - closestY;
    let distance = Math.hypot(dx, dy);
    if (distance < player.radius) {
        if (distance === 0) {
            let dLeft = Math.abs(player.x - box.minX);
            let dRight = Math.abs(player.x - box.maxX);
            let dTop = Math.abs(player.y - box.minY);
            let dBottom = Math.abs(player.y - box.maxY);
            let min = Math.min(dLeft, dRight, dTop, dBottom);
            if (min === dLeft) player.x = box.minX - player.radius;
            else if (min === dRight) player.x = box.maxX + player.radius;
            else if (min === dTop) player.y = box.minY - player.radius;
            else player.y = box.maxY + player.radius;
        } else {
            let overlap = player.radius - distance;
            player.x += (dx / distance) * overlap;
            player.y += (dy / distance) * overlap;
        }
    }
}

// ===== KIT CLASH RESOLUTION =====
// BUGFIX: 9 of the 32 tournament teams (Belgium, Canada, Croatia, Denmark,
// Egypt, Morocco, Portugal, Spain, Switzerland) share the exact same red
// hex code, and a few other pairs also clash (Australia/Brazil gold,
// Austria/Norway red, Colombia/Ecuador yellow, Côte d'Ivoire/Netherlands
// orange, France/Italy blue, Japan/South Korea navy) — so those matchups
// showed both teams' names, scores and player tokens in the same color,
// with only the flag badge telling them apart. Real football hands the away
// side a change kit for exactly this reason. This is a pure function of the
// two hex colors (same inputs -> same output everywhere), so calling it
// separately in createPlayers() and drawScoreboard() always agrees on the
// same away color for team B without needing to store anything on the match.
function colorDistance(hexA, hexB) {
    const r1 = parseInt(hexA.slice(1, 3), 16), g1 = parseInt(hexA.slice(3, 5), 16), b1 = parseInt(hexA.slice(5, 7), 16);
    const r2 = parseInt(hexB.slice(1, 3), 16), g2 = parseInt(hexB.slice(3, 5), 16), b2 = parseInt(hexB.slice(5, 7), 16);
    return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}
const AWAY_KIT_ALTERNATES = ['#2c3e50', '#f1c40f', '#16a085', '#8e44ad', '#e67e22', '#2d98da'];
function resolveAwayColor(colorA, colorB) {
    if (colorDistance(colorA, colorB) >= 90) return colorB;
    for (const alt of AWAY_KIT_ALTERNATES) {
        if (colorDistance(colorA, alt) >= 90 && colorDistance(colorB, alt) >= 60) return alt;
    }
    return colorB; // exhausted the palette (shouldn't happen with 6 well-spread options)
}

function getEjectTarget(player, box) {
    let dLeft = Math.abs(player.x - box.minX);
    let dRight = Math.abs(player.x - box.maxX);
    let dTop = Math.abs(player.y - box.minY);
    let dBottom = Math.abs(player.y - box.maxY);
    let min = Math.min(dLeft, dRight, dTop, dBottom);
    let targetX = player.x;
    let targetY = player.y;
    if (min === dLeft) targetX = box.minX - player.radius - 5;
    else if (min === dRight) targetX = box.maxX + player.radius + 5;
    else if (min === dTop) targetY = box.minY - player.radius - 5;
    else targetY = box.maxY + player.radius + 5;

    const PADDING = 25;
    targetX = Math.max(PADDING + player.radius, Math.min(875 - player.radius, targetX));
    targetY = Math.max(PADDING + player.radius, Math.min(580 - player.radius, targetY));
    if (box.maxX === 125) targetX = Math.max(130, targetX);
    if (box.minX === 775) targetX = Math.min(770, targetX);
    return { x: targetX, y: targetY };
}