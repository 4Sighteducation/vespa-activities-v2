// VESPA Activities Student Experience v2.0
// A playful, modern interface for student activity management

(function() {
    'use strict';
    
    const VERSION = '2.0';
    const DEBUG = true;
    
    // Export the initializer function that will be called by KnackAppLoader
    window.initializeVESPAActivitiesStudent = function() {
        log('Initializing VESPA Activities Student Experience', window.VESPA_ACTIVITIES_STUDENT_CONFIG);
        
        if (!window.VESPA_ACTIVITIES_STUDENT_CONFIG) {
            console.error('[VESPA Activities] Config not found!');
            return;
        }
        
        // Prevent duplicate initialization
        if (window.vespaActivitiesApp) {
            log('App already initialized, skipping');
            return;
        }
        
        try {
            // Create and initialize the app
            const app = new VESPAActivitiesApp(window.VESPA_ACTIVITIES_STUDENT_CONFIG);
            window.vespaActivitiesApp = app;
            
            // Initialize the app
            app.init().then(() => {
                log('VESPA Activities initialized successfully');
            }).catch(error => {
                console.error('[VESPA Activities] Failed to initialize:', error);
            });
        } catch (error) {
            console.error('[VESPA Activities] Error creating app:', error);
        }
    };
    
    // Also support direct initialization if the script loads after config is set
    if (window.VESPA_ACTIVITIES_STUDENT_CONFIG && !window.vespaActivitiesApp) {
        log('Config already available, initializing immediately');
        window.initializeVESPAActivitiesStudent();
    }
    
    // Main application class
    class VESPAActivitiesApp {
        constructor(config) {
            this.config = config;
            this.state = {
                view: 'dashboard',
                vespaScores: {},
                activities: {
                    prescribed: [],
                    completed: [],
                    all: [],
                    progress: []
                },
                prescribedActivityIds: [],
                finishedActivityIds: [],
                problemMappings: null,
                stats: {
                    totalPoints: 0,
                    currentStreak: 0,
                    activitiesCompleted: 0,
                    averageWordCount: 0,
                    nextMilestone: { points: 50, name: 'Getting Started! 🌱' }
                }
            };
            this.container = null;
            // Color scheme for VESPA categories
            this.colors = {
                vision: { primary: '#ff8f00', secondary: '#ffa726', emoji: '👁️' },
                effort: { primary: '#86b4f0', secondary: '#64b5f6', emoji: '💪' },
                systems: { primary: '#72cb44', secondary: '#81c784', emoji: '⚙️' },
                practice: { primary: '#7f31a4', secondary: '#ab47bc', emoji: '🎯' },
                attitude: { primary: '#f032e6', secondary: '#e91e63', emoji: '🧠' }
            };
        }
        
        async init() {
            try {
                log('Starting initialization');
                
                // Wait a bit for Knack views to fully render
                await this.waitForViews();
                
                // Hide the data views
                this.hideDataViews();
                
                // Load initial data
                await this.loadInitialData();
                
                // Initial render
                this.render();
                
                // Attach event listeners
                this.attachEventListeners();
                
                // Start animations
                this.startAnimations();
                
                log('Initialization complete');
            } catch (error) {
                console.error('Error during initialization:', error);
                this.showError('Failed to initialize the application');
            }
        }
        
        async waitForViews() {
            log('Waiting for Knack views to be ready...');
            
            // Wait up to 5 seconds for views to be available
            const maxWaitTime = 5000;
            const checkInterval = 100;
            let waitedTime = 0;
            
            while (waitedTime < maxWaitTime) {
                // Check if all required views exist in Knack.views
                const requiredViews = [
                    this.config.views.vespaResults,
                    this.config.views.studentRecord,
                    this.config.views.allActivities,
                    this.config.views.activityProgress
                ];
                
                const allViewsReady = requiredViews.every(viewKey => {
                    const exists = viewKey in (Knack.views || {});
                    if (!exists) {
                        log(`View ${viewKey} not yet available`);
                    }
                    return exists;
                });
                
                if (allViewsReady) {
                    log('All views are ready');
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                waitedTime += checkInterval;
            }
            
            log('Warning: Timeout waiting for views, proceeding anyway');
            log('Available views:', Object.keys(Knack.views || {}));
        }
        
        hideDataViews() {
            // Hide all data views
            Object.values(this.config.views).forEach(viewId => {
                if (viewId !== this.config.views.richText) {
                    const element = document.querySelector(`#${viewId}`);
                    if (element) {
                        element.style.display = 'none';
                        this.dataViews[viewId] = element;
                    }
                }
            });
        }
        
        async loadInitialData() {
            log('Loading initial data...');
            
            // Get container
            this.container = document.querySelector(`#${this.config.views.richText}`);
            if (!this.container) {
                throw new Error('Container not found');
            }
            
            // Show loading state
            this.container.innerHTML = this.getLoadingHTML();
            
            // Parse data from Knack views
            try {
                // Parse VESPA scores from view_3164
                this.parseVESPAScores();
                
                // Parse student record and activities
                this.parseStudentRecord();
                this.parseActivities();
                this.parseActivityProgress();
                
                // Load problem mappings
                await this.loadProblemMappings();
                
                // Calculate initial stats
                this.calculateStats();
                
                log('Initial data loaded successfully', this.state);
            } catch (error) {
                console.error('Error loading initial data:', error);
                this.showError('Failed to load data. Please refresh the page.');
            }
        }
        
        parseVESPAScores() {
            log('Parsing VESPA scores from view', this.config.views.vespaResults);
            
            // Get the VESPA results view element
            const vespaView = document.querySelector(`#${this.config.views.vespaResults}`);
            if (!vespaView) {
                log('VESPA results view element not found in DOM');
                return;
            }
            
            // Look for the data in the view's records
            const viewData = Knack.views[this.config.views.vespaResults];
            log('View data object:', viewData);
            
            if (!viewData) {
                log('Knack.views does not contain', this.config.views.vespaResults);
                log('Available views:', Object.keys(Knack.views || {}));
                return;
            }
            
            const records = viewData?.model?.data?.models || [];
            log('Records found:', records.length);
            
            if (records.length > 0) {
                const record = records[0].attributes;
                log('First record attributes:', record);
                
                // Parse scores using configured field IDs
                this.state.vespaScores = {
                    vision: parseInt(record[this.config.fields.visionScore] || 0),
                    effort: parseInt(record[this.config.fields.effortScore] || 0),
                    systems: parseInt(record[this.config.fields.systemsScore] || 0),
                    practice: parseInt(record[this.config.fields.practiceScore] || 0),
                    attitude: parseInt(record[this.config.fields.attitudeScore] || 0)
                };
                
                log('Parsed VESPA scores:', this.state.vespaScores);
            } else {
                // Default scores if no data found
                this.state.vespaScores = {
                    vision: 0,
                    effort: 0,
                    systems: 0,
                    practice: 0,
                    attitude: 0
                };
                log('No VESPA scores found, using defaults');
            }
        }
        
        parseStudentRecord() {
            log('Parsing student record from view', this.config.views.studentRecord);
            
            // Get the student record view
            const studentView = document.querySelector(`#${this.config.views.studentRecord}`);
            if (!studentView) {
                log('Student record view not found');
                return;
            }
            
            // Get student data from Knack
            const records = Knack.views[this.config.views.studentRecord]?.model?.data?.models || [];
            
            if (records.length > 0) {
                const record = records[0].attributes;
                
                // Parse prescribed activities (field_1683) - this is a connection field
                const prescribedRaw = record[this.config.fields.prescribedActivities + '_raw'] || [];
                this.state.prescribedActivityIds = prescribedRaw.map(item => item.id);
                
                // Parse finished activities (field_1380) - this is a connection field
                const finishedRaw = record[this.config.fields.finishedActivities + '_raw'] || [];
                this.state.finishedActivityIds = finishedRaw.map(item => item.id);
                
                log('Prescribed activity IDs:', this.state.prescribedActivityIds);
                log('Finished activity IDs:', this.state.finishedActivityIds);
            }
        }
        
        parseActivities() {
            log('Parsing activities from view', this.config.views.allActivities);
            
            // Get all activities view
            const activitiesView = document.querySelector(`#${this.config.views.allActivities}`);
            if (!activitiesView) {
                log('Activities view not found');
                return;
            }
            
            // Get activities data from Knack
            const records = Knack.views[this.config.views.allActivities]?.model?.data?.models || [];
            
            // Parse all activities
            const allActivities = records.map(model => {
                const activity = model.attributes;
                
                // Using correct field IDs from activities.json
                return {
                    id: activity.id,
                    knackId: activity.field_2074 || activity.id, // Activity_id field
                    name: activity.field_1278 || 'Unnamed Activity', // Activities Name
                    category: this.parseActivityCategory(activity.field_1285 || ''), // VESPA Category
                    points: 50, // Default points since no field exists
                    description: activity.field_1309 || '', // Activity Instructions
                    level: activity.field_1295 || '', // Level (Level 2 or Level 3)
                    active: activity.field_1299 !== 'No', // Active field
                    color: activity.field_1308 || '', // Activity Color
                    content: activity.field_1289 || '', // Activity Text (HTML)
                    video: activity.field_1288 || '', // Activity Video
                    slideshow: activity.field_1293 || '', // Activity Slideshow
                    minScore: parseInt(activity.field_1287 || 0), // Score to show (If More Than)
                    maxScore: parseInt(activity.field_1294 || 10), // Score to show (If Less Than or Equal To)
                    order: parseInt(activity.field_1298 || 0), // Order
                    raw: activity // Keep raw data for reference
                };
            });
            
            // Filter only active activities
            const activeActivities = allActivities.filter(activity => activity.active);
            
            // Filter prescribed activities
            this.state.activities.prescribed = activeActivities.filter(activity => 
                this.state.prescribedActivityIds?.includes(activity.id)
            );
            
            // Filter completed activities
            this.state.activities.completed = activeActivities.filter(activity => 
                this.state.finishedActivityIds?.includes(activity.id)
            );
            
            // Store all active activities for browsing
            this.state.activities.all = activeActivities;
            
            log('Parsed activities:', {
                all: this.state.activities.all.length,
                prescribed: this.state.activities.prescribed.length,
                completed: this.state.activities.completed.length
            });
        }
        
        parseActivityProgress() {
            log('Parsing activity progress from view', this.config.views.activityProgress);
            
            // Get activity progress view
            const progressView = document.querySelector(`#${this.config.views.activityProgress}`);
            if (!progressView) {
                log('Activity progress view not found');
                return;
            }
            
            // Get progress data from Knack
            const records = Knack.views[this.config.views.activityProgress]?.model?.data?.models || [];
            
            // Parse progress records
            this.state.activities.progress = records.map(model => {
                const progress = model.attributes;
                
                return {
                    id: progress.id,
                    activityId: progress[this.config.fields.activity + '_raw']?.[0]?.id || null,
                    activityName: progress[this.config.fields.activity] || '',
                    cycleNumber: parseInt(progress[this.config.fields.cycle] || 0),
                    dateAssigned: progress[this.config.fields.dateAssigned] || null,
                    dateStarted: progress[this.config.fields.dateStarted] || null,
                    dateCompleted: progress[this.config.fields.dateCompleted] || null,
                    timeMinutes: parseInt(progress[this.config.fields.timeMinutes] || 0),
                    status: progress[this.config.fields.status] || 'not_started',
                    verified: progress[this.config.fields.verified] === 'Yes',
                    pointsEarned: parseInt(progress[this.config.fields.points] || 0),
                    selectedVia: progress[this.config.fields.selectedVia] || '',
                    reflection: progress[this.config.fields.reflection] || '',
                    wordCount: parseInt(progress[this.config.fields.wordCount] || 0)
                };
            });
            
            // Update completed activities with progress data
            this.state.activities.progress.forEach(progress => {
                if (progress.status === 'completed' && progress.activityId) {
                    const completedActivity = this.state.activities.all.find(a => a.id === progress.activityId);
                    if (completedActivity && !this.state.activities.completed.find(a => a.id === completedActivity.id)) {
                        this.state.activities.completed.push({
                            ...completedActivity,
                            completedDate: progress.dateCompleted,
                            pointsEarned: progress.pointsEarned,
                            timeSpent: progress.timeMinutes
                        });
                    }
                }
            });
            
            log('Parsed activity progress:', this.state.activities.progress);
        }
        
        parseActivityCategory(categoryValue) {
            // Parse the category value to match our expected format
            const categoryMap = {
                'vision': 'vision',
                'effort': 'effort',
                'systems': 'systems',
                'practice': 'practice',
                'attitude': 'attitude',
                'v': 'vision',
                'e': 'effort',
                's': 'systems',
                'p': 'practice',
                'a': 'attitude'
            };
            
            const normalized = (categoryValue || '').toLowerCase().trim();
            return categoryMap[normalized] || normalized;
        }
        
        async loadProblemMappings() {
            if (!this.config.problemMappingsUrl) return;
            
            try {
                const response = await fetch(this.config.problemMappingsUrl);
                const data = await response.json();
                this.problemMappings = data.problemMappings;
                log('Problem mappings loaded:', this.problemMappings);
            } catch (error) {
                console.error('Failed to load problem mappings:', error);
                // Use fallback mappings
                this.problemMappings = this.getFallbackProblemMappings();
            }
        }
        
        getFallbackProblemMappings() {
            return {
                vision: [
                    {
                        id: 'vision_1',
                        text: "I'm unsure about my future goals",
                        recommendedActivities: ['Dream Big', 'Vision Boards']
                    }
                ],
                effort: [
                    {
                        id: 'effort_1',
                        text: "I struggle to complete my homework on time",
                        recommendedActivities: ['Time Management Matrix', 'Pomodoro Technique']
                    }
                ]
                // etc...
            };
        }
        
        calculateStats() {
            // Calculate total points from activity progress
            const totalPoints = this.state.activities.progress
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + p.pointsEarned, 0);
            
            // Calculate activities completed
            const activitiesCompleted = this.state.activities.completed.length;
            
            // Calculate average word count
            const completedWithWords = this.state.activities.progress
                .filter(p => p.status === 'completed' && p.wordCount > 0);
            const avgWordCount = completedWithWords.length > 0
                ? Math.round(completedWithWords.reduce((sum, p) => sum + p.wordCount, 0) / completedWithWords.length)
                : 0;
            
            // Calculate current streak (simplified - would need date logic)
            const currentStreak = this.calculateStreak();
            
            // Determine next milestone
            const milestones = [
                { points: 50, name: 'Getting Started! 🌱' },
                { points: 100, name: 'Making Progress! 🚀' },
                { points: 250, name: 'On Fire! 🔥' },
                { points: 500, name: 'VESPA Champion! 🏆' },
                { points: 1000, name: 'VESPA Legend! ⭐' }
            ];
            
            const nextMilestone = milestones.find(m => m.points > totalPoints) || 
                                { points: totalPoints + 500, name: 'Beyond Legendary! 🌟' };
            
            this.state.stats = {
                totalPoints,
                currentStreak,
                activitiesCompleted,
                averageWordCount: avgWordCount,
                nextMilestone
            };
            
            log('Calculated stats:', this.state.stats);
        }
        
        calculateStreak() {
            // Simple streak calculation based on consecutive days
            // This would need more sophisticated date handling in production
            const sortedProgress = [...this.state.activities.progress]
                .filter(p => p.status === 'completed' && p.dateCompleted)
                .sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted));
            
            if (sortedProgress.length === 0) return 0;
            
            let streak = 1;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < sortedProgress.length - 1; i++) {
                const date1 = new Date(sortedProgress[i].dateCompleted);
                const date2 = new Date(sortedProgress[i + 1].dateCompleted);
                date1.setHours(0, 0, 0, 0);
                date2.setHours(0, 0, 0, 0);
                
                const dayDiff = (date1 - date2) / (1000 * 60 * 60 * 24);
                
                if (dayDiff === 1) {
                    streak++;
                } else {
                    break;
                }
            }
            
            return streak;
        }
        
        render() {
            const html = `
                <div class="vespa-student-activities" data-view="${this.state.view}">
                    ${this.getHeaderHTML()}
                    ${this.getNavigationHTML()}
                    <div class="vespa-content-area">
                        ${this.getContentHTML()}
                    </div>
                    ${this.getFloatingWidgetsHTML()}
                </div>
            `;
            
            this.container.innerHTML = html;
        }
        
        getLoadingHTML() {
            return `
                <div class="vespa-loading">
                    <div class="loading-spinner"></div>
                    <h3>Loading your activities...</h3>
                    <p>Getting everything ready for you! 🚀</p>
                </div>
            `;
        }
        
        getHeaderHTML() {
            const user = Knack.getUserAttributes();
            const firstName = user?.name?.split(' ')[0] || 'Student';
            const progress = this.calculateOverallProgress();
            
            return `
                <div class="vespa-header">
                    <div class="header-content">
                        <div class="user-welcome">
                            <h1 class="animated-title">
                                <span class="wave">👋</span> Hi ${firstName}!
                            </h1>
                            <p class="subtitle">Ready to boost your VESPA scores today?</p>
                        </div>
                        <div class="header-stats">
                            <div class="stat-card">
                                <span class="stat-emoji">⭐</span>
                                <div class="stat-content">
                                    <div class="stat-value">${this.state.stats.totalPoints}</div>
                                    <div class="stat-label">Total Points</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-emoji">🔥</span>
                                <div class="stat-content">
                                    <div class="stat-value">${this.state.stats.currentStreak}</div>
                                    <div class="stat-label">Day Streak</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-emoji">🎯</span>
                                <div class="stat-content">
                                    <div class="stat-value">${this.state.stats.activitiesCompleted}</div>
                                    <div class="stat-label">Completed</div>
                                </div>
                            </div>
                        </div>
                        <div class="level-progress">
                            <div class="progress-info">
                                <span>Progress to ${this.state.stats.nextMilestone.name}</span>
                                <span>${this.state.stats.totalPoints} / ${this.state.stats.nextMilestone.points}</span>
                            </div>
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar-fill" style="width: ${Math.min((this.state.stats.totalPoints / this.state.stats.nextMilestone.points) * 100, 100)}%">
                                    <div class="progress-shimmer"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        getNavigationHTML() {
            const navItems = [
                { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
                { id: 'problems', icon: '🎯', label: 'Find Activities' },
                { id: 'all-activities', icon: '📚', label: 'All Activities' },
                { id: 'achievements', icon: '🏆', label: 'Achievements' }
            ];
            
            return `
                <div class="vespa-nav">
                    ${navItems.map(item => `
                        <div class="nav-item ${this.state.view === item.id ? 'active' : ''}" 
                             data-view="${item.id}">
                            <span class="nav-icon">${item.icon}</span>
                            <span class="nav-label">${item.label}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        getContentHTML() {
            switch (this.state.view) {
                case 'dashboard':
                    return this.getDashboardHTML();
                case 'problems':
                    return this.getProblemsHTML();
                case 'all-activities':
                    return this.getAllActivitiesHTML();
                case 'achievements':
                    return this.getAchievementsHTML();
                default:
                    return this.getDashboardHTML();
            }
        }
        
        getDashboardHTML() {
            return `
                <div class="dashboard-container">
                    ${this.getVESPAScoresHTML()}
                    ${this.getRecommendedActivitiesHTML()}
                    ${this.getRecentProgressHTML()}
                    ${this.getMotivationalHTML()}
                </div>
            `;
        }
        
        getVESPAScoresHTML() {
            const categories = ['vision', 'effort', 'systems', 'practice', 'attitude'];
            const emojis = {
                vision: '👁️',
                effort: '💪',
                systems: '⚙️',
                practice: '🎯',
                attitude: '🧠'
            };
            
            return `
                <section class="vespa-scores-section">
                    <h2 class="section-title">
                        <span class="title-icon">📊</span>
                        Your VESPA Profile
                    </h2>
                    <div class="scores-grid">
                        ${categories.map(cat => {
                            const score = this.state.vespaScores[cat] || 0;
                            const color = this.colors[cat];
                            return `
                                <div class="score-card" data-category="${cat}">
                                    <div class="score-header" style="background: ${color.primary}">
                                        <span class="score-emoji">${emojis[cat]}</span>
                                        <span class="score-label">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                                    </div>
                                    <div class="score-body">
                                        <div class="score-circle" style="--score: ${score}">
                                            <svg viewBox="0 0 36 36">
                                                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                <path class="circle-fill" stroke="${color.primary}" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            </svg>
                                            <span class="score-value">${score}</span>
                                        </div>
                                        <button class="improve-btn" data-category="${cat}">
                                            Improve ${emojis[cat]}
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </section>
            `;
        }
        
        getRecommendedActivitiesHTML() {
            const recommended = this.state.activities.prescribed.slice(0, 3);
            
            return `
                <section class="recommended-section">
                    <h2 class="section-title">
                        <span class="title-icon">✨</span>
                        Recommended For You
                        <span class="title-badge">Personalized</span>
                    </h2>
                    <div class="activities-carousel">
                        ${recommended.map((activity, index) => this.getActivityCardHTML(activity, index)).join('')}
                    </div>
                </section>
            `;
        }
        
        getActivityCardHTML(activity, index = 0) {
            const color = this.colors[activity.category] || this.colors.vision;
            const isCompleted = this.state.activities.completed.some(a => a.id === activity.id);
            const progress = this.state.activities.progress.find(p => p.activityId === activity.id);
            const delay = index * 0.1;
            
            return `
                <div class="activity-card ${isCompleted ? 'completed' : ''}" 
                     data-activity-id="${activity.id}"
                     style="animation-delay: ${delay}s">
                    <div class="card-glow" style="background: ${color.primary}"></div>
                    <div class="card-content">
                        <div class="card-header">
                            <span class="category-chip" style="background: ${color.primary}20; color: ${color.primary}">
                                ${color.emoji} ${activity.category}
                            </span>
                            ${activity.level ? `
                                <span class="level-chip" style="background: #079baa20; color: #079baa">
                                    ${activity.level}
                                </span>
                            ` : ''}
                            <span class="points-chip">
                                +${activity.points} points
                            </span>
                        </div>
                        <h3 class="activity-name">${activity.name}</h3>
                        <div class="card-footer">
                            ${isCompleted ? `
                                <span class="completed-badge">
                                    <span class="checkmark">✓</span> Completed
                                    ${progress?.pointsEarned ? `(+${progress.pointsEarned} pts)` : ''}
                                </span>
                            ` : `
                                <button class="start-activity-btn" onclick="window.vespaActivitiesApp.startActivity('${activity.id}')" style="background: ${color.primary}">
                                    Start Activity <span class="arrow">→</span>
                                </button>
                            `}
                        </div>
                    </div>
                    ${!isCompleted ? '<div class="card-hover-effect"></div>' : ''}
                </div>
            `;
        }
        
        getRecentProgressHTML() {
            // Get recent completed activities from progress data
            const recentProgress = this.state.activities.progress
                .filter(p => p.status === 'completed')
                .sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted))
                .slice(0, 3);
            
            if (recentProgress.length === 0) {
                return `
                    <section class="recent-progress-section">
                        <h2 class="section-title">
                            <span class="title-icon">📈</span>
                            Recent Progress
                        </h2>
                        <div class="empty-state">
                            <span class="empty-icon">🌱</span>
                            <p>Start your first activity to see your progress here!</p>
                        </div>
                    </section>
                `;
            }
            
            return `
                <section class="recent-progress-section">
                    <h2 class="section-title">
                        <span class="title-icon">📈</span>
                        Recent Progress
                    </h2>
                    <div class="progress-timeline">
                        ${recentProgress.map(progress => {
                            // Find the activity details
                            const activity = this.state.activities.all.find(a => a.id === progress.activityId);
                            const category = activity?.category || 'vision';
                            
                            return `
                                <div class="timeline-item">
                                    <div class="timeline-marker" style="background: ${this.colors[category].primary}"></div>
                                    <div class="timeline-content">
                                        <h4>${progress.activityName || 'Unknown Activity'}</h4>
                                        <p class="timeline-meta">
                                            +${progress.pointsEarned} points • 
                                            ${progress.timeMinutes} minutes • 
                                            ${this.formatDate(progress.dateCompleted)}
                                        </p>
                                        ${progress.wordCount > 0 ? `
                                            <p class="timeline-meta">
                                                ${progress.wordCount} words written
                                            </p>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </section>
            `;
        }
        
        getMotivationalHTML() {
            const quotes = [
                { text: "Every expert was once a beginner! 🌟", author: "Keep going!" },
                { text: "Small steps lead to big achievements! 🚶‍♀️", author: "You've got this!" },
                { text: "Your future self will thank you! 🙏", author: "Stay focused!" }
            ];
            
            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            
            return `
                <section class="motivational-section">
                    <div class="quote-card">
                        <span class="quote-icon">💭</span>
                        <blockquote>
                            <p>${quote.text}</p>
                            <cite>— ${quote.author}</cite>
                        </blockquote>
                    </div>
                </section>
            `;
        }
        
        getProblemsHTML() {
            // Problem-based activity selection
            return `
                <div class="problems-container">
                    <div class="problems-header">
                        <h2>What would you like help with?</h2>
                        <p>Select a challenge and we'll recommend activities to help you overcome it!</p>
                    </div>
                    
                    <div class="problems-categories">
                        ${Object.keys(this.colors).map(category => `
                            <div class="problem-category" data-category="${category}">
                                <h3 class="category-title" style="color: ${this.colors[category].primary}">
                                    ${this.getCategoryEmoji(category)} ${category.toUpperCase()}
                                </h3>
                                <div class="problems-list">
                                    ${this.getProblemsForCategory(category)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        getProblemsForCategory(category) {
            const problems = this.problemMappings?.[category] || [];
            
            if (problems.length === 0) {
                return '<p class="no-problems">Loading problems...</p>';
            }
            
            return problems.map(problem => `
                <button class="problem-item" data-problem-id="${problem.id}" data-category="${category}">
                    <span class="problem-text">${problem.text}</span>
                    <span class="problem-arrow">→</span>
                </button>
            `).join('');
        }
        
        getAllActivitiesHTML() {
            // Will implement full activity browser
            return `
                <div class="all-activities-container">
                    <h2>All Activities</h2>
                    <p>Coming soon...</p>
                </div>
            `;
        }
        
        getAchievementsHTML() {
            // Will implement achievements/badges view
            return `
                <div class="achievements-container">
                    <h2>Your Achievements</h2>
                    <p>Coming soon...</p>
                </div>
            `;
        }
        
        getFloatingWidgetsHTML() {
            return `
                <div class="floating-widgets">
                    <button class="help-btn" title="Get Help">
                        <span class="help-icon">?</span>
                    </button>
                </div>
            `;
        }
        
        // Event handling
        attachEventListeners() {
            // Navigation
            this.container.addEventListener('click', (e) => {
                // Nav items
                if (e.target.closest('.nav-item')) {
                    const view = e.target.closest('.nav-item').dataset.view;
                    this.switchView(view);
                }
                
                // Start activity
                if (e.target.closest('.start-activity-btn')) {
                    const card = e.target.closest('.activity-card');
                    const activityId = card.dataset.activityId;
                    this.startActivity(activityId);
                }
                
                // Problem selection
                if (e.target.closest('.problem-item')) {
                    const problemId = e.target.closest('.problem-item').dataset.problemId;
                    const category = e.target.closest('.problem-item').dataset.category;
                    this.selectProblem(problemId, category);
                }
                
                // Improve score
                if (e.target.closest('.improve-btn')) {
                    const category = e.target.closest('.improve-btn').dataset.category;
                    this.showActivitiesForCategory(category);
                }
            });
        }
        
        switchView(view) {
            this.state.view = view;
            this.render();
            
            // Add view transition animation
            const content = this.container.querySelector('.vespa-content-area');
            content.classList.add('view-transition');
            setTimeout(() => content.classList.remove('view-transition'), 300);
        }
        
        startActivity(activityId) {
            log(`Starting activity: ${activityId}`);
            
            // Find the activity
            const activity = this.state.activities.all.find(a => a.id === activityId);
            if (!activity) {
                this.showError('Activity not found');
                return;
            }
            
            // TODO: Implement activity modal or navigation
            // For now, show a message
            this.showMessage(`Starting "${activity.name}"...`, 'info');
            
            // In production, this would:
            // 1. Create an activity progress record via API
            // 2. Show activity content in modal or navigate to activity page
            // 3. Track time spent
            // 4. Handle completion and points
            
            // Placeholder: Mark as started
            console.log('Activity to start:', activity);
        }
        
        selectProblem(problemId, category) {
            log('Selected problem:', problemId, category);
            // Will show recommended activities for this problem
            this.showMessage('Finding activities to help with this...', 'info');
        }
        
        showActivitiesForCategory(category) {
            this.state.view = 'all-activities';
            // Will filter by category
            this.render();
        }
        
        // Animations
        startAnimations() {
            // Floating animation for emojis
            const emojis = this.container.querySelectorAll('.wave, .stat-emoji');
            emojis.forEach(emoji => {
                emoji.style.animation = 'float 3s ease-in-out infinite';
                emoji.style.animationDelay = `${Math.random() * 3}s`;
            });
        }
        
        // Utilities
        calculateOverallProgress() {
            const total = this.state.activities.prescribed.length;
            const completed = this.state.activities.completed.length;
            return total > 0 ? Math.round((completed / total) * 100) : 0;
        }
        
        getCategoryEmoji(category) {
            const emojis = {
                vision: '👁️',
                effort: '💪',
                systems: '⚙️',
                practice: '🎯',
                attitude: '🧠'
            };
            return emojis[category] || '📚';
        }
        
        formatDate(date) {
            const now = new Date();
            const diff = now - date;
            const hours = Math.floor(diff / 3600000);
            
            if (hours < 1) return 'Just now';
            if (hours < 24) return `${hours}h ago`;
            if (hours < 48) return 'Yesterday';
            return date.toLocaleDateString();
        }
        
        showMessage(text, type = 'info') {
            // Will implement toast notifications
            console.log(`[${type}] ${text}`);
        }
        
        showError(message) {
            this.container.innerHTML = `
                <div class="error-state">
                    <span class="error-icon">⚠️</span>
                    <h3>Oops!</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
    }
    
    // Utility functions
    function log(message, data) {
        if (DEBUG) {
            console.log(`[VESPA Activities v${VERSION}]`, message, data || '');
        }
    }
    
})(); // End IIFE
