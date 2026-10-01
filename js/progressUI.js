// ===== PRO STRIKER - progressUI.js =====
// Rendering + input for the PROGRESS hub screen (currentState === 'PROGRESS').
// Pure presentation layer: all data/logic lives in Progress (progress.js).
// This file only reads Progress's public API and draws it, using the exact
// same visual language as the rest of the menu (drawGlassPanel/drawGlowTitle/
// drawPillButton/hexToRgba from renderer.js) so it looks native, not bolted on.
//
// Three tabs, one screen: CAREER / CHALLENGES / TROPHIES. Tab switching and
// the Back button are the only interactive chrome here; each tab's content
// is otherwise read-only except the CHALLENGES tab's per-row Claim buttons.

const ProgressUI = {
    _tab: 0,                      // 0=career, 1=challenges, 2=trophies
    _tabs: ['CAREER', 'CHALLENGES', 'TROPHIES'],
    _claimBtns: [],                // rebuilt every draw of the challenges tab

    open() { this._tab = 0; },
    cycleTab(dir) { this._tab = (this._tab + dir + this._tabs.length) % this._tabs.length; },

    // ---------- shared chrome: title, tab bar, back button ----------
    _drawChrome() {
        drawMenuBackground();
        ctx.save();
        ctx.textAlign = 'center';
        drawGlowTitle('📊 PROGRESS', 450, 62, '#00e5ff', 32);

        const tabW = 160, tabH = 38, gap = 10;
        const totalW = this._tabs.length * tabW + (this._tabs.length - 1) * gap;
        const startX = 450 - totalW / 2, y = 90;
        window._progressTabBtns = [];
        this._tabs.forEach((label, i) => {
            const x = startX + i * (tabW + gap);
            drawPillButton(x, y, tabW, tabH, label, '#00e5ff', { active: i === this._tab, fontSize: 14 });
            window._progressTabBtns.push({ x, y, w: tabW, h: tabH, index: i });
        });

        drawPillButton(350, 545, 200, 42, '← BACK', '#9b59b6', { fontSize: 16 });
        window._backBtn = { x: 350, y: 545, w: 200, h: 42 };
        ctx.restore();
    },

    draw() {
        this._drawChrome();
        ctx.save();
        if (this._tab === 0) this._drawCareer();
        else if (this._tab === 1) this._drawChallenges();
        else this._drawTrophies();
        ctx.restore();
    },

    // ---------- tab 0: Career Stats ----------
    _drawCareer() {
        const t = Progress._data().careerTotals;
        const level = Progress._data().level;
        const into = Progress.xpIntoLevel(), need = Progress.xpForNextLevel();
        const pct = Math.max(0, Math.min(1, need > 0 ? into / need : 0));

        // XP / level banner
        drawGlassPanel(150, 142, 600, 62, 16, 'rgba(0,229,255,0.35)');
        ctx.textAlign = 'left';
        ctx.fillStyle = '#00e5ff';
        ctx.font = '800 16px Outfit, sans-serif';
        ctx.fillText('LEVEL ' + level + ' — ' + Progress.levelTitle(), 172, 168);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.fillText(into + ' / ' + need + ' XP', 728, 168);
        // bar track + fill
        const barX = 172, barY = 176, barW = 556, barH = 10;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 5); ctx.fill();
        if (pct > 0) {
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath(); ctx.roundRect(barX, barY, Math.max(barH, barW * pct), barH, 5); ctx.fill();
        }

        // Stat grid: two columns of labeled values, reusing the STATS screen's
        // card language (drawGlassPanel) rather than a plain table.
        const stats = [
            ['Matches Played', t.matchesPlayed],
            ['Wins / Draws / Losses', t.wins + ' / ' + t.draws + ' / ' + t.losses],
            ['Goals Scored', t.goalsScored],
            ['Goals Conceded', t.goalsConceded],
            ['Clean Sheets', t.cleanSheets],
            ['World Class Wins', t.worldClassWins],
            ['Tournaments Played', t.tournamentsPlayed],
            ['Tournaments Won', t.tournamentsWon],
            ['Best Win Streak', (typeof Shop !== 'undefined' && Shop.streakBest) ? Shop.streakBest() : 0],
            ['Lifetime Coins Earned', t.coinsEarnedLifetime]
        ];
        const colW = 290, rowH = 40, startY = 224, gapX = 20;
        const col0X = 450 - colW - gapX / 2, col1X = 450 + gapX / 2;
        stats.forEach(([label, value], i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = col === 0 ? col0X : col1X, y = startY + row * rowH;
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = '500 12px Outfit, sans-serif';
            ctx.fillText(label, x, y);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 15px Outfit, sans-serif';
            ctx.fillText(String(value), x + colW, y);
            ctx.beginPath();
            ctx.moveTo(x, y + 8); ctx.lineTo(x + colW, y + 8);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
        });
    },

    // ---------- tab 1: Daily Challenges ----------
    _drawChallenges() {
        const list = Progress.todaysChallenges();
        this._claimBtns = [];
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '500 12px Outfit, sans-serif';
        ctx.fillText('Resets daily — 3 challenges, any mode counts unless noted', 450, 158);

        const rowH = 92, startY = 176, x = 190, w = 520;
        list.forEach((c, i) => {
            const y = startY + i * (rowH + 14);
            const accent = c.claimed ? 'rgba(255,255,255,0.15)' : (c.complete ? 'rgba(46,204,113,0.6)' : 'rgba(0,229,255,0.3)');
            drawGlassPanel(x, y, w, rowH, 16, accent);

            ctx.textAlign = 'left';
            ctx.fillStyle = c.claimed ? 'rgba(255,255,255,0.4)' : '#ffffff';
            ctx.font = '800 16px Outfit, sans-serif';
            ctx.fillText(c.label, x + 22, y + 30);

            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = '600 12px Outfit, sans-serif';
            ctx.fillText((c.claimed ? 'Claimed' : c.progress + ' / ' + c.target) + '   ·   Reward: ' + c.reward + ' coins', x + 22, y + 52);

            // progress bar
            const barX = x + 22, barY = y + 64, barW = w - 44 - (c.complete && !c.claimed ? 130 : 0), barH = 8;
            const pct = c.target > 0 ? Math.min(1, c.progress / c.target) : 0;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.fill();
            ctx.fillStyle = c.claimed ? 'rgba(255,255,255,0.25)' : '#2ecc71';
            if (pct > 0) { ctx.beginPath(); ctx.roundRect(barX, barY, Math.max(barH, barW * pct), barH, 4); ctx.fill(); }

            if (c.complete && !c.claimed) {
                const bw = 110, bh = 36, bx = x + w - bw - 18, by = y + rowH / 2 - bh / 2;
                drawPillButton(bx, by, bw, bh, 'CLAIM', '#2ecc71', { fontSize: 14, filled: true });
                this._claimBtns.push({ x: bx, y: by, w: bw, h: bh, id: c.id });
            } else if (c.claimed) {
                ctx.textAlign = 'right';
                ctx.fillStyle = 'rgba(46,204,113,0.8)';
                ctx.font = '800 13px Outfit, sans-serif';
                ctx.fillText('✓ CLAIMED', x + w - 20, y + rowH / 2 + 5);
            }
        });
    },

    // ---------- tab 2: Trophy Cabinet ----------
    _drawTrophies() {
        const list = Progress.trophyList();
        const cols = 4, cardW = 150, cardH = 130, gapX = 14, gapY = 16;
        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = 450 - totalW / 2, startY = 168;
        list.forEach((tr, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            const x = startX + col * (cardW + gapX), y = startY + row * (cardH + gapY);
            drawGlassPanel(x, y, cardW, cardH, 14, tr.earned ? 'rgba(241,196,15,0.55)' : 'rgba(255,255,255,0.08)');

            ctx.save();
            ctx.globalAlpha = tr.earned ? 1 : 0.6;   // locked, but the requirement must stay readable
            ctx.textAlign = 'center';
            ctx.font = '32px Outfit, sans-serif';
            ctx.fillText(tr.earned ? '🏆' : '🔒', x + cardW / 2, y + 46);
            ctx.fillStyle = tr.earned ? '#f1c40f' : 'rgba(255,255,255,0.6)';
            ctx.font = '800 12px Outfit, sans-serif';
            wrapText(tr.name, x + cardW / 2, y + 70, cardW - 16, 14);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '500 9px Outfit, sans-serif';
            wrapText(tr.desc, x + cardW / 2, y + 100, cardW - 20, 11);
            ctx.restore();
        });
    },

    // ---------- input ----------
    // Returns true if the click was handled (so input.js's generic handler
    // doesn't also try to interpret it as something else).
    handleClick(pos) {
        for (const b of (window._progressTabBtns || [])) {
            if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
                this._tab = b.index;
                SoundManager.playSFX('menuClick');
                return true;
            }
        }
        if (this._tab === 1) {
            for (const b of this._claimBtns) {
                if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
                    Progress.claimChallenge(b.id);
                    SoundManager.playSFX('confirm');
                    return true;
                }
            }
        }
        return false;
    }
};

// Small local word-wrap helper (renderer.js has no shared one for
// small multi-line card text) — centered, fixed line height, ctx state
// (font/fillStyle/textAlign) is the caller's responsibility.
function wrapText(text, cx, y, maxWidth, lineHeight) {
    const words = String(text).split(' ');
    let line = '', lines = [];
    for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
        else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
}
