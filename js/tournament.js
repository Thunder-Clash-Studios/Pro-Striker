// ===== PRO STRIKER - tournament.js (REPLACED) =====
console.log('[ProStriker] tournament.js loaded (FIXED)');

const TournamentManager = {
    format: 32,
    selectedTeamId: null,
    groups: [],
    currentMatchDay: 0,
    groupStageComplete: false,
    knockoutMatches: [],          // Array of rounds: [{ round, name, matches: [...] }]
    currentKnockoutRound: 0,      // index into knockoutMatches
    champion: null,
    tournamentComplete: false,
    playerEliminated: false,
    matchResults: [],
    isPlayerOut: false,
    groupStageQualified: false,
    _matchIdCounter: 0,           // global unique ID for all matches

    // ----- Initialisation -----
    init(format, selectedTeamId) {
        this.format = format;
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
        this._matchIdCounter = 0;

        this.generateGroups();
        console.log('[Tournament] Initialized with', format, 'teams, selected team:', selectedTeamId);
    },

    // ----- Group generation (unchanged, but uses global ID) -----
    generateGroups() {
        const teams = this.getTeamsForFormat();
        if (teams.length !== this.format) {
            console.error('[Tournament] Not enough teams for format', this.format);
            return;
        }

        const shuffled = this.shuffleArray(teams);
        const playerTeam = TOURNAMENT_TEAMS.find(t => t.id === this.selectedTeamId);
        if (playerTeam) {
            const index = shuffled.findIndex(t => t.id === this.selectedTeamId);
            if (index !== -1) shuffled.splice(index, 1);
            shuffled.unshift(playerTeam);
        }

        this.groups = [];
        for (let i = 0; i < 8; i++) {
            this.groups.push({
                id: i,
                name: String.fromCharCode(65 + i),
                teams: [],
                standings: [],
                matches: [],
                matchDay: 0,
                playerMatchDays: []
            });
        }

        const top8 = shuffled.slice(0, 8);
        const rest = shuffled.slice(8);
        for (let i = 0; i < 8; i++) this.groups[i].teams.push(top8[i]);
        let groupIndex = 0;
        for (let team of rest) {
            this.groups[groupIndex % 8].teams.push(team);
            groupIndex++;
        }

        for (let group of this.groups) {
            this.generateGroupFixtures(group);
        }
        console.log('[Tournament] Groups generated');
    },

    getTeamsForFormat() {
        let teams = [...TOURNAMENT_TEAMS];
        if (this.format === 16) return teams.slice(0, 16);
        else if (this.format === 8) return teams.filter(t => t.tier === 'WORLD_CLASS').slice(0, 8);
        else return teams;
    },

    generateGroupFixtures(group) {
        const teams = group.teams;
        const n = teams.length;
        const matches = [];
        const pairings = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                pairings.push({ teamA: teams[i], teamB: teams[j] });
            }
        }
        // Distribute pairings over 3 match days
        const matchesPerDay = 2;
        let day = 0, dayCount = 0;
        for (let pair of pairings) {
            matches.push({
                id: this._matchIdCounter++,   // global unique
                groupId: group.id,
                teamA: pair.teamA,
                teamB: pair.teamB,
                played: false,
                scoreA: 0,
                scoreB: 0,
                winner: null,
                matchDay: day,
                pending: false,
                isPlayerMatch: false
            });
            dayCount++;
            if (dayCount >= matchesPerDay) { day++; dayCount = 0; }
        }
        // Ensure last match day is 2 (so exactly 3 days)
        if (matches.length > 0 && matches[matches.length-1].matchDay > 2) {
            matches[matches.length-1].matchDay = 2;
        }

        group.matches = matches;
        group.matchDay = 0;
        group.playerMatchDays = [];
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
        console.log('[Tournament] Group fixtures generated:', matches.length, 'matches for group', group.name);
    },

    // ----- Group stage simulation (synchronised) -----
    simulateMatchDay() {
        if (this.groupStageComplete) return;
        const playerTeamId = this.selectedTeamId;
        const day = this.currentMatchDay;

        console.log('[Tournament] Simulating Match Day', day);

        for (let group of this.groups) {
            const dayMatches = group.matches.filter(m => m.matchDay === day && !m.played);
            for (let match of dayMatches) {
                const isPlayerMatch = (match.teamA.id === playerTeamId || match.teamB.id === playerTeamId);
                if (isPlayerMatch) {
                    // Player's match – mark pending, do not simulate
                    if (!group.playerMatchDays.includes(day)) {
                        match.isPlayerMatch = true;
                        match.pending = true;
                        group.playerMatchDays.push(day);
                    }
                } else {
                    // AI vs AI – simulate immediately
                    const result = this.simulateMatch(match.teamA, match.teamB);
                    match.played = true;
                    match.scoreA = result.scoreA;
                    match.scoreB = result.scoreB;
                    match.winner = result.winner;
                    match.isPlayerMatch = false;
                    match.pending = false;
                    this.matchResults.push({ ...match });
                    this.updateGroupStandings(group, match, result);
                }
            }
        }
        // NOTE: The day is NOT advanced here – it waits for the player to play.
        // After player plays, they will call completeMatchDay().
    },

    // Called after player's match is recorded
    completeMatchDay() {
        if (this.groupStageComplete) return;

        const day = this.currentMatchDay;
        // Check if ALL matches on this day are played (including player's)
        let allPlayed = true;
        for (let group of this.groups) {
            const dayMatches = group.matches.filter(m => m.matchDay === day);
            for (let m of dayMatches) {
                if (!m.played) {
                    allPlayed = false;
                    break;
                }
            }
            if (!allPlayed) break;
        }

        if (allPlayed) {
            console.log('[Tournament] Match Day', day, 'COMPLETE!');
            this.currentMatchDay++;
            if (this.currentMatchDay >= 3) {
                this.groupStageComplete = true;
                console.log('[Tournament] 🎉 Group stage complete!');
                this.checkGroupStageQualification();
                return true; // group stage finished
            }
            return true; // day advanced
        }
        return false; // not all played yet
    },

    // ----- Group stage qualification -----
    checkGroupStageQualification() {
        const playerTeamId = this.selectedTeamId;
        let playerGroup = null;
        let playerStanding = null;
        for (let group of this.groups) {
            const standing = group.standings.find(s => s.teamId === playerTeamId);
            if (standing) {
                playerGroup = group;
                playerStanding = standing;
                break;
            }
        }
        if (!playerGroup || !playerStanding) {
            this.playerEliminated = true;
            this.isPlayerOut = true;
            this.tournamentComplete = true;
            console.log('[Tournament] Player not found in standings');
            return;
        }

        // Sort standings to see if player is top 2
        const sortedStandings = [...playerGroup.standings].sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points;
            if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
            if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
            return 0;
        });
        const playerRank = sortedStandings.findIndex(s => s.teamId === playerTeamId);
        const qualified = playerRank >= 0 && playerRank < 2;

        if (qualified) {
            this.groupStageQualified = true;
            console.log('[Tournament] ✅ Player QUALIFIED for knockout!');
            this.generateKnockoutStage();
        } else {
            this.playerEliminated = true;
            this.isPlayerOut = true;
            this.tournamentComplete = true;
            console.log('[Tournament] ❌ Player ELIMINATED in group stage');
            // Simulate full tournament to find champion
            this.simulateFullTournament();
        }
    },

    // ----- Knockout generation (pre‑build all rounds) -----
    generateKnockoutStage() {
        // Collect top 2 from each group
        const qualified = [];
        for (let group of this.groups) {
            const standings = group.standings;
            const top2 = standings.slice(0, 2);
            for (let entry of top2) {
                const team = TOURNAMENT_TEAMS.find(t => t.id === entry.teamId);
                if (team) qualified.push(team);
            }
        }
        // Ensure player is in there (should be)
        if (!qualified.some(t => t.id === this.selectedTeamId)) {
            this.playerEliminated = true;
            this.isPlayerOut = true;
            this.tournamentComplete = true;
            console.log('[Tournament] Player not in knockout – eliminated');
            this.simulateFullTournament();
            return;
        }

        // Pairings: group winners vs runners-up (standard World Cup)
        const groupWinners = [];
        const groupRunners = [];
        for (let group of this.groups) {
            const st = group.standings;
            if (st.length >= 2) {
                const w = TOURNAMENT_TEAMS.find(t => t.id === st[0].teamId);
                const r = TOURNAMENT_TEAMS.find(t => t.id === st[1].teamId);
                if (w) groupWinners.push(w);
                if (r) groupRunners.push(r);
            }
        }
        // Standard pairing: A1-B2, C1-D2, etc.
        // We'll use a fixed pattern: winner[i] vs runner[(i+1)%8] for variety
        const pairs = [];
        for (let i = 0; i < 8; i++) {
            const a = groupWinners[i];
            const b = groupRunners[(i + 1) % 8];
            if (a && b) pairs.push({ teamA: a, teamB: b });
            else pairs.push({ teamA: groupWinners[i], teamB: groupRunners[i] });
        }

        // Build all rounds with empty matches initially
        this.knockoutMatches = [
            { round: 0, name: 'Round of 16', matches: [] },
            { round: 1, name: 'Quarter-Finals', matches: [] },
            { round: 2, name: 'Semi-Finals', matches: [] },
            { round: 3, name: 'Final', matches: [] }
        ];

        // Fill Round of 16
        for (let pair of pairs) {
            this.knockoutMatches[0].matches.push({
                id: this._matchIdCounter++,
                teamA: pair.teamA,
                teamB: pair.teamB,
                played: false,
                scoreA: 0,
                scoreB: 0,
                winner: null,
                pending: false,
                isPlayerMatch: false,
                extraTime: false
            });
        }

        // Subsequent rounds will be filled dynamically as winners are determined
        // (they start empty)
        this.currentKnockoutRound = 0;
        this.groupStageQualified = true;
        console.log('[Tournament] Knockout stage generated');
    },

    // ----- Simulate a match (AI vs AI) -----
    simulateMatch(teamA, teamB) {
        const tierA = teamA.tier;
        const tierB = teamB.tier;
        const probs = getMatchProbabilities(tierA, tierB);
        const roll = Math.random() * 100;
        let result;
        if (roll < probs.win) result = 'win';
        else if (roll < probs.win + probs.draw) result = 'draw';
        else result = 'loss';

        let winner = null;
        if (result === 'win') winner = teamA;
        else if (result === 'loss') winner = teamB;
        else winner = null;

        const scores = this.generateScore(teamA, teamB, result);
        return { teamA, teamB, scoreA: scores.scoreA, scoreB: scores.scoreB, winner, result };
    },

    generateScore(teamA, teamB, result) {
        // simplified – as before
        const ratingA = teamA.rating || 50;
        const ratingB = teamB.rating || 50;
        let scoreA, scoreB;
        if (result === 'win') {
            const margin = 1 + Math.floor(Math.random() * 2);
            scoreA = 1 + Math.floor(Math.random() * 2);
            scoreB = Math.max(0, scoreA - margin);
        } else if (result === 'loss') {
            const margin = 1 + Math.floor(Math.random() * 2);
            scoreB = 1 + Math.floor(Math.random() * 2);
            scoreA = Math.max(0, scoreB - margin);
        } else {
            scoreA = 1 + Math.floor(Math.random() * 1);
            scoreB = scoreA;
        }
        // Add rating influence
        const diff = Math.floor((ratingA - ratingB) / 20);
        if (diff > 0) scoreA += Math.floor(Math.random() * diff);
        else if (diff < 0) scoreB += Math.floor(Math.random() * Math.abs(diff));
        scoreA = Math.max(0, Math.min(5, scoreA));
        scoreB = Math.max(0, Math.min(5, scoreB));
        return { scoreA, scoreB };
    },

    updateGroupStandings(group, match, result) {
        const teamAId = match.teamA.id;
        const teamBId = match.teamB.id;
        const teamAStats = group.standings.find(s => s.teamId === teamAId);
        const teamBStats = group.standings.find(s => s.teamId === teamBId);
        if (!teamAStats || !teamBStats) return;

        const goalsA = result.scoreA;
        const goalsB = result.scoreB;

        teamAStats.played++;
        teamAStats.goalsFor += goalsA;
        teamAStats.goalsAgainst += goalsB;
        teamAStats.goalDiff = teamAStats.goalsFor - teamAStats.goalsAgainst;
        if (result.winner === match.teamA) { teamAStats.wins++; teamAStats.points += 3; }
        else if (result.winner === null) { teamAStats.draws++; teamAStats.points += 1; }
        else { teamAStats.losses++; }

        teamBStats.played++;
        teamBStats.goalsFor += goalsB;
        teamBStats.goalsAgainst += goalsA;
        teamBStats.goalDiff = teamBStats.goalsFor - teamBStats.goalsAgainst;
        if (result.winner === match.teamB) { teamBStats.wins++; teamBStats.points += 3; }
        else if (result.winner === null) { teamBStats.draws++; teamBStats.points += 1; }
        else { teamBStats.losses++; }

        this.sortStandings(group);
    },

    sortStandings(group) {
        group.standings.sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points;
            if (a.goalDiff !== b.goalDiff) return b.goalDiff - a.goalDiff;
            if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
            return Math.random() - 0.5;
        });
    },

    // ----- Knockout flow -----
    // Get the player's next match (if any)
    getPlayerNextMatch() {
        const playerTeamId = this.selectedTeamId;

        if (!this.groupStageComplete) {
            // Group stage
            for (let group of this.groups) {
                const match = group.matches.find(m =>
                    (m.teamA.id === playerTeamId || m.teamB.id === playerTeamId) &&
                    !m.played &&
                    m.matchDay === this.currentMatchDay
                );
                if (match) return { ...match, type: 'group', groupId: group.id };
            }
            return null;
        } else if (!this.tournamentComplete && this.groupStageQualified && !this.isPlayerOut) {
            // Knockout – check current round
            const round = this.knockoutMatches[this.currentKnockoutRound];
            if (round) {
                const match = round.matches.find(m =>
                    (m.teamA && m.teamB) &&
                    (m.teamA.id === playerTeamId || m.teamB.id === playerTeamId) &&
                    !m.played
                );
                if (match) return { ...match, type: 'knockout', round: this.currentKnockoutRound };
            }
        }
        return null;
    },

    // Record player's match result (called after match ends)
    recordPlayerMatchResult(matchId, teamAScore, teamBScore, isGroupMatch, groupId) {
        console.log('[Tournament] Recording match:', matchId, teamAScore, '-', teamBScore);

        let match = null;
        let group = null;

        if (isGroupMatch) {
            group = this.groups.find(g => g.id === groupId);
            if (group) match = group.matches.find(m => m.id === matchId);
        } else {
            for (let round of this.knockoutMatches) {
                match = round.matches.find(m => m.id === matchId);
                if (match) break;
            }
        }

        if (!match) {
            console.error('[Tournament] Match not found:', matchId);
            return;
        }

        match.scoreA = teamAScore;
        match.scoreB = teamBScore;
        let winner = null;
        if (match.scoreA > match.scoreB) winner = match.teamA;
        else if (match.scoreB > match.scoreA) winner = match.teamB;

        // Handle knockout draws – extra time simulation
        if (!isGroupMatch && winner === null) {
            let extraA = match.scoreA, extraB = match.scoreB;
            let extraCount = 0;
            while (winner === null && extraCount < 3) {
                extraCount++;
                const ea = Math.floor(Math.random() * 2);
                const eb = Math.floor(Math.random() * 2);
                extraA += ea;
                extraB += eb;
                if (extraA > extraB) winner = match.teamA;
                else if (extraB > extraA) winner = match.teamB;
            }
            if (winner === null) {
                winner = Math.random() < 0.5 ? match.teamA : match.teamB;
                if (winner === match.teamA) extraA += 1;
                else extraB += 1;
            }
            match.scoreA = extraA;
            match.scoreB = extraB;
            match.extraTime = true;
        }

        match.played = true;
        match.winner = winner;
        match.pending = false;
        match.isPlayerMatch = false;

        console.log('[Tournament] ✅ Match recorded:', match.teamA.name, match.scoreA, '-', match.scoreB, match.teamB.name);
        this.matchResults.push({ ...match });

        const playerTeamId = this.selectedTeamId;
        const playerWon = winner && winner.id === playerTeamId;
        const playerLost = winner && winner.id !== playerTeamId;

        // ------ Handle based on match type ------
        if (isGroupMatch) {
            // Update group standings
            const result = { teamA: match.teamA, teamB: match.teamB, scoreA: match.scoreA, scoreB: match.scoreB, winner };
            this.updateGroupStandings(group, match, result);

            // Complete match day
            const dayComplete = this.completeMatchDay();
            if (this.groupStageComplete) {
                this.checkGroupStageQualification();
                // If player qualified, knockout already generated.
                // If eliminated, simulateFullTournament already called inside check.
            }
        } else {
            // KNOCKOUT match
            if (playerLost) {
                // Player is out – simulate the rest of the tournament
                this.isPlayerOut = true;
                this.playerEliminated = true;
                console.log('[Tournament] ❌ Player lost in knockout – simulating rest...');
                this.simulateFullTournament();
                return;
            } else if (playerWon) {
                // Player won – check if it was the final
                const isFinal = (this.currentKnockoutRound === 3); // final round
                if (isFinal) {
                    this.champion = winner;
                    this.tournamentComplete = true;
                    console.log('[Tournament] 🏆 Player is CHAMPION!');
                    return;
                }
                // Otherwise, we need to simulate the rest of the current round (other matches)
                // and then advance to next round.
                this.afterPlayerKnockoutWin();
            }
        }
    },

    // Called after player wins a knockout match (not final)
    afterPlayerKnockoutWin() {
        // 1. Simulate all other matches in the current round
        const round = this.knockoutMatches[this.currentKnockoutRound];
        if (!round) return;

        // Simulate all matches in this round that are not played (AI matches)
        for (let match of round.matches) {
            if (!match.played && !match.isPlayerMatch) {
                const result = this.simulateMatch(match.teamA, match.teamB);
                match.played = true;
                match.scoreA = result.scoreA;
                match.scoreB = result.scoreB;
                match.winner = result.winner;
                match.pending = false;
                this.matchResults.push({ ...match });
            }
        }

        // 2. Check if all matches in this round are now played
        const allPlayed = round.matches.every(m => m.played === true);
        if (!allPlayed) {
            console.error('[Tournament] Not all matches played after player win?');
            return;
        }

        // 3. Advance to next round (if not final)
        if (this.currentKnockoutRound < 3) {
            this.advanceToNextKnockoutRound();
        } else {
            // It was final but we already handled champion in recordPlayerMatchResult
            // This should not happen because we check final earlier.
        }
    },

    // Advance to next round: build next round from winners of current round
    advanceToNextKnockoutRound() {
        const currentRound = this.knockoutMatches[this.currentKnockoutRound];
        const nextRoundIndex = this.currentKnockoutRound + 1;
        const nextRound = this.knockoutMatches[nextRoundIndex];
        if (!nextRound) return;

        // Collect winners from current round
        const winners = [];
        for (let match of currentRound.matches) {
            if (match.winner) winners.push(match.winner);
            else {
                console.warn('[Tournament] Match without winner in round', this.currentKnockoutRound);
                winners.push(null);
            }
        }

        // Pair winners for next round
        const pairs = [];
        for (let i = 0; i < winners.length; i += 2) {
            const a = winners[i];
            const b = winners[i+1];
            if (a && b) pairs.push({ teamA: a, teamB: b });
            else if (a) pairs.push({ teamA: a, teamB: null });
            else if (b) pairs.push({ teamA: b, teamB: null });
            else pairs.push({ teamA: null, teamB: null });
        }

        // Create matches for next round
        nextRound.matches = pairs.map((pair, idx) => ({
            id: this._matchIdCounter++,
            teamA: pair.teamA,
            teamB: pair.teamB,
            played: false,
            scoreA: 0,
            scoreB: 0,
            winner: null,
            pending: false,
            isPlayerMatch: false,
            extraTime: false
        }));

        // Advance to next round
        this.currentKnockoutRound = nextRoundIndex;

        // If next round has no player (eliminated or player already out), simulate it entirely
        const playerTeamId = this.selectedTeamId;
        const hasPlayer = nextRound.matches.some(m =>
            (m.teamA && m.teamA.id === playerTeamId) || (m.teamB && m.teamB.id === playerTeamId)
        );
        if (!hasPlayer) {
            // Player is not in this round – simulate all matches and continue recursively
            this.simulateKnockoutRoundFully();
        } else {
            // Player has a match – it will be picked up by UI
            // Mark it as pending (if not already)
            const playerMatch = nextRound.matches.find(m =>
                (m.teamA && m.teamA.id === playerTeamId) || (m.teamB && m.teamB.id === playerTeamId)
            );
            if (playerMatch) {
                playerMatch.isPlayerMatch = true;
                playerMatch.pending = true;
            }
            console.log('[Tournament] Advanced to', nextRound.name, '- player match pending');
        }
    },

    // Simulate all matches in the current round (AI only, no player)
    simulateKnockoutRoundFully() {
        const round = this.knockoutMatches[this.currentKnockoutRound];
        if (!round) return;

        // Simulate all unplayed matches in this round
        for (let match of round.matches) {
            if (!match.played && match.teamA && match.teamB) {
                const result = this.simulateMatch(match.teamA, match.teamB);
                match.played = true;
                match.scoreA = result.scoreA;
                match.scoreB = result.scoreB;
                match.winner = result.winner;
                match.pending = false;
                this.matchResults.push({ ...match });
            }
        }

        // Check if all played
        const allPlayed = round.matches.every(m => m.played === true);
        if (allPlayed) {
            if (this.currentKnockoutRound < 3) {
                this.advanceToNextKnockoutRound();
                // After advancing, the new round may also be fully AI – recursively simulate
                this.simulateKnockoutRoundFully();
            } else {
                // Final round is complete – set champion
                const finalMatch = round.matches[0];
                if (finalMatch && finalMatch.winner) {
                    this.champion = finalMatch.winner;
                    this.tournamentComplete = true;
                    console.log('[Tournament] 🏆 Champion (simulated):', this.champion.name);
                }
            }
        }
    },

    // Simulate all remaining knockout rounds (used when player eliminated)
    simulateFullTournament() {
        console.log('[Tournament] Simulating full tournament...');
        // If knockout not generated yet, generate it (should have been)
        if (this.knockoutMatches.length === 0 || this.knockoutMatches[0].matches.length === 0) {
            this.generateKnockoutStage();
        }
        // Reset current round to 0 if player out, but we may already be at some round.
        // Start from round 0 if we are not already in knockout.
        if (this.currentKnockoutRound === 0 && this.knockoutMatches[0].matches.length > 0) {
            // Simulate all rounds from start
            this.simulateKnockoutRoundFully();
        } else {
            // If already in a later round, continue from there
            this.simulateKnockoutRoundFully();
        }
    },

    // ----- UI helpers -----
    getProgress() {
        if (this.tournamentComplete) return 100;
        if (!this.groupStageComplete) {
            const total = this.groups.flatMap(g => g.matches).length;
            const played = this.groups.flatMap(g => g.matches.filter(m => m.played)).length;
            return Math.round((played / total) * 100);
        } else {
            const total = this.knockoutMatches.flatMap(r => r.matches).length;
            const played = this.knockoutMatches.flatMap(r => r.matches.filter(m => m.played)).length;
            return 50 + Math.round((played / total) * 50);
        }
    },

    getGroupStandings(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return null;
        return group.standings.map(entry => {
            const team = TOURNAMENT_TEAMS.find(t => t.id === entry.teamId);
            return { ...entry, team };
        });
    },

    getAllGroupStandings() {
        return this.groups.map(group => ({
            name: group.name,
            standings: this.getGroupStandings(group.id)
        }));
    },

    getBracketStatus() {
        return this.knockoutMatches.map((round, idx) => ({
            round: idx,
            name: round.name,
            matches: round.matches.map(m => ({
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

    // ----- Utilities -----
    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
};