// ===== PRO STRIKER - tournamentData.js =====
console.log('[ProStriker] tournamentData.js loaded');

const TOURNAMENT_TEAMS = [
    { id: 28, name: 'Algeria', flag: '🇩🇿', color: '#006233', rating: 69, tier: 'UNDERDOG' },
    { id: 27, name: 'Australia', flag: '🇦🇺', color: '#00008b', rating: 70, tier: 'CHALLENGER' },
    { id: 22, name: 'Austria', flag: '🇦🇹', color: '#ed2939', rating: 75, tier: 'CHALLENGER' },
    { id: 1, name: 'Argentina', flag: '🇦🇷', color: '#75aadb', rating: 91, tier: 'WORLD_CLASS' },
    { id: 7, name: 'Belgium', flag: '🇧🇪', color: '#fdda24', rating: 86, tier: 'ELITE' },
    { id: 4, name: 'Brazil', flag: '🇧🇷', color: '#009739', rating: 89, tier: 'WORLD_CLASS' },
    { id: 29, name: 'Canada', flag: '🇨🇦', color: '#ff0000', rating: 68, tier: 'UNDERDOG' },
    { id: 10, name: 'Colombia', flag: '🇨🇴', color: '#fcd116', rating: 84, tier: 'ELITE' },
    { id: 12, name: 'Croatia', flag: '🇭🇷', color: '#ff0000', rating: 82, tier: 'ELITE' },
    { id: 30, name: "Côte d'Ivoire", flag: '🇨🇮', color: '#f77f00', rating: 67, tier: 'UNDERDOG' },
    { id: 20, name: 'Denmark', flag: '🇩🇰', color: '#c60c30', rating: 77, tier: 'COMPETITIVE' },
    { id: 24, name: 'Ecuador', flag: '🇪🇨', color: '#fcd116', rating: 73, tier: 'CHALLENGER' },
    { id: 23, name: 'Egypt', flag: '🇪🇬', color: '#ce1126', rating: 74, tier: 'CHALLENGER' },
    { id: 3, name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#ced4da', rating: 89, tier: 'WORLD_CLASS' },
    { id: 2, name: 'France', flag: '🇫🇷', color: '#002395', rating: 90, tier: 'WORLD_CLASS' },
    { id: 11, name: 'Germany', flag: '🇩🇪', color: '#dd0000', rating: 83, tier: 'ELITE' },
    { id: 21, name: 'Iran', flag: '🇮🇷', color: '#239f40', rating: 76, tier: 'COMPETITIVE' },
    { id: 14, name: 'Italy', flag: '🇮🇹', color: '#008c45', rating: 81, tier: 'COMPETITIVE' },
    { id: 16, name: 'Japan', flag: '🇯🇵', color: '#bc002d', rating: 79, tier: 'COMPETITIVE' },
    { id: 9, name: 'Mexico', flag: '🇲🇽', color: '#006341', rating: 84, tier: 'ELITE' },
    { id: 5, name: 'Morocco', flag: '🇲🇦', color: '#c1272d', rating: 88, tier: 'WORLD_CLASS' },
    { id: 8, name: 'Netherlands', flag: '🇳🇱', color: '#ff7900', rating: 85, tier: 'ELITE' },
    { id: 25, name: 'Nigeria', flag: '🇳🇬', color: '#008753', rating: 72, tier: 'CHALLENGER' },
    { id: 18, name: 'Norway', flag: '🇳🇴', color: '#ef2b2d', rating: 78, tier: 'COMPETITIVE' },
    { id: 6, name: 'Portugal', flag: '🇵🇹', color: '#006600', rating: 87, tier: 'ELITE' },
    { id: 17, name: 'Senegal', flag: '🇸🇳', color: '#00853e', rating: 78, tier: 'COMPETITIVE' },
    { id: 31, name: 'South Korea', flag: '🇰🇷', color: '#003478', rating: 66, tier: 'UNDERDOG' },
    { id: 0, name: 'Spain', flag: '🇪🇸', color: '#c60b1e', rating: 92, tier: 'WORLD_CLASS' },
    { id: 13, name: 'Switzerland', flag: '🇨🇭', color: '#ff0000', rating: 82, tier: 'ELITE' },
    { id: 26, name: 'Türkiye', flag: '🇹🇷', color: '#e30a17', rating: 71, tier: 'CHALLENGER' },
    { id: 19, name: 'Uruguay', flag: '🇺🇾', color: '#0038a8', rating: 77, tier: 'COMPETITIVE' },
    { id: 15, name: 'USA', flag: '🇺🇸', color: '#002868', rating: 80, tier: 'COMPETITIVE' }
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