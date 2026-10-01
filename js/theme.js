// ===== PRO STRIKER - theme.js =====
console.log('[ProStriker] theme.js loaded');

const THEME = {
    accent: '#1fd15c',
    gold: '#ffc636',
    ink: '#0b1220',
    ink2: '#121b2e',
    red: '#ff6b6b',
    blue: '#2fd1ff',
    purple: '#9b7bff',
    white: '#ffffff'
};

// Fits `text` into `maxW` pixels using the CURRENT ctx.font: returns the
// text untouched when it already fits, otherwise trims it and adds an
// ellipsis. Replaces fixed "first N characters" cut-offs that chopped names
// like "Netherlands" / "Switzerland" even when there was plenty of room.
function fitText(text, maxW) {
    text = String(text);
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + '\u2026').width > maxW) t = t.slice(0, -1);
    return t + '\u2026';
}

function themeBackdrop() {
    drawKickoffBackdrop(Date.now() * 0.001);
}

function themeCard(x, y, w, h, r = 18, accentColor = THEME.gold) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = THEME.ink2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 6, { tl: r, tr: r, bl: 0, br: 0 });
    ctx.fill();
    ctx.restore();
}

function themeTitle(iconName, text, cx, y, color = THEME.white, size = 32) {
    ctx.save();
    ctx.font = `900 ${size}px Outfit, sans-serif`;
    const textW = ctx.measureText(text).width;
    const iconSize = size * 0.8;
    const gap = size * 0.35;
    const hasIcon = !!iconName;
    const totalW = hasIcon ? (iconSize + gap + textW) : textW;
    const startX = cx - totalW / 2;

    if (hasIcon) {
        drawIcon(ctx, iconName, startX + iconSize / 2, y - size * 0.32, iconSize, color, { glow: true, glowColor: color, glowBlur: 8 });
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(text, hasIcon ? startX + iconSize + gap : startX, y);
    ctx.shadowBlur = 0;
    ctx.restore();
}

function themePill(x, y, w, h, label, color, opts = {}) {
    const { active = true, fontSize = 18, icon = null, disabled = false } = opts;
    const hovered = active && !disabled && typeof uiButtonHovered === 'function' &&
        uiButtonHovered(x, y, w, h);
    ctx.save();
    ctx.shadowColor = hovered ? color : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = hovered ? 18 : (active ? 5 : 0);
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = active ? color : THEME.ink2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(14, h / 2.2));
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = hovered ? '#ffffff' : 'rgba(0,0,0,0.35)';
    ctx.lineWidth = hovered ? 2.5 : 1.5;
    ctx.stroke();
    if (!active) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    ctx.textAlign = 'center';
    const textColor = active ? THEME.ink : 'rgba(255,255,255,0.4)';
    let labelX = x + w / 2;
    if (icon) {
        const iconX = x + 28;
        drawIcon(ctx, icon, iconX, y + h / 2, fontSize * 1.1, textColor);
        labelX = x + w / 2 + 12;
    }
    ctx.fillStyle = textColor;
    ctx.font = `800 ${fontSize}px Outfit, sans-serif`;
    ctx.fillText(label, labelX, y + h / 2 + fontSize * 0.32);
    ctx.restore();
}

function themeBackButton(x, y, w = 190, h = 44) {
    themePill(x, y, w, h, 'BACK', THEME.purple, { fontSize: 16, icon: 'arrowLeft' });
    return { x, y, w, h };
}

// ============================================================
// DIFFICULTY SELECT
// ============================================================
function drawDifficultySelect() {
    themeBackdrop();
    ctx.save();
    if (isMobileDevice && typeof window._mobileDifficultySelection === 'undefined') {
        window._mobileDifficultySelection = null;
    }

    themeCard(90, 40, 720, 480, 24, THEME.blue);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '700 11px "Arial Narrow", sans-serif';
    ctx.fillText('VS COMPUTER', 450, 78);
    themeTitle('target', 'SELECT DIFFICULTY', 450, 116, THEME.blue, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Choose your challenge level', 450, 138);

    const levels = [
        { key: 'EASY', label: 'EASY', icon: 'shield', sub: 'Beginner', color: THEME.accent, power: 1 },
        { key: 'MEDIUM', label: 'MEDIUM', icon: 'flag', sub: 'Casual', color: THEME.gold, power: 2 },
        { key: 'HARD', label: 'HARD', icon: 'hard', sub: 'Balanced', color: THEME.red, power: 3 },
        { key: 'ELITE', label: 'ELITE', icon: 'elite', sub: 'Expert', color: THEME.purple, power: 4 },
        { key: 'WORLD_CLASS', label: 'WORLD CLASS', icon: 'worldClass', sub: 'Ultimate', color: THEME.blue, power: 5 }
    ];

    const cardW = 168, cardH = 130, gapX = 18, gapY = 14;
    const row1Y = 158;
    const row2Y = row1Y + cardH + gapY;
    const row1StartX = 450 - (3 * cardW + 2 * gapX) / 2;
    const row2StartX = 450 - (2 * cardW + gapX) / 2;
    const positions = [
        { x: row1StartX, y: row1Y }, { x: row1StartX + cardW + gapX, y: row1Y }, { x: row1StartX + 2 * (cardW + gapX), y: row1Y },
        { x: row2StartX, y: row2Y }, { x: row2StartX + cardW + gapX, y: row2Y }
    ];

    window._difficultyBtns = [];
    levels.forEach((lvl, idx) => {
        const { x, y } = positions[idx];
        const isHovered = uiButtonHovered(x, y, cardW, cardH);
        const isTouchSelected = isMobileDevice && !isHovered && window._mobileDifficultySelection === lvl.key;
        const isHighlighted = isHovered || isTouchSelected;

        ctx.save();
        ctx.shadowColor = isHighlighted ? lvl.color : 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = isHighlighted ? (isHovered ? 22 : 16) : 4;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = isHighlighted ? lvl.color : '#e8ecf2';
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 16);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = isHighlighted ? '#ffffff' : lvl.color;
        ctx.lineWidth = isHighlighted ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 16);
        ctx.stroke();
        ctx.restore();

        const cx = x + cardW / 2;

        drawIcon(ctx, lvl.icon, cx, y + 38, 32, isHighlighted ? THEME.ink : lvl.color);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#1a2233';
        ctx.font = `800 ${lvl.label.length > 7 ? 15 : 18}px Outfit, sans-serif`;
        ctx.fillText(lvl.label, cx, y + 68);

        ctx.fillStyle = 'rgba(26,34,51,0.55)';
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.fillText(lvl.sub, cx, y + 84);

        const dotR = 4, dotGap = 12, dotsW = dotGap * 4;
        const dotsStartX = cx - dotsW / 2;
        for (let d = 0; d < 5; d++) {
            ctx.beginPath();
            ctx.arc(dotsStartX + d * dotGap, y + 108, dotR, 0, Math.PI * 2);
            ctx.fillStyle = isHighlighted
                ? (d < lvl.power ? THEME.ink : 'rgba(11,18,32,0.25)')
                : (d < lvl.power ? lvl.color : 'rgba(26,34,51,0.2)');
            ctx.fill();
        }

        window._difficultyBtns.push({ x, y, w: cardW, h: cardH, key: lvl.key });
    });

    const backY = row2Y + cardH + 22;
    if (isMobileDevice) {
        window._diffBackBtn = themeBackButton(235, backY, 190, 42);
        const hasTouchSelection = window._mobileDifficultySelection !== null;
        themePill(475, backY, 190, 42, 'START MATCH',
            hasTouchSelection ? THEME.accent : '#3a4256', {
            fontSize: 15,
            icon: 'play',
            active: hasTouchSelection
        });
        window._mobileDifficultyStartBtn = { x: 475, y: backY, w: 190, h: 42 };
    } else {
        window._diffBackBtn = themeBackButton(350, backY, 200, 42);
        window._mobileDifficultyStartBtn = null;
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText(isMobileDevice ? 'Tap a level, then START MATCH' : 'Press E M H I W or click a card', 450, backY + 54);
    ctx.restore();
}

// ============================================================
// INSTRUCTIONS
// ============================================================
function drawInstructionsScreen() {
    themeBackdrop();
    ctx.save();
    themeCard(90, 50, 720, 470, 24, THEME.gold);
    ctx.textAlign = 'center';
    themeTitle('book', 'HOW TO PLAY', 450, 108, THEME.gold, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Everything you need to get on the pitch', 450, 130);

    const cards = [
        { title: 'CONTROLS', icon: 'shirt', color: THEME.blue,
          lines: isMobileDevice ?
          ['RED: Left Joystick', '+ Shoot button', 'BLUE: Right Joystick', '+ Shoot button'] :
          ['RED: WASD', 'SPACE to Shoot', 'BLUE: Arrow Keys', 'ENTER to Shoot'] },
        { title: 'RULES', icon: 'halfDuration', color: THEME.gold,
          lines: [`Two ${halfDuration}s halves`, 'Most goals wins!', 'GK holds ball', 'for 6s max'] },
        { title: 'TIPS', icon: 'target', color: THEME.accent,
          lines: ['Pass to open', 'teammates', 'Shoot from', 'close range', 'Eject GK on block'] }
    ];

    const cardW = 205, cardH = 260, gap = 20;
    const rowY = 160;
    const totalRowW = cards.length * cardW + (cards.length - 1) * gap;
    const rowStartX = 450 - totalRowW / 2;

    cards.forEach((card, idx) => {
        const x = rowStartX + idx * (cardW + gap);
        themeCard(x, rowY, cardW, cardH, 16, card.color);
        const cx = x + cardW / 2;

        drawIcon(ctx, card.icon, cx - 42, rowY + 34, 22, card.color);
        ctx.textAlign = 'left';
        ctx.fillStyle = card.color;
        ctx.font = '800 17px Outfit, sans-serif';
        ctx.fillText(card.title, cx - 24, rowY + 41);

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 24, rowY + 58);
        ctx.lineTo(x + cardW - 24, rowY + 58);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '600 14px Outfit, sans-serif';
        const lineGap = 26;
        const linesBlockH = card.lines.length * lineGap;
        const linesStartY = rowY + 58 + (cardH - 58 - linesBlockH) / 2 + lineGap * 0.6;
        card.lines.forEach((line, i) => ctx.fillText(line, cx, linesStartY + i * lineGap));
    });

    window._backBtn = themeBackButton(350, 545, 200, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC or tap BACK to return', 450, 508);
    ctx.restore();
}

// ============================================================
// SETTINGS
// ============================================================
function drawSettingsScreen() {
    themeBackdrop();
    ctx.save();
    ctx.textAlign = 'center';
    themeTitle('gear', 'SETTINGS', 450, 74, THEME.purple, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Match length and audio', 450, 96);

    const cardX = 200, cardY = 120, cardW = 500, cardH = 300;
    themeCard(cardX, cardY, cardW, cardH, 20, THEME.gold);

    drawIcon(ctx, 'halfDuration', 450 - 92, 168, 18, THEME.gold);
    ctx.fillStyle = THEME.gold;
    ctx.font = '700 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HALF DURATION', 450 - 72, 174);
    ctx.textAlign = 'center';
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
    ctx.roundRect(sliderX, sliderY - sliderH / 2, sliderW, sliderH, 4);
    ctx.fill();
    ctx.fillStyle = THEME.gold;
    ctx.beginPath();
    ctx.roundRect(sliderX, sliderY - sliderH / 2, knobX - sliderX, sliderH, 4);
    ctx.fill();

    ctx.shadowColor = THEME.gold;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(knobX, sliderY, knobRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = THEME.gold;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${minVal}s`, sliderX - 10, sliderY + 30);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxVal}s`, sliderX + sliderW + 10, sliderY + 30);
    window._sliderRect = { x: sliderX, y: sliderY - 20, w: sliderW, h: 40 };

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText(`Each extra-time period also lasts ${halfDuration}s`, 450, 320);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText('SOUND CONTROLS', 450, 340);

    // Two 190px toggles, 20px apart, centred on x=450 and fully inside the card.
    const toggleY = 356;
    themePill(255, toggleY, 190, 45, `MUSIC ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`, SoundManager.musicEnabled ? THEME.accent : THEME.red, { fontSize: 16, icon: SoundManager.musicEnabled ? 'volumeOn' : 'mute' });
    window._musicBtn = { x: 255, y: toggleY, w: 190, h: 45 };
    themePill(465, toggleY, 190, 45, `SFX ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`, SoundManager.sfxEnabled ? THEME.accent : THEME.red, { fontSize: 16, icon: SoundManager.sfxEnabled ? 'volumeOn' : 'mute' });
    window._sfxBtn = { x: 465, y: toggleY, w: 190, h: 45 };

    window._backBtn = themeBackButton(350, 445, 200, 45);

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Drag the knob or use arrow keys', 450, 520);
    ctx.fillText('Press ESC or tap BACK to return', 450, 580);
    ctx.restore();
}

// ============================================================
// STATS
// ============================================================
function drawStatsScreen() {
    themeBackdrop();
    ctx.save();
    ctx.textAlign = 'center';
    themeTitle('chart', 'STATISTICS', 450, 72, THEME.blue, 30);

    const difficulties = ['EASY', 'MEDIUM', 'HARD', 'ELITE', 'WORLD_CLASS'];
    const displayLabels = { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD', ELITE: 'ELITE', WORLD_CLASS: 'WORLD CLASS' };
    const colors = [THEME.accent, THEME.gold, THEME.red, THEME.purple, THEME.blue];
    const cardWidth = 164, cardGap = 8, cardHeight = 380;
    const totalWidth = difficulties.length * cardWidth + (difficulties.length - 1) * cardGap;
    const marginX = (900 - totalWidth) / 2;
    const y = 102;

    difficulties.forEach((diff, idx) => {
        const stats = overallStats[diff];
        const x = marginX + idx * (cardWidth + cardGap);
        const centerX = x + cardWidth / 2;

        themeCard(x, y, cardWidth, cardHeight, 14, colors[idx]);

        ctx.textAlign = 'center';
        ctx.fillStyle = colors[idx];
        ctx.font = '800 15px Outfit, sans-serif';
        ctx.fillText(displayLabels[diff], centerX, y + 30);

        ctx.beginPath();
        ctx.moveTo(x + 20, y + 42);
        ctx.lineTo(x + cardWidth - 20, y + 42);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
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
            ctx.fillStyle = 'rgba(255,255,255,0.78)';
            ctx.font = '500 11px Outfit, sans-serif';
            ctx.fillText(line, centerX, y + 64 + i * 22);
        });
    });

    window._backBtn = themeBackButton(350, 500, 200, 45);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Press ESC or tap BACK to return', 450, 565);
    ctx.restore();
}

// ============================================================
// TOURNAMENT MENU
// ============================================================
function drawTournamentMenu() {
    themeBackdrop();
    ctx.save();
    themeCard(150, 60, 600, 460, 24, THEME.gold);

    ctx.textAlign = 'center';
    themeTitle('trophy', 'TOURNAMENT', 450, 138, THEME.gold, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText('Select Tournament Format', 450, 172);

    const formatY = 210, formatH = 70;
    window._tournamentFormatBtns = [];
    themePill(450 - 160, formatY, 320, formatH, '', THEME.gold, { fontSize: 1 });
    ctx.textAlign = 'center';
    ctx.fillStyle = THEME.ink;
    ctx.font = '800 22px Outfit, sans-serif';
    ctx.fillText('32 TEAMS', 450, formatY + 32);
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(11,18,32,0.65)';
    ctx.fillText('Full World Cup Style', 450, formatY + 52);
    window._tournamentFormatBtns[0] = { x: 450 - 160, y: formatY, w: 320, h: formatH, size: 32 };

    const canContinue = (typeof TournamentManager !== 'undefined') && TournamentManager.hasResumableSave();

    const startY = formatY + formatH + 30;
    themePill(300, startY, 300, 55, 'NEW TOURNAMENT', THEME.accent, { fontSize: 20, icon: 'play' });
    window._tournamentStartBtn = { x: 300, y: startY, w: 300, h: 55 };

    const continueY = startY + 55 + 12;
    if (canContinue) {
        themePill(300, continueY, 300, 55, 'CONTINUE', THEME.blue, { fontSize: 19, icon: 'play' });
        window._tournamentContinueBtn = { x: 300, y: continueY, w: 300, h: 55 };
    } else {
        ctx.save();
        ctx.globalAlpha = 0.35;
        themePill(300, continueY, 300, 55, 'CONTINUE', '#666666', { fontSize: 19, active: false, icon: 'play' });
        ctx.restore();
        window._tournamentContinueBtn = null;
    }

    const backY = continueY + 55 + 25;
    window._tournamentBackBtn = themeBackButton(350, backY, 200, 40);
    ctx.restore();
}

// ============================================================
// TEAM SELECT
// ============================================================
function drawPadlock(cx, cy, s, color) {
    ctx.save();
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = s * 0.16;
    ctx.beginPath(); ctx.roundRect(cx - s * 0.45, cy - s * 0.1, s * 0.9, s * 0.6, s * 0.12); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.1, s * 0.28, Math.PI, 0); ctx.stroke();
    ctx.restore();
}

function drawTeamSelection() {
    themeBackdrop();
    ctx.save();
    themeCard(60, 30, 780, 560, 24, THEME.blue);

    ctx.textAlign = 'center';
    themeTitle('shield', 'SELECT YOUR TEAM', 450, 68, THEME.blue, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Choose the team you want to control in the tournament', 450, 90);

    let displayTeams = [...TOURNAMENT_TEAMS];
    if (tournamentFormat === 16) displayTeams = displayTeams.slice(0, 16);
    else if (tournamentFormat === 8) displayTeams = displayTeams.filter(t => t.tier === 'WORLD_CLASS').slice(0, 8);

    const hasAd = typeof AdManager !== 'undefined';
    const cols = 5, cardW = 110, cardH = 60, gapX = 8, gapY = 6;
    const startX = 450 - (cols * (cardW + gapX) - gapX) / 2;
    const startY = 108;

    const totalRows = Math.ceil(displayTeams.length / cols);
    const totalContentHeight = totalRows * (cardH + gapY) + 80;

    if (typeof window._teamScrollOffset === 'undefined') window._teamScrollOffset = 0;
    const maxScroll = Math.max(0, totalContentHeight - 420);
    if (window._teamScrollOffset > maxScroll) window._teamScrollOffset = maxScroll;
    if (window._teamScrollOffset < 0) window._teamScrollOffset = 0;
    const scrollY = window._teamScrollOffset || 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 96, 900, 414);
    ctx.clip();

    window._teamSelectBtns = [];
    displayTeams.forEach((team, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY) - scrollY;
        if (y + cardH < 96 || y > 510) return;
        const isSelected = tournamentSelectedTeam === team.id;
        const locked = hasAd && AdManager.isTeamLocked(team.id);
        const isHovered = uiButtonHovered(x, y, cardW, cardH);

        ctx.save();
        if (isSelected || isHovered) {
            ctx.shadowColor = isSelected ? THEME.gold : THEME.blue;
            ctx.shadowBlur = isHovered ? 18 : 14;
        }
        ctx.fillStyle = isSelected ? THEME.gold : (isHovered ? '#182844' : THEME.ink);
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isSelected ? THEME.gold : (isHovered ? THEME.blue : 'rgba(255,255,255,0.14)');
        ctx.lineWidth = isHovered || isSelected ? 2 : 1.2;
        ctx.stroke();
        ctx.restore();

        drawTeamFlag(team, x + cardW / 2, y + (locked ? 22 : 30), locked ? 18 : 22, 'center');
        ctx.fillStyle = isSelected ? THEME.ink : '#ffffff';
        ctx.font = isSelected ? '700 10px Outfit, sans-serif' : '600 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fitText(team.name, cardW - 8), x + cardW / 2, y + (locked ? 37 : 50));

        if (locked) {
            const rbFill = isSelected ? THEME.ink : THEME.gold;
            const rbText = isSelected ? THEME.gold : THEME.ink;
            ctx.fillStyle = rbFill;
            ctx.beginPath();
            ctx.roundRect(x + 8, y + cardH - 18, cardW - 16, 14, 7);
            ctx.fill();
            drawPadlock(x + 21, y + cardH - 12, 8, rbText);
            ctx.fillStyle = rbText;
            ctx.font = '800 8px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('WATCH AD', x + cardW / 2 + 7, y + cardH - 8);
        }

        window._teamSelectBtns.push({ x: x, y: y + scrollY, w: cardW, h: cardH, teamId: team.id });
    });
    ctx.restore();

    if (totalContentHeight > 420) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(875, 140, 10, 300, 5);
        ctx.fill();
        const thumbHeight = Math.max(30, 300 * (420 / totalContentHeight));
        const thumbY = 140 + (300 - thumbHeight) * (scrollY / maxScroll);
        ctx.fillStyle = THEME.blue;
        ctx.beginPath();
        ctx.roundRect(875, thumbY, 10, thumbHeight, 5);
        ctx.fill();
    }

    const confirmActive = tournamentSelectedTeam !== null;
    const needsAd = confirmActive && hasAd && AdManager.isTeamLocked(tournamentSelectedTeam);
    themePill(280, 520, 340, 45,
        needsAd ? 'WATCH AD TO UNLOCK' : 'CONFIRM TEAM',
        confirmActive ? (needsAd ? THEME.gold : THEME.accent) : '#3a4256',
        { fontSize: needsAd ? 16 : 18, active: confirmActive, icon: needsAd ? 'play' : 'checkmark' });
    window._tournamentConfirmBtn = { x: 280, y: 520, w: 340, h: 45 };

    window._tournamentSelectBackBtn = themeBackButton(370, 573, 160, 28);
    ctx.restore();
}

// ============================================================
// GROUP STAGE
// ============================================================
function drawGroupStage() {
    themeBackdrop();
    ctx.save();
    ctx.textAlign = 'center';
    const progress = TournamentManager.getProgress();
    themeTitle('chart', 'GROUP STAGE', 450, 42, THEME.blue, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 13px Outfit, sans-serif';
    const day = TournamentManager.currentMatchDay || 0;
    ctx.fillText(`Match Day ${day + 1} / 3  ·  Progress: ${progress}%`, 450, 66);

    const groups = TournamentManager.getAllGroupStandings();
    const cols = 4, cardW = 180, cardH = 200, gapX = 15, gapY = 15;
    const startX = 450 - (cols * (cardW + gapX) - gapX) / 2;
    const startY = 90;

    const totalRows = Math.ceil(groups.length / cols);
    const totalContentHeight = totalRows * (cardH + gapY) + 50;

    if (typeof window._groupScrollOffset === 'undefined') window._groupScrollOffset = 0;
    const maxScroll = Math.max(0, totalContentHeight - 420);
    if (window._groupScrollOffset > maxScroll) window._groupScrollOffset = maxScroll;
    if (window._groupScrollOffset < 0) window._groupScrollOffset = 0;
    const scrollY = window._groupScrollOffset || 0;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 78, 900, 420);
    ctx.clip();

    groups.forEach((group, idx) => {
        const col = idx % cols, row = Math.floor(idx / cols);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY) - scrollY;
        if (y + cardH < 78 || y > 500) return;

        themeCard(x, y, cardW, cardH, 12, THEME.gold);

        ctx.fillStyle = THEME.gold;
        ctx.font = '700 15px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Group ${group.name}`, x + cardW / 2, y + 26);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '600 9px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Team', x + 6, y + 42);
        ctx.textAlign = 'center';
        ctx.fillText('MP', x + cardW - 40, y + 42);
        ctx.fillText('Pts', x + cardW - 12, y + 42);

        const standings = group.standings || [];
        standings.slice(0, 4).forEach((entry, sIdx) => {
            const team = entry.team;
            const yPos = y + 46 + sIdx * 28;
            const isPlayerTeam = team && team.id === tournamentSelectedTeam;
            ctx.textAlign = 'left';
            ctx.fillStyle = isPlayerTeam ? THEME.gold : 'rgba(255,255,255,0.85)';
            ctx.font = isPlayerTeam ? '700 10px Outfit, sans-serif' : '500 10px Outfit, sans-serif';
            const flagW = drawTeamFlag(team || { flag: '' }, x + 6, yPos + 8, 10, 'left');
            const name = team ? fitText(team.name, cardW - 52 - flagW) : '???';
            ctx.fillText(name, x + 6 + flagW, yPos + 8);
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '500 10px Outfit, sans-serif';
            ctx.fillText(entry.played, x + cardW - 40, yPos + 8);
            ctx.fillStyle = isPlayerTeam ? THEME.gold : 'rgba(255,255,255,0.85)';
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
        ctx.fillStyle = THEME.blue;
        ctx.beginPath();
        ctx.roundRect(875, thumbY, 10, thumbHeight, 5);
        ctx.fill();
    }

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
            themePill(250, 520, 400, 50, 'NEXT ROUND — KNOCKOUT STAGE', THEME.accent, { fontSize: 17, icon: 'play' });
            window._tournamentNextRoundBtn = { x: 250, y: 520, w: 400, h: 50 };
        } else if (isPlayerOut || isComplete) {
            themeCard(250, 520, 400, 50, 14, THEME.red);
            if (uiButtonHovered(250, 520, 400, 50)) {
                ctx.save();
                ctx.shadowColor = THEME.red;
                ctx.shadowBlur = 18;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(250, 520, 400, 50, 14);
                ctx.stroke();
                ctx.restore();
            }
            ctx.fillStyle = THEME.red;
            ctx.font = '700 16px Outfit, sans-serif';
            ctx.textAlign = 'center';
            if (champion) {
                fillTextWithFlags(['OUT — ', champion, ` ${champion.name} WON!`], 450, 550, ctx.font, ctx.fillStyle);
            } else {
                ctx.fillText('YOU ARE OUT OF THE WORLD CUP', 450, 550);
            }
            window._tournamentOutBtn = { x: 250, y: 520, w: 400, h: 50 };
        }
    } else if (nextMatch) {
        const btnX = 100, btnW = 700, btnY = 520, btnH = 50;
        const matchInfo = nextMatch.type === 'group' ? 'GROUP MATCH' : 'KNOCKOUT';
        const teamAName = nextMatch.teamA ? nextMatch.teamA.name : 'TBD';
        const teamBName = nextMatch.teamB ? nextMatch.teamB.name : 'TBD';
        const label = `PLAY ${matchInfo}: ${teamAName} vs ${teamBName}`;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;
        const hovered = uiButtonHovered(btnX, btnY, btnW, btnH);
        ctx.shadowColor = hovered ? '#ffffff' : 'transparent';
        ctx.shadowBlur = hovered ? 18 : 0;
        ctx.fillStyle = hovered ? '#55e889' : THEME.accent;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 14);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = hovered ? '#ffffff' : 'rgba(0,0,0,0.35)';
        ctx.lineWidth = hovered ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = THEME.ink;
        ctx.textAlign = 'center';
        let fontSize = 18;
        ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
        const maxTextWidth = btnW - 90;
        while (ctx.measureText(label).width > maxTextWidth && fontSize > 13) {
            fontSize--;
            ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
        }
        drawIcon(ctx, 'play', btnX + 40, btnY + btnH / 2, 22, THEME.ink);
        ctx.fillText(label, btnX + btnW / 2 + 15, btnY + btnH / 2 + fontSize * 0.32);
        ctx.restore();
        window._tournamentPlayMatchBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    } else if (!groupStageComplete) {
        themeCard(250, 520, 400, 50, 14, 'rgba(255,255,255,0.1)');
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '600 15px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Processing match day...', 450, 550);
    }

    themePill(720, 15, 165, 30, 'EXIT', THEME.purple, { fontSize: 13, icon: 'cross' });
    window._tournamentGroupBackBtn = { x: 720, y: 15, w: 165, h: 30 };

    drawExitTournamentConfirmOverlay();
    ctx.restore();
}

function drawExitTournamentConfirmOverlay() {
    if (!window._confirmExitTournament) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    themeCard(250, 210, 400, 200, 22, THEME.red);
    ctx.textAlign = 'center';
    themeTitle('cross', 'EXIT TOURNAMENT?', 450, 268, THEME.red, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Your progress is saved — you can continue later.', 450, 300);

    themePill(275, 330, 150, 45, 'STAY', THEME.accent, { fontSize: 17, icon: 'checkmark' });
    window._confirmExitNoBtn = { x: 275, y: 330, w: 150, h: 45 };
    themePill(475, 330, 150, 45, 'EXIT', THEME.red, { fontSize: 17, icon: 'cross' });
    window._confirmExitYesBtn = { x: 475, y: 330, w: 150, h: 45 };

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillText('ESC to stay · ENTER to exit', 450, 392);
    ctx.restore();
}

// ============================================================
// TOURNAMENT RESULT
// ============================================================
function drawTournamentResult(matchResult) {
    themeBackdrop();
    ctx.save();
    themeCard(150, 55, 600, 480, 26, THEME.gold);
    ctx.textAlign = 'center';

    window._tournamentChampionBtn = null;
    window._tournamentNextMatchBtn = null;
    window._tournamentBracketViewBtn = null;
    window._tournamentExitBtn = null;

    const playerTeamId = TournamentManager.selectedTeamId;
    const isPlayerEliminated = TournamentManager.isPlayerEliminated();
    const isComplete = TournamentManager.isComplete();
    const champion = TournamentManager.champion;
    const penalties = matchResult && matchResult.tournamentState && matchResult.tournamentState.finalTieBreak
        ? matchResult.tournamentState
        : null;

    let isWin = false, isDraw = false, isEliminated = false;
    let playerScore = -1, opponentScore = -1, matchFound = false;

    if (matchResult) {
        const teamA = matchResult.teamA, teamB = matchResult.teamB;
        const isPlayerTeamA = teamA && teamA.id === playerTeamId;
        const isPlayerTeamB = teamB && teamB.id === playerTeamId;
        if (isPlayerTeamA) { playerScore = matchResult.scoreA; opponentScore = matchResult.scoreB; matchFound = true; }
        else if (isPlayerTeamB) { playerScore = matchResult.scoreB; opponentScore = matchResult.scoreA; matchFound = true; }
    }
    if (matchFound) {
        if (penalties) {
            const playerIsTeamA = matchResult.teamA && matchResult.teamA.id === playerTeamId;
            const playerPenaltyScore = playerIsTeamA ? penalties.penaltyScoreA : penalties.penaltyScoreB;
            const opponentPenaltyScore = playerIsTeamA ? penalties.penaltyScoreB : penalties.penaltyScoreA;
            isWin = playerPenaltyScore > opponentPenaltyScore;
        } else if (playerScore > opponentScore) isWin = true;
        else if (playerScore === opponentScore) isDraw = true;
    }
    if (isPlayerEliminated) isEliminated = true;

    let titleText = '', titleColor = '', titleIcon = '';
    if (isWin) { titleText = 'VICTORY!'; titleColor = THEME.accent; titleIcon = 'trophy'; }
    else if (isDraw) { titleText = 'DRAW'; titleColor = THEME.gold; titleIcon = 'handshake'; }
    else { titleText = 'DEFEAT'; titleColor = THEME.red; titleIcon = 'shield'; }

    themeTitle(titleIcon, titleText, 450, 108, titleColor, 42);

    if (matchResult) {
        const teamA = matchResult.teamA || { name: 'Unknown', flag: '' };
        const teamB = matchResult.teamB || { name: 'Unknown', flag: '' };
        fillTextWithFlags([teamA, ` ${matchResult.scoreA} - ${matchResult.scoreB} `, teamB], 450, 200, '900 52px Outfit, sans-serif', '#ffffff');
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '600 20px Outfit, sans-serif';
        ctx.fillText(`${teamA.name} vs ${teamB.name}`, 450, 250);

        if (penalties) {
            ctx.fillStyle = THEME.gold;
            ctx.font = '700 18px Outfit, sans-serif';
            ctx.fillText(`Penalty shootout: ${penalties.penaltyScoreA} - ${penalties.penaltyScoreB}`, 450, isEliminated ? 288 : 300);
            if (isEliminated) {
                ctx.fillStyle = THEME.red;
                ctx.font = '600 16px Outfit, sans-serif';
                ctx.fillText('You have been eliminated from the tournament', 450, 320);
            }
        } else if (isEliminated) {
            ctx.fillStyle = THEME.red;
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText('You have been eliminated from the tournament', 450, 300);
        } else if (isWin) {
            ctx.fillStyle = THEME.accent;
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText(`Goals: ${playerScore} - ${opponentScore}`, 450, 300);
        } else if (isDraw) {
            ctx.fillStyle = THEME.gold;
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText('Match ended in a draw', 450, 300);
        } else {
            ctx.fillStyle = THEME.red;
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText('Better luck next time!', 450, 300);
        }
    }

    if (isComplete && champion) {
        ctx.fillStyle = THEME.gold;
        ctx.font = '700 24px Outfit, sans-serif';
        fillTextWithFlags(['Champion: ', champion, ` ${champion.name}`], 450, penalties && isEliminated ? 368 : 350, ctx.font, ctx.fillStyle);
    }

    const nextMatch = TournamentManager.getPlayerNextMatch();
    if (isComplete) {
        const buttonY = penalties && isEliminated ? 420 : 400;
        themePill(165, buttonY, 270, 55, 'VIEW CHAMPION', THEME.gold, { fontSize: 18, icon: 'worldCup' });
        window._tournamentChampionBtn = { x: 165, y: buttonY, w: 270, h: 55 };
        themePill(465, buttonY, 270, 55, 'EXIT TO MENU', THEME.purple, { fontSize: 18, icon: 'home' });
        window._tournamentExitBtn = { x: 465, y: buttonY, w: 270, h: 55 };
    } else if (nextMatch) {
        themePill(300, 400, 300, 55, 'NEXT MATCH', THEME.accent, { fontSize: 20, icon: 'play' });
        window._tournamentNextMatchBtn = { x: 300, y: 400, w: 300, h: 55 };
    } else {
        themePill(300, 400, 300, 55, 'VIEW BRACKET', THEME.purple, { fontSize: 20, icon: 'chart' });
        window._tournamentBracketViewBtn = { x: 300, y: 400, w: 300, h: 55 };
    }
    ctx.restore();
}

function drawTournamentShootout() {
    const shootout = tournamentShootout;
    const match = tournamentPendingMatch;
    if (!shootout || (!match && !shootout.isLocal)) return;

    const playerIsTeamA = match ? tournamentSelectedTeam === match.teamA.id : true;
    const playerTeam = shootout.isLocal
        ? { name: 'PLAYER 1', color: '#ff5252' }
        : playerIsTeamA ? match.teamA : match.teamB;
    const opponentTeam = shootout.isLocal
        ? { name: 'PLAYER 2', color: '#2fd1ff' }
        : playerIsTeamA ? match.teamB : match.teamA;
    const playerColor = playerTeam.color;
    const opponentColor = shootout.isLocal ? opponentTeam.color : resolveAwayColor(playerTeam.color, opponentTeam.color);
    const totalKicksLabel = shootout.suddenDeath ? `SUDDEN DEATH · ROUND ${shootout.round - 5}` : `ROUND ${shootout.round} OF 5`;
    const isPlayerKick = shootout.phase === 'shoot' || shootout.phase === 'playerFlight' || shootout.phase === 'playerResult';
    const activeGoalX = isPlayerKick ? 875 : 25;
    const activeGoalY = shootout.phase === 'shoot' || shootout.phase === 'localShoot' || shootout.phase === 'keeper'
        ? getPenaltyTimingTargetY(shootout.timingGreenCenter)
        : Number.isFinite(shootout.shotTargetY) ? shootout.shotTargetY : 300;
    const resultPhase = shootout.phase === 'playerResult' || shootout.phase === 'opponentResult' || shootout.phase === 'complete';
    const currentShooter = isPlayerKick ? shootout.playerShooter : shootout.opponentShooter;
    const currentKeeper = isPlayerKick ? shootout.opponentGoalkeeper : shootout.playerGoalkeeper;

    // Cinematic base: keep the normal Pro Striker pitch, then narrow the visual
    // focus to the active penalty end so the shootout reads like a premium
    // broadcast sequence rather than another ordinary gameplay frame.
    drawPitch();
    ctx.save();
    const focus = ctx.createRadialGradient(activeGoalX, 300, 70, activeGoalX, 300, 620);
    focus.addColorStop(0, 'rgba(6,10,18,0.04)');
    focus.addColorStop(0.55, 'rgba(6,10,18,0.28)');
    focus.addColorStop(1, 'rgba(6,10,18,0.72)');
    ctx.fillStyle = focus;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.restore();

    // Premium top scoreboard.
    drawGlassPanel(105, 14, 690, 100, 20, 'rgba(7,12,22,0.94)');
    ctx.save();
    ctx.textBaseline = 'middle';

    ctx.textAlign = 'right';
    ctx.font = '800 15px Outfit, sans-serif';
    ctx.fillStyle = playerColor;
    const playerName = fitText(playerTeam.name.toUpperCase(), 155);
    ctx.fillText(playerName, 315, 36);
    if (!shootout.isLocal) drawTeamFlag(playerTeam, 337, 41, 17, 'center');
    ctx.font = '900 39px Outfit, sans-serif';
    ctx.fillText(shootout.playerGoals, 405, 49);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    ctx.font = '700 12px Outfit, sans-serif';
    ctx.fillText('PENALTY SHOOTOUT', 450, 28);
    ctx.font = '800 11px Outfit, sans-serif';
    ctx.fillStyle = shootout.suddenDeath ? THEME.red : THEME.gold;
    ctx.fillText(totalKicksLabel, 450, 80);

    ctx.textAlign = 'left';
    ctx.font = '800 15px Outfit, sans-serif';
    ctx.fillStyle = opponentColor;
    if (!shootout.isLocal) drawTeamFlag(opponentTeam, 523, 41, 17, 'center');
    ctx.fillText(fitText(opponentTeam.name.toUpperCase(), 155), 545, 36);
    ctx.font = '900 39px Outfit, sans-serif';
    ctx.fillText(shootout.opponentGoals, 495, 49);
    ctx.restore();

    // Five-kick tracker on each side. Sudden death extends with the current
    // round indicator, while the original five slots remain a clear history.
    function drawKickHistory(history, x, y, align, color) {
        const slots = 5;
        const gap = 22;
        for (let i = 0; i < slots; i++) {
            const cx = align === 'left' ? x + i * gap : x - i * gap;
            const h = history[i];
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, y, 7, 0, Math.PI * 2);
            ctx.fillStyle = h ? (h.made ? color : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.06)';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = h ? (h.made ? color : 'rgba(255,107,107,0.9)') : 'rgba(255,255,255,0.20)';
            ctx.stroke();
            if (h && !h.made) {
                ctx.strokeStyle = h.saved ? '#2fd1ff' : '#ff6b6b';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(cx - 3, y - 3); ctx.lineTo(cx + 3, y + 3); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx + 3, y - 3); ctx.lineTo(cx - 3, y + 3); ctx.stroke();
            }
            ctx.restore();
        }
    }
    drawKickHistory(shootout.playerHistory || [], 415, 99, 'right', playerColor);
    drawKickHistory(shootout.opponentHistory || [], 485, 99, 'left', opponentColor);

    // Penalty area enhancement. The current pitch is still used for all normal
    // geometry, but these markings give the shootout a dedicated camera feel.
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    const boxX = isPlayerKick ? 675 : 25;
    const boxW = 200;
    ctx.strokeRect(boxX, 105, boxW, 390);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(isPlayerKick ? 675 : 225, 300, 88, isPlayerKick ? -Math.PI / 2 : Math.PI / 2, isPlayerKick ? Math.PI / 2 : 3 * Math.PI / 2);
    ctx.stroke();
    ctx.restore();

    drawGoalStructures();

    // Players: lower visual weight for spectators; keep the active shooter and
    // keeper crisp so the gameplay story is instantly readable.
    for (const p of players) {
        if (p === shootout.playerShooter || p === shootout.opponentShooter || p === shootout.playerGoalkeeper || p === shootout.opponentGoalkeeper) continue;
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + p.radius * 0.85, p.radius, p.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        drawPlayerToken(p);
        ctx.restore();
    }

    function drawCinematicKeeper(keeper, diving) {
        if (!keeper) return;
        ctx.save();
        ctx.translate(keeper.x, keeper.y);
        if (diving) {
            const direction = isPlayerKick ? 1 : -1;
            const tilt = direction * 0.18;
            ctx.rotate(tilt);
            ctx.scale(1.55, 0.78);
            const sprite = getPlayerSprite(keeper);
            ctx.drawImage(sprite.canvas, -sprite.offset, -sprite.offset);
        } else {
            const sprite = getPlayerSprite(keeper);
            ctx.drawImage(sprite.canvas, -sprite.offset, -sprite.offset);
        }
        ctx.restore();
    }

    if (shootout.phase === 'playerFlight' || shootout.phase === 'opponentFlight') {
        // Motion echoes give the kick visible velocity even though the normal
        // ball physics are intentionally paused during the cinematic flight.
        const fx = shootout.flightDuration > 0 ? 1 - shootout.timer / shootout.flightDuration : 1;
        for (let i = 6; i >= 1; i--) {
            const t = Math.max(0, fx - i * 0.075);
            const eased = t * t * (3 - 2 * t);
            const px = shootout.startX + (shootout.endX - shootout.startX) * eased;
            const py = shootout.flightStartY + (shootout.flightEndY - shootout.flightStartY) * eased;
            ctx.save();
            ctx.globalAlpha = 0.075 + (6 - i) * 0.01;
            ctx.fillStyle = THEME.white;
            ctx.beginPath(); ctx.arc(px, py, 4.2, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    const playerKeeperDiving = shootout.phase === 'opponentFlight' || shootout.phase === 'opponentResult';
    const opponentKeeperDiving = shootout.phase === 'playerFlight' || shootout.phase === 'playerResult';
    drawCinematicKeeper(shootout.playerGoalkeeper, playerKeeperDiving);
    drawCinematicKeeper(shootout.opponentGoalkeeper, opponentKeeperDiving);
    drawPlayerToken(shootout.playerShooter);
    drawPlayerToken(shootout.opponentShooter);

    // Active player ring / label.
    if (currentShooter) {
        const activeLabel = shootout.isLocal
            ? isPlayerKick ? 'PLAYER 1' : 'PLAYER 2'
            : isPlayerKick ? 'YOUR KICK' : 'OPPONENT';
        drawActiveIndicator(currentShooter, activeLabel, isPlayerKick ? playerColor : opponentColor);
    }

    // Ball shadow + ball.
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + 8, ball.radius * 1.1, ball.radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawMatchBall(ball);

    // Subtle trajectory guide while aiming: a broadcast-style dotted route
    // helps the player understand exactly where the current kick is headed
    // without turning the penalty into an automated shot indicator.
    if (shootout.phase === 'shoot' || shootout.phase === 'localShoot') {
        const targetX = isPlayerKick ? 870 : 30;
        const targetY = getPenaltyTimingTargetY(shootout.timingGreenCenter);
        ctx.save();
        ctx.strokeStyle = isPlayerKick ? playerColor : opponentColor;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 9]);
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // Short, state-specific impact treatment makes GOAL / SAVE / MISS feel
    // like an event rather than a text-only result.
    if (shootout.impactTimer > 0) {
        const strength = Math.max(0, Math.min(1, shootout.impactTimer / 0.46));
        ctx.save();
        ctx.globalAlpha = 0.10 * strength;
        if (shootout.impactType === 'goal' || shootout.impactType === 'conceded') {
            ctx.fillStyle = shootout.impactType === 'goal'
                ? (isPlayerKick ? playerColor : opponentColor)
                : shootout.isLocal ? opponentColor : THEME.red;
            ctx.fillRect(0, 0, GAME_W, GAME_H);
        } else if (shootout.impactType === 'save') {
            ctx.strokeStyle = THEME.blue;
            ctx.lineWidth = 7;
            ctx.beginPath(); ctx.arc(activeGoalX, activeGoalY, 40 + (1 - strength) * 48, 0, Math.PI * 2); ctx.stroke();
        } else {
            ctx.strokeStyle = THEME.red;
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(activeGoalX - 32, activeGoalY - 32); ctx.lineTo(activeGoalX + 32, activeGoalY + 32); ctx.moveTo(activeGoalX + 32, activeGoalY - 32); ctx.lineTo(activeGoalX - 32, activeGoalY + 32); ctx.stroke();
        }
        ctx.restore();
    }

    // Target reticle and keeper destination. During result/flight the reticle
    // locks to the actual target so the player can understand why a kick saved,
    // scored or went wide.
    if (shootout.phase !== 'keeper') {
        const reticlePulse = 1 + Math.sin(performance.now() * 0.008) * 0.08;
        ctx.save();
        ctx.translate(activeGoalX, activeGoalY);
        ctx.scale(reticlePulse, reticlePulse);
        ctx.strokeStyle = isPlayerKick ? playerColor : opponentColor;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(17, 0); ctx.moveTo(0, -17); ctx.lineTo(0, 17); ctx.stroke();
        ctx.fillStyle = isPlayerKick ? playerColor : opponentColor;
        ctx.globalAlpha = 0.18;
        ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // Mid-screen status badge.
    let statusText = shootout.isLocal
        ? (isPlayerKick ? 'PLAYER 1 KICK' : 'PLAYER 2 KICK')
        : 'YOUR KICK';
    let statusColor = isPlayerKick ? playerColor : opponentColor;
    if (shootout.phase === 'keeper') { statusText = 'CHOOSE YOUR DIVE'; statusColor = THEME.blue; }
    else if (shootout.phase === 'playerFlight' || shootout.phase === 'opponentFlight') { statusText = 'SHOT IN FLIGHT'; statusColor = THEME.gold; }
    else if (resultPhase) {
        statusText = shootout.message;
        if (shootout.message.includes('SAVED') || shootout.message.includes('MISS') || shootout.message.includes('WIDE') || shootout.message.includes('MISSES') || shootout.message.includes('LOST')) statusColor = THEME.red;
        else if (shootout.message.includes('GOAL') || shootout.message.includes('WON') || shootout.message.includes('SCORES')) statusColor = THEME.accent;
        else statusColor = THEME.gold;
    }
    drawGlassPanel(280, 120, 340, 46, 15, 'rgba(6,11,20,0.82)');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = statusColor;
    ctx.shadowColor = statusColor;
    ctx.shadowBlur = 10;
    ctx.font = '900 20px Outfit, sans-serif';
    ctx.fillText(statusText, 450, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.font = '600 10px Outfit, sans-serif';
    const shooterLine = currentShooter
        ? shootout.isLocal
            ? `${isPlayerKick ? 'PLAYER 1' : 'PLAYER 2'} · #${currentShooter.num}`
            : `#${currentShooter.num}  ${isPlayerKick ? playerTeam.name : opponentTeam.name}`
        : '';
    ctx.fillText(shooterLine, 450, 163);
    ctx.restore();

    const aiming = shootout.phase === 'shoot' || shootout.phase === 'keeper' || shootout.phase === 'localShoot';
    if (aiming) {
        const laneX = 265, laneY = 514, laneW = 370;
        const markerX = laneX + shootout.timingPosition * laneW;
        const greenHalfWidth = laneW * shootout.timingGreenHalfWidth;
        const greenStart = laneX + shootout.timingGreenCenter * laneW - greenHalfWidth;
        const greenWidth = greenHalfWidth * 2;
        drawGlassPanel(190, 475, 520, 113, 18, 'rgba(6,11,20,0.91)');

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.60)';
        ctx.font = '700 11px Outfit, sans-serif';
        const timingInstruction = isMobileDevice
            ? 'TAP WHEN THE MARKER IS GREEN'
            : shootout.isLocal
                ? shootout.phase === 'shoot' ? 'PLAYER 1: SPACE' : 'PLAYER 2: ENTER'
                : 'PRESS SPACE WHEN THE MARKER IS GREEN';
        ctx.fillText(timingInstruction, 450, 500);

        ctx.fillStyle = 'rgba(255,107,107,0.20)';
        ctx.beginPath(); ctx.roundRect(laneX, laneY + 9, laneW, 13, 6); ctx.fill();
        ctx.fillStyle = 'rgba(31,209,92,0.42)';
        ctx.beginPath(); ctx.roundRect(greenStart, laneY + 7, greenWidth, 17, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(106,255,158,0.95)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(greenStart, laneY + 7, greenWidth, 17, 7); ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.42)';
        ctx.font = '700 9px Outfit, sans-serif';
        ctx.textAlign = 'left'; ctx.fillText('EARLY', laneX, laneY + 4);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#78ff9d';
        ctx.fillText(shootout.isLocal || shootout.phase !== 'keeper' ? 'GREEN = GOAL · GREY = MISS' : 'GREEN = SAVE · GREY = GOAL', laneX + laneW / 2, laneY + 4);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.42)';
        ctx.fillText('LATE', laneX + laneW, laneY + 4);

        ctx.save();
        ctx.strokeStyle = THEME.white;
        ctx.lineWidth = 3;
        ctx.shadowColor = shootout.phase === 'shoot' || shootout.phase === 'localShoot'
            ? (shootout.phase === 'shoot' ? playerColor : opponentColor)
            : THEME.blue;
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(markerX, laneY + 2); ctx.lineTo(markerX, laneY + 29); ctx.stroke();
        ctx.fillStyle = THEME.white;
        ctx.beginPath(); ctx.arc(markerX, laneY + 15, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
        const actionLabel = shootout.phase === 'keeper' ? 'DIVE' : 'SHOOT';
        const actionColor = shootout.phase === 'shoot' ? playerColor : shootout.phase === 'localShoot' ? opponentColor : THEME.blue;
        drawPillButton(350, 543, 200, 38, actionLabel, actionColor, { active: true, filled: true, fontSize: 16 });
        window._shootoutTimingBar = { x: laneX, y: laneY - 2, w: laneW, h: 31 };
        window._shootoutActionBtn = { x: 350, y: 543, w: 200, h: 38 };
    } else {
        window._shootoutTimingBar = null;
        window._shootoutActionBtn = null;
    }

    if (shootout.phase === 'complete') {
        ctx.save();
        const winner = shootout.playerGoals > shootout.opponentGoals ? playerColor : shootout.isLocal ? opponentColor : THEME.red;
        const pulse = 0.92 + Math.sin(performance.now() * 0.006) * 0.05;
        ctx.globalAlpha = 0.16 * pulse;
        const glow = ctx.createRadialGradient(450, 260, 10, 450, 260, 300);
        glow.addColorStop(0, winner);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(120, 100, 660, 360);
        ctx.restore();

        drawGlassPanel(275, 205, 350, 94, 20, 'rgba(6,11,20,0.92)');
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = shootout.playerGoals > shootout.opponentGoals ? playerColor : shootout.isLocal ? opponentColor : THEME.red;
        ctx.font = '900 31px Outfit, sans-serif';
        ctx.fillText(shootout.message, 450, 248);
        ctx.fillStyle = THEME.white;
        ctx.font = '800 21px Outfit, sans-serif';
        ctx.fillText(`${shootout.playerGoals}  —  ${shootout.opponentGoals}`, 450, 279);
        ctx.restore();
    }
}

// ============================================================
// CHAMPION CELEBRATION
// ============================================================
function drawChampionCelebration() {
    themeBackdrop();
    ctx.save();
    themeCard(140, 45, 620, 460, 26, THEME.gold);
    ctx.textAlign = 'center';
    const champion = TournamentManager.champion;
    const playerTeam = TournamentManager.getPlayerTeam();
    const isPlayerChampion = champion && champion.id === tournamentSelectedTeam;

    drawIcon(ctx, 'worldCup', 450, 145, 90, THEME.gold, { glow: true, glowColor: THEME.gold, glowBlur: 20 });

    ctx.fillStyle = THEME.gold;
    ctx.font = '900 52px Outfit, sans-serif';
    ctx.shadowColor = THEME.gold;
    ctx.shadowBlur = 20;
    ctx.fillText('CHAMPIONS!', 450, 235);
    ctx.shadowBlur = 0;

    if (champion) fillTextWithFlags([champion, ` ${champion.name}`], 450, 285, '700 30px Outfit, sans-serif', '#ffffff');

    if (isPlayerChampion) {
        ctx.fillStyle = THEME.accent;
        ctx.font = '700 26px Outfit, sans-serif';
        ctx.fillText('YOU ARE THE CHAMPION!', 450, 335);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '600 20px Outfit, sans-serif';
        ctx.fillText(`Your team (${playerTeam ? playerTeam.name : 'Unknown'}) finished the tournament`, 450, 335);
    }

    const progress = TournamentManager.getProgress();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '500 16px Outfit, sans-serif';
    ctx.fillText(`Tournament Complete! · ${progress}% Progress`, 450, 385);

    themePill(300, 430, 300, 50, 'EXIT TOURNAMENT', THEME.purple, { fontSize: 19, icon: 'home' });
    window._tournamentReturnBtn = { x: 300, y: 430, w: 300, h: 50 };
    ctx.restore();
}

// ============================================================
// PAUSE MENU — now context-aware. In a tournament match, the second
// button reads FORFEIT MATCH and opens a confirm overlay instead of
// silently recording a 0-3 loss on a single tap. In every other mode
// it's still plain "MAIN MENU" that returns instantly.
// ============================================================
function drawPauseMenu() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    themeCard(250, 150, 400, 320, 22, THEME.gold);
    ctx.textAlign = 'center';
    themeTitle('pause', 'PAUSED', 450, 212, THEME.gold, 32);

    const isTournamentMatch = tournamentMode && tournamentPendingMatch;
    const secondLabel = isTournamentMatch ? 'FORFEIT MATCH' : 'MAIN MENU';
    const secondIcon  = isTournamentMatch ? 'cross' : 'home';

    themePill(350, 235, 200, 50, 'RESUME', THEME.accent, { fontSize: 20, icon: 'play' });
    window._pauseResumeBtn = { x: 350, y: 235, w: 200, h: 50 };
    themePill(350, 295, 200, 50, secondLabel, THEME.red, { fontSize: isTournamentMatch ? 17 : 20, icon: secondIcon });
    window._pauseMenuBtn = { x: 350, y: 295, w: 200, h: 50 };

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('SOUND CONTROLS', 450, 370);

    // Same hit areas as before; the labels now live inside the pills instead of
    // as 10px captions underneath (which nobody could read on a phone).
    themePill(330, 385, 110, 35, SoundManager.musicEnabled ? 'MUSIC ON' : 'MUSIC OFF', SoundManager.musicEnabled ? THEME.accent : THEME.red, { fontSize: 11, icon: SoundManager.musicEnabled ? 'volumeOn' : 'mute' });
    window._pauseMusicBtn = { x: 330, y: 385, w: 110, h: 35 };
    themePill(460, 385, 110, 35, SoundManager.sfxEnabled ? 'SFX ON' : 'SFX OFF', SoundManager.sfxEnabled ? THEME.accent : THEME.red, { fontSize: 11, icon: SoundManager.sfxEnabled ? 'volumeOn' : 'mute' });
    window._pauseSfxBtn = { x: 460, y: 385, w: 110, h: 35 };

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Press [ ESC ] or [ P ] to resume', 450, 443);
    ctx.restore();

    drawForfeitConfirmOverlay();
}

// Confirm overlay for the FORFEIT MATCH button. Only draws when
// window._confirmForfeitMatch is true. Cancel is a no-op; confirm calls
// forfeitCurrentTournamentMatch() (defined in input.js) which records
// the 0-3 loss and routes to TOURNAMENT_RESULT just like a real defeat.
function drawForfeitConfirmOverlay() {
    if (!window._confirmForfeitMatch) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    themeCard(250, 200, 400, 210, 22, THEME.red);
    ctx.textAlign = 'center';
    themeTitle('cross', 'FORFEIT MATCH?', 450, 258, THEME.red, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Your team will lose this match 0-3.', 450, 290);
    ctx.fillText('This cannot be undone.', 450, 310);

    themePill(275, 335, 150, 45, 'STAY', THEME.accent, { fontSize: 17, icon: 'checkmark' });
    window._confirmForfeitNoBtn = { x: 275, y: 335, w: 150, h: 45 };
    themePill(475, 335, 150, 45, 'FORFEIT', THEME.red, { fontSize: 17, icon: 'cross' });
    window._confirmForfeitYesBtn = { x: 475, y: 335, w: 150, h: 45 };

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillText('ESC to stay · ENTER to forfeit', 450, 396);
    ctx.restore();
}
// ============================================================
// KNOCKOUT BRACKET — themed to match the rest of the game.
// Overrides renderer.js's old dark-glass version (theme.js loads after
// renderer.js, so this wins — same pattern as every other screen here).
// ============================================================
function drawBracketMatchBox(ctxRef, match, x, y, width, height, playerTeamId, isFinal = false) {
    const isPlayerMatch = (match.teamA && match.teamA.id === playerTeamId) ||
                          (match.teamB && match.teamB.id === playerTeamId);
    const isPlayed = match.played;
    const isPending = match.pending;
    const hasWinner = isPlayed && match.winner;

    let bgColor = THEME.ink2;
    let borderColor = 'rgba(255,255,255,0.12)';
    let borderWidth = 1;
    if (isPlayerMatch) { bgColor = 'rgba(44,34,10,0.94)'; borderColor = THEME.gold; borderWidth = 2; }
    else if (isPlayed) { bgColor = 'rgba(11,18,32,0.92)'; borderColor = 'rgba(31,209,92,0.5)'; }   // opaque dark: a see-through box let the green pitch swallow green winner text
    else if (isFinal) { bgColor = 'rgba(255,198,54,0.08)'; borderColor = 'rgba(255,198,54,0.35)'; }

    ctxRef.save();
    ctxRef.fillStyle = bgColor;
    ctxRef.beginPath();
    ctxRef.roundRect(x, y, width, height, 6);
    ctxRef.fill();
    ctxRef.strokeStyle = borderColor;
    ctxRef.lineWidth = borderWidth;
    ctxRef.stroke();

    const teamA = match.teamA || { name: 'TBD', flag: '' };
    const isWinnerA = hasWinner && match.winner.id === teamA.id;
    // Right-side status text width varies (PENDING is far wider than a
    // score like "2-1" or "VS"), and team names vary a lot in length -
    // guessing a fixed character-count cutoff either truncated short names
    // needlessly or let long names run into the status text. Measuring the
    // ACTUAL status text pixel width up front and truncating names against
    // the real remaining space fixes both at once, for any name/status
    // combination, without touching the status text's own position.
    ctxRef.font = '700 8px Outfit, sans-serif';
    const statusText = isPlayed ? `${match.scoreA}-${match.scoreB}` : (isPending ? 'PENDING' : (!isPlayerMatch ? 'VS' : ''));
    const statusW = statusText ? ctxRef.measureText(statusText).width : 0;
    const nameFont = '600 9px Outfit, sans-serif';

    ctxRef.textAlign = 'left';
    ctxRef.fillStyle = isWinnerA ? '#5cf0a0' : 'rgba(255,255,255,0.85)';
    ctxRef.font = nameFont;
    // The winner's trophy used to sit pinned to the box's far-right edge,
    // fighting the score/PENDING/VS text (also right-aligned) for the same
    // few pixels - the two would draw on top of each other whenever a
    // played match's winner needed both. Drawing it inline, right before
    // the flag, keeps the ENTIRE right edge free for score/status text and
    // never overlaps regardless of team name length.
    let rowStartX = x + 5;
    if (isWinnerA) { drawIcon(ctxRef, 'trophy', rowStartX + 5, y + 10, 10, THEME.accent); rowStartX += 13; }
    const flagWA = drawTeamFlag(teamA, rowStartX, y + 14, 9, 'left');
    const nameA = fitText(teamA.name, (x + width - 8 - statusW) - (rowStartX + flagWA));
    ctxRef.fillText(nameA, rowStartX + flagWA, y + 14);

    const teamB = match.teamB || { name: 'TBD', flag: '' };
    const isWinnerB = hasWinner && match.winner.id === teamB.id;
    ctxRef.fillStyle = isWinnerB ? '#5cf0a0' : 'rgba(255,255,255,0.65)';
    ctxRef.font = nameFont;
    let rowStartXB = x + 5;
    if (isWinnerB) { drawIcon(ctxRef, 'trophy', rowStartXB + 5, y + height - 10, 10, THEME.accent); rowStartXB += 13; }
    const flagWB = drawTeamFlag(teamB, rowStartXB, y + height - 5, 9, 'left');
    const nameB = fitText(teamB.name, (x + width - 8 - statusW) - (rowStartXB + flagWB));
    ctxRef.fillText(nameB, rowStartXB + flagWB, y + height - 5);

    ctxRef.textAlign = 'right';
    if (isPlayed) {
        ctxRef.fillStyle = 'rgba(255,255,255,0.75)';
        ctxRef.font = '700 10px Outfit, sans-serif';
        ctxRef.fillText(`${match.scoreA}-${match.scoreB}`, x + width - 6, y + height / 2 + 3);
    } else if (isPending) {
        ctxRef.fillStyle = THEME.gold;
        ctxRef.font = '700 8px Outfit, sans-serif';
        ctxRef.fillText('PENDING', x + width - 6, y + height / 2 + 3);
    } else if (!isPlayerMatch) {
        ctxRef.fillStyle = 'rgba(255,255,255,0.25)';
        ctxRef.font = '600 8px Outfit, sans-serif';
        ctxRef.fillText('VS', x + width - 6, y + height / 2 + 3);
    }
    ctxRef.restore();
}

function drawTournamentBracket() {
    themeBackdrop();
    ctx.save();
    window._tournamentPlayMatchBtn = null;
    window._tournamentChampionBtn = null;
    window._tournamentBracketBackBtn = null;

    const bracket = TournamentManager.getBracketStatus();
    if (!bracket || bracket.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '600 20px Outfit, sans-serif';
        ctx.fillText('Bracket not yet available', 450, 300);
        ctx.restore();
        return;
    }

    const nextMatch = TournamentManager.getPlayerNextMatch();
    const isComplete = TournamentManager.isComplete();
    const isEliminated = TournamentManager.isPlayerEliminated();
    const currentRound = TournamentManager.currentKnockoutRound || 0;
    const roundNames = ['ROUND OF 16', 'QUARTER-FINALS', 'SEMI-FINALS', 'WORLD CUP FINAL'];
    const currentRoundName = roundNames[currentRound] || 'KNOCKOUT STAGE';

    ctx.textAlign = 'center';
    themeTitle('trophy', currentRoundName, 450, 40, THEME.gold, 26);

    const round0 = bracket[0]?.matches || [];
    const round1 = bracket[1]?.matches || [];
    const round2 = bracket[2]?.matches || [];
    const round3 = bracket[3]?.matches || [];

    const boxWidth = 110, boxHeight = 34, gapY = 10, gapX = 15;
    // Reserve room for the winner label, action button, and Back control.
    const bottomBarReserved = 150;
    const startY = 65, totalHeight = (600 - bottomBarReserved) - startY;

    const leftMatches = round0.slice(0, 4);
    const rightMatches = round0.slice(4, 8);

    function getYPositions(count, startYPos, totalH, boxH, gap) {
        const totalBoxHeight = count * boxH + (count - 1) * gap;
        const offset = (totalH - totalBoxHeight) / 2;
        const positions = [];
        for (let i = 0; i < count; i++) positions.push(startYPos + offset + i * (boxH + gap));
        return positions;
    }

    const leftY = getYPositions(leftMatches.length, startY, totalHeight, boxHeight, gapY);
    const rightY = getYPositions(rightMatches.length, startY, totalHeight, boxHeight, gapY);

    const marginX = (900 - (7 * boxWidth + 6 * gapX)) / 2;
    const col0 = marginX, col1 = col0 + boxWidth + gapX, col2 = col1 + boxWidth + gapX;
    const col3 = col2 + boxWidth + gapX, col4 = col3 + boxWidth + gapX;
    const col5 = col4 + boxWidth + gapX, col6 = col5 + boxWidth + gapX;
    const leftX = [col0, col1, col2];
    const rightX = [col6, col5, col4];
    const finalX = col3;

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.fillText('GROUPS A - D', leftX[0] + boxWidth / 2, startY - 10);
    ctx.fillText('GROUPS E - H', rightX[0] + boxWidth / 2, startY - 10);

    leftMatches.forEach((m, i) => drawBracketMatchBox(ctx, m, leftX[0], leftY[i], boxWidth, boxHeight, tournamentSelectedTeam));
    rightMatches.forEach((m, i) => drawBracketMatchBox(ctx, m, rightX[0], rightY[i], boxWidth, boxHeight, tournamentSelectedTeam));

    const leftQF = round1.slice(0, 2);
    const qfY = getYPositions(leftQF.length, startY + 20, totalHeight - 40, boxHeight, gapY);
    leftQF.forEach((m, i) => { if (m && m.teamA && m.teamB) drawBracketMatchBox(ctx, m, leftX[1], qfY[i], boxWidth, boxHeight, tournamentSelectedTeam); });

    const rightQF = round1.slice(2, 4);
    const qfYRight = getYPositions(rightQF.length, startY + 20, totalHeight - 40, boxHeight, gapY);
    rightQF.forEach((m, i) => { if (m && m.teamA && m.teamB) drawBracketMatchBox(ctx, m, rightX[1], qfYRight[i], boxWidth, boxHeight, tournamentSelectedTeam); });

    if (round2[0] && round2[0].teamA && round2[0].teamB) {
        drawBracketMatchBox(ctx, round2[0], leftX[2], startY + totalHeight / 2 - boxHeight / 2 - 10, boxWidth, boxHeight, tournamentSelectedTeam);
    }
    if (round2[1] && round2[1].teamA && round2[1].teamB) {
        drawBracketMatchBox(ctx, round2[1], rightX[2], startY + totalHeight / 2 - boxHeight / 2 - 10, boxWidth, boxHeight, tournamentSelectedTeam);
    }

    if (round3[0] && round3[0].teamA && round3[0].teamB) {
        const finalY = startY + totalHeight / 2 - boxHeight / 2 + 40;
        ctx.textAlign = 'center';
        themeTitle('trophy', 'FINAL', 450, finalY - 14, THEME.gold, 16);
        ctx.fillStyle = 'rgba(255,198,54,0.08)';
        ctx.beginPath();
        ctx.roundRect(finalX - 10, finalY - 6, boxWidth + 20, boxHeight + 12, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,198,54,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        drawBracketMatchBox(ctx, round3[0], finalX, finalY, boxWidth, boxHeight, tournamentSelectedTeam, true);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) {
        const y1 = leftY[i * 2] + boxHeight / 2, y2 = leftY[i * 2 + 1] + boxHeight / 2, yTo = qfY[i] + boxHeight / 2;
        const xFrom = leftX[0] + boxWidth, xTo = leftX[1];
        ctx.beginPath(); ctx.moveTo(xFrom, y1); ctx.lineTo(xFrom + 12, y1); ctx.lineTo(xFrom + 12, yTo); ctx.lineTo(xTo, yTo); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xFrom, y2); ctx.lineTo(xFrom + 12, y2); ctx.lineTo(xFrom + 12, yTo); ctx.stroke();
    }
    if (qfY.length >= 2 && round2[0] && round2[0].teamA) {
        const y1 = qfY[0] + boxHeight / 2, y2 = qfY[1] + boxHeight / 2, yTo = startY + totalHeight / 2 - 10;
        const xFrom = leftX[1] + boxWidth, xTo = leftX[2];
        ctx.beginPath(); ctx.moveTo(xFrom, y1); ctx.lineTo(xFrom + 12, y1); ctx.lineTo(xFrom + 12, yTo); ctx.lineTo(xTo, yTo); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xFrom, y2); ctx.lineTo(xFrom + 12, y2); ctx.lineTo(xFrom + 12, yTo); ctx.stroke();
    }
    for (let i = 0; i < 2; i++) {
        const y1 = rightY[i * 2] + boxHeight / 2, y2 = rightY[i * 2 + 1] + boxHeight / 2, yTo = qfYRight[i] + boxHeight / 2;
        const xFrom = rightX[0], xTo = rightX[1] + boxWidth;
        ctx.beginPath(); ctx.moveTo(xFrom, y1); ctx.lineTo(xFrom - 12, y1); ctx.lineTo(xFrom - 12, yTo); ctx.lineTo(xTo, yTo); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xFrom, y2); ctx.lineTo(xFrom - 12, y2); ctx.lineTo(xFrom - 12, yTo); ctx.stroke();
    }
    if (qfYRight.length >= 2 && round2[1] && round2[1].teamA) {
        const y1 = qfYRight[0] + boxHeight / 2, y2 = qfYRight[1] + boxHeight / 2, yTo = startY + totalHeight / 2 - 10;
        const xFrom = rightX[1], xTo = rightX[2] + boxWidth;
        ctx.beginPath(); ctx.moveTo(xFrom, y1); ctx.lineTo(xFrom - 12, y1); ctx.lineTo(xFrom - 12, yTo); ctx.lineTo(xTo, yTo); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xFrom, y2); ctx.lineTo(xFrom - 12, y2); ctx.lineTo(xFrom - 12, yTo); ctx.stroke();
    }
    if (round2[0] && round2[0].teamA && round2[1] && round2[1].teamA) {
        const sfY = startY + totalHeight / 2 - 10, finalYPos = startY + totalHeight / 2 + 40;
        ctx.beginPath(); ctx.moveTo(leftX[2] + boxWidth, sfY); ctx.lineTo(leftX[2] + boxWidth + 20, sfY); ctx.lineTo(leftX[2] + boxWidth + 20, finalYPos); ctx.lineTo(finalX, finalYPos); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rightX[2], sfY); ctx.lineTo(rightX[2] - 20, sfY); ctx.lineTo(rightX[2] - 20, finalYPos); ctx.lineTo(finalX + boxWidth, finalYPos); ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,198,54,0.3)';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillText('▼ WINNER ▼', 450, startY + totalHeight + 30);

    let buttonY = startY + totalHeight + 55;

    if (nextMatch && !isComplete && !isEliminated) {
        const teamAName = nextMatch.teamA ? nextMatch.teamA.name : 'TBD';
        const teamBName = nextMatch.teamB ? nextMatch.teamB.name : 'TBD';
        const btnX = 150, btnW = 600, btnH = 45;
        const label = `PLAY: ${teamAName} vs ${teamBName}`;
        ctx.save();
        const hovered = uiButtonHovered(btnX, buttonY, btnW, btnH);
        ctx.shadowColor = hovered ? '#ffffff' : 'transparent';
        ctx.shadowBlur = hovered ? 18 : 0;
        ctx.fillStyle = hovered ? '#55e889' : THEME.accent;
        ctx.beginPath();
        ctx.roundRect(btnX, buttonY, btnW, btnH, 14);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (hovered) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.fillStyle = THEME.ink;
        ctx.textAlign = 'center';
        let fontSize = 18;
        ctx.font = `700 ${fontSize}px Outfit, sans-serif`;
        while (ctx.measureText(label).width > btnW - 90 && fontSize > 13) { fontSize--; ctx.font = `700 ${fontSize}px Outfit, sans-serif`; }
        drawIcon(ctx, 'play', btnX + 40, buttonY + btnH / 2, 20, THEME.ink);
        ctx.fillText(label, btnX + btnW / 2 + 12, buttonY + btnH / 2 + fontSize * 0.32);
        ctx.restore();
        window._tournamentPlayMatchBtn = { x: btnX, y: buttonY, w: btnW, h: btnH };
    } else if (isComplete) {
        const champion = TournamentManager.champion;
        if (champion) {
            themeCard(250, buttonY, 400, 45, 12, THEME.gold);
            if (uiButtonHovered(250, buttonY, 400, 45)) {
                ctx.save();
                ctx.shadowColor = THEME.gold;
                ctx.shadowBlur = 18;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(250, buttonY, 400, 45, 12);
                ctx.stroke();
                ctx.restore();
            }
            ctx.font = '700 18px Outfit, sans-serif';
            fillTextWithFlags([champion, ` ${champion.name} ARE CHAMPIONS!`], 450, buttonY + 28, ctx.font, THEME.gold);
            window._tournamentChampionBtn = { x: 250, y: buttonY, w: 400, h: 45 };
        }
    } else if (isEliminated) {
        themeCard(250, buttonY, 400, 45, 12, THEME.red);
        ctx.fillStyle = THEME.red;
        ctx.font = '700 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YOU HAVE BEEN ELIMINATED', 450, buttonY + 28);
    }

    window._tournamentBracketBackBtn = themeBackButton(350, buttonY + 55, 200, 32);
    ctx.restore();
}