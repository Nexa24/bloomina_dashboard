import os
import re

directory = r"E:\Alanove\VS Code\Bloomina_dashboard\src\pages\admin"

for file in os.listdir(directory):
    if file.endswith('.jsx'):
        path = os.path.join(directory, file)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Search for instances where setLoading(true) is used
        matches = re.finditer(r'setLoading\(\s*true\s*\)', content)
        has_set_loading = False
        for m in matches:
            has_set_loading = True
            
        if has_set_loading:
            # Let's inspect the async functions in this file and count finally blocks
            set_loading_trues = len(re.findall(r'setLoading\(\s*true\s*\)', content))
            set_loading_falses = len(re.findall(r'setLoading\(\s*false\s*\)', content))
            print(f"File: {file} - setLoading(true) count: {set_loading_trues}, setLoading(false) count: {set_loading_falses}")
