# VESPA Activities Redesign - Action Plan
**Created**: January 28, 2025

## 🚀 Overview
Complete redesign of the VESPA Activities system with two new scenes and enhanced functionality.

## 📊 Points System Design

### Simple & Fun Points Structure:
- **Basic Completion**: 10 points
- **Quality Bonus** (based on word count):
  - Short responses (< 50 words): +2 points
  - Medium responses (50-150 words): +5 points  
  - Detailed responses (150+ words): +10 points
- **Streak Bonus**: +5 points for each consecutive day
- **First Activity of the Day**: +3 points
- **Complete Set Bonus**: +25 points for completing all prescribed activities

### Achievement Milestones:
- 50 points: "Getting Started! 🌱"
- 100 points: "Making Progress! 🚀"
- 250 points: "On Fire! 🔥"
- 500 points: "VESPA Champion! 🏆"
- 1000 points: "VESPA Legend! ⭐"

## 🎯 GitHub Setup

### 1. Create New Repository Structure:
```
vespa-activities-v2/
├── student/
│   ├── VESPAactivitiesStudent.js
│   ├── VESPAactivitiesStudent.css
│   └── assets/
├── staff/
│   ├── VESPAactivitiesStaff.js
│   ├── VESPAactivitiesStaff.css
│   └── components/
├── shared/
│   ├── VESPAactivitiesDataLayer.js
│   ├── vespa-problem-activity-mappings.json
│   └── utils/
└── README.md
```

## 📋 Knack Object Setup

### Scene 1258 (Student Activities) - Add These Views:

1. **view_XXXX** - VESPA Results (Object_10)
   - Filter: Current logged-in student
   - Fields: All VESPA scores (147-151), Level (568)
   - Hidden: Yes

2. **view_XXXX** - Student Record (Object_6)
   - Filter: Current logged-in student
   - Fields: field_1683 (prescribed activities), field_1380 (finished activities)
   - Hidden: Yes

3. **view_XXXX** - All Activities (Object_44)
   - Filter: Active = Yes
   - Fields: All activity fields
   - Hidden: Yes

4. **view_XXXX** - Activity Progress (NEW OBJECT)
   - Filter: Current logged-in student
   - Hidden: Yes

5. **view_XXXX** - Rich Text View
   - For UI injection
   - Visible: Yes

### Scene 1256 (Staff Management) - Add These Views:

1. **view_XXXX** - Connected Students
   - Filter: Based on logged-in staff role
   - Object_6 with connections to staff
   - Grid/Table view

2. **view_XXXX** - Activity Progress Overview (NEW OBJECT)
   - Connected to students view
   - Summary statistics

3. **view_XXXX** - Activity Assignments
   - Object_44 with ability to bulk assign
   - Form view

4. **view_XXXX** - Student Responses
   - Object_46 - Activity Answers
   - Detail view

5. **view_XXXX** - Rich Text View
   - For dashboard UI
   - Visible: Yes

## 🗄️ New Knack Objects to Create

### 1. Object: Activity Progress
```
Fields:
- progress_id (Auto-increment)
- student (Connection to Object_6)
- activity (Connection to Object_44)
- questionnaire_cycle (Number)
- date_assigned (Date/Time)
- date_started (Date/Time)
- date_completed (Date/Time)
- total_time_minutes (Number)
- completion_status (Multiple Choice: not_started, in_progress, completed)
- staff_verified (Yes/No)
- points_earned (Number)
- selected_via (Multiple Choice: prescribed, problem_based, browse_all)
- problem_id (Short Text)
- staff_notes (Paragraph Text)
- student_reflection (Paragraph Text)
- word_count (Number)
```

### 2. Object: Student Achievements
```
Fields:
- achievement_id (Auto-increment)
- student (Connection to Object_6)
- achievement_type (Multiple Choice: points_milestone, streak, completion_bonus, certificate)
- achievement_name (Short Text)
- achievement_description (Paragraph Text)
- date_earned (Date/Time)
- points_value (Number)
- icon_emoji (Short Text)
- issued_by_staff (Connection to Staff - optional)
- criteria_met (Paragraph Text)
```

### 3. Object: Activity Feedback
```
Fields:
- feedback_id (Auto-increment)
- activity_progress (Connection to Activity Progress)
- staff_member (Connection to Staff)
- feedback_text (Paragraph Text)
- feedback_date (Date/Time)
- feedback_type (Multiple Choice: encouragement, correction, praise)
```

## 🔧 KnackAppLoader Updates

Update your `KnackAppLoader(copy).js` to include:

```javascript
// Student Activities V2
{
    appName: 'VESPAActivitiesStudentV2',
    scenes: ['scene_1258'],
    views: ['any'],
    scriptUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-GITHUB]/vespa-activities-v2@main/student/VESPAactivitiesStudent.js',
    cssUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-GITHUB]/vespa-activities-v2@main/student/VESPAactivitiesStudent.css',
    configBuilder: (baseConfig) => ({
        ...baseConfig,
        problemMappingsUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-GITHUB]/vespa-activities-v2@main/shared/vespa-problem-activity-mappings.json'
    })
},
// Staff Management V2
{
    appName: 'VESPAActivitiesStaffV2',
    scenes: ['scene_1256'],
    views: ['any'],
    scriptUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-GITHUB]/vespa-activities-v2@main/staff/VESPAactivitiesStaff.js',
    cssUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-GITHUB]/vespa-activities-v2@main/staff/VESPAactivitiesStaff.css'
}
```

## 📝 Implementation Steps

### Phase 1: Setup (Week 1)
1. ✅ Create new Knack objects
2. ✅ Set up scenes 1258 and 1256 with views
3. ✅ Create GitHub repository
4. ✅ Upload problem mappings JSON
5. ✅ Update KnackAppLoader

### Phase 2: Student Experience (Week 2-3)
1. ✅ Build problem selector UI
2. ✅ Implement smart activity filtering
3. ✅ Create activity browser
4. ✅ Add progress tracking
5. ✅ Implement points system
6. ✅ Test completion flow

### Phase 3: Staff Dashboard (Week 4-5)
1. ✅ Create overview dashboard
2. ✅ Build student progress grid
3. ✅ Implement activity assignment
4. ✅ Add response viewing
5. ✅ Create export functionality
6. ✅ Test staff workflows

### Phase 4: Polish & Launch (Week 6)
1. ✅ Final UI tweaks
2. ✅ Performance optimization
3. ✅ User testing
4. ✅ Documentation
5. ✅ Deployment

## 🎨 UI/UX Guidelines

### Colors (from memory [[memory:4412889]]):
- Primary Blues: #079baa, #7bd8d0, #00e5db
- Secondary: #5899a8, #2f8dcb
- Dark Blues: #23356f, #2a3c7a
- VESPA Category colors as accent only

### Typography:
- Headers: Bold, playful with emojis
- Body: Clear, readable (16px minimum)
- Mobile: Larger touch targets (44px minimum)

### Animations:
- Subtle slide-ins for cards
- Smooth progress bar fills
- Bounce effects on achievements
- Confetti on milestones! 🎉

## 🔐 Permissions Matrix

| Feature | Students | Tutors | Staff Admins | Heads of Year | Subject Teachers |
|---------|----------|---------|--------------|---------------|------------------|
| View own activities | ✅ | ❌ | ❌ | ❌ | ❌ |
| Complete activities | ✅ | ❌ | ❌ | ❌ | ❌ |
| View student progress | ❌ | ✅ | ✅ | ✅ | ✅ |
| Assign activities | ❌ | ✅ | ✅ | ❌ | ❌ |
| Override completion | ❌ | ✅ | ✅ | ❌ | ❌ |
| Export reports | ❌ | ✅ | ✅ | ✅ | ✅ |
| Issue certificates | ❌ | ✅ | ✅ | ❌ | ❌ |

## 📊 API Considerations

### Hidden Views Approach Benefits:
- Faster initial load (pre-rendered data)
- Reduced API calls for static data
- Knack handles filtering/permissions

### Direct API for:
- Progress updates
- Real-time completion tracking
- Points calculations
- Dynamic staff actions

## 🚨 Important Notes

1. **Data Migration**: Progress from current system persists through field_1380
2. **Backward Compatibility**: Keep scene_437 running until full migration
3. **Testing**: Create test accounts for each role
4. **CDN Caching**: Use versioning in URLs (e.g., @v1.0.0)
5. **Error Handling**: Implement fallbacks for missing data

## 📞 Next Steps

1. Review and adjust the object field specifications
2. Create the new Knack objects
3. Set up the GitHub repository
4. Configure the scenes with appropriate views
5. Begin Phase 1 implementation

Ready to start building? Let me know when you've completed the Knack setup! 🚀 
