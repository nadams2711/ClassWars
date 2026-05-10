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
  | "universal"
  | "recess_riot";

export type LocationType =
  | "classroom"
  | "park"
  | "restaurant"
  | "home"
  | "beach"
  | "office"
  | "anywhere";

export interface DescribeAvatarData {
  type: "describe_avatar";
  avatarIndex: number;
  prompt: string;
  locations?: LocationType[];
}

export interface EmojiPromptData {
  type: "emoji_prompt";
  emojis: string[];
  prompt: string;
  locations?: LocationType[];
}

export interface ThisOrThatChoice {
  a: string;
  b: string;
}

export interface ThisOrThatData {
  type: "this_or_that";
  choices: ThisOrThatChoice[];
  locations?: LocationType[];
}

export interface DrawingPromptData {
  type: "drawing";
  prompt: string;
  locations?: LocationType[];
}

export interface TapFrenzyData {
  type: "tap_frenzy";
  durationSeconds: number;
  prompt: string;
  locations?: LocationType[];
}

export interface ReactionTimeData {
  type: "reaction_time";
  rounds: number;
  prompt: string;
  locations?: LocationType[];
}

export interface PhotoSelfieData {
  type: "photo_selfie";
  avatarIndex: number;
  prompt: string;
  locations?: LocationType[];
}

export interface ShakeMeterData {
  type: "shake_meter";
  durationSeconds: number;
  prompt: string;
  locations?: LocationType[];
}

export interface MemorySequenceData {
  type: "memory_sequence";
  sequenceLength: number;
  prompt: string;
  locations?: LocationType[];
}

export interface TiltTargetData {
  type: "tilt_target";
  rounds: number;
  prompt: string;
  locations?: LocationType[];
}

export interface SoundEffectData {
  type: "sound_effect";
  prompt: string;
  durationSeconds: number;
  locations?: LocationType[];
}

export interface EmojiSliderItem {
  prompt: string;
  leftEmoji: string;
  rightEmoji: string;
}

export interface EmojiSliderData {
  type: "emoji_slider";
  items: EmojiSliderItem[];
  prompt: string;
  locations?: LocationType[];
}

export interface GroupPhotoData {
  type: "group_photo";
  prompt: string;
  icon: string;
  locations?: LocationType[];
}

export interface GroupTimerData {
  type: "group_timer";
  prompt: string;
  icon: string;
  activity: string;
  locations?: LocationType[];
}

export type InteractiveData =
  | DescribeAvatarData
  | EmojiPromptData
  | ThisOrThatData
  | DrawingPromptData
  | TapFrenzyData
  | ReactionTimeData
  | PhotoSelfieData
  | ShakeMeterData
  | MemorySequenceData
  | TiltTargetData
  | SoundEffectData
  | EmojiSliderData
  | GroupPhotoData
  | GroupTimerData;

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
  interactiveData?: InteractiveData | null;
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
