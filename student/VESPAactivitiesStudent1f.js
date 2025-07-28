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
            try {
                log('Starting initialization');
                
                // Set up listeners for view renders
                this.setupViewListeners();
                
                // Wait a bit for Knack views to fully render
                await this.waitForViews();
                
                // Hide the data views
                log('Hiding data views...');
                this.hideDataViews();
                
                // Load initial data
                log('Loading initial data...');
                await this.loadInitialData();
                
                // Initial render
                log('Rendering UI...');
                this.render();
                
                // Attach event listeners
                log('Attaching event listeners...');
                this.attachEventListeners();
                
                // Start animations
                this.startAnimations();
                
                log('Initialization complete');
                return true; // Return success
            } catch (error) {
                console.error('Error during initialization:', error);
                console.error('Error stack:', error.stack);
                this.showError('Failed to initialize the application');
                throw error; // Re-throw to be caught by the initializer
            }
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
                        level: attrs.field_1295 || attrs.field_1295_raw || 'Level 2', // Level
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
                            active: activityData.active
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
            // Show all prescribed activities from field_1683 that aren't completed
            const recommendedNotCompleted = this.state.activities.prescribed.filter(activity => 
                !this.state.finishedActivityIds.includes(activity.id) &&
                !this.state.finishedActivityIds.includes(activity.activityId)
            );
            
            // Sort by category to group them
            const sortedActivities = recommendedNotCompleted.sort((a, b) => {
                if (a.category === b.category) return 0;
                return a.category < b.category ? -1 : 1;
            });
            
            if (this.state.activities.prescribed.length === 0) {
                return ''; // Don't show section if no prescribed activities
            }
            
            // Show missing activities message if not all prescribed activities were found
            const missingCount = this.state.prescribedActivityIds.length - this.state.activities.prescribed.length;
            
            return `
                <section class="activities-section">
                    <h2 class="section-title">
                        <span class="title-icon">✨</span>
                        Your Recommended Activities
                        <span class="title-badge">${recommendedNotCompleted.length} to complete</span>
                    </h2>
                    ${missingCount > 0 ? `
                        <div class="warning-message">
                            <span class="warning-icon">⚠️</span>
                            ${missingCount} recommended activities couldn't be loaded. Please contact support if this persists.
                        </div>
                    ` : ''}
                    <div class="activities-carousel">
                        ${recommendedNotCompleted.length > 0 ? 
                            sortedActivities.map((activity, index) => this.getActivityCardHTML(activity, index, true)).join('') :
                            '<div class="empty-state"><p>All recommended activities completed! 🎉</p></div>'
                        }
                    </div>
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
                            '<span class="completed-badge"><span class="checkmark">✓</span> Completed</span>' :
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
                    <h2>📚 All Activities</h2>
                    <p>Choose a category to explore all Level 2 & 3 activities</p>
                    
                    <div class="category-buttons">
                        ${categories.map(category => {
                            const emoji = this.getCategoryEmoji(category);
                            const color = this.colors[category];
                            const activityCount = this.state.activities.byCategory[category]?.length || 0;
                            
                            return `
                                <button class="category-button" 
                                        data-category="${category}"
                                        style="background: ${color.primary}; border-color: ${color.dark}">
                                    <span class="category-button-emoji">${emoji}</span>
                                    <span class="category-button-name">${category.toUpperCase()}</span>
                                    <span class="category-button-count">${activityCount} activities</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                    
                    <div id="category-activities-container"></div>
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
            this.render();
            // Auto-click the category button
            setTimeout(() => {
                const button = document.querySelector(`[data-category="${category}"]`);
                if (button) button.click();
            }, 100);
        }
        
        showCategoryActivities(category) {
            const container = document.getElementById('category-activities-container');
            if (!container) return;
            
            // Get all activities for this category (not just available ones)
            const categoryActivities = this.state.activities.byCategory[category] || [];
            
            container.innerHTML = `
                <div class="category-activities">
                    <h3 class="category-activities-title">
                        ${this.getCategoryEmoji(category)} ${category.toUpperCase()} Activities
                        <button class="close-category-btn" onclick="document.getElementById('category-activities-container').innerHTML = ''">✕</button>
                    </h3>
                    <div class="activities-grid">
                        ${categoryActivities.length > 0 ? 
                            categoryActivities.map((activity, index) => this.getActivityCardHTML(activity, index)).join('') :
                            '<p>No activities found in this category.</p>'
                        }
                    </div>
                </div>
            `;
            
            // Scroll to the activities
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    
})(); // End IIFE
