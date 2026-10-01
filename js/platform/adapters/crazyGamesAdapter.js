// ===== PRO STRIKER - crazyGamesAdapter.js =====
// Adapter for the official CrazyGames HTML5 SDK v3.
// Docs verified against https://docs.crazygames.com/sdk/ (v3, current as
// of this integration). Do not "simplify" this by assuming it behaves
// like the GameMonetize adapter — the two platforms use genuinely
// different SDKs, loading strategies, and ad APIs. See DEPLOYMENT.md.
//
// CrazyGames SDK facts this adapter relies on (verified in docs):
//   - Script tag: <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
//   - Must be manually initialized: await window.CrazyGames.SDK.init()
//   - No Game ID is passed in code; the SDK infers the game from the page
//     it's embedded in.
//   - Ads: window.CrazyGames.SDK.ad.requestAd("midgame" | "rewarded", { adStarted, adFinished, adError })
//   - adError fires on ANY failure to show an ad, including "unfilled" —
//     no reward may be granted in that case.
//   - Audio/pause: mute + pause on adStarted, unmute + resume on
//     adFinished OR adError (both mean "no ad is playing anymore").
//   - Environment: window.CrazyGames.SDK.environment is 'local' (localhost/
//     127.0.0.1), 'crazygames' (embedded on a CrazyGames domain), or
//     'disabled' (any other domain — e.g. your own site, GitHub Pages).
//     On 'disabled', ad calls throw, so this adapter simply reports itself
//     unsupported there rather than calling into the SDK at all.
//   - Banners require a DOM container element and are explicitly NOT
//     allowed during gameplay per CrazyGames' own ad requirements — Pro
//     Striker does not currently place any banner container in its UI, so
//     showBanner() here is a documented no-op (see isSupported()/method
//     comment) rather than a fake implementation.

(function () {
    const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) { resolve(); return; }
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load CrazyGames SDK script'));
            document.head.appendChild(s);
        });
    }

    const CrazyGamesAdapter = {
        name: 'crazygames',
        _ready: false,
        _environment: 'disabled',
        _pendingAdRequest: false,

        // Cheap synchronous check used by the detector BEFORE init() has
        // necessarily run — CrazyGames embeds games inside an iframe on
        // their domain, and passes no query string of its own, so the
        // only reliable pre-init signal is "are we allowed to load the
        // SDK and does it not immediately error". We treat CrazyGames as
        // "worth trying" whenever we are NOT clearly a bare unrelated
        // domain the SDK would just disable itself on anyway — actual
        // confirmation happens in init() via window.CrazyGames.SDK.environment.
        // This mirrors the SDK's own documented `local`/`crazygames`/
        // `disabled` model instead of inventing a new detection scheme.
        async detect() {
            try {
                // A defense-in-depth hostname pre-check, on top of (not
                // instead of) CrazyGames' own documented sitelock/environment
                // model above: their SDK is designed to be safely loadable
                // anywhere and self-report 'disabled' off-domain, but there
                // is no reason to fetch and execute a third-party script at
                // all on a host that was never CrazyGames or localhost - so
                // don't, even though their own sitelock would have kept ads
                // off regardless.
                const host = window.location.hostname || '';
                const onCrazyGamesHost = /crazygames/i.test(host);
                if (!onCrazyGamesHost) return false;

                await loadScript(SDK_URL);
                if (!window.CrazyGames || !window.CrazyGames.SDK) return false;
                await window.CrazyGames.SDK.init();
                this._environment = window.CrazyGames.SDK.environment;
                this._ready = true;
                // 'disabled' means we are running on a domain CrazyGames'
                // own sitelock does not recognize (e.g. GitHub Pages, your
                // own site). In that case this adapter should NOT be
                // selected — the generic/no-op adapter should run instead,
                // exactly as CrazyGames' own docs instruct for that case.
                return this._environment === 'local' || this._environment === 'crazygames';
            } catch (e) {
                console.log('[PlatformSDK][CrazyGames] Not available:', e.message || e);
                return false;
            }
        },

        async init() {
            // Already initialized during detect() — the v3 SDK's init()
            // is documented as safe to call once; detect() already did
            // the required await, so there is nothing further to do here.
            if (window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.game) {
                try { window.CrazyGames.SDK.game.loadingStop(); } catch (e) {}
            }
            return true;
        },

        isSupported() {
            return this._ready && (this._environment === 'local' || this._environment === 'crazygames');
        },

        // ----- Ad lifecycle -----
        // Shared by showMidgameAd/showRewardedAd since CrazyGames' own API
        // is identical for both except for the ad type string.
        _requestAd(adType, { onAdStarted, onAdFinished, onAdFailed } = {}) {
            if (!this.isSupported()) { onAdFailed && onAdFailed('not_supported'); return; }
            if (this._pendingAdRequest) { onAdFailed && onAdFailed('already_pending'); return; }
            this._pendingAdRequest = true;
            let adActuallyStarted = false;
            window.CrazyGames.SDK.ad.requestAd(adType, {
                adStarted: () => {
                    adActuallyStarted = true;
                    onAdStarted && onAdStarted();
                },
                adFinished: () => {
                    this._pendingAdRequest = false;
                    onAdFinished && onAdFinished();
                },
                adError: (error) => {
                    this._pendingAdRequest = false;
                    // Per CrazyGames docs: adError also covers "unfilled" —
                    // if the ad never actually started, the caller must not
                    // treat this as "an ad played and failed", just as "no
                    // ad was available".
                    onAdFailed && onAdFailed((error && error.code) || 'unfilled', adActuallyStarted);
                }
            });
        },

        abortPendingAd() { this._pendingAdRequest = false; },

        showMidgameAd(callbacks) { this._requestAd('midgame', callbacks); },
        showRewardedAd(callbacks) { this._requestAd('rewarded', callbacks); },

        // CrazyGames DOES support banners, but they require a persistent
        // DOM container element sized to one of their fixed banner sizes,
        // and their own ad requirements explicitly forbid showing banners
        // during gameplay. Pro Striker's UI is 100% canvas-rendered with
        // no such container present anywhere in index.html. Rather than
        // inject one (which would be a UI change outside this task's
        // scope) or fake a banner, this is a clearly-documented no-op.
        // See DEPLOYMENT.md for how to add real banner support later.
        showBanner() {
            console.log('[PlatformSDK][CrazyGames] showBanner() skipped — no banner container in this build. See DEPLOYMENT.md.');
        },

        isRewardedAdAvailable() {
            // CrazyGames does not expose a pre-check for rewarded ad fill
            // rate before requesting one — availability is only known once
            // requestAd resolves. We optimistically report "available"
            // whenever the platform itself is supported, matching
            // CrazyGames' own guidance to just request at the opportune
            // moment and handle adError gracefully.
            return this.isSupported();
        },

        onGameplayStart() {
            if (this.isSupported() && window.CrazyGames.SDK.game) {
                try { window.CrazyGames.SDK.game.gameplayStart(); } catch (e) {}
            }
        },
        onGameplayStop() {
            if (this.isSupported() && window.CrazyGames.SDK.game) {
                try { window.CrazyGames.SDK.game.gameplayStop(); } catch (e) {}
            }
        }
    };

    window.PLATFORM_ADAPTERS = window.PLATFORM_ADAPTERS || {};
    window.PLATFORM_ADAPTERS.crazygames = CrazyGamesAdapter;
})();
