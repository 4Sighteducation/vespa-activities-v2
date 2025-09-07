# VESPA Activities Direct URL Documentation

## Overview
Each activity in `activity_json_final1a.json` now includes direct URLs that can be used in reports, emails, or other external systems to link directly to specific activities.

## URL Structure

### Base URL
```
https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168
```

## URL Parameters

### Single Activity Actions

#### View Activity Details
```
?activity=ACTIVITY_ID&action=view
```
Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&action=view`

#### Start Activity Immediately
```
?activity=ACTIVITY_ID&action=start
```
Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&action=start`

#### Add to Dashboard
```
?activity=ACTIVITY_ID&action=add
```
Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&action=add`

#### Show Activity Info
```
?activity=ACTIVITY_ID&action=info
```
Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&action=info`

### Short URL Format (for QR codes)
```
?a=ACTIVITY_ID
```
Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?a=5fcb62a903d876001c5e1fcf`

### Bulk Operations

#### Add Multiple Activities
```
?activities=ID1,ID2,ID3&action=add
```
Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activities=5fcb62a903d876001c5e1fcf,5fcccf1303d876001c5f371e&action=add`

### Category Browsing

#### Browse by Category
```
?category=CATEGORY_NAME&action=browse
```
Categories: `Vision`, `Effort`, `Systems`, `Practice`, `Attitude`

Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?category=Vision&action=browse`

### Navigation

#### Switch to Specific Tab
```
?tab=TAB_NAME
```
Tabs: `dashboard`, `all`, `progress`, `achievements`

Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?tab=dashboard`

#### Show Welcome Journey
```
?welcome=true
```
Example: `https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?welcome=true`

## JSON Structure

Each activity in the JSON now includes a `urls` object with pre-generated URLs:

```json
{
  "id": "5fcb62a903d876001c5e1fcf",
  "name": "20 Questions",
  "urls": {
    "view": "https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&action=view",
    "start": "https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&action=start",
    "add": "https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&action=add",
    "info": "https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&action=info",
    "view_with_name": "https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?activity=5fcb62a903d876001c5e1fcf&name=20%20Questions&action=view",
    "direct_link": "https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?a=5fcb62a903d876001c5e1fcf"
  },
  "short_url": "https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168?a=5fcb62a903d876001c5e1fcf"
}
```

## Usage in Reports

### Example: Activity Report with Links
```javascript
// Generate activity report with clickable links
activities.forEach(activity => {
    console.log(`
        Activity: ${activity.name}
        View: ${activity.urls.view}
        Start: ${activity.urls.start}
        Add to Dashboard: ${activity.urls.add}
    `);
});
```

### Example: QR Code Generation
Use the `short_url` field for generating QR codes:
```javascript
const qrCodeUrl = activity.short_url;
// Use with any QR code library
```

### Example: Email Template
```html
<p>Your prescribed activities for this week:</p>
<ul>
    <li>
        20 Questions - 
        <a href="${activity.urls.view}">View</a> | 
        <a href="${activity.urls.start}">Start Now</a>
    </li>
</ul>
```

## Notes

1. **Authentication**: Users must be logged into the VESPA system for links to work
2. **Activity Access**: Users can only access activities that are available to them based on their VESPA scores
3. **URL Encoding**: Activity names in URLs are automatically URL-encoded
4. **Fallback**: If an activity is not found, a toast message will appear
5. **Base URL**: Update the base URL in the JSON if your domain changes

## Updating URLs

If you need to regenerate URLs with a different base URL:

1. Update the `BASE_URL` variable in the Python script
2. Run the script to regenerate the JSON with new URLs
3. Replace the existing JSON file

```python
# Example: For vespaacademy.knack.com
BASE_URL = "https://vespaacademy.knack.com/vespa-academy#scene_1258/view_3168"

# Example: For a different domain
BASE_URL = "https://your-domain.knack.com/your-app-name#scene_1258/view_3168"
```
