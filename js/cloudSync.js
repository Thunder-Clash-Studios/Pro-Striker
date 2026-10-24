// ===== PRO STRIKER - cloudSync.js =====
// Adds CrazyGames' free, built-in cross-device save sync (the "data" module:
// https://docs.crazygames.com/sdk/html5-v3/data) on top of the existing
// localStorage saves - GameMonetize and GameDistribution have no account/
// save system of their own, so on those (and everywhere else) this module
// is a same-behavior-as-before passthrough to plain localStorage.
//
// WHY THIS EXISTS AS ITS OWN FILE, LOADED FIRST:
// Every save/load in the game (Shop, Progress, tournament resume, tutorial
// flags, stats) already runs synchronously against `localStorage`, the
// instant each of those files is first touched - which happens well before
// PlatformSDK finishes detecting CrazyGames (that detection is async: it
// has to `await window.CrazyGames.SDK.init()`, and the SDK script itself
// is fetched over the network). There is no way to block startup on that
// without slowing down every player on every portal - so instead:
//   1. On first use, CloudSync reads/writes plain localStorage exactly as
//      every call site already expects (zero change in behavior, zero
//      added delay).
//   2. Once PlatformSDK confirms CrazyGames is active AND its data module
//      is available, CloudSync migrates every existing prostriker_* key
//      into CrazyGames' data module ONCE (their own docs' documented
//      migration pattern for already-published games), then switches all
//      further reads/writes to go through CrazyGames' data module instead
//      - which auto-syncs across that player's devices for logged-in users,
//      and silently behaves exactly like localStorage for guests.
//   3. If a player is never on CrazyGames, or their SDK never loads, this
//      module is permanently a no-op passthrough - nothing about existing
//      behavior changes.
//
// CALL SITES: every existing file (globals.js, shop.js, progress.js,
// tournament.js, tutorial.js) already calls `localStorage.getItem/
// setItem/removeItem` directly. Rather than touch five already-working
// files and their eleven call sites, each of those calls is changed to go
// through `CloudSync.getItem/setItem/removeItem` instead - identical
// signatures, so each edit is a one-line, easily-verified swap.

const CloudSync = {
    _migrated: false,
    _usingCloud: false,

    // Called once from main.js's bootstrap, AFTER PlatformSDK.init() has
    // resolved - so getPlatformName()/isSupported() are meaningful by then.
    // Every save made before this call already went to localStorage
    // (unchanged behavior); this only decides where saves go FROM HERE ON.
    trySwitchToCloud() {
        if (this._migrated) return;   // never run the migration twice
        try {
            if (typeof PlatformSDK === 'undefined' || PlatformSDK.getPlatformName() !== 'crazygames') return;
            const data = window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.data;
            if (!data || typeof data.getItem !== 'function' || typeof data.setItem !== 'function') return;

            // One-time migration: copy every prostriker_* key currently in
            // localStorage into CrazyGames' data module, exactly as their
            // own docs recommend for already-published games. If the
            // player already has cloud data (returning on a synced
            // device), that data module value already existed and takes
            // precedence - migration only fills in keys the cloud doesn't
            // have yet, so a second device's local guest-progress can
            // never stomp over the player's real synced progress.
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || key.indexOf('prostriker_') !== 0) continue;
                try {
                    const existing = data.getItem(key);
                    if (existing === null || existing === undefined) {
                        const local = localStorage.getItem(key);
                        if (local !== null) data.setItem(key, local);
                    }
                } catch (e) { /* one bad key must not abort the rest of the migration */ }
            }

            this._usingCloud = true;
            this._migrated = true;
            console.log('[CloudSync] Switched to CrazyGames cloud save - progress now syncs across devices.');
            if (typeof AdManager !== 'undefined' && typeof AdManager.reloadUnlockedTeams === 'function') {
                AdManager.reloadUnlockedTeams();
            }

            // By this point, Shop/Progress/stats have almost certainly
            // already loaded once from plain localStorage (they load
            // synchronously the instant each file first runs, long before
            // this async CrazyGames handshake can finish - see the big
            // comment at the top of this file). Force them to reload NOW
            // from the backend this function just switched to, so a
            // returning player's real synced progress is never left
            // shadowed in the UI by whatever was in this device's
            // localStorage a moment ago. Each reload() is a full re-read
            // through the now-cloud-backed getItem() above, reusing each
            // module's own already-tested load() rather than duplicating
            // its parsing/validation logic here.
            try { if (typeof Shop !== 'undefined') Shop.reload(); } catch (e) { console.warn('[CloudSync] Shop.reload() failed', e); }
            try { if (typeof Progress !== 'undefined') Progress.reload(); } catch (e) { console.warn('[CloudSync] Progress.reload() failed', e); }
            try { if (typeof loadStats === 'function') loadStats(); } catch (e) { console.warn('[CloudSync] loadStats() failed', e); }
            // Tournament resume data is deliberately NOT force-reloaded here:
            // TournamentManager.hasResumableSave()/resume() are only ever
            // called fresh, on demand, when the player opens the tournament
            // menu (see renderer.js/theme.js/input.js) - never cached ahead
            // of time - so there is nothing stale to fix, and forcing a
            // reload here could be unsafe if a tournament match happened to
            // already be in progress.
        } catch (e) {
            console.warn('[CloudSync] Could not switch to cloud save - staying on localStorage.', e);
        }
    },

    _store() {
        if (this._usingCloud) {
            try { return window.CrazyGames.SDK.data; } catch (e) { this._usingCloud = false; }
        }
        return localStorage;
    },

    getItem(key) {
        try { return this._store().getItem(key); }
        catch (e) { try { return localStorage.getItem(key); } catch (e2) { return null; } }
    },
    setItem(key, value) {
        try { this._store().setItem(key, value); }
        catch (e) { try { localStorage.setItem(key, value); } catch (e2) {} }
        // Mirror every write back to plain localStorage too, even while on
        // cloud: if the player later signs out of CrazyGames mid-session,
        // or plays as a guest sometimes and logged-in other times, the
        // local copy never goes stale, and nothing is ever lost by relying
        // on the cloud path alone.
        if (this._usingCloud) { try { localStorage.setItem(key, value); } catch (e) {} }
    },
    removeItem(key) {
        try { this._store().removeItem(key); }
        catch (e) { try { localStorage.removeItem(key); } catch (e2) {} }
        if (this._usingCloud) { try { localStorage.removeItem(key); } catch (e) {} }
    }
};
