// ===== PRO STRIKER - input.js =====
console.log('[ProStriker] input.js loaded');
function inputLocked() { return performance.now() < (window._inputLockUntil || 0); }
window.addEventListener('keydown', (e) => {
    initSoundOnInteraction();
    // NOTE: Escape is deliberately excluded from this preventDefault list.
    // Many browsers and game embeds reserve Escape to exit fullscreen mode —
    // calling preventDefault() on it here would block that from working
    // while the player is in fullscreen. 'P' remains the primary way to
    // pause/back-out; Escape still triggers the same game actions below,
    // it's just no longer prevented from also reaching the browser.
    if ([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'p', 'P', 'Shift'].includes(e.key)) {
        e.preventDefault();
    }
    const keyLower = e.key.toLowerCase();
    if (keyLower === ' ' || e.code === 'Space') keys.space = true;
    if (e.key === 'Enter') keys.enter = true;
    if (e.key === 'Escape') keys.Escape = true;
    if (e.key === 'Shift') { keys.Shift = true; if (e.code === 'ShiftRight') keys.ShiftR = true; else keys.ShiftL = true; }
    if (keyLower === 'p') keys.p = true;
    if (keys.hasOwnProperty(keyLower) && keyLower !== ' ' && keyLower !== 'p' && keyLower !== 'shift') {
        keys[keyLower] = true;
    }
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;

    if (currentState === 'PENALTY_SHOOTOUT' && (keyLower === ' ' || e.code === 'Space')) {
        keys.space = false;
        if (!window._confirmForfeitMatch && !window._confirmExitTournament && !e.repeat && tournamentShootout &&
            (tournamentShootout.phase === 'shoot' || tournamentShootout.phase === 'keeper')) {
            takeTournamentPenalty();
        }
        return;
    }
    if (currentState === 'PENALTY_SHOOTOUT' && e.key === 'Enter') {
        keys.enter = false;
        if (!window._confirmForfeitMatch && !window._confirmExitTournament && !e.repeat &&
            tournamentShootout && tournamentShootout.isLocal && tournamentShootout.phase === 'localShoot') {
            takeTournamentPenalty();
        }
        return;
    }

    // ===== FORFEIT CONFIRM OVERLAY (highest priority) =====
    // Must be intercepted BEFORE the pause/resume hotkeys below so that
    // Escape cancels the overlay instead of resuming, and Enter confirms
    // instead of being swallowed by the pause handler.
    if (window._confirmForfeitMatch) {
        if (e.key === 'Escape') {
            SoundManager.playSFX('menuClick');
            window._confirmForfeitMatch = false;
            return;
        }
        if (e.key === 'Enter') {
            SoundManager.playSFX('menuClick');
            window._confirmForfeitMatch = false;
            forfeitCurrentTournamentMatch();
            return;
        }
    }

    if (keyLower === 'p' && currentState === 'PLAY') togglePause();
    if (e.key === 'Escape' && currentState === 'PAUSED' && !window._confirmForfeitMatch) togglePause();
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

    if (currentState === 'TUTORIAL') {
        if (TutorialManager._retryPromptShown) {
            if (e.key === 'Enter') { TutorialManager.retryStep(); }
            else if (e.key === 'Escape') { TutorialManager.dismissRetryPrompt(); }
        } else if (e.key === 'Escape') {
            SoundManager.playSFX('menuClick');
            TutorialManager.exitToMenu();
        }
    } else if (currentState === 'TUTORIAL_COMPLETE') {
        if (e.key === 'Enter' || e.key === 'Escape') { SoundManager.playSFX('menuClick'); TutorialManager.exitToMenu(); }
    } else if (currentState === 'SHOP') {
        Shop.handleKey(e);
    } else if (currentState === 'DIFFICULTY_SELECT') {
        if (e.key === 'Escape' || e.key === 'Backspace') { SoundManager.playSFX('menuClick'); currentState = 'MENU'; }
    } else if (currentState === 'SETTINGS') {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        }
        if (e.key === 'ArrowUp') halfDuration = Math.min(120, halfDuration + 5);
        if (e.key === 'ArrowDown') halfDuration = Math.max(15, halfDuration - 5);
    } else if (currentState === 'PROGRESS') {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            ProgressUI.cycleTab(e.key === 'ArrowRight' ? 1 : -1);
            SoundManager.playSFX('menuClick');
        }
    } else if (currentState === 'INSTRUCTIONS' || currentState === 'STATS' || currentState === 'CREDITS') {
        if (e.key === 'Escape' || e.key === 'Backspace') {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        }
    } else if (currentState === 'MATCH_END') {
        if (e.key === 'Enter' && !e.repeat && !inputLocked()) {
            SoundManager.playSFX('menuClick');
            if (tournamentMode && tournamentPendingMatch) {
                // Already handled in main.js update
            } else {
                exitMatchEndToMenu();
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
        if (e.key === 'Enter' && !e.repeat && !inputLocked()) { continueAfterTournamentMatch(); }
        if ((e.key === 'Escape' || e.key === 'Backspace') && !e.repeat && !inputLocked()) {
            tournamentMode = false;
            currentState = 'MENU';
        }
    } else if (currentState === 'TOURNAMENT_CONTINUE_OFFER') {
        if (e.key === 'Enter' && !e.repeat && !inputLocked()) { requestTournamentContinueAdAndResume(); }
        if ((e.key === 'Escape' || e.key === 'Backspace') && !e.repeat && !inputLocked()) { declineTournamentContinueOffer(); }
    } else if (currentState === 'TOURNAMENT_CHAMPION') {
        if ((e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace') && !e.repeat) {
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
    if (e.key === 'Shift') { if (e.code === 'ShiftRight') keys.ShiftR = false; else keys.ShiftL = false; keys.Shift = keys.ShiftL || keys.ShiftR; }
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
        return;
    }

    if (currentState === 'PENALTY_SHOOTOUT') {
        const shootout = tournamentShootout;
        if (shootout && (shootout.phase === 'shoot' || shootout.phase === 'keeper' || shootout.phase === 'localShoot')) {
            const timingBar = window._shootoutTimingBar;
            if (timingBar && pos.x >= timingBar.x && pos.x <= timingBar.x + timingBar.w &&
                pos.y >= timingBar.y && pos.y <= timingBar.y + timingBar.h) {
                takeTournamentPenalty();
                return;
            }
            const kickBtn = window._shootoutActionBtn;
            if (kickBtn && pos.x >= kickBtn.x && pos.x <= kickBtn.x + kickBtn.w &&
                pos.y >= kickBtn.y && pos.y <= kickBtn.y + kickBtn.h) {
                takeTournamentPenalty();
                return;
            }
        }
        return;
    }

    const pauseGameBtn = window._pauseGameBtn;
    if (currentState === 'PLAY' && pauseGameBtn &&
        pos.x >= pauseGameBtn.x && pos.x <= pauseGameBtn.x + pauseGameBtn.w &&
        pos.y >= pauseGameBtn.y && pos.y <= pauseGameBtn.y + pauseGameBtn.h) {
        SoundManager.playSFX('menuClick');
        togglePause();
        return;
    }

    if (currentState === 'MENU') {

        const cb = window._creditsBtn;
        if (cb && pos.x >= cb.x && pos.x <= cb.x + cb.w && pos.y >= cb.y && pos.y <= cb.y + cb.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'CREDITS';
            return;
        }
        const sb = window._shopBtn;
        if (sb && pos.x >= sb.x && pos.x <= sb.x + sb.w && pos.y >= sb.y && pos.y <= sb.y + sb.h) {
            SoundManager.playSFX('menuClick');
            Shop.open();
            return;
        }
        const tb = window._tutorialBtn;
        if (tb && pos.x >= tb.x && pos.x <= tb.x + tb.w && pos.y >= tb.y && pos.y <= tb.y + tb.h) {
            SoundManager.playSFX('menuClick');
            TutorialManager.start();
            return;
        }

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
                    case 0: selectMode('1v1'); break;
                    case 1: currentState = 'DIFFICULTY_SELECT'; break;
                    case 2: startTournamentMenu(); break;
                    case 3: currentState = 'INSTRUCTIONS'; break;
                    case 4: currentState = 'PROGRESS'; ProgressUI.open(); break;
                    case 5: currentState = 'SETTINGS'; break;
                }

                return;
            }
        }
    } else if (currentState === 'TUTORIAL') {
        if (TutorialManager._retryPromptShown) {
            const retry = window._tutRetryBtn;
            if (retry && pos.x >= retry.x && pos.x <= retry.x + retry.w &&
                pos.y >= retry.y && pos.y <= retry.y + retry.h) {
                TutorialManager.retryStep();
                return;
            }
            const keepPlaying = window._tutKeepPlayingBtn;
            if (keepPlaying && pos.x >= keepPlaying.x && pos.x <= keepPlaying.x + keepPlaying.w &&
                pos.y >= keepPlaying.y && pos.y <= keepPlaying.y + keepPlaying.h) {
                TutorialManager.dismissRetryPrompt();
                return;
            }
            return; // prompt is up — ignore clicks on the pitch behind it
        }
        const skipStep = window._tutSkipStepBtn;
        if (skipStep && pos.x >= skipStep.x && pos.x <= skipStep.x + skipStep.w &&
            pos.y >= skipStep.y && pos.y <= skipStep.y + skipStep.h) {
            TutorialManager.skipStep();
            return;
        }
        const skipAll = window._tutSkipAllBtn;
        if (skipAll && pos.x >= skipAll.x && pos.x <= skipAll.x + skipAll.w &&
            pos.y >= skipAll.y && pos.y <= skipAll.y + skipAll.h) {
            TutorialManager.skipTutorial();
            return;
        }
    } else if (currentState === 'TUTORIAL_COMPLETE') {
        const back = window._backBtn;
        if (back && pos.x >= back.x && pos.x <= back.x + back.w && pos.y >= back.y && pos.y <= back.y + back.h) {
            SoundManager.playSFX('menuClick');
            TutorialManager.exitToMenu();
            return;
        }
    } else if (currentState === 'SHOP') {
        Shop.handlePointer(pos.x, pos.y);
    } else if (currentState === 'DIFFICULTY_SELECT') {
        const mobileStart = window._mobileDifficultyStartBtn;
        if (isMobileDevice && mobileStart && window._mobileDifficultySelection !== null &&
            pos.x >= mobileStart.x && pos.x <= mobileStart.x + mobileStart.w &&
            pos.y >= mobileStart.y && pos.y <= mobileStart.y + mobileStart.h) {
            SoundManager.playSFX('confirm');
            selectMode('pve');
            return;
        }
        if (window._difficultyBtns) {
            for (let btn of window._difficultyBtns) {
                if (pos.x >= btn.x && pos.x <= btn.x + btn.w &&
                    pos.y >= btn.y && pos.y <= btn.y + btn.h) {
                    SoundManager.playSFX('confirm');
                    difficulty = btn.key;
                    if (isMobileDevice) {
                        window._mobileDifficultySelection = btn.key;
                    } else {
                        selectMode('pve');
                    }
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
    } else if (currentState === 'PROGRESS') {
        if (typeof ProgressUI !== 'undefined' && ProgressUI.handleClick(pos)) return;
        const backP = window._backBtn;
        if (backP && pos.x >= backP.x && pos.x <= backP.x + backP.w && pos.y >= backP.y && pos.y <= backP.y + backP.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
            return;
        }
    } else if (currentState === 'INSTRUCTIONS' || currentState === 'STATS' || currentState === 'CREDITS') {
        const back = window._backBtn;
        if (back && pos.x >= back.x && pos.x <= back.x + back.w && pos.y >= back.y && pos.y <= back.y + back.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
            return;
        }
    } else if (currentState === 'PAUSED') {
        // ===== FORFEIT CONFIRM OVERLAY INTERCEPT =====
        // Must run first: while this overlay is open it owns the whole
        // screen, and no pause-menu button underneath should react.
        if (window._confirmForfeitMatch) {
            const yesBtn = window._confirmForfeitYesBtn;
            const noBtn = window._confirmForfeitNoBtn;
            if (yesBtn && pos.x >= yesBtn.x && pos.x <= yesBtn.x + yesBtn.w &&
                pos.y >= yesBtn.y && pos.y <= yesBtn.y + yesBtn.h) {
                SoundManager.playSFX('menuClick');
                window._confirmForfeitMatch = false;
                forfeitCurrentTournamentMatch();
                return;
            }
            if (noBtn && pos.x >= noBtn.x && pos.x <= noBtn.x + noBtn.w &&
                pos.y >= noBtn.y && pos.y <= noBtn.y + noBtn.h) {
                SoundManager.playSFX('menuClick');
                window._confirmForfeitMatch = false;
                return;
            }
            // Click landed outside both buttons — cancel and swallow.
            window._confirmForfeitMatch = false;
            return;
        }

        const resumeBtn = window._pauseResumeBtn;
        const menuBtn = window._pauseMenuBtn;
        const musicToggleBtn = window._pauseMusicBtn;
        const sfxToggleBtn = window._pauseSfxBtn;
        if (resumeBtn && pos.x >= resumeBtn.x && pos.x <= resumeBtn.x + resumeBtn.w && pos.y >= resumeBtn.y && pos.y <= resumeBtn.y + resumeBtn.h) {
            SoundManager.playSFX('menuClick');
            togglePause();
        } else if (menuBtn && pos.x >= menuBtn.x && pos.x <= menuBtn.x + menuBtn.w && pos.y >= menuBtn.y && pos.y <= menuBtn.y + menuBtn.h) {
            SoundManager.playSFX('menuClick');
            if (tournamentMode && tournamentPendingMatch) {
                // Quitting mid-match counts as a forfeit (0-3 loss) so it
                // can't be used to dodge a bad scoreline — see
                // forfeitCurrentTournamentMatch() for why. Now requires a
                // confirm step via the overlay (label on the pause menu
                // itself already reads "FORFEIT MATCH" in this context).
                window._confirmForfeitMatch = true;
                return;
            } else if (tournamentMode) {
                currentState = 'TOURNAMENT_MENU';
            } else {
                currentState = 'MENU';
            }
            updateTouchUI();
        } else if (musicToggleBtn && pos.x >= musicToggleBtn.x && pos.x <= musicToggleBtn.x + musicToggleBtn.w && pos.y >= musicToggleBtn.y && pos.y <= musicToggleBtn.y + musicToggleBtn.h) {
            SoundManager.toggleMusic();
            SoundManager.playSFX('menuClick', 0.3);
        } else if (sfxToggleBtn && pos.x >= sfxToggleBtn.x && pos.x <= sfxToggleBtn.x + sfxToggleBtn.w && pos.y >= sfxToggleBtn.y && pos.y <= sfxToggleBtn.y + sfxToggleBtn.h) {
            SoundManager.toggleSFX();
            SoundManager.playSFX('menuClick', 0.3);
        }
    } else if (currentState === 'MATCH_END') {
        if (inputLocked()) return;
        if (tournamentMode && tournamentPendingMatch) {
            const b = window._continueAdBtn;
            if (b && pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
                SoundManager.playSFX('confirm');
                requestTournamentContinueAdAndResume();
            }
            return;
        }
        SoundManager.playSFX('menuClick');
        exitMatchEndToMenu();
    } else if (currentState === 'TOURNAMENT_MENU') {
        const startBtn = window._tournamentStartBtn;
        if (startBtn && pos.x >= startBtn.x && pos.x <= startBtn.x + startBtn.w && pos.y >= startBtn.y && pos.y <= startBtn.y + startBtn.h) {
            SoundManager.playSFX('confirm');
            startTeamSelection();
        }
        const continueBtn = window._tournamentContinueBtn;
        if (continueBtn && pos.x >= continueBtn.x && pos.x <= continueBtn.x + continueBtn.w && pos.y >= continueBtn.y && pos.y <= continueBtn.y + continueBtn.h) {
            SoundManager.playSFX('confirm');
            resumeSavedTournament();
        }
        const backBtn = window._tournamentBackBtn;
        if (backBtn && pos.x >= backBtn.x && pos.x <= backBtn.x + backBtn.w && pos.y >= backBtn.y && pos.y <= backBtn.y + backBtn.h) {
            SoundManager.playSFX('menuClick');
            tournamentMode = false;
            currentState = 'MENU';
        }
    } else if (currentState === 'TOURNAMENT_TEAM_SELECT') {
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
                        return;
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
            const playerWonTournament = !!(TournamentManager.champion && TournamentManager.champion.id === tournamentSelectedTeam);
            if (TournamentManager.isComplete() && playerWonTournament) {
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
        const exitBtn = window._tournamentExitBtn;
        if (exitBtn && pos.x >= exitBtn.x && pos.x <= exitBtn.x + exitBtn.w &&
            pos.y >= exitBtn.y && pos.y <= exitBtn.y + exitBtn.h) {
            SoundManager.playSFX('menuClick');
            tournamentMode = false;
            currentState = 'MENU';
            updateTouchUI();
            return;
        }
        const nextBtn = window._tournamentNextMatchBtn || window._tournamentBracketViewBtn || window._tournamentChampionBtn;
        if (!inputLocked() && nextBtn && pos.x >= nextBtn.x && pos.x <= nextBtn.x + nextBtn.w && pos.y >= nextBtn.y && pos.y <= nextBtn.y + nextBtn.h) {
            SoundManager.playSFX('menuClick');
            continueAfterTournamentMatch();
        }
    } else if (currentState === 'TOURNAMENT_CONTINUE_OFFER') {
        if (typeof AdManager !== 'undefined' && AdManager.isAdRequestInFlight()) {
            // Swallow clicks while an ad request is already in flight —
            // duplicate-click protection, same principle as the rest of
            // the ad-related UI.
        } else {
            const watchBtn = window._tournamentWatchAdBtn;
            const continueBtn = window._tournamentContinueWithoutAdBtn;
            if (watchBtn && pos.x >= watchBtn.x && pos.x <= watchBtn.x + watchBtn.w && pos.y >= watchBtn.y && pos.y <= watchBtn.y + watchBtn.h) {
                SoundManager.playSFX('confirm');
                requestTournamentContinueAdAndResume();
            } else if (continueBtn && pos.x >= continueBtn.x && pos.x <= continueBtn.x + continueBtn.w && pos.y >= continueBtn.y && pos.y <= continueBtn.y + continueBtn.h) {
                SoundManager.playSFX('menuClick');
                declineTournamentContinueOffer();
            }
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

function collectUiHoverTargets(pos) {
    const targets = [];
    const add = (rect, enabled = true) => {
        if (enabled && rect && Number.isFinite(rect.x) && Number.isFinite(rect.y) &&
            Number.isFinite(rect.w) && Number.isFinite(rect.h)) {
            targets.push({
                x: rect.x, y: rect.y, w: rect.w, h: rect.h,
                hovered: pos.x >= rect.x && pos.x <= rect.x + rect.w &&
                    pos.y >= rect.y && pos.y <= rect.y + rect.h
            });
        }
    };
    const addList = (list, enabled = true) => (list || []).forEach((rect) => add(rect, enabled));
    const back = () => add(window._backBtn);

    switch (currentState) {
        case 'MENU':
            addList(window._menuButtons);
            add(window._shopBtn);
            add(window._tutorialBtn);
            add(window._creditsBtn);
            break;
        case 'DIFFICULTY_SELECT':
            addList(window._difficultyBtns);
            add(window._diffBackBtn);
            add(window._mobileDifficultyStartBtn, isMobileDevice);
            break;
        case 'INSTRUCTIONS':
        case 'STATS':
        case 'CREDITS':
        case 'TUTORIAL_COMPLETE':
            back();
            break;
        case 'SETTINGS':
            add(window._sliderRect);
            add(window._musicBtn);
            add(window._sfxBtn);
            back();
            break;
        case 'PROGRESS':
            addList(window._progressTabBtns);
            addList(ProgressUI._tab === 1 ? ProgressUI._claimBtns : []);
            back();
            break;
        case 'SHOP': {
            if (Shop.ui.earnInfoOpen) {
                add(window._earnInfoBackBtn);
                break;
            }
            const layout = Shop.ui.hit;
            if (layout) {
                add(layout.earnInfo);
                addList(layout.tabs);
                const tab = SHOP_TABS[Shop.ui.tab].key;
                const list = SHOP_CATALOG[tab];
                addList(layout.cards.slice(0, list.length));
                const selected = list[Math.min(Shop.ui.sel[tab], list.length - 1)];
                add(layout.action, !!selected && Shop.equippedId(tab) !== selected.id &&
                    (Shop.owns(tab, selected.id) || Shop.coins() >= selected.price));
                add(layout.daily, Shop.dailyStatus().available);
                add(layout.ad, Shop.canWatchAd());
                add(layout.back);
            }
            break;
        }
        case 'TUTORIAL':
            if (TutorialManager._retryPromptShown) {
                add(window._tutRetryBtn);
                add(window._tutKeepPlayingBtn);
            } else {
                add(window._tutSkipStepBtn);
                add(window._tutSkipAllBtn);
            }
            break;
        case 'TOURNAMENT_MENU':
            add(window._tournamentStartBtn);
            add(window._tournamentContinueBtn);
            add(window._tournamentBackBtn);
            break;
        case 'TOURNAMENT_TEAM_SELECT': {
            const offset = window._teamScrollOffset || 0;
            (window._teamSelectBtns || []).forEach((btn) => {
                const visible = { x: btn.x, y: btn.y - offset, w: btn.w, h: btn.h };
                add(visible, visible.y >= 96 && visible.y + visible.h <= 510);
            });
            const teamLocked = typeof AdManager !== 'undefined' && tournamentSelectedTeam !== null &&
                AdManager.isTeamLocked(tournamentSelectedTeam);
            const adBusy = typeof AdManager !== 'undefined' && AdManager.isAdRequestInFlight();
            add(window._tournamentConfirmBtn, tournamentSelectedTeam !== null && !(teamLocked && adBusy));
            add(window._tournamentSelectBackBtn);
            break;
        }
        case 'TOURNAMENT_GROUP_STAGE':
            if (window._confirmExitTournament) {
                add(window._confirmExitNoBtn);
                add(window._confirmExitYesBtn);
            } else {
                add(window._tournamentNextRoundBtn);
                add(window._tournamentOutBtn);
                add(window._tournamentPlayMatchBtn);
                add(window._tournamentGroupBackBtn);
            }
            break;
        case 'TOURNAMENT_BRACKET':
            add(window._tournamentPlayMatchBtn);
            add(window._tournamentChampionBtn);
            add(window._tournamentBracketBackBtn);
            break;
        case 'TOURNAMENT_RESULT':
            add(window._tournamentExitBtn);
            add(window._tournamentNextMatchBtn || window._tournamentBracketViewBtn || window._tournamentChampionBtn, !inputLocked());
            break;
        case 'TOURNAMENT_CONTINUE_OFFER': {
            const disabled = typeof AdManager !== 'undefined' && AdManager.isAdRequestInFlight();
            add(window._tournamentWatchAdBtn, !disabled);
            add(window._tournamentContinueWithoutAdBtn, !disabled);
            break;
        }
        case 'TOURNAMENT_CHAMPION':
            add(window._tournamentReturnBtn);
            break;
        case 'PAUSED':
            if (window._confirmForfeitMatch) {
                add(window._confirmForfeitNoBtn);
                add(window._confirmForfeitYesBtn);
            } else {
                add(window._pauseResumeBtn);
                add(window._pauseMenuBtn);
                add(window._pauseMusicBtn);
                add(window._pauseSfxBtn);
            }
            break;
        case 'MATCH_END':
            if (tournamentMode && tournamentPendingMatch) add(window._continueAdBtn, !inputLocked());
            break;
        case 'PENALTY_SHOOTOUT':
            add(window._shootoutActionBtn);
            break;
        case 'PLAY':
            add(window._pauseGameBtn);
            break;
    }
    return targets;
}

canvas.addEventListener('pointermove', (e) => {
    const pos = getCanvasTouchPos(e);
    const targets = e.pointerType === 'mouse' ? collectUiHoverTargets(pos) : [];
    window._uiHover = { state: currentState, targets };
    const hovered = targets.some((target) => target.hovered);
    const containsPointer = (rect) => e.pointerType === 'mouse' && !!rect &&
        pos.x >= rect.x && pos.x <= rect.x + rect.w &&
        pos.y >= rect.y && pos.y <= rect.y + rect.h;
    const difficultyIndex = currentState === 'DIFFICULTY_SELECT'
        ? (window._difficultyBtns || []).findIndex(containsPointer)
        : -1;
    window._uiHover.difficultyIndex = difficultyIndex;
    window._uiHover.difficultyBack = currentState === 'DIFFICULTY_SELECT' && containsPointer(window._diffBackBtn);
    window._uiHover.tutorialSkipStep = currentState === 'TUTORIAL' && !TutorialManager._retryPromptShown && containsPointer(window._tutSkipStepBtn);
    window._uiHover.tutorialSkipAll = currentState === 'TUTORIAL' && !TutorialManager._retryPromptShown && containsPointer(window._tutSkipAllBtn);
    window._uiHover.groupExit = currentState === 'TOURNAMENT_GROUP_STAGE' && !window._confirmExitTournament && containsPointer(window._tournamentGroupBackBtn);
    window._uiHover.groupPlay = currentState === 'TOURNAMENT_GROUP_STAGE' && containsPointer(window._tournamentPlayMatchBtn);
    window._uiHover.confirmStay = !!window._confirmExitTournament && containsPointer(window._confirmExitNoBtn);
    window._uiHover.confirmExit = !!window._confirmExitTournament && containsPointer(window._confirmExitYesBtn);

    if (currentState === 'MENU') {

        const buttons =
            window._menuButtons || [];

        let newHover = -1;

        for (let i = 0; e.pointerType === 'mouse' && i < buttons.length; i++) {

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

        const _sb = window._shopBtn;
        window._shopHover = e.pointerType === 'mouse' && !!(_sb && pos.x >= _sb.x && pos.x <= _sb.x + _sb.w && pos.y >= _sb.y && pos.y <= _sb.y + _sb.h);
        if (window._shopHover) newHover = 99;

        const _tb = window._tutorialBtn;
        window._tutorialHover = e.pointerType === 'mouse' && !!(_tb && pos.x >= _tb.x && pos.x <= _tb.x + _tb.w && pos.y >= _tb.y && pos.y <= _tb.y + _tb.h);
        if (window._tutorialHover) newHover = 98;

        canvas.style.cursor = hovered ? 'pointer' : 'default';

    } else {

        window._menuHoverIndex = -1;
        window._shopHover = false;
        window._tutorialHover = false;

        canvas.style.cursor = hovered ? 'pointer' : 'default';
    }

    if (
        isDraggingSlider &&
        currentState === 'SETTINGS'
    ) {
        updateSliderFromPointer(
            pos.x
        );
    }

    pauseButton.hover =
        (
            e.pointerType === 'mouse' &&
            pos.x >= pauseButton.x - 14 &&
            pos.x <= pauseButton.x + pauseButton.width + 6 &&
            pos.y >= pauseButton.y - 9 &&
            pos.y <= pauseButton.y + pauseButton.height + 9
        );
});

window.addEventListener('pointerup', () => {
    isDraggingSlider = false;
});

canvas.addEventListener('pointerleave', () => {
    window._menuHoverIndex = -1;
    window._shopHover = false;
    window._tutorialHover = false;
    window._uiHover = null;
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
    // VS Computer: mark the match as started so quitting mid-match counts as a
    // loss for the win streak (see Shop.beginPveMatch).
    if (mode === 'pve' && typeof Shop !== 'undefined') { try { Shop.beginPveMatch(); } catch (e) { console.warn('[Shop] beginPveMatch failed', e); } }
    initMatch();
    currentState = 'PLAY';
    updateTouchUI();
    SoundManager.updateMusicForState(currentState);
}

// ===== AD STRATEGY: normal-match ad opportunity =====
// Called whenever the player acknowledges a non-tournament MATCH_END
// screen (1v1 or VS Computer). The player has already seen and dismissed
// the result — this is the "safe transition" moment the spec calls for,
// never a surprise mid-match or on top of the result itself. If
// AdManager decides an ad opportunity is due (every N matches, see
// platformConfig.js) and a supported platform is active, a midgame ad is
// requested; the menu transition always happens either way, immediately
// if no ad plays, or right after the ad (or its failure) resolves.
function exitMatchEndToMenu() {
    const goMenu = () => {
        localPenaltyResult = null;
        tournamentShootout = null;
        currentState = 'MENU';
        updateTouchUI();
    };
    if (typeof AdManager === 'undefined' || typeof PlatformSDK === 'undefined') { goMenu(); return; }
    if (AdManager.isAdRequestInFlight()) return;
    if (AdManager.shouldOfferNormalMatchAd()) AdManager.requestNormalMatchAd(goMenu);
    else goMenu();
}

// Drops every held key / touch. Called when the window loses focus, the tab
// is hidden, or the on-screen controls disappear: the matching keyup /
// touchend is never delivered in those cases, which used to leave a player
// running in one direction (or the joystick dead) until the next press.
function releaseAllInputs() {
    for (const k in keys) { if (typeof keys[k] === 'boolean') keys[k] = false; }
    if (window._joystickResets) window._joystickResets.forEach(fn => fn());
}
window.addEventListener('blur', releaseAllInputs);
// Tab hidden / window blurred DURING a live match: pause it (and silence audio)
// instead of letting the AI keep playing against an idle player. Portals such as
// GameMonetize also forbid background audio, so music is muted while hidden and
// restored on return. A match the player paused themselves is left paused.
window._autoPausedByVisibility = false;
function _pauseForHidden() {
    releaseAllInputs();
    if (currentState === 'PLAY' && matchState === 'PLAY') {
        currentState = 'PAUSED';
        window._autoPausedByVisibility = true;
        updateTouchUI();
    }
    try { SoundManager.suspendForHidden(); } catch (e) {}
}
function _resumeFromHidden() {
    try { SoundManager.restoreAfterHidden(); } catch (e) {}
    // Deliberately stay PAUSED: the player resumes with P / the on-screen
    // button, so they are never dropped back into a live match unprepared.
    window._autoPausedByVisibility = false;
}
document.addEventListener('visibilitychange', () => { if (document.hidden) _pauseForHidden(); else _resumeFromHidden(); });

function syncTouchControlsVisibility() {
    const inMatch = (currentState === 'PLAY' || currentState === 'PAUSED' ||
        currentState === 'GOAL_SCORED' || currentState === 'PENALTY_SHOOTOUT');
    const inTutorial = currentState === 'TUTORIAL';
    if ((inMatch || inTutorial) && isMobileDevice) {
        touchControlsElem.style.display = 'block';
        touchControlsElem.className = 'touch-controls is-active mode-' + (inTutorial ? 'pve' : gameMode);
        window._touchControlsWereVisible = true;
    } else {
        touchControlsElem.style.display = 'none';
        if (window._touchControlsWereVisible) { window._touchControlsWereVisible = false; releaseAllInputs(); }
    }
}

function updateTouchUI() {
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
    window._tournamentNextRoundBtn = null;
    window._tournamentOutBtn = null;
    window._tournamentPlayMatchBtn = null;
    window._tournamentChampionBtn = null;
    window._tournamentNextMatchBtn = null;
    window._tournamentBracketViewBtn = null;
    window._confirmExitTournament = false;
    window._confirmForfeitMatch = false;
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

function confirmTeamSelection() {
    if (tournamentSelectedTeam === null) return;
    const teamId = tournamentSelectedTeam;
    const begin = () => {
        tournamentSelectedTeam = teamId;
        SoundManager.playSFX('confirm');
        TournamentManager.init(tournamentFormat, teamId);
        currentState = 'TOURNAMENT_GROUP_STAGE';
        updateTouchUI();
    };
    if (typeof AdManager !== 'undefined' && AdManager.isTeamLocked(teamId)) {
        if (AdManager.isAdRequestInFlight()) return;
        AdManager.requestTeamUnlock(teamId, begin);
        return;
    }
    begin();
}

function resumeSavedTournament() {
    if (!TournamentManager.resume()) return;
    tournamentFormat = TournamentManager.format;
    tournamentSelectedTeam = TournamentManager.selectedTeamId;
    currentState = TournamentManager.groupStageComplete ? 'TOURNAMENT_BRACKET' : 'TOURNAMENT_GROUP_STAGE';
}

// ===== TOURNAMENT FORFEIT ON QUIT =====
// Quitting a tournament match to the main menu used to just drop the match
// back into "pending" limbo with no result ever recorded — so Continue
// Tournament re-served the exact same fixture, letting a losing player
// escape a bad scoreline for free, forever. That's a real problem for a
// game whose rewarded-ad revenue leans on tournament losses (retry/add-
// time offers): a free, lossless retry loop makes the paid one pointless.
// This records an automatic 0-3 loss for the player through the SAME
// recordPlayerMatchResult() path a normal full-time result uses (see
// main.js's MATCH_END handling), so group standings, knockout elimination,
// and champion/simulate-rest-of-bracket logic all run exactly as they
// would for a real defeat — no separate/duplicate rules to keep in sync.
function forfeitCurrentTournamentMatch() {
    if (!tournamentMode || !tournamentPendingMatch) return;
    const pending = tournamentPendingMatch;
    const isGroup = pending.type === 'group';
    const playerTeamId = tournamentSelectedTeam;
    const teamAId = pending.teamA.id;

    let teamAScore, teamBScore;
    if (playerTeamId === teamAId) { teamAScore = 0; teamBScore = 3; }
    else { teamAScore = 3; teamBScore = 0; }

    TournamentManager.recordPlayerMatchResult(
        pending.uid,
        teamAScore,
        teamBScore,
        isGroup,
        isGroup ? pending.groupId : null,
        isGroup ? null : (pending.roundIndex !== undefined ? pending.roundIndex : pending.round)
    );

    lastScorer = '';
    lastScorerTeam = null;
    tournamentPendingMatch = null;
    matchState = 'PLAY';
    currentState = 'TOURNAMENT_RESULT';
    updateTouchUI();
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

function startTournamentMatch(match) {
    if (!match) return;

    clearTournamentContinueState();
    const isGroup = match.type === 'group';
    TournamentManager.markPlayerMatch(
        match.uid,
        isGroup,
        isGroup ? match.groupId : null,
        isGroup ? null : (match.roundIndex !== undefined ? match.roundIndex : match.round)
    );

    tournamentPendingMatch = match;
    const playerTeamId = tournamentSelectedTeam;

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

    const tournamentDifficulty = {
        MEDIUM: 'EASY',
        HARD: 'MEDIUM',
        ELITE: 'HARD',
        WORLD_CLASS: 'ELITE'
    };
    difficulty = tournamentDifficulty[aiDifficulty] || aiDifficulty;
    gameMode = 'pve';
    currentState = 'PLAY';
    initMatch(redTeamId, blueTeamId);
    updateTouchUI();
    SoundManager.updateMusicForState(currentState);
    console.log('[Tournament] Starting match:', redTeamId, 'vs', blueTeamId);
}

// ===== AD STRATEGY: resolving the tournament continue offer =====
// "CONTINUE WITHOUT AD" (or an ad that fails/is declined/unfilled): the
// original result is recorded exactly as it would have been without this
// feature existing — a real loss stays a real loss, no reward, no
// difference in tournament outcome.
function declineTournamentContinueOffer() {
    const offer = window._pendingContinueOffer;
    if (!offer) {
        clearTournamentContinueState();
        currentState = 'MENU';
        updateTouchUI();
        return;
    }

    if (offer.finalized) {
        clearTournamentContinueState();
        if (tournamentPendingMatch && tournamentPendingMatch.uid === offer.uid) {
            tournamentPendingMatch = null;
        }
        currentState = 'TOURNAMENT_RESULT';
        updateTouchUI();
        SoundManager.updateMusicForState(currentState);
        return;
    }

    offer.finalized = true;
    const pendingUid = offer.uid;
    TournamentManager.recordPlayerMatchResult(
        offer.uid, offer.teamAScore, offer.teamBScore, offer.isGroup, offer.groupId ?? null, offer.roundIndex
    );
    clearTournamentContinueState();
    if (tournamentPendingMatch && tournamentPendingMatch.uid === pendingUid) {
        tournamentPendingMatch = null;
    }
    currentState = 'TOURNAMENT_RESULT';
    updateTouchUI();
    SoundManager.updateMusicForState(currentState);
}

// "WATCH AD TO CONTINUE": requests the rewarded ad. Only on genuine
// completion (onReward) does the match actually replay with bonus time —
// nothing about the tournament result is touched until then. On
// failure/unfilled/decline partway through the ad, this falls back to
// exactly the same path as declining outright: the real result is
// recorded, no reward, no special-casing.
function requestTournamentContinueAdAndResume() {
    const flow = window._endFlow;
    const offer = window._pendingContinueOffer;
    if (!flow || !flow.offer || typeof AdManager === 'undefined' || !tournamentPendingMatch || !offer) return;
    if (offer.finalized || AdManager.isAdRequestInFlight()) return;
    flow.offer = false;
    AdManager.requestTournamentContinueAd(flow.uid, {
        onReward: () => {
            if (!tournamentPendingMatch) return;
            offer.finalized = true;
            clearTournamentContinueState();
            resumeTournamentMatchWithBonus();
        },
        onDeclinedOrFailed: () => {
            flow.offer = false;
            flow.t = 999;
            declineTournamentContinueOffer();
        }
    });
}

function continueAfterTournamentMatch() {
    if (typeof AdManager !== 'undefined' && AdManager.isAdRequestInFlight()) return;
    clearTournamentContinueState();
    if (tournamentMode && tournamentPendingMatch) {
        if (TournamentManager.isComplete()) {
            currentState = 'TOURNAMENT_CHAMPION';
        } else if (TournamentManager.groupStageComplete) {
            currentState = 'TOURNAMENT_BRACKET';
            TournamentManager.prepareKnockoutRound();
        } else {
            currentState = 'TOURNAMENT_GROUP_STAGE';
        }
        updateTouchUI();
        return;
    }
    const go = () => {
        if (TournamentManager.isComplete()) {
            currentState = 'TOURNAMENT_CHAMPION';
        } else if (TournamentManager.groupStageComplete) {
            currentState = 'TOURNAMENT_BRACKET';
            TournamentManager.prepareKnockoutRound();
        } else {
            currentState = 'TOURNAMENT_GROUP_STAGE';
        }
        updateTouchUI();
    };
    if (typeof AdManager !== 'undefined' && AdManager.shouldOfferNormalMatchAd()) AdManager.requestNormalMatchAd(go);
    else go();
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
    // Lets other code (focus loss, controls being hidden) drop a held touch
    // cleanly - otherwise a stale activeTouchId makes the joystick ignore
    // every new touch until the page is reloaded.
    (window._joystickResets = window._joystickResets || []).push(() => {
        activeTouchId = null;
        stickElem.style.transform = 'translate(0px, 0px)';
        updateKeys(false, false, false, false);
    });
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
        if (currentState === 'PENALTY_SHOOTOUT' && tournamentShootout) {
            const shootout = tournamentShootout;
            const canUseButton = keyName === 'space'
                ? shootout.phase === 'shoot' || shootout.phase === 'keeper'
                : shootout.isLocal && shootout.phase === 'localShoot';
            if (canUseButton) takeTournamentPenalty();
            return;
        }
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
    btnElem.addEventListener('mouseleave', release);
}

bindShootButton(document.getElementById('p1Shoot'), 'space');
bindShootButton(document.getElementById('p2Shoot'), 'enter');

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (currentState === 'CREDITS') {
        if (typeof window._creditsScrollOffset === 'undefined') window._creditsScrollOffset = 0;
        window._creditsScrollOffset += e.deltaY * 0.5;
        const maxScroll = Math.max(0, (CREDITS_LIST.length * 34) - 370 + 10);
        if (window._creditsScrollOffset > maxScroll) window._creditsScrollOffset = maxScroll;
        if (window._creditsScrollOffset < 0) window._creditsScrollOffset = 0;
        return;
    }
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
const TEAM_SCROLL_DRAG_THRESHOLD = 8;

canvas.addEventListener('touchstart', (e) => {
    if (currentState !== 'TOURNAMENT_TEAM_SELECT') return;
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

// ===== TOUCH DRAG-SCROLL: CREDITS + GROUP STAGE =====
// Both screens only scrolled with a mouse wheel, so on a phone everything
// below the first screenful (most of the credits, the lower groups) was
// unreachable.
const dragScroll = { active: false, startY: 0, startOffset: 0, key: null, max: 0 };
function dragScrollTarget() {
    if (currentState === 'CREDITS') {
        return { key: '_creditsScrollOffset', max: Math.max(0, CREDITS_LIST.length * 34 - 370 + 10) };
    }
    if (currentState === 'TOURNAMENT_GROUP_STAGE') {
        const rows = Math.ceil((TournamentManager.groups.length || 8) / 4);
        return { key: '_groupScrollOffset', max: Math.max(0, rows * 215 + 50 - 420) };
    }
    return null;
}
canvas.addEventListener('touchstart', (e) => {
    const t = dragScrollTarget();
    if (!t) { dragScroll.active = false; return; }
    dragScroll.active = true;
    dragScroll.key = t.key;
    dragScroll.max = t.max;
    dragScroll.startY = getCanvasTouchPos(e).y;
    dragScroll.startOffset = window[t.key] || 0;
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
    if (!dragScroll.active) return;
    e.preventDefault();
    const dy = getCanvasTouchPos(e).y - dragScroll.startY;
    window[dragScroll.key] = Math.max(0, Math.min(dragScroll.max, dragScroll.startOffset - dy));
}, { passive: false });
canvas.addEventListener('touchend', () => { dragScroll.active = false; });
canvas.addEventListener('touchcancel', () => { dragScroll.active = false; });

canvas.addEventListener('touchend', () => {
    if (currentState === 'TOURNAMENT_TEAM_SELECT' && teamScrollTouch.active && !teamScrollTouch.moved) {
        if (window._teamTapCandidate !== null && typeof window._teamTapCandidate !== 'undefined') {
            selectTeamById(window._teamTapCandidate);
            SoundManager.playSFX('menuClick', 0.3);
        }
    }
    teamScrollTouch.active = false;
    teamScrollTouch.moved = false;
    window._teamTapCandidate = null;
});