/**
 * VESPA Staff Activities Management System
 * Clean, professional interface for managing student activities
 * Version: 1.0
 * Scene: 1256
 */

// Wrap in IIFE to avoid global scope pollution
(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        debug: true,
        scenes: ['scene_1258'], // Staff management scene (updated)
        
        // Object IDs
        objects: {
            accounts: 'object_3',
            staffAdmin: 'object_5',
            tutor: 'object_7',
            headOfYear: 'object_18',
            subjectTeacher: 'object_78',
            student: 'object_6',
            customer: 'object_2',
            activities: 'object_44',
            activityAnswers: 'object_46',
            vespaResults: 'object_10',
            activityProgress: 'object_126',
            studentAchievements: 'object_127',
            activityFeedback: 'object_128'
        },
        
        // Field mappings
        fields: {
            // User fields (Object_3)
            userRoles: 'field_73',
            userAccountID: 'field_70',
            
            // Staff role email fields
            staffAdminEmail: 'field_86',
            tutorEmail: 'field_96',
            headOfYearEmail: 'field_417',
            subjectTeacherEmail: 'field_1879',
            
            // Student connection fields (many-to-many, comma separated)
            studentTutors: 'field_1682',
            studentHeadsOfYear: 'field_547',
            studentSubjectTeachers: 'field_2177',
            studentStaffAdmins: 'field_190',
            
            // Student fields (Object_6)
            studentName: 'field_90',
            studentEmail: 'field_91',
            prescribedActivities: 'field_1683',
            finishedActivities: 'field_1380',
            studentVESPAConnection: 'field_182', // Connection to Object_10 VESPA record
            
            // VESPA scores (Object_10)
            visionScore: 'field_147',
            effortScore: 'field_148',
            systemsScore: 'field_149',
            practiceScore: 'field_150',
            attitudeScore: 'field_151',
            
                    // Activity fields (Object_44) - COMPLETE MAPPING
        activityName: 'field_1278',
        activityVESPACategory: 'field_1285',
        activityLevel: 'field_1295', // fallback
        activityLevelAlt: 'field_3568', // preferred level field
        activityScoreMoreThan: 'field_1287', // threshold: show if score is more than X
        activityScoreLessEqual: 'field_1294', // threshold: show if score is <= Y
        // Bespoke curriculum tags (CSV or multi-select style)
        activityCurriculum: 'field_3584',
        // Additional activity fields
        activityDescription: 'field_1134',
        activityDuration: 'field_1135',
        activityType: 'field_1133',
            
            // Activity Answers fields (Object_46)
            answerStudentName: 'field_1875',
            answerActivityJSON: 'field_1300',
            answerResponsesPerActivity: 'field_2334',
            answerCompletionDate: 'field_1870',
            answerYearGroup: 'field_2331',
            answerGroup: 'field_2332',
            answerFaculty: 'field_2333',
            answerStudentConnection: 'field_1301',
            answerActivityConnection: 'field_1302',
            answerStaffFeedback: 'field_1734',
            answerCustomerConnection: 'field_1871',
            answerTutorConnection: 'field_1872',
            answerStaffAdminConnection: 'field_1873',
            
            // Activity Progress fields (Object_126)
            progressId: 'field_3535',
            progressName: 'field_3534',
            progressStudent: 'field_3536',
            progressActivity: 'field_3537',
            progressCycle: 'field_3538',
            progressDateAssigned: 'field_3539',
            progressDateStarted: 'field_3540',
            progressDateCompleted: 'field_3541',
            progressTimeMinutes: 'field_3542',
            progressStatus: 'field_3543',
            progressVerified: 'field_3544',
            progressPoints: 'field_3545',
            progressSelectedVia: 'field_3546',
            progressStaffNotes: 'field_3547',
            progressReflection: 'field_3548',
            progressWordCount: 'field_3549',
            
            // Activity Feedback fields (Object_128)
            feedbackName: 'field_3561',
            feedbackId: 'field_3562',
            feedbackActivityProgress: 'field_3563',
            feedbackStaffMember: 'field_3564',
            feedbackText: 'field_3565',
            feedbackDate: 'field_3566',
            feedbackType: 'field_3567'
        },
        
        // View IDs removed - using direct API calls only
    };

    // View hiding removed - using direct API calls only
    
    // Utility functions
    const log = (...args) => {
        if (CONFIG.debug) {
            console.log('[VESPA Staff]', ...args);
        }
    };
    
    const error = (...args) => {
        console.error('[VESPA Staff Error]', ...args);
    };
    
    // Main Staff Manager Class
    class VESPAStaffManager {
        constructor() {
            this.config = null;
            this.state = {
                currentView: 'list', // 'list' for page 1, 'workspace' for page 2
                currentStudentId: null, // Track current student when on page 2
                currentRole: null,
                allRoles: [],
                students: [],
                activities: [],
                filteredStudents: [],
                selectedStudents: new Set(),
                selectedActivities: new Set(),
                // Cache of progress activity IDs per student for list counts
                progressActivitiesByStudent: new Map(),
                // Undo handler for snackbar
                lastUndo: null,
                filters: {
                    search: '',
                    progress: 'all',
                    group: 'all'
                },
                sortColumn: 'name',
                sortDirection: 'asc',
                isLoading: false,
                displayMode: 'activities', // 'activities' or 'scores'
                // Pagination state
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalRecords: 0,
                    hasMore: false
                }
            };
            
            this.cache = new Map();
            this.container = null;
        }
        
        // Initialize the manager
        async init() {
            log('Initializing VESPA Staff Manager...');
            
            // Get config from global variable
            this.config = window.VESPA_ACTIVITIES_STAFF_CONFIG;
            if (!this.config) {
                error('Config not found in init');
                return;
            }
            
            // Merge configs - combine KnackAppLoader config with local CONFIG
            this.config = {
                ...this.config,
                fields: CONFIG.fields,
                objects: CONFIG.objects
            };
            
            // CONFIG.views update removed - using direct API calls only
            
            log('Using config:', this.config);
            
            try {
                // Wait for Knack to be ready
                await this.waitForKnack();
                
                // Find container
                this.container = this.findContainer();
                if (!this.container) {
                    throw new Error('Container view not found');
                }
                
                // Show loading state
                this.showLoading();
                
                // Detect user roles
                await this.detectUserRoles();
                
                // Load initial data
                await this.loadData();
                
                // Render UI
                this.render();
                
                // Setup event listeners
                this.setupEventListeners();
                
                log('Staff Manager initialized successfully');
            } catch (err) {
                error('Failed to initialize:', err);
                this.showError('Failed to initialize staff manager');
            }
        }
        
        // Helper to escape HTML for safe display
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Wait for Knack to be ready
        waitForKnack() {
            return new Promise((resolve) => {
                if (typeof Knack !== 'undefined' && Knack.session && Knack.session.user) {
                    resolve();
                } else {
                    $(document).on('knack-scene-render.scene_1258', () => {
                        setTimeout(resolve, 100);
                    });
                }
            });
        }
        
        // Find container view
        findContainer() {
            // Try multiple selectors (no longer dependent on CONFIG.views)
            const selectors = [
                '#view_3179',  // Staff page container
                '#view_3168',  // Alternative container
                '.kn-details',
                '.kn-text',
                '.kn-view'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    log('Found container:', selector);
                    return element;
                }
            }
            
            return null;
        }
        
        // Detect user roles
        async detectUserRoles() {
            log('Detecting user roles...');
            
            const user = Knack.session.user;
            // Extract email - it can be in different places
            const userEmail = user.email || user.values?.field_70?.email || user.values?.email?.email;
            const fields = this.config.fields;
            const objects = this.config.objects;
            
            log('Extracted user email:', userEmail);
            
            this.state.allRoles = [];
            
            // Get profile keys from user object
            const profileKeys = user.profile_keys || [];
            log('User profile keys:', profileKeys);
            
            // Map profile keys to roles based on objects
            const profileToRoleMap = {
                'profile_5': { role: 'Staff Admin', object: 'object_5', emailField: 'field_86' },
                'profile_7': { role: 'Tutor', object: 'object_7', emailField: 'field_96' },
                'profile_18': { role: 'Head of Year', object: 'object_18', emailField: 'field_417' },
                'profile_78': { role: 'Subject Teacher', object: 'object_78', emailField: 'field_1879' }
            };
            
            // Role configurations
            const roleConfigs = {
                'Staff Admin': {
                    type: 'staffAdmin',
                    label: 'View All Students',
                    canAssign: true,
                    canViewAnswers: true
                },
                'Tutor': {
                    type: 'tutor',
                    label: 'View Tutor Group',
                    canAssign: true,
                    canViewAnswers: true
                },
                'Head of Year': {
                    type: 'headOfYear',
                    label: 'View Year Group',
                    canAssign: false,
                    canViewAnswers: false
                },
                'Subject Teacher': {
                    type: 'subjectTeacher',
                    label: 'View Subject Groups',
                    canAssign: false,
                    canViewAnswers: false
                }
            };
            
            // For each profile key, get the actual role record
            for (const profileKey of profileKeys) {
                const roleInfo = profileToRoleMap[profileKey];
                if (!roleInfo) continue;
                
                try {
                    // Get the role record from the appropriate object
                    log(`Fetching ${roleInfo.role} record for email: ${userEmail}`);
                    
                    const response = await $.ajax({
                        url: `https://api.knack.com/v1/objects/${roleInfo.object}/records`,
                        type: 'GET',
                        headers: {
                            'X-Knack-Application-Id': this.config.knackAppId,
                            'X-Knack-REST-API-Key': this.config.knackApiKey
                        },
                        data: {
                            filters: JSON.stringify([{
                                field: roleInfo.emailField,
                                operator: 'is',
                                value: userEmail
                            }]),
                            page: 1,
                            rows_per_page: 1
                        }
                    });
                    
                    if (response.records && response.records.length > 0) {
                        const roleRecord = response.records[0];
                        log(`Found ${roleInfo.role} record:`, roleRecord);
                        log(`${roleInfo.role} record ID: ${roleRecord.id}`);
                        
                        const roleConfig = roleConfigs[roleInfo.role];
                        if (roleConfig) {
                            this.state.allRoles.push({
                                ...roleConfig,
                                data: { 
                                    id: roleRecord.id,  // This is the role record ID we need for filtering
                                    email: userEmail,
                                    record: roleRecord
                                }
                            });
                            log(`Added role with ID ${roleRecord.id} for filtering students`);
                        }
                    } else {
                        log(`No ${roleInfo.role} record found for email ${userEmail}`);
                    }
                } catch (err) {
                    log(`Error fetching ${roleInfo.role} record:`, err);
                }
            }
            
            // For testing, if no roles found, add a test role
            if (this.state.allRoles.length === 0) {
                log('No roles detected, adding test role for development');
                this.state.allRoles.push({
                    type: 'tutor',
                    label: 'Tutor (Test Mode)',
                    canAssign: true,
                    canViewAnswers: true,
                    data: { id: 'test_id', email: userEmail }
                });
            }
            
            // Set default role (prefer Staff Admin if available)
            this.state.currentRole = this.state.allRoles.find(r => r.type === 'staffAdmin') || this.state.allRoles[0];
            
            log('Detected roles with IDs:', this.state.allRoles);
        }
        
        // Load data based on current role
        async loadData() {
            log('Loading data for role:', this.state.currentRole.type);
            
            this.state.isLoading = true;
            
            try {
                // Load all activities FIRST so they're available for student parsing
                await this.loadActivities();
                
                // CRITICAL: Create activitiesMap immediately after loading activities
                this.activitiesMap = new Map();
                this.state.activities.forEach(activity => {
                    if (activity.id) {
                        this.activitiesMap.set(activity.id, activity);
                    }
                });
                log(`Created activitiesMap with ${this.activitiesMap.size} activities`);
                
                // Load students based on role (now activities are available for parsing)
                await this.loadStudents();
                
                // Enrich list with in-progress activity IDs for All Activities count
                try {
                    const map = await this.loadProgressActivitiesForStudents(this.state.students.map(s => s.id));
                    this.state.progressActivitiesByStudent = map;
                } catch (_) { /* non-fatal */ }
                
                // Load VESPA scores for students
                await this.loadVESPAScores();
                
                // Apply initial filters
                this.applyFilters();
                
            } catch (err) {
                error('Failed to load data:', err);
                throw err;
            } finally {
                this.state.isLoading = false;
            }
        }

        // Load minimal in-progress activity IDs per student for list counts
        async loadProgressActivitiesForStudents(studentIds = []) {
            const f = this.config.fields; const o = this.config.objects;
            const idSet = new Set(studentIds);
            const result = new Map();
            try {
                const resp = await $.ajax({
                    url: `https://api.knack.com/v1/objects/${o.activityProgress}/records`,
                    type: 'GET',
                    headers: { 'X-Knack-Application-Id': this.config.knackAppId, 'X-Knack-REST-API-Key': this.config.knackApiKey },
                    data: { page: 1, rows_per_page: 1000, sort_field: 'created_at', sort_order: 'desc' }
                });
                (resp.records || []).forEach(r => {
                    const sid = r[f.progressStudent];
                    const aid = r[f.progressActivity + '_raw']?.[0]?.id || r[f.progressActivity];
                    const status = r[f.progressStatus];
                    if (!sid || !aid || !idSet.has(sid)) return;
                    if (status === 'removed' || status === 'completed') return;
                    if (!result.has(sid)) result.set(sid, new Set());
                    result.get(sid).add(aid);
                });
            } catch (e) {
                error('Failed to load progress activities for students', e);
            }
            return result;
        }
        
        // Load students based on current role
        async loadStudents() {
            log('Loading students directly from Knack API...');
            
            const studentData = [];
            const fields = this.config.fields;
            const objects = this.config.objects;
            let page = 1; // Moved to function scope
            
            try {
                // Build filters based on role
                let filters = [];
                const user = Knack.session.user;
                const userEmail = user.email || user.values?.field_70?.email || user.values?.email?.email;
                
                log('Building filters for role:', this.state.currentRole.type);
                log('User email:', userEmail);
                
                // Use role record ID for filtering, not email
                const roleId = this.state.currentRole.data?.id;
                
                switch (this.state.currentRole.type) {
                    case 'staffAdmin':
                        if (roleId && roleId !== 'test_id') {
                            filters.push({
                                field: fields.studentStaffAdmins,
                                operator: 'contains',
                                value: roleId
                            });
                            log('Staff admin filter:', { field: fields.studentStaffAdmins, value: roleId });
                        } else {
                            log('WARNING: No role ID found for staff admin filter');
                        }
                        break;
                    case 'tutor':
                        if (roleId && roleId !== 'test_id') {
                            filters.push({
                                field: fields.studentTutors,
                                operator: 'contains',
                                value: roleId
                            });
                            log('Tutor filter:', { field: fields.studentTutors, value: roleId });
                        } else {
                            log('WARNING: No role ID found for tutor filter');
                        }
                        break;
                    case 'headOfYear':
                        if (roleId && roleId !== 'test_id') {
                            filters.push({
                                field: fields.studentHeadsOfYear,
                                operator: 'contains',
                                value: roleId
                            });
                            log('Head of year filter:', { field: fields.studentHeadsOfYear, value: roleId });
                        } else {
                            log('WARNING: No role ID found for head of year filter');
                        }
                        break;
                    case 'subjectTeacher':
                        if (roleId && roleId !== 'test_id') {
                            filters.push({
                                field: fields.studentSubjectTeachers,
                                operator: 'contains',
                                value: roleId
                            });
                            log('Subject teacher filter:', { field: fields.studentSubjectTeachers, value: roleId });
                        } else {
                            log('WARNING: No role ID found for subject teacher filter');
                        }
                        break;
                }
                
                log('Final filters:', filters);
                
                // Load all pages of student data
                let hasMorePages = true;
                
                while (hasMorePages) {
                    log(`Loading students page ${page}...`);
                    
                    const requestData = {
                        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
                        page: page,
                        rows_per_page: 1000,
                        sort_field: 'field_90', // Sort by name
                        sort_order: 'asc'
                    };
                    
                    log('API Request URL:', `https://api.knack.com/v1/objects/${objects.student}/records`);
                    log('API Request data:', requestData);
                    
                    const response = await $.ajax({
                        url: `https://api.knack.com/v1/objects/${objects.student}/records`,
                        type: 'GET',
                        headers: {
                            'X-Knack-Application-Id': this.config.knackAppId,
                            'X-Knack-REST-API-Key': this.config.knackApiKey
                        },
                        data: requestData
                    });
                    
                    log(`Students API Response page ${page}:`, response);
                    log('Number of records returned:', response.records ? response.records.length : 0);
                    log('Total records available:', response.total_records);
                    
                    // Process each student record
                    if (response.records && response.records.length > 0) {
                        response.records.forEach((record, index) => {
                            if (page === 1 && index === 0) {
                                log('Sample student record:', record);
                                log('Student record fields:', Object.keys(record).filter(key => key.startsWith('field_')));
                                log(`${fields.studentName} (name):`, record[fields.studentName]);
                                log(`${fields.studentEmail} (email):`, record[fields.studentEmail]); 
                                log(`${fields.prescribedActivities} (prescribed):`, record[fields.prescribedActivities]);
                                log(`${fields.finishedActivities} (finished):`, record[fields.finishedActivities]);
                            }
                            const student = this.parseStudentFromRecord(record);
                            if (student) {
                                studentData.push(student);
                            }
                        });
                        
                        // Check if there are more pages
                        hasMorePages = response.records.length === 1000;
                        page++;
                    } else {
                        hasMorePages = false;
                    }
                }
                
                // If still no data, optionally create test data
                if (studentData.length === 0) {
                    log('No students found via API');
                    
                    if (this.config.enableTestData) {
                        log('Creating test data (enableTestData is true)...');
                        for (let i = 0; i < 5; i++) {
                            studentData.push({
                                id: `test_${i}`,
                                name: `Test Student ${i + 1}`,
                                email: `test${i + 1}@school.edu`,
                                prescribedActivities: ['Activity 1', 'Activity 2', 'Activity 3', 'Activity 4', 'Activity 5'],
                                finishedActivities: ['Activity 1', 'Activity 2'],
                                prescribedCount: 5,
                                completedCount: 2,
                                progress: 5,
                                vespaScores: {
                                    vision: 7.5,
                                    effort: 8.0,
                                    systems: 7.0,
                                    practice: 8.5,
                                    attitude: 7.8
                                }
                            });
                        }
                    } else {
                        log('No test data created (enableTestData is false or undefined)');
                        log('Current role:', this.state.currentRole);
                        log('Role ID used for filtering:', this.state.currentRole.data?.id);
                    }
                }
                
            } catch (err) {
                error('Failed to load students:', err);
                log('Error details:', err.responseJSON || err.responseText || err);
                
                if (err.status === 401 || err.status === 403) {
                    error('Authentication error - check API keys');
                }
                
                // Create fallback data on error
                for (let i = 0; i < 3; i++) {
                    studentData.push({
                        id: `error_${i}`,
                        name: `Student ${i + 1} (Error Loading)`,
                        email: `student${i + 1}@school.edu`,
                        prescribedActivities: [],
                        finishedActivities: [],
                        prescribedCount: 0,
                        completedCount: 0,
                        progress: 0,
                        vespaScores: {
                            vision: 0,
                            effort: 0,
                            systems: 0,
                            practice: 0,
                            attitude: 0
                        }
                    });
                }
            }

            this.state.students = studentData;
            log(`Loaded ${studentData.length} students across ${page - 1} pages`);
        }
        
        // parseStudentFromRow method removed - using direct API calls only
        
        // Helper to get field value (handles both direct and _raw fields)
        getFieldValue(record, fieldKey, defaultValue = '') {
            // Try direct field
            if (record[fieldKey] !== undefined && record[fieldKey] !== null) {
                return record[fieldKey];
            }
            // Try _raw field
            const rawKey = fieldKey + '_raw';
            if (record[rawKey] !== undefined && record[rawKey] !== null) {
                return record[rawKey];
            }
            // Check if it's an object with nested value
            if (typeof record[fieldKey] === 'object' && record[fieldKey]) {
                // Handle email objects
                if (record[fieldKey].email) return record[fieldKey].email;
                // Handle name objects  
                if (record[fieldKey].first || record[fieldKey].last) {
                    return `${record[fieldKey].first || ''} ${record[fieldKey].last || ''}`.trim();
                }
                // Handle other objects
                if (record[fieldKey].identifier) return record[fieldKey].identifier;
            }
            return defaultValue;
        }

        // Parse student data from API record
        // Helper method to strip HTML and extract clean text
        stripHtml(html, preserveFormatting = false) {
            if (!html) return '';
            
            if (preserveFormatting) {
                // Keep the HTML but clean it up for display
                return html;
            }
            
            // First decode HTML entities
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            let decoded = txt.value;
            
            // Remove all HTML tags
            decoded = decoded.replace(/<[^>]*>/g, '');
            
            // Clean up any remaining artifacts
            decoded = decoded.replace(/&nbsp;/g, ' ');
            decoded = decoded.replace(/\s+/g, ' ').trim();
            
            return decoded;
        }

        parseStudentFromRecord(record) {
            try {
                const fields = this.config.fields;
                
                // Get student name and email
                const name = this.getFieldValue(record, fields.studentName, 'Unknown Student');
                const email = this.getFieldValue(record, fields.studentEmail, '');
                
                // Prefer RAW connection to get IDs and names for prescribed activities
                const prescribedRaw = record[fields.prescribedActivities + '_raw'];
                let prescribedActivities = [];
                let prescribedActivityIds = [];
                if (Array.isArray(prescribedRaw)) {
                    prescribedActivities = prescribedRaw
                        .map(item => this.stripHtml(item?.identifier || item?.title || item?.name || ''))
                        .filter(Boolean);
                    prescribedActivityIds = prescribedRaw.map(item => item?.id).filter(Boolean);
                } else {
                    const prescribedText = this.getFieldValue(record, fields.prescribedActivities, '');
                    if (prescribedText && typeof prescribedText === 'string') {
                        prescribedActivities = prescribedText.split(/[,\n]/).map(a => this.stripHtml(a.trim())).filter(a => a);
                    }
                }
                const prescribedCount = (prescribedActivityIds.length || prescribedActivities.length);
                log(`Student ${name} prescribed activities (names):`, prescribedActivities);
                log(`Student ${name} prescribed activity IDs (raw):`, prescribedActivityIds);
                
                // field_1380: short text storing comma-separated activity IDs
                const finishedText = this.getFieldValue(record, fields.finishedActivities, '');
                let finishedActivityIds = [];
                if (typeof finishedText === 'string' && finishedText.trim().length > 0) {
                    finishedActivityIds = finishedText.split(/[,\s]+/).map(id => id.trim()).filter(Boolean);
                }
                log(`Student ${name} finished activity IDs:`, finishedActivityIds);
                log(`Student ${name} finished activities count:`, finishedActivityIds.length);
                
                // Calculate completed count only for prescribed activities
                let actualCompletedCount = 0;
                
                // Debug: Log all available activities
                if (this.config.debug && name === 'Alena Ramsey') {
                    log('All available activities:', this.state.activities?.map(a => ({id: a.id, name: a.name})));
                }
                
                // If we have prescribed IDs from RAW, use them; else map names to IDs
                if (prescribedActivityIds.length > 0) {
                    actualCompletedCount = prescribedActivityIds.filter(id => finishedActivityIds.includes(id)).length;
                } else if (this.state.activities && prescribedActivities.length > 0) {
                    for (const activityName of prescribedActivities) {
                        // Normalize the activity name for matching
                        const normalizedName = activityName.toLowerCase().trim().replace(/\s+/g, ' ');
                        
                        const activity = this.state.activities.find(a => {
                            const normalizedActivityName = this.stripHtml(a.name).toLowerCase().trim().replace(/\s+/g, ' ');
                            // Try exact match first
                            if (normalizedActivityName === normalizedName) return true;
                            // Try contains match (in case of partial names)
                            if (normalizedActivityName.includes(normalizedName) || normalizedName.includes(normalizedActivityName)) return true;
                            // Try removing common words
                            const cleanName1 = normalizedName.replace(/(the|a|an)\s+/g, '');
                            const cleanName2 = normalizedActivityName.replace(/(the|a|an)\s+/g, '');
                            return cleanName1 === cleanName2;
                        });
                        
                        if (activity) {
                            prescribedActivityIds.push(activity.id);
                            if (finishedActivityIds.includes(activity.id)) {
                                actualCompletedCount++;
                                if (this.config.debug) {
                                    log(`Match found: ${activityName} (${activity.id})`);
                                }
                            }
                        } else {
                            log(`WARNING: Could not find activity for prescribed name: "${activityName}"`);
                            // Log available activities for debugging
                            if (this.state.activities.length < 20) {
                                log('Available activities:', this.state.activities.map(a => a.name));
                            }
                        }
                    }
                }
                
                // Debug logging for specific students
                if (this.config.debug && (name === 'Alena Ramsey' || name === 'Ian Woodard')) {
                    log(`=== DEBUG: ${name} ===`);
                    log('Prescribed activities:', prescribedActivities);
                    log('Prescribed activity IDs:', prescribedActivityIds);
                    log('Finished activity IDs:', finishedActivityIds);
                    log('Matches found:', actualCompletedCount);
                    log('================');
                }
                
                // Use the accurate completed count
                const completedCount = actualCompletedCount;
                
                // Calculate progress based on prescribed activities (curriculum)
                const progressPercentage = prescribedCount > 0 ? 
                    Math.round((completedCount / prescribedCount) * 100) : 0;
                
                // Calculate category breakdown for prescribed activities
                const categoryBreakdown = {
                    vision: [],
                    effort: [],
                    systems: [],
                    practice: [],
                    attitude: []
                };
                
                // Map prescribed activities to categories
                if (this.activitiesMap && prescribedActivityIds.length > 0) {
                    prescribedActivityIds.forEach(activityId => {
                        const activity = this.activitiesMap.get(activityId);
                        if (activity) {
                            // Fix: Use consistent property name for category
                            const category = (activity.category || activity.VESPACategory || '').toLowerCase();
                            if (categoryBreakdown[category]) {
                                categoryBreakdown[category].push({
                                    id: activity.id,
                                    name: activity.name || activity.ActivityName || 'Unnamed Activity',
                                    completed: finishedActivityIds.includes(activityId)
                                });
                            }
                        } else {
                            log(`WARNING: Activity ${activityId} not found in activitiesMap`);
                        }
                    });
                } else {
                    log('WARNING: activitiesMap not available or no prescribed activities', {
                        hasActivitiesMap: !!this.activitiesMap,
                        prescribedCount: prescribedActivityIds.length
                    });
                }
                
                // For VESPA scores, check if they're in the record or need to be loaded separately
                const vespaScores = {
                    vision: 0,
                    effort: 0,
                    systems: 0,
                    practice: 0,
                    attitude: 0
                };
                
                // Try to get VESPA scores from record
                if (fields.visionScore && record[fields.visionScore] !== undefined) {
                    vespaScores.vision = parseFloat(record[fields.visionScore]) || 0;
                    vespaScores.effort = parseFloat(record[fields.effortScore]) || 0;
                    vespaScores.systems = parseFloat(record[fields.systemsScore]) || 0;
                    vespaScores.practice = parseFloat(record[fields.practiceScore]) || 0;
                    vespaScores.attitude = parseFloat(record[fields.attitudeScore]) || 0;
                }
                
                // Get VESPA connection (field_182)
                const vespaConnectionRaw = this.getFieldValue(record, fields.studentVESPAConnection, '');
                let vespaConnectionId = '';
                let vespaConnectionEmail = '';
                
                // Extract ID and email from the HTML span (Knack connection field format)
                if (vespaConnectionRaw && vespaConnectionRaw.includes('<span')) {
                    // Extract the connection ID from the span class attribute
                    // Knack uses format: <span class="connectionID">display text</span>
                    const classMatch = vespaConnectionRaw.match(/class="([^"]+)"/);
                    if (classMatch && classMatch[1]) {
                        // The class contains the connected record ID
                        vespaConnectionId = classMatch[1];
                    }
                    
                    // Extract display text (which might be email)
                    const textMatch = vespaConnectionRaw.match(/>([^<]+)</);
                    if (textMatch && textMatch[1]) {
                        const displayText = textMatch[1].trim();
                        if (displayText.includes('@')) {
                            vespaConnectionEmail = displayText;
                        }
                    }
                    
                    // Also check for mailto links
                    const emailMatch = vespaConnectionRaw.match(/mailto:([^"]+)"/);
                    if (emailMatch) {
                        vespaConnectionEmail = emailMatch[1];
                    }
                } else if (vespaConnectionRaw) {
                    // If it's not HTML, it might be just the ID or email
                    vespaConnectionId = vespaConnectionRaw.trim();
                    if (vespaConnectionRaw.includes('@')) {
                        vespaConnectionEmail = vespaConnectionRaw.trim();
                        vespaConnectionId = ''; // Clear ID if it's an email
                    }
                }
                
                log(`Student ${name} VESPA connection - ID: ${vespaConnectionId}, Email: ${vespaConnectionEmail}`);
                
                const student = {
                    id: record.id,
                    name: name,
                    email: email,
                    prescribedActivities: prescribedActivities,
                    prescribedActivityIds: prescribedActivityIds, // Store IDs of prescribed activities
                    finishedActivities: finishedActivityIds, // Store ALL completed activity IDs
                    prescribedCount: prescribedCount,
                    completedCount: completedCount, // Count of prescribed activities that are completed
                    totalCompletedCount: finishedActivityIds.length, // Total number of completed activities
                    progress: progressPercentage, // Progress based on prescribed activities
                    vespaScores: vespaScores,
                    categoryBreakdown: categoryBreakdown, // Add category breakdown
                    vespaConnectionId: vespaConnectionId,
                    vespaConnectionEmail: vespaConnectionEmail
                };
                
                return student;
            } catch (err) {
                error('Error parsing student record:', err, record);
                return null;
            }
        }
        
        // Load VESPA scores from Object_10 for all loaded students
        async loadVESPAScores() {
            log('Loading VESPA scores for students...');
            
            if (!this.state.students || this.state.students.length === 0) {
                log('No students to load VESPA scores for');
                return;
            }
            
            const objects = this.config.objects;
            const fields = this.config.fields;
            
            try {
                // Get all VESPA connection IDs and emails from students
                const vespaConnectionIds = this.state.students
                    .map(s => s.vespaConnectionId)
                    .filter(id => id); // Remove empty values
                    
                const vespaConnectionEmails = this.state.students
                    .map(s => s.vespaConnectionEmail)
                    .filter(email => email); // Remove empty values
                
                if (vespaConnectionIds.length === 0 && vespaConnectionEmails.length === 0) {
                    log('No VESPA connection IDs or emails found in student records');
                    return;
                }
                
                log('VESPA connection IDs:', vespaConnectionIds);
                log('VESPA connection emails:', vespaConnectionEmails);
                
                // Build OR conditions for the VESPA connection IDs
                const idConditions = vespaConnectionIds.map(connectionId => ({
                    field: 'id',
                    operator: 'is',
                    value: connectionId
                }));
                
                // Build OR conditions for emails
                const emailConditions = vespaConnectionEmails.map(email => ({
                    field: 'field_192', // Email field in Object_10
                    operator: 'is',
                    value: email
                }));
                
                // Combine all conditions
                const allConditions = [...idConditions, ...emailConditions];
                
                const filters = allConditions.length > 0 ? [{
                    match: 'or',
                    rules: allConditions
                }] : [];
                
                log('VESPA scores filter:', filters);
                log('Loading from object:', objects.vespaResults);
                log('Using Knack App ID:', this.config.knackAppId);
                
                // Load VESPA results
                const response = await $.ajax({
                    url: `https://api.knack.com/v1/objects/${objects.vespaResults}/records`,
                    type: 'GET',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey
                    },
                    data: {
                        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
                        page: 1,
                        rows_per_page: 1000
                    }
                });
                
                log('VESPA scores response:', response);
                
                if (response.records && response.records.length > 0) {
                    // Create maps for both ID and email lookups
                    const vespaMapById = new Map();
                    const vespaMapByEmail = new Map();
                    
                    response.records.forEach(record => {
                        log('VESPA record:', record);
                        log('VESPA record ID:', record.id);
                        log('VESPA record fields:', Object.keys(record));
                        
                        const scores = {
                            vision: parseFloat(record[fields.visionScore] || record.field_147) || 0,
                            effort: parseFloat(record[fields.effortScore] || record.field_148) || 0,
                            systems: parseFloat(record[fields.systemsScore] || record.field_149) || 0,
                            practice: parseFloat(record[fields.practiceScore] || record.field_150) || 0,
                            attitude: parseFloat(record[fields.attitudeScore] || record.field_151) || 0
                        };
                        
                        // Map by record ID
                        vespaMapById.set(record.id, scores);
                        
                        // Map by email if available
                        const email = record.field_192 || record.field_192_raw?.email;
                        if (email) {
                            vespaMapByEmail.set(email, scores);
                        }
                        
                        log(`VESPA scores for record ${record.id}:`, scores);
                    });
                    
                    log(`Loaded VESPA scores for ${response.records.length} records`);
                    
                    // Update student records with VESPA scores
                    this.state.students.forEach(student => {
                        // Try to find scores by connection ID or email
                        const scores = vespaMapById.get(student.vespaConnectionId) || 
                                      vespaMapByEmail.get(student.vespaConnectionEmail) ||
                                      vespaMapByEmail.get(student.email);
                        
                        if (scores) {
                            student.vespaScores = scores;
                            log(`Updated VESPA scores for ${student.name}:`, scores);
                        } else {
                            log(`No VESPA scores found for ${student.name} (ID: ${student.vespaConnectionId}, Email: ${student.vespaConnectionEmail})`);
                        }
                    });
                } else {
                    log('No VESPA scores found in Object_10');
                }
                
            } catch (err) {
                error('Failed to load VESPA scores:', err);
                log('VESPA scores error details:', err.responseJSON || err.responseText || err);
                // Don't throw - continue without VESPA scores
            }
        }
        
        // Load activities from JSON file with embedded data fallback
        async loadActivitiesFromJSON() {
            if (this.state.activitiesData) {
                log('Activities already loaded from JSON');
                return;
            }
            
            try {
                log('Loading activities data...');
                
                // CDN sources only (preferred: consolidated, field-rich JSON)
                const externalPaths = [
                    // Primary: consolidated JSON in this repo
                    'https://cdn.jsdelivr.net/gh/4Sighteducation/vespa-activities-v2@main/shared/utils/activitiesjsonwithfields1c.json',
                    // Secondary: field-rich JSON in FlashcardLoader (backup)
                    'https://cdn.jsdelivr.net/gh/4Sighteducation/FlashcardLoader@main/integrations/activitiesjsonwithfields.json',
                    'https://raw.githubusercontent.com/4Sighteducation/FlashcardLoader/main/integrations/activitiesjsonwithfields.json',
                    // Legacy fallbacks
                    'https://raw.githubusercontent.com/4Sighteducation/vespa-activities/main/activities1e.json',
                    'https://cdn.jsdelivr.net/gh/4Sighteducation/vespa-activities@latest/activities1e.json'
                ];
                
                for (const path of externalPaths) {
                    try {
                        const response = await $.ajax({
                            url: path,
                            type: 'GET',
                            dataType: 'json',
                            timeout: 5000,
                            crossDomain: true
                        });
                        
                        if (Array.isArray(response)) {
                            this.state.activitiesData = response;
                            log(`Loaded ${response.length} activities from external source`);
                            return;
                        }
                    } catch (err) {
                        log(`Failed to load from ${path}:`, err.status || err.message);
                    }
                }
                
                // If external loading fails, use embedded sample data for key activities
                log('Using embedded activity data as fallback');
                this.state.activitiesData = this.getEmbeddedActivities();
                log(`Loaded ${this.state.activitiesData.length} embedded activities`);
                
            } catch (err) {
                error('Error in loadActivitiesFromJSON:', err);
                // Use embedded data as final fallback
                this.state.activitiesData = this.getEmbeddedActivities();
            }
        }
        
        // Get embedded activity data (comprehensive list of activities)
        getEmbeddedActivities() {
            return [
                {
                    "Activities Name": "Managing Your Time",
                    "Activity_id": "5fcd517ba74fa2001bd48dad",
                    "VESPA Category": "Systems",
                    "background_content": "LEARN 💡\nTime management is one of the most crucial skills for academic success. Research shows that students who effectively manage their time achieve better grades, experience less stress, and have more time for activities they enjoy.\n\nEffective time management involves:\n• Creating realistic schedules\n• Prioritizing tasks by importance and urgency\n• Breaking large projects into smaller, manageable steps\n• Building in time for breaks and self-care\n• Using tools like calendars, planners, or apps\n\nREFLECT🤔\nThink about your current time management habits. Where do you struggle most? What strategies could help you use your time more effectively?",
                    "Level": "Level 2",
                    "media": {
                        "images": [
                            {
                                "url": "https://www.vespa.academy/assets/time-management.jpg",
                                "alt": "Time management strategies"
                            }
                        ]
                    },
                    "Active": true
                },
                {
                    "Activities Name": "Goal Setting",
                    "Activity_id": "5fef592f648880001c1b7296",
                    "VESPA Category": "Vision",
                    "background_content": "LEARN 💡\nSetting clear, achievable goals is fundamental to academic success. Goals give you direction, motivation, and a way to measure your progress.\n\nSMART goals are:\n• Specific - Clear and well-defined\n• Measurable - You can track progress\n• Achievable - Realistic given your circumstances\n• Relevant - Aligned with your values and priorities\n• Time-bound - Have a deadline\n\nREFLECT🤔\nWhat are your main academic goals? How can you make them more specific and measurable?",
                    "Level": "Level 1",
                    "Active": true
                },
                {
                    "Activities Name": "Active Learning Strategies",
                    "Activity_id": "5fcf4ac1e54816001f9c60ce",
                    "VESPA Category": "Practice",
                    "background_content": "LEARN 💡\nActive learning means engaging with material rather than passively reading or listening. Research shows active learners retain information better and develop deeper understanding.\n\nActive learning techniques include:\n• Summarizing in your own words\n• Creating mind maps or diagrams\n• Teaching concepts to others\n• Generating practice questions\n• Making connections to prior knowledge\n\nREFLECT🤔\nWhich active learning strategies do you currently use? What new techniques could you try?",
                    "Level": "Level 2",
                    "Active": true
                },
                {
                    "Activities Name": "Understanding Exams",
                    "Activity_id": "5fcd506ca74fa2001bd48da8",
                    "VESPA Category": "Practice",
                    "background_content": "LEARN 💡\nExam success isn't just about knowing the content - it's about understanding how exams work and developing effective strategies.\n\nKey exam strategies include:\n• Understanding the format and requirements\n• Practicing under timed conditions\n• Learning from past papers\n• Managing exam anxiety\n• Developing answer structures\n\nREFLECT🤔\nHow do you currently prepare for exams? What aspects of exam technique do you find most challenging?",
                    "Level": "Level 2",
                    "Active": true
                },
                {
                    "Activities Name": "Stopping Negative Thoughts",
                    "Activity_id": "6005f0b6041501001c676cb8",
                    "VESPA Category": "Attitude",
                    "background_content": "LEARN 💡\nNegative thinking patterns can significantly impact your academic performance and wellbeing. Learning to recognize and challenge these thoughts is a crucial skill.\n\nCommon negative thought patterns:\n• Catastrophizing - assuming the worst\n• All-or-nothing thinking\n• Mind reading - assuming what others think\n• Self-blame\n• Overgeneralization\n\nREFLECT🤔\nWhat negative thoughts do you experience about your studies? How can you challenge these thoughts with more balanced thinking?",
                    "Level": "Level 3",
                    "Active": true
                },
                {
                    "Activities Name": "Building Motivation",
                    "Activity_id": "5fef58e82872bc001e89dd32",
                    "VESPA Category": "Effort",
                    "background_content": "LEARN 💡\nMotivation is the driving force behind sustained effort. Understanding what motivates you and how to maintain motivation is essential for academic success.\n\nTypes of motivation:\n• Intrinsic - driven by personal interest and satisfaction\n• Extrinsic - driven by external rewards or consequences\n\nBuilding motivation involves:\n• Connecting learning to personal goals\n• Celebrating small wins\n• Finding meaning in your studies\n• Creating accountability systems\n\nREFLECT🤔\nWhat motivates you to study? How can you strengthen your motivation when it wanes?",
                    "Level": "Level 1",
                    "Active": true
                },
                {
                    "Activities Name": "Spaced Practice",
                    "Activity_id": "5fcf4a9bbf8cc5001fa96358",
                    "VESPA Category": "Practice",
                    "background_content": "LEARN 💡\nSpaced practice is one of the most effective learning strategies. Rather than cramming, spreading your study sessions over time helps create stronger, longer-lasting memories.\n\nBenefits of spaced practice:\n• Better long-term retention\n• Reduced study stress\n• More efficient use of time\n• Deeper understanding\n\nHow to implement:\n• Review material at increasing intervals\n• Use a study schedule or app\n• Mix different topics in each session\n• Test yourself regularly\n\nREFLECT🤔\nHow do you currently space out your studying? What changes could you make to use this technique more effectively?",
                    "Level": "Level 2",
                    "Active": true
                },
                {
                    "Activities Name": "Effort Thermometer",
                    "Activity_id": "5fef58e82872bc001e89dd33",
                    "VESPA Category": "Effort",
                    "background_content": "LEARN 💡\nThe Effort Thermometer helps you visualize and track your effort levels across different subjects and activities. Understanding where you're putting your energy helps you make better decisions about time allocation.\n\nUsing the Effort Thermometer:\n• Rate your effort in each subject (1-10)\n• Identify gaps between current and needed effort\n• Set specific targets for improvement\n• Monitor progress weekly\n\nREFLECT🤔\nWhich subjects are getting most of your effort? Where do you need to increase your effort levels?",
                    "Level": "Level 1",
                    "Active": true
                },
                {
                    "Activities Name": "Five Roads",
                    "Activity_id": "5fef5934f4ca8a001c79c6e8",
                    "VESPA Category": "Vision",
                    "background_content": "LEARN 💡\nThe Five Roads activity helps you explore different pathways to your goals. By considering multiple routes, you become more flexible and resilient in your planning.\n\nThe five roads represent:\n• The direct path - straightforward route\n• The scenic route - taking time to explore\n• The fast track - accelerated options\n• The alternative path - backup plans\n• The collaborative route - working with others\n\nREFLECT🤔\nWhat different paths could lead to your academic goals? Which route appeals to you most and why?",
                    "Level": "Level 2",
                    "Active": true
                },
                {
                    "Activities Name": "Force Field",
                    "Activity_id": "5fef5926d89dbd001c1c4c91",
                    "VESPA Category": "Vision",
                    "background_content": "LEARN 💡\nForce Field Analysis helps you identify the forces helping and hindering your progress towards goals. By understanding these forces, you can strengthen positive influences and reduce obstacles.\n\nHow to use Force Field Analysis:\n• List your goal\n• Identify helping forces (supporters, resources, skills)\n• Identify hindering forces (obstacles, challenges)\n• Rate the strength of each force\n• Develop strategies to increase helpers and decrease hinderers\n\nREFLECT🤔\nWhat forces are helping you succeed? What obstacles are holding you back? How can you shift the balance?",
                    "Level": "Level 1",
                    "Active": true
                }
            ];
        }
        
        // Load all activities
        async loadActivities() {
            log('Loading activities directly from Knack API...');
            
            const activities = [];
            const objects = this.config.objects;
            let page = 1; // Moved to function scope
            
            try {
                // First try to load from JSON for complete data
                await this.loadActivitiesFromJSON();
                
                // Load all pages of activity data from API
                let hasMorePages = true;
                
                while (hasMorePages) {
                    log(`Loading activities page ${page}...`);
                    
                    const response = await $.ajax({
                        url: `https://api.knack.com/v1/objects/${objects.activities}/records`,
                        type: 'GET',
                        headers: {
                            'X-Knack-Application-Id': this.config.knackAppId,
                            'X-Knack-REST-API-Key': this.config.knackApiKey
                        },
                        data: {
                            page: page,
                            rows_per_page: 1000
                        }
                    });
                    
                    log(`Activities API Response page ${page}:`, response);
                    
                    // Process each activity record
                    if (response.records && response.records.length > 0) {
                        response.records.forEach((record) => {
                            const activity = this.parseActivityFromRecord(record);
                            if (activity) {
                                // Try to match with JSON data for complete information
                                if (this.state.activitiesData) {
                                    const jsonActivity = this.state.activitiesData.find(
                                        a => a.Activity_id === activity.id || a.id === activity.id ||
                                        a['Activities Name'] === activity.name || a.name === activity.name
                                    );
                                    if (jsonActivity) {
                                        // Enrich with JSON data
                                        activity.hasBackgroundContent = !!(jsonActivity.background_content || jsonActivity.background);
                                        activity.media = jsonActivity.media;
                                        activity.level = parseInt((jsonActivity.Level || jsonActivity.level || '').toString().replace('Level ', '')) || activity.level;
                                        activity.scoreShowIfMoreThan = parseFloat(jsonActivity.field_1287 || jsonActivity.scoreMoreThan || 0) || activity.scoreShowIfMoreThan;
                                        activity.scoreShowIfLessEqual = parseFloat(jsonActivity.field_1294 || jsonActivity.scoreLessEqual || 0) || activity.scoreShowIfLessEqual;
                                    }
                                }
                                activities.push(activity);
                            }
                        });
                        
                        // Check if there are more pages
                        hasMorePages = response.records.length === 1000;
                        page++;
                    } else {
                        hasMorePages = false;
                    }
                }
                
                // If still no activities but we have JSON data, use that
                if (activities.length === 0) {
                    if (this.state.activitiesData && this.state.activitiesData.length > 0) {
                        log('No activities from API, using JSON data...');
                        this.state.activitiesData.forEach(jsonActivity => {
                            const id = jsonActivity.Activity_id || jsonActivity.id;
                            const name = jsonActivity['Activities Name'] || jsonActivity.field_1278 || jsonActivity.name;
                            const category = jsonActivity['VESPA Category'] || jsonActivity.field_1285 || jsonActivity.category || 'General';
                            const rawLevel = jsonActivity.Level || jsonActivity.field_3568 || jsonActivity.field_1295 || 1;
                            const level = parseInt(rawLevel.toString().replace('Level ', '')) || 1;
                            const moreThan = parseFloat(jsonActivity.field_1287 || jsonActivity.scoreMoreThan || 0) || 0;
                            const lessEqual = parseFloat(jsonActivity.field_1294 || jsonActivity.scoreLessEqual || 0) || 0;
                            if (id && name) {
                                activities.push({
                                    id,
                                    name,
                                    category,
                                    level,
                                    hasBackgroundContent: !!(jsonActivity.background_content || jsonActivity.background),
                                    media: jsonActivity.media,
                                    scoreShowIfMoreThan: moreThan,
                                    scoreShowIfLessEqual: lessEqual
                                });
                            }
                        });
                    } else {
                        // No JSON data either, use embedded activities directly
                        log('No activities from any source, using embedded activities...');
                        const embeddedActivities = this.getEmbeddedActivities();
                        embeddedActivities.forEach(activity => {
                            activities.push({
                                id: activity.Activity_id,
                                name: activity['Activities Name'],
                                category: activity['VESPA Category'],
                                level: parseInt(activity.Level?.replace('Level ', '')) || 1,
                                hasBackgroundContent: !!activity.background_content,
                                media: activity.media
                            });
                        });
                    }
                }
                
            } catch (err) {
                error('Failed to load activities:', err);
                log('Activities error details:', err.responseJSON || err.responseText || err);
            }
            
            this.state.activities = activities;
            log(`Loaded ${activities.length} activities across ${page - 1} pages`);
        }
        
        // parseActivityFromRow method removed - using direct API calls only
        
        // Parse activity data from API record
        parseActivityFromRecord(record) {
            try {
                const fields = this.config.fields;
                
                // Use helper to get field values and strip HTML
                const rawName = this.getFieldValue(record, fields.activityName, 'Unnamed Activity');
                const name = this.stripHtml(rawName); // Clean activity name
                
                const rawCategory = this.getFieldValue(record, fields.activityVESPACategory, 'Unknown');
                const category = this.stripHtml(rawCategory);
                
                // Also store as VESPACategory for consistency
                const VESPACategory = category;
                
                // Prefer new level field if present
                const levelValue = this.getFieldValue(record, fields.activityLevelAlt, this.getFieldValue(record, fields.activityLevel, '1'));
                
                // Log level field for debugging
                if (this.config.debug) {
                    log(`Activity "${name}" level field value:`, record[fields.activityLevel], 'parsed as:', parseInt(levelValue));
                }
                
                // Get additional fields and clean HTML if present
                let rawDescription = this.getFieldValue(record, fields.activityDescription, ''); // Activity description
                const description = this.stripHtml(rawDescription);
                
                const rawDuration = this.getFieldValue(record, fields.activityDuration, ''); // Activity duration
                const duration = this.stripHtml(rawDuration);
                
                const rawType = this.getFieldValue(record, fields.activityType, ''); // Activity type
                const type = this.stripHtml(rawType);
                
                // Bespoke curriculum tags
                const rawCurriculum = record[fields.activityCurriculum + '_raw'] || record[fields.activityCurriculum];
                const curriculums = this.parseCurriculumTags(rawCurriculum, category);

                const activity = {
                    id: record.id,
                    name: name,
                    ActivityName: name, // For backward compatibility
                    category: category,
                    VESPACategory: VESPACategory, // For backward compatibility
                    level: parseInt(levelValue) || 1,
                    Level: parseInt(levelValue) || 1, // For backward compatibility
                    description: description,
                    duration: duration || 'N/A',
                    type: type || 'Activity',
                    // thresholds to compute prescribed indicator
                    scoreShowIfMoreThan: parseFloat(this.getFieldValue(record, fields.activityScoreMoreThan, '0')) || 0,
                    scoreShowIfLessEqual: parseFloat(this.getFieldValue(record, fields.activityScoreLessEqual, '0')) || 0,
                    curriculums: curriculums
                };
                
                if (this.config.debug) {
                    log(`Parsed activity: ${name} (${record.id}) - Category: ${category}`);
                }
                
                return activity;
            } catch (err) {
                error('Error parsing activity record:', err, record);
                return null;
            }
        }
        
        // Parse curriculum tags from raw field data
        parseCurriculumTags(rawCurriculum, category) {
            if (!rawCurriculum) return [];
            
            try {
                // Handle different formats of curriculum data
                let curriculums = [];
                
                if (typeof rawCurriculum === 'string') {
                    // Handle CSV format or single value
                    curriculums = rawCurriculum.split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);
                } else if (Array.isArray(rawCurriculum)) {
                    // Handle array format (multi-select field)
                    curriculums = rawCurriculum
                        .map(item => typeof item === 'object' && item.identifier ? item.identifier : String(item))
                        .map(tag => String(tag).trim())
                        .filter(tag => tag.length > 0);
                } else if (typeof rawCurriculum === 'object' && rawCurriculum !== null) {
                    // Handle object format (single select or other structure)
                    if (rawCurriculum.identifier) {
                        curriculums = [rawCurriculum.identifier];
                    } else if (rawCurriculum.name) {
                        curriculums = [rawCurriculum.name];
                    } else {
                        curriculums = [String(rawCurriculum)];
                    }
                } else {
                    // Fallback: convert to string and split
                    curriculums = String(rawCurriculum).split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);
                }
                
                // Remove duplicates and sort
                return [...new Set(curriculums)].sort();
                
            } catch (err) {
                console.warn(`[VESPA Staff] Error parsing curriculum tags for category ${category}:`, err, rawCurriculum);
                return [];
            }
        }
        
        // Apply filters to student list
        applyFilters() {
            let filtered = [...this.state.students];
            
            // Search filter
            if (this.state.filters.search) {
                const search = this.state.filters.search.toLowerCase();
                filtered = filtered.filter(student => 
                    student.name.toLowerCase().includes(search) ||
                    student.email.toLowerCase().includes(search)
                );
            }
            
            // Progress filter
            if (this.state.filters.progress !== 'all') {
                filtered = filtered.filter(student => {
                    switch (this.state.filters.progress) {
                        case 'not-started':
                            return student.progress === 0;
                        case 'in-progress':
                            return student.progress > 0 && student.progress < 100;
                        case 'completed':
                            return student.progress === 100;
                        default:
                            return true;
                    }
                });
            }
            
            // Sort
            filtered.sort((a, b) => {
                let aVal, bVal;
                
                switch (this.state.sortColumn) {
                    case 'name':
                        aVal = a.name.toLowerCase();
                        bVal = b.name.toLowerCase();
                        break;
                    case 'progress':
                        aVal = a.progress;
                        bVal = b.progress;
                        break;
                    case 'allActivities': {
                        const aAll = new Set([...(a.prescribedActivityIds || []), ...(a.finishedActivities || [])]).size;
                        const bAll = new Set([...(b.prescribedActivityIds || []), ...(b.finishedActivities || [])]).size;
                        aVal = aAll; bVal = bAll;
                        break;
                    }
                    case 'completed':
                        aVal = a.completedCount;
                        bVal = b.completedCount;
                        break;
                    default:
                        aVal = a.name.toLowerCase();
                        bVal = b.name.toLowerCase();
                }
                
                if (this.state.sortDirection === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
            
            this.state.filteredStudents = filtered;
        }
        
        // Main render function
        render() {
            log('Render called - container exists:', !!this.container);
            if (!this.container) {
                error('Render failed: No container found');
                return;
            }
            
            log('Current view:', this.state.currentView, 'Student ID:', this.state.currentStudentId);
            
            // Check which view to render
            if (this.state.currentView === 'workspace' && this.state.currentStudentId) {
                // Re-render the workspace for the current student
                const student = this.state.students.find(s => s.id === this.state.currentStudentId);
                if (student) {
                    this.loadStudentResponses(this.state.currentStudentId).then(responses => {
                        this.loadLatestProgressByActivity(this.state.currentStudentId).then(progressByActivity => {
                            this.showStudentWorkspace(student, responses, progressByActivity);
                        });
                    });
                }
            } else {
                // Render the main list view (Page 1)
                log('Rendering main list view');
                try {
                    log('Calling render helper methods...');
                    const header = this.renderHeader();
                    log('Header rendered, length:', header.length);
                    
                    const filterBar = this.renderFilterBar();
                    log('Filter bar rendered, length:', filterBar.length);
                    
                    const studentTable = this.renderStudentTable();
                    log('Student table rendered, length:', studentTable.length);
                    
                    const modals = this.renderModals();
                    log('Modals rendered, length:', modals.length);
                    
                    const html = `
                        <div class="vespa-staff-container">
                            ${header}
                            ${filterBar}
                            ${studentTable}
                            ${modals}
                        </div>
                    `;
                    
                    log('HTML generated, setting container innerHTML');
                    log('HTML content preview:', html.substring(0, 300) + '...');
                    log('Container element:', this.container);
                    log('Container tagName:', this.container.tagName, 'ID:', this.container.id);
                    log('Container current content before (length):', this.container.innerHTML.length);
                    
                    this.container.innerHTML = html;
                    
                    log('Container content after (length):', this.container.innerHTML.length);
                    log('Container dimensions:', this.container.offsetHeight, 'x', this.container.offsetWidth);
                    log('Container computed styles:');
                    const computedStyle = window.getComputedStyle(this.container);
                    log('- display:', computedStyle.display);
                    log('- visibility:', computedStyle.visibility);
                    log('- opacity:', computedStyle.opacity);
                    log('- position:', computedStyle.position);
                    log('- z-index:', computedStyle.zIndex);
                    
                    // Check if content was actually inserted
                    const vespaContainer = this.container.querySelector('.vespa-staff-container');
                    log('VESPA container found after insertion:', !!vespaContainer);
                    if (vespaContainer) {
                        log('VESPA container dimensions:', vespaContainer.offsetHeight, 'x', vespaContainer.offsetWidth);
                    }
                    
                    this.state.currentView = 'list';
                    log('Main list view rendered successfully');
                } catch (renderError) {
                    error('Error in render process:', renderError);
                }
            }
            
            // Inject styles if not already present
            if (!document.getElementById('vespa-staff-styles')) {
                const styleLink = document.createElement('link');
                styleLink.id = 'vespa-staff-styles';
                styleLink.rel = 'stylesheet';
                styleLink.href = 'https://cdn.jsdelivr.net/gh/4Sighteducation/vespa-activities-v2@main/staff/VESPAactivitiesStaff2f.css';
                document.head.appendChild(styleLink);
            }
        }
        
        // Render header section
        renderHeader() {
            const avgProgress = this.calculateAverageProgress();
            
            return `
                <div class="staff-header">
                    <div class="staff-header-top">
                        <h1 class="staff-title">VESPA Activities Management</h1>
                        <div class="staff-actions">
                            <button class="btn btn-secondary" onclick="VESPAStaff.exportReport()">
                                📊 Export Report
                            </button>
                        </div>
                    </div>
                    <div class="role-info">
                        ${this.renderRoleSelector()}
                        <span class="student-count">
                            ${this.state.pagination.totalRecords > 0 ? 
                                `Showing ${this.state.filteredStudents.length} of ${this.state.pagination.totalRecords} Students` :
                                `${this.state.filteredStudents.length} Students`
                            }
                        </span>
                        <span class="student-count">Average Progress: ${avgProgress}%</span>
                    </div>
                </div>
            `;
        }
        
        // Render role selector if multiple roles
        renderRoleSelector() {
            if (this.state.allRoles.length <= 1) {
                return `<span class="role-name">Role: ${this.state.currentRole.label}</span>`;
            }
            
            return `
                <div class="role-selector">
                    <label>View as:</label>
                    <select onchange="VESPAStaff.switchRole(this.value)">
                        ${this.state.allRoles.map((role, index) => `
                            <option value="${index}" ${role === this.state.currentRole ? 'selected' : ''}>
                                ${role.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }
        
        // Render filter bar
        renderFilterBar() {
            return `
                <div class="filter-bar">
                    <input type="text" 
                           class="search-input" 
                           placeholder="Search students..." 
                           value="${this.state.filters.search}"
                           onkeyup="VESPAStaff.updateSearch(this.value)">
                    
                    <select class="filter-select" onchange="VESPAStaff.updateProgressFilter(this.value)">
                        <option value="all">All Progress</option>
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    
                    <button class="btn btn-secondary" onclick="VESPAStaff.clearFilters()">
                        Clear Filters
                    </button>
                </div>
            `;
        }
        
        // Render student table
        renderStudentTable() {
            if (this.state.filteredStudents.length === 0) {
                return this.renderEmptyState();
            }
            
            return `
                <div class="student-table-container">
                    <div class="bulk-toolbar">
                        <label><input type="checkbox" onchange="VESPAStaff.toggleSelectAll(this.checked)"> Select all (filtered)</label>
                        <button class="btn" onclick="VESPAStaff.clearSelection()">Clear selection</button>
                        <button class="btn btn-primary" onclick="VESPAStaff.openBulkAdd()">Add activities to selected</button>
                        <div class="display-toggle">
                            <button class="toggle-btn ${this.state.displayMode === 'activities' ? 'active' : ''}" 
                                    onclick="VESPAStaff.setDisplayMode('activities')">
                                Activities
                            </button>
                            <button class="toggle-btn ${this.state.displayMode === 'scores' ? 'active' : ''}" 
                                    onclick="VESPAStaff.setDisplayMode('scores')">
                                Scores
                            </button>
                        </div>
                        <span class="selection-count">${this.state.selectedStudents.size} selected</span>
                    </div>
                    <table class="student-table">
                        <thead>
                            <tr>
                                <th style="width:36px"><input type="checkbox" onchange="VESPAStaff.toggleSelectAll(this.checked)"></th>
                                <th class="sortable ${this.getSortClass('name')}" 
                                    onclick="VESPAStaff.sort('name')">
                                    Student Name
                                </th>
                                <!-- Combined VESPA Category Columns -->
                                <th class="vespa-column vision">
                                    <div class="vespa-column-header">
                                        <span class="category-icon">V</span>
                                        <span>Vision</span>
                                    </div>
                                </th>
                                <th class="vespa-column effort">
                                    <div class="vespa-column-header">
                                        <span class="category-icon">E</span>
                                        <span>Effort</span>
                                    </div>
                                </th>
                                <th class="vespa-column systems">
                                    <div class="vespa-column-header">
                                        <span class="category-icon">S</span>
                                        <span>Systems</span>
                                    </div>
                                </th>
                                <th class="vespa-column practice">
                                    <div class="vespa-column-header">
                                        <span class="category-icon">P</span>
                                        <span>Practice</span>
                                    </div>
                                </th>
                                <th class="vespa-column attitude">
                                    <div class="vespa-column-header">
                                        <span class="category-icon">A</span>
                                        <span>Attitude</span>
                                    </div>
                                </th>
                                <th>View</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.state.filteredStudents.map(student => 
                                this.renderStudentRow(student)
                            ).join('')}
                        </tbody>
                    </table>
                </div>
                ${this.state.pagination.hasMore ? `
                    <div class="load-more-container">
                        <button class="btn btn-primary" onclick="VESPAStaff.loadMoreStudents()" 
                                ${this.state.isLoading ? 'disabled' : ''}>
                            ${this.state.isLoading ? 'Loading...' : 'Load More Students'}
                        </button>
                        <p class="load-more-info">
                            Showing ${this.state.students.length} of ${this.state.pagination.totalRecords} total students
                        </p>
                    </div>
                ` : ''}
            `;
        }
        
        // Render individual student row
        renderStudentRow(student) {
            const categories = ['vision', 'effort', 'systems', 'practice', 'attitude'];
            const categoryData = student.categoryBreakdown || {};
            const vespaScores = student.vespaScores || {};
            
            return `
                <tr data-student-id="${student.id}">
                    <td><input type="checkbox" ${this.state.selectedStudents.has(student.id) ? 'checked' : ''} onchange="VESPAStaff.toggleStudentSelection('${student.id}', this.checked)"></td>
                    <td class="student-info-cell">
                        <div class="student-name">${student.name}</div>
                        <div class="student-email">${student.email}</div>
                        <div class="student-progress-bar" title="${student.completedCount} of ${student.prescribedCount} curriculum activities completed">
                            <div class="progress-fill" style="width: ${student.progress}%"></div>
                        </div>
                    </td>
                    ${categories.map(cat => {
                        const activities = categoryData[cat] || [];
                        const completedCount = activities.filter(a => a.completed).length;
                        const totalCount = activities.length;
                        const score = vespaScores[cat] || 0;
                        
                        // Generate activity list for tooltip (clean HTML tags)
                        const activityList = activities.map(a => {
                            const cleanName = this.stripHtml(a.name || '');
                            return `${a.completed ? '✅' : '⭕'} ${cleanName}`;
                        }).join('\n');
                        
                        if (this.state.displayMode === 'scores') {
                            // Show scores mode - current display
                            return `
                                <td class="vespa-data-cell">
                                    <div class="vespa-score-display ${cat}" title="${cat.charAt(0).toUpperCase() + cat.slice(1)} Score: ${Math.round(score)}/10">
                                        ${Math.round(score)}
                                    </div>
                                </td>
                            `;
                        } else {
                            // Show activities mode - completed/total ratio with hover
                            return `
                                <td class="vespa-data-cell">
                                    <div class="vespa-activity-display ${cat}" 
                                         title="${cat.charAt(0).toUpperCase() + cat.slice(1)} Activities:&#10;${activityList}">
                                        <span class="activity-ratio">${completedCount}/${totalCount}</span>
                                    </div>
                                </td>
                            `;
                        }
                    }).join('')}
                    <td>
                        <div class="action-buttons">
                            <button class="vespa-view-button view-btn" 
                                    onclick="VESPAStaff.viewStudent('${student.id}')"
                                    title="View activities for this student">
                                👁️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        // Selection helpers for bulk add
        toggleStudentSelection(studentId, checked) {
            if (checked) {
                this.state.selectedStudents.add(studentId);
            } else {
                this.state.selectedStudents.delete(studentId);
            }
            const countBadge = document.querySelector('.selection-count');
            if (countBadge) countBadge.textContent = `${this.state.selectedStudents.size} selected`;
            
            // Update the table to reflect selection changes
            this.updateSelectionUI();
        }
        
        updateSelectionUI() {
            // Update individual checkboxes
            document.querySelectorAll('input[type="checkbox"][onchange*="toggleStudentSelection"]').forEach(checkbox => {
                const studentId = checkbox.getAttribute('onchange').match(/'([^']+)'/)[1];
                checkbox.checked = this.state.selectedStudents.has(studentId);
            });
            
            // Update select all checkbox
            const selectAllCheckbox = document.querySelector('input[type="checkbox"][onchange*="toggleSelectAll"]');
            if (selectAllCheckbox) {
                const totalVisible = this.state.filteredStudents.length;
                const selectedVisible = this.state.filteredStudents.filter(s => this.state.selectedStudents.has(s.id)).length;
                selectAllCheckbox.checked = totalVisible > 0 && selectedVisible === totalVisible;
                selectAllCheckbox.indeterminate = selectedVisible > 0 && selectedVisible < totalVisible;
            }
        }
        
        toggleSelectAll(checked) {
            if (checked) {
                this.state.selectedStudents = new Set(this.state.filteredStudents.map(s => s.id));
            } else {
                this.state.selectedStudents.clear();
            }
            this.updateSelectionUI();
        }
        
        clearSelection() {
            this.state.selectedStudents.clear();
            this.updateSelectionUI();
        }
        
        openBulkAdd() {
            if (this.state.selectedStudents.size === 0) {
                alert('Select at least one student first');
                return;
            }
            this.showAssignModal();
        }
        
        // Render category breakdown with hover functionality
        renderCategoryBreakdown(student) {
            const categories = ['vision', 'effort', 'systems', 'practice', 'attitude'];
            const categoryData = student.categoryBreakdown || {};
            
            return `
                <div class="category-cards">
                    ${categories.map(cat => {
                        const activities = categoryData[cat] || [];
                        const completedCount = activities.filter(a => a.completed).length;
                        const totalCount = activities.length;
                        
                        // Create hover content
                        const hoverContent = activities.length > 0 ? `
                            <div class="category-hover-content">
                                <div class="hover-title">${cat.charAt(0).toUpperCase() + cat.slice(1)} Activities</div>
                                <div class="hover-stats">${completedCount} of ${totalCount} completed</div>
                                <div class="hover-activities">
                                    ${activities.map(a => `
                                        <div class="hover-activity ${a.completed ? 'completed' : 'pending'}">
                                            ${a.completed ? '✓' : '○'} ${this.escapeHtml(a.name)}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : `
                            <div class="category-hover-content">
                                <div class="hover-title">${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
                                <div class="hover-empty">No activities assigned</div>
                            </div>
                        `;
                        
                        return `
                            <div class="category-card ${cat}" 
                                 data-category="${cat}"
                                 data-student-id="${student.id}">
                                <div class="category-icon">${this.getCategoryIcon(cat)}</div>
                                <div class="category-count">
                                    ${totalCount > 0 ? `<span class="count-completed">${completedCount}</span>/<span class="count-total">${totalCount}</span>` : '0'}
                                </div>
                                <div class="category-hover-panel">${hoverContent}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        // Get category icon
        getCategoryIcon(category) {
            const icons = {
                vision: 'V',
                effort: 'E', 
                systems: 'S',
                practice: 'P',
                attitude: 'A'
            };
            return icons[category] || category.charAt(0).toUpperCase();
        }
        
        // Render VESPA score pills
        renderVESPAScores(scores) {
            if (!scores || typeof scores !== 'object') {
                return '<span class="no-scores">No scores</span>';
            }
            
            return Object.entries(scores).map(([key, value]) => `
                <span class="vespa-pill ${key}" title="${key}: ${value}/10">
                    ${value ? value.toFixed(1) : '0.0'}
                </span>
            `).join('');
        }
        
        // Render empty state
        renderEmptyState() {
            return `
                <div class="student-table-container">
                    <div class="empty-state">
                        <div class="empty-state-icon">📚</div>
                        <div class="empty-state-text">
                            No students found matching your filters
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Render modal containers
        renderModals() {
            return `
                <div id="assign-modal" class="modal-overlay" style="display: none;">
                    <div class="modal">
                        <div class="modal-header">
                            <h2 class="modal-title">Assign Activities</h2>
                            <button class="modal-close" onclick="VESPAStaff.closeModal('assign-modal')">
                                ×
                            </button>
                        </div>
                        <div class="modal-body" id="assign-modal-body">
                            <!-- Content will be dynamically inserted -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="VESPAStaff.closeModal('assign-modal')">
                                Cancel
                            </button>
                            <button class="btn btn-primary" onclick="VESPAStaff.confirmAssignment()">
                                Assign Selected
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Setup event listeners
        setupEventListeners() {
            // Close modals on outside click
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    e.target.style.display = 'none';
                }
            });
            
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeAllModals();
                }
            });
        }
        
        // Helper functions
        calculateAverageProgress() {
            if (this.state.filteredStudents.length === 0) return 0;
            const total = this.state.filteredStudents.reduce((sum, s) => sum + s.progress, 0);
            return Math.round(total / this.state.filteredStudents.length);
        }
        
        getSortClass(column) {
            if (this.state.sortColumn !== column) return '';
            return this.state.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
        }
        
        showLoading() {
            if (this.container) {
                this.container.innerHTML = `
                    <div class="loading-overlay">
                        <div class="spinner"></div>
                    </div>
                `;
            }
        }
        
        showError(message) {
            if (this.container) {
                this.container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <div class="empty-state-text">${message}</div>
                    </div>
                `;
            }
        }
        
        // Show success modal
        showSuccessModal(title, message, callback = null) {
            const modalHtml = `
                <div class="modal-overlay" id="success-modal" onclick="staffManager.closeSuccessModal()">
                    <div class="modal-content success-modal" onclick="event.stopPropagation()">
                        <div class="modal-header success-header">
                            <div class="success-icon">✅</div>
                            <h3>${title}</h3>
                            <button class="modal-close" onclick="staffManager.closeSuccessModal()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="staffManager.closeSuccessModal()">OK</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to body
            const modalElement = document.createElement('div');
            modalElement.innerHTML = modalHtml;
            document.body.appendChild(modalElement.firstElementChild);
            
            // Store callback for when modal is closed
            this.successCallback = callback;
        }
        
        closeSuccessModal() {
            const modal = document.getElementById('success-modal');
            if (modal) {
                modal.remove();
            }
            
            // Execute callback if provided
            if (this.successCallback) {
                this.successCallback();
                this.successCallback = null;
            }
        }
        
        // Set display mode (activities or scores)
        setDisplayMode(mode) {
            if (mode !== 'activities' && mode !== 'scores') return;
            
            this.state.displayMode = mode;
            this.render();
        }
        
        // Public methods (exposed to global scope for event handlers)
        updateSearch(value) {
            this.state.filters.search = value;
            this.applyFilters();
            const currentFocus = document.activeElement;
            const focusId = currentFocus?.id || currentFocus?.className;
            this.render();
            
            // Restore focus to search input after render
            requestAnimationFrame(() => {
                const searchInput = this.container.querySelector('.search-input');
                if (searchInput && focusId && focusId.includes('search')) {
                    searchInput.focus();
                    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
                }
            });
        }
        
        updateProgressFilter(value) {
            this.state.filters.progress = value;
            this.applyFilters();
            this.render();
        }
        
        clearFilters() {
            this.state.filters = {
                search: '',
                progress: 'all',
                group: 'all'
            };
            this.applyFilters();
            this.render();
        }
        
        sort(column) {
            if (this.state.sortColumn === column) {
                this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.state.sortColumn = column;
                this.state.sortDirection = 'asc';
            }
            this.applyFilters();
            this.render();
        }
        
        switchRole(index) {
            this.state.currentRole = this.state.allRoles[parseInt(index)];
            this.loadData().then(() => this.render());
        }
        
        // Navigate back to the list view (Page 1)
        backToList() {
            this.state.currentView = 'list';
            this.state.currentStudentId = null;
            this.render();
        }
        
        async viewStudent(studentId) {
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) return;
            
            // Show loading state
            this.showLoading();
            
            try {
                // Load student's activity responses if role has permission
                let responses = [];
                if (this.state.currentRole.canViewAnswers) {
                    responses = await this.loadStudentResponses(studentId);
                }

                // Load latest progress per activity for origin badges
                const progressByActivity = await this.loadLatestProgressByActivity(studentId);
                
                // Set state for navigation
                this.state.currentView = 'workspace';
                this.state.currentStudentId = studentId;
                
                // Render full-screen workspace view (top/bottom)
                this.showStudentWorkspace(student, responses, progressByActivity);
                
            } catch (err) {
                error('Failed to load student details:', err);
                alert('Error loading student details. Please try again.');
            } finally {
                this.hideLoading();
            }
        }

        // Build student activity data ONLY from Object_6 prescribed activities
        buildStudentActivityData(student, responses, progressByActivity = new Map()) {
            log(`Building student activity data for ${student.name}`);
            log(`Prescribed activity IDs:`, student.prescribedActivityIds);
            log(`Finished activity IDs:`, student.finishedActivities);
            
            const entries = [];
            
            // ONLY use the student's prescribed activities from Object_6 field_1683
            const prescribedActivityIds = student.prescribedActivityIds || [];
            
            prescribedActivityIds.forEach(activityId => {
                const activity = this.activitiesMap?.get(activityId);
                if (!activity) {
                    log(`WARNING: Prescribed activity ${activityId} not found in activitiesMap`);
                    return;
                }
                
                const isCompleted = (student.finishedActivities || []).includes(activityId);
                const response = responses.find(r => r.activityId === activityId);
                const latestProgress = progressByActivity.get(activityId);
                const selectedVia = latestProgress ? latestProgress[this.config.fields.progressSelectedVia] : '';
                const isStaffAdded = selectedVia === 'staff_assigned';
                const isReportGenerated = selectedVia === 'report_generated';
                const isSelfSelected = !isStaffAdded && !isReportGenerated;
                
                entries.push({
                    ...activity,
                    isCompleted,
                    response,
                    studentId: student.id,
                    questions: [],
                    showPrescribedBadge: true, // All these are prescribed
                    showStaffBadge: isStaffAdded,
                    showSelfBadge: isSelfSelected,
                    showReportBadge: isReportGenerated
                });
            });
            
            log(`Built ${entries.length} student activities from prescribed list`);
            return entries;
        }

        // Full-screen student workspace - RADICAL REDESIGN
        showStudentWorkspace(student, responses = [], progressByActivity = new Map()) {
            const studentActivities = this.buildStudentActivityData(student, responses, progressByActivity);
            const categories = ['vision', 'effort', 'systems', 'practice', 'attitude'];
            
            // Group student activities by category (these are from Object_6 prescribed list)
            const studentActivitiesByCategory = {};
            categories.forEach(cat => {
                studentActivitiesByCategory[cat] = studentActivities.filter(a => 
                    (a.category || a.VESPACategory || '').toLowerCase() === cat
                );
            });
            
            // Group ALL available activities by category (for assignment)
            const assignedActivityIds = new Set(studentActivities.map(a => a.id));
            const allActivitiesByCategory = {};
            categories.forEach(cat => {
                allActivitiesByCategory[cat] = this.state.activities.filter(a => 
                    !assignedActivityIds.has(a.id) && (a.category || a.VESPACategory || '').toLowerCase() === cat
                );
            });
            
            log(`Student activities by category:`, studentActivitiesByCategory);
            log(`All activities by category:`, Object.keys(allActivitiesByCategory).map(cat => ({
                category: cat,
                count: allActivitiesByCategory[cat].length
            })));

            const html = `
                <div class="workspace-radical">
                    <!-- Header -->
                    <div class="workspace-header-compact">
                        <button class="btn-back-compact" onclick="VESPAStaff.backToList()">
                            ← Back to List
                        </button>
                        <button class="btn-page-nav" onclick="VESPAStaff.render()" title="Go to Page 1">
                            📊 Page 1
                        </button>
                        <div class="student-info-compact">
                            <h3>${this.escapeHtml(student.name)}</h3>
                            <span>${studentActivities.length} activities assigned</span>
                        </div>
                        <div class="header-actions">
                            <input type="search" 
                                   class="search-activities-compact" 
                                   placeholder="Search activities..."
                                   onkeyup="VESPAStaff.filterAllActivities(this.value)">
                            <button class="btn-clear-all-compact" onclick="VESPAStaff.confirmClearAll('${student.id}')">
                                Clear All Activities
                            </button>
                        </div>
                    </div>
                    
                    <!-- Main Content Area -->
                    <div class="workspace-content">
                        <!-- Student Activities Section -->
                        <div class="student-section">
                            <div class="section-header-compact">
                                <h4>Student Activities</h4>
                            </div>
                            <div class="activities-by-category student">
                                ${categories.map(category => `
                                    <div class="category-column ${category}">
                                        <div class="column-header-compact ${category}">
                                            <span class="cat-icon">${this.getCategoryIcon(category)}</span>
                                            <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                            <span class="count">${studentActivitiesByCategory[category].length}</span>
                                        </div>
                                        <div class="column-activities-compact" 
                                             id="student-${category}"
                                             ondrop="VESPAStaff.onDropToStudentCategory(event, '${student.id}', '${category}')" 
                                             ondragover="event.preventDefault()"
                                             ondragenter="event.currentTarget.classList.add('drag-over')"
                                             ondragleave="event.currentTarget.classList.remove('drag-over')">
                                            ${studentActivitiesByCategory[category].map(activity => 
                                                this.renderCompactActivityCard(activity, true, student.id)
                                            ).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Divider -->
                        <div class="section-divider"></div>
                        
                        <!-- All Activities Section -->
                        <div class="all-section">
                            <div class="section-header-compact">
                                <h4>All Activities</h4>
                            </div>
                            <div class="activities-by-category all">
                                ${categories.map(category => `
                                    <div class="category-column ${category}">
                                        <div class="column-header-compact ${category}">
                                            <span class="cat-icon">${this.getCategoryIcon(category)}</span>
                                            <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                                            <span class="count">${allActivitiesByCategory[category].length}</span>
                                        </div>
                                        <div class="column-activities-compact" 
                                             id="all-${category}"
                                             ondrop="VESPAStaff.onDropToAllCategory(event, '${student.id}', '${category}')" 
                                             ondragover="event.preventDefault()"
                                             ondragenter="event.currentTarget.classList.add('drag-over')"
                                             ondragleave="event.currentTarget.classList.remove('drag-over')">
                                            ${allActivitiesByCategory[category].map(activity => 
                                                this.renderCompactActivityCard(activity, false, student.id)
                                            ).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Replace container content
            if (this.container) {
                this.container.innerHTML = html;
                // Initialize tooltips and event handlers
                this.initializeWorkspaceEvents();
            }
        }
        
        // Render compact activity card for the radical redesign
        renderCompactActivityCard(activity, isStudent, studentId) {
            const isCompleted = activity.isCompleted || false;
            const category = (activity.VESPACategory || activity.category || '').toLowerCase();
            const activityName = this.escapeHtml(activity.ActivityName || activity.name || 'Unnamed');
            
            // Determine origin for student activities
            let originIndicator = '';
            if (isStudent) {
                if (activity.showPrescribedBadge) originIndicator = 'Q';
                else if (activity.showStaffBadge) originIndicator = 'T';
                else if (activity.showSelfBadge) originIndicator = 'S';
            }
            
            return `
                <div class="compact-activity-card ${category} ${isCompleted ? 'completed' : ''}" 
                     draggable="true"
                     data-activity-id="${activity.id}"
                     data-student-id="${studentId}"
                     data-is-student="${isStudent}"
                     ondragstart="VESPAStaff.onDragStart(event, '${activity.id}', '${studentId}')"
                     onclick="VESPAStaff.showActivityDetails('${activity.id}', '${studentId}')"
                     title="${activityName}">
                    ${isCompleted ? '<span class="completion-icon">✓</span>' : ''}
                    ${originIndicator ? `<span class="origin-indicator">${originIndicator}</span>` : ''}
                    <span class="activity-text">${activityName}</span>
                    ${isStudent && isCompleted ? 
                        `<button class="btn-uncomplete-compact" 
                                 onclick="event.stopPropagation(); VESPAStaff.toggleActivityCompletion('${studentId}', '${activity.id}')"
                                 title="Mark as incomplete">
                            ↺
                        </button>` : ''
                    }
                    ${isStudent ? 
                        `<button class="btn-remove-compact" 
                                 onclick="event.stopPropagation(); VESPAStaff.removeActivityFromStudent('${studentId}', '${activity.id}')"
                                 title="Remove">
                            −
                        </button>` : 
                        `<button class="btn-add-compact" 
                                 onclick="event.stopPropagation(); VESPAStaff.quickAddActivity('${studentId}', '${activity.id}')"
                                 title="Add">
                            +
                        </button>`
                    }
                </div>
            `;
        }
        
        // Render student activity card (with completed state and indicators)
        renderStudentActivityCard(activity, studentId) {
            const isCompleted = activity.isCompleted;
            const origin = activity.origin || 'unknown';
            
            return `
                <div class="student-activity-card ${isCompleted ? 'completed' : ''} ${origin}" 
                     draggable="true"
                     data-activity-id="${activity.id}"
                     data-student-id="${studentId}"
                     ondragstart="VESPAStaff.onDragStart(event, '${activity.id}', '${studentId}')"
                     onclick="VESPAStaff.showActivityDetails('${activity.id}', '${studentId}')">
                    
                    ${isCompleted ? '<div class="completion-flag">🏁</div>' : ''}
                    
                    <div class="activity-indicators">
                        ${origin === 'prescribed' ? '<span class="indicator prescribed" title="From questionnaire">Q</span>' : ''}
                        ${origin === 'self' ? '<span class="indicator self" title="Student added">S</span>' : ''}
                        ${origin === 'staff' ? '<span class="indicator staff" title="Staff added">T</span>' : ''}
                    </div>
                    
                    <div class="card-content">
                        <div class="activity-name">${this.escapeHtml(activity.name || activity.ActivityName)}</div>
                        <div class="activity-meta">
                            <span class="category-badge ${(activity.category || '').toLowerCase()}">
                                ${activity.category || 'Unknown'}
                            </span>
                            <span class="level">Level ${activity.level || '?'}</span>
                        </div>
                    </div>
                    
                    <div class="card-actions">
                        <button class="btn-remove" 
                                onclick="event.stopPropagation(); VESPAStaff.removeActivityFromStudent('${studentId}', '${activity.id}')"
                                title="Remove from student">
                            <span>−</span>
                        </button>
                        ${isCompleted ? 
                            `<button class="btn-uncomplete" 
                                     onclick="event.stopPropagation(); VESPAStaff.uncompleteActivity('${studentId}', '${activity.id}')"
                                     title="Mark as incomplete">
                                <span>↺</span>
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
        }
        
        // Render all activity card (in columns)
        renderAllActivityCard(activity, student) {
            // Check if this activity is already assigned to the student
            const isAssigned = student.prescribedActivityIds?.includes(activity.id) ||
                              student.finishedActivities?.includes(activity.id);
            
            return `
                <div class="all-activity-card ${isAssigned ? 'assigned' : ''}" 
                     draggable="true"
                     data-activity-id="${activity.id}"
                     ondragstart="VESPAStaff.onDragStart(event, '${activity.id}')"
                     onclick="VESPAStaff.previewActivity('${activity.id}')">
                    
                    <div class="card-header">
                        <span class="activity-name">${this.escapeHtml(activity.ActivityName || activity.name)}</span>
                        ${isAssigned ? '<span class="assigned-badge">✓</span>' : ''}
                    </div>
                    
                    <div class="card-footer">
                        <span class="level">L${activity.Level || '?'}</span>
                        <button class="btn-add" 
                                onclick="event.stopPropagation(); VESPAStaff.quickAddActivity('${student.id}', '${activity.id}')"
                                title="Add to student"
                                ${isAssigned ? 'disabled' : ''}>
                            <span>+</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Initialize workspace events
        initializeWorkspaceEvents() {
            // Add any additional event initialization here
            console.log('Workspace events initialized');
        }
        
        // Filter activities in workspace
        filterAllActivities(searchTerm) {
            const term = searchTerm.toLowerCase();
            document.querySelectorAll('.all-activity-card').forEach(card => {
                const name = card.querySelector('.activity-name').textContent.toLowerCase();
                card.style.display = name.includes(term) ? 'block' : 'none';
            });
        }
        
        // Quick add activity without drag
        async quickAddActivity(studentId, activityId) {
            await this.addActivityToStudent(studentId, activityId);
            // Refresh the workspace view
            const student = this.state.students.find(s => s.id === studentId);
            if (student) {
                const responses = await this.loadStudentResponses(studentId);
                const progressByActivity = await this.loadLatestProgressByActivity(studentId);
                this.showStudentWorkspace(student, responses, progressByActivity);
            }
        }
        
        // Handle drop to student activities area
        async onDropToStudent(event, studentId) {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over');
            
            const activityId = event.dataTransfer.getData('activityId');
            if (activityId) {
                await this.addActivityToStudent(studentId, activityId);
                // Refresh the workspace
                const student = this.state.students.find(s => s.id === studentId);
                if (student) {
                    const responses = await this.loadStudentResponses(studentId);
                    const progressByActivity = await this.loadLatestProgressByActivity(studentId);
                    this.showStudentWorkspace(student, responses, progressByActivity);
                }
            }
        }
        
        // Handle drop to student category
        async onDropToStudentCategory(event, studentId, category) {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over');
            
            const activityId = event.dataTransfer.getData('activityId');
            if (activityId) {
                await this.addActivityToStudent(studentId, activityId);
                // Refresh the workspace
                const student = this.state.students.find(s => s.id === studentId);
                if (student) {
                    const responses = await this.loadStudentResponses(studentId);
                    const progressByActivity = await this.loadLatestProgressByActivity(studentId);
                    this.showStudentWorkspace(student, responses, progressByActivity);
                }
            }
        }
        
        // Handle drop to all activities category
        async onDropToAllCategory(event, studentId, category) {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over');
            
            const activityId = event.dataTransfer.getData('activityId');
            const fromStudent = event.dataTransfer.getData('studentId') === studentId;
            
            if (activityId && fromStudent) {
                await this.removeActivityFromStudent(studentId, activityId);
                // Refresh the workspace
                const student = this.state.students.find(s => s.id === studentId);
                if (student) {
                    const responses = await this.loadStudentResponses(studentId);
                    const progressByActivity = await this.loadLatestProgressByActivity(studentId);
                    this.showStudentWorkspace(student, responses, progressByActivity);
                }
            }
        }
        
        // Toggle activity completion status
        async toggleActivityCompletion(studentId, activityId) {
            try {
                const student = this.state.students.find(s => s.id === studentId);
                if (!student) return;
                
                const finishedActivities = student.finishedActivities || [];
                const isCurrentlyCompleted = finishedActivities.includes(activityId);
                
                let newFinishedActivities;
                if (isCurrentlyCompleted) {
                    // Remove from completed
                    newFinishedActivities = finishedActivities.filter(id => id !== activityId);
                } else {
                    // Add to completed
                    newFinishedActivities = [...finishedActivities, activityId];
                }
                
                // Update field_1380 (finished activities) using direct API call
                await $.ajax({
                    url: `https://api.knack.com/v1/objects/${this.config.objects.student}/records/${studentId}`,
                    type: 'PUT',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        [this.config.fields.finishedActivities]: newFinishedActivities.join(',')
                    })
                });
                
                // Update local state
                student.finishedActivities = newFinishedActivities;
                
                // Refresh the workspace
                const responses = await this.loadStudentResponses(studentId);
                const progressByActivity = await this.loadLatestProgressByActivity(studentId);
                this.showStudentWorkspace(student, responses, progressByActivity);
                
            } catch (err) {
                error('Failed to toggle activity completion:', err);
                alert('Failed to update activity status. Please try again.');
            }
        }
        
        // Handle drop to all activities column
        async onDropToColumn(event, category) {
            event.preventDefault();
            event.currentTarget.classList.remove('drag-over');
            // Activities dropped back to columns are removed from student
            const activityId = event.dataTransfer.getData('activityId');
            const studentId = event.dataTransfer.getData('studentId');
            
            if (activityId && studentId) {
                await this.removeActivityFromStudent(studentId, activityId);
                // Refresh the workspace
                const student = this.state.students.find(s => s.id === studentId);
                if (student) {
                    const responses = await this.loadStudentResponses(studentId);
                    const progressByActivity = await this.loadLatestProgressByActivity(studentId);
                    this.showStudentWorkspace(student, responses, progressByActivity);
                }
            }
        }
        
        // Show activity details modal
        async showActivityDetails(activityId, studentId) {
            // Implementation for showing activity details
            await this.viewActivityDetails(activityId, studentId);
        }
        
        // Preview activity
        async previewActivity(activityId) {
            await this.viewEnhancedActivityPreview(activityId);
        }

        renderCurriculumPicker(studentId, category) {
            // Build curriculum options available in this category
            const options = new Set();
            this.state.activities.filter(a => a.category === category).forEach(a => (a.curriculums || []).forEach(c => options.add(c)));
            const list = Array.from(options).sort();
            if (list.length === 0) return '';
            const id = `curr-${category}-${studentId}`.replace(/\s+/g,'-');
            return `
                <select id="${id}" class="filter-select" onchange="VESPAStaff.addCurriculumSet('${studentId}','${category}', this.value)">
                    <option value="">Add curriculum…</option>
                    ${list.map(c => `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}</option>`).join('')}
                </select>`;
        }

        onDragStart(event, activityId, studentId = null) {
            event.dataTransfer.setData('activityId', activityId);
            if (studentId) {
                event.dataTransfer.setData('studentId', studentId);
            }
            event.dataTransfer.effectAllowed = 'move';
            event.currentTarget.classList.add('dragging');
        }
        async onDropInLane(event, studentId, category) {
            event.preventDefault();
            const activityId = event.dataTransfer.getData('text/plain');
            const activity = this.state.activities.find(a => a.id === activityId);
            if (!activity || activity.category !== category) return;
            await this.addActivityToStudent(studentId, activityId);
            await this.viewStudent(studentId);
        }

        // Actions for workspace
        async addActivityToStudent(studentId, activityId) {
            await this.updateStudentPrescribedActivities(studentId, [activityId]);
            await this.createAssignedProgressRecord(studentId, activityId);
        }
        async removeActivityFromStudent(studentId, activityId) {
            await this.removeFromStudentPrescribed(studentId, [activityId]);
            await this.markProgressRemoved(studentId, activityId);
            
            // Refresh the workspace
            const student = this.state.students.find(s => s.id === studentId);
            if (student) {
                const responses = await this.loadStudentResponses(studentId);
                const progressByActivity = await this.loadLatestProgressByActivity(studentId);
                this.showStudentWorkspace(student, responses, progressByActivity);
            }
        }
        async clearCategory(studentId, category) {
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) return;
            const current = this.buildStudentActivityData(student, [], new Map()).filter(a => a.category === category && !a.isCompleted);
            const ids = current.map(a => a.id);
            if (ids.length === 0) return;
            // Save undo info for snackbar
            this.state.lastUndo = { type: 'clearCategory', studentId, ids };
            await this.removeFromStudentPrescribed(studentId, ids);
            for (const aid of ids) await this.markProgressRemoved(studentId, aid);
            await this.viewStudent(studentId);
            this.showUndoSnackbar(`${ids.length} activity(ies) cleared from ${category}`, () => this.undoLastAction());
        }
        async addAllInCategory(studentId, category) {
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) return;
            const assigned = new Set(student.prescribedActivityIds || []);
            const toAdd = this.state.activities.filter(a => a.category === category && !assigned.has(a.id)).map(a => a.id);
            if (toAdd.length === 0) return;
            await this.updateStudentPrescribedActivities(studentId, toAdd);
            await Promise.all(toAdd.map(aid => this.createAssignedProgressRecord(studentId, aid)));
            await this.viewStudent(studentId);
        }
        async addCurriculumSet(studentId, category, curriculumName) {
            if (!curriculumName) return;
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) return;
            const assigned = new Set(student.prescribedActivityIds || []);
            const toAdd = this.state.activities
                .filter(a => a.category === category && (a.curriculums || []).includes(curriculumName) && !assigned.has(a.id))
                .map(a => a.id);
            if (toAdd.length === 0) return;
            await this.updateStudentPrescribedActivities(studentId, toAdd);
            await Promise.all(toAdd.map(aid => this.createAssignedProgressRecord(studentId, aid)));
            await this.viewStudent(studentId);
        }
        async removeFromStudentPrescribed(studentId, activityIds) {
            const fields = this.config.fields;
            const objects = this.config.objects;
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) return;
            const current = new Set(student.prescribedActivityIds || []);
            activityIds.forEach(id => current.delete(id));
            const updated = Array.from(current);
            await $.ajax({
                url: `https://api.knack.com/v1/objects/${objects.student}/records/${studentId}`,
                type: 'PUT',
                headers: {
                    'X-Knack-Application-Id': this.config.knackAppId,
                    'X-Knack-REST-API-Key': this.config.knackApiKey,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ [fields.prescribedActivities]: updated })
            });
            student.prescribedActivityIds = updated;
        }
        async markProgressRemoved(studentId, activityId) {
            const f = this.config.fields; const o = this.config.objects;
            try {
                const resp = await $.ajax({
                    url: `https://api.knack.com/v1/objects/${o.activityProgress}/records`,
                    type: 'GET',
                    headers: { 'X-Knack-Application-Id': this.config.knackAppId, 'X-Knack-REST-API-Key': this.config.knackApiKey },
                    data: { filters: JSON.stringify([
                        { field: f.progressStudent, operator: 'is', value: studentId },
                        { field: f.progressActivity, operator: 'is', value: activityId }
                    ]), rows_per_page: 1000 }
                });
                const records = resp.records || [];
                if (records.length > 0) {
                    await Promise.all(records.map(r => $.ajax({
                        url: `https://api.knack.com/v1/objects/${o.activityProgress}/records/${r.id}`,
                        type: 'PUT',
                        headers: { 'X-Knack-Application-Id': this.config.knackAppId, 'X-Knack-REST-API-Key': this.config.knackApiKey, 'Content-Type': 'application/json' },
                        data: JSON.stringify({ [f.progressStatus]: 'removed' })
                    })));
                } else {
                    // create a new record with removed status if none exist
                    await $.ajax({
                        url: `https://api.knack.com/v1/objects/${o.activityProgress}/records`,
                        type: 'POST',
                        headers: { 'X-Knack-Application-Id': this.config.knackAppId, 'X-Knack-REST-API-Key': this.config.knackApiKey, 'Content-Type': 'application/json' },
                        data: JSON.stringify({
                            [f.progressStudent]: studentId,
                            [f.progressActivity]: activityId,
                            [f.progressDateAssigned]: new Date().toISOString(),
                            [f.progressStatus]: 'removed',
                            [f.progressSelectedVia]: 'staff_assigned'
                        })
                    });
                }
            } catch (e) {
                error('Failed to mark progress removed', e);
            }
        }

        async clearAllActivities(studentId) {
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) return;
            const assigned = Array.from(new Set(student.prescribedActivityIds || []));
            if (assigned.length === 0) return;
            this.state.lastUndo = { type: 'clearAll', studentId, ids: assigned };
            await this.removeFromStudentPrescribed(studentId, assigned);
            for (const aid of assigned) await this.markProgressRemoved(studentId, aid);
            await this.viewStudent(studentId);
            this.showUndoSnackbar(`Cleared ${assigned.length} activities`, () => this.undoLastAction());
        }

        confirmClearAll(studentId) {
            if (confirm('Are you sure you want to clear all current activities? This can be undone for a short time.')) {
                this.clearAllActivities(studentId);
            }
        }

        async undoLastAction() {
            const action = this.state.lastUndo;
            if (!action) return;
            this.state.lastUndo = null;
            if (action.type === 'clearAll' || action.type === 'clearCategory') {
                await this.updateStudentPrescribedActivities(action.studentId, action.ids);
                await Promise.all(action.ids.map(aid => this.createAssignedProgressRecord(action.studentId, aid)));
                await this.viewStudent(action.studentId);
            }
        }

        showUndoSnackbar(message, onUndo) {
            const id = 'vespa-snackbar';
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('div');
                el.id = id;
                el.className = 'snackbar';
                document.body.appendChild(el);
            }
            el.innerHTML = `
                <span>${this.escapeHtml(message)}</span>
                <button class="btn btn-secondary" id="snackbar-undo">Undo</button>
            `;
            el.style.display = 'flex';
            el.querySelector('#snackbar-undo').onclick = () => { el.style.display = 'none'; onUndo && onUndo(); };
            setTimeout(() => { if (el) el.style.display = 'none'; }, 6000);
        }
        
        // Load student's activity responses
        async loadStudentResponses(studentId) {
            const fields = this.config.fields;
            const objects = this.config.objects;
            
            try {
                // API call to get activity answers for this student
                const response = await $.ajax({
                    url: `https://api.knack.com/v1/objects/${objects.activityAnswers}/records`,
                    type: 'GET',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey
                    },
                    data: {
                        filters: JSON.stringify([{
                            field: fields.answerStudentConnection,
                            operator: 'is',
                            value: studentId
                        }]),
                        page: 1,
                        rows_per_page: 1000
                    }
                });
                
                // Parse and return responses
                return response.records.map(record => ({
                    id: record.id,
                    activityId: record[fields.answerActivityConnection] || record[fields.answerActivityConnection + '_raw']?.[0]?.id || record.field_1302_raw?.[0]?.id,
                    activityJSON: record[fields.answerActivityJSON] || record.field_1300,
                    completionDate: record[fields.answerCompletionDate],
                    yearGroup: record[fields.answerYearGroup],
                    group: record[fields.answerGroup],
                    faculty: record[fields.answerFaculty]
                }));
                
            } catch (err) {
                error('Failed to load student responses:', err);
                return [];
            }
        }

        // Load latest progress per activity for a student (object_126)
        async loadLatestProgressByActivity(studentId) {
            const f = this.config.fields;
            const o = this.config.objects;
            try {
                const response = await $.ajax({
                    url: `https://api.knack.com/v1/objects/${o.activityProgress}/records`,
                    type: 'GET',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey
                    },
                    data: {
                        filters: JSON.stringify([{ field: f.progressStudent, operator: 'is', value: studentId }]),
                        page: 1,
                        rows_per_page: 1000,
                        sort_field: 'created_at',
                        sort_order: 'desc'
                    }
                });
                const byActivity = new Map();
                (response.records || []).forEach(r => {
                    const aid = r[f.progressActivity + '_raw']?.[0]?.id || r[f.progressActivity];
                    if (!aid) return;
                    if (!byActivity.has(aid)) byActivity.set(aid, r);
                });
                return byActivity;
            } catch (e) {
                error('Failed to load progress:', e);
                return new Map();
            }
        }
        
        // Load activity questions from Object_45 using correct field mappings
        async loadActivityQuestions(activityId) {
            log(`Loading questions for activity: ${activityId}`);
            try {
                // Filter Object_45 by connection to activity NAME (field_1286)
                const activity = this.state.activities.find(a => a.id === activityId);
                const activityName = activity ? activity.name : '';
                if (!activityName) {
                    log('No activity name found for questions lookup');
                    // Fallback to generated defaults
                    return activity ? this.generateDefaultQuestions(activity) : [];
                }

                const response = await $.ajax({
                    url: `https://api.knack.com/v1/objects/object_45/records`,
                    type: 'GET',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey
                    },
                    data: {
                        filters: JSON.stringify([
                            {
                                field: 'field_1286', // connection to Activities by name
                                operator: 'is',
                                value: activityName
                            }
                        ]),
                        page: 1,
                        rows_per_page: 200
                    }
                });

                if (response.records && response.records.length > 0) {
                    return response.records.map(record => ({
                        id: record.id,
                        question: this.stripHtml(record.field_1137 || record.field_1279 || ''),
                        type: record.field_1138 || record.field_1290 || 'text',
                        options: record.field_1139 || record.field_1291 || '',
                        order: parseInt(record.field_1140 || record.field_1303) || 0
                    })).sort((a, b) => a.order - b.order);
                }

                // Fallback to generated defaults
                const fallbackActivity = this.state.activities.find(a => a.id === activityId);
                return fallbackActivity ? this.generateDefaultQuestions(fallbackActivity) : [];
            } catch (err) {
                error('Failed to load activity questions:', err);
                const fallbackActivity = this.state.activities.find(a => a.id === activityId);
                return fallbackActivity ? this.generateDefaultQuestions(fallbackActivity) : [];
            }
        }
        
        // Generate default reflection questions for an activity
        generateDefaultQuestions(activity) {
            const categoryQuestions = {
                'Vision': [
                    'What are your main goals for this term/year?',
                    'How does this activity help you achieve your vision?',
                    'What obstacles might prevent you from reaching your goals?'
                ],
                'Effort': [
                    'How much time do you currently dedicate to studying?',
                    'What strategies will you use to maintain consistent effort?',
                    'How will you track your progress?'
                ],
                'Systems': [
                    'What study systems or routines work best for you?',
                    'How can you improve your current study methods?',
                    'What tools or resources do you need to succeed?'
                ],
                'Practice': [
                    'How often do you practice or review material?',
                    'What specific skills need more practice?',
                    'How will you measure improvement in your practice?'
                ],
                'Attitude': [
                    'How do you stay motivated when things get difficult?',
                    'What negative thoughts do you need to overcome?',
                    'How can you maintain a positive mindset?'
                ]
            };
            
            const questions = categoryQuestions[activity.category] || [
                'What did you learn from this activity?',
                'How will you apply this to your studies?',
                'What challenges did you face?'
            ];
            
            return questions.map((q, index) => ({
                id: `default_${activity.id}_${index}`,
                question: q,
                type: 'text',
                options: '',
                order: index
            }));
        }

        // Show student details modal
        async showStudentDetailsModal(student, responses, progressByActivity = new Map()) {
            // Remove existing modal if any
            $('#student-details-modal').remove();
            
            // Show loading while we fetch activity details
            this.showLoading();
            
            try {
                // Build union of activity IDs relevant to the student
                const idFromNames = (student.prescribedActivities || []).map(name => {
                    const norm = (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
                    const act = this.state.activities.find(a => this.stripHtml(a.name).toLowerCase().trim().replace(/\s+/g, ' ') === norm);
                    return act?.id;
                }).filter(Boolean);
                const unionIds = new Set([
                    ...(student.prescribedActivityIds || []),
                    ...idFromNames,
                    ...(student.finishedActivities || []),
                    ...Array.from(progressByActivity.keys())
                ]);

                // Prepare activity data entries with origin badges
                const prescribedActivityData = [];
                for (const activityId of unionIds) {
                    const activity = this.state.activities.find(a => a.id === activityId);
                    if (activity) {
                        // Check if this activity is completed by checking if its ID is in finishedActivities
                        const isCompleted = (student.finishedActivities || []).includes(activity.id);
                        const response = responses.find(r => r.activityId === activity.id);
                        
                        // Origin badges
                        const isPrescribed = (student.prescribedActivityIds || []).includes(activity.id);
                        const latestProgress = progressByActivity.get(activity.id);
                        const selectedVia = latestProgress ? latestProgress[this.config.fields.progressSelectedVia] : '';
                        const isStaffAdded = !isPrescribed && selectedVia === 'staff_assigned';
                        const isSelfSelected = !isPrescribed && !isStaffAdded;

                        // Don't load questions here - load them on demand when activity is clicked
                        prescribedActivityData.push({
                            ...activity,
                            isCompleted,
                            response,
                            studentId: student.id,
                            questions: [], // Empty initially
                            showPrescribedBadge: isPrescribed,
                            showStaffBadge: isStaffAdded,
                            showSelfBadge: isSelfSelected
                        });
                    } else {
                        log(`Warning: Could not find activity by ID ${activityId} in loaded activities`);
                        // Log available activities for debugging
                        if (this.state.activities.length < 20) {
                            log('Available activities:', this.state.activities.map(a => a.name));
                        }
                    }
                }
                
                // Also load ALL completed activities (not just prescribed)
                const allCompletedActivityData = [];
                for (const activityId of student.finishedActivities) {
                    const activity = this.state.activities.find(a => a.id === activityId);
                    if (activity) {
                        const response = responses.find(r => r.activityId === activityId);
                        const isPrescribed = student.prescribedActivityIds.includes(activityId);
                        
                        allCompletedActivityData.push({
                            ...activity,
                            isCompleted: true,
                            isPrescribed,
                            response,
                            studentId: student.id,
                            questions: []
                        });
                    } else {
                        log(`Warning: Could not find completed activity with ID "${activityId}"`);
                    }
                }
                
                // Store for later use
                this.currentStudentAllActivities = allCompletedActivityData;
                
                // Create modal HTML
                const modalHtml = `
                    <div id="student-details-modal" class="modal-overlay" style="display: flex;">
                        <div class="modal large-modal">
                            <div class="modal-header">
                                <h2 class="modal-title">${student.name} - Activities Overview</h2>
                                <button class="modal-close" onclick="VESPAStaff.closeModal('student-details-modal')">
                                    ×
                                </button>
                            </div>
                            <div class="modal-body">
                                ${this.renderStudentDetails(student, prescribedActivityData)}
                            </div>
                        </div>
                    </div>
                `;
                
                // Add to body
                $('body').append(modalHtml);
                
                // Store activity data for event handlers
                this.currentStudentActivities = prescribedActivityData;
                
                // Set up tab switching
                this.setupTabListeners();
                
            } finally {
                this.hideLoading();
            }
        }
        
        // Render student details content
        renderStudentDetails(student, activities) {
            const completedActivities = activities.filter(a => a.isCompleted);
            const incompleteActivities = activities.filter(a => !a.isCompleted);
            
            // Group activities by VESPA category and render a single unified list
            const categories = ['Vision', 'Effort', 'Systems', 'Practice', 'Attitude'];
            const activitiesByCategory = categories.map(cat => ({
                category: cat,
                incomplete: activities.filter(a => (a.category === cat) && !a.isCompleted),
                completed: activities.filter(a => (a.category === cat) && a.isCompleted)
            }));

            const renderCategory = (group) => {
                const hasAny = group.incomplete.length + group.completed.length > 0;
                if (!hasAny) return '';
                return `
                    <div class="category-group vespa-${group.category.toLowerCase()}">
                        <h3 class="category-group-title">${group.category}</h3>
                        <div class="activities-grid">
                            ${group.incomplete.map(a => this.renderActivityCard(a, false)).join('')}
                            ${group.completed.map(a => this.renderActivityCard(a, true)).join('')}
                        </div>
                    </div>
                `;
            };

            return `
                <div class="student-details-container">
                    <div class="student-overview">
                        <div class="overview-card">
                            <h3>Student Activities</h3>
                            <div class="progress-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Total Progress</span>
                                    <span class="stat-value">${student.progress}%</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Prescribed Progress</span>
                                    <span class="stat-value">${student.completedCount} / ${student.prescribedCount}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">All Completed</span>
                                    <span class="stat-value">${this.currentStudentAllActivities?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                        <div class="overview-card">
                            <h3>VESPA Scores</h3>
                            <div class="vespa-scores-detail">${this.renderDetailedVESPAScores(student.vespaScores)}</div>
                        </div>
                    </div>

                    ${activitiesByCategory.map(renderCategory).join('') || '<p class="no-activities">No activities found</p>'}
                </div>
            `;
        }
        
        // Render individual activity card
        renderActivityCard(activity, isCompleted) {
            const categoryClass = activity.category ? activity.category.toLowerCase().replace(/\s+/g, '-') : 'general';
            
            // Get a preview of student response if available
            let responseSummary = '';
            if (isCompleted && activity.response && activity.response.activityJSON) {
                try {
                    const responses = JSON.parse(activity.response.activityJSON);
                    const firstResponse = Object.values(responses)[0];
                    if (firstResponse) {
                        responseSummary = `
                            <div class="response-summary">
                                <div class="summary-label">Student Response Preview:</div>
                                <div class="summary-text">"${firstResponse.substring(0, 150)}${firstResponse.length > 150 ? '...' : ''}"</div>
                            </div>
                        `;
                    }
                } catch (e) {
                    log('Error parsing response for preview:', e);
                }
            }
            
            // Format completion date
            const completionDate = isCompleted && activity.response?.completionDate ? 
                new Date(activity.response.completionDate).toLocaleDateString('en-GB') : '';
            
            return `
                <div class="activity-card ${categoryClass} ${isCompleted ? 'completed' : ''}" 
                     data-activity-id="${activity.id}">
                    
                    <div class="activity-badges">
                        <span class="category-badge ${categoryClass}">${activity.category || 'General'}</span>
                        <span class="level-badge">Level ${activity.level || '1'}</span>
                        ${activity.duration ? `<span class="level-badge">${activity.duration}</span>` : ''}
                        ${activity.showPrescribedBadge ? `<span class="badge badge-prescribed" title="Prescribed">Prescribed</span>` : ''}
                        ${activity.showStaffBadge ? `<span class="badge badge-staff" title="Staff Added">Staff Added</span>` : ''}
                        ${activity.showSelfBadge ? `<span class="badge badge-self" title="Self Selected">Self Selected</span>` : ''}
                        ${activity.showReportBadge ? `<span class="badge badge-report" title="Generated from report">Report</span>` : ''}
                        ${isCompleted ? `<span class="badge badge-completed" title="Completed">Completed</span>` : ''}
                    </div>
                    <div class="activity-card-content" onclick="VESPAStaff.viewActivityDetails('${activity.id}', '${activity.studentId}')">
                                        <h4 class="activity-name">${this.escapeHtml(activity.name)}</h4>
                                        ${activity.description ? `<p class="activity-description">${this.escapeHtml(activity.description)}</p>` : ''}
                                        ${responseSummary}
                                    </div>
                    
                    <div class="activity-info">
                        ${isCompleted ? 
                            `<span class="completion-date">✓ Completed on ${completionDate}</span>` :
                            `<span class="status-badge pending">⏳ Not Started</span>`
                        }
                    </div>
                    
                    <div class="card-actions">
                        <button class="btn-view-activity" onclick="event.stopPropagation(); VESPAStaff.viewActivityDetails('${activity.id}', '${activity.studentId}')">
                            View
                        </button>
                        ${!isCompleted ? `<button class=\"btn btn-secondary\" onclick=\"event.stopPropagation(); VESPAStaff.removeActivityFromStudent('${activity.studentId}', '${activity.id}')\" title=\"Remove from student\">− Remove</button>` : ''}
                        ${isCompleted ? `
                            <button class="btn-provide-feedback" onclick="event.stopPropagation(); VESPAStaff.provideFeedback('${activity.id}', '${activity.studentId}')">
                                Feedback
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // Helper to render student's answer to a question
        renderStudentAnswer(question, response) {
            try {
                const answers = JSON.parse(response.activityJSON);
                const answer = answers[question.id] || answers[question.question];
                if (answer) {
                    return `<div class="student-answer"><strong>Student's Answer:</strong> ${answer}</div>`;
                }
            } catch (e) {
                log('Error parsing student response:', e);
            }
            return '';
        }
        
        // Render detailed VESPA scores
        renderDetailedVESPAScores(scores) {
            const categories = {
                vision: 'Vision',
                effort: 'Effort',
                systems: 'Systems',
                practice: 'Practice',
                attitude: 'Attitude'
            };
            
            return Object.entries(categories).map(([key, label]) => `
                <div class="vespa-score-item">
                    <span class="score-label">${label}</span>
                    <div class="score-bar">
                        <div class="score-fill ${key}" style="width: ${(scores[key] / 10) * 100}%"></div>
                    </div>
                    <span class="score-value">${scores[key].toFixed(1)}/10</span>
                </div>
            `).join('');
        }
        
        // Render activity responses
        renderActivityResponses(responses) {
            return `
                <div class="responses-list">
                    ${responses.map(response => this.renderSingleResponse(response)).join('')}
                </div>
            `;
        }
        
        // Render single activity response
        renderSingleResponse(response) {
            try {
                const data = JSON.parse(response.activityJSON || '{}');
                const activity = this.state.activities.find(a => a.id === response.activityId);
                
                return `
                    <div class="response-card">
                        <div class="response-header">
                            <h4>${activity ? activity.name : 'Unknown Activity'}</h4>
                            <span class="response-date">${response.completionDate || 'No date'}</span>
                        </div>
                        <div class="response-content">
                            ${this.renderResponseQuestions(data)}
                        </div>
                    </div>
                `;
            } catch (err) {
                error('Error rendering response:', err);
                return '<div class="response-card error">Error loading response</div>';
            }
        }
        
        // Render response questions and answers
        renderResponseQuestions(data) {
            if (!data.questions || !Array.isArray(data.questions)) {
                return '<p>No questions found in this response.</p>';
            }
            
            return data.questions.map((q, index) => `
                <div class="question-answer">
                    <div class="question">
                        <strong>Q${index + 1}:</strong> ${q.question || 'No question text'}
                    </div>
                    <div class="answer">
                        <strong>A:</strong> ${q.answer || '<em>No answer provided</em>'}
                    </div>
                </div>
            `).join('');
        }
        
        assignToStudent(studentId) {
            this.state.selectedStudents = new Set([studentId]);
            this.showAssignModal();
        }
        
        showAssignModal() {
            const modal = document.getElementById('assign-modal');
            const body = document.getElementById('assign-modal-body');
            
            if (modal && body) {
                // Clear previous selections
                this.state.selectedActivities.clear();
                body.innerHTML = this.renderActivityList();
                modal.style.display = 'flex';
            }
        }
        
        renderActivityList() {
            const categories = ['Vision', 'Effort', 'Systems', 'Practice', 'Attitude'];
            const levels = [1, 2, 3];
            // Collect curriculum values from loaded activities
            const curriculumSet = new Set();
            this.state.activities.forEach(a => (a.curriculums || []).forEach(c => curriculumSet.add(c)));
            const curriculums = Array.from(curriculumSet).sort();
            
            return `
                <div class="activity-filters">
                    <input type="text" 
                           class="search-input" 
                           placeholder="Search activities..." 
                           onkeyup="VESPAStaff.filterActivities(this.value)">
                    <select class="filter-select" onchange="VESPAStaff.filterByCategory(this.value)">
                        <option value="all">All Categories</option>
                        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                    <select class="filter-select" onchange="VESPAStaff.filterByLevel(this.value)">
                        <option value="all">All Levels</option>
                        ${levels.map(l => `<option value="${l}">Level ${l}</option>`).join('')}
                    </select>
                    <select class="filter-select" onchange="VESPAStaff.filterByCurriculum(this.value)">
                        <option value="all">All Curricula</option>
                        ${curriculums.map(c => `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}</option>`).join('')}
                    </select>
                </div>
                <div class="activity-groups">
                    ${categories.map(cat => {
                        const group = this.state.activities.filter(a => a.category === cat);
                        if (group.length === 0) return '';
                        return `
                            <div class="activity-group">
                                <h3>${cat}</h3>
                                <div class="activity-list" id="activity-list-${cat}">
                                    ${group.map(activity => `
                                        <div class="activity-item" data-activity-id="${activity.id}">
                                            <input type="checkbox" class="activity-checkbox" 
                                                   id="activity-${activity.id}"
                                                   onchange="VESPAStaff.toggleActivity('${activity.id}', this.checked)">
                                            <div class="activity-info">
                                                <div class="activity-name">${this.escapeHtml(activity.name)}</div>
                                                <div class="activity-meta">
                                                    <span class="vespa-pill ${activity.category.toLowerCase()}">
                                                        ${activity.category}
                                                    </span>
                                                    <span>Level ${activity.level}</span>
                                                    ${(activity.curriculums && activity.curriculums.length) ? `<span class="curriculum-tags">${activity.curriculums.map(c => `<em>${this.escapeHtml(c)}</em>`).join(', ')}</span>` : ''}
                                                </div>
                                            </div>
                                            <button class="btn-review-activity" onclick="event.preventDefault(); VESPAStaff.viewEnhancedActivityPreview('${activity.id}')" title="Review activity content">
                                                <span class="review-icon">👁️</span>
                                                Review
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                if (modalId === 'student-details-modal') {
                    modal.remove();
                }
            }
        }
        
        // Switch tabs in student details modal
        switchTab(tabName, event) {
            // If event is not passed, try to get it from window.event
            const e = event || window.event;
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            const tabElement = document.getElementById(`${tabName}-tab`);
            if (tabElement) {
                tabElement.style.display = 'block';
                tabElement.classList.add('active');
                
                // Re-render activities if needed (fixes the empty tab issue)
                if (tabName === 'completed' && !tabElement.querySelector('.activity-card')) {
                    // Tab might be empty due to rendering issue, force re-render
                    const activities = this.currentStudentActivities || [];
                    const completedActivities = activities.filter(a => a.isCompleted);
                    if (completedActivities.length > 0) {
                        tabElement.innerHTML = `
                            <div class="activities-grid">
                                ${completedActivities.map(activity => this.renderActivityCard(activity, true)).join('')}
                            </div>
                        `;
                    }
                } else if (tabName === 'incomplete' && !tabElement.querySelector('.activity-card')) {
                    const activities = this.currentStudentActivities || [];
                    const incompleteActivities = activities.filter(a => !a.isCompleted);
                    if (incompleteActivities.length > 0) {
                        tabElement.innerHTML = `
                            <div class="activities-grid">
                                ${incompleteActivities.map(activity => this.renderActivityCard(activity, false)).join('')}
                            </div>
                        `;
                    }
                } else if (tabName === 'all-completed' && !tabElement.querySelector('.activity-card')) {
                    const allActivities = this.currentStudentAllActivities || [];
                    if (allActivities.length > 0) {
                        tabElement.innerHTML = `
                            <div class="activities-grid">
                                ${allActivities.map(activity => 
                                    this.renderActivityCard({
                                        ...activity,
                                        showPrescribedBadge: activity.isPrescribed
                                    }, true)
                                ).join('')}
                            </div>
                        `;
                    }
                }
            }
            
            // Update button state
            if (e && e.target) {
                e.target.classList.add('active');
            }
        }
        
        // Uncomplete (re-assign) an activity by ID
        async uncompleteActivity(studentId, activityId) {
            if (!confirm(`Are you sure you want to re-assign this activity? This will mark it as incomplete.`)) {
                return;
            }
            
            try {
                // Find the student
                const student = this.state.students.find(s => s.id === studentId);
                if (!student) return;
                
                // Remove from finished activities
                const updatedFinished = student.finishedActivities.filter(id => id !== activityId);
                
                // Update in database
                await $.ajax({
                    url: `https://api.knack.com/v1/objects/${this.config.objects.student}/records/${studentId}`,
                    type: 'PUT',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        [this.config.fields.finishedActivities]: updatedFinished.join(',')
                    })
                });
                
                this.showSuccessModal('Success', 'Activity re-assigned successfully');
                
                // Reload the modal
                this.viewStudent(studentId);
                
            } catch (err) {
                error('Failed to re-assign activity:', err);
                alert('Error re-assigning activity. Please try again.');
            }
        }
        
        // Add feedback for an activity
        async addFeedback(activityId) {
            const feedback = prompt('Enter feedback for this activity:');
            if (!feedback) return;
            
            try {
                // Get the activity details
                const activity = this.currentStudentActivities.find(a => a.id === activityId);
                if (!activity) return;
                
                const fields = this.config.fields;
                const objects = this.config.objects;
                
                // Create feedback record in Object_128
                const feedbackData = {
                    [fields.feedbackName]: `Feedback for ${activity.name}`,
                    [fields.feedbackActivityProgress]: activityId, // This should be the progress ID, not activity ID
                    [fields.feedbackStaffMember]: Knack.session.user.id,
                    [fields.feedbackText]: feedback,
                    [fields.feedbackDate]: new Date().toISOString().split('T')[0],
                    [fields.feedbackType]: 'encouragement'
                };
                
                await $.ajax({
                    url: `https://api.knack.com/v1/objects/${objects.activityFeedback}/records`,
                    type: 'POST',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(feedbackData)
                });
                
                this.showSuccessModal('Success', 'Feedback added successfully!');
                
                // Refresh the view
                this.viewStudent(activity.studentId);
                
            } catch (err) {
                error('Failed to add feedback:', err);
                alert('Error adding feedback. Please try again.');
            }
        }
        
        // Hide loading state
        hideLoading() {
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.remove();
            }
        }
        
        // Load more students (pagination)
        async loadMoreStudents() {
            if (!this.state.pagination.hasMore || this.state.isLoading) return;
            
            log('Loading more students...');
            this.state.isLoading = true;
            
            const nextPage = this.state.pagination.currentPage + 1;
            const fields = this.config.fields;
            const objects = this.config.objects;
            
            try {
                // Build same filters as initial load
                let filters = [];
                const roleId = this.state.currentRole.data?.id;
                
                switch (this.state.currentRole.type) {
                    case 'staffAdmin':
                        if (roleId && roleId !== 'test_id') {
                            filters.push({
                                field: fields.studentStaffAdmins,
                                operator: 'contains',
                                value: roleId
                            });
                        }
                        break;
                    case 'tutor':
                        if (roleId && roleId !== 'test_id') {
                            filters.push({
                                field: fields.studentTutors,
                                operator: 'contains',
                                value: roleId
                            });
                        }
                        break;
                    // Add other role cases...
                }
                
                const isStaffAdmin = this.state.currentRole.type === 'staffAdmin';
                const pageSize = isStaffAdmin ? 50 : 200;
                
                const requestData = {
                    filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
                    page: nextPage,
                    rows_per_page: pageSize,
                    sort_field: 'field_90',
                    sort_order: 'asc'
                };
                
                const response = await $.ajax({
                    url: `https://api.knack.com/v1/objects/${objects.student}/records`,
                    type: 'GET',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey
                    },
                    data: requestData
                });
                
                // Update pagination state
                this.state.pagination.currentPage = response.current_page || nextPage;
                this.state.pagination.hasMore = response.current_page < response.total_pages;
                
                // Process and append new students
                if (response.records && response.records.length > 0) {
                    const newStudents = [];
                    response.records.forEach(record => {
                        const student = this.parseStudentFromRecord(record);
                        if (student) {
                            newStudents.push(student);
                        }
                    });
                    
                    // Append to existing students
                    this.state.students = [...this.state.students, ...newStudents];
                    
                    // Re-apply filters and render
                    this.applyFilters();
                    this.renderStudentTable();
                }
                
            } catch (err) {
                error('Failed to load more students:', err);
            } finally {
                this.state.isLoading = false;
            }
        }
        
        closeAllModals() {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none';
            });
        }
        
        // Load additional activity data from Object_44 or cached activity data
        async loadActivityAdditionalData(activityId) {
            try {
                // First check if we have this activity in our cached data
                let activityData = this.state.activitiesData?.find(a => a.Activity_id === activityId);
                
                // If not in cache, try to load from activities JSON
                if (!activityData) {
                    log('Activity not in cache, loading from JSON...');
                    await this.loadActivitiesFromJSON();
                    activityData = this.state.activitiesData?.find(a => a.Activity_id === activityId);
                }
                
                // If we have activity data from JSON, use it
                if (activityData) {
                    log('Found activity in JSON data:', activityData);
                    
                    // Convert markdown-style content to HTML
                    let backgroundContent = activityData.background_content || '';
                    
                    // Basic markdown to HTML conversion
                    backgroundContent = backgroundContent
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/\n/g, '<br>')
                        .replace(/^/, '<p>')
                        .replace(/$/, '</p>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/LEARN 💡/g, '<h3>LEARN 💡</h3>')
                        .replace(/REFLECT🤔/g, '<h3>REFLECT 🤔</h3>')
                        .replace(/Final Thoughts/g, '<h4>Final Thoughts</h4>')
                        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
                    
                    // Extract any PDF links from media
                    let pdfUrl = '';
                    if (activityData.media?.pdf?.url) {
                        pdfUrl = activityData.media.pdf.url;
                    }
                    
                    // Calculate time based on content and level
                    const contentLength = (backgroundContent.length) / 200; // Rough word count
                    const baseTime = activityData.Level === 'Level 3' ? 25 : 
                                    activityData.Level === 'Level 2' ? 20 : 15;
                    const totalTime = Math.min(Math.max(Math.ceil(contentLength + baseTime), 15), 45);
                    
                    return {
                        backgroundInfo: backgroundContent,
                        additionalInfo: '',
                        pdfUrl: pdfUrl,
                        timeMinutes: totalTime,
                        objective: backgroundContent.substring(0, 200).replace(/<[^>]*>/g, '') + '...',
                        media: activityData.media || {}
                    };
                }
                
                // Fall back to using data from the activities list if available
                log('Activity not found in JSON, checking loaded activities...');
                const activity = this.state.activities.find(a => a.id === activityId);
                
                if (activity) {
                    // Generate content based on activity category and level
                    const categoryDescriptions = {
                        'Vision': 'This activity helps you clarify your goals and create a clear vision for your academic success.',
                        'Effort': 'This activity focuses on developing consistent work habits and maintaining motivation.',
                        'Systems': 'This activity helps you build effective systems and strategies for learning.',
                        'Practice': 'This activity provides opportunities to practice and reinforce key skills.',
                        'Attitude': 'This activity helps develop a positive mindset and overcome challenges.'
                    };
                    
                    const levelDescriptions = {
                        1: 'This foundational activity introduces core concepts.',
                        2: 'This intermediate activity builds on basic skills.',
                        3: 'This advanced activity challenges you to apply your knowledge.'
                    };
                    
                    const backgroundContent = `
                        <h3>Activity Overview</h3>
                        <p>${categoryDescriptions[activity.category] || 'This activity supports your learning journey.'}</p>
                        <p>${levelDescriptions[activity.level] || 'Complete this activity to develop important skills.'}</p>
                        
                        <h3>Learning Objectives</h3>
                        <p>Through this activity, you will:</p>
                        <ul>
                            <li>Reflect on your current ${activity.category.toLowerCase()} strategies</li>
                            <li>Identify areas for improvement</li>
                            <li>Develop actionable plans for growth</li>
                        </ul>
                        
                        <h3>Getting Started</h3>
                        <p>Take time to thoughtfully respond to each question. Your honest reflection will help you get the most from this activity.</p>
                    `;
                    
                    return {
                        backgroundInfo: backgroundContent,
                        additionalInfo: '',
                        pdfUrl: '',
                        timeMinutes: activity.level === 3 ? 30 : activity.level === 2 ? 20 : 15,
                        objective: `Develop ${activity.category.toLowerCase()} skills through guided reflection.`
                    };
                }
                
                // Final fallback - return generic content
                return {
                    backgroundInfo: '<p>Complete this activity to develop important academic skills.</p>',
                    additionalInfo: '',
                    pdfUrl: '',
                    timeMinutes: 20,
                    objective: 'Develop key skills through guided reflection.'
                };
            } catch (err) {
                log('Failed to load additional activity data:', err);
                return {
                    backgroundInfo: '',
                    additionalInfo: '',
                    pdfUrl: '',
                    timeMinutes: 20,
                    objective: 'Develop key skills'
                };
            }
        }
        
        // Switch tabs in activity detail modal
        switchActivityTab(tabName, event) {
            const e = event || window.event;
            
            // Hide all content panels
            document.querySelectorAll('.content-tab-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.content-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected panel
            const panel = document.getElementById(`${tabName}-content-tab`);
            if (panel) {
                panel.style.display = 'block';
            }
            
            // Add active class to clicked button
            if (e && e.target) {
                e.target.classList.add('active');
            }
        }
        
        // View activity preview (legacy method - keep for backward compatibility)
        async viewActivityPreview(activityId) {
            // Redirect to enhanced preview
            return this.viewEnhancedActivityPreview(activityId);
        }
        
        // Enhanced activity preview that loads full content from Object_44 and Object_45
        async viewEnhancedActivityPreview(activityId) {
            this.showLoading();
            try {
                const activity = this.state.activities.find(a => a.id === activityId);
                if (!activity) {
                    throw new Error('Activity not found');
                }
                
                // Load questions from Object_45
                const questions = await this.loadActivityQuestions(activityId);
                
                // Load additional data from Object_44
                const additionalData = await this.loadActivityAdditionalData(activityId);
                
                // Store questions for time calculation
                this.currentActivityQuestions = questions;
                
                // Calculate estimated completion time
                const questionsWithContent = questions.filter(q => q.question && q.question.trim().length > 0);
                const estimatedTime = additionalData.timeMinutes || (questionsWithContent.length * 3 + 10);
                
                // Show enhanced preview modal
                const modalHtml = `
                    <div id="activity-preview-modal" class="modal-overlay" style="display: flex;">
                        <div class="modal large-modal activity-preview-modal">
                            <div class="modal-header">
                                <h2 class="modal-title">${this.escapeHtml(activity.name)}</h2>
                                <button class="modal-close" onclick="VESPAStaff.closeModal('activity-preview-modal')">×</button>
                            </div>
                            <div class="modal-body">
                                <div class="activity-preview-container">
                                    <!-- Activity Overview Section -->
                                    <div class="activity-overview-section">
                                        <div class="activity-badges">
                                            <span class="category-badge ${activity.category.toLowerCase()}">${activity.category}</span>
                                            <span class="level-badge">Level ${activity.level || '1'}</span>
                                            <span class="time-badge">⏱️ ${estimatedTime} mins</span>
                                    </div>
                                        
                                        <div class="activity-overview-cards">
                                            <div class="overview-card">
                                                <span class="overview-icon">🎯</span>
                                                <h4>Learning Objective</h4>
                                                <p>${additionalData.objective || activity.description || 'Develop key skills through guided practice and reflection'}</p>
                                            </div>
                                            <div class="overview-card">
                                                <span class="overview-icon">📊</span>
                                                <h4>Activity Structure</h4>
                                                <p>${questionsWithContent.length} reflection questions to guide learning</p>
                                            </div>
                                            <div class="overview-card">
                                                <span class="overview-icon">⭐</span>
                                                <h4>Points Available</h4>
                                                <p>${activity.level === 3 ? 15 : 10} points upon completion</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Content Tabs -->
                                    <div class="activity-content-tabs">
                                        <div class="content-tab-buttons">
                                            <button class="content-tab-btn active" onclick="VESPAStaff.switchPreviewTab('content', event)">
                                                📖 Activity Content
                                            </button>
                                            <button class="content-tab-btn" onclick="VESPAStaff.switchPreviewTab('questions', event)">
                                                ❓ Questions (${questionsWithContent.length})
                                            </button>
                                        </div>
                                        
                                        <!-- Content Tab -->
                                        <div id="content-preview-tab" class="content-tab-panel active">
                                            ${additionalData.backgroundInfo || additionalData.additionalInfo ? `
                                                <div class="activity-content-section">
                                                    ${additionalData.backgroundInfo ? `
                                                        <div class="background-info-content">
                                                            <h4>Background Information</h4>
                                                            <div class="rich-text-content">
                                                                ${additionalData.backgroundInfo}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${additionalData.additionalInfo ? `
                                                        <div class="additional-info-content">
                                                            <h4>Additional Resources</h4>
                                                            <div class="rich-text-content">
                                                                ${additionalData.additionalInfo}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${additionalData.pdfUrl ? `
                                                        <div class="pdf-download-section">
                                                            <a href="${additionalData.pdfUrl}" target="_blank" class="pdf-download-btn">
                                                                <span class="pdf-icon">📄</span>
                                                                Download Activity PDF
                                                            </a>
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${additionalData.media?.images && additionalData.media.images.length > 0 ? `
                                                        <div class="activity-images-section">
                                                            <h4>Activity Images</h4>
                                                            <div class="images-grid">
                                                                ${additionalData.media.images.map(img => `
                                                                    <img src="${img.url}" alt="${img.alt || 'Activity image'}" 
                                                                         class="activity-preview-image" 
                                                                         onclick="window.open('${img.url}', '_blank')">
                                                                `).join('')}
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            ` : `
                                                <div class="empty-content-message">
                                                    <span class="empty-icon">📝</span>
                                                    <p>No additional content available for this activity.</p>
                                                    <p class="hint-text">The activity will guide students through reflection questions.</p>
                                                </div>
                                            `}
                                        </div>
                                        
                                        <!-- Questions Tab -->
                                        <div id="questions-preview-tab" class="content-tab-panel" style="display: none;">
                                            ${questionsWithContent.length > 0 ? `
                                                <div class="questions-preview-section">
                                                    <div class="questions-intro">
                                                        <p>These questions will guide students through the activity:</p>
                                                    </div>
                                                    <div class="questions-list">
                                                        ${questionsWithContent.map((q, index) => `
                                                            <div class="question-preview-item">
                                                                <div class="question-number">Question ${index + 1}</div>
                                                                <div class="question-content">
                                                                    <p class="question-text">${this.escapeHtml(q.question)}</p>
                                                                    ${q.type === 'multiple_choice' && q.options ? `
                                                                        <div class="question-options">
                                                                            <strong>Options:</strong> ${this.escapeHtml(q.options)}
                                                                        </div>
                                                                    ` : ''}
                                                                    <div class="question-type">
                                                                        <span class="type-badge">${q.type === 'multiple_choice' ? '🔘 Multiple Choice' : '📝 Open Response'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                `).join('')}
                                        </div>
                                                </div>
                                            ` : `
                                                <div class="empty-content-message">
                                                    <span class="empty-icon">❓</span>
                                                    <p>No questions configured for this activity.</p>
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-secondary" onclick="VESPAStaff.closeModal('activity-preview-modal')">Close</button>
                                ${this.state.currentRole.canAssign ? `
                                    <button class="btn btn-primary" onclick="VESPAStaff.assignActivityFromPreview('${activity.id}')">
                                        Assign This Activity
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                $('body').append(modalHtml);
                
                // Default to questions or responses tab
                try {
                    const hasResponses = activity.isCompleted && !!(activity.response && activity.response.activityJSON);
                    if (hasResponses) {
                        this.switchActivityTab('responses');
                        const rb = document.getElementById('tab-btn-responses');
                        if (rb) rb.classList.add('active');
                    } else {
                        this.switchActivityTab('questions');
                        const qb = document.getElementById('tab-btn-questions');
                        if (qb) qb.classList.add('active');
                    }
                } catch (_) {}

            } catch (err) {
                error('Failed to load activity preview:', err);
                alert('Error loading activity preview. Please try again.');
            } finally {
                this.hideLoading();
            }
        }
        
        // Switch tabs in preview modal
        switchPreviewTab(tabName, event) {
            const e = event || window.event;
            
            // Hide all content panels
            document.querySelectorAll('.content-tab-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.content-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected panel
            const panel = document.getElementById(`${tabName}-preview-tab`);
            if (panel) {
                panel.style.display = 'block';
            }
            
            // Add active class to clicked button
            if (e && e.target) {
                e.target.classList.add('active');
            }
        }
        
        // Assign activity from preview modal
        async assignActivityFromPreview(activityId) {
            this.closeModal('activity-preview-modal');
            // Show assign modal with this activity pre-selected
            this.showAssignModal();
            // Pre-select the activity
            setTimeout(() => {
                const checkbox = document.getElementById(`activity-${activityId}`);
                if (checkbox) {
                    checkbox.checked = true;
                    this.toggleActivity(activityId, true);
                }
            }, 100);
        }
        
        // Send reminder to student
        async sendReminder(studentId, activityName) {
            if (!confirm(`Send reminder to student about activity: ${activityName}?`)) {
                return;
            }
            
            // TODO: Implement actual reminder sending via API
            alert('Reminder functionality will be implemented soon');
        }
        
        // Set up tab listeners for the student details modal
        setupTabListeners() {
            $(document).off('click', '.tab-button').on('click', '.tab-button', function() {
                const tabName = $(this).data('tab');
                VESPAStaff.switchTab(tabName);
            });
        }
        
        // View activity details with questions and responses - RADICAL REDESIGN
        async viewActivityDetails(activityId, studentId) {
            // Find the student and activity
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) return;
            
            const activity = this.state.activities.find(a => a.id === activityId);
            if (!activity) return;
            
            this.showLoading();
            
            try {
                // Load student response from Object_46 (Activity Answers)
                const fields = this.config.fields;
                const objects = this.config.objects;
                
                let studentResponse = null;
                let responseData = {};
                let existingFeedback = '';
                
                try {
                    const response = await $.ajax({
                        url: `https://api.knack.com/v1/objects/${objects.activityAnswers}/records`,
                        type: 'GET',
                        headers: {
                            'X-Knack-Application-Id': this.config.knackAppId,
                            'X-Knack-REST-API-Key': this.config.knackApiKey
                        },
                        data: {
                            filters: JSON.stringify([
                                { field: fields.answerStudentConnection, operator: 'is', value: studentId },
                                { field: fields.answerActivityConnection, operator: 'is', value: activityId }
                            ]),
                            rows_per_page: 1
                        }
                    });
                    
                    if (response.records && response.records.length > 0) {
                        studentResponse = response.records[0];
                        
                        // Parse the JSON response data
                        if (studentResponse[fields.answerActivityJSON]) {
                            try {
                                responseData = JSON.parse(studentResponse[fields.answerActivityJSON]);
                            } catch (e) {
                                log('Error parsing response JSON:', e);
                            }
                        }
                        
                        // Get existing feedback if any
                        existingFeedback = studentResponse[fields.answerStaffFeedback] || '';
                    }
                } catch (err) {
                    log('No response found for this activity');
                }
                
                // Create the feedback modal
                const modalHtml = `
                    <div id="activity-detail-modal" class="modal-overlay" style="display: flex;">
                        <div class="modal feedback-modal">
                            <div class="modal-header">
                                <h2 class="modal-title">${this.escapeHtml(activity.ActivityName || activity.name)}</h2>
                                <button class="modal-close" onclick="VESPAStaff.closeModal('activity-detail-modal')">×</button>
                            </div>
                            <div class="modal-body">
                                <div class="feedback-container">
                                    <!-- Student Info -->
                                    <div class="feedback-student-info">
                                        <span class="student-name">${this.escapeHtml(student.name)}</span>
                                        <span class="activity-category ${(activity.VESPACategory || '').toLowerCase()}">${activity.VESPACategory}</span>
                                        <span class="activity-level">Level ${activity.Level || '1'}</span>
                                    </div>
                                    
                                    <!-- Student Responses Section -->
                                    <div class="feedback-responses-section">
                                        <h3>Student Responses</h3>
                                        ${studentResponse ? `
                                            <div class="student-responses">
                                                ${Object.entries(responseData).map(([question, answer]) => {
                                                    // Handle different answer types
                                                    let displayAnswer = 'No response';
                                                    if (answer !== null && answer !== undefined) {
                                                        if (typeof answer === 'object') {
                                                            displayAnswer = JSON.stringify(answer, null, 2);
                                                        } else {
                                                            displayAnswer = String(answer);
                                                        }
                                                    }
                                                    
                                                    return `
                                                        <div class="response-item">
                                                            <div class="response-question">${this.escapeHtml(question)}</div>
                                                            <div class="response-answer">${this.escapeHtml(displayAnswer)}</div>
                                                        </div>
                                                    `;
                                                }).join('')}
                                                
                                                ${studentResponse[fields.answerCompletionDate] ? `
                                                    <div class="completion-info">
                                                        <small>Completed on: ${new Date(studentResponse[fields.answerCompletionDate]).toLocaleDateString()}</small>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        ` : `
                                            <div class="no-response-message">
                                                No responses submitted yet for this activity.
                                            </div>
                                        `}
                                    </div>
                                    
                                    <!-- Feedback Section -->
                                    <div class="feedback-input-section">
                                        <h3>Staff Feedback</h3>
                                        <textarea 
                                            id="feedback-text-input" 
                                            class="feedback-textarea" 
                                            placeholder="Enter your feedback for the student..."
                                            rows="6">${this.escapeHtml(existingFeedback)}</textarea>
                                        
                                        <div class="feedback-actions">
                                            <button class="btn btn-primary" onclick="VESPAStaff.saveFeedback('${activityId}', '${studentId}', '${studentResponse?.id || ''}')">
                                                ${existingFeedback ? 'Update Feedback' : 'Save Feedback'}
                                            </button>
                                            <button class="btn btn-secondary" onclick="VESPAStaff.closeModal('activity-detail-modal')">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add modal to body
                $('body').append(modalHtml);
                
            } catch (err) {
                error('Failed to load activity details:', err);
                alert('Error loading activity details. Please try again.');
            } finally {
                this.hideLoading();
            }
        }
        
        // Save feedback to Object_46 (Activity Answers) field_1734
        async saveFeedback(activityId, studentId, responseId) {
            const feedbackText = document.getElementById('feedback-text-input')?.value;
            if (!feedbackText) {
                alert('Please enter feedback before saving.');
                return;
            }
            
            this.showLoading();
            
            try {
                const fields = this.config.fields;
                const objects = this.config.objects;
                
                if (responseId) {
                    // Update existing response record with feedback
                    await $.ajax({
                        url: `https://api.knack.com/v1/objects/${objects.activityAnswers}/records/${responseId}`,
                        type: 'PUT',
                        headers: {
                            'X-Knack-Application-Id': this.config.knackAppId,
                            'X-Knack-REST-API-Key': this.config.knackApiKey,
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({
                            [fields.answerStaffFeedback]: feedbackText
                        })
                    });
                    
                    this.showSuccessModal('Success', 'Feedback saved successfully!');
                } else {
                    alert('No student response found for this activity. Student must complete the activity first.');
                }
                
                this.closeModal('activity-detail-modal');
                
            } catch (err) {
                error('Failed to save feedback:', err);
                alert('Error saving feedback. Please try again.');
            } finally {
                this.hideLoading();
            }
        }
        
        // Continue with existing viewActivityDetails code that was replaced
        async viewActivityDetailsOld(activityId, studentId) {
            // Find the activity in the current student's activities  
            const activity = this.currentStudentActivities?.find(a => a.id === activityId);
            if (!activity) {
                // If not found in student activities, use the enhanced preview
                return this.viewEnhancedActivityPreview(activityId);
            }
            
            this.showLoading();
            
            try {
                // Load questions if not already loaded
                if (!activity.questions || activity.questions.length === 0) {
                    activity.questions = await this.loadActivityQuestions(activityId);
                }
                
                // Store questions for time calculation
                this.currentActivityQuestions = activity.questions;
                
                // Load additional activity data (Object_44 fields) if available
                const additionalData = await this.loadActivityAdditionalData(activityId);
                
                // Parse student responses if available
                let studentResponses = {};
                if (activity.response && activity.response.activityJSON) {
                    try {
                        studentResponses = JSON.parse(activity.response.activityJSON);
                    } catch (e) {
                        log('Error parsing student responses:', e);
                    }
                }
                
                // Create the detailed view modal
                const modalHtml = `
                    <div id="activity-detail-modal" class="modal-overlay" style="display: flex;">
                        <div class="modal large-modal activity-preview-modal">
                            <div class="modal-header">
                                <h2 class="modal-title">${this.escapeHtml(activity.name)}</h2>
                                <button class="modal-close" onclick="VESPAStaff.closeModal('activity-detail-modal')">×</button>
                            </div>
                            <div class="modal-body">
                                <div class="activity-detail-container">
                                    <!-- Activity Overview -->
                                    <div class="activity-overview-section">
                                        <div class="activity-badges">
                                            <span class="category-badge ${activity.category.toLowerCase()}">${activity.category}</span>
                                            <span class="level-badge">Level ${activity.level || '1'}</span>
                                            ${activity.duration ? `<span class="level-badge">${activity.duration}</span>` : ''}
                                            ${activity.isCompleted ? 
                                                `<span class="status-badge active">✓ Completed</span>` :
                                                `<span class="status-badge pending">Not Started</span>`
                                            }
                                        </div>
                                        
                                        <div class="activity-overview-cards">
                                            <div class="overview-card">
                                                <span class="overview-icon">🎯</span>
                                                <h4>Learning Objective</h4>
                                                <p>${additionalData.objective || activity.description || 'Develop key skills'}</p>
                                            </div>
                                            <div class="overview-card">
                                                <span class="overview-icon">⏱️</span>
                                                <h4>Time Needed</h4>
                                                <p>Approximately ${additionalData.timeMinutes} minutes</p>
                                            </div>
                                            <div class="overview-card">
                                                <span class="overview-icon">⭐</span>
                                                <h4>Points Available</h4>
                                                <p>${activity.level === 3 ? 15 : 10} points</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Background Info Tab -->
                                        <div class="activity-content-tabs">
                                            <div class="content-tab-buttons">
                                                <button id="tab-btn-questions" class="content-tab-btn" onclick="VESPAStaff.switchActivityTab('questions', event)">Questions ${activity.questions ? `(${activity.questions.length})` : ''}</button>
                                                ${activity.isCompleted ? `<button id=\"tab-btn-responses\" class=\"content-tab-btn\" onclick=\"VESPAStaff.switchActivityTab('responses', event)\">Responses</button>` : ''}
                                                <button id="tab-btn-background" class="content-tab-btn" onclick="VESPAStaff.switchActivityTab('background', event)">Background</button>
                                            </div>
                                        
                                        <!-- Background Content -->
                                        <div id="background-content-tab" class="content-tab-panel" style="display:none;">
                                            <div class="background-info-section">
                                                ${additionalData.backgroundInfo || additionalData.additionalInfo ? `
                                                    ${additionalData.backgroundInfo ? `
                                                        <div class="background-info-content">
                                                            <h4>Background Information</h4>
                                                            ${additionalData.backgroundInfo}
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${additionalData.additionalInfo ? `
                                                        <div class="additional-info-content">
                                                            <h4>Additional Resources</h4>
                                                            ${additionalData.additionalInfo}
                                                        </div>
                                                    ` : ''}
                                                    
                                                    ${additionalData.pdfUrl ? `
                                                        <div class="pdf-download-section">
                                                            <a href="${additionalData.pdfUrl}" target="_blank" class="pdf-download-btn">
                                                                <span class="pdf-icon">📄</span>
                                                                Download Activity PDF
                                                            </a>
                                                        </div>
                                                    ` : ''}
                                                ` : `
                                                    <p class="no-content-message">No background information available for this activity.</p>
                                                `}
                                            </div>
                                        </div>
                                        
                                        <!-- Questions Content -->
                                        <div id="questions-content-tab" class="content-tab-panel" style="display:none;">
                                            <div class="questions-list-section">
                                                <h3>Activity Questions</h3>
                                        ${activity.questions && activity.questions.length > 0 ? `
                                                    <div class="questions-list-preview">
                                                ${activity.questions.map((q, index) => `
                                                            <div class="question-preview-block">
                                                        <div class="question-header">
                                                            <span class="question-number">Question ${index + 1}</span>
                                                            ${q.type ? `<span class="question-type">${q.type}</span>` : ''}
                                                        </div>
                                                                <div class="question-text-preview">${this.escapeHtml(q.question || '')}</div>
                                                        ${q.options ? `
                                                                    <div class="question-options-preview">
                                                                <strong>Options:</strong> ${this.escapeHtml(q.options)}
                                                            </div>
                                                        ` : ''}
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                ` : '<p class="no-questions">No questions available for this activity.</p>'}
                                            </div>
                                        </div>
                                        
                                        <!-- Student Responses Content (only if completed) -->
                                        ${activity.isCompleted ? `
                                        <div id="responses-content-tab" class="content-tab-panel" style="display:none;">
                                            <div class="responses-section">
                                                <h3>Student Responses</h3>
                                                ${activity.questions && activity.questions.length > 0 ? `
                                                    <div class="responses-list">
                                                        ${activity.questions.map((q, index) => `
                                                            <div class="question-response-block">
                                                                <div class="question-header">
                                                                    <span class="question-number">Question ${index + 1}</span>
                                                                </div>
                                                                <div class="question-text-for-response">${this.escapeHtml(q.question || '')}</div>
                                                        <div class="student-response-block ${studentResponses[q.id] || studentResponses[q.question] ? 'has-response' : 'no-response'}">
                                                            <div class="response-label">Student Response:</div>
                                                            <div class="response-text">
                                                                        ${studentResponses[q.id] || studentResponses[q.question] || 'No response provided'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                    </div>
                                    
                                                    <!-- Feedback Section -->
                                        <div class="feedback-section">
                                            <h3>Staff Feedback</h3>
                                            <textarea class="feedback-textarea" id="feedback-text" 
                                                                  placeholder="Enter your feedback for the student here..."
                                                                  rows="5">${activity.response?.staffFeedback || ''}</textarea>
                                                    </div>
                                                ` : '<p class="no-questions">No questions available for this activity.</p>'}
                                            </div>
                                        </div>
                                    ` : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                ${activity.isCompleted ? `
                                    <button class="btn btn-danger" onclick="VESPAStaff.markActivityIncomplete('${activityId}', '${studentId}')">
                                        Mark as Incomplete
                                    </button>
                                    <button class="btn btn-primary" onclick="VESPAStaff.saveFeedback('${activityId}', '${studentId}')">
                                        Save Feedback
                                    </button>
                                ` : ''}
                                <button class="btn btn-secondary" onclick="VESPAStaff.closeModal('activity-detail-modal')">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                
                $('body').append(modalHtml);
                
            } catch (err) {
                error('Failed to load activity details:', err);
                alert('Error loading activity details');
            } finally {
                this.hideLoading();
            }
        }
        
        // Provide feedback for an activity
        async provideFeedback(activityId, studentId) {
            await this.viewActivityDetails(activityId, studentId);
            // Focus on feedback textarea
            setTimeout(() => {
                $('#feedback-text').focus();
            }, 300);
        }
        
        // Mark activity as incomplete
        async markActivityIncomplete(activityId, studentId) {
            if (!confirm('Are you sure you want to mark this activity as incomplete? This will require the student to complete it again.')) {
                return;
            }
            
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) {
                alert('Student not found');
                return;
            }
            
            this.showLoading();
            
            try {
                // Remove activity ID from finishedActivities (IDs only)
                const updatedFinishedIds = student.finishedActivities.filter(id => id !== activityId);
                
                // Ensure activity ID remains in prescribed IDs
                if (!Array.isArray(student.prescribedActivityIds)) student.prescribedActivityIds = [];
                if (!student.prescribedActivityIds.includes(activityId)) {
                    student.prescribedActivityIds.push(activityId);
                }
                
                // Update the student record (IDs for both fields)
                const updateData = {};
                updateData[this.config.fields.finishedActivities] = updatedFinishedIds.join(',');
                updateData[this.config.fields.prescribedActivities] = student.prescribedActivityIds;
                
                const response = await $.ajax({
                    url: `https://api.knack.com/v1/objects/${this.config.objects.student}/records/${studentId}`,
                    type: 'PUT',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(updateData)
                });
                
                // Update local state
                student.finishedActivities = updatedFinishedIds;
                student.completedCount = updatedFinishedIds.filter(id => student.prescribedActivityIds.includes(id)).length;
                const prescribedCount = student.prescribedActivityIds.length || 0;
                student.progress = prescribedCount > 0 ? Math.round((student.completedCount / prescribedCount) * 100) : 0;
                
                // Refresh the view
                this.applyFilters();
                this.render();
                
                // Close the modal and show success
                this.closeModal('activity-detail-modal');
                this.showSuccessModal('Success', 'Activity marked as incomplete successfully');
                
                // Refresh student details
                await this.viewStudent(studentId);
                
            } catch (err) {
                error('Failed to mark activity as incomplete:', err);
                alert('Error marking activity as incomplete. Please try again.');
            } finally {
                this.hideLoading();
            }
        }
        
        // Save feedback
        async saveFeedback(activityId, studentId) {
            const feedbackText = $('#feedback-text').val();
            if (!feedbackText.trim()) {
                alert('Please enter feedback before saving');
                return;
            }
            
            // TODO: Implement actual feedback saving via API
            this.showSuccessModal('Success', 'Feedback saved successfully!');
            this.closeModal('activity-detail-modal');
        }
        
        async confirmAssignment() {
            const selectedActivities = Array.from(this.state.selectedActivities);
            const selectedStudents = Array.from(this.state.selectedStudents);
            
            if (selectedActivities.length === 0) {
                alert('Please select at least one activity');
                return;
            }
            
            if (selectedStudents.length === 0) {
                alert('Please select at least one student');
                return;
            }
            
            // Show loading
            this.showLoading();
            this.closeModal('assign-modal');
            
            try {
                // We store and send activity IDs for connection updates
                const activityIds = selectedActivities;
                
                // Update each student's prescribed activities and create progress records
                const updatePromises = selectedStudents.map(async (studentId) => {
                    await this.updateStudentPrescribedActivities(studentId, activityIds);
                    // Create 'assigned' progress records with selectedVia=staff_assigned
                    await Promise.all(activityIds.map(aid => this.createAssignedProgressRecord(studentId, aid)));
                });
                
                await Promise.all(updatePromises);
                
                this.showSuccessModal(
                    'Activities Assigned Successfully',
                    `Successfully assigned ${activityIds.length} activities to ${selectedStudents.length} student(s)`
                );
                
                // Refresh data
                await this.loadData();
                this.render();
                
            } catch (err) {
                error('Failed to assign activities:', err);
                alert('Error assigning activities. Please try again.');
            } finally {
                this.hideLoading();
            }
        }

        // Create an assigned progress record (object_126) for origin tracing
        async createAssignedProgressRecord(studentId, activityId) {
            const o = this.config.objects;
            const f = this.config.fields;
            try {
                const payload = {
                    [f.progressStudent]: studentId,
                    [f.progressActivity]: activityId,
                    [f.progressDateAssigned]: new Date().toISOString(),
                    [f.progressStatus]: 'assigned',
                    [f.progressSelectedVia]: 'staff_assigned'
                };
                await $.ajax({
                    url: `https://api.knack.com/v1/objects/${o.activityProgress}/records`,
                    type: 'POST',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify(payload)
                });
            } catch (e) {
                error('Failed to create assigned progress record:', e);
            }
        }
        
        // Update student's prescribed activities (field_1683) using connection IDs
        async updateStudentPrescribedActivities(studentId, newActivityIds) {
            const fields = this.config.fields;
            const objects = this.config.objects;
            
            try {
                // Get current student data
                const student = this.state.students.find(s => s.id === studentId);
                if (!student) return;
                
                // Get current prescribed activity IDs
                const currentIds = Array.isArray(student.prescribedActivityIds) ? student.prescribedActivityIds : [];
                
                // Combine with new IDs (avoid duplicates)
                const allIds = [...new Set([...currentIds, ...newActivityIds])];
                
                // Update the student record
                await $.ajax({
                    url: `https://api.knack.com/v1/objects/${objects.student}/records/${studentId}`,
                    type: 'PUT',
                    headers: {
                        'X-Knack-Application-Id': this.config.knackAppId,
                        'X-Knack-REST-API-Key': this.config.knackApiKey,
                        'Content-Type': 'application/json'
                    },
                    data: JSON.stringify({
                        [fields.prescribedActivities]: allIds
                    })
                });
                
                // Update local state
                student.prescribedActivityIds = allIds;
                // Optionally refresh prescribedActivities names from activity list
                const idToName = new Map(this.state.activities.map(a => [a.id, a.name]));
                student.prescribedActivities = allIds.map(id => idToName.get(id) || id);
                
                log(`Updated prescribed activities (IDs) for student ${student.name}`);
                
            } catch (err) {
                error(`Failed to update student ${studentId}:`, err);
                throw err;
            }
        }
        
        exportReport() {
            // In production, this would generate a real report
            const csvContent = this.generateCSV();
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vespa-student-progress-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
        
        generateCSV() {
            const headers = ['Student Name', 'Email', 'Progress', 'Prescribed', 'Completed', 
                           'Vision', 'Effort', 'Systems', 'Practice', 'Attitude'];
            
            const rows = this.state.filteredStudents.map(student => [
                student.name,
                student.email,
                `${student.progress}%`,
                student.prescribedCount,
                student.completedCount,
                student.vespaScores.vision,
                student.vespaScores.effort,
                student.vespaScores.systems,
                student.vespaScores.practice,
                student.vespaScores.attitude
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
        
        // Activity filtering (for modal)
        filterActivities(searchTerm) {
            const items = document.querySelectorAll('.activity-item');
            const search = searchTerm.toLowerCase();
            
            items.forEach(item => {
                const name = item.querySelector('.activity-name').textContent.toLowerCase();
                item.style.display = name.includes(search) ? 'flex' : 'none';
            });
        }
        
        filterByCategory(category) {
            const items = document.querySelectorAll('.activity-item');
            
            items.forEach(item => {
                if (category === 'all') {
                    item.style.display = 'flex';
                } else {
                    const itemCategory = item.querySelector('.vespa-pill').textContent;
                    item.style.display = itemCategory === category ? 'flex' : 'none';
                }
            });
        }
        filterByLevel(level) {
            const items = document.querySelectorAll('.activity-item');
            items.forEach(item => {
                if (level === 'all') {
                    item.style.display = item.style.display === 'none' ? 'none' : 'flex';
                } else {
                    const text = item.querySelector('.activity-meta').textContent;
                    const hasLevel = text.includes(`Level ${level}`);
                    item.style.display = hasLevel ? 'flex' : 'none';
                }
            });
        }
        filterByCurriculum(curriculum) {
            const items = document.querySelectorAll('.activity-item');
            items.forEach(item => {
                if (curriculum === 'all') {
                    item.style.display = item.style.display === 'none' ? 'none' : 'flex';
                } else {
                    const tags = item.querySelector('.curriculum-tags')?.textContent || '';
                    item.style.display = tags.toLowerCase().includes(curriculum.toLowerCase()) ? 'flex' : 'none';
                }
            });
        }
        
        toggleActivity(activityId, checked) {
            if (checked) {
                this.state.selectedActivities.add(activityId);
            } else {
                this.state.selectedActivities.delete(activityId);
            }
            
            // Update UI
            const item = document.querySelector(`[data-activity-id="${activityId}"]`);
            if (item) {
                item.classList.toggle('selected', checked);
            }
        }
    }
    
    // Create and expose global instance
    const staffManager = new VESPAStaffManager();
    window.VESPAStaff = staffManager;
    
    // Expose initializer function for KnackAppLoader
    window.initializeVESPAActivitiesStaff = function() {
        const config = window.VESPA_ACTIVITIES_STAFF_CONFIG;
        if (!config) {
            error('VESPA Activities Staff config not found');
            return;
        }
        
        log('Initializing VESPA Activities Staff Management', config);
        
        // View hiding removed - using direct API calls only
        
        try {
            // Initialize immediately like the student version
            staffManager.init();
            log('VESPA Staff Activities initialized successfully');
        } catch (err) {
            error('Failed to initialize VESPA Staff Activities:', err);
        }
    };
    
})();