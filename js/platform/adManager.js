// ===== PRO STRIKER - adManager.js =====
(function () {
    const cfg = () => (window.PLATFORM_CONFIG && window.PLATFORM_CONFIG.AD_STRATEGY) || {};
    const UNLOCK_KEY = 'prostriker_unlocked_teams_v1';

    const state = {
        matchesSinceAd: 0,
        gapIndex: 0,
        adRequestInFlight: false,
        wasMusicEnabledBeforeAd: true,
        wasSfxEnabledBeforeAd: true,
        tournamentContinueUsedForMatch: null,
        skipNextMidgame: false
    };

    let unlockedTeams = new Set();
    function loadUnlocked() {
        try {
            const raw = (typeof CloudSync !== 'undefined' && CloudSync && typeof CloudSync.getItem === 'function')
                ? CloudSync.getItem(UNLOCK_KEY)
                : localStorage.getItem(UNLOCK_KEY);
            if (raw === null || raw === undefined || raw === '') {
                const fallback = localStorage.getItem(UNLOCK_KEY);
                if (fallback) unlockedTeams = new Set(JSON.parse(fallback));
                return;
            }
            unlockedTeams = new Set(JSON.parse(raw));
        } catch (e) {
            try { const raw = localStorage.getItem(UNLOCK_KEY); if (raw) unlockedTeams = new Set(JSON.parse(raw)); } catch (err) {}
        }
    }
    function saveUnlocked() {
        try {
            const payload = JSON.stringify([...unlockedTeams]);
            if (typeof CloudSync !== 'undefined' && CloudSync && typeof CloudSync.setItem === 'function') {
                CloudSync.setItem(UNLOCK_KEY, payload);
            } else {
                localStorage.setItem(UNLOCK_KEY, payload);
            }
        } catch (e) {}
    }
    loadUnlocked();

    function muteForAd() {
        state.wasMusicEnabledBeforeAd = SoundManager.musicEnabled;
        state.wasSfxEnabledBeforeAd = SoundManager.sfxEnabled;
        if (SoundManager.musicEnabled) SoundManager.stopMusic();
        SoundManager.musicEnabled = false;
        SoundManager.sfxEnabled = false;
    }
    function unmuteAfterAd() {
        SoundManager.musicEnabled = state.wasMusicEnabledBeforeAd;
        SoundManager.sfxEnabled = state.wasSfxEnabledBeforeAd;
        if (SoundManager.musicEnabled) SoundManager.updateMusicForState(currentState);
    }

    // ----- Watchdog -----
    // Every ad request goes through runAd(). If the platform SDK never starts
    // the ad (or never reports that it ended), the request is failed on our
    // side so adRequestInFlight can't stay true forever - while it is true the
    // result screens ignore taps, so a silent SDK used to leave the game
    // stuck. Timings are deliberately generous: real ads take a few seconds to
    // load, and a full video ad can run 30-60s.
    const AD_START_TIMEOUT_MS = 12000;
    const AD_MAX_TOTAL_MS = 150000;

    function runAd(showFn, h) {
        let settled = false, started = false;
        let startTimer = null, maxTimer = null;
        const clearTimers = () => { clearTimeout(startTimer); clearTimeout(maxTimer); };
        const finish = () => { if (settled) return; settled = true; clearTimers(); if (h && h.finished) h.finished(); };
        const fail = (code, adStarted) => { if (settled) return; settled = true; clearTimers(); if (h && h.failed) h.failed(code, adStarted); };
        const giveUp = (why) => {
            console.warn('[AdManager] ad request timed out (' + why + ') - continuing without it');
            try { PlatformSDK.abortPendingAd(); } catch (e) {}
            fail('timeout', started);
        };
        startTimer = setTimeout(() => { if (!started) giveUp('never started'); }, AD_START_TIMEOUT_MS);
        maxTimer = setTimeout(() => giveUp('never finished'), AD_MAX_TOTAL_MS);
        try {
            showFn({
                onAdStarted: () => { if (settled) return; started = true; clearTimeout(startTimer); if (h && h.started) h.started(); },
                onAdFinished: () => finish(),
                onAdFailed: (code, adStarted) => fail(code, adStarted)
            });
        } catch (e) {
            fail('exception', started);
        }
    }

    const AdManager = {
        // ----- Normal (midgame) ads: every match, every mode -----
        recordNormalMatchCompleted() { state.matchesSinceAd++; },

        shouldOfferNormalMatchAd() {
            if (!PlatformSDK.isSupported()) return false;
            const gaps = cfg().matchAdGaps || [2, 3];
            if (state.matchesSinceAd < gaps[state.gapIndex % gaps.length]) return false;
            if (state.skipNextMidgame) { state.skipNextMidgame = false; return false; }
            return true;
        },

        requestNormalMatchAd(onDone) {
            if (state.adRequestInFlight) return;
            if (!PlatformSDK.isSupported()) { onDone && onDone(); return; }
            state.adRequestInFlight = true;
            state.matchesSinceAd = 0;
            state.gapIndex++;
            runAd((cb) => PlatformSDK.showMidgameAd(cb), {
                started: () => muteForAd(),
                finished: () => { state.adRequestInFlight = false; unmuteAfterAd(); onDone && onDone(); },
                failed: (code, adStarted) => {
                    state.adRequestInFlight = false;
                    if (adStarted) unmuteAfterAd();
                    onDone && onDone();
                }
            });
        },

        // ----- Tournament +45s rewarded continue -----
        hasUsedContinueForMatch(uid) { return state.tournamentContinueUsedForMatch === uid; },

        canOfferTournamentContinue(matchUid, isFinalRound, isGroup) {
            if (!PlatformSDK.isSupported()) return false;
            if (!PlatformSDK.isRewardedAdAvailable()) return false;
            if (gameMode === '1v1') return false;
            if (isFinalRound) return false;
            if (isGroup && !cfg().tournamentContinueGroupStage) return false;
            if (this.hasUsedContinueForMatch(matchUid)) return false;
            return true;
        },

        requestTournamentContinueAd(matchUid, { onReward, onDeclinedOrFailed } = {}) {
            if (!PlatformSDK.isSupported() || !PlatformSDK.isRewardedAdAvailable()) {
                onDeclinedOrFailed && onDeclinedOrFailed('rewarded_unavailable');
                return;
            }
            if (state.adRequestInFlight) return;
            state.adRequestInFlight = true;
            runAd((cb) => PlatformSDK.showRewardedAd(cb), {
                started: () => muteForAd(),
                finished: () => {
                    state.adRequestInFlight = false;
                    unmuteAfterAd();
                    state.tournamentContinueUsedForMatch = matchUid;
                    state.skipNextMidgame = true; // never midgame right after rewarded
                    onReward && onReward();
                },
                failed: (code, adStarted) => {
                    state.adRequestInFlight = false;
                    if (adStarted) unmuteAfterAd();
                    onDeclinedOrFailed && onDeclinedOrFailed(code);
                }
            });
        },

        // ----- Optional rewarded ad for shop coins (player-initiated only) -----
        canOfferCoinAd() {
            return PlatformSDK.isSupported() && PlatformSDK.isRewardedAdAvailable() && !state.adRequestInFlight;
        },
        requestCoinReward({ onReward, onFail } = {}) {
            if (!PlatformSDK.isSupported() || !PlatformSDK.isRewardedAdAvailable()) {
                onFail && onFail('rewarded_unavailable');
                return;
            }
            if (state.adRequestInFlight) return;
            state.adRequestInFlight = true;
            runAd((cb) => PlatformSDK.showRewardedAd(cb), {
                started: () => muteForAd(),
                finished: () => {
                    state.adRequestInFlight = false;
                    unmuteAfterAd();
                    state.skipNextMidgame = true; // never a midgame ad right after a rewarded one
                    onReward && onReward();
                },
                failed: (code, adStarted) => {
                    state.adRequestInFlight = false;
                    if (adStarted) unmuteAfterAd();
                    onFail && onFail(code);
                }
            });
        },

        // ----- Locked team unlock (once per team, saved) -----
        isLockedTeamUnlockEnabled() {
            return !!cfg().lockedTeamRewardedUnlockEnabled && PlatformSDK.isSupported();
        },
        isTeamLocked(teamId) {
            return this.isLockedTeamUnlockEnabled() &&
                (cfg().lockedTeamIds || []).includes(teamId) &&
                !unlockedTeams.has(teamId);
        },
        // onDone() always fires: ad watched OR ad unavailable (unlocks free so nobody gets stuck)
        requestTeamUnlock(teamId, onDone) {
            if (state.adRequestInFlight) return;
            state.adRequestInFlight = true;
            const giveReward = () => { unlockedTeams.add(teamId); saveUnlocked(); onDone && onDone(true); };
            const failGracefully = () => { onDone && onDone(false); };
            runAd((cb) => PlatformSDK.showRewardedAd(cb), {
                started: () => muteForAd(),
                finished: () => { state.adRequestInFlight = false; unmuteAfterAd(); giveReward(); },
                failed: (code, adStarted) => {
                    state.adRequestInFlight = false;
                    if (adStarted) unmuteAfterAd();
                    failGracefully();
                }
            });
        },

        reloadUnlockedTeams() {
            unlockedTeams = new Set();
            loadUnlocked();
        },

        isAdRequestInFlight() { return state.adRequestInFlight; },
        getBonusSeconds() { return cfg().tournamentContinueBonusSeconds || 45; },
        getOfferSeconds() { return cfg().tournamentContinueOfferSeconds || 6; }
    };

    window.AdManager = AdManager;
})();