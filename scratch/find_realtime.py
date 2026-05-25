import os
import re

directory = r"E:\Alanove\VS Code\Bloomina_dashboard\src"

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'channel(' in content or 'subscribe(' in content:
                print(f"File: {os.path.relpath(path, directory)}")
                # find channel subscribe lines
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if 'channel' in line or 'subscribe' in line:
                        print(f"  Line {i+1}: {line.strip()}")
