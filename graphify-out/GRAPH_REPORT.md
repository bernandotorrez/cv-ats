# Graph Report - cv-ats  (2026-11-20)

## Corpus Check
- Large corpus: 635 files · ~570,974 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 3431 nodes · 10521 edges · 174 communities (127 shown, 47 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 215 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Route Tree & SEO
- UI Primitives (shadcn)
- Edge Fn: AI CV Tools
- Dashboard & CV Editor
- Cards, Auth & Score Pages
- Marketing & Content Pages
- Payments & Email Functions
- Tryout Result Analysis
- Landing & Checkout
- Forms & Tailor Tools
- Auth Context & Supabase Client
- Admin Job Search
- Tryout DB Schema
- AI Interview Functions
- Tryout Edge Functions
- CV Detail & Portfolio
- Dashboard Widgets & Icons
- Tryout Dashboard
- Payment Pages & Invoice
- Login & Register
- Subscriptions DB & Billing
- Job Match & Safe Fetch
- Admin Analytics
- Demo & Skeletons
- CV Templates
- Admin Jobs Table
- Tryout Practice Mode
- Blog & Article View
- Job Listing Detail
- CV Review
- QuestionQualityPanel.tsx
- simulasi-wawancara.tsx
- tryout-types.ts
- tryout-generate-questions/index.ts
- cv-review.index.tsx
- simulasi-wawancara.$id.tsx
- tryout.$examId.ujian.tsx
- lowongan.tsx
- Badge()
- admin/tryout.tsx
- 20261030000000_multi_account_abuse_guard
- editor/index.ts
- tryout-figural.ts
- EditorToolbar.tsx
- Skeleton()
- simulasi-wawancara.negosiasi.tsx
- ai-common.ts
- templates.tsx
- auth.users
- cv-export.ts
- server.ts
- FiguralGeneratorCard.tsx
- ai-functions.ts
- error-handler.ts
- harga.tsx
- cv/TemplateGallery.tsx
- templates/index.ts
- template.tsx
- lamaran.tsx
- SkdExamples.tsx
- buildJobRow()
- payment-create/index.ts
- 20261004000000_security_hotfix.sql
- navigation-menu.tsx
- __root.tsx
- sanitize.ts
- payments.tsx
- ai-translate-cv/index.ts
- 20260507052000_phase4_ai_tables.sql
- Subscription Tiers (Free/Starter/Pro/Pro
- tryout-cpns.tsx
- extractStructuredJobPosting()
- admin-users/index.ts
- public.profiles
- public.payment_orders
- Color System (primary #468432)
- public.job_listings
- Extra Features F-10 (Cover Letter, Linke
- carousel.tsx
- cv-types.ts
- analytics.ts
- belajar-skd.$slug.tsx
- LeaderboardTable.tsx
- form.tsx
- changelog.tsx
- AdminTryoutPage()
- syarat-ketentuan.tsx
- assessPage()
- extractBatch()
- 20260826000000_create_visitor_events_and
- Accessibility WCAG 2.1 AA
- Database Schema and Migrations
- Tools Separation Plan (split combined to
- public.start_tryout_attempt()
- DownloadDropdown.tsx
- UserTryoutPackages.tsx
- ManadoTemplate.tsx
- local-scoring.ts
- 20260507053000_phase5_subscriptions.sql
- public.tryout_question_reports
- SEC-007 Per-minute rate limiting for edg
- tryout.leaderboard.tsx
- FakeBuyerCard.tsx
- types.ts
- normalizeWords()
- blog.tsx
- interview-questions.ts
- public.payments
- SectionsNav.tsx
- sri.ts
- cv.index.tsx
- kontak.tsx
- Security Implementation (CSP headers, au
- PadangTemplate.tsx
- BenixCsWidget.tsx
- Payment Success Email Template
- Shared Tryout Components (TryoutPageHead
- 20260512000004_security_rpc_functions.sq
- highlight-utils.ts
- SiteFooter.tsx
- CreditCardList()
- ExamSetDialog()
- recent-cvs.tsx
- usage-bars.tsx
- tips-card.tsx
- feature-gate.tsx
- getCroppedImg()
- ISpeechRecognition
- cleanJobTitle()
- 20261004000200_quota_reservation.sql
- 20261014000300_repair_payment_schema.sql
- Finding: AI gateway error details leak t
- Positive controls (webhook signature, RL
- Finding: update_updated_at_column unnece
- Finding: supabaseAdmin lacks browser gua

## God Nodes (most connected - your core abstractions)
1. `cn()` - 442 edges
2. `Button` - 220 edges
3. `buildSeo()` - 121 edges
4. `Badge()` - 103 edges
5. `Card` - 78 edges
6. `useAuth()` - 77 edges
7. `CardContent` - 72 edges
8. `CvData` - 72 edges
9. `Input` - 65 edges
10. `supabase` - 65 edges

## Surprising Connections (you probably didn't know these)
- `Verify Email Template` --implements--> `Authentication (Register, Verify Email, Login) F-01..F-03`  [INFERRED]
  emails/verify-email.html → docs/prd.md
- `Payment Success Email Template` --references--> `Subscription Tiers (Free/Starter/Pro/Pro+) F-08`  [INFERRED]
  emails/payment-success.html → docs/prd.md
- `Payment Success Email Template` --conceptually_related--> `Payment Methods and Gateway (Midtrans/Xendit)`  [AMBIGUOUS]
  emails/payment-success.html → docs/prd.md
- `InterviewSessionPage()` --calls--> `normalizeQuestions()`  [EXTRACTED]
  src/routes/_authenticated/simulasi-wawancara.$id.tsx → supabase/functions/_shared/interview-questions.ts
- `Color System (primary #468432)` --conceptually_related--> `Verify Email Template`  [INFERRED]
  docs/design.md → emails/verify-email.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Transactional email lifecycle templates** — emails_verify_email_template, emails_welcome_template, emails_payment_success_template, docs_task_task_027_email_templates [INFERRED 0.85]
- **Separated AI tools route group** — docs_task_9_completed_tools_index, docs_task_9_completed_cover_letter_generator, docs_task_9_completed_keyword_extractor, docs_task_9_completed_cv_picker_modal [EXTRACTED 1.00]
- **Critical security hardening fixes** — docs_security_audit_task_sec_002, docs_security_audit_task_sec_003, docs_security_audit_task_sec_004, docs_security_audit_task_sec_005, docs_security_audit_task_sec_006 [EXTRACTED 1.00]

## Communities (174 total, 47 thin omitted)

### Community 0 - "Route Tree & SEO"
Cohesion: 0.02
Nodes (144): buildSeo(), serializeJsonLd(), getRouter(), Route, Route, Route, Route, Route (+136 more)

### Community 1 - "UI Primitives (shadcn)"
Cohesion: 0.04
Nodes (69): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), CardFooter (+61 more)

### Community 2 - "Edge Fn: AI CV Tools"
Cohesion: 0.08
Nodes (47): JAILBREAK_PATTERNS, MAX_LAST_MESSAGE_CHARS, OFF_TOPIC_PATTERNS, ImageMime, PAID_TIERS, toImageDataUri(), readAnswers(), readQuestions() (+39 more)

### Community 3 - "Dashboard & CV Editor"
Cohesion: 0.07
Nodes (59): ResolveReportDialog(), PolishPanel(), PolishVariant, Props, TONE_BADGE_COLORS, TONE_COLORS, TONE_ICONS, Props (+51 more)

### Community 4 - "Cards, Auth & Score Pages"
Cohesion: 0.09
Nodes (59): AtsScoreWidget(), BREAKDOWN_LABELS, CircularScore(), getGrade(), Props, ScoreBreakdown, AtsPreview(), CVReviewPanel() (+51 more)

### Community 5 - "Marketing & Content Pages"
Cohesion: 0.07
Nodes (58): AnchorCta(), CtaBanner(), Eyebrow(), JumpNav(), PageHero(), PrimaryCta(), SecondaryCta(), SectionHeader() (+50 more)

### Community 6 - "Payments & Email Functions"
Cohesion: 0.06
Nodes (49): json(), json(), GatewayPayment, json(), reconcileOrder(), ReconcileResult, STATUS_BASE_URL, NON_RETRYABLE (+41 more)

### Community 7 - "Tryout Result Analysis"
Cohesion: 0.07
Nodes (52): DiffBadge(), HistoryTrend(), PeerComparison(), READINESS_STYLE, ReadinessBanner(), RecommendationList(), ScoreRing(), Stat() (+44 more)

### Community 8 - "Landing & Checkout"
Cohesion: 0.06
Nodes (45): AtsVsCreative(), SeoContent(), steps, ThreeSteps(), AccordionContent, AccordionItem, AccordionTrigger, useIsMobile() (+37 more)

### Community 9 - "Forms & Tailor Tools"
Cohesion: 0.09
Nodes (46): CoverLetterPreview(), Input, Label, labelVariants, SelectContent, SelectItem, SelectScrollDownButton, SelectScrollUpButton (+38 more)

### Community 10 - "Auth Context & Supabase Client"
Cohesion: 0.07
Nodes (35): TierBanner(), TierBannerProps, tierConfig, WelcomeHeader(), WelcomeHeaderProps, BackButton(), BackButtonProps, requireSupabaseAuth (+27 more)

### Community 11 - "Admin Job Search"
Cohesion: 0.05
Nodes (48): AssessedPage, BLOCKED_HOSTS, Board, BraveSearchResponse, buildGoogleFallbackQuery(), buildListingSeeds(), buildQueryVariants(), buildSlug() (+40 more)

### Community 12 - "Tryout DB Schema"
Cohesion: 0.09
Nodes (30): idx_tryout_attempts_exam, idx_tryout_attempts_one_active, idx_tryout_attempts_status, idx_tryout_attempts_user, idx_tryout_credits_user_active, idx_tryout_exam_sets_active, idx_tryout_packages_active, idx_tryout_questions_set (+22 more)

### Community 13 - "AI Interview Functions"
Cohesion: 0.08
Nodes (48): Answer, candidateContext(), contextOf(), evaluateAnswers(), generateQuestions(), handleNegotiation(), LEVELS, loadNegotiation() (+40 more)

### Community 14 - "Tryout Edge Functions"
Cohesion: 0.09
Nodes (42): AI_MODEL, BinaryCat, BodyTooLargeError, cleanAnswers(), cleanFlagged(), computeScores(), computeStats(), EXAM_SET_COLUMNS (+34 more)

### Community 15 - "CV Detail & Portfolio"
Cohesion: 0.09
Nodes (35): ChatMessage, GUIDED_STEPS, GuidedMode(), AiChatPanel(), ChatMsg, INITIAL_MESSAGES, cvPrintStyles, LinkedInImport() (+27 more)

### Community 16 - "Dashboard Widgets & Icons"
Cohesion: 0.05
Nodes (27): actionConfig, ActivityFeed(), ActivityItem, CareerStep, NextStepCardProps, STEP_COPY, PlanCard(), PlanCardProps (+19 more)

### Community 17 - "Tryout Dashboard"
Cohesion: 0.12
Nodes (35): POINTS, AttemptHistoryList(), Props, CreditBalance(), Props, CompositionBar(), ExamSetCard(), ExamSetSummary (+27 more)

### Community 18 - "Payment Pages & Invoice"
Cohesion: 0.06
Nodes (38): DEFAULT_RETRY, formatIdr(), NEXT_STEP, Order, RETRY, TryoutCreditInfo, DARK, downloadInvoicePdf() (+30 more)

### Community 19 - "Login & Register"
Cohesion: 0.10
Nodes (35): AuthAside(), AuthDivider(), authInputClass, authInputErrorClass, authLabelClass, AuthLoading(), AuthShell(), AuthSubmit() (+27 more)

### Community 20 - "Subscriptions DB & Billing"
Cohesion: 0.08
Nodes (25): idx_cvs_user_id, public.cvs, update_cvs_updated_at, idx_cvs_share_token, idx_user_subscriptions_active, idx_user_subscriptions_tier_id, idx_user_subscriptions_user_id, public.handle_new_user() (+17 more)

### Community 21 - "Job Match & Safe Fetch"
Cohesion: 0.09
Nodes (36): buildJobContext(), CvRow, fetchJobUrlText(), JobInput, JobRow, normalizeJobUrl(), resolveJobContext(), section() (+28 more)

### Community 22 - "Admin Analytics"
Cohesion: 0.08
Nodes (38): AnalyticsData, AnalyticsView(), AnalyticsViewProps, BarRow(), BreakdownItem, CHART, ChartTab, DailyStat (+30 more)

### Community 23 - "Demo & Skeletons"
Cohesion: 0.10
Nodes (41): AttemptListSkeleton(), AttemptRowSkeleton(), Bone(), Busy(), CreditBalanceSkeleton(), ExamDetailSkeleton(), ExamPageSkeleton(), ExamSetCardSkeleton() (+33 more)

### Community 24 - "CV Templates"
Cohesion: 0.11
Nodes (37): GuidedState, Props, Step, Props, Props, CvVersion, MultiPagePreviewProps, Props (+29 more)

### Community 25 - "Admin Jobs Table"
Cohesion: 0.10
Nodes (38): Alert, AlertDescription, AlertTitle, alertVariants, Table, TableBody, TableCaption, TableCell (+30 more)

### Community 26 - "Tryout Practice Mode"
Cohesion: 0.14
Nodes (33): QuestionPreview(), ExplanationPanel(), loadDetail(), isDetail(), Props, Section(), OptionVisual(), isMistake() (+25 more)

### Community 27 - "Blog & Article View"
Cohesion: 0.10
Nodes (33): ArticleView(), Block(), formatDate(), HUB_PATH, PostLink(), ActionButton(), ErrorState(), SUGGESTIONS (+25 more)

### Community 28 - "Job Listing Detail"
Cohesion: 0.10
Nodes (35): matchCvToJob(), pickTitle(), stripMarkdown(), ApplyPanel(), loadSavedState(), buildJobPostingJsonLd(), buildPostalAddress(), Checklist() (+27 more)

### Community 29 - "CV Review"
Cohesion: 0.10
Nodes (31): CvScannerAnimation(), CvScannerAnimationProps, scanPhases, DELIVERABLES, ListCard(), PRIORITY_BADGE, PRIORITY_LABEL, ReviewData (+23 more)

### Community 30 - "QuestionQualityPanel.tsx"
Cohesion: 0.08
Nodes (35): BulkExplainCard(), runLoop(), BulkIssue, BulkResponse, callExplain(), DIFFICULTY_LABELS, EditQuestionDialog(), handleSave() (+27 more)

### Community 31 - "simulasi-wawancara.tsx"
Cohesion: 0.10
Nodes (26): Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator (+18 more)

### Community 32 - "tryout-types.ts"
Cohesion: 0.07
Nodes (27): NavQuestion, Props, QuestionNavStatus, Props, computeRemaining(), useTryoutTimer(), UseTryoutTimerOptions, computeTryoutScore() (+19 more)

### Community 33 - "tryout-generate-questions/index.ts"
Cohesion: 0.08
Nodes (28): BLUEPRINT, BlueprintCategory, callAi(), canonicalCategory(), CleanQuestion, cleanQuestion(), DIFFICULTIES, Difficulty (+20 more)

### Community 34 - "cv-review.index.tsx"
Cohesion: 0.10
Nodes (26): CvFileUpload(), Props, HiraCard(), SuggestionList(), extractCvText(), extractDocxText(), ExtractionResult, extractPdfText() (+18 more)

### Community 35 - "simulasi-wawancara.$id.tsx"
Cohesion: 0.10
Nodes (28): tail(), VoiceAnswerPanel(), VoiceAnswerPanelProps, analyzeDelivery(), countWords(), DeliveryAnswer, DeliveryStats, DeliverySummary (+20 more)

### Community 36 - "tryout.$examId.ujian.tsx"
Cohesion: 0.12
Nodes (27): ExamTimer(), LegendDot(), QuestionNavigation(), SubtestTabs(), SheetContent, SheetContentProps, SheetDescription, SheetFooter() (+19 more)

### Community 37 - "lowongan.tsx"
Cohesion: 0.12
Nodes (30): ButtonProps, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext() (+22 more)

### Community 38 - "Badge()"
Cohesion: 0.12
Nodes (26): ComparisonPanel(), CvComparison(), CvMetrics, getComparisonInsight(), getCvMetrics(), MetricSummary(), MiniStat(), PreviewPanel() (+18 more)

### Community 39 - "admin/tryout.tsx"
Cohesion: 0.08
Nodes (28): AdminUser, CREDIT_FILTERS, CREDIT_STATUS_META, CreditFilter, CreditRow, CreditStatusKey, Difficulty, EMPTY_COUNTS (+20 more)

### Community 40 - "20261030000000_multi_account_abuse_guard"
Cohesion: 0.10
Nodes (15): public.enqueue_viral_job_search_cron(), public.get_job_search_cron_secret(), public.enqueue_viral_job_search_cron(), public.expire_subscription(), public.trigger_monthly_quota_reset(), idx_abuse_alerts_status_updated, idx_user_device_links_kind_value, public.abuse_alerts (+7 more)

### Community 41 - "editor/index.ts"
Cohesion: 0.15
Nodes (22): AiSuggestBtn(), Field(), FieldProps, mutate(), TextAlign, TextAlignPicker(), TextareaField(), TextareaFieldProps (+14 more)

### Community 42 - "tryout-figural.ts"
Cohesion: 0.15
Nodes (27): analogy(), buildOptions(), cellSvg(), CORNER_NAME, CORNERS, describe(), detail(), DIR_NAME (+19 more)

### Community 43 - "EditorToolbar.tsx"
Cohesion: 0.13
Nodes (20): EditorToolbar(), LanguageSwitch(), SaveStatus(), isActivePath(), learn, LearnItem, nav, NavItem (+12 more)

### Community 44 - "Skeleton()"
Cohesion: 0.13
Nodes (23): ReportsSection(), CardSkeleton(), CvCardSkeleton(), EditorSkeleton(), LandingPageSkeleton(), PricingPageSkeleton(), ScorePageSkeleton(), Skeleton() (+15 more)

### Community 45 - "simulasi-wawancara.negosiasi.tsx"
Cohesion: 0.14
Nodes (22): getRecognition(), SpeechRecognitionAlternative, SpeechRecognitionErrorEvent, SpeechRecognitionEvent, SpeechRecognitionResult, SpeechRecognitionResultList, useSpeechRecognition(), negotiationEvaluate() (+14 more)

### Community 46 - "ai-common.ts"
Cohesion: 0.14
Nodes (20): AiCompletionOptions, AiMessage, checkAndTrackQuota(), FEATURE_MAP, FEATURE_QUOTA_MAP, getTierLimit(), QuotaReservation, AiPersona (+12 more)

### Community 47 - "templates.tsx"
Cohesion: 0.26
Nodes (18): ExamConfirmDialog(), Props, Props, StartExamDialog(), AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+10 more)

### Community 48 - "auth.users"
Cohesion: 0.13
Nodes (16): cv_reviews, idx_cv_reviews_created_at, idx_cv_reviews_user_id, idx_cv_analytics_cv_created, idx_cv_analytics_user, public.cv_analytics, public.generate_referral_code(), public.interview_sessions (+8 more)

### Community 49 - "cv-export.ts"
Cohesion: 0.15
Nodes (20): bodyParagraph(), buildBaliHeader(), buildBandungHeader(), buildBogorHeader(), buildJakartaHeader(), buildMakassarHeader(), buildMalangHeader(), buildManadoHeader() (+12 more)

### Community 50 - "server.ts"
Cohesion: 0.16
Nodes (15): consumeLastCapturedError(), renderErrorPage(), applySecurityHeaders(), createSecureResponse(), CSP_DIRECTIVES, SECURITY_HEADERS, brandedErrorResponse(), fetch() (+7 more)

### Community 51 - "FiguralGeneratorCard.tsx"
Cohesion: 0.14
Nodes (22): FiguralGeneratorCard(), generate(), save(), SetOption, TYPE_LABEL, Json, FiguralDifficulty, FiguralQuestion (+14 more)

### Community 52 - "ai-functions.ts"
Cohesion: 0.14
Nodes (23): callEdge(), extractCvTextWithAi(), extractKeywords(), generateCoverLetter(), getToken(), negotiationList(), NegotiationListItem, NegotiationMessage (+15 more)

### Community 53 - "error-handler.ts"
Cohesion: 0.12
Nodes (11): AppError, AuthenticationError, AuthorizationError, createErrorResponse(), ErrorResponse, handleError(), logError(), NotFoundError (+3 more)

### Community 54 - "harga.tsx"
Cohesion: 0.10
Nodes (21): ProductKey, checkAndHandleSubscription(), createFreeSubscription(), downgradeToFree(), Checkout, comparison, CurrentPlan, faqs (+13 more)

### Community 55 - "cv/TemplateGallery.tsx"
Cohesion: 0.20
Nodes (20): CV_FONT_STACK, CvPreview(), CvWatermark(), formatCvDescriptions(), formatDescription(), MultiPageCvPreview(), renderTemplateById(), splitContentIntoPages() (+12 more)

### Community 56 - "templates/index.ts"
Cohesion: 0.21
Nodes (13): BaliTemplate(), DEFAULT_SECTION_ORDER, DEFAULT_SECTION_ORDER, MakassarTemplate(), DEFAULT_SECTION_ORDER, MedanTemplate(), Section(), SectionProps (+5 more)

### Community 57 - "template.tsx"
Cohesion: 0.16
Nodes (17): ClientOnly(), templateComponents, TemplateGallery(), previewData, templateMap, TemplateSlug, TemplateCardSkeleton(), FREE_TEMPLATES (+9 more)

### Community 58 - "lamaran.tsx"
Cohesion: 0.12
Nodes (20): Application, ApplicationRow, CvOption, CvRow, CvsQuery, cvsTable(), formatShortDate(), JobApplicationsQuery (+12 more)

### Community 59 - "SkdExamples.tsx"
Cohesion: 0.14
Nodes (15): ExampleCard(), resolve(), Resolved, SkdExamples(), svgSrc(), RichText(), SkdExample, SkdExampleOption (+7 more)

### Community 60 - "buildJobRow()"
Cohesion: 0.13
Nodes (20): buildJobRow(), cleanCompanyName(), cleanJobText(), escapeRegExp(), extractSalaryContext(), extractTechStack(), inferSalaryCurrency(), inferWorkMode() (+12 more)

### Community 61 - "payment-create/index.ts"
Cohesion: 0.11
Nodes (12): json(), RETURN_ORIGINS, SITE_URL, SumopodPaymentResponse, TRUSTED_PAYMENT_HOSTS, ADDONS, AdminClient, MIN_PAYMENT_AMOUNT (+4 more)

### Community 62 - "20261004000000_security_hotfix.sql"
Cohesion: 0.12
Nodes (11): enforce_cv_template_access_trigger, on_auth_user_created_referral, protect_profile_quotas_trigger, public.apply_referral_signup(), public.enforce_cv_template_access(), public.generate_referral_code(), public.get_shared_cv(), public.get_shared_portfolio() (+3 more)

### Community 63 - "navigation-menu.tsx"
Cohesion: 0.14
Nodes (12): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport, ToggleGroup (+4 more)

### Community 64 - "__root.tsx"
Cohesion: 0.15
Nodes (11): goBackAction(), ErrorAction, Toaster(), ToasterProps, CanonicalUpdater(), ErrorComponent(), NotFoundComponent(), PageLoadingFallback() (+3 more)

### Community 65 - "sanitize.ts"
Cohesion: 0.22
Nodes (14): canPurify(), escapeHtml(), purifyHtml(), purifyText(), sanitizeCVData(), sanitizeEmail(), sanitizeFilename(), sanitizePhone() (+6 more)

### Community 66 - "payments.tsx"
Cohesion: 0.14
Nodes (14): DashboardSkeleton(), Skeleton(), describeActivation(), DisplayStatus, Filter, FILTERS, formatDay(), PaymentRow (+6 more)

### Community 67 - "ai-translate-cv/index.ts"
Cohesion: 0.16
Nodes (15): TranslateTier, applyTranslations(), buildTranslateMessages(), collectTranslatable(), Dict, isDict(), LANGUAGE_NAME, MAX_ITEMS (+7 more)

### Community 68 - "20260507052000_phase4_ai_tables.sql"
Cohesion: 0.17
Nodes (16): idx_ai_usage_user_feature_date, idx_ai_usage_user_id, idx_cv_scores_cv_id, idx_cv_scores_user_id, idx_cv_versions_cv_id, public.ai_usage, public.cv_scores, public.cv_versions (+8 more)

### Community 69 - "Subscription Tiers (Free/Starter/Pro/Pro"
Cohesion: 0.15
Nodes (17): ATS Score Widget, CV Editor Layout (3-panel responsive), AI Panduan Pengisian (Guided Mode) F-07, AI Saran Pengisian F-05, ATS CV Scoring + JD Matching F-06, Business and Product Goals (MAU, MRR, conversion), ATS-Friendly CV Templates (T01-T08) F-04, CVKarir.id ATS-Friendly CV Builder Platform (+9 more)

### Community 70 - "tryout-cpns.tsx"
Cohesion: 0.17
Nodes (16): TabsContent, BrowserFrame(), ExamVisual(), ExplanationVisual(), faqs, Feature, features, PackageCard() (+8 more)

### Community 71 - "extractStructuredJobPosting()"
Cohesion: 0.19
Nodes (17): cleanContent(), cleanListText(), cleanText(), decodeHtmlEntities(), enrichSearchResults(), extractLinksFromHtml(), extractLinksFromText(), extractSourcePages() (+9 more)

### Community 72 - "admin-users/index.ts"
Cohesion: 0.16
Nodes (14): AdminUsersPageRow, AuthUser, BadRequestError, buildUserRows(), countByUser(), getMonthStartIso(), isUuid(), json() (+6 more)

### Community 73 - "public.profiles"
Cohesion: 0.18
Nodes (12): on_auth_user_created, public.handle_new_user(), public.has_role(), public.profiles, public.update_updated_at_column(), public.user_roles, update_profiles_updated_at, public.has_role() (+4 more)

### Community 74 - "public.payment_orders"
Cohesion: 0.18
Nodes (9): idx_payment_orders_pending, idx_payment_orders_user_created, idx_payment_webhook_events_order, public.fulfill_payment_order(), public.payment_orders, public.payment_webhook_events, update_payment_orders_updated_at, public.fulfill_payment_order() (+1 more)

### Community 75 - "Color System (primary #468432)"
Cohesion: 0.13
Nodes (15): ATS-Safe Template Design Rules, Color System (primary #468432), Landing Page Structure (10 sections), SEO Strategy (keyword clusters, on-page, technical), Subscription Badge Design (Free/Starter/Pro/Pro+), Template T01 Profesional Bersih, Authentication (Register, Verify Email, Login) F-01..F-03, SEO and Discoverability Requirements (+7 more)

### Community 76 - "public.job_listings"
Cohesion: 0.17
Nodes (9): public.job_listings, idx_job_listings_deadline, idx_job_listings_work_mode, idx_saved_job_listings_job_listing_id, idx_saved_job_listings_user_id, public.saved_job_listings, idx_job_listings_expires_at, public.deactivate_expired_job_listings() (+1 more)

### Community 77 - "Extra Features F-10 (Cover Letter, Linke"
Cohesion: 0.23
Nodes (13): Application Tracker (F-14), CV Analytics (F-12), Additional Database Schema (job_listings, job_applications, cv_analytics, referral, interview_sessions), Interview Simulator (F-16), Job Board (F-15), Referral Program (F-13), Route Plan (/lowongan, /lamaran, /analitik, /referral, /simulasi-wawancara), WhatsApp Share (F-11) (+5 more)

### Community 78 - "carousel.tsx"
Cohesion: 0.17
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 79 - "cv-types.ts"
Cohesion: 0.13
Nodes (11): coverLetterPrintStyles, Props, DEFAULT_SECTION_ORDER, hasTranslatableContent(), CvCertificate, CvEducation, CvInternship, CvLanguage (+3 more)

### Community 80 - "analytics.ts"
Cohesion: 0.30
Nodes (13): AnalyticsEventPayload, generateUuid(), getBrowserName(), getDeviceType(), getHumanPageTitle(), getOperatingSystem(), getReferrerChannel(), getSessionId() (+5 more)

### Community 81 - "belajar-skd.$slug.tsx"
Cohesion: 0.19
Nodes (12): CTA_PAKET, CTA_TRYOUT, SKD_TOPIC_LABEL, SkdModule, skdModules, skdModulesBySlug, SkdModuleTopic, tipPosts (+4 more)

### Community 82 - "LeaderboardTable.tsx"
Cohesion: 0.32
Nodes (11): LeaderboardTable(), MeTag(), PersonAvatar(), Podium(), Props, RankBadge(), Avatar, AvatarFallback (+3 more)

### Community 83 - "form.tsx"
Cohesion: 0.19
Nodes (10): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+2 more)

### Community 84 - "changelog.tsx"
Cohesion: 0.21
Nodes (13): CheckItem(), changelog, ChangelogPage(), Highlight, LatestReleaseCard(), legend, PaymentMockup(), QR_CELLS (+5 more)

### Community 85 - "AdminTryoutPage()"
Cohesion: 0.21
Nodes (13): AdminTryoutPage(), handleDeleteSet(), loadAll(), toggleActive(), Bone(), Busy(), CreditsSkeleton(), creditStatusOf() (+5 more)

### Community 86 - "syarat-ketentuan.tsx"
Cohesion: 0.19
Nodes (13): accountRules, ContactBanner(), JumpLinks(), liabilityCards, paymentRules, Route, SectionId, sections (+5 more)

### Community 87 - "assessPage()"
Cohesion: 0.18
Nodes (14): addDays(), assessPage(), computeExpiresAt(), cutSimilarJobsSection(), daysBetween(), endOfDayJakarta(), extractDeadline(), extractPostedDate() (+6 more)

### Community 88 - "extractBatch()"
Cohesion: 0.21
Nodes (13): callAiJson(), extractBatch(), extractCompleteJobsFromTruncatedJson(), extractJobsWithAi(), mapWithConcurrency(), normalizeParsedJob(), normalizeParsedJobs(), parseJobsFromContent() (+5 more)

### Community 89 - "20260826000000_create_visitor_events_and"
Cohesion: 0.21
Nodes (7): idx_visitor_events_created_at, idx_visitor_events_event_name, idx_visitor_events_page_path, idx_visitor_events_session_id, idx_visitor_events_visitor_id, public.get_visitor_analytics(), public.visitor_events

### Community 90 - "Accessibility WCAG 2.1 AA"
Cohesion: 0.17
Nodes (11): Accessibility WCAG 2.1 AA, Motion, Loading and Empty States, Typography (Plus Jakarta Sans + Inter), Non-Functional Requirements (performance, scalability, a11y, i18n), Dashboard Skeleton Loading component, Task 10 Future Improvements, TASK-029 Loading States and Skeletons, Tryout Exam Detail page (/tryout/$examId) (+3 more)

### Community 91 - "Database Schema and Migrations"
Cohesion: 0.21
Nodes (13): Finding: payments table missing, SEC-006 Create payments table with RLS, SEC-010 Document user_subscriptions RLS gap, SEC-013 Harden payment webhook order ID parsing, Finding: user_subscriptions has no INSERT/UPDATE RLS (intentional), Finding: fragile payment-webhook order ID parsing, ai-suggest Edge Function, Coding Standards for AI Agent (+5 more)

### Community 92 - "Tools Separation Plan (split combined to"
Cohesion: 0.22
Nodes (12): Cover Letter PDF Download (handleDownloadPdf), Cover Letter Generator page (/tools/cover-letter/$cvId), Reusable CV Picker Modal, Keyword Extractor page (/tools/keyword/$cvId), Tools Index page (/tools) with CV picker, Shared AI functions (src/lib/ai-functions.ts), Cover Letter Generator Page, Deprecated combined route tools.$cvId.tsx (+4 more)

### Community 94 - "DownloadDropdown.tsx"
Cohesion: 0.19
Nodes (10): DownloadDropdown(), DownloadStatus, RecordDownloadResult, SubscriptionWithDownloadQuota, getVisitorId(), AuthProvider(), registerDeviceOnce(), addInvisibleTextLayer() (+2 more)

### Community 95 - "UserTryoutPackages.tsx"
Cohesion: 0.19
Nodes (8): CreditRow, formatDate(), METHOD_LABEL, PackageOption, PAYMENT_METHODS, rupiah(), statusOf(), UserTryoutPackages()

### Community 96 - "ManadoTemplate.tsx"
Cohesion: 0.23
Nodes (12): DEFAULT_SECTION_ORDER, Description(), formatPeriod(), initialsOf(), MAIN_SECTION_IDS, MainHeading(), ManadoTemplate(), SIDEBAR_SECTION_IDS (+4 more)

### Community 97 - "local-scoring.ts"
Cohesion: 0.26
Nodes (12): asText(), clamp(), EN_ACTION_VERBS, firstWord(), mentions(), scoreCvLocally(), ScoreResult, startsWithActionVerb() (+4 more)

### Community 98 - "20260507053000_phase5_subscriptions.sql"
Cohesion: 0.22
Nodes (11): idx_subscriptions_user_id, public.blog_posts, public.handle_new_subscription(), public.handle_new_user(), public.interview_tips, public.subscriptions, public.templates, protect_subscriptions_tier_trigger (+3 more)

### Community 99 - "public.tryout_question_reports"
Cohesion: 0.23
Nodes (9): idx_tryout_question_reports_one_open, idx_tryout_question_reports_question, idx_tryout_question_reports_status, idx_tryout_question_reports_user, public.report_tryout_question(), public.tryout_question_reports, public.tryout_questions_invalidate_detail(), trg_tryout_questions_invalidate_detail (+1 more)

### Community 100 - "SEC-007 Per-minute rate limiting for edg"
Cohesion: 0.20
Nodes (11): Finding: AI_API_KEY stored in .env, Finding: CORS wildcard in edge functions, Finding: linkedin-import lacks authentication, Finding: no per-minute rate limiting, Finding: send-email lacks auth and rate limit, Security Deployment Checklist, SEC-001 Rotate AI_API_KEY and secure env vars, SEC-002 Restrict CORS to specific origins (+3 more)

### Community 101 - "tryout.leaderboard.tsx"
Cohesion: 0.24
Nodes (7): TabsList, TabsTrigger, TryoutRpcClient, ExamSet, Route, Stat(), TryoutLeaderboardPage()

### Community 102 - "FakeBuyerCard.tsx"
Cohesion: 0.23
Nodes (11): between(), Buyer, buyers, FakeBuyerCard(), FIRST_DELAY_MS, GAP_MS, pickRandom(), readSession() (+3 more)

### Community 103 - "types.ts"
Cohesion: 0.17
Nodes (9): supabaseAdmin, CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Tables, TablesInsert (+1 more)

### Community 104 - "normalizeWords()"
Cohesion: 0.32
Nodes (12): applyPolish(), buildSourceDescription(), cleanJobDescription(), extractSectionText(), filterGroundedInlineText(), groundedJobLists(), isJobContentNoise(), isTextGrounded() (+4 more)

### Community 105 - "blog.tsx"
Cohesion: 0.25
Nodes (10): ArticleCardSkeleton(), buildSectionHead(), BlogHubPage(), BlogLoading(), BlogRoute(), formatDate(), Route, Route (+2 more)

### Community 106 - "interview-questions.ts"
Cohesion: 0.25
Nodes (10): AnswerEvaluation, clampScore(), findArray(), InterviewEvaluation, InterviewQuestion, normalizeEvaluation(), normalizeQuestions(), text() (+2 more)

### Community 107 - "public.payments"
Cohesion: 0.33
Nodes (7): idx_payments_created_at, idx_payments_gateway_order_id, idx_payments_status, idx_payments_user_id, public.payments, public.update_updated_at_column(), update_payments_updated_at

### Community 108 - "SectionsNav.tsx"
Cohesion: 0.22
Nodes (5): OPTIONAL_SECTIONS, Props, SectionsNav(), SortableSection(), DEFAULT_SECTION_ORDER

### Community 109 - "sri.ts"
Cohesion: 0.22
Nodes (5): generateSRI(), generateSRIFromURL(), HCAPTCHA_SRI, ScriptTagOptions, VERCEL_SRI

### Community 110 - "cv.index.tsx"
Cohesion: 0.33
Nodes (8): getTierLimits(), CvListPage(), CvListSkeleton(), CvRow, EmptyState(), STATUS_FILTERS, StatusFilter, timeAgo()

### Community 111 - "kontak.tsx"
Cohesion: 0.36
Nodes (8): contactChannels, KontakPage(), NewTabHint(), quickTopics, responseNotes, Route, TopicPicker(), waLink()

### Community 112 - "Security Implementation (CSP headers, au"
Cohesion: 0.29
Nodes (8): OWASP Top 10 Security Requirements, Finding: conflicting CSP in vercel.json vs security-headers.ts, Finding: no field-level encryption for PII, SEC-005 Consolidate CSP headers, SEC-012 Review unsafe-eval and unsafe-inline in CSP, Finding: unsafe-eval and unsafe-inline in CSP, Security Implementation (CSP headers, auth middleware, Zod validation), TASK-004 Security Headers and Middleware

### Community 113 - "PadangTemplate.tsx"
Cohesion: 0.39
Nodes (7): DEFAULT_SECTION_ORDER, Description(), EntryHeader(), formatPeriod(), PadangTemplate(), SectionTitle(), TextAlign

### Community 114 - "BenixCsWidget.tsx"
Cohesion: 0.29
Nodes (7): BENIX_BLOCKED_PREFIXES, BENIX_WIDGET_SELECTORS, BenixCsWidget(), BenixCsWidgetProps, BenixWidgetConfig, isBenixWidgetAllowedPath(), Window

### Community 115 - "Payment Success Email Template"
Cohesion: 0.33
Nodes (7): Payment Methods and Gateway (Midtrans/Xendit), Tech Stack (Next.js, Supabase, Claude API, Midtrans), generate-pdf Edge Function usage, TASK-014 PDF and DOCX Download, TASK-020 Midtrans Integration (partial), Payment Success Email Template, Ringkasan Upgrade block (TierName, Amount, ExpiresAt)

### Community 116 - "Shared Tryout Components (TryoutPageHead"
Cohesion: 0.29
Nodes (6): Tryout Buy page (/tryout/beli), Tryout Dashboard page (/tryout), Tryout Landing page (/tryout-cpns), Tryout Leaderboard page (/tryout/leaderboard), ResumeBanner (ongoing exam), Shared Tryout Components (TryoutPageHeader, ProgressStats, ExamSetCard, CreditBalance, LeaderboardTable, TryoutPackageCard)

### Community 117 - "20260512000004_security_rpc_functions.sq"
Cohesion: 0.38
Nodes (4): public.has_role(), public.referral_codes, public.referral_signups, public.track_referral_signup()

### Community 118 - "highlight-utils.ts"
Cohesion: 0.33
Nodes (4): getInlineHighlightBg(), HighlightRegion, highlightTextInString(), SuggestionEditorProps

### Community 119 - "SiteFooter.tsx"
Cohesion: 0.33
Nodes (5): COLUMNS, FooterLink, LEGAL_LINKS, SiteFooter(), APP_VERSION

### Community 120 - "CreditCardList()"
Cohesion: 0.48
Nodes (7): CreditCardList(), CreditPaymentCell(), CreditsTable(), CreditStatusPill(), CreditUsage(), CreditUserCell(), formatDate()

### Community 121 - "ExamSetDialog()"
Cohesion: 0.29
Nodes (5): ExamSetDialog(), FieldError(), FormSection(), NumberField(), proportionalSettings()

### Community 122 - "recent-cvs.tsx"
Cohesion: 0.47
Nodes (5): CvRow, RecentCvs(), RecentCvsProps, scoreTone(), timeAgo()

### Community 123 - "usage-bars.tsx"
Cohesion: 0.53
Nodes (5): getStatus(), getUsageRatio(), UsageBar, UsageBars(), UsageBarsProps

### Community 124 - "tips-card.tsx"
Cohesion: 0.50
Nodes (4): getDailyTips(), tagColors, tips, TipsCard()

### Community 125 - "feature-gate.tsx"
Cohesion: 0.50
Nodes (4): FeatureGate(), Props, TIER_LEVEL, UpgradePrompt()

### Community 126 - "getCroppedImg()"
Cohesion: 0.80
Nodes (4): createImage(), getCroppedImg(), getRadianAngle(), rotateSize()

### Community 129 - "cleanJobTitle()"
Cohesion: 0.50
Nodes (4): cleanJobTitle(), isShouting(), stripAngleBrackets(), toTitleCase()

## Ambiguous Edges - Review These
- `Payment Methods and Gateway (Midtrans/Xendit)` → `Payment Success Email Template`  [AMBIGUOUS]
  emails/payment-success.html · relation: conceptually_related

## Knowledge Gaps
- **35 isolated node(s):** `Typography (Plus Jakarta Sans + Inter)`, `User Personas (Reza fresh graduate, Siti professional)`, `Authentication (Register, Verify Email, Login) F-01..F-03`, `SEO and Discoverability Requirements`, `Milestones and Phasing (MVP, 1.5, 2)` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1179 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeQuestions()` connect `interview-questions.ts` to `simulasi-wawancara.$id.tsx`, `AI Interview Functions`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **What connects `Typography (Plus Jakarta Sans + Inter)`, `User Personas (Reza fresh graduate, Siti professional)`, `Authentication (Register, Verify Email, Login) F-01..F-03` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Route Tree & SEO` be split into smaller, more focused modules?**
  _Cohesion score 0.016688741721854305 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `UI Primitives (shadcn)` to `Dashboard & CV Editor`, `Cards, Auth & Score Pages`, `Marketing & Content Pages`, `Tryout Result Analysis`, `Landing & Checkout`, `Forms & Tailor Tools`, `Auth Context & Supabase Client`, `CV Detail & Portfolio`, `Dashboard Widgets & Icons`, `Tryout Dashboard`, `Payment Pages & Invoice`, `Login & Register`, `Admin Analytics`, `Demo & Skeletons`, `Admin Jobs Table`, `Tryout Practice Mode`, `CV Review`, `QuestionQualityPanel.tsx`, `simulasi-wawancara.tsx`, `tryout-types.ts`, `cv-review.index.tsx`, `simulasi-wawancara.$id.tsx`, `tryout.$examId.ujian.tsx`, `lowongan.tsx`, `Badge()`, `admin/tryout.tsx`, `editor/index.ts`, `EditorToolbar.tsx`, `Skeleton()`, `simulasi-wawancara.negosiasi.tsx`, `templates.tsx`, `FiguralGeneratorCard.tsx`, `lamaran.tsx`, `SkdExamples.tsx`, `navigation-menu.tsx`, `payments.tsx`, `tryout-cpns.tsx`, `carousel.tsx`, `LeaderboardTable.tsx`, `form.tsx`, `AdminTryoutPage()`, `UserTryoutPackages.tsx`, `tryout.leaderboard.tsx`, `SectionsNav.tsx`, `cv.index.tsx`, `CreditCardList()`, `ExamSetDialog()`, `recent-cvs.tsx`, `usage-bars.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `UI Primitives (shadcn)` be split into smaller, more focused modules?**
  _Cohesion score 0.037868162692847124 - nodes in this community are weakly interconnected._
- **Why does `Button` connect `Cards, Auth & Score Pages` to `UI Primitives (shadcn)`, `Dashboard & CV Editor`, `Marketing & Content Pages`, `Tryout Result Analysis`, `Landing & Checkout`, `Forms & Tailor Tools`, `Auth Context & Supabase Client`, `CV Detail & Portfolio`, `Dashboard Widgets & Icons`, `Tryout Dashboard`, `Payment Pages & Invoice`, `Demo & Skeletons`, `Admin Jobs Table`, `Tryout Practice Mode`, `Blog & Article View`, `Job Listing Detail`, `CV Review`, `QuestionQualityPanel.tsx`, `simulasi-wawancara.tsx`, `cv-review.index.tsx`, `simulasi-wawancara.$id.tsx`, `tryout.$examId.ujian.tsx`, `lowongan.tsx`, `Badge()`, `admin/tryout.tsx`, `editor/index.ts`, `Skeleton()`, `simulasi-wawancara.negosiasi.tsx`, `templates.tsx`, `FiguralGeneratorCard.tsx`, `template.tsx`, `lamaran.tsx`, `payments.tsx`, `tryout-cpns.tsx`, `carousel.tsx`, `LeaderboardTable.tsx`, `AdminTryoutPage()`, `DownloadDropdown.tsx`, `UserTryoutPackages.tsx`, `tryout.leaderboard.tsx`, `blog.tsx`, `cv.index.tsx`, `ExamSetDialog()`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Payment Methods and Gateway (Midtrans/Xendit)` and `Payment Success Email Template`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related) - confidence is low._