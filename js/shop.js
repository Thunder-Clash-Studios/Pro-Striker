// ===== PRO STRIKER - shop.js =====
// Coins, the shop screen and every cosmetic (ball skins, ball trails, striker
// skins, pitches). Self-contained: the rest of the game only asks this file
// three kinds of questions - "how do I draw X?" (Cosmetics.*), "award coins for
// this result" (Shop.award*), and "handle a click / key on the shop screen".
// Nothing here touches match physics, AI, the tournament rules or the ad/SDK
// layer (the one exception is the optional "watch an ad for coins" button,
// which goes through AdManager like every other ad in the game).
console.log('[ProStriker] shop.js loaded');

const SHOP_SAVE_KEY = 'prostriker_shop_v1';
const SHOP_TABS = [
    { key: 'ball',    label: 'BALLS' },
    { key: 'trail',   label: 'TRAILS' },
    { key: 'striker', label: 'STRIKERS' },
    { key: 'pitch',   label: 'PITCHES' }
];

// Every list below is in ASCENDING price order - the shop draws them in this
// order, so the cheapest is always first and the best is always last.
const SHOP_CATALOG = {
    // Ball skins are drawn procedurally (Cosmetics.ballSprite) - no image file
    // is needed, so a missing/blocked asset can never turn them into blank discs.
    //   base   : [light, mid, dark] sphere colours      panel : pentagon panel colour
    //   seam   : seam line colour                        glow  : optional outer aura
    //   deco   : optional surface pattern (see ballSprite)
    ball: [
        { id: 'classic',  name: 'Classic',     price: 0,    desc: 'The original match ball.',
          base: ['#ffffff', '#eef1f4', '#b9c2cc'], panel: '#171e27', seam: 'rgba(20,25,32,0.55)' },
        { id: 'ember',    name: 'Ember',       price: 250,  desc: 'Hot orange finish with flame panels.',
          base: ['#ffd7a8', '#ff8a3d', '#b8390f'], panel: '#3a0f05', seam: 'rgba(90,20,0,0.6)', deco: 'flame' },
        { id: 'ocean',    name: 'Ocean',       price: 400,  desc: 'Cool sky-blue finish with wave lines.',
          base: ['#e3f6ff', '#4cb8ff', '#1467b8'], panel: '#0b2a55', seam: 'rgba(5,40,90,0.6)', deco: 'wave' },
        { id: 'lime',     name: 'Volt Lime',   price: 650,  desc: 'Neon lime - easy to track.',
          base: ['#f4ffc9', '#b8ff2e', '#5aa300'], panel: '#1c3300', seam: 'rgba(30,60,0,0.6)', deco: 'bolt' },
        { id: 'gold',     name: 'Golden Ball', price: 1300, desc: 'Solid gold with a warm glow.',
          base: ['#fff6c2', '#ffd23f', '#b8860b'], panel: '#7a5200', seam: 'rgba(110,70,0,0.65)', glow: '#ffd23f', deco: 'shine' },
        { id: 'obsidian', name: 'Obsidian',    price: 2000, desc: 'Dark carbon ball with a cyan aura.',
          base: ['#7c869b', '#2b3140', '#0a0d14'], panel: '#000000', seam: 'rgba(40,224,255,0.75)', glow: '#28e0ff', deco: 'carbon' },
        { id: 'galaxy',   name: 'Galaxy',      price: 3500, desc: 'Purple cosmos, pink aura.',
          base: ['#d9b8ff', '#7a3cf0', '#2a0e6b'], panel: '#12053a', seam: 'rgba(255,90,209,0.7)', glow: '#ff5ad1', deco: 'stars' }
    ],
    trail: [
        { id: 'none',    name: 'Classic',  price: 0,    desc: 'The standard white trail.' },
        { id: 'fire',    name: 'Fireball', price: 350,  desc: 'Leaves a blazing tail.',       style: 'fire' },
        { id: 'ice',     name: 'Frost',    price: 600,  desc: 'A cold, icy streak.',          style: 'ice' },
        { id: 'neon',    name: 'Neon',     price: 900,  desc: 'Glowing green ribbon.',        style: 'neon' },
        { id: 'gold',    name: 'Golden',   price: 1600,  desc: 'Gold dust with sparkles.',     style: 'gold' },
        { id: 'rainbow', name: 'Rainbow',  price: 2600, desc: 'Every colour at once.',        style: 'rainbow' },
        { id: 'galaxy',  name: 'Stardust', price: 4500, desc: 'Cosmic purple stardust.',      style: 'galaxy' }
    ],
    // Striker skins replace the star on YOUR (red) strikers in 1v1 and VS
    // Computer. Tournament strikers always wear their national flag.
    striker: [
        { id: 'classic', name: 'Classic',   price: 0,    desc: 'Your standard red striker.',   emblem: 'star' },
        { id: 'bolt',    name: 'Lightning', price: 500,  desc: 'Bolt emblem, icy ring.',       emblem: 'bolt',    ring: '#7fdcff' },
        { id: 'flame',   name: 'Blaze',     price: 800,  desc: 'Flame emblem, amber ring.',    emblem: 'flame',   ring: '#ffb347' },
        { id: 'crown',   name: 'Royal',     price: 1800, desc: 'Golden crown emblem.',         emblem: 'crown',   ring: '#ffd23f' },
        { id: 'diamond', name: 'Diamond',   price: 2800, desc: 'Cut gem, glowing ring.',       emblem: 'diamond', ring: '#5ef2ff' },
        { id: 'prism',   name: 'Prism',     price: 4500, desc: 'Rainbow ring, gold star.',     emblem: 'star',    ring: 'rainbow' }
    ],
    pitch: [
        { id: 'classic', name: 'Stadium Green', price: 0,    desc: 'The classic match-day turf.' },
        { id: 'night',   name: 'Night Match',   price: 500,  desc: 'Deep green under floodlights.',
          pal: { base: ['#0f5a34', '#136a3d'], light: ['#17804b', '#1c9257'], mid: ['#12663a', '#177846'], overlay: { color: '#5a78ff', alpha: 0.16 } } },
        { id: 'golden',  name: 'Golden Hour',   price: 1000,  desc: 'Warm late-afternoon light.',
          pal: { base: ['#4f9a3b', '#5aa842'], light: ['#86c85a', '#96d66c'], mid: ['#57a63f', '#63b449'], overlay: { color: '#ffae42', alpha: 0.14 } } },
        { id: 'snow',    name: 'Winter Snow',   price: 1600,  desc: 'A frozen pitch, blue lines.',
          pal: { base: ['#b7d4e4', '#c5deec'], light: ['#e6f3fa', '#f1f9fd'], mid: ['#bfdae9', '#cde5f1'], line: 'rgba(45,95,170,0.95)', lineGlow: 'rgba(45,95,170,0.3)', wear: false } },
        { id: 'clay',    name: 'Red Clay',      price: 2400, desc: 'Sun-baked clay court.',
          pal: { base: ['#b3512b', '#c15d34'], light: ['#d97b4c', '#e38d5e'], mid: ['#bb5830', '#c86438'] } },
        { id: 'court',   name: 'Indoor Court',  price: 3500, desc: 'Polished wooden floor.',
          pal: { base: ['#b8863f', '#c4924a'], light: ['#dcac66', '#e6ba78'], mid: ['#bf8d44', '#cb9a52'], turf: false, wear: false } },
        { id: 'neon',    name: 'Neon Arena',    price: 5000, desc: 'Dark floor, glowing lines.',
          pal: { base: ['#0a1830', '#0d2040'], light: ['#12305c', '#173a6c'], mid: ['#0c1c38', '#102448'], line: 'rgba(60,240,255,0.95)', lineGlow: 'rgba(60,240,255,0.75)', turf: false, wear: false } }
    ]
};

// Sanity check on load: catalogs must be sorted by price (ascending).
(function () {
    for (const k in SHOP_CATALOG) {
        const l = SHOP_CATALOG[k];
        for (let i = 1; i < l.length; i++) {
            if (l[i].price < l[i - 1].price) console.warn('[Shop] catalog not ascending:', k, l[i].id);
        }
    }
})();

// ============================================================
// SHOP STATE + ECONOMY
// ============================================================
const Shop = {
    _d: null,
    lastReward: null,
    ui: { tab: 0, sel: { ball: 0, trail: 0, striker: 0, pitch: 0 }, toast: null, hit: null, adCooldownUntil: 0 },

    AD_REWARD: 75,
    AD_COOLDOWN_MS: 45000,
    DAILY_REWARDS: [25, 30, 40, 50, 60, 80, 120],

    // VS Computer win streak: every win in a row after the first pays a little
    // more (+5 per step), capped so it can never dominate the economy. Every
    // 5th win adds a one-off milestone bonus. Any draw or loss resets it.
    STREAK_STEP: 5,
    STREAK_CAP: 30,
    STREAK_MILESTONE_5: 40,
    STREAK_MILESTONE_10PLUS: 100,
    // Small bonus for the first finished match of each calendar day (any mode).
    // Separate from the daily-login reward: this one is earned by playing.
    FIRST_MATCH_BONUS: 25,

    // Named so the "How to Earn" panel (drawEarnInfo) can read these directly
    // instead of keeping a second, hand-copied list of numbers that could
    // silently drift out of sync with what awardPve/awardLocal/awardTournament
    // actually pay.
    PVE_WIN: 30, PVE_DRAW: 12, PVE_PLAYED: 6,
    PVE_DIFFICULTY_BONUS: { EASY: 0, MEDIUM: 8, HARD: 15, ELITE: 25, WORLD_CLASS: 40 },
    PVE_GOAL_COIN: 2, PVE_GOAL_CAP: 10,
    LOCAL_MATCH: 10,
    T_WIN: 45, T_DRAW: 18, T_PLAYED: 10, T_KNOCKOUT_BONUS: 25, T_FINALIST_BONUS: 100, T_CHAMPION_BONUS: 350,

    _defaults() {
        return {
            v: 1, coins: 0,
            owned: { ball: ['classic'], trail: ['none'], striker: ['classic'], pitch: ['classic'] },
            equipped: { ball: 'classic', trail: 'none', striker: 'classic', pitch: 'classic' },
            daily: { last: '', streak: 0 },
            streak: { cur: 0, best: 0, pending: false },   // VS Computer win streak (persisted)
            firstDay: ''                        // day key of the last first-match-of-day bonus
        };
    },

    load() {
        const d = this._defaults();
        let raw = null;
        try { raw = JSON.parse(CloudSync.getItem(SHOP_SAVE_KEY)); } catch (e) { raw = null; }
        if (raw && typeof raw === 'object') {
            const c = Number(raw.coins);
            d.coins = Number.isFinite(c) ? Math.max(0, Math.min(1e9, Math.floor(c))) : 0;
            for (const t of SHOP_TABS) {
                const owned = raw.owned && Array.isArray(raw.owned[t.key]) ? raw.owned[t.key] : [];
                for (const id of owned) {
                    if (this._find(t.key, id) && !d.owned[t.key].includes(id)) d.owned[t.key].push(id);
                }
                const eq = raw.equipped && raw.equipped[t.key];
                if (eq && d.owned[t.key].includes(eq)) d.equipped[t.key] = eq;
            }
            if (raw.daily && typeof raw.daily === 'object') {
                d.daily.last = typeof raw.daily.last === 'string' ? raw.daily.last : '';
                const s = Number(raw.daily.streak);
                d.daily.streak = Number.isFinite(s) ? Math.max(0, Math.min(7, Math.floor(s))) : 0;
            }
            if (raw.streak && typeof raw.streak === 'object') {
                const cur = Number(raw.streak.cur), best = Number(raw.streak.best);
                d.streak.cur = Number.isFinite(cur) ? Math.max(0, Math.min(9999, Math.floor(cur))) : 0;
                d.streak.best = Number.isFinite(best) ? Math.max(0, Math.min(9999, Math.floor(best))) : 0;
                if (d.streak.best < d.streak.cur) d.streak.best = d.streak.cur;
                d.streak.pending = raw.streak.pending === true;
            }
            if (typeof raw.firstDay === 'string') d.firstDay = raw.firstDay;
        }
        this._d = d;
        for (const t of SHOP_TABS) this.ui.sel[t.key] = Math.max(0, SHOP_CATALOG[t.key].findIndex(i => i.id === d.equipped[t.key]));
    },

    // localStorage can be unavailable (private mode, blocked in an iframe); the
    // shop then simply works for the current session only. CloudSync.setItem
    // itself already falls back to localStorage, and both to a no-op, so this
    // catch is one more layer of the same safety net, never a second attempt.
    save() { try { CloudSync.setItem(SHOP_SAVE_KEY, JSON.stringify(this._d)); } catch (e) {} },

    _data() { if (!this._d) this.load(); return this._d; },
    // Called by CloudSync once it switches from localStorage to CrazyGames'
    // data module, in case Shop._d was already loaded (from localStorage)
    // before the switch happened - forces a fresh load from whichever
    // backend CloudSync is using now, so a player's real (cloud) progress
    // is never left shadowed by a stale local copy already in memory.
    reload() { this._d = null; this.load(); },
    _find(cat, id) { const l = SHOP_CATALOG[cat]; return l ? l.find(i => i.id === id) : null; },

    coins() { return this._data().coins; },
    item(cat, id) { return this._find(cat, id); },
    equippedId(cat) { return this._data().equipped[cat]; },
    equippedItem(cat) { return this._find(cat, this._data().equipped[cat]); },
    owns(cat, id) { return this._data().owned[cat].includes(id); },

    addCoins(n) {
        n = Math.floor(Number(n) || 0);
        if (n <= 0) return 0;
        const d = this._data();
        d.coins = Math.min(1e9, d.coins + n);
        this.save();
        // Every coin source (match rewards, streak bonuses, daily login, ads,
        // challenges, level-ups) passes through here exactly once, so this is
        // the single, un-double-countable place to feed the Career Stats
        // lifetime "coins earned" counter (separate from the spendable balance).
        if (typeof Progress !== 'undefined') Progress.trackCoinsGranted(n);
        return n;
    },

    buy(cat, id) {
        const it = this._find(cat, id), d = this._data();
        if (!it) return { ok: false, reason: 'unknown' };
        if (this.owns(cat, id)) return { ok: false, reason: 'owned' };
        if (d.coins < it.price) return { ok: false, reason: 'coins', missing: it.price - d.coins };
        d.coins -= it.price;
        d.owned[cat].push(id);
        this.save();
        return { ok: true };
    },

    equip(cat, id) {
        const d = this._data();
        if (!this._find(cat, id) || !this.owns(cat, id)) return false;
        d.equipped[cat] = id;
        this.save();
        if (cat === 'pitch' && typeof _pitchCanvas !== 'undefined') _pitchCanvas = null;   // rebuilt with the new palette
        return true;
    },

    // ----- earning -----
    // 1v1 is two humans on one keyboard, so it pays a small flat amount;
    // VS Computer pays by result and difficulty; tournament pays per match.
    awardPve(outcome, goalsFor, diff) {
        const bonus = this.PVE_DIFFICULTY_BONUS[diff] || 0;
        const lines = [];
        let total = 0;
        const st = this._data().streak;
        const prev = st.cur;
        let newBest = false;
        if (outcome === 'win') {
            total += this.PVE_WIN; lines.push('WIN +' + this.PVE_WIN);
            if (bonus) { total += bonus; lines.push('DIFFICULTY +' + bonus); }
            st.cur = Math.min(9999, st.cur + 1);
            if (st.cur > st.best) { st.best = st.cur; newBest = st.cur >= 2; }
            const sb = this.streakBonus(st.cur);
            if (sb) { total += sb; lines.push('STREAK x' + st.cur + ' +' + sb); }
            const ms = this.streakMilestone(st.cur);
            if (ms) { total += ms; lines.push('STREAK MILESTONE +' + ms); }
        }
        else if (outcome === 'draw') { total += this.PVE_DRAW; lines.push('DRAW +' + this.PVE_DRAW); }
        else { total += this.PVE_PLAYED; lines.push('PLAYED +' + this.PVE_PLAYED); }
        if (outcome !== 'win') st.cur = 0;              // a draw or a loss ends the streak
        st.pending = false;                              // this match finished normally
        const g = Math.min(this.PVE_GOAL_CAP, Math.max(0, goalsFor | 0) * this.PVE_GOAL_COIN);
        if (g) { total += g; lines.push('GOALS +' + g); }
        return this._grant(total, lines, null, { cur: st.cur, best: st.best, newBest: newBest, lost: outcome === 'win' ? 0 : prev });
    },
    awardLocal() { return this._grant(this.LOCAL_MATCH, ['LOCAL MATCH +' + this.LOCAL_MATCH], null); },
    awardTournament(outcome, isKnockout, isFinal, uid) {
        const lines = [];
        let total = 0;
        if (outcome === 'win') {
            total += this.T_WIN; lines.push('WIN +' + this.T_WIN);
            if (isKnockout) { total += this.T_KNOCKOUT_BONUS; lines.push('KNOCKOUT +' + this.T_KNOCKOUT_BONUS); }
            if (isFinal) { total += this.T_CHAMPION_BONUS; lines.push('CHAMPION +' + this.T_CHAMPION_BONUS); }
        } else if (outcome === 'draw') { total += this.T_DRAW; lines.push('DRAW +' + this.T_DRAW); }
        else { total += this.T_PLAYED; lines.push('PLAYED +' + this.T_PLAYED); if (isFinal) { total += this.T_FINALIST_BONUS; lines.push('FINALIST +' + this.T_FINALIST_BONUS); } }
        return this._grant(total, lines, uid);
    },
    // Every finished match (any mode) goes through here, so the first-match-of-
    // the-day bonus lives here too. addCoins() saves, which also persists the
    // streak / firstDay changes made just before it.
    _grant(total, lines, uid, streak) {
        const d = this._data(), today = this._dayKey();
        if (d.firstDay !== today) {
            d.firstDay = today;
            total += this.FIRST_MATCH_BONUS;
            lines.push('FIRST MATCH TODAY +' + this.FIRST_MATCH_BONUS);
        }
        this.addCoins(total);
        this.lastReward = { amount: total, lines, uid: uid || null, t: Date.now(), streak: streak || null };
        return total;
    },

    // Extra coins that are NOT a match reward (level-ups, challenge claims, the
    // mystery-reward coin fallback). Unlike _grant() this never applies the
    // once-a-day "first match" bonus (which belongs to a match, not to whichever
    // payout happens to come first) and never REPLACES Shop.lastReward. When
    // mergeIntoChip is true (called during match end) the coins and an optional
    // line are appended to the reward chip that the match just produced, so
    // the player sees "WIN +30 ... LEVEL UP +25" rather than only the bonus.
    grantBonus(amount, line, mergeIntoChip) {
        amount = Math.floor(Number(amount) || 0);
        if (amount <= 0) return 0;
        this.addCoins(amount);
        if (mergeIntoChip && this.lastReward && typeof this.lastReward === 'object') {
            this.lastReward.amount += amount;
            if (line) this.lastReward.lines.push(line);
        }
        return amount;
    },

    // ----- VS Computer win streak -----
    streakBonus(n) { return n >= 2 ? Math.min(this.STREAK_CAP, (n - 1) * this.STREAK_STEP) : 0; },
    streakMilestone(n) { return n === 5 ? this.STREAK_MILESTONE_5 : (n >= 10 && n % 5 === 0 ? this.STREAK_MILESTONE_10PLUS : 0); },
    // Called when a VS Computer match starts. If the previous VS Computer match
    // never reached full time (the player quit or closed the game), it counts
    // as a loss - otherwise quitting a match you're losing would protect the streak.
    beginPveMatch() {
        const st = this._data().streak;
        if (st.pending && st.cur > 0) st.cur = 0;
        st.pending = true;
        this.save();
    },
    // What the menu shows: an abandoned match has already ended the streak.
    streakNow() { const st = this._data().streak; return st.pending ? 0 : st.cur; },
    streakBest() { return this._data().streak.best; },
    streakLive() { return this._data().streak.cur; },        // streak going INTO the current match

    // ----- daily reward -----
    _dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
    dailyStatus() {
        const dl = this._data().daily, today = this._dayKey();
        if (dl.last === today) return { available: false, streak: dl.streak, amount: 0 };
        const y = new Date(); y.setDate(y.getDate() - 1);
        const nextStreak = dl.last === this._dayKey(y) ? Math.min(7, dl.streak + 1) : 1;
        return { available: true, streak: nextStreak, amount: this.DAILY_REWARDS[nextStreak - 1] };
    },
    claimDaily() {
        const s = this.dailyStatus();
        if (!s.available) return 0;
        const dl = this._data().daily;
        dl.last = this._dayKey();
        dl.streak = s.streak >= 7 ? 0 : s.streak;      // after day 7 the cycle restarts at day 1
        this.addCoins(s.amount);
        this.save();
        return s.amount;
    },

    // ----- optional rewarded ad (only when a real ad platform is active) -----
    canWatchAd() {
        return typeof AdManager !== 'undefined' && AdManager.canOfferCoinAd() && performance.now() >= this.ui.adCooldownUntil;
    },
    watchAd() {
        if (!this.canWatchAd()) return;
        AdManager.requestCoinReward({
            onReward: () => {
                this.addCoins(this.AD_REWARD);
                this.ui.adCooldownUntil = performance.now() + this.AD_COOLDOWN_MS;
                this._toast('+' + this.AD_REWARD + ' COINS!', THEME.accent);
            },
            onFail: () => this._toast('No ad available right now', THEME.red)
        });
    },

    _toast(text, color) { this.ui.toast = { text, color: color || THEME.gold, until: performance.now() + 2400 }; },

    // ============================================================
    // MAIN MENU ENTRY BUTTON
    // ============================================================
    drawMenuButton(hover) {
        const x = 640, y = 30, w = 220, h = 46;
        window._shopBtn = { x, y, w, h };
        ctx.save();
        ctx.shadowColor = hover ? THEME.gold : 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = hover ? 20 : 10;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = hover ? THEME.gold : THEME.ink2;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.fillStyle = THEME.gold;
        ctx.beginPath(); ctx.roundRect(x, y, 6, h, { tl: 14, bl: 14, tr: 0, br: 0 }); ctx.fill();
        Cosmetics.drawCoin(x + 30, y + h / 2, 11);
        ctx.textAlign = 'left';
        ctx.fillStyle = hover ? THEME.ink : '#ffffff';
        ctx.font = '800 17px Outfit, sans-serif';
        ctx.fillText(this.coins().toLocaleString('en-US'), x + 50, y + h / 2 + 6);
        ctx.textAlign = 'right';
        ctx.fillStyle = hover ? THEME.ink : THEME.gold;
        ctx.font = '900 14px Outfit, sans-serif';
        ctx.fillText('SHOP', x + w - 16, y + h / 2 + 5);
        if (this.dailyStatus().available) {          // "you have a free reward" dot
            ctx.fillStyle = '#ff3b3b';
            ctx.beginPath(); ctx.arc(x + w - 6, y + 6, 7, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();
        this.drawMenuStreak();
    },

    // ---------- win streak indicators ----------
    // The flame is baked ONCE into a small offscreen sprite (via the same
    // emblem used by the Blaze striker skin) and blitted with drawImage, so the
    // indicators cost almost nothing per frame.
    _flameSprite() {
        if (this._flame) return this._flame;
        const c = document.createElement('canvas');
        c.width = c.height = 48;
        Cosmetics.drawEmblem(c.getContext('2d'), 'flame', 24, 25, 30);
        return (this._flame = c);
    },
    _drawFlame(cx, cy, size, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(this._flameSprite(), cx - size / 2, cy - size / 2, size, size);
        ctx.restore();
    },

    // Main menu: "WIN STREAK 4 . BEST 7", shown once the player has ever won a VS Computer match.
    drawMenuStreak() {
        const cur = this.streakNow(), best = this.streakBest();
        if (cur <= 0 && best <= 0) return;
        const x = 640, y = 84, w = 220, h = 26;
        ctx.save();
        ctx.fillStyle = 'rgba(11,18,32,0.78)';
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 13); ctx.fill();
        ctx.strokeStyle = cur > 0 ? 'rgba(255,150,60,0.75)' : 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1.5; ctx.stroke();
        this._drawFlame(x + 18, y + h / 2, 22, cur > 0 ? 1 : 0.3);
        ctx.textAlign = 'left';
        ctx.fillStyle = cur > 0 ? '#ffb347' : 'rgba(255,255,255,0.5)';
        ctx.font = '800 12px Outfit, sans-serif';
        ctx.fillText('WIN STREAK ' + cur, x + 36, y + h / 2 + 4);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '700 11px Outfit, sans-serif';
        ctx.fillText('BEST ' + best, x + w - 12, y + h / 2 + 4);
        ctx.restore();
    },

    // In a VS Computer match: a small flame badge under the difficulty badge
    // showing the streak you are playing to extend. Hidden at streak 0.
    drawMatchBadge() {
        if (gameMode !== 'pve' || tournamentMode) return;
        const n = this.streakLive();
        if (n <= 0) return;
        drawGlassPanel(15, 47, 80, 24, 12, 'rgba(255,150,60,0.5)');
        this._drawFlame(32, 59, 22, 1);
        ctx.save();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffb347';
        ctx.font = '800 15px Outfit, sans-serif';
        ctx.fillText('x' + n, 46, 65);
        ctx.restore();
    },

    // Match-end result: the streak after this match (or how long one just ended)
    _drawResultStreak(cx, cy, s) {
        if (!s || (s.cur <= 0 && s.lost < 2)) return;
        ctx.save();
        ctx.textAlign = 'left';
        if (s.cur > 0) {
            ctx.font = '800 14px Outfit, sans-serif';
            const label = 'WIN STREAK ' + s.cur + (s.newBest ? '  \u00b7  NEW BEST' : '');
            const tw = ctx.measureText(label).width, w = tw + 54, h = 28;
            ctx.fillStyle = 'rgba(11,18,32,0.92)';
            ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 14); ctx.fill();
            ctx.strokeStyle = 'rgba(255,150,60,0.85)'; ctx.lineWidth = 1.5; ctx.stroke();
            this._drawFlame(cx - w / 2 + 20, cy, 24, 1);
            ctx.fillStyle = '#ffb347';
            ctx.fillText(label, cx - w / 2 + 36, cy + 5);
        } else {
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '700 12px Outfit, sans-serif';
            ctx.fillText('STREAK ENDED AT ' + s.lost, cx, cy + 4);
        }
        ctx.restore();
    },

    // Splits the reward breakdown into rows no wider than maxW so long payouts
    // (win + difficulty + streak + goals + first match) never run off the card.
    _wrapLines(lines, maxW) {
        const sep = '  \u00b7  ', rows = [];
        let cur = '';
        for (const ln of lines) {
            const cand = cur ? cur + sep + ln : ln;
            if (cur && ctx.measureText(cand).width > maxW) { rows.push(cur); cur = ln; }
            else cur = cand;
        }
        if (cur) rows.push(cur);
        return rows;
    },

    // "+45 COINS" chip shown on result screens
    drawRewardChip(cx, cy, uid) {
        const r = this.lastReward;
        if (!r || r.amount <= 0 || Date.now() - r.t > 600000) return;
        if (uid !== undefined && r.uid !== uid) return;
        ctx.save();
        ctx.font = '800 17px Outfit, sans-serif';
        const label = '+' + r.amount + ' COINS';
        const tw = ctx.measureText(label).width;
        const w = tw + 62, h = 34;
        ctx.fillStyle = 'rgba(11,18,32,0.92)';
        ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 17); ctx.fill();
        ctx.strokeStyle = THEME.gold; ctx.lineWidth = 1.5; ctx.stroke();
        Cosmetics.drawCoin(cx - w / 2 + 22, cy, 9);
        ctx.textAlign = 'left';
        ctx.fillStyle = THEME.gold;
        ctx.fillText(label, cx - w / 2 + 40, cy + 6);
        ctx.restore();
        let rowY = cy + 32;
        // BUGFIX: the breakdown text had no backing, so it was only readable
        // over the dark result banner - once the reward chip is used on top
        // of the bright pitch (e.g. VS Computer, non-tournament matches),
        // the light grey text disappeared into the green. A soft dark panel
        // behind the rows keeps it legible everywhere the chip is drawn.
        if (r.lines && r.lines.length) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = '600 11px Outfit, sans-serif';
            if (!r._rows) r._rows = this._wrapLines(r.lines, 540);     // measured once, not every frame
            const panelH = r._rows.length * 14 + 10;
            const panelW = Math.max(...r._rows.map(row => ctx.measureText(row).width)) + 28;
            ctx.fillStyle = 'rgba(11,18,32,0.72)';
            ctx.beginPath(); ctx.roundRect(cx - panelW / 2, rowY - 12, panelW, panelH, 10); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            r._rows.forEach((row, i) => ctx.fillText(row, cx, rowY + i * 14));
            rowY += r._rows.length * 14;
            ctx.restore();
        }
        if (r.streak) { this._drawResultStreak(cx, rowY + 12, r.streak); rowY += 26; }
        if (r.mystery) this._drawMysteryBanner(cx, rowY + (r.streak ? 24 : 14), r.mystery);
    },

    // "🎁 BONUS: You found the Obsidian ball!" (or a coin bonus if every
    // cosmetic is already owned) — drawn as one extra line under the normal
    // reward breakdown, exactly where the roadmap asked for it: no separate
    // screen, just an extra line in the existing chip.
    _drawMysteryBanner(cx, y, mystery) {
        const label = mystery.type === 'cosmetic'
            ? '🎁 BONUS: You found the ' + mystery.name + '!'
            : '🎁 BONUS: +' + mystery.amount + ' coins!';
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '800 13px Outfit, sans-serif';
        const tw = ctx.measureText(label).width;
        const w = tw + 28, h = 26;
        ctx.fillStyle = 'rgba(155,89,182,0.22)';
        ctx.beginPath(); ctx.roundRect(cx - w / 2, y - h / 2, w, h, 13); ctx.fill();
        ctx.strokeStyle = '#9b59b6'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#e0b3ff';
        ctx.fillText(label, cx, y + 4);
        ctx.restore();
    },

    // ============================================================
    // SHOP SCREEN
    // ============================================================
    _layout() {
        const L = { tabs: [], cards: [], tabY: 96, tabH: 36, tabW: 176, gx: 83, cw: 176, ch: 132, gy: 142 };
        for (let i = 0; i < 4; i++) L.tabs.push({ x: 83 + i * 186, y: L.tabY, w: L.tabW, h: L.tabH });
        for (let i = 0; i < 8; i++) L.cards.push({ x: L.gx + (i % 4) * 186, y: L.gy + Math.floor(i / 4) * 142, w: L.cw, h: L.ch });
        L.detail = { x: 83, y: 428, w: 734, h: 62 };
        L.action = { x: 597, y: 438, w: 210, h: 42 };
        L.back = { x: 629, y: 502, w: 188, h: 42 };
        const adOk = this.canWatchAd();
        L.daily = adOk ? { x: 83, y: 502, w: 230, h: 42 } : { x: 83, y: 502, w: 350, h: 42 };
        L.ad = adOk ? { x: 326, y: 502, w: 230, h: 42 } : null;
        return L;
    },

    open() {
        this._data();
        this.ui.earnInfoOpen = false;
        const tab = SHOP_TABS[this.ui.tab].key;
        this.ui.sel[tab] = Math.max(0, SHOP_CATALOG[tab].findIndex(i => i.id === this.equippedId(tab)));
        currentState = 'SHOP';
        updateTouchUI();
    },
    close() { currentState = 'MENU'; updateTouchUI(); },

    _btn(x, y, w, h, label, color, opts) {
        opts = opts || {};
        const hovered = !opts.disabled && typeof uiButtonHovered === 'function' &&
            uiButtonHovered(x, y, w, h);
        ctx.save();
        ctx.shadowColor = hovered ? color : 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = opts.disabled ? 0 : (hovered ? 18 : 5);
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = opts.disabled ? 'rgba(255,255,255,0.08)' : color;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.strokeStyle = opts.disabled ? 'rgba(255,255,255,0.12)' : (hovered ? '#ffffff' : 'rgba(0,0,0,0.3)');
        ctx.lineWidth = hovered ? 2.5 : 1.5; ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = opts.disabled ? 'rgba(255,255,255,0.4)' : THEME.ink;
        ctx.font = '800 ' + (opts.fontSize || 16) + 'px Outfit, sans-serif';
        if (opts.coin !== undefined) {
            const t = String(opts.coin), tw = ctx.measureText(label + ' ' + t).width;
            const sx = x + w / 2 - (tw + 22) / 2;
            ctx.textAlign = 'left';
            ctx.fillText(label, sx, y + h / 2 + 6);
            const lw = ctx.measureText(label + ' ').width;
            Cosmetics.drawCoin(sx + lw + 8, y + h / 2, 8);
            ctx.fillText(t, sx + lw + 20, y + h / 2 + 6);
        } else {
            ctx.fillText(fitText(label, w - 16), x + w / 2, y + h / 2 + 6);
        }
        ctx.restore();
    },

    // ============================================================
    // "HOW TO EARN COINS" — every number here is read straight from the
    // constants above (PVE_WIN, T_CHAMPION_BONUS, STREAK_STEP, etc.), the
    // SAME ones awardPve/awardLocal/awardTournament/streakBonus actually use
    // to pay out, so this can never show a number that doesn't match what
    // you're really paid.
    drawEarnInfo() {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, 900, 600);
        themeCard(50, 30, 800, 546, 22, THEME.gold);
        ctx.textAlign = 'center';
        themeTitle('trophy', 'HOW TO EARN COINS', 450, 74, THEME.gold, 22);

        const diffLine = 'EASY +0  \u00b7  MED +' + this.PVE_DIFFICULTY_BONUS.MEDIUM + '  \u00b7  HARD +' + this.PVE_DIFFICULTY_BONUS.HARD +
            '  \u00b7  ELITE +' + this.PVE_DIFFICULTY_BONUS.ELITE + '  \u00b7  WC +' + this.PVE_DIFFICULTY_BONUS.WORLD_CLASS;
        // Two columns so five sections' worth of rates fit one screen without
        // scrolling or shrinking the text past comfortable reading size.
        const leftCol = [
            { title: 'VS COMPUTER', rows: [
                ['Win', '+' + this.PVE_WIN],
                ['Draw', '+' + this.PVE_DRAW],
                ['Play to the end (loss)', '+' + this.PVE_PLAYED],
                ['Each goal (win only)', '+' + this.PVE_GOAL_COIN + ' up to +' + this.PVE_GOAL_CAP],
                ['Difficulty bonus:', null],
                [diffLine, null, true],
            ]},
            { title: 'WIN STREAK (VS Computer)', rows: [
                ['Each win in a row after the 1st', '+' + this.STREAK_STEP + '/win, up to +' + this.STREAK_CAP],
                ['Every 5th win in a row', '+' + this.STREAK_MILESTONE_5 + ' at 5, +' + this.STREAK_MILESTONE_10PLUS + ' at 10+'],
                ['Draw, loss, or quitting mid-match', 'ends it'],
            ]},
            { title: '1 VS 1 (LOCAL)', rows: [
                ['Any finished match', '+' + this.LOCAL_MATCH],
            ]},
        ];
        const rightCol = [
            { title: 'TOURNAMENT', rows: [
                ['Win a match', '+' + this.T_WIN],
                ['Draw', '+' + this.T_DRAW],
                ['Play to the end (loss)', '+' + this.T_PLAYED],
                ['Win a knockout match', '+' + this.T_KNOCKOUT_BONUS + ' extra'],
                ['Reach the Final and lose', '+' + this.T_FINALIST_BONUS + ' extra'],
                ['Win the Final (Champion)', '+' + this.T_CHAMPION_BONUS + ' extra'],
            ]},
            { title: 'EVERY DAY', rows: [
                ['First finished match (any mode)', '+' + this.FIRST_MATCH_BONUS],
                ['Daily login, day 1 to 7', this.DAILY_REWARDS.join('/')],
                ['Watch an ad', '+' + this.AD_REWARD],
            ]},
        ];

        const drawCol = (col, x, labelW, valX) => {
            let y = 116;
            for (const sec of col) {
                ctx.textAlign = 'left';
                ctx.fillStyle = THEME.accent;
                ctx.font = '800 13px Outfit, sans-serif';
                ctx.fillText(sec.title, x, y);
                y += 20;
                for (const [label, amount, full] of sec.rows) {
                    ctx.fillStyle = amount === null && !full ? '#ffffff' : 'rgba(255,255,255,0.82)';
                    ctx.font = (full ? '600 11px' : '600 12px') + ' Outfit, sans-serif';
                    ctx.fillText(fitText(label, full ? 345 : labelW), x, y);
                    if (amount !== null) {
                        ctx.textAlign = 'right';
                        ctx.fillStyle = THEME.gold;
                        ctx.font = '700 12px Outfit, sans-serif';
                        ctx.fillText(fitText(amount, 150), valX, y);
                        ctx.textAlign = 'left';
                    }
                    y += 17;
                }
                y += 10;
            }
        };
        drawCol(leftCol, 90, 210, 380);
        drawCol(rightCol, 470, 210, 800);

        ctx.beginPath(); ctx.moveTo(450, 108); ctx.lineTo(450, 540);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke();

        window._earnInfoBackBtn = themeBackButton(350, 542, 200, 32);
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.fillText('Press ESC or tap BACK to return to the shop', 450, 528);
        ctx.restore();
    },

    draw() {
        Cosmetics.beginFrame();
        const L = this._layout();
        this.ui.hit = L;
        if (this.ui.earnInfoOpen) { this.drawEarnInfo(); return; }
        const tab = SHOP_TABS[this.ui.tab].key;
        const list = SHOP_CATALOG[tab];
        const selIdx = Math.min(this.ui.sel[tab], list.length - 1);
        const now = performance.now();

        themeBackdrop();
        ctx.save();
        themeCard(50, 24, 800, 552, 22, THEME.gold);
        themeTitle('trophy', 'SHOP', 450, 74, THEME.gold, 30);

        // balance
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(650, 44, 180, 36, 18); ctx.fill();
        Cosmetics.drawCoin(674, 62, 11);
        ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff'; ctx.font = '800 18px Outfit, sans-serif';
        ctx.fillText(this.coins().toLocaleString('en-US'), 694, 68);

        // "How do I earn coins?" - a labeled pill in the top-left corner, so
        // it reads as an action rather than a stray icon.
        L.earnInfo = { x: 66, y: 44, w: 152, h: 36 };
        const earnHovered = uiButtonHovered(L.earnInfo.x, L.earnInfo.y, L.earnInfo.w, L.earnInfo.h);
        ctx.fillStyle = 'rgba(255,196,54,0.12)';
        ctx.beginPath(); ctx.roundRect(L.earnInfo.x, L.earnInfo.y, L.earnInfo.w, L.earnInfo.h, 18); ctx.fill();
        ctx.strokeStyle = earnHovered ? '#ffffff' : 'rgba(255,196,54,0.55)';
        ctx.lineWidth = earnHovered ? 2 : 1.2; ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = THEME.gold; ctx.font = '800 13px Outfit, sans-serif';
        ctx.fillText('HOW TO EARN?', L.earnInfo.x + L.earnInfo.w / 2, L.earnInfo.y + 23);

        // tabs
        SHOP_TABS.forEach((t, i) => {
            const r = L.tabs[i], active = i === this.ui.tab;
            const hovered = uiButtonHovered(r.x, r.y, r.w, r.h);
            ctx.fillStyle = active ? THEME.gold : THEME.ink;
            ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 10); ctx.fill();
            ctx.strokeStyle = hovered ? '#ffffff' : (active ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.14)');
            ctx.lineWidth = hovered ? 2.5 : 1.2; ctx.stroke();
            ctx.textAlign = 'center';
            ctx.fillStyle = active ? THEME.ink : 'rgba(255,255,255,0.7)';
            ctx.font = '800 14px Outfit, sans-serif';
            ctx.fillText(t.label, r.x + r.w / 2, r.y + r.h / 2 + 5);
        });

        // item cards (ascending price, cheapest first)
        for (let i = 0; i < 8; i++) {
            const r = L.cards[i];
            if (i >= list.length) {
                ctx.save();
                ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.stroke();
                ctx.setLineDash([]);
                ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.28)';
                ctx.font = '900 30px Outfit, sans-serif'; ctx.fillText('?', r.x + r.w / 2, r.y + 62);
                ctx.font = '700 11px Outfit, sans-serif'; ctx.fillText('NEW ITEMS SOON', r.x + r.w / 2, r.y + 90);
                ctx.restore();
                continue;
            }
            const it = list[i];
            const owned = this.owns(tab, it.id), eq = this.equippedId(tab) === it.id, sel = i === selIdx;
            const afford = this.coins() >= it.price;
            const hovered = uiButtonHovered(r.x, r.y, r.w, r.h);
            ctx.save();
            if (sel || hovered) {
                ctx.shadowColor = sel ? THEME.gold : THEME.blue;
                ctx.shadowBlur = hovered ? 18 : 16;
            }
            ctx.fillStyle = sel ? '#1a2540' : (hovered ? '#182844' : THEME.ink);
            ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 12); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = hovered && !sel ? THEME.blue : (sel ? THEME.gold : (eq ? THEME.accent : 'rgba(255,255,255,0.14)'));
            ctx.lineWidth = hovered || sel ? 2.5 : 1.5; ctx.stroke();
            ctx.restore();

            // preview
            ctx.save();
            ctx.beginPath(); ctx.roundRect(r.x + 8, r.y + 8, r.w - 16, 70, 8); ctx.clip();
            Cosmetics.drawPreview(tab, it.id, r.x + 8, r.y + 8, r.w - 16, 70, now);
            ctx.restore();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff'; ctx.font = '800 14px Outfit, sans-serif';
            ctx.fillText(fitText(it.name, r.w - 14), r.x + r.w / 2, r.y + 98);
            if (eq) {
                ctx.fillStyle = THEME.accent; ctx.font = '800 12px Outfit, sans-serif';
                ctx.fillText('\u2713 EQUIPPED', r.x + r.w / 2, r.y + 120);
            } else if (owned) {
                ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '800 12px Outfit, sans-serif';
                ctx.fillText('OWNED', r.x + r.w / 2, r.y + 120);
            } else {
                ctx.font = '800 14px Outfit, sans-serif';
                const t = String(it.price), tw = ctx.measureText(t).width;
                const sx = r.x + r.w / 2 - (tw + 22) / 2;
                Cosmetics.drawCoin(sx + 8, r.y + 115, 8);
                ctx.textAlign = 'left';
                ctx.fillStyle = afford ? THEME.gold : '#ff7b7b';
                ctx.fillText(t, sx + 22, r.y + 120);
            }
        }

        // detail bar for the selected item
        const it = list[selIdx];
        const D = L.detail;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath(); ctx.roundRect(D.x, D.y, D.w, D.h, 12); ctx.fill();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff'; ctx.font = '800 19px Outfit, sans-serif';
        ctx.fillText(it.name, D.x + 18, D.y + 26);
        const toast = this.ui.toast && now < this.ui.toast.until ? this.ui.toast : null;
        ctx.font = '600 13px Outfit, sans-serif';
        if (toast) { ctx.fillStyle = toast.color; ctx.font = '800 14px Outfit, sans-serif'; ctx.fillText(toast.text, D.x + 18, D.y + 48); }
        else {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText(fitText(it.desc, 370), D.x + 18, D.y + 48);
        }

        const owned = this.owns(tab, it.id), eq = this.equippedId(tab) === it.id, afford = this.coins() >= it.price;
        const A = L.action;
        if (eq) this._btn(A.x, A.y, A.w, A.h, '\u2713 EQUIPPED', THEME.accent, { disabled: true });
        else if (owned) this._btn(A.x, A.y, A.w, A.h, 'EQUIP', THEME.accent);
        else if (afford) this._btn(A.x, A.y, A.w, A.h, 'BUY', THEME.gold, { coin: it.price });
        else this._btn(A.x, A.y, A.w, A.h, 'NEED ' + (it.price - this.coins()) + ' MORE', THEME.gold, { disabled: true, fontSize: 14 });

        // daily reward / watch ad / back
        const ds = this.dailyStatus();
        if (ds.available) this._btn(L.daily.x, L.daily.y, L.daily.w, L.daily.h, 'DAILY REWARD  +' + ds.amount, THEME.accent, { fontSize: 15 });
        else this._btn(L.daily.x, L.daily.y, L.daily.w, L.daily.h, 'DAILY \u2713  COME BACK TOMORROW', THEME.accent, { disabled: true, fontSize: 13 });
        if (L.ad) this._btn(L.ad.x, L.ad.y, L.ad.w, L.ad.h, 'WATCH AD  +' + this.AD_REWARD, THEME.blue, { fontSize: 15 });
        this._btn(L.back.x, L.back.y, L.back.w, L.back.h, 'BACK', THEME.purple);

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '600 11px Outfit, sans-serif';
        ctx.fillText(tab === 'striker'
            ? 'Striker skins style YOUR red team in 1v1 and VS Computer  \u00b7  Tournament strikers always wear their flag'
            : 'Tap HOW TO EARN? for exact coin amounts  \u00b7  Arrows to browse  \u00b7  ENTER to buy / equip  \u00b7  ESC to go back', 450, 566);
        ctx.restore();
    },

    _act() {
        const tab = SHOP_TABS[this.ui.tab].key, list = SHOP_CATALOG[tab];
        const it = list[Math.min(this.ui.sel[tab], list.length - 1)];
        if (this.equippedId(tab) === it.id) return;
        if (this.owns(tab, it.id)) {
            if (this.equip(tab, it.id)) { SoundManager.playSFX('confirm'); this._toast('Equipped: ' + it.name, THEME.accent); }
            return;
        }
        const res = this.buy(tab, it.id);
        if (res.ok) { this.equip(tab, it.id); SoundManager.playSFX('confirm'); this._toast('Purchased & equipped: ' + it.name + '!', THEME.accent); }
        else if (res.reason === 'coins') { SoundManager.playSFX('menuClick', 0.3); this._toast('Not enough coins - need ' + res.missing + ' more', THEME.red); }
    },

    handlePointer(x, y) {
        if (this.ui.earnInfoOpen) {
            const b = window._earnInfoBackBtn;
            if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { SoundManager.playSFX('menuClick'); this.ui.earnInfoOpen = false; }
            return;
        }
        const L = this.ui.hit || this._layout();
        const inside = r => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
        if (inside(L.earnInfo)) { SoundManager.playSFX('menuClick'); this.ui.earnInfoOpen = true; return; }
        if (inside(L.back)) { SoundManager.playSFX('menuClick'); this.close(); return; }
        for (let i = 0; i < L.tabs.length; i++) {
            if (inside(L.tabs[i])) { if (this.ui.tab !== i) { this.ui.tab = i; SoundManager.playSFX('menuClick', 0.4); } return; }
        }
        if (inside(L.action)) { this._act(); return; }
        if (inside(L.daily)) {
            const got = this.claimDaily();
            if (got) { SoundManager.playSFX('confirm'); this._toast('Daily reward: +' + got + ' coins!', THEME.accent); }
            return;
        }
        if (inside(L.ad)) { SoundManager.playSFX('menuClick'); this.watchAd(); return; }
        const tab = SHOP_TABS[this.ui.tab].key, list = SHOP_CATALOG[tab];
        for (let i = 0; i < list.length; i++) {
            if (inside(L.cards[i])) {
                const wasSel = this.ui.sel[tab] === i;
                this.ui.sel[tab] = i;
                SoundManager.playSFX('menuClick', 0.3);
                // second tap on an item you already own equips it (buying always needs the BUY button)
                if (wasSel && this.owns(tab, list[i].id)) this._act();
                return;
            }
        }
    },

    handleKey(e) {
        if (this.ui.earnInfoOpen) {
            if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter') { SoundManager.playSFX('menuClick'); this.ui.earnInfoOpen = false; }
            return;
        }
        const tab = SHOP_TABS[this.ui.tab].key, list = SHOP_CATALOG[tab];
        if (e.key === '?' || e.key === '/') { SoundManager.playSFX('menuClick'); this.ui.earnInfoOpen = true; return; }
        if (e.key === 'Escape' || e.key === 'Backspace') { SoundManager.playSFX('menuClick'); this.close(); return; }
        if (e.key === 'ArrowRight') this.ui.sel[tab] = Math.min(list.length - 1, this.ui.sel[tab] + 1);
        else if (e.key === 'ArrowLeft') this.ui.sel[tab] = Math.max(0, this.ui.sel[tab] - 1);
        else if (e.key === 'ArrowDown') this.ui.sel[tab] = Math.min(list.length - 1, this.ui.sel[tab] + 4);
        else if (e.key === 'ArrowUp') this.ui.sel[tab] = Math.max(0, this.ui.sel[tab] - 4);
        else if (e.key >= '1' && e.key <= '4') { this.ui.tab = Number(e.key) - 1; SoundManager.playSFX('menuClick', 0.4); }
        else if (e.key === 'Enter' && !e.repeat) this._act();
    }
};

// ============================================================
// COSMETICS: everything that changes how the game LOOKS
// ============================================================
const Cosmetics = {
    _ballCache: {}, _haloCache: {}, _pitchPrev: {}, _builtThisFrame: false,

    beginFrame() { this._builtThisFrame = false; },

    drawCoin(x, y, r) {
        ctx.save();
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
        g.addColorStop(0, '#fff2a8'); g.addColorStop(0.6, '#ffc636'); g.addColorStop(1, '#d9962b');
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = Math.max(1, r * 0.14); ctx.strokeStyle = '#b57a14'; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(0.8, r * 0.1); ctx.strokeStyle = 'rgba(181,122,20,0.7)'; ctx.stroke();
        ctx.restore();
    },

    // ---------- ball ----------
    // Returns a finished ball sprite (cached offscreen canvas) for ANY skin
    // id, including 'classic'. Never null: 'classic' uses the real artwork
    // (images/football.png) once it has loaded; every other skin, and
    // 'classic' itself until the image loads (or if it ever fails to),
    // uses the procedural sprite below so the ball can never be blank.
    ballSkinCanvas(id) {
        // FootballImg.onload firing is not, by itself, a hard guarantee the
        // image is still safely drawable at THIS exact moment in every
        // browser/host (a blocked load - e.g. ERR_BLOCKED_BY_CLIENT - can
        // still leave naturalWidth at 0, or fire onload before onerror on a
        // retry). Calling canvas.drawImage() on a non-drawable image throws
        // a TypeError SYNCHRONOUSLY, and that was escaping this function
        // uncaught and crashing the whole shop screen. Fixed with two
        // separate, unambiguous cache slots (real photo vs. procedural) and
        // a try/catch that can never let a bad image source take down
        // rendering - it just falls back to the procedural ball below.
        if (id === 'classic') {
            const imgUsable = typeof footballImgReady !== 'undefined' && footballImgReady
                && typeof FootballImg !== 'undefined' && FootballImg.naturalWidth > 0 && FootballImg.naturalHeight > 0;
            if (imgUsable) {
                if (this._realBallCanvas) return this._realBallCanvas;
                try {
                    const S = 160, c = document.createElement('canvas');
                    c.width = S; c.height = S;
                    c.getContext('2d').drawImage(FootballImg, 0, 0, S, S);
                    return (this._realBallCanvas = c);
                } catch (e) {
                    console.warn('[Shop] football.png failed to draw - using the procedural ball instead.', e);
                    footballImgReady = false;   // stop retrying every frame
                    // falls through to the procedural build below
                }
            }
        }
        if (this._ballCache[id]) return this._ballCache[id];
        const it = Shop.item('ball', id) || Shop.item('ball', 'classic');
        const S = 160, R = S / 2, c = document.createElement('canvas');
        c.width = S; c.height = S;
        const g = c.getContext('2d');
        const [cLight, cMid, cDark] = it.base;

        // --- sphere body ---
        g.save();
        g.beginPath(); g.arc(R, R, R - 2, 0, Math.PI * 2); g.clip();
        const body = g.createRadialGradient(R * 0.7, R * 0.62, R * 0.08, R, R, R);
        body.addColorStop(0, cLight); body.addColorStop(0.5, cMid); body.addColorStop(1, cDark);
        g.fillStyle = body; g.fillRect(0, 0, S, S);

        // --- surface pattern (under the panels) ---
        this._ballDeco(g, it, S, R);

        // --- classic football panels: centre pentagon + ring of 5, joined by seams ---
        const pent = (cx, cy, r, rot) => {
            g.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = rot + i * (Math.PI * 2 / 5);
                const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
                if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
            }
            g.closePath();
        };
        const cr = R * 0.30, ringR = R * 0.72, outerR = R * 0.32;
        g.fillStyle = it.panel; g.strokeStyle = it.seam; g.lineWidth = R * 0.045; g.lineJoin = 'round';
        pent(R, R, cr, -Math.PI / 2); g.fill(); g.stroke();
        for (let i = 0; i < 5; i++) {
            const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
            const px = R + Math.cos(a) * cr, py = R + Math.sin(a) * cr;
            const qx = R + Math.cos(a) * ringR, qy = R + Math.sin(a) * ringR;
            g.beginPath(); g.moveTo(px, py); g.lineTo(qx, qy); g.stroke();       // seam spokes
            pent(R + Math.cos(a) * (R * 1.02), R + Math.sin(a) * (R * 1.02), outerR, a + Math.PI / 5); g.fill(); g.stroke();
            const a2 = a + Math.PI / 5;                                            // hex-edge seams
            g.beginPath(); g.moveTo(qx, qy); g.lineTo(R + Math.cos(a2) * R * 0.98, R + Math.sin(a2) * R * 0.98); g.stroke();
        }

        // --- lighting: soft shadow rim + glossy highlight ---
        const rim = g.createRadialGradient(R, R, R * 0.55, R, R, R);
        rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,0,0.38)');
        g.fillStyle = rim; g.fillRect(0, 0, S, S);
        const gloss = g.createRadialGradient(R * 0.62, R * 0.52, 0, R * 0.62, R * 0.52, R * 0.55);
        gloss.addColorStop(0, 'rgba(255,255,255,0.75)'); gloss.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gloss; g.fillRect(0, 0, S, S);
        g.restore();

        // --- crisp outline so the ball reads on any pitch colour ---
        g.beginPath(); g.arc(R, R, R - 2, 0, Math.PI * 2);
        g.lineWidth = 3; g.strokeStyle = 'rgba(10,14,20,0.55)'; g.stroke();
        return (this._ballCache[id] = c);
    },
    // Per-skin surface decoration, drawn on the sphere before the panels.
    _ballDeco(g, it, S, R) {
        const d = it.deco;
        if (!d) return;
        g.save();
        if (d === 'flame') {
            for (let i = 0; i < 7; i++) {
                const x = S * (0.08 + i * 0.14), h = S * (0.28 + ((i * 37) % 5) * 0.05);
                const fg = g.createLinearGradient(0, S, 0, S - h);
                fg.addColorStop(0, 'rgba(255,220,80,0.9)'); fg.addColorStop(0.5, 'rgba(255,110,20,0.75)'); fg.addColorStop(1, 'rgba(255,60,0,0)');
                g.fillStyle = fg;
                g.beginPath(); g.moveTo(x - S * 0.06, S); g.quadraticCurveTo(x - S * 0.02, S - h * 0.5, x, S - h);
                g.quadraticCurveTo(x + S * 0.02, S - h * 0.5, x + S * 0.06, S); g.closePath(); g.fill();
            }
        } else if (d === 'wave') {
            g.lineWidth = S * 0.035; g.strokeStyle = 'rgba(255,255,255,0.55)';
            for (let r = 0; r < 5; r++) {
                g.beginPath();
                for (let x = -4; x <= S + 4; x += 4) {
                    const y = S * (0.2 + r * 0.17) + Math.sin(x / S * Math.PI * 3 + r) * S * 0.04;
                    if (x === -4) g.moveTo(x, y); else g.lineTo(x, y);
                }
                g.stroke();
            }
        } else if (d === 'bolt') {
            g.fillStyle = 'rgba(255,255,255,0.5)';
            g.beginPath(); g.moveTo(S * 0.58, S * 0.08); g.lineTo(S * 0.34, S * 0.52); g.lineTo(S * 0.5, S * 0.52);
            g.lineTo(S * 0.42, S * 0.92); g.lineTo(S * 0.7, S * 0.42); g.lineTo(S * 0.53, S * 0.42); g.closePath(); g.fill();
        } else if (d === 'shine') {
            const sg = g.createLinearGradient(0, 0, S, S);
            sg.addColorStop(0, 'rgba(255,255,255,0.0)'); sg.addColorStop(0.45, 'rgba(255,255,255,0.55)');
            sg.addColorStop(0.55, 'rgba(255,240,170,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0.0)');
            g.fillStyle = sg; g.fillRect(0, 0, S, S);
        } else if (d === 'carbon') {
            g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 2;
            for (let i = -S; i < S * 2; i += 9) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
            for (let i = -S; i < S * 2; i += 9) { g.beginPath(); g.moveTo(i, S); g.lineTo(i + S, 0); g.stroke(); }
        } else if (d === 'stars') {
            const neb = g.createRadialGradient(S * 0.35, S * 0.6, 0, S * 0.35, S * 0.6, S * 0.6);
            neb.addColorStop(0, 'rgba(255,90,209,0.55)'); neb.addColorStop(1, 'rgba(255,90,209,0)');
            g.fillStyle = neb; g.fillRect(0, 0, S, S);
            g.fillStyle = 'rgba(255,255,255,0.95)';
            for (let i = 0; i < 26; i++) {                     // deterministic "random" stars
                const x = ((i * 73) % 100) / 100 * S, y = ((i * 47 + 13) % 100) / 100 * S;
                g.beginPath(); g.arc(x, y, i % 4 === 0 ? 2.2 : 1.1, 0, Math.PI * 2); g.fill();
            }
        }
        g.restore();
    },
    haloSprite(color, r) {
        const key = color + '|' + Math.round(r);
        if (this._haloCache[key]) return this._haloCache[key];
        const R = Math.ceil(r * 2.6), c = document.createElement('canvas');
        c.width = c.height = R * 2;
        const g = c.getContext('2d');
        const gr = g.createRadialGradient(R, R, r * 0.5, R, R, R);
        gr.addColorStop(0, color + '99'); gr.addColorStop(0.5, color + '33'); gr.addColorStop(1, color + '00');
        g.fillStyle = gr; g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.fill();
        return (this._haloCache[key] = { canvas: c, R });
    },

    // ---------- trail ----------
    // trail = [{x,y,life}] oldest -> newest, life 15 (fresh) .. 0 (gone)
    drawTrail(trail, radius, style, now) {
        if (!trail || !trail.length) return;
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        let prev = null;
        for (let i = 0; i < trail.length; i++) {
            const t = trail[i];
            if (t.life <= 0) continue;
            const a = Math.min(1, t.life / 15);
            const r = radius * (0.3 + 0.8 * a);
            let col, core;
            switch (style) {
                case 'fire':    col = `hsla(${6 + a * 38},100%,${48 + a * 14}%,${0.25 + 0.6 * a})`;  core = `hsla(${40 + a * 10},100%,70%,${0.5 * a})`; break;
                case 'ice':     col = `hsla(${195 + (1 - a) * 25},100%,${62 + a * 20}%,${0.22 + 0.55 * a})`; core = `rgba(255,255,255,${0.6 * a})`; break;
                case 'neon':    col = `hsla(128,100%,${46 + a * 18}%,${0.22 + 0.6 * a})`; core = `rgba(210,255,215,${0.7 * a})`; break;
                case 'gold':    col = `hsla(46,100%,${50 + a * 16}%,${0.28 + 0.6 * a})`; core = `rgba(255,248,200,${0.65 * a})`; break;
                case 'rainbow': col = `hsla(${(i * 28 + now * 0.22) % 360},100%,58%,${0.35 + 0.55 * a})`; core = `rgba(255,255,255,${0.35 * a})`; break;
                case 'galaxy':  col = `hsla(${268 + (1 - a) * 70},100%,${58 + a * 16}%,${0.25 + 0.55 * a})`; core = `rgba(255,225,255,${0.55 * a})`; break;
                default:        col = `rgba(255,255,255,${Math.min(0.3, a * 0.3)})`; core = null;
            }
            if (prev && core) {
                ctx.strokeStyle = core; ctx.lineWidth = Math.max(1, r * 0.45);
                ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(t.x, t.y); ctx.stroke();
            }
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill();
            // sparkles (gold / galaxy): a few points twinkle, deterministic per point so they don't flicker randomly
            if ((style === 'gold' || style === 'galaxy') && i % 3 === 0) {
                const ph = ((now * 0.006 + i * 1.7) % 6.283), tw = 0.5 + 0.5 * Math.sin(ph);
                const sx = t.x + Math.cos(i * 2.4) * radius * 0.9, sy = t.y + Math.sin(i * 2.4) * radius * 0.9, s = 1.2 + tw * 2.2 * a;
                ctx.fillStyle = style === 'gold' ? `rgba(255,255,220,${0.8 * a * tw})` : `rgba(255,255,255,${0.85 * a * tw})`;
                ctx.beginPath();
                ctx.moveTo(sx, sy - s * 1.8); ctx.lineTo(sx + s * 0.5, sy - s * 0.5); ctx.lineTo(sx + s * 1.8, sy);
                ctx.lineTo(sx + s * 0.5, sy + s * 0.5); ctx.lineTo(sx, sy + s * 1.8); ctx.lineTo(sx - s * 0.5, sy + s * 0.5);
                ctx.lineTo(sx - s * 1.8, sy); ctx.lineTo(sx - s * 0.5, sy - s * 0.5); ctx.closePath(); ctx.fill();
            }
            prev = t;
        }
        ctx.restore();
    },

    // ---------- striker ----------
    // The skin for one on-pitch player, or null (= the normal token).
    strikerSkinFor(p) {
        if (typeof tournamentMode !== 'undefined' && tournamentMode) return null;   // flags in tournaments
        if (!p || p.team !== 'red') return null;
        const it = Shop.equippedItem('striker');
        return it && it.id !== 'classic' ? it : null;
    },
    drawEmblem(g, kind, cx, cy, r) {
        g.save();
        g.translate(cx, cy);
        g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 2; g.shadowOffsetY = 0.5;
        const s = r * 0.62;
        if (kind === 'bolt') {
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.moveTo(s * 0.25, -s); g.lineTo(-s * 0.55, s * 0.12); g.lineTo(-s * 0.05, s * 0.12);
            g.lineTo(-s * 0.3, s); g.lineTo(s * 0.6, -s * 0.22); g.lineTo(s * 0.05, -s * 0.22); g.closePath(); g.fill();
        } else if (kind === 'flame') {
            g.fillStyle = '#ffd166';
            g.beginPath();
            g.moveTo(0, -s); g.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.85, s * 0.9, 0, s * 0.95);
            g.bezierCurveTo(-s * 0.85, s * 0.9, -s * 0.9, -s * 0.05, -s * 0.2, -s * 0.35);
            g.bezierCurveTo(-s * 0.15, -s * 0.05, s * 0.05, -s * 0.1, 0, -s); g.closePath(); g.fill();
            g.shadowBlur = 0;
            g.fillStyle = '#ff6b35';
            g.beginPath(); g.moveTo(0, -s * 0.1); g.bezierCurveTo(s * 0.5, s * 0.25, s * 0.4, s * 0.8, 0, s * 0.8);
            g.bezierCurveTo(-s * 0.4, s * 0.8, -s * 0.45, s * 0.3, 0, -s * 0.1); g.closePath(); g.fill();
        } else if (kind === 'crown') {
            g.fillStyle = '#ffd23f';
            g.beginPath();
            g.moveTo(-s, s * 0.6); g.lineTo(-s, -s * 0.45); g.lineTo(-s * 0.5, s * 0.05); g.lineTo(0, -s * 0.7);
            g.lineTo(s * 0.5, s * 0.05); g.lineTo(s, -s * 0.45); g.lineTo(s, s * 0.6); g.closePath(); g.fill();
            g.shadowBlur = 0; g.fillStyle = '#fff6c2';
            [[-s, -s * 0.45], [0, -s * 0.7], [s, -s * 0.45]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, s * 0.17, 0, Math.PI * 2); g.fill(); });
        } else if (kind === 'diamond') {
            g.fillStyle = '#5ef2ff';
            g.beginPath(); g.moveTo(-s * 0.95, -s * 0.2); g.lineTo(-s * 0.5, -s * 0.75); g.lineTo(s * 0.5, -s * 0.75);
            g.lineTo(s * 0.95, -s * 0.2); g.lineTo(0, s * 0.95); g.closePath(); g.fill();
            g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = Math.max(0.8, s * 0.09);
            g.beginPath(); g.moveTo(-s * 0.95, -s * 0.2); g.lineTo(s * 0.95, -s * 0.2);
            g.moveTo(-s * 0.5, -s * 0.75); g.lineTo(-s * 0.25, -s * 0.2); g.lineTo(0, s * 0.95);
            g.moveTo(s * 0.5, -s * 0.75); g.lineTo(s * 0.25, -s * 0.2); g.lineTo(0, s * 0.95); g.stroke();
        } else {
            drawStar(0, 0, 5, r * 0.5, r * 0.22, g);
        }
        g.restore();
    },
    // Ring for skins: a solid colour, or 'rainbow' (conic gradient where supported)
    ringStyle(g, ring, cx, cy) {
        if (ring === 'rainbow') {
            if (typeof g.createConicGradient === 'function') {
                const cg = g.createConicGradient(0, cx, cy);
                ['#ff4d4d', '#ffb347', '#ffe94d', '#4dff88', '#4dc3ff', '#b06bff', '#ff4d4d'].forEach((c, i, a) => cg.addColorStop(i / (a.length - 1), c));
                return cg;
            }
            return '#ffe94d';
        }
        return ring;
    },
    // A finished striker sprite for the shop preview (built once per skin)
    strikerPreview(id) {
        const key = 'sp_' + id;
        if (this._ballCache[key]) return this._ballCache[key];
        const it = Shop.item('striker', id);
        const p = { color: '#e74c3c', gradColor: '#a93226', isGk: false, radius: 24, team: 'red' };
        const sprite = buildPlayerSprite(p, null, it && it.id !== 'classic' ? it : null);
        return (this._ballCache[key] = sprite);
    },

    // ---------- pitch ----------
    palette(id) {
        const it = Shop.item('pitch', id);
        return it && it.pal ? it.pal : null;
    },
    pitchPreview(id) {
        if (this._pitchPrev[id]) return this._pitchPrev[id];
        if (this._builtThisFrame) return null;            // at most one pitch is built per frame (no hitch)
        this._builtThisFrame = true;
        const full = buildPitchCanvas(this.palette(id));
        const c = document.createElement('canvas');
        c.width = 300; c.height = 200;
        c.getContext('2d').drawImage(full, 0, 0, 300, 200);
        return (this._pitchPrev[id] = c);
    },

    // ---------- shop card previews ----------
    drawPreview(tab, id, x, y, w, h, now) {
        const cx = x + w / 2, cy = y + h / 2;
        ctx.fillStyle = tab === 'pitch' ? '#0b1220' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, w, h);
        if (tab === 'ball') {
            const it = Shop.item('ball', id);
            if (it.glow) { const hs = this.haloSprite(it.glow, 22); ctx.drawImage(hs.canvas, cx - hs.R, cy - hs.R); }
            const sk = this.ballSkinCanvas(id);
            const R = 26, rot = now * 0.0015;
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
            ctx.drawImage(sk, -R, -R, R * 2, R * 2);
            ctx.restore();
        } else if (tab === 'trail') {
            const it = Shop.item('trail', id);
            ctx.fillStyle = '#1f9a52'; ctx.fillRect(x, y, w, h);
            const pts = [];
            for (let i = 0; i < 16; i++) {
                const t = i / 15;
                pts.push({ x: x + 16 + t * (w - 46), y: cy + 14 - Math.sin(t * Math.PI) * 26, life: 2 + t * 13 });
            }
            this.drawTrail(pts, 7, it.style || 'default', now);
            const head = pts[pts.length - 1];
            ctx.drawImage(this.ballSkinCanvas('classic'), head.x - 8, head.y - 8, 16, 16);
        } else if (tab === 'striker') {
            const sp = this.strikerPreview(id);
            ctx.drawImage(sp.canvas, cx - sp.size / 2, cy - sp.size / 2);
        } else {
            const pc = this.pitchPreview(id);
            if (pc) ctx.drawImage(pc, x, y, w, h);
            else { ctx.fillStyle = '#132038'; ctx.fillRect(x, y, w, h); }
        }
    }
};
