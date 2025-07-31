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
            staffAdmin: 'object_5',
            tutor: 'object_7',
            headOfYear: 'object_18',
            subjectTeacher: 'object_78',
            student: 'object_6',
            activities: 'object_44',
            vespaResults: 'object_10',
            activityProgress: 'object_126',
            studentAchievements: 'object_127'
        },
        
        // Field mappings
        fields: {
            // Staff role fields
            staffAdminEmail: 'field_86',
            tutorEmail: 'field_96',
            
            // Student fields
            prescribedActivities: 'field_1683',
            completedActivities: 'field_1380',
            studentName: 'field_12',
            studentEmail: 'field_11',
            connectedTutors: 'field_1682',
            connectedHeadsOfYear: 'field_547',
            connectedSubjectTeachers: 'field_2177',
            vespaCustomer: 'field_179',
            
            // VESPA scores
            vision: 'field_147',
            effort: 'field_148',
            systems: 'field_149',
            practice: 'field_150',
            attitude: 'field_151',
            
            // Activity fields
            activityName: 'field_1278',
            activityCategory: 'field_442',
            activityLevel: 'field_1288',
            activityScoreRange: 'field_1287'
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
            const userEmail = user.email;
            
            this.state.allRoles = [];
            
            // Check each role type
            // Note: In production, these would be API calls
            // For now, we'll simulate based on logged-in user
            
            // Check if Staff Admin
            if (user.profile_keys && user.profile_keys.includes(CONFIG.objects.staffAdmin)) {
                this.state.allRoles.push({
                    type: 'staffAdmin',
                    label: 'Staff Admin (All Students)',
                    data: { id: user.id, email: userEmail }
                });
            }
            
            // Check if Tutor
            if (user.profile_keys && user.profile_keys.includes(CONFIG.objects.tutor)) {
                this.state.allRoles.push({
                    type: 'tutor',
                    label: 'Tutor',
                    data: { id: user.id, email: userEmail }
                });
            }
            
            // For testing, always add at least one role
            if (this.state.allRoles.length === 0) {
                this.state.allRoles.push({
                    type: 'tutor',
                    label: 'Tutor (Test Mode)',
                    data: { id: user.id, email: userEmail }
                });
            }
            
            // Set default role
            this.state.currentRole = this.state.allRoles[0];
            
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
            // In production, this would make API calls based on role
            // For now, we'll parse from existing views if available
            
            const studentData = [];
            
            // Try to find student data in existing views
            $('.kn-list-table tbody tr').each((index, row) => {
                const $row = $(row);
                const student = {
                    id: $row.data('record-id') || `student_${index}`,
                    name: $row.find('.field_12').text() || `Student ${index + 1}`,
                    email: $row.find('.field_11').text() || `student${index + 1}@example.com`,
                    prescribedCount: parseInt($row.find('.field_1683').text()) || 5,
                    completedCount: parseInt($row.find('.field_1380').text()) || 0,
                    vespaScores: {
                        vision: Math.floor(Math.random() * 100),
                        effort: Math.floor(Math.random() * 100),
                        systems: Math.floor(Math.random() * 100),
                        practice: Math.floor(Math.random() * 100),
                        attitude: Math.floor(Math.random() * 100)
                    }
                };
                
                student.progress = student.prescribedCount > 0 
                    ? Math.round((student.completedCount / student.prescribedCount) * 100)
                    : 0;
                
                studentData.push(student);
            });
            
            // If no data found, create test data
            if (studentData.length === 0) {
                for (let i = 0; i < 25; i++) {
                    const prescribed = Math.floor(Math.random() * 8) + 3;
                    const completed = Math.floor(Math.random() * prescribed);
                    studentData.push({
                        id: `student_${i}`,
                        name: `Test Student ${i + 1}`,
                        email: `student${i + 1}@school.edu`,
                        prescribedCount: prescribed,
                        completedCount: completed,
                        progress: Math.round((completed / prescribed) * 100),
                        vespaScores: {
                            vision: Math.floor(Math.random() * 40) + 60,
                            effort: Math.floor(Math.random() * 40) + 60,
                            systems: Math.floor(Math.random() * 40) + 60,
                            practice: Math.floor(Math.random() * 40) + 60,
                            attitude: Math.floor(Math.random() * 40) + 60
                        }
                    });
                }
            }
            
            this.state.students = studentData;
            log(`Loaded ${studentData.length} students`);
        }
        
        // Load all activities
        async loadActivities() {
            // In production, this would load from API
            // For now, create sample data
            
            const categories = ['Vision', 'Effort', 'Systems', 'Practice', 'Attitude'];
            const activities = [];
            
            for (let i = 0; i < 50; i++) {
                activities.push({
                    id: `activity_${i}`,
                    name: `Activity ${i + 1}: ${this.generateActivityName()}`,
                    category: categories[Math.floor(Math.random() * categories.length)],
                    level: Math.floor(Math.random() * 3) + 1,
                    duration: `${Math.floor(Math.random() * 30) + 10} mins`,
                    type: ['Video', 'Reading', 'Interactive', 'Exercise'][Math.floor(Math.random() * 4)]
                });
            }
            
            this.state.activities = activities;
            log(`Loaded ${activities.length} activities`);
        }
        
        // Generate random activity name for testing
        generateActivityName() {
            const topics = ['Goal Setting', 'Time Management', 'Study Skills', 'Motivation', 
                          'Memory Techniques', 'Note Taking', 'Exam Preparation', 'Focus'];
            return topics[Math.floor(Math.random() * topics.length)];
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
                            <button class="btn btn-primary" onclick="VESPAStaff.showAssignModal()">
                                ➕ Assign Activities
                            </button>
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
                                    onclick="VESPAStaff.viewStudent('${student.id}')">
                                View
                            </button>
                            <button class="btn btn-action btn-primary" 
                                    onclick="VESPAStaff.assignToStudent('${student.id}')">
                                Assign
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Render VESPA score pills
        renderVESPAScores(scores) {
            return Object.entries(scores).map(([key, value]) => `
                <span class="vespa-pill ${key}" title="${key}: ${value}%">
                    ${value}
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
        
        viewStudent(studentId) {
            const student = this.state.students.find(s => s.id === studentId);
            if (student) {
                alert(`View details for ${student.name}`);
                // In production, this would open a detailed view
            }
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
                                    <span>${activity.duration}</span>
                                    <span>${activity.type}</span>
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
        
        confirmAssignment() {
            // In production, this would make API calls to assign activities
            const selectedCount = this.state.selectedActivities.size;
            const studentCount = this.state.selectedStudents.size;
            
            if (selectedCount === 0) {
                alert('Please select at least one activity');
                return;
            }
            
            alert(`Assigning ${selectedCount} activities to ${studentCount} student(s)`);
            this.closeModal('assign-modal');
            
            // Refresh data
            this.loadData().then(() => this.render());
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
    
    // Initialize on scene render
    $(document).on('knack-scene-render.scene_1256', function() {
        log('Scene 1256 rendered, initializing staff manager...');
        setTimeout(() => staffManager.init(), 100);
    });
    
})();