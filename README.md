# VESPA Activities V2

A complete redesign of the VESPA Activities system with enhanced student experience and comprehensive staff management capabilities.

## 🚀 Features

### Student Experience (Scene 1258)
- **Problem-based activity selection** - Students can find activities based on their specific challenges
- **Smart activity recommendations** - Avoids showing completed activities
- **Points & achievements system** - Motivates engagement with quality bonuses
- **Beautiful, mobile-first UI** - Playful design with emojis and animations
- **Progress tracking** - Visual progress bars and statistics

### Staff Management (Scene 1256)
- **Dynamic role-based access** - Automatically detects staff roles and shows relevant students
- **Multi-role support** - Seamless switching for users with multiple roles
- **Group filtering** - Tutors can filter by their specific groups
- **Bulk operations** - Assign activities to multiple students
- **Progress monitoring** - Real-time view of student engagement
- **Export capabilities** - Generate reports for analysis

## 📁 Repository Structure

```
vespa-activities-v2/
├── student/                      # Student-facing application
│   ├── VESPAactivitiesStudent.js # Main student app logic
│   ├── VESPAactivitiesStudent.css # Student UI styles
│   └── assets/                   # Images, icons, etc.
├── staff/                        # Staff management application
│   ├── VESPAactivitiesStaff.js  # Main staff app logic
│   ├── VESPAactivitiesStaff.css # Staff UI styles
│   └── StaffDynamicFilteringApproach.md # Technical documentation
├── shared/                       # Shared resources
│   ├── VESPAactivitiesDataLayer.js # Common data handling
│   ├── vespa-problem-activity-mappings.json # Problem mappings
│   └── utils/                    # Utility functions
└── README.md                     # This file
```

## 🛠️ Setup Instructions

### 1. Initialize Git Repository
```bash
cd "C:\Users\tonyd\OneDrive - 4Sight Education Ltd\Apps\vespa-activities-v2"
git init
git add .
git commit -m "Initial commit: VESPA Activities V2"
```

### 2. Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Create new repository named `vespa-activities-v2`
3. Don't initialize with README (we already have one)

### 3. Connect Local to GitHub
```bash
git remote add origin https://github.com/[YOUR-USERNAME]/vespa-activities-v2.git
git branch -M main
git push -u origin main
```

### 4. Update KnackAppLoader
Add these configurations to your `KnackAppLoader(copy).js`:

```javascript
// Student Activities V2
{
    appName: 'VESPAActivitiesStudentV2',
    scenes: ['scene_1258'],
    views: ['view_3168'],
    scriptUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-USERNAME]/vespa-activities-v2@main/student/VESPAactivitiesStudent.js',
    cssUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-USERNAME]/vespa-activities-v2@main/student/VESPAactivitiesStudent.css',
    configBuilder: (baseConfig) => ({
        ...baseConfig,
        problemMappingsUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-USERNAME]/vespa-activities-v2@main/shared/vespa-problem-activity-mappings.json',
        views: {
            vespaResults: 'view_3164',
            studentRecord: 'view_3165',
            allActivities: 'view_3166',
            activityProgress: 'view_3167',
            richText: 'view_3168'
        }
    })
},
// Staff Management V2
{
    appName: 'VESPAActivitiesStaffV2',
    scenes: ['scene_1256'],
    views: ['view_3179'],
    scriptUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-USERNAME]/vespa-activities-v2@main/staff/VESPAactivitiesStaff.js',
    cssUrl: 'https://cdn.jsdelivr.net/gh/[YOUR-USERNAME]/vespa-activities-v2@main/staff/VESPAactivitiesStaff.css'
}
```

## 🎨 Design System

### Colors
- Primary Blues: `#079baa`, `#7bd8d0`, `#00e5db`
- Secondary: `#5899a8`, `#2f8dcb`
- Dark Blues: `#23356f`, `#2a3c7a`

### VESPA Categories
- Vision: `#ff8f00` 👁️
- Effort: `#86b4f0` 💪
- Systems: `#72cb44` ⚙️
- Practice: `#7f31a4` 🎯
- Attitude: `#f032e6` 🧠

## 📊 Points System

- **Basic Completion**: 10 points
- **Quality Bonus**:
  - < 50 words: +2 points
  - 50-150 words: +5 points
  - 150+ words: +10 points
- **Streak Bonus**: +5 points/day
- **First Activity**: +3 points
- **Complete Set**: +25 points

## 🗄️ Knack Objects

### Object_126: Activity Progress
Tracks individual activity completion and engagement

### Object_127: Student Achievements
Stores points milestones and earned badges

### Object_128: Activity Feedback
Staff feedback on student activities

## 🔐 Security & Permissions

- Students can only view/complete their own activities
- Staff access based on role connections
- API calls filtered server-side by Knack
- No sensitive data exposed client-side

## 🚧 Development Status

- [x] Object creation
- [x] Scene 1258 setup
- [x] Problem mappings JSON
- [x] Action plan documentation
- [ ] Git repository connection
- [ ] Student app implementation
- [ ] Staff app implementation
- [ ] Testing & deployment

## 📝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

## 📞 Support

For questions or issues, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 28, 2025 