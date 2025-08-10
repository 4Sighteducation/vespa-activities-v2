# VESPA Staff Management - Field Mapping Comparison

## Configuration Comparison: Original (2h) vs Current (3f)

### Object IDs

#### Original (VESPAactivitiesStaff2h.js)
```javascript
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
}
```

#### Current (VESPAactivitiesStaff3f.js) - MISSING OBJECTS ⚠️
```javascript
objects: {
    student: 'object_6',
    activities: 'object_44',
    questions: 'object_45',  // Added (not in original)
    answers: 'object_46',
    vespaScores: 'object_10',  // Named differently
    progress: 'object_126'      // Named differently
}
```

**MISSING IN CURRENT:**
- `object_3` (accounts)
- `object_5` (staffAdmin)
- `object_7` (tutor)
- `object_18` (headOfYear)
- `object_78` (subjectTeacher)
- `object_2` (customer)
- `object_127` (studentAchievements)
- `object_128` (activityFeedback)

### Field Mappings

#### User/Account Fields (Object_3)
**Original:**
- `field_73` - userRoles (staff role array - "Staff Admin", "Tutor", etc.)
- `field_70` - userAccountID (email field)

**Current:** ❌ MISSING

#### Staff Role Email Fields
**Original:**
- `field_86` - staffAdminEmail
- `field_96` - tutorEmail
- `field_417` - headOfYearEmail
- `field_1879` - subjectTeacherEmail

**Current:** ❌ MISSING

#### Student Connection Fields (many-to-many relationships)
**Original:**
- `field_1682` - studentTutors
- `field_547` - studentHeadsOfYear
- `field_2177` - studentSubjectTeachers
- `field_190` - studentStaffAdmins

**Current:** ✅ Present but named differently
- `field_1682` - tutors
- `field_547` - headsOfYear
- `field_2177` - subjectTeachers
- `field_190` - staffAdmins

#### Student Fields (Object_6)
**Original:**
- `field_90` - studentName
- `field_91` - studentEmail
- `field_1683` - prescribedActivities (curriculum)
- `field_1380` - finishedActivities (CSV of completed)
- `field_182` - studentVESPAConnection

**Current:** ✅ Present (mostly)
- `field_90` - studentName
- `field_91` - studentEmail
- `field_1683` - curriculum (prescribedActivities)
- `field_1380` - completed (finishedActivities)
- `field_182` - vespaConnection

#### VESPA Scores (Object_10)
**Original:**
- `field_147` - visionScore
- `field_148` - effortScore
- `field_149` - systemsScore
- `field_150` - practiceScore
- `field_151` - attitudeScore

**Current:** ✅ Present
- `field_147` - vision
- `field_148` - effort
- `field_149` - systems
- `field_150` - practice
- `field_151` - attitude

#### Activity Fields (Object_44)
**Original:**
- `field_1278` - activityName
- `field_1285` - activityVESPACategory
- `field_1295` - activityLevel (fallback)
- `field_3568` - activityLevelAlt (preferred)
- `field_1287` - activityScoreMoreThan (threshold)
- `field_1294` - activityScoreLessEqual (threshold)
- `field_3584` - activityCurriculum (CSV tags)

**Current:** ⚠️ Partially present
- `field_1278` - activityName
- `field_1285` - activityCategory
- `field_3568` - activityLevel

**MISSING IN CURRENT:**
- `field_1295` - fallback level
- `field_1287` - score threshold (more than)
- `field_1294` - score threshold (less/equal)
- `field_3584` - curriculum tags

#### Activity Answers Fields (Object_46)
**Original:**
- `field_1875` - answerStudentName
- `field_1300` - answerActivityJSON
- `field_2334` - answerResponsesPerActivity
- `field_1870` - answerCompletionDate
- `field_2331` - answerYearGroup
- `field_2332` - answerGroup
- `field_2333` - answerFaculty
- `field_1301` - answerStudentConnection
- `field_1302` - answerActivityConnection
- `field_1734` - answerStaffFeedback
- `field_1871` - answerCustomerConnection
- `field_1872` - answerTutorConnection
- `field_1873` - answerStaffAdminConnection

**Current:** ❌ MISSING ALL

#### Activity Progress Fields (Object_126)
**Original:**
- `field_3535` - progressId
- `field_3534` - progressName
- `field_3536` - progressStudent
- `field_3537` - progressActivity
- `field_3538` - progressCycle
- `field_3539` - progressDateAssigned
- `field_3540` - progressDateStarted
- `field_3541` - progressDateCompleted
- `field_3542` - progressTimeMinutes
- `field_3543` - progressStatus
- `field_3544` - progressVerified
- `field_3545` - progressPoints
- `field_3546` - progressSelectedVia (origin)
- `field_3547` - progressStaffNotes
- `field_3548` - progressReflection
- `field_3549` - progressWordCount

**Current:** ⚠️ Minimal subset
- `field_3536` - progressStudent
- `field_3537` - progressActivity
- `field_3543` - progressStatus
- `field_3546` - progressOrigin
- `field_3541` - progressDateCompleted

**MISSING IN CURRENT:**
- All other progress fields

#### Activity Feedback Fields (Object_128)
**Original:**
- `field_3561` - feedbackName
- `field_3562` - feedbackId
- `field_3563` - feedbackActivityProgress
- `field_3564` - feedbackStaffMember
- `field_3565` - feedbackText
- `field_3566` - feedbackDate
- `field_3567` - feedbackType

**Current:** ❌ MISSING ALL

### View IDs

#### Original
```javascript
views: {
    container: 'view_3179',
    activities: 'view_3178',
    answers: 'view_3177'
}
```

#### Current - Extended but consistent
```javascript
views: {
    container: 'view_3179',    ✅
    activities: 'view_3178',   ✅
    answers: 'view_3177',      ✅
    staffAdmin: 'view_3192',   // Added
    tutor: 'view_3193',        // Added
    headOfYear: 'view_3194',   // Added
    subjectTeacher: 'view_3195' // Added
}
```

### Hidden Views (CSS)
**Original:** Hides views 3177, 3178, 3192, 3193, 3194, 3195
**Current:** Hides views 3177, 3178, 3192, 3193, 3194, 3195 ✅

## Critical Issues Found

### 1. knackAPI Method Error
The error "Assignment to constant variable" at line 1345 suggests the `url` parameter is declared as `const` but being modified.

**Fix needed:**
```javascript
// Change from:
const url = `https://api.knack.com/v1/objects/${endpoint}`;
// Later: url += params  // ERROR!

// To:
let url = `https://api.knack.com/v1/objects/${endpoint}`;
```

### 2. Missing Role Detection Fields
Current code is missing `field_70` (email) and proper role object references.

### 3. Activities Fallback JSON
The fallback URL is incorrect:
- Current: `https://cdn.jsdelivr.net/gh/toneillcodes/my-projects@main/activities1e.json`
- Should check handover document for correct URL

### 4. Missing API Authentication
The API calls may be failing because they're using REST API instead of using Knack's built-in methods when available.

## Recommended Fixes

1. **Add missing objects configuration**
2. **Add missing field mappings**
3. **Fix knackAPI method const/let issue**
4. **Use correct activities JSON fallback URL**
5. **Add proper role detection using field_70 and profile_keys**
6. **Include all progress and feedback fields**
7. **Add activity threshold fields for filtering**
