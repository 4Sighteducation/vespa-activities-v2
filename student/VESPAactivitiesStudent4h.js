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
        
        log('Initializing VESPA Activities Student Experience');
        log('Config object received:', config);
        log('Field mappings in config:', config.fields);
        
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
                    type: 'activity_completion',
                    icon: '🌟',
                    points: 5,
                    criteria: { activitiesCompleted: 1 }
                },
                fiveActivities: {
                    id: 'five_activities',
                    name: 'Getting Going! 🚀',
                    description: 'Complete 5 activities',
                    type: 'activity_completion',
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
                    field_3551: achievement.id, // achievement_id
                    field_3552: studentId, // Student Connection Field
                    field_3553: achievement.type || 'activity_completion', // multiple choice achievement type
                    field_3554: achievement.name, // achievement_name
                    field_3555: achievement.description, // achievement_description
                    field_3556: new Date().toISOString(), // date_earned
                    field_3557: achievement.points || 0, // points_value
                    field_3558: achievement.icon || '🏆', // icon_emoji
                    field_3560: `Unlocked: ${achievement.name}`, // criteria_met
                    field_3559: '' // issued_by_staff (empty = gained independently)
                };
                
                // Debug logging for field mappings
                console.log('🏆 ACHIEVEMENT FIELD MAPPINGS FOR OBJECT_127:');
                console.log('field_3551 (achievement_id):', achievementData.field_3551);
                console.log('field_3552 (Student Connection):', achievementData.field_3552);
                console.log('field_3553 (achievement type - multiple choice):', achievementData.field_3553);
                console.log('field_3554 (achievement_name):', achievementData.field_3554);
                console.log('field_3555 (achievement_description):', achievementData.field_3555);
                console.log('field_3556 (date_earned):', achievementData.field_3556);
                console.log('field_3557 (points_value):', achievementData.field_3557);
                console.log('field_3558 (icon_emoji):', achievementData.field_3558);
                console.log('field_3559 (issued_by_staff):', achievementData.field_3559);
                console.log('field_3560 (criteria_met):', achievementData.field_3560);
                console.log('Full achievement data:', achievementData);
                
                // Use the response handler to make the API call
                const responseHandler = new window.ResponseHandler(this.config);
                const result = await responseHandler.knackAPI('POST', 'objects/object_127/records', achievementData);
                
                console.log('Achievement saved to Object_127:', result);
                
                // Store in localStorage for quick access
                const savedAchievements = JSON.parse(localStorage.getItem('vespa-achievements') || '[]');
                savedAchievements.push({
                    ...achievement,
                    unlockedAt: new Date().toISOString(),
                    studentId,
                    knackRecordId: result.id
                });
                localStorage.setItem('vespa-achievements', JSON.stringify(savedAchievements));
                
                return result;
            } catch (error) {
                console.error('Error saving achievement to Object_127:', error);
                // Still store locally even if Knack save fails
                const savedAchievements = JSON.parse(localStorage.getItem('vespa-achievements') || '[]');
                savedAchievements.push({
                    ...achievement,
                    unlockedAt: new Date().toISOString(),
                    studentId,
                    knackRecordId: null
                });
                localStorage.setItem('vespa-achievements', JSON.stringify(savedAchievements));
                
                return null;
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
        
        updateActivityCardStatus(activityId, status) {
            try {
                // Find the activity card
                const activityCard = document.querySelector(`[data-activity-id="${activityId}"]`);
                if (!activityCard) {
                    log('Activity card not found for:', activityId);
                    return;
                }
                
                // Update the finished activities list in state
                if (status === 'completed' && !this.state.finishedActivityIds.includes(activityId)) {
                    this.state.finishedActivityIds.push(activityId);
                    log('Added activity to finished list:', activityId);
                }
                
                // Update the card's visual state
                const cardFooter = activityCard.querySelector('.card-footer');
                if (cardFooter && status === 'completed') {
                    // Replace the button with completed badge
                    cardFooter.innerHTML = `
                        <span class="completed-badge">
                            <span class="checkmark">✓</span> Completed
                        </span>
                        <button class="redo-activity-btn" 
                                onclick="window.vespaApp.startActivity('${activityId}')">
                            Redo <span class="arrow">↻</span>
                        </button>
                    `;
                    
                    // Update progress display
                    const progressDisplay = activityCard.querySelector('.activity-progress');
                    if (progressDisplay) {
                        progressDisplay.style.width = '100%';
                    }
                }
                
                // Update the header stats
                this.updateHeaderStats();
                
                log('Updated activity card status:', { activityId, status });
            } catch (error) {
                console.error('Error updating activity card status:', error);
            }
        }
        
        async saveActivityResponse(data) {
            // Store the latest data
            this.lastSaveData = data;
            
            // If a save is already in progress, just update the data and return the pending promise
            if (this.savePromise) {
                log('Save already in progress, updating data...');
                return this.savePromise;
            }
            
            // Debounce saves to prevent rapid successive calls
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }
            
            // Create a new save promise
            this.savePromise = new Promise((resolve, reject) => {
                this.saveTimeout = setTimeout(async () => {
                    try {
                        const result = await this.performSave(this.lastSaveData);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    } finally {
                        this.savePromise = null;
                        this.saveTimeout = null;
                    }
                }, 500);
            });
            
            return this.savePromise;
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
            
            log('performSave called with:', {
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
                log('Formatted responses:', formattedResponses);
                
                // Check if a response already exists
                const existingResponse = await this.findExistingResponse(activityId, studentId);
                
                // Debug logging for field values
                log('Student data before save:', {
                    yearGroup: this.config.yearGroup,
                    group: this.config.group,
                    vespaCustomerId: this.config.vespaCustomerId,
                    studentFirstName: this.config.studentFirstName,
                    studentLastName: this.config.studentLastName,
                    studentId: studentId,
                    activityId: activityId
                });
                
                if (existingResponse) {
                    log('Found existing response, updating:', existingResponse.id);
                    
                    // Build update data - include connection fields if they're missing
                    const updateData = {
                        field_1300: formattedResponses, // Activity Answers Name (JSON)
                        field_2334: this.generatePlainTextSummary(responses), // Student Responses (readable)
                        field_2068: formattedResponses, // Activity Answers (backup)
                        field_1870: status === 'completed' ? this.formatDateUK(new Date()) : null, // Date/Time completed in UK format
                        field_2331: this.config.yearGroup || '', // Year Group
                        field_2332: this.config.group || '' // Group
                    };
                    
                    // Add connection fields if they're missing
                    if (!existingResponse.field_1301_raw && !existingResponse.field_1301) {
                        updateData.field_1301 = studentId; // Student connection
                        console.log('Adding missing student connection');
                    }
                    
                    if (!existingResponse.field_1302_raw && !existingResponse.field_1302) {
                        updateData.field_1302 = activityId; // Activities connection
                        console.log('Adding missing activity connection');
                    }
                    
                    // Always add VESPA Customer connection if available
                    if (this.config.vespaCustomerId) {
                        updateData.field_1871 = [this.config.vespaCustomerId]; // VESPA Customer connection as array
                        console.log('Adding VESPA Customer connection:', this.config.vespaCustomerId);
                    }
                    
                    // Always add Name field if available
                    if (this.config.studentFirstName || this.config.studentLastName) {
                        updateData.field_1875 = {
                            first: this.config.studentFirstName || '',
                            last: this.config.studentLastName || ''
                        };
                        console.log('Adding Name field:', updateData.field_1875);
                    }
                    
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
                            
                            // Also update the student's finished activities field
                            if (window.vespaActivityRenderer) {
                                try {
                                    await window.vespaActivityRenderer.updateStudentFinishedActivities(activityId);
                                    log('Updated finished activities from performSave (update)');
                                } catch (error) {
                                    console.error('Error updating finished activities in performSave:', error);
                                }
                            }
                            
                            // Update UI to reflect completed status
                            this.updateActivityCardStatus(activityId, 'completed');
                        }
                        
                        return result;
                } else {
                    log('No existing response found, creating new record');
                    const createData = {
                        field_1301: [studentId], // Student connection as array
                        field_1302: [activityId], // Activities connection as array
                        field_1300: formattedResponses, // Activity Answers Name (JSON)
                        field_2334: this.generatePlainTextSummary(responses), // Student Responses (readable)
                        field_2068: formattedResponses, // Activity Answers (backup)
                        field_1870: status === 'completed' ? this.formatDateUK(new Date()) : null, // Date/Time completed in UK format
                        field_2331: this.config.yearGroup || '', // Year Group
                        field_2332: this.config.group || '' // Group
                    };
                    
                    // Add VESPA Customer connection if available
                    if (this.config.vespaCustomerId) {
                        createData.field_1871 = [this.config.vespaCustomerId]; // VESPA Customer connection as array
                    }
                    
                    // Add Name field if available
                    if (this.config.studentFirstName || this.config.studentLastName) {
                        createData.field_1875 = {
                            first: this.config.studentFirstName || '',
                            last: this.config.studentLastName || ''
                        };
                    }
                    
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
                        
                        // Also update the student's finished activities field
                        if (window.vespaActivityRenderer) {
                            try {
                                await window.vespaActivityRenderer.updateStudentFinishedActivities(activityId);
                                console.log('Updated finished activities from performSave (create)');
                            } catch (error) {
                                console.error('Error updating finished activities in performSave:', error);
                            }
                        }
                        
                        // Update UI to reflect completed status
                        this.updateActivityCardStatus(activityId, 'completed');
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
            log('Making Knack API call:', {
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
            
            log('API Headers:', {
                appId: headers['X-Knack-Application-Id'],
                hasApiKey: !!headers['X-Knack-REST-API-Key'],
                apiKeyLength: headers['X-Knack-REST-API-Key']?.length
            });
            
            // If user token is available, use it for authentication
            const userToken = Knack.getUserToken ? Knack.getUserToken() : null;
            if (userToken) {
                headers['Authorization'] = userToken;
                log('Using user token for authentication');
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
            
            log('Making API request to:', url);
            log('Request method:', method);
            log('Request headers:', headers);
            if (data && method !== 'GET') {
                log('Request body:', options.body);
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
                log('API call successful, result:', result);
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
                    field_3538: this.state.currentCycle || cycleNumber, // Use current cycle from Object_10
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
                    field_3538: this.state.currentCycle || 1, // Use current cycle from Object_10
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
                
                // Achievement records are now created by AchievementSystem in ActivityRenderer.completeActivity()
            } catch (error) {
                console.error('Error creating progress record:', error);
                // Don't throw - progress tracking failure shouldn't break activity completion
            }
        }
        
        // Create achievement record (deprecated - use AchievementSystem instead)
        async createAchievementRecord(studentId, achievementType) {
            try {
                // This method is kept for backward compatibility
                // New achievements should use AchievementSystem.saveAchievementToKnack
                console.warn('createAchievementRecord is deprecated. Use AchievementSystem.saveAchievementToKnack instead.');
                
                const achievementData = {
                    field_3551: 'first_activity', // achievement_id
                    field_3552: studentId, // Student Connection Field
                    field_3553: 'activity_completion', // achievement type (multiple choice)
                    field_3554: 'First Steps! 🎯', // achievement_name
                    field_3555: 'Complete your first activity', // achievement_description
                    field_3556: new Date().toISOString(), // date_earned
                    field_3557: 5, // points_value
                    field_3558: '🌟', // icon_emoji
                    field_3560: 'Unlocked: First Steps! 🎯', // criteria_met
                    field_3559: '' // issued_by_staff (empty = gained independently)
                };
                
                await this.knackAPI('POST', `objects/${this.config.objects.achievements}/records`, achievementData);
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
                // Check if field_1300 is a valid JSON string
                const rawData = this.progress.field_1300;
                
                // Handle edge cases where field might contain invalid data
                if (!rawData || rawData === '.' || rawData.trim() === '') {
                    console.log('Empty or invalid response data, returning empty object');
                    return {};
                }
                
                // Try to parse as JSON
                const jsonData = JSON.parse(rawData);
                
                // If jsonData is not an object, return empty
                if (typeof jsonData !== 'object' || jsonData === null) {
                    console.log('Parsed data is not an object, returning empty');
                    return {};
                }
                
                const responses = {};
                
                Object.keys(jsonData).forEach(questionId => {
                    const cycles = jsonData[questionId];
                    if (cycles && typeof cycles === 'object') {
                        const latestCycle = Object.keys(cycles).sort().pop();
                        if (latestCycle && cycles[latestCycle]) {
                            responses[questionId] = cycles[latestCycle].value || '';
                        }
                    }
                });
                
                return responses;
            } catch (e) {
                console.error('Error parsing existing responses:', e);
                console.log('Raw data that failed to parse:', this.progress.field_1300);
                return {};
            }
        }
        
        render() {
            // Prevent multiple renders in quick succession
            if (this.isRendering) {
                log('Render already in progress, skipping...');
                return;
            }
            this.isRendering = true;
            
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
            
            // Add modal to DOM with a slight delay to prevent flash
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
            });
            
            // Add click handler for backdrop on desktop
            modal.addEventListener('click', (e) => {
                if (e.target === modal && window.innerWidth >= 1024) {
                    this.handleExit();
                }
            });
            
            this.attachEventListeners();
            
            // Iframes are now directly inserted in getLearnContent()
            
            // Delay auto-save start to prevent immediate save of existing data
            setTimeout(() => {
                this.startAutoSave();
            }, 5000); // Wait 5 seconds before starting auto-save
            
            this.initializeDynamicContent();
            
            // Reset rendering flag
            setTimeout(() => {
                this.isRendering = false;
            }, 100);
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
            // Get activity data from the new JSON structure
            const activityData = window.vespaActivitiesData?.[this.activity.id];
            const slidesSrc = activityData?.slidesUrl || '';
            const hasSlides = !!slidesSrc;
            
            // Debug logging
            console.log('[INTRO] Activity ID:', this.activity.id);
            console.log('[INTRO] Activity Data:', activityData);
            console.log('[INTRO] Slides URL:', slidesSrc);
            
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
                    
                    ${hasSlides ? `
                        <div class="intro-slideshow-section">
                            <h3 class="intro-media-title">Preview Slides</h3>
                            <div class="intro-slideshow-embed">
                                <div class="responsive-embed">
                                    <iframe 
                                        src="${slidesSrc}" 
                                        frameborder="0" 
                                        width="100%"
                                        height="100%"
                                        allowfullscreen="true" 
                                        mozallowfullscreen="true" 
                                        webkitallowfullscreen="true">
                                    </iframe>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="stage-navigation">
                        <button class="primary-btn next-stage-btn" onclick="window.vespaActivityRenderer.handleStageNavigation('learn')">
                            Let's Begin! <span class="btn-arrow">→</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        getLearnContent() {
            // Get activity data from the new JSON structure
            const activityData = window.vespaActivitiesData?.[this.activity.id];
            
            // Debug logging
            console.log('[LEARN] Activity ID:', this.activity.id);
            console.log('[LEARN] Activity Data:', activityData);
            
            // Extract media URLs from the new JSON structure
            const slidesSrc = activityData?.slidesUrl || '';
            const videoSrc = activityData?.videoUrl || '';
            const pdfUrl = activityData?.pdfUrl || '';
            const backgroundInfo = activityData?.backgroundInfo || this.activity.slideshow || '';
            
            // Store clean URLs for later use
            this._mediaIframes = { 
                video: videoSrc,
                slides: slidesSrc,
                pdf: pdfUrl
            };
            
            const hasSlides = !!slidesSrc;
            const hasVideo = !!videoSrc;
            const hasPDF = !!pdfUrl;
            const hasBackgroundInfo = backgroundInfo && backgroundInfo.trim() !== '';
            
            return `
                <div class="stage-content learn-content">
                    <div class="stage-header">
                        <h2>Learn & Explore</h2>
                        <p class="stage-description">Review the materials below to understand the activity.</p>
                    </div>
                    
                    ${hasVideo ? `
                        <div class="learn-video-section">
                            <div class="learn-video-embed">
                                <div class="responsive-embed">
                                    <iframe 
                                        src="${videoSrc}" 
                                        frameborder="0" 
                                        width="100%"
                                        height="100%"
                                        allowfullscreen="true" 
                                        mozallowfullscreen="true" 
                                        webkitallowfullscreen="true"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                                    </iframe>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${hasBackgroundInfo ? `
                        <div class="learn-background-section">
                            <div class="background-info-content">
                                ${this.filterBrokenImages(backgroundInfo)}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${hasPDF ? `
                        <div class="learn-pdf-section">
                            <h3 class="learn-section-title">📄 Additional Resources</h3>
                            <div class="responsive-embed pdf-embed">
                                <iframe 
                                    src="${pdfUrl}" 
                                    frameborder="0"
                                    width="100%"
                                    height="100%">
                                </iframe>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${!hasVideo && !hasBackgroundInfo && !hasPDF ? `
                        <div class="text-content">
                            <p style="text-align: center; color: #666;">No learning materials available for this activity.</p>
                        </div>
                    ` : ''}
                    
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
            log('[ActivityRenderer] All questions:', this.questions);
            const questions = this.questions.filter(q => q.field_1314 !== 'Yes');
            log('[ActivityRenderer] Filtered DO questions:', questions);
            log('[ActivityRenderer] Current responses:', this.responses);
            
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
            log('[ActivityRenderer] Can proceed from Do?', canProceed);
            
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
            
            // Auto-redirect to dashboard after 5 seconds
            setTimeout(() => {
                window.vespaActivityRenderer.handleExit();
            }, 5000);
            
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
                            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Returning to dashboard in 5 seconds...</p>
                            <button class="secondary-btn" onclick="window.vespaActivityRenderer.handleExit()">
                                Return Now
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
        
        // No longer needed - iframes load directly from Knack data
        addLazyLoading(iframeContent) {
            return iframeContent || '';
        }
        
        filterBrokenImages(htmlContent) {
            if (!htmlContent) return '';
            
            // Parse HTML string and filter out images from broken domains
            let filteredContent = htmlContent;
            
            // Find all img tags
            const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
            const matches = [...htmlContent.matchAll(imgRegex)];
            
            matches.forEach(match => {
                const fullImgTag = match[0];
                const imgSrc = match[1];
                
                // Check if image is from a broken domain
                if (isImageUrlBroken(imgSrc)) {
                    // Replace with placeholder
                    const placeholder = '<div class="image-placeholder" style="background: #f0f0f0; padding: 20px; text-align: center; color: #666; border-radius: 8px; margin: 10px 0;">🖼️ Image unavailable</div>';
                    filteredContent = filteredContent.replace(fullImgTag, placeholder);
                    log(`Filtered broken image: ${imgSrc}`);
                }
            });
            
            return filteredContent;
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
            
            // Iframes are now directly inserted in getLearnContent()
            
            window.vespaActivityRenderer = this;
        }
        
        // Method removed - iframes are now directly inserted in getLearnContent()
        
        handleStageNavigation(newStage) {
            this.currentStage = newStage;
            this.render();
            
            // Iframes are now directly inserted in getLearnContent()
        }
        
        handleInputChange(e) {
            const questionId = e.target.dataset.questionId;
            this.responses[questionId] = e.target.value;
            
            log('[ActivityRenderer] Input changed:', { questionId, value: e.target.value });
            
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
        
        async handleSave() {
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
            const isCompleted = this.currentStage === 'complete';
            
            await responseHandler.saveActivityResponse({
                activityId: this.activity.id,
                studentId: this.config.studentId,
                responses: this.responses,
                status: isCompleted ? 'completed' : 'in_progress'
            });
            
            // If activity is completed, also update the finished activities field
            if (isCompleted) {
                try {
                    await this.updateStudentFinishedActivities(this.activity.id);
                    console.log('Updated finished activities from auto-save');
                } catch (error) {
                    console.error('Error updating finished activities during auto-save:', error);
                }
            }
        }
        
        async handleExit() {
            if (this.isExiting) return;
            
            this.isExiting = true;
            
            await this.handleSave();
            
            // Clean up any loaded iframes to free memory
            if (this._loadedIframes && this._loadedIframes.length > 0) {
                log('[ActivityRenderer] Cleaning up loaded iframes');
                this._loadedIframes.forEach(({ iframe }) => {
                    // Stop iframe content to free resources
                    iframe.src = 'about:blank';
                });
                this._loadedIframes = [];
            }
            
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
            // CRITICAL FIX: Clear any existing interval first
            this.stopAutoSave();
            
            this.autoSaveInterval = setInterval(() => {
                this.handleSave();
            }, 30000);
            
            log(`Auto-save started with interval ID: ${this.autoSaveInterval}`);
        }
        
        stopAutoSave() {
            if (this.autoSaveInterval) {
                log(`Stopping auto-save interval: ${this.autoSaveInterval}`);
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
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
        
        loadIframe(type, src) {
            log(`Loading ${type} iframe: ${src}`);
            const panel = document.getElementById(`${type}-panel`);
            if (!panel) return;
            
            const embedContainer = panel.querySelector('.responsive-embed');
            if (!embedContainer) return;
            
            // Check if already loaded
            if (embedContainer.querySelector('iframe')) {
                log(`${type} iframe already loaded`);
                return;
            }
            
            // Add preconnect hints before loading iframe
            if (!this._preconnected) {
                this.addPreconnectLinks();
                this._preconnected = true;
            }
            
            // Show loading state
            const loadingText = type === 'slides' ? 'presentation' : 
                               type === 'video' ? 'video' : 
                               type === 'pdf' ? 'PDF document' : 'content';
            embedContainer.innerHTML = `
                <div class="iframe-loading-overlay">
                    <div class="loading-spinner"></div>
                    <p>Loading ${loadingText}...</p>
                </div>
            `;
            
            // Fix and optimize Google URLs
            let optimizedSrc = src;
            if (src && src.includes('docs.google.com')) {
                // Fix Google Slides URLs
                if (src.includes('/presentation/')) {
                    // Extract presentation ID and rebuild clean URL
                    const presentationMatch = src.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
                    if (presentationMatch) {
                        // Use clean embed URL without rm=minimal (causes CSP issues)
                        optimizedSrc = `https://docs.google.com/presentation/d/${presentationMatch[1]}/embed?start=false&loop=false&delayms=60000`;
                        log(`Fixed Google Slides URL: ${optimizedSrc}`);
                    }
                }
            } else if (src && src.includes('drive.google.com')) {
                // Fix Google Drive video URLs
                const driveMatch = src.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
                if (driveMatch) {
                    optimizedSrc = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
                    log(`Fixed Google Drive URL: ${optimizedSrc}`);
                }
            }
            
            // Create and insert iframe with trust signals
            const iframe = document.createElement('iframe');
            iframe.src = optimizedSrc;
            iframe.loading = 'eager'; // Load immediately
            iframe.importance = 'high'; // High priority
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            iframe.allowFullscreen = true;
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.style.cssText = 'width: 100%; height: 100%; border: none; position: absolute; top: 0; left: 0;';
            
            // Additional attributes for Google content
            if (type === 'slides' || optimizedSrc.includes('google.com')) {
                // Don't use sandbox for Google content - it causes CSP issues
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allowtransparency', 'true');
                // Add credentialless for cross-origin isolation
                iframe.setAttribute('credentialless', 'true');
            }
            
            // Add load event listener
            iframe.onload = () => {
                log(`${type} iframe loaded successfully`);
                // Remove loading overlay
                const overlay = embedContainer.querySelector('.iframe-loading-overlay');
                if (overlay) {
                    overlay.remove();
                }
            };
            
            // Add error handler
            iframe.onerror = () => {
                log(`${type} iframe failed to load`);
                embedContainer.innerHTML = `
                    <div class="media-placeholder">
                        <div class="placeholder-content">
                            <div class="placeholder-icon">⚠️</div>
                            <h3>Failed to load ${type}</h3>
                            <p>Please check your internet connection and try again.</p>
                            <button class="load-media-btn" onclick="window.vespaActivityRenderer.loadIframe('${type}', '${src}')">
                                <span class="play-icon">🔄</span> Retry
                            </button>
                        </div>
                    </div>
                `;
            };
            
            // Make embed container relative for absolute positioning
            embedContainer.style.position = 'relative';
            embedContainer.appendChild(iframe);
            
            // Track loaded iframes for cleanup
            if (!this._loadedIframes) this._loadedIframes = [];
            this._loadedIframes.push({ type, iframe, src });
        }
        
        async loadMediaForCurrentActivity() {
            // Media content is already loaded in getLearnContent() from Knack data
            // This method is now deprecated but kept for backward compatibility
            console.log('Media content loaded directly from Knack data');
        }
        
        loadMediaContent() {
            // Deprecated - media content is loaded directly in the render method
            console.log('loadMediaContent is deprecated - media loads automatically');
        }
        
        async completeActivity() {
            // Show a fun loading message while saving
            const stageContent = document.querySelector('.stage-content');
            if (stageContent) {
                stageContent.innerHTML = `
                    <div class="stage-content complete-content">
                        <div class="completion-celebration">
                            <div class="loading-spinner"></div>
                            <h2>Phew, that was a lot of work!</h2>
                            <p>We're struggling to get it all uploaded... 🏃‍♂️💨</p>
                            <p style="font-size: 14px; color: #666; margin-top: 10px;">Just kidding! Your amazing work is being saved securely...</p>
                        </div>
                    </div>
                `;
            }
            
            // Calculate activity statistics
            const timeSpent = Math.round((Date.now() - this.startTime) / 60000); // minutes
            const wordCount = Object.values(this.responses).join(' ').split(/\s+/).filter(w => w).length;
            
            log('Completing activity:', {
                activityId: this.activity.id,
                studentId: this.config.studentId,
                config: this.config,
                responses: this.responses
            });
            
            // Update local storage immediately for instant UI feedback
            const completedActivities = JSON.parse(localStorage.getItem('vespa-completed-activities') || '[]');
            if (!completedActivities.includes(this.activity.id)) {
                completedActivities.push(this.activity.id);
                localStorage.setItem('vespa-completed-activities', JSON.stringify(completedActivities));
                console.log('Added activity to local completed list:', this.activity.id);
            }
            
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
                log('Activity response saved successfully');
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
            
            // Update the student's finished activities field (field_1380)
            try {
                await this.updateStudentFinishedActivities(this.activity.id);
                console.log('Updated student finished activities field');
            } catch (error) {
                console.error('Error updating finished activities:', error);
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
            
            // Refresh the parent app's activity progress data
            if (window.vespaApp) {
                // Add this activity to the progress immediately for instant UI update
                const newProgress = {
                    id: 'temp-' + Date.now(),
                    activityId: this.activity.id,
                    activityName: this.activity.name,
                    cycleNumber: 1,
                    dateCompleted: new Date().toISOString(),
                    timeMinutes: timeSpent,
                    status: 'completed',
                    verified: false,
                    pointsEarned: this.activity.level === 'Level 3' ? 15 : 10,
                    wordCount: wordCount
                };
                
                // Add to the beginning of progress array
                window.vespaApp.state.activities.progress.unshift(newProgress);
                
                // Also add to completed activities if not already there
                if (!window.vespaApp.state.activities.completed.find(a => a.id === this.activity.id)) {
                    window.vespaApp.state.activities.completed.push({
                        ...this.activity,
                        completedDate: newProgress.dateCompleted,
                        pointsEarned: newProgress.pointsEarned,
                        timeSpent: newProgress.timeMinutes
                    });
                }
                
                // Update the completed activities in the app state
                if (!window.vespaApp.state.activities.completed.find(a => a.id === this.activity.id)) {
                    window.vespaApp.state.activities.completed.push({
                        ...this.activity,
                        dateCompleted: new Date()
                    });
                }
                
                // Recalculate stats
                window.vespaApp.calculateStats();
                // Update UI immediately
                window.vespaApp.updateHeaderStats();
                // Update all activity cards to show completion
                window.vespaApp.render();
            }
        }
        
        async updateStudentFinishedActivities(activityId) {
            try {
                // First, fetch the current student record to get the latest finished activities
                const responseHandler = new ResponseHandler(this.config);
                
                // Get fresh student data from Knack
                let currentFinishedActivities = [];
                try {
                    const studentRecord = await responseHandler.knackAPI(
                        'GET',
                        `objects/${this.config.objects.student}/records/${this.config.studentId}`
                    );
                    
                    // Parse the current finished activities field
                    const finishedField = studentRecord[this.config.fields.finishedActivities] || 
                                        studentRecord[this.config.fields.finishedActivities + '_raw'] || '';
                    
                    if (typeof finishedField === 'string' && finishedField.trim()) {
                        currentFinishedActivities = finishedField.split(',').map(id => id.trim()).filter(id => id);
                    }
                } catch (error) {
                    console.error('Error fetching current student record:', error);
                    // Fall back to app state if fetch fails
                    currentFinishedActivities = window.vespaApp?.state?.finishedActivityIds || [];
                }
                
                // Check if activity is already in the list
                if (currentFinishedActivities.includes(activityId)) {
                    return;
                }
                
                // Add the new activity ID
                const updatedActivities = [...currentFinishedActivities, activityId];
                const updatedField = updatedActivities.join(',');
                
                // Update the student record in object_6
                const updateData = {
                    [this.config.fields.finishedActivities]: updatedField
                };
                
                // Make the API call to update the student record
                // responseHandler already declared above
                
                // Use the Knack provided method to update the record
                if (typeof Knack !== 'undefined' && Knack.$ && Knack.$.ajax) {
                    const result = await new Promise((resolve, reject) => {
                        Knack.$.ajax({
                            type: 'PUT',
                            url: `https://api.knack.com/v1/objects/${this.config.objects.student}/records/${this.config.studentId}`,
                            headers: {
                                'X-Knack-Application-Id': this.config.knackAppId || this.config.applicationId,
                                'X-Knack-REST-API-Key': this.config.knackApiKey || this.config.apiKey,
                                'Authorization': Knack.getUserToken()
                            },
                            contentType: 'application/json',
                            data: JSON.stringify(updateData),
                            success: (data) => {
                                resolve(data);
                            },
                            error: (xhr, status, error) => {
                                console.error('Failed to update student record:', error);
                                reject(error);
                            }
                        });
                    });
                } else {
                    // Fallback to regular API call
                    const result = await responseHandler.knackAPI(
                        'PUT',
                        `objects/${this.config.objects.student}/records/${this.config.studentId}`,
                        updateData
                    );
                }
                
                // Update the local state as well
                if (window.vespaApp?.state) {
                    window.vespaApp.state.finishedActivityIds = updatedActivities;
                    
                    // Also add to the completed activities list
                    if (!window.vespaApp.state.activities.completed.find(a => a.id === activityId)) {
                        window.vespaApp.state.activities.completed.push({
                            ...this.activity,
                            completedDate: new Date().toISOString(),
                            pointsEarned: this.activity.level === 'Level 3' ? 15 : 10,
                            timeSpent: Math.round((Date.now() - this.startTime) / 60000)
                        });
                    }
                }
            } catch (error) {
                console.error('Error updating student finished activities:', error);
                throw error;
            }
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
        
        addPreconnectLinks() {
            // Add preconnect for common domains
            const domains = [
                'https://docs.google.com',
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
                'https://img.youtube.com',
                'https://slides.com'
            ];
            
            domains.forEach(domain => {
                // Check if preconnect already exists
                if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
                    const link = document.createElement('link');
                    link.rel = 'preconnect';
                    link.href = domain;
                    link.crossOrigin = 'anonymous';
                    document.head.appendChild(link);
                }
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
    
    // ============================================
    // IMAGE QUEUE MANAGER - Prevent simultaneous loading crashes
    // ============================================
    class ImageQueueManager {
        constructor(maxConcurrent = 3) {
            this.maxConcurrent = maxConcurrent;
            this.currentLoading = 0;
            this.queue = [];
            this.loaded = new Set();
            this.failed = new Set();
            this.observer = null;
            this.setupIntersectionObserver();
        }

        setupIntersectionObserver() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            const src = img.dataset.src;
                            if (src && !img.src) {
                                this.loadImage(src).then(success => {
                                    if (success) {
                                        img.src = src;
                                        img.classList.add('loaded');
                                    }
                                });
                                this.observer.unobserve(img);
                            }
                        }
                    });
                }, {
                    rootMargin: '50px'
                });
            }
        }

        observeImage(img) {
            if (this.observer && img.dataset.src) {
                this.observer.observe(img);
            }
        }

        async loadImage(src) {
            // Skip if already loaded or failed
            if (this.loaded.has(src) || this.failed.has(src)) {
                return this.loaded.has(src);
            }

            return new Promise((resolve) => {
                const processImage = () => {
                    if (this.currentLoading >= this.maxConcurrent) {
                        // Queue this image
                        this.queue.push({ src, resolve });
                        return;
                    }

                    this.currentLoading++;
                    const img = new Image();
                    
                    img.onload = () => {
                        this.loaded.add(src);
                        this.currentLoading--;
                        this.processQueue();
                        resolve(true);
                    };
                    
                    img.onerror = () => {
                        this.failed.add(src);
                        this.currentLoading--;
                        this.processQueue();
                        log(`Failed to load image: ${src}`);
                        resolve(false);
                    };
                    
                    img.src = src;
                };

                processImage();
            });
        }

        processQueue() {
            while (this.queue.length > 0 && this.currentLoading < this.maxConcurrent) {
                const { src, resolve } = this.queue.shift();
                this.loadImage(src).then(resolve);
            }
        }

        preloadCritical(urls) {
            // Preload only critical images (first 3-5)
            const critical = urls.slice(0, 5);
            return Promise.all(critical.map(url => this.loadImage(url)));
        }

        reset() {
            this.currentLoading = 0;
            this.queue = [];
            // Keep loaded cache for session
        }

        cleanup() {
            if (this.observer) {
                this.observer.disconnect();
            }
            this.reset();
        }
    }

    // Global image queue manager
    const imageQueueManager = new ImageQueueManager(3);
    
    // List of known broken/dead domains to filter out
    const BROKEN_IMAGE_DOMAINS = [
        'danicaexplainsitall.com',
        'www.theschoolrun.com',
        '461200-1444427-raikfcquaxqncofqfm.stackpathdns.com',
        'raikfcquaxqncofqfm.stackpathdns.com'
    ];
    
    // Function to check if image URL is from a broken domain
    function isImageUrlBroken(url) {
        if (!url) return true;
        const urlLower = url.toLowerCase();
        return BROKEN_IMAGE_DOMAINS.some(domain => urlLower.includes(domain));
    }
    
    // Main application class
    class VESPAActivitiesApp {
        constructor(config) {
            this.config = config;
            this.imageQueue = imageQueueManager;
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
                
                // Wait for Knack to be ready with timeout
                try {
                    await Promise.race([
                        this.waitForKnack(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Knack initialization timeout')), 20000)
                        )
                    ]);
                } catch (error) {
                    console.error('Knack initialization failed:', error);
                    throw new Error('Unable to initialize Knack framework');
                }
                
                // Setup view listeners
                this.setupViewListeners();
                
                // Wait for all required views to render with timeout
                try {
                    await Promise.race([
                        this.waitForViews(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Views rendering timeout')), 15000)
                        )
                    ]);
                } catch (error) {
                    console.warn('Some views may not have rendered:', error);
                    // Continue anyway - we'll handle missing data gracefully
                }
                
                // Load activities.json - non-blocking to prevent crashes
                this.loadActivitiesJson().catch(err => {
                    console.warn('Failed to load activities JSON, continuing without media:', err);
                });
                
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
                
                // Prefetch first activity resources to prevent slow first load
                setTimeout(() => {
                    this.prefetchFirstActivity();
                }, 2000);
                
                // Hide loading overlay
                this.hideLoadingOverlay();
                
                // Check if this is a new user and show appropriate modal
                if (this.state.isNewUser) {
                    log('New user detected, showing comprehensive welcome modal');
                    await this.showNewUserWelcome();
                } else {
                    // Check if this is a new cycle
                    const history = this.getActivityHistory();
                    const lastSeenCycle = localStorage.getItem(`vespa_last_cycle_${this.state.studentId}`);
                    const currentCycle = String(this.state.currentCycle);
                    
                    if (lastSeenCycle && lastSeenCycle !== currentCycle) {
                        log('Cycle change detected: from', lastSeenCycle, 'to', currentCycle);
                        await this.showCycleChangeModal();
                    } else if (!history[`cycle${this.state.currentCycle}`]?.timestamp) {
                        // First time in this cycle
                        log('First time in cycle', this.state.currentCycle);
                        await this.showCycleChangeModal();
                    } else {
                        // Returning user, same cycle - show motivational modal
                        log('Returning user, showing motivational message');
                        await this.showMotivationalModal();
                    }
                    
                    // Store current cycle
                    localStorage.setItem(`vespa_last_cycle_${this.state.studentId}`, currentCycle);
                }
                
                log('VESPA Activities initialization complete');
            } catch (error) {
                console.error('[VESPA Activities v2.0] Failed to initialize VESPA Activities:', error);
                this.hideLoadingOverlay();
                this.showError('Failed to initialize. Please refresh the page.');
            }
        }
        
        prefetchFirstActivity() {
            // Find first recommended or prescribed activity
            const firstActivity = this.state.activities.all.find(activity => 
                (activity.recommended || activity.prescribed) && 
                !this.state.activities.progress.some(p => p.activityId === activity.id && p.status === 'completed')
            );
            
            if (!firstActivity) return;
            
            log('[App] Prefetching resources for:', firstActivity.name);
            
            // Extract media URLs from the activity
            const mediaContent = firstActivity.video || '';
            
            // Also check activities1e.json data for slides URL
            const activityData = window.vespaActivitiesData?.[firstActivity.id];
            const slidesUrl = activityData?.slidesUrl;
            
            if (slidesUrl && slidesUrl.includes('docs.google.com/presentation')) {
                log('[App] Prefetching Google Slides resources from activities data');
                
                // Optimize the URL for prefetch
                const url = new URL(slidesUrl);
                url.searchParams.set('rm', 'minimal');
                url.searchParams.set('start', 'false');
                url.searchParams.set('loop', 'false');
                url.searchParams.set('delayms', '60000');
                
                // Create hidden iframe to start loading Google's resources
                const iframe = document.createElement('iframe');
                iframe.src = url.toString();
                iframe.style.cssText = 'position: absolute; width: 1px; height: 1px; left: -9999px; visibility: hidden;';
                iframe.setAttribute('loading', 'eager');
                iframe.setAttribute('aria-hidden', 'true');
                document.body.appendChild(iframe);
                
                // Remove after 30 seconds (enough time to load and cache resources)
                setTimeout(() => {
                    iframe.remove();
                    log('[App] Removed prefetch iframe');
                }, 30000);
            }
            
            // Prefetch YouTube thumbnail
            const videoMatch = mediaContent.match(/<iframe[^>]*src=['"](.*?)['"][^>]*>/i);
            if (videoMatch && videoMatch[1].includes('youtube')) {
                const videoId = videoMatch[1].match(/embed\/([^?]+)/)?.[1];
                if (videoId) {
                    const img = new Image();
                    img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                }
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
                        // CRITICAL: Remove any iframes that might have been added
                        const iframes = element.querySelectorAll('iframe');
                        if (iframes.length > 0) {
                            log(`⚠️ Removing ${iframes.length} iframes from re-rendered ${viewId}`);
                            iframes.forEach(iframe => iframe.remove());
                        }
                        
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
                    // CRITICAL FIX: Remove all iframes from data views to prevent performance issues
                    const iframes = element.querySelectorAll('iframe');
                    if (iframes.length > 0) {
                        log(`⚠️ WARNING: Found ${iframes.length} iframes in ${viewId}, removing to prevent crashes`);
                        iframes.forEach(iframe => {
                            // Log for debugging
                            const src = iframe.src || iframe.dataset.src || '';
                            if (src && src.length > 0) {
                                log(`  Removing iframe: ${src.substring(0, 60)}...`);
                            }
                            // Remove the iframe completely to prevent loading
                            iframe.remove();
                        });
                        log(`✅ Removed ${iframes.length} iframes from ${viewId}`);
                    }
                    
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
            
            // Start performance monitoring
            const startTime = performance.now();
            console.time('VESPADataLoad');
            
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
                
                // End performance monitoring
                console.timeEnd('VESPADataLoad');
                const loadTime = performance.now() - startTime;
                log(`VESPA Activities loaded in ${loadTime.toFixed(2)}ms`);
                
                // Log performance warning if slow
                if (loadTime > 3000) {
                    console.warn(`VESPA Activities load time exceeded 3 seconds (${loadTime.toFixed(2)}ms). Consider caching data locally.`);
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
                console.error('Error stack:', error.stack);
                console.timeEnd('VESPADataLoad'); // End timer even on error
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
                // Log first 5 fields with their values for debugging
                Object.keys(record).slice(0, 10).forEach(key => {
                    log(`Field ${key}:`, record[key]);
                });
                log('Config field mappings:', JSON.stringify(this.config.fields, null, 2));
                
                // Store the full record for cross-referencing with student data
                this.state.vespaScoresRecord = record;
                
                // Parse scores using configured field IDs - with detailed logging
                const visionRaw = record[this.config.fields.visionScore] || record[this.config.fields.visionScore + '_raw'];
                const effortRaw = record[this.config.fields.effortScore] || record[this.config.fields.effortScore + '_raw'];
                const systemsRaw = record[this.config.fields.systemsScore] || record[this.config.fields.systemsScore + '_raw'];
                const practiceRaw = record[this.config.fields.practiceScore] || record[this.config.fields.practiceScore + '_raw'];
                const attitudeRaw = record[this.config.fields.attitudeScore] || record[this.config.fields.attitudeScore + '_raw'];
                
                log('Raw score values:', {
                    vision: visionRaw,
                    effort: effortRaw,
                    systems: systemsRaw,
                    practice: practiceRaw,
                    attitude: attitudeRaw
                });
                
                this.state.vespaScores = {
                    vision: parseInt(visionRaw || 0),
                    effort: parseInt(effortRaw || 0),
                    systems: parseInt(systemsRaw || 0),
                    practice: parseInt(practiceRaw || 0),
                    attitude: parseInt(attitudeRaw || 0)
                };
                
                // Parse the current cycle from Object_10 with detailed logging
                const cycleFieldKey = this.config.fields.currentcycle;
                log('Looking for cycle in field:', cycleFieldKey);
                log('Direct value:', record[cycleFieldKey]);
                log('Raw value:', record[cycleFieldKey + '_raw']);
                
                // Try multiple ways to get the cycle value
                let cycleValue = record[cycleFieldKey];
                if (!cycleValue && record[cycleFieldKey + '_raw']) {
                    cycleValue = record[cycleFieldKey + '_raw'];
                }
                if (!cycleValue) {
                    // Check if it's in a formatted field
                    const formattedKey = cycleFieldKey.replace('field_', 'field_') + '_formatted';
                    cycleValue = record[formattedKey];
                }
                
                this.state.currentCycle = parseInt(cycleValue || 1);
                log('Current cycle from VESPA results:', this.state.currentCycle);
                
                // Parse cycle-specific scores
                this.state.cycleScores = {
                    cycle1: {
                        vision: parseInt(record[this.config.fields.visionc1] || record[this.config.fields.visionc1 + '_raw'] || 0),
                        effort: parseInt(record[this.config.fields.effortc1] || record[this.config.fields.effortc1 + '_raw'] || 0),
                        systems: parseInt(record[this.config.fields.systemsc1] || record[this.config.fields.systemsc1 + '_raw'] || 0),
                        practice: parseInt(record[this.config.fields.practicec1] || record[this.config.fields.practicec1 + '_raw'] || 0),
                        attitude: parseInt(record[this.config.fields.attitudec1] || record[this.config.fields.attitudec1 + '_raw'] || 0)
                    },
                    cycle2: {
                        vision: parseInt(record[this.config.fields.visionc2] || record[this.config.fields.visionc2 + '_raw'] || 0),
                        effort: parseInt(record[this.config.fields.effortc2] || record[this.config.fields.effortc2 + '_raw'] || 0),
                        systems: parseInt(record[this.config.fields.systemsc2] || record[this.config.fields.systemsc2 + '_raw'] || 0),
                        practice: parseInt(record[this.config.fields.practicec2] || record[this.config.fields.practicec2 + '_raw'] || 0),
                        attitude: parseInt(record[this.config.fields.attitudec2] || record[this.config.fields.attitudec2 + '_raw'] || 0)
                    },
                    cycle3: {
                        vision: parseInt(record[this.config.fields.visionc3] || record[this.config.fields.visionc3 + '_raw'] || 0),
                        effort: parseInt(record[this.config.fields.effortc3] || record[this.config.fields.effortc3 + '_raw'] || 0),
                        systems: parseInt(record[this.config.fields.systemsc3] || record[this.config.fields.systemsc3 + '_raw'] || 0),
                        practice: parseInt(record[this.config.fields.practicec3] || record[this.config.fields.practicec3 + '_raw'] || 0),
                        attitude: parseInt(record[this.config.fields.attitudec3] || record[this.config.fields.attitudec3 + '_raw'] || 0)
                    }
                };
                
                log('Parsed VESPA scores:', this.state.vespaScores);
                
                // Log if all scores are still 0
                if (Object.values(this.state.vespaScores).every(score => score === 0)) {
                    log('⚠️ Warning: All scores are 0. Checking field values...');
                    log('Vision field (' + this.config.fields.visionScore + '):', record[this.config.fields.visionScore]);
                    log('Effort field (' + this.config.fields.effortScore + '):', record[this.config.fields.effortScore]);
                    log('Systems field (' + this.config.fields.systemsScore + '):', record[this.config.fields.systemsScore]);
                    log('Practice field (' + this.config.fields.practiceScore + '):', record[this.config.fields.practiceScore]);
                    log('Attitude field (' + this.config.fields.attitudeScore + '):', record[this.config.fields.attitudeScore]);
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
                
                // Get student name - try multiple sources
                // First check if there's a name field in student record (less common)
                let nameField = record.field_187 || record.field_187_raw || null;
                
                // If no name in student record, check VESPA scores record (more common location)
                if (!nameField && this.state.vespaScoresRecord) {
                    nameField = this.state.vespaScoresRecord.field_187_raw || this.state.vespaScoresRecord.field_187;
                    log('Getting name from VESPA scores record:', nameField);
                }
                
                // If still no name field or it's just a string, try Knack user
                if (!nameField || typeof nameField === 'string') {
                    const user = Knack.getUserAttributes();
                    if (user && user.name) {
                        // Parse from Knack user name
                        const nameParts = user.name.split(' ');
                        this.state.studentFirstName = nameParts[0] || 'Student';
                        this.state.studentLastName = nameParts.slice(1).join(' ') || '';
                        this.state.studentName = user.name;
                    } else if (typeof nameField === 'string' && nameField.trim()) {
                        // Use the string value if we have it
                        this.state.studentName = nameField;
                        const nameParts = nameField.split(' ');
                        this.state.studentFirstName = nameParts[0] || 'Student';
                        this.state.studentLastName = nameParts.slice(1).join(' ') || '';
                    } else {
                        this.state.studentName = 'Student';
                        this.state.studentFirstName = 'Student';
                        this.state.studentLastName = '';
                    }
                } else if (typeof nameField === 'object' && (nameField.first || nameField.last)) {
                    // Use the object format if available
                    this.state.studentFirstName = nameField.first || '';
                    this.state.studentLastName = nameField.last || '';
                    this.state.studentName = `${nameField.first || ''} ${nameField.last || ''}`.trim();
                } else {
                    this.state.studentName = 'Student';
                    this.state.studentFirstName = 'Student';
                    this.state.studentLastName = '';
                }
                log('Student name:', this.state.studentName);
                log('First name:', this.state.studentFirstName, 'Last name:', this.state.studentLastName);
                
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
                
                // Parse new user field (field_3655) - Knack boolean field (True/False)
                const newUserField = record[this.config.fields.newUser];
                const newUserFieldRaw = record[this.config.fields.newUser + '_raw'];
                
                // Handle Knack boolean field: False = returning user, True/empty/null = new user
                // Check explicitly for False values (boolean false or string "False")
                const isReturningUser = (newUserField === false || newUserField === 'false' || 
                                        newUserField === 'False' || newUserFieldRaw === false ||
                                        newUserFieldRaw === 'false' || newUserFieldRaw === 'False');
                
                // If not explicitly false, treat as new user
                this.state.isNewUser = !isReturningUser;
                                       
                log('New user field value:', newUserField, 'Raw:', newUserFieldRaw);
                log('Is returning user:', isReturningUser);
                log('Is new user:', this.state.isNewUser);
                
                // Get activity history from field_3656
                this.state.activityHistory = record[this.config.fields.activityHistory] || 
                                            record[this.config.fields.activityHistory + '_raw'] || 
                                            record.field_3656 || 
                                            record.field_3656_raw || '';
                log('Activity history field:', this.state.activityHistory);
                
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
                
                // IMPORTANT: These fields might be in the VESPA scores record, not the student record
                // We'll need to cross-reference with the VESPA scores data
                
                // Parse Year Group (field_144) and Group (field_223) for Object_46 saves
                this.state.yearGroup = record.field_144 || record.field_144_raw || '';
                this.state.group = record.field_223 || record.field_223_raw || '';
                
                // If not found in student record, check if we have them from VESPA scores
                if (!this.state.yearGroup && this.state.vespaScoresRecord) {
                    this.state.yearGroup = this.state.vespaScoresRecord.field_144 || this.state.vespaScoresRecord.field_144_raw || '';
                }
                if (!this.state.group && this.state.vespaScoresRecord) {
                    this.state.group = this.state.vespaScoresRecord.field_223 || this.state.vespaScoresRecord.field_223_raw || '';
                }
                
                log('Year Group (field_144):', this.state.yearGroup);
                log('Group (field_223):', this.state.group);
                
                // Parse VESPA Customer (field_122) - connection to school
                const customerField = record.field_122 || record.field_122_raw || 
                                    (this.state.vespaScoresRecord && (this.state.vespaScoresRecord.field_133 || this.state.vespaScoresRecord.field_133_raw));
                
                if (customerField) {
                    // Extract ID from connection field
                    if (typeof customerField === 'object' && customerField.id) {
                        this.state.vespaCustomerId = customerField.id;
                    } else if (typeof customerField === 'string' && customerField.length === 24) {
                        this.state.vespaCustomerId = customerField;
                    } else if (Array.isArray(customerField) && customerField.length > 0) {
                        this.state.vespaCustomerId = customerField[0].id || customerField[0];
                    }
                }
                log('VESPA Customer ID (field_122/field_133):', this.state.vespaCustomerId);
                
                // Store student name components for field_1875
                // Also check VESPA scores record for name field (field_187)
                if (!nameField.first && !nameField.last && this.state.vespaScoresRecord) {
                    const vespaNameField = this.state.vespaScoresRecord.field_187 || this.state.vespaScoresRecord.field_187_raw || {};
                    if (vespaNameField.first || vespaNameField.last) {
                        nameField = vespaNameField;
                        this.state.studentName = `${vespaNameField.first || ''} ${vespaNameField.last || ''}`.trim();
                    }
                }
                
                this.state.studentFirstName = nameField.first || '';
                this.state.studentLastName = nameField.last || '';
                log('Student name components:', { first: this.state.studentFirstName, last: this.state.studentLastName });
                
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
                        video: attrs.field_1288 || attrs.field_1288_raw || '', // Activity Video/Slides combined field
                        slideshow: attrs.field_1293 || attrs.field_1293_raw || '', // Background Information
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
                
                // Parse dates from Knack format
                const parseKnackDate = (field) => {
                    const rawField = progress[field + '_raw'];
                    if (rawField && rawField.date) {
                        // Knack date format: { date: "MM/DD/YYYY", date_formatted: "MM/DD/YYYY", hours: "12", minutes: "00", am_pm: "AM" }
                        return new Date(rawField.date).toISOString();
                    }
                    // Fallback to regular field if raw is not available
                    const regularField = progress[field];
                    if (regularField) {
                        return new Date(regularField).toISOString();
                    }
                    return null;
                };
                
                return {
                    id: progress.id,
                    activityId: progress[this.config.fields.activity + '_raw']?.[0]?.id || null,
                    activityName: progress[this.config.fields.activity] || '',
                    cycleNumber: parseInt(progress[this.config.fields.cycle] || 0),
                    dateAssigned: parseKnackDate(this.config.fields.dateAssigned),
                    dateStarted: parseKnackDate(this.config.fields.dateStarted),
                    dateCompleted: parseKnackDate(this.config.fields.dateCompleted),
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
                // Make available globally for modal access
                window.vespaProblemMappings = data;
                log('Problem mappings loaded:', this.state.problemMappings);
            } catch (error) {
                console.error('Failed to load problem mappings:', error);
                // Use fallback mappings
                this.state.problemMappings = this.getFallbackProblemMappings();
                window.vespaProblemMappings = { problemMappings: this.state.problemMappings };
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
            
            // Save stats to localStorage for immediate UI updates
            localStorage.setItem('vespa-stats', JSON.stringify(this.state.stats));
            
            log('Calculated stats:', this.state.stats);
            log('Completed activities for points:', this.state.activities.completed);
        }
        
        updateHeaderStats() {
            // Update the header stats display immediately
            const headerStatsContainer = document.querySelector('.header-stats');
            if (headerStatsContainer && this.state.stats) {
                const pointsElement = headerStatsContainer.querySelector('.stat-value');
                const streakElement = headerStatsContainer.querySelectorAll('.stat-value')[1];
                const completedElement = headerStatsContainer.querySelectorAll('.stat-value')[2];
                
                if (pointsElement) pointsElement.textContent = this.state.stats.totalPoints;
                if (streakElement) streakElement.textContent = this.state.stats.currentStreak;
                if (completedElement) completedElement.textContent = this.state.stats.activitiesCompleted;
                
                // Update progress bar
                const progressFill = document.querySelector('.progress-bar-fill');
                if (progressFill && this.state.stats.nextMilestone) {
                    const progressPercent = (this.state.stats.totalPoints / this.state.stats.nextMilestone.points) * 100;
                    progressFill.style.width = `${Math.min(progressPercent, 100)}%`;
                }
                
                // Update progress text
                const progressInfo = document.querySelector('.progress-info');
                if (progressInfo && this.state.stats.nextMilestone) {
                    progressInfo.innerHTML = `
                        <span>Progress to ${this.state.stats.nextMilestone.name}</span>
                        <span>${this.state.stats.totalPoints} / ${this.state.stats.nextMilestone.points}</span>
                    `;
                }
            }
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
            // Add preconnect links for faster loading when user clicks
            this.addPreconnectLinks();
            
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
            
            // Attach event listeners after rendering
            this.attachEventListeners();
            
            // Update header stats after render
            this.updateHeaderStats();
        }
        
        addPreconnectLinks() {
            // Remove any existing preconnect links
            document.querySelectorAll('link[rel="preconnect"]').forEach(link => link.remove());
            
            // Add preconnect for common domains
            const domains = [
                'https://docs.google.com',
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
                'https://img.youtube.com',
                'https://slides.com'
            ];
            
            domains.forEach(domain => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = domain;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            });
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
                            <div class="cycle-display">
                                <span class="cycle-icon">🎯</span>
                                <span>Cycle</span>
                                <span class="cycle-number">${this.state.currentCycle || 1}</span>
                            </div>
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
        
        getScoreRating(score) {
            if (score >= 9) return 'Excellent! 🌟';
            if (score >= 8) return 'Very Good! ✨';
            if (score >= 7) return 'Great! 🎯';
            if (score >= 6) return 'Good Progress 👍';
            if (score >= 5) return 'Solid Foundation 💪';
            if (score >= 4) return 'Developing 📈';
            if (score >= 3) return 'Building Skills 🔨';
            if (score >= 2) return 'Getting Started 🌱';
            return 'Just Beginning 🌰';
        }
        
        getVESPAScoresHTML() {
            // Log the actual scores being used for display
            log('Rendering VESPA scores:', this.state.vespaScores);
            log('Current cycle:', this.state.currentCycle);
            
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
                                <div class="score-card" data-category="${cat}" data-score="${score}">
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
                                        <div class="score-dots" style="color: ${color.primary}">
                                            ${Array.from({length: 10}, (_, i) => 
                                                `<span class="score-dot ${i < score ? 'filled' : ''}"></span>`
                                            ).join('')}
                                        </div>
                                        <div class="score-rating" style="color: ${color.primary}">
                                            ${this.getScoreRating(score)}
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
                        <div class="add-activity-card" onclick="vespaApp.showActivitySearch()">
                            <div class="add-icon">+</div>
                            <p>Add Activity</p>
                        </div>
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
            
            // Define VESPA order
            const vespaOrder = ['vision', 'effort', 'systems', 'practice', 'attitude'];
            
            // Sort categories by VESPA order
            const sortedCategories = Object.entries(activitiesByCategory)
                .sort(([a], [b]) => {
                    const aIndex = vespaOrder.indexOf(a.toLowerCase());
                    const bIndex = vespaOrder.indexOf(b.toLowerCase());
                    return aIndex - bIndex;
                });
            
            return `
                <section class="activities-section">
                    <h2 class="section-title">
                        <span class="title-icon">✨</span>
                        Your Activities
                        <span class="title-badge">${toCompleteCount} to complete | ${completedCount} completed</span>
                    </h2>
                    
                    ${sortedCategories.map(([category, activities]) => {
                        const categoryLower = category.toLowerCase();
                        const categoryColor = this.colors[categoryLower]?.primary || '#666';
                        const backgroundColor = this.colors[categoryLower] ? 
                            `${categoryColor}10` : '#f5f5f5';
                        
                        return `
                            <div class="category-group vespa-${categoryLower}" 
                                 style="border-color: ${categoryColor}; background-color: ${backgroundColor}">
                                <h3 class="category-group-title">
                                    ${this.getCategoryEmoji(category)} ${category.toUpperCase()}
                                </h3>
                                <div class="activities-grid">
                                    ${activities.map((activity, index) => this.getActivityCardHTML(activity, index, true)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </section>
            `;
        }
        
        getActivityCardHTML(activity, index = 0, isPrescribed = false) {
            // Check both server data and local storage for completion status
            const completedActivities = JSON.parse(localStorage.getItem('vespa-completed-activities') || '[]');
            const isCompleted = this.state.finishedActivityIds.includes(activity.id) || 
                              this.state.finishedActivityIds.includes(activity.activityId) ||
                              completedActivities.includes(activity.id);
            const categoryEmoji = this.getCategoryEmoji(activity.category);
            const categoryColor = this.colors[activity.category]?.primary || '#666';
            
            // Extract points based on level (Level 2 = 10, Level 3 = 15 base points)
            const basePoints = activity.level === 'Level 3' ? 15 : 10;
            
            return `
                <div class="activity-card ${isCompleted ? 'completed' : ''} ${isPrescribed ? 'prescribed' : ''}" 
                     data-activity-id="${activity.id}"
                     style="animation-delay: ${index * 0.1}s">
                    <div class="card-glow" style="background: ${categoryColor}"></div>
                    <button class="activity-delete-btn" data-activity-id="${activity.id}" title="Remove activity">×</button>
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
                            (!isPrescribed && !this.state.prescribedActivityIds.includes(activity.id) ? 
                                '<button class="add-to-dashboard-btn" onclick="vespaApp.addActivityToDashboard(\'' + activity.id + '\', \'' + activity.name.replace(/'/g, "\\'") + '\')">+ Add to Dashboard</button>' : '') +
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
            // Get saved achievements from localStorage
            const savedAchievements = JSON.parse(localStorage.getItem('vespa-achievements') || '[]');
            const completedCount = this.state.activities.completed.length;
            
            // Define all possible achievements
            const allAchievements = [
                {
                    id: 'first-steps',
                    title: 'First Steps',
                    description: 'Complete your first activity',
                    icon: '🎯',
                    requirement: 1,
                    type: 'activities'
                },
                {
                    id: 'getting-going',
                    title: 'Getting Going',
                    description: 'Complete 5 activities',
                    icon: '🚀',
                    requirement: 5,
                    type: 'activities'
                },
                {
                    id: 'on-a-roll',
                    title: 'On a Roll',
                    description: 'Complete 10 activities',
                    icon: '🔥',
                    requirement: 10,
                    type: 'activities'
                },
                {
                    id: 'unstoppable',
                    title: 'Unstoppable',
                    description: 'Complete 25 activities',
                    icon: '⭐',
                    requirement: 25,
                    type: 'activities'
                },
                {
                    id: 'vespa-champion',
                    title: 'VESPA Champion',
                    description: 'Complete 50 activities',
                    icon: '🏆',
                    requirement: 50,
                    type: 'activities'
                }
            ];
            
            // Check which achievements are earned
            const earnedAchievements = allAchievements.map(achievement => {
                const isEarned = achievement.type === 'activities' ? 
                    completedCount >= achievement.requirement :
                    savedAchievements.some(saved => saved.type === achievement.id);
                return { ...achievement, earned: isEarned };
            });
            
            const totalEarned = earnedAchievements.filter(a => a.earned).length;
            
            return `
                <div class="achievements-container">
                    <div class="achievements-header">
                        <h2>🏆 Your Achievements</h2>
                        <div class="achievements-summary">
                            <span class="earned-count">${totalEarned}/${allAchievements.length}</span> achievements unlocked
                        </div>
                    </div>
                    
                    <div class="achievements-grid">
                        ${earnedAchievements.map(achievement => `
                            <div class="achievement-card ${achievement.earned ? 'earned' : 'locked'}">
                                <div class="achievement-icon">${achievement.icon}</div>
                                <h3 class="achievement-title">${achievement.title}</h3>
                                <p class="achievement-description">${achievement.description}</p>
                                ${!achievement.earned && achievement.type === 'activities' ? 
                                    `<div class="achievement-progress">
                                        <div class="progress-text">${completedCount}/${achievement.requirement}</div>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${(completedCount / achievement.requirement) * 100}%"></div>
                                        </div>
                                    </div>` : 
                                    (achievement.earned ? '<div class="achievement-status">✓ Unlocked</div>' : '')
                                }
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="achievements-motivational">
                        <p>${completedCount < 5 ? '🌱 Keep going! Your first achievement is just around the corner!' :
                             completedCount < 10 ? '🚀 Great progress! You\'re building momentum!' :
                             completedCount < 25 ? '🔥 You\'re on fire! Keep up the amazing work!' :
                             '⭐ You\'re a VESPA superstar! Incredible dedication!'}</p>
                    </div>
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
            // CRITICAL FIX: Remove existing listeners before adding new ones
            if (this._eventListenerAttached) {
                log('Event listeners already attached, skipping');
                return;
            }
            
            // Clean up any existing listener first (safety check)
            this.removeEventListeners();
            
            // Use event delegation with a single listener
            this._clickHandler = (e) => {
                // Nav items
                if (e.target.closest('.nav-item')) {
                    const view = e.target.closest('.nav-item').dataset.view;
                    this.switchView(view);
                }
                
                // Delete activity
                if (e.target.classList.contains('activity-delete-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const activityId = e.target.dataset.activityId;
                    if (activityId) {
                        this.removeActivityFromDashboard(activityId);
                    }
                }
                
                // Start activity - WITH DEBOUNCE
                if (e.target.closest('.start-activity-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const card = e.target.closest('.activity-card');
                    const activityId = card.dataset.activityId;
                    
                    // Prevent duplicate calls
                    const now = Date.now();
                    if (this._lastActivityStart && 
                        this._lastActivityId === activityId && 
                        (now - this._lastActivityStart) < 1000) {
                        log('Blocked duplicate activity start');
                        return;
                    }
                    
                    this._lastActivityStart = now;
                    this._lastActivityId = activityId;
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
            };
            
            // Attach the click handler
            this.container.addEventListener('click', this._clickHandler);
            
            // Mark as attached to prevent duplicates
            this._eventListenerAttached = true;
            log('Event listeners attached');
        }
        
        removeEventListeners() {
            if (this._clickHandler && this.container) {
                this.container.removeEventListener('click', this._clickHandler);
                this._eventListenerAttached = false;
                log('Event listeners removed');
            }
        }
        
        async removeActivityFromDashboard(activityId) {
            // Remove from prescribed activities
            const index = this.state.prescribedActivityIds.indexOf(activityId);
            if (index > -1) {
                this.state.prescribedActivityIds.splice(index, 1);
                
                // Save updated list to Knack using Knack's built-in method
                try {
                    // Use Knack's built-in update method
                    Knack.showSpinner();
                    
                    $.ajax({
                        type: 'PUT',
                        url: 'https://api.knack.com/v1/objects/object_6/records/' + this.state.studentId,
                        data: { 
                            field_1683: this.state.prescribedActivityIds // Update with remaining activities
                        },
                        headers: {
                            'X-Knack-Application-Id': '5ee90912c38ae7001510c1a9',
                            'X-Knack-REST-API-Key': '8f733aa5-dd35-4464-8348-64824d1f5f0d',
                            'Authorization': Knack.getUserToken()
                        },
                        success: () => {
                            log('Activity removed from Knack:', activityId);
                            Knack.hideSpinner();
                            // Auto-refresh after delete
                            setTimeout(() => {
                                window.location.reload();
                            }, 500);
                        },
                        error: (error) => {
                            console.error('Failed to remove activity from Knack:', error);
                            // Revert the change on error
                            this.state.prescribedActivityIds.splice(index, 0, activityId);
                            Knack.hideSpinner();
                        }
                    });
                } catch (error) {
                    console.error('Unexpected error:', error);
                    Knack.hideSpinner();
                }
                
                // Re-render the dashboard
                this.render();
                
                // Show confirmation message
                this.showMessage('Activity removed from your dashboard', 'success');
            }
        }
        
        switchView(view) {
            // Don't re-render if already on this view
            if (this.state.view === view) {
                log('Already on view:', view);
                return;
            }
            
            this.state.view = view;
            this.render();
            
            // Add view transition animation
            const content = this.container.querySelector('.vespa-content-area');
            if (content) {
                content.classList.add('view-transition');
                setTimeout(() => content.classList.remove('view-transition'), 300);
            }
        }
        
        startActivity(activityId) {
            log(`Starting activity: ${activityId}`);
            
            // CRITICAL FIX: Prevent duplicate activity starts
            if (this._currentActivityRenderer) {
                log('Activity already loading/open, cleaning up first');
                // Clean up existing renderer
                if (this._currentActivityRenderer.stopAutoSave) {
                    this._currentActivityRenderer.stopAutoSave();
                }
                this._currentActivityRenderer = null;
            }
            
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
                    log('Loaded existing responses:', existingResponses);
                } catch (error) {
                    console.error('Error loading existing responses:', error);
                }
                
                // CRITICAL FIX: Only create one renderer
                if (this._currentActivityRenderer) {
                    log('Renderer already exists, skipping duplicate creation');
                    return;
                }
                
                // Create the activity renderer with existing responses
                const renderer = new window.ActivityRenderer(
                    activity,
                    questions,
                    existingResponses, // Pass the actual response record from object_46
                    {
                        ...this.config, // Pass the full config including fields and objects
                        studentId: this.getCurrentStudentId(),
                        yearGroup: this.state.yearGroup,
                        group: this.state.group,
                        vespaCustomerId: this.state.vespaCustomerId,
                        studentFirstName: this.state.studentFirstName,
                        studentLastName: this.state.studentLastName
                    }
                );
                
                // Store reference to current renderer
                this._currentActivityRenderer = renderer;
                
                // Log the config being passed to renderer for debugging
                log('Activity Renderer Config:', {
                    studentId: this.getCurrentStudentId(),
                    yearGroup: this.state.yearGroup,
                    group: this.state.group,
                    vespaCustomerId: this.state.vespaCustomerId,
                    studentFirstName: this.state.studentFirstName,
                    studentLastName: this.state.studentLastName,
                    existingResponseId: existingResponses?.id
                });
                
                // Render the activity
                renderer.render();
                
                // Set up the close callback
                window.vespaApp.onActivityClose = async () => {
                    // CRITICAL FIX: Clean up renderer reference
                    if (this._currentActivityRenderer) {
                        if (this._currentActivityRenderer.stopAutoSave) {
                            this._currentActivityRenderer.stopAutoSave();
                        }
                        this._currentActivityRenderer = null;
                    }
                    
                    // Refresh both student data and activity progress
                    try {
                        // Re-parse student record to get updated finished activities
                        const studentView = Knack.views[this.config.views.studentRecord];
                        if (studentView) {
                            this.parseStudentRecord();
                        }
                        
                        // Re-parse activity progress to get updated completion status
                        const progressView = Knack.views[this.config.views.activityProgress];
                        if (progressView) {
                            this.parseActivityProgress();
                        }
                        
                        // Re-render the current view with updated data
                        const currentView = this.state.currentView || 'dashboard';
                        this.switchView(currentView);
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
            
            // Use the centralized modal system
            this.showModal({
                title: '<span class="rec-icon">💡</span> Recommended Activities',
                subtitle: `For: "${problem.text}"`,
                content: `
                    <div class="modal-activities-grid">
                        ${recommendedActivities.length > 0 ? 
                            recommendedActivities.map((activity, index) => this.getCompactActivityCardHTML(activity, index)).join('') :
                            '<p class="no-recommendations">No specific activities found for this challenge. Try browsing all activities.</p>'
                        }
                    </div>
                `,
                id: 'problem-recommendations-modal'
            });
        }
        
        showActivitiesForCategory(category) {
            // Get activities for this category directly without changing view
            const categoryActivities = this.state.activities.byCategory[category] || [];
            
            // Filter to show both prescribed and non-prescribed activities
            const color = this.colors[category];
            
            // Use the centralized modal system
            this.showModal({
                title: `${this.getCategoryEmoji(category)} ${category.toUpperCase()} Activities`,
                subtitle: `Improve your ${category} skills with these activities`,
                content: `
                    <div class="modal-activities-grid">
                        ${categoryActivities.length > 0 ? 
                            categoryActivities.map((activity, index) => this.getCompactActivityCardHTML(activity, index)).join('') :
                            '<p>No activities found in this category.</p>'
                        }
                    </div>
                `,
                headerColor: color.primary,
                id: 'improve-activities-modal'
            });
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
            
            // Use the centralized modal system
            this.showModal({
                title: `${this.getCategoryEmoji(category)} ${category.toUpperCase()} Activities <span style="font-size: 0.7em; font-weight: normal; margin-left: 10px;">(Additional activities not in your prescribed list)</span>`,
                subtitle: `Explore ${nonPrescribedActivities.length} additional activities in this category`,
                content: `
                    <div class="modal-activities-grid">
                        ${nonPrescribedActivities.length > 0 ? 
                            nonPrescribedActivities.map((activity, index) => this.getCompactActivityCardHTML(activity, index)).join('') :
                            '<p>No additional activities found in this category. All activities in this category are already in your prescribed list.</p>'
                        }
                    </div>
                `,
                headerColor: color.primary,
                id: 'category-activities-modal'
            });
        }
        
        getCompactActivityCardHTML(activity, index = 0) {
            // Check both server data and local storage for completion status
            const completedActivities = JSON.parse(localStorage.getItem('vespa-completed-activities') || '[]');
            const isCompleted = this.state.finishedActivityIds.includes(activity.id) || 
                              this.state.finishedActivityIds.includes(activity.activityId) ||
                              completedActivities.includes(activity.id);
            const categoryColor = this.colors[activity.category]?.primary || '#666';
            const basePoints = activity.level === 'Level 3' ? 15 : 10;
            
            // Check if activity is already prescribed
            const isPrescribed = this.state.prescribedActivityIds.includes(activity.id) || 
                               this.state.prescribedActivityIds.includes(activity.activityId);
            
            return `
                <div class="compact-activity-card ${isCompleted ? 'completed' : ''} ${isPrescribed ? 'prescribed' : ''}" 
                     data-activity-id="${activity.id}"
                     style="animation-delay: ${index * 0.05}s">
                    <div class="compact-card-header">
                        <span class="compact-level">${activity.level}</span>
                        <span class="compact-points">+${basePoints}</span>
                        ${!isPrescribed && !isCompleted ? 
                            `<button class="compact-add-btn" onclick="vespaApp.addActivityToDashboard('${activity.id}', '${activity.name.replace(/'/g, "\\'")}'); event.stopPropagation();" title="Add to dashboard">+</button>` : 
                            ''
                        }
                    </div>
                    <h4 class="compact-activity-name">${activity.name}</h4>
                    <div class="compact-card-footer">
                        ${isCompleted ? 
                            '<span class="compact-completed">✓ Completed</span>' :
                            isPrescribed ? 
                                '<span class="compact-prescribed">📋 In Dashboard</span>' :
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
        
        showModal(options) {
            const {
                title = 'Information',
                subtitle = '',
                content = '',
                headerColor = '#17bdc2',
                id = 'app-modal',
                onClose = null
            } = options;
            
            // Remove any existing modal with the same ID
            const existingModal = document.getElementById(id);
            if (existingModal) {
                existingModal.remove();
            }
            
            // Create modal element
            const modal = document.createElement('div');
            modal.id = id;
            modal.className = 'activities-modal-overlay';
            modal.innerHTML = `
                <div class="activities-modal">
                    <div class="modal-header" style="background: ${headerColor}">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close-btn" data-action="close">
                            <span>×</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${subtitle ? `<p class="modal-subtitle">${subtitle}</p>` : ''}
                        ${content}
                    </div>
                </div>
            `;
            
            // Add to body and prevent scroll
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            
            // Close function
            const closeModal = () => {
                if (modal && modal.parentNode) {
                    modal.remove();
                }
                // Only restore body scroll if no other modals are open
                const remainingModals = document.querySelectorAll('.activities-modal-overlay');
                if (remainingModals.length === 0) {
                    document.body.style.overflow = '';
                }
                if (onClose) onClose();
            };
            
            // Event listeners
            modal.addEventListener('click', (e) => {
                // Close on overlay click or close button click
                if (e.target === modal || e.target.closest('[data-action="close"]')) {
                    closeModal();
                }
            });
            
            // Escape key handler
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
            // Ensure modal is centered
            modal.querySelector('.activities-modal').scrollTop = 0;
            
            return { close: closeModal };
        }
        
        showMessage(text, type = 'info') {
            // Will implement toast notifications
            log(`[${type}] ${text}`);
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
        
        async showWelcomeModal() {
            log('Showing welcome modal for new user');
            
            // Get the student's first name - prefer state over user attributes
            let firstName = 'Student';
            if (this.state.studentFirstName) {
                firstName = this.state.studentFirstName;
            } else if (this.state.studentName && this.state.studentName !== 'Student') {
                firstName = this.state.studentName.split(' ')[0];
            } else {
                // Fallback to Knack user attributes
                const user = Knack.getUserAttributes();
                if (user?.name) {
                    firstName = user.name.split(' ')[0];
                }
            }
            
            log('Student first name for modal:', firstName);
            log('Student state:', {
                studentFirstName: this.state.studentFirstName,
                studentName: this.state.studentName,
                currentCycle: this.state.currentCycle
            });
            
            // Create modal overlay
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'vespa-welcome-modal-overlay';
            modalOverlay.innerHTML = `
                <div class="vespa-welcome-modal">
                    <div class="welcome-modal-header">
                        <h2>Welcome to VESPA Activities!</h2>
                        <span class="welcome-modal-close">&times;</span>
                    </div>
                    <div class="welcome-modal-body">
                        <div class="welcome-modal-icon">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                                      fill="#f4d03f" stroke="#f4d03f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3>Hello ${firstName}!</h3>
                        <p>We're excited to have you start your VESPA journey!</p>
                        
                        <div class="welcome-features-compact">
                            <div class="welcome-feature-compact">
                                <span class="feature-icon">📚</span>
                                <span><strong>Personalised Activities</strong> tailored to improve your VESPA scores</span>
                            </div>
                            <div class="welcome-feature-compact">
                                <span class="feature-icon">📊</span>
                                <span><strong>Track Your Progress</strong> across Vision, Effort, Systems, Practice, and Attitude</span>
                            </div>
                            <div class="welcome-feature-compact">
                                <span class="feature-icon">🏆</span>
                                <span><strong>Earn Achievements</strong> and unlock badges as you complete activities</span>
                            </div>
                        </div>
                        
                        <div class="welcome-current-cycle">
                            <p>You're currently in <strong>Cycle ${this.state.currentCycle || 1}</strong> of your VESPA journey.</p>
                        </div>
                        
                        <button class="welcome-modal-button">Get Started!</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalOverlay);
            
            // Add animation class after a small delay
            setTimeout(() => {
                modalOverlay.classList.add('show');
            }, 10);
            
            // Handle modal close
            const closeModal = async () => {
                modalOverlay.classList.remove('show');
                setTimeout(() => {
                    modalOverlay.remove();
                }, 300);
                
                // Update the newUser field to "Yes"
                await this.updateNewUserStatus();
            };
            
            // Close button click
            modalOverlay.querySelector('.welcome-modal-close').addEventListener('click', closeModal);
            
            // Get Started button click
            modalOverlay.querySelector('.welcome-modal-button').addEventListener('click', closeModal);
            
            // Close on overlay click
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    closeModal();
                }
            });
        }
        
        // ============================================
        // ACTIVITY PRESCRIPTION SYSTEM
        // ============================================
        
        /**
         * Calculate prescribed activities based on VESPA scores and thresholds
         * @param {number} cycleNumber - Current cycle (1, 2, or 3)
         * @returns {Array} Array of activity names to prescribe
         */
        calculatePrescribedActivities(cycleNumber = null) {
            const cycle = cycleNumber || this.state.currentCycle || 1;
            log('Calculating prescribed activities for cycle:', cycle);
            
            // Get the appropriate scores for this cycle
            const scores = this.getCycleScores(cycle);
            log('Using scores for prescription:', scores);
            
            // Get activity history to avoid repeats
            const history = this.getActivityHistory();
            const previouslyPrescribed = history[`cycle${cycle - 1}`]?.prescribed || [];
            
            // Load activities from the JSON data (it's an object, not array)
            const activitiesData = window.vespaActivitiesData || {};
            const allActivities = Object.values(activitiesData);
            
            // Group activities by category and filter by thresholds
            const categorizedActivities = {
                vision: [],
                effort: [],
                systems: [],
                practice: [],
                attitude: []
            };
            
            // Filter activities based on thresholds
            allActivities.forEach(activity => {
                if (!activity.category || !activity.thresholds) return;
                
                const category = activity.category.toLowerCase();
                const score = scores[category];
                
                if (score >= activity.thresholds.lower && 
                    score <= activity.thresholds.upper) {
                    
                    // Check if it was prescribed in previous cycle
                    const wasPreviouslyPrescribed = previouslyPrescribed.includes(activity.name);
                    
                    categorizedActivities[category].push({
                        ...activity,
                        wasPreviouslyPrescribed,
                        priority: wasPreviouslyPrescribed ? 2 : 1 // Prioritize new activities
                    });
                }
            });
            
            // Select 2 activities per category (max 10 total)
            const prescribed = [];
            
            Object.keys(categorizedActivities).forEach(category => {
                const activities = categorizedActivities[category];
                
                // Sort by priority (new activities first) and shuffle within priority groups
                activities.sort((a, b) => {
                    if (a.priority !== b.priority) return a.priority - b.priority;
                    return Math.random() - 0.5; // Randomize within same priority
                });
                
                // Take up to 2 activities
                const selected = activities.slice(0, 2);
                // Store both record_id (Knack ID) and name for each activity
                prescribed.push(...selected.map(a => ({
                    id: a.record_id || a.id,  // Use record_id for Knack, fallback to id
                    name: a.name
                })));
            });
            
            log('Prescribed activities:', prescribed);
            return prescribed;
        }
        
        /**
         * Get scores for a specific cycle
         */
        getCycleScores(cycleNumber) {
            // Always use the current VESPA scores
            // The current scores ARE the scores for the current cycle
            return this.state.vespaScores || {
                vision: 0,
                effort: 0,
                systems: 0,
                practice: 0,
                attitude: 0
            }
        }
        
        /**
         * Get and parse activity history from field_3656
         */
        getActivityHistory() {
            try {
                const historyField = this.state.activityHistory;
                if (historyField && typeof historyField === 'string') {
                    return JSON.parse(historyField);
                }
            } catch (e) {
                log('Error parsing activity history:', e);
            }
            return {
                cycle1: { prescribed: [], selected: [], completed: [] },
                cycle2: { prescribed: [], selected: [], completed: [] },
                cycle3: { prescribed: [], selected: [], completed: [] }
            };
        }
        
        /**
         * Save activity history to field_3656
         */
        async saveActivityHistory(history) {
            try {
                const historyString = JSON.stringify(history);
                
                // Update in Knack using proper API endpoint
                await $.ajax({
                    type: 'PUT',
                    url: 'https://api.knack.com/v1/objects/object_6/records/' + this.state.studentId,
                    data: JSON.stringify({ field_3656: historyString }),
                    headers: {
                        'X-Knack-Application-Id': '5ee90912c38ae7001510c1a9',
                        'X-Knack-REST-API-Key': '8f733aa5-dd35-4464-8348-64824d1f5f0d',
                        'Content-Type': 'application/json'
                    }
                });
                
                // Update local state
                this.state.activityHistory = historyString;
                log('Activity history saved:', history);
            } catch (error) {
                console.error('Failed to save activity history:', error);
            }
        }
        
        /**
         * Check and update prescribed activities if needed
         */
        async checkAndUpdatePrescribedActivities() {
            const prescribedField = this.state.prescribedActivityIds;
            
            // If no activities prescribed yet, calculate and save them
            if (!prescribedField || prescribedField.length === 0) {
                log('No prescribed activities found, calculating...');
                
                // calculatePrescribedActivities now returns objects with {id, name}
                const prescribedActivities = this.calculatePrescribedActivities();
                
                // Extract just the IDs for saving to Knack
                const activityIds = prescribedActivities.map(a => a.id);
                const activityNames = prescribedActivities.map(a => a.name);
                
                // Save to Knack field_1683 (connection field needs IDs)
                if (activityIds.length > 0) {
                    try {
                        // Use Knack's API endpoint with proper format
                        await $.ajax({
                            type: 'PUT',
                            url: 'https://api.knack.com/v1/objects/object_6/records/' + this.state.studentId,
                            data: JSON.stringify({ 
                                field_1683: activityIds  // Array of record IDs for connection field
                            }),
                            headers: {
                                'X-Knack-Application-Id': '5ee90912c38ae7001510c1a9',
                                'X-Knack-REST-API-Key': '8f733aa5-dd35-4464-8348-64824d1f5f0d',
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        // Update local state
                        this.state.prescribedActivityIds = activityIds;
                        log('Auto-prescribed activities saved to Knack:', activityIds);
                    } catch (error) {
                        console.error('Failed to save prescribed activities:', error);
                    }
                }
                
                // Update history
                const history = this.getActivityHistory();
                history[`cycle${this.state.currentCycle}`] = {
                    ...history[`cycle${this.state.currentCycle}`],
                    prescribed: activityNames,
                    prescribedIds: activityIds,
                    timestamp: new Date().toISOString()
                };
                
                await this.saveActivityHistory(history);
                
                return activityNames;  // Return names for display
            }
            
            // Convert IDs back to names for display
            const activityNames = [];
            prescribedField.forEach(activityId => {
                const activity = this.state.activities.all.find(a => a.id === activityId);
                if (activity) {
                    activityNames.push(activity.name);
                }
            });
            
            return activityNames;
        }
        
        /**
         * Show comprehensive welcome modal for brand new users
         */
        async showNewUserWelcome() {
            log('Showing comprehensive welcome for new user');
            
            const firstName = this.state.studentFirstName || 'Student';
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'vespa-welcome-modal-overlay new-user-welcome show';
            
            modalOverlay.innerHTML = `
                <div class="welcome-modal-backdrop"></div>
                <div class="welcome-modal-content large-modal">
                    <button class="welcome-modal-close">&times;</button>
                    <div class="welcome-header">
                        <h1>Welcome to VESPA Activities, ${firstName}! 🎉</h1>
                        <p class="subtitle">Your personalized learning journey starts here</p>
                    </div>
                    
                    <div class="welcome-sections">
                        <div class="welcome-section">
                            <div class="section-icon">🎯</div>
                            <h3>Smart Activity Suggestions</h3>
                            <p>Based on your VESPA scores, we've calculated the perfect activities to help you improve in areas where you need it most.</p>
                        </div>
                        
                        <div class="welcome-section">
                            <div class="section-icon">🔍</div>
                            <h3>Add Your Own Activities</h3>
                            <p>Facing a specific challenge? You can search and add activities based on problems you're experiencing with your studies.</p>
                        </div>
                        
                        <div class="welcome-section">
                            <div class="section-icon">👨‍🏫</div>
                            <h3>Teacher Recommendations</h3>
                            <p>Your teachers and tutors can also add activities to your portal to support your specific learning needs.</p>
                        </div>
                    </div>
                    
                    <div class="welcome-features">
                        <h3>How It Works:</h3>
                        <div class="how-it-works-grid">
                            <div class="how-it-works-item">
                                <span class="step-number">1</span>
                                <span>Complete activities to earn points and track progress</span>
                            </div>
                            <div class="how-it-works-item">
                                <span class="step-number">2</span>
                                <span>Reflect on your learning after each activity</span>
                            </div>
                            <div class="how-it-works-item">
                                <span class="step-number">3</span>
                                <span>Watch your VESPA scores improve over time</span>
                            </div>
                            <div class="how-it-works-item">
                                <span class="step-number">4</span>
                                <span>Unlock achievements and reach milestones</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="welcome-footer">
                        <button class="welcome-start-btn">Get Started with Your Activities</button>
                        <p class="welcome-note">We'll help you choose your first activities next</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalOverlay);
            
            // Event handlers
            const closeAndContinue = async () => {
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
                // Now show the activity selection journey
                await this.showWelcomeJourney();
            };
            
            modalOverlay.querySelector('.welcome-modal-close').addEventListener('click', closeAndContinue);
            modalOverlay.querySelector('.welcome-start-btn').addEventListener('click', closeAndContinue);
        }
        
        /**
         * Show modal for cycle changes
         */
        async showCycleChangeModal() {
            log('Showing cycle change modal');
            
            const firstName = this.state.studentFirstName || 'Student';
            const currentCycle = this.state.currentCycle || 1;
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'vespa-welcome-modal-overlay cycle-change show';
            
            modalOverlay.innerHTML = `
                <div class="welcome-modal-content">
                    <button class="welcome-modal-close">&times;</button>
                    <div class="cycle-icon">🔄</div>
                    <h2>Welcome to Cycle ${currentCycle}, ${firstName}!</h2>
                    <p class="cycle-message">A new cycle means fresh opportunities and new activities tailored to your progress.</p>
                    
                    <div class="cycle-info">
                        <div class="info-item">
                            <span class="info-icon">📊</span>
                            <p>Your VESPA scores have been updated</p>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">🎯</span>
                            <p>New activities have been selected for you</p>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">✨</span>
                            <p>You can customize your selection as always</p>
                        </div>
                    </div>
                    
                    <div class="modal-buttons">
                        <button class="continue-btn">Continue to Dashboard</button>
                        <button class="customize-btn">Customize Activities</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalOverlay);
            
            // Event handlers
            modalOverlay.querySelector('.welcome-modal-close').addEventListener('click', () => {
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
            });
            
            modalOverlay.querySelector('.continue-btn').addEventListener('click', () => {
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
            });
            
            modalOverlay.querySelector('.customize-btn').addEventListener('click', async () => {
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
                // Show the journey modal for activity selection
                await this.showWelcomeJourney();
            });
        }
        
        /**
         * Show motivational modal for returning users
         */
        async showMotivationalModal() {
            log('Showing motivational modal for returning user');
            
            const firstName = this.state.studentFirstName || 'Student';
            const stats = this.state.stats || {};
            
            // Array of motivational messages
            const messages = [
                {
                    emoji: '🚀',
                    title: `Welcome back, ${firstName}!`,
                    message: 'Ready to continue your learning journey?',
                    stat: stats.totalPoints ? `You've earned ${stats.totalPoints} points so far!` : null
                },
                {
                    emoji: '⭐',
                    title: `Great to see you, ${firstName}!`,
                    message: 'Every activity completed is a step forward.',
                    stat: stats.currentStreak ? `${stats.currentStreak} day streak! Keep it up!` : null
                },
                {
                    emoji: '💪',
                    title: `You're doing great, ${firstName}!`,
                    message: 'Consistency is the key to success.',
                    stat: stats.activitiesCompleted ? `${stats.activitiesCompleted} activities completed!` : null
                },
                {
                    emoji: '🎯',
                    title: `Focus time, ${firstName}!`,
                    message: 'Small steps lead to big achievements.',
                    stat: stats.nextMilestone ? `Only ${stats.nextMilestone.points - stats.totalPoints} points to ${stats.nextMilestone.name}!` : null
                },
                {
                    emoji: '📚',
                    title: `Learning mode: ON`,
                    message: 'Your future self will thank you for this.',
                    stat: null
                }
            ];
            
            // Pick a random message
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'vespa-motivational-modal show';
            
            modalOverlay.innerHTML = `
                <div class="motivational-content">
                    <button class="motivational-close">&times;</button>
                    <div class="motivational-emoji">${randomMessage.emoji}</div>
                    <h3>${randomMessage.title}</h3>
                    <p>${randomMessage.message}</p>
                    ${randomMessage.stat ? `<p class="motivational-stat">${randomMessage.stat}</p>` : ''}
                    <div class="motivational-actions">
                        <button class="continue-btn">Continue</button>
                        <button class="update-activities-btn">Update Activities</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modalOverlay);
            
            // Auto-close after 5 seconds
            const autoCloseTimer = setTimeout(() => {
                if (document.body.contains(modalOverlay)) {
                    modalOverlay.classList.remove('show');
                    setTimeout(() => modalOverlay.remove(), 300);
                }
            }, 5000);
            
            // Event handlers
            const closeModal = () => {
                clearTimeout(autoCloseTimer);
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
            };
            
            modalOverlay.querySelector('.motivational-close').addEventListener('click', closeModal);
            modalOverlay.querySelector('.continue-btn').addEventListener('click', closeModal);
            
            modalOverlay.querySelector('.update-activities-btn').addEventListener('click', async () => {
                clearTimeout(autoCloseTimer);
                modalOverlay.classList.remove('show');
                setTimeout(() => modalOverlay.remove(), 300);
                // Show the journey modal for activity selection
                await this.showWelcomeJourney();
            });
        }
        
        /**
         * Show enhanced welcome journey modal (for activity selection)
         */
        async showWelcomeJourney() {
            log('Starting welcome journey for user');
            
            const firstName = this.state.studentFirstName || 'Student';
            const currentCycle = this.state.currentCycle || 1;
            let currentStep = 1;
            const totalSteps = 4;
            
            // Get prescribed activities
            const prescribedActivities = await this.checkAndUpdatePrescribedActivities();
            let selectedActivities = [...prescribedActivities];
            
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'vespa-welcome-modal-overlay journey-modal';
            
            const renderStep = () => {
                let content = '';
                
                switch(currentStep) {
                    case 1: // Welcome & Score Breakdown
                        content = `
                            <div class="journey-step step-1">
                                <div class="journey-header">
                                    <h2>Let's Review Your VESPA Scores</h2>
                                    <span class="journey-close">&times;</span>
                                </div>
                                <div class="journey-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(currentStep/totalSteps)*100}%"></div>
                                    </div>
                                    <span class="progress-text">Step ${currentStep} of ${totalSteps}</span>
                                </div>
                                <div class="journey-content">
                                    <div class="welcome-animation">
                                        <span class="big-emoji">📊</span>
                                    </div>
                                    <h3>Hello ${firstName}!</h3>
                                    <p class="journey-description">Based on your questionnaire responses, we've calculated your scores across five key learning dimensions. These scores help us recommend the perfect activities to boost your academic performance.</p>
                                    
                                    <div class="scores-breakdown">
                                        <h4>Your Current Scores (Cycle ${currentCycle})</h4>
                                        <div class="score-bars">
                                            <div class="score-bar">
                                                <span class="score-label">👁️ Vision</span>
                                                <div class="score-progress">
                                                    <div class="score-fill vision" style="width: ${this.state.vespaScores.vision * 10}%">
                                                        <span class="score-text">${this.state.vespaScores.vision}/10</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="score-bar">
                                                <span class="score-label">💪 Effort</span>
                                                <div class="score-progress">
                                                    <div class="score-fill effort" style="width: ${this.state.vespaScores.effort * 10}%">
                                                        <span class="score-text">${this.state.vespaScores.effort}/10</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="score-bar">
                                                <span class="score-label">⚙️ Systems</span>
                                                <div class="score-progress">
                                                    <div class="score-fill systems" style="width: ${this.state.vespaScores.systems * 10}%">
                                                        <span class="score-text">${this.state.vespaScores.systems}/10</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="score-bar">
                                                <span class="score-label">🎯 Practice</span>
                                                <div class="score-progress">
                                                    <div class="score-fill practice" style="width: ${this.state.vespaScores.practice * 10}%">
                                                        <span class="score-text">${this.state.vespaScores.practice}/10</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="score-bar">
                                                <span class="score-label">🧠 Attitude</span>
                                                <div class="score-progress">
                                                    <div class="score-fill attitude" style="width: ${this.state.vespaScores.attitude * 10}%">
                                                        <span class="score-text">${this.state.vespaScores.attitude}/10</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="score-guide">
                                        <h5>📊 What do these scores mean?</h5>
                                        <div class="score-ranges">
                                            <span class="range-low"><strong>1-3:</strong> Focus area</span>
                                            <span class="range-mid"><strong>4-6:</strong> Developing</span>
                                            <span class="range-high"><strong>7-10:</strong> Strong</span>
                                        </div>
                                    </div>
                                    
                                    <button class="journey-next-btn">See Your Recommended Activities →</button>
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 2: // VESPA Elves Prescription
                        // Ensure we have activities to show
                        if (selectedActivities.length === 0) {
                            // Calculate activities if none prescribed
                            selectedActivities = this.calculatePrescribedActivities();
                        }
                        
                        content = `
                            <div class="journey-step step-2">
                                <div class="journey-header">
                                    <h2>The VESPA Elves Have Been Busy! 🧚‍♂️</h2>
                                    <span class="journey-close">&times;</span>
                                </div>
                                <div class="journey-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(currentStep/totalSteps)*100}%"></div>
                                    </div>
                                    <span class="progress-text">Step ${currentStep} of ${totalSteps}</span>
                                </div>
                                <div class="journey-content">
                                    <div class="elves-message">
                                        <p>Based on your scores, our VESPA elves have carefully selected activities to help you improve!</p>
                                        <p class="note">⚠️ Note: Your tutor may also add or change activities throughout your journey.</p>
                                    </div>
                                    
                                    <div class="prescribed-activities">
                                        <h4>Your Prescribed Activities</h4>
                                        ${selectedActivities.length > 0 ? `
                                            <div class="activity-list categorized">
                                                ${this.renderCategorizedActivities(selectedActivities)}
                                            </div>
                                        ` : `
                                            <p style="text-align: center; padding: 20px; color: #666;">
                                                No activities available for your current scores. Try selecting from problems in the next step!
                                            </p>
                                        `}
                                    </div>
                                    
                                    <div class="journey-buttons">
                                        <button class="journey-back-btn">← Back</button>
                                        <button class="journey-finish-btn">Keep These → Start</button>
                                        <button class="journey-next-btn">Select Your Own Activities →</button>
                                    </div>
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 3: // Problem-Based Selection
                        content = `
                            <div class="journey-step step-3">
                                <div class="journey-header">
                                    <h2>Any Specific Challenges? 🎯</h2>
                                    <span class="journey-close">&times;</span>
                                </div>
                                <div class="journey-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(currentStep/totalSteps)*100}%"></div>
                                    </div>
                                    <span class="progress-text">Step ${currentStep} of ${totalSteps}</span>
                                </div>
                                <div class="journey-content">
                                    <p style="margin-bottom: 20px; color: #555;">Select challenges you're facing to get targeted activities:</p>
                                    
                                    <div class="problem-categories enhanced" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                                        ${this.renderProblemSelectors()}
                                    </div>
                                    
                                    <div class="selected-count" style="text-align: center; margin: 15px 0; padding: 10px; background: #f0f4f8; border-radius: 8px;">
                                        <div style="font-size: 14px; color: #666;">
                                            <span id="problemCount">0</span> problems selected
                                        </div>
                                        <div style="font-size: 18px; font-weight: 600; color: #333; margin-top: 5px;">
                                            <span id="activityCount">0</span> activities will be added
                                        </div>
                                    </div>
                                    
                                    <div class="journey-buttons">
                                        <button class="journey-back-btn">← Back</button>
                                        <button class="journey-skip-btn">Skip</button>
                                        <button class="journey-next-btn">Add Selected →</button>
                                    </div>
                                </div>
                            </div>
                        `;
                        break;
                        
                    case 4: // Summary & Start
                        content = `
                            <div class="journey-step step-4">
                                <div class="journey-header">
                                    <h2>Your Learning Path is Ready! 🎉</h2>
                                    <span class="journey-close">&times;</span>
                                </div>
                                <div class="journey-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(currentStep/totalSteps)*100}%"></div>
                                    </div>
                                    <span class="progress-text">Step ${currentStep} of ${totalSteps}</span>
                                </div>
                                <div class="journey-content">
                                    <div class="success-animation">
                                        <span class="big-emoji">🚀</span>
                                    </div>
                                    
                                    <div class="journey-summary">
                                        <h4>You're all set for Cycle ${currentCycle}!</h4>
                                        <div class="summary-stats">
                                            <div class="stat-item">
                                                <span class="stat-number">${selectedActivities.length}</span>
                                                <span class="stat-label">Activities Selected</span>
                                            </div>
                                            <div class="stat-item">
                                                <span class="stat-number">~${selectedActivities.length * 20}</span>
                                                <span class="stat-label">Minutes of Learning</span>
                                            </div>
                                        </div>
                                        
                                        <p class="motivational-message">
                                            Remember: Small steps lead to big changes. You've got this! 💪
                                        </p>
                                    </div>
                                    
                                    <button class="journey-finish-btn">Start My Journey! →</button>
                                </div>
                            </div>
                        `;
                        break;
                }
                
                modalOverlay.innerHTML = `<div class="vespa-journey-modal">${content}</div>`;
            };
            
            // Initial render
            renderStep();
            document.body.appendChild(modalOverlay);
            
            // Add animation
            setTimeout(() => modalOverlay.classList.add('show'), 10);
            
            // Event delegation for modal interactions
            modalOverlay.addEventListener('click', async (e) => {
                if (e.target.classList.contains('journey-close')) {
                    modalOverlay.classList.remove('show');
                    setTimeout(() => modalOverlay.remove(), 300);
                    await this.updateNewUserStatus();
                }
                
                if (e.target.classList.contains('journey-next-btn')) {
                    if (currentStep === 2) {
                        // From step 2, go to problem selection
                        currentStep = 3;
                        renderStep();
                    } else if (currentStep === 3) {
                        // From step 3, add selected problem activities
                        const checkedBoxes = modalOverlay.querySelectorAll('.problem-checkbox:checked');
                        checkedBoxes.forEach(checkbox => {
                            const activities = JSON.parse(checkbox.dataset.activities || '[]');
                            activities.forEach(actName => {
                                if (!selectedActivities.includes(actName)) {
                                    selectedActivities.push(actName);
                                }
                            });
                        });
                        log('Activities after problem selection:', selectedActivities);
                        currentStep = 4;
                        renderStep();
                    } else if (currentStep < totalSteps) {
                        currentStep++;
                        renderStep();
                    }
                }
                
                if (e.target.classList.contains('journey-back-btn')) {
                    if (currentStep > 1) {
                        currentStep--;
                        renderStep();
                    }
                }
                
                if (e.target.classList.contains('journey-skip-btn')) {
                    currentStep = 4;
                    renderStep();
                }
                
                if (e.target.classList.contains('journey-finish-btn')) {
                    modalOverlay.classList.remove('show');
                    setTimeout(() => modalOverlay.remove(), 300);
                    
                    // Get activity IDs from names
                    const activityIds = [];
                    selectedActivities.forEach(activityName => {
                        const activity = this.state.activities.all.find(a => a.name === activityName);
                        if (activity) {
                            activityIds.push(activity.id);
                        }
                    });
                    
                    // Save to prescribed activities field (field_1683) in Knack
                    if (activityIds.length > 0) {
                        try {
                            // Use Knack's API endpoint with proper format
                            await $.ajax({
                                type: 'PUT',
                                url: 'https://api.knack.com/v1/objects/object_6/records/' + this.state.studentId,
                                data: JSON.stringify({ 
                                    field_1683: activityIds // Array of record IDs for connection field
                                }),
                                headers: {
                                    'X-Knack-Application-Id': '5ee90912c38ae7001510c1a9',
                                    'X-Knack-REST-API-Key': '8f733aa5-dd35-4464-8348-64824d1f5f0d',
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            // Update local state
                            this.state.prescribedActivityIds = activityIds;
                            log('Prescribed activities saved to Knack:', activityIds);
                            
                            // Show success message
                            this.showNotification(`Successfully added ${activityIds.length} activities to your dashboard!`, 'success');
                        } catch (error) {
                            console.error('Failed to save prescribed activities:', error);
                            this.showNotification('Failed to save activities. Please try again.', 'error');
                        }
                    }
                    
                    // Save to history
                    const history = this.getActivityHistory();
                    history[`cycle${this.state.currentCycle}`] = {
                        ...history[`cycle${this.state.currentCycle}`],
                        selected: selectedActivities,
                        selectedIds: activityIds,
                        timestamp: new Date().toISOString()
                    };
                    await this.saveActivityHistory(history);
                    await this.updateNewUserStatus();
                    
                    // Refresh the page to show updated dashboard
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
                
                if (e.target.classList.contains('swap-btn')) {
                    // Handle activity swapping
                    const index = parseInt(e.target.parentElement.dataset.index);
                    this.showActivitySwapModal(index, selectedActivities);
                }
            });
            
            // Handle checkbox selection and activity counting
            modalOverlay.addEventListener('change', (e) => {
                if (e.target.classList.contains('problem-checkbox')) {
                    const checkedBoxes = modalOverlay.querySelectorAll('.problem-checkbox:checked');
                    const problemCountElement = modalOverlay.querySelector('#problemCount');
                    const activityCountElement = modalOverlay.querySelector('#activityCount');
                    
                    // Update problem count
                    if (problemCountElement) {
                        problemCountElement.textContent = checkedBoxes.length;
                    }
                    
                    // Calculate total unique activities
                    const allActivities = new Set();
                    checkedBoxes.forEach(checkbox => {
                        const activities = JSON.parse(checkbox.dataset.activities || '[]');
                        activities.forEach(activity => allActivities.add(activity));
                    });
                    
                    // Update activity count
                    if (activityCountElement) {
                        activityCountElement.textContent = allActivities.size;
                        // Add animation effect
                        activityCountElement.style.transform = 'scale(1.2)';
                        setTimeout(() => {
                            activityCountElement.style.transform = 'scale(1)';
                        }, 200);
                    }
                    
                    // Visual feedback for selected items
                    if (e.target.checked) {
                        e.target.parentElement.style.background = '#e8f4fd';
                    } else {
                        e.target.parentElement.style.background = '';
                    }
                }
            });
            
            // Handle activity info popup
            modalOverlay.addEventListener('click', (e) => {
                if (e.target.classList.contains('activity-info-trigger')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const activities = JSON.parse(e.target.dataset.activities || '[]');
                    
                    // Create popup
                    const popup = document.createElement('div');
                    popup.className = 'activity-info-popup';
                    popup.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        z-index: 10001;
                        max-width: 400px;
                        max-height: 400px;
                        overflow-y: auto;
                    `;
                    
                    popup.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4 style="margin: 0; color: #333;">Activities for this problem</h4>
                            <button style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;" onclick="this.parentElement.parentElement.remove()">✕</button>
                        </div>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            ${activities.map((activity, idx) => `
                                <li style="padding: 8px 0; border-bottom: 1px solid #eee; color: #555;">
                                    <span style="color: #7f31a4; font-weight: bold;">${idx + 1}.</span> ${activity}
                                </li>
                            `).join('')}
                        </ul>
                        ${activities.length === 0 ? '<p style="color: #999; text-align: center;">No activities available</p>' : ''}
                    `;
                    
                    document.body.appendChild(popup);
                    
                    // Remove popup when clicking outside
                    setTimeout(() => {
                        const removePopup = (evt) => {
                            if (!popup.contains(evt.target)) {
                                popup.remove();
                                document.removeEventListener('click', removePopup);
                            }
                        };
                        document.addEventListener('click', removePopup);
                    }, 100);
                }
            });
        }
        
        /**
         * Render categorized activities for the welcome journey
         */
        renderCategorizedActivities(activityNames) {
            // Group activities by category
            const categorized = {
                vision: [],
                effort: [],
                systems: [],
                practice: [],
                attitude: []
            };
            
            // Find each activity and categorize it
            activityNames.forEach(name => {
                const activity = this.state.activities.all.find(a => a.name === name);
                if (activity && activity.category) {
                    const category = activity.category.toLowerCase();
                    if (categorized[category]) {
                        categorized[category].push(name);
                    }
                }
            });
            
            const categoryColors = {
                vision: '#ff8f00',
                effort: '#86b4f0',
                systems: '#72cb44',
                practice: '#7f31a4',
                attitude: '#f032e6'
            };
            
            const categoryLabels = {
                vision: 'Vision',
                effort: 'Effort',
                systems: 'Systems',
                practice: 'Practice',
                attitude: 'Attitude'
            };
            
            let html = '';
            let activityIndex = 0;
            
            Object.keys(categorized).forEach(category => {
                if (categorized[category].length > 0) {
                    const color = categoryColors[category];
                    const label = categoryLabels[category];
                    
                    html += `
                        <div class="activity-category-group" style="margin-bottom: 15px;">
                            <h5 style="color: ${color}; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600;">
                                ${label} Activities
                            </h5>
                            ${categorized[category].map((activity) => {
                                activityIndex++;
                                return `
                                    <div class="prescribed-activity-item" data-index="${activityIndex - 1}" 
                                         style="border-left: 3px solid ${color}; background: linear-gradient(90deg, ${color}10 0%, transparent 100%);">
                                        <span class="activity-number" style="background: ${color}; color: white;">${activityIndex}</span>
                                        <span class="activity-name">${activity}</span>
                                        <button class="swap-btn" title="Change this activity">🔄</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }
            });
            
            return html || '<p>No activities found</p>';
        }
        
        /**
         * Render problem selectors for step 3
         */
        renderProblemSelectors() {
            const problemMappings = window.vespaProblemMappings?.problemMappings || {};
            let html = '';
            
            const categoryColors = {
                'Vision': '#ff8f00',
                'Effort': '#86b4f0',
                'Systems': '#72cb44',
                'Practice': '#7f31a4',
                'Attitude': '#f032e6'
            };
            
            Object.keys(problemMappings).forEach(category => {
                const color = categoryColors[category] || '#666';
                html += `
                    <div class="problem-category" style="border-left: 4px solid ${color}; margin-bottom: 15px;">
                        <h5 style="color: ${color}; margin-bottom: 10px;">${category}</h5>
                        <div class="problem-list" style="max-height: 300px; overflow-y: auto;">
                            ${problemMappings[category].map(problem => `
                                <label class="problem-item enhanced" style="display: block; margin-bottom: 8px; padding: 8px; border-radius: 6px; transition: background 0.2s;">
                                    <input type="checkbox" class="problem-checkbox" value="${problem.id}" 
                                           data-activities='${JSON.stringify(problem.recommendedActivities)}'
                                           data-activity-ids='${JSON.stringify(problem.activityIds || [])}'
                                           data-category="${category}">
                                    <span class="problem-text">${problem.text}</span>
                                    <span class="activity-count activity-info-trigger" 
                                          data-activities='${JSON.stringify(problem.recommendedActivities)}'
                                          style="cursor: help; color: ${color}; font-weight: 500;">
                                        +${problem.recommendedActivities?.length || 0} activities
                                    </span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
            
            return html;
        }
        
        async updateNewUserStatus() {
            log('Updating new user status to False (marking as returning user)');
            
            try {
                // Prepare the update data - set to False to mark as returning user
                const updateData = {
                    [this.config.fields.newUser]: false
                };
                
                // Update the student record
                const response = await $.ajax({
                    type: 'PUT',
                    url: 'https://api.knack.com/v1/objects/object_6/records/' + this.state.studentId,
                    data: JSON.stringify(updateData),
                    headers: {
                        'X-Knack-Application-Id': '5ee90912c38ae7001510c1a9',
                        'X-Knack-REST-API-Key': '8f733aa5-dd35-4464-8348-64824d1f5f0d',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response) {
                    log('Successfully updated new user status');
                    this.state.isNewUser = false;
                } else {
                    console.error('Failed to update new user status');
                }
            } catch (err) {
                console.error('Error updating new user status:', err);
            }
        }
        
        /**
         * Show activity search modal
         */
        showActivitySearch() {
            log('Showing activity search modal');
            
            const allActivities = this.state.activities.all || [];
            const prescribedIds = this.state.prescribedActivityIds || [];
            
            // Filter out already prescribed activities
            const availableActivities = allActivities.filter(activity => 
                !prescribedIds.includes(activity.id)
            );
            
            const modal = document.createElement('div');
            modal.className = 'vespa-modal activity-search-modal show';
            
            let searchTerm = '';
            let selectedCategory = 'all';
            
            const renderSearchResults = () => {
                let filtered = availableActivities;
                
                // Filter by category
                if (selectedCategory !== 'all') {
                    filtered = filtered.filter(a => a.category === selectedCategory);
                }
                
                // Filter by search term
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    filtered = filtered.filter(a => 
                        a.name.toLowerCase().includes(term) ||
                        (a.instructions && a.instructions.toLowerCase().includes(term))
                    );
                }
                
                return filtered.map((activity, index) => 
                    this.getCompactActivityCardHTML(activity, index)
                ).join('') || '<p class="no-results">No activities found matching your search</p>';
            };
            
            modal.innerHTML = `
                <div class="modal-content large">
                    <button class="modal-close" onclick="this.closest('.vespa-modal').remove()">×</button>
                    <h2 class="modal-title">🔍 Search & Add Activities</h2>
                    
                    <div class="search-controls">
                        <input type="text" 
                               class="search-input" 
                               placeholder="Search activities by name or description..."
                               id="activity-search-input">
                        
                        <div class="category-filter">
                            <button class="filter-btn active" data-category="all">All</button>
                            <button class="filter-btn" data-category="vision">Vision</button>
                            <button class="filter-btn" data-category="effort">Effort</button>
                            <button class="filter-btn" data-category="systems">Systems</button>
                            <button class="filter-btn" data-category="practice">Practice</button>
                            <button class="filter-btn" data-category="attitude">Attitude</button>
                        </div>
                    </div>
                    
                    <div class="search-results" id="search-results">
                        ${renderSearchResults()}
                    </div>
                    
                    <div class="modal-footer">
                        <p class="help-text">💡 Tip: You can also select activities based on specific problems you're facing</p>
                        <button class="problem-selector-btn" onclick="vespaApp.showProblemSelector()">
                            Select by Problem
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            const searchInput = modal.querySelector('#activity-search-input');
            const resultsContainer = modal.querySelector('#search-results');
            
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value;
                resultsContainer.innerHTML = renderSearchResults();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('filter-btn')) {
                    modal.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    selectedCategory = e.target.dataset.category;
                    resultsContainer.innerHTML = renderSearchResults();
                }
            });
            
            // Focus search input
            searchInput.focus();
        }
        
        /**
         * Show problem selector modal
         */
        showProblemSelector() {
            const currentModal = document.querySelector('.activity-search-modal');
            if (currentModal) currentModal.remove();
            
            // Reuse the existing welcome journey but start at step 3 (problem selection)
            this.showWelcomeJourney();
        }
        
        /**
         * Add an activity to the student's dashboard (prescribed activities)
         */
        async addActivityToDashboard(activityId, activityName) {
            log(`Adding activity to dashboard: ${activityName} (${activityId})`);
            
            try {
                // Get current prescribed activities
                let currentActivities = this.state.prescribedActivityIds || [];
                
                // Check if activity is already prescribed
                if (currentActivities.includes(activityId)) {
                    log('Activity already in dashboard');
                    this.showNotification('This activity is already in your dashboard!', 'info');
                    return true;
                }
                
                // Add new activity
                currentActivities.push(activityId);
                
                // Save to Knack
                await $.ajax({
                    type: 'PUT',
                    url: 'https://api.knack.com/v1/objects/object_6/records/' + this.state.studentId,
                    data: JSON.stringify({ 
                        field_1683: currentActivities // Array of record IDs for connection field
                    }),
                    headers: {
                        'X-Knack-Application-Id': '5ee90912c38ae7001510c1a9',
                        'X-Knack-REST-API-Key': '8f733aa5-dd35-4464-8348-64824d1f5f0d',
                        'Content-Type': 'application/json'
                    }
                });
                
                // Update local state
                this.state.prescribedActivityIds = currentActivities;
                log('Activity added to dashboard successfully');
                
                // Update activity history
                const history = this.getActivityHistory();
                const cycleKey = `cycle${this.state.currentCycle}`;
                
                if (!history[cycleKey]) {
                    history[cycleKey] = { prescribed: [], selected: [], completed: [] };
                }
                
                if (!history[cycleKey].selected) {
                    history[cycleKey].selected = [];
                }
                
                history[cycleKey].selected.push(activityName);
                history[cycleKey].selectedIds = currentActivities;
                history[cycleKey].lastModified = new Date().toISOString();
                
                await this.saveActivityHistory(history);
                
                // Show success notification
                this.showNotification(`"${activityName}" added to your dashboard!`, 'success');
                
                // Refresh the page to show updated dashboard
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                
                return true;
                
            } catch (error) {
                console.error('Error adding activity to dashboard:', error);
                this.showNotification('Failed to add activity to dashboard. Please try again.', 'error');
                return false;
            }
        }
        
        /**
         * Show notification message
         */
        showNotification(message, type = 'info') {
            // Remove existing notifications
            const existing = document.querySelector('.vespa-notification');
            if (existing) {
                existing.remove();
            }
            
            const notification = document.createElement('div');
            notification.className = `vespa-notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
                    <span class="notification-message">${message}</span>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
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
            // Add event listeners to handle broken images with queue management
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
                    
                    // Mark as failed in queue manager
                    if (this.imageQueue) {
                        this.imageQueue.failed.add(e.target.src);
                    }
                }
            }, true);
        }
        
        enableLazyLoading() {
            // Use the centralized image queue manager for lazy loading
            const images = document.querySelectorAll('img[data-src], img[src]');
            
            images.forEach(img => {
                // Convert regular images to lazy-loaded
                if (img.src && !img.dataset.src && !img.src.includes('data:image')) {
                    // Skip data URLs and already processed images
                    const originalSrc = img.src;
                    img.dataset.src = originalSrc;
                    
                    // Set placeholder
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f5f5f5"/%3E%3C/svg%3E';
                    img.classList.add('lazy-image');
                }
                
                // Register with queue manager for lazy loading
                if (img.dataset.src && this.imageQueue) {
                    this.imageQueue.observeImage(img);
                }
            });
            
            log(`Enabled lazy loading for ${images.length} images`);
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
                // Check if data is already loaded (from AppLoader or previous load)
                if (window.vespaActivitiesData && Object.keys(window.vespaActivitiesData).length > 0) {
                    log('Activities data already loaded, skipping fetch');
                    return;
                }
                
                // Use the new activity_json_final1a.json file configured in KnackAppLoader
                const jsonUrl = this.config.activityContentUrl || 'https://cdn.jsdelivr.net/gh/4Sighteducation/vespa-activities-v2@main/shared/utils/activity_json_final1a.json';
                log('Loading activity_json_final1a.json from:', jsonUrl);
                
                // Add timeout for slow connections
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced to 15 seconds
                
                const response = await fetch(jsonUrl, {
                    signal: controller.signal,
                    cache: 'force-cache' // Use cached version if available
                });
                
                clearTimeout(timeoutId);
                
                log('Response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    log('Data received:', data);
                    
                    // Store globally for activity renderer to access
                    window.vespaActivitiesData = {};
                    const allImageUrls = [];
                    
                    if (Array.isArray(data)) {
                        data.forEach(activity => {
                            // The JSON uses 'id' not 'Activity_id'
                            if (activity.id) {
                                // Extract media URLs from the resources structure
                                const slidesUrl = activity.resources?.watch?.slides?.[0] || '';
                                const videoUrl = activity.resources?.watch?.videos?.[0] || '';
                                const pdfUrl = activity.resources?.do?.pdfs?.[0] || '';
                                const learnImages = activity.resources?.learn?.images || [];
                                
                                // Collect all image URLs for preloading
                                if (learnImages.length > 0) {
                                    allImageUrls.push(...learnImages);
                                }
                                
                                window.vespaActivitiesData[activity.id] = {
                                    // Media URLs from the actual JSON structure
                                    slidesUrl: slidesUrl,
                                    videoUrl: videoUrl,
                                    pdfUrl: pdfUrl,
                                    // Additional data
                                    id: activity.id || '',  // Old system ID
                                    record_id: activity.record_id || '',  // Knack record ID (needed for field_1683)
                                    name: activity.name || '',
                                    category: activity.category || '',
                                    level: activity.level || '',
                                    thresholds: activity.thresholds || null,  // Needed for prescription calculation
                                    // Images from learn section
                                    learnImages: learnImages,
                                    // Keep full activity data for reference
                                    fullData: activity
                                };
                                
                                log(`Loaded activity ${activity.id} (${activity.name}):`, {
                                    slides: slidesUrl ? 'YES' : 'NO',
                                    video: videoUrl ? 'YES' : 'NO',
                                    pdf: pdfUrl ? 'YES' : 'NO',
                                    images: learnImages.length
                                });
                            }
                        });
                        
                        log(`Processed ${Object.keys(window.vespaActivitiesData).length} activities with media URLs`);
                        
                        // Preload only critical images (first 3-5) to prevent crashes
                        if (allImageUrls.length > 0 && this.imageQueue) {
                            const criticalImages = allImageUrls.slice(0, 3);
                            log(`Preloading ${criticalImages.length} critical images (out of ${allImageUrls.length} total)`);
                            // Don't await - let it happen in background
                            this.imageQueue.preloadCritical(criticalImages).then(() => {
                                log('Critical images preloaded');
                            });
                        }
                    } else {
                        console.error('activity_json_final1a.json did not return an array:', data);
                    }
                    
                    log('activity_json_final1a.json loaded successfully', window.vespaActivitiesData);
                } else {
                    console.error('Failed to load activity_json_final1a.json - HTTP status:', response.status);
                    window.vespaActivitiesData = {};
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.error('Loading activities timed out - connection too slow');
                } else {
                    console.error('Error loading activity_json_final1a.json:', error);
                }
                // Continue without media URLs rather than breaking the app
                window.vespaActivitiesData = {};
            }
        }
    }
    
    })(); // End IIFE
    
    // Quick debug helper
    window.testParsing = function(activityName) {
        const activity = window.vespaApp?.state?.activities?.all?.find(a => a.name.includes(activityName));
        if (!activity) return console.error('Activity not found');
        
        log(`\nTesting: ${activity.name}`);
        const content = activity.video || '';
        
        // Find all iframes
        const allIframes = content.match(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi) || [];
        log(`Total iframes: ${allIframes.length}`);
        
        allIframes.forEach((iframe, i) => {
            const isYouTube = iframe.includes('youtube.com') || iframe.includes('youtu.be');
            const isGoogleSlides = iframe.includes('docs.google.com/presentation');
            const isSlidescom = iframe.includes('slides.com');
            log(`\nIframe ${i + 1}:`, {
                type: isYouTube ? 'YouTube' : (isGoogleSlides ? 'Google Slides' : (isSlidescom ? 'Slides.com' : 'Unknown')),
                preview: iframe.substring(0, 100) + '...'
            });
        });
    };