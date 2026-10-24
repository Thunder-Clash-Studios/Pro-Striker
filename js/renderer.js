// ===== PRO STRIKER - renderer.js =====
console.log('[ProStriker] renderer.js loaded');

// ===== FLAG DRAWING HELPERS =====
// Non-striker flags use online rectangular artwork. The local flag art is
// reserved for striker badges; an emoji remains the fallback if the network
// image has not loaded or is unavailable. `y` is a text baseline.
// Returns the total width consumed (flag + small gap) for laying out text after it.
function drawTeamFlag(team, x, y, size, align = 'left') {
    const h = size;
    const img = (typeof FlagImages !== 'undefined') ? FlagImages.get(team) : null;
    const w = img && img.naturalHeight ? h * img.naturalWidth / img.naturalHeight : h * 1.5;
    const gap = Math.max(3, Math.round(size * 0.25));
    let drawX = x;
    if (align === 'center') drawX = x - w / 2;
    else if (align === 'right') drawX = x - w;

    if (img) {
        const drawY = y - h * 0.82;
        ctx.drawImage(img, drawX, drawY, w, h);
    } else {
        ctx.save();
        ctx.fillStyle = (team && team.color) || '#555';
        ctx.beginPath();
        ctx.roundRect(drawX, y - h * 0.82, w, h, 2);
        ctx.fill();
        ctx.restore();
    }
    return w + gap;
}

function drawTeamFlagWidth(team, height) {
    const img = (typeof FlagImages !== 'undefined') ? FlagImages.get(team) : null;
    return img && img.naturalHeight ? height * img.naturalWidth / img.naturalHeight : height * 1.5;
}

// Draws a single centered line made of text/team-flag segments, e.g.
// fillTextWithFlags(['🏆 ', champion, ' ARE CHAMPIONS!'], 450, 200, '700 20px Outfit, sans-serif', '#f1c40f')
// Pass a team object anywhere a flag should appear inline.
function fillTextWithFlags(segments, cx, y, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    const sizeMatch = font.match(/(\d+)px/);
    const flagH = sizeMatch ? parseInt(sizeMatch[1], 10) * 0.62 : 14;
    let totalW = 0;
    const parts = segments.map(seg => {
        if (typeof seg === 'string') {
            const w = ctx.measureText(seg).width;
            totalW += w;
            return { type: 'text', value: seg, w };
        } else {
            const flagW = drawTeamFlagWidth(seg, flagH) + Math.max(3, Math.round(flagH * 0.25));
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

// PERF: the entire pitch (stripes, turf grain, wear spots, line markings,
// vignette, floodlight sheen) is 100% static — nothing here ever changes
// frame to frame. The old version rebuilt ~18 gradients from scratch and
// re-stroked every line marking EVERY SINGLE FRAME (60x/sec), which is the
// #1 cause of lag on anything but a fast desktop: gradient construction and
// shadowBlur are expensive canvas ops, and doing 18 of them 60 times a
// second burns most of a phone's frame budget before a single player is
// even drawn. Fix: render it once to an offscreen canvas at startup, then
// every frame is just one cheap drawImage() blit — the visual output is
// pixel-identical, only the cost changed.
let _pitchCanvas = null;
function buildPitchCanvas(palette) {
    // `palette` (from the shop's pitch skins) recolours the pitch; with no
    // palette every value below is exactly the original hard-coded one.
    const P = palette || {};
    const pBase = P.base || ['#1c9049', '#249c58'];
    const pLight = P.light || ['#2ab766', '#31c777'];
    const pMid = P.mid || ['#23a457', '#2bb768'];
    const lineCol = P.line || 'rgba(255,255,255,0.95)';
    const lineGlow = P.lineGlow || 'rgba(255,255,255,0.35)';
    const pc = document.createElement('canvas');
    pc.width = GAME_W;
    pc.height = GAME_H;
    const pctx = pc.getContext('2d');
    const stripeWidth = (875 - 25) / 10;

    for (let i = 0; i < 10; i++) {
        const base = pBase[i % 2];
        const light = pLight[i % 2];
        const stripeGrad = pctx.createLinearGradient(0, 0, 0, GAME_H);
        stripeGrad.addColorStop(0, light);
        stripeGrad.addColorStop(0.12, base);
        stripeGrad.addColorStop(0.5, pMid[i % 2]);
        stripeGrad.addColorStop(0.88, base);
        stripeGrad.addColorStop(1, light);
        pctx.fillStyle = stripeGrad;
        pctx.fillRect(25 + i * stripeWidth, 0, stripeWidth, GAME_H);
    }

    pctx.save();
    pctx.globalAlpha = 0.05;
    pctx.fillStyle = '#ffffff';
    for (let y = 0; y < GAME_H; y += 40) {
        pctx.fillRect(25, y, 850, 20);
    }
    pctx.restore();

    if (P.turf !== false) {
        pctx.save();
        pctx.beginPath();
        pctx.rect(25, 0, 850, GAME_H);
        pctx.clip();
        const tile = getTurfTile();
        const pattern = pctx.createPattern(tile, 'repeat');
        pctx.fillStyle = pattern;
        pctx.fillRect(25, 0, 850, GAME_H);
        pctx.restore();
    }

    pctx.save();
    pctx.globalAlpha = 0.07;
    pctx.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) {
        pctx.fillRect(25 + i * stripeWidth, 0, 2, GAME_H);
    }
    pctx.restore();

    if (P.wear !== false) {
    pctx.save();
    pctx.globalAlpha = 0.10;
    const wearSpots = [
        { x: 95, y: 300, r: 55 }, { x: 805, y: 300, r: 55 },
        { x: 450, y: 300, r: 42 }, { x: 210, y: 300, r: 30 }, { x: 690, y: 300, r: 30 }
    ];
    wearSpots.forEach(s => {
        const wg = pctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        wg.addColorStop(0, 'rgba(90,60,30,0.55)');
        wg.addColorStop(1, 'rgba(90,60,30,0)');
        pctx.fillStyle = wg;
        pctx.beginPath();
        pctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        pctx.fill();
    });
    pctx.restore();
    }

    // optional colour wash over the grass only (before the lines are drawn)
    if (P.overlay) {
        pctx.save();
        pctx.globalAlpha = P.overlay.alpha;
        pctx.fillStyle = P.overlay.color;
        pctx.fillRect(25, 0, 850, GAME_H);
        pctx.restore();
    }

    pctx.save();
    pctx.strokeStyle = lineCol;
    pctx.shadowColor = lineGlow;
    pctx.shadowBlur = P.lineGlow ? 8 : 4;
    pctx.lineWidth = 3;
    pctx.strokeRect(25, 0, 850, GAME_H);
    pctx.beginPath();
    pctx.moveTo(450, 0);
    pctx.lineTo(450, 600);
    pctx.stroke();
    pctx.beginPath();
    pctx.arc(450, 300, 70, 0, Math.PI * 2);
    pctx.stroke();
    pctx.shadowBlur = 0;
    pctx.beginPath();
    pctx.arc(450, 300, 4, 0, Math.PI * 2);
    pctx.fillStyle = lineCol;
    pctx.fill();
    pctx.strokeRect(25, 150, 100, 300);
    pctx.strokeRect(775, 150, 100, 300);
    pctx.lineWidth = 2.4;
    pctx.strokeRect(25, 230, 40, 140);
    pctx.strokeRect(835, 230, 40, 140);
    pctx.lineWidth = 3;
    pctx.beginPath();
    pctx.arc(95, 300, 3, 0, Math.PI * 2);
    pctx.fill();
    pctx.beginPath();
    pctx.arc(805, 300, 3, 0, Math.PI * 2);
    pctx.fill();
    pctx.beginPath();
    pctx.arc(95, 300, 70, -0.9, 0.9);
    pctx.stroke();
    pctx.beginPath();
    pctx.arc(805, 300, 70, Math.PI - 0.9, Math.PI + 0.9);
    pctx.stroke();
    pctx.restore();

    pctx.strokeStyle = 'rgba(255,255,255,0.35)';
    pctx.lineWidth = 1;
    for (let y = 200; y <= 400; y += 15) {
        pctx.beginPath();
        pctx.moveTo(0, y);
        pctx.lineTo(25, y);
        pctx.stroke();
        pctx.beginPath();
        pctx.moveTo(875, y);
        pctx.lineTo(900, y);
        pctx.stroke();
    }
    const glow = pctx.createRadialGradient(450, 300, 10, 450, 300, 280);
    glow.addColorStop(0, 'rgba(255,255,255,0.05)');
    glow.addColorStop(1, 'transparent');
    pctx.fillStyle = glow;
    pctx.fillRect(0, 0, GAME_W, GAME_H);

    const vignette = pctx.createRadialGradient(450, 300, 260, 450, 300, 560);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    pctx.fillStyle = vignette;
    pctx.fillRect(0, 0, GAME_W, GAME_H);

    const topLight = pctx.createLinearGradient(0, 0, 0, 140);
    topLight.addColorStop(0, 'rgba(255,255,255,0.06)');
    topLight.addColorStop(1, 'rgba(255,255,255,0)');
    pctx.fillStyle = topLight;
    pctx.fillRect(25, 0, 850, 140);

    return pc;
}

let _pitchBuiltFor = null;
function drawPitch() {
    const pid = (typeof Shop !== 'undefined') ? Shop.equippedId('pitch') : 'classic';
    if (!_pitchCanvas || _pitchBuiltFor !== pid) {
        _pitchCanvas = buildPitchCanvas(typeof Cosmetics !== 'undefined' ? Cosmetics.palette(pid) : null);
        _pitchBuiltFor = pid;
    }
    ctx.drawImage(_pitchCanvas, 0, 0);
}

// ============================================================
// REALISTIC PLAYER TOKEN — replaces the flat star-in-a-circle disc with a
// beveled, lit "kit disc": jersey-colored body with a soft top-left
// highlight and bottom-right shade (consistent light direction with the
// rest of the scene), a team-color ring, a thin kit-stripe accent, and the
// player's actual squad number instead of a generic star. GK gets a
// gold ring + glove-color center to read distinctly at a glance.
// ============================================================
// PERF: a player token's look (bevel gradient, kit stripe, sheen, AO ring,
// star) depends only on {color, gradColor, isGk, radius} — never on x/y.
// The old code rebuilt 3 fresh radial gradients PER PLAYER, EVERY FRAME
// (8 players x 3 gradients x 60fps = 1440 gradient allocations/sec just for
// this). Instead, render each distinct player "look" once onto a small
// offscreen sprite, cache it by a key of those four properties, and every
// frame just drawImage() the cached sprite at the player's current x/y —
// same pixels, a small fraction of the cost. Sprite is drawn centered with
// a small padding so the AO/sheen/ring aren't clipped.
// ===== TOURNAMENT STRIKER FLAGS =====
// In tournament matches the star in the middle of each striker is replaced by
// that team's flag badge, loaded from images/flags/. Keyed by team name so it
// lines up with TOURNAMENT_TEAMS in tournamentData.js. Any team without a
// file listed here (and every non-tournament match) keeps the original star.
const STRIKER_FLAG_FILES = {
    'Algeria': 'algeria.png', 'Argentina': 'argentina.png', 'Australia': 'australia.png',
    'Austria': 'austria.png', 'Belgium': 'belgium.png', 'Brazil': 'brazil.png',
    'Canada': 'canada.png', 'Colombia': 'colombia.png', 'Croatia': 'croatia.png',
    "Côte d'Ivoire": 'cote-d-ivoire.png', 'Ecuador': 'ecuador.png', 'Egypt': 'egypt.png',
    'England': 'england.png', 'France': 'france.png', 'Germany': 'germany.png',
    'Japan': 'japan.png', 'Mexico': 'mexico.png', 'Morocco': 'morocco.png',
    'Netherlands': 'netherlands.png', 'Norway': 'norway.png', 'Portugal': 'portugal.png',
    'Senegal': 'senegal.png', 'Spain': 'spain.png', 'Switzerland': 'switzerland.png',
    'USA': 'usa.png',
    'Denmark': 'denmark.png', 'Iran': 'iran.png', 'Italy': 'italy.png',
    'Nigeria': 'nigeria.png', 'South Korea': 'south-korea.png',
    'T\u00fcrkiye': 'turkiye.png', 'Uruguay': 'uruguay.png'
};
const _strikerFlagImgs = {};
// Preload every striker flag at startup (while the player is still in the
// menus) so the flag is already decoded when a tournament match begins.
Object.values(STRIKER_FLAG_FILES).forEach(file => {
    if (_strikerFlagImgs[file]) return;
    const img = new Image();
    img.src = 'images/flags/' + file;
    _strikerFlagImgs[file] = img;
});
function getStrikerFlagImage(p) {
    // Tournament matches only. Non-tournament matches keep the star.
    if (!p || !tournamentMode) return null;
    if (typeof TOURNAMENT_TEAMS === 'undefined') return null;
    // Resolve the team from the match state (red = team A, blue = team B).
    // p.teamId can't be trusted here: createPlayers() stores `teamId || null`,
    // which turns Spain's id (0) into null.
    const teamId = (p.team === 'red') ? currentMatchTeamAId : currentMatchTeamBId;
    if (teamId === null || teamId === undefined) return null;
    const team = TOURNAMENT_TEAMS.find(t => t.id === teamId);
    if (!team) return null;
    const file = STRIKER_FLAG_FILES[team.name];
    if (!file) return null;
    let img = _strikerFlagImgs[file];
    if (!img) {
        img = new Image();
        img.src = 'images/flags/' + file;
        _strikerFlagImgs[file] = img;
    }
    // Not usable until fully decoded; caller falls back to the star meanwhile.
    return (img.complete && img.naturalWidth > 0) ? { img: img, file: file } : null;
}

const _playerSpriteCache = new Map();
function getPlayerSprite(p) {
    const r = p.radius;
    const flag = getStrikerFlagImage(p);
    const skin = (typeof Cosmetics !== 'undefined') ? Cosmetics.strikerSkinFor(p) : null;
    // The flag file name is part of the key: a sprite built with the star
    // (flag not loaded yet, or no flag for this team) is never reused once the
    // flag is ready, and two teams sharing a jersey color never share a sprite.
    // The equipped striker skin is part of the key too.
    const key = p.color + '|' + p.gradColor + '|' + (p.isGk ? 1 : 0) + '|' + r + '|' + (flag ? flag.file : '') + '|' + (skin ? skin.id : '');
    let sprite = _playerSpriteCache.get(key);
    if (sprite) return sprite;
    sprite = buildPlayerSprite(p, flag, skin);
    _playerSpriteCache.set(key, sprite);
    return sprite;
}

function buildPlayerSprite(p, flag, skin) {
    const r = p.radius;
    const pad = 6; // room for AO falloff + ring glow beyond radius r
    const size = Math.ceil((r + pad) * 2);
    const cx = size / 2, cy = size / 2;
    const sc = document.createElement('canvas');
    sc.width = size; sc.height = size;
    const sctx = sc.getContext('2d');

    let pGrad = sctx.createRadialGradient(cx - r * 0.4, cy - r * 0.45, r * 0.15, cx, cy, r);
    pGrad.addColorStop(0, p.color);
    pGrad.addColorStop(0.65, p.color);
    pGrad.addColorStop(1, p.gradColor);
    sctx.beginPath();
    sctx.arc(cx, cy, r, 0, Math.PI * 2);
    sctx.fillStyle = pGrad;
    sctx.fill();

    sctx.save();
    sctx.beginPath();
    sctx.arc(cx, cy, r, 0, Math.PI * 2);
    sctx.clip();
    sctx.fillStyle = 'rgba(255,255,255,0.10)';
    sctx.beginPath();
    sctx.moveTo(cx - r, cy - r * 0.15);
    sctx.lineTo(cx - r * 0.3, cy - r);
    sctx.lineTo(cx + r * 0.05, cy - r);
    sctx.lineTo(cx - r * 0.65, cy + r * 0.15);
    sctx.closePath();
    sctx.fill();
    sctx.restore();

    const sheen = sctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, 0, cx - r * 0.35, cy - r * 0.45, r * 0.7);
    sheen.addColorStop(0, 'rgba(255,255,255,0.35)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.beginPath();
    sctx.arc(cx, cy, r, 0, Math.PI * 2);
    sctx.fillStyle = sheen;
    sctx.fill();

    const ao = sctx.createRadialGradient(cx + r * 0.4, cy + r * 0.5, 0, cx + r * 0.4, cy + r * 0.5, r * 0.9);
    ao.addColorStop(0, 'rgba(0,0,0,0)');
    ao.addColorStop(1, 'rgba(0,0,0,0.22)');
    sctx.beginPath();
    sctx.arc(cx, cy, r, 0, Math.PI * 2);
    sctx.fillStyle = ao;
    sctx.fill();

    // Skin rings apply to outfield players; goalkeepers keep their gold ring.
    const skinRing = (skin && skin.ring && !p.isGk) ? Cosmetics.ringStyle(sctx, skin.ring, cx, cy) : null;
    sctx.lineWidth = p.isGk ? 3 : (skinRing ? 2.6 : 2);
    sctx.strokeStyle = p.isGk ? '#f1c40f' : (skinRing || 'rgba(255,255,255,0.95)');
    if (p.isGk) { sctx.shadowColor = '#f1c40f'; sctx.shadowBlur = 6; }
    else if (skinRing && skin.ring !== 'rainbow') { sctx.shadowColor = skin.ring; sctx.shadowBlur = 5; }
    sctx.beginPath();
    sctx.arc(cx, cy, r, 0, Math.PI * 2);
    sctx.stroke();
    sctx.shadowBlur = 0;

    if (flag) {
        // Flag badge replaces the star. The badges are already round, so it is
        // drawn as a circle centered in the token, leaving the white outer ring
        // (and the gold ring on goalkeepers) visible around it.
        const fr = r - (p.isGk ? 3.5 : 2.5);
        sctx.save();
        sctx.beginPath();
        sctx.arc(cx, cy, fr, 0, Math.PI * 2);
        sctx.clip();
        sctx.drawImage(flag.img, cx - fr, cy - fr, fr * 2, fr * 2);
        sctx.restore();
        // keep the ring crisp on top of the flag edge
        sctx.lineWidth = p.isGk ? 3 : 2;
        sctx.strokeStyle = p.isGk ? '#f1c40f' : 'rgba(255,255,255,0.95)';
        sctx.beginPath();
        sctx.arc(cx, cy, r, 0, Math.PI * 2);
        sctx.stroke();
    } else if (skin && skin.emblem && skin.emblem !== 'star') {
        Cosmetics.drawEmblem(sctx, skin.emblem, cx, cy, r);
    } else {
        sctx.save();
        sctx.shadowColor = 'rgba(0,0,0,0.35)';
        sctx.shadowBlur = 2;
        sctx.shadowOffsetY = 0.5;
        // the Prism skin keeps the star but in gold
        if (skin && skin.ring === 'rainbow') sctx.fillStyle = '#ffd23f';
        drawStar(cx, cy, 5, r * 0.5, r * 0.22, sctx);
        sctx.restore();
    }

    return { canvas: sc, size, offset: size / 2 };
}

function drawPlayerToken(p) {
    const sprite = getPlayerSprite(p);
    ctx.drawImage(sprite.canvas, p.x - sprite.offset, p.y - sprite.offset);
}

// PERF: shadowBlur forces a real (expensive) blur pass and this was using
// shadowBlur 10, 40, AND 8 — three separate blurred draws — EVERY FRAME for
// EACH active player (so up to 6 heavy blur passes/frame just for this
// indicator). shadowBlur:40 in particular is enormous; browsers have to
// blur over a wide pixel radius, which is brutal on mobile GPUs. The big
// glow disc is replaced with a cached radial gradient sprite (built once
// per color, reused forever) instead of a live blur. The thin dashed ring
// and small pointer triangle keep a much cheaper shadowBlur (4/3 instead of
// 10/8) — still a soft glow, a fraction of the cost.
const _glowSpriteCache = new Map();
function getGlowSprite(colorHex, radius) {
    const key = colorHex + '|' + radius;
    let sprite = _glowSpriteCache.get(key);
    if (sprite) return sprite;
    const size = Math.ceil(radius * 2);
    const gc = document.createElement('canvas');
    gc.width = size; gc.height = size;
    const gctx = gc.getContext('2d');
    const grad = gctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    grad.addColorStop(0, colorHex + '33');
    grad.addColorStop(0.6, colorHex + '15');
    grad.addColorStop(1, colorHex + '00');
    gctx.fillStyle = grad;
    gctx.beginPath();
    gctx.arc(radius, radius, radius, 0, Math.PI * 2);
    gctx.fill();
    sprite = { canvas: gc, radius };
    _glowSpriteCache.set(key, sprite);
    return sprite;
}

function drawActiveIndicator(p, labelText, colorHex) {
    let time = Date.now() * 0.007;
    let pulseRadius = p.radius + 7 + Math.sin(time) * 3;

    const glow = getGlowSprite(colorHex, p.radius + 14);
    ctx.drawImage(glow.canvas, p.x - glow.radius, p.y - glow.radius);

    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 4;
    ctx.setLineDash([8,4]);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = colorHex;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(p.x - 7, p.y - p.radius - 20);
    ctx.lineTo(p.x + 7, p.y - p.radius - 20);
    ctx.lineTo(p.x, p.y - p.radius - 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.shadowBlur = 0;
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
let _ballSpinT = 0;
function drawMatchBall(b) {
    const speed = Math.hypot(b.vx || 0, b.vy || 0);
    // Spin is advanced per 1/60s of REAL time so the ball rolls at the same
    // visual speed on 60/120/144Hz screens (it used to advance once per frame).
    const nowT = performance.now();
    const spinFrames = _ballSpinT ? Math.min(6, (nowT - _ballSpinT) / 16.667) : 1;
    _ballSpinT = nowT;
    _ballSpin += (0.06 + speed * 0.045) * spinFrames;

    // Every skin (including Classic) is a procedurally built sprite - it never
    // depends on an image file, so the ball can never go missing.
    const skinId = (typeof Shop !== 'undefined') ? Shop.equippedId('ball') : 'classic';
    const skinCanvas = (typeof Cosmetics !== 'undefined') ? Cosmetics.ballSkinCanvas(skinId) : null;
    if (skinCanvas) {
        const sk = Shop.item('ball', skinId);
        if (sk && sk.glow) {
            const hs = Cosmetics.haloSprite(sk.glow, b.radius);
            ctx.drawImage(hs.canvas, b.x - hs.R, b.y - hs.R);
        }
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(_ballSpin);
        ctx.drawImage(skinCanvas, -b.radius, -b.radius, b.radius * 2, b.radius * 2);
        ctx.restore();
        return;
    }

    // Safety net only (Cosmetics not loaded yet): plain shaded ball.
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(_ballSpin);
    const ballGrad = ctx.createRadialGradient(-b.radius * 0.35, -b.radius * 0.4, b.radius * 0.1, 0, 0, b.radius * 1.15);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.55, '#f2f5f7');
    ballGrad.addColorStop(1, '#aeb8c2');
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(20,25,32,0.5)';
    ctx.stroke();
}

// ============================================================
// GOAL STRUCTURES — posts with a simple net-mesh drawn behind them for a
// far more "real goal" look than bare posts floating on the pitch.
// ============================================================


// PERF: goal nets + posts never move or change, so — same trick as the
// pitch — bake them once into an offscreen canvas and blit every frame
// instead of re-stroking ~180 net-mesh lines and rebuilding 4 post
// gradients every single frame.
let _goalStructuresCanvas = null;
function buildGoalStructuresCanvas() {
    const gc = document.createElement('canvas');
    gc.width = GAME_W; gc.height = GAME_H;
    const gctx = gc.getContext('2d');

    const drawNet = (side) => {
        const x0 = side === 'left' ? 2 : 875;
        const x1 = side === 'left' ? 25 : 898;
        const yTop = 200, yBot = 400;
        gctx.save();
        gctx.strokeStyle = 'rgba(255,255,255,0.22)';
        gctx.lineWidth = 1;
        const cols = 8, rows = 10;
        for (let i = 0; i <= cols; i++) {
            const x = x0 + (x1 - x0) * (i / cols);
            gctx.beginPath();
            gctx.moveTo(x, yTop);
            gctx.lineTo(x, yBot);
            gctx.stroke();
        }
        for (let j = 0; j <= rows; j++) {
            const y = yTop + (yBot - yTop) * (j / rows);
            gctx.beginPath();
            gctx.moveTo(x0, y);
            gctx.lineTo(x1, y);
            gctx.stroke();
        }
        gctx.restore();
    };
    drawNet('left');
    drawNet('right');

    for (let post of posts) {
        gctx.fillStyle = 'rgba(0,0,0,0.4)';
        gctx.beginPath();
        gctx.ellipse(post.x, post.y + 4, post.radius, post.radius * 0.5, 0, 0, Math.PI * 2);
        gctx.fill();
        let postGrad = gctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
        postGrad.addColorStop(0, '#ffffff');
        postGrad.addColorStop(0.7, '#dfe4e8');
        postGrad.addColorStop(1, '#a7b0b8');
        gctx.beginPath();
        gctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
        gctx.fillStyle = postGrad;
        gctx.fill();
        gctx.lineWidth = 1.5;
        gctx.strokeStyle = '#2c3e50';
        gctx.stroke();
    }
    return gc;
}

function drawGoalStructures() {
    if (!_goalStructuresCanvas) _goalStructuresCanvas = buildGoalStructuresCanvas();
    ctx.drawImage(_goalStructuresCanvas, 0, 0);
}

// Toggles a `match-active` class on <body> so the stadium crowd bands
// (style.css) only ever show up while an actual match is on the pitch —
// MENU, SETTINGS, STATS, CREDITS, INSTRUCTIONS, and every tournament menu/
// bracket/team-select screen stay plain black like before. Live-match
// states cover normal play, goal celebrations, the pause overlay (still
// shows the pitch behind it), and the full-time screen. Called every frame
// from draw(), but — same as syncCrowdColors — only touches the DOM when
// the on/off state actually flips.
let _lastMatchActive = null;
const MATCH_ACTIVE_STATES = new Set(['PLAY', 'GOAL_SCORED', 'PAUSED', 'MATCH_END', 'PENALTY_SHOOTOUT']);
function syncMatchActiveClass() {
    const isActive = MATCH_ACTIVE_STATES.has(currentState);
    if (isActive === _lastMatchActive) return;
    _lastMatchActive = isActive;
    document.body.classList.toggle('match-active', isActive);
}

// Pushes the currently active team colors (red/team-A side, blue/team-B
// side) into the CSS custom properties the stadium crowd bands read for
// their tint — so in tournament mode the crowd matches whichever real
// teams are playing, and in normal 1v1/vs-COM it stays red/blue. Called
// every frame from drawScoreboard(), but only actually touches the DOM
// when a color changes, since style writes are far more expensive than a
// couple of string compares.
let _lastCrowdColorA = null, _lastCrowdColorB = null;
function syncCrowdColors(colorA, colorB) {
    if (colorA === _lastCrowdColorA && colorB === _lastCrowdColorB) return;
    _lastCrowdColorA = colorA;
    _lastCrowdColorB = colorB;
    document.documentElement.style.setProperty('--crowd-left', colorA);
    document.documentElement.style.setProperty('--crowd-right', colorB);
}

let _scoreboardPanelCanvas = null;
function drawScoreboard() {
    let teamAName = 'RED';
    let teamBName = gameMode === 'pve' ? 'COM' : 'BLUE';
    let teamAColor = '#ff5252';
    let teamBColor = '#48dbfb';
    let teamAObj = null;
    let teamBObj = null;

    if (tournamentMode && tournamentPendingMatch) {
        const match = tournamentPendingMatch;
        const playerTeamId = tournamentSelectedTeam;
        if (match.teamA && match.teamB) {
            if (match.teamA.id === playerTeamId) {
                teamAObj = match.teamA;
                teamBObj = match.teamB;
            } else {
                teamAObj = match.teamB;
                teamBObj = match.teamA;
            }
            teamAName = teamAObj.name;
            teamAColor = teamAObj.color;
            teamBName = teamBObj.name;
            // See KIT CLASH RESOLUTION in physics.js — must match createPlayers().
            teamBColor = resolveAwayColor(teamAObj.color, teamBObj.color);
        }
    }

    syncCrowdColors(teamAColor, teamBColor);

    // PERF: the scoreboard panel's background (gradient fill + shadowBlur 20
    // drop shadow) never changes shape or color — only the text drawn on top
    // of it changes every frame. shadowBlur 20 is expensive; baking the
    // panel once and blitting it removes that cost from the hot path
    // entirely while the score/names/timer above it still update live.
    if (!_scoreboardPanelCanvas) {
        const sc = document.createElement('canvas');
        sc.width = GAME_W; sc.height = GAME_H;
        const sctx = sc.getContext('2d');
        sctx.save();
        sctx.shadowColor = 'rgba(0,0,0,0.6)';
        sctx.shadowBlur = 20;
        sctx.shadowOffsetY = 6;
        const scoreboardBg = sctx.createLinearGradient(120, 10, 120, 70);
        scoreboardBg.addColorStop(0, 'rgba(22,28,38,0.88)');
        scoreboardBg.addColorStop(1, 'rgba(10,13,20,0.88)');
        sctx.fillStyle = scoreboardBg;
        sctx.beginPath();
        sctx.roundRect(120, 10, 660, 60, 20);
        sctx.fill();
        sctx.shadowColor = 'transparent';
        sctx.shadowBlur = 0;
        sctx.shadowOffsetY = 0;
        sctx.strokeStyle = 'rgba(255,255,255,0.18)';
        sctx.lineWidth = 1.5;
        sctx.stroke();
        sctx.restore();
        _scoreboardPanelCanvas = sc;
    }
    ctx.drawImage(_scoreboardPanelCanvas, 0, 0);

    ctx.textAlign = 'right';
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillStyle = teamAColor;
    let shortA = teamAName.length > 14 ? teamAName.slice(0,14)+'..' : teamAName;
    ctx.fillText(shortA, 385, 32);
    if (teamAObj) {
        // Team A's name is right-aligned ending at x=385, so measure it and
        // place the flag just to its left (growing further away from
        // center, matching how the name itself grows leftward).
        const nameW = ctx.measureText(shortA).width;
        drawTeamFlag(teamAObj, 385 - nameW - 6, 32, 13, 'right');
    }
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
    let shortB = teamBName.length > 14 ? teamBName.slice(0,14)+'..' : teamBName;
    ctx.fillText(shortB, 515, 32);
    if (teamBObj) {
        // Team B's name is left-aligned starting at x=515, so measure it
        // and place the flag just to its right.
        const nameW = ctx.measureText(shortB).width;
        drawTeamFlag(teamBObj, 515 + nameW + 6, 32, 13, 'left');
    }
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
// ===== FIXED: Show EXTRA TIME when the active match state says it is active =====
const extraState = tournamentPendingMatch && tournamentPendingMatch.tournamentState;
if ((!tournamentMode && gameMode === '1v1' && localExtraTimePlayed) || (extraState && extraState.active)) {
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
        if (typeof Shop !== 'undefined') Shop.drawMatchBadge();      // win-streak flame (only when streak > 0)
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

// PERF: this was rebuilding 2 gradients AND doing a shadowBlur:30 drop
// shadow EVERY call — and it's called multiple times per frame during play
// (match clock, GK timer, difficulty badge) plus constantly across every
// menu screen. shadowBlur:30 is one of the heaviest single ops in the whole
// renderer. Since the panel's appearance depends only on w/h/r/accent (not
// x/y — x/y just move it), bake each distinct panel shape once into a
// sprite at local (0,0) with padding for the shadow bleed, cache it by
// those params, and just drawImage() it at the requested x/y every call.
const _glassPanelCache = new Map();
function drawGlassPanel(x, y, w, h, r = 20, accent = 'rgba(255,255,255,0.14)') {
    const pad = 16; // room for the shadowBlur:30 / offsetY:14 bleed
    const key = w + '|' + h + '|' + r + '|' + accent;
    let sprite = _glassPanelCache.get(key);
    if (!sprite) {
        const sw = Math.ceil(w + pad * 2), sh = Math.ceil(h + pad * 2 + 14);
        const sc = document.createElement('canvas');
        sc.width = sw; sc.height = sh;
        const sctx = sc.getContext('2d');
        const ox = pad, oy = pad;

        sctx.save();
        sctx.shadowColor = 'rgba(0,0,0,0.55)';
        sctx.shadowBlur = 30;
        sctx.shadowOffsetY = 14;
        const bg = sctx.createLinearGradient(ox, oy, ox, oy + h);
        bg.addColorStop(0, 'rgba(24,32,46,0.92)');
        bg.addColorStop(1, 'rgba(9,13,22,0.96)');
        sctx.fillStyle = bg;
        sctx.beginPath();
        sctx.roundRect(ox, oy, w, h, r);
        sctx.fill();
        sctx.restore();

        const sheen = sctx.createLinearGradient(ox, oy, ox, oy + h * 0.4);
        sheen.addColorStop(0, 'rgba(255,255,255,0.08)');
        sheen.addColorStop(1, 'rgba(255,255,255,0)');
        sctx.fillStyle = sheen;
        sctx.beginPath();
        sctx.roundRect(ox, oy, w, h, r);
        sctx.fill();

        sctx.strokeStyle = accent;
        sctx.lineWidth = 1.5;
        sctx.beginPath();
        sctx.roundRect(ox + 0.75, oy + 0.75, w - 1.5, h - 1.5, r);
        sctx.stroke();

        sprite = { canvas: sc, ox, oy };
        _glassPanelCache.set(key, sprite);
    }
    ctx.drawImage(sprite.canvas, x - sprite.ox, y - sprite.oy);
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
    const { active = false, sub = null, filled = false, fontSize = 20, disabled = false } = opts;
    const hovered = !disabled && typeof uiButtonHovered === 'function' &&
        uiButtonHovered(x, y, w, h);
    ctx.save();
    const alphaBase = filled || active ? 0.22 : 0.09;
    ctx.shadowColor = hovered ? color : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = hovered ? 18 : (active ? 6 : 0);
    ctx.fillStyle = hexToRgba(color, alphaBase);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(16, h / 2.4));
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = hexToRgba(color, hovered ? 1 : (active ? 0.95 : 0.55));
    ctx.lineWidth = hovered ? 3 : (active ? 2.5 : 1.5);
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

function uiButtonHovered(x, y, w, h) {
    const hover = window._uiHover;
    const targets = hover && hover.state === currentState && hover.targets;
    return Array.isArray(targets) && targets.some((target) =>
        target.hovered &&
        Math.abs(target.x - x) < 0.5 &&
        Math.abs(target.y - y) < 0.5 &&
        Math.abs(target.w - w) < 0.5 &&
        Math.abs(target.h - h) < 0.5
    );
}

function hexToRgba(hex, alpha) {
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}

function drawPauseButton() {
    window._pauseGameBtn = { x: 846, y: 6, w: 50, h: 48 };
    const x = 860, y = 15, w = 30, h = 30;
    ctx.save();
    ctx.fillStyle = pauseButton.hover ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawIcon(ctx, 'pause', x + w / 2, y + h / 2, 20, '#ffffff');
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '7px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', x + w/2, y + h + 12);
    ctx.restore();
}

// ===== AD STRATEGY: tournament knockout-loss rewarded continue offer =====
// Shown BEFORE the loss is committed to TournamentManager (see main.js —
// window._pendingContinueOffer). Visually consistent with
// drawTournamentResult's "DEFEAT" screen so it doesn't feel like a
// different, bolted-on UI, but is its own screen/state precisely because
// the tournament result hasn't been decided yet at this point.
function drawTournamentContinueOffer() {
    drawMenuBackground();
    ctx.save();
    drawGlassPanel(150, 55, 600, 480, 26, 'rgba(241,196,15,0.22)');
    ctx.textAlign = 'center';

    window._tournamentWatchAdBtn = null;
    window._tournamentContinueWithoutAdBtn = null;

    const offer = window._pendingContinueOffer;
    if (!offer) { ctx.restore(); return; }

    const playerTeamId = tournamentSelectedTeam;
    const isPlayerTeamA = offer.teamA && offer.teamA.id === playerTeamId;
    const playerScore = isPlayerTeamA ? offer.teamAScore : offer.teamBScore;
    const opponentScore = isPlayerTeamA ? offer.teamBScore : offer.teamAScore;

    drawGlowTitle('DEFEAT', 450, 100, '#e74c3c', 46);

    const myTeam = isPlayerTeamA ? offer.teamA : offer.teamB;
    const oppTeam = isPlayerTeamA ? offer.teamB : offer.teamA;
    fillTextWithFlags([myTeam, ` ${playerScore} - ${opponentScore} `, oppTeam], 450, 200, '900 52px Outfit, sans-serif', '#ffffff');
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 20px Outfit, sans-serif';
    ctx.fillText(`${myTeam.name} vs ${oppTeam.name}`, 450, 250);

    ctx.fillStyle = '#e74c3c';
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillText(`Goals: ${playerScore} - ${opponentScore}`, 450, 300);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '500 16px Outfit, sans-serif';
    ctx.fillText('One more shot at this match?', 450, 345);

    // When rewarded ads are available, both options must feel equally
    // important and equally easy to tap. When they are unavailable, we fall
    // back to the ordinary no-ad path and do not show a rewarded button.
    const hasAdManager = typeof AdManager !== 'undefined';
    const rewardedAvailable = hasAdManager && PlatformSDK && PlatformSDK.isSupported && PlatformSDK.isRewardedAdAvailable && PlatformSDK.isSupported() && PlatformSDK.isRewardedAdAvailable();
    const disabled = hasAdManager && AdManager.isAdRequestInFlight();
    const buttonW = 270;
    const buttonH = 62;
    const leftX = 180;
    const rightX = 450;

    if (rewardedAvailable) {
        const watchHovered = !disabled && uiButtonHovered(leftX, 400, buttonW, buttonH);
        if (watchHovered) {
            ctx.save();
            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 20;
        }
        ctx.fillStyle = disabled ? 'rgba(241,196,15,0.08)' : 'rgba(241, 196, 15, 0.2)';
        ctx.beginPath();
        ctx.roundRect(leftX, 400, buttonW, buttonH, 14);
        ctx.fill();
        ctx.strokeStyle = disabled ? 'rgba(241,196,15,0.4)' : '#f1c40f';
        ctx.lineWidth = watchHovered ? 3.5 : 2.5;
        ctx.stroke();
        if (watchHovered) ctx.restore();
        ctx.fillStyle = disabled ? 'rgba(241,196,15,0.5)' : '#f1c40f';
        ctx.font = '800 16px Outfit, sans-serif';
        drawIcon(ctx, 'play', leftX + 30, 421, 22, disabled ? 'rgba(241,196,15,0.5)' : '#f1c40f');
        ctx.fillText('WATCH AD TO CONTINUE', leftX + buttonW / 2 + 12, 426);
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.fillText(`+${hasAdManager ? AdManager.getBonusSeconds() : 45} SEC COMEBACK`, leftX + buttonW / 2, 447);
        if (!disabled) window._tournamentWatchAdBtn = { x: leftX, y: 400, w: buttonW, h: buttonH };
    }

    const continueHovered = uiButtonHovered(rightX, 400, buttonW, buttonH);
    ctx.fillStyle = continueHovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(rightX, 400, buttonW, buttonH, 14);
    ctx.fill();
    ctx.strokeStyle = continueHovered ? '#ffffff' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = continueHovered ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px Outfit, sans-serif';
    ctx.fillText('CONTINUE', rightX + buttonW / 2, 426);
    ctx.fillText('WITHOUT AD', rightX + buttonW / 2, 447);
    window._tournamentContinueWithoutAdBtn = { x: rightX, y: 400, w: buttonW, h: buttonH };

    ctx.restore();
}

function draw() {
    try {
        syncMatchActiveClass();
        ctx.clearRect(0,0,GAME_W,GAME_H);
        ctx.save();
        ctx.translate(screenShake.x, screenShake.y);

if (currentState === 'MENU') {
    // NEW MENU: "Tunnel Walkout" — see menu.js. Replaces the old glass-panel
    // + floating hero layout entirely. window._menuButtons hit-boxes are set
    // inside drawTunnelMenu()/drawMatchdayCard(), same shape input.js expects.
    const hoverIndex =
        Number.isInteger(window._menuHoverIndex)
            ? window._menuHoverIndex
            : -1;
    drawTunnelMenu(hoverIndex);
    ctx.restore();
    return;
}


        if (currentState === 'CREDITS') {
            drawCreditsScreen();
            ctx.restore();
            return;
        }

        if (currentState === 'SHOP') {
            Shop.draw();
            ctx.restore();
            return;
        }

        if (currentState === 'DIFFICULTY_SELECT') {
            drawDifficultySelect();
            ctx.restore();
            return;
        }

        if (currentState === 'INSTRUCTIONS') {
            drawInstructionsScreen();
            ctx.restore();
            return;
        }
        if (currentState === 'SETTINGS') {
            drawSettingsScreen();
            ctx.restore();
            return;
        }

        if (currentState === 'STATS') {
            drawStatsScreen();
            ctx.restore();
            return;
        }

        if (currentState === 'PROGRESS') {
            ProgressUI.draw();
            ctx.restore();
            return;
        }

        if (currentState === 'TUTORIAL') {
            TutorialManager.draw();
            ctx.restore();
            return;
        }

        if (currentState === 'TUTORIAL_COMPLETE') {
            TutorialManager.drawComplete();
            ctx.restore();
            return;
        }

        if (currentState === 'PENALTY_SHOOTOUT') {
            drawTournamentShootout();
            drawShootoutIntro();
            ctx.restore();
            return;
        }

        if (currentState === 'TOURNAMENT_MENU') {
            drawTournamentMenu();
            ctx.restore();
            return;
        }
        if (currentState === 'TOURNAMENT_TEAM_SELECT') {
            drawTeamSelection();
            ctx.restore();
            return;
        }
        if (currentState === 'TOURNAMENT_GROUP_STAGE') {
            drawGroupStage();
            ctx.restore();
            return;
        }
        if (currentState === 'TOURNAMENT_BRACKET') {
            drawTournamentBracket();
            ctx.restore();
            return;
        }
        if (currentState === 'TOURNAMENT_RESULT') {
    drawTournamentResult(TournamentManager.getLastPlayerMatch());
    if (typeof Shop !== 'undefined') {
        const _lm = TournamentManager.getLastPlayerMatch();
        Shop.drawRewardChip(450, 492, _lm ? _lm.uid : null);
    }
    ctx.restore();
    return;
}
        if (currentState === 'TOURNAMENT_CONTINUE_OFFER') {
            drawTournamentContinueOffer();
            ctx.restore();
            return;
        }
        if (currentState === 'TOURNAMENT_CHAMPION') {
            drawChampionCelebration();
            ctx.restore();
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

        const _trailItem = (typeof Shop !== 'undefined') ? Shop.equippedItem('trail') : null;
        if (ball.trail && ball.trail.length > 0 && _trailItem && _trailItem.style) {
            Cosmetics.drawTrail(ball.trail, ball.radius, _trailItem.style, performance.now());
        } else if (ball.trail && ball.trail.length > 0) {
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

        if (window._introBanner && currentState === 'PLAY') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.88)';
            ctx.fillRect(0, 250, 900, 100);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 56px Outfit, sans-serif';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 20;
            ctx.fillText(window._introBanner.text, 450, 318);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        if (kickoffDelay > 0 && !window._introBanner && currentState === 'PLAY' && matchState === 'PLAY') {
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
            if (lastScorerTeam) {
                // Real flag image instead of the plain text baked with an
                // emoji (that's what showed as raw "BR"/"ES" style codes
                // wherever the flag emoji glyph wasn't supported).
                // We're already translated to (450,280) and scaled by
                // goalZoomScale above, so draw at local origin (0,48).
                fillTextWithFlags([lastScorerTeam, ' ' + lastScorer], 0, 48, '800 22px Outfit, sans-serif', '#ffffff');
            } else {
                ctx.fillText(lastScorer, 0, 48);
            }
            ctx.restore();
        }

        if (currentState === 'MATCH_END') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.88)';
            ctx.fillRect(0, 200, 900, 200);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 56px Outfit, sans-serif';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 20;
            if (localPenaltyResult) {
                ctx.font = '900 46px Outfit, sans-serif';
                ctx.fillStyle = localPenaltyResult.winner === 'PLAYER 1' ? '#ff5252' : '#2fd1ff';
                ctx.fillText(`${localPenaltyResult.winner} WINS!`, 450, 270);
            } else if (!tournamentMode && lastScorer === 'DRAW!') {
                ctx.font = '900 56px Outfit, sans-serif';
                const tw = ctx.measureText('DRAW!').width;
                drawIcon(ctx, 'handshake', 450 - tw / 2 - 34, 252, 48, '#f1c40f');
                ctx.textAlign = 'left';
                ctx.fillText('DRAW!', 450 - tw / 2 + 4, 270);
                ctx.textAlign = 'center';
            } else {
                ctx.fillText(tournamentMode ? 'FULL TIME' : lastScorer, 450, 270);
            }
            ctx.shadowBlur = 0;

            let nameL = 'RED', nameR = 'BLUE';
            if (tournamentMode && tournamentPendingMatch) {
                const m = tournamentPendingMatch;
                const aIsPlayer = m.teamA.id === tournamentSelectedTeam;
                nameL = (aIsPlayer ? m.teamA : m.teamB).name.toUpperCase();
                nameR = (aIsPlayer ? m.teamB : m.teamA).name.toUpperCase();
            }
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 26px Outfit, sans-serif';
            ctx.fillText(localPenaltyResult
                ? `PENALTIES  ${localPenaltyResult.playerGoals} - ${localPenaltyResult.opponentGoals}`
                : `${nameL} ${score.red} - ${score.blue} ${nameR}`, 450, 330);
            if (!tournamentMode) {
                ctx.fillStyle = '#95a5a6';
                ctx.font = '600 18px Outfit, sans-serif';
                ctx.fillText('Press ENTER or tap to continue', 450, 380);
            }
            ctx.restore();
            if (!tournamentMode && typeof Shop !== 'undefined') Shop.drawRewardChip(450, 428, null);

        }

        ctx.restore();
    } catch (err) {
        console.error('[renderer.js draw] ERROR:', err);
        try { ctx.restore(); } catch (e) {}
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, GAME_W, GAME_H);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, 900, 600);
        ctx.fillStyle = '#ff5252';
        ctx.font = 'bold 30px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Something went wrong', 450, 280);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Outfit, sans-serif';
        ctx.fillText('Check the console for details', 450, 330);
        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px monospace';
        ctx.fillText(err.message, 450, 380);
    }
}