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
                isLoading: false
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
                errorLog('Config not found in init');
                return;
            }
            
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
            
            log('Extracted user email:', userEmail);
            
            this.state.allRoles = [];
            
            // Get profile keys from user object
            const profileKeys = user.profile_keys || [];
            log('User profile keys:', profileKeys);
            
            // Also check field_73 for role names
            let roleNames = [];
            if (user.values && user.values.field_73) {
                // field_73 contains profile keys, not role names
                // We'll use profile_objects to determine actual roles
                log('field_73 values:', user.values.field_73);
            }
            
            // Map profile keys to roles based on objects
            // profile_6 = object_6 = Student
            // profile_7 = object_7 = Tutor
            // profile_5 = object_5 = Staff Admin
            // profile_18 = object_18 = Head of Year
            // profile_78 = object_78 = Subject Teacher
            
            const profileToRoleMap = {
                'profile_5': 'Staff Admin',
                'profile_7': 'Tutor',
                'profile_18': 'Head of Year',
                'profile_78': 'Subject Teacher'
            };
            
            // Convert profile keys to role names
            const userRoles = profileKeys.map(key => profileToRoleMap[key]).filter(role => role);
            log('Mapped user roles:', userRoles);
            
            // Check each role type
            const roleMap = {
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
            
            // Process each user role
            userRoles.forEach(role => {
                if (roleMap[role]) {
                    this.state.allRoles.push({
                        ...roleMap[role],
                        data: { id: user.id, email: userEmail }
                    });
                }
            });
            
            // For testing, always add at least one role
            if (this.state.allRoles.length === 0) {
                log('No roles detected, adding test role for development');
                this.state.allRoles.push({
                    type: 'tutor',
                    label: 'Tutor (Test Mode)',
                    canAssign: true,
                    canViewAnswers: true,
                    data: { id: user.id, email: userEmail }
                });
            }
            
            // Set default role (prefer Staff Admin if available)
            this.state.currentRole = this.state.allRoles.find(r => r.type === 'staffAdmin') || this.state.allRoles[0];
            
            log('Detected roles:', this.state.allRoles);
        }
        
        // Load data based on current role
        async loadData() {
            log('Loading data for role:', this.state.currentRole.type);
            
            this.state.isLoading = true;
            
            try {
                // Load students based on role
                await this.loadStudents();
                
                // Load all activities
                await this.loadActivities();
                
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
                    
                    switch (this.state.currentRole.type) {
                        case 'staffAdmin':
                            // Staff admins see all students
                            log('Staff admin - no filters, seeing all students');
                            break;
                        case 'tutor':
                            if (userEmail) {
                                filters.push({
                                    field: fields.studentTutors,
                                    operator: 'contains',
                                    value: userEmail
                                });
                                log('Tutor filter:', { field: fields.studentTutors, value: userEmail });
                            } else {
                                log('WARNING: No user email found for tutor filter');
                            }
                            break;
                        case 'headOfYear':
                            if (userEmail) {
                                filters.push({
                                    field: fields.studentHeadsOfYear,
                                    operator: 'contains',
                                    value: userEmail
                                });
                                log('Head of Year filter:', { field: fields.studentHeadsOfYear, value: userEmail });
                            } else {
                                log('WARNING: No user email found for head of year filter');
                            }
                            break;
                        case 'subjectTeacher':
                            if (userEmail) {
                                filters.push({
                                    field: fields.studentSubjectTeachers,
                                    operator: 'contains',
                                    value: userEmail
                                });
                                log('Subject Teacher filter:', { field: fields.studentSubjectTeachers, value: userEmail });
                            } else {
                                log('WARNING: No user email found for subject teacher filter');
                            }
                            break;
                    }
                    
                    log('Final filters:', filters);
                    
                    // Make API call to get students
                    const requestData = {
                        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
                        page: 1,
                        rows_per_page: 1000
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
                    
                    // Process each student record
                    if (response.records && response.records.length > 0) {
                        response.records.forEach((record, index) => {
                            if (index === 0) {
                                log('Sample student record:', record);
                            }
                            const student = this.parseStudentFromRecord(record);
                            if (student) {
                                studentData.push(student);
                            }
                        });
                    }
                }
                
                // If still no data, create minimal test data
                if (studentData.length === 0) {
                    log('No students found, creating test data...');
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
        
        // Parse student data from API record
        parseStudentFromRecord(record) {
            try {
                const fields = this.config.fields;
                
                // Extract prescribed activities (it's a text field with activity names)
                const prescribedText = record[fields.prescribedActivities] || '';
                const prescribedActivities = prescribedText ? 
                    prescribedText.split(',').map(a => a.trim()).filter(a => a) : [];
                const prescribedCount = prescribedActivities.length;
                
                // Extract finished activities
                const finishedText = record[fields.finishedActivities] || '';
                const finishedActivities = finishedText ? 
                    finishedText.split(',').map(a => a.trim()).filter(a => a) : [];
                const completedCount = finishedActivities.length;
                
                // Use 40 as the baseline for all activities at student level
                const totalActivitiesBaseline = 40;
                
                const student = {
                    id: record.id,
                    name: record[fields.studentName] || 'Unknown Student',
                    email: record[fields.studentEmail] || '',
                    prescribedActivities: prescribedActivities,
                    finishedActivities: finishedActivities,
                    prescribedCount: prescribedCount,
                    completedCount: completedCount,
                    progress: Math.round((completedCount / totalActivitiesBaseline) * 100),
                    vespaScores: {
                        vision: parseFloat(record[fields.visionScore]) || 0,  // Out of 10
                        effort: parseFloat(record[fields.effortScore]) || 0,
                        systems: parseFloat(record[fields.systemsScore]) || 0,
                        practice: parseFloat(record[fields.practiceScore]) || 0,
                        attitude: parseFloat(record[fields.attitudeScore]) || 0
                    }
                };
                
                return student;
            } catch (err) {
                error('Error parsing student record:', err, record);
                return null;
            }
        }
        
        // Load all activities
        async loadActivities() {
            log('Loading activities from Knack API...');
            
            const activities = [];
            const objects = this.config.objects;
            
            try {
                // First try to get data from the hidden view if it exists
                const viewId = this.config.views.studentResponses;
                const viewData = $(`#${viewId}`).find('.kn-list-table tbody tr');
                
                if (viewData.length > 0) {
                    log('Found activity data in view, parsing...');
                    viewData.each((index, row) => {
                        const $row = $(row);
                        const activity = this.parseActivityFromRow($row);
                        if (activity) {
                            activities.push(activity);
                        }
                    });
                } else {
                    // Fall back to API call
                    log('No view data found, making API call for activities...');
                    
                    log('Activities API URL:', `https://api.knack.com/v1/objects/${objects.activities}/records`);
                    
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
                    log('Number of activities returned:', response.records ? response.records.length : 0);
                    
                    // Process each activity record
                    if (response.records && response.records.length > 0) {
                        response.records.forEach((record, index) => {
                            if (index === 0) {
                                log('Sample activity record:', record);
                            }
                            const activity = this.parseActivityFromRecord(record);
                            if (activity) {
                                activities.push(activity);
                            }
                        });
                    }
                }
                
                // If still no data, create minimal test data
                if (activities.length === 0) {
                    log('No activities found, creating test data...');
                    const categories = ['Vision', 'Effort', 'Systems', 'Practice', 'Attitude'];
                    for (let i = 0; i < 10; i++) {
                        activities.push({
                            id: `test_activity_${i}`,
                            name: `Test Activity ${i + 1}`,
                            category: categories[i % 5],
                            level: (i % 3) + 1,
                            duration: '20 mins',
                            type: 'Interactive'
                        });
                    }
                }
                
            } catch (err) {
                error('Failed to load activities:', err);
                log('Activities error details:', err.responseJSON || err.responseText || err);
                
                // Check if it's an API key/authentication issue
                if (err.status === 401 || err.status === 403) {
                    error('Authentication error loading activities - check API keys');
                }
                
                // Create fallback data on error
                activities.push({
                    id: 'error_1',
                    name: 'Error Loading Activities',
                    category: 'Unknown',
                    level: 1,
                    duration: 'N/A',
                    type: 'Error'
                });
            }
            
            this.state.activities = activities;
            log(`Loaded ${activities.length} activities`);
        }
        
        // Parse activity data from table row
        parseActivityFromRow($row) {
            try {
                const cells = $row.find('td');
                const activity = {
                    id: $row.data('record-id') || $row.attr('id'),
                    name: '',
                    category: 'Unknown',
                    level: 1,
                    duration: 'N/A',
                    type: 'Activity'
                };
                
                // Try to extract activity name from first cell
                if (cells.length > 0) {
                    activity.name = cells.eq(0).text().trim();
                }
                
                // Try to detect category from name or other cells
                const nameUpper = activity.name.toUpperCase();
                if (nameUpper.includes('VISION')) activity.category = 'Vision';
                else if (nameUpper.includes('EFFORT')) activity.category = 'Effort';
                else if (nameUpper.includes('SYSTEM')) activity.category = 'Systems';
                else if (nameUpper.includes('PRACTICE')) activity.category = 'Practice';
                else if (nameUpper.includes('ATTITUDE')) activity.category = 'Attitude';
                
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
                
                // Category should already be the full name from field_1285
                
                const activity = {
                    id: record.id,
                    name: record[fields.activityName] || 'Unnamed Activity',
                    category: record[fields.activityVESPACategory] || 'Unknown',
                    level: parseInt(record[fields.activityLevel]) || 1
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
                            ${this.state.currentRole.canAssign ? `
                                <button class="btn btn-primary" onclick="VESPAStaff.showAssignModal()">
                                    ➕ Assign Activities
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="role-info">
                        ${this.renderRoleSelector()}
                        <span class="student-count">${this.state.filteredStudents.length} Students</span>
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
            `;
        }
        
        // Render individual student row
        renderStudentRow(student) {
            return `
                <tr data-student-id="${student.id}">
                    <td>
                        <div class="student-name">${student.name}</div>
                        <div class="student-email">${student.email}</div>
                    </td>
                    <td class="progress-cell">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${student.progress}%"></div>
                            <span class="progress-text">${student.progress}%</span>
                        </div>
                    </td>
                    <td class="hide-mobile">
                        <div class="vespa-scores">
                            ${this.renderVESPAScores(student.vespaScores)}
                        </div>
                    </td>
                    <td>${student.prescribedCount}</td>
                    <td>${student.completedCount}</td>
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
            return Object.entries(scores).map(([key, value]) => `
                <span class="vespa-pill ${key}" title="${key}: ${value}/10">
                    ${value.toFixed(1)}
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
            this.render();
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
        
        // Show student details modal
        showStudentDetailsModal(student, responses) {
            // Remove existing modal if any
            $('#student-details-modal').remove();
            
            // Create modal HTML
            const modalHtml = `
                <div id="student-details-modal" class="modal" style="display: flex;">
                    <div class="modal-content large-modal">
                        <div class="modal-header">
                            <h2>${student.name}</h2>
                            <button class="modal-close" onclick="$('#student-details-modal').remove()">×</button>
                        </div>
                        <div class="modal-body">
                            ${this.renderStudentDetails(student, responses)}
                        </div>
                    </div>
                </div>
            `;
            
            // Add to body
            $('body').append(modalHtml);
        }
        
        // Render student details content
        renderStudentDetails(student, responses) {
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
                                    <span class="stat-label">Activities Completed</span>
                                    <span class="stat-value">${student.completedCount} / 40</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Activities Prescribed</span>
                                    <span class="stat-value">${student.prescribedCount}</span>
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
                    
                    <!-- Activity Responses (if permitted) -->
                    ${this.state.currentRole.canViewAnswers ? `
                        <div class="student-responses">
                            <h3>Activity Responses</h3>
                            ${responses.length > 0 ? 
                                this.renderActivityResponses(responses) : 
                                '<p class="no-responses">No completed activities found.</p>'
                            }
                        </div>
                    ` : ''}
                </div>
            `;
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
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        closeAllModals() {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none';
            });
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
                // Get activity names for selected activities
                const activityNames = selectedActivities.map(activityId => {
                    const activity = this.state.activities.find(a => a.id === activityId);
                    return activity ? activity.name : '';
                }).filter(name => name);
                
                // Update each student's prescribed activities
                const updatePromises = selectedStudents.map(studentId => 
                    this.updateStudentPrescribedActivities(studentId, activityNames)
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
        
        // Update student's prescribed activities (field_1683)
        async updateStudentPrescribedActivities(studentId, newActivityNames) {
            const fields = this.config.fields;
            const objects = this.config.objects;
            
            try {
                // Get current student data
                const student = this.state.students.find(s => s.id === studentId);
                if (!student) return;
                
                // Get current prescribed activities
                const currentPrescribed = student.prescribedActivities || [];
                
                // Combine with new activities (avoid duplicates)
                const allActivities = [...new Set([...currentPrescribed, ...newActivityNames])];
                
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
                        [fields.prescribedActivities]: allActivities.join(', ')
                    })
                });
                
                log(`Updated prescribed activities for student ${student.name}`);
                
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
            errorLog('VESPA Activities Staff config not found');
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
        } catch (error) {
            errorLog('Failed to initialize VESPA Staff Activities:', error);
        }
    };
    
})();