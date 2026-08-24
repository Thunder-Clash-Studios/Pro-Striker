// ===== PRO STRIKER - tournamentData.js =====
console.log('[ProStriker] tournamentData.js loaded');

// Real team colors (primary jersey color)
const TEAM_COLORS = {
    'Algeria': '#006233',      // Green (1st kit)
    'Australia': '#FDB913',    // Yellow/Gold (1st kit)
    'Austria': '#EF2B2D',      // Red (1st kit)
    'Argentina': '#75AADB',    // Light Blue (1st kit)
    'Belgium': '#E31B23',      // Red (1st kit)
    'Brazil': '#FDB913',       // Yellow (1st kit)
    'Canada': '#E31B23',       // Red (1st kit)
    'Colombia': '#FCD116',     // Yellow (1st kit)
    'Croatia': '#E31B23',      // Red (1st kit)
    "Côte d'Ivoire": '#EF7A00', // Orange (1st kit)
    'Denmark': '#E31B23',      // Red (1st kit)
    'Ecuador': '#FCD116',      // Yellow (1st kit)
    'Egypt': '#E31B23',        // Red (1st kit)
    'England': '#FFFFFF',      // White (1st kit) – flag uses 🏴󠁧󠁢󠁥󠁮󠁧󠁿
    'France': '#0055A4',       // Blue (1st kit)
    'Germany': '#f1d0d0',      // Black/White (1st kit)
    'Iran': '#239F40',         // Green (1st kit)
    'Italy': '#0055A4',        // Blue (1st kit)
    'Japan': '#003478',        // Blue (1st kit)
    'Mexico': '#006341',       // Green (1st kit)
    'Morocco': '#E31B23',      // Red (1st kit)
    'Netherlands': '#EF7A00',  // Orange (1st kit)
    'Nigeria': '#008753',      // Green (1st kit)
    'Norway': '#EF2B2D',       // Red (1st kit)
    'Portugal': '#E31B23',     // Red (1st kit)
    'Senegal': '#00853E',      // Green (1st kit)
    'South Korea': '#003478',  // Blue (1st kit)
    'Spain': '#E31B23',        // Red (1st kit)
    'Switzerland': '#E31B23',  // Red (1st kit)
    'Türkiye': '#E30A17',      // Red (1st kit)
    'Uruguay': '#0038A8',      // Blue (1st kit)
    'USA': '#002868'           // Blue (1st kit)
};

const TOURNAMENT_TEAMS = [
    { id: 28, name: 'Algeria', flag: '🇩🇿', color: TEAM_COLORS['Algeria'], rating: 69, tier: 'UNDERDOG' },
    { id: 27, name: 'Australia', flag: '🇦🇺', color: TEAM_COLORS['Australia'], rating: 70, tier: 'CHALLENGER' },
    { id: 22, name: 'Austria', flag: '🇦🇹', color: TEAM_COLORS['Austria'], rating: 75, tier: 'CHALLENGER' },
    { id: 1, name: 'Argentina', flag: '🇦🇷', color: TEAM_COLORS['Argentina'], rating: 91, tier: 'WORLD_CLASS' },
    { id: 7, name: 'Belgium', flag: '🇧🇪', color: TEAM_COLORS['Belgium'], rating: 86, tier: 'ELITE' },
    { id: 4, name: 'Brazil', flag: '🇧🇷', color: TEAM_COLORS['Brazil'], rating: 89, tier: 'WORLD_CLASS' },
    { id: 29, name: 'Canada', flag: '🇨🇦', color: TEAM_COLORS['Canada'], rating: 68, tier: 'UNDERDOG' },
    { id: 10, name: 'Colombia', flag: '🇨🇴', color: TEAM_COLORS['Colombia'], rating: 84, tier: 'ELITE' },
    { id: 12, name: 'Croatia', flag: '🇭🇷', color: TEAM_COLORS['Croatia'], rating: 82, tier: 'ELITE' },
    { id: 30, name: "Côte d'Ivoire", flag: '🇨🇮', color: TEAM_COLORS["Côte d'Ivoire"], rating: 67, tier: 'UNDERDOG' },
    { id: 20, name: 'Denmark', flag: '🇩🇰', color: TEAM_COLORS['Denmark'], rating: 77, tier: 'COMPETITIVE' },
    { id: 24, name: 'Ecuador', flag: '🇪🇨', color: TEAM_COLORS['Ecuador'], rating: 73, tier: 'CHALLENGER' },
    { id: 23, name: 'Egypt', flag: '🇪🇬', color: TEAM_COLORS['Egypt'], rating: 74, tier: 'CHALLENGER' },
    { id: 3, name: 'England', flag: '🏴', color: TEAM_COLORS['England'], rating: 89, tier: 'WORLD_CLASS' },
    { id: 2, name: 'France', flag: '🇫🇷', color: TEAM_COLORS['France'], rating: 90, tier: 'WORLD_CLASS' },
    { id: 11, name: 'Germany', flag: '🇩🇪', color: TEAM_COLORS['Germany'], rating: 83, tier: 'ELITE' },
    { id: 21, name: 'Iran', flag: '🇮🇷', color: TEAM_COLORS['Iran'], rating: 76, tier: 'COMPETITIVE' },
    { id: 14, name: 'Italy', flag: '🇮🇹', color: TEAM_COLORS['Italy'], rating: 81, tier: 'COMPETITIVE' },
    { id: 16, name: 'Japan', flag: '🇯🇵', color: TEAM_COLORS['Japan'], rating: 79, tier: 'COMPETITIVE' },
    { id: 9, name: 'Mexico', flag: '🇲🇽', color: TEAM_COLORS['Mexico'], rating: 84, tier: 'ELITE' },
    { id: 5, name: 'Morocco', flag: '🇲🇦', color: TEAM_COLORS['Morocco'], rating: 88, tier: 'WORLD_CLASS' },
    { id: 8, name: 'Netherlands', flag: '🇳🇱', color: TEAM_COLORS['Netherlands'], rating: 85, tier: 'ELITE' },
    { id: 25, name: 'Nigeria', flag: '🇳🇬', color: TEAM_COLORS['Nigeria'], rating: 72, tier: 'CHALLENGER' },
    { id: 18, name: 'Norway', flag: '🇳🇴', color: TEAM_COLORS['Norway'], rating: 78, tier: 'COMPETITIVE' },
    { id: 6, name: 'Portugal', flag: '🇵🇹', color: TEAM_COLORS['Portugal'], rating: 87, tier: 'ELITE' },
    { id: 17, name: 'Senegal', flag: '🇸🇳', color: TEAM_COLORS['Senegal'], rating: 78, tier: 'COMPETITIVE' },
    { id: 31, name: 'South Korea', flag: '🇰🇷', color: TEAM_COLORS['South Korea'], rating: 66, tier: 'UNDERDOG' },
    { id: 0, name: 'Spain', flag: '🇪🇸', color: TEAM_COLORS['Spain'], rating: 92, tier: 'WORLD_CLASS' },
    { id: 13, name: 'Switzerland', flag: '🇨🇭', color: TEAM_COLORS['Switzerland'], rating: 82, tier: 'ELITE' },
    { id: 26, name: 'Türkiye', flag: '🇹🇷', color: TEAM_COLORS['Türkiye'], rating: 71, tier: 'CHALLENGER' },
    { id: 19, name: 'Uruguay', flag: '🇺🇾', color: TEAM_COLORS['Uruguay'], rating: 77, tier: 'COMPETITIVE' },
    { id: 15, name: 'USA', flag: '🇺🇸', color: TEAM_COLORS['USA'], rating: 80, tier: 'COMPETITIVE' }
];

const TIER_TO_AI = {
    'UNDERDOG': 'EASY',
    'CHALLENGER': 'MEDIUM',
    'COMPETITIVE': 'HARD',
    'ELITE': 'ELITE',
    'WORLD_CLASS': 'WORLD_CLASS'
};

const MATCH_PROBABILITIES = {
    'UNDERDOG': {
        'UNDERDOG': { win: 40, draw: 30, loss: 30 },
        'CHALLENGER': { win: 30, draw: 25, loss: 45 },
        'COMPETITIVE': { win: 15, draw: 20, loss: 65 },
        'ELITE': { win: 10, draw: 15, loss: 75 },
        'WORLD_CLASS': { win: 5, draw: 10, loss: 85 }
    },
    'CHALLENGER': {
        'UNDERDOG': { win: 45, draw: 25, loss: 30 },
        'CHALLENGER': { win: 40, draw: 30, loss: 30 },
        'COMPETITIVE': { win: 25, draw: 25, loss: 50 },
        'ELITE': { win: 15, draw: 20, loss: 65 },
        'WORLD_CLASS': { win: 10, draw: 15, loss: 75 }
    },
    'COMPETITIVE': {
        'UNDERDOG': { win: 65, draw: 20, loss: 15 },
        'CHALLENGER': { win: 50, draw: 25, loss: 25 },
        'COMPETITIVE': { win: 40, draw: 30, loss: 30 },
        'ELITE': { win: 25, draw: 25, loss: 50 },
        'WORLD_CLASS': { win: 15, draw: 20, loss: 65 }
    },
    'ELITE': {
        'UNDERDOG': { win: 75, draw: 15, loss: 10 },
        'CHALLENGER': { win: 65, draw: 20, loss: 15 },
        'COMPETITIVE': { win: 50, draw: 25, loss: 25 },
        'ELITE': { win: 40, draw: 30, loss: 30 },
        'WORLD_CLASS': { win: 25, draw: 25, loss: 50 }
    },
    'WORLD_CLASS': {
        'UNDERDOG': { win: 85, draw: 10, loss: 5 },
        'CHALLENGER': { win: 75, draw: 15, loss: 10 },
        'COMPETITIVE': { win: 65, draw: 20, loss: 15 },
        'ELITE': { win: 50, draw: 25, loss: 25 },
        'WORLD_CLASS': { win: 40, draw: 30, loss: 30 }
    }
};

// ===== FLAG IMAGES (fixes flags missing on laptop / England missing on phone) =====
// Emoji flags depend on the OS shipping flag glyphs in its emoji font. Windows
// ships NO flag glyphs at all (that's why every flag was blank on laptop), and
// England's flag is a special 4-byte "tag sequence" emoji that a lot of phone
// fonts don't support even when normal country flags work fine. Real flag
// images render identically everywhere, so we load small PNGs from flagcdn.com
// (a free, CORS-friendly flag CDN) keyed by ISO country code, and fall back to
// the emoji only for the brief moment before an image has finished loading.
const TEAM_FLAG_CODES = {
    'Algeria': 'dz', 'Australia': 'au', 'Austria': 'at', 'Argentina': 'ar',
    'Belgium': 'be', 'Brazil': 'br', 'Canada': 'ca', 'Colombia': 'co',
    'Croatia': 'hr', "Côte d'Ivoire": 'ci', 'Denmark': 'dk', 'Ecuador': 'ec',
    'Egypt': 'eg', 'England': 'gb-eng', 'France': 'fr', 'Germany': 'de',
    'Iran': 'ir', 'Italy': 'it', 'Japan': 'jp', 'Mexico': 'mx',
    'Morocco': 'ma', 'Netherlands': 'nl', 'Nigeria': 'ng', 'Norway': 'no',
    'Portugal': 'pt', 'Senegal': 'sn', 'South Korea': 'kr', 'Spain': 'es',
    'Switzerland': 'ch', 'Türkiye': 'tr', 'Uruguay': 'uy', 'USA': 'us'
};

const FlagImages = {
    cache: {},
    load(code) {
        if (!code) return null;
        if (this.cache[code]) return this.cache[code];
        const img = new Image();
        img.src = `https://flagcdn.com/w80/${code}.png`;
        this.cache[code] = img;
        return img;
    },
    // Returns a ready-to-draw <img> for this team, or null if it hasn't
    // finished loading yet (caller should fall back to the emoji in that case).
    get(team) {
        if (!team) return null;
        const code = TEAM_FLAG_CODES[team.name];
        if (!code) return null;
        const img = this.cache[code] || this.load(code);
        return (img && img.complete && img.naturalWidth > 0) ? img : null;
    }
};

// Kick off preloading immediately so flags are already cached by the time the
// team-select / bracket / result screens render.
TOURNAMENT_TEAMS.forEach(t => FlagImages.load(TEAM_FLAG_CODES[t.name]));

function getTeamById(id) { return TOURNAMENT_TEAMS.find(t => t.id === id); }
function getTeamTier(team) { return team.tier; }
function getAIDifficulty(team) { return TIER_TO_AI[team.tier] || 'MEDIUM'; }
function getMatchProbabilities(tierA, tierB) {
    if (tierA === tierB) {
        const probs = MATCH_PROBABILITIES[tierA][tierB];
        if (Math.random() < 0.5) return probs;
        else return { win: probs.loss, draw: probs.draw, loss: probs.win };
    }
    return MATCH_PROBABILITIES[tierA][tierB];
}