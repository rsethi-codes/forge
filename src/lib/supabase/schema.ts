import { pgTable, uuid, text, integer, timestamp, date, pgEnum, boolean, numeric, unique, jsonb } from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'

// Enums
export const taskTypeEnum = pgEnum('task_type', ['study', 'build', 'review', 'mock'])
export const statusEnum = pgEnum('status', ['not_started', 'in_progress', 'complete', 'skipped'])
export const visibilityEnum = pgEnum('visibility', ['private', 'public'])
export const criteriaTypeEnum = pgEnum('criteria_type', ['streak', 'days_complete', 'blog_posts', 'kc_score', 'manual'])
export const qnaSourceTypeEnum = pgEnum('qna_source_type', ['gpt', 'blog', 'youtube', 'other'])

// --- Roadmap Module ---

export const roadmapPrograms = pgTable('roadmap_programs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    totalDays: integer('total_days').notNull(),
    startDate: date('start_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    rawContent: text('raw_content'),
    fileUrl: text('file_url'),
    isActive: boolean('is_active').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
})

export const roadmapMonths = pgTable('roadmap_months', {
    id: uuid('id').primaryKey().defaultRandom(),
    programId: uuid('program_id').references(() => roadmapPrograms.id, { onDelete: 'cascade' }).notNull(),
    monthNumber: integer('month_number').notNull(),
    title: text('title').notNull(),
    objective: text('objective'),
    outcome: text('outcome'),
    sortOrder: integer('sort_order').notNull(),
})

export const roadmapPhases = pgTable('roadmap_phases', {
    id: uuid('id').primaryKey().defaultRandom(),
    programId: uuid('program_id').references(() => roadmapPrograms.id, { onDelete: 'cascade' }).notNull(),
    phaseNumber: integer('phase_number').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    theme: text('theme'),
    sortOrder: integer('sort_order').notNull(),
})

export const roadmapWeeks = pgTable('roadmap_weeks', {
    id: uuid('id').primaryKey().defaultRandom(),
    monthId: uuid('month_id').references(() => roadmapMonths.id, { onDelete: 'cascade' }),
    phaseId: uuid('phase_id').references(() => roadmapPhases.id, { onDelete: 'cascade' }),
    weekNumber: integer('week_number').notNull(),
    title: text('title').notNull(),
    goal: text('goal'),
    theme: text('theme'),
    colorTheme: text('color_theme'),
    projectMeta: jsonb('project_meta'), // For weeks that have a specific project focus
    sortOrder: integer('sort_order').notNull(),
})

export const roadmapDays = pgTable('roadmap_days', {
    id: uuid('id').primaryKey().defaultRandom(),
    weekId: uuid('week_id').references(() => roadmapWeeks.id, { onDelete: 'cascade' }).notNull(),
    dayNumber: text('day_number').notNull(),
    dayOfWeek: integer('day_of_week').notNull(),
    title: text('title').notNull(),
    focus: text('focus'),
    estimatedHours: numeric('estimated_hours').default('8').notNull(),
    sortOrder: integer('sort_order').notNull(),
})

export const roadmapTasks = pgTable('roadmap_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    dayId: uuid('day_id').references(() => roadmapDays.id, { onDelete: 'cascade' }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull(),
    taskType: taskTypeEnum('task_type').default('study').notNull(),
    showcaseUrl: text('showcase_url'),
    showcaseImage: text('showcase_image'),
})

export const roadmapTopics = pgTable('roadmap_topics', {
    id: uuid('id').primaryKey().defaultRandom(),
    dayId: uuid('day_id').references(() => roadmapDays.id, { onDelete: 'cascade' }).notNull(),
    topicNumber: text('topic_number').notNull(),
    title: text('title').notNull(),
    sortOrder: integer('sort_order').notNull(),
})

export const roadmapSubtopics = pgTable('roadmap_subtopics', {
    id: uuid('id').primaryKey().defaultRandom(),
    topicId: uuid('topic_id').references(() => roadmapTopics.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
    sortOrder: integer('sort_order').notNull(),
})

export const topicQnA = pgTable('topic_qna', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    dayId: uuid('day_id').references(() => roadmapDays.id, { onDelete: 'cascade' }).notNull(),
    topicId: uuid('topic_id').references(() => roadmapTopics.id, { onDelete: 'cascade' }),
    subtopicId: uuid('subtopic_id').references(() => roadmapSubtopics.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    answerText: text('answer_text'),
    sourceType: qnaSourceTypeEnum('source_type').default('gpt').notNull(),
    sourceUrl: text('source_url'),
    tags: jsonb('tags').default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const knowledgeChecks = pgTable('knowledge_checks', {
    id: uuid('id').primaryKey().defaultRandom(),
    dayId: uuid('day_id').references(() => roadmapDays.id, { onDelete: 'cascade' }).notNull(),
    questionNumber: integer('question_number').notNull(),
    questionText: text('question_text').notNull(),
    sortOrder: integer('sort_order').notNull(),
})

export const leetcodeProblems = pgTable('leetcode_problems', {
    id: uuid('id').primaryKey().defaultRandom(),
    dayId: uuid('day_id').references(() => roadmapDays.id, { onDelete: 'cascade' }).notNull(),
    leetcodeId: text('leetcode_id'), // e.g. "LC_1"
    title: text('title').notNull(),
    difficulty: text('difficulty'), // "easy", "medium", "hard"
    pattern: text('pattern'),
    url: text('url'),
    sortOrder: integer('sort_order').notNull(),
})

export const knowledgeCheckSubmissions = pgTable('knowledge_check_submissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    checkId: uuid('check_id').references(() => knowledgeChecks.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').notNull(),
    answerText: text('answer_text').notNull(),
    aiScore: integer('ai_score'), // 0-100
    aiFeedback: text('ai_feedback'),
    missedPoints: jsonb('missed_points').default([]), // What the user missed
    understandingLevel: text('understanding_level'), // 'Novice' | 'Competent' | 'Expert'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// --- Progress & Tracking ---

export const dailyProgress = pgTable('daily_progress', {
    id: uuid('id').primaryKey().defaultRandom(),
    dayId: uuid('day_id').references(() => roadmapDays.id, { onDelete: 'cascade' }).notNull(),
    date: date('date').notNull(),
    status: statusEnum('status').default('not_started').notNull(),
    hoursLogged: numeric('hours_logged').default('0').notNull(),
    sessionNotes: text('session_notes'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    userId: uuid('user_id').notNull(),
}, (t) => ({
    unq: unique().on(t.userId, t.dayId, t.date)
}))

export const taskCompletions = pgTable('task_completions', {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id').references(() => roadmapTasks.id, { onDelete: 'cascade' }).notNull(),
    dailyProgressId: uuid('daily_progress_id').references(() => dailyProgress.id, { onDelete: 'cascade' }).notNull(),
    completed: boolean('completed').default(false).notNull(),
    completedAt: timestamp('completed_at'),
    timeSpent: integer('time_spent').default(0),        // gross time in seconds (including pauses)
    timeSpentNet: integer('time_spent_net').default(0), // net active time in seconds (pauses excluded)
    startedAt: timestamp('started_at'),
    timerSessions: jsonb('timer_sessions').default([]), // [{start: ISO, end: ISO}, ...]
    notes: text('notes'),
    timerStatus: text('timer_status').default('idle'), // 'idle' | 'running' | 'paused'
    lastTimerPulse: timestamp('last_timer_pulse'),
}, (t) => ({
    unq: unique().on(t.taskId, t.dailyProgressId)
}))

export const topicCompletions = pgTable('topic_completions', {
    id: uuid('id').primaryKey().defaultRandom(),
    topicId: uuid('topic_id').references(() => roadmapTopics.id, { onDelete: 'cascade' }).notNull(),
    dailyProgressId: uuid('daily_progress_id').references(() => dailyProgress.id, { onDelete: 'cascade' }).notNull(),
    completed: boolean('completed').default(false).notNull(),
    completedAt: timestamp('completed_at'),
    timeSpent: integer('time_spent').default(0),        // gross time in seconds
    timeSpentNet: integer('time_spent_net').default(0), // net active time in seconds
    startedAt: timestamp('started_at'),
    timerSessions: jsonb('timer_sessions').default([]), // [{start: ISO, end: ISO}, ...]
    notes: text('notes'),
    timerStatus: text('timer_status').default('idle'), // 'idle' | 'running' | 'paused'
    lastTimerPulse: timestamp('last_timer_pulse'),
}, (t) => ({
    unq: unique().on(t.topicId, t.dailyProgressId)
}))

export const roadmapMetadata = pgTable('roadmap_metadata', {
    id: uuid('id').primaryKey().defaultRandom(),
    programId: uuid('program_id').references(() => roadmapPrograms.id, { onDelete: 'cascade' }).notNull(),
    subtitle: text('subtitle'),
    targetPackage: text('target_package'),
    dailyCommitment: text('daily_commitment'),
    totalDays: integer('total_days'),
    bluntTruth: text('blunt_truth'),
    // Beast-specific fields
    author: text('author'),
    dsaLanguage: text('dsa_language'),
    specialization: text('specialization'),
    targetRoles: jsonb('target_roles'),
    targetSalaryMin: integer('target_salary_min'),
    targetSalaryMax: integer('target_salary_max'),
    dailySchedule: jsonb('daily_schedule'),
    roasts: jsonb('roasts'),
    dsaLanguageDecision: jsonb('dsa_language_decision'),
    specializationDecision: jsonb('specialization_decision'),
})

export const resumeGaps = pgTable('resume_gaps', {
    id: uuid('id').primaryKey().defaultRandom(),
    metadataId: uuid('metadata_id').references(() => roadmapMetadata.id, { onDelete: 'cascade' }).notNull(),
    area: text('area').notNull(),
    whatResumeShows: text('what_resume_shows'),
    brutalGap: text('brutal_gap'),
})

export const resumeStrengths = pgTable('resume_strengths', {
    id: uuid('id').primaryKey().defaultRandom(),
    metadataId: uuid('metadata_id').references(() => roadmapMetadata.id, { onDelete: 'cascade' }).notNull(),
    content: text('content').notNull(),
})

export const executionBlocks = pgTable('execution_blocks', {
    id: uuid('id').primaryKey().defaultRandom(),
    metadataId: uuid('metadata_id').references(() => roadmapMetadata.id, { onDelete: 'cascade' }).notNull(),
    block: text('block').notNull(),
    focus: text('focus').notNull(),
})

export const endGoals = pgTable('end_goals', {
    id: uuid('id').primaryKey().defaultRandom(),
    metadataId: uuid('metadata_id').references(() => roadmapMetadata.id, { onDelete: 'cascade' }).notNull(),
    skill: text('skill').notNull(),
    outcome: text('outcome').notNull(),
})

export const knowledgeCheckResults = pgTable('knowledge_check_results', {
    id: uuid('id').primaryKey().defaultRandom(),
    knowledgeCheckId: uuid('knowledge_check_id').references(() => knowledgeChecks.id, { onDelete: 'cascade' }).notNull(),
    dailyProgressId: uuid('daily_progress_id').references(() => dailyProgress.id, { onDelete: 'cascade' }).notNull(),
    attempted: boolean('attempted').default(false).notNull(),
    passed: boolean('passed').default(false).notNull(),
    notes: text('notes'),
    answer: text('answer'), // user response
    aiScore: integer('ai_score'),
    aiFeedback: text('ai_feedback'),
    missedPoints: jsonb('missed_points').default([]),
    understandingLevel: text('understanding_level'),
}, (t) => ({
    unq: unique().on(t.knowledgeCheckId, t.dailyProgressId)
}))

export const analyticsEvents = pgTable('analytics_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    event: text('event').notNull(),
    data: jsonb('data').default({}).notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
})

export const disciplineScores = pgTable('discipline_scores', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    date: date('date').notNull(),
    streakDays: integer('streak_days').notNull(),
    tasksCompletionRate: numeric('tasks_completion_rate').notNull(),
    hoursLogged: numeric('hours_logged').notNull(),
    hoursTarget: numeric('hours_target').default('8').notNull(),
    kcPassRate: numeric('kc_pass_rate').notNull(),
    disciplineScore: numeric('discipline_score').notNull(),
    motivationMessage: text('motivation_message'),
}, (t) => ({
    unq: unique().on(t.userId, t.date)
}))

// --- Blog Module ---

export const blogPosts = pgTable('blog_posts', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').unique().notNull(),
    content: jsonb('content').notNull(),
    contentHtml: text('content_html'),
    excerpt: text('excerpt'),
    coverImageUrl: text('cover_image_url'),
    visibility: visibilityEnum('visibility').default('private').notNull(),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    readingTimeMinutes: integer('reading_time_minutes'),
    viewCount: integer('view_count').default(0).notNull(),
    technologies: jsonb('technologies').default([]),
    resources: jsonb('resources').default([]),
    userId: uuid('user_id').notNull(),
})

export const blogTags = pgTable('blog_tags', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').unique().notNull(),
    slug: text('slug').unique().notNull(),
    color: text('color'),
})

export const blogPostTags = pgTable('blog_post_tags', {
    postId: uuid('post_id').references(() => blogPosts.id, { onDelete: 'cascade' }).notNull(),
    tagId: uuid('tag_id').references(() => blogTags.id, { onDelete: 'cascade' }).notNull(),
}, (t: any) => ({
    pk: [t.postId, t.tagId],
}))

export const blogSeries = pgTable('blog_series', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    coverImageUrl: text('cover_image_url'),
    sortOrder: integer('sort_order'),
})

export const blogPostSeries = pgTable('blog_post_series', {
    postId: uuid('post_id').references(() => blogPosts.id, { onDelete: 'cascade' }).notNull(),
    seriesId: uuid('series_id').references(() => blogSeries.id, { onDelete: 'cascade' }).notNull(),
    position: integer('position').notNull(),
}, (t: any) => ({
    pk: [t.postId, t.seriesId],
}))

// --- Milestones ---

export const milestones = pgTable('milestones', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    icon: text('icon'),
    reward: text('reward'),
    achievedAt: timestamp('achieved_at'),
    criteriaType: criteriaTypeEnum('criteria_type').notNull(),
    criteriaValue: integer('criteria_value').notNull(),
    userId: uuid('user_id').notNull(),
})

export const profiles = pgTable('profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    fullName: text('full_name'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    emailNotifications: boolean('email_notifications').default(true).notNull(),
    morningDigestTime: text('morning_digest_time').default('08:00').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const pomodoroSessions = pgTable('pomodoro_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    dailyProgressId: uuid('daily_progress_id').references(() => dailyProgress.id, { onDelete: 'cascade' }),
    type: text('type').default('work').notNull(), // 'work', 'short_break', 'long_break'
    durationMinutes: integer('duration_minutes').notNull(),
    completed: boolean('completed').default(false).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    taskId: uuid('task_id').references(() => roadmapTasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
})

// --- FORGE Behavioral Tracking & Reward Engine ---

export const timeSessions = pgTable('time_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    dayId: uuid('day_id').references(() => roadmapDays.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
    totalActiveMinutes: integer('total_active_minutes').default(0).notNull(),
    interruptionsCount: integer('interruptions_count').default(0).notNull(),
    distractionsCount: integer('distractions_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const appEvents = pgTable('app_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').references(() => timeSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    eventType: text('event_type').notNull(), // 'page_view', 'tab_switch', 'idle_start', 'idle_end', 'click'
    eventMeta: jsonb('event_meta').default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const nudges = pgTable('nudges', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    sessionId: uuid('session_id').references(() => timeSessions.id, { onDelete: 'cascade' }),
    nudgeType: text('nudge_type').notNull(), // 'start_reminder', 'focus_alert', 'procrastination_check'
    nudgeText: text('nudge_text').notNull(),
    sentAt: timestamp('sent_at').defaultNow().notNull(),
    respondedAt: timestamp('responded_at'),
    response: text('response'),
    meta: jsonb('meta').default({}),
})

export const behaviorProfile = pgTable('behavior_profile', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    date: date('date').notNull(),
    focusScore: integer('focus_score').notNull(),
    procrastinationScore: integer('procrastination_score').notNull(),
    switchRate: numeric('switch_rate').notNull(), // tab switches per hour
    pomodoroSuccessRate: numeric('pomodoro_success_rate').notNull(),
    productiveMinutes: integer('productive_minutes').notNull(),
    peakProductivityWindow: text('peak_productivity_window'), // e.g., '09:00-11:00'
}, (t) => ({
    unq: unique().on(t.userId, t.date)
}))

export const rewardsWallet = pgTable('rewards_wallet', {
    userId: uuid('user_id').primaryKey().notNull(),
    coinsBalance: integer('coins_balance').default(0).notNull(),
    lastEarnedAt: timestamp('last_earned_at'),
})

// --- JANE (Job Application Network Engine) ---

export const janeCompanies = pgTable('jane_companies', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    name: text('name').notNull(),
    website: text('website'),
    logoUrl: text('logo_url'),
    industry: text('industry'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const applicationStatusEnum = pgEnum('application_status', ['wishlist', 'applied', 'interviewing', 'offer', 'rejected', 'ghosted'])

export const janeApplications = pgTable('jane_applications', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    companyId: uuid('company_id').references(() => janeCompanies.id, { onDelete: 'cascade' }).notNull(),
    roleTitle: text('role_title').notNull(),
    jobUrl: text('job_url'),
    salaryRange: text('salary_range'),
    status: applicationStatusEnum('status').default('wishlist').notNull(),
    appliedAt: timestamp('applied_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const janeInterviews = pgTable('jane_interviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id').references(() => janeApplications.id, { onDelete: 'cascade' }).notNull(),
    roundName: text('round_name').notNull(), // e.g. 'Technical Round 1'
    scheduledAt: timestamp('scheduled_at').notNull(),
    feedback: text('feedback'),
    prepMaterial: text('prep_material'),
    linkedRoadmapDay: uuid('linked_roadmap_day').references(() => roadmapDays.id),
    status: text('status').default('scheduled').notNull(), // 'scheduled', 'completed', 'cancelled'
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- AI Mentor Module ---

export const aiConversations = pgTable('ai_conversations', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull(),
    contextType: text('context_type').default('general').notNull(), // 'general', 'roadmap_day', 'code_review'
    contextId: uuid('context_id'), // ID of the day or task being discussed
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const aiMessages = pgTable('ai_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').references(() => aiConversations.id, { onDelete: 'cascade' }).notNull(),
    role: text('role').notNull(), // 'user', 'assistant'
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

// --- Social & Integrations ---

export const linkedAccounts = pgTable('linked_accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    provider: text('provider').notNull(), // 'linkedin', 'github'
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    expiresAt: timestamp('expires_at'),
    profileData: jsonb('profile_data'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.userId, t.provider),
}))

// --- Relations ---

export const roadmapProgramsRelations = relations(roadmapPrograms, ({ many }) => ({
    months: many(roadmapMonths),
}))

export const roadmapMonthsRelations = relations(roadmapMonths, ({ one, many }) => ({
    program: one(roadmapPrograms, { fields: [roadmapMonths.programId], references: [roadmapPrograms.id] }),
    weeks: many(roadmapWeeks),
}))

export const roadmapWeeksRelations = relations(roadmapWeeks, ({ one, many }) => ({
    month: one(roadmapMonths, { fields: [roadmapWeeks.monthId], references: [roadmapMonths.id] }),
    phase: one(roadmapPhases, { fields: [roadmapWeeks.phaseId], references: [roadmapPhases.id] }),
    days: many(roadmapDays),
}))

export const roadmapPhasesRelations = relations(roadmapPhases, ({ one, many }) => ({
    program: one(roadmapPrograms, { fields: [roadmapPhases.programId], references: [roadmapPrograms.id] }),
    weeks: many(roadmapWeeks),
}))

export const roadmapDaysRelations = relations(roadmapDays, ({ one, many }) => ({
    week: one(roadmapWeeks, { fields: [roadmapDays.weekId], references: [roadmapWeeks.id] }),
    tasks: many(roadmapTasks),
    topics: many(roadmapTopics),
    knowledgeChecks: many(knowledgeChecks),
    qnas: many(topicQnA),
}))

export const roadmapTasksRelations = relations(roadmapTasks, ({ one }) => ({
    day: one(roadmapDays, { fields: [roadmapTasks.dayId], references: [roadmapDays.id] }),
}))

export const topicQnARelations = relations(topicQnA, ({ one }) => ({
    day: one(roadmapDays, { fields: [topicQnA.dayId], references: [roadmapDays.id] }),
    topic: one(roadmapTopics, { fields: [topicQnA.topicId], references: [roadmapTopics.id] }),
    subtopic: one(roadmapSubtopics, { fields: [topicQnA.subtopicId], references: [roadmapSubtopics.id] }),
}))

export const janeApplicationsRelations = relations(janeApplications, ({ one, many }) => ({
    company: one(janeCompanies, { fields: [janeApplications.companyId], references: [janeCompanies.id] }),
    interviews: many(janeInterviews),
}))

export const janeCompaniesRelations = relations(janeCompanies, ({ many }) => ({
    applications: many(janeApplications),
}))

export const janeInterviewsRelations = relations(janeInterviews, ({ one }) => ({
    application: one(janeApplications, { fields: [janeInterviews.applicationId], references: [janeApplications.id] }),
}))

export const aiConversationsRelations = relations(aiConversations, ({ many }) => ({
    messages: many(aiMessages),
}))

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
    conversation: one(aiConversations, { fields: [aiMessages.conversationId], references: [aiConversations.id] }),
}))
