# Dynamic Staff Filtering Approach
**Scene 1256 - Staff Management**

## 🎯 Problem Statement
Creating separate views for each staff role (Staff Admin, Tutor, Head of Year, Subject Teacher) is:
- Inefficient (4+ views per data type)
- Doesn't handle users with multiple roles
- Difficult to maintain
- Poor UX for role switching

## 💡 Solution: Dynamic Role-Based Filtering

### Core Concept
1. Single view that loads ALL student data (hidden)
2. JavaScript detects logged-in user's role(s)
3. Dynamically filter and display relevant students
4. Provide role/group switching for multi-role users

## 🔧 Implementation Details

### Step 1: Role Detection
```javascript
async function detectUserRoles() {
    const user = Knack.session.user;
    const userEmail = user.email;
    const roles = {
        staffAdmin: null,
        tutor: null,
        headOfYear: null,
        subjectTeacher: null,
        allRoles: []
    };
    
    // Check Staff Admin (Object_5)
    const staffAdminCheck = await Knack.api('/v1/objects/object_5/records', {
        filters: [{
            field: 'field_86', // Staff Admin Email
            operator: 'is',
            value: userEmail
        }]
    });
    
    if (staffAdminCheck.records.length > 0) {
        roles.staffAdmin = staffAdminCheck.records[0];
        roles.allRoles.push({
            type: 'staffAdmin',
            label: 'Staff Admin (All Students)',
            data: staffAdminCheck.records[0]
        });
    }
    
    // Check Tutor (Object_7)
    const tutorCheck = await Knack.api('/v1/objects/object_7/records', {
        filters: [{
            field: 'field_96', // Tutor Email
            operator: 'is',
            value: userEmail
        }]
    });
    
    if (tutorCheck.records.length > 0) {
        roles.tutor = tutorCheck.records[0];
        // Get tutor groups from connected records
        const tutorGroups = tutorCheck.records[0].field_XXX; // Tutor groups field
        roles.allRoles.push({
            type: 'tutor',
            label: `Tutor (${tutorGroups.length} groups)`,
            data: tutorCheck.records[0],
            groups: tutorGroups
        });
    }
    
    // Similar checks for Head of Year and Subject Teacher...
    
    return roles;
}
```

### Step 2: Dynamic Student Loading
```javascript
async function loadStudentsForRole(roleType, roleData) {
    let filters = [];
    
    switch(roleType) {
        case 'staffAdmin':
            // Load ALL students from the school
            filters = [{
                field: 'field_179', // Connected VESPA Customer
                operator: 'is',
                value: Knack.session.user.field_XXX // User's school
            }];
            break;
            
        case 'tutor':
            // Load students connected to this tutor
            filters = [{
                field: 'field_1682', // Connected Tutors
                operator: 'contains',
                value: roleData.id
            }];
            break;
            
        case 'headOfYear':
            // Load students in the year group
            filters = [{
                field: 'field_547', // Connected Heads of Year
                operator: 'contains',
                value: roleData.id
            }];
            break;
            
        case 'subjectTeacher':
            // Load students in subject classes
            filters = [{
                field: 'field_2177', // Connected Subject Teachers
                operator: 'contains',
                value: roleData.id
            }];
            break;
    }
    
    const students = await Knack.api('/v1/objects/object_6/records', {
        filters: filters,
        rows_per_page: 1000
    });
    
    return students.records;
}
```

### Step 3: UI Components

#### Role Selector (for multi-role users)
```javascript
function createRoleSelectorUI(roles) {
    if (roles.allRoles.length <= 1) return ''; // No selector needed
    
    return `
        <div class="role-selector">
            <label>View students as:</label>
            <select id="role-switcher">
                ${roles.allRoles.map(role => `
                    <option value="${role.type}" data-role='${JSON.stringify(role)}'>
                        ${role.label}
                    </option>
                `).join('')}
            </select>
        </div>
    `;
}
```

#### Group Filter (for tutors with multiple groups)
```javascript
function createGroupFilterUI(groups) {
    if (!groups || groups.length <= 1) return '';
    
    return `
        <div class="group-filter">
            <label>Filter by group:</label>
            <select id="group-filter">
                <option value="all">All Groups</option>
                ${groups.map(group => `
                    <option value="${group.id}">${group.identifier}</option>
                `).join('')}
            </select>
        </div>
    `;
}
```

### Step 4: Student Dashboard Grid
```javascript
function createStudentDashboard(students, activityProgress) {
    return `
        <div class="student-dashboard">
            <div class="dashboard-header">
                <h2>Student Activities Overview</h2>
                <div class="stats">
                    <span>Total Students: ${students.length}</span>
                    <span>Average Progress: ${calculateAverageProgress(activityProgress)}%</span>
                </div>
            </div>
            
            <div class="filter-controls">
                <input type="text" id="student-search" placeholder="Search students...">
                <select id="progress-filter">
                    <option value="all">All Progress</option>
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                <button id="export-btn">Export Report</button>
            </div>
            
            <div class="student-grid">
                ${students.map(student => createStudentCard(student, activityProgress[student.id])).join('')}
            </div>
        </div>
    `;
}
```

### Step 5: Caching Strategy
```javascript
// Cache student data to reduce API calls
const staffCache = {
    students: new Map(),
    progress: new Map(),
    lastFetch: null,
    
    shouldRefresh() {
        if (!this.lastFetch) return true;
        const fiveMinutes = 5 * 60 * 1000;
        return Date.now() - this.lastFetch > fiveMinutes;
    },
    
    async getStudents(roleType, roleData) {
        const cacheKey = `${roleType}-${roleData.id}`;
        
        if (!this.shouldRefresh() && this.students.has(cacheKey)) {
            return this.students.get(cacheKey);
        }
        
        const students = await loadStudentsForRole(roleType, roleData);
        this.students.set(cacheKey, students);
        this.lastFetch = Date.now();
        
        return students;
    }
};
```

## 📋 Views Required for Scene 1256

Instead of multiple filtered views, we need:

### 1. **Hidden Data Views** (load once, filter in JS)
- Student records (Object_6) - unfiltered
- Activity Progress (Object_126) - unfiltered
- Student Achievements (Object_127) - unfiltered

### 2. **Visible Views**
- Rich Text for UI injection
- Activity Assignment form (Object_44)
- Student Response details (Object_46)

### 3. **API Endpoints to Use**
- `/v1/objects/object_5/records` - Staff Admin lookup
- `/v1/objects/object_7/records` - Tutor lookup
- `/v1/objects/object_18/records` - Head of Year lookup
- `/v1/objects/object_78/records` - Subject Teacher lookup
- `/v1/objects/object_6/records` - Student filtering
- `/v1/objects/object_126/records` - Progress data

## 🎨 UI Flow

1. **Initial Load**
   - Detect user roles
   - Show role selector if multiple roles
   - Load students for default/selected role

2. **Role Switching**
   - User selects different role
   - Reload student list
   - Update UI accordingly

3. **Group Filtering**
   - For tutors: show group dropdown
   - Filter displayed students by group

4. **Actions Available**
   - View student progress details
   - Assign activities (bulk or individual)
   - View responses
   - Export reports
   - Add feedback

## 🚀 Benefits

1. **Single source of truth** - One set of views to maintain
2. **Flexible** - Easy to add new roles or filtering criteria
3. **Performance** - Cache data, reduce API calls
4. **UX** - Seamless role switching for multi-role users
5. **Scalable** - Works regardless of number of students

## 💾 Next Steps

1. Add hidden views to scene 1256 for unfiltered data
2. Implement role detection logic
3. Build dynamic filtering system
4. Create responsive student grid
5. Add caching layer
6. Test with multi-role users 