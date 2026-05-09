import {
  SubmissionType,
  ScoringType,
  MovementLevel,
  NoiseLevel,
  IntensityTone,
  Audience,
} from "./game";

export type AudiencePack =
  | "classroom_funny"
  | "classroom_low_noise"
  | "office_fun"
  | "office_professional"
  | "universal";

export interface ChallengeTemplate {
  id: string;
  title: string;
  shortDescription: string;
  fullInstructions: string;
  audience: Audience;
  audiencePack: AudiencePack;
  category: string;
  intensityTone: IntensityTone;
  durationSeconds: number;
  movementLevel: MovementLevel;
  noiseLevel: NoiseLevel;
  submissionType: SubmissionType;
  scoringType: ScoringType;
  safetyFlags: string[];
  isSystem: boolean;
}

export interface ChallengePack {
  id: string;
  name: string;
  description: string;
  audience: Audience;
  challengeCount: number;
  icon: string;
  color: string;
}
