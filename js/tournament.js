// ===== PRO STRIKER - tournament.js (COMPLETE FIX) =====
console.log('[ProStriker] tournament.js loaded');

const TournamentManager = {
    format: 32,
    selectedTeamId: null,
    groups: [],
    currentMatchDay: 0,
    groupStageComplete: false,
    knockoutMatches: [],
    currentKnockoutRound: 0,
    champion: null,
    tournamentComplete: false,
    playerEliminated: false,
    matchResults: [],
    isPlayerOut: false,
    groupStageQualified: false,
    lastPlayerMatch: null,

    init(format, selectedTeamId) {
        this.format = format || 32;
        this.selectedTeamId = selectedTeamId;
        this.groups = [];
        this.currentMatchDay = 0;
        this.groupStageComplete = false;
        this.knockoutMatches = [];
        this.currentKnockoutRound = 0;
        this.champion = null;
        this.tournamentComplete = false;
        this.playerEliminated = false;
        this.matchResults = [];
        this.isPlayerOut = false;
        this.groupStageQualified = false;
        this.lastPlayerMatch = null;

        this.generateGroups();
        console.log('[Tournament] Initialized —', this.format, 'teams, selected:', selectedTeamId);
        // A real tournament "starts" only once a team has actually been
        // confirmed (selectedTeamId is non-null here) - the earlier
        // init(format, null) reset call made when the team-select screen
        // first opens must NOT count, or every visit to that screen would
        // inflate the lifetime tournaments-played counter.
        if (selectedTeamId !== null && selectedTeamId !== undefined && typeof Progress !== 'undefined') {
            Progress._data().careerTotals.tournamentsPlayed++;
            Progress.save();
        }
        // save() itself no-ops when selectedTeamId is null (see save() below),
        // so this is harmless for the earlier init(format, null) reset call
        // made when the team-select screen first opens — it only actually
        // persists once a real team has been confirmed.
        this.save();
    },

    generateGroups() {
        const teams = [...TOURNAMENT_TEAMS];
        if (teams.length !== 32) {
            console.error('[Tournament] Expected 32 teams, got', teams.length);
            return;
        }

        let shuffled = this.shuffleArray(teams);
        const playerTeam = TOURNAMENT_TEAMS.find(t => t.id === this.selectedTeamId);
        if (playerTeam) {
            const idx = shuffled.findIndex(t => t.id === this.selectedTeamId);
            if (idx !== -1) {
                // Keep the draw genuinely random: the player's team is moved to
                // a random slot instead of always being forced into Group A.
                const targetSlot = Math.floor(Math.random() * shuffled.length);
                [shuffled[idx], shuffled[targetSlot]] = [shuffled[targetSlot], shuffled[idx]];
            }
        }

        if (shuffled.length !== 32) {
            console.error('[Tournament] Shuffled length is', shuffled.length, '!');
            return;
        }

        this.groups = [];
        for (let i = 0; i < 8; i++) {
            this.groups.push({
                id: i,
                name: String.fromCharCode(65 + i),
                teams: [],
                standings: [],
                matches: [],
                matchDay: 0
            });
        }

        // Distribute evenly: 4 teams per group
        for (let i = 0; i < shuffled.length; i++) {
            const groupIdx = i % 8;
            this.groups[groupIdx].teams.push(shuffled[i]);
        }

        for (let group of this.groups) {
            if (group.teams.length !== 4) {
                console.error('[Tournament] ❌ Group', group.name, 'has', group.teams.length, 'teams!');
            }
            this.generateGroupFixtures(group);
        }

        console.log('[Tournament] ✅ Groups generated successfully');
    },

    generateGroupFixtures(group) {
        const teams = group.teams;
        const fixtures = [
            { teamA: teams[0], teamB: teams[3] },
            { teamA: teams[1], teamB: teams[2] },
            { teamA: teams[0], teamB: teams[2] },
            { teamA: teams[3], teamB: teams[1] },
            { teamA: teams[0], teamB: teams[1] },
            { teamA: teams[2], teamB: teams[3] }
        ];

        const matches = [];
        let matchId = 0;

        for (let i = 0; i < fixtures.length; i++) {
            const pair = fixtures[i];
            const matchDay = Math.floor(i / 2);
            matches.push({
                uid: `g${group.id}_m${matchId}`,
                id: matchId++,
                groupId: group.id,
                teamA: pair.teamA,
                teamB: pair.teamB,
                played: false,
                scoreA: 0,
                scoreB: 0,
                winner: null,
                matchDay: matchDay,
                pending: false,
                isPlayerMatch: false
            });
        }

        group.matches = matches;
        group.matchDay = 0;
        group.standings = teams.map(team => ({
            teamId: team.id,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDiff: 0,
            points: 0
        }));

        console.log('[Tournament] Group', group.name, ':', matches.length, 'fixtures');
    },

    simulateAIMatchesOnCurrentDay() {
        const day = this.currentMatchDay;
        let simulated = 0;

        for (let group of this.groups) {
            for (let match of group.matches) {
                if (match.matchDay !== day) continue;
                if (match.played) continue;
                if (match.isPlayerMatch || match.pending) continue;

                const result = this.simulateMatch(match.teamA, match.teamB);
                match.played = true;
                match.scoreA = result.scoreA;
                match.scoreB = result.scoreB;
                match.winner = result.winner;
                match.pending = false;
                match.isPlayerMatch = false;
                this.matchResults.push(match);
                this.updateGroupStandings(group, match, result);
                simulated++;
            }
        }

        console.log('[Tournament] Simulated', simulated, 'AI matches on day', day);
        return simulated;
    },

    isMatchDayComplete(day) {
        let totalMatches = 0;
        let playedMatches = 0;
        for (let group of this.groups) {
            for (let match of group.matches) {
                if (match.matchDay !== day) continue;
                totalMatches++;
                if (match.played) playedMatches++;
            }
        }
        return playedMatches === totalMatches;
    },

    advanceMatchDayIfComplete() {
        const day = this.currentMatchDay;
        if (!this.isMatchDayComplete(day)) {
            console.log('[Tournament] Day', day + 1, 'not complete yet');
            return false;
        }

        console.log('[Tournament] Day', day + 1, 'COMPLETE!');
        this.currentMatchDay++;

        if (this.currentMatchDay >= 3) {
            this.groupStageComplete = true;
            console.log('[Tournament] Group stage complete!');
            this.finishGroupStage();
        }

        return true;
    },

    simulateMatchDay() {
        if (this.groupStageComplete) {
            console.log('[Tournament] Group stage already complete');
            return false;
        }
        this.simulateAIMatchesOnCurrentDay();
        return this.advanceMatchDayIfComplete();
    },

    markPlayerMatch(matchUid, isGroupMatch, groupId, roundIndex) {
        const { match } = this.findMatch(matchUid, isGroupMatch, groupId, roundIndex);
        if (match) {
            match.isPlayerMatch = true;
            match.pending = true;
            console.log('[Tournament] Marked match as player match:', matchUid);
            return true;
        }
        console.warn('[Tournament] Could not find match to mark:', matchUid);
        return false;
    },

    finishGroupStage() {
        const playerTeamId = this.selectedTeamId;
        let playerGroup = null;

        for (let group of this.groups) {
            if (group.standings.some(s => s.teamId === playerTeamId)) {
                playerGroup = group;
                break;
            }
        }

        if (!playerGroup) {
            this.playerEliminated = true;
            this.isPlayerOut = true;
            console.log('[Tournament] Player not found in any group');
            this.runRemainingTournament();
            return;
        }

        const sorted = [...playerGroup.standings].sort((a, b) => this.compareStandings(playerGroup, a, b));

        const playerRank = sorted.findIndex(s => s.teamId === playerTeamId);
        const qualified = playerRank >= 0 && playerRank < 2;

        if (qualified) {
            this.groupStageQualified = true;
            console.log('[Tournament] Player qualified for knockout (rank:', playerRank + 1, ')');
            this.generateKnockoutStage();
        } else {
            this.playerEliminated = true;
            this.isPlayerOut = true;
            console.log('[Tournament] Player eliminated in group stage (rank:', playerRank + 1, ')');
            this.runRemainingTournament();
        }
    },

    runRemainingTournament() {
        if (this.knockoutMatches.length === 0) {
            this.generateKnockoutStage(true);
        }
        let safety = 0;
        while (!this.tournamentComplete && safety < 20) {
            safety++;
            this.simulateEntireKnockoutRound(this.currentKnockoutRound);
        }
        if (safety >= 20) {
            console.warn('[Tournament] Safety limit reached');
            this.tournamentComplete = true;
        }
    },

    getPlayerNextMatch() {
        const playerTeamId = this.selectedTeamId;
        if (playerTeamId === null || playerTeamId === undefined || this.tournamentComplete || this.isPlayerOut) return null;

        // GROUP STAGE
        if (!this.groupStageComplete) {
            const day = this.currentMatchDay;
            for (let group of this.groups) {
                const match = group.matches.find(m =>
                    m.matchDay === day &&
                    !m.played &&
                    (m.teamA.id === playerTeamId || m.teamB.id === playerTeamId)
                );
                if (match) {
                    return { ...match, type: 'group', groupId: group.id };
                }
            }
            return null;
        }

        // KNOCKOUT STAGE
        if (this.groupStageQualified && !this.tournamentComplete && !this.isPlayerOut) {
            for (let roundIdx = this.currentKnockoutRound; roundIdx < this.knockoutMatches.length; roundIdx++) {
                const round = this.knockoutMatches[roundIdx];
                for (let match of round.matches) {
                    if (!match.teamA || !match.teamB || match.played) continue;
                    const isPlayer = match.teamA.id === playerTeamId || match.teamB.id === playerTeamId;
                    if (isPlayer) {
                        return { ...match, type: 'knockout', roundIndex: roundIdx };
                    }
                }
            }
        }

        return null;
    },

    prepareKnockoutRound() {
        if (this.tournamentComplete || this.isPlayerOut) return;
        const roundData = this.knockoutMatches[this.currentKnockoutRound];
        if (!roundData) return;

        const playerTeamId = this.selectedTeamId;

        let hasPlayerMatch = false;
        for (let match of roundData.matches) {
            if (!match.teamA || !match.teamB || match.played) continue;
            if (match.teamA.id === playerTeamId || match.teamB.id === playerTeamId) {
                hasPlayerMatch = true;
                break;
            }
        }

        if (hasPlayerMatch) {
            for (let match of roundData.matches) {
                if (match.played || !match.teamA || !match.teamB) continue;
                const isPlayerMatch = match.teamA.id === playerTeamId || match.teamB.id === playerTeamId;
                if (isPlayerMatch) {
                    match.isPlayerMatch = true;
                    match.pending = true;
                }
            }
            console.log('[Tournament] Knockout round has player match pending');
            return;
        }

        for (let match of roundData.matches) {
            if (match.played || !match.teamA || !match.teamB) continue;
            const result = this.simulateKnockoutMatch(match.teamA, match.teamB);
            match.played = true;
            match.scoreA = result.scoreA;
            match.scoreB = result.scoreB;
            match.winner = result.winner;
            match.extraTime = result.extraTime;
            match.pending = false;
            match.isPlayerMatch = false;
            this.matchResults.push(match);
        }

        if (this.currentKnockoutRound === 3) {
            const finalMatch = roundData.matches[0];
            if (finalMatch && finalMatch.winner) {
                this.champion = finalMatch.winner;
                this.tournamentComplete = true;
                console.log('[Tournament] Champion:', this.champion.name);
            }
        }
    },

    completeKnockoutRoundAfterPlayer(roundIndex) {
        const roundData = this.knockoutMatches[roundIndex];
        if (!roundData) return;

        for (let match of roundData.matches) {
            if (match.played || !match.teamA || !match.teamB) continue;
            if (match.isPlayerMatch || match.pending) continue;

            const result = this.simulateKnockoutMatch(match.teamA, match.teamB);
            match.played = true;
            match.scoreA = result.scoreA;
            match.scoreB = result.scoreB;
            match.winner = result.winner;
            match.extraTime = result.extraTime;
            match.pending = false;
            this.matchResults.push(match);
        }

        const allPlayed = roundData.matches.every(m => !m.teamA || !m.teamB || m.played);
        if (!allPlayed) {
            console.log('[Tournament] Not all matches played in round', roundIndex);
            return;
        }

        console.log('[Tournament] Round', roundIndex + 1, 'complete!');

        if (roundIndex === 3) {
            const finalMatch = roundData.matches[0];
            if (finalMatch && finalMatch.winner) {
                this.champion = finalMatch.winner;
                this.tournamentComplete = true;
                console.log('[Tournament] Champion:', this.champion.name);
            }
            return;
        }

        this.advanceKnockoutWinners(roundIndex);
        this.currentKnockoutRound = roundIndex + 1;
        console.log('[Tournament] Advanced to round', this.currentKnockoutRound + 1);

        this.prepareKnockoutRound();
    },

    simulateKnockoutRound() {
        this.prepareKnockoutRound();
    },

    simulateEntireKnockoutRound(roundIndex) {
        const roundData = this.knockoutMatches[roundIndex];
        if (!roundData) {
            this.tournamentComplete = true;
            return;
        }

        for (let match of roundData.matches) {
            if (match.played || !match.teamA || !match.teamB) continue;
            const result = this.simulateKnockoutMatch(match.teamA, match.teamB);
            match.played = true;
            match.scoreA = result.scoreA;
            match.scoreB = result.scoreB;
            match.winner = result.winner;
            match.extraTime = result.extraTime;
            match.pending = false;
            match.isPlayerMatch = false;
            this.matchResults.push(match);
        }

        const finalMatch = roundData.matches[0];
        if (roundIndex === 3 && finalMatch && finalMatch.winner) {
            this.champion = finalMatch.winner;
            this.tournamentComplete = true;
            console.log('[Tournament] Champion:', this.champion.name);
            return;
        }

        if (roundIndex < 3) {
            this.advanceKnockoutWinners(roundIndex);
            this.currentKnockoutRound = roundIndex + 1;
        }
    },

    simulateMatch(teamA, teamB) {
        const tierA = getTeamTier(teamA);
        const tierB = getTeamTier(teamB);
        const probs = getMatchProbabilities(tierA, tierB);
        const roll = Math.random() * 100;

        let result;
        if (roll < probs.win) result = 'win';
        else if (roll < probs.win + probs.draw) result = 'draw';
        else result = 'loss';

        let winner = null;
        if (result === 'win') winner = teamA;
        else if (result === 'loss') winner = teamB;

        const scores = this.generateScore(teamA, teamB, result);
        return { teamA, teamB, scoreA: scores.scoreA, scoreB: scores.scoreB, winner, result };
    },

    simulateKnockoutMatch(teamA, teamB) {
        let result = this.simulateMatch(teamA, teamB);
        let extraTime = false;

        if (result.winner === null) {
            result.winner = Math.random() < 0.5 ? teamA : teamB;
            if (result.winner === teamA) {
                result.scoreA = result.scoreB + 1;
            } else {
                result.scoreB = result.scoreA + 1;
            }
            extraTime = true;
        }

        return { ...result, extraTime };
    },

    generateScore(teamA, teamB, result) {
        const ratingA = teamA.rating;
        const ratingB = teamB.rating;
        const baseGoals = 1 + Math.floor(Math.random() * 2);
        let scoreA, scoreB;

        if (result === 'win') {
            const margin = Math.floor(Math.random() * 2) + 1;
            scoreA = baseGoals + Math.floor(Math.random() * 2);
            scoreB = Math.max(0, scoreA - margin);
        } else if (result === 'loss') {
            const margin = Math.floor(Math.random() * 2) + 1;
            scoreB = baseGoals + Math.floor(Math.random() * 2);
            scoreA = Math.max(0, scoreB - margin);
        } else {
            scoreA = baseGoals;
            scoreB = baseGoals;
        }

        const ratingDiff = Math.floor((ratingA - ratingB) / 20);
        if (ratingDiff > 0) scoreA += Math.floor(Math.random() * ratingDiff);
        else if (ratingDiff < 0) scoreB += Math.floor(Math.random() * Math.abs(ratingDiff));

        scoreA = Math.max(0, Math.min(5, scoreA));
        scoreB = Math.max(0, Math.min(5, scoreB));
        // SAFETY: the rating bonuses above must never flip the rolled result
        // (a "win" for A shown as B ahead, or a draw that isn't level).
        if (result === 'win' && scoreA <= scoreB) scoreB = Math.max(0, scoreA - 1);
        else if (result === 'loss' && scoreB <= scoreA) scoreA = Math.max(0, scoreB - 1);
        else if (result === 'draw') { const m = Math.min(scoreA, scoreB); scoreA = m; scoreB = m; }
        return { scoreA, scoreB };
    },

    updateGroupStandings(group, match, result) {
        const teamAStats = group.standings.find(s => s.teamId === match.teamA.id);
        const teamBStats = group.standings.find(s => s.teamId === match.teamB.id);
        if (!teamAStats || !teamBStats) return;

        const goalsA = result.scoreA;
        const goalsB = result.scoreB;

        teamAStats.played++;
        teamAStats.goalsFor += goalsA;
        teamAStats.goalsAgainst += goalsB;
        teamAStats.goalDiff = teamAStats.goalsFor - teamAStats.goalsAgainst;
        if (result.winner === match.teamA) {
            teamAStats.wins++;
            teamAStats.points += 3;
        } else if (result.winner === null) {
            teamAStats.draws++;
            teamAStats.points += 1;
        } else {
            teamAStats.losses++;
        }

        teamBStats.played++;
        teamBStats.goalsFor += goalsB;
        teamBStats.goalsAgainst += goalsA;
        teamBStats.goalDiff = teamBStats.goalsFor - teamBStats.goalsAgainst;
        if (result.winner === match.teamB) {
            teamBStats.wins++;
            teamBStats.points += 3;
        } else if (result.winner === null) {
            teamBStats.draws++;
            teamBStats.points += 1;
        } else {
            teamBStats.losses++;
        }

        this.sortStandings(group);
    },

    compareStandings(group, a, b) {
        if (a.points !== b.points) return b.points - a.points;
        if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
        if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;

        // For a direct two-team tie, use the result between those two teams
        // before falling back to a deterministic ID. For three-way ties, keep
        // the deterministic fallback rather than inventing an unsafe partial
        // head-to-head calculation that could create non-transitive sorting.
        const tied = group.standings.filter(s => s.points === a.points && s.goalDiff === a.goalDiff && s.goalsFor === a.goalsFor);
        if (tied.length === 2) {
            const h2h = group.matches.find(m => m.played &&
                ((m.teamA.id === a.teamId && m.teamB.id === b.teamId) ||
                 (m.teamA.id === b.teamId && m.teamB.id === a.teamId)));
            if (h2h) {
                const aGoals = h2h.teamA.id === a.teamId ? h2h.scoreA : h2h.scoreB;
                const bGoals = h2h.teamA.id === b.teamId ? h2h.scoreA : h2h.scoreB;
                if (aGoals !== bGoals) return bGoals - aGoals;
            }
        }
        return a.teamId - b.teamId;
    },

    sortStandings(group) {
        group.standings.sort((a, b) => this.compareStandings(group, a, b));
    },

    findMatch(uid, isGroupMatch, groupId, roundIndex) {
        if (isGroupMatch) {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) return { match: null, group: null };
            const match = group.matches.find(m => m.uid === uid || m.id === uid);
            return { match, group };
        }

        const round = this.knockoutMatches[roundIndex];
        if (!round) return { match: null, group: null };
        const match = round.matches.find(m => m.uid === uid || m.id === uid);
        return { match, group: null };
    },

    // ===== FIXED: Knockout generation =====
    generateKnockoutStage(skipPlayerCheck) {
        const groupWinners = [];
        const groupRunners = [];
        for (let group of this.groups) {
            const standings = group.standings;
            if (standings.length >= 2) {
                const winner = TOURNAMENT_TEAMS.find(t => t.id === standings[0].teamId);
                const runner = TOURNAMENT_TEAMS.find(t => t.id === standings[1].teamId);
                if (winner) groupWinners.push(winner);
                if (runner) groupRunners.push(runner);
            }
        }

        // Ensure we have exactly 8 winners and 8 runners
        while (groupWinners.length < 8) {
            console.warn('[Tournament] Missing group winner, adding fallback');
            groupWinners.push({ id: -1, name: 'TBD', flag: '❓', color: '#666', rating: 0, tier: 'UNDERDOG' });
        }
        while (groupRunners.length < 8) {
            console.warn('[Tournament] Missing group runner, adding fallback');
            groupRunners.push({ id: -1, name: 'TBD', flag: '❓', color: '#666', rating: 0, tier: 'UNDERDOG' });
        }

        // Standard knockout pairing: Winner A vs Runner B, Winner C vs Runner D, etc.
       // But the correct World Cup style is: 1st vs 2nd from adjacent groups
        const pairs = [
            { teamA: groupWinners[0], teamB: groupRunners[1] }, // W_A vs R_B
            { teamA: groupWinners[2], teamB: groupRunners[3] }, // W_C vs R_D
            { teamA: groupWinners[4], teamB: groupRunners[5] }, // W_E vs R_F
            { teamA: groupWinners[6], teamB: groupRunners[7] }, // W_G vs R_H
            { teamA: groupWinners[1], teamB: groupRunners[0] }, // W_B vs R_A
            { teamA: groupWinners[3], teamB: groupRunners[2] }, // W_D vs R_C
            { teamA: groupWinners[5], teamB: groupRunners[4] }, // W_F vs R_E
            { teamA: groupWinners[7], teamB: groupRunners[6] }  // W_H vs R_G
        ];

        // Filter out pairs with null teams
        const validPairs = pairs.filter(p => p.teamA && p.teamB && p.teamA.id !== -1 && p.teamB.id !== -1);

        if (validPairs.length < 8) {
            console.warn('[Tournament] Only', validPairs.length, 'valid pairs, filling with fallbacks');
            // Fill remaining with fallbacks
            while (validPairs.length < 8) {
                validPairs.push({
                    teamA: { id: -1, name: 'TBD', flag: '❓', color: '#666', rating: 0, tier: 'UNDERDOG' },
                    teamB: { id: -2, name: 'TBD', flag: '❓', color: '#666', rating: 0, tier: 'UNDERDOG' }
                });
            }
        }

        // Check if player qualified
        if (!skipPlayerCheck) {
            const playerQualified = validPairs.some(p => 
                (p.teamA && p.teamA.id === this.selectedTeamId) || 
                (p.teamB && p.teamB.id === this.selectedTeamId)
            );
            if (!playerQualified) {
                this.isPlayerOut = true;
                this.playerEliminated = true;
                console.log('[Tournament] Player not in knockout pairs');
                return;
            }
        }

        const firstRound = validPairs.map((pair, idx) => ({
            uid: `k0_m${idx}`,
            id: idx,
            roundIndex: 0,
            teamA: pair.teamA,
            teamB: pair.teamB,
            played: false,
            scoreA: 0,
            scoreB: 0,
            winner: null,
            extraTime: false,
            pending: false,
            isPlayerMatch: false
        }));

        this.knockoutMatches = [
            { round: 0, name: 'Round of 16', matches: firstRound },
            { round: 1, name: 'Quarter-Finals', matches: [] },
            { round: 2, name: 'Semi-Finals', matches: [] },
            { round: 3, name: 'Final', matches: [] }
        ];
        this.currentKnockoutRound = 0;

        console.log('[Tournament] Knockout stage generated with', firstRound.length, 'matches');
        this.prepareKnockoutRound();
    },

    advanceKnockoutWinners(roundIndex) {
        const currentRound = this.knockoutMatches[roundIndex];
        const nextRound = this.knockoutMatches[roundIndex + 1];
        if (!currentRound || !nextRound) return;

        const winners = currentRound.matches.map(m => (m.played && m.winner) ? m.winner : null);
        const pairs = [];
        for (let i = 0; i < winners.length; i += 2) {
            const teamA = winners[i];
            const teamB = winners[i + 1];
            if (teamA && teamB && teamA.id !== -1 && teamB.id !== -1) {
                pairs.push({ teamA, teamB });
            } else if (teamA && teamA.id !== -1) {
                // If only teamA exists, it advances by default
                console.warn('[Tournament] Only one winner –', teamA.name, 'advances');
                pairs.push({ teamA, teamB: null });
            } else if (teamB && teamB.id !== -1) {
                console.warn('[Tournament] Only one winner –', teamB.name, 'advances');
                pairs.push({ teamA: teamB, teamB: null });
            } else {
                pairs.push({ teamA: null, teamB: null });
            }
        }

        // Filter out pairs with no valid teams
        const validPairs = pairs.filter(p => p.teamA && p.teamA.id !== -1);

        // If no valid pairs, add fallback
        if (validPairs.length === 0) {
            validPairs.push({
                teamA: { id: -1, name: 'TBD', flag: '❓', color: '#666', rating: 0, tier: 'UNDERDOG' },
                teamB: { id: -2, name: 'TBD', flag: '❓', color: '#666', rating: 0, tier: 'UNDERDOG' }
            });
        }

        nextRound.matches = validPairs.map((pair, idx) => ({
            uid: `k${roundIndex + 1}_m${idx}`,
            id: idx,
            roundIndex: roundIndex + 1,
            teamA: pair.teamA,
            teamB: pair.teamB || null,
            played: false,
            scoreA: 0,
            scoreB: 0,
            winner: null,
            extraTime: false,
            pending: false,
            isPlayerMatch: false
        }));

        console.log('[Tournament] Advanced to round', roundIndex + 2, 'with', nextRound.matches.length, 'matches');
    },

    resolveKnockoutTieBreak(match, teamAScore, teamBScore) {
        if (teamAScore !== teamBScore) {
            return { teamAScore, teamBScore, winner: teamAScore > teamBScore ? match.teamA : match.teamB };
        }
        const winner = Math.random() < 0.5 ? match.teamA : match.teamB;
        if (winner === match.teamA) {
            return { teamAScore: teamAScore + 1, teamBScore, winner: match.teamA };
        }
        return { teamAScore, teamBScore: teamBScore + 1, winner: match.teamB };
    },

    recordPlayerMatchResult(matchUid, teamAScore, teamBScore, isGroupMatch, groupId, roundIndex) {
        console.log('[Tournament] Recording:', matchUid, teamAScore, '-', teamBScore);

        const { match, group } = this.findMatch(matchUid, isGroupMatch, groupId, roundIndex);
        if (!match) {
            console.error('[Tournament] Match not found:', matchUid);
            return;
        }

        const alreadyRecorded = this.matchResults.some(result => result && result.uid === match.uid);
        const sameResultAlreadyRecorded = match.played && match.scoreA === teamAScore && match.scoreB === teamBScore;
        if (alreadyRecorded || sameResultAlreadyRecorded) {
            console.warn('[Tournament] Ignoring duplicate result for match:', matchUid);
            return;
        }

        if (!isGroupMatch && teamAScore === teamBScore) {
            const penaltyWinnerId = match.tournamentState && match.tournamentState.penaltyWinnerTeamId;
            if (penaltyWinnerId) {
                match.winner = penaltyWinnerId === match.teamA.id ? match.teamA : match.teamB;
            } else {
                const resolved = this.resolveKnockoutTieBreak(match, teamAScore, teamBScore);
                teamAScore = resolved.teamAScore;
                teamBScore = resolved.teamBScore;
                match.winner = resolved.winner;
            }
        }

        match.played = true;
        match.scoreA = teamAScore;
        match.scoreB = teamBScore;
        match.winner = match.winner || ((teamAScore > teamBScore) ? match.teamA : (teamBScore > teamAScore) ? match.teamB : null);
        match.pending = false;
        match.isPlayerMatch = false;
        this.lastPlayerMatch = match;
        this.matchResults.push(match);

        console.log('[Tournament] Result:', match.teamA.name, match.scoreA, '-', match.scoreB, match.teamB.name);

        if (isGroupMatch && group) {
            this.updateGroupStandings(group, match, {
                teamA: match.teamA,
                teamB: match.teamB,
                scoreA: match.scoreA,
                scoreB: match.scoreB,
                winner: match.winner
            });

            this.simulateAIMatchesOnCurrentDay();
            this.advanceMatchDayIfComplete();
            this.save();
            return;
        }

        const round = roundIndex !== undefined && roundIndex !== null
            ? roundIndex
            : this.currentKnockoutRound;

        const playerTeamId = this.selectedTeamId;
        const playerWon = match.winner && match.winner.id === playerTeamId;
        const playerLost = match.winner && match.winner.id !== playerTeamId;

        if (playerLost) {
            this.isPlayerOut = true;
            this.playerEliminated = true;
            console.log('[Tournament] Player eliminated in knockout');
            this.completeKnockoutRoundAfterPlayer(round);
            this.runRemainingTournament();
            this.save();
            return;
        }

        if (playerWon && round === 3) {
            this.champion = match.winner;
            this.tournamentComplete = true;
            console.log('[Tournament] Player is CHAMPION!');
            this.save();
            return;
        }

        this.completeKnockoutRoundAfterPlayer(round);
        this.save();
    },

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    getProgress() {
        if (this.tournamentComplete) return 100;
        const totalGroupMatches = this.groups.reduce((sum, group) => sum + (Array.isArray(group.matches) ? group.matches.length : 0), 0);
        const playedGroupMatches = this.groups.reduce((sum, group) => sum + (Array.isArray(group.matches) ? group.matches.filter(match => match.played).length : 0), 0);
        const totalKnockoutMatches = this.knockoutMatches.reduce((sum, round) => sum + (Array.isArray(round.matches) ? round.matches.length : 0), 0);
        const playedKnockoutMatches = this.knockoutMatches.reduce((sum, round) => sum + (Array.isArray(round.matches) ? round.matches.filter(match => match.played).length : 0), 0);

        const safeGroupTotal = Math.max(1, totalGroupMatches || 48);
        const safeKnockoutTotal = Math.max(1, totalKnockoutMatches || 30);

        const groupProgress = this.groupStageComplete ? 50 : (playedGroupMatches / safeGroupTotal) * 50;
        const knockoutProgress = this.groupStageComplete ? (playedKnockoutMatches / safeKnockoutTotal) * 50 : 0;
        const progress = groupProgress + knockoutProgress;

        return Math.min(100, Math.max(0, progress));
    },

    getGroupStandings(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return null;
        return group.standings.map(entry => {
            const team = TOURNAMENT_TEAMS.find(t => t.id === entry.teamId);
            if (!team) {
                return { ...entry, team: { id: entry.teamId, name: 'Unknown', flag: '❓', color: '#666', rating: 0, tier: 'UNDERDOG' } };
            }
            return { ...entry, team };
        });
    },

    getBracketStatus() {
        return this.knockoutMatches.map((round, idx) => ({
            round: idx,
            name: round.name,
            matches: round.matches.map(m => ({
                uid: m.uid,
                teamA: m.teamA ? { ...m.teamA } : null,
                teamB: m.teamB ? { ...m.teamB } : null,
                scoreA: m.scoreA,
                scoreB: m.scoreB,
                played: m.played,
                winner: m.winner ? { ...m.winner } : null,
                pending: m.pending || false,
                extraTime: m.extraTime || false
            }))
        }));
    },

    getAllGroupStandings() {
        return this.groups.map(group => ({
            name: group.name,
            standings: this.getGroupStandings(group.id)
        }));
    },

    getPlayerTeam() {
        return TOURNAMENT_TEAMS.find(t => t.id === this.selectedTeamId);
    },

    hasPendingMatch() {
        return this.getPlayerNextMatch() !== null;
    },

    isPlayerEliminated() {
        return this.playerEliminated;
    },

    isComplete() {
        return this.tournamentComplete;
    },

    didPlayerQualify() {
        return this.groupStageQualified;
    },

    getChampionName() {
        return this.champion ? this.champion.name : 'Unknown';
    },

    getChampionFlag() {
        return this.champion ? this.champion.flag : '🏆';
    },

    getLastPlayerMatch() {
        return this.lastPlayerMatch;
    },

    getKnockoutRoundName(roundIndex) {
        const names = ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'];
        return names[roundIndex] || 'Unknown';
    }
};

// ===== TOURNAMENT PROGRESS SAVE (localStorage) =====
// Lets a player close mid-tournament and pick up exactly where they left
// off next time. A tournament only counts as "resumable" while it's still
// genuinely in progress: not yet finished (tournamentComplete false) and a
// real team has actually been confirmed (selectedTeamId set). Once the
// player wins the Cup, or the bracket finishes simulating out a defeat,
// tournamentComplete flips true and the save simply stops being resumable —
// the menu falls back to "New Tournament" on its own, no separate clearing
// needed.
const TOURNAMENT_SAVE_KEY = 'prostriker_tournament_v1';

TournamentManager.save = function() {
    if (this.selectedTeamId === null || this.selectedTeamId === undefined) return;
    try {
        const state = {
            format: this.format,
            selectedTeamId: this.selectedTeamId,
            groups: this.groups,
            currentMatchDay: this.currentMatchDay,
            groupStageComplete: this.groupStageComplete,
            knockoutMatches: this.knockoutMatches,
            currentKnockoutRound: this.currentKnockoutRound,
            champion: this.champion,
            tournamentComplete: this.tournamentComplete,
            playerEliminated: this.playerEliminated,
            matchResults: this.matchResults,
            isPlayerOut: this.isPlayerOut,
            groupStageQualified: this.groupStageQualified,
            lastPlayerMatch: this.lastPlayerMatch
        };
        CloudSync.setItem(TOURNAMENT_SAVE_KEY, JSON.stringify(state));
    } catch (e) {
        console.debug('[Tournament] Could not save progress:', e);
    }
};

// A save is only usable if it has the full shape the tournament screens read.
// Anything else (older game version, hand-edited, truncated, another game on the
// same origin) is treated as "no save" instead of being loaded and crashing the
// group/bracket screens.
TournamentManager._isValidSave = function(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.tournamentComplete !== false) return false;
    if (data.selectedTeamId === null || data.selectedTeamId === undefined) return false;
    if (!Array.isArray(data.groups) || data.groups.length !== 8) return false;
    for (const g of data.groups) {
        if (!g || !Array.isArray(g.teams) || g.teams.length !== 4) return false;
        if (!Array.isArray(g.matches) || !Array.isArray(g.standings)) return false;
    }
    if (!Array.isArray(data.knockoutMatches)) return false;
    if (typeof TOURNAMENT_TEAMS !== 'undefined' && !TOURNAMENT_TEAMS.some(t => t.id === data.selectedTeamId)) return false;
    return true;
};

TournamentManager.hasResumableSave = function() {
    try {
        const raw = CloudSync.getItem(TOURNAMENT_SAVE_KEY);
        if (!raw) return false;
        return this._isValidSave(JSON.parse(raw));
    } catch (e) {
        return false;
    }
};

TournamentManager.resume = function() {
    try {
        const raw = CloudSync.getItem(TOURNAMENT_SAVE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!this._isValidSave(data)) {
            console.warn('[Tournament] Saved tournament is missing or incompatible - ignoring it.');
            if (data && data.tournamentComplete === false) this.clearSave();
            return false;
        }
        Object.assign(this, data);
        console.log('[Tournament] Resumed saved tournament for', this.getPlayerTeam() ? this.getPlayerTeam().name : 'unknown team');
        return true;
    } catch (e) {
        console.debug('[Tournament] Could not resume saved tournament:', e);
        return false;
    }
};

TournamentManager.clearSave = function() {
    try { CloudSync.removeItem(TOURNAMENT_SAVE_KEY); } catch (e) {}
};