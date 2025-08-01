# VESPA Staff Activities - Self-Selected Activities Update

## Date: January 2025
## Status: System Updated to Support Self-Selected Activities

---

## Summary of Changes

The VESPA system now fully supports students self-selecting activities in addition to prescribed ones. This update makes it clearer to staff that students are encouraged to explore beyond their prescribed activities.

---

## 1. Dashboard Updates

### Dual Progress Bars
Each student now shows TWO progress bars:
- **Blue (Prescribed)**: Progress on staff-assigned activities only
- **Green (General)**: Progress on ALL activities (including self-selected)

### Updated Counts Display
The completed column now shows:
- `Prescribed / Total` (e.g., "2 / 17")
- With a small label "prescribed / total" for clarity

### Progress Legend
Added a helpful legend at the top explaining:
- Blue = Prescribed Activities (Staff Assigned)
- Green = All Activities (Including Self-Selected)
- Info note: "Students can now self-select activities in addition to prescribed ones"

---

## 2. Student Details Modal Updates

### Overview Section
- **Prescribed Progress**: Shows X/Y with "Staff assigned" label
- **Total Activities**: Shows total count with "Including self-selected" label

### Three Activity Tabs
1. **Prescribed Incomplete**: Activities assigned but not done
2. **Prescribed Completed**: Activities both assigned AND completed  
3. **All Completed**: ALL completed activities
   - Shows "✓ Prescribed" badge on prescribed activities
   - Helps staff see what students are exploring on their own

---

## 3. Activity Preview Updates

### Correct Field Mappings
Now using the actual fields from Object_44:
- **field_1293**: Background Information (rich text)
- **field_1289**: Additional Resources (rich text with potential PDF links)

### New Features
- **Dynamic Time Calculation**: 15-45 minutes based on:
  - Number of questions (2 min per question)
  - Content length (3 min per 1000 characters)
- **PDF Download Button**: Extracts PDF links from field_1289 and displays as a button
- **Image Size Control**: All images from rich text fields are:
  - Max width: 100%
  - Max height: 400px
  - Centered with nice styling

### Enhanced Display
- Separate sections for Background Info and Additional Resources
- Clean formatting with proper headings
- PDF download button styled to match the interface

---

## 4. Visual Improvements

### Colors
- **Prescribed**: Uses primary turquoise color (#79bdcf)
- **Self-Selected**: Uses success green (#28a745)
- Consistent color coding throughout the interface

### Image Handling
Images from rich text fields now:
- Respect container boundaries
- Have consistent max heights
- Include subtle shadows and rounded corners
- Are centered for better presentation

---

## 5. How It Works

### Student Perspective
- Students can complete ANY activity they want
- Their total progress includes everything they do
- They're encouraged to explore beyond prescribed activities

### Staff Perspective  
- Can see prescribed progress separately
- Can see total engagement (all activities)
- Can identify which non-prescribed activities students are choosing
- Better insight into student interests and self-directed learning

---

## Benefits

1. **Encourages Self-Direction**: Students feel empowered to explore
2. **Maintains Accountability**: Prescribed activities still tracked separately
3. **Shows Full Picture**: Staff see complete student engagement
4. **Identifies Interests**: Staff can see what students choose on their own
5. **Flexible Learning**: Supports both structured and exploratory learning

---

## Next Steps

1. Monitor how students use self-selection
2. Consider recommending activities based on what students self-select
3. Use the "All Completed" tab to understand student interests
4. Adjust prescribed activities based on self-selection patterns

---

## Technical Notes

- Progress bars use 40 activities as baseline for "general" progress
- All counting logic properly distinguishes prescribed vs total
- Rich text fields are preserved with HTML for formatting
- PDF extraction uses regex to find links in HTML content
- Time calculation is dynamic and reasonable (15-45 min range)