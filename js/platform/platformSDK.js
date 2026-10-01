// ===== PRO STRIKER - platformSDK.js =====
// This is the ONE object the core game is allowed to talk to for anything
// ad/platform related. It never knows about CrazyGames or GameMonetize by
// name — it only knows about "the active adapter" (see
// js/platform/adapters/*.js), selected once at startup by detectPlatform().
//
// Contract (deliberately small and platform-agnostic):
//   PlatformSDK.init()                          -> Promise, call once at startup
//   PlatformSDK.isSupported()                   -> bool: is a real ad platform active right now?
//   PlatformSDK.showMidgameAd(callbacks)         -> request a midgame/interstitial ad
//   PlatformSDK.showRewardedAd(callbacks)        -> request a rewarded ad
//   PlatformSDK.showBanner()                     -> request a banner (see adapters for support)
//   PlatformSDK.isRewardedAdAvailable()          -> bool, best-effort pre-check
//   PlatformSDK.onGameplayStart()/onGameplayStop() -> optional lifecycle pings
//
// callbacks shape (all optional): { onAdStarted, onAdFinished, onAdFailed }
//   onAdStarted()          -> an ad is actually visible NOW: pause + mute NOW.
//   onAdFinished()         -> ad played to completion: resume + unmute, reward is safe to grant.
//   onAdFailed(code, adStarted) -> no reward, ever. If adStarted was never
//                                  true, nothing was ever paused/muted, so
//                                  there is nothing to restore either.
//
// On any host with no supported SDK, isSupported() is false and every ad
// call fails through onAdFailed WITHOUT ever calling onAdStarted — so
// nothing ever gets muted/paused/stuck for a reason that never happened.

(function () {
    const PlatformSDK = {
        _activeAdapter: null,
        _initialized: false,
        _initPromise: null,

        async detectPlatform() {
            const adapters = window.PLATFORM_ADAPTERS || {};
            const cfg = window.PLATFORM_CONFIG || { ACTIVE_PLATFORM: 'auto' };
            const forced = cfg.ACTIVE_PLATFORM;

            if (forced && forced !== 'auto') {
                const forcedAdapter = adapters[forced];
                if (forcedAdapter) {
                    console.log(`[PlatformSDK] ACTIVE_PLATFORM forced to "${forced}" in platformConfig.js`);
                    return forcedAdapter;
                }
                console.warn(`[PlatformSDK] ACTIVE_PLATFORM is set to "${forced}" but no such adapter exists — falling back to auto-detect.`);
            }

            // Auto-detect order: real ad platforms first, generic last.
            // Order matters only in the sense that 'generic' always
            // returns true and must be tried last (it's the fallback).
            // When the game is clearly being served from / embedded by
            // GameMonetize (its snippet is in index.html and the host, referrer or
            // ancestor is gamemonetize.com), try GameMonetize FIRST so a slow or
            // hanging CrazyGames probe can never delay or steal detection.
            const hostHints = [location.hostname, document.referrer || ''];
            try { if (window.location.ancestorOrigins) hostHints.push(...Array.from(window.location.ancestorOrigins)); } catch (e) {}
            const onGameMonetize = hostHints.some((h) => /gamemonetize/i.test(h));
            const onGameDistribution = hostHints.some((h) => /gamedistribution/i.test(h));
            const onCrazyGames = hostHints.some((h) => /crazygames/i.test(h));
            let order;
            if (onGameMonetize) order = ['gamemonetize', 'crazygames', 'gamedistribution', 'generic'];
            else if (onGameDistribution) order = ['gamedistribution', 'crazygames', 'gamemonetize', 'generic'];
            else if (onCrazyGames) order = ['crazygames', 'gamemonetize', 'gamedistribution', 'generic'];
            else order = ['crazygames', 'gamemonetize', 'gamedistribution', 'generic'];
            if (onGameMonetize) console.log('[PlatformSDK] GameMonetize host detected - trying GameMonetize first.');
            else if (onGameDistribution) console.log('[PlatformSDK] GameDistribution host detected - trying GameDistribution first.');
            console.log('[PlatformSDK] Adapters registered at detect time:', Object.keys(adapters));
            for (const key of order) {
                const adapter = adapters[key];
                if (!adapter) { console.log(`[PlatformSDK] No adapter registered for "${key}" — skipping.`); continue; }
                console.log(`[PlatformSDK] Trying adapter: ${key}`);
                try {
                    // Bounded: a blocked / black-holed SDK script must not be able to
                    // stall platform detection (and with it every ad) forever.
                    const detected = await Promise.race([
                        adapter.detect(),
                        new Promise((resolve) => setTimeout(() => resolve(false), 8000))
                    ]);
                    if (detected) {
                        console.log(`[PlatformSDK] Detected platform: ${key}`);
                        return adapter;
                    }
                } catch (e) {
                    console.log(`[PlatformSDK] ${key} detection threw, skipping:`, e.message || e);
                }
            }

            // Should be unreachable since 'generic'.detect() always
            // resolves true, but guard anyway so the game never crashes
            // on a platform-layer bug.
            console.warn('[PlatformSDK] No adapter detected at all, including generic — using an inert stub.');
            return adapters.generic || {
                name: 'stub',
                init: async () => true,
                isSupported: () => false,
                showMidgameAd: (cb) => cb && cb.onAdFailed && cb.onAdFailed('no_platform', false),
                showRewardedAd: (cb) => cb && cb.onAdFailed && cb.onAdFailed('no_platform', false),
                showBanner: () => {},
                isRewardedAdAvailable: () => false,
                onGameplayStart: () => {},
                onGameplayStop: () => {}
            };
        },

        init() {
            if (this._initPromise) return this._initPromise;
            this._initPromise = (async () => {
                this._activeAdapter = await this.detectPlatform();
                try {
                    await this._activeAdapter.init();
                } catch (e) {
                    console.error('[PlatformSDK] Active adapter init() threw — treating platform as unsupported:', e);
                    this._activeAdapter = window.PLATFORM_ADAPTERS.generic;
                    await this._activeAdapter.init();
                }
                this._initialized = true;
                console.log(`[PlatformSDK] Ready. Active platform: ${this._activeAdapter.name}, supported: ${this._activeAdapter.isSupported()}`);
                return this._activeAdapter;
            })();
            return this._initPromise;
        },

        getPlatformName() {
            return this._activeAdapter ? this._activeAdapter.name : 'unknown';
        },

        isSupported() {
            return !!(this._activeAdapter && this._activeAdapter.isSupported());
        },

        showMidgameAd(callbacks) {
            if (!this._activeAdapter) { callbacks && callbacks.onAdFailed && callbacks.onAdFailed('not_initialized', false); return; }
            this._activeAdapter.showMidgameAd(callbacks);
        },

        showRewardedAd(callbacks) {
            if (!this._activeAdapter) { callbacks && callbacks.onAdFailed && callbacks.onAdFailed('not_initialized', false); return; }
            this._activeAdapter.showRewardedAd(callbacks);
        },

        showBanner() {
            if (!this._activeAdapter) return;
            this._activeAdapter.showBanner();
        },

        isRewardedAdAvailable() {
            return !!(this._activeAdapter && this._activeAdapter.isRewardedAdAvailable());
        },

        // Forgets an ad request that never reported back, so the adapter accepts
        // the next one. Optional per adapter.
        abortPendingAd() {
            if (this._activeAdapter && typeof this._activeAdapter.abortPendingAd === 'function') this._activeAdapter.abortPendingAd();
        },

        onGameplayStart() {
            if (this._activeAdapter) this._activeAdapter.onGameplayStart();
        },
        onGameplayStop() {
            if (this._activeAdapter) this._activeAdapter.onGameplayStop();
        }
    };

    window.PlatformSDK = PlatformSDK;
})();
