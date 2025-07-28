// VESPA Activities Student Experience v2.0
// A playful, modern interface for student activity management

(function() {
    'use strict';
    
    const VERSION = '2.0';
    const DEBUG = true;
    
    // Utility function - must be at top to be accessible everywhere
    function log(message, data) {
        if (DEBUG) {
            console.log(`[VESPA Activities v${VERSION}]`, message, data || '');
        }
    }
    
    // Immediately hide data views on page load - BEFORE anything else
    (function hideDataViewsImmediately() {
        // Hide views using CSS immediately
        const style = document.createElement('style');
        style.id = 'vespa-activities-immediate-hide';
        style.textContent = `
            #view_3164, #view_3165, #view_3166, #view_3167,
            #view_3164 .kn-view, #view_3165 .kn-view, 
            #view_3166 .kn-view, #view_3167 .kn-view {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                overflow: hidden !important;
                position: absolute !important;
                left: -9999px !important;
            }
            
            /* Show loading state for rich text view */
            #view_3168::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                z-index: 1000;
            }
            
            #view_3168::after {
                content: 'Loading VESPA Activities...';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 18px;
                color: #333;
                z-index: 1001;
            }
        `;
        document.head.appendChild(style);
    })();
    
    // Export the initializer function that will be called by KnackAppLoader
    window.initializeVESPAActivitiesStudent = function() {
        const config = window.VESPA_ACTIVITIES_STUDENT_CONFIG;
        if (!config) {
            errorLog('VESPA Activities Student config not found');
            return;
        }
        
        log('Initializing VESPA Activities Student Experience', config);
        
        // Hide views immediately before initialization
        const viewsToHide = ['view_3164', 'view_3165', 'view_3166', 'view_3167'];
        viewsToHide.forEach(viewId => {
            const viewElement = document.querySelector(`#${viewId}`);
            if (viewElement) {
                viewElement.style.display = 'none';
                log('Immediately hid view:', viewId);
            }
        });
        
        try {
            // Create and store app instance globally for event handlers
            window.vespaApp = new VESPAActivitiesApp(config);
            window.vespaApp.init();
            log('VESPA Activities initialized successfully');
        } catch (error) {
            errorLog('Failed to initialize VESPA Activities:', error);
        }
    };
    
    // ========================================
    // MODULE CLASSES - Integrated into main file
    // ========================================
    
    // VESPA Achievement System Module
    class AchievementSystem {
        constructor(config) {
            this.config = config;
            this.achievements = this.defineAchievements();
            this.unlockedAchievements = [];
        }
        
        defineAchievements() {
            return {
                firstActivity: {
                    id: 'first_activity',
                    name: 'First Steps! 🎯',
                    description: 'Complete your first activity',
                    icon: '🌟',
                    points: 5,
                    criteria: { activitiesCompleted: 1 }
                },
                fiveActivities: {
                    id: 'five_activities',
                    name: 'Getting Going! 🚀',
                    description: 'Complete 5 activities',
                    icon: '🔥',
                    points: 25,
                    criteria: { activitiesCompleted: 5 }
                },
                // Add more achievements as needed
            };
        }
        
        checkAchievements(studentStats) {
            const newAchievements = [];
            Object.values(this.achievements).forEach(achievement => {
                if (!this.isAchievementUnlocked(achievement.id)) {
                    if (this.checkCriteria(achievement.criteria, studentStats)) {
                        newAchievements.push(achievement);
                        this.unlockedAchievements.push(achievement.id);
                    }
                }
            });
            return newAchievements;
        }
        
        checkCriteria(criteria, stats) {
            if (criteria.activitiesCompleted && stats.activitiesCompleted < criteria.activitiesCompleted) {
                return false;
            }
            return true;
        }
        
        isAchievementUnlocked(achievementId) {
            return this.unlockedAchievements.includes(achievementId);
        }
        
        showAchievementUnlocked(achievement) {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-content">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-details">
                        <h3>Achievement Unlocked!</h3>
                        <p class="achievement-name">${achievement.name}</p>
                        <p class="achievement-description">${achievement.description}</p>
                        <p class="achievement-points">+${achievement.points} bonus points!</p>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 100);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }
        
        // Save achievements to Knack (Object_127)
        async saveAchievementToKnack(achievement, studentId) {
            try {
                const achievementData = {
                    field_3552: studentId, // Student connection
                    field_3554: achievement.name, // achievement_name
                    field_3555: achievement.description, // achievement_description
                    field_3553: 'activity_completion', // achievement_type
                    field_3556: new Date().toISOString(), // date_earned
                    field_3557: achievement.points, // points_value
                    field_3558: achievement.icon, // icon_emoji
                    field_3560: `Unlocked: ${achievement.name}` // criteria_met
                };
                
                // Use the response handler to make the API call
                const responseHandler = new window.ResponseHandler(this.config);
                return await responseHandler.knackAPI('POST', 'objects/object_127/records', achievementData);
            } catch (error) {
                console.error('Error saving achievement:', error);
            }
        }
    }
    
    // VESPA Response Handler Module
    class ResponseHandler {
        constructor(config) {
            this.config = config;
            this.saveTimeout = null;
            this.lastSaveData = null;
            this.isSaving = false;
        }
        
        formatResponsesForKnack(activityId, responses, cycleNumber = 1) {
            const formattedResponses = {};
            Object.keys(responses).forEach(questionId => {
                formattedResponses[questionId] = {
                    [`cycle_${cycleNumber}`]: {
                        value: responses[questionId]
                    }
                };
            });
            return JSON.stringify(formattedResponses);
        }
        
        // Convert date to UK format dd/mm/yyyy
        formatDateUK(date) {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        }
        
        async saveActivityResponse(data) {
            // Debounce saves to prevent race conditions
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }
            
            // Store the latest data
            this.lastSaveData = data;
            
            // Wait 500ms before actually saving
            return new Promise((resolve) => {
                this.saveTimeout = setTimeout(async () => {
                    if (this.isSaving) {
                        console.log('Save already in progress, queuing...');
                        return resolve(await this.saveActivityResponse(this.lastSaveData));
                    }
                    
                    this.isSaving = true;
                    try {
                        const result = await this.performSave(this.lastSaveData);
                        resolve(result);
                    } finally {
                        this.isSaving = false;
                    }
                }, 500);
            });
        }
        
        async performSave(data) {
            const {
                activityId,
                studentId,
                responses,
                status = 'in_progress',
                cycleNumber = 1,
                timeSpent,
                wordCount
            } = data;
            
            console.log('performSave called with:', {
                activityId,
                studentId,
                status,
                responseCount: Object.keys(responses || {}).length
            });
            
            try {
                // Validate student ID
                if (!studentId || studentId === 'unknown' || studentId.length !== 24) {
                    console.error('Invalid student ID for saving response:', studentId);
                    throw new Error('Invalid student ID - please refresh the page and try again');
                }
                
                // Validate we have API credentials
                if (!this.config.knackAppId && !this.config.applicationId) {
                    console.error('No Knack App ID found in config');
                    throw new Error('Missing Knack App ID');
                }
                
                if (!this.config.knackApiKey && !this.config.apiKey) {
                    console.error('No Knack API Key found in config');
                    throw new Error('Missing Knack API Key');
                }
                
                const formattedResponses = this.formatResponsesForKnack(activityId, responses, cycleNumber);
                console.log('Formatted responses:', formattedResponses);
                
                // Check if a response already exists
                const existingResponse = await this.findExistingResponse(activityId, studentId);
                
                if (existingResponse) {
                    console.log('Found existing response, updating:', existingResponse.id);
                    const updateData = {
                        field_1300: formattedResponses, // Activity Answers Name (JSON)
                        field_2334: this.generatePlainTextSummary(responses), // Student Responses (readable)
                        field_2068: formattedResponses, // Activity Answers (backup)
                        field_1870: status === 'completed' ? this.formatDateUK(new Date()) : null // Date/Time completed in UK format
                    };
                    console.log('Update data:', updateData);
                    const result = await this.updateResponse(existingResponse.id, updateData);
                    
                    // Only create progress record if activity is completed
                    if (status === 'completed' && timeSpent && wordCount !== undefined) {
                        await this.createProgressRecord({
                            activityId,
                            studentId,
                            timeSpent,
                            wordCount,
                            responseCount: Object.keys(responses || {}).length
                        });
                    }
                    
                    return result;
                } else {
                    console.log('No existing response found, creating new record');
                    const createData = {
                        field_1301: studentId, // Student connection
                        field_1302: activityId, // Activities connection
                        field_1300: formattedResponses, // Activity Answers Name (JSON)
                        field_2334: this.generatePlainTextSummary(responses), // Student Responses (readable)
                        field_2068: formattedResponses, // Activity Answers (backup)
                        field_1870: status === 'completed' ? this.formatDateUK(new Date()) : null // Date/Time completed in UK format
                    };
                    console.log('Create data:', createData);
                    const result = await this.createResponse(createData);
                    
                    // Only create progress record if activity is completed
                    if (status === 'completed' && timeSpent && wordCount !== undefined) {
                        await this.createProgressRecord({
                            activityId,
                            studentId,
                            timeSpent,
                            wordCount,
                            responseCount: Object.keys(responses || {}).length
                        });
                    }
                    
                    return result;
                }
                
            } catch (error) {
                console.error('Error saving activity response:', error);
                throw error;
            }
        }
        
        validateResponses(questions, responses) {
            const errors = [];
            const warnings = [];
            
            questions.forEach(question => {
                const response = responses[question.id] || '';
                const isRequired = question.field_2341 === 'Yes';
                
                if (isRequired && !response.trim()) {
                    errors.push({
                        questionId: question.id,
                        message: `"${question.field_1279}" is required`
                    });
                }
            });
            
            return { errors, warnings, isValid: errors.length === 0 };
        }
        
        // Find existing response for this activity and student
        async findExistingResponse(activityId, studentId) {
            try {
                const filters = {
                    match: 'and',
                    rules: [
                        {
                            field: 'field_1302', // Activities connection
                            operator: 'is',
                            value: activityId
                        },
                        {
                            field: 'field_1301', // Student connection
                            operator: 'is',
                            value: studentId
                        }
                    ]
                };
                
                const response = await this.knackAPI('GET', 'objects/object_46/records', {
                    filters: filters,
                    rows_per_page: 1
                });
                
                return response.records?.[0] || null;
            } catch (error) {
                console.error('Error finding existing response:', error);
                return null;
            }
        }
        
        // Create new response record
        async createResponse(data) {
            return await this.knackAPI('POST', 'objects/object_46/records', data);
        }
        
        // Update existing response record
        async updateResponse(recordId, data) {
            return await this.knackAPI('PUT', `objects/object_46/records/${recordId}`, data);
        }
        
        // Generate a plain text summary of responses for the readable field
        generatePlainTextSummary(responses) {
            const summary = [];
            
            Object.entries(responses).forEach(([questionId, answer]) => {
                if (answer && answer.trim()) {
                    summary.push(`Q${questionId}: ${answer}`);
                }
            });
            
            return summary.join('\n\n');
        }
        
        // Make Knack API calls
        async knackAPI(method, endpoint, data = null) {
            console.log('Making Knack API call:', {
                method,
                endpoint,
                data,
                config: this.config
            });
            
            const headers = {
                'X-Knack-Application-Id': this.config.knackAppId || this.config.applicationId,
                'X-Knack-REST-API-Key': this.config.knackApiKey || this.config.apiKey,
                'Content-Type': 'application/json'
            };
            
            console.log('API Headers:', {
                appId: headers['X-Knack-Application-Id'],
                hasApiKey: !!headers['X-Knack-REST-API-Key'],
                apiKeyLength: headers['X-Knack-REST-API-Key']?.length
            });
            
            // If user token is available, use it for authentication
            const userToken = Knack.getUserToken ? Knack.getUserToken() : null;
            if (userToken) {
                headers['Authorization'] = userToken;
                console.log('Using user token for authentication');
            }
            
            const options = {
                method: method,
                headers: headers
            };
            
            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }
            
            let url = `https://api.knack.com/v1/${endpoint}`;
            
            if (method === 'GET' && data) {
                const params = new URLSearchParams();
                if (data.filters) {
                    params.append('filters', JSON.stringify(data.filters));
                }
                if (data.rows_per_page) {
                    params.append('rows_per_page', data.rows_per_page);
                }
                if (data.sort_field) {
                    params.append('sort_field', data.sort_field);
                }
                if (data.sort_order) {
                    params.append('sort_order', data.sort_order);
                }
                url += `?${params.toString()}`;
            }
            
            console.log('Making API request to:', url);
            console.log('Request method:', method);
            console.log('Request headers:', headers);
            if (data && method !== 'GET') {
                console.log('Request body:', options.body);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Knack API error: ${response.status}`, errorText);
                console.error('Full response:', response);
                console.error('Response headers:', response.headers);
                
                // Check for specific error types
                if (response.status === 401) {
                    console.error('Authentication failed - check API key and app ID');
                } else if (response.status === 403) {
                    console.error('Permission denied - check object permissions');
                } else if (response.status === 400) {
                    console.error('Bad request - check field values and data format');
                }
                
                throw new Error(`Knack API error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('API call successful, result:', result);
            return result;
        }
        
        // Create activity progress record (Object_126)
        async createActivityProgress(data) {
            const {
                activityId,
                studentId,
                cycleNumber = 1,
                status = 'in_progress',
                timeMinutes = 0,
                pointsEarned = 0,
                selectedVia = 'student_choice',
                wordCount = 0
            } = data;
            
            try {
                const progressData = {
                    field_3537: activityId, // Activities connection
                    field_3536: studentId, // Student connection
                    field_3538: cycleNumber, // Cycle Number
                    field_3539: new Date().toISOString(), // date_assigned
                    field_3540: new Date().toISOString(), // date_started
                    field_3541: status === 'completed' ? new Date().toISOString() : null, // date_completed
                    field_3542: timeMinutes, // total_time_minutes
                    field_3543: status, // completion_status
                    field_3544: false, // staff_verified
                    field_3545: pointsEarned, // points_earned
                    field_3546: selectedVia, // selected_via
                    field_3549: wordCount // word_count
                };
                
                return await this.knackAPI('POST', 'objects/object_126/records', progressData);
            } catch (error) {
                console.error('Error creating activity progress:', error);
                throw error;
            }
        }
        
        // Create progress record in object_126 (only on completion)
        async createProgressRecord(data) {
            const { activityId, studentId, timeSpent, wordCount, responseCount } = data;
            
            try {
                const progressData = {
                    field_3537: activityId, // Activity connection
                    field_3536: studentId, // Student connection
                    field_3538: 1, // Cycle number
                    field_3539: this.formatDateUK(new Date()), // Start date
                    field_3540: this.formatDateUK(new Date()), // End date
                    field_3541: this.formatDateUK(new Date()), // Completion date
                    field_3542: timeSpent || 0, // Time spent (minutes)
                    field_3543: 'completed', // Status
                    field_3544: false, // Is archived
                    field_3545: 15, // Points earned (default)
                    field_3546: 'student_choice', // Selection method
                    field_3549: wordCount || 0 // Word count
                };
                
                await this.knackAPI('POST', 'objects/object_126/records', progressData);
                
                // Also create achievement record
                await this.createAchievementRecord(studentId, 'activity_completion');
            } catch (error) {
                console.error('Error creating progress record:', error);
                // Don't throw - progress tracking failure shouldn't break activity completion
            }
        }
        
        // Create achievement record
        async createAchievementRecord(studentId, achievementType) {
            try {
                const achievementData = {
                    field_3552: studentId, // Student connection
                    field_3554: 'First Steps! 🎯', // Achievement name
                    field_3555: 'Complete your first activity', // Description
                    field_3553: achievementType, // Type
                    field_3556: this.formatDateUK(new Date()), // Date earned
                    field_3557: 5, // Points
                    field_3558: '🌟', // Icon
                    field_3560: 'Unlocked: First Steps! 🎯' // Notification text
                };
                
                await this.knackAPI('POST', 'objects/object_127/records', achievementData);
            } catch (error) {
                console.error('Error creating achievement record:', error);
            }
        }
    }
    
    // VESPA Activity Renderer Module
    class ActivityRenderer {
        constructor(activity, activityQuestions, studentProgress, config) {
            this.activity = activity;
            this.questions = activityQuestions;
            this.progress = studentProgress;
            this.config = config;
            
            this.currentStage = 'intro';
            this.stages = ['intro', 'learn', 'do', 'reflect', 'complete'];
            this.responses = this.parseExistingResponses();
            this.startTime = Date.now();
            this.lastSaveTime = Date.now();
            this.isExiting = false;
            this.autoSaveInterval = null;
            
            this.handleStageNavigation = this.handleStageNavigation.bind(this);
            this.handleInputChange = this.handleInputChange.bind(this);
            this.handleSave = this.handleSave.bind(this);
            this.handleExit = this.handleExit.bind(this);
        }
        
        parseExistingResponses() {
            if (!this.progress || !this.progress.field_1300) return {};
            
            try {
                const jsonData = JSON.parse(this.progress.field_1300);
                const responses = {};
                
                Object.keys(jsonData).forEach(questionId => {
                    const cycles = jsonData[questionId];
                    const latestCycle = Object.keys(cycles).sort().pop();
                    if (latestCycle && cycles[latestCycle]) {
                        responses[questionId] = cycles[latestCycle].value || '';
                    }
                });
                
                return responses;
            } catch (e) {
                console.error('Error parsing existing responses:', e);
                return {};
            }
        }
        
        render() {
            // Remove any existing modal first
            const existingModal = document.querySelector('.activity-modal-fullpage');
            if (existingModal) {
                existingModal.remove();
            }
            
            const modal = document.createElement('div');
            modal.className = 'activity-modal-fullpage';
            
            // Wrap content in a container for desktop styling
            modal.innerHTML = `
                <div class="activity-modal-container">
                    ${this.getHeaderHTML()}
                    <div class="activity-stages-nav">
                        ${this.getStageNavigationHTML()}
                    </div>
                    <div class="activity-content-wrapper">
                        <div class="activity-content">
                            ${this.getContentHTML()}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            
            // Add click handler for backdrop on desktop
            modal.addEventListener('click', (e) => {
                if (e.target === modal && window.innerWidth >= 1024) {
                    this.handleExit();
                }
            });
            
            this.attachEventListeners();
            
            // Delay auto-save start to prevent immediate save of existing data
            setTimeout(() => {
                this.startAutoSave();
            }, 5000); // Wait 5 seconds before starting auto-save
            
            this.initializeDynamicContent();
        }
        
        getHeaderHTML() {
            const categoryColor = this.getCategoryColor();
            return `
                <header class="activity-header" style="background: linear-gradient(135deg, ${categoryColor.primary}, ${categoryColor.light})">
                    <div class="activity-header-content">
                        <div class="activity-title-section">
                            <h1 class="activity-title">${this.activity.name}</h1>
                            <span class="activity-category-badge">
                                ${this.getCategoryEmoji()} ${this.activity.category}
                            </span>
                            <span class="activity-level-badge">${this.activity.level}</span>
                        </div>
                        <button class="activity-exit-btn" onclick="window.vespaActivityRenderer.handleExit()">
                            <span class="exit-icon">✕</span>
                            <span class="exit-text">Save & Exit</span>
                        </button>
                    </div>
                    <div class="activity-progress-bar">
                        <div class="progress-fill" style="width: ${this.getProgressPercentage()}%"></div>
                    </div>
                </header>
            `;
        }
        
        getStageNavigationHTML() {
            const stageConfig = {
                intro: { icon: '📖', label: 'Introduction' },
                learn: { icon: '🎯', label: 'Learn' },
                do: { icon: '✏️', label: 'Do' },
                reflect: { icon: '💭', label: 'Reflect' },
                complete: { icon: '🏆', label: 'Complete' }
            };
            
            return this.stages.map((stage, index) => {
                const config = stageConfig[stage];
                const isActive = stage === this.currentStage;
                const isCompleted = this.isStageCompleted(stage);
                const isAccessible = this.canAccessStage(stage);
                
                return `
                    <button class="stage-nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isAccessible ? 'locked' : ''}"
                            data-stage="${stage}"
                            ${!isAccessible ? 'disabled' : ''}>
                        <span class="stage-icon">${config.icon}</span>
                        <span class="stage-label">${config.label}</span>
                        ${isCompleted ? '<span class="stage-check">✓</span>' : ''}
                    </button>
                `;
            }).join('');
        }
        
        getContentHTML() {
            switch (this.currentStage) {
                case 'intro':
                    return this.getIntroContent();
                case 'learn':
                    return this.getLearnContent();
                case 'do':
                    return this.getDoContent();
                case 'reflect':
                    return this.getReflectContent();
                case 'complete':
                    return this.getCompleteContent();
                default:
                    return this.getIntroContent();
            }
        }
        
        getIntroContent() {
            return `
                <div class="stage-content intro-content">
                    <div class="stage-header">
                        <h2>Welcome to ${this.activity.name}!</h2>
                        <p class="stage-description">Let's explore this activity together.</p>
                    </div>
                    
                    <div class="activity-overview">
                        <div class="overview-card">
                            <span class="overview-icon">⏱️</span>
                            <h3>Time Needed</h3>
                            <p>Approximately ${this.activity.timeMinutes || 30} minutes</p>
                        </div>
                        <div class="overview-card">
                            <span class="overview-icon">🎯</span>
                            <h3>What You'll Learn</h3>
                            <p>${this.getActivityObjective()}</p>
                        </div>
                        <div class="overview-card">
                            <span class="overview-icon">⭐</span>
                            <h3>Points Available</h3>
                            <p>${this.activity.level === 'Level 3' ? 15 : 10} points</p>
                        </div>
                    </div>
                    
                    <div class="stage-navigation">
                        <button class="primary-btn next-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('learn')">
                            Let's Begin! <span class="btn-arrow">→</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        getLearnContent() {
            const hasVideo = this.activity.video && this.activity.video.includes('iframe');
            const hasSlides = this.activity.slideshow && this.activity.slideshow.trim() !== '';
            
            // Check if we have video/slides in the loaded activities.json data
            const activityData = window.vespaActivitiesData?.[this.activity.activityId];
            const videoUrl = activityData?.video || this.activity.video;
            const slidesContent = activityData?.slideshow || this.activity.slideshow;
            
            return `
                <div class="stage-content learn-content">
                    <div class="stage-header">
                        <h2>Learn & Explore</h2>
                        <p class="stage-description">Watch the video and review the materials.</p>
                    </div>
                    
                    ${hasVideo || hasSlides ? `
                        <div class="media-tabs">
                            ${hasVideo ? '<button class="media-tab active" data-media="video">📺 Video</button>' : ''}
                            ${hasSlides ? `<button class="media-tab ${!hasVideo ? 'active' : ''}" data-media="slides">📊 Slides</button>` : ''}
                        </div>
                        
                        <div class="media-content">
                            ${hasVideo ? `<div class="media-panel active" id="video-panel">${videoUrl}</div>` : ''}
                            ${hasSlides ? `<div class="media-panel ${!hasVideo ? 'active' : ''}" id="slides-panel">${slidesContent}</div>` : ''}
                        </div>
                    ` : `
                        <div class="text-content">
                            ${slidesContent || '<p>Content coming soon...</p>'}
                        </div>
                    `}
                    
                    <div class="stage-navigation">
                        <button class="secondary-btn prev-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('intro')">
                            <span class="btn-arrow">←</span> Back
                        </button>
                        <button class="primary-btn next-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('do')">
                            Ready to Practice! <span class="btn-arrow">→</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        getDoContent() {
            console.log('[ActivityRenderer] All questions:', this.questions);
            const questions = this.questions.filter(q => q.field_1314 !== 'Yes');
            console.log('[ActivityRenderer] Filtered DO questions:', questions);
            console.log('[ActivityRenderer] Current responses:', this.responses);
            
            // Sort questions by order field
            const sortedQuestions = questions.sort((a, b) => (a.field_1303 || 0) - (b.field_1303 || 0));
            
            // Initialize current question index if not set
            if (this.currentQuestionIndex === undefined) {
                this.currentQuestionIndex = 0;
            }
            
            // Group questions (show 2 at a time for better UX)
            const questionsPerPage = 2;
            const totalPages = Math.ceil(sortedQuestions.length / questionsPerPage);
            const currentPage = Math.floor(this.currentQuestionIndex / questionsPerPage);
            const startIdx = currentPage * questionsPerPage;
            const endIdx = Math.min(startIdx + questionsPerPage, sortedQuestions.length);
            const currentQuestions = sortedQuestions.slice(startIdx, endIdx);
            
            // Check if we can proceed - log for debugging
            const canProceed = this.canProceedFromDo();
            console.log('[ActivityRenderer] Can proceed from Do?', canProceed);
            
            return `
                <div class="stage-content do-content">
                    <div class="stage-header">
                        <h2>Your Turn!</h2>
                        <p class="stage-description">Complete the following activities.</p>
                    </div>
                    
                    ${sortedQuestions.length > 0 ? `
                        <div class="question-progress">
                            <div class="progress-text">Question ${startIdx + 1}${endIdx > startIdx + 1 ? `-${endIdx}` : ''} of ${sortedQuestions.length}</div>
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar-fill" style="width: ${((startIdx + 1) / sortedQuestions.length) * 100}%"></div>
                            </div>
                        </div>
                        
                        <div class="activity-questions">
                            ${currentQuestions.map(question => this.getQuestionHTML(question)).join('')}
                        </div>
                        
                        <div class="stage-navigation">
                            ${currentPage > 0 ? `
                                <button class="secondary-btn prev-questions-btn" onclick="window.vespaActivityRenderer.previousQuestions()">
                                    <span class="btn-arrow">←</span> Previous
                                </button>
                            ` : `
                                <button class="secondary-btn prev-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('learn')">
                                    <span class="btn-arrow">←</span> Review Materials
                                </button>
                            `}
                            
                            ${currentPage < totalPages - 1 ? `
                                <button class="primary-btn next-questions-btn" 
                                        onclick="window.vespaActivityRenderer.nextQuestions()"
                                        ${!this.canProceedToNextQuestions(currentQuestions) ? 'disabled' : ''}>
                                    Next <span class="btn-arrow">→</span>
                                </button>
                            ` : `
                                <button class="primary-btn next-stage-btn reflect-btn" 
                                        onclick="window.vespaActivityRenderer.handleStageNavigation('reflect')">
                                    Continue to Reflection <span class="btn-arrow">→</span>
                                </button>
                            `}
                        </div>
                    ` : `
                        <div class="activity-questions">
                            <p style="text-align: center; color: #666;">No questions found for this section. Please check the activity configuration.</p>
                        </div>
                        <div class="stage-navigation">
                            <button class="secondary-btn prev-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('learn')">
                                <span class="btn-arrow">←</span> Review Materials
                            </button>
                            <button class="primary-btn next-stage-btn" 
                                    onclick="window.vespaActivityRenderer.handleStageNavigation('reflect')">
                                Continue to Reflection <span class="btn-arrow">→</span>
                            </button>
                        </div>
                    `}
                </div>
            `;
        }
        
        getReflectContent() {
            const reflectionQuestions = this.questions.filter(q => q.field_1314 === 'Yes');
            
            return `
                <div class="stage-content reflect-content">
                    <div class="stage-header">
                        <h2>Reflection Time</h2>
                        <p class="stage-description">Take a moment to reflect on what you've learned.</p>
                    </div>
                    
                    <div class="reflection-questions">
                        ${reflectionQuestions.map(question => this.getQuestionHTML(question)).join('')}
                    </div>
                    
                    <div class="stage-navigation">
                        <button class="secondary-btn prev-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('do')">
                            <span class="btn-arrow">←</span> Back to Activities
                        </button>
                        <button class="primary-btn complete-btn" 
                                onclick="window.vespaActivityRenderer.completeActivity()"
                                ${!this.canComplete() ? 'disabled' : ''}>
                            Complete Activity! <span class="btn-arrow">🎉</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        getCompleteContent() {
            const points = this.activity.level === 'Level 3' ? 15 : 10;
            
            return `
                <div class="stage-content complete-content">
                    <div class="completion-celebration">
                        <div class="celebration-icon">🎉</div>
                        <h2>Congratulations!</h2>
                        <p>You've completed "${this.activity.name}"</p>
                        
                        <div class="points-earned">
                            <span class="points-value">+${points}</span>
                            <span class="points-label">Points Earned!</span>
                        </div>
                        
                        <div class="completion-actions">
                            <button class="primary-btn" onclick="window.vespaActivityRenderer.handleExit()">
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        getQuestionHTML(question) {
            const response = this.responses[question.id] || '';
            const isRequired = question.field_2341 === 'Yes';
            
            let inputHTML = '';
            
            switch (question.field_1290) {
                case 'Paragraph Text':
                    inputHTML = `
                        <div class="input-wrapper">
                            <textarea 
                                class="question-input paragraph-input" 
                                id="question-${question.id}"
                                data-question-id="${question.id}"
                                placeholder="Type your response here..."
                                ${isRequired ? 'required' : ''}>${response}</textarea>
                            <div class="input-feedback">
                                <span class="word-count">0 words</span>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'Dropdown':
                    const options = (question.field_1291 || '').split(',');
                    inputHTML = `
                        <select class="question-input dropdown-input" 
                                id="question-${question.id}"
                                data-question-id="${question.id}"
                                ${isRequired ? 'required' : ''}>
                            <option value="">Choose an option...</option>
                            ${options.map(opt => `
                                <option value="${opt.trim()}" ${response === opt.trim() ? 'selected' : ''}>
                                    ${opt.trim()}
                                </option>
                            `).join('')}
                        </select>
                    `;
                    break;
                    
                default:
                    inputHTML = `
                        <input type="text" 
                               class="question-input text-input"
                               id="question-${question.id}"
                               data-question-id="${question.id}"
                               value="${response}"
                               placeholder="Enter your response..."
                               ${isRequired ? 'required' : ''}>
                    `;
            }
            
            return `
                <div class="question-block ${isRequired ? 'required' : ''}" data-question-id="${question.id}">
                    ${question.field_1310 ? `<div class="question-context">${question.field_1310}</div>` : ''}
                    <label class="question-label">
                        ${question.field_1279}
                        ${isRequired ? '<span class="required-star">*</span>' : ''}
                    </label>
                    ${inputHTML}
                </div>
            `;
        }
        
        getFooterHTML() {
            return `
                <footer class="activity-footer">
                    <div class="save-status">
                        <span class="save-icon">💾</span>
                        <span class="save-text">Auto-saving enabled</span>
                        <span class="last-saved">Last saved: just now</span>
                    </div>
                </footer>
            `;
        }
        
        getCategoryColor() {
            const colors = {
                vision: { primary: '#ff8f00', light: '#ffb347' },
                effort: { primary: '#86b4f0', light: '#a8c8f5' },
                systems: { primary: '#72cb44', light: '#8ed666' },
                practice: { primary: '#7f31a4', light: '#a155c7' },
                attitude: { primary: '#f032e6', light: '#ff5eef' }
            };
            return colors[this.activity.category] || colors.vision;
        }
        
        getCategoryEmoji() {
            const emojis = {
                vision: '👁️',
                effort: '💪',
                systems: '⚙️',
                practice: '🎯',
                attitude: '🧠'
            };
            return emojis[this.activity.category] || '📚';
        }
        
        getActivityObjective() {
            if (this.activity.instructions) {
                return this.activity.instructions.substring(0, 100) + '...';
            }
            return 'Develop key skills in ' + this.activity.category;
        }
        
        getProgressPercentage() {
            const currentIndex = this.stages.indexOf(this.currentStage);
            return Math.round((currentIndex / (this.stages.length - 1)) * 100);
        }
        
        isStageCompleted(stage) {
            const stageIndex = this.stages.indexOf(stage);
            const currentIndex = this.stages.indexOf(this.currentStage);
            return stageIndex < currentIndex;
        }
        
        canAccessStage(stage) {
            if (stage === 'complete') {
                return this.canComplete();
            }
            return true;
        }
        
        canProceedFromDo() {
            const requiredQuestions = this.questions.filter(q => 
                q.field_2341 === 'Yes' && q.field_1314 !== 'Yes'
            );
            
            console.log('[ActivityRenderer] Required questions:', requiredQuestions);
            console.log('[ActivityRenderer] Current responses:', this.responses);
            
            const result = requiredQuestions.every(q => {
                const response = this.responses[q.id];
                const hasResponse = response && response.trim().length > 0;
                console.log(`[ActivityRenderer] Question ${q.id} (${q.field_1279}): has response? ${hasResponse}`);
                return hasResponse;
            });
            
            console.log('[ActivityRenderer] Can proceed result:', result);
            return result;
        }
        
        canComplete() {
            const allRequiredQuestions = this.questions.filter(q => q.field_2341 === 'Yes');
            
            return allRequiredQuestions.every(q => {
                const response = this.responses[q.id];
                return response && response.trim().length > 0;
            });
        }
        
        attachEventListeners() {
            document.querySelectorAll('.stage-nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (!btn.disabled) {
                        this.handleStageNavigation(btn.dataset.stage);
                    }
                });
            });
            
            document.querySelectorAll('.question-input').forEach(input => {
                input.addEventListener('input', this.handleInputChange);
                input.addEventListener('blur', this.handleSave);
            });
            
            document.querySelectorAll('.media-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.switchMediaTab(tab.dataset.media);
                });
            });
            
            window.vespaActivityRenderer = this;
        }
        
        handleStageNavigation(newStage) {
            this.currentStage = newStage;
            this.render();
        }
        
        handleInputChange(e) {
            const questionId = e.target.dataset.questionId;
            this.responses[questionId] = e.target.value;
            
            console.log('[ActivityRenderer] Input changed:', questionId, e.target.value);
            
            if (e.target.tagName === 'TEXTAREA') {
                const wordCount = e.target.value.trim().split(/\s+/).filter(w => w).length;
                const counter = e.target.closest('.input-wrapper').querySelector('.word-count');
                if (counter) {
                    counter.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
                }
            }
            
            // Update button states without full re-render
            this.updateButtonStates();
        }
        updateButtonStates() {
            // Update "Continue to Reflection" button state
            const reflectBtn = document.querySelector('.reflect-btn');
            if (reflectBtn) {
                const canProceed = this.canProceedFromDo();
                reflectBtn.disabled = !canProceed;
                console.log('[ActivityRenderer] Updated reflect button:', canProceed ? 'enabled' : 'disabled');
            }
            
            // Update "Next" button state for paginated questions
            const nextBtn = document.querySelector('.next-questions-btn');
            if (nextBtn) {
                const questions = this.questions.filter(q => q.field_1314 !== 'Yes');
                const questionsPerPage = 2;
                const currentPage = Math.floor(this.currentQuestionIndex / questionsPerPage);
                const startIdx = currentPage * questionsPerPage;
                const endIdx = Math.min(startIdx + questionsPerPage, questions.length);
                const currentQuestions = questions.slice(startIdx, endIdx);
                
                const canProceed = this.canProceedToNextQuestions(currentQuestions);
                nextBtn.disabled = !canProceed;
            }
        }
        
        handleSave() {
            const saveData = {
                activityId: this.activity.id,
                responses: this.responses,
                currentStage: this.currentStage,
                lastSaved: Date.now()
            };
            
            localStorage.setItem(`vespa-activity-${this.activity.id}`, JSON.stringify(saveData));
            
            const saveText = document.querySelector('.last-saved');
            if (saveText) {
                saveText.textContent = 'Last saved: just now';
            }
            
            // Create response handler to save to Knack
            const responseHandler = new ResponseHandler(this.config);
            responseHandler.saveActivityResponse({
                activityId: this.activity.id,
                studentId: this.config.studentId,
                responses: this.responses,
                status: this.currentStage === 'complete' ? 'completed' : 'in_progress'
            });
        }
        
        async handleExit() {
            if (this.isExiting) return;
            
            this.isExiting = true;
            
            await this.handleSave();
            
            this.stopAutoSave();
            document.body.style.overflow = '';
            
            const modal = document.querySelector('.activity-modal-fullpage');
            if (modal) {
                modal.remove();
            }
            
            if (window.vespaApp && typeof window.vespaApp.onActivityClose === 'function') {
                window.vespaApp.onActivityClose();
            }
        }
        
        startAutoSave() {
            this.autoSaveInterval = setInterval(() => {
                this.handleSave();
            }, 30000);
        }
        
        stopAutoSave() {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
            }
        }
        
        switchMediaTab(mediaType) {
            document.querySelectorAll('.media-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.media === mediaType);
            });
            
            document.querySelectorAll('.media-panel').forEach(panel => {
                panel.classList.toggle('active', panel.id === `${mediaType}-panel`);
            });
        }
        
        async completeActivity() {
            // Calculate activity statistics
            const timeSpent = Math.round((Date.now() - this.startTime) / 60000); // minutes
            const wordCount = Object.values(this.responses).join(' ').split(/\s+/).filter(w => w).length;
            
            console.log('Completing activity:', {
                activityId: this.activity.id,
                studentId: this.config.studentId,
                config: this.config,
                responses: this.responses
            });
            
            // Save final responses with completed status
            const responseHandler = new ResponseHandler(this.config);
            try {
                await responseHandler.saveActivityResponse({
                    activityId: this.activity.id,
                    studentId: this.config.studentId,
                    responses: this.responses,
                    status: 'completed',
                    timeSpent: timeSpent,
                    wordCount: wordCount
                });
                console.log('Activity response saved successfully');
            } catch (error) {
                console.error('Failed to save activity response:', error);
                alert('Failed to save activity. Please check your connection and try again.');
                return;
            }
            
            // Create activity progress record (Object_126)
            try {
                await responseHandler.createActivityProgress({
                    activityId: this.activity.id,
                    studentId: this.config.studentId,
                    cycleNumber: 1,
                    status: 'completed',
                    timeMinutes: timeSpent,
                    pointsEarned: this.activity.level === 'Level 3' ? 15 : 10,
                    selectedVia: 'student_choice',
                    wordCount: wordCount
                });
            } catch (error) {
                console.error('Error creating activity progress:', error);
            }
            
            // Check for achievements
            const achievementSystem = new AchievementSystem(this.config);
            const studentStats = {
                activitiesCompleted: 1, // This would need to be fetched from actual data
                currentActivityWords: wordCount,
                lastActivityTime: timeSpent,
                level3Activities: this.activity.level === 'Level 3' ? 1 : 0
            };
            
            const newAchievements = achievementSystem.checkAchievements(studentStats);
            
            // Save and show any new achievements
            for (const achievement of newAchievements) {
                achievementSystem.showAchievementUnlocked(achievement);
                await achievementSystem.saveAchievementToKnack(achievement, this.config.studentId);
            }
            
            // Update stage and render completion screen
            this.currentStage = 'complete';
            this.render();
        }
        
        initializeDynamicContent() {
            // Set initial button states
            this.updateButtonStates();
            
            // Initialize any other dynamic content
        }
        
        nextQuestions() {
            const questions = this.questions.filter(q => q.field_1314 !== 'Yes');
            const questionsPerPage = 2;
            const maxIndex = questions.length - 1;
            
            this.currentQuestionIndex = Math.min(this.currentQuestionIndex + questionsPerPage, maxIndex);
            this.render();
        }
        
        previousQuestions() {
            const questionsPerPage = 2;
            this.currentQuestionIndex = Math.max(this.currentQuestionIndex - questionsPerPage, 0);
            this.render();
        }
        
        canProceedToNextQuestions(currentQuestions) {
            // Check if all required questions on current page are answered
            return currentQuestions.filter(q => q.field_2341 === 'Yes').every(q => {
                const response = this.responses[q.id];
                return response && response.trim().length > 0;
            });
        }
    }
    
    // ========================================
    // END MODULE CLASSES
    // ========================================
    
    // Expose module classes to window
    window.AchievementSystem = AchievementSystem;
    window.ResponseHandler = ResponseHandler;
    window.ActivityRenderer = ActivityRenderer;
    
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
                    available: [],
                    progress: [],
                    byCategory: {}  // Add this property
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
                },
                dataLoaded: false // Track if data has been loaded
            };
            this.container = null;
            this.dataViews = {}; // Initialize dataViews object
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
            log('Starting VESPA Activities initialization...');
            
            try {
                // Show loading overlay immediately
                this.showLoadingOverlay();
                
                // Show loading state immediately
                if (this.container) {
                    this.container.innerHTML = this.getLoadingHTML();
                }
                
                // Remove the immediate loading style
                const immediateStyle = document.getElementById('vespa-activities-immediate-hide');
                if (immediateStyle) {
                    immediateStyle.remove();
                }
                
                // Handle broken images gracefully
                this.handleBrokenImages();
                
                // Ensure views are hidden initially
                this.hideDataViews();
                
                // Wait for Knack to be ready
                await this.waitForKnack();
                
                // Setup view listeners
                this.setupViewListeners();
                
                // Wait for all required views to render
                await this.waitForViews();
                
                // Load activities.json for video/slide data
                await this.loadActivitiesJson();
                
                // Load initial data with validation
                await this.loadInitialData();
                
                // Validate we have required data
                if (!this.state.studentId) {
                    console.error('No student ID found after initialization');
                    this.hideLoadingOverlay();
                    this.showError('Unable to load student data. Please refresh the page.');
                    return;
                }
                
                log('Student ID validated:', this.state.studentId);
                
                // Initial render
                this.render();
                
                // Attach event listeners
                this.attachEventListeners();
                
                // Start animations
                this.startAnimations();
                
                // Enable lazy loading for images
                this.enableLazyLoading();
                
                // Hide loading overlay
                this.hideLoadingOverlay();
                
                log('VESPA Activities initialization complete');
            } catch (error) {
                console.error('[VESPA Activities v2.0] Failed to initialize VESPA Activities:', error);
                this.hideLoadingOverlay();
                this.showError('Failed to initialize. Please refresh the page.');
            }
        }
        
        async waitForKnack() {
            return new Promise((resolve) => {
                if (window.Knack && window.Knack.views && Object.keys(window.Knack.views).length > 0) {
                    resolve();
                } else {
                    setTimeout(() => {
                        this.waitForKnack().then(resolve);
                    }, 100);
                }
            });
        }
        
        setupViewListeners() {
            log('Setting up view render listeners');
            
            // Listen for each data view render
            const dataViews = [
                this.config.views.vespaResults,
                this.config.views.studentRecord,
                this.config.views.allActivities,
                this.config.views.activityProgress
            ];
            
            dataViews.forEach(viewId => {
                $(document).on(`knack-view-render.${viewId}`, (event, view) => {
                    log(`Data view rendered: ${viewId}`);
                    
                    // Hide it immediately
                    const element = document.querySelector(`#${viewId}`);
                    if (element) {
                        element.style.display = 'none';
                        const viewWrapper = element.closest('.kn-view');
                        if (viewWrapper) {
                            viewWrapper.style.display = 'none';
                        }
                    }
                    
                    // Re-parse data if we haven't already
                    if (!this.state.dataLoaded) {
                        log('Late data view render detected, parsing data...');
                        this.parseVESPAScores();
                        this.parseStudentRecord();
                        this.parseActivities();
                        this.parseActivityProgress();
                        this.calculateStats();
                        this.render(); // Re-render with new data
                    }
                });
            });
        }
        
        async waitForViews() {
            log('Waiting for Knack views to be ready...');
            
            // Log what Knack.views contains initially
            log('Initial Knack.views:', Object.keys(Knack.views || {}));
            
            // Check if views exist in DOM even if not in Knack.views
            const requiredViews = [
                this.config.views.vespaResults,
                this.config.views.studentRecord,
                this.config.views.allActivities,
                this.config.views.activityProgress
            ];
            
            log('Checking DOM for view elements:');
            requiredViews.forEach(viewId => {
                const element = document.querySelector(`#${viewId}`);
                log(`${viewId} in DOM:`, !!element);
            });
            
            // Wait up to 10 seconds for views AND their data to be available
            const maxWaitTime = 10000;
            const checkInterval = 100;
            let waitedTime = 0;
            let lastLogTime = 0;
            
            while (waitedTime < maxWaitTime) {
                // Only log every 1 second to reduce spam
                if (waitedTime - lastLogTime >= 1000) {
                    log('Still waiting for views to load...');
                    lastLogTime = waitedTime;
                }
                
                const allViewsReady = requiredViews.every(viewKey => {
                    const exists = viewKey in (Knack.views || {});
                    if (exists) {
                        // Also check if the view has loaded its data
                        const view = Knack.views[viewKey];
                        const hasData = view?.model?.view?._id || view?.model?.data?.length > 0;
                        if (!hasData && waitedTime - lastLogTime >= 1000) {
                            log(`View ${viewKey} exists but data not loaded yet`);
                        }
                        return hasData;
                    }
                    return false;
                });
                
                if (allViewsReady) {
                    log('All views are ready with data in Knack.views');
                    // Add a small delay to ensure data is fully processed
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                waitedTime += checkInterval;
            }
            
            log('Warning: Timeout waiting for views in Knack.views');
            log('Final available views:', Object.keys(Knack.views || {}));
            log('Expected views:', requiredViews);
            
            // Check DOM one more time
            log('Final DOM check:');
            requiredViews.forEach(viewId => {
                const element = document.querySelector(`#${viewId}`);
                if (element) {
                    log(`${viewId} found in DOM but not in Knack.views - this suggests a configuration issue`);
                }
            });
        }
        
        hideDataViews() {
            log('Hiding data views...');
            
            // Hide all data views except the rich text view
            const viewsToHide = [
                this.config.views.vespaResults,
                this.config.views.studentRecord,
                this.config.views.allActivities,
                this.config.views.activityProgress
            ];
            
            viewsToHide.forEach(viewId => {
                const element = document.querySelector(`#${viewId}`);
                if (element) {
                    // Hide the view completely
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    element.style.position = 'absolute';
                    element.style.left = '-9999px';
                    
                    // Also hide the parent view wrapper if it exists
                    const viewWrapper = element.closest('.kn-view');
                    if (viewWrapper) {
                        viewWrapper.style.display = 'none';
                    }
                    
                    this.dataViews[viewId] = element;
                    log(`Hidden view: ${viewId}`);
                } else {
                    log(`View ${viewId} not found in DOM to hide`);
                }
            });
            
            // Also inject CSS to ensure they stay hidden
            if (!document.getElementById('vespa-activities-hide-views-css')) {
                const style = document.createElement('style');
                style.id = 'vespa-activities-hide-views-css';
                style.textContent = `
                    /* Hide VESPA Activities data views */
                    #${this.config.views.vespaResults},
                    #${this.config.views.studentRecord},
                    #${this.config.views.allActivities},
                    #${this.config.views.activityProgress},
                    #${this.config.views.vespaResults} .kn-view,
                    #${this.config.views.studentRecord} .kn-view,
                    #${this.config.views.allActivities} .kn-view,
                    #${this.config.views.activityProgress} .kn-view {
                        display: none !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        overflow: hidden !important;
                    }
                `;
                document.head.appendChild(style);
                log('Injected CSS to hide data views');
            }
        }
        
        async loadInitialData() {
            log('loadInitialData method called - starting data loading process');
            
            // Get container
            this.container = document.querySelector(`#${this.config.views.richText}`);
            log('Looking for container:', this.config.views.richText);
            
            if (!this.container) {
                log('ERROR: Container not found!', this.config.views.richText);
                throw new Error('Container not found');
            }
            
            log('Container found, showing loading state');
            
            // Show loading state
            this.container.innerHTML = this.getLoadingHTML();
            
            log('About to parse data from Knack views');
            
            // Parse data from Knack views
            try {
                // Parse VESPA scores from view_3164
                log('Calling parseVESPAScores...');
                this.parseVESPAScores();
                
                // Parse student record and activities
                log('Calling parseStudentRecord...');
                this.parseStudentRecord();
                
                log('Calling parseActivities...');
                this.parseActivities();
                
                log('Calling parseActivityProgress...');
                this.parseActivityProgress();
                
                // Load problem mappings
                log('Loading problem mappings...');
                await this.loadProblemMappings();
                
                // Calculate initial stats
                log('Calculating stats...');
                this.calculateStats();
                
                // Mark data as loaded
                this.state.dataLoaded = true;
                
                log('Initial data loaded successfully', this.state);
            } catch (error) {
                console.error('Error loading initial data:', error);
                console.error('Error stack:', error.stack);
                this.showError('Failed to load data. Please refresh the page.');
                throw error; // Re-throw to be caught by init
            }
        }
        
        parseVESPAScores() {
            log('Parsing VESPA scores from view', this.config.views.vespaResults);
            
            // Get the VESPA results view element
            const vespaView = document.querySelector(`#${this.config.views.vespaResults}`);
            if (!vespaView) {
                log('VESPA results view element not found in DOM');
                // Use mock data for testing
                if (this.config.debugMode) {
                    log('DEBUG MODE: Using mock VESPA scores');
                    this.state.vespaScores = {
                        vision: 75,
                        effort: 82,
                        systems: 68,
                        practice: 90,
                        attitude: 77
                    };
                }
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
            
            // Try different ways to access the data based on view type
            let record = null;
            
            // For details views (single record)
            if (viewData.model?.attributes) {
                record = viewData.model.attributes;
                log('Found record in details view format:', record);
            }
            // For table/list views (multiple records)
            else if (viewData.model?.data?.models && viewData.model.data.models.length > 0) {
                record = viewData.model.data.models[0].attributes;
                log('Found record in table view format:', record);
            }
            // Alternative data structure
            else if (viewData.model?.data && Array.isArray(viewData.model.data) && viewData.model.data.length > 0) {
                record = viewData.model.data[0];
                log('Found record in array format:', record);
            }
            // Try accessing the record directly
            else if (viewData.record) {
                record = viewData.record;
                log('Found record directly on view:', record);
            }
            
            if (record) {
                log('Record found, parsing scores...');
                log('Available fields in record:', Object.keys(record));
                
                // Parse scores using configured field IDs
                this.state.vespaScores = {
                    vision: parseInt(record[this.config.fields.visionScore] || record[this.config.fields.visionScore + '_raw'] || 0),
                    effort: parseInt(record[this.config.fields.effortScore] || record[this.config.fields.effortScore + '_raw'] || 0),
                    systems: parseInt(record[this.config.fields.systemsScore] || record[this.config.fields.systemsScore + '_raw'] || 0),
                    practice: parseInt(record[this.config.fields.practiceScore] || record[this.config.fields.practiceScore + '_raw'] || 0),
                    attitude: parseInt(record[this.config.fields.attitudeScore] || record[this.config.fields.attitudeScore + '_raw'] || 0)
                };
                
                log('Parsed VESPA scores:', this.state.vespaScores);
                
                // Log if all scores are still 0
                if (Object.values(this.state.vespaScores).every(score => score === 0)) {
                    log('Warning: All scores are 0. Check field mappings:');
                    log('Expected fields:', {
                        vision: this.config.fields.visionScore,
                        effort: this.config.fields.effortScore,
                        systems: this.config.fields.systemsScore,
                        practice: this.config.fields.practiceScore,
                        attitude: this.config.fields.attitudeScore
                    });
                }
            } else {
                // Use debug data or defaults
                if (this.config.debugMode) {
                    log('DEBUG MODE: Using mock VESPA scores');
                    this.state.vespaScores = {
                        vision: 75,
                        effort: 82,
                        systems: 68,
                        practice: 90,
                        attitude: 77
                    };
                } else {
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
        }
        
        parseStudentRecord() {
            log('Parsing student record from view', this.config.views.studentRecord);
            
            const studentView = Knack.views[this.config.views.studentRecord];
            if (!studentView) {
                log('Student view not found');
                return;
            }
            
            log('Student view object:', studentView);
            
            // Try different ways to access the data based on view type
            let record = null;
            
            // For details views (single record)
            if (studentView.model?.attributes) {
                record = studentView.model.attributes;
                log('Found student record in details view format:', record);
            }
            // For table/list views (multiple records)
            else if (studentView.model?.data?.models && studentView.model.data.models.length > 0) {
                record = studentView.model.data.models[0].attributes;
                log('Found student record in table view format:', record);
            }
            // Alternative data structure
            else if (studentView.model?.data && Array.isArray(studentView.model.data) && studentView.model.data.length > 0) {
                record = studentView.model.data[0];
                log('Found student record in array format:', record);
            }
            // Try accessing the record directly
            else if (studentView.record) {
                record = studentView.record;
                log('Found student record directly on view:', record);
            }
            
            if (record) {
                log('Student record found, parsing data...');
                log('Available fields in student record:', Object.keys(record));
                
                // Store the student record ID
                this.state.studentId = record.id;
                log('Student record ID:', this.state.studentId);
                
                // Get student name
                const nameField = record.field_187 || record.field_187_raw || {};
                if (nameField.first || nameField.last) {
                    this.state.studentName = `${nameField.first || ''} ${nameField.last || ''}`.trim();
                } else if (typeof nameField === 'string') {
                    this.state.studentName = nameField;
                } else {
                    this.state.studentName = 'Student';
                }
                log('Student name:', this.state.studentName);
                
                // Parse prescribed activities (field_1683) - this is a connection field returning HTML
                const prescribedField = record[this.config.fields.prescribedActivities] || 
                                      record[this.config.fields.prescribedActivities + '_raw'] || [];
                
                // Extract IDs from HTML strings or raw connection data
                if (Array.isArray(prescribedField)) {
                    this.state.prescribedActivityIds = [];
                    prescribedField.forEach(item => {
                        if (typeof item === 'string' && item.includes('class="')) {
                            // Extract ID from HTML string like: <span class="5ff1f0b28a0c35001c57fb89" data-kn="connection-value">
                            const idMatch = item.match(/class="([a-f0-9]{24})"/);
                            if (idMatch && idMatch[1]) {
                                this.state.prescribedActivityIds.push(idMatch[1]);
                            }
                        } else if (typeof item === 'object' && (item.id || item._id)) {
                            // Handle object format
                            this.state.prescribedActivityIds.push(item.id || item._id);
                        } else if (typeof item === 'string') {
                            // Plain string ID
                            this.state.prescribedActivityIds.push(item);
                        }
                    });
                } else if (typeof prescribedField === 'string' && prescribedField) {
                    // Single HTML string with multiple activities
                    const idMatches = prescribedField.match(/class="([a-f0-9]{24})"/g);
                    if (idMatches) {
                        this.state.prescribedActivityIds = idMatches.map(match => {
                            const id = match.match(/class="([a-f0-9]{24})"/);
                            return id ? id[1] : null;
                        }).filter(id => id !== null);
                    } else {
                        // Try comma-separated
                        this.state.prescribedActivityIds = prescribedField.split(',').map(id => id.trim());
                    }
                } else {
                    this.state.prescribedActivityIds = [];
                }
                log('Prescribed activity IDs:', this.state.prescribedActivityIds);
                
                // Parse finished activities (field_1380) - this is a text field with comma-separated IDs
                const finishedField = record[this.config.fields.finishedActivities] || 
                                    record[this.config.fields.finishedActivities + '_raw'] || '';
                log('Finished activities field (field_1380):', finishedField);
                
                if (typeof finishedField === 'string' && finishedField) {
                    this.state.finishedActivityIds = finishedField.split(',').map(id => id.trim());
                } else if (Array.isArray(finishedField)) {
                    this.state.finishedActivityIds = finishedField.map(item => 
                        typeof item === 'object' ? (item.id || item._id) : item
                    );
                } else {
                    this.state.finishedActivityIds = [];
                }
                log('Finished activity IDs:', this.state.finishedActivityIds);
                
            } else {
                log('No student record found');
                // Use default values
                this.state.studentName = 'Student';
                this.state.prescribedActivityIds = [];
                this.state.finishedActivityIds = [];
            }
        }
        
        parseActivities() {
            log('Parsing activities from view', this.config.views.allActivities);
            
            const activitiesView = Knack.views[this.config.views.allActivities];
            if (!activitiesView) {
                log('Activities view not found in Knack.views');
                return;
            }
            
            log('Activities view object:', activitiesView);
            
            // Try different ways to access the data
            let activities = [];
            
            // For table/grid views
            if (activitiesView.model?.data?.models) {
                activities = activitiesView.model.data.models;
                log('Found activities in table view format:', activities.length);
            }
            // For list views
            else if (activitiesView.model?.data && Array.isArray(activitiesView.model.data)) {
                activities = activitiesView.model.data;
                log('Found activities in array format:', activities.length);
            }
            // Alternative structure
            else if (activitiesView.records) {
                activities = activitiesView.records;
                log('Found activities in records property:', activities.length);
            }
            
            if (activities.length === 0) {
                log('No activities found in view data');
                log('View structure:', {
                    hasModel: !!activitiesView.model,
                    hasData: !!activitiesView.model?.data,
                    dataType: activitiesView.model?.data ? typeof activitiesView.model.data : 'undefined'
                });
            }
            
            // Parse each activity
            activities.forEach((activity, index) => {
                try {
                    // Get attributes based on data structure
                    const attrs = activity.attributes || activity;
                    
                    if (index === 0) {
                        log('First activity structure:', Object.keys(attrs));
                    }
                    
                    const activityData = {
                        id: attrs.id || activity.id,
                        activityId: attrs.field_2074 || attrs.field_2074_raw || attrs.id || activity.id, // Activity_id field - fallback to record ID
                        name: attrs.field_1278 || attrs.field_1278_raw || 'Unknown Activity', // Activities Name
                        category: this.parseActivityCategory(attrs.field_1285 || attrs.field_1285_raw), // VESPA Category
                        activityText: attrs.field_1289 || attrs.field_1289_raw || '', // Activity Text (HTML)
                        video: attrs.field_1288 || attrs.field_1288_raw || '', // Activity Video
                        slideshow: attrs.field_1293 || attrs.field_1293_raw || '', // Activity Slideshow
                        instructions: attrs.field_1309 || attrs.field_1309_raw || '', // Activity Instructions
                        level: attrs.field_3568 || attrs.field_3568_raw || 'Level 2', // Level - now using new short text field
                        order: parseInt(attrs.field_1298 || attrs.field_1298_raw || 0), // Order
                        active: attrs.field_1299 !== 'No' && attrs.field_1299 !== false, // Active (Yes/No)
                        color: attrs.field_1308 || attrs.field_1308_raw || '', // Activity Color
                        minScore: parseInt(attrs.field_1287 || attrs.field_1287_raw || 0), // Score to show (If More Than)
                        maxScore: parseInt(attrs.field_1294 || attrs.field_1294_raw || 10), // Score to show (If Less Than or Equal To)
                        // Default values for fields not in activities.json
                        timeMinutes: 30, // Default time - may come from activity progress
                        points: 10, // Default points - will be calculated based on completion
                        finalThoughts: attrs.field_1313 || attrs.field_1313_raw || '' // Final Thoughts Section Content
                    };
                    
                    // Debug log first few activities
                    if (index < 3) {
                        log(`Activity ${index + 1} data:`, {
                            id: activityData.id,
                            activityId: activityData.activityId,
                            name: activityData.name,
                            category: activityData.category,
                            active: activityData.active,
                            level: activityData.level,
                            levelField3568: attrs.field_3568,
                            levelField3568_raw: attrs.field_3568_raw
                        });
                    }
                    
                    // Only add active activities
                    if (activityData.active) {
                        this.state.activities.all.push(activityData);
                        
                        // Group by category
                        if (!this.state.activities.byCategory[activityData.category]) {
                            this.state.activities.byCategory[activityData.category] = [];
                        }
                        this.state.activities.byCategory[activityData.category].push(activityData);
                    }
                    
                } catch (error) {
                    log('Error parsing activity:', error);
                }
            });
            
            log(`Parsed ${this.state.activities.all.length} activities`);
            log('Activities by category:', Object.keys(this.state.activities.byCategory).map(cat => 
                `${cat}: ${this.state.activities.byCategory[cat].length}`
            ));
            
            // Check for prescribed activities
            if (this.state.prescribedActivityIds && this.state.prescribedActivityIds.length > 0) {
                log('Looking for prescribed activities with IDs:', this.state.prescribedActivityIds);
                log('Available activity IDs to match against:', this.state.activities.all.map(a => ({ 
                    id: a.id, 
                    activityId: a.activityId,
                    name: a.name 
                })));
                
                this.state.activities.prescribed = this.state.activities.all.filter(activity => {
                    // Check both id and activityId fields against prescribed IDs
                    const matchesId = this.state.prescribedActivityIds.includes(activity.id);
                    const matchesActivityId = this.state.prescribedActivityIds.includes(activity.activityId);
                    
                    if (matchesId || matchesActivityId) {
                        log(`Prescribed match found: ${activity.name} (id: ${activity.id}, activityId: ${activity.activityId})`);
                    }
                    
                    return matchesId || matchesActivityId;
                });
                log(`Found ${this.state.activities.prescribed.length} prescribed activities`);
                log('Prescribed activity matches:', this.state.activities.prescribed.map(a => ({ id: a.id, activityId: a.activityId, name: a.name })));
            }
            
            // Check for completed activities
            if (this.state.finishedActivityIds && this.state.finishedActivityIds.length > 0) {
                log('Looking for completed activities with IDs:', this.state.finishedActivityIds);
                
                this.state.activities.completed = this.state.activities.all.filter(activity => {
                    // Check both id and activityId fields against finished IDs
                    const matchesId = this.state.finishedActivityIds.includes(activity.id);
                    const matchesActivityId = this.state.finishedActivityIds.includes(activity.activityId);
                    
                    if (matchesId || matchesActivityId) {
                        log(`Completed match found: ${activity.name} (id: ${activity.id}, activityId: ${activity.activityId})`);
                    }
                    
                    return matchesId || matchesActivityId;
                });
                log(`Found ${this.state.activities.completed.length} completed activities`);
                log('Completed activity matches:', this.state.activities.completed.map(a => ({ id: a.id, activityId: a.activityId, name: a.name })));
            }
            
            // Filter activities based on VESPA scores
            if (this.state.vespaScores) {
                this.state.activities.all.forEach(activity => {
                    // Check if activity should be shown based on student's score in that category
                    const categoryScore = this.state.vespaScores[activity.category] || 0;
                    activity.showBasedOnScore = categoryScore > activity.minScore && categoryScore <= activity.maxScore;
                    
                    if (!activity.showBasedOnScore) {
                        log(`Activity "${activity.name}" hidden - student's ${activity.category} score (${categoryScore}) not in range ${activity.minScore}-${activity.maxScore}`);
                    }
                });
                
                // Create filtered list of activities that should be shown
                this.state.activities.available = this.state.activities.all.filter(activity => activity.showBasedOnScore);
                log(`${this.state.activities.available.length} activities available based on VESPA scores`);
            } else {
                // If no VESPA scores, show all activities
                this.state.activities.available = this.state.activities.all;
            }
            
            log('Parsed activities:', {
                all: this.state.activities.all.length,
                available: this.state.activities.available.length,
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
            if (!categoryValue) return 'other';
            
            // Handle HTML strings from Knack connection fields
            if (typeof categoryValue === 'string' && categoryValue.includes('<span')) {
                // Extract text from HTML
                const match = categoryValue.match(/>([^<]+)</);
                if (match && match[1]) {
                    categoryValue = match[1];
                }
            }
            
            const category = categoryValue.toString().toLowerCase();
            
            // Map to standard categories
            if (category.includes('vision')) return 'vision';
            if (category.includes('effort')) return 'effort';
            if (category.includes('systems')) return 'systems';
            if (category.includes('practice')) return 'practice';
            if (category.includes('attitude')) return 'attitude';
            
            return 'other';
        }
        
        async loadProblemMappings() {
            if (!this.config.problemMappingsUrl) return;
            
            try {
                const response = await fetch(this.config.problemMappingsUrl);
                const data = await response.json();
                this.state.problemMappings = data.problemMappings;
                log('Problem mappings loaded:', this.state.problemMappings);
            } catch (error) {
                console.error('Failed to load problem mappings:', error);
                // Use fallback mappings
                this.state.problemMappings = this.getFallbackProblemMappings();
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
            // Calculate total points from completed activities
            // Since activity progress is empty, calculate based on completed activities
            let totalPoints = 0;
            
            if (this.state.activities.progress.length > 0) {
                // Use activity progress if available
                totalPoints = this.state.activities.progress
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + p.pointsEarned, 0);
            } else {
                // Calculate based on completed activities (10 points for Level 2, 15 for Level 3)
                totalPoints = this.state.activities.completed.reduce((sum, activity) => {
                    const points = activity.level === 'Level 3' ? 15 : 10;
                    return sum + points;
                }, 0);
            }
            
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
            log('Completed activities for points:', this.state.activities.completed);
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
                { id: 'all-activities', icon: '📚', label: 'Browse More' },
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
        
        getPrescribedActivitiesHTML() {
            // Get prescribed activities that aren't completed
            const prescribedNotCompleted = this.state.activities.prescribed.filter(activity => 
                !this.state.finishedActivityIds.includes(activity.id) &&
                !this.state.finishedActivityIds.includes(activity.activityId)
            );
            
            if (prescribedNotCompleted.length === 0 && this.state.activities.prescribed.length === 0) {
                return ''; // Don't show section if no prescribed activities
            }
            
            return `
                <section class="activities-section">
                    <h2 class="section-title">
                        <span class="title-icon">📋</span>
                        Your Prescribed Activities
                        <span class="title-badge">${prescribedNotCompleted.length} to complete</span>
                    </h2>
                    <div class="activities-carousel">
                        ${prescribedNotCompleted.length > 0 ? 
                            prescribedNotCompleted.map((activity, index) => this.getActivityCardHTML(activity, index, true)).join('') :
                            '<div class="empty-state"><p>All prescribed activities completed! 🎉</p></div>'
                        }
                    </div>
                </section>
            `;
        }
        
        getRecommendedActivitiesHTML() {
            // Show ALL prescribed activities, including completed ones
            const allPrescribed = this.state.activities.prescribed;
            
            // Group by category
            const activitiesByCategory = {};
            allPrescribed.forEach(activity => {
                if (!activitiesByCategory[activity.category]) {
                    activitiesByCategory[activity.category] = [];
                }
                activitiesByCategory[activity.category].push(activity);
            });
            
            if (this.state.activities.prescribed.length === 0) {
                return ''; // Don't show section if no prescribed activities
            }
            
            const completedCount = allPrescribed.filter(activity => 
                this.state.finishedActivityIds.includes(activity.id) ||
                this.state.finishedActivityIds.includes(activity.activityId)
            ).length;
            
            const toCompleteCount = allPrescribed.length - completedCount;
            
            return `
                <section class="activities-section">
                    <h2 class="section-title">
                        <span class="title-icon">✨</span>
                        Your Activities
                        <span class="title-badge">${toCompleteCount} to complete | ${completedCount} completed</span>
                    </h2>
                    
                    ${Object.entries(activitiesByCategory).map(([category, activities]) => `
                        <div class="category-group">
                            <h3 class="category-group-title">
                                ${this.getCategoryEmoji(category)} ${category.toUpperCase()}
                            </h3>
                            <div class="activities-grid">
                                ${activities.map((activity, index) => this.getActivityCardHTML(activity, index, true)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </section>
            `;
        }
        
        getActivityCardHTML(activity, index = 0, isPrescribed = false) {
            const isCompleted = this.state.finishedActivityIds.includes(activity.id) || 
                              this.state.finishedActivityIds.includes(activity.activityId);
            const categoryEmoji = this.getCategoryEmoji(activity.category);
            const categoryColor = this.colors[activity.category]?.primary || '#666';
            
            // Extract points based on level (Level 2 = 10, Level 3 = 15 base points)
            const basePoints = activity.level === 'Level 3' ? 15 : 10;
            
            return `
                <div class="activity-card ${isCompleted ? 'completed' : ''} ${isPrescribed ? 'prescribed' : ''}" 
                     data-activity-id="${activity.id}"
                     style="animation-delay: ${index * 0.1}s">
                    <div class="card-glow" style="background: ${categoryColor}"></div>
                    <div class="card-header">
                        <span class="category-chip" style="background: ${categoryColor}20; color: ${categoryColor}">
                            ${categoryEmoji} ${activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                        </span>
                        <span class="level-chip">${activity.level}</span>
                        <span class="points-chip">+${basePoints} pts</span>
                    </div>
                    <h3 class="activity-name">${activity.name}</h3>
                    ${activity.instructions ? `<p class="activity-description">${activity.instructions.substring(0, 100)}...</p>` : ''}
                    <div class="card-footer">
                        ${isCompleted ? 
                            '<button class="redo-activity-btn" onclick="vespaApp.startActivity(\'' + activity.id + '\')">Redo Activity <span class="arrow">↻</span></button>' :
                            '<button class="start-activity-btn" style="background: ' + categoryColor + '" onclick="vespaApp.startActivity(\'' + activity.id + '\')">Start Activity <span class="arrow">→</span></button>'
                        }
                    </div>
                    <div class="card-hover-effect"></div>
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
                        <h2>🎯 What would you like help with?</h2>
                        <p>Select a challenge below and we'll recommend activities to help you overcome it!</p>
                    </div>
                    
                    <div class="problems-steps">
                        <div class="step">
                            <span class="step-number">1</span>
                            <span class="step-text">Choose a category</span>
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <span class="step-text">Select your challenge</span>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <span class="step-text">Get recommendations</span>
                        </div>
                    </div>
                    
                    <div class="problems-categories">
                        ${Object.keys(this.colors).map(category => `
                            <div class="problem-category" data-category="${category}">
                                <div class="category-header" style="background: ${this.colors[category].primary}20; border-color: ${this.colors[category].primary}">
                                    <h3 class="category-title" style="color: ${this.colors[category].primary}">
                                        ${this.getCategoryEmoji(category)} ${category.toUpperCase()}
                                    </h3>
                                </div>
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
            // Use proper case for category key (Vision, Effort, etc.)
            const categoryKey = category.charAt(0).toUpperCase() + category.slice(1);
            const problems = this.state.problemMappings?.[categoryKey] || [];
            
            if (problems.length === 0) {
                return '<p class="no-problems">No problems available for this category.</p>';
            }
            
            return problems.map(problem => `
                <button class="problem-item" data-problem-id="${problem.id}" data-category="${category}">
                    <span class="problem-text">${problem.text}</span>
                    <span class="problem-arrow">→</span>
                </button>
            `).join('');
        }
        
        getAllActivitiesHTML() {
            const categories = ['vision', 'effort', 'systems', 'practice', 'attitude'];
            
            return `
                <div class="all-activities-container">
                    <h2>📚 Additional Activities</h2>
                    <p>Explore extra activities beyond your prescribed list</p>
                    
                    <div class="category-buttons">
                        ${categories.map(category => {
                            const emoji = this.getCategoryEmoji(category);
                            const color = this.colors[category];
                            // Count only non-prescribed activities
                            const allInCategory = this.state.activities.byCategory[category] || [];
                            const nonPrescribedCount = allInCategory.filter(activity => {
                                const isPrescribed = this.state.prescribedActivityIds.includes(activity.id) || 
                                                   this.state.prescribedActivityIds.includes(activity.activityId);
                                return !isPrescribed;
                            }).length;
                            
                            return `
                                <button class="category-button" 
                                        data-category="${category}"
                                        style="background: ${color.primary}; border-color: ${color.dark}">
                                    <span class="category-button-emoji">${emoji}</span>
                                    <span class="category-button-name">${category.toUpperCase()}</span>
                                    <span class="category-button-count">${nonPrescribedCount} extra activities</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
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
                
                // Category button in All Activities
                if (e.target.closest('.category-button')) {
                    const category = e.target.closest('.category-button').dataset.category;
                    this.showCategoryActivities(category);
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
            
            // Load activity questions from Object_45
            this.loadActivityQuestions(activityId).then(async questions => {
                // Load existing responses from object_46
                let existingResponses = null;
                try {
                    const responseHandler = new ResponseHandler({
                        knackAppId: this.config.knackAppId || this.config.applicationId,
                        knackApiKey: this.config.knackApiKey || this.config.apiKey,
                        apiKey: this.config.apiKey,
                        applicationId: this.config.applicationId
                    });
                    
                    existingResponses = await responseHandler.findExistingResponse(activityId, this.getCurrentStudentId());
                    console.log('Loaded existing responses:', existingResponses);
                } catch (error) {
                    console.error('Error loading existing responses:', error);
                }
                
                // Create the activity renderer with existing responses
                const renderer = new window.ActivityRenderer(
                    activity,
                    questions,
                    existingResponses, // Pass the actual response record from object_46
                    {
                        studentId: this.getCurrentStudentId(),
                        knackAppId: this.config.knackAppId || this.config.applicationId,
                        knackApiKey: this.config.knackApiKey || this.config.apiKey,
                        apiKey: this.config.apiKey,
                        applicationId: this.config.applicationId
                    }
                );
                
                // Render the activity
                renderer.render();
                
                // Set up the close callback
                window.vespaApp.onActivityClose = async () => {
                    // Only refresh activity progress data, not everything
                    try {
                        // Re-parse activity progress to get updated completion status
                        const progressView = Knack.views[this.config.views.activityProgress];
                        if (progressView) {
                            this.parseActivityProgress();
                            // Only re-render the current view, not reload all data
                            const currentView = this.state.currentView || 'dashboard';
                            this.switchView(currentView);
                        }
                    } catch (error) {
                        console.error('Error refreshing after activity close:', error);
                    }
                };
            }).catch(error => {
                console.error('Failed to load activity questions:', error);
                this.showMessage('Failed to load activity. Please try again.', 'error');
            });
        }
        
        // Load activity questions from Object_45
        async loadActivityQuestions(activityId) {
            try {
                log('Loading questions for activity:', activityId);
                
                const filters = {
                    match: 'and',
                    rules: [{
                        field: 'field_1286', // Connection to Activity
                        operator: 'is',
                        value: activityId
                    }]
                };
                
                const headers = {
                    'X-Knack-Application-Id': this.config.knackAppId,
                    'X-Knack-REST-API-Key': this.config.knackApiKey,
                    'Content-Type': 'application/json'
                };
                
                // If user token is available, use it for authentication
                const userToken = Knack.getUserToken ? Knack.getUserToken() : null;
                if (userToken) {
                    headers['Authorization'] = userToken;
                }
                
                const url = 'https://api.knack.com/v1/objects/object_45/records';
                const params = new URLSearchParams({
                    filters: JSON.stringify(filters),
                    rows_per_page: 100, // Get all questions for the activity
                    sort_field: 'field_1303', // Sort by Order
                    sort_order: 'asc'
                });
                
                const response = await fetch(`${url}?${params}`, {
                    method: 'GET',
                    headers: headers
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to load activity questions: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                log('Loaded activity questions:', data.records.length);
                
                // Transform the records to match our expected format
                return data.records.map(record => ({
                    id: record.id,
                    field_1303: parseInt(record.field_1303) || 0, // Order
                    field_1279: record.field_1279 || '', // Question text
                    field_1290: record.field_1290 || 'Short Text', // Input type
                    field_1291: record.field_1291 || '', // Dropdown options
                    field_1310: record.field_1310 || '', // Context/Instructions (HTML)
                    field_2341: record.field_2341 || 'No', // Required (Yes/No)
                    field_1314: record.field_1314 || 'No' // Is final question (Yes/No)
                })).sort((a, b) => a.field_1303 - b.field_1303);
                
            } catch (error) {
                console.error('Error loading activity questions:', error);
                // Return empty array on error rather than throwing
                // This allows the app to continue functioning
                this.showError('Failed to load activity questions. Please try again.');
                return [];
            }
        }
        
        // Get current student ID
        getCurrentStudentId() {
            // Return the student record ID from state, not the Knack user ID
            return this.state.studentId || null;
        }
        
        selectProblem(problemId, category) {
            log('Selected problem:', problemId, category);
            
            // Find the problem details
            const categoryKey = category.charAt(0).toUpperCase() + category.slice(1);
            const problem = this.state.problemMappings?.[categoryKey]?.find(p => p.id === problemId);
            
            if (!problem) {
                this.showMessage('Problem not found', 'error');
                return;
            }
            
            // Find recommended activities
            const recommendedActivityNames = problem.recommendedActivities || [];
            const recommendedActivities = this.state.activities.all.filter(activity => 
                recommendedActivityNames.includes(activity.name)
            );
            
            // Create and display modal with recommendations
            const modalHTML = `
                <div class="activities-modal-overlay" id="problem-recommendations-modal">
                    <div class="activities-modal">
                        <div class="modal-header">
                            <h2 class="modal-title">
                                <span class="rec-icon">💡</span>
                                Recommended Activities
                            </h2>
                            <button class="modal-close-btn" onclick="document.getElementById('problem-recommendations-modal').remove()">
                                <span>×</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p class="modal-subtitle">For: "${problem.text}"</p>
                            <div class="modal-activities-grid">
                                ${recommendedActivities.length > 0 ? 
                                    recommendedActivities.map((activity, index) => this.getCompactActivityCardHTML(activity, index)).join('') :
                                    '<p class="no-recommendations">No specific activities found for this challenge. Try browsing all activities.</p>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listener to close modal on overlay click
            const modal = document.getElementById('problem-recommendations-modal');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
        
        showActivitiesForCategory(category) {
            this.state.view = 'all-activities';
            this.render();
            // Auto-click the category button
            setTimeout(() => {
                const button = document.querySelector(`[data-category="${category}"]`);
                if (button) button.click();
            }, 100);
        }
        
        showCategoryActivities(category) {
            // Get all activities for this category (not just available ones)
            const categoryActivities = this.state.activities.byCategory[category] || [];
            
            // Filter to show ONLY non-prescribed activities to avoid duplicates
            const nonPrescribedActivities = categoryActivities.filter(activity => {
                const isPrescribed = this.state.prescribedActivityIds.includes(activity.id) || 
                                   this.state.prescribedActivityIds.includes(activity.activityId);
                return !isPrescribed;
            });
            
            const color = this.colors[category];
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'activities-modal-overlay';
            modal.innerHTML = `
                <div class="activities-modal">
                    <div class="modal-header" style="background: ${color.primary}">
                        <h2 class="modal-title">
                            ${this.getCategoryEmoji(category)} ${category.toUpperCase()} Activities
                            <span style="font-size: 0.7em; font-weight: normal; margin-left: 10px;">
                                (Additional activities not in your prescribed list)
                            </span>
                        </h2>
                        <button class="modal-close-btn" onclick="this.closest('.activities-modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-subtitle">Explore ${nonPrescribedActivities.length} additional activities in this category</p>
                        <div class="modal-activities-grid">
                            ${nonPrescribedActivities.length > 0 ? 
                                nonPrescribedActivities.map((activity, index) => this.getCompactActivityCardHTML(activity, index)).join('') :
                                '<p>No additional activities found in this category. All activities in this category are already in your prescribed list.</p>'
                            }
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    document.body.style.overflow = '';
                }
            });
        }
        
        getCompactActivityCardHTML(activity, index = 0) {
            const isCompleted = this.state.finishedActivityIds.includes(activity.id) || 
                              this.state.finishedActivityIds.includes(activity.activityId);
            const categoryColor = this.colors[activity.category]?.primary || '#666';
            const basePoints = activity.level === 'Level 3' ? 15 : 10;
            
            return `
                <div class="compact-activity-card ${isCompleted ? 'completed' : ''}" 
                     data-activity-id="${activity.id}"
                     style="animation-delay: ${index * 0.05}s">
                    <div class="compact-card-header">
                        <span class="compact-level">${activity.level}</span>
                        <span class="compact-points">+${basePoints}</span>
                    </div>
                    <h4 class="compact-activity-name">${activity.name}</h4>
                    <div class="compact-card-footer">
                        ${isCompleted ? 
                            '<span class="compact-completed">✓ Completed</span>' :
                            '<button class="compact-start-btn" style="background: ' + categoryColor + '" onclick="vespaApp.startActivity(\'' + activity.id + '\')">Start</button>'
                        }
                    </div>
                </div>
            `;
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
            if (!date) return 'Unknown date';
            
            // Convert string to Date object if needed
            const dateObj = date instanceof Date ? date : new Date(date);
            
            // Check if the date is valid
            if (isNaN(dateObj.getTime())) {
                log('Invalid date format:', date);
                return 'Invalid date';
            }
            
            const now = new Date();
            const diff = now - dateObj;
            const hours = Math.floor(diff / 3600000);
            
            if (hours < 1) return 'Just now';
            if (hours < 24) return `${hours}h ago`;
            if (hours < 48) return 'Yesterday';
            return dateObj.toLocaleDateString();
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
        
        showLoadingOverlay() {
            // Create overlay if it doesn't exist
            let overlay = document.getElementById('vespa-loading-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'vespa-loading-overlay';
                overlay.className = 'vespa-loading-overlay';
                overlay.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <h3>Loading VESPA Activities...</h3>
                        <p>Please wait while we prepare your personalized learning experience</p>
                    </div>
                `;
                document.body.appendChild(overlay);
            }
            overlay.style.display = 'flex';
        }
        
        hideLoadingOverlay() {
            const overlay = document.getElementById('vespa-loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
        
        handleBrokenImages() {
            // Add event listeners to handle broken images
            document.addEventListener('error', (e) => {
                if (e.target.tagName === 'IMG') {
                    // Check if we've already handled this image
                    if (e.target.dataset.errorHandled) return;
                    e.target.dataset.errorHandled = 'true';
                    
                    e.target.style.display = 'none';
                    // Optionally add a placeholder
                    const placeholder = document.createElement('div');
                    placeholder.className = 'image-placeholder';
                    placeholder.innerHTML = '🖼️ Image unavailable';
                    placeholder.style.cssText = 'background: #f0f0f0; padding: 20px; text-align: center; color: #666; border-radius: 8px;';
                    e.target.parentNode.insertBefore(placeholder, e.target);
                }
            }, true);
        }
        
        enableLazyLoading() {
            // Enable lazy loading for images
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                                observer.unobserve(img);
                            }
                        }
                    });
                }, {
                    rootMargin: '50px 0px' // Start loading 50px before entering viewport
                });
                
                // Observe all images with data-src
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            }
        }
        
        showCategoryModal(category) {
            log('Showing category modal for:', category);
            
            // Get all activities for this category
            const categoryActivities = this.state.activities.available.filter(a => 
                a.category === category.toLowerCase()
            );
            
            // Filter out prescribed activities to avoid duplicates
            const nonPrescribedActivities = categoryActivities.filter(activity => {
                const isPrescribed = this.state.prescribedActivityIds.includes(activity.id) || 
                                   this.state.prescribedActivityIds.includes(activity.activityId);
                return !isPrescribed;
            });
            
            const modal = document.createElement('div');
            modal.className = 'vespa-modal category-modal';
            modal.innerHTML = `
                <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <button class="modal-close" onclick="this.closest('.vespa-modal').remove()">×</button>
                    <h2 class="modal-title">${this.getCategoryEmoji(category)} ${category.toUpperCase()}</h2>
                    <p class="modal-subtitle">Explore all ${nonPrescribedActivities.length} activities in this category</p>
                    
                    <div class="modal-activities-grid">
                        ${nonPrescribedActivities.map((activity, index) => 
                            this.getActivityCardHTML(activity, index, false)
                        ).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    document.body.style.overflow = '';
                }
            });
        }
        
        async loadActivitiesJson() {
            try {
                log('Loading activities.json for media content...');
                
                // Add timeout for slow connections
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                // Add cache buster to force fresh load
                const cacheBuster = new Date().getTime();
                const response = await fetch(`https://cdn.jsdelivr.net/gh/4Sighteducation/vespa-activities-v2@main/shared/utils/activities1c.json?v=${cacheBuster}`, {
                    signal: controller.signal,
                    cache: 'no-cache' // Force fresh load
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    // Store globally for activity renderer to access
                    window.vespaActivitiesData = {};
                    // Fix: data is directly an array, not data.activities
                    data.forEach(activity => {
                        // Fix: use the correct field name
                        const activityId = activity['Activity ID'];
                        if (activityId) {
                            window.vespaActivitiesData[activityId] = {
                                videoUrl: activity['Activity Video Link'] || '',
                                slidesUrl: activity['Activity Slides Link'] || ''
                            };
                        }
                    });
                    log('Activities.json loaded successfully', window.vespaActivitiesData);
                } else {
                    log('Failed to load activities.json', response.status);
                }
            } catch (error) {
                console.error('Error loading activities.json:', error);
                // Continue without media URLs rather than breaking the app
                window.vespaActivitiesData = {};
            }
        }
    }
    
})(); // End IIFE
