# VESPA Staff Activities Management

## Overview
Professional, clean interface for staff to manage student activities. Built for scene 1256.

## Features Implemented

### 1. Clean Professional UI
- **Simple table layout** - No fancy animations or gradients
- **Professional color scheme** - Using VESPA blues (#079baa, #7bd8d0)
- **Clear data presentation** - Focus on information density
- **Responsive design** - Works on tablets and desktop

### 2. Core Functionality
- **Role-based filtering** - Dynamic student lists based on staff role
- **Student progress tracking** - Visual progress bars and statistics
- **Search and filtering** - Find students quickly
- **Sortable columns** - Sort by name, progress, prescribed, completed
- **Export functionality** - Download CSV reports

### 3. Activity Management
- **Assign activities** - Modal interface for activity selection
- **Bulk operations** - Assign to multiple students
- **Category filtering** - Filter activities by VESPA category
- **Activity search** - Find specific activities quickly

## File Structure
```
staff/
├── VESPAactivitiesStaff.js    # Main JavaScript (884 lines)
├── VESPAactivitiesStaff.css   # Styling (615 lines)
├── StaffDynamicFilteringApproach.md  # Technical documentation
└── README.md                   # This file
```

## Key Components

### JavaScript Structure
- **VESPAStaffManager Class** - Main controller
- **State management** - Centralized state object
- **Role detection** - Automatic role detection from Knack session
- **Data loading** - Students and activities
- **Rendering system** - Component-based rendering
- **Event handling** - Centralized event management

### CSS Classes
- `.vespa-staff-container` - Main container
- `.staff-header` - Header with title and actions
- `.filter-bar` - Search and filter controls
- `.student-table` - Main data table
- `.modal-overlay` - Modal for activity assignment

## Configuration

### Objects (from Knack)
```javascript
objects: {
    staffAdmin: 'object_5',
    tutor: 'object_7',
    headOfYear: 'object_18',
    subjectTeacher: 'object_78',
    student: 'object_6',
    activities: 'object_44'
}
```

### Key Fields
```javascript
fields: {
    prescribedActivities: 'field_1683',
    completedActivities: 'field_1380',
    studentName: 'field_12',
    studentEmail: 'field_11',
    // VESPA scores
    vision: 'field_147',
    effort: 'field_148',
    systems: 'field_149',
    practice: 'field_150',
    attitude: 'field_151'
}
```

## Usage

### Integration
1. Upload CSS to CDN/GitHub
2. Upload JS to CDN/GitHub
3. Update KnackAppLoader to include files for scene 1256
4. Create views in Knack scene 1256:
   - Rich text view for UI injection (view_1574)
   - Hidden student data views
   - Hidden activity data views

### Testing
The system includes test data generation when no real data is found:
- 25 test students with random progress
- 50 test activities across all categories

### Production Setup
1. Update CDN URLs in JavaScript (line 419)
2. Configure actual view IDs in CONFIG object
3. Test role detection with real staff accounts
4. Verify API endpoints for data loading

## Features Not Yet Implemented

1. **Real API Integration** - Currently uses test data
2. **Student Detail View** - Click "View" to see full student details
3. **Activity Assignment API** - Actually save assignments to Knack
4. **Real-time Updates** - Auto-refresh when data changes
5. **Advanced Filters** - Filter by year group, class, etc.

## Next Steps

1. **Scene Setup in Knack**
   - Create scene 1256
   - Add required views
   - Test with real data

2. **API Integration**
   - Implement Knack API calls
   - Handle authentication
   - Error handling

3. **Enhanced Features**
   - Student detail modal
   - Bulk activity removal
   - Activity recommendations
   - Progress history

## Maintenance

- Check browser console for debug logs
- Use `CONFIG.debug = false` to disable logging
- Monitor performance with many students (100+)
- Test on various devices and browsers

## Support

For issues or enhancements:
1. Check browser console for errors
2. Verify view IDs match configuration
3. Ensure user has appropriate role permissions
4. Test with different user roles