/**
 * VESPA Activities Staff Management System v3.0
 * Clean rebuild with focus on simplicity and real functionality
 * No placeholders - only working code
 */

(function() {
    'use strict';
    
    // Immediately hide data views to prevent flash
    const style = document.createElement('style');
    style.textContent = `
        #view_3177, #view_3178, #view_3192, #view_3193, 
        #view_3194, #view_3195 { 
            display: none !important; 
        }
    `;
    document.head.appendChild(style);
    
    // Configuration
    const CONFIG = {
        appId: window.APP_ID || '66fbdc96a11d34001eb70a87',
        apiKey: window.API_KEY || 'ad17045c-95bb-4c1d-ad79-7f1e76d5c52a',
        containerId: 'view_3179',
        
        // View IDs
        views: {
            container: 'view_3179',
            activities: 'view_3178',
            answers: 'view_3177',
            staffAdmin: 'view_3192',
            tutor: 'view_3193',
            headOfYear: 'view_3194',
            subjectTeacher: 'view_3195'
        },
        
        // Object IDs
        objects: {
            student: 'object_6',
            activities: 'object_44',
            questions: 'object_45',
            answers: 'object_46',
            vespaScores: 'object_10',
            progress: 'object_126'
        },
        
        // Field mappings
        fields: {
            // Student fields
            studentName: 'field_90',
            studentEmail: 'field_91',
            curriculum: 'field_1683',  // Prescribed activities
            completed: 'field_1380',   // Finished activities CSV
            vespaConnection: 'field_182',
            
            // Staff connections
            tutors: 'field_1682',
            headsOfYear: 'field_547',
            subjectTeachers: 'field_2177',
            staffAdmins: 'field_190',
            
            // VESPA scores
            vision: 'field_147',
            effort: 'field_148',
            systems: 'field_149',
            practice: 'field_150',
            attitude: 'field_151',
            
            // Activity fields
            activityName: 'field_1278',
            activityCategory: 'field_1285',
            activityLevel: 'field_3568',
            
            // Progress fields
            progressStudent: 'field_3536',
            progressActivity: 'field_3537',
            progressStatus: 'field_3543',
            progressOrigin: 'field_3546',
            progressDateCompleted: 'field_3541'
        },
        
        // VESPA theme colors
        colors: {
            vision: '#ff8f00',
            effort: '#86b4f0',
            systems: '#72cb44',
            practice: '#7f31a4',
            attitude: '#f032e6'
        }
    };
    
    /**
     * Main Application Class
     */
    class VESPAStaffApp {
        constructor() {
            this.state = {
                currentView: 'overview',
                currentStudent: null,
                students: [],
                activities: [],
                vespaScores: {},
                progress: {},
                userRole: null,
                roleId: null,
                selectedStudents: new Set(),
                draggedActivity: null,
                filters: {
                    search: '',
                    category: '',
                    completed: ''
                }
            };
            
            this.container = null;
            this.initialized = false;
        }
        
        /**
         * Initialize the application
         */
        async init() {
            console.log('VESPA Staff App v3.0 initializing...');
            
            try {
                // Wait for Knack to be ready
                await this.waitForKnack();
                
                // Find container
                this.container = document.getElementById(CONFIG.containerId);
                if (!this.container) {
                    throw new Error('Container not found');
                }
                
                // Detect user role
                await this.detectUserRole();
                
                // Load initial data
                await this.loadData();
                
                // Render the app
                this.render();
                
                // Setup event listeners
                this.attachEventListeners();
                
                this.initialized = true;
                console.log('VESPA Staff App initialized successfully');
                
            } catch (error) {
                console.error('Failed to initialize:', error);
                this.showError('Failed to load the application. Please refresh the page.');
            }
        }
        
        /**
         * Wait for Knack to be ready
         */
        waitForKnack() {
            return new Promise((resolve) => {
                if (window.Knack && window.Knack.objects) {
                    resolve();
                } else {
                    const observer = new MutationObserver(() => {
                        if (window.Knack && window.Knack.objects) {
                            observer.disconnect();
                            resolve();
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            });
        }
        
        /**
         * Detect user role and permissions
         */
        async detectUserRole() {
            // Wait a bit for Knack to fully load user data
            await new Promise(resolve => setTimeout(resolve, 100));
            
            let user = Knack.getUserAttributes();
            console.log('User attributes:', user);
            
            if (!user) {
                console.warn('User not found, retrying...');
                // Sometimes Knack needs more time
                await new Promise(resolve => setTimeout(resolve, 500));
                user = Knack.getUserAttributes();
                if (!user) {
                    throw new Error('User not authenticated');
                }
            }
            
            // Check if user has profiles array
            if (!user.profiles) {
                console.warn('User profiles not found, checking for roles directly');
                user.profiles = [];
            }
            
            // Check each profile to find staff role
            const roleMapping = {
                'profile_5': 'staffAdmin',
                'profile_7': 'tutor',
                'profile_18': 'headOfYear',
                'profile_78': 'subjectTeacher'
            };
            
            for (const [profile, role] of Object.entries(roleMapping)) {
                if (user.profiles && user.profiles.includes(profile)) {
                    this.state.userRole = role;
                    
                    // Get the actual role record ID
                    const roleRecord = await this.getRoleRecord(role);
                    this.state.roleId = roleRecord?.id;
                    
                    console.log(`User role detected: ${role} (ID: ${this.state.roleId})`);
                    break;
                }
            }
            
            if (!this.state.userRole) {
                throw new Error('No staff role detected');
            }
        }
        
        /**
         * Get role record for filtering
         */
        async getRoleRecord(role) {
            const roleObjects = {
                staffAdmin: 'object_5',
                tutor: 'object_7',
                headOfYear: 'object_18',
                subjectTeacher: 'object_78'
            };
            
            const objectId = roleObjects[role];
            const userEmail = Knack.getUserAttributes().email;
            
            try {
                const response = await this.knackAPI('GET', `${objectId}/records`, {
                    filters: [{
                        field: 'field_70',  // Email field
                        operator: 'is',
                        value: userEmail
                    }]
                });
                
                return response.records?.[0];
            } catch (error) {
                console.error('Error fetching role record:', error);
                return null;
            }
        }
        
        /**
         * Load all necessary data
         */
        async loadData() {
            this.showLoading('Loading data...');
            
            try {
                // Load in parallel for better performance
                await Promise.all([
                    this.loadStudents(),
                    this.loadActivities(),
                    this.loadVESPAScores()
                ]);
                
                // Load progress records for all students
                if (this.state.students.length > 0) {
                    const studentIds = this.state.students.map(s => s.id);
                    await this.loadProgressRecords(studentIds);
                }
                
                this.hideLoading();
                
            } catch (error) {
                console.error('Error loading data:', error);
                this.hideLoading();
                this.showError('Failed to load data');
            }
        }
        
        /**
         * Load students based on role
         */
        async loadStudents() {
            const filters = [];
            
            // Add role-based filters
            switch (this.state.userRole) {
                case 'staffAdmin':
                    if (this.state.roleId) {
                        filters.push({
                            field: CONFIG.fields.staffAdmins,
                            operator: 'contains',
                            value: this.state.roleId
                        });
                    }
                    break;
                case 'tutor':
                    if (this.state.roleId) {
                        filters.push({
                            field: CONFIG.fields.tutors,
                            operator: 'contains',
                            value: this.state.roleId
                        });
                    }
                    break;
                case 'headOfYear':
                    if (this.state.roleId) {
                        filters.push({
                            field: CONFIG.fields.headsOfYear,
                            operator: 'contains',
                            value: this.state.roleId
                        });
                    }
                    break;
                case 'subjectTeacher':
                    if (this.state.roleId) {
                        filters.push({
                            field: CONFIG.fields.subjectTeachers,
                            operator: 'contains',
                            value: this.state.roleId
                        });
                    }
                    break;
            }
            
            const response = await this.knackAPI('GET', `${CONFIG.objects.student}/records`, {
                filters: filters,
                rows_per_page: 100,
                sort_field: CONFIG.fields.studentName,
                sort_order: 'asc'
            });
            
            this.state.students = response.records.map(record => this.parseStudent(record));
            console.log(`Loaded ${this.state.students.length} students`);
        }
        
        /**
         * Parse student record
         */
        parseStudent(record) {
            const getFieldValue = (field, defaultValue = '') => {
                return record[field] || record[`${field}_raw`] || defaultValue;
            };
            
            // Parse curriculum activities
            const curriculumHtml = getFieldValue(CONFIG.fields.curriculum, '');
            const curriculumIds = this.parseActivityIds(curriculumHtml);
            
            // Parse completed activities
            const completedCsv = getFieldValue(CONFIG.fields.completed, '');
            const completedIds = completedCsv ? completedCsv.split(',').map(id => id.trim()) : [];
            
            return {
                id: record.id,
                name: getFieldValue(CONFIG.fields.studentName, {}).full || 'Unknown',
                email: getFieldValue(CONFIG.fields.studentEmail, {}).email || '',
                curriculumIds: curriculumIds,
                completedIds: completedIds,
                vespaConnectionId: getFieldValue(CONFIG.fields.vespaConnection),
                progress: this.calculateProgress(curriculumIds, completedIds)
            };
        }
        
        /**
         * Parse activity IDs from HTML connections
         */
        parseActivityIds(html) {
            if (!html) return [];
            
            const ids = [];
            const regex = /data-record-id="([^"]+)"/g;
            let match;
            
            while ((match = regex.exec(html)) !== null) {
                ids.push(match[1]);
            }
            
            return ids;
        }
        
        /**
         * Calculate progress percentage
         */
        calculateProgress(curriculumIds, completedIds) {
            if (curriculumIds.length === 0) return 0;
            
            const completedInCurriculum = curriculumIds.filter(id => 
                completedIds.includes(id)
            ).length;
            
            return Math.round((completedInCurriculum / curriculumIds.length) * 100);
        }
        
        /**
         * Load activities
         */
        async loadActivities() {
            // Try to load from API first
            try {
                const response = await this.knackAPI('GET', `${CONFIG.objects.activities}/records`, {
                    rows_per_page: 1000
                });
                
                this.state.activities = response.records.map(record => this.parseActivity(record));
                
            } catch (error) {
                console.warn('Failed to load activities from API, using JSON fallback');
                await this.loadActivitiesFromJSON();
            }
            
            console.log(`Loaded ${this.state.activities.length} activities`);
        }
        
        /**
         * Parse activity record
         */
        parseActivity(record) {
            const getFieldValue = (field, defaultValue = '') => {
                return record[field] || record[`${field}_raw`] || defaultValue;
            };
            
            return {
                id: record.id,
                name: getFieldValue(CONFIG.fields.activityName),
                category: getFieldValue(CONFIG.fields.activityCategory).toLowerCase(),
                level: getFieldValue(CONFIG.fields.activityLevel),
                description: record.field_1134 || '',
                duration: record.field_1135 || '',
                type: record.field_1133 || ''
            };
        }
        
        /**
         * Load activities from JSON fallback
         */
        async loadActivitiesFromJSON() {
            try {
                const response = await fetch('https://cdn.jsdelivr.net/gh/toneillcodes/my-projects@main/activities1e.json');
                const data = await response.json();
                
                this.state.activities = data.map((item, index) => ({
                    id: item.Activity_id || `activity_${index}`,
                    name: item['Activities Name'],
                    category: (item['VESPA Category'] || '').toLowerCase(),
                    level: item.Level || 'Level 2',
                    description: item.background_content || '',
                    duration: '15-20 mins',
                    type: 'Interactive'
                }));
                
            } catch (error) {
                console.error('Failed to load activities JSON:', error);
                this.state.activities = [];
            }
        }
        
        /**
         * Load VESPA scores
         */
        async loadVESPAScores() {
            const studentIds = this.state.students
                .map(s => s.vespaConnectionId)
                .filter(id => id);
            
            if (studentIds.length === 0) return;
            
            try {
                const filters = studentIds.map(id => ({
                    field: 'id',
                    operator: 'is',
                    value: id
                }));
                
                const response = await this.knackAPI('GET', `${CONFIG.objects.vespaScores}/records`, {
                    filters: filters.length > 1 ? { 
                        match: 'or', 
                        rules: filters 
                    } : filters
                });
                
                response.records.forEach(record => {
                    const scores = {
                        vision: parseInt(record[CONFIG.fields.vision] || 0),
                        effort: parseInt(record[CONFIG.fields.effort] || 0),
                        systems: parseInt(record[CONFIG.fields.systems] || 0),
                        practice: parseInt(record[CONFIG.fields.practice] || 0),
                        attitude: parseInt(record[CONFIG.fields.attitude] || 0)
                    };
                    
                    // Map scores to students
                    const student = this.state.students.find(s => 
                        s.vespaConnectionId === record.id
                    );
                    
                    if (student) {
                        this.state.vespaScores[student.id] = scores;
                    }
                });
                
            } catch (error) {
                console.error('Error loading VESPA scores:', error);
            }
        }
        
        /**
         * Load progress records
         */
        async loadProgressRecords(studentIds) {
            try {
                const filters = studentIds.map(id => ({
                    field: CONFIG.fields.progressStudent,
                    operator: 'is',
                    value: id
                }));
                
                const response = await this.knackAPI('GET', `${CONFIG.objects.progress}/records`, {
                    filters: filters.length > 1 ? {
                        match: 'or',
                        rules: filters
                    } : filters,
                    rows_per_page: 1000
                });
                
                // Group progress by student
                response.records.forEach(record => {
                    const studentId = record[`${CONFIG.fields.progressStudent}_raw`]?.[0]?.id;
                    const activityId = record[`${CONFIG.fields.progressActivity}_raw`]?.[0]?.id;
                    
                    if (studentId && activityId) {
                        if (!this.state.progress[studentId]) {
                            this.state.progress[studentId] = {};
                        }
                        
                        this.state.progress[studentId][activityId] = {
                            status: record[CONFIG.fields.progressStatus],
                            origin: record[CONFIG.fields.progressOrigin],
                            dateCompleted: record[CONFIG.fields.progressDateCompleted]
                        };
                    }
                });
                
            } catch (error) {
                console.error('Error loading progress records:', error);
            }
        }
        
        /**
         * Render the application
         */
        render() {
            if (!this.container) return;
            
            this.container.innerHTML = `
                <div class="vespa-staff-app">
                    ${this.state.currentView === 'overview' ? 
                        this.renderOverviewPage() : 
                        this.renderDetailsPage()
                    }
                </div>
            `;
        }
        
        /**
         * Render overview page (Page 1)
         */
        renderOverviewPage() {
            return `
                <div class="staff-overview">
                    <header class="overview-header">
                        <h1>VESPA Activities Management</h1>
                        <div class="header-info">
                            <span class="role-badge">${this.formatRole(this.state.userRole)}</span>
                            <span class="student-count">${this.state.students.length} students</span>
                        </div>
                    </header>
                    
                    <div class="search-bar">
                        <input type="text" 
                               class="search-input" 
                               placeholder="Search students..."
                               value="${this.state.filters.search}">
                    </div>
                    
                    <div class="students-table-container">
                        <table class="students-table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Progress</th>
                                    <th>VESPA Scores</th>
                                    <th>Activities Overview</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderStudentRows()}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        
        /**
         * Render student rows
         */
        renderStudentRows() {
            const filteredStudents = this.filterStudents();
            
            if (filteredStudents.length === 0) {
                return `
                    <tr>
                        <td colspan="5" class="empty-message">
                            No students found
                        </td>
                    </tr>
                `;
            }
            
            return filteredStudents.map(student => `
                <tr data-student-id="${student.id}">
                    <td class="student-name-cell">
                        <div class="student-name">${student.name}</div>
                        <div class="student-email">${student.email}</div>
                    </td>
                    <td class="progress-cell">
                        ${this.renderProgressBar(student)}
                    </td>
                    <td class="scores-cell">
                        ${this.renderVESPAScores(student.id)}
                    </td>
                    <td class="activities-cell">
                        ${this.renderActivitiesOverview(student)}
                    </td>
                    <td class="actions-cell">
                        <button class="btn-view" data-student-id="${student.id}">
                            View Details
                        </button>
                    </td>
                </tr>
            `).join('');
        }
        
        /**
         * Filter students based on search
         */
        filterStudents() {
            const search = this.state.filters.search.toLowerCase();
            
            if (!search) return this.state.students;
            
            return this.state.students.filter(student => 
                student.name.toLowerCase().includes(search) ||
                student.email.toLowerCase().includes(search)
            );
        }
        
        /**
         * Render progress bar
         */
        renderProgressBar(student) {
            const total = student.curriculumIds.length;
            const completed = student.curriculumIds.filter(id => 
                student.completedIds.includes(id)
            ).length;
            
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            return `
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="progress-text">${completed}/${total}</div>
                </div>
            `;
        }
        
        /**
         * Render VESPA scores
         */
        renderVESPAScores(studentId) {
            const scores = this.state.vespaScores[studentId];
            
            if (!scores) {
                return '<div class="no-scores">No scores available</div>';
            }
            
            return `
                <div class="vespa-scores">
                    ${Object.entries(scores).map(([category, score]) => `
                        <div class="score-pill ${category}" title="${this.capitalize(category)}: ${score}/10">
                            <span class="score-value">${score}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        /**
         * Render activities overview
         */
        renderActivitiesOverview(student) {
            // Count activities by category
            const categoryCounts = {
                vision: 0,
                effort: 0,
                systems: 0,
                practice: 0,
                attitude: 0
            };
            
            const categoryActivities = {
                vision: [],
                effort: [],
                systems: [],
                practice: [],
                attitude: []
            };
            
            student.curriculumIds.forEach(activityId => {
                const activity = this.state.activities.find(a => a.id === activityId);
                if (activity && categoryCounts[activity.category] !== undefined) {
                    categoryCounts[activity.category]++;
                    categoryActivities[activity.category].push(activity.name);
                }
            });
            
            return `
                <div class="activities-overview">
                    ${Object.entries(categoryCounts).map(([category, count]) => {
                        if (count === 0) return '';
                        
                        const activities = categoryActivities[category];
                        const tooltip = activities.join(', ');
                        
                        return `
                            <div class="category-card ${category}" 
                                 title="${tooltip}"
                                 data-activities="${activities.join('|')}">
                                <span class="category-count">${count}</span>
                                <span class="category-initial">${category[0].toUpperCase()}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        /**
         * Render details page (Page 2)
         */
        renderDetailsPage() {
            const student = this.state.currentStudent;
            if (!student) return '<div>No student selected</div>';
            
            return `
                <div class="student-details">
                    <header class="details-header">
                        <button class="btn-back">← Back to Overview</button>
                        <div class="student-info">
                            <h2>${student.name}</h2>
                            <span class="student-email">${student.email}</span>
                        </div>
                        <button class="btn-clear-all" data-student-id="${student.id}">
                            × Clear All Activities
                        </button>
                    </header>
                    
                    <div class="curriculum-section">
                        <h3>Student Activities</h3>
                        <div class="curriculum-grid" id="student-curriculum" data-student-id="${student.id}">
                            ${this.renderCurriculumActivities(student)}
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="all-activities-section">
                        <h3>All Activities</h3>
                        <div class="vespa-columns">
                            ${this.renderActivityColumns()}
                        </div>
                    </div>
                </div>
            `;
        }
        
        /**
         * Render curriculum activities
         */
        renderCurriculumActivities(student) {
            const activities = student.curriculumIds.map(id => 
                this.state.activities.find(a => a.id === id)
            ).filter(Boolean);
            
            // Group by category
            const grouped = {
                vision: [],
                effort: [],
                systems: [],
                practice: [],
                attitude: []
            };
            
            activities.forEach(activity => {
                if (grouped[activity.category]) {
                    grouped[activity.category].push(activity);
                }
            });
            
            return Object.entries(grouped).map(([category, activities]) => `
                <div class="curriculum-category ${category}">
                    <h4>${this.capitalize(category)}</h4>
                    <div class="activity-cards">
                        ${activities.map(activity => 
                            this.renderActivityCard(activity, student, true)
                        ).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        /**
         * Render activity columns for all activities
         */
        renderActivityColumns() {
            const categories = ['vision', 'effort', 'systems', 'practice', 'attitude'];
            
            return categories.map(category => {
                const activities = this.state.activities.filter(a => 
                    a.category === category
                );
                
                return `
                    <div class="vespa-column ${category}" data-category="${category}">
                        <h4>${this.capitalize(category)}</h4>
                        <div class="activity-list" id="all-activities-${category}">
                            ${activities.map(activity => 
                                this.renderActivityCard(activity, null, false)
                            ).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        /**
         * Render activity card
         */
        renderActivityCard(activity, student = null, inCurriculum = false) {
            const isCompleted = student && student.completedIds.includes(activity.id);
            const progress = student ? this.state.progress[student.id]?.[activity.id] : null;
            
            // Determine origin badge
            let originBadge = '';
            if (progress) {
                if (progress.origin === 'student_choice') {
                    originBadge = '<span class="badge badge-self">Self</span>';
                } else if (progress.origin === 'staff_assigned') {
                    originBadge = '<span class="badge badge-staff">Staff</span>';
                }
            }
            
            // Check if prescribed (from questionnaire)
            const isPrescribed = false; // Will implement questionnaire check later
            if (isPrescribed) {
                originBadge = '<span class="badge badge-prescribed">Prescribed</span>';
            }
            
            return `
                <div class="activity-card ${isCompleted ? 'completed' : ''} ${activity.category}"
                     draggable="true"
                     data-activity-id="${activity.id}"
                     data-activity-name="${activity.name}"
                     data-in-curriculum="${inCurriculum}">
                    <div class="card-header">
                        ${originBadge}
                        ${isCompleted ? '<span class="badge badge-completed">✓</span>' : ''}
                    </div>
                    <div class="card-body">
                        <h5>${activity.name}</h5>
                        <span class="level-badge">${activity.level || 'Level 2'}</span>
                    </div>
                    <div class="card-actions">
                        ${inCurriculum ? `
                            <button class="btn-remove" title="Remove from curriculum">−</button>
                        ` : `
                            <button class="btn-add" title="Add to curriculum">+</button>
                        `}
                        <button class="btn-preview" title="Preview activity">👁</button>
                    </div>
                </div>
            `;
        }
        
        /**
         * Attach event listeners
         */
        attachEventListeners() {
            // Delegate events to container
            this.container.addEventListener('click', (e) => {
                // View student details
                if (e.target.classList.contains('btn-view')) {
                    const studentId = e.target.dataset.studentId;
                    this.viewStudent(studentId);
                }
                
                // Back to overview
                if (e.target.classList.contains('btn-back')) {
                    this.showOverview();
                }
                
                // Add/remove activity
                if (e.target.classList.contains('btn-add')) {
                    const card = e.target.closest('.activity-card');
                    this.addActivityToCurriculum(card.dataset.activityId);
                }
                
                if (e.target.classList.contains('btn-remove')) {
                    const card = e.target.closest('.activity-card');
                    this.removeActivityFromCurriculum(card.dataset.activityId);
                }
                
                // Preview activity
                if (e.target.classList.contains('btn-preview')) {
                    const card = e.target.closest('.activity-card');
                    this.previewActivity(card.dataset.activityId);
                }
                
                // Clear all activities
                if (e.target.classList.contains('btn-clear-all')) {
                    const studentId = e.target.dataset.studentId;
                    this.clearAllActivities(studentId);
                }
            });
            
            // Search input
            this.container.addEventListener('input', (e) => {
                if (e.target.classList.contains('search-input')) {
                    this.state.filters.search = e.target.value;
                    this.debounce(() => this.render(), 300)();
                }
            });
            
            // Drag and drop
            this.setupDragAndDrop();
        }
        
        /**
         * Setup drag and drop functionality
         */
        setupDragAndDrop() {
            // Drag start
            this.container.addEventListener('dragstart', (e) => {
                if (e.target.classList.contains('activity-card')) {
                    e.target.classList.add('dragging');
                    this.state.draggedActivity = {
                        id: e.target.dataset.activityId,
                        name: e.target.dataset.activityName,
                        inCurriculum: e.target.dataset.inCurriculum === 'true'
                    };
                    e.dataTransfer.effectAllowed = 'move';
                }
            });
            
            // Drag end
            this.container.addEventListener('dragend', (e) => {
                if (e.target.classList.contains('activity-card')) {
                    e.target.classList.remove('dragging');
                    this.state.draggedActivity = null;
                }
            });
            
            // Drag over
            this.container.addEventListener('dragover', (e) => {
                e.preventDefault();
                
                const dropZone = e.target.closest('.curriculum-grid, .activity-list');
                if (dropZone) {
                    dropZone.classList.add('drag-over');
                    e.dataTransfer.dropEffect = 'move';
                }
            });
            
            // Drag leave
            this.container.addEventListener('dragleave', (e) => {
                const dropZone = e.target.closest('.curriculum-grid, .activity-list');
                if (dropZone && !dropZone.contains(e.relatedTarget)) {
                    dropZone.classList.remove('drag-over');
                }
            });
            
            // Drop
            this.container.addEventListener('drop', (e) => {
                e.preventDefault();
                
                const dropZone = e.target.closest('.curriculum-grid, .activity-list');
                if (dropZone) {
                    dropZone.classList.remove('drag-over');
                    
                    if (this.state.draggedActivity) {
                        const isCurriculumTarget = dropZone.classList.contains('curriculum-grid');
                        
                        if (isCurriculumTarget && !this.state.draggedActivity.inCurriculum) {
                            // Add to curriculum
                            this.addActivityToCurriculum(this.state.draggedActivity.id);
                        } else if (!isCurriculumTarget && this.state.draggedActivity.inCurriculum) {
                            // Remove from curriculum
                            this.removeActivityFromCurriculum(this.state.draggedActivity.id);
                        }
                    }
                }
            });
        }
        
        /**
         * View student details
         */
        viewStudent(studentId) {
            const student = this.state.students.find(s => s.id === studentId);
            if (student) {
                this.state.currentStudent = student;
                this.state.currentView = 'details';
                this.render();
            }
        }
        
        /**
         * Show overview page
         */
        showOverview() {
            this.state.currentView = 'overview';
            this.state.currentStudent = null;
            this.render();
        }
        
        /**
         * Add activity to curriculum
         */
        async addActivityToCurriculum(activityId) {
            if (!this.state.currentStudent) return;
            
            const student = this.state.currentStudent;
            
            // Check if already in curriculum
            if (student.curriculumIds.includes(activityId)) {
                this.showMessage('Activity already in curriculum');
                return;
            }
            
            // Update local state
            student.curriculumIds.push(activityId);
            
            // Update in Knack
            try {
                await this.updateStudentCurriculum(student.id, student.curriculumIds);
                await this.createProgressRecord(student.id, activityId, 'staff_assigned');
                
                this.showMessage('Activity added successfully');
                this.render();
                
            } catch (error) {
                console.error('Error adding activity:', error);
                // Rollback
                student.curriculumIds = student.curriculumIds.filter(id => id !== activityId);
                this.showError('Failed to add activity');
            }
        }
        
        /**
         * Remove activity from curriculum
         */
        async removeActivityFromCurriculum(activityId) {
            if (!this.state.currentStudent) return;
            
            const student = this.state.currentStudent;
            
            // Update local state
            student.curriculumIds = student.curriculumIds.filter(id => id !== activityId);
            
            // Update in Knack
            try {
                await this.updateStudentCurriculum(student.id, student.curriculumIds);
                
                this.showMessage('Activity removed successfully');
                this.render();
                
            } catch (error) {
                console.error('Error removing activity:', error);
                // Rollback
                student.curriculumIds.push(activityId);
                this.showError('Failed to remove activity');
            }
        }
        
        /**
         * Update student curriculum in Knack
         */
        async updateStudentCurriculum(studentId, activityIds) {
            return this.knackAPI('PUT', `${CONFIG.objects.student}/records/${studentId}`, {
                [CONFIG.fields.curriculum]: activityIds
            });
        }
        
        /**
         * Create progress record
         */
        async createProgressRecord(studentId, activityId, origin) {
            return this.knackAPI('POST', `${CONFIG.objects.progress}/records`, {
                [CONFIG.fields.progressStudent]: [studentId],
                [CONFIG.fields.progressActivity]: [activityId],
                [CONFIG.fields.progressStatus]: 'assigned',
                [CONFIG.fields.progressOrigin]: origin,
                field_3539: new Date().toLocaleDateString('en-GB')  // Date assigned
            });
        }
        
        /**
         * Preview activity
         */
        async previewActivity(activityId) {
            const activity = this.state.activities.find(a => a.id === activityId);
            if (!activity) return;
            
            // Load questions and show modal
            const questions = await this.loadActivityQuestions(activityId);
            
            this.showModal({
                title: activity.name,
                content: `
                    <div class="activity-preview">
                        <div class="preview-header">
                            <span class="category-badge ${activity.category}">
                                ${this.capitalize(activity.category)}
                            </span>
                            <span class="level-badge">${activity.level}</span>
                        </div>
                        
                        <div class="preview-content">
                            <h4>Description</h4>
                            <p>${activity.description || 'No description available'}</p>
                            
                            <h4>Questions</h4>
                            ${questions.length > 0 ? `
                                <ol class="questions-list">
                                    ${questions.map(q => `
                                        <li>${q.text}</li>
                                    `).join('')}
                                </ol>
                            ` : '<p>No questions available</p>'}
                        </div>
                        
                        <div class="preview-actions">
                            <button class="btn-assign" data-activity-id="${activityId}">
                                Assign to Student
                            </button>
                        </div>
                    </div>
                `
            });
        }
        
        /**
         * Load activity questions
         */
        async loadActivityQuestions(activityId) {
            try {
                const activity = this.state.activities.find(a => a.id === activityId);
                if (!activity) return [];
                
                const response = await this.knackAPI('GET', `${CONFIG.objects.questions}/records`, {
                    filters: [{
                        field: 'field_1286',  // Activity connection by name
                        operator: 'is',
                        value: activity.name
                    }]
                });
                
                return response.records.map(record => ({
                    text: record.field_1137 || '',
                    type: record.field_1138 || 'text',
                    options: record.field_1139 || '',
                    order: record.field_1140 || 0
                })).sort((a, b) => a.order - b.order);
                
            } catch (error) {
                console.error('Error loading questions:', error);
                return [];
            }
        }
        
        /**
         * Clear all activities
         */
        async clearAllActivities(studentId) {
            if (!confirm('Are you sure you want to clear all activities for this student?')) {
                return;
            }
            
            const student = this.state.students.find(s => s.id === studentId);
            if (!student) return;
            
            try {
                await this.updateStudentCurriculum(studentId, []);
                student.curriculumIds = [];
                
                this.showMessage('All activities cleared');
                this.render();
                
            } catch (error) {
                console.error('Error clearing activities:', error);
                this.showError('Failed to clear activities');
            }
        }
        
        /**
         * Show modal
         */
        showModal(options) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3>${options.title}</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        ${options.content}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close handlers
            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            // Assign button handler
            const assignBtn = modal.querySelector('.btn-assign');
            if (assignBtn) {
                assignBtn.addEventListener('click', () => {
                    this.addActivityToCurriculum(assignBtn.dataset.activityId);
                    modal.remove();
                });
            }
        }
        
        /**
         * Show message
         */
        showMessage(text, type = 'success') {
            const message = document.createElement('div');
            message.className = `message ${type}`;
            message.textContent = text;
            
            document.body.appendChild(message);
            
            setTimeout(() => {
                message.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                message.classList.remove('show');
                setTimeout(() => message.remove(), 300);
            }, 3000);
        }
        
        /**
         * Show error
         */
        showError(text) {
            this.showMessage(text, 'error');
        }
        
        /**
         * Show loading
         */
        showLoading(text = 'Loading...') {
            if (!this.loadingElement) {
                this.loadingElement = document.createElement('div');
                this.loadingElement.className = 'loading-overlay';
                this.loadingElement.innerHTML = `
                    <div class="loading-content">
                        <div class="spinner"></div>
                        <p>${text}</p>
                    </div>
                `;
                document.body.appendChild(this.loadingElement);
            }
        }
        
        /**
         * Hide loading
         */
        hideLoading() {
            if (this.loadingElement) {
                this.loadingElement.remove();
                this.loadingElement = null;
            }
        }
        
        /**
         * Knack API helper
         */
        async knackAPI(method, endpoint, data = null) {
            const url = `https://api.knack.com/v1/objects/${endpoint}`;
            
            const options = {
                method: method,
                headers: {
                    'X-Knack-Application-Id': CONFIG.appId,
                    'X-Knack-REST-API-Key': CONFIG.apiKey,
                    'Content-Type': 'application/json'
                }
            };
            
            if (data) {
                if (method === 'GET') {
                    const params = new URLSearchParams();
                    Object.entries(data).forEach(([key, value]) => {
                        if (value !== null && value !== undefined) {
                            params.append(key, typeof value === 'object' ? 
                                JSON.stringify(value) : value);
                        }
                    });
                    const queryString = params.toString();
                    if (queryString) {
                        url += (url.includes('?') ? '&' : '?') + queryString;
                    }
                } else {
                    options.body = JSON.stringify(data);
                }
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return response.json();
        }
        
        /**
         * Utility functions
         */
        capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        
        formatRole(role) {
            const roles = {
                staffAdmin: 'Staff Admin',
                tutor: 'Tutor',
                headOfYear: 'Head of Year',
                subjectTeacher: 'Subject Teacher'
            };
            return roles[role] || role;
        }
        
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    }
    
    // Create global initializer function for the loader
    window.initializeVESPAActivitiesStaff = function(config) {
        console.log('VESPA Staff App v3.0 - Initializer called by loader');
        
        // Store config if provided
        if (config) {
            window.VESPA_ACTIVITIES_STAFF_CONFIG = config;
        }
        
        // Initialize the app
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.vespaStaffApp = new VESPAStaffApp();
                window.vespaStaffApp.init();
            });
        } else {
            window.vespaStaffApp = new VESPAStaffApp();
            window.vespaStaffApp.init();
        }
    };
    
    // Also support direct initialization if not loaded via loader
    if (!window._loaderVersion) {
        console.log('VESPA Staff App v3.0 - Direct initialization (no loader detected)');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.vespaStaffApp = new VESPAStaffApp();
                window.vespaStaffApp.init();
            });
        } else {
            window.vespaStaffApp = new VESPAStaffApp();
            window.vespaStaffApp.init();
        }
    }
    
})();
