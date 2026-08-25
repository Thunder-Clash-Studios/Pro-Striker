// ===== PRO STRIKER - renderer.js =====
console.log('[ProStriker] renderer.js loaded');

// ===== FLAG DRAWING HELPERS =====
// Draws a team's flag as a real image (see FlagImages in tournamentData.js)
// instead of the unreliable emoji, falling back to the emoji only until the
// image has loaded. `size` is the flag height in px; width follows a 4:3 flag
// ratio. `y` is treated as a text baseline so it lines up with adjacent text.
// Returns the total width consumed (flag + small gap) for laying out text after it.
function drawTeamFlag(team, x, y, size, align = 'left') {
    const h = size;
    const w = Math.round(size * 1.33);
    const gap = Math.max(3, Math.round(size * 0.25));
    let drawX = x;
    if (align === 'center') drawX = x - w / 2;
    else if (align === 'right') drawX = x - w;

    const img = (typeof FlagImages !== 'undefined') ? FlagImages.get(team) : null;
    if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(drawX, y - h * 0.82, w, h, 1.5);
        ctx.clip();
        ctx.drawImage(img, drawX, y - h * 0.82, w, h);
        ctx.restore();
    } else {
        const prevAlign = ctx.textAlign;
        const prevFont = ctx.font;
        ctx.font = `${Math.round(size)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",Arial,sans-serif`;
        ctx.textAlign = align;
        ctx.fillText((team && team.flag) || '⚽', align === 'center' ? x : (align === 'right' ? x : x), y);
        ctx.textAlign = prevAlign;
        ctx.font = prevFont;
    }
    return w + gap;
}

// Draws a single centered line made of text/team-flag segments, e.g.
// fillTextWithFlags(['🏆 ', champion, ' ARE CHAMPIONS!'], 450, 200, '700 20px Outfit, sans-serif', '#f1c40f')
// Pass a team object anywhere a flag should appear inline.
function fillTextWithFlags(segments, cx, y, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    const sizeMatch = font.match(/(\d+)px/);
    const flagH = sizeMatch ? parseInt(sizeMatch[1], 10) * 0.62 : 14;
    const flagW = Math.round(flagH * 1.33) + Math.max(3, Math.round(flagH * 0.25));

    let totalW = 0;
    const parts = segments.map(seg => {
        if (typeof seg === 'string') {
            const w = ctx.measureText(seg).width;
            totalW += w;
            return { type: 'text', value: seg, w };
        } else {
            totalW += flagW;
            return { type: 'flag', team: seg, w: flagW };
        }
    });

    let cursorX = cx - totalW / 2;
    const prevAlign = ctx.textAlign;
    ctx.textAlign = 'left';
    parts.forEach(p => {
        if (p.type === 'text') {
            ctx.fillText(p.value, cursorX, y);
        } else {
            drawTeamFlag(p.team, cursorX, y, flagH, 'left');
        }
        cursorX += p.w;
    });
    ctx.textAlign = prevAlign;
}

// Cached offscreen turf texture — built once, blitted every frame. Doing the
// per-blade noise on a small tile and repeating it is what actually reads as
// "textured grass" instead of flat gradient bands, without a per-frame cost.
let _turfTileCanvas = null;
function getTurfTile() {
    if (_turfTileCanvas) return _turfTileCanvas;
    const tile = document.createElement('canvas');
    tile.width = 64; tile.height = 64;
    const tctx = tile.getContext('2d');
    // Base noise speckle — thousands of 1px flecks of slightly different
    // green so the grass has grain instead of being a flat fill.
    const id = tctx.createImageData(64, 64);
    for (let i = 0; i < id.data.length; i += 4) {
        const n = 150 + Math.floor(Math.random() * 40) - 20;
        const g = Math.max(0, Math.min(255, n));
        id.data[i] = g * 0.28;
        id.data[i + 1] = g * 0.72;
        id.data[i + 2] = g * 0.38;
        id.data[i + 3] = 26; // low alpha, additive grain over the base fill
    }
    tctx.putImageData(id, 0, 0);
    // A handful of thin blade strokes for a bit of directional texture
    tctx.strokeStyle = 'rgba(255,255,255,0.05)';
    tctx.lineWidth = 1;
    for (let i = 0; i < 18; i++) {
        const x = Math.random() * 64, y = Math.random() * 64;
        tctx.beginPath();
        tctx.moveTo(x, y);
        tctx.lineTo(x + (Math.random() * 4 - 2), y - 6 - Math.random() * 4);
        tctx.stroke();
    }
    tctx.strokeStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 18; i++) {
        const x = Math.random() * 64, y = Math.random() * 64;
        tctx.beginPath();
        tctx.moveTo(x, y);
        tctx.lineTo(x + (Math.random() * 4 - 2), y + 6 + Math.random() * 4);
        tctx.stroke();
    }
    _turfTileCanvas = tile;
    return tile;
}

function drawPitch() {
    const stripeWidth = (875 - 25) / 10;

    // Base mow-stripe fill with a touch more contrast + a soft top-to-bottom
    // light falloff per stripe so the grass reads as lit rather than flat.
    for (let i = 0; i < 10; i++) {
        const base = i % 2 === 0 ? '#1c9049' : '#249c58';
        const light = i % 2 === 0 ? '#2ab766' : '#31c777';
        const stripeGrad = ctx.createLinearGradient(0, 0, 0, GAME_H);
        stripeGrad.addColorStop(0, light);
        stripeGrad.addColorStop(0.12, base);
        stripeGrad.addColorStop(0.5, i % 2 === 0 ? '#23a457' : '#2bb768');
        stripeGrad.addColorStop(0.88, base);
        stripeGrad.addColorStop(1, light);
        ctx.fillStyle = stripeGrad;
        ctx.fillRect(25 + i * stripeWidth, 0, stripeWidth, GAME_H);
    }

    // Cross-mow banding — subtle horizontal bands perpendicular to the
    // vertical stripes, like a real mowed pitch cut in two directions.
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < GAME_H; y += 40) {
        ctx.fillRect(25, y, 850, 20);
    }
    ctx.restore();

    // Grain/noise turf texture, tiled across the whole pitch
    ctx.save();
    ctx.beginPath();
    ctx.rect(25, 0, 850, GAME_H);
    ctx.clip();
    const tile = getTurfTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(25, 0, 850, GAME_H);
    ctx.restore();

    // Subtle turf mow-texture sheen along each stripe edge
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) {
        ctx.fillRect(25 + i * stripeWidth, 0, 2, GAME_H);
    }
    ctx.restore();

    // Worn/scuffed turf patches near the goalmouths and center circle —
    // where real pitches show the most wear-and-tear discoloration.
    ctx.save();
    ctx.globalAlpha = 0.10;
    const wearSpots = [
        { x: 95, y: 300, r: 55 }, { x: 805, y: 300, r: 55 },
        { x: 450, y: 300, r: 42 }, { x: 210, y: 300, r: 30 }, { x: 690, y: 300, r: 30 }
    ];
    wearSpots.forEach(s => {
        const wg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        wg.addColorStop(0, 'rgba(90,60,30,0.55)');
        wg.addColorStop(1, 'rgba(90,60,30,0)');
        ctx.fillStyle = wg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'rgba(255,255,255,0.35)';
    ctx.shadowBlur = 4;
    ctx.lineWidth = 3;
    ctx.strokeRect(25, 0, 850, GAME_H);
    ctx.beginPath();
    ctx.moveTo(450, 0);
    ctx.lineTo(450, 600);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 300, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(450, 300, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeRect(25, 150, 100, 300);
    ctx.strokeRect(775, 150, 100, 300);
    // Six-yard boxes for extra pitch-marking realism
    ctx.lineWidth = 2.4;
    ctx.strokeRect(25, 230, 40, 140);
    ctx.strokeRect(835, 230, 40, 140);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(95, 300, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(805, 300, 3, 0, Math.PI * 2);
    ctx.fill();
    // Penalty-arc shadow accent at each box for depth
    ctx.beginPath();
    ctx.arc(95, 300, 70, -0.9, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(805, 300, 70, Math.PI - 0.9, Math.PI + 0.9);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let y = 200; y <= 400; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(25, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(875, y);
        ctx.lineTo(900, y);
        ctx.stroke();
    }
    const glow = ctx.createRadialGradient(450, 300, 10, 450, 300, 280);
    glow.addColorStop(0, 'rgba(255,255,255,0.05)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Stadium vignette for cinematic depth on all four edges
    const vignette = ctx.createRadialGradient(450, 300, 260, 450, 300, 560);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Soft directional "floodlight" sheen from the top, for a stadium-lit feel
    const topLight = ctx.createLinearGradient(0, 0, 0, 140);
    topLight.addColorStop(0, 'rgba(255,255,255,0.06)');
    topLight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topLight;
    ctx.fillRect(25, 0, 850, 140);
}

// ============================================================
// REALISTIC PLAYER TOKEN — replaces the flat star-in-a-circle disc with a
// beveled, lit "kit disc": jersey-colored body with a soft top-left
// highlight and bottom-right shade (consistent light direction with the
// rest of the scene), a team-color ring, a thin kit-stripe accent, and the
// player's actual squad number instead of a generic star. GK gets a
// gold ring + glove-color center to read distinctly at a glance.
// ============================================================
function drawPlayerToken(p) {
    const r = p.radius;

    ctx.save();

    // Bevel: soft directional highlight (upper-left, like the pitch's
    // floodlight sheen) blended over the base radial fill.
    let pGrad = ctx.createRadialGradient(p.x - r * 0.4, p.y - r * 0.45, r * 0.15, p.x, p.y, r);
    pGrad.addColorStop(0, p.color);
    pGrad.addColorStop(0.65, p.color);
    pGrad.addColorStop(1, p.gradColor);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = pGrad;
    ctx.fill();

    // Kit stripe accent — a subtle diagonal band across the disc so it reads
    // as a jersey rather than a flat token.
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.moveTo(p.x - r, p.y - r * 0.15);
    ctx.lineTo(p.x - r * 0.3, p.y - r);
    ctx.lineTo(p.x + r * 0.05, p.y - r);
    ctx.lineTo(p.x - r * 0.65, p.y + r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Top-left glossy highlight (gives the disc volume/roundness)
    const sheen = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.45, 0, p.x - r * 0.35, p.y - r * 0.45, r * 0.7);
    sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = sheen;
    ctx.fill();

    // Bottom-right ambient occlusion (grounds the disc against the pitch)
    const ao = ctx.createRadialGradient(p.x + r * 0.4, p.y + r * 0.5, 0, p.x + r * 0.4, p.y + r * 0.5, r * 0.9);
    ao.addColorStop(0, 'rgba(0,0,0,0)');
    ao.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = ao;
    ctx.fill();

    // Ring — gold + glow for GK, crisp white for outfielders
    ctx.lineWidth = p.isGk ? 3 : 2;
    ctx.strokeStyle = p.isGk ? '#f1c40f' : 'rgba(255,255,255,0.95)';
    if (p.isGk) { ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 6; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Star marker — kept from the original design (it reads instantly as a
    // "player token" motif, unlike a bare number, and doesn't visually
    // compete with the P1/P2 labels or the scoreboard digits). Given a
    // slight drop-shadow here so it sits into the new beveled disc instead
    // of looking pasted on top of it.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 0.5;
    drawStar(p.x, p.y, 5, r * 0.5, r * 0.22);
    ctx.restore();

    ctx.restore();
}

function drawActiveIndicator(p, labelText, colorHex) {
    let time = Date.now() * 0.007;
    let pulseRadius = p.radius + 7 + Math.sin(time) * 3;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 10;
    ctx.setLineDash([8,4]);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 14, 0, Math.PI * 2);
    ctx.fillStyle = colorHex + '15';
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = colorHex;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(p.x - 7, p.y - p.radius - 20);
    ctx.lineTo(p.x + 7, p.y - p.radius - 20);
    ctx.lineTo(p.x, p.y - p.radius - 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.font = '900 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, p.x, p.y - p.radius - 24);
}

// ============================================================
// REALISTIC MATCH BALL — pentagon-paneled ball with rolling spin driven by
// velocity, replacing the flat white-disc-with-a-dot. Spin direction/speed
// is derived from ball.vx/vy so it visibly rolls the way it's moving.
// ============================================================
let _ballSpin = 0;
function drawMatchBall(b) {
    const speed = Math.hypot(b.vx || 0, b.vy || 0);
    _ballSpin += 0.06 + speed * 0.045;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(_ballSpin);

    // Base sphere shading — cool-lit sphere rather than a flat white circle
    const ballGrad = ctx.createRadialGradient(-b.radius * 0.35, -b.radius * 0.4, b.radius * 0.1, 0, 0, b.radius * 1.15);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.55, '#f2f5f7');
    ballGrad.addColorStop(0.85, '#d7dde3');
    ballGrad.addColorStop(1, '#aeb8c2');
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();

    // Pentagon panels — a small central pentagon plus a partial ring of
    // panels, clipped to the ball so it always reads as a football and
    // rotates believably with the spin transform above.
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#161e27';
    const pentagon = (cx, cy, s) => {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
            const px = cx + Math.cos(a) * s, py = cy + Math.sin(a) * s;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    };
    const s = b.radius * 0.42;
    pentagon(0, 0, s * 0.6);
    const ringR = b.radius * 0.62;
    for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        pentagon(Math.cos(a) * ringR, Math.sin(a) * ringR, s * 0.42);
    }
    ctx.strokeStyle = 'rgba(20,25,32,0.5)';
    ctx.lineWidth = Math.max(0.6, b.radius * 0.08);
    ctx.stroke();
    ctx.restore();

    // Rim shade for roundness
    const rim = ctx.createRadialGradient(0, 0, b.radius * 0.6, 0, 0, b.radius);
    rim.addColorStop(0, 'rgba(0,0,0,0)');
    rim.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.ellipse(-b.radius * 0.32, -b.radius * 0.38, b.radius * 0.28, b.radius * 0.18, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();

    ctx.restore();

    // Thin outer contact edge (kept from original for silhouette clarity
    // against bright pitch backgrounds)
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(20,25,32,0.35)';
    ctx.stroke();
}

// ============================================================
// GOAL STRUCTURES — posts with a simple net-mesh drawn behind them for a
// far more "real goal" look than bare posts floating on the pitch.
// ============================================================
function drawGoalNet(side) {
    // side: 'left' or 'right'. Net sits just outside the pitch boundary,
    // spanning the goal mouth between the actual posts (posts sit at
    // y=200/y=400 with radius 7 — the net now matches that span exactly
    // instead of overshooting past the post tops/bottoms).
    const x0 = side === 'left' ? 2 : 875;
    const x1 = side === 'left' ? 25 : 898;
    const yTop = 200, yBot = 400;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    const cols = 8, rows = 10;
    for (let i = 0; i <= cols; i++) {
        const x = x0 + (x1 - x0) * (i / cols);
        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yBot);
        ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
        const y = yTop + (yBot - yTop) * (j / rows);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawGoalStructures() {
    drawGoalNet('left');
    drawGoalNet('right');
    for (let post of posts) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(post.x, post.y + 4, post.radius, post.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        let postGrad = ctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
        postGrad.addColorStop(0, '#ffffff');
        postGrad.addColorStop(0.7, '#dfe4e8');
        postGrad.addColorStop(1, '#a7b0b8');
        ctx.beginPath();
        ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
        ctx.fillStyle = postGrad;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#2c3e50';
        ctx.stroke();
    }
}

function drawScoreboard() {
    let teamAName = 'RED';
    let teamBName = gameMode === 'pve' ? 'COM' : 'BLUE';
    let teamAColor = '#ff5252';
    let teamBColor = '#48dbfb';
    let teamAFlag = '';
    let teamBFlag = '';

    if (tournamentMode && tournamentPendingMatch) {
        const match = tournamentPendingMatch;
        const playerTeamId = tournamentSelectedTeam;
        if (match.teamA && match.teamB) {
            if (match.teamA.id === playerTeamId) {
                teamAName = match.teamA.name;
                teamAColor = match.teamA.color;
                teamAFlag = match.teamA.flag;
                teamBName = match.teamB.name;
                teamBColor = match.teamB.color;
                teamBFlag = match.teamB.flag;
            } else {
                teamAName = match.teamB.name;
                teamAColor = match.teamB.color;
                teamAFlag = match.teamB.flag;
                teamBName = match.teamA.name;
                teamBColor = match.teamA.color;
                teamBFlag = match.teamA.flag;
            }
        }
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    const scoreboardBg = ctx.createLinearGradient(120, 10, 120, 70);
    scoreboardBg.addColorStop(0, 'rgba(22,28,38,0.88)');
    scoreboardBg.addColorStop(1, 'rgba(10,13,20,0.88)');
    ctx.fillStyle = scoreboardBg;
    ctx.beginPath();
    ctx.roundRect(120, 10, 660, 60, 20);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'right';
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillStyle = teamAColor;
    let shortA = teamAName.length > 12 ? teamAName.slice(0,12)+'..' : teamAName;
    ctx.fillText(teamAFlag + ' ' + shortA, 390, 32);
    ctx.font = '900 28px Outfit, sans-serif';
    ctx.fillStyle = teamAColor;
    ctx.fillText(score.red, 420, 52);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '700 14px Outfit, sans-serif';
    ctx.fillText('VS', 450, 42);
    ctx.textAlign = 'left';
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillStyle = teamBColor;
    let shortB = teamBName.length > 12 ? teamBName.slice(0,12)+'..' : teamBName;
    ctx.fillText(shortB + ' ' + teamBFlag, 480, 32);
    ctx.font = '900 28px Outfit, sans-serif';
    ctx.fillStyle = teamBColor;
    ctx.fillText(score.blue, 470, 52);

    drawGlassPanel(400, 72, 100, 28, 12, matchClock <= 5 ? 'rgba(255,82,82,0.5)' : 'rgba(255,255,255,0.3)');
    let minutes = Math.floor(matchClock / 60);
    let seconds = Math.floor(matchClock % 60);
    let timeStr = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    ctx.fillStyle = matchClock <= 5 ? '#ff5252' : '#f1c40f';
    ctx.font = '800 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, 450, 94);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.font = '600 9px Outfit, sans-serif';
// ===== FIXED: Show EXTRA TIME when extra time is active =====
if (window._extraTimeActive) {
    ctx.fillText('EXTRA TIME', 450, 78);
} else {
    ctx.fillText(currentHalf === 1 ? '1ST HALF' : '2ND HALF', 450, 78);
}

    if (gameMode === 'pve' && !tournamentMode) {
        let diffColor = difficulty === 'EASY' ? '#2ecc71' : 
                        difficulty === 'MEDIUM' ? '#f1c40f' : 
                        difficulty === 'HARD' ? '#e67e22' : 
                        difficulty === 'ELITE' ? '#e74c3c' : '#8e44ad';
        drawGlassPanel(15, 15, 80, 28, 12, hexToRgba(diffColor, 0.5));
        ctx.fillStyle = diffColor;
        ctx.font = '700 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(difficulty, 55, 35);
    }
}

function drawGkTimerUI() {
    if (gkTimer > 0 && ball.owner && ball.owner.isGk) {
        let seconds = Math.ceil(gkTimer / 60);
        drawGlassPanel(GAME_W - 80, 15, 65, 50, 12, seconds <= 2 ? 'rgba(255,82,82,0.5)' : 'rgba(241,196,15,0.4)');
        ctx.fillStyle = seconds <= 2 ? '#ff5252' : '#f1c40f';
        ctx.shadowColor = seconds <= 2 ? '#ff5252' : '#f1c40f';
        ctx.shadowBlur = 10;
        ctx.font = '900 24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(seconds + 's', GAME_W - 47, 43);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 10px Outfit, sans-serif';
        ctx.fillText('GK TIME', GAME_W - 47, 25);
    }
}

// ============================================================
// SHARED CINEMATIC STADIUM SCENE
// Atmosphere gradient, four animated floodlights with beams, a
// crowd-depth band with flickering spectator lights, and the live
// pitch strip with its lines. Originally only built inline for the
// MENU screen; every other screen (difficulty select, instructions,
// settings, stats, tournament, pause, etc.) used to fall back to the
// much flatter drawMenuBackground() below and looked visibly "older"
// than the main menu. Now drawMenuBackground() opens with this same
// scene, so every screen shares the one cinematic backdrop.
// ============================================================
function drawStadiumScene(time) {
    if (typeof time !== 'number') time = Date.now() * 0.001;

    // ------------------------------------------------------------
    // 1. DEEP STADIUM ATMOSPHERE
    // ------------------------------------------------------------

    const atmosphere =
        ctx.createLinearGradient(
            0, 0,
            0, 600
        );

    atmosphere.addColorStop(
        0,
        'rgba(1, 5, 12, 0.72)'
    );

    atmosphere.addColorStop(
        0.45,
        'rgba(2, 11, 22, 0.50)'
    );

    atmosphere.addColorStop(
        1,
        'rgba(0, 4, 10, 0.90)'
    );

    ctx.fillStyle = atmosphere;
    ctx.fillRect(
        0,
        0,
        GAME_W,
        GAME_H
    );

    // ------------------------------------------------------------
    // 2. STADIUM FLOODLIGHTS
    // ------------------------------------------------------------

    const lights = [
        { x: 72, y: 24, angle: 0.18, strength: 1 },
        { x: 330, y: 12, angle: 0.10, strength: 0.75 },
        { x: 620, y: 20, angle: -0.10, strength: 0.90 },
        { x: 836, y: 34, angle: -0.18, strength: 1 }
    ];

    lights.forEach((light, i) => {
        const flicker =
            0.82 +
            Math.sin(time * 2.2 + i * 1.4) * 0.08;

        ctx.save();

        ctx.translate(
            light.x,
            light.y
        );

        ctx.rotate(light.angle);

        const beam =
            ctx.createLinearGradient(
                0,
                0,
                0,
                390
            );

        beam.addColorStop(
            0,
            `rgba(210,245,255,${0.15 * flicker * light.strength})`
        );

        beam.addColorStop(
            0.4,
            `rgba(85,210,255,${0.055 * light.strength})`
        );

        beam.addColorStop(
            1,
            'rgba(0,170,255,0)'
        );

        ctx.fillStyle = beam;

        ctx.beginPath();

        ctx.moveTo(-24, 0);
        ctx.lineTo(24, 0);
        ctx.lineTo(165, 410);
        ctx.lineTo(-165, 410);

        ctx.closePath();

        ctx.fill();

        // Lamp itself
        ctx.fillStyle = `rgba(245,252,255,${0.86 * flicker})`;

        ctx.beginPath();

        ctx.roundRect(
            -18,
            -6,
            36,
            8,
            4
        );

        ctx.fill();

        ctx.shadowColor =
            'rgba(160,235,255,0.85)';

        ctx.shadowBlur = 18;

        ctx.fillStyle =
            `rgba(255,255,255,${0.95 * flicker})`;

        ctx.beginPath();

        ctx.arc(
            0,
            -2,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    });

    // ------------------------------------------------------------
    // 3. BACKGROUND CROWD / STADIUM DEPTH
    // ------------------------------------------------------------

    ctx.save();

    const crowdGradient =
        ctx.createLinearGradient(
            0,
            180,
            0,
            360
        );

    crowdGradient.addColorStop(
        0,
        'rgba(15,34,53,0.34)'
    );

    crowdGradient.addColorStop(
        1,
        'rgba(1,7,14,0)'
    );

    ctx.fillStyle = crowdGradient;

    ctx.fillRect(
        0,
        150,
        900,
        230
    );

    // Tiny spectator lights
    for (let i = 0; i < 95; i++) {

        const px =
            (i * 97) % 900;

        const py =
            182 +
            ((i * 47) % 130);

        const alpha =
            0.08 +
            0.08 *
            (
                0.5 +
                0.5 *
                Math.sin(
                    time * 1.6 + i
                )
            );

        ctx.fillStyle =
            `rgba(170,225,255,${alpha})`;

        ctx.fillRect(
            px,
            py,
            2,
            2
        );
    }

    ctx.restore();

    // ------------------------------------------------------------
    // 4. LIVE PITCH
    // ------------------------------------------------------------

    const pitchY = 392;

    const pitchGradient =
        ctx.createLinearGradient(
            0,
            pitchY,
            0,
            600
        );

    pitchGradient.addColorStop(
        0,
        'rgba(0,95,92,0.13)'
    );

    pitchGradient.addColorStop(
        1,
        'rgba(0,26,29,0.36)'
    );

    ctx.fillStyle = pitchGradient;

    ctx.fillRect(
        0,
        pitchY,
        900,
        208
    );

    // Far pitch line
    ctx.strokeStyle =
        'rgba(101,231,218,0.12)';

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        0,
        pitchY + 32
    );

    ctx.lineTo(
        900,
        pitchY + 32
    );

    ctx.stroke();

    // Center line
    ctx.strokeStyle =
        'rgba(101,231,218,0.07)';

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        450,
        pitchY
    );

    ctx.lineTo(
        450,
        600
    );

    ctx.stroke();
}

function drawMenuBackground() {
    // BUGFIX / DESIGN FIX: this used to be a flat dark fill plus two soft
    // red/blue radial blobs — a much plainer look than the hand-built scene
    // the MENU state assembled inline (floodlights, crowd depth, live pitch).
    // Every secondary screen (difficulty select, instructions, settings,
    // stats, tournament, pause, etc.) calls this function, so they all read
    // as "older" than the main menu even though they share the same button
    // kit. Now every screen opens with the identical cinematic stadium
    // scene, then layers its own drifting motes on top exactly as before.
    const time = Date.now() * 0.001;
    drawStadiumScene(time);

    ctx.fillStyle = '#ffffff';
    for (let p of menuBgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 900;
        if (p.x > 900) p.x = 0;
        if (p.y < 0) p.y = 600;
        if (p.y > 600) p.y = 0;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

// ============================================================
// SHARED "PREMIUM GLASS" UI KIT
// Used across pause / settings / stats / difficulty / tournament
// screens so every menu shares one consistent visual language.
// Geometry (x/y/w/h) is always caller-controlled and unchanged
// from the original layout, so click hit-testing in input.js is
// never affected — only how each panel/button is painted.
// ============================================================

function drawGlassPanel(x, y, w, h, r = 20, accent = 'rgba(255,255,255,0.14)') {
    ctx.save();
    // Soft drop shadow for depth
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 14;

    const bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, 'rgba(24,32,46,0.92)');
    bg.addColorStop(1, 'rgba(9,13,22,0.96)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Top glass highlight sheen
    const sheen = ctx.createLinearGradient(x, y, x, y + h * 0.4);
    sheen.addColorStop(0, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
    ctx.stroke();
    ctx.restore();
}

function drawGlowTitle(text, x, y, color, size = 38) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `900 ${size}px Outfit, sans-serif`;
    ctx.shadowColor = color;
    ctx.shadowBlur = 24;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.94;
    ctx.fillText(text, x, y);
    ctx.restore();
}

// A pill/card button with hover-aware glow. Returns nothing — caller still
// owns and stores the hit-box exactly as before.
function drawPillButton(x, y, w, h, label, color, opts = {}) {
    const { active = false, sub = null, filled = false, fontSize = 20 } = opts;
    ctx.save();
    const alphaBase = filled || active ? 0.22 : 0.09;
    ctx.shadowColor = color;
    ctx.shadowBlur = active ? 18 : 0;
    ctx.fillStyle = hexToRgba(color, alphaBase);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(16, h / 2.4));
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = hexToRgba(color, active ? 0.95 : 0.55);
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(16, h / 2.4));
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.font = `800 ${fontSize}px Outfit, sans-serif`;
    ctx.fillText(label, x + w / 2, y + (sub ? h * 0.42 : h / 2) + fontSize * 0.32);

    if (sub) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '500 11px Outfit, sans-serif';
        ctx.fillText(sub, x + w / 2, y + h * 0.75);
    }
    ctx.restore();
}

function hexToRgba(hex, alpha) {
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
// REDESIGNED: cards were plain colored pills with just a label + one-word
// sub-line — flat and same-shaped regardless of difficulty, so the screen
// read as "5 identical buttons with different text" rather than a real
// difficulty ladder. This version adds a per-level icon, a short
// description, and a "power bar" (filled dots) so the jump in challenge
// from EASY to WORLD CLASS is visible at a glance, not just implied by
// color. Hit-box globals (window._difficultyBtns, window._diffBackBtn)
// keep the exact same shape/keys input.js already reads.
// ============================================================
function drawDifficultySelect() {
    drawMenuBackground();
    ctx.save();

    // Framing glass panel so this screen (VS COMPUTER's difficulty picker)
    // reads as part of the same UI family as the main menu's command panel
    // instead of floating cards on a bare background.
    drawGlassPanel(90, 40, 720, 480, 24, 'rgba(0,229,255,0.20)');

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '700 11px "Arial Narrow", sans-serif';
    ctx.fillText('VS COMPUTER', 450, 72);
    drawGlowTitle('SELECT DIFFICULTY', 450, 108, '#00e5ff', 36);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Choose your challenge level', 450, 132);

    // ===== 3 + 2 GRID, evenly spaced, each card carrying its own identity =====
    const levels = [
        { key: 'EASY', label: 'EASY', icon: '🙂', sub: 'Casual Play', color: '#2ecc71', power: 1 },
        { key: 'MEDIUM', label: 'MEDIUM', icon: '⚔️', sub: 'Balanced', color: '#f1c40f', power: 2 },
        { key: 'HARD', label: 'HARD', icon: '🔥', sub: 'Expert', color: '#e74c3c', power: 3 },
        { key: 'ELITE', label: 'ELITE', icon: '⭐', sub: 'Pro Level', color: '#9b59b6', power: 4 },
        { key: 'WORLD_CLASS', label: 'WORLD CLASS', icon: '👑', sub: 'Ultimate', color: '#00d2ff', power: 5 }
    ];

    const cardW = 168, cardH = 130, gapX = 18, gapY = 14;
    const row1Y = 150;
    const row2Y = row1Y + cardH + gapY;
    const row1StartX = 450 - (3 * cardW + 2 * gapX) / 2;
    const row2StartX = 450 - (2 * cardW + gapX) / 2;

    const positions = [
        { x: row1StartX, y: row1Y },
        { x: row1StartX + cardW + gapX, y: row1Y },
        { x: row1StartX + 2 * (cardW + gapX), y: row1Y },
        { x: row2StartX, y: row2Y },
        { x: row2StartX + cardW + gapX, y: row2Y }
    ];

    window._difficultyBtns = [];
    levels.forEach((lvl, idx) => {
        const isSelected = difficulty === lvl.key;
        const { x, y } = positions[idx];

        ctx.save();
        ctx.shadowColor = lvl.color;
        ctx.shadowBlur = isSelected ? 20 : 0;
        ctx.fillStyle = hexToRgba(lvl.color, isSelected ? 0.22 : 0.09);
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = hexToRgba(lvl.color, isSelected ? 0.95 : 0.5);
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 16);
        ctx.stroke();
        ctx.restore();

        const cx = x + cardW / 2;

        // Icon
        ctx.textAlign = 'center';
        ctx.font = '28px Outfit, sans-serif';
        ctx.fillText(lvl.icon, cx, y + 40);

        // Label
        ctx.shadowColor = lvl.color;
        ctx.shadowBlur = isSelected ? 10 : 0;
        ctx.fillStyle = lvl.color;
        ctx.font = `800 ${lvl.label.length > 7 ? 15 : 18}px Outfit, sans-serif`;
        ctx.fillText(lvl.label, cx, y + 66);
        ctx.shadowBlur = 0;

        // Sub-label
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '500 11px Outfit, sans-serif';
        ctx.fillText(lvl.sub, cx, y + 84);

        // Power bar — 5 dots, filled up to lvl.power, makes the difficulty
        // ladder visible at a glance instead of relying on reading text.
        const dotR = 4, dotGap = 12, dotsW = dotGap * 4;
        const dotsStartX = cx - dotsW / 2;
        for (let d = 0; d < 5; d++) {
            ctx.beginPath();
            ctx.arc(dotsStartX + d * dotGap, y + 108, dotR, 0, Math.PI * 2);
            ctx.fillStyle = d < lvl.power ? lvl.color : 'rgba(255,255,255,0.15)';
            ctx.fill();
        }

        if (isSelected) {
            ctx.fillStyle = lvl.color;
            ctx.font = '700 10px Outfit, sans-serif';
            ctx.fillText('✓ SELECTED', cx, y + cardH - 14);
        }

        window._difficultyBtns.push({ x, y, w: cardW, h: cardH, key: lvl.key });
    });

    // Back button
    const backY = row2Y + cardH + 20;
    drawPillButton(350, backY, 200, 42, '← BACK', '#9b59b6', { fontSize: 16 });
    window._diffBackBtn = { x: 350, y: backY, w: 200, h: 42 };

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Press E M H I W or tap a card', 450, backY + 52);
    ctx.restore();
}

// ============================================================
// INSTRUCTIONS — rebuilt on the shared glass-panel/glow-title/pill-button
// kit so it visually matches the main menu and every other secondary
// screen instead of the old flat rgba(255,255,255,0.04) cards.
// Hit-box for window._backBtn is unchanged so input.js needs no edits.
// ============================================================
// ============================================================
// REDESIGNED: the old layout mixed a per-card x-offset (150 + idx*220)
// with a per-card y-offset (140/280/420) at the same time, so the three
// cards ended up scattered on a diagonal staircase instead of sitting in
// a clean row or grid — that's the "bad design" from the screenshot.
// This version frames everything in one glass panel (matching every other
// secondary screen) and lays the three cards out as a single evenly
// spaced row, each the same height, each vertically centered on the
// panel, with generous internal padding instead of floating in empty
// space.
// ============================================================
function drawInstructionsScreen() {
    drawMenuBackground();
    ctx.save();

    drawGlassPanel(90, 50, 720, 470, 24, 'rgba(241,196,15,0.20)');

    ctx.textAlign = 'center';
    drawGlowTitle('📖 HOW TO PLAY', 450, 100, '#f1c40f', 34);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Everything you need to get on the pitch', 450, 124);

    const cards = [
        { title: '🎮 CONTROLS', color: '#46e5ff',
          lines: isMobileDevice ?
          ['RED: Left Joystick', '+ ⚽ Shoot button', 'BLUE: Right Joystick', '+ ⚽ Shoot button'] :
          ['RED: WASD', 'SPACE to Shoot', 'BLUE: ⬆⬇⬅➡', 'ENTER to Shoot'] },
        { title: '⚽ RULES', color: '#f1c40f',
          lines: [`Two ${halfDuration}s halves`, 'Most goals wins!', 'GK holds ball', 'for 6s max'] },
        { title: '💡 TIPS', color: '#2ecc71',
          lines: ['Pass to open', 'teammates', 'Shoot from', 'close range', 'Eject GK on block'] }
    ];

    const cardW = 205, cardH = 260, gap = 20;
    const rowY = 155;
    const totalRowW = cards.length * cardW + (cards.length - 1) * gap;
    const rowStartX = 450 - totalRowW / 2;

    cards.forEach((card, idx) => {
        const x = rowStartX + idx * (cardW + gap);
        drawGlassPanel(x, rowY, cardW, cardH, 16, hexToRgba(card.color, 0.35));
        const cx = x + cardW / 2;

        ctx.textAlign = 'center';
        ctx.shadowColor = card.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = card.color;
        ctx.font = '700 19px Outfit, sans-serif';
        ctx.fillText(card.title, cx, rowY + 40);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = hexToRgba(card.color, 0.4);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 24, rowY + 55);
        ctx.lineTo(x + cardW - 24, rowY + 55);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.font = '600 14px Outfit, sans-serif';
        const lineGap = 26;
        const linesBlockH = card.lines.length * lineGap;
        const linesStartY = rowY + 55 + (cardH - 55 - linesBlockH) / 2 + lineGap * 0.6;
        card.lines.forEach((line, i) => {
            ctx.fillText(line, cx, linesStartY + i * lineGap);
        });
    });

    drawPillButton(350, 545, 200, 40, '← BACK', '#9b59b6', { fontSize: 17 });
    window._backBtn = { x: 350, y: 545, w: 200, h: 40 };

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Press ESC or tap BACK to return', 450, 500);
    ctx.restore();
}

// ============================================================
// SETTINGS — rebuilt on the shared glass-panel kit. All hit-box
// globals (window._sliderRect, window._musicBtn, window._sfxBtn,
// window._backBtn) keep their exact original coordinates.
// ============================================================
function drawSettingsScreen() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    drawGlowTitle('⚙️ SETTINGS', 450, 70, '#f1c40f', 36);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Match length and audio', 450, 96);

    const cardX = 200, cardY = 120, cardW = 500, cardH = 280;
    drawGlassPanel(cardX, cardY, cardW, cardH, 20, 'rgba(241,196,15,0.22)');

    ctx.fillStyle = '#f1c40f';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.fillText('⏱️ HALF DURATION', 450, 170);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 40px Outfit, sans-serif';
    ctx.fillText(`${halfDuration}s`, 450, 235);

    const sliderX = 280, sliderY = 270, sliderW = 340, sliderH = 8;
    const knobRadius = 16;
    const minVal = 15, maxVal = 120;
    const progress = (halfDuration - minVal) / (maxVal - minVal);
    const knobX = sliderX + progress * sliderW;

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(sliderX, sliderY - sliderH/2, sliderW, sliderH, 4);
    ctx.fill();
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.roundRect(sliderX, sliderY - sliderH/2, knobX - sliderX, sliderH, 4);
    ctx.fill();

    const grad = ctx.createRadialGradient(knobX-4, sliderY-4, 2, knobX, sliderY, knobRadius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, '#f1c40f');
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(knobX, sliderY, knobRadius, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${minVal}s`, sliderX - 10, sliderY + 30);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxVal}s`, sliderX + sliderW + 10, sliderY + 30);
    window._sliderRect = { x: sliderX, y: sliderY - 20, w: sliderW, h: 40 };

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText('🔊 SOUND CONTROLS', 450, 340);

    const toggleY = 360;
    drawPillButton(320, toggleY, 180, 45, `🎵 ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`,
        SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c', { active: SoundManager.musicEnabled, fontSize: 17 });
    window._musicBtn = { x: 320, y: toggleY, w: 180, h: 45 };

    drawPillButton(520, toggleY, 180, 45, `🔊 ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`,
        SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c', { active: SoundManager.sfxEnabled, fontSize: 17 });
    window._sfxBtn = { x: 520, y: toggleY, w: 180, h: 45 };

    drawPillButton(350, 430, 200, 45, '← BACK', '#9b59b6', { fontSize: 18 });
    window._backBtn = { x: 350, y: 430, w: 200, h: 45 };

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Drag the knob or use ⬆ ⬇ keys', 450, 500);
    ctx.fillText('Press ESC or tap BACK to return', 450, 580);
    ctx.restore();
}

function drawPauseButton() {
    const x = 860, y = 15, w = 30, h = 30;
    ctx.save();
    ctx.fillStyle = pauseButton.hover ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 8, y + 7, 4, 16);
    ctx.fillRect(x + 18, y + 7, 4, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '7px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', x + w/2, y + h + 12);
    ctx.restore();
}

function drawPauseMenu() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0,0,GAME_W,GAME_H);

    drawGlassPanel(250, 150, 400, 320, 22, 'rgba(241,196,15,0.25)');

    ctx.textAlign = 'center';
    drawGlowTitle('⏸ PAUSED', 450, 210, '#f1c40f', 36);

    drawPillButton(350, 235, 200, 50, '▶ RESUME', '#2ecc71', { fontSize: 20 });
    drawPillButton(350, 295, 200, 50, '🏠 MAIN MENU', '#e74c3c', { fontSize: 20 });

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('SOUND CONTROLS', 450, 370);

    drawPillButton(330, 385, 110, 35, `🎵 ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`,
        SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c', { active: SoundManager.musicEnabled, fontSize: 15 });
    drawPillButton(460, 385, 110, 35, `🔊 ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`,
        SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c', { active: SoundManager.sfxEnabled, fontSize: 15 });

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '500 10px Outfit, sans-serif';
    ctx.fillText('Music', 385, 427);
    ctx.fillText('SFX', 515, 427);

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Press [ ESC ] or [ P ] to resume', 450, 445);
    ctx.restore();
}

function drawStatsScreen() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    drawGlowTitle('📊 STATISTICS', 450, 70, '#00e5ff', 34);
    // ===== 5 TIERS: EASY, MEDIUM, HARD, ELITE, WORLD CLASS — one row, evenly spaced =====
    const difficulties = ['EASY', 'MEDIUM', 'HARD', 'ELITE', 'WORLD_CLASS'];
    const displayLabels = { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD', ELITE: 'ELITE', WORLD_CLASS: 'WORLD CLASS' };
    const colors = ['#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#00d2ff'];
    const cardWidth = 164, cardGap = 8, cardHeight = 380;
    const totalWidth = difficulties.length * cardWidth + (difficulties.length - 1) * cardGap;
    const marginX = (900 - totalWidth) / 2;
    const y = 100;

    difficulties.forEach((diff, idx) => {
        const stats = overallStats[diff];
        const x = marginX + idx * (cardWidth + cardGap);
        const centerX = x + cardWidth / 2;

        drawGlassPanel(x, y, cardWidth, cardHeight, 14, hexToRgba(colors[idx], 0.55));

        ctx.textAlign = 'center';
        ctx.shadowColor = colors[idx];
        ctx.shadowBlur = 10;
        ctx.fillStyle = colors[idx];
        ctx.font = '800 16px Outfit, sans-serif';
        ctx.fillText(displayLabels[diff], centerX, y + 32);
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(x + 20, y + 44);
        ctx.lineTo(x + cardWidth - 20, y + 44);
        ctx.strokeStyle = hexToRgba(colors[idx], 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();

        const lines = [
            `Matches: ${stats.matches}`,
            `Goals For: ${stats.goalsScored}`,
            `Goals Against: ${stats.goalsConceded}`,
            `Best Win: ${stats.bestWinScore}`,
            `Worst Loss: ${stats.worstDefeatScore}`,
            `Avg Poss: ${stats.matches ? Math.round((stats.possessionTotal / stats.matches) * 100) : 0}%`,
            `Total Passes: ${stats.passesTotal}`,
            `Opp GK Saves: ${stats.gkSavesTotal}`
        ];
        lines.forEach((line, i) => {
            ctx.fillStyle = 'rgba(255,255,255,0.72)';
            ctx.font = '500 11px Outfit, sans-serif';
            ctx.fillText(line, centerX, y + 66 + i * 22);
        });
    });

    drawPillButton(350, 500, 200, 45, '← BACK', '#9b59b6', { fontSize: 17 });
    window._backBtn = { x: 350, y: 500, w: 200, h: 45 };
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Press ESC or tap BACK to return', 450, 565);
    ctx.restore();
}

// ============================================================
// REDESIGNED: the old layout had the format card at y:250, then a huge
// 130px jump down to the Start button at y:380 (65px tall, ending at 445),
// then Back squeezed in right after at y:450 with barely any gap, while
// the panel itself had ~35px of dead space below Back before it ended at
// y:480. Everything below the title was unevenly spaced. This version
// gives every element consistent, deliberate gaps and centers the whole
// block vertically in the panel.
// ============================================================
function drawTournamentMenu() {
    drawMenuBackground();
    ctx.save();

    drawGlassPanel(150, 60, 600, 420, 24, 'rgba(241,196,15,0.22)');

    ctx.textAlign = 'center';
    drawGlowTitle('🏆 TOURNAMENT', 450, 130, '#f1c40f', 44);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillText('Select Tournament Format', 450, 172);

    const formats = [
        { size: 32, label: '32 TEAMS', desc: 'Full FIFA World Cup Style' }
    ];

    const formatY = 210;
    const formatH = 70;
    window._tournamentFormatBtns = [];
    formats.forEach((fmt, idx) => {
        const isSelected = tournamentFormat === fmt.size;
        drawPillButton(450 - 160, formatY, 320, formatH, fmt.label, '#f1c40f', { active: isSelected, sub: fmt.desc, fontSize: 22 });
        window._tournamentFormatBtns[idx] = { x: 450 - 160, y: formatY, w: 320, h: formatH, size: fmt.size };
    });

    const startY = formatY + formatH + 45;
    drawPillButton(300, startY, 300, 55, '▶ START TOURNAMENT', '#2ecc71', { active: true, fontSize: 22 });
    window._tournamentStartBtn = { x: 300, y: startY, w: 300, h: 55 };

    const backY = startY + 55 + 35;
    drawPillButton(350, backY, 200, 40, '← BACK', '#9b59b6', { fontSize: 16 });
    window._tournamentBackBtn = { x: 350, y: backY, w: 200, h: 40 };
    ctx.restore();
}

function drawTeamSelection() {
    drawMenuBackground();
    ctx.save();

    drawGlassPanel(60, 30, 780, 560, 24, 'rgba(0,229,255,0.18)');

    ctx.textAlign = 'center';
    drawGlowTitle('SELECT YOUR TEAM', 450, 60, '#00e5ff', 32);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Choose the team you want to control in the tournament', 450, 88);

    let displayTeams = [...TOURNAMENT_TEAMS];
    if (tournamentFormat === 16) displayTeams = displayTeams.slice(0, 16);
    else if (tournamentFormat === 8) displayTeams = displayTeams.filter(t => t.tier === 'WORLD_CLASS').slice(0, 8);

    const cols = 5;
    const cardW = 110;
    const cardH = 60;
    const gapX = 8;
    const gapY = 6;
    const startX = 450 - (cols * (cardW + gapX) - gapX) / 2;
    const startY = 105;

    const totalRows = Math.ceil(displayTeams.length / cols);
    const totalContentHeight = totalRows * (cardH + gapY) + 80;
    
    if (typeof window._teamScrollOffset === 'undefined') window._teamScrollOffset = 0;
    const maxScroll = Math.max(0, totalContentHeight - 420);
    if (window._teamScrollOffset > maxScroll) window._teamScrollOffset = maxScroll;
    if (window._teamScrollOffset < 0) window._teamScrollOffset = 0;
    const scrollY = window._teamScrollOffset || 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 90, 900, 420);
    ctx.clip();

    displayTeams.forEach((team, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY) - scrollY;
        if (y + cardH < 90 || y > 510) return;
        const isSelected = tournamentSelectedTeam === team.id;
        const cardAccent = isSelected ? '#f1c40f' : (team.color || '#46e5ff');
        const cardGrad = ctx.createLinearGradient(x, y, x, y + cardH);
        if (isSelected) {
            cardGrad.addColorStop(0, 'rgba(241,196,15,0.28)');
            cardGrad.addColorStop(1, 'rgba(241,196,15,0.12)');
        } else {
            cardGrad.addColorStop(0, 'rgba(255,255,255,0.07)');
            cardGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
        }
        ctx.fillStyle = cardGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 8);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#f1c40f' : hexToRgba(cardAccent, 0.35);
        ctx.lineWidth = isSelected ? 2.5 : 1.4;
        if (isSelected) { ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 10; }
        ctx.stroke();
        ctx.shadowBlur = 0;
        drawTeamFlag(team, x + cardW / 2, y + 30, 22, 'center');
        ctx.fillStyle = isSelected ? '#f1c40f' : '#ffffff';
        ctx.font = isSelected ? '700 10px Outfit, sans-serif' : '600 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        let shortName = team.name.length > 10 ? team.name.slice(0, 10) + '..' : team.name;
        ctx.fillText(shortName, x + cardW / 2, y + 50);
        window._teamSelectBtns = window._teamSelectBtns || [];
        window._teamSelectBtns[idx] = { x: x, y: y + scrollY, w: cardW, h: cardH, teamId: team.id };
    });

    ctx.restore();

    if (totalContentHeight > 420) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(875, 140, 10, 300, 5);
        ctx.fill();
        const thumbHeight = Math.max(30, 300 * (420 / totalContentHeight));
        const thumbY = 140 + (300 - thumbHeight) * (scrollY / maxScroll);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.roundRect(875, thumbY, 10, thumbHeight, 5);
        ctx.fill();
    }

    ctx.fillStyle = tournamentSelectedTeam !== null ? 'rgba(46, 204, 113, 0.25)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(280, 520, 340, 45, 12);
    ctx.fill();
    ctx.strokeStyle = tournamentSelectedTeam !== null ? '#2ecc71' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = tournamentSelectedTeam !== null ? '#2ecc71' : 'rgba(255,255,255,0.25)';
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.shadowColor = tournamentSelectedTeam !== null ? '#2ecc71' : 'transparent';
    ctx.shadowBlur = tournamentSelectedTeam !== null ? 18 : 0;
    ctx.fillText('✅ CONFIRM TEAM', 450, 548);
    ctx.shadowBlur = 0;
    window._tournamentConfirmBtn = { x: 280, y: 520, w: 340, h: 45 };

    drawPillButton(350, 570, 200, 25, '← BACK', '#9b59b6', { fontSize: 13 });
    window._tournamentSelectBackBtn = { x: 350, y: 570, w: 200, h: 25 };
    ctx.restore();
}
function drawGroupStage() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    const progress = TournamentManager.getProgress();
    drawGlowTitle('📊 GROUP STAGE', 450, 45, '#00e5ff', 28);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 14px Outfit, sans-serif';
    const day = TournamentManager.currentMatchDay || 0;
    ctx.fillText(`Match Day ${day + 1} / 3 • Progress: ${progress}%`, 450, 70);

    const groups = TournamentManager.getAllGroupStandings();
    const cols = 4;
    const cardW = 180;
    const cardH = 200;
    const gapX = 15;
    const gapY = 15;
    const startX = 450 - (cols * (cardW + gapX) - gapX) / 2;
    const startY = 95;

    const totalRows = Math.ceil(groups.length / cols);
    const totalContentHeight = totalRows * (cardH + gapY) + 50;
    
    if (typeof window._groupScrollOffset === 'undefined') window._groupScrollOffset = 0;
    const maxScroll = Math.max(0, totalContentHeight - 420);
    if (window._groupScrollOffset > maxScroll) window._groupScrollOffset = maxScroll;
    if (window._groupScrollOffset < 0) window._groupScrollOffset = 0;
    const scrollY = window._groupScrollOffset || 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 80, 900, 420);
    ctx.clip();

    groups.forEach((group, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY) - scrollY;
        if (y + cardH < 80 || y > 500) return;
        const grad = ctx.createLinearGradient(x, y, x, y + cardH);
        grad.addColorStop(0, 'rgba(255,255,255,0.075)');
        grad.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(241,196,15,0.28)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#f1c40f';
        ctx.font = '700 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Group ${group.name}`, x + cardW / 2, y + 22);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '600 9px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Team', x + 6, y + 38);
        ctx.textAlign = 'center';
        ctx.fillText('MP', x + cardW - 40, y + 38);
        ctx.fillText('Pts', x + cardW - 12, y + 38);

        const standings = group.standings || [];
        standings.slice(0, 4).forEach((entry, sIdx) => {
            const team = entry.team;
            const yPos = y + 42 + sIdx * 28;
            const isPlayerTeam = team && team.id === tournamentSelectedTeam;
            ctx.textAlign = 'left';
            ctx.fillStyle = isPlayerTeam ? '#f1c40f' : 'rgba(255,255,255,0.8)';
            ctx.font = isPlayerTeam ? '700 10px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
            const name = team ? (team.name.length > 8 ? team.name.slice(0, 8) : team.name) : '???';
            const flagW = drawTeamFlag(team || { flag: '❓' }, x + 6, yPos + 8, 10, 'left');
            ctx.fillText(name, x + 6 + flagW, yPos + 8);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '500 10px Outfit, sans-serif';
            ctx.fillText(entry.played, x + cardW - 40, yPos + 8);
            ctx.fillStyle = isPlayerTeam ? '#f1c40f' : 'rgba(255,255,255,0.8)';
            ctx.font = isPlayerTeam ? '700 11px Outfit, sans-serif' : '600 10px Outfit, sans-serif';
            ctx.fillText(entry.points, x + cardW - 12, yPos + 8);
        });
    });

    ctx.restore();

    if (totalContentHeight > 420) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(875, 120, 10, 300, 5);
        ctx.fill();
        const thumbHeight = Math.max(30, 300 * (420 / totalContentHeight));
        const thumbY = 120 + (300 - thumbHeight) * (scrollY / maxScroll);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.roundRect(875, thumbY, 10, thumbHeight, 5);
        ctx.fill();
    }

    // ===== BOTTOM BUTTONS =====
    // BUGFIX: these hit-box globals used to only get SET inside their own
    // branch below and were never cleared in the others. That left stale
    // rects (e.g. a leftover _tournamentOutBtn from an earlier eliminated
    // run) sitting at the same on-screen coordinates as later buttons —
    // including the EXIT TOURNAMENT button right below them — so a tap
    // could get silently swallowed by a rect from a state that isn't even
    // being drawn anymore. Clearing all three every frame before the
    // branches run means only the button actually drawn THIS frame can
    // ever be clicked.
    window._tournamentNextRoundBtn = null;
    window._tournamentOutBtn = null;
    window._tournamentPlayMatchBtn = null;

    const nextMatch = TournamentManager.getPlayerNextMatch();
    const isComplete = TournamentManager.isComplete();
    const isPlayerOut = TournamentManager.isPlayerEliminated();
    const didQualify = TournamentManager.didPlayerQualify();
    const champion = TournamentManager.champion;
    const groupStageComplete = TournamentManager.groupStageComplete;
    
    if (groupStageComplete) {
        if (didQualify && !isPlayerOut) {
            // Player qualified – show "NEXT ROUND" button
            ctx.fillStyle = 'rgba(46, 204, 113, 0.25)';
            ctx.beginPath();
            ctx.roundRect(250, 520, 400, 50, 14);
            ctx.fill();
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#2ecc71';
            ctx.font = '700 20px Outfit, sans-serif';
            ctx.shadowColor = '#2ecc71';
            ctx.shadowBlur = 20;
            ctx.fillText('⚡ NEXT ROUND - KNOCKOUT STAGE', 450, 548);
            ctx.shadowBlur = 0;
            window._tournamentNextRoundBtn = { x: 250, y: 520, w: 400, h: 50 };
        } else if (isPlayerOut || isComplete) {
            // Player eliminated or tournament complete
            ctx.fillStyle = 'rgba(231, 76, 60, 0.25)';
            ctx.beginPath();
            ctx.roundRect(250, 520, 400, 50, 14);
            ctx.fill();
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#e74c3c';
            ctx.font = '700 18px Outfit, sans-serif';
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 15;
            if (champion) {
                fillTextWithFlags(['❌ YOU ARE OUT! 🏆 ', champion, ` ${champion.name} WON!`], 450, 548, ctx.font, ctx.fillStyle);
            } else {
                ctx.fillText('❌ YOU ARE OUT OF THE WORLD CUP', 450, 548);
            }
            ctx.shadowBlur = 0;
            window._tournamentOutBtn = { x: 250, y: 520, w: 400, h: 50 };
        }
    } else if (nextMatch) {
        // Player has a match to play
        // BUGFIX: this box was a fixed 400px wide with a fixed 18px font, so
        // long matchups ("⚽ PLAY GROUP MATCH: South Korea vs Netherlands")
        // rendered wider than the box itself and spilled out both sides —
        // exactly what the screenshot showed. Now the box is wider (700px,
        // still centered) and the font auto-shrinks (down to a floor of
        // 13px) until the label actually fits inside it with some padding.
        const btnX = 100, btnW = 700, btnY = 520, btnH = 50;
        const matchInfo = nextMatch.type === 'group' ? 'GROUP MATCH' : 'KNOCKOUT';
        const teamAName = nextMatch.teamA ? nextMatch.teamA.name : 'TBD';
        const teamBName = nextMatch.teamB ? nextMatch.teamB.name : 'TBD';
        const label = `⚽ PLAY ${matchInfo}: ${teamAName} vs ${teamBName}`;

        ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 14);
        ctx.fill();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#2ecc71';
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 15;

        const maxTextWidth = btnW - 40;
        let fontSize = 18;
        ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
        while (ctx.measureText(label).width > maxTextWidth && fontSize > 13) {
            fontSize--;
            ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
        }
        ctx.fillText(label, btnX + btnW / 2, btnY + btnH / 2 + fontSize * 0.32);
        ctx.shadowBlur = 0;
        window._tournamentPlayMatchBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    } else if (!groupStageComplete) {
        // Waiting for AI matches to finish
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(250, 520, 400, 50, 14);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '600 15px Outfit, sans-serif';
        ctx.fillText('⏳ Processing match day...', 450, 548);
    }

    // ===== EXIT BUTTON =====
    // BUGFIX: this used to be a 200×22px "← BACK" pill that silently
    // dumped the player out of an in-progress tournament with a single
    // tap/click — no confirmation, easy to hit by accident while trying
    // to tap something else. It's now a normal-sized button labeled
    // "EXIT TOURNAMENT" and input.js (see fix there) asks for confirmation
    // before it actually leaves.
    // BUGFIX: moved to the top-right corner (as requested) instead of a
    // bottom pill squeezed under the match button, and given a bit more
    // width + a space in the label so "✕ EXIT TOURNAMENT" doesn't render
    // clipped/cramped like it did before.
    drawPillButton(720, 15, 165, 30, '✕ EXIT', '#9b59b6', { fontSize: 13 });
    window._tournamentGroupBackBtn = { x: 720, y: 15, w: 165, h: 30 };

    // BUGFIX: the exit-confirmation overlay used to only be drawn from a
    // block near the bottom of draw()'s try body — but every tournament
    // screen (this one included) does an early `return` right after its
    // own drawXxx() call, so that shared block was unreachable dead code.
    // Tapping "Exit" would set window._confirmExitTournament = true and
    // then nothing would ever appear, so the Yes/No buttons never got
    // positioned and taps did nothing. Drawing the overlay here — the one
    // screen that can actually set the flag — makes it reachable again.
    drawExitTournamentConfirmOverlay();

    ctx.restore();
}

function drawExitTournamentConfirmOverlay() {
    if (!window._confirmExitTournament) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    drawGlassPanel(250, 210, 400, 200, 22, 'rgba(231,76,60,0.4)');

    ctx.textAlign = 'center';
    drawGlowTitle('⚠️ EXIT TOURNAMENT?', 450, 265, '#e74c3c', 26);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Your progress in this tournament will be lost.', 450, 300);

    drawPillButton(275, 330, 150, 45, 'STAY', '#2ecc71', { fontSize: 17 });
    window._confirmExitNoBtn = { x: 275, y: 330, w: 150, h: 45 };

    drawPillButton(475, 330, 150, 45, 'EXIT', '#e74c3c', { fontSize: 17 });
    window._confirmExitYesBtn = { x: 475, y: 330, w: 150, h: 45 };

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillText('ESC to stay • ENTER to exit', 450, 392);
    ctx.restore();
}

function drawTournamentBracket() {
    drawMenuBackground();
    ctx.save();

    const bracket = TournamentManager.getBracketStatus();
    if (!bracket || bracket.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '600 20px Outfit, sans-serif';
        ctx.fillText('Bracket not yet available', 450, 300);
        ctx.restore();
        return;
    }

    const nextMatch = TournamentManager.getPlayerNextMatch();
    const isComplete = TournamentManager.isComplete();
    const isEliminated = TournamentManager.isPlayerEliminated();
    const currentRound = TournamentManager.currentKnockoutRound || 0;

    // ===== ROUND TITLE =====
    const roundNames = ['ROUND OF 16', 'QUARTER-FINALS', 'SEMI-FINALS', 'WORLD CUP FINAL'];
    const currentRoundName = roundNames[currentRound] || 'KNOCKOUT STAGE';

    ctx.textAlign = 'center';
    drawGlowTitle(`🏆 ${currentRoundName}`, 450, 45, '#f1c40f', 30);

    // ===== GET ALL MATCHES =====
    const round0 = bracket[0]?.matches || [];
    const round1 = bracket[1]?.matches || [];
    const round2 = bracket[2]?.matches || [];
    const round3 = bracket[3]?.matches || [];

    // ===== LAYOUT CONSTANTS =====
    // Columns across the 900px canvas, left-to-right: R16(L), QF(L), SF(L), FINAL, SF(R), QF(R), R16(R)
    // boxWidth/gapX are chosen so all 7 columns fit with even gaps and the SF boxes
    // never overlap the FINAL box (the old layout used a wider box that collided here).
    const boxWidth = 110;
    const boxHeight = 34;
    const gapY = 10;
    const gapX = 15;
    const startY = 70;
    const totalHeight = 450;

    // Split round0 into left (A-D) and right (E-H)
    const leftMatches = round0.slice(0, 4);
    const rightMatches = round0.slice(4, 8);

    function getYPositions(count, startY, totalHeight, boxHeight, gapY) {
        const totalBoxHeight = count * boxHeight + (count - 1) * gapY;
        const offset = (totalHeight - totalBoxHeight) / 2;
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push(startY + offset + i * (boxHeight + gapY));
        }
        return positions;
    }

    const leftY = getYPositions(leftMatches.length, startY, totalHeight, boxHeight, gapY);
    const rightY = getYPositions(rightMatches.length, startY, totalHeight, boxHeight, gapY);

    // X positions for each round — evenly spaced, symmetric around the canvas center (450)
    const marginX = (900 - (7 * boxWidth + 6 * gapX)) / 2;
    const col0 = marginX;                          // R16 outer columns
    const col1 = col0 + boxWidth + gapX;            // QF columns
    const col2 = col1 + boxWidth + gapX;            // SF columns
    const col3 = col2 + boxWidth + gapX;            // FINAL (centered)
    const col4 = col3 + boxWidth + gapX;            // SF (right)
    const col5 = col4 + boxWidth + gapX;            // QF (right)
    const col6 = col5 + boxWidth + gapX;            // R16 (right)

    const leftX = [col0, col1, col2];
    const rightX = [col6, col5, col4];
    const finalX = col3;

    // ===== DRAW LEFT HALF (GROUPS A-D) =====
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillText('GROUPS A - D', leftX[0] + boxWidth/2, startY - 10);

    for (let i = 0; i < leftMatches.length; i++) {
        const match = leftMatches[i];
        const y = leftY[i];
        drawBracketMatchBox(ctx, match, leftX[0], y, boxWidth, boxHeight, tournamentSelectedTeam);
    }

    // Quarter-Finals (left)
    const leftQF = round1.slice(0, 2);
    const qfY = getYPositions(leftQF.length, startY + 20, totalHeight - 40, boxHeight, gapY);
    for (let i = 0; i < leftQF.length; i++) {
        const match = leftQF[i];
        if (match && match.teamA && match.teamB) {
            drawBracketMatchBox(ctx, match, leftX[1], qfY[i], boxWidth, boxHeight, tournamentSelectedTeam);
        }
    }

    // Semi-Finals (left) – positioned in the center-left
    if (round2[0] && round2[0].teamA && round2[0].teamB) {
        const sfY = startY + totalHeight/2 - boxHeight/2 - 10;
        drawBracketMatchBox(ctx, round2[0], leftX[2], sfY, boxWidth, boxHeight, tournamentSelectedTeam);
    }

    // ===== DRAW RIGHT HALF (GROUPS E-H) =====
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillText('GROUPS E - H', rightX[0] + boxWidth/2, startY - 10);

    for (let i = 0; i < rightMatches.length; i++) {
        const match = rightMatches[i];
        const y = rightY[i];
        drawBracketMatchBox(ctx, match, rightX[0], y, boxWidth, boxHeight, tournamentSelectedTeam);
    }

    // Quarter-Finals (right)
    const rightQF = round1.slice(2, 4);
    const qfYRight = getYPositions(rightQF.length, startY + 20, totalHeight - 40, boxHeight, gapY);
    for (let i = 0; i < rightQF.length; i++) {
        const match = rightQF[i];
        if (match && match.teamA && match.teamB) {
            drawBracketMatchBox(ctx, match, rightX[1], qfYRight[i], boxWidth, boxHeight, tournamentSelectedTeam);
        }
    }

    // Semi-Finals (right) – positioned in the center-right
    if (round2[1] && round2[1].teamA && round2[1].teamB) {
        const sfY = startY + totalHeight/2 - boxHeight/2 - 10;
        drawBracketMatchBox(ctx, round2[1], rightX[2], sfY, boxWidth, boxHeight, tournamentSelectedTeam);
    }

    // ===== DRAW FINAL =====
    if (round3[0] && round3[0].teamA && round3[0].teamB) {
        const finalMatch = round3[0];
        const finalY = startY + totalHeight/2 - boxHeight/2 + 40;
        
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,215,0,0.6)';
        ctx.font = '700 14px Outfit, sans-serif';
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 15;
        ctx.fillText('★ FINAL ★', 450, finalY - 12);
        ctx.shadowBlur = 0;

        // Final box (golden)
        ctx.fillStyle = 'rgba(255,215,0,0.08)';
        ctx.beginPath();
        ctx.roundRect(finalX - 10, finalY - 6, boxWidth + 20, boxHeight + 12, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        drawBracketMatchBox(ctx, finalMatch, finalX, finalY, boxWidth, boxHeight, tournamentSelectedTeam, true);
    }

    // ===== DRAW CONNECTING LINES =====
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;

    // Left: R16 → QF
    for (let i = 0; i < 2; i++) {
        const fromIdx = i * 2;
        const toIdx = i;
        if (fromIdx < leftY.length && toIdx < qfY.length) {
            const y1 = leftY[fromIdx] + boxHeight/2;
            const y2 = leftY[fromIdx + 1] + boxHeight/2;
            const yTo = qfY[toIdx] + boxHeight/2;
            const xFrom = leftX[0] + boxWidth;
            const xTo = leftX[1];
            
            ctx.beginPath();
            ctx.moveTo(xFrom, y1);
            ctx.lineTo(xFrom + 12, y1);
            ctx.lineTo(xFrom + 12, yTo);
            ctx.lineTo(xTo, yTo);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(xFrom, y2);
            ctx.lineTo(xFrom + 12, y2);
            ctx.lineTo(xFrom + 12, yTo);
            ctx.stroke();
        }
    }

    // Left: QF → SF
    if (qfY.length >= 2 && round2[0] && round2[0].teamA) {
        const y1 = qfY[0] + boxHeight/2;
        const y2 = qfY[1] + boxHeight/2;
        const yTo = startY + totalHeight/2 - 10;
        const xFrom = leftX[1] + boxWidth;
        const xTo = leftX[2];
        
        ctx.beginPath();
        ctx.moveTo(xFrom, y1);
        ctx.lineTo(xFrom + 12, y1);
        ctx.lineTo(xFrom + 12, yTo);
        ctx.lineTo(xTo, yTo);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xFrom, y2);
        ctx.lineTo(xFrom + 12, y2);
        ctx.lineTo(xFrom + 12, yTo);
        ctx.stroke();
    }

    // Right: R16 → QF
    for (let i = 0; i < 2; i++) {
        const fromIdx = i * 2;
        const toIdx = i;
        if (fromIdx < rightY.length && toIdx < qfYRight.length) {
            const y1 = rightY[fromIdx] + boxHeight/2;
            const y2 = rightY[fromIdx + 1] + boxHeight/2;
            const yTo = qfYRight[toIdx] + boxHeight/2;
            const xFrom = rightX[0];
            const xTo = rightX[1] + boxWidth;
            
            ctx.beginPath();
            ctx.moveTo(xFrom, y1);
            ctx.lineTo(xFrom - 12, y1);
            ctx.lineTo(xFrom - 12, yTo);
            ctx.lineTo(xTo, yTo);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(xFrom, y2);
            ctx.lineTo(xFrom - 12, y2);
            ctx.lineTo(xFrom - 12, yTo);
            ctx.stroke();
        }
    }

    // Right: QF → SF
    if (qfYRight.length >= 2 && round2[1] && round2[1].teamA) {
        const y1 = qfYRight[0] + boxHeight/2;
        const y2 = qfYRight[1] + boxHeight/2;
        const yTo = startY + totalHeight/2 - 10;
        const xFrom = rightX[1];
        const xTo = rightX[2] + boxWidth;
        
        ctx.beginPath();
        ctx.moveTo(xFrom, y1);
        ctx.lineTo(xFrom - 12, y1);
        ctx.lineTo(xFrom - 12, yTo);
        ctx.lineTo(xTo, yTo);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xFrom, y2);
        ctx.lineTo(xFrom - 12, y2);
        ctx.lineTo(xFrom - 12, yTo);
        ctx.stroke();
    }

    // SF → Final (left and right)
    if (round2[0] && round2[0].teamA && round2[1] && round2[1].teamA) {
        const sfY1 = startY + totalHeight/2 - 10;
        const sfY2 = startY + totalHeight/2 - 10;
        const finalYPos = startY + totalHeight/2 + 40;
        const xFrom1 = leftX[2] + boxWidth;
        const xFrom2 = rightX[2];
        const xTo = finalX;
        
        ctx.beginPath();
        ctx.moveTo(xFrom1, sfY1);
        ctx.lineTo(xFrom1 + 20, sfY1);
        ctx.lineTo(xFrom1 + 20, finalYPos);
        ctx.lineTo(xTo, finalYPos);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xFrom2, sfY2);
        ctx.lineTo(xFrom2 - 20, sfY2);
        ctx.lineTo(xFrom2 - 20, finalYPos);
        ctx.lineTo(xTo + boxWidth, finalYPos);
        ctx.stroke();
    }

    // ===== WINNER LABEL =====
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,215,0,0.25)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillText('⬇ WINNER ⬇', 450, startY + totalHeight + 30);

    // ===== BOTTOM BUTTONS =====
    // Same stale-hitbox bugfix as the group-stage screen: clear every
    // button global this screen can set before deciding which one to draw,
    // so a rect from a branch that isn't active this frame can't keep
    // eating clicks meant for BACK or another button underneath it.
    window._tournamentPlayMatchBtn = null;
    window._tournamentChampionBtn = null;

    let buttonY = startY + totalHeight + 55;

    if (nextMatch && !isComplete && !isEliminated) {
        const teamAName = nextMatch.teamA ? nextMatch.teamA.name : 'TBD';
        const teamBName = nextMatch.teamB ? nextMatch.teamB.name : 'TBD';
        // BUGFIX: same auto-fit as the group-stage play button — a fixed
        // 400px/18px combo could overflow for longer team names.
        const btnX = 150, btnW = 600, btnH = 45;
        const label = `⚽ PLAY: ${teamAName} vs ${teamBName}`;

        ctx.fillStyle = 'rgba(46, 204, 113, 0.25)';
        ctx.beginPath();
        ctx.roundRect(btnX, buttonY, btnW, btnH, 14);
        ctx.fill();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#2ecc71';
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 20;

        const maxTextWidth = btnW - 40;
        let fontSize = 18;
        ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
        while (ctx.measureText(label).width > maxTextWidth && fontSize > 13) {
            fontSize--;
            ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
        }
        ctx.fillText(label, btnX + btnW / 2, buttonY + btnH / 2 + fontSize * 0.32);
        ctx.shadowBlur = 0;
        window._tournamentPlayMatchBtn = { x: btnX, y: buttonY, w: btnW, h: btnH };
    } else if (isComplete) {
        const champion = TournamentManager.champion;
        if (champion) {
            ctx.fillStyle = 'rgba(241, 196, 15, 0.25)';
            ctx.beginPath();
            ctx.roundRect(250, buttonY, 400, 45, 14);
            ctx.fill();
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#f1c40f';
            ctx.font = '700 20px Outfit, sans-serif';
            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 20;
            fillTextWithFlags(['🏆 ', champion, ` ${champion.name} ARE CHAMPIONS!`], 450, buttonY + 30, ctx.font, ctx.fillStyle);
            ctx.shadowBlur = 0;
            window._tournamentChampionBtn = { x: 250, y: buttonY, w: 400, h: 45 };
        }
    } else if (isEliminated && !isComplete) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.25)';
        ctx.beginPath();
        ctx.roundRect(250, buttonY, 400, 45, 14);
        ctx.fill();
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#e74c3c';
        ctx.font = '700 18px Outfit, sans-serif';
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 20;
        ctx.fillText('❌ YOU HAVE BEEN ELIMINATED', 450, buttonY + 30);
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = 'rgba(155, 89, 182, 0.15)';
    ctx.beginPath();
    ctx.roundRect(350, buttonY + 55, 200, 28, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#9b59b6';
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.fillText('← BACK', 450, buttonY + 74);
    window._tournamentBracketBackBtn = { x: 350, y: buttonY + 55, w: 200, h: 28 };

    ctx.restore();
}

// ===== Helper: Draw a single bracket match box =====
function drawBracketMatchBox(ctx, match, x, y, width, height, playerTeamId, isFinal = false) {
    const isPlayerMatch = (match.teamA && match.teamA.id === playerTeamId) ||
                          (match.teamB && match.teamB.id === playerTeamId);
    const isPlayed = match.played;
    const isPending = match.pending;
    const hasWinner = isPlayed && match.winner;

    // Box background
    let bgColor = 'rgba(255,255,255,0.04)';
    let borderColor = 'rgba(255,255,255,0.1)';
    let borderWidth = 1;

    if (isPlayerMatch) {
        bgColor = 'rgba(241, 196, 15, 0.15)';
        borderColor = '#f1c40f';
        borderWidth = 2;
    } else if (isPlayed) {
        bgColor = 'rgba(46, 204, 113, 0.08)';
        borderColor = 'rgba(46, 204, 113, 0.3)';
    } else if (isFinal) {
        bgColor = 'rgba(255, 215, 0, 0.06)';
        borderColor = 'rgba(255, 215, 0, 0.3)';
    }

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 6);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    // Team A (Top)
    const teamA = match.teamA || { name: 'TBD', flag: '❓' };
    const isWinnerA = hasWinner && match.winner.id === teamA.id;

    ctx.textAlign = 'left';
    ctx.fillStyle = isWinnerA ? '#2ecc71' : 'rgba(255,255,255,0.85)';
    ctx.font = isPlayerMatch ? '700 10px Outfit, sans-serif' : '500 9px Outfit, sans-serif';
    const nameA = teamA.name.length > 10 ? teamA.name.slice(0, 10) : teamA.name;
    const flagWA = drawTeamFlag(teamA, x + 6, y + 15, 9, 'left');
    ctx.fillText(nameA, x + 6 + flagWA, y + 15);

    // Score / Status (Right side)
    ctx.textAlign = 'right';
    if (isPlayed) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '700 10px Outfit, sans-serif';
        ctx.fillText(`${match.scoreA} - ${match.scoreB}`, x + width - 6, y + 15);
    } else if (isPending) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = '500 9px Outfit, sans-serif';
        ctx.fillText('⏳ PENDING', x + width - 6, y + 15);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '500 9px Outfit, sans-serif';
        ctx.fillText('vs', x + width - 6, y + 15);
    }

    // Team B (Bottom)
    const teamB = match.teamB || { name: 'TBD', flag: '❓' };
    const isWinnerB = hasWinner && match.winner.id === teamB.id;

    ctx.textAlign = 'left';
    ctx.fillStyle = isWinnerB ? '#2ecc71' : 'rgba(255,255,255,0.7)';
    ctx.font = isPlayerMatch ? '700 10px Outfit, sans-serif' : '500 9px Outfit, sans-serif';
    const nameB = teamB.name.length > 10 ? teamB.name.slice(0, 10) : teamB.name;
    const flagWB = drawTeamFlag(teamB, x + 6, y + height - 4, 9, 'left');
    ctx.fillText(nameB, x + 6 + flagWB, y + height - 4);

    // Player indicator
    if (isPlayerMatch) {
        ctx.fillStyle = 'rgba(241, 196, 15, 0.2)';
        ctx.beginPath();
        ctx.roundRect(x + width - 42, y + 2, 36, 12, 4);
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.font = '600 6px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ YOU', x + width - 24, y + 11);
    }

    // Winner crown
    if (hasWinner) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f1c40f';
        ctx.font = '10px Arial';
        if (isWinnerA) ctx.fillText('👑', x + width - 6, y + 13);
        else if (isWinnerB) ctx.fillText('👑', x + width - 6, y + height - 4);
    }
}

// ===== Helper to draw a single match box =====
function drawMatchBox(ctx, match, x, y, width, height, playerTeamId, isFinal = false) {
    const isPlayerMatch = (match.teamA && match.teamA.id === playerTeamId) ||
                          (match.teamB && match.teamB.id === playerTeamId);
    const isPlayed = match.played;
    const isPending = match.pending;

    ctx.fillStyle = isPlayerMatch ? 'rgba(241,196,15,0.12)' : 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 4);
    ctx.fill();
    ctx.strokeStyle = isPlayerMatch ? '#f1c40f' : (isPlayed ? 'rgba(46,204,113,0.3)' : 'rgba(255,255,255,0.08)');
    ctx.lineWidth = isPlayerMatch ? 2 : 1;
    ctx.stroke();

    // Team A
    const teamA = match.teamA || { name: 'TBD', flag: '❓' };
    const isWinnerA = isPlayed && match.winner && match.winner.id === teamA.id;
    ctx.textAlign = 'left';
    ctx.fillStyle = isWinnerA ? '#2ecc71' : 'rgba(255,255,255,0.8)';
    ctx.font = isPlayerMatch ? '600 9px Outfit, sans-serif' : '500 8px Outfit, sans-serif';
    const nameA = teamA.name.length > 8 ? teamA.name.slice(0,8) : teamA.name;
    const flagWA2 = drawTeamFlag(teamA, x + 4, y + 12, 7, 'left');
    ctx.fillText(nameA, x + 4 + flagWA2, y + 12);

    ctx.textAlign = 'right';
    if (isPlayed) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '600 9px Outfit, sans-serif';
        ctx.fillText(`${match.scoreA} - ${match.scoreB}`, x + width - 4, y + 12);
    } else if (isPending) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = '500 8px Outfit, sans-serif';
        ctx.fillText('⏳', x + width - 4, y + 12);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '500 8px Outfit, sans-serif';
        ctx.fillText('vs', x + width - 4, y + 12);
    }

    const teamB = match.teamB || { name: 'TBD', flag: '❓' };
    const isWinnerB = isPlayed && match.winner && match.winner.id === teamB.id;
    ctx.textAlign = 'left';
    ctx.fillStyle = isWinnerB ? '#2ecc71' : 'rgba(255,255,255,0.7)';
    ctx.font = isPlayerMatch ? '600 9px Outfit, sans-serif' : '500 8px Outfit, sans-serif';
    const nameB = teamB.name.length > 8 ? teamB.name.slice(0,8) : teamB.name;
    const flagWB2 = drawTeamFlag(teamB, x + 4, y + height - 3, 7, 'left');
    ctx.fillText(nameB, x + 4 + flagWB2, y + height - 3);

    if (isPlayerMatch) {
        ctx.fillStyle = 'rgba(241,196,15,0.2)';
        ctx.beginPath();
        ctx.roundRect(x + width - 30, y + 2, 26, 10, 3);
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.font = '500 5px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐YOU', x + width - 17, y + 10);
    }

    if (isPlayed && match.winner) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f1c40f';
        ctx.font = '8px Arial';
        if (isWinnerA) ctx.fillText('👑', x + width - 4, y + 10);
        else if (isWinnerB) ctx.fillText('👑', x + width - 4, y + height - 3);
    }
}

function drawTournamentResult(matchResult) {
    drawMenuBackground();
    ctx.save();
    drawGlassPanel(150, 55, 600, 480, 26, 'rgba(255,255,255,0.16)');
    ctx.textAlign = 'center';

    // BUGFIX: same stale-hitbox issue as the group-stage/bracket screens —
    // this function sets exactly one of three button globals depending on
    // tournament state, but never clears the other two. Clear all three up
    // front so only the button actually drawn this frame is clickable.
    window._tournamentChampionBtn = null;
    window._tournamentNextMatchBtn = null;
    window._tournamentBracketViewBtn = null;

    const playerTeamId = TournamentManager.selectedTeamId;
    const isPlayerEliminated = TournamentManager.isPlayerEliminated();
    const isComplete = TournamentManager.isComplete();
    const champion = TournamentManager.champion;

    let isWin = false;
    let isDraw = false;
    let isEliminated = false;
    let playerScore = -1;
    let opponentScore = -1;
    let matchFound = false;

    if (matchResult) {
        const teamA = matchResult.teamA;
        const teamB = matchResult.teamB;
        const isPlayerTeamA = teamA && teamA.id === playerTeamId;
        const isPlayerTeamB = teamB && teamB.id === playerTeamId;

        if (isPlayerTeamA) {
            playerScore = matchResult.scoreA;
            opponentScore = matchResult.scoreB;
            matchFound = true;
        } else if (isPlayerTeamB) {
            playerScore = matchResult.scoreB;
            opponentScore = matchResult.scoreA;
            matchFound = true;
        }
    }

    if (matchFound) {
        if (playerScore > opponentScore) {
            isWin = true;
        } else if (playerScore === opponentScore) {
            isDraw = true;
        }
    }

    if (isPlayerEliminated) {
        isEliminated = true;
    }

    let titleText = '';
    let titleColor = '';
    let shadowColor = '';
    if (isWin) {
        titleText = '🎉 VICTORY!';
        titleColor = '#2ecc71';
        shadowColor = '#2ecc71';
    } else if (isDraw) {
        titleText = '🤝 DRAW';
        titleColor = '#f1c40f';
        shadowColor = '#f1c40f';
    } else {
        titleText = '💔 DEFEAT';
        titleColor = '#e74c3c';
        shadowColor = '#e74c3c';
    }

    drawGlowTitle(titleText, 450, 100, titleColor, 46);

    if (matchResult) {
        const teamA = matchResult.teamA || { name: 'Unknown', flag: '❓' };
        const teamB = matchResult.teamB || { name: 'Unknown', flag: '❓' };
        fillTextWithFlags([teamA, ` ${matchResult.scoreA} - ${matchResult.scoreB} `, teamB], 450, 200, '900 52px Outfit, sans-serif', '#ffffff');
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '600 20px Outfit, sans-serif';
        ctx.fillText(`${teamA.name} vs ${teamB.name}`, 450, 250);

        if (isEliminated) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText(`😢 You have been eliminated from the tournament`, 450, 300);
        } else if (isWin) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText(`⚽ Goals: ${playerScore} - ${opponentScore}`, 450, 300);
        } else if (isDraw) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText('🤝 Match ended in a draw', 450, 300);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText('Better luck next time!', 450, 300);
        }
    }

    if (isComplete && champion) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = '700 24px Outfit, sans-serif';
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 15;
        fillTextWithFlags(['🏆 Champion: ', champion, ` ${champion.name}`], 450, 350, ctx.font, ctx.fillStyle);
        ctx.shadowBlur = 0;
    }

    const nextMatch = TournamentManager.getPlayerNextMatch();

    if (isComplete) {
        ctx.fillStyle = 'rgba(241, 196, 15, 0.2)';
        ctx.beginPath();
        ctx.roundRect(300, 400, 300, 55, 14);
        ctx.fill();
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#f1c40f';
        ctx.font = '700 24px Outfit, sans-serif';
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 15;
        ctx.fillText('🏆 VIEW CHAMPION', 450, 440);
        ctx.shadowBlur = 0;
        window._tournamentChampionBtn = { x: 300, y: 400, w: 300, h: 55 };
    } else if (nextMatch) {
        ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        ctx.beginPath();
        ctx.roundRect(300, 400, 300, 55, 14);
        ctx.fill();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#2ecc71';
        ctx.font = '700 22px Outfit, sans-serif';
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 15;
        ctx.fillText('▶ NEXT MATCH', 450, 440);
        ctx.shadowBlur = 0;
        window._tournamentNextMatchBtn = { x: 300, y: 400, w: 300, h: 55 };
    } else {
        ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
        ctx.beginPath();
        ctx.roundRect(300, 400, 300, 55, 14);
        ctx.fill();
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#9b59b6';
        ctx.font = '700 22px Outfit, sans-serif';
        ctx.shadowColor = '#9b59b6';
        ctx.shadowBlur = 15;
        ctx.fillText('📊 VIEW BRACKET', 450, 440);
        ctx.shadowBlur = 0;
        window._tournamentBracketViewBtn = { x: 300, y: 400, w: 300, h: 55 };
    }
    ctx.restore();
}

function drawChampionCelebration() {
    drawMenuBackground();
    ctx.save();
    drawGlassPanel(140, 45, 620, 460, 26, 'rgba(241,196,15,0.35)');
    ctx.textAlign = 'center';
    const champion = TournamentManager.champion;
    const playerTeam = TournamentManager.getPlayerTeam();
    const isPlayerChampion = champion && champion.id === tournamentSelectedTeam;

    ctx.font = '120px Arial';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 40;
    ctx.fillText('🏆', 450, 160);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f1c40f';
    ctx.font = '900 56px Outfit, sans-serif';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 25;
    ctx.fillText('CHAMPIONS!', 450, 230);
    ctx.shadowBlur = 0;

    if (champion) {
        fillTextWithFlags([champion, ` ${champion.name}`], 450, 290, '700 32px Outfit, sans-serif', '#ffffff');
    }

    if (isPlayerChampion) {
        ctx.fillStyle = '#2ecc71';
        ctx.font = '700 28px Outfit, sans-serif';
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 20;
        ctx.fillText('⭐ YOU ARE THE CHAMPION! ⭐', 450, 340);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '600 20px Outfit, sans-serif';
        ctx.fillText(`Your team (${playerTeam ? playerTeam.name : 'Unknown'}) finished the tournament`, 450, 340);
    }

    const progress = TournamentManager.getProgress();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '500 16px Outfit, sans-serif';
    ctx.fillText(`🏅 Tournament Complete! • ${progress}% Progress`, 450, 390);

    drawPillButton(300, 430, 300, 50, '🏠 RETURN TO MENU', '#9b59b6', { active: true, fontSize: 20 });
    window._tournamentReturnBtn = { x: 300, y: 430, w: 300, h: 50 };
    ctx.restore();
}

function draw() {
    try {
        ctx.clearRect(0,0,GAME_W,GAME_H);
        ctx.save();
        ctx.translate(screenShake.x, screenShake.y);

if (currentState === 'MENU') {
    drawMenuBackground();

    const time = Date.now() * 0.001;

    const hoverIndex =
        Number.isInteger(window._menuHoverIndex)
            ? window._menuHoverIndex
            : -1;

    const pulse =
        0.5 + Math.sin(time * 2.0) * 0.5;

    const slowPulse =
        0.5 + Math.sin(time * 0.75) * 0.5;

    ctx.save();

    // ============================================================
    // PRO STRIKER — CINEMATIC LIVE MAIN MENU
    // ============================================================

    // ------------------------------------------------------------
    // STADIUM SCENE (atmosphere / floodlights / crowd / pitch) — shared
    // with every other screen via drawStadiumScene(), see below.
    // ------------------------------------------------------------

    drawStadiumScene(time);

    // ------------------------------------------------------------
    // 5. LEFT GLASS COMMAND PANEL
    // ------------------------------------------------------------

    const panelX = 44;
    const panelY = 43;
    const panelW = 385;
    const panelH = 505;

    const panelGradient =
        ctx.createLinearGradient(
            panelX,
            panelY,
            panelX + panelW,
            panelY + panelH
        );

    panelGradient.addColorStop(
        0,
        'rgba(9,20,34,0.94)'
    );

    panelGradient.addColorStop(
        0.5,
        'rgba(6,15,27,0.91)'
    );

    panelGradient.addColorStop(
        1,
        'rgba(3,9,18,0.95)'
    );

    ctx.fillStyle = panelGradient;

    ctx.beginPath();

    ctx.roundRect(
        panelX,
        panelY,
        panelW,
        panelH,
        24
    );

    ctx.fill();

    ctx.strokeStyle =
        'rgba(255,255,255,0.10)';

    ctx.lineWidth = 1;

    ctx.stroke();

    // Cyan inner edge
    ctx.strokeStyle =
        'rgba(63,224,255,0.095)';

    ctx.beginPath();

    ctx.roundRect(
        panelX + 2,
        panelY + 2,
        panelW - 4,
        panelH - 4,
        22
    );

    ctx.stroke();

    // ------------------------------------------------------------
    // 6. BRAND
    // ------------------------------------------------------------

    ctx.textAlign = 'left';

    ctx.fillStyle =
        'rgba(255,255,255,0.30)';

    ctx.font =
        '700 8px "Arial Narrow", "Trebuchet MS", sans-serif';

    ctx.fillText(
        'STADIUM COMMAND',
        panelX + 28,
        panelY + 31
    );

    ctx.fillStyle =
        '#f5f8fb';

    ctx.font =
        '900 50px Impact, "Arial Narrow", sans-serif';

    ctx.shadowColor =
        'rgba(255,255,255,0.10)';

    ctx.shadowBlur = 14;

    ctx.fillText(
        'PRO',
        panelX + 26,
        panelY + 88
    );

    ctx.fillStyle =
        '#45e4ff';

    ctx.font =
        '900 46px Impact, "Arial Narrow", sans-serif';

    ctx.shadowColor =
        'rgba(0,220,255,0.42)';

    ctx.shadowBlur = 22;

    ctx.fillText(
        'STRIKER',
        panelX + 26,
        panelY + 130
    );

    ctx.shadowBlur = 0;

    // Brand underline
    const brandLine =
        ctx.createLinearGradient(
            panelX + 26,
            0,
            panelX + panelW - 25,
            0
        );

    brandLine.addColorStop(
        0,
        'rgba(69,228,255,0.86)'
    );

    brandLine.addColorStop(
        0.45,
        'rgba(69,228,255,0.24)'
    );

    brandLine.addColorStop(
        1,
        'rgba(69,228,255,0)'
    );

    ctx.fillStyle = brandLine;

    ctx.fillRect(
        panelX + 26,
        panelY + 146,
        panelW - 51,
        2
    );

    ctx.fillStyle =
        'rgba(255,255,255,0.34)';

    ctx.font =
        '700 8px "Arial Narrow", sans-serif';

    ctx.fillText(
        'ARCADE FOOTBALL EXPERIENCE',
        panelX + 28,
        panelY + 165
    );

    // ------------------------------------------------------------
    // 7. MENU OPTIONS
    // ------------------------------------------------------------

    const menuLeft = 70;
    const menuWidth = 328;
    const rowHeight = 43;

    const options = [
        {
            key: '01',
            label: '1 VS 1',
            sub: 'LOCAL SHOWDOWN',
            y: 207,
            color: '#46e5ff'
        },
        {
            key: '02',
            label: 'VS COMPUTER',
            sub: 'TEST YOUR LIMITS',
            y: 256,
            color: '#55d9ff'
        },
        {
            key: '03',
            label: 'INSTRUCTIONS',
            sub: 'LEARN THE CONTROLS',
            y: 305,
            color: '#ffd45a'
        },
        {
            key: '04',
            label: 'SETTINGS',
            sub: 'MATCH & AUDIO',
            y: 354,
            color: '#ff7474'
        },
        {
            key: '05',
            label: 'STATS',
            sub: 'YOUR RECORD',
            y: 403,
            color: '#bb91ff'
        },
        {
            key: '06',
            label: 'TOURNAMENT',
            sub: 'CHASE THE CUP',
            y: 452,
            color: '#ffd45a'
        }
    ];

    // Expose exact button geometry for input.js
    window._menuButtons = options.map(opt => ({
        x: menuLeft,
        y: opt.y,
        w: menuWidth,
        h: rowHeight
    }));

    options.forEach((opt, index) => {

        const isHovered =
            hoverIndex === index;

        const x =
            menuLeft;

        const y =
            opt.y;

        ctx.save();

        // Hover glow behind button
        if (isHovered) {

            ctx.shadowColor =
                opt.color;

            ctx.shadowBlur =
                18 +
                pulse * 9;

            ctx.fillStyle =
                'rgba(50,210,245,0.10)';

            ctx.beginPath();

            ctx.roundRect(
                x - 5,
                y - 4,
                menuWidth + 10,
                rowHeight + 8,
                11
            );

            ctx.fill();

            ctx.shadowBlur = 0;
        }

        // Button body
        const rowGradient =
            ctx.createLinearGradient(
                x,
                y,
                x + menuWidth,
                y
            );

        rowGradient.addColorStop(
            0,
            isHovered
                ? 'rgba(28,65,82,0.80)'
                : 'rgba(14,29,44,0.70)'
        );

        rowGradient.addColorStop(
            0.55,
            isHovered
                ? 'rgba(14,39,55,0.62)'
                : 'rgba(8,19,32,0.50)'
        );

        rowGradient.addColorStop(
            1,
            'rgba(5,13,23,0.36)'
        );

        ctx.fillStyle = rowGradient;

        ctx.beginPath();

        ctx.roundRect(
            x,
            y,
            menuWidth,
            rowHeight,
            10
        );

        ctx.fill();

        // Border
        ctx.strokeStyle =
            isHovered
                ? `rgba(69,228,255,${0.42 + pulse * 0.16})`
                : 'rgba(255,255,255,0.07)';

        ctx.lineWidth =
            isHovered
                ? 1.4
                : 1;

        ctx.stroke();

        // Left accent rail
        ctx.fillStyle =
            opt.color;

        ctx.globalAlpha =
            isHovered
                ? 1
                : 0.62;

        ctx.beginPath();

        ctx.roundRect(
            x,
            y + 7,
            3,
            rowHeight - 14,
            2
        );

        ctx.fill();

        ctx.globalAlpha = 1;

        // Hover moving scan line
        if (isHovered) {

            const sweep =
                ((time * 110) % (menuWidth + 50)) - 25;

            const sweepGradient =
                ctx.createLinearGradient(
                    x + sweep - 30,
                    y,
                    x + sweep + 30,
                    y
                );

            sweepGradient.addColorStop(
                0,
                'rgba(255,255,255,0)'
            );

            sweepGradient.addColorStop(
                0.5,
                'rgba(255,255,255,0.16)'
            );

            sweepGradient.addColorStop(
                1,
                'rgba(255,255,255,0)'
            );

            ctx.fillStyle = sweepGradient;

            ctx.fillRect(
                x,
                y,
                menuWidth,
                rowHeight
            );
        }

        // Shortcut number
        ctx.textAlign = 'left';

        ctx.fillStyle =
            isHovered
                ? opt.color
                : 'rgba(255,255,255,0.24)';

        ctx.font =
            '900 9px "Arial Narrow", sans-serif';

        ctx.fillText(
            opt.key,
            x + 14,
            y + 17
        );

        // Main label
        ctx.fillStyle =
            isHovered
                ? '#ffffff'
                : 'rgba(255,255,255,0.88)';

        ctx.font =
            '900 15px Impact, "Arial Narrow", sans-serif';

        ctx.fillText(
            opt.label,
            x + 49,
            y + 19
        );

        // Sub
        ctx.fillStyle =
            isHovered
                ? 'rgba(210,246,255,0.62)'
                : 'rgba(255,255,255,0.28)';

        ctx.font =
            '600 7px "Arial Narrow", sans-serif';

        ctx.fillText(
            opt.sub,
            x + 50,
            y + 32
        );

        // Arrow
        const arrowOffset =
            isHovered
                ? 5
                : 0;

        ctx.textAlign = 'right';

        ctx.fillStyle =
            isHovered
                ? opt.color
                : 'rgba(255,255,255,0.32)';

        ctx.font =
            '900 23px "Arial Narrow", sans-serif';

        ctx.fillText(
            '›',
            x + menuWidth - 13 + arrowOffset,
            y + 28
        );

        ctx.restore();
    });

    // ------------------------------------------------------------
    // 8. FOOTER
    // ------------------------------------------------------------

    ctx.textAlign = 'left';

    ctx.fillStyle =
        'rgba(255,255,255,0.17)';

    ctx.font =
        '600 7px "Arial Narrow", sans-serif';

    ctx.fillText(
        `MUSIC ${SoundManager.musicEnabled ? 'ON' : 'OFF'}   •   SFX ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`,
        panelX + 27,
        panelY + panelH - 20
    );

    ctx.textAlign = 'right';

    ctx.fillText(
        '1–6 / ENTER',
        panelX + panelW - 27,
        panelY + panelH - 20
    );

    // ============================================================
    // 9. HERO PLAYER
    // ============================================================

    const heroX = 635;

    const heroY =
        285 +
        Math.sin(time * 1.15) * 4;

    ctx.save();

    ctx.translate(
        heroX,
        heroY
    );

    ctx.rotate(-0.05);

    // Player aura — now duotone (cyan + gold) to match the strike-impact glow
    const aura =
        ctx.createRadialGradient(
            10,
            30,
            20,
            10,
            30,
            190
        );

    aura.addColorStop(0, 'rgba(255,196,60,0.14)');
    aura.addColorStop(0.4, 'rgba(0,215,255,0.10)');
    aura.addColorStop(0.7, 'rgba(0,130,255,0.035)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(10, 30, 190, 0, Math.PI * 2);
    ctx.fill();

    // ============================================================
    // DYNAMIC STRIKER SILHOUETTE v2 — mid-strike pose
    // Rebuilt with proper jersey-shaped torso (shoulders wider than waist,
    // tapered), rounded limb joints instead of blunt rectangle caps, and
    // correct proportions (head ≈ chest width, thigh thicker than shin) so
    // the figure reads as an athlete rather than a jointed mannequin. Same
    // cyan/gold rim-light language as the rest of the menu, now applied
    // with a single consistent light direction (cyan = far/back edge,
    // gold = near/strike edge) across every body part.
    // ============================================================

    const shadowFill = '#050910';
    const kitFill = '#0a1420';
    const rim = 'rgba(70,225,255,0.92)';
    const rimSoft = 'rgba(70,225,255,0.38)';
    const gold = 'rgba(255,196,60,0.95)';
    const goldSoft = 'rgba(255,196,60,0.38)';

    // Helper: a tapered limb segment (wider at the joint, narrower at the
    // end) with a rounded cap on both ends — reads as a limb, not a plank.
    function limbSegment(x1, y1, x2, y2, w1, w2, fill, stroke, glow) {
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(x1 + nx * w1, y1 + ny * w1);
        ctx.lineTo(x2 + nx * w2, y2 + ny * w2);
        ctx.arc(x2, y2, w2, ang + Math.PI / 2, ang - Math.PI / 2);
        ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
        ctx.arc(x1, y1, w1, ang - Math.PI / 2, ang + Math.PI / 2);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1.6;
            if (glow) { ctx.shadowColor = stroke; ctx.shadowBlur = glow; }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // Whole figure leans back slightly over the hips for a dynamic strike feel
    ctx.save();
    ctx.rotate(-0.09);

    // ---------------- TRAILING LEG (planted behind, bent for balance) ----------------
    limbSegment(-18, 22, -46, 56, 15, 12, shadowFill, rimSoft, 0);
    limbSegment(-46, 56, -30, 104, 12, 9, shadowFill, rimSoft, 0);
    // boot
    ctx.save();
    ctx.translate(-30, 104);
    ctx.rotate(0.5);
    ctx.fillStyle = shadowFill;
    ctx.beginPath();
    ctx.roundRect(-11, -8, 34, 15, 7);
    ctx.fill();
    ctx.strokeStyle = rimSoft;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-11, -8, 34, 15, 7);
    ctx.stroke();
    ctx.restore();

    // ---------------- KICKING LEG (extended forward-low, follow-through) ----------------
    limbSegment(14, 18, 58, 34, 16, 13, shadowFill, goldSoft, 0);
    limbSegment(58, 34, 96, 78, 13, 10, shadowFill, goldSoft, 0);
    // boot, toe pointed through the strike
    ctx.save();
    ctx.translate(96, 78);
    ctx.rotate(-0.35);
    ctx.fillStyle = shadowFill;
    ctx.beginPath();
    ctx.roundRect(-10, -8, 40, 16, 8);
    ctx.fill();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.shadowColor = gold;
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.roundRect(-10, -8, 40, 16, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // ---------------- SHORTS (rounded hip block, sits over both leg joints) ----------------
    ctx.fillStyle = kitFill;
    ctx.beginPath();
    ctx.moveTo(-34, -8);
    ctx.lineTo(30, -10);
    ctx.quadraticCurveTo(42, 6, 34, 26);
    ctx.lineTo(2, 30);
    ctx.lineTo(-14, 30);
    ctx.quadraticCurveTo(-38, 24, -34, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rimSoft;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // side stripe accent
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, -6);
    ctx.lineTo(20, 24);
    ctx.stroke();

    // ---------------- TORSO (jersey — broad shoulders, tapered waist) ----------------
    ctx.fillStyle = kitFill;
    ctx.beginPath();
    ctx.moveTo(-30, -88);          // left shoulder
    ctx.quadraticCurveTo(-44, -70, -40, -40);   // left ribcage curve
    ctx.quadraticCurveTo(-36, -14, -30, -6);    // taper to waist
    ctx.lineTo(26, -8);            // waist right
    ctx.quadraticCurveTo(38, -18, 40, -44);     // right ribcage curve
    ctx.quadraticCurveTo(42, -72, 26, -90);     // right shoulder
    ctx.quadraticCurveTo(0, -98, -30, -88);     // collar
    ctx.closePath();
    ctx.fill();

    // Cyan rim along the back/leading edge (left side, catches the backlight)
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = rim;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-30, -88);
    ctx.quadraticCurveTo(-44, -70, -40, -40);
    ctx.quadraticCurveTo(-36, -14, -30, -6);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Gold rim along the strike-side edge (right side)
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = gold;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(26, -90);
    ctx.quadraticCurveTo(42, -72, 40, -44);
    ctx.quadraticCurveTo(38, -18, 26, -8);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Jersey number — small, centered, subtle
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.font = '800 26px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('9', -3, -38);

    // ---------------- TRAILING ARM (swung back for balance) ----------------
    limbSegment(-26, -78, -54, -46, 10, 8, shadowFill, rimSoft, 0);
    limbSegment(-54, -46, -66, -6, 8, 6.5, shadowFill, rimSoft, 0);
    ctx.beginPath();
    ctx.fillStyle = shadowFill;
    ctx.arc(-66, -3, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rimSoft;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // ---------------- LEAD ARM (thrown up-forward, opposite the kick) ----------------
    limbSegment(20, -84, 50, -108, 10, 8, shadowFill, goldSoft, 0);
    limbSegment(50, -108, 78, -122, 8, 6.5, shadowFill, goldSoft, 0);
    ctx.beginPath();
    ctx.fillStyle = shadowFill;
    ctx.arc(78, -125, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = goldSoft;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // ---------------- NECK ----------------
    ctx.fillStyle = shadowFill;
    ctx.save();
    ctx.translate(-2, -90);
    ctx.rotate(0.06);
    ctx.beginPath();
    ctx.roundRect(-8, -12, 16, 16, 5);
    ctx.fill();
    ctx.restore();

    // ---------------- HEAD (rounded, tilted forward toward the ball) ----------------
    ctx.save();
    ctx.translate(0, -118);
    ctx.rotate(0.1);

    ctx.shadowColor = 'rgba(70,225,255,0.32)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = shadowFill;
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Short hair silhouette on the crown — breaks up the plain oval
    ctx.fillStyle = shadowFill;
    ctx.beginPath();
    ctx.ellipse(-1, -9, 18, 13, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();

    // Glowing eyes, focused down toward the ball
    ctx.fillStyle = rim;
    ctx.shadowColor = rim;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(-6, 4, 2.2, 1.4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, 4, 2.2, 1.4, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Head rim light along the back edge
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = rim;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 21, 0, Math.PI * 1.4, Math.PI * 1.85);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.restore(); // end lean-back group

    ctx.restore(); // end hero translate/rotate

    // ============================================================
    // 10. REALISTIC-CODED FOOTBALL
    // ============================================================

    const ballX =
        768;

    const ballY =
        399 +
        Math.sin(time * 2.2) * 8;

    ctx.save();

    ctx.translate(
        ballX,
        ballY
    );

    ctx.rotate(
        time * 0.55
    );

    // Outer shadow/glow
    ctx.shadowColor =
        'rgba(80,225,255,0.55)';

    ctx.shadowBlur = 22;

    const ballGradient =
        ctx.createRadialGradient(
            -9,
            -10,
            2,
            0,
            0,
            31
        );

    ballGradient.addColorStop(
        0,
        '#ffffff'
    );

    ballGradient.addColorStop(
        0.60,
        '#e8edf2'
    );

    ballGradient.addColorStop(
        1,
        '#aab5c0'
    );

    ctx.fillStyle = ballGradient;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        29,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;

    // Central pentagon
    ctx.fillStyle =
        '#111a23';

    ctx.beginPath();

    for (let i = 0; i < 5; i++) {

        const angle =
            -Math.PI / 2 +
            i *
            (Math.PI * 2 / 5);

        const px =
            Math.cos(angle) * 10;

        const py =
            Math.sin(angle) * 10;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();

    ctx.fill();

    // Panel seams
    ctx.strokeStyle =
        'rgba(12,23,34,0.78)';

    ctx.lineWidth = 2;

    for (let i = 0; i < 5; i++) {

        const angle =
            -Math.PI / 2 +
            i *
            (Math.PI * 2 / 5);

        ctx.beginPath();

        ctx.moveTo(
            Math.cos(angle) * 10,
            Math.sin(angle) * 10
        );

        ctx.lineTo(
            Math.cos(angle) * 25,
            Math.sin(angle) * 25
        );

        ctx.stroke();
    }

    ctx.restore();

    // ============================================================
    // 11. HERO TAG
    // ============================================================

    ctx.textAlign = 'right';

    ctx.fillStyle =
        'rgba(255,255,255,0.24)';

    ctx.font =
        '700 8px "Arial Narrow", sans-serif';

    ctx.fillText(
        'LIVE MATCH EXPERIENCE',
        852,
        70
    );

    ctx.fillStyle =
        '#ff6168';

    ctx.beginPath();

    ctx.arc(
        774,
        85,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        'rgba(255,255,255,0.38)';

    ctx.font =
        '800 8px "Arial Narrow", sans-serif';

    ctx.fillText(
        'LIVE',
        853,
        88
    );

    // ============================================================
    // 12. FOOTER
    // ============================================================

    ctx.textAlign = 'left';

    ctx.fillStyle =
        'rgba(255,255,255,0.13)';

    ctx.font =
        '600 7px "Arial Narrow", sans-serif';

    ctx.fillText(
        `MUSIC ${SoundManager.musicEnabled ? 'ON' : 'OFF'}   •   SFX ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`,
        72,
        570
    );

    ctx.textAlign = 'right';

    ctx.fillText(
        'PRO STRIKER // WEB ARCADE',
        828,
        570
    );

    ctx.restore();

    return;
}

        if (currentState === 'DIFFICULTY_SELECT') {
            drawDifficultySelect();
            return;
        }

        if (currentState === 'INSTRUCTIONS') {
            drawInstructionsScreen();
            return;
        }
        if (currentState === 'SETTINGS') {
            drawSettingsScreen();
            return;
        }

        if (currentState === 'STATS') {
            drawStatsScreen();
            return;
        }

        if (currentState === 'TOURNAMENT_MENU') {
            drawTournamentMenu();
            return;
        }
        if (currentState === 'TOURNAMENT_TEAM_SELECT') {
            drawTeamSelection();
            return;
        }
        if (currentState === 'TOURNAMENT_GROUP_STAGE') {
            drawGroupStage();
            return;
        }
        if (currentState === 'TOURNAMENT_BRACKET') {
            drawTournamentBracket();
            return;
        }
        if (currentState === 'TOURNAMENT_RESULT') {
    drawTournamentResult(TournamentManager.getLastPlayerMatch());
    return;
}
        if (currentState === 'TOURNAMENT_CHAMPION') {
            drawChampionCelebration();
            return;
        }

        if (currentState === 'PAUSED') {
            drawPitch();
            for (let p of players) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 0.9, p.radius * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            let activeRed = getActivePlayer('red');
            let activeBlue = getActivePlayer('blue');
            if (activeRed && !activeRed.ejecting) drawActiveIndicator(activeRed, 'P1', '#f39c12');
            if (activeBlue && !activeBlue.ejecting) drawActiveIndicator(activeBlue, gameMode === '1v1' ? 'P2' : 'COM', gameMode === '1v1' ? '#00ffff' : '#9b59b6');
            for (let p of players) {
                drawPlayerToken(p);
            }
            drawGoalStructures();
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(ball.x, ball.y + ball.radius * 0.7, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            drawMatchBall(ball);
            if (ball.owner) {
                ctx.save();
                let startX = ball.owner.x + Math.cos(arrowAngle) * 22;
                let startY = ball.owner.y + Math.sin(arrowAngle) * 22;
                let endX = ball.owner.x + Math.cos(arrowAngle) * 65;
                let endY = ball.owner.y + Math.sin(arrowAngle) * 65;
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
            }
            for (let p of particles) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
            drawScoreboard();
            drawGkTimerUI();
            drawPauseMenu();
            ctx.restore();
            return;
        }

        // GAME PLAY
        drawPitch();

        for (let p of players) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 0.9, p.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        let activeRed = getActivePlayer('red');
        let activeBlue = getActivePlayer('blue');
        if (activeRed && !activeRed.ejecting) drawActiveIndicator(activeRed, 'P1', '#f39c12');
        if (activeBlue && !activeBlue.ejecting) drawActiveIndicator(activeBlue, gameMode === '1v1' ? 'P2' : 'COM', gameMode === '1v1' ? '#00ffff' : '#9b59b6');

        for (let p of players) {
            drawPlayerToken(p);
        }

        drawGoalStructures();

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y + ball.radius * 0.7, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (ball.trail && ball.trail.length > 0) {
            for (let i = 0; i < ball.trail.length; i++) {
                const t = ball.trail[i];
                if (t.life <= 0) continue;
                const alpha = t.life / 15;
                const radius = ball.radius * alpha * 0.6;
                if (radius > 0) {
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.3, alpha * 0.3)})`;
                    ctx.fill();
                }
            }
        }

        drawMatchBall(ball);

        if (ball.owner) {
            ctx.save();
            let startX = ball.owner.x + Math.cos(arrowAngle) * 22;
            let startY = ball.owner.y + Math.sin(arrowAngle) * 22;
            let endX = ball.owner.x + Math.cos(arrowAngle) * 65;
            let endY = ball.owner.y + Math.sin(arrowAngle) * 65;
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
        }

        for (let p of particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }

        if (celebrationParticles && celebrationParticles.length > 0) {
            for (let p of celebrationParticles) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 150;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            }
        }

        drawScoreboard();
        drawGkTimerUI();
        if (currentState === 'PLAY') drawPauseButton();

        if (matchState === 'HALFTIME') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.85)';
            ctx.fillRect(0, 250, 900, 100);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 48px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 20;
            ctx.fillText('HALF TIME', 450, 310);
            ctx.restore();
        }

        if (kickoffDelay > 0 && currentState === 'PLAY' && matchState === 'PLAY') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.7)';
            ctx.fillRect(0, 250, 900, 60);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '800 36px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('KICKOFF', 450, 295);
            ctx.restore();
        }

        if (currentState === 'GOAL_SCORED') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.88)';
            ctx.fillRect(0, 210, 900, 180);
            ctx.translate(450, 280);
            ctx.scale(goalZoomScale, goalZoomScale);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 68px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 25;
            ctx.fillText('GOAL!', 0, 0);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 22px Outfit, sans-serif';
            ctx.fillText(lastScorer, 0, 48);
            ctx.restore();
        }

        if (currentState === 'MATCH_END') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.88)';
            ctx.fillRect(0, 200, 900, 200);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 56px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 20;
            ctx.fillText(lastScorer, 450, 270);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 26px Outfit, sans-serif';
            ctx.fillText(`RED ${score.red} - ${score.blue} BLUE`, 450, 330);
            ctx.fillStyle = '#95a5a6';
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText('Press any key or tap to continue', 450, 380);
            ctx.restore();
        }

        ctx.restore();
    } catch (err) {
        console.error('[renderer.js draw] ERROR:', err);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, 900, 600);
        ctx.fillStyle = '#ff5252';
        ctx.font = 'bold 30px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Something went wrong', 450, 280);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Outfit, sans-serif';
        ctx.fillText('Check the console for details', 450, 330);
        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px monospace';
        ctx.fillText(err.message, 450, 380);
    }
}
