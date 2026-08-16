// ===== PRO STRIKER - renderer.js =====
console.log('[ProStriker] renderer.js loaded');

function drawPitch() {
    const stripeWidth = (875 - 25) / 10;
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#27ae60' : '#2ecc71';
        ctx.fillRect(25 + i * stripeWidth, 0, stripeWidth, canvas.height);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(25, 0, 850, canvas.height);
    ctx.beginPath();
    ctx.moveTo(450, 0);
    ctx.lineTo(450, 600);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 300, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 300, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeRect(25, 150, 100, 300);
    ctx.strokeRect(775, 150, 100, 300);
    ctx.beginPath();
    ctx.arc(95, 300, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(805, 300, 3, 0, Math.PI * 2);
    ctx.fill();
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
    glow.addColorStop(0, 'rgba(255,255,255,0.03)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    ctx.fillStyle = 'rgba(15,20,25,0.75)';
    ctx.beginPath();
    ctx.roundRect(120, 10, 660, 60, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

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

    ctx.fillStyle = 'rgba(15,20,25,0.85)';
    ctx.beginPath();
    ctx.roundRect(400, 72, 100, 28, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
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
        ctx.fillStyle = 'rgba(15,20,25,0.85)';
        ctx.beginPath();
        ctx.roundRect(15, 15, 80, 28, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        let diffColor = difficulty === 'EASY' ? '#2ecc71' : 
                        difficulty === 'MEDIUM' ? '#f1c40f' : 
                        difficulty === 'HARD' ? '#e67e22' : 
                        difficulty === 'ELITE' ? '#e74c3c' : '#8e44ad';
        ctx.fillStyle = diffColor;
        ctx.font = '700 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(difficulty, 55, 35);
    }
}

function drawGkTimerUI() {
    if (gkTimer > 0 && ball.owner && ball.owner.isGk) {
        let seconds = Math.ceil(gkTimer / 60);
        ctx.fillStyle = 'rgba(15,20,25,0.85)';
        ctx.beginPath();
        ctx.roundRect(canvas.width - 80, 15, 65, 50, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = seconds <= 2 ? '#ff5252' : '#f1c40f';
        ctx.font = '900 24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(seconds + 's', canvas.width - 47, 43);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 10px Outfit, sans-serif';
        ctx.fillText('GK TIME', canvas.width - 47, 25);
    }
}

function drawMenuBackground() {
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    let time = Date.now() * 0.0012;
    let rad1X = 250 + Math.sin(time) * 60;
    let rad1Y = 200 + Math.cos(time * 0.8) * 40;
    let grad1 = ctx.createRadialGradient(rad1X, rad1Y, 10, rad1X, rad1Y, 340);
    grad1.addColorStop(0, 'rgba(231,76,60,0.35)');
    grad1.addColorStop(1,'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0,0,900,600);
    let rad2X = 650 + Math.cos(time * 0.9) * 60;
    let rad2Y = 400 + Math.sin(time) * 40;
    let grad2 = ctx.createRadialGradient(rad2X, rad2Y, 10, rad2X, rad2Y, 340);
    grad2.addColorStop(0,'rgba(52,152,219,0.35)');
    grad2.addColorStop(1,'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0,0,900,600);
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

function drawDifficultySelect() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px Outfit, sans-serif';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText('SELECT DIFFICULTY', 450, 90);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 15px Outfit, sans-serif';
    ctx.fillText('Choose your challenge level', 450, 120);

    // ===== PERFECTLY CENTERED 3+2 GRID =====
    // Row 1: 3 buttons (EASY, MEDIUM, HARD) – centered
    // Row 2: 2 buttons (ELITE, WORLD CLASS) – centered below
    const levels = [
        // Row 1: x positions spaced evenly across 900px
        { key: 'EASY', label: 'EASY', sub: 'Casual Play', color: '#2ecc71', x: 200, y: 170 },
        { key: 'MEDIUM', label: 'MEDIUM', sub: 'Balanced', color: '#f1c40f', x: 450, y: 170 },
        { key: 'HARD', label: 'HARD', sub: 'Expert', color: '#e74c3c', x: 700, y: 170 },
        // Row 2: centered below
        { key: 'ELITE', label: 'ELITE', sub: 'Pro Level', color: '#9b59b6', x: 325, y: 290 },
        { key: 'WORLD_CLASS', label: 'WORLD CLASS', sub: 'Ultimate', color: '#00d2ff', x: 575, y: 290 }
    ];

    window._difficultyBtns = [];
    levels.forEach((lvl) => {
        const isSelected = difficulty === lvl.key;
        const x = lvl.x;
        const y = lvl.y;
        const w = 140;
        const h = 90;
        
        ctx.fillStyle = isSelected ? lvl.color + '26' : 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(x - w/2, y, w, h, 14);
        ctx.fill();
        ctx.strokeStyle = isSelected ? lvl.color : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();
        
        ctx.fillStyle = lvl.color;
        ctx.font = isSelected ? '800 20px Outfit, sans-serif' : '700 18px Outfit, sans-serif';
        ctx.shadowColor = isSelected ? lvl.color : 'transparent';
        ctx.shadowBlur = isSelected ? 15 : 0;
        ctx.fillText(lvl.label, x, y + 40);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '500 11px Outfit, sans-serif';
        ctx.fillText(lvl.sub, x, y + 62);
        
        // Store button for click detection
        window._difficultyBtns.push({ 
            x: x - w/2, 
            y: y, 
            w: w, 
            h: h, 
            key: lvl.key 
        });
    });

    // Back button
    ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
    ctx.beginPath();
    ctx.roundRect(350, 410, 200, 45, 12);
    ctx.fill();
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#9b59b6';
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillText('← BACK', 450, 440);
    window._diffBackBtn = { x: 350, y: 410, w: 200, h: 45 };
    
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Press E M H I W or tap a card', 450, 485);
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.roundRect(250, 150, 400, 320, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1c40f';
    ctx.font = '900 40px Outfit, sans-serif';
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 20;
    ctx.fillText('⏸ PAUSED', 450, 210);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
    ctx.beginPath();
    ctx.roundRect(350, 235, 200, 50, 12);
    ctx.fill();
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#2ecc71';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.fillText('▶ RESUME', 450, 270);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
    ctx.beginPath();
    ctx.roundRect(350, 295, 200, 50, 12);
    ctx.fill();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e74c3c';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.fillText('🏠 MAIN MENU', 450, 330);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('SOUND CONTROLS', 450, 370);
    ctx.fillStyle = SoundManager.musicEnabled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)';
    ctx.beginPath();
    ctx.roundRect(330, 385, 110, 35, 10);
    ctx.fill();
    ctx.strokeStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillText(`🎵 ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`, 385, 410);
    ctx.fillStyle = SoundManager.sfxEnabled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)';
    ctx.beginPath();
    ctx.roundRect(460, 385, 110, 35, 10);
    ctx.fill();
    ctx.strokeStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillText(`🔊 ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`, 515, 410);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '500 10px Outfit, sans-serif';
    ctx.fillText('Music', 385, 427);
    ctx.fillText('SFX', 515, 427);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Press [ ESC ] or [ P ] to resume', 450, 445);
    ctx.restore();
}

function drawStatsScreen() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText('📊 STATISTICS', 450, 70);
    ctx.shadowBlur = 0;
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

        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(x, y, cardWidth, cardHeight, 14);
        ctx.fill();
        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = colors[idx];
        ctx.font = '700 16px Outfit, sans-serif';
        ctx.fillText(displayLabels[diff], centerX, y + 32);

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
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.font = '500 11px Outfit, sans-serif';
            ctx.fillText(line, centerX, y + 66 + i * 22);
        });
    });

    ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
    ctx.beginPath();
    ctx.roundRect(350, 500, 200, 45, 12);
    ctx.fill();
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#9b59b6';
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← BACK', 450, 530);
    window._backBtn = { x: 350, y: 500, w: 200, h: 45 };
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Press ESC or tap BACK to return', 450, 565);
    ctx.restore();
}

function drawTournamentMenu() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Outfit, sans-serif';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 20;
    ctx.fillText('🏆 TOURNAMENT', 450, 120);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 18px Outfit, sans-serif';
    ctx.fillText('Select Tournament Format', 450, 170);

    const formats = [
        { size: 32, label: '32 TEAMS', desc: 'Full FIFA World Cup Style', y: 250 }
    ];
    formats.forEach((fmt, idx) => {
        const isSelected = tournamentFormat === fmt.size;
        const x = 450;
        const y = fmt.y;
        ctx.fillStyle = isSelected ? 'rgba(241, 196, 15, 0.15)' : 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(x - 150, y - 15, 300, 65, 12);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#f1c40f' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();
        ctx.fillStyle = isSelected ? '#f1c40f' : '#ffffff';
        ctx.font = isSelected ? '900 24px Outfit, sans-serif' : '700 22px Outfit, sans-serif';
        ctx.shadowColor = isSelected ? '#f1c40f' : 'transparent';
        ctx.shadowBlur = isSelected ? 15 : 0;
        ctx.fillText(fmt.label, x, y + 20);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '500 13px Outfit, sans-serif';
        ctx.fillText(fmt.desc, x, y + 44);
        window._tournamentFormatBtns = window._tournamentFormatBtns || [];
        window._tournamentFormatBtns[idx] = { x: x - 150, y: y - 15, w: 300, h: 65, size: fmt.size };
    });

    ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
    ctx.beginPath();
    ctx.roundRect(300, 380, 300, 55, 14);
    ctx.fill();
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#2ecc71';
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.shadowColor = '#2ecc71';
    ctx.shadowBlur = 15;
    ctx.fillText('▶ START TOURNAMENT', 450, 420);
    ctx.shadowBlur = 0;
    window._tournamentStartBtn = { x: 300, y: 380, w: 300, h: 55 };

    ctx.fillStyle = 'rgba(155, 89, 182, 0.15)';
    ctx.beginPath();
    ctx.roundRect(350, 450, 200, 35, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#9b59b6';
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillText('← BACK', 450, 475);
    window._tournamentBackBtn = { x: 350, y: 450, w: 200, h: 35 };
    ctx.restore();
}

function drawTeamSelection() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText('SELECT YOUR TEAM', 450, 55);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('Choose the team you want to control in the tournament', 450, 85);

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
        ctx.fillStyle = isSelected ? 'rgba(241, 196, 15, 0.2)' : 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 8);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#f1c40f' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();
        ctx.font = '22px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(team.flag || '⚽', x + cardW / 2, y + 26);
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

    ctx.fillStyle = tournamentSelectedTeam !== null ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(280, 520, 340, 45, 12);
    ctx.fill();
    ctx.strokeStyle = tournamentSelectedTeam !== null ? '#2ecc71' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = tournamentSelectedTeam !== null ? '#2ecc71' : 'rgba(255,255,255,0.2)';
    ctx.font = '700 20px Outfit, sans-serif';
    ctx.shadowColor = tournamentSelectedTeam !== null ? '#2ecc71' : 'transparent';
    ctx.shadowBlur = tournamentSelectedTeam !== null ? 15 : 0;
    ctx.fillText('✅ CONFIRM TEAM', 450, 548);
    ctx.shadowBlur = 0;
    window._tournamentConfirmBtn = { x: 280, y: 520, w: 340, h: 45 };

    ctx.fillStyle = 'rgba(155, 89, 182, 0.15)';
    ctx.beginPath();
    ctx.roundRect(350, 570, 200, 25, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#9b59b6';
    ctx.font = '700 14px Outfit, sans-serif';
    ctx.fillText('← BACK', 450, 588);
    window._tournamentSelectBackBtn = { x: 350, y: 570, w: 200, h: 25 };
    ctx.restore();
}

function drawGroupStage() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    const progress = TournamentManager.getProgress();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px Outfit, sans-serif';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillText('📊 GROUP STAGE', 450, 45);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
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
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
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
            const flag = team ? team.flag : '❓';
            const name = team ? (team.name.length > 8 ? team.name.slice(0, 8) : team.name) : '???';
            ctx.fillText(`${flag} ${name}`, x + 6, yPos + 8);
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
                ctx.fillText(`❌ YOU ARE OUT! 🏆 ${champion.flag} ${champion.name} WON!`, 450, 548);
            } else {
                ctx.fillText('❌ YOU ARE OUT OF THE WORLD CUP', 450, 548);
            }
            ctx.shadowBlur = 0;
            window._tournamentOutBtn = { x: 250, y: 520, w: 400, h: 50 };
        }
    } else if (nextMatch) {
        // Player has a match to play
        ctx.fillStyle = 'rgba(46, 204, 113, 0.2)';
        ctx.beginPath();
        ctx.roundRect(250, 520, 400, 50, 14);
        ctx.fill();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#2ecc71';
        ctx.font = '700 18px Outfit, sans-serif';
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 15;
        const matchInfo = nextMatch.type === 'group' ? 'GROUP MATCH' : 'KNOCKOUT';
        const teamAName = nextMatch.teamA ? nextMatch.teamA.name : 'TBD';
        const teamBName = nextMatch.teamB ? nextMatch.teamB.name : 'TBD';
        ctx.fillText(`⚽ PLAY ${matchInfo}: ${teamAName} vs ${teamBName}`, 450, 548);
        ctx.shadowBlur = 0;
        window._tournamentPlayMatchBtn = { x: 250, y: 520, w: 400, h: 50 };
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

    // Back button
    ctx.fillStyle = 'rgba(155, 89, 182, 0.15)';
    ctx.beginPath();
    ctx.roundRect(350, 575, 200, 22, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#9b59b6';
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.fillText('← BACK', 450, 591);
    window._tournamentGroupBackBtn = { x: 350, y: 575, w: 200, h: 22 };
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
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px Outfit, sans-serif';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText(`🏆 ${currentRoundName}`, 450, 45);
    ctx.shadowBlur = 0;

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
    let buttonY = startY + totalHeight + 55;

    if (nextMatch && !isComplete && !isEliminated) {
        const teamAName = nextMatch.teamA ? nextMatch.teamA.name : 'TBD';
        const teamBName = nextMatch.teamB ? nextMatch.teamB.name : 'TBD';
        
        ctx.fillStyle = 'rgba(46, 204, 113, 0.25)';
        ctx.beginPath();
        ctx.roundRect(250, buttonY, 400, 45, 14);
        ctx.fill();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#2ecc71';
        ctx.font = '700 18px Outfit, sans-serif';
        ctx.shadowColor = '#2ecc71';
        ctx.shadowBlur = 20;
        ctx.fillText(`⚽ PLAY: ${teamAName} vs ${teamBName}`, 450, buttonY + 30);
        ctx.shadowBlur = 0;
        window._tournamentPlayMatchBtn = { x: 250, y: buttonY, w: 400, h: 45 };
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
            ctx.fillText(`🏆 ${champion.flag} ${champion.name} ARE CHAMPIONS!`, 450, buttonY + 30);
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
    ctx.fillText(`${teamA.flag} ${nameA}`, x + 6, y + 15);

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
    ctx.fillText(`${teamB.flag} ${nameB}`, x + 6, y + height - 4);

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
    ctx.fillText(`${teamA.flag} ${nameA}`, x + 4, y + 12);

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
    ctx.fillText(`${teamB.flag} ${nameB}`, x + 4, y + height - 3);

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
    ctx.textAlign = 'center';

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

    ctx.fillStyle = titleColor;
    ctx.font = '900 48px Outfit, sans-serif';
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 25;
    ctx.fillText(titleText, 450, 100);
    ctx.shadowBlur = 0;

    if (matchResult) {
        const teamA = matchResult.teamA || { name: 'Unknown', flag: '❓' };
        const teamB = matchResult.teamB || { name: 'Unknown', flag: '❓' };
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 52px Outfit, sans-serif';
        ctx.fillText(`${teamA.flag} ${matchResult.scoreA} - ${matchResult.scoreB} ${teamB.flag}`, 450, 200);
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
        ctx.fillText(`🏆 Champion: ${champion.flag} ${champion.name}`, 450, 350);
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
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 32px Outfit, sans-serif';
        ctx.fillText(`${champion.flag} ${champion.name}`, 450, 290);
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

    ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
    ctx.beginPath();
    ctx.roundRect(300, 430, 300, 50, 14);
    ctx.fill();
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#9b59b6';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.shadowColor = '#9b59b6';
    ctx.shadowBlur = 15;
    ctx.fillText('🏠 RETURN TO MENU', 450, 465);
    ctx.shadowBlur = 0;
    window._tournamentReturnBtn = { x: 300, y: 430, w: 300, h: 50 };
    ctx.restore();
}

function draw() {
    try {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.translate(screenShake.x, screenShake.y);

        if (currentState === 'MENU') {
            drawMenuBackground();
            ctx.save();
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 25;
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 58px Outfit, sans-serif';
            ctx.fillText('PRO STRIKER', 450, 130);
            ctx.restore();
            const options = [
                { key: '[ 1 ]', label: '1 VS 1 MATCH', y: 230, color: '#2ecc71' },
                { key: '[ 2 ]', label: 'VS COMPUTER', y: 285, color: '#00d2d3' },
                { key: '[ 3 ]', label: 'INSTRUCTIONS', y: 340, color: '#ff9f43' },
                { key: '[ 4 ]', label: 'SETTINGS', y: 395, color: '#ee5253' },
                { key: '[ 5 ]', label: 'STATS', y: 450, color: '#9b59b6' },
                { key: '[ 6 ]', label: '⭐ TOURNAMENT', y: 505, color: '#f1c40f' }
            ];
            for (let opt of options) {
                ctx.save();
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.beginPath();
                ctx.roundRect(280, opt.y - 28, 340, 44, 12);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.font = '900 16px Outfit, sans-serif';
                ctx.fillStyle = opt.color;
                ctx.shadowColor = opt.color;
                ctx.shadowBlur = 8;
                ctx.textAlign = 'left';
                ctx.fillText(opt.key, 305, opt.y + 3);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(opt.label, 375, opt.y + 3);
                ctx.restore();
            }
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '600 12px Outfit, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`🎵${SoundManager.musicEnabled ? 'ON' : 'OFF'} 🔊${SoundManager.sfxEnabled ? 'ON' : 'OFF'} [M:SFX] [N:Music]`, 870, 580);
            ctx.restore();
            ctx.restore();
            return;
        }

        if (currentState === 'DIFFICULTY_SELECT') {
            drawDifficultySelect();
            return;
        }

        if (currentState === 'INSTRUCTIONS' || currentState === 'SETTINGS') {
            drawMenuBackground();
            ctx.textAlign = 'center';
            if (currentState === 'INSTRUCTIONS') {
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 36px Outfit, sans-serif';
                ctx.fillText('📖 HOW TO PLAY', 450, 70);
                const cards = [
                    { title: '🎮 CONTROLS', y: 140,
                    lines: isMobileDevice ?
                    ['RED: Left Joystick + ⚽ Shoot', 'BLUE: Right Joystick + ⚽ Shoot'] :
                    ['RED: WASD | SPACE to Shoot', 'BLUE: ⬆⬇⬅➡ | ENTER to Shoot'] },
                    { title: '⚽ RULES', y: 280,
                    lines: [`Two ${halfDuration}s halves`, 'Most goals wins!', 'GK holds ball for 6s max'] },
                    { title: '💡 TIPS', y: 420,
                    lines: ['Pass to open teammates', 'Shoot from close range', 'Eject from GK on block'] }
                ];
                cards.forEach((card, idx) => {
                    const cx = 150 + idx * 220, cy = card.y;
                    ctx.fillStyle = 'rgba(255,255,255,0.04)';
                    ctx.beginPath();
                    ctx.roundRect(cx-90, cy-20, 180, 110, 14);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = '700 18px Outfit, sans-serif';
                    ctx.fillText(card.title, cx, cy + 10);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '600 14px Outfit, sans-serif';
                    card.lines.forEach((line, i) => {
                        ctx.fillText(line, cx, cy + 40 + i * 24);
                    });
                });
                ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
                ctx.beginPath();
                ctx.roundRect(350, 530, 200, 40, 12);
                ctx.fill();
                ctx.strokeStyle = '#9b59b6';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#9b59b6';
                ctx.font = '700 18px Outfit, sans-serif';
                ctx.fillText('← BACK', 450, 558);
                window._backBtn = { x: 350, y: 530, w: 200, h: 40 };
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.font = '600 12px Outfit, sans-serif';
                ctx.fillText('Press ESC or tap BACK to return', 450, 590);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 36px Outfit, sans-serif';
                ctx.fillText('⚙️ SETTINGS', 450, 70);
                const cardX = 200, cardY = 120, cardW = 500, cardH = 280;
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 20);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = '#f1c40f';
                ctx.font = '700 22px Outfit, sans-serif';
                ctx.fillText('⏱️ HALF DURATION', 450, 170);
                ctx.fillStyle = '#ffffff';
                ctx.font = '800 40px Outfit, sans-serif';
                ctx.fillText(`${halfDuration}s`, 450, 235);
                const sliderX = 280, sliderY = 270, sliderW = 340, sliderH = 8;
                const knobRadius = 16;
                const minVal = 15, maxVal = 120, step = 5;
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
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '600 16px Outfit, sans-serif';
                ctx.fillText('🔊 SOUND CONTROLS', 450, 340);
                const toggleY = 360;
                ctx.fillStyle = SoundManager.musicEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)';
                ctx.beginPath();
                ctx.roundRect(320, toggleY, 180, 45, 12);
                ctx.fill();
                ctx.strokeStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
                ctx.font = '700 18px Outfit, sans-serif';
                ctx.fillText(`🎵 ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`, 410, 393);
                window._musicBtn = { x: 320, y: toggleY, w: 180, h: 45 };
                ctx.fillStyle = SoundManager.sfxEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)';
                ctx.beginPath();
                ctx.roundRect(520, toggleY, 180, 45, 12);
                ctx.fill();
                ctx.strokeStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
                ctx.font = '700 18px Outfit, sans-serif';
                ctx.fillText(`🔊 ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`, 610, 393);
                window._sfxBtn = { x: 520, y: toggleY, w: 180, h: 45 };
                ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
                ctx.beginPath();
                ctx.roundRect(350, 430, 200, 45, 12);
                ctx.fill();
                ctx.strokeStyle = '#9b59b6';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#9b59b6';
                ctx.font = '700 18px Outfit, sans-serif';
                ctx.fillText('← BACK', 450, 460);
                window._backBtn = { x: 350, y: 430, w: 200, h: 45 };
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.font = '600 12px Outfit, sans-serif';
                ctx.fillText('Drag the knob or use ⬆ ⬇ keys', 450, 500);
            }
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '500 12px Outfit, sans-serif';
            ctx.fillText('Press ESC or tap BACK to return', 450, 580);
            ctx.restore();
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
                let pGrad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
                pGrad.addColorStop(0, p.color);
                pGrad.addColorStop(1, p.gradColor);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = pGrad;
                ctx.fill();
                ctx.lineWidth = p.isGk ? 3 : 2;
                ctx.strokeStyle = p.isGk ? '#f1c40f' : '#ffffff';
                ctx.stroke();
                drawStar(p.x, p.y, 5, 8, 3.5);
            }
            for (let post of posts) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.beginPath();
                ctx.ellipse(post.x, post.y + 4, post.radius, post.radius * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                let postGrad = ctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
                postGrad.addColorStop(0, '#ffffff');
                postGrad.addColorStop(1, '#bdc3c7');
                ctx.beginPath();
                ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
                ctx.fillStyle = postGrad;
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#2c3e50';
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(ball.x, ball.y + ball.radius * 0.7, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#1e272e';
            ctx.stroke();
            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2);
            ctx.fill();
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
            let pGrad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
            pGrad.addColorStop(0, p.color);
            pGrad.addColorStop(1, p.gradColor);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = pGrad;
            ctx.fill();
            ctx.lineWidth = p.isGk ? 3 : 2;
            ctx.strokeStyle = p.isGk ? '#f1c40f' : '#ffffff';
            ctx.stroke();
            drawStar(p.x, p.y, 5, 8, 3.5);
        }

        for (let post of posts) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(post.x, post.y + 4, post.radius, post.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            let postGrad = ctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
            postGrad.addColorStop(0, '#ffffff');
            postGrad.addColorStop(1, '#bdc3c7');
            ctx.beginPath();
            ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
            ctx.fillStyle = postGrad;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#2c3e50';
            ctx.stroke();
        }

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

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#1e272e';
        ctx.stroke();
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2);
        ctx.fill();

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
