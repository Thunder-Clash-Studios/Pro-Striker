// ===== PRO STRIKER - platformConfig.js =====
// THIS IS THE ONLY FILE YOU EDIT TO CHANGE PLATFORMS.
//
// ACTIVE_PLATFORM = 'auto' (default): detects the platform at runtime.
//   - On crazygames.com  -> uses CrazyGames SDK
//   - On gamemonetize.com -> uses GameMonetize SDK (if gameId set below)
//   - On gamedistribution.com -> uses GameDistribution SDK (if gameId set below)
//   - Anywhere else (localhost, GitHub Pages, etc.) -> no ads, no errors
//
// You do NOT need to change 'auto' or edit this file to submit to CrazyGames.
// You only edit this file when GameMonetize or GameDistribution give you a
// Game ID after you register and upload there.

const ACTIVE_PLATFORM = 'auto';

const PLATFORM_SETTINGS = {
    crazygames: {
        // CrazyGames does NOT use a Game ID in code — it infers which game
        // is running from the page URL. Nothing to fill in. Ever.
    },
    gamemonetize: {
        // ONLY fill this in AFTER you register at gamemonetize.com and
        // upload your game. Their dashboard will show a Game ID. Until
        // then, leave this placeholder exactly as-is — the adapter will
        // skip loading their SDK automatically and safely.
        gameId: 'rua9zsifeg0s7558al2qu896560zteeo'
    },
    gamedistribution: {
        // Same as above — only fill in after registering at
        // developer.gamedistribution.com. Leave placeholder for now.
        gameId: 'c8902e23cc084c16bab3af1f83da0454'
    },
    generic: {
        // No settings — this is the "no ads" fallback used on localhost,
        // GitHub Pages, and any other host without a supported SDK.
    }
};

const AD_STRATEGY = {
    matchAdGaps: [2, 3],                  // Show midgame ad after match 2, then 3, then 2...
    tournamentContinueBonusSeconds: 45,
    tournamentContinueOfferSeconds: 6,
    tournamentContinueGroupStage: true,
    // RECOMMENDATION: set this to `false` for your first CrazyGames
    // submission. Their reviewers are strict about "content gated behind
    // rewarded ads" and this could slow down or block acceptance. Turn it
    // back on after you're live, or on GameMonetize/GameDistribution where
    // rules are more permissive.
    lockedTeamRewardedUnlockEnabled: false,
    lockedTeamIds: [0, 1, 2, 3, 4, 6]
};

window.PLATFORM_CONFIG = { ACTIVE_PLATFORM, PLATFORM_SETTINGS, AD_STRATEGY };