import os

root_dir = r"C:\Users\User\.gemini\antigravity\scratch\barber_queue_system\frontend\src"

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".tsx", ".ts", ".js")):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            if "127.0.0.1:8000" in content:
                print(f"Updating {file_path}")
                new_content = content.replace("127.0.0.1:8000", "localhost:8000")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)

print("Done.")
