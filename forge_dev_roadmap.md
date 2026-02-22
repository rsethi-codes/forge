# FORGE — STATUS: 🚀 FULLY OPERATIONAL

Build me a full-stack web application called FORGE. This is a personal productivity and professional branding tool built for a software engineer (me) who is executing a 60-day intensive self-learning program to become a Senior React Engineer after being laid off. The app has two core modules: a Roadmap Tracker and a Dev Blog. Here is every requirement in complete detail.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT & TONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The user (me) got laid off when my startup shut down. I am now executing a 60-day roadmap to become a Senior React / Next.js / Real-Time UI engineer and land a 20-35 LPA job. This app is my accountability partner, my progress tracker, and my public voice during this journey.

The app's internal tone (dashboard, motivation messages, discipline scores) must be:
- Brutally honest. No sugarcoating. No "great job!" when I miss a day.
- Direct. If I slack, the app tells me clearly: "You missed yesterday. Your discipline score dropped 8 points. Get back on track."
- Motivating through honesty, not through false positivity.
- Aware of the goal: every message should remind me what I'm working toward (Senior React Engineer, 20-35 LPA, comeback from layoff).

The app's public-facing side (blog, public profile) must be:
- Professional, clean, impressive.
- It should make someone visiting my blog think: "This person is seriously committed, technically sharp, and exactly who we want to hire."
- No mention of "layoff" framing on the public side — the narrative is "engineer leveling up aggressively" not "unemployed person looking for work."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Framework: Next.js 14 with App Router and TypeScript (strict mode)
- Database: Supabase (PostgreSQL) for all data + Supabase Storage for file uploads
- Auth: Supabase Auth (email + magic link, single user — just me)
- ORM: Drizzle ORM with type-safe queries
- Styling: Tailwind CSS with a custom dark theme (not default Tailwind dark — create a distinct design system)
- Blog Editor: Tiptap rich text editor with: bold, italic, headings (H1-H3), code blocks with syntax highlighting (lowlight), blockquotes, bullet lists, ordered lists, images (upload to Supabase Storage), horizontal rule, links
- File Parsing: mammoth.js for DOCX parsing, pdf-parse for PDF parsing (server-side API route)
- Charts & Visualization: Recharts for all analytics charts
- Hosting: Vercel (configure vercel.json appropriately)
- Email: Resend for transactional emails (daily accountability email)
- Markdown rendering for public blog: react-markdown with rehype-highlight for code blocks
- Slug generation: slugify library
- Date handling: date-fns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA (Supabase / PostgreSQL via Drizzle)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Table: roadmap_programs
- id: uuid primary key
- title: text (e.g. "60-Day Senior React Engineer Roadmap")
- description: text
- total_days: integer
- start_date: date (when the user started)
- created_at: timestamp
- raw_content: text (full extracted text from uploaded file, stored for re-parsing)
- file_url: text (Supabase Storage URL of the original file)

Table: roadmap_months
- id: uuid primary key
- program_id: uuid (FK to roadmap_programs)
- month_number: integer
- title: text
- objective: text
- outcome: text
- sort_order: integer

Table: roadmap_weeks
- id: uuid primary key
- month_id: uuid (FK to roadmap_months)
- week_number: integer
- title: text
- goal: text
- sort_order: integer

Table: roadmap_days
- id: uuid primary key
- week_id: uuid (FK to roadmap_weeks)
- day_number: integer (1-60, absolute)
- day_of_week: integer (1-7 within week)
- title: text
- focus: text
- estimated_hours: numeric (default 8)
- sort_order: integer

Table: roadmap_tasks
- id: uuid primary key
- day_id: uuid (FK to roadmap_days)
- title: text
- description: text
- sort_order: integer
- task_type: enum ('study', 'build', 'review', 'mock')

Table: roadmap_topics
- id: uuid primary key
- day_id: uuid (FK to roadmap_days)
- topic_number: text (e.g. "1.1", "1.2")
- title: text
- sort_order: integer

Table: roadmap_subtopics
- id: uuid primary key
- topic_id: uuid (FK to roadmap_topics)
- content: text
- sort_order: integer

Table: knowledge_checks
- id: uuid primary key
- day_id: uuid (FK to roadmap_days)
- question_number: integer
- question_text: text
- sort_order: integer

Table: daily_progress
- id: uuid primary key
- day_id: uuid (FK to roadmap_days)
- date: date (actual calendar date the user worked on this day)
- status: enum ('not_started', 'in_progress', 'complete', 'skipped')
- hours_logged: numeric (default 0)
- session_notes: text
- started_at: timestamp
- completed_at: timestamp

Table: task_completions
- id: uuid primary key
- task_id: uuid (FK to roadmap_tasks)
- daily_progress_id: uuid (FK to daily_progress)
- completed: boolean
- completed_at: timestamp

Table: knowledge_check_results
- id: uuid primary key
- knowledge_check_id: uuid (FK to knowledge_checks)
- daily_progress_id: uuid (FK to daily_progress)
- attempted: boolean
- passed: boolean
- notes: text

Table: discipline_scores
- id: uuid primary key
- date: date (unique per day)
- streak_days: integer
- tasks_completion_rate: numeric (0.0 to 1.0)
- hours_logged: numeric
- hours_target: numeric (default 8)
- kc_pass_rate: numeric (0.0 to 1.0)
- discipline_score: numeric (0-100, computed)
- motivation_message: text (generated and stored daily)

Table: blog_posts
- id: uuid primary key
- title: text
- slug: text (unique, auto-generated from title, user can edit)
- content: jsonb (Tiptap JSON format)
- content_html: text (rendered HTML, stored for fast public page serving)
- excerpt: text (first 200 chars of plain text, auto-generated)
- cover_image_url: text
- visibility: enum ('private', 'public')
- published_at: timestamp (null if never published)
- created_at: timestamp
- updated_at: timestamp
- reading_time_minutes: integer (auto-calculated)
- view_count: integer (default 0)

Table: blog_tags
- id: uuid primary key
- name: text (unique)
- slug: text (unique)
- color: text (hex color for the tag badge)

Table: blog_post_tags (junction)
- post_id: uuid (FK to blog_posts)
- tag_id: uuid (FK to blog_tags)

Table: blog_series
- id: uuid primary key
- title: text
- slug: text (unique)
- description: text
- cover_image_url: text
- sort_order: integer

Table: blog_post_series (junction)
- post_id: uuid (FK to blog_posts)
- series_id: uuid (FK to blog_series)
- position: integer (order within series)

Table: milestones
- id: uuid primary key
- title: text
- description: text
- icon: text (emoji)
- achieved_at: timestamp (null = not yet achieved)
- criteria_type: enum ('streak', 'days_complete', 'blog_posts', 'kc_score', 'manual')
- criteria_value: integer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 1: ROADMAP TRACKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FEATURE 1.1 — FILE UPLOAD & ROADMAP PARSING

Create a setup page (/setup) that appears when no roadmap program exists yet.

The user uploads either a DOCX or PDF file (the 60-day roadmap document).

Server-side API route (/api/parse-roadmap):
- Accept multipart form data
- Detect file type (DOCX vs PDF)
- For DOCX: use mammoth.js to extract raw text and HTML
- For PDF: use pdf-parse to extract raw text
- Pass the extracted text through a structured parsing algorithm that identifies:
  * Program title and description (from document header)
  * Month sections (Month 1, Month 2)
  * Week sections within each month (Week 1, Week 2, etc.)
  * Day rows from weekly schedule tables (Day 1 through Day 60, with Focus Area and Tasks)
  * Topic sections (Topic 1.1, 1.2, etc.) with their subtopic bullet points
  * Knowledge check questions (numbered Q1-Q10 per day)
- The parsing should use regex patterns and structural heuristics to identify sections
- Return structured JSON representing the full roadmap hierarchy
- Store the raw extracted text in roadmap_programs.raw_content
- Upload original file to Supabase Storage and store URL in roadmap_programs.file_url
- Save all parsed data to the database using the schema above

After successful parsing, redirect to /dashboard.

Provide a "Re-parse" option in settings in case the parsing needs to be re-run.

Show parsing progress (file upload → text extraction → structure parsing → saving to DB) with a step indicator.

FEATURE 1.2 — DASHBOARD (Main screen after login)

The dashboard is the first thing I see every day. It must show:

TOP SECTION — "Today at a Glance":
- What day of the program today is (e.g. "Day 14 of 60")
- Current roadmap day's title and focus area
- A large, visually prominent DISCIPLINE SCORE (0-100) with a color gradient: 90+ = green, 70-89 = yellow, 50-69 = orange, below 50 = red
- Current streak (consecutive days completed) with a fire emoji if >= 7 days
- Hours logged today vs target (progress bar)
- Tasks completed today: X/Y
- Days remaining in program

MOTIVATION MESSAGE SECTION:
- A contextual message generated based on current state:
  * If streak = 0 (first day or reset): "Day 1. You have nothing yet. Build something."
  * If streak = 1-3: "You've started. That's more than most. Now don't stop."
  * If streak = 4-6: "You're building momentum. Don't waste it by going soft today."
  * If streak = 7-13: "One week of discipline. Most people give up here. Keep going."
  * If streak >= 14: "You're actually doing it. This is what separates people who talk about change from people who make it."
  * If yesterday was missed and streak reset: "You broke your streak yesterday. No sugarcoating: that was a choice. Today you choose differently or you don't. It's that simple."
  * If task completion rate < 50%: "You're completing less than half your tasks. At this pace, you will not reach your goal in 60 days. Something needs to change today."
  * If discipline score >= 85: "Your numbers are strong. Don't let this become the ceiling — push harder."
- Message is dynamic and combines multiple conditions. Never generic. Always specific to current stats.
- Show a "Goal Reminder": "Every completed day moves you closer to: Senior React Engineer | 20-35 LPA"

QUICK ACTIONS:
- "Start Today's Work" → goes to today's day detail page
- "Log Hours" → modal to add time to today's session
- "Write Blog Post" → goes to new blog post editor

FEATURE 1.3 — TODAY'S DAY DETAIL PAGE

Accessible from /tracker/day/[dayNumber]

Layout:
- Header: Day number, date, focus area, estimated hours
- Progress bar: overall day completion percentage
- Time Tracker: shows hours logged, button to log more time, target vs actual

SECTION: Topics & Subtopics
- Accordion list of all topics for the day
- Each topic has its subtopics as bullet points
- The full text exactly as parsed from the roadmap
- Read-only display — this is learning material reference

SECTION: Daily Tasks
- Checklist of all tasks for the day
- Each task has a checkbox, title, and optional notes field
- Checking a task triggers a task_completion record
- Real-time completion count updates

SECTION: Knowledge Check
- List of all 10 questions for the day
- Each question has: question text, "Mark as Attempted" button, "Pass / Fail" toggle
- Optional notes field per question to write the user's answer
- Show aggregate: X/10 passed

SECTION: Session Notes
- Large text area for free-form notes about the day
- Auto-saves as user types (debounced)

Status control:
- Buttons to set day status: In Progress / Mark Complete / Mark Skipped
- Marking complete validates: at least 50% tasks checked + at least 8 questions attempted. If not met, show a warning: "You haven't completed minimum requirements. Are you sure?" but allow override.

FEATURE 1.4 — ROADMAP OVERVIEW PAGE (/tracker)

Visual tree/timeline of the entire 60-day program:

Month tabs at top (Month 1 / Month 2)

Within each month, show weeks as collapsible sections.

Within each week, show days as a grid of cards.

Each day card shows:
- Day number and focus area
- Status badge: Not Started / In Progress / Complete / Skipped (color coded)
- Mini progress bar (tasks % complete)
- Hours logged that day
- Click goes to day detail page

For the current day: highlighted with a pulsing border.
For future days: slightly muted.
For past days: clearly marked complete or flagged if skipped.

FEATURE 1.5 — DISCIPLINE ENGINE (runs daily)

Discipline score formula (computed end of each day or on dashboard load):
- Streak component (30 points max): min(streak_days / 14, 1) * 30
- Task completion component (35 points max): task_completion_rate * 35
- Hours component (25 points max): min(hours_logged / hours_target, 1) * 25
- Knowledge check component (10 points max): kc_pass_rate * 10
- Total: sum of above components (0-100)

Store in discipline_scores table daily.

If the user does not log in or complete any tasks by 10pm (check via scheduled function or on-login check), automatically log that day's discipline score with 0 for hours and 0% task completion. Streak breaks if status remains not_started by end of day.

Streak rules:
- Streak increments when: daily_progress.status = 'complete' for the day
- Streak breaks when: day passes with status 'not_started' or 'skipped'
- Grace period: none. No skips. A skipped day breaks the streak.

FEATURE 1.6 — DAILY EMAIL (via Resend)

Send a daily email at 8:00 AM if the user has configured their email:

Email contains:
- Today's day number and focus
- Current streak
- Yesterday's discipline score
- Today's first 3 tasks as a preview
- A one-line motivation message (same tone as dashboard)
- Link to open the app directly to today

If yesterday's discipline score was below 60: subject line is "Your numbers slipped. Fix it today." — not "Daily Reminder" or anything gentle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 2: DEV BLOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FEATURE 2.1 — BLOG EDITOR (/blog/new and /blog/edit/[id])

Full-featured rich text editor using Tiptap with:
- Slash commands (/) for quick insertion of: heading, code block, image, quote, list, divider
- Floating toolbar on text selection: bold, italic, strikethrough, link, inline code
- Fixed toolbar at top: heading levels, lists, quote, code block, image upload, horizontal rule
- Code blocks: language selector dropdown, syntax highlighting via lowlight (supports JS, TS, JSX, TSX, Python, SQL, bash)
- Image upload: drag and drop or click — uploads to Supabase Storage, inserts inline
- Word count and estimated reading time shown in bottom bar (real-time)
- Auto-save every 30 seconds (save to DB with updated_at, show "Saved X seconds ago")
- Keyboard shortcuts: Cmd+S to save, Cmd+Shift+P to publish/unpublish

Editor sidebar (right panel):
- Title field (large, prominent — NOT inside the Tiptap editor)
- Slug field (auto-generated from title, user can manually edit, shows preview URL)
- Cover image: upload or URL input
- Visibility toggle: Private (lock icon) / Public (globe icon) — large, obvious, not buried
- Tags: multi-select from existing tags or create new tag inline
- Series: select from existing series or create new one
- Excerpt: auto-populated from first 200 chars, user can override
- Published at: auto-set on first publish, shown as read-only after

Publish flow:
- When toggling Private → Public for the first time: show modal "Your post will be visible at: [URL]. Copy this link to share on LinkedIn or add to your resume." with a copy button.
- When publishing: set published_at if not set, generate content_html from content JSON, calculate reading_time_minutes.

FEATURE 2.2 — PRIVATE BLOG MANAGEMENT (/blog/manage)

List all blog posts (private and public) in a data table:
- Columns: Title, Status (badge), Tags, Created date, Views (for public posts), Reading time, Actions
- Sort by: created date, views, title
- Filter by: visibility, tags, series
- Bulk actions: delete, change visibility
- Inline status toggle (click to switch private/public)
- Click row to open editor

FEATURE 2.3 — PUBLIC BLOG PROFILE PAGE (/blog — publicly accessible, no auth)

This page is publicly accessible without login. It is the face of your personal brand.

Design: Clean, editorial, professional. NOT the app dashboard chrome. A separate minimal layout.

Shows:
- Name (hardcoded: Raghav Sethi) and tagline (editable from settings: e.g. "Senior React Engineer in Progress. Building in public.")
- Social links (GitHub, LinkedIn — editable from settings)
- List of all public blog posts, newest first
- Each post shown as a card: cover image, title, excerpt, tags, published date, reading time
- Filter by tag (client-side, no navigation)
- Group by series (collapsible)
- Open Graph meta tags for social sharing: og:title, og:description, og:image (cover image), twitter:card

FEATURE 2.4 — PUBLIC BLOG POST PAGE (/blog/[slug] — publicly accessible)

Full post page with:
- Large header: title, cover image, tags, published date, reading time, author (Raghav Sethi)
- Full rendered content (HTML from content_html field) with typography styles
- Code blocks: dark theme, language label, copy button
- Table of contents: auto-generated from headings, sticky on desktop, shows reading progress per section
- "Next Post" and "Previous Post" navigation (within public posts, sorted by published_at)
- Share buttons: copy link, LinkedIn, Twitter (plain URL sharing, no external SDK needed)
- Back to all posts link
- View count increment on each page load (server action, debounced to avoid double-counting on refresh)

The post page MUST have good SEO:
- generateMetadata in Next.js for dynamic title and description
- og:title = post title
- og:description = post excerpt
- og:image = cover image URL (fallback to a generated text-based OG image)
- canonical URL
- Article structured data (JSON-LD)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 3: ANALYTICS DASHBOARD (/analytics)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a private, auth-required page. Show every meaningful metric with charts and numbers.

SECTION 1 — TOP KPI ROW (6 stat cards):
- Current Discipline Score (0-100 with color)
- Current Streak (days, with longest streak shown below)
- Total Hours Logged (vs target: day_number * 8)
- Overall Program Completion % (tasks completed / total tasks)
- Knowledge Check Pass Rate (% across all attempted checks)
- Blog Posts Published (public count)

SECTION 2 — ACTIVITY HEATMAP:
- GitHub-style contribution grid
- 60 squares total (one per day)
- Color intensity = discipline score for that day
- Tooltip on hover: date, discipline score, hours logged, tasks completed, day title
- Empty squares for future days (greyed out)

SECTION 3 — DISCIPLINE SCORE OVER TIME:
- Line chart (Recharts LineChart)
- X-axis: dates (Day 1 to current day)
- Y-axis: discipline score (0-100)
- Reference lines at 60 (danger), 75 (okay), 90 (strong)
- Show trend line (7-day rolling average)

SECTION 4 — HOURS LOGGED:
- Bar chart with two series: Hours Logged (actual) and Hours Target (8hrs/day)
- X-axis: last 14 days
- Deficit highlighted in red when actual < target

SECTION 5 — TASK COMPLETION BREAKDOWN:
- Stacked bar chart by week
- Categories: Complete, In Progress, Skipped, Not Started
- X-axis: Week 1 through Week 8

SECTION 6 — KNOWLEDGE CHECK PERFORMANCE:
- Radar/Spider chart showing pass rate per topic area (mapped from which week the KC belongs to)
- Topics: JS Internals, React Fiber, Reconciliation, Hooks, State Management, TypeScript, Performance, Next.js, Real-Time, Testing
- Shows weak areas visually

SECTION 7 — BLOG ANALYTICS (if any public posts exist):
- Table of public posts sorted by view count
- Views over time line chart (per post, multi-line if multiple posts)
- Total views all time

SECTION 8 — STREAK HISTORY:
- Bar chart showing all streaks (start date, end date, length)
- Current streak highlighted differently
- Best streak noted with a trophy emoji

SECTION 9 — TOPIC COVERAGE MAP:
- Visual representation of all 60 days as a grid
- Color coded by topic area (each week's theme has a color)
- Shows at a glance: which areas are complete, which are in progress, which not started

SECTION 10 — DISCIPLINE REPORT CARD:
- Grade (A/B/C/D/F) based on discipline score average
- Breakdown: streak grade, task completion grade, hours grade, KC grade
- One-line honest assessment: "Your hours logging is your weakest metric. You're consistently logging 5-6hrs when the target is 8. That gap compounds over 60 days."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL FEATURES (high value additions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MILESTONE SYSTEM:
Pre-seed the milestones table with these achievements:
- "First Day Done" — complete Day 1 (icon: 🚀)
- "First Week Warrior" — complete all 7 days of Week 1 (icon: ⚔️)
- "Double Digits" — complete Day 10 (icon: 🔟)
- "Halfway There" — complete Day 30 (icon: 🏃)
- "7-Day Streak" — maintain 7 consecutive complete days (icon: 🔥)
- "30-Day Streak" — maintain 30 consecutive complete days (icon: 💀)
- "First Blog Post" — publish first public blog post (icon: ✍️)
- "5 Blog Posts" — publish 5 public blog posts (icon: 📚)
- "Knowledge Champion" — 90%+ KC pass rate across 10 days (icon: 🧠)
- "Iron Discipline" — discipline score above 85 for 7 consecutive days (icon: 🛡️)
- "Month 1 Complete" — complete all days in Month 1 (icon: 🗓️)
- "Program Complete" — complete all 60 days (icon: 👑)

Show milestones on dashboard as locked/unlocked. When a milestone is achieved, show a full-screen animation (confetti or a bold achievement card) that doesn't auto-dismiss — user must click to close.

CHECK-IN PROMPT:
If the user opens the dashboard and today's daily_progress has status 'not_started' and it's past 9am, show a prominent banner: "Day [X] hasn't started yet. Every hour you delay is an hour behind. Start now." with a "Begin Day [X]" button that sets status to 'in_progress' and timestamps started_at.

WEEKLY REVIEW MODE:
At the end of each week (day 7, 14, 21, etc.), show a weekly review screen:
- Week stats: total hours, avg discipline score, tasks completed, KC pass rate
- Strongest day vs weakest day of the week
- What topics were covered (list)
- Prompt: "What was your biggest technical insight this week?" (text input, stored as weekly_review_notes)
- Prompt: "What will you do differently next week?" (text input)
- Show next week's focus areas as a preview

NOTES & INSIGHTS CAPTURE:
Each day detail page has a "Quick Insight" button. Opens a small modal: "What was the most important thing you understood today?" — single line input. Stored as insight on daily_progress. Show all insights in a chronological feed on the analytics page. These insights become the raw material for blog posts.

SETTINGS PAGE (/settings):
- Profile: name, email (for daily emails), LinkedIn URL, GitHub URL
- Blog settings: public profile tagline, bio, profile picture upload
- Roadmap: show current file name and parse date, button to re-upload/re-parse
- Notifications: toggle daily email on/off, set daily email time
- Appearance: dark mode (default) / light mode toggle
- Danger zone: "Reset All Progress" (requires typing "I understand" to confirm)

RESUME/LINKEDIN HELPER:
A dedicated page (/share) that generates shareable content:
- Your public blog URL formatted for copy-paste
- A pre-written LinkedIn post template: "I'm documenting my journey to Senior React Engineer in public. [X] days in, [Y] blog posts published. Read along: [URL]" — one-click copy
- A "For Resume" text block: "Personal Dev Blog: [URL] — Documenting a 60-day intensive self-study journey through React internals, Next.js, TypeScript, and real-time systems."
- QR code for your blog URL (use qrcode library)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAVIGATION & APP STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Private app routes (require auth):
- /dashboard — main dashboard
- /tracker — roadmap overview
- /tracker/day/[dayNumber] — day detail
- /analytics — analytics dashboard
- /blog/manage — blog management list
- /blog/new — new post editor
- /blog/edit/[id] — edit existing post
- /share — resume/linkedin helper
- /settings — settings
- /setup — initial roadmap upload (shows if no program exists)

Public routes (no auth):
- /blog — public blog profile
- /blog/[slug] — individual public post

Auth routes:
- /login — magic link login page
- /auth/callback — Supabase auth callback handler

Sidebar navigation (private app):
- Logo/brand: FORGE (top left, linking to /dashboard)
- Dashboard (home icon)
- My Roadmap (map icon) — links to /tracker
- Analytics (chart icon) — links to /analytics
- Blog (pen icon) — links to /blog/manage
- Share (share icon) — links to /share
- Settings (gear icon) — bottom of sidebar
- Current day indicator: "Day X / 60" shown in sidebar
- Streak shown in sidebar: "🔥 N days"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The private dashboard uses a dark, high-contrast, utilitarian design:
- Background: #0a0a0a
- Surface: #111111
- Surface elevated: #1a1a1a
- Border: #222222
- Primary accent: #ff3131 (red — urgency, action, accountability)
- Secondary accent: #f0b429 (amber — warnings, metrics)
- Success: #00d68f (green — completed, good scores)
- Text primary: #f0f0f0
- Text secondary: #888888
- Font (headings): Syne (Google Fonts) — geometric, strong
- Font (body): DM Sans (Google Fonts) — clean, readable
- Font (code/mono): JetBrains Mono (Google Fonts)

The public blog uses a different, editorial aesthetic:
- Background: #fafaf8 (off-white)
- Text: #1a1a1a
- Accent: #1a1a1a with red underlines for links
- Font (headings): Fraunces (Google Fonts) — editorial, distinctive serif
- Font (body): Lora (Google Fonts) — readable long-form serif
- Font (code): JetBrains Mono
- NO sidebar. Minimal nav. Maximum focus on content.
- The blog must look completely different from the app — like a separate editorial site, not a feature of a dashboard app.

Discipline score color coding (used throughout):
- 90-100: green (#00d68f)
- 75-89: yellow (#f0b429)
- 50-74: orange (#ff6b00)
- 0-49: red (#ff3131)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT VARIABLES NEEDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL= (Supabase direct connection string for Drizzle)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_APP_URL= (e.g. https://forge.vercel.app)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO BUILD FIRST (priority order for Antigravity)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Project scaffolding: Next.js 14 + TypeScript + Tailwind + Supabase + Drizzle setup
2. Auth: Supabase magic link login, middleware for route protection
3. Database: Full Drizzle schema, migrations, seed file for milestones
4. Roadmap upload & parsing: /setup page, API route for file parsing, DB save
5. Dashboard: Today's view, discipline score, motivation message, streak
6. Day detail page: topics, tasks, knowledge checks, notes, time logging
7. Roadmap overview: /tracker page with full timeline view
8. Analytics dashboard: all charts and metrics
9. Blog editor: Tiptap setup, all extensions, save/publish flow
10. Blog management: /blog/manage list page
11. Public blog: /blog and /blog/[slug] with SEO
12. Milestone system: achievement detection and celebration UI
13. Email: Resend integration for daily accountability email
POST-MORTEM & VERSION 2.1 ADDITIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ MODULE 1: ROADMAP TRACKER — COMPLETE
   - Parsing engine stable (DOCX/PDF).
   - Streak and Discipline scoring operational.
   - Daily progress tracking fully integrated.

✅ MODULE 2: DEV BLOG — COMPLETE
   - Tiptap editor with rich extensions.
   - Public SEO-optimized blog views.
   - Reading time, view counts, and tags working.

✅ MODULE 3: ANALYTICS — ENHANCED (V2.1)
   - Integrated Pomodoro focus tracking.
   - Detailed task distribution analytics.
   - Velocity grading and growth trends.

🚀 NEW FEATURES ADDED (BEYOND ORIGINAL SCOPE):
   - ForgeHUD: Persistent heads-up display with live Pulse, Intel insights, and Timer.
   - Public Showcase Profile (/profile): A high-end editorial showcase of engineering progress, milestones, and blog posts.
   - Pomodoro Engine: Integrated focus session tracking in the database.
   - Vercel-Ready Build: Optimized for serverless deployment with dynamic rendering.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUGGESTIONS FOR FUTURE UPGRADES (V3.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. JANE (Job Application Network Engine):
   - A dedicated board to track companies, interview stages, and preparation material for the 20-35 LPA target.
   - Link specific roadmap days to interview topics (e.g. "I learned RSC on Day 14, now I can tackle this Interview Q").

2. AI MENTOR INTEGRATION:
   - "Forge Intelligence" chat in the HUD.
   - Ask technical questions based on today's topics without leaving the app.
   - Get "Senior-level" code reviews on your builds directly in the app.

3. PROJECT SHOWCASE GALLERY:
   - A grid on the public profile to host live demos or screenshots of the "Build" tasks completed each day.

4. AUTOMATED LINKEDIN UPDATES:
   - Use LinkedIn API to post daily progress updates automatically when a day is marked "Complete" with high discipline.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT VARIABLES (VERCEL SETUP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ensure these are added to your Vercel Project Settings for the build to pass:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DATABASE_URL
- RESEND_API_KEY
- NEXT_PUBLIC_APP_URL (Set to https://your-project.vercel.app)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL NOTES FOR ANTIGRAVITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- This is a SINGLE USER application. No multi-tenancy. No user profiles beyond one. Optimize for this — no need for complex multi-user RLS policies.
- The roadmap parsing is the hardest technical piece. The document has a specific structure (months → weeks → day tables → topic sections → knowledge checks). The parser should be flexible enough to handle both DOCX and PDF exports of the same document. If parsing is imperfect, provide a manual edit mode where the user can correct parsed data.
- All mutations should use Next.js Server Actions where appropriate (form submissions, task completions, etc.)
- All analytics data should be pre-computed and stored (not computed at query time) to keep the analytics page fast.
- The public blog must be indexable by search engines. Use Next.js SSR or SSG for public pages. Do not client-side render the public blog.
- Mobile responsiveness is required but desktop-first. This app will be used on a laptop during intensive study sessions.
- Add a PWA manifest so the app can be installed on mobile for quick check-ins.
- Commit messages and code comments should be professional and clear. This is a portfolio project in addition to a personal tool — the codebase itself reflects the user's engineering quality.

Build FORGE. Make it the kind of app that, when someone asks Raghav "how are you staying accountable during your job search?", he opens his phone and shows them a dashboard that makes them think: this person is not playing around.