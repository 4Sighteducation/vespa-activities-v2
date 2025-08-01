# VESPA Staff Activities - Critical Issues Handover Document

## Date: January 2025
## Current Status: MULTIPLE CRITICAL BUGS PREVENTING PRODUCTION USE

---

## Overview
The VESPA Staff Activities management system has several critical issues that prevent it from functioning correctly. Despite multiple attempts to fix these issues, they persist and require a fresh approach.

---

## CRITICAL ISSUE 1: Activity Display Shows Raw HTML/Data
### Problem:
- Activities are displaying raw HTML and data attributes instead of clean activity names
- Example: `vision " data-activity-id="5fcd517ba74fa2001bd48dad" onclick="VESPAStaff.viewActivityDetails('5fcd517ba74fa2001bd48dad','630510d4ce86ff002189f951')">` instead of "Fix your dashboard"

### Expected Behavior:
- Clean activity names should display (e.g., "Fix your dashboard", "20 Questions", "Spaced Practice")

### Current Code Location:
- File: `VESPAactivitiesStaff1q.js`
- Method: `renderActivityCard()` around line 1800-1850

### Root Cause:
- The activity data is being pulled with HTML formatting from Knack fields
- The HTML is not being properly stripped/parsed before display

---

## CRITICAL ISSUE 2: Completed Activities Logic Broken
### Problem:
- The completed count shows irrational numbers (e.g., "17 / 1" for Alena Ramsey)
- The logic for matching completed activities is fundamentally broken

### Evidence:
- Dashboard shows "Completed: 17" for Alena Ramsey
- Detail view shows "Activities Completed: 17 / 1"
- This is mathematically impossible (can't complete 17 out of 1 activity)

### Expected Behavior:
- Format should be "Completed / Total Prescribed"
- E.g., if 1 activity prescribed and 0 completed, show "0 / 1"

### Current Code Issues:
1. `field_1380` (finishedActivities) contains activity IDs
2. `field_1683` (prescribedActivities) contains activity names
3. The system is comparing IDs to names, which will never match

### Code Location:
- File: `VESPAactivitiesStaff1q.js`
- Method: `parseStudentFromRecord()` around line 740-850
- Issue: Line ~840 stores activity IDs in `finishedActivities`
- Issue: Line ~1670 compares IDs to names

---

## CRITICAL ISSUE 3: Completed Tab Shows No Activities
### Problem:
- Even when students have completed activities (shown in main list), the "Completed" tab shows 0 items
- The system fails to properly identify which activities are completed

### Root Cause:
- Line ~1670: `const isCompleted = student.finishedActivities.includes(activity.id);`
- This compares activity IDs to activity IDs, but the data structure is mismatched

---

## CRITICAL ISSUE 4: Field Mapping Confusion
### Current Field Mappings:
```javascript
prescribedActivities: 'field_1683',  // Contains activity NAMES
finishedActivities: 'field_1380',    // Contains activity IDs
```

### The Problem:
The system is trying to match IDs with names, which will always fail.

### Potential Solutions:
1. Change the comparison to use IDs for both prescribed and finished
2. OR convert the finished IDs to names before comparison
3. OR ensure both fields store the same type of identifier

---

## CRITICAL ISSUE 5: Activity Level Not Displaying
### Problem:
- Activity levels show as "Level 1" placeholder instead of actual levels

### Field Mapping:
- `activityLevel: 'field_1295'` is defined but may not be returning data correctly

---

## IMMEDIATE FIXES NEEDED:

### 1. Fix Activity Display HTML
```javascript
// In renderActivityCard method, ensure all text is escaped/cleaned:
const cleanName = this.stripHtml(activity.name);
const cleanDescription = this.stripHtml(activity.description);
```

### 2. Fix Completed Logic
```javascript
// Need to either:
// Option A: Convert finished IDs to names for comparison
const finishedActivityNames = finishedActivityIds.map(id => {
    const activity = this.state.activities.find(a => a.id === id);
    return activity ? activity.name : null;
}).filter(name => name);

// Option B: Store prescribed activity IDs instead of names
```

### 3. Fix the Data Flow
The fundamental issue is data type mismatch:
- Prescribed: Activity Names (strings)
- Finished: Activity IDs (Knack record IDs)
- Comparison: Trying to match IDs with names

---

## RECOMMENDED APPROACH FOR NEW CONTEXT:

1. **Start Fresh**: The current codebase has too many patches. Consider starting with a clean approach.

2. **Fix Data Model First**: 
   - Ensure both prescribed and finished use the same identifier type
   - Either both use IDs or both use names

3. **Test Data Flow**:
   - Log the exact data structure at each step
   - Verify what Knack is returning in each field

4. **Simplify HTML Handling**:
   - Create a robust HTML stripping function
   - Apply it consistently to all displayed text

5. **Unit Test Each Component**:
   - Test activity parsing separately
   - Test completed/prescribed matching logic
   - Test display rendering

---

## FILES TO REVIEW:
- `VESPAactivitiesStaff1q.js` - Main implementation
- `VESPAactivitiesStaff1q.css` - Styling (seems mostly fine)
- Check Knack configuration for fields 1380 and 1683

---

## CONSOLE ERRORS TO WATCH:
- "finishedActivities is not defined" - Variable naming issues
- HTML parsing errors
- Activity ID/Name mismatch warnings

---

## CONCLUSION:
The system needs a fundamental redesign of how it handles activity identification and matching. The current approach of mixing IDs and names will never work correctly. A fresh start with consistent data types throughout the system is recommended.