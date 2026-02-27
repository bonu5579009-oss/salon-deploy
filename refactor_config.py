import os

root_dir = r"C:\Users\User\.gemini\antigravity\scratch\barber_queue_system\frontend\src\app"
config_import = 'import { API_URL, WS_URL } from "@/app/config";\n'

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".tsx") and file != "config.ts":
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            modified = False
            
            # 1. Remove local definitions of API_URL
            if 'const API_URL = `http://localhost:8000`;' in content:
                content = content.replace('const API_URL = `http://localhost:8000`;', '')
                modified = True
            elif 'const API_URL = "http://localhost:8000";' in content:
                content = content.replace('const API_URL = "http://localhost:8000";', '')
                modified = True
            
            # 2. Replace hardcoded URLs
            if 'http://localhost:8000' in content:
                content = content.replace('http://localhost:8000', '${API_URL}')
                # If it's now `${API_URL}`, ensure it's in a template literal or just API_URL
                # This is tricky without a proper parser, but let's try common patterns.
                content = content.replace('`${API_URL}`', 'API_URL')
                content = content.replace('"${API_URL}"', 'API_URL')
                # Re-add backticks if it was part of a longer path
                # e.g. `${API_URL}/admin/stats` remains correct.
                modified = True
            
            if 'ws://localhost:8000' in content:
                content = content.replace('ws://localhost:8000', '${WS_URL}')
                content = content.replace('`${WS_URL}`', 'WS_URL')
                content = content.replace('"${WS_URL}"', 'WS_URL')
                modified = True

            if modified:
                # Add import at the top (after "use client";)
                if '"use client";' in content:
                    content = content.replace('"use client";', '"use client";\n' + config_import, 1)
                else:
                    content = config_import + content
                
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Refactored {file_path}")

print("Refactoring complete.")
