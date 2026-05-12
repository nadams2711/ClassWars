export interface BracketMatch {
  id: string;
  roundNumber: number;
  matchIndex: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  status: "pending" | "active" | "completed";
}

// Generate single-elimination bracket
export function generateBracket(participantIds: string[]): BracketMatch[] {
  // Round up to next power of 2
  const size = nextPowerOf2(participantIds.length);
  const totalRounds = Math.log2(size);
  const matches: BracketMatch[] = [];
  let matchCounter = 0;

  // Seed first round
  const seeded = seedParticipants(participantIds, size);

  // Create first round matches
  for (let i = 0; i < size / 2; i++) {
    matches.push({
      id: `match-${matchCounter++}`,
      roundNumber: 1,
      matchIndex: i,
      participant1Id: seeded[i * 2] || null,
      participant2Id: seeded[i * 2 + 1] || null,
      winnerId: null,
      // Auto-advance byes
      status: (!seeded[i * 2] || !seeded[i * 2 + 1]) ? "completed" : "pending",
    });
  }

  // Handle byes - auto-advance
  matches.forEach(match => {
    if (match.status === "completed") {
      match.winnerId = match.participant1Id || match.participant2Id;
    }
  });

  // Create subsequent round placeholders
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = size / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `match-${matchCounter++}`,
        roundNumber: round,
        matchIndex: i,
        participant1Id: null,
        participant2Id: null,
        winnerId: null,
        status: "pending",
      });
    }
  }

  // Propagate bye winners to next round
  propagateByes(matches, totalRounds);

  return matches;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function seedParticipants(ids: string[], bracketSize: number): (string | null)[] {
  const seeded: (string | null)[] = new Array(bracketSize).fill(null);
  // Standard tournament seeding
  for (let i = 0; i < ids.length; i++) {
    seeded[i] = ids[i];
  }
  return seeded;
}

function propagateByes(matches: BracketMatch[], totalRounds: number) {
  for (let round = 1; round < totalRounds; round++) {
    const roundMatches = matches.filter(m => m.roundNumber === round);
    const nextRoundMatches = matches.filter(m => m.roundNumber === round + 1);

    // Propagate winners (real ones) to next round
    roundMatches.forEach((match, idx) => {
      if (match.winnerId) {
        const nextMatchIdx = Math.floor(idx / 2);
        const nextMatch = nextRoundMatches[nextMatchIdx];
        if (nextMatch) {
          if (idx % 2 === 0) {
            nextMatch.participant1Id = match.winnerId;
          } else {
            nextMatch.participant2Id = match.winnerId;
          }
        }
      }
    });

    // Auto-resolve next-round matches where both feeders are completed
    nextRoundMatches.forEach(match => {
      if (match.status !== "pending") return;
      const feeder1 = roundMatches[match.matchIndex * 2];
      const feeder2 = roundMatches[match.matchIndex * 2 + 1];
      if (!feeder1 || feeder1.status !== "completed") return;
      if (!feeder2 || feeder2.status !== "completed") return;

      // Both feeders completed — check participants
      if (match.participant1Id && !match.participant2Id) {
        match.winnerId = match.participant1Id;
        match.status = "completed";
      } else if (!match.participant1Id && match.participant2Id) {
        match.winnerId = match.participant2Id;
        match.status = "completed";
      } else if (!match.participant1Id && !match.participant2Id) {
        match.winnerId = null;
        match.status = "completed";
      }
    });
  }
}

export function advanceBracket(matches: BracketMatch[], matchId: string, winnerId: string): BracketMatch[] {
  const updated = matches.map(m => ({ ...m }));
  const match = updated.find(m => m.id === matchId);
  if (!match) return updated;

  match.winnerId = winnerId;
  match.status = "completed";

  // Find next round match and place winner
  const nextRoundMatches = updated.filter(m => m.roundNumber === match.roundNumber + 1);
  if (nextRoundMatches.length > 0) {
    const nextMatchIdx = Math.floor(match.matchIndex / 2);
    const nextMatch = nextRoundMatches[nextMatchIdx];
    if (nextMatch) {
      if (match.matchIndex % 2 === 0) {
        nextMatch.participant1Id = winnerId;
      } else {
        nextMatch.participant2Id = winnerId;
      }
    }
  }

  return updated;
}

export function getBracketWinner(matches: BracketMatch[]): string | null {
  const finalMatch = matches.reduce((max, m) =>
    m.roundNumber > max.roundNumber ? m : max, matches[0]);
  return finalMatch?.winnerId || null;
}
