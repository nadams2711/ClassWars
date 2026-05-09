export const SFX_NAMES = [
  "menu_select", "menu_confirm", "join_success", "ready_up",
  "countdown_tick", "countdown_go", "timer_warning", "timer_critical",
  "submit_success", "score_reveal", "rank_up", "rank_down",
  "vs_whoosh", "vs_slam", "victory_fanfare", "silver_fanfare",
  "bronze_hit", "badge_unlock", "confetti_pop", "crowd_cheer",
  "error_buzz", "round_complete", "game_over", "reaction_pop",
  "dramatic_pause",
] as const;

export type SFXName = typeof SFX_NAMES[number];

// Map of SFX to their usage context for documentation
export const SFX_CONTEXT: Record<SFXName, string> = {
  menu_select: "Hover/focus on menu items",
  menu_confirm: "Click/select menu items",
  join_success: "Player successfully joins event",
  ready_up: "Player toggles ready status",
  countdown_tick: "3-2-1 countdown ticks",
  countdown_go: "GO! after countdown",
  timer_warning: "Timer enters warning zone (15s)",
  timer_critical: "Timer enters critical zone (5s)",
  submit_success: "Submission accepted",
  score_reveal: "Score animation starts",
  rank_up: "Player moves up in leaderboard",
  rank_down: "Player moves down in leaderboard",
  vs_whoosh: "VS screen avatar slide-in",
  vs_slam: "VS text slam effect",
  victory_fanfare: "1st place reveal",
  silver_fanfare: "2nd place reveal",
  bronze_hit: "3rd place reveal",
  badge_unlock: "Badge earned popup",
  confetti_pop: "Confetti/particle burst",
  crowd_cheer: "Crowd cheering moment",
  error_buzz: "Error/invalid action",
  round_complete: "Round finishes",
  game_over: "Game/event ends",
  reaction_pop: "Quick reaction feedback",
  dramatic_pause: "Dramatic pause beat",
};
