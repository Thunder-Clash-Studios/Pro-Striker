// ===== PRO STRIKER - gameMonetizeAdapter.js =====
// Adapter for the official GameMonetize.com HTML5 SDK.
// Docs verified against https://github.com/GameMonetize/GameMonetize.com-SDK
// (README, current as of this integration) and https://gamemonetize.com/sdk.
//
// GameMonetize SDK facts this adapter relies on (verified in docs):
//   - Loaded via window.SDK_OPTIONS = { gameId, onEvent } BEFORE injecting
//     https://api.gamemonetize.com/sdk.js (the snippet appends the script
//     itself — see loadSdk() below, which reproduces the official snippet
//     exactly rather than re-implementing it).
//   - There is NO separate initialization call — the SDK announces
//     readiness via the "SDK_READY" event inside onEvent.
//   - There is only ONE ad-trigger call in the entire documented API:
//         sdk.showBanner()
//     Despite the name, GameMonetize's own docs/community confirm this
//     shows a full interstitial-style video ad, not a small banner strip.
//     There is NO separate/distinct "rewarded ad" call documented anywhere
//     in the official SDK — GameMonetize does not expose a way to request
//     specifically a rewarded ad, nor a way to know in code whether the ad
//     that just played was "successful" beyond the pause/resume events.
//   - Lifecycle is communicated only through two onEvent cases:
//       "SDK_GAME_PAUSE" -> an ad is about to play: pause + mute NOW.
//       "SDK_GAME_START" -> the ad is done: resume + unmute NOW.
//     There is no distinct "ad failed"/"unfilled" event in this SDK. If no
//     ad is available, GameMonetize's own guidance (and community reports)
//     confirm SDK_GAME_PAUSE/SDK_GAME_START may not fire at all, or may
//     fire back-to-back near-instantly. This adapter treats "the game was
//     never actually paused before SDK_GAME_START fired" as No safe
//     reward signal — see showRewardedAd() below for exactly how this is
//     handled honestly instead of being papered over.
//
// IMPORTANT — read before assuming this adapter is "missing" a rewarded
// API: it isn't. GameMonetize's official SDK genuinely does not have one.
// showRewardedAd() below reuses showBanner() because that is the ONLY
// call GameMonetize documents for triggering any video ad at all.

(function () {
    const SDK_SCRIPT_ID = 'gamemonetize-sdk';

    const GameMonetizeAdapter = {
        name: 'gamemonetize',
        _ready: false,
        _sdkReady: false,
        _pendingAdRequest: false,
        _pendingCallbacks: null,
        _pauseSeenForCurrentRequest: false,
        _gameId: null,

        // Detection model (rewritten):
        //   The official snippet now lives in index.html (GameMonetize's
        //   "Verify SDK in the game" tool looks for it there), so by the time
        //   this runs the SDK is normally already loading. We ADOPT it:
        //     1. Hook window.__gmEventHandler (index.html queued any early events).
        //     2. If SDK_READY already happened, or the `sdk` global with
        //        showBanner already exists, we are ready immediately.
        //     3. Otherwise wait for SDK_READY, bounded.
        //   If index.html has no snippet (e.g. an older build) we fall back to
        //   injecting it from here, exactly like before.
        detect() {
            const cfg = (window.PLATFORM_CONFIG && window.PLATFORM_CONFIG.PLATFORM_SETTINGS.gamemonetize) || {};
            const optId = window.SDK_OPTIONS && window.SDK_OPTIONS.gameId;
            this._gameId = optId || cfg.gameId || null;
            console.log('[PlatformSDK][GameMonetize] detect() called. page snippet present:', !!window.SDK_OPTIONS, '| resolved gameId:', JSON.stringify(this._gameId));

            return new Promise((resolve) => {
                let settled = false;
                const finish = (result) => { if (!settled) { settled = true; resolve(result); } };

                if (!this._gameId || this._gameId === 'your_game_id_here') {
                    console.log('[PlatformSDK][GameMonetize] No valid gameId configured - skipping.');
                    finish(false);
                    return;
                }

                // Adopt events from the index.html snippet (replay anything queued).
                window.__gmEventHandler = (ev) => this._handleSdkEvent(ev, finish);
                const queued = window.__gmEventQueue || [];
                window.__gmEventQueue = [];
                queued.forEach((ev) => this._handleSdkEvent(ev, finish));

                // Fallback: no snippet in the page -> inject the official one
                // now, but ONLY on an actual GameMonetize host. Without this
                // check, this fallback used to self-inject GameMonetize's ad
                // SDK on EVERY host (GitHub Pages, itch.io, a personal site,
                // anywhere) as a side effect of merely trying detection - a
                // real ad-serving script running, and able to show real (or
                // malicious/scam) ads, on sites that were never GameMonetize
                // at all. See index.html's own hostname-gated loader, which
                // this mirrors exactly - that is the ONLY sanctioned place
                // this SDK is allowed to load from on a non-GameMonetize host.
                const onGameMonetizeHost = /gamemonetize/i.test(window.location.hostname || '');
                if (!window.SDK_OPTIONS && !onGameMonetizeHost) {
                    // Neither the page snippet nor a matching host: this can
                    // never become GameMonetize. Fail fast instead of polling
                    // for up to 6s for an SDK_READY that will never come.
                    console.log('[PlatformSDK][GameMonetize] Not a GameMonetize host and no page snippet - skipping without loading anything.');
                    finish(false);
                    return;
                }
                if (!window.SDK_OPTIONS && onGameMonetizeHost) {
                    console.log('[PlatformSDK][GameMonetize] No snippet in index.html - injecting api.gamemonetize.com/sdk.js now.');
                    window.SDK_OPTIONS = {
                        gameId: this._gameId,
                        onEvent: (event) => this._handleSdkEvent(event, finish)
                    };
                    (function (a, b, c) {
                        const d = a.getElementsByTagName(b)[0];
                        if (!a.getElementById(c)) {
                            a = a.createElement(b);
                            a.id = c;
                            a.src = 'https://api.gamemonetize.com/sdk.js';
                            d.parentNode.insertBefore(a, d);
                        }
                    })(document, 'script', SDK_SCRIPT_ID);
                }

                // The SDK object can exist before/without a SDK_READY event we
                // saw (it may have fired before we attached). Poll for it.
                const startedAt = Date.now();
                const poll = setInterval(() => {
                    if (settled) { clearInterval(poll); return; }
                    if (this._sdkReady) { clearInterval(poll); finish(true); return; }
                    if (typeof window.sdk !== 'undefined' && typeof window.sdk.showBanner === 'function') {
                        console.log('[PlatformSDK][GameMonetize] sdk global found - treating SDK as ready.');
                        this._sdkReady = true; this._ready = true;
                        clearInterval(poll); finish(true); return;
                    }
                    if (Date.now() - startedAt > 6000) {
                        clearInterval(poll);
                        console.log('[PlatformSDK][GameMonetize] Not available: no SDK_READY / sdk global within 6000ms (blocked, offline, or this host is not GameMonetize).');
                        finish(false);
                    }
                }, 150);
            });
        },

        _handleSdkEvent(event, onFirstReady) {
            switch (event.name) {
                case 'SDK_READY':
                    this._sdkReady = true;
                    this._ready = true;
                    console.log('[PlatformSDK][GameMonetize] SDK ready');
                    if (onFirstReady) onFirstReady(true);
                    break;
                case 'SDK_GAME_PAUSE':
                    this._pauseSeenForCurrentRequest = true;
                    if (this._pendingCallbacks && this._pendingCallbacks.onAdStarted) {
                        this._pendingCallbacks.onAdStarted();
                    }
                    break;
                case 'SDK_GAME_START':
                    // Ad (if any) is over. GameMonetize gives no separate
                    // failure event, so we infer success/failure from
                    // whether we actually saw SDK_GAME_PAUSE first for this
                    // specific request.
                    if (this._pendingAdRequest) {
                        const cbs = this._pendingCallbacks;
                        const sawPause = this._pauseSeenForCurrentRequest;
                        this._pendingAdRequest = false;
                        this._pendingCallbacks = null;
                        this._pauseSeenForCurrentRequest = false;
                        if (cbs) {
                            if (sawPause && cbs.onAdFinished) cbs.onAdFinished();
                            else if (!sawPause && cbs.onAdFailed) cbs.onAdFailed('unfilled', false);
                        }
                    }
                    break;
                default:
                    break;
            }
        },

        async init() {
            // Nothing further to do — detect() already performed the full
            // official load sequence and waited for SDK_READY.
            return this._ready;
        },

        isSupported() {
            return this._ready && this._sdkReady;
        },

        // GameMonetize's docs only ever describe ONE ad type. Both
        // "midgame" and "rewarded" in Pro Striker's own strategy map to
        // this same underlying call — this is not a shortcut, it's the
        // actual limit of the documented API. See file header.
        _requestBannerAd(callbacks) {
            if (!this.isSupported()) { callbacks && callbacks.onAdFailed && callbacks.onAdFailed('not_supported'); return; }
            if (this._pendingAdRequest) { callbacks && callbacks.onAdFailed && callbacks.onAdFailed('already_pending'); return; }
            if (typeof window.sdk === 'undefined' || typeof window.sdk.showBanner === 'undefined') {
                callbacks && callbacks.onAdFailed && callbacks.onAdFailed('sdk_object_missing');
                return;
            }
            this._pendingAdRequest = true;
            this._pendingCallbacks = callbacks || {};
            this._pauseSeenForCurrentRequest = false;
            try {
                window.sdk.showBanner();
            } catch (e) {
                this._pendingAdRequest = false;
                this._pendingCallbacks = null;
                callbacks && callbacks.onAdFailed && callbacks.onAdFailed('exception');
            }
        },

        abortPendingAd() { this._pendingAdRequest = false; this._pendingCallbacks = null; this._pauseSeenForCurrentRequest = false; },

        showMidgameAd(callbacks) { this._requestBannerAd(callbacks); },
        // Honest limitation: GameMonetize has no dedicated rewarded-ad
        // call. We use the same showBanner() call, and only grant the
        // reward if SDK_GAME_PAUSE genuinely fired first (see
        // _handleSdkEvent above) — i.e. an ad genuinely appeared to play.
        showRewardedAd(callbacks) {
            // GameMonetize has no genuine rewarded-ad API in the official SDK.
            // Fail safely instead of pretending a normal banner/interstitial is a
            // rewarded completion.
            callbacks && callbacks.onAdFailed && callbacks.onAdFailed('rewarded_unavailable', false);
        },

        // GameMonetize's documented API has no separate banner-strip
        // concept distinct from showBanner()'s interstitial behavior, so
        // there is nothing additional to implement here beyond the ad
        // calls above.
        showBanner() {
            console.log('[PlatformSDK][GameMonetize] showBanner() is the same call used for midgame/rewarded ads on this platform — see showMidgameAd/showRewardedAd.');
        },

        isRewardedAdAvailable() {
            // This SDK does not provide a real rewarded flow. Treat it as
            // unavailable so tournament continuation falls back to the normal
            // non-rewarded path instead of pretending a banner ad grants a reward.
            return false;
        },

        onGameplayStart() { /* GameMonetize's documented API has no gameplay-start/stop hooks. */ },
        onGameplayStop() { /* GameMonetize's documented API has no gameplay-start/stop hooks. */ }
    };

    window.PLATFORM_ADAPTERS = window.PLATFORM_ADAPTERS || {};
    window.PLATFORM_ADAPTERS.gamemonetize = GameMonetizeAdapter;
})();
