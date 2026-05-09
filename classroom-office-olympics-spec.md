# Classroom & Office Olympics Product Spec

## Overview

Classroom & Office Olympics is a mobile-first web application for running safe, high-energy challenge competitions in classrooms and workplaces. The product is built around a large prewritten challenge library so hosts can launch events quickly without needing to invent activities themselves, while still allowing custom challenge creation when needed.[cite:27][cite:32][cite:45]

The app combines live events, points, leaderboards, tournament mode, moderation, and audience-specific challenge packs. Classroom content should focus on fun, laughter, creativity, teamwork, and safe boundary-testing, while office content should also support more formal goals such as communication, collaboration, recognition, innovation, and company culture.[cite:36][cite:37][cite:40][cite:45]

## Product goals

- Let a host launch a challenge event in under 3 minutes using mostly built-in content.[cite:45]
- Make the experience feel playful and social, not like a quiz platform or admin tool.[cite:24][cite:25][cite:35]
- Support both individual and team competition with live scores, progress feedback, and tournament structures.[cite:42][cite:49][cite:57]
- Keep the experience safe through challenge design, moderation controls, and configurable safety filters.[cite:28][cite:30][cite:33]
- Make leaderboards motivating for more than just the top few users by showing local rank, progress to next place, and team-based standings.[cite:42][cite:49]

## Target users

### Primary users
- Teachers and facilitators running classroom activities.
- Office managers, trainers, team leads, and people-and-culture teams running workplace events.
- Students and employees joining live events from their phones.

### Secondary users
- Schools running house competitions or homeroom activities.
- Companies running onboarding, team-building, offsites, recognition programs, and workshop energizers.[cite:37][cite:40][cite:54]

## Product positioning

The product is best positioned as a curated challenge engine rather than a blank challenge builder. The core promise is that the library is comprehensive enough that most hosts will never need to create their own challenges, but the platform still supports custom content for special contexts, branding, training, or local culture.[cite:27][cite:36][cite:45]

Suggested positioning line:

**Funny when you want it. Professional when you need it.**

## Design principles

- Mobile-first, because participants will usually join and play on phones.
- Host-light, because setup friction kills energy before the game starts.
- Library-led, because prebuilt content protects quality and speed.
- Safe but bold, because the fun comes from mild social bravery and creative awkwardness rather than physical or legal risk.[cite:24][cite:25][cite:28][cite:33]
- Motivating for everyone, not just top performers, through scoped leaderboards, team modes, badges, streaks, and progress-to-next-rank indicators.[cite:42][cite:49][cite:57]

## User roles

| Role | Permissions |
|---|---|
| Admin | Manage organization settings, branding, user access, challenge packs, moderation defaults |
| Host | Create and run events, choose packs, randomize rounds, score, moderate, export results |
| Moderator/Judge | Review submissions, approve media, award judge bonus points, remove unsafe entries |
| Participant | Join by code, complete challenges, submit answers or media, react, view scores |
| Team captain (optional) | Submit on behalf of team, confirm readiness, manage team response |

## Core app features

### 1. Event creation
- Create event in classroom mode or office mode.
- Choose team-based or individual play.
- Select audience, tone, time limit, and safety profile.
- Choose a ready-made pack, build a mix from the library, or add custom challenges.
- Generate join code and lobby.

### 2. Challenge library
- Large built-in library with strong filtering and search.
- Filter by audience, tone, category, duration, group size, noise level, safety profile, materials needed, and intensity.
- Duplicate and edit a library challenge to make a custom variant.
- Save favorites and reusable challenge packs.[cite:27][cite:45]

### 3. Live gameplay
- Active challenge card with timer.
- Submission options: done/not done, multiple choice, text, photo, video, judge score, team vote.
- Reactions and hype elements such as countdown, reveal, podium, streaks, and badges.
- Skip, replace, or randomize next challenge.

### 4. Points and rewards system
- Base points for completion.
- Bonus points for correctness, speed, creativity, teamwork, or crowd vote.
- Penalties or disqualification for rule-breaking.
- Achievement badges and milestone rewards.
- Progress to next rank and personal best indicators.[cite:42][cite:49][cite:55][cite:57]

### 5. Leaderboards
- Event leaderboard.
- Round leaderboard.
- Team leaderboard.
- Cohort leaderboard, such as class, department, or table group.
- Local-rank display so users compare against nearby positions instead of only top spots.[cite:42][cite:49][cite:60]

### 6. Tournament mode
- Knockout bracket.
- Round robin.
- Heat-based progression.
- Finals round with weighted points.
- Medal table and MVP awards.

### 7. Moderation and safety
- Challenge safety tags.
- Host approval for sensitive submission types.
- Remove participant or submission.
- Content reporting.
- Emergency pause and replace challenge.
- Admin-safe defaults by organization type.[cite:28][cite:30][cite:33]

## Audience modes

### Classroom mode
Prioritizes laughter, teamwork, confidence, creativity, observation, improv, and safe social bravery. It should avoid anything humiliating, dangerous, exclusionary, sexually suggestive, invasive, or physically unsafe.[cite:24][cite:25][cite:28][cite:33]

### Office mode
Supports two sub-modes:
- Social mode: fun icebreakers, creative team challenges, energizers, scavenger hunts, and light performance tasks.[cite:27][cite:32][cite:45]
- Professional mode: communication, values, recognition, innovation, presentation, listening, onboarding, and collaboration challenges with a more polished tone.[cite:36][cite:37][cite:40][cite:54]

## Safety framework

### Hard bans
The app should never include or reward:
- Illegal activity.
- Dangerous physical actions.
- Running, climbing, throwing objects, or contact-based dares.
- Property damage or mess-making.
- Sexual, discriminatory, or demeaning content.
- Filming people without consent.
- Harassment, pranks, or targeted embarrassment.
- Pressure to reveal secrets, beliefs, health issues, or private information.[cite:24][cite:28][cite:30][cite:33]

### Safety labels per challenge
Each challenge should include:
- Audience: classroom, office, or both.
- Age/maturity band.
- Intensity: Mild, Bold, Chaos, Legend.
- Noise level: Quiet, Medium, Loud.
- Physical requirement: Seated, Standing, Moving.
- Materials needed.
- Supervision requirement.
- Submission type.
- Risk notes.

## Challenge taxonomy

| Dimension | Options |
|---|---|
| Audience | Classroom, Office, Universal |
| Tone | Funny, Balanced, Professional, Workshop, Offsite |
| Category | Improv, Creativity, Teamwork, Observation, Communication, Recognition, Innovation, Presentation, Social courage, Logic, Scavenger |
| Intensity | Mild, Bold, Chaos, Legend |
| Duration | 30 sec, 1 min, 2 min, 5 min, 10 min |
| Format | Solo, Pair, Team, Whole-room |
| Submission type | Instant judge, text, choice, vote, photo, video, completion tap |
| Movement level | Seated, Light movement, Room movement |
| Noise level | Quiet, Medium, Loud |

## Points system

The point economy should feel simple but meaningful. Best practice sources recommend clear point values, visible progress, and rewards beyond pure rank so more users stay motivated.[cite:42][cite:49][cite:55][cite:57]

### Standard scoring model
- Participation/completion: 10 points.
- Correct or successful outcome: +10 points.
- First place speed bonus: +8 points.
- Second place speed bonus: +5 points.
- Creativity/judge bonus: 0–10 points.
- Teamwork bonus: 0–5 points.
- Crowd favorite bonus: +5 points.
- Rule breach: 0 points or disqualification.

### Alternative scoring presets
- **Party mode:** heavier bonus for laughs, creativity, and crowd vote.
- **Balanced mode:** mix of completion, speed, and quality.
- **Professional mode:** more weight on collaboration, presentation, quality, and judged criteria.
- **Learning mode:** more weight on participation, teamwork, and effort rather than top placement.[cite:49][cite:51][cite:54]

### Additional reward mechanics
- Daily/weekly badges.
- First win badge.
- Streak badge.
- Most improved badge.
- Team spirit badge.
- Creative chaos badge.
- Best presenter badge.
- Office values badge.[cite:42][cite:57][cite:60]

## Leaderboard design

Poorly designed leaderboards can demotivate most users, so the product should avoid a single giant rank list as the only feedback mechanism. Better approaches include scoped leaderboards, nearby-rank displays, team-based standings, milestone badges, and progress bars to the next rank.[cite:42][cite:49]

Required leaderboard views:
- Top 3 podium.
- My rank card.
- Nearby ranks, for example positions 7 to 11.
- Team standings.
- Department/class standings.
- Round-by-round progress.
- Personal bests and badges.[cite:42][cite:49][cite:60]

## Event modes

- Quick Play: fast 5 to 10 challenge session.
- Pack Play: choose one themed library pack.
- Tournament: bracketed rounds and finals.
- Round Robin: all teams compete across multiple rounds.
- Workshop Mode: office-friendly set of formal and playful challenges.
- Assembly Mode: host-led big room format with projection-friendly scoreboard.
- Async Sprint, later phase: complete within a time window.[cite:37][cite:45]

## Recommended screen list

1. Landing page.
2. Sign in / guest host flow.
3. Host dashboard.
4. Create event wizard.
5. Challenge library browser.
6. Pack builder.
7. Custom challenge builder.
8. Lobby / join by code.
9. Active challenge screen.
10. Submission / review screen.
11. Live leaderboard.
12. Tournament bracket.
13. Results / awards screen.
14. Admin content and moderation panel.

## Functional requirements

### Event setup
- Host can create event name, audience type, date, duration, team settings, scoring preset, and safety defaults.
- Host can select ready-made challenge pack or build one manually.
- Host can add custom challenges or duplicate library challenges.
- Host can preview challenge sequence before launch.

### Join flow
- Participants join via code.
- Optional nickname, avatar, team selection, or team auto-assignment.
- Ready-state in lobby.

### Challenge runtime
- Countdown before round starts.
- Display challenge instructions clearly on mobile.
- Enable timer, submission action, and optional evidence upload.
- Lock submissions when timer ends.
- Show result reveal and score update.

### Moderation
- Queue for uploaded content.
- Manual scoring interface.
- Warnings and disqualification tools.
- Replace current challenge with backup challenge.

### Reporting
- Event summary.
- Top teams and top individuals.
- Most-used challenge packs.
- Engagement stats such as rounds completed and participation rate.
- Exportable results report.

## Non-functional requirements

- Mobile-first responsive web app.
- Real-time updates for scores and leaderboard changes.
- Accessible touch targets and clear type hierarchy.
- Fast load time on normal mobile connections.
- Safe handling of image/video uploads.
- Admin-level content controls.
- Support for organization-specific private packs.

## Suggested tech stack

- Frontend: Next.js or React with Tailwind.
- Backend: Supabase.
- Database: Postgres.
- Auth: guest join plus email or SSO for hosts.
- Storage: Supabase Storage for optional uploads.
- Real-time: Supabase Realtime.
- Hosting: Vercel.

This stack suits a responsive web app with live events, fast CRUD workflows, reusable content packs, and real-time leaderboard updates.

## Data model

### Core tables
- organizations
- users
- events
- teams
- participants
- challenge_templates
- challenge_packs
- pack_challenges
- event_challenges
- submissions
- score_entries
- leaderboard_snapshots
- badges
- participant_badges
- bracket_matches
- moderation_flags

### Key fields for challenge_templates
| Field | Description |
|---|---|
| id | Unique identifier |
| title | Challenge title |
| short_description | Short mobile-friendly prompt |
| full_instructions | Expanded instructions |
| audience | Classroom, Office, Universal |
| office_tone | Social, Balanced, Professional |
| classroom_tone | Mild, Bold, Chaos, Legend |
| category | Challenge category |
| duration_seconds | Challenge duration |
| team_size_min | Minimum team size |
| team_size_max | Maximum team size |
| movement_level | Seated, Light movement, Room movement |
| noise_level | Quiet, Medium, Loud |
| materials | Materials list |
| submission_type | Tap, Text, Choice, Photo, Video, Judge |
| scoring_type | Auto, Judge, Hybrid |
| safety_flags | JSON array of restrictions |
| risk_notes | Safety notes |
| is_system | Built-in or custom |
| is_active | Active status |

## Seed challenge library

The product should launch with a large prebuilt challenge library. Below is a starter set of 100 challenge ideas across classroom and office contexts. Many are inspired by common team-building, kid-safe dare, and workplace challenge formats, but they are rewritten and structured as original in-app content.[cite:24][cite:25][cite:27][cite:32][cite:45]

### Classroom library

| # | Challenge | Category | Intensity | Duration | Summary |
|---|---|---|---|---|---|
| 1 | Robot Roll Call | Improv | Mild | 30s | Say your name like a malfunctioning robot |
| 2 | Statue Switch | Performance | Mild | 1m | Freeze in a silly pose when the timer sound hits |
| 3 | Pencil Microphone | Improv | Bold | 1m | Deliver a dramatic weather report using a pencil mic |
| 4 | Mystery Object Ad | Creativity | Bold | 2m | Sell a random classroom object like it is luxury tech |
| 5 | Silent Line-Up | Teamwork | Mild | 2m | Line up by birthday month without speaking |
| 6 | One-Word Story Panic | Teamwork | Chaos | 2m | Build a story one word at a time under time pressure |
| 7 | Emoji Face Relay | Performance | Mild | 1m | Recreate three emoji faces before time runs out |
| 8 | Backwards Teacher Intro | Improv | Bold | 1m | Introduce the teacher like they are a celebrity guest |
| 9 | Compliment Chain | Social courage | Mild | 2m | Pass genuine compliments around the circle quickly |
| 10 | Slow-Motion Celebration | Performance | Mild | 30s | Act out winning a gold medal in slow motion |
| 11 | Alien Explains Lunch | Improv | Bold | 1m | Explain lunch as if you have never seen food before |
| 12 | Whisper Sketch | Teamwork | Mild | 3m | Draw from whispered instructions only |
| 13 | Chaotic News Team | Teamwork | Chaos | 2m | Present a breaking story with anchor, reporter, and witness |
| 14 | Backpack Treasure Hunt | Scavenger | Mild | 1m | Find three safe common items fastest |
| 15 | Reverse Charades Mini | Teamwork | Bold | 2m | One guesser, everyone else acts it out |
| 16 | Desk Drum Intro | Performance | Mild | 30s | Create a 5-second intro theme on desk or table safely |
| 17 | Most Dramatic Reading | Performance | Bold | 1m | Read a simple sentence like a movie trailer |
| 18 | Fake Product Pitch | Creativity | Bold | 2m | Invent a ridiculous new school supply |
| 19 | Human Emoji Combo | Teamwork | Mild | 1m | Group creates an emoji-inspired pose |
| 20 | Mirror Me | Social courage | Mild | 1m | Copy a teammate’s silly expression exactly |
| 21 | Superhero Homeroom | Improv | Bold | 1m | Rename the class as a superhero team |
| 22 | Riddle Rush | Logic | Mild | 2m | Solve a fast riddle set |
| 23 | Pass the Sound | Teamwork | Mild | 1m | One sound effect travels around the group and mutates |
| 24 | Chairside Commercial | Creativity | Bold | 2m | Make a commercial for a chair |
| 25 | Freeze and Resume | Performance | Mild | 1m | Keep acting whenever music or timer resumes |
| 26 | Mystery Mood Walk | Performance | Bold | 1m | Walk across the room with a secret mood |
| 27 | Team Mascot Creation | Creativity | Bold | 3m | Invent a mascot and chant |
| 28 | Fastest Tidy Trio | Scavenger | Mild | 2m | Organize assigned items neatly as a team |
| 29 | Story Genre Flip | Improv | Chaos | 2m | Retell a normal school moment as horror, action, or romance |
| 30 | Soundtrack My Entrance | Performance | Bold | 1m | Announce your own dramatic entrance music |
| 31 | Secret Talent Lite | Social courage | Bold | 2m | Show a harmless mini talent in 10 seconds |
| 32 | Team Tableaux | Teamwork | Mild | 2m | Create a frozen scene from a chosen theme |
| 33 | Compliment Speed Round | Social courage | Mild | 1m | Deliver the nicest short compliment possible |
| 34 | Word Ban Challenge | Logic | Mild | 2m | Explain an object without using banned words |
| 35 | Two Truths Too Silly | Improv | Mild | 2m | Give two true facts and one obviously silly fake |
| 36 | Reverse Interview | Improv | Bold | 2m | The student interviews the “famous” teacher |
| 37 | Team Sound Logo | Creativity | Mild | 1m | Make a short sound identity for your team |
| 38 | Mime the Morning | Performance | Bold | 1m | Act out your morning routine silently |
| 39 | Giant Reaction Face | Performance | Mild | 30s | Best exaggerated shocked face wins |
| 40 | Build a Motto | Creativity | Mild | 2m | Team creates a funny class motto |
| 41 | Object Transformation | Creativity | Bold | 2m | Pretend one object is five different things |
| 42 | Name That Noise | Observation | Mild | 1m | Guess everyday sound effects |
| 43 | Story Ending Save | Improv | Bold | 2m | Rescue a terrible story ending in one sentence |
| 44 | Ultimate Team Handshake | Teamwork | Bold | 3m | Create a safe no-contact or low-contact handshake sequence |
| 45 | Guess the Drawing | Teamwork | Mild | 2m | Team sketch-and-guess round |
| 46 | Fast Facts Face-Off | Social | Mild | 1m | Tell a weird harmless fact confidently |
| 47 | Silent Emoji Scene | Teamwork | Mild | 2m | Recreate a full scene without talking |
| 48 | Theme Song Remix | Creativity | Bold | 2m | Turn a school routine into a theme song |
| 49 | Tiny TED Talk | Presentation | Bold | 2m | Give a mini talk on a ridiculous topic |
| 50 | The Golden Pencil Awards | Performance | Bold | 2m | Deliver an acceptance speech for a fake award |

### Office library

| # | Challenge | Category | Tone | Duration | Summary |
|---|---|---|---|---|---|
| 51 | Elevator Pitch Roulette | Presentation | Professional | 2m | Pitch a random object or idea like a startup founder |
| 52 | Reverse Brainstorm | Innovation | Professional | 3m | Generate the worst possible solutions first |
| 53 | Meeting Translator | Communication | Balanced | 2m | Translate buzzwords into plain English |
| 54 | Value in Action | Recognition | Professional | 2m | Share a real example of a company value in action |
| 55 | One-Slide Story | Presentation | Professional | 3m | Present a topic using only one visual |
| 56 | Silent Ranking | Collaboration | Balanced | 2m | Rank options as a team without speaking |
| 57 | Desk Safari | Scavenger | Social | 2m | Find common office items matching prompts |
| 58 | Commercial Break | Creativity | Social | 2m | Create a fake ad for office supplies |
| 59 | Compliment Cascade | Recognition | Balanced | 2m | Rapid-fire appreciative recognition round |
| 60 | Explain It to a 5-Year-Old | Communication | Professional | 2m | Simplify a work concept clearly |
| 61 | Team Motto Sprint | Culture | Balanced | 2m | Write a motto for the team this week |
| 62 | Emoji Project Update | Communication | Social | 1m | Explain project status using emojis first |
| 63 | Blind Sketch Brief | Collaboration | Balanced | 3m | One person describes, one person draws |
| 64 | PowerPoint Karaoke Lite | Presentation | Social | 3m | Present a mystery slide deck or prompt |
| 65 | Innovation Mash-Up | Innovation | Professional | 3m | Combine two unrelated ideas into one pitch |
| 66 | Customer Empathy Minute | Communication | Professional | 2m | Explain a user pain point in one minute |
| 67 | Best Bad Idea | Innovation | Social | 2m | Pitch the funniest terrible product idea |
| 68 | The Polite Debate | Communication | Professional | 3m | Debate a harmless topic with formal structure |
| 69 | Recognition Relay | Recognition | Professional | 2m | Each person calls out a colleague contribution |
| 70 | Jargon Jar | Communication | Balanced | 2m | Replace jargon with clearer wording |
| 71 | Office Olympics Oath | Culture | Social | 1m | Perform a dramatic opening pledge |
| 72 | Team News Desk | Presentation | Balanced | 2m | Deliver the week’s wins as a news bulletin |
| 73 | Build the Agenda | Collaboration | Professional | 2m | Order meeting priorities under time pressure |
| 74 | The 30-Second Demo | Presentation | Professional | 1m | Demo a process or tool quickly |
| 75 | Sticky Note Sprint | Innovation | Balanced | 3m | Generate as many ideas as possible in a time box |
| 76 | Mystery Client Brief | Problem-solving | Professional | 3m | Respond to a weird but safe mock brief |
| 77 | Team Trivia About Us | Culture | Social | 2m | Guess harmless facts about the team |
| 78 | Positive Spin Challenge | Communication | Balanced | 2m | Turn a bland update into an energizing one |
| 79 | Two-Minute Workshop Host | Leadership | Professional | 3m | Lead a tiny training moment |
| 80 | Whiteboard War | Collaboration | Balanced | 3m | Draw and explain a process visually |
| 81 | Redesign the Break Room | Innovation | Social | 3m | Pitch a better staff space |
| 82 | Mission Statement Remix | Culture | Professional | 2m | Rewrite a mission statement in plain language |
| 83 | Listening Loop | Communication | Professional | 2m | Repeat and build on the previous speaker accurately |
| 84 | Mood Meter Check-In | Wellbeing | Balanced | 1m | Team check-in with safe mood prompts |
| 85 | Thank-You Lightning Round | Recognition | Professional | 1m | Thank someone for a specific contribution |
| 86 | Office Mascot Rebrand | Creativity | Social | 2m | Invent a mascot for your team or department |
| 87 | Pitch the Impossible Policy | Creativity | Social | 2m | Sell a ridiculous fake office policy |
| 88 | Problem Statement Slam | Problem-solving | Professional | 2m | Define a real problem clearly in one minute |
| 89 | Guess the Graph | Observation | Balanced | 2m | Interpret a simple visual quickly |
| 90 | Productivity Myth Busters | Learning | Professional | 2m | Bust a common workplace myth |
| 91 | Customer Journey Freeze Frame | Collaboration | Professional | 3m | Team creates staged moments from a user journey |
| 92 | Email Rewrite Rescue | Communication | Professional | 2m | Rewrite a confusing email clearly |
| 93 | The Better Brief | Communication | Professional | 2m | Turn a vague ask into a usable brief |
| 94 | Recognition Awards Host | Presentation | Balanced | 2m | Emcee a mini awards ceremony |
| 95 | Fast Facilitation Face-Off | Leadership | Professional | 3m | Run a tiny group discussion well |
| 96 | Cross-Team Translator | Collaboration | Professional | 2m | Explain one team’s work to another simply |
| 97 | Innovation Lightning Board | Innovation | Professional | 3m | Each person gives one fast improvement idea |
| 98 | Workstyle Guess Who | Culture | Social | 2m | Match anonymous habits to teammates |
| 99 | The Calm Crisis Drill | Problem-solving | Professional | 3m | Respond to a mock scenario with clear priorities |
| 100 | Proud Win Story | Recognition | Professional | 2m | Share a recent team win with structure |

## Example challenge packs

### Classroom packs
- Laugh Lab: high-energy funny classroom challenges.
- Quiet Chaos: low-noise but still silly.
- Confidence Quest: social bravery and mini-performance.
- Team Tangle: teamwork-heavy rounds.
- Assembly Gold: larger-room presenter-led pack.

### Office packs
- Friday Fun Pack: social, funny, low-stakes challenges.
- Workshop Energizer Pack: short activities between sessions.
- Team Culture Pack: recognition, values, and appreciation.
- Innovation Sprint Pack: ideation and problem-solving.
- Leadership Lite Pack: communication, facilitation, and mini-presentation challenges.[cite:36][cite:37][cite:40][cite:45]

## Custom challenge creation

Custom challenge creation should exist, but it should be secondary and structured. Hosts should be encouraged to duplicate and edit a library challenge before creating from scratch, which preserves quality and reduces risk.[cite:27][cite:45]

Custom builder fields:
- Title.
- Audience.
- Tone.
- Category.
- Duration.
- Instructions.
- Allowed materials.
- Submission type.
- Scoring method.
- Safety restrictions.
- Host notes.

Validation rules:
- Flag banned words or unsafe mechanics.
- Require safety confirmation.
- Block known prohibited challenge patterns.
- Require host acknowledgment before publishing.

## UX direction

The UI should feel playful, warm, and effortless for participants, while staying clean and practical for hosts. The participant side should emphasize big challenge cards, timer, score, and reactions, while the host side should emphasize control, speed, moderation, and live event visibility.[cite:1]

### Mobile UX priorities
- Join code first.
- Large tap targets.
- Minimal steps to submit.
- Sticky timer and score header.
- Clear current place and points-to-next-rank.
- Fast transitions between rounds.

### Host UX priorities
- Launch in under 3 minutes.
- Search/filter packs quickly.
- Swap challenge mid-round.
- Score manual rounds fast.
- See leaderboard and moderation in one control panel.

## Build prompt

Use the following as the implementation prompt for an AI builder:

> Build a mobile-first responsive web app called Classroom & Office Olympics. It is a live challenge competition platform for schools and workplaces. The app should be powered primarily by a very large built-in library of safe prewritten challenges so most hosts do not need to create their own content. It must still allow structured custom challenge creation.
>
> Core requirements:
> - Audience modes: Classroom and Office.
> - Office sub-modes: Social, Balanced, Professional.
> - Features: event creation wizard, challenge library, challenge packs, custom challenge builder, join by code, lobby, live round screen, timer, submissions, scoring, badges, leaderboard, tournament mode, moderation, results screen, admin content tools.
> - Scoring: base points, speed bonus, judge bonus, teamwork bonus, badges, local-rank progress, team and individual leaderboards.
> - Safety: block illegal, dangerous, humiliating, sexual, invasive, discriminatory, prank-based, and unsafe-contact challenges.
> - UX: warm, playful, clean, modern; participant-first on mobile; host-friendly dashboard; live leaderboard; strong responsive design.
> - Seed the database with the included 100 challenge templates and sample challenge packs.
> - Include data model, reusable components, and real-time event updates.
>
> Build the product so it feels funny and high-energy for classrooms, but can also support more formal workplace team-building and communication challenges.

## MVP scope

### In scope
- Host creates and runs live events.
- Participants join by code.
- Library browsing and challenge packs.
- Custom challenge creation.
- Points, badges, leaderboard, and tournament mode.
- Manual and automatic scoring.
- Basic moderation controls.
- Results and awards screen.

### Out of scope for MVP
- Advanced analytics dashboards.
- AI-generated challenge authoring.
- Multi-language support.
- Marketplace for community packs.
- Deep LMS or HRIS integrations.
- Native mobile apps.

## Roadmap ideas

### Phase 2
- AI-assisted pack recommendations.
- Organization-private challenge libraries.
- Theme branding per school or company.
- Projector mode.
- Advanced analytics.
- Seasonal events and campaigns.

### Phase 3
- Community-submitted packs with review workflow.
- Cross-organization leagues.
- Achievement economy across multiple events.
- Public profile and reputation layers.

## Success metrics

- Time to first event launched.
- Percentage of events using built-in library only.
- Challenge completion rate.
- Average rounds per event.
- Repeat host rate.
- Participant return rate.
- Average number of submissions per event.
- Badge earn rate.
- Percentage of challenges skipped or replaced.
- Safety moderation incidents per 100 events.

## Final guidance

The strongest version of this product is not a blank game builder and not a quiz app. It is a curated challenge platform with strong live-event mechanics, a motivating points system, and a deep enough library that hosting feels easy, safe, and genuinely fun for both classrooms and workplaces.[cite:27][cite:36][cite:42][cite:49]
