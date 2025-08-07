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
        scenes: ['scene_1256'], // Staff management scene
        
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
            
            // Activity fields (Object_44)
            activityName: 'field_1278',
            activityVESPACategory: 'field_1285',
            activityLevel: 'field_1295',
            
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
        
        // View IDs (to be updated based on actual scene)
        views: {
            container: 'view_3179', // Rich text view for UI injection
            students: 'view_3178', // Activity assignments view
            activities: 'view_3177'  // Student responses view
        }
    };
    
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
                currentRole: null,
                allRoles: [],
                students: [],
                activities: [],
                filteredStudents: [],
                selectedStudents: new Set(),
                selectedActivities: new Set(),
                filters: {
                    search: '',
                    progress: 'all',
                    group: 'all'
                },
                sortColumn: 'name',
                sortDirection: 'asc',
                isLoading: false,
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
            
            // Update CONFIG to use the values from KnackAppLoader
            if (this.config.views) {
                CONFIG.views.container = this.config.views.richText || CONFIG.views.container;
                CONFIG.views.students = this.config.views.activityAssignments || CONFIG.views.students;
                CONFIG.views.activities = this.config.views.studentResponses || CONFIG.views.activities;
            }
            
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
                    $(document).on('knack-scene-render.scene_1256', () => {
                        setTimeout(resolve, 100);
                    });
                }
            });
        }
        
        // Find container view
        findContainer() {
            // Try multiple selectors
            const selectors = [
                `#${CONFIG.views.container}`,
                `.kn-view[data-view-key="${CONFIG.views.container}"]`,
                '#view_3179',
                '.kn-details',
                '.kn-text'
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
                
                // Load students based on role
                await this.loadStudents();
                
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
        
        // Load students based on current role
        async loadStudents() {
            log('Loading students from Knack API...');
            
            const studentData = [];
            const fields = this.config.fields;
            const objects = this.config.objects;
            
            try {
                // First try to get data from the hidden view if it exists
                const viewId = this.config.views.activityAssignments;
                const viewData = $(`#${viewId}`).find('.kn-list-table tbody tr');
                
                if (viewData.length > 0) {
                    log('Found student data in view, parsing...');
                    viewData.each((index, row) => {
                        const $row = $(row);
                        const recordId = $row.data('record-id');
                        if (recordId) {
                            // Parse student data from the row
                            const student = this.parseStudentFromRow($row);
                            if (student) {
                                studentData.push(student);
                            }
                        }
                    });
                } else {
                    // Fall back to API call
                    log('No view data found, making API call...');
                    
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
                            // Staff admins should only see their assigned students
                            if (roleId && roleId !== 'test_id') {
                                filters.push({
                                    field: fields.studentStaffAdmins,
                                    operator: 'contains',
                                    value: roleId  // Use role record ID, not email
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
                                    value: roleId  // Use role record ID, not email
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
                                    value: roleId  // Use role record ID, not email
                                });
                                log('Head of Year filter:', { field: fields.studentHeadsOfYear, value: roleId });
                            } else {
                                log('WARNING: No role ID found for head of year filter');
                            }
                            break;
                        case 'subjectTeacher':
                            if (roleId && roleId !== 'test_id') {
                                filters.push({
                                    field: fields.studentSubjectTeachers,
                                    operator: 'contains',
                                    value: roleId  // Use role record ID, not email
                                });
                                log('Subject Teacher filter:', { field: fields.studentSubjectTeachers, value: roleId });
                            } else {
                                log('WARNING: No role ID found for subject teacher filter');
                            }
                            break;
                    }
                    
                    log('Final filters:', filters);
                    
                    // For staff admins with potentially large student counts, load less initially
                    const isStaffAdmin = this.state.currentRole.type === 'staffAdmin';
                    const initialLoadSize = isStaffAdmin ? 50 : 200; // Load fewer for staff admins
                    
                    // Make API call to get students
                    const requestData = {
                        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
                        page: 1,
                        rows_per_page: initialLoadSize,
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
                    
                    log('API Response:', response);
                    log('Number of records returned:', response.records ? response.records.length : 0);
                    log('Total records available:', response.total_records);
                    
                    // Update pagination state
                    this.state.pagination.totalRecords = response.total_records || 0;
                    this.state.pagination.totalPages = response.total_pages || 1;
                    this.state.pagination.currentPage = response.current_page || 1;
                    this.state.pagination.hasMore = response.current_page < response.total_pages;
                    
                    // Process each student record
                    if (response.records && response.records.length > 0) {
                        response.records.forEach((record, index) => {
                            if (index === 0) {
                                log('Sample student record:', record);
                                // Log all field keys to debug
                                log('Student record fields:', Object.keys(record).filter(key => key.startsWith('field_')));
                                // Log specific fields we're looking for
                                const fields = this.config.fields;
                                log(`${fields.studentName} (name):`, record[fields.studentName]);
                                log(`${fields.studentEmail} (email):`, record[fields.studentEmail]); 
                                log(`${fields.prescribedActivities} (prescribed):`, record[fields.prescribedActivities]);
                                log(`${fields.finishedActivities} (finished):`, record[fields.finishedActivities]);
                                // Also check for raw values
                                log('field_90_raw:', record.field_90_raw);
                                log('field_91_raw:', record.field_91_raw);
                            }
                            const student = this.parseStudentFromRecord(record);
                            if (student) {
                                studentData.push(student);
                            }
                        });
                    }
                }
                
                // If still no data, optionally create test data
                if (studentData.length === 0) {
                    log('No students found via API');
                    
                    // Only create test data if explicitly enabled
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
                                progress: 5,  // 2/40 * 100
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
                        // Show helpful debug info
                        log('Current role:', this.state.currentRole);
                        log('Role ID used for filtering:', this.state.currentRole.data?.id);
                        log('Filter field used:', fields.studentTutors);
                    }
                }
                
            } catch (err) {
                error('Failed to load students:', err);
                log('Error details:', err.responseJSON || err.responseText || err);
                
                // Check if it's an API key/authentication issue
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
            log(`Loaded ${studentData.length} students`);
        }
        
        // Parse student data from table row
        parseStudentFromRow($row) {
            try {
                const fields = this.config.fields;
                
                // Extract data from row cells
                const cells = $row.find('td');
                let student = {
                    id: $row.data('record-id') || $row.attr('id'),
                    name: '',
                    email: '',
                    prescribedCount: 0,
                    completedCount: 0,
                    vespaScores: {
                        vision: 0,
                        effort: 0,
                        systems: 0,
                        practice: 0,
                        attitude: 0
                    }
                };
                
                // Try to find fields in cells
                cells.each((index, cell) => {
                    const $cell = $(cell);
                    const text = $cell.text().trim();
                    
                    // Look for student name (usually first cell)
                    if (index === 0 && text) {
                        student.name = text;
                    }
                    
                    // Look for email
                    if (text.includes('@')) {
                        student.email = text;
                    }
                });
                
                // Calculate progress based on 40 activities baseline
                const totalActivitiesBaseline = 40;
                student.progress = Math.round((student.completedCount / totalActivitiesBaseline) * 100);
                
                return student;
            } catch (err) {
                error('Error parsing student from row:', err);
                return null;
            }
        }
        
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
                
                // Calculate progress based on prescribed activities, not baseline
                const progressPercentage = prescribedCount > 0 ? 
                    Math.round((completedCount / prescribedCount) * 100) : 0;
                
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
                
                // First, try to load from a CDN or external source that supports CORS
                const externalPaths = [
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
            log('Loading activities...');
            
            const activities = [];
            const objects = this.config.objects;
            
            try {
                // First try to load from JSON for complete data
                await this.loadActivitiesFromJSON();
                
                // Try to get data from the hidden view - check multiple possible view IDs
                const possibleViewIds = ['view_3176', 'view_3177', 'view_3178'];
                let viewData = $();
                
                for (const viewId of possibleViewIds) {
                    const data = $(`#${viewId}`).find('.kn-list-table tbody tr, .kn-table tbody tr, .kn-list-content .kn-list-item');
                    if (data.length > 0) {
                        log(`Found ${data.length} items in ${viewId}`);
                        viewData = data;
                        break;
                    }
                }
                
                if (viewData.length > 0) {
                    log(`Processing ${viewData.length} activity items from view`);
                    viewData.each((index, row) => {
                        const $row = $(row);
                        const activity = this.parseActivityFromRow($row);
                        if (activity) {
                            // Try to match with JSON data for complete information
                            if (this.state.activitiesData) {
                                const jsonActivity = this.state.activitiesData.find(
                                    a => a.Activity_id === activity.id || 
                                    a['Activities Name'] === activity.name
                                );
                                if (jsonActivity) {
                                    // Enrich with JSON data
                                    activity.hasBackgroundContent = !!jsonActivity.background_content;
                                    activity.media = jsonActivity.media;
                                    activity.level = parseInt(jsonActivity.Level?.replace('Level ', '')) || activity.level;
                                }
                            }
                            activities.push(activity);
                        }
                    });
                } else {
                    // Fall back to API call
                    log('No view data found, making API call for activities...');
                    
                    const response = await $.ajax({
                        url: `https://api.knack.com/v1/objects/${objects.activities}/records`,
                        type: 'GET',
                        headers: {
                            'X-Knack-Application-Id': this.config.knackAppId,
                            'X-Knack-REST-API-Key': this.config.knackApiKey
                        },
                        data: {
                            page: 1,
                            rows_per_page: 1000
                        }
                    });
                    
                    log('Activities API Response:', response);
                    
                    // Process each activity record
                    if (response.records && response.records.length > 0) {
                        response.records.forEach((record) => {
                            const activity = this.parseActivityFromRecord(record);
                            if (activity) {
                                // Try to match with JSON data
                                if (this.state.activitiesData) {
                                    const jsonActivity = this.state.activitiesData.find(
                                        a => a.Activity_id === activity.id
                                    );
                                    if (jsonActivity) {
                                        activity.hasBackgroundContent = !!jsonActivity.background_content;
                                        activity.media = jsonActivity.media;
                                    }
                                }
                                activities.push(activity);
                            }
                        });
                    }
                }
                
                            // If still no activities but we have JSON data, use that
            if (activities.length === 0) {
                if (this.state.activitiesData && this.state.activitiesData.length > 0) {
                    log('No activities from view/API, using JSON data...');
                    this.state.activitiesData.forEach(jsonActivity => {
                        if (jsonActivity.Active) {
                            activities.push({
                                id: jsonActivity.Activity_id,
                                name: jsonActivity['Activities Name'],
                                category: jsonActivity['VESPA Category'],
                                level: parseInt(jsonActivity.Level?.replace('Level ', '')) || 1,
                                hasBackgroundContent: !!jsonActivity.background_content,
                                media: jsonActivity.media
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
            log(`Loaded ${activities.length} activities`);
        }
        
        // Parse activity data from table row
        parseActivityFromRow($row) {
            try {
                // Get the record ID from row attributes
                let activityId = $row.data('record-id') || $row.attr('id') || '';
                
                // Clean up the ID if it has a prefix like "row-"
                if (activityId.startsWith('row-')) {
                    activityId = activityId.substring(4);
                }
                
                const cells = $row.find('td');
                const activity = {
                    id: activityId,
                    name: '',
                    category: 'Unknown',
                    level: 1,
                    duration: 'N/A',
                    type: 'Activity'
                };
                
                // Try to extract activity data from cells
                cells.each((index, cell) => {
                    const $cell = $(cell);
                    const text = $cell.text().trim();
                    
                    // First cell is usually the activity name
                    if (index === 0 && text) {
                        activity.name = this.stripHtml(text);
                    }
                    
                    // Look for category in cell classes or content
                    const cellClass = $cell.attr('class') || '';
                    if (cellClass.includes('field_1285') || cellClass.includes('category')) {
                        activity.category = this.stripHtml(text);
                    }
                    
                    // Look for level
                    if (cellClass.includes('field_1295') || cellClass.includes('level')) {
                        const levelMatch = text.match(/\d+/);
                        if (levelMatch) {
                            activity.level = parseInt(levelMatch[0]);
                        }
                    }
                });
                
                // If category not found in cells, try to detect from name
                if (activity.category === 'Unknown' && activity.name) {
                    const nameUpper = activity.name.toUpperCase();
                    if (nameUpper.includes('VISION')) activity.category = 'Vision';
                    else if (nameUpper.includes('EFFORT')) activity.category = 'Effort';
                    else if (nameUpper.includes('SYSTEM')) activity.category = 'Systems';
                    else if (nameUpper.includes('PRACTICE')) activity.category = 'Practice';
                    else if (nameUpper.includes('ATTITUDE')) activity.category = 'Attitude';
                }
                
                log(`Parsed activity from row: ${activity.name} (${activity.id})`);
                return activity;
            } catch (err) {
                error('Error parsing activity from row:', err);
                return null;
            }
        }
        
        // Parse activity data from API record
        parseActivityFromRecord(record) {
            try {
                const fields = this.config.fields;
                
                // Use helper to get field values and strip HTML
                const rawName = this.getFieldValue(record, fields.activityName, 'Unnamed Activity');
                const name = this.stripHtml(rawName); // Clean activity name
                
                const rawCategory = this.getFieldValue(record, fields.activityVESPACategory, 'Unknown');
                const category = this.stripHtml(rawCategory);
                
                const levelValue = this.getFieldValue(record, fields.activityLevel, '1');
                
                // Log level field for debugging
                if (this.config.debug) {
                    log(`Activity "${name}" level field value:`, record[fields.activityLevel], 'parsed as:', parseInt(levelValue));
                }
                
                // Get additional fields and clean HTML if present
                let rawDescription = this.getFieldValue(record, 'field_1134', ''); // Activity description
                const description = this.stripHtml(rawDescription);
                
                const rawDuration = this.getFieldValue(record, 'field_1135', ''); // Activity duration
                const duration = this.stripHtml(rawDuration);
                
                const rawType = this.getFieldValue(record, 'field_1133', ''); // Activity type
                const type = this.stripHtml(rawType);
                
                const activity = {
                    id: record.id,
                    name: name,
                    category: category,
                    level: parseInt(levelValue) || 1,
                    description: description,
                    duration: duration || 'N/A',
                    type: type || 'Activity'
                };
                
                return activity;
            } catch (err) {
                error('Error parsing activity record:', err, record);
                return null;
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
                    case 'prescribed':
                        aVal = a.prescribedCount;
                        bVal = b.prescribedCount;
                        break;
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
            if (!this.container) return;
            
            const html = `
                <div class="vespa-staff-container">
                    ${this.renderHeader()}
                    ${this.renderFilterBar()}
                    ${this.renderStudentTable()}
                    ${this.renderModals()}
                </div>
            `;
            
            this.container.innerHTML = html;
            
            // Inject styles if not already present
            if (!document.getElementById('vespa-staff-styles')) {
                const styleLink = document.createElement('link');
                styleLink.id = 'vespa-staff-styles';
                styleLink.rel = 'stylesheet';
                styleLink.href = 'https://cdn.jsdelivr.net/gh/yourusername/vespa-activities@latest/staff/VESPAactivitiesStaff.css';
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
                    <table class="student-table">
                        <thead>
                            <tr>
                                <th class="sortable ${this.getSortClass('name')}" 
                                    onclick="VESPAStaff.sort('name')">
                                    Student Name
                                </th>
                                <th class="sortable ${this.getSortClass('progress')}" 
                                    onclick="VESPAStaff.sort('progress')">
                                    Progress
                                </th>
                                <th class="hide-mobile">VESPA Scores</th>
                                <th class="sortable ${this.getSortClass('prescribed')}" 
                                    onclick="VESPAStaff.sort('prescribed')">
                                    Prescribed
                                </th>
                                <th class="sortable ${this.getSortClass('completed')}" 
                                    onclick="VESPAStaff.sort('completed')">
                                    Completed
                                </th>
                                <th>Actions</th>
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
            // Calculate if student has completed additional activities
            const hasAdditionalActivities = student.totalCompletedCount > student.completedCount;
            const additionalCount = student.totalCompletedCount - student.completedCount;
            
            return `
                <tr data-student-id="${student.id}">
                    <td>
                        <div class="student-name">${student.name}</div>
                        <div class="student-email">${student.email}</div>
                    </td>
                    <td class="progress-cell">
                        <div class="progress-container">
                            <div class="progress-bar" title="Prescribed Activities Progress">
                                <div class="progress-fill" style="width: ${student.progress}%"></div>
                                <span class="progress-text">${student.completedCount}/${student.prescribedCount}</span>
                            </div>
                            ${hasAdditionalActivities ? `
                                <div class="additional-activities-indicator" title="${additionalCount} self-selected activities completed">
                                    <span class="additional-icon">+</span>
                                    <span class="additional-count">${additionalCount} self-selected</span>
                                </div>
                            ` : ''}
                        </div>
                    </td>
                    <td class="hide-mobile">
                        <div class="vespa-scores">
                            ${student.vespaScores ? this.renderVESPAScores(student.vespaScores) : '<span class="no-scores">No scores</span>'}
                        </div>
                    </td>
                    <td>
                        <div class="prescribed-count">
                            ${student.prescribedCount}
                        </div>
                    </td>
                    <td>
                        <div class="completed-info">
                            <div class="completed-main">
                                <span class="completed-prescribed">${student.completedCount}</span>
                                ${hasAdditionalActivities ? `
                                    <span class="additional-badge" title="${additionalCount} additional self-selected activities">
                                        +${additionalCount}
                                    </span>
                                ` : ''}
                            </div>
                            <div class="completed-label">prescribed${hasAdditionalActivities ? ' + self' : ''}</div>
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-action btn-secondary" 
                                    onclick="VESPAStaff.viewStudent('${student.id}')"
                                    title="View student progress and ${this.state.currentRole.canViewAnswers ? 'responses' : 'activities'}">
                                View
                            </button>
                            ${this.state.currentRole.canAssign ? `
                                <button class="btn btn-action btn-primary" 
                                        onclick="VESPAStaff.assignToStudent('${student.id}')">
                                    Assign
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
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
                
                // Create and show student details modal
                this.showStudentDetailsModal(student, responses);
                
            } catch (err) {
                error('Failed to load student details:', err);
                alert('Error loading student details. Please try again.');
            } finally {
                this.hideLoading();
            }
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
                    activityId: record[fields.answerResponsesPerActivity],
                    activityJSON: record[fields.answerActivityJSON],
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
        
        // Load activity questions from Object_45 using correct field mappings
        async loadActivityQuestions(activityId) {
            log(`Loading questions for activity: ${activityId}`);
            try {
                // Try scraping if present (harmless fallback)
                const viewData = $('#view_3177').find(`.kn-list-item[data-activity-id="${activityId}"], .kn-table tbody tr[data-activity-id="${activityId}"]`);
                if (viewData.length > 0) {
                    const scraped = [];
                    viewData.find('.question-item, .field_1279').each((index, elem) => {
                        const $elem = $(elem);
                        scraped.push({ id: `q_${index}`, question: $elem.text().trim(), type: 'text', options: '', order: index });
                    });
                    if (scraped.length > 0) return scraped;
                }

                // We must filter Object_45 by connection to activity NAME (field_1286)
                const activity = this.state.activities.find(a => a.id === activityId);
                const activityName = activity ? activity.name : '';
                if (!activityName) {
                    log('No activity name found for questions lookup');
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
                                field: 'field_1286', // questionActivity connection (by activity name)
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
                        question: this.stripHtml(record.field_1279 || ''),
                        type: record.field_1290 || 'text',
                        options: record.field_1291 || '',
                        order: parseInt(record.field_1303) || 0
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
        async showStudentDetailsModal(student, responses) {
            // Remove existing modal if any
            $('#student-details-modal').remove();
            
            // Show loading while we fetch activity details
            this.showLoading();
            
            try {
                // Load all prescribed activities data for the student
                const prescribedActivityData = [];
                for (const activityName of student.prescribedActivities) {
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
                        // Check if this activity is completed by checking if its ID is in finishedActivities
                        const isCompleted = student.finishedActivities.includes(activity.id);
                        const response = responses.find(r => r.activityId === activity.id);
                        
                        // Don't load questions here - load them on demand when activity is clicked
                        prescribedActivityData.push({
                            ...activity,
                            isCompleted,
                            response,
                            studentId: student.id,
                            questions: [] // Empty initially
                        });
                    } else {
                        log(`Warning: Could not find activity "${activityName}" in loaded activities`);
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
            
            return `
                <div class="student-details-container">
                    <!-- Student Overview -->
                    <div class="student-overview">
                        <div class="overview-card">
                            <h3>Progress Overview</h3>
                            <div class="progress-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Total Progress</span>
                                    <span class="stat-value">${student.progress}%</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Prescribed Progress</span>
                                    <span class="stat-value">${student.completedCount} / ${student.prescribedCount}</span>
                                    <small style="display: block; color: var(--primary-color); font-size: 11px;">Staff assigned</small>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Total Activities</span>
                                    <span class="stat-value">${student.totalCompletedCount}</span>
                                    <small style="display: block; color: #28a745; font-size: 11px;">Including self-selected</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="overview-card">
                            <h3>VESPA Scores</h3>
                            <div class="vespa-scores-detail">
                                ${this.renderDetailedVESPAScores(student.vespaScores)}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Activity Tabs -->
                    <div class="activity-tabs">
                        <div class="tab-buttons">
                            <button class="tab-button active" onclick="VESPAStaff.switchTab('incomplete', event)">
                                Prescribed Incomplete (${incompleteActivities.length})
                            </button>
                            <button class="tab-button" onclick="VESPAStaff.switchTab('completed', event)">
                                Prescribed Completed (${completedActivities.length})
                            </button>
                            <button class="tab-button" onclick="VESPAStaff.switchTab('all-completed', event)">
                                All Completed (${this.currentStudentAllActivities?.length || 0})
                            </button>
                        </div>
                        
                        <!-- Incomplete Activities Tab -->
                        <div id="incomplete-tab" class="tab-content active">
                            <div class="activities-grid">
                                ${incompleteActivities.length > 0 ? 
                                    incompleteActivities.map(activity => this.renderActivityCard(activity, false)).join('') :
                                    '<p class="no-activities">No incomplete activities</p>'
                                }
                            </div>
                        </div>
                        
                        <!-- Completed Activities Tab -->
                        <div id="completed-tab" class="tab-content" style="display: none;">
                            <div class="activities-grid">
                                ${completedActivities.length > 0 ? 
                                    completedActivities.map(activity => this.renderActivityCard(activity, true)).join('') :
                                    '<p class="no-activities">No completed activities</p>'
                                }
                            </div>
                        </div>
                        
                        <!-- All Completed Activities Tab -->
                        <div id="all-completed-tab" class="tab-content" style="display: none;">
                            <div class="activities-grid">
                                ${this.currentStudentAllActivities && this.currentStudentAllActivities.length > 0 ? 
                                    this.currentStudentAllActivities.map(activity => 
                                        this.renderActivityCard({
                                            ...activity,
                                            showPrescribedBadge: activity.isPrescribed
                                        }, true)
                                    ).join('') :
                                    '<p class="no-activities">No completed activities found</p>'
                                }
                            </div>
                        </div>
                    </div>
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
                     data-activity-id="${activity.id}"
                     onclick="VESPAStaff.viewActivityDetails('${activity.id}', '${activity.studentId}')">
                    
                    <div class="activity-badges">
                        <span class="category-badge ${categoryClass}">${activity.category || 'General'}</span>
                        <span class="level-badge">Level ${activity.level || '1'}</span>
                        ${activity.duration ? `<span class="level-badge">${activity.duration}</span>` : ''}
                        ${activity.showPrescribedBadge ? `<span class="prescribed-badge">✓ Prescribed</span>` : ''}
                    </div>
                    
                                                        <div class="activity-card-content">
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
                            ${isCompleted ? 'View Response & Questions' : 'Preview Activity'}
                        </button>
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
                </div>
                <div class="activity-list" id="activity-list">
                    ${this.state.activities.map(activity => `
                        <div class="activity-item" data-activity-id="${activity.id}">
                            <input type="checkbox" class="activity-checkbox" 
                                   id="activity-${activity.id}"
                                   onchange="VESPAStaff.toggleActivity('${activity.id}', this.checked)">
                            <div class="activity-info">
                                <div class="activity-name">${activity.name}</div>
                                <div class="activity-meta">
                                    <span class="vespa-pill ${activity.category.toLowerCase()}">
                                        ${activity.category}
                                    </span>
                                    <span>Level ${activity.level}</span>
                                </div>
                            </div>
                            <button class="btn-review-activity" onclick="event.preventDefault(); VESPAStaff.viewEnhancedActivityPreview('${activity.id}')" title="Review activity content">
                                <span class="review-icon">👁️</span>
                                Review
                            </button>
                        </div>
                    `).join('')}
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
        
        // Uncomplete (re-assign) an activity
        async uncompleteActivity(studentId, activityName) {
            if (!confirm(`Are you sure you want to re-assign "${activityName}"? This will mark it as incomplete.`)) {
                return;
            }
            
            try {
                // Find the student
                const student = this.state.students.find(s => s.id === studentId);
                if (!student) return;
                
                // Remove from finished activities
                const updatedFinished = student.finishedActivities.filter(a => a !== activityName);
                
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
                        [this.config.fields.finishedActivities]: updatedFinished.join(', ')
                    })
                });
                
                alert('Activity re-assigned successfully');
                
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
                
                alert('Feedback added successfully!');
                
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
        
        // View activity details with questions and responses
        async viewActivityDetails(activityId, studentId) {
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
                                            <button class="content-tab-btn active" onclick="VESPAStaff.switchActivityTab('background', event)">
                                                📖 Background Info
                                            </button>
                                            <button class="content-tab-btn" onclick="VESPAStaff.switchActivityTab('questions', event)">
                                                ❓ Questions ${activity.questions ? `(${activity.questions.length})` : ''}
                                            </button>
                                            ${activity.isCompleted ? `
                                                <button class="content-tab-btn" onclick="VESPAStaff.switchActivityTab('responses', event)">
                                                    📝 Student Responses
                                                </button>
                                            ` : ''}
                                        </div>
                                        
                                        <!-- Background Content -->
                                        <div id="background-content-tab" class="content-tab-panel active">
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
                                        <div id="questions-content-tab" class="content-tab-panel" style="display: none;">
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
                                        <div id="responses-content-tab" class="content-tab-panel" style="display: none;">
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
                alert('Activity marked as incomplete successfully');
                
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
            alert('Feedback saved successfully!');
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
                
                // Update each student's prescribed activities using IDs
                const updatePromises = selectedStudents.map(studentId => 
                    this.updateStudentPrescribedActivities(studentId, activityIds)
                );
                
                await Promise.all(updatePromises);
                
                alert(`Successfully assigned ${activityNames.length} activities to ${selectedStudents.length} student(s)`);
                
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
        
        // Hide data views immediately
        const viewsToHide = ['view_3177', 'view_3178'];
        viewsToHide.forEach(viewId => {
            const viewElement = document.querySelector(`#${viewId}`);
            if (viewElement) {
                viewElement.style.display = 'none';
                log('Immediately hid view:', viewId);
            }
        });
        
        try {
            // Initialize immediately like the student version
            staffManager.init();
            log('VESPA Staff Activities initialized successfully');
        } catch (err) {
            error('Failed to initialize VESPA Staff Activities:', err);
        }
    };
    
})();