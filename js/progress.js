// ===== PRO STRIKER - progress.js =====
// Five features from the roadmap, built as ONE module so they share a
// single save blob and a single match-end hook, instead of five separate
// bolt-ons scattered across main.js/tournament.js:
//   1. Career Stats  - lifetime totals across all modes/difficulties
//   2. Daily Challenges - 3/day, drawn from a fixed pool, claimable coins
//   3. XP / Levels    - additive-only, separate from rank, unlocks coins
//   4. Trophy Cabinet - a rules table evaluated against Career Stats/streak
//   5. Mystery Reward - small chance per finished match, shown in the
//                       existing reward chip (Shop.lastReward), no new UI
//
// SINGLE ENTRY POINT: Progress.onMatchEnd(info) — called once per finished
// match (any mode), right next to the existing Shop.award*() call at each
// match-end site. See main.js/tournament.js for the two call sites.
//
//   info = {
//     mode: 'pve' | '1v1' | 'tournament',
//     outcome: 'win' | 'draw' | 'loss' | null,   // null for 1v1 (no "opponent")
//     goalsFor, goalsAgainst,                    // ints, from the human's side
//     gkSaves,                                    // saves the human's GK made
//     difficulty,                                 // EASY..WORLD_CLASS or null
//     tournamentRoundsSurvived,                   // 0 if not a tournament match
//     tournamentWon                               // true only on the final win
//   }
//
// Everything here reuses what already exists rather than inventing new
// systems: coins are paid through Shop.grantBonus() (level-ups are appended to the
// existing reward-chip breakdown), and cosmetic unlocks reuse SHOP_CATALOG
// (no "mystery-only" items).

const PROGRESS_SAVE_KEY = 'prostriker_progress_v1';

// ---------- fixed data tables ----------

// Daily challenge pool. Each entry's `check(m)` receives the SAME `info`
// object passed to onMatchEnd and returns how much progress THIS match
// contributed (usually 0 or 1) - not the design where the whole match either
// "counts" or doesn't, so e.g. a target of 3 goals can be filled by 2 matches.
const CHALLENGE_POOL = [
    { id: 'score3', label: 'Score 3 goals', target: 3, reward: 50, check: (m) => Math.max(0, m.goalsFor) },
    { id: 'win1', label: 'Win 1 match', target: 1, reward: 60, check: (m) => (m.outcome === 'win' ? 1 : 0) },
    { id: 'cleansheet', label: 'Win without conceding', target: 1, reward: 70, check: (m) => (m.outcome === 'win' && m.goalsAgainst === 0 ? 1 : 0) },
    { id: 'saves2', label: 'Make 2 GK saves', target: 2, reward: 45, check: (m) => Math.max(0, m.gkSaves) },
    { id: 'tmatch', label: 'Play a tournament match', target: 1, reward: 40, check: (m) => (m.mode === 'tournament' ? 1 : 0) },
    { id: 'play2', label: 'Play 2 matches', target: 2, reward: 35, check: () => 1 },
    { id: 'goal1', label: 'Score a goal', target: 1, reward: 30, check: (m) => (m.goalsFor > 0 ? 1 : 0) }
];

// XP needed to go from level N to N+1 (simple increasing curve).
function xpForLevel(level) { return 100 * level; }
// "LEVEL 7 — STRIKER" titles at a few bands, purely cosmetic labeling.
const LEVEL_TITLES = [
    [1, 'ROOKIE'], [5, 'PROSPECT'], [10, 'STRIKER'], [15, 'PLAYMAKER'],
    [20, 'MAESTRO'], [30, 'BALLON D\'OR'], [40, 'LEGEND'], [50, 'ICON']
];
function levelTitle(level) {
    let t = LEVEL_TITLES[0][1];
    for (const [lvl, name] of LEVEL_TITLES) { if (level >= lvl) t = name; else break; }
    return t;
}
const XP_PER_MATCH = 10, XP_PER_GOAL = 4, XP_PER_CHALLENGE = 15, XP_PER_ROUND_SURVIVED = 8;
const LEVEL_UP_COINS = 25;         // paid every level
const LEVEL_MILESTONE_EVERY = 5;   // a cosmetic unlock every 5 levels

// Trophy rules table: each `check(totals, streak)` is evaluated against data
// Career Stats / Shop streak already track - no separate tracking system.
const TROPHY_DEFS = [
    { id: 'first_win', name: 'First Victory', desc: 'Win your first match.', check: (t) => t.wins >= 1 },
    { id: 'tournament_champion', name: 'Tournament Champion', desc: 'Win a tournament.', check: (t) => t.tournamentsWon >= 1 },
    { id: 'streak_10', name: '10-Win Streak', desc: 'Reach a 10-match win streak.', check: (t, streak) => streak.best >= 10 },
    { id: 'goals_50', name: '50 Goals Scored', desc: 'Score 50 goals lifetime.', check: (t) => t.goalsScored >= 50 },
    { id: 'matches_100', name: '100 Matches Played', desc: 'Play 100 matches.', check: (t) => t.matchesPlayed >= 100 },
    { id: 'world_class_win', name: 'World Class Winner', desc: 'Win a match on World Class difficulty.', check: (t) => t.worldClassWins >= 1 },
    { id: 'clean_sheets_10', name: 'Brick Wall', desc: 'Keep 10 clean sheets.', check: (t) => t.cleanSheets >= 10 },
    { id: 'goals_200', name: 'Goal Machine', desc: 'Score 200 goals lifetime.', check: (t) => t.goalsScored >= 200 }
];

// Mystery reward: reused cosmetics only, from the existing shop catalog.
const MYSTERY_CHANCE = 0.09;
const MYSTERY_COIN_FALLBACK = 80;   // paid if every cosmetic is already owned

const Progress = {
    _d: null,

    _defaults() {
        return {
            v: 1,
            careerTotals: {
                matchesPlayed: 0, wins: 0, draws: 0, losses: 0,       // VS Computer only
                goalsScored: 0, goalsConceded: 0,
                cleanSheets: 0, worldClassWins: 0,
                tournamentsPlayed: 0, tournamentsWon: 0,
                coinsEarnedLifetime: 0
            },
            xp: 0, level: 1,
            challenges: { dayKey: '', items: [], claimed: {} },   // items: [{id,label,target,reward,progress}]
            trophies: {},          // { id: { earned: true, dateEarned: 'YYYY-MM-DD' } }
        };
    },

    load() {
        const d = this._defaults();
        let raw = null;
        try { raw = JSON.parse(CloudSync.getItem(PROGRESS_SAVE_KEY)); } catch (e) { raw = null; }
        if (raw && typeof raw === 'object') {
            if (raw.careerTotals && typeof raw.careerTotals === 'object') {
                for (const k in d.careerTotals) {
                    const v = Number(raw.careerTotals[k]);
                    if (Number.isFinite(v)) d.careerTotals[k] = Math.max(0, Math.floor(v));
                }
            }
            const xp = Number(raw.xp), lvl = Number(raw.level);
            if (Number.isFinite(xp)) d.xp = Math.max(0, Math.floor(xp));
            if (Number.isFinite(lvl)) d.level = Math.max(1, Math.floor(lvl));
            if (raw.challenges && typeof raw.challenges === 'object' && Array.isArray(raw.challenges.items)) {
                d.challenges.dayKey = typeof raw.challenges.dayKey === 'string' ? raw.challenges.dayKey : '';
                d.challenges.items = raw.challenges.items
                    .filter(it => it && typeof it.id === 'string' && CHALLENGE_POOL.some(p => p.id === it.id))
                    .map(it => ({ id: it.id, progress: Math.max(0, Math.floor(Number(it.progress) || 0)) }));
                d.challenges.claimed = (raw.challenges.claimed && typeof raw.challenges.claimed === 'object') ? raw.challenges.claimed : {};
            }
            if (raw.trophies && typeof raw.trophies === 'object') {
                for (const id in raw.trophies) {
                    if (TROPHY_DEFS.some(t => t.id === id) && raw.trophies[id] && raw.trophies[id].earned) {
                        d.trophies[id] = { earned: true, dateEarned: String(raw.trophies[id].dateEarned || '') };
                    }
                }
            }
        }
        this._d = d;
        this._ensureChallenges();
    },
    save() { try { CloudSync.setItem(PROGRESS_SAVE_KEY, JSON.stringify(this._d)); } catch (e) {} },
    _data() { if (!this._d) this.load(); return this._d; },
    // See Shop.reload() in shop.js for why this exists - identical purpose,
    // for the Progress save (career stats, XP/level, challenges, trophies).
    reload() { this._d = null; this.load(); },

    _dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },

    // Rolls today's 3 challenges from the pool if the day has changed. Uses
    // the day key as a seed so the same 3 are shown all day even if this
    // runs more than once (e.g. app reopened mid-day).
    _ensureChallenges() {
        const d = this._data(), today = this._dayKey();
        if (d.challenges.dayKey === today && d.challenges.items.length === 3) return;
        let seed = 0;
        for (let i = 0; i < today.length; i++) seed = (seed * 31 + today.charCodeAt(i)) >>> 0;
        const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
        const pool = CHALLENGE_POOL.slice();
        const picked = [];
        while (picked.length < 3 && pool.length) {
            const idx = Math.floor(rnd() * pool.length);
            picked.push(pool.splice(idx, 1)[0]);
        }
        d.challenges = { dayKey: today, items: picked.map(p => ({ id: p.id, progress: 0 })), claimed: {} };
        this.save();
    },
    // Public: menu badge + challenges screen call this to get the resolved
    // (pool-joined) list without duplicating CHALLENGE_POOL lookups everywhere.
    todaysChallenges() {
        this._ensureChallenges();
        const d = this._data();
        return d.challenges.items.map(it => {
            const def = CHALLENGE_POOL.find(p => p.id === it.id);
            return {
                id: it.id, label: def.label, target: def.target, reward: def.reward,
                progress: Math.min(def.target, it.progress),
                complete: it.progress >= def.target,
                claimed: !!d.challenges.claimed[it.id]
            };
        });
    },
    hasClaimableChallenge() { return this.todaysChallenges().some(c => c.complete && !c.claimed); },
    claimChallenge(id) {
        const d = this._data(), c = this.todaysChallenges().find(x => x.id === id);
        if (!c || !c.complete || c.claimed) return 0;
        d.challenges.claimed[id] = true;
        this.save();
        Shop.grantBonus(c.reward, null, false);
        this.addXP(XP_PER_CHALLENGE);
        return c.reward;
    },

    // ----- XP / Levels -----
    xpIntoLevel() { const d = this._data(); let floor = 0; for (let l = 1; l < d.level; l++) floor += xpForLevel(l); return d.xp - floor; },
    xpForNextLevel() { return xpForLevel(this._data().level); },
    levelTitle() { return levelTitle(this._data().level); },
    // Returns any level-ups that just happened (for a toast/celebration), coins
    // already paid via Shop._grant, cosmetic unlocks already added to owned[].
    addXP(amount, mergeIntoChip) {
        amount = Math.floor(Number(amount) || 0);
        if (amount <= 0) return { levelsGained: 0, unlocked: [] };
        const d = this._data();
        d.xp += amount;
        let levelsGained = 0, coinsFromLevels = 0;
        const unlocked = [];
        while (d.xp >= (() => { let f = 0; for (let l = 1; l <= d.level; l++) f += xpForLevel(l); return f; })()) {
            d.level++;
            levelsGained++;
            coinsFromLevels += LEVEL_UP_COINS;
            if (d.level % LEVEL_MILESTONE_EVERY === 0) {
                const unlockedId = this._unlockRandomCosmetic();
                if (unlockedId) unlocked.push(unlockedId);
            }
        }
        this.save();
        if (coinsFromLevels > 0) {
            Shop.grantBonus(coinsFromLevels, 'LEVEL UP x' + levelsGained + ' +' + coinsFromLevels, !!mergeIntoChip);
        }
        return { levelsGained, unlocked };
    },
    // Picks a not-yet-owned cosmetic across all shop categories and grants it
    // for free (same owned[] the shop already reads) - reuses the catalog
    // instead of a second unlock system.
    _unlockRandomCosmetic() {
        const sd = Shop._data();
        const candidates = [];
        for (const t of SHOP_TABS) {
            for (const it of SHOP_CATALOG[t.key]) {
                if (!sd.owned[t.key].includes(it.id)) candidates.push({ cat: t.key, id: it.id, name: it.name });
            }
        }
        if (!candidates.length) return null;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        sd.owned[pick.cat].push(pick.id);
        Shop.save();
        return pick;
    },

    // ----- Trophies -----
    trophyList() {
        const d = this._data();
        return TROPHY_DEFS.map(def => ({ id: def.id, name: def.name, desc: def.desc, earned: !!(d.trophies[def.id] && d.trophies[def.id].earned), dateEarned: d.trophies[def.id] ? d.trophies[def.id].dateEarned : null }));
    },
    _checkTrophies() {
        const d = this._data(), t = d.careerTotals, streak = (typeof Shop !== 'undefined') ? { best: Shop.streakBest() } : { best: 0 };
        const newlyEarned = [];
        for (const def of TROPHY_DEFS) {
            if (d.trophies[def.id] && d.trophies[def.id].earned) continue;
            if (def.check(t, streak)) {
                d.trophies[def.id] = { earned: true, dateEarned: this._dayKey() };
                newlyEarned.push(def);
            }
        }
        if (newlyEarned.length) this.save();
        return newlyEarned;
    },

    // ----- Mystery Reward -----
    // Checked once per finished match, inside onMatchEnd -> can never double-fire
    // for the same match (there is exactly one onMatchEnd call per match).
    _rollMystery() {
        if (Math.random() >= MYSTERY_CHANCE) return null;
        const sd = Shop._data();
        const candidates = [];
        for (const t of SHOP_TABS) {
            for (const it of SHOP_CATALOG[t.key]) {
                if (!sd.owned[t.key].includes(it.id)) candidates.push({ cat: t.key, id: it.id, name: it.name });
            }
        }
        if (candidates.length) {
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            sd.owned[pick.cat].push(pick.id);
            Shop.save();
            return { type: 'cosmetic', name: pick.name };
        }
        Shop.grantBonus(MYSTERY_COIN_FALLBACK, null, true);
        return { type: 'coins', amount: MYSTERY_COIN_FALLBACK };
    },

    // ----- SINGLE ENTRY POINT -----
    onMatchEnd(info) {
        info = info || {};
        const d = this._data(), t = d.careerTotals;

        t.matchesPlayed++;
        t.goalsScored += Math.max(0, info.goalsFor | 0);
        t.goalsConceded += Math.max(0, info.goalsAgainst | 0);
        if (info.mode === 'pve') {
            if (info.outcome === 'win') t.wins++;
            else if (info.outcome === 'draw') t.draws++;
            else if (info.outcome === 'loss') t.losses++;
            if (info.outcome === 'win' && info.goalsAgainst === 0) t.cleanSheets++;
            if (info.outcome === 'win' && info.difficulty === 'WORLD_CLASS') t.worldClassWins++;
        } else if (info.mode === 'tournament') {
            if (info.outcome === 'win' && info.goalsAgainst === 0) t.cleanSheets++;
        }
        if (info.tournamentWon) t.tournamentsWon++;

        // XP: mode-independent per-match/per-goal, plus per-round-survived for
        // tournaments. Additive-only, never touches rankPoints/currentRank.
        let xpGain = XP_PER_MATCH + Math.max(0, info.goalsFor | 0) * XP_PER_GOAL;
        if (info.mode === 'tournament') xpGain += Math.max(0, info.tournamentRoundsSurvived | 0) * XP_PER_ROUND_SURVIVED;

        // Daily challenge progress - any mode counts unless a challenge says
        // otherwise (see CHALLENGE_POOL; none of the current ones restrict mode).
        this._ensureChallenges();
        let challengeXpBonus = 0;
        for (const it of d.challenges.items) {
            if (d.challenges.claimed[it.id]) continue;
            const def = CHALLENGE_POOL.find(p => p.id === it.id);
            if (!def || it.progress >= def.target) continue;
            it.progress = Math.min(def.target, it.progress + Math.max(0, def.check(info)));
        }

        this.addXP(xpGain, true);
        const trophiesEarned = this._checkTrophies();
        const mystery = this._rollMystery();
        if (mystery && typeof Shop.lastReward === 'object' && Shop.lastReward) {
            Shop.lastReward.mystery = mystery;
        }
        this.save();

        return { trophiesEarned, mystery };
    },

    // Called by Shop._grant() for every single coin payout in the game (win
    // rewards, streak bonuses, daily login, ads, challenges, level-ups — all
    // of them funnel through _grant), so the lifetime "coins earned" counter
    // can never miss a source or double count one, and survives spending.
    trackCoinsGranted(amount) {
        if (!(amount > 0)) return;
        this._data().careerTotals.coinsEarnedLifetime += amount;
        this.save();
    }
};

Progress.load();
