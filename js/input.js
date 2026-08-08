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
    } else if (currentState === 'INSTRUCTIONS' || currentState === 'SETTINGS' || currentState === 'STATS') {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        }
    } else if (currentState === 'SETTINGS') {
        if (e.key === 'ArrowUp') halfDuration = Math.min(120, halfDuration + 5);
        if (e.key === 'ArrowDown') halfDuration = Math.max(15, halfDuration - 5);
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
}

canvas.addEventListener('pointerdown', (e) => {
    initSoundOnInteraction();
    const pos = getCanvasTouchPos(e);

    if (currentState === 'PLAY' && pos.x >= 860 && pos.x <= 890 && pos.y >= 15 && pos.y <= 45) {
        SoundManager.playSFX('menuClick');
        togglePause();
        return;
    }

    if (currentState === 'MENU') {
        if (pos.x >= 280 && pos.x <= 620 && pos.y >= 202 && pos.y <= 246) {
            SoundManager.playSFX('menuClick');
            selectMode('1v1');
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 257 && pos.y <= 301) {
            SoundManager.playSFX('menuClick');
            currentState = 'DIFFICULTY_SELECT';
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 312 && pos.y <= 356) {
            SoundManager.playSFX('menuClick');
            currentState = 'INSTRUCTIONS';
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 367 && pos.y <= 411) {
            SoundManager.playSFX('menuClick');
            currentState = 'SETTINGS';
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 422 && pos.y <= 466) {
            SoundManager.playSFX('menuClick');
            currentState = 'STATS';
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 477 && pos.y <= 521) {
            SoundManager.playSFX('menuClick');
            startTournamentMenu();
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
        const diffBack = window._diffBackBtn || { x: 350, y: 410, w: 200, h: 45 };
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
        if (window._teamSelectBtns) {
            const scrollOffset = window._teamScrollOffset || 0;
            for (let btn of window._teamSelectBtns) {
                const visibleY = btn.y - scrollOffset;
                if (pos.x >= btn.x && pos.x <= btn.x + btn.w &&
                    pos.y >= visibleY && pos.y <= visibleY + btn.h) {
                    selectTeamById(btn.teamId);
                    SoundManager.playSFX('menuClick', 0.3);
                    return; // ✅ Prevents ghost-click
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
            SoundManager.playSFX('menuClick');
            currentState = 'TOURNAMENT_MENU';
            updateTouchUI();
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
    const pos = getCanvasTouchPos(e);
    if (isDraggingSlider && currentState === 'SETTINGS') {
        updateSliderFromPointer(pos.x);
    }
    pauseButton.hover = (pos.x >= 860 && pos.x <= 890 && pos.y >= 15 && pos.y <= 45);
});

window.addEventListener('pointerup', () => {
    isDraggingSlider = false;
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

function updateTouchUI() {
    if (currentState === 'PLAY' && isMobileDevice) {
        touchControlsElem.style.display = 'block';
        touchControlsElem.className = 'touch-controls is-active mode-' + gameMode;
    } else {
        touchControlsElem.style.display = 'none';
    }
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
    const press = (e) => {
        e.preventDefault();
        initSoundOnInteraction();
        keys[keyName] = true;
        if (ball.owner && !ball.owner.isGk) {
            shootBall(ball.owner);
            keys[keyName] = false;
        }
    };
    btnElem.addEventListener('touchstart', press, { passive: false });
    btnElem.addEventListener('mousedown', press);
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