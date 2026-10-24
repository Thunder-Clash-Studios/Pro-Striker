// ===== PRO STRIKER - genericWebAdapter.js =====
// Fallback adapter used on localhost, GitHub Pages, or any host where no
// supported ad SDK is present/detected. This is NOT a fake ad SDK — it
// deliberately does nothing observable to the player:
//   - No ads are ever shown.
//   - Rewarded actions always report failure (no reward), so calling code
//     never grants a reward it didn't actually earn.
//   - No console spam in normal operation (a single one-time notice only).
//   - No crashes if game code calls any platform method.
// This lets the exact same build run correctly with zero special-casing
// anywhere else in the codebase.

(function () {
    const GenericWebAdapter = {
        name: 'generic',
        _loggedOnce: false,

        async detect() {
            // Always "detectable" — this is the adapter of last resort and
            // is only selected if every other platform adapter's detect()
            // returned false. See platformSDK.js detectPlatform().
            return true;
        },

        async init() {
            if (!this._loggedOnce) {
                console.log('[PlatformSDK] No supported ad platform detected — running with ads disabled (localhost/unsupported host). This is expected during local development and on hosts like GitHub Pages.');
                this._loggedOnce = true;
            }
            return true;
        },

        // Reports itself as "not supported" on purpose — this is the
        // signal the rest of the game uses to hide/disable ad-related UI
        // entirely rather than showing buttons that do nothing.
        isSupported() {
            return false;
        },

        showMidgameAd(callbacks) {
            callbacks && callbacks.onAdFailed && callbacks.onAdFailed('no_platform', false);
        },
        showRewardedAd(callbacks) {
            callbacks && callbacks.onAdFailed && callbacks.onAdFailed('no_platform', false);
        },
        showBanner() { /* no-op */ },
        isRewardedAdAvailable() { return false; },
        onGameplayStart() { /* no-op */ },
        onGameplayStop() { /* no-op */ }
    };

    window.PLATFORM_ADAPTERS = window.PLATFORM_ADAPTERS || {};
    window.PLATFORM_ADAPTERS.generic = GenericWebAdapter;
})();
