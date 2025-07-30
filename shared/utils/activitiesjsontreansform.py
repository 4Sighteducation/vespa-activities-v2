import json
import re
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs

class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = []
        
    def handle_data(self, data):
        self.text.append(data)
        
    def get_data(self):
        return ''.join(self.text)

def strip_html(html):
    s = HTMLStripper()
    s.feed(html)
    return s.get_data()

def extract_media_from_html(html_content):
    media = {
        "video": None,
        "slides": None,
        "images": []
    }
    
    if not html_content:
        return media
    
    # Extract YouTube videos
    youtube_pattern = r'src="https://www\.youtube\.com/embed/([^"?]+)'
    youtube_matches = re.findall(youtube_pattern, html_content)
    if youtube_matches:
        video_id = youtube_matches[0]
        media["video"] = {
            "platform": "youtube",
            "id": video_id,
            "url": f"https://www.youtube.com/embed/{video_id}",
            "title": "WATCH 📺"
        }
    
    # Extract Google Slides
    slides_pattern = r'src="https://docs\.google\.com/presentation/d/e/([^/]+)/embed([^"]*)"'
    slides_matches = re.findall(slides_pattern, html_content)
    if slides_matches:
        slide_id = slides_matches[0][0]
        params_string = slides_matches[0][1]
        
        # Parse parameters from URL
        parameters = {
            "start": True,
            "loop": True,
            "delayms": 30000  # default
        }
        
        if params_string:
            # Extract parameters from query string
            if '?' in params_string:
                query_params = params_string.split('?')[1]
                for param in query_params.split('&'):
                    if '=' in param:
                        key, value = param.split('=')
                        if key == 'delayms':
                            parameters[key] = int(value)
                        elif key in ['start', 'loop']:
                            parameters[key] = value.lower() == 'true'
        
        media["slides"] = {
            "platform": "google",
            "id": slide_id,
            "url": f"https://docs.google.com/presentation/d/e/{slide_id}/embed",
            "parameters": parameters,
            "title": "THINK 🧠"
        }
    
    # Extract images
    img_pattern = r'<img[^>]+src="([^"]+)"[^>]*/?>'
    img_matches = re.findall(img_pattern, html_content)
    for img_url in img_matches:
        if img_url and not img_url.startswith('data:'):  # Skip data URLs
            media["images"].append({
                "url": img_url,
                "alt": "Activity image"
            })
    
    return media

def transform_activity(activity):
    # Extract media from Activity Video field
    media = extract_media_from_html(activity.get("Activity Video (field_1288)", ""))
    
    # Extract additional images from other HTML fields
    for field in ["Activity Slideshow (field_1293)", "Activity Text (field_1289)"]:
        if field in activity and activity[field]:
            additional_media = extract_media_from_html(activity[field])
            # Add any additional images found
            media["images"].extend(additional_media["images"])
    
    # Remove duplicate images
    seen_urls = set()
    unique_images = []
    for img in media["images"]:
        if img["url"] not in seen_urls:
            seen_urls.add(img["url"])
            unique_images.append(img)
    media["images"] = unique_images
    
    # Combine all HTML content and strip HTML
    background_content = ""
    html_fields = [
        "Activity Slideshow (field_1293)",
        "Activity Instructions (field_1309)",
        "Final Thoughts Section Content (field_1313)"
    ]
    
    for field in html_fields:
        if field in activity and activity[field]:
            content = strip_html(activity[field])
            if content.strip():
                background_content += content.strip() + "\n\n"
    
    # Create the new structure
    transformed = {
        "Activities Name": activity.get("Activities Name (field_1278)", ""),
        "Activity_id": activity.get("Activity_id (field_2074)", ""),
        "VESPA Category": activity.get("VESPA Category (field_1285)", ""),
        "media": media,
        "background_content": background_content.strip(),
        "Level": activity.get("Level (field_1295)", ""),
        "Order": activity.get("Order (field_1298)", 0.0),
        "Active": activity.get("Active (field_1299)", True)
    }
    
    return transformed

# Load your JSON data
with open('activities1c.json', 'r', encoding='utf-8') as f:
    activities = json.load(f)

# Transform all activities
transformed_activities = []
for activity in activities:
    transformed = transform_activity(activity)
    transformed_activities.append(transformed)

# Save the transformed data
with open('transformed_activities.json', 'w', encoding='utf-8') as f:
    json.dump(transformed_activities, f, indent=4, ensure_ascii=False)

# Print a sample to verify
print(json.dumps(transformed_activities[0], indent=4, ensure_ascii=False))