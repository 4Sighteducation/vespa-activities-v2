// VESPA Activities Student Experience v2.0
// A playful, modern interface for student activity management

(function() {
    'use strict';
    
    const VERSION = '2.0';
    const DEBUG = true;
    
    // Wait for configuration
    function waitForConfig() {
        if (typeof window.VESPA_ACTIVITIES_STUDENT_CONFIG === 'undefined') {
            setTimeout(waitForConfig, 100);
            return;
        }
        initializeVESPAActivitiesStudent();
    }
    
    // Main initialization function
    window.initializeVESPAActivitiesStudent = function() {
        const config = window.VESPA_ACTIVITIES_STUDENT_CONFIG;
        
        if (!config) {
            console.error('[VESPA Activities Student] No configuration found');
            return;
        }
        
        log('Initializing VESPA Activities Student Experience', config);
        
        // Create the app instance
        const app = new VESPAActivitiesApp(config);
        app.init();
    };
    
    // Main application class
    class VESPAActivitiesApp {
        constructor(config) {
            this.config = config;
            this.state = {
                currentView: 'dashboard', // dashboard, problems, all-activities, activity-detail
                selectedProblem: null,
                selectedActivity: null,
                activities: {
                    prescribed: [],
                    allActivities: [],
                    completed: [],
                    inProgress: []
                },
                vespaScores: {},
                points: 0,
                level: 1,
                streak: 0
            };
            
            // VESPA theme colors
            this.colors = {
                vision: { primary: '#ff8f00', light: '#ffb347', dark: '#cc7000' },
                effort: { primary: '#86b4f0', light: '#a8c8f5', dark: '#5a8fdb' },
                systems: { primary: '#72cb44', light: '#8ed666', dark: '#5cb32e' },
                practice: { primary: '#7f31a4', light: '#a155c7', dark: '#5f2481' },
                attitude: { primary: '#f032e6', light: '#ff5eef', dark: '#d11dc9' }
            };
            
            // Cache DOM elements
            this.container = null;
            this.dataViews = {};
        }
        
        async init() {
            try {
                // Hide data views
                this.hideDataViews();
                
                // Load initial data
                await this.loadInitialData();
                
                // Create the UI
                this.render();
                
                // Initialize interactions
                this.attachEventListeners();
                
                // Start animations
                this.startAnimations();
                
                log('Student Activities initialized successfully');
                
            } catch (error) {
                console.error('[VESPA Activities] Initialization error:', error);
                this.showError('Failed to load activities. Please refresh the page.');
            }
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
            
            // Simulate data loading (will be replaced with actual Knack data parsing)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Parse VESPA scores
            this.parseVESPAScores();
            
            // Parse activities
            this.parseActivities();
            
            // Load problem mappings
            await this.loadProblemMappings();
            
            // Calculate initial stats
            this.calculateStats();
        }
        
        parseVESPAScores() {
            // Placeholder - will parse from actual Knack view
            this.state.vespaScores = {
                vision: 75,
                effort: 82,
                systems: 68,
                practice: 90,
                attitude: 77
            };
        }
        
        parseActivities() {
            // Placeholder - will parse from actual Knack views
            this.state.activities.prescribed = [
                { id: 1, name: 'Vision Board Creation', category: 'vision', points: 50 },
                { id: 2, name: 'Study Schedule Setup', category: 'systems', points: 40 },
                { id: 3, name: 'Practice Test Strategy', category: 'practice', points: 60 }
            ];
            
            // Mark some as completed for demo
            this.state.activities.completed = [
                { id: 4, name: 'Goal Setting Workshop', category: 'vision', points: 45, completedDate: new Date() }
            ];
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
            // Calculate points
            this.state.points = this.state.activities.completed.reduce((sum, activity) => sum + activity.points, 0);
            
            // Calculate level (every 200 points = new level)
            this.state.level = Math.floor(this.state.points / 200) + 1;
            
            // Calculate streak (placeholder)
            this.state.streak = 3;
        }
        
        render() {
            const html = `
                <div class="vespa-student-activities" data-view="${this.state.currentView}">
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
            const progress = this.calculateOverallProgress();
            const nextLevelPoints = this.state.level * 200;
            const currentLevelProgress = ((this.state.points % 200) / 200) * 100;
            
            return `
                <header class="vespa-header">
                    <div class="header-content">
                        <div class="user-welcome">
                            <h1 class="animated-title">
                                <span class="wave">👋</span> Your VESPA Journey
                            </h1>
                            <p class="subtitle">Level ${this.state.level} Explorer • ${this.state.points} points</p>
                        </div>
                        
                        <div class="header-stats">
                            <div class="stat-card glow">
                                <span class="stat-emoji">🔥</span>
                                <div class="stat-content">
                                    <span class="stat-value">${this.state.streak}</span>
                                    <span class="stat-label">Day Streak</span>
                                </div>
                            </div>
                            
                            <div class="stat-card pulse">
                                <span class="stat-emoji">⚡</span>
                                <div class="stat-content">
                                    <span class="stat-value">${progress}%</span>
                                    <span class="stat-label">Complete</span>
                                </div>
                            </div>
                            
                            <div class="stat-card bounce">
                                <span class="stat-emoji">🏆</span>
                                <div class="stat-content">
                                    <span class="stat-value">${this.state.activities.completed.length}</span>
                                    <span class="stat-label">Achieved</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="level-progress">
                        <div class="progress-info">
                            <span>Level ${this.state.level}</span>
                            <span>${this.state.points} / ${nextLevelPoints} XP</span>
                        </div>
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar-fill" style="width: ${currentLevelProgress}%">
                                <div class="progress-shimmer"></div>
                            </div>
                        </div>
                    </div>
                </header>
            `;
        }
        
        getNavigationHTML() {
            const navItems = [
                { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
                { id: 'problems', label: 'Get Help', icon: '💡' },
                { id: 'all-activities', label: 'All Activities', icon: '📚' },
                { id: 'achievements', label: 'Achievements', icon: '🏅' }
            ];
            
            return `
                <nav class="vespa-nav">
                    ${navItems.map(item => `
                        <button class="nav-item ${this.state.currentView === item.id ? 'active' : ''}" 
                                data-view="${item.id}">
                            <span class="nav-icon">${item.icon}</span>
                            <span class="nav-label">${item.label}</span>
                        </button>
                    `).join('')}
                </nav>
            `;
        }
        
        getContentHTML() {
            switch(this.state.currentView) {
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
            const color = this.colors[activity.category];
            const isCompleted = this.state.activities.completed.some(a => a.id === activity.id);
            const delay = index * 0.1;
            
            return `
                <div class="activity-card ${isCompleted ? 'completed' : ''}" 
                     data-activity-id="${activity.id}"
                     style="animation-delay: ${delay}s">
                    <div class="card-glow" style="background: ${color.primary}"></div>
                    <div class="card-content">
                        <div class="card-header">
                            <span class="category-chip" style="background: ${color.light}; color: ${color.dark}">
                                ${activity.category}
                            </span>
                            <span class="points-chip">
                                +${activity.points} XP
                            </span>
                        </div>
                        <h3 class="activity-name">${activity.name}</h3>
                        <div class="card-footer">
                            ${isCompleted ? `
                                <span class="completed-badge">
                                    <span class="checkmark">✓</span> Completed
                                </span>
                            ` : `
                                <button class="start-activity-btn" style="background: ${color.primary}">
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
            const recent = this.state.activities.completed.slice(-3).reverse();
            
            if (recent.length === 0) {
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
                        ${recent.map(activity => `
                            <div class="timeline-item">
                                <div class="timeline-marker" style="background: ${this.colors[activity.category].primary}"></div>
                                <div class="timeline-content">
                                    <h4>${activity.name}</h4>
                                    <p class="timeline-meta">
                                        +${activity.points} XP • ${this.formatDate(activity.completedDate)}
                                    </p>
                                </div>
                            </div>
                        `).join('')}
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
            this.state.currentView = view;
            this.render();
            
            // Add view transition animation
            const content = this.container.querySelector('.vespa-content-area');
            content.classList.add('view-transition');
            setTimeout(() => content.classList.remove('view-transition'), 300);
        }
        
        startActivity(activityId) {
            log('Starting activity:', activityId);
            // Will implement activity modal/navigation
            this.showMessage('Activity starting...', 'success');
        }
        
        selectProblem(problemId, category) {
            log('Selected problem:', problemId, category);
            // Will show recommended activities for this problem
            this.showMessage('Finding activities to help with this...', 'info');
        }
        
        showActivitiesForCategory(category) {
            this.state.currentView = 'all-activities';
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
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForConfig);
    } else {
        waitForConfig();
    }
    
})();
