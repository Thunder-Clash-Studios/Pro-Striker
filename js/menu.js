// ===== PRO STRIKER - menu.js (v2 — BOLD SPORTS-APP STYLE) =====
console.log('[ProStriker] menu.js v2 loaded');

const MENU_ACCENT = '#1fd15c';
const MENU_GOLD = '#ffc636';
const MENU_INK = '#0b1220';
const MENU_INK_2 = '#121b2e';
const TUTORIAL_MENU_ACCENT = '#1fd15c';

function drawKickoffBackdrop(time) {
    const sky = ctx.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, '#12203a');
    sky.addColorStop(0.4, '#0f2e4a');
    sky.addColorStop(1, '#0a3a2e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 900, 600);

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(450, 40, 620, 130, 0, 0, Math.PI * 2);
    ctx.clip();
    const crowdColors = ['#1a2c4a', '#20355a', '#17253f', '#243a5e'];
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = crowdColors[i % crowdColors.length];
        ctx.fillRect((i * 24) % 900, -40 + (i % 3) * 14, 20, 12);
    }
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-50, 600);
    ctx.lineTo(950, 600);
    ctx.lineTo(760, 150);
    ctx.lineTo(140, 150);
    ctx.closePath();
    ctx.clip();

    const stripeCount = 12;
    for (let i = 0; i < stripeCount; i++) {
        const t0 = i / stripeCount, t1 = (i + 1) / stripeCount;
        ctx.fillStyle = i % 2 === 0 ? '#1fae54' : '#25c162';
        ctx.beginPath();
        ctx.moveTo(-50 + t0 * 1000, 600);
        ctx.lineTo(-50 + t1 * 1000, 600);
        ctx.lineTo(140 + t1 * 620, 150);
        ctx.lineTo(140 + t0 * 620, 150);
        ctx.closePath();
        ctx.fill();
    }

    const sweepX = ((time * 60) % 1400) - 250;
    const sheen = ctx.createLinearGradient(sweepX, 0, sweepX + 180, 0);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.10)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 130, 900, 480);

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(450, 150); ctx.lineTo(450, 600);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(450, 380, 90, 55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 380, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    const lightPositions = [[130, 60], [770, 60]];
    lightPositions.forEach(([lx, ly], i) => {
        const flicker = 0.9 + Math.sin(time * 2 + i * 2) * 0.06;
        const beam = ctx.createRadialGradient(lx, ly, 5, lx, ly, 260);
        beam.addColorStop(0, `rgba(255,250,225,${0.55 * flicker})`);
        beam.addColorStop(0.5, `rgba(255,240,180,${0.14 * flicker})`);
        beam.addColorStop(1, 'rgba(255,230,150,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.arc(lx, ly, 260, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.shadowColor = '#fff6d8';
        ctx.shadowBlur = 18;
        ctx.fillStyle = `rgba(255,252,235,${0.95 * flicker})`;
        ctx.beginPath();
        ctx.arc(lx, ly, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawKickoffHeroBall(time) {
    const bx = 250, by = 330 + Math.sin(time * 1.6) * 10;
    const r = 56;

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(bx, 395, r * 0.85, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(time * 0.9);

    // Always the procedurally drawn ball (equipped skin) - no image dependency.
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 24;
    const _heroSkin = (typeof Cosmetics !== 'undefined')
        ? Cosmetics.ballSkinCanvas((typeof Shop !== 'undefined') ? Shop.equippedId('ball') : 'classic')
        : null;
    if (_heroSkin) {
        ctx.drawImage(_heroSkin, -r, -r, r * 2, r * 2);
    } else {
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#f2f5f7'; ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
        const a = Math.PI * 0.65 + i * 0.18;
        ctx.beginPath();
        ctx.arc(bx, by, r + 22 + i * 10, a, a + 0.5);
        ctx.stroke();
    }
    ctx.restore();
}

function drawKickoffTitle(time) {
    ctx.save();
    ctx.textAlign = 'left';

    ctx.fillStyle = MENU_GOLD;
    ctx.beginPath();
    ctx.roundRect(44, 34, 116, 24, 6);
    ctx.fill();
    ctx.fillStyle = MENU_INK;
    ctx.font = '800 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MATCHDAY', 44 + 58, 50);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px Impact, "Arial Narrow", sans-serif';
    ctx.fillText('PRO', 42, 118);
    ctx.fillStyle = MENU_ACCENT;
    ctx.font = '900 56px Impact, "Arial Narrow", sans-serif';
    const proW = ctx.measureText('PRO ').width;
    ctx.fillText('STRIKER', 42 + proW, 118);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.fillText('ARCADE FOOTBALL — FIRST WHISTLE IN 3...2...1', 44, 140);
    ctx.restore();
}

function drawKickoffCard(hoverIndex) {
    const cardX = 470, cardY = 160, cardW = 390;

    const options = [
        { key: '01', label: '1 VS 1', sub: 'LOCAL SHOWDOWN', icon: 'shirt', color: '#2fd1ff' },
        { key: '02', label: 'VS COMPUTER', sub: 'TEST YOUR LIMITS', icon: 'vsComputer', color: '#ff6b6b' },
        { key: '03', label: 'TOURNAMENT', sub: 'CHASE THE CUP', icon: 'trophy', color: MENU_GOLD },
        { key: '04', label: 'INSTRUCTIONS', sub: 'LEARN THE CONTROLS', icon: 'book', color: MENU_GOLD },
        { key: '05', label: 'PROGRESS', sub: 'STATS · CHALLENGES · TROPHIES', icon: 'chart', color: MENU_ACCENT },
        { key: '06', label: 'SETTINGS', sub: 'MATCH & AUDIO', icon: 'gear', color: '#9b7bff' }
    ];

    // TUTORIAL gets its own distinct banner button, not just another row in
    // the list — a different shape, a pulsing glow, and a "START HERE" badge
    // so anyone can spot it immediately as the place to learn the game.
    const tutY = drawTutorialBanner(cardX, cardY, cardW);

    const rowW = cardW, rowH = 50, rowGap = 6;
    const rowsStartY = tutY;

    window._menuButtons = options.map((opt, i) => ({
        x: cardX, y: rowsStartY + i * (rowH + rowGap), w: rowW, h: rowH
    }));

    options.forEach((opt, i) => {
        const isHovered = hoverIndex === i;
        const y = rowsStartY + i * (rowH + rowGap);
        const x = cardX;

        ctx.save();
        const isProgressRow = (opt.label === 'PROGRESS');
        const progressClaimable = isProgressRow && typeof Progress !== 'undefined' && Progress.hasClaimableChallenge();
        const pulse = progressClaimable ? 0.6 + Math.sin(Date.now() * 0.005) * 0.4 : 0;
        if (isHovered) {
            ctx.shadowColor = opt.color;
            ctx.shadowBlur = 22;
            ctx.shadowOffsetY = 4;
        } else if (progressClaimable) {
            // A claimable daily challenge makes the PROGRESS row itself glow
            // gold, unhovered - the same "come back and look" language the
            // streak chip and SHOP's free-reward dot already use elsewhere,
            // so it reads as consistent rather than a one-off effect.
            ctx.shadowColor = MENU_GOLD;
            ctx.shadowBlur = 10 + pulse * 14;
            ctx.shadowOffsetY = 4;
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.45)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;
        }

        ctx.fillStyle = isHovered ? opt.color : MENU_INK_2;
        ctx.beginPath();
        ctx.roundRect(x, y, rowW, rowH, 14);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = opt.color;
        ctx.beginPath();
        ctx.roundRect(x, y, 6, rowH, { tl: 14, bl: 14, tr: 0, br: 0 });
        ctx.fill();
        if (isProgressRow && !isHovered) {
            // Featured row: a green-to-ink gradient wash and a soft green
            // outline set it apart from the plain navy rows, so it reads as
            // "your progress lives here" rather than just another menu item.
            const wash = ctx.createLinearGradient(x, y, x + rowW, y);
            wash.addColorStop(0, 'rgba(31,209,92,0.30)');
            wash.addColorStop(0.6, 'rgba(31,209,92,0.08)');
            wash.addColorStop(1, 'rgba(31,209,92,0)');
            ctx.fillStyle = wash;
            ctx.beginPath(); ctx.roundRect(x, y, rowW, rowH, 14); ctx.fill();
            ctx.strokeStyle = progressClaimable ? MENU_GOLD : 'rgba(92,240,160,0.55)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(x + 0.75, y + 0.75, rowW - 1.5, rowH - 1.5, 14); ctx.stroke();
        }
        ctx.restore();

        const badgeCX = x + 44, badgeCY = y + rowH / 2;
        ctx.beginPath();
        ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.92)' : opt.color;
        ctx.arc(badgeCX, badgeCY, 21, 0, Math.PI * 2);
        ctx.fill();
        drawIcon(ctx, opt.icon, badgeCX, badgeCY, 22, isHovered ? opt.color : MENU_INK);

        const textX = x + 78;
        ctx.textAlign = 'left';
        ctx.fillStyle = isHovered ? MENU_INK : '#ffffff';
        ctx.font = '800 18px Outfit, sans-serif';
        ctx.fillText(opt.label, textX, y + rowH / 2 - 2);
        ctx.fillStyle = isHovered ? 'rgba(11,18,32,0.7)' : 'rgba(255,255,255,0.42)';
        ctx.font = '700 10px Outfit, sans-serif';
        ctx.fillText(opt.sub, textX, y + rowH / 2 + 14);

        if (isProgressRow && typeof Progress !== 'undefined') {
            // A small "LV 7" chip standing in for the level badge you'd see
            // in the full Progress screen - visible right on the menu, not
            // just after opening the tab, so a returning player sees their
            // level go up without having to check.
            const lvl = Progress._data().level;
            // Measure the label in the SAME font it was actually drawn in
            // above (800 18px) BEFORE switching ctx.font to the badge's own
            // font - measuring after switching returned the small badge
            // font's (much narrower) width instead, placing the badge on
            // top of the label's own text instead of after it.
            ctx.font = '800 18px Outfit, sans-serif';
            const labelW = ctx.measureText(opt.label).width;
            ctx.font = '900 10px Outfit, sans-serif';
            const lvlLabel = 'LV ' + lvl;
            const lvlW = ctx.measureText(lvlLabel).width + 14;
            const lvlX = textX + labelW + 12, lvlY = y + rowH / 2 - 15;
            ctx.fillStyle = isHovered ? 'rgba(11,18,32,0.18)' : 'rgba(31,209,92,0.22)';
            ctx.beginPath(); ctx.roundRect(lvlX, lvlY, lvlW, 17, 8); ctx.fill();
            ctx.fillStyle = isHovered ? MENU_INK : '#5cf0a0';
            ctx.fillText(lvlLabel, lvlX + 7, lvlY + 12);

            // Live XP bar: how far into the current level the player is.
            const need = Progress.xpForNextLevel(), into = Progress.xpIntoLevel();
            const frac = Math.max(0, Math.min(1, need > 0 ? into / need : 0));
            const barX = textX, barY = y + rowH - 8, barW = rowW - 78 - 70, barH = 3;
            ctx.fillStyle = isHovered ? 'rgba(11,18,32,0.25)' : 'rgba(255,255,255,0.12)';
            ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 2); ctx.fill();
            if (frac > 0) {
                ctx.fillStyle = isHovered ? MENU_INK : '#5cf0a0';
                ctx.beginPath(); ctx.roundRect(barX, barY, Math.max(barH, barW * frac), barH, 2); ctx.fill();
            }
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = isHovered ? 'rgba(11,18,32,0.15)' : 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(x + rowW - 54, y + rowH / 2 - 15, 34, 30, 8);
        ctx.fill();
        ctx.fillStyle = isHovered ? MENU_INK : 'rgba(255,255,255,0.5)';
        ctx.font = '900 15px Outfit, sans-serif';
        ctx.fillText(opt.key, x + rowW - 37, y + rowH / 2 + 5);
        if (progressClaimable) {
            ctx.fillStyle = '#ff3b3b';
            ctx.beginPath(); ctx.arc(x + rowW - 24, y + rowH / 2 - 15, 6, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
        }
    });
}

// A visually distinct banner button for the tutorial, sitting above the
// regular menu list. Uses the same dark card color as the list rows (so it
// actually contrasts against the green pitch background behind it — a
// green-on-green fill here was nearly invisible) but a different shape
// (full pill, dashed border), a pulsing gold glow, and a "START HERE"
// badge make it unmistakably not just another row.
function drawTutorialBanner(cardX, cardY, cardW) {
    const h = 62;
    const isHovered = !!window._tutorialHover;
    const pulse = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;

    window._tutorialBtn = { x: cardX, y: cardY, w: cardW, h };

    ctx.save();
    ctx.shadowColor = MENU_GOLD;
    ctx.shadowBlur = isHovered ? 28 : 16 + pulse * 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = isHovered ? '#1a2740' : MENU_INK_2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, h, 18);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Solid gold edge, thick enough to read clearly against the pitch —
    // this is what makes the banner pop rather than melt into the green
    // background behind it.
    ctx.strokeStyle = MENU_GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cardX + 1.5, cardY + 1.5, cardW - 3, h - 3, 17);
    ctx.stroke();

    // Dashed inner accent — reads as a "training pitch" outline, distinct
    // from every solid list row below it.
    ctx.strokeStyle = 'rgba(31,209,92,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.roundRect(cardX + 8, cardY + 8, cardW - 16, h - 16, 12);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const badgeCX = cardX + 44, badgeCY = cardY + h / 2;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.arc(badgeCX, badgeCY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = MENU_GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(badgeCX, badgeCY, 24, 0, Math.PI * 2);
    ctx.stroke();
    drawIcon(ctx, 'target', badgeCX, badgeCY, 26, '#0f8a45');

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px Outfit, sans-serif';
    ctx.fillText('TUTORIAL', cardX + 82, cardY + h / 2 - 3);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.fillText('NEW HERE? LEARN THE CONTROLS', cardX + 82, cardY + h / 2 + 15);

    // "START HERE" badge, top-right corner.
    ctx.fillStyle = MENU_GOLD;
    ctx.beginPath();
    ctx.roundRect(cardX + cardW - 96, cardY - 10, 92, 20, 10);
    ctx.fill();
    ctx.fillStyle = MENU_INK;
    ctx.textAlign = 'center';
    ctx.font = '800 10px Outfit, sans-serif';
    ctx.fillText('★ START HERE', cardX + cardW - 50, cardY + 4);

    return cardY + h + 10;
}

function drawKickoffFooter() {
    ctx.save();
    ctx.textAlign = 'left';
    drawIcon(ctx, SoundManager.musicEnabled ? 'volumeOn' : 'mute', 60, 566, 16, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '700 10px Outfit, sans-serif';
    ctx.fillText(`MUSIC ${SoundManager.musicEnabled ? 'ON' : 'OFF'}   SFX ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`, 78, 570);
    ctx.fillStyle = MENU_GOLD;
    ctx.font = '700 12px Outfit, sans-serif';
    if (uiButtonHovered(770, 577, 80, 20)) {
        ctx.shadowColor = MENU_GOLD;
        ctx.shadowBlur = 12;
    }
    ctx.fillText('ℹ CREDITS', 840, 592);
    ctx.shadowBlur = 0;
    window._creditsBtn = { x: 770, y: 577, w: 80, h: 20 };
    ctx.restore();
}

function drawTunnelMenu(hoverIndex) {
    const time = Date.now() * 0.001;
    drawKickoffBackdrop(time);
    drawKickoffHeroBall(time);
    drawKickoffTitle(time);
    drawKickoffCard(hoverIndex);
    if (typeof Shop !== 'undefined') Shop.drawMenuButton(!!window._shopHover);
    drawKickoffFooter();
}