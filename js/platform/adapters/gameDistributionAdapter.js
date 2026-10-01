// ===== PRO STRIKER - gameDistributionAdapter.js =====
// Adapter for the official GameDistribution.com HTML5 SDK.
// Docs verified against the current official sources:
//   - https://github.com/GameDistribution/GD-HTML5 (README — SDK/IMA/AD event tables)
//   - https://github.com/GameDistribution/GD-HTML5/wiki (Rewarded Ads, Display Ads pages)
//   - https://gamedistribution.com/developers/faq/gd's-sdk-integration/getting-started-(html5js)/
//
// GameDistribution SDK facts this adapter relies on (verified in docs):
//   - Current loader: window.GD_OPTIONS = { gameId, onEvent } is set BEFORE
//     injecting the CDN script. The current CDN entry point is
//     https://html5.api.gamedistribution.com/main.min.js (the older
//     //html5.api.gamedistribution.com/libs/gd/api.js + gdApi(...) IIFE
//     loader is explicitly documented elsewhere as legacy — not used here).
//   - The SDK instance is exposed on window as `gdsdk` (the docs are
//     explicit that this namespace name is fixed/back-compat and will not
//     change).
//   - Readiness: SDK_READY fires inside onEvent once the SDK has loaded —
//     ad calls must wait for this exactly like the other two adapters wait
//     for their own readiness signal.
//   - Lifecycle events (README "SDK EVENTS" table): SDK_READY, SDK_ERROR,
//     SDK_GAME_START ("game should start" — i.e. resume/unmute),
//     SDK_GAME_PAUSE ("game should pause" — i.e. pause/mute). Also
//     SDK_GDPR_TRACKING / SDK_GDPR_TARGETING / SDK_GDPR_THIRD_PARTY, which
//     this adapter does not act on since Pro Striker has no third-party
//     tracking/personalization to toggle.
//   - Ad calls (from the GD-HTML5 wiki):
//       gdsdk.showAd()                          -> interstitial/midgame ad
//       gdsdk.showAd('rewarded')                -> rewarded ad (preloads
//                                                    automatically if not
//                                                    already preloaded)
//       gdsdk.preloadAd('rewarded')              -> optional explicit
//                                                    preload, returns a
//                                                    Promise
//       gdsdk.showAd(gdsdk.AdType.Display, {containerId}) -> banner/display
//                                                    ad into a DOM element
//     showAd() always returns a Promise: resolves when the ad process is
//     done, rejects on error/no-fill. The wiki is explicit that a rejected
//     promise means "don't give a reward" for the rewarded case.
//   - SDK_REWARDED_WATCH_COMPLETE is the documented signal (seen in the
//     Defold/Construct integrations of this same SDK) that the rewarded
//     video was actually watched to completion — this adapter treats that
//     as the authoritative "safe to reward" signal when present, and falls
//     back to the showAd('rewarded') promise resolving when it isn't fired
//     separately (some SDK builds only surface the promise).
//   - Self-hosted games (Pro Striker's own site / GitHub Pages / itch.io,
//     as opposed to being embedded directly on gamedistribution.com) need
//     a GD_SDK_REFERRER_URL query parameter on their iframe per the
//     official self-hosting docs. This adapter does not need to set that
//     itself — it's a hosting/embedding concern for whoever iframes the
//     game, not something the SDK's JS API surface requires from us here.

(function () {
    const SDK_SCRIPT_ID = 'gamedistribution-jssdk';
    const SDK_URL = 'https://html5.api.gamedistribution.com/main.min.js';

    const GameDistributionAdapter = {
        name: 'gamedistribution',
        _ready: false,
        _sdkReady: false,
        _gameId: null,
        _pendingAdRequest: false,

        // Like GameMonetize, GameDistribution's SDK is designed to be
        // embedded only where a real gameId has been configured for this
        // specific game, and it only ever announces itself via SDK_READY
        // once the ad backend actually responds. There is no separate
        // synchronous "is this GameDistribution" signal to check first, so
        // detection means: load the script, wait (bounded) for SDK_READY.
        detect() {
            const cfg = (window.PLATFORM_CONFIG && window.PLATFORM_CONFIG.PLATFORM_SETTINGS.gamedistribution) || {};
            const pageId = window.GD_OPTIONS && window.GD_OPTIONS.gameId;
            this._gameId = pageId || cfg.gameId || null;

            return new Promise((resolve) => {
                let settled = false;
                const finish = (result) => { if (!settled) { settled = true; resolve(result); } };

                if (!this._gameId || this._gameId === 'your_game_id_here') {
                    finish(false);
                    return;
                }

                // Adopt the page-level snippet's events (see index.html) instead
                // of injecting a second copy of the SDK - mirrors how
                // gameMonetizeAdapter.js adopts window.SDK_OPTIONS.
                window.__gdEventHandler = (ev) => this._handleSdkEvent(ev, finish);
                const queued = window.__gdEventQueue || [];
                window.__gdEventQueue = [];
                queued.forEach((ev) => this._handleSdkEvent(ev, finish));

                const onGameDistributionHost = /gamedistribution/i.test(window.location.hostname || '');
                if (!window.GD_OPTIONS && !onGameDistributionHost) {
                    // Neither the page snippet nor a matching host: this can
                    // never become GameDistribution. Fail fast instead of
                    // ever fetching/running their SDK on an unrelated site -
                    // that would mean a real ad-serving script running (and
                    // able to show real or malicious ads) somewhere it was
                    // never meant to.
                    finish(false);
                    return;
                }
                if (!window.GD_OPTIONS) {
                    // No snippet in index.html (older build) - fall back to
                    // injecting the official loader ourselves.
                    window.GD_OPTIONS = {
                        gameId: this._gameId,
                        onEvent: (event) => this._handleSdkEvent(event, finish)
                    };
                    if (!document.getElementById(SDK_SCRIPT_ID)) {
                        const script = document.createElement('script');
                        script.id = SDK_SCRIPT_ID;
                        script.src = SDK_URL;
                        script.async = true;
                        script.onerror = () => finish(false);
                        document.head.appendChild(script);
                    }
                }

                // Bounded wait for SDK_READY: on a domain GameDistribution
                // doesn't serve ads to, or with no network access, SDK_READY
                // may simply never come.
                setTimeout(() => finish(this._sdkReady), 4000);
            });
        },

        _handleSdkEvent(event, onFirstReady) {
            switch (event.name) {
                case 'SDK_READY':
                    this._sdkReady = true;
                    this._ready = true;
                    console.log('[PlatformSDK][GameDistribution] SDK ready');
                    if (onFirstReady) onFirstReady(true);
                    break;
                case 'SDK_ERROR':
                    console.log('[PlatformSDK][GameDistribution] SDK_ERROR received');
                    break;
                case 'SDK_GAME_PAUSE':
                    if (this._pendingCallbacks && this._pendingCallbacks.onAdStarted) {
                        this._pauseSeenForCurrentRequest = true;
                        this._pendingCallbacks.onAdStarted();
                    }
                    break;
                case 'SDK_GAME_START':
                    // Mirrors the GameMonetize adapter's reasoning: this
                    // event means "the ad (if any) is over, resume" — the
                    // actual success/failure/reward decision for a
                    // specific request is driven by that request's own
                    // showAd()/preloadAd() Promise settling (see
                    // _requestAd below), not by this event alone, since
                    // this event fires for every ad regardless of type.
                    if (this._pendingCallbacks && this._pauseSeenForCurrentRequest) {
                        // Only resume-side bookkeeping here; onAdFinished/
                        // onAdFailed are driven by the Promise in
                        // _requestAd so they carry the correct outcome.
                        this._pauseSeenForCurrentRequest = false;
                    }
                    break;
                default:
                    break;
            }
        },

        async init() {
            return this._ready;
        },

        isSupported() {
            return this._ready && this._sdkReady;
        },

        _requestAd(adType, callbacks) {
            if (!this.isSupported()) { callbacks && callbacks.onAdFailed && callbacks.onAdFailed('not_supported'); return; }
            if (this._pendingAdRequest) { callbacks && callbacks.onAdFailed && callbacks.onAdFailed('already_pending'); return; }
            if (typeof window.gdsdk === 'undefined' || typeof window.gdsdk.showAd === 'undefined') {
                callbacks && callbacks.onAdFailed && callbacks.onAdFailed('sdk_object_missing');
                return;
            }
            this._pendingAdRequest = true;
            this._pendingCallbacks = callbacks || {};
            this._pauseSeenForCurrentRequest = false;

            const showPromise = adType === 'rewarded' ? window.gdsdk.showAd('rewarded') : window.gdsdk.showAd();

            showPromise.then(() => {
                this._pendingAdRequest = false;
                this._pendingCallbacks = null;
                callbacks && callbacks.onAdFinished && callbacks.onAdFinished();
            }).catch((error) => {
                this._pendingAdRequest = false;
                const sawPause = this._pauseSeenForCurrentRequest;
                this._pendingCallbacks = null;
                this._pauseSeenForCurrentRequest = false;
                // Per the wiki: a rejected showAd('rewarded') promise means
                // no fill / error — the reward must not be granted. sawPause
                // tells the caller whether anything was ever actually
                // paused/muted, so it knows whether there's anything to
                // restore.
                callbacks && callbacks.onAdFailed && callbacks.onAdFailed((error && error.message) || 'unfilled', sawPause);
            });
        },

        abortPendingAd() { this._pendingAdRequest = false; this._pendingCallbacks = null; this._pauseSeenForCurrentRequest = false; },

        showMidgameAd(callbacks) { this._requestAd('midgame', callbacks); },
        showRewardedAd(callbacks) { this._requestAd('rewarded', callbacks); },

        // GameDistribution DOES support real display/banner ads via
        // gdsdk.showAd(gdsdk.AdType.Display, { containerId }), but — same
        // situation as the CrazyGames adapter — this requires a persistent
        // DOM container element, and Pro Striker's UI has no such element
        // anywhere in index.html (100% canvas-rendered). Rather than
        // inject one outside this task's scope, this stays a documented
        // no-op, ready to wire up the moment a container exists.
        showBanner() {
            console.log('[PlatformSDK][GameDistribution] showBanner() skipped — no banner container in this build. See DEPLOYMENT.md.');
        },

        isRewardedAdAvailable() {
            // The SDK exposes gdsdk.preloadAd('rewarded') to check/prime
            // fill ahead of time, but that's an async Promise-based
            // pre-check, not a synchronous availability flag — consistent
            // with how the other adapters report this, we optimistically
            // say "available" whenever the platform itself is ready, and
            // let the actual request's promise settle the real outcome.
            return this.isSupported();
        },

        onGameplayStart() { /* GameDistribution's documented API has no explicit gameplay-start/stop hooks beyond SDK_GAME_START/PAUSE, which are already handled above. */ },
        onGameplayStop() { /* see onGameplayStart */ }
    };

    window.PLATFORM_ADAPTERS = window.PLATFORM_ADAPTERS || {};
    window.PLATFORM_ADAPTERS.gamedistribution = GameDistributionAdapter;
})();
