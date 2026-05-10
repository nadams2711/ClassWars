import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  challengeTemplates,
  challengePacks,
  packChallenges,
  badges,
} from "./schema";
import { sql as rawSql } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function scoringType(sub: string): string {
  const map: Record<string, string> = {
    judge: "judge",
    vote: "vote",
    completion_tap: "completion",
    text: "completion",
    photo: "completion",
    hybrid: "hybrid",
  };
  return map[sub] || "completion";
}

function dur(s: string): number {
  if (s === "30s") return 30;
  if (s === "1m") return 60;
  if (s === "2m") return 120;
  if (s === "3m") return 180;
  return 60;
}

function mov(s: string): string {
  return s === "Light movement" ? "light_movement" : s.toLowerCase();
}

function noi(s: string): string {
  return s.toLowerCase();
}

// ──────────────────────────────────────────────
// Challenge data
// [title, category, intensity, duration, movement, noise, submission, audience, audiencePack, instructions]
// ──────────────────────────────────────────────

type ChallengeRow = [
  string, string, string, string, string, string, string, string, string, string
];

const CHALLENGES: ChallengeRow[] = [
  // ═══════════════════════════════════════════
  // CLASSROOM FUNNY (1-60)
  // ═══════════════════════════════════════════
  ["Robot Roll Call", "Improv", "mild", "30s", "Seated", "Quiet", "judge", "classroom", "classroom_funny",
   "When your name is called, respond as a malfunctioning robot with jerky movements and a monotone voice. The judge scores based on creativity and commitment."],
  ["Emoji Face-Off", "Performance", "bold", "1m", "Standing", "Medium", "completion_tap", "classroom", "classroom_funny",
   "Cycle through as many recognizable emoji faces as possible in 60 seconds. Each expression must be clearly different from the last. Tap complete when done!"],
  ["Alien Lunch Review", "Creativity", "chaos", "2m", "Light movement", "Loud", "vote", "classroom", "classroom_funny",
   "You are an alien visiting Earth for the first time. Give a dramatic review of a common lunch item as if it's the strangest thing you've ever encountered. The crowd votes for the best review."],
  ["Dramatic Pencil Ad", "Social courage", "legend", "3m", "Seated", "Quiet", "hybrid", "classroom", "classroom_funny",
   "Create and perform a luxury TV commercial for an ordinary pencil. Treat it like a million-dollar product with dramatic pauses, fancy language, and intensity."],
  ["Slow-Mo Champion Walk", "Teamwork", "mild", "30s", "Standing", "Medium", "text", "classroom", "classroom_funny",
   "Walk in slow motion across the room like you just won the championship. Describe your victory moment in the text box."],
  ["Mystery Celebrity Entrance", "Improv", "bold", "1m", "Light movement", "Loud", "judge", "classroom", "classroom_funny",
   "Walk into the room as a mystery celebrity. Don't reveal who you are -- let everyone guess from your walk, gestures, and attitude."],
  ["Fake Weather Report", "Performance", "chaos", "2m", "Seated", "Quiet", "completion_tap", "classroom", "classroom_funny",
   "Deliver a dramatic weather report for the most absurd weather conditions imaginable. Include severe warnings about raining homework or tornado-force giggles."],
  ["Chaotic News Flash", "Creativity", "legend", "3m", "Standing", "Medium", "vote", "classroom", "classroom_funny",
   "Break a ridiculous news story as a TV anchor. Make up the most chaotic headline possible and report on it with total seriousness."],
  ["Object Transformation", "Social courage", "mild", "30s", "Light movement", "Loud", "hybrid", "classroom", "classroom_funny",
   "Pick up any object near you and use it as something completely different. A ruler becomes a sword, a book becomes a steering wheel. Commit fully!"],
  ["Golden Spoon Awards", "Teamwork", "bold", "1m", "Seated", "Quiet", "text", "classroom", "classroom_funny",
   "Write and deliver the most dramatic award acceptance speech for winning a golden spoon. Thank everyone from your pet to your lunch box."],
  ["Backwards Introduction", "Improv", "chaos", "2m", "Standing", "Medium", "judge", "classroom", "classroom_funny",
   "Introduce yourself, but say everything in reverse order. Start with your goodbye and end with your name. Try to keep a straight face."],
  ["Class Mascot Reveal", "Performance", "legend", "3m", "Light movement", "Loud", "completion_tap", "classroom", "classroom_funny",
   "Reveal the new class mascot with maximum hype. Build suspense, create a backstory, and present the mascot (any object) with fanfare."],
  ["Desk Item Luxury Pitch", "Creativity", "mild", "30s", "Seated", "Quiet", "vote", "classroom", "classroom_funny",
   "Pick any desk item and pitch it as an exclusive luxury product. Make it sound like it costs more than a car."],
  ["Movie Trailer Sentence", "Social courage", "bold", "1m", "Standing", "Medium", "hybrid", "classroom", "classroom_funny",
   "Say any ordinary sentence but deliver it like a dramatic movie trailer voiceover. 'In a world where homework was due tomorrow...'"],
  ["Tiny TED Talk", "Teamwork", "chaos", "2m", "Light movement", "Loud", "text", "classroom", "classroom_funny",
   "Deliver a 2-minute TED talk on the most ridiculous topic you can think of. Treat it with absolute seriousness and academic authority."],
  ["Laugh Without Sound", "Improv", "legend", "3m", "Seated", "Quiet", "judge", "classroom", "classroom_funny",
   "Tell the funniest story you can while everyone tries not to laugh out loud. You must also not make any sound while telling it -- mime only!"],
  ["Superhero Attendance", "Performance", "mild", "30s", "Standing", "Medium", "completion_tap", "classroom", "classroom_funny",
   "Answer the attendance call as your superhero alter ego. Strike a pose and announce your hero name and power."],
  ["Most Dramatic Yawn", "Creativity", "bold", "1m", "Light movement", "Loud", "vote", "classroom", "classroom_funny",
   "Perform the most theatrical, over-the-top yawn in history. Make it an unforgettable performance piece."],
  ["Mystery Mood Walk", "Social courage", "chaos", "2m", "Seated", "Quiet", "hybrid", "classroom", "classroom_funny",
   "Walk across the room expressing a secret emotion assigned to you. Everyone else tries to guess what mood you're portraying."],
  ["One-Line Soap Opera", "Teamwork", "legend", "3m", "Standing", "Medium", "text", "classroom", "classroom_funny",
   "Create a one-sentence soap opera moment with maximum drama. Include a gasp, a dramatic turn, and a shocking revelation."],
  ["Fake Olympic Commentary", "Improv", "mild", "30s", "Light movement", "Loud", "judge", "classroom", "classroom_funny",
   "Provide live Olympic commentary for someone doing an ordinary task like sharpening a pencil or opening a backpack."],
  ["Unexpected Talent Flash", "Performance", "bold", "1m", "Seated", "Quiet", "completion_tap", "classroom", "classroom_funny",
   "Reveal your most unexpected talent (real or invented) with a dramatic buildup. Even if it's 'I can blink really fast' -- sell it!"],
  ["Accidental Pop Star", "Creativity", "chaos", "2m", "Standing", "Medium", "vote", "classroom", "classroom_funny",
   "Perform an impromptu pop song about your day so far. Include a chorus, dramatic bridge, and at least one key change gesture."],
  ["Cartoon Voice Challenge", "Social courage", "legend", "3m", "Light movement", "Loud", "hybrid", "classroom", "classroom_funny",
   "Read an ordinary text passage using the voice of a famous cartoon character. Stay in character the entire time."],
  ["Overexcited Tour Guide", "Teamwork", "mild", "30s", "Seated", "Quiet", "text", "classroom", "classroom_funny",
   "Give an outrageously enthusiastic tour of your immediate desk area. Treat every item like it's a priceless museum artifact."],
  ["Giant Reaction Replay", "Improv", "bold", "1m", "Standing", "Medium", "judge", "classroom", "classroom_funny",
   "React to an ordinary event with the most exaggerated reaction possible. Someone dropping a pen should be treated like witnessing a miracle."],
  ["Bad Invention Pitch", "Performance", "chaos", "2m", "Light movement", "Loud", "completion_tap", "classroom", "classroom_funny",
   "Pitch the worst invention you can imagine with complete confidence. A solar-powered flashlight? An inflatable dartboard? Sell it!"],
  ["Reverse Interview", "Creativity", "legend", "3m", "Seated", "Quiet", "vote", "classroom", "classroom_funny",
   "Interview an everyday object as if it's a celebrity. Ask it probing questions about its career, scandals, and future plans."],
  ["Mime the Morning", "Social courage", "mild", "30s", "Standing", "Medium", "hybrid", "classroom", "classroom_funny",
   "Act out your entire morning routine in 30 seconds using only mime. No sounds allowed -- make every action crystal clear."],
  ["Epic High-Five Air Version", "Teamwork", "bold", "1m", "Light movement", "Loud", "text", "classroom", "classroom_funny",
   "Choreograph and perform the most elaborate air high-five sequence with a partner. Include spins, slow-mo, and explosions."],
  ["Invisible Object Showcase", "Improv", "chaos", "2m", "Seated", "Quiet", "judge", "classroom", "classroom_funny",
   "Present and demonstrate an invisible object to the class. Make everyone believe they can almost see it through your committed miming."],
  ["Snack Critic Review", "Performance", "legend", "3m", "Standing", "Medium", "completion_tap", "classroom", "classroom_funny",
   "Review a common snack like a world-class food critic at a Michelin-star restaurant. Use fancy vocabulary and dramatic tasting notes."],
  ["Dinosaur Debate", "Creativity", "mild", "30s", "Light movement", "Loud", "vote", "classroom", "classroom_funny",
   "Argue passionately for which dinosaur would be the best class pet. You have 30 seconds to make your case."],
  ["Royal Announcement", "Social courage", "bold", "1m", "Seated", "Quiet", "hybrid", "classroom", "classroom_funny",
   "Make an ordinary classroom announcement, but deliver it as if you're a royal herald in medieval times. Use 'Hear ye, hear ye!' energy."],
  ["Whispered Action Replay", "Teamwork", "chaos", "2m", "Standing", "Medium", "text", "classroom", "classroom_funny",
   "Narrate an exciting sports replay of an ordinary classroom moment, but entirely in whispers. Build the tension dramatically."],
  ["Three-Pose Story", "Improv", "legend", "3m", "Light movement", "Loud", "judge", "classroom", "classroom_funny",
   "Tell a complete story using only three frozen poses. The audience must understand beginning, middle, and end from your poses alone."],
  ["Ridiculous Apology Speech", "Performance", "mild", "30s", "Seated", "Quiet", "completion_tap", "classroom", "classroom_funny",
   "Deliver a heartfelt public apology for something extremely trivial. Treat it like a major national scandal."],
  ["Speed Compliment Performance", "Creativity", "bold", "1m", "Standing", "Medium", "vote", "classroom", "classroom_funny",
   "Give as many creative, genuine compliments to random objects in the room as possible. Each must be unique and heartfelt."],
  ["School Supply Fashion Show", "Social courage", "chaos", "2m", "Light movement", "Loud", "hybrid", "classroom", "classroom_funny",
   "Model school supplies as if they're high fashion accessories on a runway. Work the catwalk with your pencil case couture."],
  ["Hero Landing Contest", "Teamwork", "legend", "3m", "Seated", "Quiet", "text", "classroom", "classroom_funny",
   "Design and describe the most epic superhero landing pose. Write out the slow-motion scene description in full dramatic detail."],
  ["Emoji Movie Scene", "Improv", "mild", "30s", "Standing", "Medium", "judge", "classroom", "classroom_funny",
   "Act out a famous movie scene using only emoji-style facial expressions and gestures. No words allowed."],
  ["Ancient Historian Explains Wi-Fi", "Performance", "bold", "1m", "Light movement", "Loud", "completion_tap", "classroom", "classroom_funny",
   "You're an ancient Roman scholar. Explain Wi-Fi using only concepts from your era. 'The invisible aqueduct of knowledge...'"],
  ["Tiny Rap Battle Safe", "Creativity", "chaos", "2m", "Seated", "Quiet", "vote", "classroom", "classroom_funny",
   "Drop a clean freestyle rap about school life. Keep it fun, keep it positive. The crowd votes for the best bars."],
  ["Animal News Anchor", "Social courage", "legend", "3m", "Standing", "Medium", "hybrid", "classroom", "classroom_funny",
   "Read today's news as if you are a specific animal. A cat anchor? A penguin reporter? Stay in character throughout."],
  ["Lost Tourist in Classroom", "Teamwork", "mild", "30s", "Light movement", "Loud", "text", "classroom", "classroom_funny",
   "Pretend you're a confused tourist who wandered into the classroom thinking it's a famous landmark. Describe what you 'see.'"],
  ["Theatrical Homework Saga", "Improv", "bold", "1m", "Seated", "Quiet", "judge", "classroom", "classroom_funny",
   "Narrate the epic tale of doing your homework last night as if it were a Lord of the Rings-style adventure."],
  ["Penguin Presentation", "Performance", "chaos", "2m", "Standing", "Medium", "completion_tap", "classroom", "classroom_funny",
   "Give a presentation on any topic while walking and moving like a penguin the entire time. Don't break character!"],
  ["Fastest Funny Freeze", "Creativity", "legend", "3m", "Light movement", "Loud", "vote", "classroom", "classroom_funny",
   "Strike the funniest frozen pose when the music stops. The crowd votes for the pose that makes them laugh hardest."],
  ["One-Sentence Horror Story", "Social courage", "mild", "30s", "Seated", "Quiet", "hybrid", "classroom", "classroom_funny",
   "Write and deliver a one-sentence horror story with maximum suspense. It must be school-appropriate but genuinely spooky."],
  ["Wrong Expert Panel", "Teamwork", "bold", "1m", "Standing", "Medium", "text", "classroom", "classroom_funny",
   "You're an expert being interviewed, but on the completely wrong topic. A chef asked about rocket science? Go with it confidently."],
  ["Awkward Dance Walk", "Improv", "chaos", "2m", "Light movement", "Loud", "judge", "classroom", "classroom_funny",
   "Walk across the room with the most awkward dance moves you can create. The more uncomfortable it looks, the better."],
  ["Villain Monologue Lite", "Performance", "legend", "3m", "Seated", "Quiet", "completion_tap", "classroom", "classroom_funny",
   "Deliver a dramatic villain monologue about something totally harmless. 'You fools thought you could stop me from... organizing my binder!'"],
  ["Mini Talent Remix", "Creativity", "mild", "30s", "Standing", "Medium", "vote", "classroom", "classroom_funny",
   "Show off a small talent but add a ridiculous twist. Can you snap your fingers? Now do it while spinning. Level up!"],
  ["Historical Figure Selfie Pitch", "Social courage", "bold", "1m", "Light movement", "Loud", "hybrid", "classroom", "classroom_funny",
   "Take an imaginary selfie as a historical figure and caption it out loud. 'Just crossed the Delaware, no big deal #WashingtonLife'"],
  ["Chaotic Acceptance Speech", "Teamwork", "chaos", "2m", "Seated", "Quiet", "text", "classroom", "classroom_funny",
   "Write the most chaotic award acceptance speech possible. Thank increasingly random people and things until time runs out."],
  ["Pretend Product Recall", "Improv", "legend", "3m", "Standing", "Medium", "judge", "classroom", "classroom_funny",
   "Announce a serious product recall for a common classroom item. Explain the 'dangers' with complete corporate seriousness."],
  ["Space Captain Attendance", "Performance", "mild", "30s", "Light movement", "Loud", "completion_tap", "classroom", "classroom_funny",
   "Call attendance as a starship captain. Each name gets a dramatic space-themed introduction."],
  ["Opera Roll Call", "Creativity", "bold", "1m", "Seated", "Quiet", "vote", "classroom", "classroom_funny",
   "Sing a student's name operatically, then they must respond in the same operatic style. The crowd votes for best duet."],
  ["Silliest Serious Speech", "Social courage", "chaos", "2m", "Standing", "Medium", "hybrid", "classroom", "classroom_funny",
   "Give the most serious, emotional speech about something completely silly. A missing sock? A cold french fry? Maximum gravitas."],
  ["Game Show Introduction", "Teamwork", "legend", "3m", "Light movement", "Loud", "text", "classroom", "classroom_funny",
   "Create and perform an over-the-top game show host introduction for a classmate. Include catchphrases and audience prompts."],

  // ═══════════════════════════════════════════
  // CLASSROOM LOW-NOISE (61-111)
  // ═══════════════════════════════════════════
  ["Silent Line-Up", "Observation", "mild", "30s", "Seated", "Quiet", "judge", "classroom", "classroom_low_noise",
   "Arrange yourselves in order by birthday month without speaking. Use only gestures and eye contact."],
  ["Mirror Face Match", "Teamwork", "bold", "1m", "Standing", "Medium", "completion_tap", "classroom", "classroom_low_noise",
   "Partner up and mirror each other's facial expressions perfectly. Stay synchronized for 60 seconds."],
  ["Expression Relay", "Quiet creativity", "mild", "2m", "Light movement", "Loud", "vote", "classroom", "classroom_low_noise",
   "Pass a facial expression down a line of players. The last person must guess the original emotion."],
  ["Secret Sign Story", "Gesture", "bold", "3m", "Seated", "Quiet", "hybrid", "classroom", "classroom_low_noise",
   "Tell a short story using only hand gestures and signs you invent on the spot."],
  ["Draw From Memory", "Memory", "mild", "30s", "Standing", "Medium", "text", "classroom", "classroom_low_noise",
   "Study an image for 10 seconds, then draw it from memory. Describe your drawing attempt."],
  ["Quiet Statue Switch", "Observation", "bold", "1m", "Light movement", "Loud", "judge", "classroom", "classroom_low_noise",
   "One player changes one thing about their pose while others look away. Spot the difference!"],
  ["Silent Emoji Scene", "Teamwork", "mild", "2m", "Seated", "Quiet", "completion_tap", "classroom", "classroom_low_noise",
   "Act out a scene using only emoji-style expressions. No sounds, no words -- just faces."],
  ["Mouth the Message", "Quiet creativity", "bold", "3m", "Standing", "Medium", "vote", "classroom", "classroom_low_noise",
   "Mouth a phrase silently to your team. They try to lip-read the message."],
  ["No-Talk Birthday Order", "Gesture", "mild", "30s", "Light movement", "Loud", "hybrid", "classroom", "classroom_low_noise",
   "Line up in birthday order without speaking. Use only fingers to show your month and day."],
  ["Pencil Balance Pose", "Memory", "bold", "1m", "Seated", "Quiet", "text", "classroom", "classroom_low_noise",
   "Balance a pencil on different body parts. Hold each pose for 5 seconds. Describe your best balance."],
  ["Mystery Object Sketch", "Observation", "mild", "2m", "Standing", "Medium", "judge", "classroom", "classroom_low_noise",
   "One person draws an object in the air. Others sketch what they think it is."],
  ["Stealth Team Tableaux", "Teamwork", "bold", "3m", "Light movement", "Loud", "completion_tap", "classroom", "classroom_low_noise",
   "Create a frozen scene as a team without making any noise during setup."],
  ["Wordless Movie Poster", "Quiet creativity", "mild", "30s", "Seated", "Quiet", "vote", "classroom", "classroom_low_noise",
   "Draw a movie poster without using any words or letters. Others must guess the film."],
  ["Quiet Compliment Cards", "Gesture", "bold", "1m", "Standing", "Medium", "hybrid", "classroom", "classroom_low_noise",
   "Write a silent compliment card for someone nearby. Express appreciation without speaking."],
  ["Gesture Guess", "Memory", "mild", "2m", "Light movement", "Loud", "text", "classroom", "classroom_low_noise",
   "Act out a concept using only simple gestures. Keep it calm and precise."],
  ["Silent Animal Parade", "Observation", "bold", "3m", "Seated", "Quiet", "judge", "classroom", "classroom_low_noise",
   "Move like a specific animal in complete silence. The judge scores accuracy and commitment."],
  ["Tiny Whiteboard Sprint", "Teamwork", "mild", "30s", "Standing", "Medium", "completion_tap", "classroom", "classroom_low_noise",
   "Race to draw the prompted item on a small surface. Speed and clarity both count."],
  ["Freeze Frame Story", "Quiet creativity", "bold", "1m", "Light movement", "Loud", "vote", "classroom", "classroom_low_noise",
   "Tell a story through a series of frozen poses. Change pose every 15 seconds."],
  ["Shape Build Challenge", "Gesture", "mild", "2m", "Seated", "Quiet", "hybrid", "classroom", "classroom_low_noise",
   "Use desk items to build a specific shape without speaking. Precision matters."],
  ["Whisper Chain Clean", "Memory", "bold", "3m", "Standing", "Medium", "text", "classroom", "classroom_low_noise",
   "Whisper a phrase down a line. The last person writes what they heard."],
  ["Blink Contest", "Observation", "mild", "30s", "Light movement", "Loud", "judge", "classroom", "classroom_low_noise",
   "Stare at your opponent without blinking. First to blink loses. Judge watches for fairness."],
  ["Posture Copycat", "Teamwork", "bold", "1m", "Seated", "Quiet", "completion_tap", "classroom", "classroom_low_noise",
   "Copy your partner's seated posture exactly. They change position, you mirror instantly."],
  ["One-Minute Doodle Relay", "Quiet creativity", "mild", "2m", "Standing", "Medium", "vote", "classroom", "classroom_low_noise",
   "Take turns adding to a group doodle. Each person gets 15 seconds to contribute."],
  ["Silent Category Sort", "Gesture", "bold", "3m", "Light movement", "Loud", "hybrid", "classroom", "classroom_low_noise",
   "Sort items into categories without speaking. Use pointing and gestures only."],
  ["Invisible Box Mime", "Memory", "mild", "30s", "Seated", "Quiet", "text", "classroom", "classroom_low_noise",
   "Mime opening, examining, and closing an invisible box. Describe what was inside."],
  ["No-Sound Commercial", "Observation", "bold", "1m", "Standing", "Medium", "judge", "classroom", "classroom_low_noise",
   "Create and perform a TV commercial using only gestures. No sounds at all."],
  ["Quiet Team Logo", "Teamwork", "mild", "2m", "Light movement", "Loud", "completion_tap", "classroom", "classroom_low_noise",
   "Design a team logo together using only hand signals to communicate ideas."],
  ["Pass the Expression", "Quiet creativity", "bold", "3m", "Seated", "Quiet", "vote", "classroom", "classroom_low_noise",
   "Pass a facial expression around the circle. It should evolve slightly with each person."],
  ["Picture Prompt Pose", "Gesture", "mild", "30s", "Standing", "Medium", "hybrid", "classroom", "classroom_low_noise",
   "Strike a pose that matches a one-word prompt. Hold it perfectly still."],
  ["Desk Pattern Memory", "Memory", "bold", "1m", "Light movement", "Loud", "text", "classroom", "classroom_low_noise",
   "Study your desk arrangement for 10 seconds. Look away and describe every item's position."],
  ["Paper Fold Race", "Observation", "mild", "2m", "Seated", "Quiet", "judge", "classroom", "classroom_low_noise",
   "Follow paper folding instructions without speaking. The judge evaluates accuracy."],
  ["Silent Charades Mini", "Teamwork", "bold", "3m", "Standing", "Medium", "completion_tap", "classroom", "classroom_low_noise",
   "Act out a word or phrase silently. Your team taps complete when they guess correctly."],
  ["Line Drawing Telephone", "Quiet creativity", "mild", "30s", "Light movement", "Loud", "vote", "classroom", "classroom_low_noise",
   "Draw a simple picture, pass it along. Each person copies what they see. Compare first and last."],
  ["Calm Reaction Face", "Gesture", "bold", "1m", "Seated", "Quiet", "hybrid", "classroom", "classroom_low_noise",
   "React to surprising statements with the calmest possible facial expression. Don't let your face give you away."],
  ["Mystery Shadow Pose", "Memory", "mild", "2m", "Standing", "Medium", "text", "classroom", "classroom_low_noise",
   "Create a shadow puppet or silhouette pose. Describe what shape you were trying to make."],
  ["Thumbs-Only Voting", "Observation", "bold", "3m", "Light movement", "Loud", "judge", "classroom", "classroom_low_noise",
   "Answer questions using only thumbs up or down. The judge interprets ambiguous gestures."],
  ["Silent Team Motto", "Teamwork", "mild", "30s", "Seated", "Quiet", "completion_tap", "classroom", "classroom_low_noise",
   "Create a team motto using only gestures. The team taps when they agree on the motto."],
  ["Quiet Scavenger Three", "Quiet creativity", "bold", "1m", "Standing", "Medium", "vote", "classroom", "classroom_low_noise",
   "Find 3 items matching a category without making noise. Display them silently."],
  ["Observe and Recall", "Gesture", "mild", "2m", "Light movement", "Loud", "hybrid", "classroom", "classroom_low_noise",
   "Study a scene for 30 seconds. Answer detailed questions about what you observed."],
  ["Card Stack Neatness", "Memory", "bold", "3m", "Seated", "Quiet", "text", "classroom", "classroom_low_noise",
   "Stack items in a precise pattern from memory. Describe your stacking strategy."],
  ["Silent Scene Builder", "Observation", "mild", "30s", "Standing", "Medium", "judge", "classroom", "classroom_low_noise",
   "Build a mini scene using desk items without making a sound. Judge evaluates creativity."],
  ["Word Ban Whisper", "Teamwork", "bold", "1m", "Light movement", "Loud", "completion_tap", "classroom", "classroom_low_noise",
   "Describe something without using banned words, speaking only in whispers."],
  ["Shape Guess Grid", "Quiet creativity", "mild", "2m", "Seated", "Quiet", "vote", "classroom", "classroom_low_noise",
   "Draw shapes in a grid pattern. Others vote on the most creative arrangement."],
  ["Calm Countdown Freeze", "Gesture", "bold", "3m", "Standing", "Medium", "hybrid", "classroom", "classroom_low_noise",
   "Count down from 10 using only finger gestures, freezing perfectly at each number."],
  ["Mini Maze Draw", "Memory", "mild", "30s", "Light movement", "Loud", "text", "classroom", "classroom_low_noise",
   "Draw a mini maze from memory after studying one for 10 seconds."],
  ["Post-it Pattern Copy", "Observation", "bold", "1m", "Seated", "Quiet", "judge", "classroom", "classroom_low_noise",
   "Recreate a pattern of colored squares from memory. Judge scores accuracy."],
  ["Stillest Team Wins", "Teamwork", "mild", "2m", "Standing", "Medium", "completion_tap", "classroom", "classroom_low_noise",
   "Entire team must stay completely still. Last team with everyone frozen wins."],
  ["Object Order Recall", "Quiet creativity", "bold", "3m", "Light movement", "Loud", "vote", "classroom", "classroom_low_noise",
   "Memorize a sequence of objects, then recreate the order. Crowd votes on accuracy."],
  ["Desk Spot the Change", "Gesture", "mild", "30s", "Seated", "Quiet", "hybrid", "classroom", "classroom_low_noise",
   "Someone changes one thing on their desk. Spot the difference without speaking."],
  ["Quiet Compliment Match", "Memory", "bold", "1m", "Standing", "Medium", "text", "classroom", "classroom_low_noise",
   "Write anonymous compliments and match each one to its author."],
  ["Slow Gesture Story", "Observation", "mild", "2m", "Light movement", "Loud", "judge", "classroom", "classroom_low_noise",
   "Tell a story using only ultra-slow hand gestures. The judge evaluates how clear the narrative is."],

  // ═══════════════════════════════════════════
  // OFFICE FUN (112-171)
  // ═══════════════════════════════════════════
  ["Desk Safari Dash", "Creativity", "social", "30s", "Seated", "Quiet", "judge", "office", "office_fun",
   "Arrange desk items to create a 'safari animal' in 30 seconds. Judge scores creativity and resemblance."],
  ["Luxury Stapler Pitch", "Culture", "balanced", "1m", "Standing", "Medium", "completion_tap", "office", "office_fun",
   "Pitch your office stapler as a luxury fashion accessory. Use your best influencer energy."],
  ["Emoji Project Update", "Communication", "social", "2m", "Light movement", "Loud", "vote", "office", "office_fun",
   "Give your weekly project update using only emoji descriptions. Others vote on clarity."],
  ["Office Mascot Reveal", "Teamwork", "balanced", "3m", "Seated", "Quiet", "hybrid", "office", "office_fun",
   "Design and present your department's new official mascot using only office supplies."],
  ["PowerPoint Karaoke Lite", "Presentation", "social", "30s", "Standing", "Medium", "text", "office", "office_fun",
   "Present a random slide you've never seen as if you prepared it. Describe your approach."],
  ["Fake Product Launch", "Creativity", "balanced", "1m", "Light movement", "Loud", "judge", "office", "office_fun",
   "Launch a fake product that 'solves' a made-up office problem. Full marketing pitch required."],
  ["Reverse Brainstorm", "Culture", "social", "2m", "Seated", "Quiet", "completion_tap", "office", "office_fun",
   "Think of the worst ideas possible for a prompt. The more terrible, the better."],
  ["Meeting Buzzword Translator", "Communication", "balanced", "3m", "Standing", "Medium", "vote", "office", "office_fun",
   "Translate common meeting phrases into what they actually mean. Crowd votes for most accurate."],
  ["Team News Desk", "Teamwork", "social", "30s", "Light movement", "Loud", "hybrid", "office", "office_fun",
   "Create a 30-second news broadcast about something that happened in the office this week."],
  ["Two-Minute Ad Agency", "Presentation", "balanced", "1m", "Seated", "Quiet", "text", "office", "office_fun",
   "Create an ad campaign for your team in 60 seconds. Write the tagline and pitch."],
  ["Mystery Client Pitch", "Creativity", "social", "2m", "Standing", "Medium", "judge", "office", "office_fun",
   "Pitch a mystery product to a mystery client. You make up both on the spot."],
  ["Celebrate Like You Closed the Deal", "Culture", "balanced", "3m", "Light movement", "Loud", "completion_tap", "office", "office_fun",
   "Celebrate an imaginary deal closure with maximum enthusiasm. Go big or go home."],
  ["Desk Item Redesign", "Communication", "social", "30s", "Seated", "Quiet", "vote", "office", "office_fun",
   "Propose a redesign for a common desk item. What would version 2.0 look like?"],
  ["Jargon Jar", "Teamwork", "balanced", "1m", "Standing", "Medium", "hybrid", "office", "office_fun",
   "Explain your job without using any industry jargon. Simple language only!"],
  ["Fastest Team Motto", "Presentation", "social", "2m", "Light movement", "Loud", "text", "office", "office_fun",
   "Create the catchiest team motto in 2 minutes. It must rhyme or have a rhythm."],
  ["Office Olympics Oath", "Creativity", "balanced", "3m", "Seated", "Quiet", "judge", "office", "office_fun",
   "Write and dramatically recite an Olympic-style oath for the office games."],
  ["Coffee Cup Commercial", "Culture", "social", "30s", "Standing", "Medium", "completion_tap", "office", "office_fun",
   "Create a 30-second commercial for your coffee mug. Product placement at its finest."],
  ["Best Bad Idea", "Communication", "balanced", "1m", "Light movement", "Loud", "vote", "office", "office_fun",
   "Pitch the best intentionally terrible idea for improving the office."],
  ["Calendar Catastrophe Fix", "Teamwork", "social", "2m", "Seated", "Quiet", "hybrid", "office", "office_fun",
   "You have a calendar disaster -- 5 meetings at once. Present your creative solution."],
  ["Mini Stand-Up About Meetings", "Presentation", "balanced", "3m", "Standing", "Medium", "text", "office", "office_fun",
   "Perform a clean mini stand-up comedy set about meetings. Write your best material."],
  ["Mystery Sound Guess", "Creativity", "social", "30s", "Light movement", "Loud", "judge", "office", "office_fun",
   "Make an office-related sound effect. Others must guess what office scenario you're depicting."],
  ["One-Slide Story", "Culture", "balanced", "1m", "Seated", "Quiet", "completion_tap", "office", "office_fun",
   "Tell a complete story that would fit on exactly one presentation slide."],
  ["Speed Networking Twist", "Communication", "social", "2m", "Standing", "Medium", "vote", "office", "office_fun",
   "Network with someone but you can only talk about fictional achievements."],
  ["Recognition Relay", "Teamwork", "balanced", "3m", "Light movement", "Loud", "hybrid", "office", "office_fun",
   "Give genuine rapid-fire recognition to team members. Each must be unique and specific."],
  ["Mood Meter Check-In", "Presentation", "social", "30s", "Seated", "Quiet", "text", "office", "office_fun",
   "Describe your current mood using only weather metaphors. Partly cloudy with a chance of coffee."],
  ["Office Talent Flash", "Creativity", "balanced", "1m", "Standing", "Medium", "judge", "office", "office_fun",
   "Reveal a hidden talent that your coworkers don't know about. Could be real or hilariously fake."],
  ["Weirdly Formal Introduction", "Culture", "social", "2m", "Light movement", "Loud", "completion_tap", "office", "office_fun",
   "Introduce yourself to someone you already know as if meeting a foreign dignitary."],
  ["Tiny Debate Club", "Communication", "balanced", "3m", "Seated", "Quiet", "vote", "office", "office_fun",
   "Debate a trivial office topic with full parliamentary procedure. 'Is the kitchen everyone's responsibility?'"],
  ["Blind Sketch Brief", "Teamwork", "social", "30s", "Standing", "Medium", "hybrid", "office", "office_fun",
   "One person describes, another draws without seeing the original. Compare results."],
  ["Emoji Policy Rewrite", "Presentation", "balanced", "1m", "Light movement", "Loud", "text", "office", "office_fun",
   "Rewrite a boring office policy using only emojis. Then read it back 'translated.'"],
  ["Unexpected CEO Announcement", "Creativity", "social", "2m", "Seated", "Quiet", "judge", "office", "office_fun",
   "You're the CEO. Make an unexpected but positive company announcement that surprises everyone."],
  ["Desk Detective", "Culture", "balanced", "3m", "Standing", "Medium", "completion_tap", "office", "office_fun",
   "Study someone's desk area and deduce 3 things about their personality. Present findings."],
  ["Mission Statement Remix", "Communication", "social", "30s", "Light movement", "Loud", "vote", "office", "office_fun",
   "Remix the company mission statement into a catchy jingle or rap."],
  ["Meeting in Movie Trailer Voice", "Teamwork", "balanced", "1m", "Seated", "Quiet", "hybrid", "office", "office_fun",
   "Read the next meeting agenda in an epic movie trailer voice."],
  ["Startup Name Roulette", "Presentation", "social", "2m", "Standing", "Medium", "text", "office", "office_fun",
   "Generate startup names by combining random office words. Pitch the best one."],
  ["Compliment Cascade", "Creativity", "balanced", "3m", "Light movement", "Loud", "judge", "office", "office_fun",
   "Give rapid-fire genuine compliments to as many people as possible. Judge scores sincerity."],
  ["Product Demo in 30 Seconds", "Culture", "social", "30s", "Seated", "Quiet", "completion_tap", "office", "office_fun",
   "Demo any product (real or imaginary) in exactly 30 seconds. Time management matters!"],
  ["Office Tour Gone Wrong", "Communication", "balanced", "1m", "Standing", "Medium", "vote", "office", "office_fun",
   "Give an office tour where everything goes hilariously wrong. 'And here's the printer, which has been on fire since 2019.'"],
  ["Brainstorm Storm", "Teamwork", "social", "2m", "Light movement", "Loud", "hybrid", "office", "office_fun",
   "Generate as many ideas as possible for a silly prompt. Quantity over quality."],
  ["Trophy Speech", "Presentation", "balanced", "3m", "Seated", "Quiet", "text", "office", "office_fun",
   "Accept an imaginary trophy for 'Best at Something Ridiculous.' Write your speech."],
  ["Mystery Object Negotiation", "Creativity", "social", "30s", "Standing", "Medium", "judge", "office", "office_fun",
   "Negotiate a trade for an unknown item hidden behind your back. Judge scores persuasion."],
  ["The Polite Roast of a Process", "Culture", "balanced", "1m", "Light movement", "Loud", "completion_tap", "office", "office_fun",
   "Roast an annoying office process with witty, polite humor. Keep it professional and funny."],
  ["Two Truths and a Workplace Myth", "Communication", "social", "2m", "Seated", "Quiet", "vote", "office", "office_fun",
   "Share two true work stories and one fake one. Others vote on which is the myth."],
  ["Cross-Team Translator", "Teamwork", "balanced", "3m", "Standing", "Medium", "hybrid", "office", "office_fun",
   "Translate another team's jargon into plain English. Bonus points for accuracy."],
  ["Elevator Pitch Roulette", "Presentation", "social", "30s", "Light movement", "Loud", "text", "office", "office_fun",
   "Deliver an elevator pitch for a random idea generated on the spot."],
  ["Fast Facilitation Face-Off", "Creativity", "balanced", "1m", "Seated", "Quiet", "judge", "office", "office_fun",
   "Facilitate a mini-discussion in 60 seconds. Judge scores structure and engagement."],
  ["Sticky Note Sprint", "Culture", "social", "2m", "Standing", "Medium", "completion_tap", "office", "office_fun",
   "Write as many creative sticky notes as possible in 2 minutes. Each must be unique."],
  ["Idea Auction", "Communication", "balanced", "3m", "Light movement", "Loud", "vote", "office", "office_fun",
   "Auction off your ideas to the room. Others bid with enthusiasm instead of money."],
  ["Break Room Makeover Pitch", "Teamwork", "social", "30s", "Seated", "Quiet", "hybrid", "office", "office_fun",
   "Pitch a dream break room redesign in 30 seconds. Think big, think creative."],
  ["Email Rewrite Rescue", "Presentation", "balanced", "1m", "Standing", "Medium", "text", "office", "office_fun",
   "Rewrite a boring email to make it exciting and engaging. Share before and after."],
  ["Status Update Song", "Creativity", "social", "2m", "Light movement", "Loud", "judge", "office", "office_fun",
   "Sing your project status update to the tune of a well-known song."],
  ["Workstyle Guess Who", "Culture", "balanced", "3m", "Seated", "Quiet", "completion_tap", "office", "office_fun",
   "Describe someone's workstyle without naming them. Others guess who it is."],
  ["Fake Award Host", "Communication", "social", "30s", "Standing", "Medium", "vote", "office", "office_fun",
   "Host a fake awards ceremony. Present ridiculous categories with real enthusiasm."],
  ["Customer Journey Freeze Frame", "Teamwork", "balanced", "1m", "Light movement", "Loud", "hybrid", "office", "office_fun",
   "Act out a customer journey in 3 frozen poses. Team coordinates silently."],
  ["Rapid Reaction Panel", "Presentation", "social", "2m", "Seated", "Quiet", "text", "office", "office_fun",
   "React to hypothetical office scenarios with your immediate gut response."],
  ["Meeting Mime", "Creativity", "balanced", "3m", "Standing", "Medium", "judge", "office", "office_fun",
   "Act out an entire meeting using only mime. Judge scores recognizability."],
  ["Desk Olympics Opening Ceremony", "Culture", "social", "30s", "Light movement", "Loud", "completion_tap", "office", "office_fun",
   "Perform a dramatic opening ceremony using only items at your desk."],
  ["Innovation Mash-Up", "Communication", "balanced", "1m", "Seated", "Quiet", "vote", "office", "office_fun",
   "Combine two unrelated products to create an innovation. Others vote on feasibility."],
  ["Positive Spin Challenge", "Teamwork", "social", "2m", "Standing", "Medium", "hybrid", "office", "office_fun",
   "Take a common workplace complaint and put the most positive spin on it possible."],
  ["One-Minute Team Chant", "Presentation", "balanced", "3m", "Light movement", "Loud", "text", "office", "office_fun",
   "Create and perform a team chant that captures your department's spirit."],

  // ═══════════════════════════════════════════
  // OFFICE PROFESSIONAL (172-221)
  // ═══════════════════════════════════════════
  ["Value in Action", "Communication", "balanced", "30s", "Seated", "Quiet", "judge", "office", "office_professional",
   "Describe a moment when you saw a company value in action. Be specific and concise."],
  ["Explain It Simply", "Leadership", "professional", "1m", "Standing", "Medium", "completion_tap", "office", "office_professional",
   "Explain a complex work concept so a 10-year-old would understand it."],
  ["Problem Statement Slam", "Innovation", "balanced", "2m", "Light movement", "Loud", "vote", "office", "office_professional",
   "Frame a workplace challenge as a clear, compelling problem statement."],
  ["Customer Empathy Minute", "Problem-solving", "professional", "3m", "Seated", "Quiet", "hybrid", "office", "office_professional",
   "Describe a customer's experience from their perspective. Walk in their shoes."],
  ["Recognition Lightning Round", "Recognition", "balanced", "30s", "Standing", "Medium", "text", "office", "office_professional",
   "Recognize a colleague's contribution in under 30 seconds. Be genuine and specific."],
  ["Listening Loop", "Communication", "professional", "1m", "Light movement", "Loud", "judge", "office", "office_professional",
   "Listen to a statement, then repeat it back with your interpretation. Accuracy matters."],
  ["Build the Agenda", "Leadership", "balanced", "2m", "Seated", "Quiet", "completion_tap", "office", "office_professional",
   "Create the most efficient meeting agenda for a complex topic in 2 minutes."],
  ["Better Brief Challenge", "Innovation", "professional", "3m", "Standing", "Medium", "vote", "office", "office_professional",
   "Improve a vague project brief into a clear, actionable document."],
  ["Priority Ladder", "Problem-solving", "balanced", "30s", "Light movement", "Loud", "hybrid", "office", "office_professional",
   "Rank 5 tasks by priority and justify your ordering in 30 seconds."],
  ["One-Minute Facilitation", "Recognition", "professional", "1m", "Seated", "Quiet", "text", "office", "office_professional",
   "Facilitate a group discussion on a prompt for exactly one minute. Manage the time."],
  ["Whiteboard War", "Communication", "balanced", "2m", "Standing", "Medium", "judge", "office", "office_professional",
   "Explain a concept using only a whiteboard drawing. No words on the board."],
  ["Solution Sprint", "Leadership", "professional", "3m", "Light movement", "Loud", "completion_tap", "office", "office_professional",
   "Propose a structured solution to a given problem. Framework and steps required."],
  ["Decision Defense", "Innovation", "balanced", "30s", "Seated", "Quiet", "vote", "office", "office_professional",
   "Defend a decision you've made using clear reasoning in under 30 seconds."],
  ["Redesign the Workflow", "Problem-solving", "professional", "1m", "Standing", "Medium", "hybrid", "office", "office_professional",
   "Identify one workflow inefficiency and propose a practical improvement."],
  ["Project Handover Clarity", "Recognition", "balanced", "2m", "Light movement", "Loud", "text", "office", "office_professional",
   "Practice a clear project handover. Cover status, next steps, and key contacts."],
  ["Meeting Summary Showdown", "Communication", "professional", "3m", "Seated", "Quiet", "judge", "office", "office_professional",
   "Summarize a complex discussion in 3 clear bullet points. Judge evaluates clarity."],
  ["Innovation Lightning Board", "Leadership", "balanced", "30s", "Standing", "Medium", "completion_tap", "office", "office_professional",
   "Sketch an innovative idea on an imaginary whiteboard in 30 seconds."],
  ["Presentation Precision", "Innovation", "professional", "1m", "Light movement", "Loud", "vote", "office", "office_professional",
   "Deliver a key message in exactly 3 sentences. Not 2, not 4. Exactly 3."],
  ["Case Study Snapshot", "Problem-solving", "balanced", "2m", "Seated", "Quiet", "hybrid", "office", "office_professional",
   "Analyze a brief case study and present your key insight."],
  ["Calm Crisis Drill", "Recognition", "professional", "3m", "Standing", "Medium", "text", "office", "office_professional",
   "A crisis just happened. Write your calm, structured response plan."],
  ["Feedback Framing", "Communication", "balanced", "30s", "Light movement", "Loud", "judge", "office", "office_professional",
   "Reframe critical feedback into constructive, actionable guidance."],
  ["Mission in Plain Language", "Leadership", "professional", "1m", "Seated", "Quiet", "completion_tap", "office", "office_professional",
   "Translate the company mission into plain, everyday language."],
  ["Role Swap Explanation", "Innovation", "balanced", "2m", "Standing", "Medium", "vote", "office", "office_professional",
   "Explain your role as if you're in a completely different industry."],
  ["Smart Question Challenge", "Problem-solving", "professional", "3m", "Light movement", "Loud", "hybrid", "office", "office_professional",
   "Ask the smartest question you can about a given topic. Quality over quantity."],
  ["Values Match Round", "Recognition", "balanced", "30s", "Seated", "Quiet", "text", "office", "office_professional",
   "Match colleagues to company values based on their actions. Explain your choices."],
  ["Onboarding Guide Mini", "Communication", "professional", "1m", "Standing", "Medium", "judge", "office", "office_professional",
   "Create a 60-second onboarding guide for a new team member."],
  ["Department Translator", "Leadership", "balanced", "2m", "Light movement", "Loud", "completion_tap", "office", "office_professional",
   "Translate another department's priorities into your team's language."],
  ["Process Map Sprint", "Innovation", "professional", "3m", "Seated", "Quiet", "vote", "office", "office_professional",
   "Map out a process in 3 minutes. Identify bottlenecks and improvements."],
  ["Customer Complaint Response", "Problem-solving", "balanced", "30s", "Standing", "Medium", "hybrid", "office", "office_professional",
   "Respond to a customer complaint with empathy and a solution in 30 seconds."],
  ["Risk Radar Round", "Recognition", "professional", "1m", "Light movement", "Loud", "text", "office", "office_professional",
   "Identify potential risks in a project scenario. List mitigation strategies."],
  ["Pitch With Constraints", "Communication", "balanced", "2m", "Seated", "Quiet", "judge", "office", "office_professional",
   "Pitch an idea with specific constraints (e.g., no budget, only 1 person, 1 week deadline)."],
  ["Recognition Story", "Leadership", "professional", "3m", "Standing", "Medium", "completion_tap", "office", "office_professional",
   "Tell a recognition story that highlights someone's impact. Specific examples required."],
  ["Insight in 60 Seconds", "Innovation", "balanced", "30s", "Light movement", "Loud", "vote", "office", "office_professional",
   "Share your most valuable professional insight in exactly 60 seconds."],
  ["Obstacle and Option", "Problem-solving", "professional", "1m", "Seated", "Quiet", "hybrid", "office", "office_professional",
   "Name an obstacle your team faces and propose two realistic options to address it."],
  ["Workshop Energizer Lite", "Recognition", "balanced", "2m", "Standing", "Medium", "text", "office", "office_professional",
   "Design and lead a 2-minute workshop energizer that gets everyone focused."],
  ["Data Without Jargon", "Communication", "professional", "3m", "Light movement", "Loud", "judge", "office", "office_professional",
   "Present data findings without using any technical terms. Make it accessible."],
  ["Leadership Scenario", "Leadership", "balanced", "30s", "Seated", "Quiet", "completion_tap", "office", "office_professional",
   "React to a leadership scenario prompt with your immediate action plan."],
  ["What Matters Most", "Innovation", "professional", "1m", "Standing", "Medium", "vote", "office", "office_professional",
   "Identify the single most important thing to focus on right now and explain why."],
  ["Team Charter Builder", "Problem-solving", "balanced", "2m", "Light movement", "Loud", "hybrid", "office", "office_professional",
   "Draft key elements of a team charter: purpose, values, working agreements."],
  ["Decision Tree Duel", "Recognition", "professional", "3m", "Seated", "Quiet", "text", "office", "office_professional",
   "Create a simple decision tree for a common workplace scenario."],
  ["Update for Executives", "Communication", "balanced", "30s", "Standing", "Medium", "judge", "office", "office_professional",
   "Deliver a project update tailored for executive audience. Bottom line up front."],
  ["Update for New Starters", "Leadership", "professional", "1m", "Light movement", "Loud", "completion_tap", "office", "office_professional",
   "Explain what your team does in a way that would excite a new starter."],
  ["Trade-Off Table Talk", "Innovation", "balanced", "2m", "Seated", "Quiet", "vote", "office", "office_professional",
   "Present a trade-off decision and argue for your preferred option."],
  ["Facilitator Reset", "Problem-solving", "professional", "3m", "Standing", "Medium", "hybrid", "office", "office_professional",
   "A meeting has gone off track. Demonstrate how you'd get it back on course."],
  ["Goal Clarity Round", "Recognition", "balanced", "30s", "Light movement", "Loud", "text", "office", "office_professional",
   "State a goal so clearly that anyone could measure progress against it."],
  ["Win Story With Structure", "Communication", "professional", "1m", "Seated", "Quiet", "judge", "office", "office_professional",
   "Share a recent win using the Situation-Action-Result framework."],
  ["Polish the Message", "Leadership", "balanced", "2m", "Standing", "Medium", "completion_tap", "office", "office_professional",
   "Take a rough message draft and polish it into a clear communication."],
  ["Office Values Awards", "Innovation", "professional", "3m", "Light movement", "Loud", "vote", "office", "office_professional",
   "Nominate and argue for who deserves a 'values champion' award."],
  ["Stakeholder Lens", "Problem-solving", "balanced", "30s", "Seated", "Quiet", "hybrid", "office", "office_professional",
   "View a decision from three different stakeholder perspectives."],
  ["Clarity Under Pressure", "Recognition", "professional", "1m", "Standing", "Medium", "text", "office", "office_professional",
   "Communicate a clear message under simulated time pressure."],

  // ═══════════════════════════════════════════
  // UNIVERSAL CROWD-PLEASERS (222-250)
  // ═══════════════════════════════════════════
  ["Human Logo Build", "Teamwork", "balanced", "30s", "Seated", "Quiet", "judge", "universal", "universal",
   "Work with your team to form a recognizable logo shape using your bodies."],
  ["One-Word Story Sprint", "Improv", "social", "1m", "Standing", "Medium", "completion_tap", "universal", "universal",
   "Build a story where each person adds exactly one word. Keep it going for 60 seconds!"],
  ["Reverse Charades", "Creativity", "bold", "2m", "Light movement", "Loud", "vote", "universal", "universal",
   "One person guesses while everyone else acts out the clue together."],
  ["Compliment Chain", "Communication", "balanced", "3m", "Seated", "Quiet", "hybrid", "universal", "universal",
   "Start a chain where each person compliments the next. Each must be genuine and unique."],
  ["Theme Song Remix", "Teamwork", "social", "30s", "Standing", "Medium", "text", "universal", "universal",
   "Create a theme song for your team in 30 seconds. Write the lyrics!"],
  ["Object Sales Pitch", "Improv", "bold", "1m", "Light movement", "Loud", "judge", "universal", "universal",
   "Grab any nearby object and sell it like it's the most important invention ever."],
  ["Team Tableaux", "Creativity", "balanced", "2m", "Seated", "Quiet", "completion_tap", "universal", "universal",
   "Create a frozen scene as a team that tells a story. Hold it perfectly."],
  ["News Desk Challenge", "Communication", "social", "3m", "Standing", "Medium", "vote", "universal", "universal",
   "Deliver breaking news about something that just happened in the room."],
  ["Motto Builder", "Teamwork", "bold", "30s", "Light movement", "Loud", "hybrid", "universal", "universal",
   "Create a team motto in 30 seconds that everyone can get behind."],
  ["Mystery Mood Walk", "Improv", "balanced", "1m", "Seated", "Quiet", "text", "universal", "universal",
   "Walk in a way that expresses a secret emotion. Others must guess what it is."],
  ["Draw and Guess", "Creativity", "social", "2m", "Standing", "Medium", "judge", "universal", "universal",
   "Draw a prompt without using letters or numbers. Others guess what it is."],
  ["Celebrity Voice Maybe", "Communication", "bold", "3m", "Light movement", "Loud", "completion_tap", "universal", "universal",
   "Read a paragraph in what you think a celebrity sounds like. Commitment is key."],
  ["Golden Award Speech", "Teamwork", "balanced", "30s", "Seated", "Quiet", "vote", "universal", "universal",
   "Give a 30-second award speech for winning 'Best at Something Unexpected.'"],
  ["Emoji Scene Builder", "Improv", "social", "1m", "Standing", "Medium", "hybrid", "universal", "universal",
   "Act out a scene using only emoji-style expressions and movements."],
  ["Best Team Entrance", "Creativity", "bold", "2m", "Light movement", "Loud", "text", "universal", "universal",
   "Design and perform the most epic team entrance. Describe your vision."],
  ["Silent Ranking", "Communication", "balanced", "3m", "Seated", "Quiet", "judge", "universal", "universal",
   "Rank a set of items by group consensus without speaking. Use only gestures."],
  ["Tiny TED Topic", "Teamwork", "social", "30s", "Standing", "Medium", "completion_tap", "universal", "universal",
   "Give a 30-second TED-style talk on any topic you choose."],
  ["Worst Idea Wins", "Improv", "bold", "1m", "Light movement", "Loud", "vote", "universal", "universal",
   "Pitch the worst possible solution to a problem. The worse, the better!"],
  ["Fast Facts Face-Off", "Creativity", "balanced", "2m", "Seated", "Quiet", "hybrid", "universal", "universal",
   "Share rapid-fire fun facts. Others decide if they're true or made up."],
  ["Story Ending Save", "Communication", "social", "3m", "Standing", "Medium", "text", "universal", "universal",
   "A story is going off the rails. Write the ending that saves it."],
  ["Mascot Creation", "Teamwork", "bold", "30s", "Light movement", "Loud", "judge", "universal", "universal",
   "Design a team mascot using only words and gestures. Judge evaluates creativity."],
  ["Three-Clue Guess", "Improv", "balanced", "1m", "Seated", "Quiet", "completion_tap", "universal", "universal",
   "Give three clues about something. Others must guess with each progressively easier clue."],
  ["Pass the Sound", "Creativity", "social", "2m", "Standing", "Medium", "vote", "universal", "universal",
   "Pass a sound effect around the circle, evolving it slightly each time."],
  ["No-Context Presentation", "Communication", "bold", "3m", "Light movement", "Loud", "hybrid", "universal", "universal",
   "Present a slide or topic with zero context. Make it work anyway."],
  ["Visual Pitch Sprint", "Teamwork", "balanced", "30s", "Seated", "Quiet", "text", "universal", "universal",
   "Pitch an idea using only drawings or visual aids. Describe your pitch."],
  ["Team Handshake Safe", "Improv", "social", "1m", "Standing", "Medium", "judge", "universal", "universal",
   "Create a unique team handshake that everyone can perform together."],
  ["Hero Pose Finish", "Creativity", "bold", "2m", "Light movement", "Loud", "completion_tap", "universal", "universal",
   "Strike your most heroic pose as a team finale. Go epic!"],
  ["Mystery Prompt Debate", "Communication", "balanced", "3m", "Seated", "Quiet", "vote", "universal", "universal",
   "Debate a mystery topic revealed at the last second. Adapt on the fly."],
  ["Reaction Face Relay", "Teamwork", "social", "30s", "Standing", "Medium", "hybrid", "universal", "universal",
   "Pass a reaction from person to person. Each must add more intensity."],

  // ═══════════════════════════════════════════
  // KIDS HIGH-ENERGY (singing, dancing, jumping, running, etc.)
  // ═══════════════════════════════════════════
  ["Dance Battle Showdown", "Performance", "bold", "1m", "Standing", "Loud", "judge", "classroom", "recess_riot",
   "Show off your wildest dance moves! You have 60 seconds to bust out every move you know. The crazier the better -- the host picks the champion dancer!"],
  ["Freeze Dance Frenzy", "Performance", "chaos", "1m", "Standing", "Loud", "completion_tap", "classroom", "recess_riot",
   "Dance as hard as you can, then FREEZE when the host says stop! If you wobble, you're out. Last one standing wins. Tap when you've been eliminated."],
  ["Silly Walk Race", "Performance", "bold", "30s", "Light movement", "Loud", "judge", "classroom", "recess_riot",
   "Race across the room using the silliest walk you can invent. Bonus points for sound effects! No normal walking allowed."],
  ["Jump Like A...", "Improv", "mild", "30s", "Standing", "Medium", "judge", "classroom", "recess_riot",
   "The host names an animal and you have to jump like that animal! Frog jumps, kangaroo hops, bunny bounces -- commit to the character!"],
  ["Musical Statues", "Performance", "mild", "1m", "Standing", "Loud", "completion_tap", "classroom", "recess_riot",
   "Dance around the room and freeze in the funniest pose when the host claps. Hold your pose without laughing! Tap complete when you survive."],
  ["Karaoke King", "Performance", "chaos", "1m", "Standing", "Loud", "judge", "classroom", "recess_riot",
   "Sing your favourite song as loudly and dramatically as possible! Add dance moves, air guitar, dramatic drops to your knees -- full pop star mode!"],
  ["The Floor Is Lava!", "Performance", "bold", "30s", "Light movement", "Loud", "completion_tap", "classroom", "recess_riot",
   "When the host yells GO, get off the floor! Stand on your chair, jump on a desk, climb on anything safe. Last one still on the floor loses!"],
  ["Invisible Jump Rope", "Performance", "mild", "30s", "Standing", "Medium", "completion_tap", "classroom", "recess_riot",
   "Jump rope with an invisible rope! Count your jumps out loud. Try to do as many as possible in 30 seconds without tripping on your invisible rope."],
  ["Animal Dance Party", "Improv", "chaos", "1m", "Standing", "Loud", "vote", "classroom", "recess_riot",
   "Pick your favourite animal and dance the way that animal would dance at a party. A chicken doing the cha-cha? A bear doing ballet? Go wild!"],
  ["Speed Clap Challenge", "Performance", "mild", "30s", "Seated", "Loud", "completion_tap", "classroom", "recess_riot",
   "Clap as fast as you possibly can for 30 seconds! Try different clap styles -- overhead claps, behind-your-back claps, spinning claps!"],
  ["Sing Everything You Say", "Improv", "bold", "2m", "Seated", "Loud", "judge", "classroom", "recess_riot",
   "For the next 2 minutes, you cannot speak -- you must SING everything. Answer questions, have conversations, but every word must be sung like an opera!"],
  ["Hop Scotch Relay", "Teamwork", "bold", "1m", "Light movement", "Medium", "completion_tap", "classroom", "recess_riot",
   "Hop on one foot from one end of the room to the other and back! Switch feet halfway. Tap complete when you make it back."],
  ["Crab Walk Race", "Performance", "chaos", "30s", "Light movement", "Loud", "completion_tap", "classroom", "recess_riot",
   "Get into crab walk position and race across the room! Hands and feet on the ground, belly facing up. First one across wins!"],
  ["Shake It Off", "Performance", "mild", "30s", "Standing", "Medium", "completion_tap", "classroom", "recess_riot",
   "Shake every part of your body as fast as you can! Start with your hands, then arms, then legs, then your whole body. Get ALL the wiggles out!"],
  ["Air Guitar Hero", "Performance", "bold", "1m", "Standing", "Loud", "judge", "classroom", "recess_riot",
   "Perform the most epic air guitar solo of all time! Include windmill strums, knee slides, and a dramatic guitar smash at the end."],
  ["Balloon Pop Dance", "Performance", "chaos", "1m", "Standing", "Loud", "completion_tap", "classroom", "recess_riot",
   "Dance with an imaginary balloon between your knees. Don't let it 'pop'! If you stop dancing, the balloon pops and you're out."],
  ["Singing Bee Spelling", "Creativity", "bold", "1m", "Seated", "Loud", "judge", "classroom", "recess_riot",
   "The host gives you a word and you have to spell it by SINGING each letter as a different note. Make it a catchy tune!"],
  ["Superhero Landing Contest", "Performance", "chaos", "30s", "Standing", "Loud", "judge", "classroom", "recess_riot",
   "Do the most dramatic superhero landing you can! Jump, crouch, slam your fist on the ground, and look up slowly. The host scores your epic-ness!"],
  ["Penguin Waddle Race", "Performance", "mild", "30s", "Light movement", "Medium", "completion_tap", "classroom", "recess_riot",
   "Put something between your knees (or pretend to) and waddle across the room like a penguin! First penguin across wins."],
  ["Disco Fever", "Performance", "bold", "1m", "Standing", "Loud", "vote", "classroom", "recess_riot",
   "Hit your best disco moves! Point to the sky, point to the floor, do the hustle, spin around. The crowd votes for the grooviest dancer!"],
  ["Tongue Twister Sing-Along", "Performance", "chaos", "1m", "Seated", "Loud", "judge", "classroom", "recess_riot",
   "Sing a tongue twister as fast as you can to any tune you want! 'She sells seashells' to the tune of Jingle Bells? The messier the better!"],
  ["Giant Steps Challenge", "Performance", "mild", "30s", "Light movement", "Medium", "completion_tap", "classroom", "recess_riot",
   "Cross the room in the FEWEST steps possible. Take the biggest, most dramatic giant steps you can. Count them out loud!"],
  ["Rock Star Stage Dive", "Performance", "legend", "1m", "Standing", "Loud", "judge", "classroom", "recess_riot",
   "Perform like you're headlining a concert! Sing, jump, crowd surf (gently!), throw up the horns. End with a dramatic mic drop."],
  ["Speed Skipper", "Performance", "bold", "30s", "Standing", "Medium", "completion_tap", "classroom", "recess_riot",
   "Skip around the room as fast as you can! Not running -- SKIPPING. See how many laps you can do in 30 seconds."],
  ["Musical Chairs Freeze", "Performance", "chaos", "1m", "Light movement", "Loud", "completion_tap", "classroom", "recess_riot",
   "Walk around the room dancing, and when the host claps, sit in the nearest chair! No chair? You're out! Tap complete when eliminated."],
  ["Stomping Beat Machine", "Creativity", "bold", "1m", "Standing", "Loud", "judge", "classroom", "recess_riot",
   "Create a beat using ONLY stomps, claps, and your voice! Layer them together to build the sickest beat. Everyone joins in on the rhythm!"],
  ["Limbo Time", "Performance", "mild", "1m", "Standing", "Medium", "completion_tap", "classroom", "recess_riot",
   "How low can you go? Lean back and try to go under the imaginary limbo bar! Each round it gets lower. Tap complete when you survive."],
  ["Crazy Chicken Dance", "Performance", "chaos", "30s", "Standing", "Loud", "vote", "classroom", "recess_riot",
   "Do the chicken dance but make it YOUR OWN. Add flips, add spins, add drama. The crowd votes for the best remix of the chicken dance!"],
  ["Whisper Song Guess", "Improv", "mild", "1m", "Seated", "Quiet", "text", "classroom", "recess_riot",
   "Whisper-sing a famous song and see if others can guess it! Type the song name after performing. Make it tricky!"],
  ["Bounce House Energy", "Performance", "chaos", "30s", "Standing", "Loud", "completion_tap", "classroom", "recess_riot",
   "Bounce in place like you're in a bounce house! Jump as high as you can, spin in the air, and keep bouncing for 30 seconds straight!"],
  ["March of the Ants", "Teamwork", "mild", "1m", "Light movement", "Medium", "completion_tap", "classroom", "recess_riot",
   "Everyone marches around the room in a line like ants! Follow the leader, copy their marching style. When the host says switch, the back person leads!"],
  ["Soundtrack Sprint", "Improv", "bold", "30s", "Light movement", "Loud", "judge", "classroom", "recess_riot",
   "Run in slow motion across the room while singing your own dramatic soundtrack! 'Dun dun DUNNN!' The host judges the best movie moment."],
  ["Wiggle Worm", "Performance", "mild", "30s", "Standing", "Medium", "completion_tap", "classroom", "recess_riot",
   "Wiggle every part of your body from head to toe like a worm! Start at the top and let the wiggle travel all the way down to your feet."],
  ["Ninja Pose Battle", "Performance", "bold", "30s", "Standing", "Medium", "judge", "classroom", "recess_riot",
   "Strike ninja poses as fast as you can! Each pose must be different. Throw kicks, chops, and blocks in rapid fire. Most poses in 30 seconds wins!"],
  ["Opera Singer Challenge", "Performance", "legend", "1m", "Standing", "Loud", "judge", "classroom", "recess_riot",
   "Sing your lunch order like a dramatic opera singer! Belt it out with passion, vibrato, and dramatic hand gestures. PIZZAAA SLIIICE!"],
  ["Leapfrog Countdown", "Teamwork", "chaos", "1m", "Light movement", "Loud", "completion_tap", "classroom", "recess_riot",
   "Everyone does jumping jacks while counting down from 20 together! Speed up as you go. If the group finishes together, everyone wins!"],
  ["Wacky Workout", "Performance", "bold", "1m", "Standing", "Loud", "judge", "classroom", "recess_riot",
   "Invent the most ridiculous exercise move ever and teach it to the class! Give it a funny name and demonstrate with full energy."],
  ["Beatbox Battle", "Creativity", "chaos", "1m", "Seated", "Loud", "judge", "classroom", "recess_riot",
   "Drop your best beatbox! Boots and cats and boots and cats -- or invent your own sounds. Layer in some scratch effects and bass drops!"],
  ["Victory Lap", "Performance", "mild", "30s", "Light movement", "Loud", "completion_tap", "classroom", "recess_riot",
   "Run a victory lap around the room with your arms in the air like you just won the World Cup! High-five everyone on the way!"],
  ["Dance Move Chain", "Teamwork", "bold", "2m", "Standing", "Loud", "vote", "classroom", "recess_riot",
   "Each person adds one dance move to a growing sequence! First person does one move, next does that move plus a new one. How long can the chain get?"],
];

// ──────────────────────────────────────────────
// Interactive Challenges
// ──────────────────────────────────────────────

interface InteractiveChallengeRow {
  title: string;
  category: string;
  intensity: string;
  duration: string;
  movement: string;
  noise: string;
  submission: string;
  audience: string;
  audiencePack: string;
  instructions: string;
  interactiveData: Record<string, unknown>;
}

const INTERACTIVE_CHALLENGES: InteractiveChallengeRow[] = [
  // ── describe_avatar (3) ──
  {
    title: "Dream Date Description",
    category: "Creativity", intensity: "bold", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Look at the pixel creature on your screen. Describe it as if it were your dream date. Be romantic, be dramatic, be ridiculous!",
    interactiveData: { type: "describe_avatar", avatarIndex: 3, prompt: "Describe this creature as your dream date" },
  },
  {
    title: "Monster Adoption Pitch",
    category: "Creativity", intensity: "chaos", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "You found this creature and want to adopt it. Write a convincing pitch to your parents about why this is the perfect pet.",
    interactiveData: { type: "describe_avatar", avatarIndex: 10, prompt: "Convince your parents to adopt this creature" },
  },
  {
    title: "Wanted Poster",
    category: "Creativity", intensity: "bold", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "This pixel creature is WANTED. Write their wanted poster -- what crime did they commit? What's the reward?",
    interactiveData: { type: "describe_avatar", avatarIndex: 18, prompt: "Write a wanted poster for this outlaw" },
  },

  // ── emoji_prompt (2) ──
  {
    title: "Emoji Movie Plot",
    category: "Creativity", intensity: "bold", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "These emojis represent a movie plot. Write a one-paragraph movie synopsis based on them.",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F469}", "\u{1F48D}", "\u{1F409}", "\u{1F525}", "\u{1F451}"], prompt: "Write a movie synopsis from these emojis" },
  },
  {
    title: "Emoji Excuse Generator",
    category: "Improv", intensity: "bold", duration: "1m", movement: "Seated", noise: "Medium", submission: "text", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Use these emojis to craft the most creative excuse for why you didn't do your homework.",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F436}", "\u{1F4DA}", "\u{1F32A}", "\u{1F47D}", "\u{1F62D}"], prompt: "Create an excuse for missing homework" },
  },

  // ── tap_frenzy (4) ──
  {
    title: "Speed Tapper",
    category: "Performance", intensity: "chaos", duration: "30s", movement: "Seated", noise: "Medium", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Tap your screen as fast as humanly possible! The player with the most taps wins!",
    interactiveData: { type: "tap_frenzy", durationSeconds: 10, prompt: "Most taps in 10 seconds wins!" },
  },
  {
    title: "Hum That Tune",
    category: "Performance", intensity: "bold", duration: "1m", movement: "Seated", noise: "Medium", submission: "vote", audience: "universal", audiencePack: "universal",
    instructions: "Hum a famous song into your phone -- no words allowed! Everyone else will try to guess what song it is. Best humming performance wins the vote!",
    interactiveData: { type: "sound_effect", durationSeconds: 15, prompt: "Hum a famous song -- no words!" },
  },
  {
    title: "Thumb War Solo",
    category: "Performance", intensity: "bold", duration: "30s", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Use only your thumb! How many taps can you get in 8 seconds with just one thumb?",
    interactiveData: { type: "tap_frenzy", durationSeconds: 8, prompt: "Thumb only! 8 seconds!" },
  },
  {
    title: "Office Stress Relief",
    category: "Performance", intensity: "mild", duration: "30s", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "office", audiencePack: "office_fun",
    instructions: "Channel all your Monday energy into tapping! Think of it as aggressive keyboard typing practice.",
    interactiveData: { type: "tap_frenzy", durationSeconds: 10, prompt: "Release that Monday energy!" },
  },

  // ── reaction_time (4) ──
  {
    title: "Reflex Showdown",
    category: "Observation", intensity: "bold", duration: "30s", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Wait for the screen to turn GREEN, then tap as fast as you can! But don't tap too early or it won't count!",
    interactiveData: { type: "reaction_time", rounds: 5, prompt: "Wait for green... TAP!" },
  },
  {
    title: "Mystery Voice",
    category: "Performance", intensity: "chaos", duration: "1m", movement: "Seated", noise: "Medium", submission: "vote", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Disguise your voice and record a secret message! Change your pitch, accent, or style. Everyone guesses whose voice it is -- best disguise wins!",
    interactiveData: { type: "sound_effect", durationSeconds: 10, prompt: "Disguise your voice! Can they guess who you are?" },
  },
  {
    title: "Sing-Off Snippet",
    category: "Performance", intensity: "legend", duration: "1m", movement: "Seated", noise: "Loud", submission: "vote", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Record yourself singing 10 seconds of ANY song! Belt it out, whisper it, rap it -- your choice! The crowd votes for the best performance!",
    interactiveData: { type: "sound_effect", durationSeconds: 10, prompt: "Sing 10 seconds of any song!" },
  },
  {
    title: "Coffee Reflex Test",
    category: "Observation", intensity: "mild", duration: "30s", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "office", audiencePack: "office_fun",
    instructions: "How much coffee did you have today? Let's measure your reaction time and find out!",
    interactiveData: { type: "reaction_time", rounds: 3, prompt: "Coffee-powered reflexes!" },
  },

  // ── photo_selfie (4) ──
  {
    title: "Copy That Face",
    category: "Performance", intensity: "bold", duration: "1m", movement: "Seated", noise: "Medium", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Look at the pixel creature on screen. Now take a selfie making the EXACT same face! The funniest match wins!",
    interactiveData: { type: "photo_selfie", avatarIndex: 3, prompt: "Copy this creature's face!" },
  },
  {
    title: "Celebrity Lookalike",
    category: "Performance", intensity: "chaos", duration: "2m", movement: "Seated", noise: "Medium", submission: "vote", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Take a selfie doing your best celebrity impression! Strike a famous pose, make their signature face. Everyone votes on who nailed it!",
    interactiveData: { type: "photo_selfie", avatarIndex: 12, prompt: "Strike your best celebrity pose!" },
  },
  {
    title: "Mood Selfie",
    category: "Creativity", intensity: "mild", duration: "2m", movement: "Seated", noise: "Quiet", submission: "vote", audience: "universal", audiencePack: "universal",
    instructions: "Take a selfie that perfectly captures a random emotion: 'confused by a math problem', 'just won the lottery', 'smelled something weird'. The host picks the emotion!",
    interactiveData: { type: "photo_selfie", avatarIndex: 5, prompt: "Show us that emotion with your face!" },
  },
  {
    title: "Boss Mode Selfie",
    category: "Performance", intensity: "mild", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "office", audiencePack: "office_fun",
    instructions: "Take a power selfie channeling big boss energy. Think CEO headshot meets superhero pose.",
    interactiveData: { type: "photo_selfie", avatarIndex: 12, prompt: "Channel your inner CEO!" },
  },

  // ── shake_meter (4) ──
  {
    title: "Earthquake Generator",
    category: "Performance", intensity: "chaos", duration: "30s", movement: "Standing", noise: "Medium", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Shake your phone like you're creating an earthquake! The harder you shake, the higher your score!",
    interactiveData: { type: "shake_meter", durationSeconds: 10, prompt: "Create a magnitude 10 earthquake!" },
  },
  {
    title: "Milkshake Maker",
    category: "Performance", intensity: "bold", duration: "30s", movement: "Standing", noise: "Medium", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "You're making a milkshake with your phone! Shake it up! The most vigorous shaker wins!",
    interactiveData: { type: "shake_meter", durationSeconds: 12, prompt: "Shake that milkshake!" },
  },
  {
    title: "Guess My Sound",
    category: "Improv", intensity: "bold", duration: "1m", movement: "Seated", noise: "Medium", submission: "vote", audience: "universal", audiencePack: "universal",
    instructions: "Record a sound effect for an everyday action -- a door creaking, popcorn popping, a car starting. Don't tell anyone what it is! Everyone guesses!",
    interactiveData: { type: "sound_effect", durationSeconds: 8, prompt: "Make a mystery sound effect!" },
  },
  {
    title: "Martini Mixer",
    category: "Performance", intensity: "mild", duration: "30s", movement: "Standing", noise: "Quiet", submission: "completion_tap", audience: "office", audiencePack: "office_fun",
    instructions: "Shaken, not stirred! Mix the perfect virtual martini by shaking your phone with style and finesse.",
    interactiveData: { type: "shake_meter", durationSeconds: 8, prompt: "Shaken, not stirred!" },
  },

  // ── this_or_that (6) ──
  {
    title: "Food Fight Showdown",
    category: "Social courage", intensity: "mild", duration: "30s", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Rapid-fire food choices! Pick your favorite as fast as you can. Speed counts!",
    interactiveData: { type: "this_or_that", choices: [
      { a: "Pizza", b: "Tacos" }, { a: "Ice Cream", b: "Cake" }, { a: "Burgers", b: "Hot Dogs" },
      { a: "Fries", b: "Onion Rings" }, { a: "Chocolate", b: "Gummy Bears" }, { a: "Pancakes", b: "Waffles" },
      { a: "Sushi", b: "Pasta" }, { a: "Cookies", b: "Brownies" },
    ]},
  },
  {
    title: "Would You Rather: School Edition",
    category: "Social courage", intensity: "bold", duration: "30s", movement: "Seated", noise: "Quiet", submission: "text", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Would you rather... Make your choice fast! Fastest fingers get bonus points.",
    interactiveData: { type: "this_or_that", choices: [
      { a: "No homework ever", b: "No tests ever" }, { a: "Extra recess", b: "Extra lunch" },
      { a: "Be the teacher", b: "Be the principal" }, { a: "School on a beach", b: "School on a spaceship" },
      { a: "Invisible for a day", b: "Fly for a day" }, { a: "Read minds", b: "Time travel" },
    ]},
  },
  {
    title: "Life Choices Lightning Round",
    category: "Social courage", intensity: "mild", duration: "30s", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Quick-fire life preferences! No overthinking -- go with your gut!",
    interactiveData: { type: "this_or_that", choices: [
      { a: "Dogs", b: "Cats" }, { a: "Summer", b: "Winter" }, { a: "Mountains", b: "Beach" },
      { a: "Morning Person", b: "Night Owl" }, { a: "City", b: "Countryside" },
      { a: "Books", b: "Movies" }, { a: "Sweet", b: "Salty" }, { a: "Rain", b: "Sunshine" },
    ]},
  },
  {
    title: "Office Dilemmas",
    category: "Social courage", intensity: "mild", duration: "30s", movement: "Seated", noise: "Quiet", submission: "text", audience: "office", audiencePack: "office_fun",
    instructions: "Workplace choices! Answer fast to score big!",
    interactiveData: { type: "this_or_that", choices: [
      { a: "Work from home", b: "Work from office" }, { a: "Window seat", b: "Corner office" },
      { a: "Free lunch daily", b: "Leave 2 hours early" }, { a: "No meetings ever", b: "No emails ever" },
      { a: "Casual Friday every day", b: "4-day work week" }, { a: "Perfect coffee", b: "Perfect WiFi" },
    ]},
  },
  {
    title: "Pop Culture Picks",
    category: "Social courage", intensity: "bold", duration: "30s", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Entertainment picks at lightning speed!",
    interactiveData: { type: "this_or_that", choices: [
      { a: "Marvel", b: "DC" }, { a: "Star Wars", b: "Star Trek" },
      { a: "Harry Potter", b: "Lord of the Rings" }, { a: "Netflix", b: "YouTube" },
      { a: "TikTok", b: "Instagram" }, { a: "Console Gaming", b: "PC Gaming" },
      { a: "Comedy", b: "Action" },
    ]},
  },
  {
    title: "Superpower Speed Round",
    category: "Creativity", intensity: "chaos", duration: "30s", movement: "Seated", noise: "Quiet", submission: "text", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Which superpower would you choose? Decide FAST!",
    interactiveData: { type: "this_or_that", choices: [
      { a: "Fly", b: "Teleport" }, { a: "Super strength", b: "Super speed" },
      { a: "Invisible", b: "Shape-shift" }, { a: "Read minds", b: "Control weather" },
      { a: "Talk to animals", b: "Breathe underwater" }, { a: "Laser eyes", b: "Ice breath" },
      { a: "Time travel", b: "Telekinesis" },
    ]},
  },

  // ── drawing (5) ──
  {
    title: "Dino Dessert",
    category: "Creativity", intensity: "mild", duration: "1m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Draw a dinosaur eating ice cream! Be creative with the flavors and the dino's expression.",
    interactiveData: { type: "drawing", prompt: "Draw a dinosaur eating ice cream" },
  },
  {
    title: "Self Portrait Speed Draw",
    category: "Creativity", intensity: "bold", duration: "30s", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "You have 30 seconds to draw a self-portrait! It doesn't have to be good -- it has to be FAST!",
    interactiveData: { type: "drawing", prompt: "Draw a self-portrait in 30 seconds!" },
  },
  {
    title: "Dream Pet Designer",
    category: "Creativity", intensity: "mild", duration: "1m", movement: "Seated", noise: "Quiet", submission: "text", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Design your dream pet! It can be a mix of any animals. Draw it and give it a name!",
    interactiveData: { type: "drawing", prompt: "Design your ultimate dream pet" },
  },
  {
    title: "Boss's New Logo",
    category: "Innovation", intensity: "bold", duration: "1m", movement: "Seated", noise: "Quiet", submission: "text", audience: "office", audiencePack: "office_fun",
    instructions: "The company needs a new logo! Draw the most creative (or ridiculous) company logo you can imagine.",
    interactiveData: { type: "drawing", prompt: "Draw a new company logo" },
  },
  {
    title: "Alien Selfie",
    category: "Creativity", intensity: "chaos", duration: "1m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "An alien is taking a selfie on Earth for the first time! Draw what they look like with a famous landmark behind them.",
    interactiveData: { type: "drawing", prompt: "Draw an alien taking a selfie on Earth" },
  },

  // ── location-specific (8) ──
  {
    title: "Park Creature Spotter",
    category: "Observation", intensity: "mild", duration: "2m", movement: "Light movement", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Look at this creature. Now look around the park -- find something in nature that looks like it! Describe what you found.",
    interactiveData: { type: "describe_avatar", avatarIndex: 9, prompt: "Find something in the park that looks like this creature", locations: ["park"] },
  },
  {
    title: "Nature Sound Orchestra",
    category: "Performance", intensity: "bold", duration: "2m", movement: "Standing", noise: "Medium", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Combine the sounds you hear around you into a musical performance! Layer park sounds with your own beatboxing or humming.",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F333}", "\u{1F426}", "\u{1F3B6}", "\u{1F3A4}", "\u{1F33F}"], prompt: "Create music from the nature sounds around you", locations: ["park"] },
  },
  {
    title: "Menu Mashup",
    category: "Creativity", intensity: "chaos", duration: "2m", movement: "Seated", noise: "Medium", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Combine two items from the restaurant menu into a brand new dish! Give it a fancy name and describe it like a Michelin-star creation.",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F37D}", "\u{1F468}\u200D\u{1F373}", "\u2728", "\u{1F4AB}", "\u{1F947}"], prompt: "Create a new dish from the menu around you", locations: ["restaurant"] },
  },
  {
    title: "Restaurant Critic Battle",
    category: "Performance", intensity: "bold", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Write the most dramatic restaurant review of where you are right now. Is it five stars or zero stars? You decide!",
    interactiveData: { type: "describe_avatar", avatarIndex: 5, prompt: "Write a dramatic review as this food critic", locations: ["restaurant"] },
  },
  {
    title: "Beach Treasure Hunt",
    category: "Observation", intensity: "mild", duration: "2m", movement: "Light movement", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Find something interesting near you at the beach! Describe it as if it's a priceless archaeological discovery.",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F3D6}", "\u{1F41A}", "\u2728", "\u{1F50D}", "\u{1F4CE}"], prompt: "Find and describe a beach treasure", locations: ["beach"] },
  },
  {
    title: "Home Object Roast",
    category: "Improv", intensity: "bold", duration: "1m", movement: "Seated", noise: "Medium", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Pick an object in your home and absolutely ROAST it. What's wrong with this object? Why is it the worst?",
    interactiveData: { type: "describe_avatar", avatarIndex: 4, prompt: "Roast a household object like this creature would", locations: ["home"] },
  },
  {
    title: "Draw the View",
    category: "Creativity", intensity: "mild", duration: "1m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Draw what you see right now! Turn the view from where you're sitting into pixel art on the canvas.",
    interactiveData: { type: "drawing", prompt: "Draw the view from where you are right now", locations: ["park", "beach", "restaurant"] },
  },
  {
    title: "Sandcastle Blueprint",
    category: "Creativity", intensity: "bold", duration: "1m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Design the ultimate sandcastle! Draw your architectural masterpiece on the canvas. Include towers, moats, and flags!",
    interactiveData: { type: "drawing", prompt: "Design the ultimate sandcastle blueprint", locations: ["beach"] },
  },

  // ── memory_sequence (4) ──
  {
    title: "Simon Says Remember",
    category: "Memory", intensity: "bold", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Watch the colored squares light up in order. Then tap them back in the same sequence! Each round gets harder!",
    interactiveData: { type: "memory_sequence", sequenceLength: 4, prompt: "Watch the pattern, then repeat it!" },
  },
  {
    title: "Brain Blitz",
    category: "Memory", intensity: "chaos", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Think you have a good memory? Watch the sequence of 5 colors and repeat it perfectly. Three rounds, each one longer!",
    interactiveData: { type: "memory_sequence", sequenceLength: 5, prompt: "Big brain time! 5 colors to remember!" },
  },
  {
    title: "Memory Master",
    category: "Memory", intensity: "legend", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_low_noise",
    instructions: "The ultimate memory challenge! 6 colors to memorize per round. Only a true memory master can ace all 3 rounds!",
    interactiveData: { type: "memory_sequence", sequenceLength: 6, prompt: "6 colors! Can you handle it?" },
  },
  {
    title: "Focus Training",
    category: "Memory", intensity: "mild", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "office", audiencePack: "office_professional",
    instructions: "A quick brain warm-up! Watch 3 colors, repeat them back. Simple but surprisingly tricky after lunch.",
    interactiveData: { type: "memory_sequence", sequenceLength: 3, prompt: "Quick brain warm-up!" },
  },

  // ── tilt_target (4) ──
  {
    title: "Tilt Master",
    category: "Performance", intensity: "bold", duration: "30s", movement: "Standing", noise: "Quiet", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Tilt your phone to guide the ball into the target! Hit all 5 targets as fast as you can!",
    interactiveData: { type: "tilt_target", rounds: 5, prompt: "Tilt to hit 5 targets!" },
  },
  {
    title: "Steady Hands",
    category: "Observation", intensity: "chaos", duration: "30s", movement: "Standing", noise: "Quiet", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_low_noise",
    instructions: "How steady are your hands? Tilt to guide the ball into 7 targets. Don't shake!",
    interactiveData: { type: "tilt_target", rounds: 7, prompt: "7 targets! Keep those hands steady!" },
  },
  {
    title: "Phone Pilot",
    category: "Performance", intensity: "mild", duration: "30s", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "You're a pilot! Tilt your phone to fly the ball into 3 landing zones. Smooth landings only!",
    interactiveData: { type: "tilt_target", rounds: 3, prompt: "Pilot your ball to 3 landing zones!" },
  },
  {
    title: "Balance Test",
    category: "Observation", intensity: "mild", duration: "30s", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "office", audiencePack: "office_fun",
    instructions: "A quick coordination break! Tilt to hit 4 targets. Faster times win!",
    interactiveData: { type: "tilt_target", rounds: 4, prompt: "Hit 4 targets for the best time!" },
  },

  // ── sound_effect (4) ──
  {
    title: "Sound Effects Master",
    category: "Performance", intensity: "chaos", duration: "1m", movement: "Seated", noise: "Loud", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Record the best sound effect you can make! Explosions, laser beams, animal noises -- anything goes!",
    interactiveData: { type: "sound_effect", durationSeconds: 10, prompt: "Record your best sound effect!" },
  },
  {
    title: "Animal Impressions",
    category: "Performance", intensity: "bold", duration: "1m", movement: "Seated", noise: "Loud", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Record your best animal sound! Make it as realistic (or as ridiculous) as possible!",
    interactiveData: { type: "sound_effect", durationSeconds: 8, prompt: "Do your best animal impression!" },
  },
  {
    title: "Beatbox Drop",
    category: "Performance", intensity: "legend", duration: "1m", movement: "Seated", noise: "Loud", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Drop a sick beat! Record your best 15-second beatbox session!",
    interactiveData: { type: "sound_effect", durationSeconds: 15, prompt: "Drop a 15-second beat!" },
  },
  {
    title: "Elevator Pitch Voice",
    category: "Presentation", intensity: "mild", duration: "1m", movement: "Seated", noise: "Medium", submission: "completion_tap", audience: "office", audiencePack: "office_fun",
    instructions: "Record your most dramatic movie trailer voice saying 'In a world where deadlines are real...'",
    interactiveData: { type: "sound_effect", durationSeconds: 10, prompt: "Your best movie trailer voice!" },
  },

  // ── emoji_slider (4) ──
  {
    title: "Rate Everything",
    category: "Social courage", intensity: "mild", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Slide to rate! How do you feel about each thing? Drag the slider toward the emoji that fits!",
    interactiveData: { type: "emoji_slider", prompt: "Rate these on the emoji scale!", items: [
      { prompt: "Monday mornings", leftEmoji: "\u{1F634}", rightEmoji: "\u{1F929}" },
      { prompt: "Homework", leftEmoji: "\u{1F4A9}", rightEmoji: "\u{1F48E}" },
      { prompt: "Pizza", leftEmoji: "\u{1F44E}", rightEmoji: "\u{1F44D}" },
      { prompt: "Rainy days", leftEmoji: "\u{1F622}", rightEmoji: "\u{1F60D}" },
      { prompt: "This class", leftEmoji: "\u{1F971}", rightEmoji: "\u{1F525}" },
    ]},
  },
  {
    title: "Mood Check",
    category: "Social courage", intensity: "mild", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_low_noise",
    instructions: "Quick mood check! Slide to show how you feel about each thing right now.",
    interactiveData: { type: "emoji_slider", prompt: "How are you feeling?", items: [
      { prompt: "Energy level", leftEmoji: "\u{1F6CC}", rightEmoji: "\u26A1" },
      { prompt: "Hunger level", leftEmoji: "\u{1F610}", rightEmoji: "\u{1F924}" },
      { prompt: "Fun level", leftEmoji: "\u{1F971}", rightEmoji: "\u{1F973}" },
      { prompt: "Creativity", leftEmoji: "\u{1F9F1}", rightEmoji: "\u{1F3A8}" },
    ]},
  },
  {
    title: "Hot Takes",
    category: "Social courage", intensity: "bold", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Give your hottest takes! Slide all the way to one side if you feel strongly!",
    interactiveData: { type: "emoji_slider", prompt: "How hot are your takes?", items: [
      { prompt: "Pineapple on pizza", leftEmoji: "\u{1F922}", rightEmoji: "\u{1F60B}" },
      { prompt: "Waking up early", leftEmoji: "\u{1F47F}", rightEmoji: "\u{1F607}" },
      { prompt: "Math class", leftEmoji: "\u{1F480}", rightEmoji: "\u{1F4AF}" },
      { prompt: "School lunch", leftEmoji: "\u{1F922}", rightEmoji: "\u{1F37D}" },
      { prompt: "Pop quizzes", leftEmoji: "\u{1F4A3}", rightEmoji: "\u{1F3C6}" },
    ]},
  },
  {
    title: "Team Vibes",
    category: "Culture", intensity: "mild", duration: "1m", movement: "Seated", noise: "Quiet", submission: "completion_tap", audience: "office", audiencePack: "office_professional",
    instructions: "Anonymous team pulse check! How are we doing on these?",
    interactiveData: { type: "emoji_slider", prompt: "Rate the team vibes!", items: [
      { prompt: "Meeting quality", leftEmoji: "\u{1F634}", rightEmoji: "\u{1F4A1}" },
      { prompt: "Coffee quality", leftEmoji: "\u{1F922}", rightEmoji: "\u2615" },
      { prompt: "Friday energy", leftEmoji: "\u{1F40C}", rightEmoji: "\u{1F680}" },
      { prompt: "Snack situation", leftEmoji: "\u{1F3DC}", rightEmoji: "\u{1F36D}" },
    ]},
  },

  // ═══════════════════════════════════════════
  // PERSONAL & GUESS WHO CHALLENGES
  // ═══════════════════════════════════════════

  // ── "About You" text challenges (no timer pressure -- long durations) ──
  {
    title: "Two Truths One Lie",
    category: "Social courage", intensity: "bold", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Write down 3 statements about yourself -- 2 true and 1 lie. Make them tricky! Everyone will try to spot the lie. Submit all 3 in the text box.",
    interactiveData: { type: "emoji_prompt", emojis: ["\u2705", "\u2705", "\u274C", "\u{1F914}", "\u{1F50D}"], prompt: "2 truths, 1 lie -- can they spot it?" },
  },
  {
    title: "Secret Talent Reveal",
    category: "Social courage", intensity: "mild", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Share a hidden talent or weird skill nobody knows about. Can you touch your nose with your tongue? Solve a Rubik's cube? Write it and the host reads them anonymously!",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F3AD}", "\u2728", "\u{1F929}", "\u{1F52E}", "\u2753"], prompt: "What's YOUR secret talent?" },
  },
  {
    title: "Unpopular Opinion",
    category: "Social courage", intensity: "chaos", duration: "2m", movement: "Seated", noise: "Medium", submission: "vote", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Share your most unpopular opinion! 'Homework is actually fun', 'Pizza is overrated', 'Monday is the best day'. The crowd votes on the hottest take!",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F525}", "\u{1F4A3}", "\u{1F60E}", "\u{1F92F}", "\u{1F3A4}"], prompt: "Drop your hottest unpopular opinion!" },
  },
  {
    title: "If I Were Famous",
    category: "Creativity", intensity: "bold", duration: "2m", movement: "Seated", noise: "Quiet", submission: "vote", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "If you were famous, what would you be famous for? Write your answer and the host reads them out -- everyone guesses who said what!",
    interactiveData: { type: "emoji_prompt", emojis: ["\u2B50", "\u{1F3AC}", "\u{1F3A4}", "\u{1F3C6}", "\u{1F451}"], prompt: "What would YOU be famous for?" },
  },
  {
    title: "Guess My Breakfast",
    category: "Social courage", intensity: "mild", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Write what you had for breakfast today (or what you WISH you had). The host reads them anonymously and everyone guesses who eats what!",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F95E}", "\u{1F373}", "\u{1F950}", "\u{1F95B}", "\u2753"], prompt: "What did you eat this morning?" },
  },
  {
    title: "My Guilty Pleasure Song",
    category: "Social courage", intensity: "bold", duration: "2m", movement: "Seated", noise: "Quiet", submission: "text", audience: "universal", audiencePack: "universal",
    instructions: "Write down a song you secretly LOVE but would never admit to. The host reads them out and everyone guesses whose guilty pleasure it is!",
    interactiveData: { type: "emoji_prompt", emojis: ["\u{1F3B5}", "\u{1F917}", "\u{1F648}", "\u{1F3A7}", "\u2764\uFE0F"], prompt: "Confess your guilty pleasure song!" },
  },

  // ── Voice/Audio "Guess Who" challenges ──
  {
    title: "Whisper Challenge",
    category: "Performance", intensity: "bold", duration: "1m", movement: "Seated", noise: "Quiet", submission: "vote", audience: "classroom", audiencePack: "classroom_low_noise",
    instructions: "Whisper a famous movie quote or song lyric into your phone! Keep it quiet -- everyone will listen and try to figure out what you said AND who said it!",
    interactiveData: { type: "sound_effect", durationSeconds: 10, prompt: "Whisper a famous quote -- can they hear it?" },
  },
  {
    title: "Voice Impression",
    category: "Performance", intensity: "chaos", duration: "1m", movement: "Seated", noise: "Loud", submission: "vote", audience: "universal", audiencePack: "universal",
    instructions: "Do your best impression of a famous person, cartoon character, or movie villain! Record it and everyone votes on the best impression!",
    interactiveData: { type: "sound_effect", durationSeconds: 10, prompt: "Do your best voice impression!" },
  },

  // ── Photo "Guess Who" / personal photo challenges ──
  {
    title: "Shoe Reveal",
    category: "Social courage", intensity: "mild", duration: "2m", movement: "Seated", noise: "Quiet", submission: "vote", audience: "universal", audiencePack: "universal",
    instructions: "Take a photo of JUST your shoes (or feet). The host shows each photo and everyone guesses whose shoes they are! You'd be surprised how hard this is!",
    interactiveData: { type: "photo_selfie", avatarIndex: 0, prompt: "Snap a pic of your shoes!" },
  },
  {
    title: "Bag Contents Mystery",
    category: "Social courage", intensity: "mild", duration: "2m", movement: "Seated", noise: "Quiet", submission: "vote", audience: "universal", audiencePack: "universal",
    instructions: "Take a photo of 3 items from your bag or pockets (no ID or personal info!). The host shows each photo and everyone guesses whose stuff it is!",
    interactiveData: { type: "photo_selfie", avatarIndex: 15, prompt: "Show 3 mystery items from your bag!" },
  },
  {
    title: "Desk Detective",
    category: "Observation", intensity: "mild", duration: "2m", movement: "Seated", noise: "Quiet", submission: "vote", audience: "office", audiencePack: "office_fun",
    instructions: "Take a close-up photo of ONE unique item on your desk. No faces or name tags! The team guesses whose desk it belongs to.",
    interactiveData: { type: "photo_selfie", avatarIndex: 8, prompt: "Photograph your desk's most unique item!" },
  },

  // ═══════════════════════════════════════════
  // GROUP ACTIVITIES
  // ═══════════════════════════════════════════

  // ── group_photo: Group Poses (5) ──
  {
    title: "Human Pyramid",
    category: "Teamwork", intensity: "legend", duration: "2m", movement: "Light movement", noise: "Loud", submission: "photo", audience: "universal", audiencePack: "universal",
    instructions: "Build a human pyramid with your group! Stack up safely, hold it steady, and snap a photo as proof! Biggest pyramid wins!",
    interactiveData: { type: "group_photo", prompt: "Build a human pyramid and photograph it!", icon: "\u{1F3D4}" },
  },
  {
    title: "Spell It Out",
    category: "Teamwork", intensity: "bold", duration: "2m", movement: "Light movement", noise: "Medium", submission: "photo", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Use your bodies to spell out a word! Lie on the floor, stand in shapes -- whatever it takes! Take a photo from above!",
    interactiveData: { type: "group_photo", prompt: "Spell a word with your bodies!", icon: "\u{1F524}" },
  },
  {
    title: "Frozen Movie Scene",
    category: "Performance", intensity: "bold", duration: "2m", movement: "Standing", noise: "Medium", submission: "photo", audience: "universal", audiencePack: "universal",
    instructions: "Strike a frozen pose recreating a famous movie scene! Everyone in the group plays a character. Snap the photo!",
    interactiveData: { type: "group_photo", prompt: "Recreate a famous movie scene -- freeze!", icon: "\u{1F3AC}" },
  },
  {
    title: "World's Worst Photo",
    category: "Creativity", intensity: "chaos", duration: "1m", movement: "Standing", noise: "Loud", submission: "photo", audience: "universal", audiencePack: "universal",
    instructions: "Take the ugliest, most ridiculous group photo possible! Weird angles, crazy faces, maximum chaos. Worst photo wins!",
    interactiveData: { type: "group_photo", prompt: "Take the WORST group photo possible!", icon: "\u{1F92A}" },
  },
  {
    title: "Statue Garden",
    category: "Creativity", intensity: "mild", duration: "2m", movement: "Standing", noise: "Quiet", submission: "photo", audience: "classroom", audiencePack: "classroom_low_noise",
    instructions: "Everyone freezes as a statue in a garden! Each person picks a different pose. Take a photo of your 'garden'!",
    interactiveData: { type: "group_photo", prompt: "Create a frozen statue garden!", icon: "\u{1F5FF}" },
  },

  // ── group_timer: Team Races (4) ──
  {
    title: "Hot Potato Relay",
    category: "Teamwork", intensity: "chaos", duration: "1m", movement: "Light movement", noise: "Loud", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Pass an object around the circle as fast as possible! Start the timer, pass it to everyone, stop when it gets back to the start!",
    interactiveData: { type: "group_timer", prompt: "Pass it around the circle -- fastest time wins!", icon: "\u{1F525}", activity: "relay_pass" },
  },
  {
    title: "Synchronized Sit-Stand",
    category: "Teamwork", intensity: "bold", duration: "1m", movement: "Standing", noise: "Medium", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Everyone sits down and stands up at the EXACT same time! Start the timer, do 10 perfectly synchronized sit-stands, stop the timer!",
    interactiveData: { type: "group_timer", prompt: "10 synchronized sit-stands -- time it!", icon: "\u{1F9CD}", activity: "sync_sit_stand" },
  },
  {
    title: "Cup Stack Race",
    category: "Teamwork", intensity: "chaos", duration: "2m", movement: "Seated", noise: "Medium", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Stack cups (or books, or whatever you have) into a pyramid and take it back down! Fastest team time wins!",
    interactiveData: { type: "group_timer", prompt: "Stack up and tear down -- fastest time wins!", icon: "\u{1F3C6}", activity: "cup_stack" },
  },
  {
    title: "Office Chair Race",
    category: "Teamwork", intensity: "legend", duration: "2m", movement: "Light movement", noise: "Loud", submission: "completion_tap", audience: "office", audiencePack: "office_fun",
    instructions: "One person sits in a rolling chair, the rest push! Race to the finish line and back! Time your team!",
    interactiveData: { type: "group_timer", prompt: "Chair race! Push your rider to victory!", icon: "\u{1FA91}", activity: "chair_race" },
  },

  // ── group_photo: Group Performances (4) ──
  {
    title: "Group Dance Freeze",
    category: "Performance", intensity: "chaos", duration: "2m", movement: "Standing", noise: "Loud", submission: "judge", audience: "universal", audiencePack: "universal",
    instructions: "Dance together as a group for 30 seconds, then FREEZE when the host says stop! Best frozen formation wins! Judge scores the group.",
    interactiveData: { type: "group_photo", prompt: "Dance together then FREEZE for the photo!", icon: "\u{1F57A}" },
  },
  {
    title: "Human Beatbox Band",
    category: "Performance", intensity: "legend", duration: "2m", movement: "Standing", noise: "Loud", submission: "judge", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "Each person makes ONE sound. Layer them together to create a beat! Snap a photo of your 'band' in action!",
    interactiveData: { type: "group_photo", prompt: "Form a beatbox band and snap the shot!", icon: "\u{1F3B6}" },
  },
  {
    title: "Sync Clap Pattern",
    category: "Teamwork", intensity: "bold", duration: "1m", movement: "Standing", noise: "Loud", submission: "judge", audience: "universal", audiencePack: "universal",
    instructions: "Create a clapping pattern as a group! Start simple, get complex. The host judges the best synchronized routine!",
    interactiveData: { type: "group_photo", prompt: "Show your synchronized clap routine!", icon: "\u{1F44F}" },
  },
  {
    title: "Silent Movie Scene",
    category: "Performance", intensity: "bold", duration: "3m", movement: "Light movement", noise: "Quiet", submission: "judge", audience: "classroom", audiencePack: "classroom_low_noise",
    instructions: "Act out a scene together with NO sound -- like a silent movie! Exaggerated gestures only. The host judges the performance!",
    interactiveData: { type: "group_photo", prompt: "Perform a silent movie scene!", icon: "\u{1F3AC}" },
  },

  // ── group_timer: Physical Challenges (4) ──
  {
    title: "Group Plank Challenge",
    category: "Performance", intensity: "legend", duration: "2m", movement: "Light movement", noise: "Quiet", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Everyone does a plank at the same time! Start the timer together. Stop when the LAST person drops. Longest group time wins!",
    interactiveData: { type: "group_timer", prompt: "Group plank! Time how long everyone holds!", icon: "\u{1F4AA}", activity: "group_plank" },
  },
  {
    title: "Jumping Jack Frenzy",
    category: "Performance", intensity: "chaos", duration: "1m", movement: "Standing", noise: "Loud", submission: "completion_tap", audience: "classroom", audiencePack: "classroom_funny",
    instructions: "How fast can your whole group do 50 jumping jacks together? Start the timer and count together out loud! GO!",
    interactiveData: { type: "group_timer", prompt: "50 group jumping jacks -- time it!", icon: "\u{1F3C3}", activity: "jumping_jacks" },
  },
  {
    title: "Balance Off",
    category: "Observation", intensity: "bold", duration: "2m", movement: "Standing", noise: "Quiet", submission: "completion_tap", audience: "universal", audiencePack: "universal",
    instructions: "Everyone stands on one foot! Start the timer. Stop when the last person puts their foot down. Longest balance wins!",
    interactiveData: { type: "group_timer", prompt: "One-foot balance contest -- time it!", icon: "\u{1F9D8}", activity: "balance" },
  },
  {
    title: "Speed Cleanup Race",
    category: "Teamwork", intensity: "mild", duration: "2m", movement: "Light movement", noise: "Medium", submission: "completion_tap", audience: "office", audiencePack: "office_fun",
    instructions: "Time how fast your team can organize 10 items on a desk into perfect order! Start messy, end tidy. Fastest time wins!",
    interactiveData: { type: "group_timer", prompt: "Organize the mess -- fastest team wins!", icon: "\u{1F9F9}", activity: "speed_clean" },
  },
];

// ──────────────────────────────────────────────
// Challenge Packs
// ──────────────────────────────────────────────

const PACKS = [
  {
    name: "Laugh Lab",
    description: "Maximum laughs, maximum fun. These challenges are designed to bring the house down with creative humor and bold performances.",
    audience: "classroom",
    icon: "laugh",
    color: "#FF6B6B",
    // 1-indexed challenge numbers from the CHALLENGES array
    challengeIndices: [0, 2, 7, 11, 14, 20, 26, 31, 42, 47, 51, 58],
  },
  {
    name: "Quiet Chaos",
    description: "All the fun with none of the volume. Perfect for classrooms that need to keep the noise down while keeping engagement up.",
    audience: "classroom",
    icon: "volume-x",
    color: "#4ECDC4",
    challengeIndices: [60, 63, 66, 70, 75, 79, 84, 87, 91, 96, 100, 105],
  },
  {
    name: "Friday Fun",
    description: "End the week on a high note. Light-hearted office challenges that build team spirit and create memorable moments.",
    audience: "office",
    icon: "party-popper",
    color: "#FFE66D",
    challengeIndices: [111, 116, 118, 121, 127, 130, 136, 141, 148, 152, 161, 166],
  },
  {
    name: "Workshop Boost",
    description: "Professional development meets engagement. These challenges sharpen communication, leadership, and problem-solving skills.",
    audience: "office",
    icon: "briefcase",
    color: "#6C5CE7",
    challengeIndices: [171, 174, 178, 181, 186, 190, 194, 198, 201, 206, 211, 216],
  },
  {
    name: "Universal Hype Pack",
    description: "Works everywhere, for everyone. These crowd-pleasers are tested across audiences and guaranteed to energize any group.",
    audience: "universal",
    icon: "zap",
    color: "#FFA502",
    challengeIndices: [221, 223, 226, 228, 232, 236, 238, 241, 244, 246, 248, 249],
  },
  {
    name: "Recess Riot",
    description: "Maximum energy! Dancing, singing, jumping, running -- the wildest, most physical challenges for kids who need to move!",
    audience: "classroom",
    icon: "rocket",
    color: "#FF4757",
    challengeIndices: [250, 251, 253, 255, 258, 259, 262, 267, 272, 277, 279, 289],
  },
];

// ──────────────────────────────────────────────
// Badges
// ──────────────────────────────────────────────

const BADGES = [
  {
    name: "First Steps",
    description: "Completed your very first challenge. Everyone starts somewhere!",
    icon: "footprints",
    category: "participation",
    criteria: { type: "challenges_completed", count: 1 },
  },
  {
    name: "High Five",
    description: "Completed 5 challenges. You're getting the hang of this!",
    icon: "hand",
    category: "participation",
    criteria: { type: "challenges_completed", count: 5 },
  },
  {
    name: "Perfect Ten",
    description: "Completed 10 challenges. A true contender has emerged.",
    icon: "star",
    category: "participation",
    criteria: { type: "challenges_completed", count: 10 },
  },
  {
    name: "Speed Demon",
    description: "Submitted a challenge response in under 10 seconds. Lightning fast!",
    icon: "zap",
    category: "speed",
    criteria: { type: "speed_submission", max_seconds: 10 },
  },
  {
    name: "Crowd Favorite",
    description: "Won the popular vote in 3 or more challenges. The people have spoken!",
    icon: "heart",
    category: "social",
    criteria: { type: "vote_wins", count: 3 },
  },
  {
    name: "Comeback Kid",
    description: "Jumped 5 or more places on the leaderboard in a single round. Never count this one out.",
    icon: "trending-up",
    category: "performance",
    criteria: { type: "leaderboard_jump", positions: 5 },
  },
  {
    name: "Consistency King",
    description: "Scored above average in every round of an event. Steady wins the race.",
    icon: "crown",
    category: "performance",
    criteria: { type: "above_average_all_rounds" },
  },
  {
    name: "Team Player",
    description: "Participated in 3 team-based challenges. Together everyone achieves more!",
    icon: "users",
    category: "teamwork",
    criteria: { type: "team_challenges", count: 3 },
  },
  {
    name: "Bold Move",
    description: "Completed a challenge rated 'legend' intensity. That took serious courage.",
    icon: "flame",
    category: "courage",
    criteria: { type: "intensity_completed", level: "legend" },
  },
  {
    name: "Quiet Storm",
    description: "Won 3 challenges from the low-noise pack. Proof that you don't need volume to dominate.",
    icon: "cloud",
    category: "skill",
    criteria: { type: "pack_wins", pack: "classroom_low_noise", count: 3 },
  },
  {
    name: "Triple Threat",
    description: "Won challenges in 3 different categories. A versatile performer.",
    icon: "trophy",
    category: "versatility",
    criteria: { type: "category_wins", distinct_categories: 3 },
  },
  {
    name: "Icebreaker",
    description: "Was the first person to submit in any challenge. Setting the pace!",
    icon: "snowflake",
    category: "speed",
    criteria: { type: "first_submission" },
  },
  {
    name: "Iron Will",
    description: "Completed every challenge in an event without missing one. Unstoppable dedication.",
    icon: "shield",
    category: "dedication",
    criteria: { type: "all_challenges_completed_in_event" },
  },
  {
    name: "Creative Genius",
    description: "Won the judge vote in 3 creativity-category challenges. Your imagination knows no bounds.",
    icon: "lightbulb",
    category: "creativity",
    criteria: { type: "judge_wins_in_category", category: "Creativity", count: 3 },
  },
  {
    name: "Grand Champion",
    description: "Finished first place overall in an event. You are the undisputed champion!",
    icon: "medal",
    category: "achievement",
    criteria: { type: "event_first_place" },
  },
];

// ──────────────────────────────────────────────
// Main seed function
// ──────────────────────────────────────────────

async function seed() {
  console.log("Seeding database...");

  // --- 0. Clear existing seed data ---
  console.log("Clearing existing data...");
  await db.delete(packChallenges);
  await db.delete(challengePacks);
  await db.delete(badges);
  await db.execute(rawSql`DELETE FROM challenge_templates WHERE is_system = true`);
  console.log("Cleared.");

  // --- 1. Insert challenge templates ---
  console.log(`Inserting ${CHALLENGES.length} challenge templates...`);

  const challengeValues = CHALLENGES.map(
    ([title, category, intensity, duration, movement, noise, submission, audience, audiencePack, instructions]) => ({
      title,
      shortDescription: instructions.slice(0, 120) + (instructions.length > 120 ? "..." : ""),
      fullInstructions: instructions,
      audience,
      audiencePack,
      category,
      intensityTone: intensity,
      durationSeconds: dur(duration),
      movementLevel: mov(movement),
      noiseLevel: noi(noise),
      submissionType: submission,
      scoringType: scoringType(submission),
      safetyFlags: [],
      isSystem: true,
    })
  );

  // Batch insert in chunks of 50 to avoid query size limits
  const CHUNK_SIZE = 50;
  const insertedChallenges: { id: string }[] = [];

  for (let i = 0; i < challengeValues.length; i += CHUNK_SIZE) {
    const chunk = challengeValues.slice(i, i + CHUNK_SIZE);
    const result = await db
      .insert(challengeTemplates)
      .values(chunk)
      .returning({ id: challengeTemplates.id });
    insertedChallenges.push(...result);
    console.log(`  ...inserted challenges ${i + 1}-${i + chunk.length}`);
  }

  console.log(`Inserted ${insertedChallenges.length} challenges.`);

  // --- 1b. Insert interactive challenge templates ---
  console.log(`Inserting ${INTERACTIVE_CHALLENGES.length} interactive challenges...`);

  const interactiveValues = INTERACTIVE_CHALLENGES.map((c) => ({
    title: c.title,
    shortDescription: c.instructions.slice(0, 120) + (c.instructions.length > 120 ? "..." : ""),
    fullInstructions: c.instructions,
    audience: c.audience,
    audiencePack: c.audiencePack,
    category: c.category,
    intensityTone: c.intensity,
    durationSeconds: dur(c.duration),
    movementLevel: mov(c.movement),
    noiseLevel: noi(c.noise),
    submissionType: c.submission,
    scoringType: scoringType(c.submission),
    safetyFlags: [],
    isSystem: true,
    interactiveData: c.interactiveData,
  }));

  const insertedInteractive = await db
    .insert(challengeTemplates)
    .values(interactiveValues)
    .returning({ id: challengeTemplates.id });

  console.log(`Inserted ${insertedInteractive.length} interactive challenges.`);

  // --- 2. Insert challenge packs ---
  console.log(`Inserting ${PACKS.length} challenge packs...`);

  const insertedPacks = await db
    .insert(challengePacks)
    .values(
      PACKS.map(({ name, description, audience, icon, color }) => ({
        name,
        description,
        audience,
        icon,
        color,
        isSystem: true,
      }))
    )
    .returning({ id: challengePacks.id });

  console.log(`Inserted ${insertedPacks.length} packs.`);

  // --- 3. Insert pack-challenge associations ---
  console.log("Inserting pack-challenge associations...");

  const packChallengeValues: {
    packId: string;
    challengeId: string;
    orderIndex: number;
  }[] = [];

  PACKS.forEach((pack, packIndex) => {
    pack.challengeIndices.forEach((challengeIndex, orderIndex) => {
      packChallengeValues.push({
        packId: insertedPacks[packIndex].id,
        challengeId: insertedChallenges[challengeIndex].id,
        orderIndex,
      });
    });
  });

  await db.insert(packChallenges).values(packChallengeValues);
  console.log(`Inserted ${packChallengeValues.length} pack-challenge associations.`);

  // --- 4. Insert badges ---
  console.log(`Inserting ${BADGES.length} badges...`);

  await db.insert(badges).values(
    BADGES.map((badge) => ({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      criteria: badge.criteria,
      isSystem: true,
    }))
  );

  console.log(`Inserted ${BADGES.length} badges.`);

  console.log("Seed complete!");
}

seed()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
