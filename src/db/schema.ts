import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ──────────────────────────────────────────────
// 1. users
// ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").default("host"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 2. accounts (NextAuth)
// ──────────────────────────────────────────────
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

// ──────────────────────────────────────────────
// 3. sessions (NextAuth)
// ──────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ──────────────────────────────────────────────
// 4. events
// ──────────────────────────────────────────────
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  hostId: uuid("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  joinCode: varchar("join_code", { length: 6 }).unique(),
  status: text("status").default("draft"),
  mode: text("mode").default("quick_play"),
  audience: text("audience").default("universal"),
  scoringPreset: text("scoring_preset").default("standard"),
  teamMode: boolean("team_mode").default(false),
  maxParticipants: integer("max_participants").default(50),
  currentRound: integer("current_round").default(0),
  totalRounds: integer("total_rounds").default(0),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 5. teams
// ──────────────────────────────────────────────
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  score: integer("score").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 6. participants
// ──────────────────────────────────────────────
export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    nickname: text("nickname").notNull(),
    avatarIndex: integer("avatar_index").default(0),
    teamId: uuid("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    isReady: boolean("is_ready").default(false),
    isConnected: boolean("is_connected").default(true),
    score: integer("score").default(0),
    joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow(),
  },
  (table) => [unique("uq_event_nickname").on(table.eventId, table.nickname)]
);

// ──────────────────────────────────────────────
// 7. challenge_templates
// ──────────────────────────────────────────────
export const challengeTemplates = pgTable("challenge_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  shortDescription: text("short_description"),
  fullInstructions: text("full_instructions"),
  audience: text("audience"),
  audiencePack: text("audience_pack"),
  category: text("category"),
  intensityTone: text("intensity_tone"),
  durationSeconds: integer("duration_seconds").default(60),
  movementLevel: text("movement_level").default("seated"),
  noiseLevel: text("noise_level").default("quiet"),
  submissionType: text("submission_type").default("completion_tap"),
  scoringType: text("scoring_type").default("completion"),
  safetyFlags: jsonb("safety_flags").default([]),
  isSystem: boolean("is_system").default(true),
  interactiveData: jsonb("interactive_data"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 8. challenge_packs
// ──────────────────────────────────────────────
export const challengePacks = pgTable("challenge_packs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  audience: text("audience"),
  icon: text("icon"),
  color: text("color"),
  isSystem: boolean("is_system").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 9. pack_challenges (junction)
// ──────────────────────────────────────────────
export const packChallenges = pgTable("pack_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  packId: uuid("pack_id")
    .notNull()
    .references(() => challengePacks.id, { onDelete: "cascade" }),
  challengeId: uuid("challenge_id")
    .notNull()
    .references(() => challengeTemplates.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").default(0),
});

// ──────────────────────────────────────────────
// 10. event_challenges
// ──────────────────────────────────────────────
export const eventChallenges = pgTable("event_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  challengeId: uuid("challenge_id")
    .notNull()
    .references(() => challengeTemplates.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  status: text("status").default("pending"),
  startedAt: timestamp("started_at", { mode: "date" }),
  endedAt: timestamp("ended_at", { mode: "date" }),
});

// ──────────────────────────────────────────────
// 11. submissions
// ──────────────────────────────────────────────
export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventChallengeId: uuid("event_challenge_id")
    .notNull()
    .references(() => eventChallenges.id, { onDelete: "cascade" }),
  participantId: uuid("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  submissionType: text("submission_type").notNull(),
  textContent: text("text_content"),
  mediaUrl: text("media_url"),
  completedAt: timestamp("completed_at", { mode: "date" }),
  submittedAt: timestamp("submitted_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 12. score_entries
// ──────────────────────────────────────────────
export const scoreEntries = pgTable("score_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventChallengeId: uuid("event_challenge_id")
    .notNull()
    .references(() => eventChallenges.id, { onDelete: "cascade" }),
  participantId: uuid("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  completionPoints: integer("completion_points").default(0),
  speedPoints: integer("speed_points").default(0),
  qualityPoints: integer("quality_points").default(0),
  crowdPoints: integer("crowd_points").default(0),
  teamworkPoints: integer("teamwork_points").default(0),
  totalPoints: integer("total_points").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 13. leaderboard_snapshots
// ──────────────────────────────────────────────
export const leaderboardSnapshots = pgTable("leaderboard_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  participantId: uuid("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  rank: integer("rank").notNull(),
  totalScore: integer("total_score").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 14. badges
// ──────────────────────────────────────────────
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  category: text("category"),
  criteria: jsonb("criteria"),
  isSystem: boolean("is_system").default(true),
});

// ──────────────────────────────────────────────
// 15. participant_badges
// ──────────────────────────────────────────────
export const participantBadges = pgTable("participant_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  badgeId: uuid("badge_id")
    .notNull()
    .references(() => badges.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  awardedAt: timestamp("awarded_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 16. bracket_matches
// ──────────────────────────────────────────────
export const bracketMatches = pgTable("bracket_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  matchIndex: integer("match_index").notNull(),
  participant1Id: uuid("participant1_id").references(() => participants.id, {
    onDelete: "set null",
  }),
  participant2Id: uuid("participant2_id").references(() => participants.id, {
    onDelete: "set null",
  }),
  winnerId: uuid("winner_id").references(() => participants.id, {
    onDelete: "set null",
  }),
  challengeId: uuid("challenge_id").references(() => eventChallenges.id, {
    onDelete: "set null",
  }),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ──────────────────────────────────────────────
// 17. moderation_flags
// ──────────────────────────────────────────────
export const moderationFlags = pgTable("moderation_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  flaggedBy: uuid("flagged_by")
    .notNull()
    .references(() => participants.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

// ══════════════════════════════════════════════
// RELATIONS
// ══════════════════════════════════════════════

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  hostedEvents: many(events),
  participants: many(participants),
  createdChallenges: many(challengeTemplates),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  host: one(users, {
    fields: [events.hostId],
    references: [users.id],
  }),
  teams: many(teams),
  participants: many(participants),
  eventChallenges: many(eventChallenges),
  leaderboardSnapshots: many(leaderboardSnapshots),
  participantBadges: many(participantBadges),
  bracketMatches: many(bracketMatches),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  event: one(events, {
    fields: [teams.eventId],
    references: [events.id],
  }),
  members: many(participants),
}));

export const participantsRelations = relations(
  participants,
  ({ one, many }) => ({
    event: one(events, {
      fields: [participants.eventId],
      references: [events.id],
    }),
    user: one(users, {
      fields: [participants.userId],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [participants.teamId],
      references: [teams.id],
    }),
    submissions: many(submissions),
    scoreEntries: many(scoreEntries),
    leaderboardSnapshots: many(leaderboardSnapshots),
    participantBadges: many(participantBadges),
  })
);

export const challengeTemplatesRelations = relations(
  challengeTemplates,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [challengeTemplates.createdBy],
      references: [users.id],
    }),
    packChallenges: many(packChallenges),
    eventChallenges: many(eventChallenges),
  })
);

export const challengePacksRelations = relations(
  challengePacks,
  ({ many }) => ({
    packChallenges: many(packChallenges),
  })
);

export const packChallengesRelations = relations(packChallenges, ({ one }) => ({
  pack: one(challengePacks, {
    fields: [packChallenges.packId],
    references: [challengePacks.id],
  }),
  challenge: one(challengeTemplates, {
    fields: [packChallenges.challengeId],
    references: [challengeTemplates.id],
  }),
}));

export const eventChallengesRelations = relations(
  eventChallenges,
  ({ one, many }) => ({
    event: one(events, {
      fields: [eventChallenges.eventId],
      references: [events.id],
    }),
    challenge: one(challengeTemplates, {
      fields: [eventChallenges.challengeId],
      references: [challengeTemplates.id],
    }),
    submissions: many(submissions),
    scoreEntries: many(scoreEntries),
    bracketMatches: many(bracketMatches),
  })
);

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  eventChallenge: one(eventChallenges, {
    fields: [submissions.eventChallengeId],
    references: [eventChallenges.id],
  }),
  participant: one(participants, {
    fields: [submissions.participantId],
    references: [participants.id],
  }),
  moderationFlags: many(moderationFlags),
}));

export const scoreEntriesRelations = relations(scoreEntries, ({ one }) => ({
  eventChallenge: one(eventChallenges, {
    fields: [scoreEntries.eventChallengeId],
    references: [eventChallenges.id],
  }),
  participant: one(participants, {
    fields: [scoreEntries.participantId],
    references: [participants.id],
  }),
}));

export const leaderboardSnapshotsRelations = relations(
  leaderboardSnapshots,
  ({ one }) => ({
    event: one(events, {
      fields: [leaderboardSnapshots.eventId],
      references: [events.id],
    }),
    participant: one(participants, {
      fields: [leaderboardSnapshots.participantId],
      references: [participants.id],
    }),
  })
);

export const badgesRelations = relations(badges, ({ many }) => ({
  participantBadges: many(participantBadges),
}));

export const participantBadgesRelations = relations(
  participantBadges,
  ({ one }) => ({
    participant: one(participants, {
      fields: [participantBadges.participantId],
      references: [participants.id],
    }),
    badge: one(badges, {
      fields: [participantBadges.badgeId],
      references: [badges.id],
    }),
    event: one(events, {
      fields: [participantBadges.eventId],
      references: [events.id],
    }),
  })
);

export const bracketMatchesRelations = relations(
  bracketMatches,
  ({ one }) => ({
    event: one(events, {
      fields: [bracketMatches.eventId],
      references: [events.id],
    }),
    participant1: one(participants, {
      fields: [bracketMatches.participant1Id],
      references: [participants.id],
      relationName: "bracketParticipant1",
    }),
    participant2: one(participants, {
      fields: [bracketMatches.participant2Id],
      references: [participants.id],
      relationName: "bracketParticipant2",
    }),
    winner: one(participants, {
      fields: [bracketMatches.winnerId],
      references: [participants.id],
      relationName: "bracketWinner",
    }),
    challenge: one(eventChallenges, {
      fields: [bracketMatches.challengeId],
      references: [eventChallenges.id],
    }),
  })
);

export const moderationFlagsRelations = relations(
  moderationFlags,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [moderationFlags.submissionId],
      references: [submissions.id],
    }),
    flagger: one(participants, {
      fields: [moderationFlags.flaggedBy],
      references: [participants.id],
    }),
  })
);
