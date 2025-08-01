# VESPA Staff Activities - Field Mappings Documentation

## Date: January 2025
## Purpose: Document all Knack field mappings for VESPA Staff Activities

---

## Object_6 (Students) Fields

### Core Student Info
- `field_90`: Student Name
- `field_91`: Student Email
- `field_182`: VESPA Connection (to Object_10)

### Activity Related Fields
- **`field_1683`**: Prescribed Activities 
  - Type: Connected field to Object_44
  - Contains: Activity names (as HTML with connection spans)
  - Format: `<span class="activity-id">Activity Name</span>`

- **`field_1380`**: Finished Activities
  - Type: Short text field
  - Contains: Comma-separated list of Object_44 record IDs
  - Format: `id1,id2,id3` (e.g., `5ffe01865c1cca001b161e42,5ff3841848789d001c52ed81`)

---

## Object_44 (Activities) Fields

### Currently Used
- `field_1278`: Activity Name
- `field_1285`: VESPA Category (Vision/Effort/Systems/Practice/Attitude)
- `field_1295`: Activity Level (1, 2, or 3)

### Fields We're Trying to Use (Need Verification)
- `field_1281`: Background/Context Info (might not exist)
- `field_1282`: Learning Objective (might not exist)
- `field_1283`: Additional Content/Slideshow (might not exist)
- `field_1284`: Estimated Time in Minutes (might not exist)

**ACTION NEEDED**: Check if these fields exist in Object_44. If not, we need to:
1. Find the correct field numbers for background info
2. Or remove these features from the UI

---

## Object_45 (Activity Questions) Fields
- `field_1137`: Question Text
- `field_1138`: Question Type
- `field_1139`: Multiple Choice Options
- `field_1140`: Question Order

---

## Object_46 (Activity Answers) Fields
- `field_1875`: Student Name
- `field_1300`: Activity JSON (student responses)
- `field_1301`: Student Connection
- `field_1302`: Activity Connection
- `field_1734`: Staff Feedback
- `field_1870`: Completion Date

---

## Object_10 (VESPA Scores) Fields
- `field_147`: Vision Score
- `field_148`: Effort Score
- `field_149`: Systems Score
- `field_150`: Practice Score
- `field_151`: Attitude Score

---

## Key Issues to Resolve

### 1. Completed Activities Logic
The system correctly shows only prescribed activities that are completed. For example:
- If a student has 17 completed activities but only 1 is prescribed, it shows "0/1" or "1/1"
- This is the intended behavior - we track progress on prescribed activities only

### 2. Background Info Fields
The fields we're trying to use for activity preview (field_1281-1284) may not exist in Object_44. We need to:
- Verify what fields actually exist
- Update the code to use the correct field numbers
- Or remove these features if the data isn't available

### 3. Data Format Mismatch
- Prescribed activities come as connected field with HTML
- Completed activities come as comma-separated IDs
- The system handles this correctly by parsing both formats

---

## Debugging Tips

1. Check console logs for:
   - "WARNING: Could not find activity for prescribed name"
   - "Match found: [activity name]"
   - Student-specific debug output for Alena Ramsey and Ian Woodard

2. Verify in Knack:
   - That prescribed activities in field_1683 actually exist in Object_44
   - That activity IDs in field_1380 are valid Object_44 record IDs
   - That field numbers for background info are correct