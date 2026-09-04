// ===== PRO STRIKER - input.js =====
console.log('[ProStriker] input.js loaded');

window.addEventListener('keydown', (e) => {
    initSoundOnInteraction();
    if ([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'p', 'P', 'Shift'].includes(e.key)) {
        e.preventDefault();
    }
    const keyLower = e.key.toLowerCase();
    if (keyLower === ' ' || e.code === 'Space') keys.space = true;
    if (e.key === 'Enter') keys.enter = true;
    if (e.key === 'Escape') keys.Escape = true;
    if (e.key === 'Shift') keys.Shift = true;
    if (keyLower === 'p') keys.p = true;
    if (keys.hasOwnProperty(keyLower) && keyLower !== ' ' && keyLower !== 'p' && keyLower !== 'shift') {
        keys[keyLower] = true;
    }
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    if (keyLower === 'p' && currentState === 'PLAY') togglePause();
    if (e.key === 'Escape' && currentState === 'PAUSED') togglePause();
    if (keyLower === 'm') { SoundManager.toggleSFX(); SoundManager.playSFX('menuClick', 0.3); updateTouchUI(); }
    if (keyLower === 'n') { SoundManager.toggleMusic(); SoundManager.playSFX('menuClick', 0.3); updateTouchUI(); }

    // Keyboard support for the exit-tournament confirm overlay: Escape cancels
    // (stays in the tournament), Enter confirms (same as tapping YES).
    if (window._confirmExitTournament) {
        if (e.key === 'Escape') {
            window._confirmExitTournament = false;
            SoundManager.playSFX('menuClick');
        } else if (e.key === 'Enter') {
            window._confirmExitTournament = false;
            tournamentMode = false;
            currentState = 'MENU';
            SoundManager.playSFX('menuClick');
            updateTouchUI();
        }
        return;
    }

    if (currentState === 'MENU') {
        if (e.key === '1') { SoundManager.playSFX('menuClick'); selectMode('1v1'); }
        if (e.key === '2') { SoundManager.playSFX('menuClick'); currentState = 'DIFFICULTY_SELECT'; }
        if (e.key === '3') { SoundManager.playSFX('menuClick'); currentState = 'INSTRUCTIONS'; }
        if (e.key === '4') { SoundManager.playSFX('menuClick'); currentState = 'SETTINGS'; }
        if (e.key === '5') { SoundManager.playSFX('menuClick'); currentState = 'STATS'; }
        if (e.key === '6') { SoundManager.playSFX('menuClick'); startTournamentMenu(); }
    } else if (currentState === 'DIFFICULTY_SELECT') {
        if (e.key === 'e' || e.key === 'E') { SoundManager.playSFX('confirm'); difficulty = 'EASY'; selectMode('pve'); }
        if (e.key === 'm' || e.key === 'M') { SoundManager.playSFX('confirm'); difficulty = 'MEDIUM'; selectMode('pve'); }
        if (e.key === 'h' || e.key === 'H') { SoundManager.playSFX('confirm'); difficulty = 'HARD'; selectMode('pve'); }
        if (e.key === 'i' || e.key === 'I') { SoundManager.playSFX('confirm'); difficulty = 'ELITE'; selectMode('pve'); }
        if (e.key === 'w' || e.key === 'W') { SoundManager.playSFX('confirm'); difficulty = 'WORLD_CLASS'; selectMode('pve'); }
        if (e.key === 'Escape' || e.key === 'Backspace') { SoundManager.playSFX('menuClick'); currentState = 'MENU'; }
    } else if (currentState === 'SETTINGS') {
        // BUGFIX: SETTINGS used to be caught by the combined
        // "INSTRUCTIONS || SETTINGS || STATS" branch above (which only handled
        // Escape/Backspace), so this dedicated branch's ArrowUp/ArrowDown half-
        // duration keys could never run — that `else if` was unreachable dead
        // code. SETTINGS now gets its own branch with both Escape/Backspace AND
        // the arrow-key duration controls.
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        }
        if (e.key === 'ArrowUp') halfDuration = Math.min(120, halfDuration + 5);
        if (e.key === 'ArrowDown') halfDuration = Math.max(15, halfDuration - 5);
    } else if (currentState === 'INSTRUCTIONS' || currentState === 'STATS') {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        }
    } else if (currentState === 'MATCH_END') {
    if (e.key === 'Enter') {  // Only Enter works now
        SoundManager.playSFX('menuClick');
        if (tournamentMode && tournamentPendingMatch) {
            // Already handled in main.js update
        } else {
            currentState = 'MENU';
        }
    }
} else if (currentState === 'TOURNAMENT_MENU') {
        if (e.key === 'Enter') { startTeamSelection(); }
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            tournamentMode = false;
            currentState = 'MENU';
        }
    } else if (currentState === 'TOURNAMENT_TEAM_SELECT') {
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 0 && num <= 9) {
            const idx = num === 0 ? 9 : num - 1;
            selectTeamByIndex(idx);
        }
        if (e.key === 'Enter') { confirmTeamSelection(); }
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = 'TOURNAMENT_MENU';
        }
    } else if (currentState === 'TOURNAMENT_GROUP_STAGE') {
        if (e.key === 'Enter') { 
            if (TournamentManager.groupStageComplete && TournamentManager.didPlayerQualify()) {
                currentState = 'TOURNAMENT_BRACKET';
                TournamentManager.prepareKnockoutRound();
                updateTouchUI();
            } else {
                playNextTournamentMatch();
            }
        }
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = 'TOURNAMENT_MENU';
        }
    } else if (currentState === 'TOURNAMENT_BRACKET') {
        if (e.key === 'Enter') { playNextTournamentMatch(); }
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = TournamentManager.groupStageComplete ? 'TOURNAMENT_GROUP_STAGE' : 'TOURNAMENT_MENU';
        }
    } else if (currentState === 'TOURNAMENT_RESULT') {
        if (e.key === 'Enter' || e.key === ' ') { continueAfterTournamentMatch(); }
    } else if (currentState === 'TOURNAMENT_CHAMPION') {
        if (e.key === 'Enter' || e.key === ' ') {
            SoundManager.playSFX('menuClick');
            tournamentMode = false;
            currentState = 'MENU';
        }
    }
    updateTouchUI();
});

window.addEventListener('keyup', (e) => {
    const keyLower = e.key.toLowerCase();
    if (keyLower === ' ' || e.code === 'Space') keys.space = false;
    if (e.key === 'Enter') keys.enter = false;
    if (e.key === 'Escape') keys.Escape = false;
    if (e.key === 'Shift') keys.Shift = false;
    if (keyLower === 'p') keys.p = false;
    if (keys.hasOwnProperty(keyLower) && keyLower !== ' ' && keyLower !== 'p' && keyLower !== 'shift') {
        keys[keyLower] = false;
    }
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

function getCanvasTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const scaleX = GAME_W / rect.width;
    const scaleY = GAME_H / rect.height;
    return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
}

canvas.addEventListener('pointerdown', (e) => {
    initSoundOnInteraction();
    const pos = getCanvasTouchPos(e);

    // ===== EXIT-TOURNAMENT CONFIRMATION OVERLAY =====
    // Intercepts all clicks while the "are you sure?" overlay (added as a
    // bugfix for the old one-tap-and-you're-out group stage exit) is open,
    // so nothing underneath it can be accidentally triggered.
    if (window._confirmExitTournament) {
        const yesBtn = window._confirmExitYesBtn;
        const noBtn = window._confirmExitNoBtn;
        if (yesBtn && pos.x >= yesBtn.x && pos.x <= yesBtn.x + yesBtn.w &&
            pos.y >= yesBtn.y && pos.y <= yesBtn.y + yesBtn.h) {
            SoundManager.playSFX('menuClick');
            window._confirmExitTournament = false;
            tournamentMode = false;
            currentState = 'MENU';
            updateTouchUI();
            return;
        }
        if (noBtn && pos.x >= noBtn.x && pos.x <= noBtn.x + noBtn.w &&
            pos.y >= noBtn.y && pos.y <= noBtn.y + noBtn.h) {
            SoundManager.playSFX('menuClick');
            window._confirmExitTournament = false;
            return;
        }
        // Click landed outside both buttons — treat as "cancel", don't
        // fall through to whatever's underneath the overlay.
        return;
    }

    if (currentState === 'PLAY' && pos.x >= 860 && pos.x <= 890 && pos.y >= 15 && pos.y <= 45) {
        SoundManager.playSFX('menuClick');
        togglePause();
        return;
    }

    if (currentState === 'MENU') {

        const buttons = window._menuButtons || [];

        for (let i = 0; i < buttons.length; i++) {

            const btn = buttons[i];

            if (
                pos.x >= btn.x &&
                pos.x <= btn.x + btn.w &&
                pos.y >= btn.y &&
                pos.y <= btn.y + btn.h
            ) {

                SoundManager.playSFX(
                    'menuClick'
                );

                switch (i) {
                    case 0:
                        selectMode('1v1');
                        break;

                    case 1:
                        currentState =
                            'DIFFICULTY_SELECT';
                        break;

                    case 2:
                        currentState =
                            'INSTRUCTIONS';
                        break;

                    case 3:
                        currentState =
                            'SETTINGS';
                        break;

                    case 4:
                        currentState =
                            'STATS';
                        break;

                    case 5:
                        startTournamentMenu();
                        break;
                }

                return;
            }
        }
    } else if (currentState === 'DIFFICULTY_SELECT') {
        if (window._difficultyBtns) {
            for (let btn of window._difficultyBtns) {
                if (pos.x >= btn.x && pos.x <= btn.x + btn.w && 
                    pos.y >= btn.y && pos.y <= btn.y + btn.h) {
                    SoundManager.playSFX('confirm');
                    difficulty = btn.key;
                    selectMode('pve');
                    return;
                }
            }
        }
        const diffBack = window._diffBackBtn || { x: 350, y: 425, w: 200, h: 45 };
        if (pos.x >= diffBack.x && pos.x <= diffBack.x + diffBack.w && 
            pos.y >= diffBack.y && pos.y <= diffBack.y + diffBack.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        }
    } else if (currentState === 'SETTINGS') {
        const rect = window._sliderRect;
        if (rect && pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h) {
            isDraggingSlider = true;
            updateSliderFromPointer(pos.x);
            return;
        }
        const music = window._musicBtn;
        if (music && pos.x >= music.x && pos.x <= music.x + music.w && pos.y >= music.y && pos.y <= music.y + music.h) {
            SoundManager.toggleMusic();
            SoundManager.playSFX('menuClick', 0.3);
            return;
        }
        const sfx = window._sfxBtn;
        if (sfx && pos.x >= sfx.x && pos.x <= sfx.x + sfx.w && pos.y >= sfx.y && pos.y <= sfx.y + sfx.h) {
            SoundManager.toggleSFX();
            SoundManager.playSFX('menuClick', 0.3);
            return;
        }
        const back = window._backBtn;
        if (back && pos.x >= back.x && pos.x <= back.x + back.w && pos.y >= back.y && pos.y <= back.y + back.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
            return;
        }
    } else if (currentState === 'INSTRUCTIONS' || currentState === 'STATS') {
        const back = window._backBtn;
        if (back && pos.x >= back.x && pos.x <= back.x + back.w && pos.y >= back.y && pos.y <= back.y + back.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
            return;
        }
    } else if (currentState === 'PAUSED') {
        const resumeBtn = { x: 350, y: 235, w: 200, h: 50 };
        const menuBtn = { x: 350, y: 295, w: 200, h: 50 };
        const musicToggleBtn = { x: 330, y: 385, w: 110, h: 35 };
        const sfxToggleBtn = { x: 460, y: 385, w: 110, h: 35 };
        if (pos.x >= resumeBtn.x && pos.x <= resumeBtn.x + resumeBtn.w && pos.y >= resumeBtn.y && pos.y <= resumeBtn.y + resumeBtn.h) {
            SoundManager.playSFX('menuClick');
            togglePause();
        } else if (pos.x >= menuBtn.x && pos.x <= menuBtn.x + menuBtn.w && pos.y >= menuBtn.y && pos.y <= menuBtn.y + menuBtn.h) {
            SoundManager.playSFX('menuClick');
            if (tournamentMode) { currentState = 'TOURNAMENT_MENU'; }
            else { currentState = 'MENU'; }
            updateTouchUI();
        } else if (pos.x >= musicToggleBtn.x && pos.x <= musicToggleBtn.x + musicToggleBtn.w && pos.y >= musicToggleBtn.y && pos.y <= musicToggleBtn.y + musicToggleBtn.h) {
            SoundManager.toggleMusic();
            SoundManager.playSFX('menuClick', 0.3);
        } else if (pos.x >= sfxToggleBtn.x && pos.x <= sfxToggleBtn.x + sfxToggleBtn.w && pos.y >= sfxToggleBtn.y && pos.y <= sfxToggleBtn.y + sfxToggleBtn.h) {
            SoundManager.toggleSFX();
            SoundManager.playSFX('menuClick', 0.3);
        }
    } else if (currentState === 'MATCH_END') {
        SoundManager.playSFX('menuClick');
        if (tournamentMode && tournamentPendingMatch) {
            // Handled in update loop
        } else {
            currentState = 'MENU';
        }
    } else if (currentState === 'TOURNAMENT_MENU') {
        const startBtn = window._tournamentStartBtn;
        if (startBtn && pos.x >= startBtn.x && pos.x <= startBtn.x + startBtn.w && pos.y >= startBtn.y && pos.y <= startBtn.y + startBtn.h) {
            SoundManager.playSFX('confirm');
            startTeamSelection();
        }
        const backBtn = window._tournamentBackBtn;
        if (backBtn && pos.x >= backBtn.x && pos.x <= backBtn.x + backBtn.w && pos.y >= backBtn.y && pos.y <= backBtn.y + backBtn.h) {
            SoundManager.playSFX('menuClick');
            tournamentMode = false;
            currentState = 'MENU';
        }
    } else if (currentState === 'TOURNAMENT_TEAM_SELECT') {
        // On touch, don't select the card yet — every finger-down that begins a
        // scroll swipe also lands on top of some card, so selecting immediately
        // on pointerdown made the grid feel like it couldn't be scrolled. We just
        // remember which card is under the finger and only confirm the tap in
        // the touchend handler further down, once we know it wasn't a drag.
        // Mouse clicks (desktop/laptop) aren't affected by this and still select
        // instantly, since there's no drag-to-scroll gesture to conflict with.
        const isTouch = e.pointerType === 'touch';
        window._teamTapCandidate = null;
        if (window._teamSelectBtns) {
            const scrollOffset = window._teamScrollOffset || 0;
            for (let btn of window._teamSelectBtns) {
                const visibleY = btn.y - scrollOffset;
                if (pos.x >= btn.x && pos.x <= btn.x + btn.w &&
                    pos.y >= visibleY && pos.y <= visibleY + btn.h) {
                    if (isTouch) {
                        window._teamTapCandidate = btn.teamId;
                    } else {
                        selectTeamById(btn.teamId);
                        SoundManager.playSFX('menuClick', 0.3);
                        return; // ✅ Prevents ghost-click
                    }
                }
            }
        }
        const confirmBtn = window._tournamentConfirmBtn;
        if (confirmBtn && pos.x >= confirmBtn.x && pos.x <= confirmBtn.x + confirmBtn.w && 
            pos.y >= confirmBtn.y && pos.y <= confirmBtn.y + confirmBtn.h) {
            SoundManager.playSFX('confirm');
            confirmTeamSelection();
        }
        const backBtn = window._tournamentSelectBackBtn;
        if (backBtn && pos.x >= backBtn.x && pos.x <= backBtn.x + backBtn.w && 
            pos.y >= backBtn.y && pos.y <= backBtn.y + backBtn.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'TOURNAMENT_MENU';
        }
    } else if (currentState === 'TOURNAMENT_GROUP_STAGE') {
        const nextRoundBtn = window._tournamentNextRoundBtn;
        if (nextRoundBtn && pos.x >= nextRoundBtn.x && pos.x <= nextRoundBtn.x + nextRoundBtn.w && 
            pos.y >= nextRoundBtn.y && pos.y <= nextRoundBtn.y + nextRoundBtn.h) {
            SoundManager.playSFX('confirm');
            currentState = 'TOURNAMENT_BRACKET';
            TournamentManager.prepareKnockoutRound();
            updateTouchUI();
            return;
        }
        
        const outBtn = window._tournamentOutBtn;
        if (outBtn && pos.x >= outBtn.x && pos.x <= outBtn.x + outBtn.w && 
            pos.y >= outBtn.y && pos.y <= outBtn.y + outBtn.h) {
            SoundManager.playSFX('menuClick');
            if (TournamentManager.isComplete()) {
                currentState = 'TOURNAMENT_CHAMPION';
            } else {
                tournamentMode = false;
                currentState = 'MENU';
            }
            updateTouchUI();
            return;
        }
        
        const playBtn = window._tournamentPlayMatchBtn;
        if (playBtn && pos.x >= playBtn.x && pos.x <= playBtn.x + playBtn.w && 
            pos.y >= playBtn.y && pos.y <= playBtn.y + playBtn.h) {
            SoundManager.playSFX('confirm');
            playNextTournamentMatch();
            return;
        }
        
        const backBtn = window._tournamentGroupBackBtn;
        if (backBtn && pos.x >= backBtn.x && pos.x <= backBtn.x + backBtn.w && 
            pos.y >= backBtn.y && pos.y <= backBtn.y + backBtn.h) {
            // BUGFIX: exiting used to happen instantly on a single tap of a
            // tiny button, silently abandoning an in-progress tournament.
            // Now it opens a confirm overlay (drawn in renderer.js) instead
            // of leaving immediately.
            SoundManager.playSFX('menuClick');
            window._confirmExitTournament = true;
            return;
        }
    } else if (currentState === 'TOURNAMENT_BRACKET') {
        const backBtn = window._tournamentBracketBackBtn;
        if (backBtn && pos.x >= backBtn.x && pos.x <= backBtn.x + backBtn.w && pos.y >= backBtn.y && pos.y <= backBtn.y + backBtn.h) {
            SoundManager.playSFX('menuClick');
            currentState = TournamentManager.groupStageComplete ? 'TOURNAMENT_GROUP_STAGE' : 'TOURNAMENT_MENU';
        }
        const playBtn = window._tournamentPlayMatchBtn;
        if (playBtn && pos.x >= playBtn.x && pos.x <= playBtn.x + playBtn.w && pos.y >= playBtn.y && pos.y <= playBtn.y + playBtn.h) {
            SoundManager.playSFX('confirm');
            playNextTournamentMatch();
            return;
        }
        const champBtn = window._tournamentChampionBtn;
        if (champBtn && pos.x >= champBtn.x && pos.x <= champBtn.x + champBtn.w && pos.y >= champBtn.y && pos.y <= champBtn.y + champBtn.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'TOURNAMENT_CHAMPION';
        }
    } else if (currentState === 'TOURNAMENT_RESULT') {
        const nextBtn = window._tournamentNextMatchBtn || window._tournamentBracketViewBtn || window._tournamentChampionBtn;
        if (nextBtn && pos.x >= nextBtn.x && pos.x <= nextBtn.x + nextBtn.w && pos.y >= nextBtn.y && pos.y <= nextBtn.y + nextBtn.h) {
            SoundManager.playSFX('menuClick');
            continueAfterTournamentMatch();
        }
    } else if (currentState === 'TOURNAMENT_CHAMPION') {
        const returnBtn = window._tournamentReturnBtn;
        if (returnBtn && pos.x >= returnBtn.x && pos.x <= returnBtn.x + returnBtn.w && 
            pos.y >= returnBtn.y && pos.y <= returnBtn.y + returnBtn.h) {
            SoundManager.playSFX('menuClick');
            tournamentMode = false;
            currentState = 'MENU';
            updateTouchUI();
            return;
        }
    }
    updateTouchUI();
});

canvas.addEventListener('pointermove', (e) => {

    const pos =
        getCanvasTouchPos(e);

    // ------------------------------------------------------------
    // MAIN MENU HOVER
    // ------------------------------------------------------------

    if (currentState === 'MENU') {

        const buttons =
            window._menuButtons || [];

        let newHover = -1;

        for (let i = 0; i < buttons.length; i++) {

            const btn = buttons[i];

            if (
                pos.x >= btn.x &&
                pos.x <= btn.x + btn.w &&
                pos.y >= btn.y &&
                pos.y <= btn.y + btn.h
            ) {
                newHover = i;
                break;
            }
        }

        window._menuHoverIndex =
            newHover;

        canvas.style.cursor =
            newHover >= 0
                ? 'pointer'
                : 'default';

    } else {

        window._menuHoverIndex = -1;

        canvas.style.cursor =
            'default';
    }

    // ------------------------------------------------------------
    // SETTINGS SLIDER
    // ------------------------------------------------------------

    if (
        isDraggingSlider &&
        currentState === 'SETTINGS'
    ) {
        updateSliderFromPointer(
            pos.x
        );
    }

    // ------------------------------------------------------------
    // PAUSE BUTTON
    // ------------------------------------------------------------

    pauseButton.hover =
        (
            pos.x >= 860 &&
            pos.x <= 890 &&
            pos.y >= 15 &&
            pos.y <= 45
        );
});

window.addEventListener('pointerup', () => {
    isDraggingSlider = false;
});

canvas.addEventListener('pointerleave', () => {
    window._menuHoverIndex = -1;
    canvas.style.cursor = 'default';
});

function togglePause() {
    if (currentState === 'PLAY') { currentState = 'PAUSED'; SoundManager.playSFX('menuClick'); }
    else if (currentState === 'PAUSED') { currentState = 'PLAY'; SoundManager.playSFX('menuClick'); }
    updateTouchUI();
}

function selectMode(mode) {
    initSoundOnInteraction();
    tournamentMode = false;
    gameMode = mode;
    kickoffTeam = 'red';
    nextKickoffTeam = 'red';
    initMatch();
    currentState = 'PLAY';
    updateTouchUI();
    SoundManager.updateMusicForState(currentState);
}

// Cheap, side-effect-free DOM sync — safe to call every frame. Split out from
// updateTouchUI() below so the per-frame safety net (see gameLoop in main.js)
// doesn't also re-run SoundManager.updateMusicForState() 60x/sec.
function syncTouchControlsVisibility() {
    const inMatch = (currentState === 'PLAY' || currentState === 'PAUSED' || currentState === 'GOAL_SCORED');
    if (inMatch && isMobileDevice) {
        touchControlsElem.style.display = 'block';
        touchControlsElem.className = 'touch-controls is-active mode-' + gameMode;
    } else {
        touchControlsElem.style.display = 'none';
    }
}

function updateTouchUI() {
    // BUGFIX: this used to only check `currentState === 'PLAY'`, so any state
    // transition to MENU/MATCH_END/etc. that forgot to call updateTouchUI()
    // right after (there were several — e.g. tapping "Continue" out of a
    // vs-Computer MATCH_END screen) left the joysticks/shoot buttons stuck on
    // screen from the last match. As a second layer of defense, gameLoop
    // (main.js) now also calls syncTouchControlsVisibility() every frame, so
    // even a future call site that forgets this function can't leave the
    // controls stuck for more than one frame. GOAL_SCORED and PAUSED are also
    // genuinely still "in a match" — the controls should stay visible (though
    // not needed) through a goal celebration or while paused, same as the
    // in-canvas pause button does.
    syncTouchControlsVisibility();
    SoundManager.updateMusicForState(currentState);
}

function updateSliderFromPointer(pointerX) {
    const rect = window._sliderRect;
    if (!rect) return;
    const minVal = 15, maxVal = 120, step = 5;
    let t = (pointerX - rect.x) / rect.w;
    t = Math.max(0, Math.min(1, t));
    let raw = minVal + t * (maxVal - minVal);
    let stepped = Math.round(raw / step) * step;
    halfDuration = Math.max(minVal, Math.min(maxVal, stepped));
}

function startTournamentMenu() {
    tournamentMode = true;
    currentState = 'TOURNAMENT_MENU';
    tournamentFormat = 32;
    tournamentSelectedTeam = null;
    window._teamSelectBtns = [];
    window._tournamentFormatBtns = [];
    // BUGFIX: wipe every tournament button hit-box left over from a
    // previous run. Without this, starting a new tournament right after
    // exiting/finishing one could leave a stale rect (e.g. an old
    // "YOU ARE OUT" button) sitting on screen and silently swallowing taps
    // meant for whatever's drawn in its place this time.
    window._tournamentNextRoundBtn = null;
    window._tournamentOutBtn = null;
    window._tournamentPlayMatchBtn = null;
    window._tournamentChampionBtn = null;
    window._tournamentNextMatchBtn = null;
    window._tournamentBracketViewBtn = null;
    window._confirmExitTournament = false;
    console.log('[Tournament] Menu opened');
}

function startTeamSelection() {
    if (tournamentFormat === 0) return;
    currentState = 'TOURNAMENT_TEAM_SELECT';
    TournamentManager.init(tournamentFormat, null);
    console.log('[Tournament] Team selection started');
}

function selectTeamById(teamId) {
    tournamentSelectedTeam = teamId;
    TournamentManager.selectedTeamId = teamId;
}

function selectTeamByIndex(index) {
    const teams = getCurrentFormatTeams();
    if (index >= 0 && index < teams.length) {
        selectTeamById(teams[index].id);
    }
}

function getCurrentFormatTeams() {
    let teams = [...TOURNAMENT_TEAMS];
    if (tournamentFormat === 16) return teams.slice(0, 16);
    if (tournamentFormat === 8) return teams.filter(t => t.tier === 'WORLD_CLASS').slice(0, 8);
    return teams;
}

function confirmTeamSelection() {
    if (tournamentSelectedTeam === null) return;
    SoundManager.playSFX('confirm');
    TournamentManager.init(tournamentFormat, tournamentSelectedTeam);
    currentState = 'TOURNAMENT_GROUP_STAGE';
    console.log('[Tournament] Team confirmed:', tournamentSelectedTeam);
}

function playNextTournamentMatch() {
    const match = TournamentManager.getPlayerNextMatch();
    if (!match) {
        if (TournamentManager.isComplete()) {
            currentState = 'TOURNAMENT_CHAMPION';
            return;
        }
        if (TournamentManager.groupStageComplete) {
            TournamentManager.simulateKnockoutRound();
        } else {
            // No match found – all matches for this day are already simulated
            // Just advance to next day if complete
            TournamentManager.advanceMatchDayIfComplete();
        }
        const nextMatch = TournamentManager.getPlayerNextMatch();
        if (nextMatch) {
            startTournamentMatch(nextMatch);
        } else if (TournamentManager.isComplete()) {
            currentState = 'TOURNAMENT_CHAMPION';
        }
        return;
    }
    startTournamentMatch(match);
}

// ===== FIXED: Safe team resolution + double simulation removal =====
function startTournamentMatch(match) {
    if (!match) return;
    
    const isGroup = match.type === 'group';
    TournamentManager.markPlayerMatch(
        match.uid,
        isGroup,
        isGroup ? match.groupId : null,
        isGroup ? null : (match.roundIndex !== undefined ? match.roundIndex : match.round)
    );
    
    tournamentPendingMatch = match;
    const playerTeamId = tournamentSelectedTeam;
    
    // ===== FIXED: Safely resolve team objects (handles id: 0 correctly) =====
    let teamAObj, teamBObj;
    
    if (typeof match.teamA === 'object' && match.teamA !== null) {
        teamAObj = match.teamA;
    } else if (match.teamA !== undefined && match.teamA !== null) {
        teamAObj = TOURNAMENT_TEAMS.find(t => t.id === match.teamA);
    }
    
    if (typeof match.teamB === 'object' && match.teamB !== null) {
        teamBObj = match.teamB;
    } else if (match.teamB !== undefined && match.teamB !== null) {
        teamBObj = TOURNAMENT_TEAMS.find(t => t.id === match.teamB);
    }

    // If still not found, log error and return
    if (!teamAObj || !teamBObj) {
        console.error('[Tournament] Could not resolve team objects:', match);
        console.error('teamA:', match.teamA, 'teamB:', match.teamB);
        return;
    }

    let redTeamId, blueTeamId;
    if (teamAObj.id === playerTeamId) {
        redTeamId = teamAObj.id;
        blueTeamId = teamBObj.id;
    } else {
        redTeamId = teamBObj.id;
        blueTeamId = teamAObj.id;
    }
    
    const opponentTeam = teamAObj.id === playerTeamId ? teamBObj : teamAObj;
    const aiTier = opponentTeam ? opponentTeam.tier : 'MEDIUM';
    const aiDifficulty = (typeof TIER_TO_AI !== 'undefined' && TIER_TO_AI[aiTier]) 
        ? TIER_TO_AI[aiTier] 
        : 'MEDIUM';
    
    difficulty = aiDifficulty;
    gameMode = 'pve';
    currentState = 'PLAY';
    initMatch(redTeamId, blueTeamId);
    updateTouchUI();
    SoundManager.updateMusicForState(currentState);
    console.log('[Tournament] Starting match:', redTeamId, 'vs', blueTeamId);
}

// ===== FIXED: Removed duplicate simulateMatchDay() =====
function continueAfterTournamentMatch() {
    if (TournamentManager.isComplete()) {
        currentState = 'TOURNAMENT_CHAMPION';
    } else if (TournamentManager.groupStageComplete) {
        currentState = 'TOURNAMENT_BRACKET';
        TournamentManager.prepareKnockoutRound();
    } else {
        currentState = 'TOURNAMENT_GROUP_STAGE';
        // ❌ REMOVED: TournamentManager.simulateMatchDay();
        // CPU matches are already simulated inside recordPlayerMatchResult!
    }
    SoundManager.updateMusicForState(currentState);
}

function setupJoystick(baseElem, updateKeys) {
    let activeTouchId = null;
    let baseRect = null;
    const stickElem = baseElem.querySelector('.joystick-stick');
    baseElem.addEventListener('touchstart', (e) => {
        e.preventDefault();
        initSoundOnInteraction();
        if (activeTouchId !== null) return;
        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        baseRect = baseElem.getBoundingClientRect();
        handleMove(touch);
    }, { passive: false });
    baseElem.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (activeTouchId === null) return;
        for (let touch of e.changedTouches) {
            if (touch.identifier === activeTouchId) {
                handleMove(touch);
                break;
            }
        }
    }, { passive: false });
    baseElem.addEventListener('touchend', (e) => {
        for (let touch of e.changedTouches) {
            if (touch.identifier === activeTouchId) {
                activeTouchId = null;
                stickElem.style.transform = 'translate(0px, 0px)';
                updateKeys(false, false, false, false);
                break;
            }
        }
    }, { passive: false });
    baseElem.addEventListener('touchcancel', (e) => {
        if (activeTouchId !== null) {
            activeTouchId = null;
            stickElem.style.transform = 'translate(0px, 0px)';
            updateKeys(false, false, false, false);
        }
    }, { passive: false });
    function handleMove(touch) {
        const centerX = baseRect.left + baseRect.width / 2;
        const centerY = baseRect.top + baseRect.height / 2;
        let deltaX = touch.clientX - centerX;
        let deltaY = touch.clientY - centerY;
        const maxDist = 35;
        let dist = Math.hypot(deltaX, deltaY);
        if (dist > maxDist) {
            deltaX = (deltaX / dist) * maxDist;
            deltaY = (deltaY / dist) * maxDist;
        }
        stickElem.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        const threshold = 10;
        const up = deltaY < -threshold;
        const down = deltaY > threshold;
        const left = deltaX < -threshold;
        const right = deltaX > threshold;
        updateKeys(up, down, left, right);
    }
}

setupJoystick(document.getElementById('p1Joystick'), (up, down, left, right) => {
    keys.w = up; keys.s = down; keys.a = left; keys.d = right;
});

setupJoystick(document.getElementById('p2Joystick'), (up, down, left, right) => {
    keys.ArrowUp = up; keys.ArrowDown = down; keys.ArrowLeft = left; keys.ArrowRight = right;
});

function bindShootButton(btnElem, keyName) {
    // Only sets the same key flag the keyboard uses (keys.space for P1/red,
    // keys.enter for P2/blue). main.js's own update loop already checks
    // `ball.owner.team === 'red' && keys.space` (and the blue/enter equivalent)
    // before shooting, so this button can never fire for the wrong team.
    const press = (e) => {
        e.preventDefault();
        initSoundOnInteraction();
        keys[keyName] = true;
    };
    const release = (e) => {
        if (e) e.preventDefault();
        keys[keyName] = false;
    };
    btnElem.addEventListener('touchstart', press, { passive: false });
    btnElem.addEventListener('touchend', release, { passive: false });
    btnElem.addEventListener('touchcancel', release, { passive: false });
    btnElem.addEventListener('mousedown', press);
    btnElem.addEventListener('mouseup', release);
}

bindShootButton(document.getElementById('p1Shoot'), 'space');
bindShootButton(document.getElementById('p2Shoot'), 'enter');

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (currentState === 'TOURNAMENT_TEAM_SELECT') {
        if (typeof window._teamScrollOffset === 'undefined') window._teamScrollOffset = 0;
        window._teamScrollOffset += e.deltaY * 0.5;
        const maxScroll = Math.max(0, (Math.ceil(TOURNAMENT_TEAMS.length / 5) * 66 + 80) - 420);
        if (window._teamScrollOffset > maxScroll) window._teamScrollOffset = maxScroll;
        if (window._teamScrollOffset < 0) window._teamScrollOffset = 0;
    } else if (currentState === 'TOURNAMENT_GROUP_STAGE') {
        if (typeof window._groupScrollOffset === 'undefined') window._groupScrollOffset = 0;
        window._groupScrollOffset += e.deltaY * 0.5;
        const groups = TournamentManager.getAllGroupStandings();
        const totalRows = Math.ceil(groups.length / 4);
        const maxScroll = Math.max(0, (totalRows * 215 + 50) - 420);
        if (window._groupScrollOffset > maxScroll) window._groupScrollOffset = maxScroll;
        if (window._groupScrollOffset < 0) window._groupScrollOffset = 0;
    }
}, { passive: false });
// ===============================
// MOBILE TEAM SELECT SCROLL FIX
// ===============================

let teamScrollTouch = {
    active: false,
    startY: 0,
    startOffset: 0,
    moved: false
};
// How far (in canvas pixels) a touch has to travel before we treat it as a
// scroll drag instead of a tap on a card.
const TEAM_SCROLL_DRAG_THRESHOLD = 8;

canvas.addEventListener('touchstart', (e) => {
    if (currentState !== 'TOURNAMENT_TEAM_SELECT') return;

    // Use the same canvas-space scaling as every other input handler
    // (getCanvasTouchPos) so a finger-drag of N px on screen always scrolls
    // the same visual distance regardless of the canvas's on-screen size.
    const pos = getCanvasTouchPos(e);
    teamScrollTouch.active = true;
    teamScrollTouch.moved = false;
    teamScrollTouch.startY = pos.y;
    teamScrollTouch.startOffset = window._teamScrollOffset || 0;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    if (currentState !== 'TOURNAMENT_TEAM_SELECT') return;
    if (!teamScrollTouch.active) return;

    e.preventDefault();

    const pos = getCanvasTouchPos(e);
    const dy = pos.y - teamScrollTouch.startY;

    if (Math.abs(dy) > TEAM_SCROLL_DRAG_THRESHOLD) {
        teamScrollTouch.moved = true;
        // Once we know this is a scroll, it's not a tap on a card anymore.
        window._teamTapCandidate = null;
    }

    const totalRows = Math.ceil(TOURNAMENT_TEAMS.length / 5);
    const totalHeight = totalRows * 66 + 80;
    const maxScroll = Math.max(0, totalHeight - 420);

    window._teamScrollOffset = teamScrollTouch.startOffset - dy;

    if (window._teamScrollOffset < 0)
        window._teamScrollOffset = 0;

    if (window._teamScrollOffset > maxScroll)
        window._teamScrollOffset = maxScroll;

}, { passive: false });

canvas.addEventListener('touchend', () => {
    if (currentState === 'TOURNAMENT_TEAM_SELECT' && teamScrollTouch.active && !teamScrollTouch.moved) {
        // The finger didn't move enough to count as a scroll, so treat this as
        // a tap and select whatever card was under it (recorded on pointerdown).
        if (window._teamTapCandidate !== null && typeof window._teamTapCandidate !== 'undefined') {
            selectTeamById(window._teamTapCandidate);
            SoundManager.playSFX('menuClick', 0.3);
        }
    }
    teamScrollTouch.active = false;
    teamScrollTouch.moved = false;
    window._teamTapCandidate = null;
});
