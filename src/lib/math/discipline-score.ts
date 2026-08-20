import { PsychologyEntry } from "@/types/psychology.types";

export interface DisciplineBreakdown {
  totalScore: number; // 0 - 100
  planAdherencePoints: number; // Max 30
  stopLossDisciplinePoints: number; // Max 15
  exitDisciplinePoints: number; // Max 10
  overtradeDisciplinePoints: number; // Max 15
  revengeTradeDisciplinePoints: number; // Max 15
  emotionalControlPoints: number; // Max 15
  rating: "ELITE" | "DISCIPLINED" | "INCONSISTENT" | "RECKLESS";
  penalties: string[];
}

export function calculateDisciplineScore(
  entry: Partial<PsychologyEntry>
): DisciplineBreakdown {
  let planAdherencePoints = entry.followedPlan !== false ? 30 : 0;
  let stopLossDisciplinePoints = entry.movedStopLossPrematurely ? 0 : 15;
  let exitDisciplinePoints = entry.exitedWinnerEarly ? 0 : 10;
  let overtradeDisciplinePoints = entry.overtraded ? 0 : 15;
  let revengeTradeDisciplinePoints = entry.revengeTraded ? 0 : 15;
  
  // Emotional control points (Max 15)
  const fomo = entry.fomo ?? 1;
  const revenge = entry.revengeTendency ?? 1;
  const greed = entry.greed ?? 1;
  const stress = entry.stress ?? 1;

  let emotionalControlPoints = 15;
  const penalties: string[] = [];

  if (entry.followedPlan === false) {
    penalties.push("Executed trade outside predefined trading plan rules (-30 pts)");
  }
  if (entry.movedStopLossPrematurely) {
    penalties.push("Moved Stop Loss prematurely during trade (-15 pts)");
  }
  if (entry.exitedWinnerEarly) {
    penalties.push("Cut winning trade before target / invalidation (-10 pts)");
  }
  if (entry.overtraded) {
    penalties.push("Exceeded daily trade limit (Overtrading) (-15 pts)");
  }
  if (entry.revengeTraded) {
    penalties.push("Engaged in revenge trading after a loss (-15 pts)");
  }

  // Emotional penalties
  if (fomo >= 7) {
    emotionalControlPoints -= 5;
    penalties.push(`Elevated FOMO score (${fomo}/10) detected (-5 pts)`);
  }
  if (revenge >= 6) {
    emotionalControlPoints -= 5;
    penalties.push(`Elevated Revenge impulse (${revenge}/10) detected (-5 pts)`);
  }
  if (greed >= 8 || stress >= 8) {
    emotionalControlPoints -= 5;
    penalties.push("Elevated greed or acute stress reported (-5 pts)");
  }

  emotionalControlPoints = Math.max(0, emotionalControlPoints);

  const totalScore = Math.max(
    0,
    Math.min(
      100,
      planAdherencePoints +
        stopLossDisciplinePoints +
        exitDisciplinePoints +
        overtradeDisciplinePoints +
        revengeTradeDisciplinePoints +
        emotionalControlPoints
    )
  );

  let rating: "ELITE" | "DISCIPLINED" | "INCONSISTENT" | "RECKLESS" = "DISCIPLINED";
  if (totalScore >= 90) {
    rating = "ELITE";
  } else if (totalScore >= 75) {
    rating = "DISCIPLINED";
  } else if (totalScore >= 50) {
    rating = "INCONSISTENT";
  } else {
    rating = "RECKLESS";
  }

  return {
    totalScore,
    planAdherencePoints,
    stopLossDisciplinePoints,
    exitDisciplinePoints,
    overtradeDisciplinePoints,
    revengeTradeDisciplinePoints,
    emotionalControlPoints,
    rating,
    penalties,
  };
}
