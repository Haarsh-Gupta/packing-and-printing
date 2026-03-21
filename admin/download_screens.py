import json
import urllib.request
import os
import re

file_path = "C:/Users/harsh/.gemini/antigravity/brain/463e0f13-74f5-41a6-90a1-2866361c8161/.system_generated/steps/15/output.txt"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

try:
    data = json.loads(content)
except json.JSONDecodeError:
    # Handle if there's text before/after
    match = re.search(r'(\{.*\})', content, flags=re.DOTALL)
    if match:
        data = json.loads(match.group(1))
    else:
        print("Could not parse JSON")
        exit(1)

output_dir = "e:/Book_bind/admin/stitch_screens"
os.makedirs(output_dir, exist_ok=True)

for screen in data.get("screens", []):
    title = screen.get("title", "")
    if "(Dark)" in title:
        safe_name = title.replace(" (Dark)", "").replace(" ", "_").lower()
        safe_name = re.sub(r'[^a-z0-9_]', '', safe_name)
        url = screen.get("htmlCode", {}).get("downloadUrl", "")
        if url:
            print(f"Downloading {safe_name}.html...")
            try:
                urllib.request.urlretrieve(url, os.path.join(output_dir, f"{safe_name}.html"))
                print(f"Downloaded {safe_name}.html")
            except Exception as e:
                print(f"Failed to download {safe_name}: {e}")
