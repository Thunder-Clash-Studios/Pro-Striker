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

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.rotation += p.vRot;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx, y = cy;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = '#f1c40f';
    ctx.fill();
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
    let threshold = 25;
    let equidistantGroup = candidates.filter(c => c.dist - candidates[0].dist <= threshold);
    if (equidistantGroup.length >= 2) {
        let randomIndex = Math.floor(Math.random() * equidistantGroup.length);
        chosen = equidistantGroup[randomIndex].player;
        lock.player = chosen;
        lock.timer = 18;
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