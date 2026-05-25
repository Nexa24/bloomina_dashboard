import os
import re

directory = r"E:\Alanove\VS Code\Bloomina_dashboard\src"

def find_use_effects(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find useEffect blocks
    matches = re.finditer(r'useEffect\s*\(\s*\(\)\s*=>\s*\{(.*?)\}\s*,\s*\[(.*?)\]\s*\)', content, re.DOTALL)
    results = []
    for m in matches:
        body = m.group(1).strip()
        deps = m.group(2).strip()
        results.append((body, deps))
        
    # Also look for useEffect without dependencies or empty dependencies
    # we can use a more general pattern if needed, but let's print matches
    return results

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            path = os.path.join(root, file)
            try:
                effects = find_use_effects(path)
                if effects:
                    print(f"\n--- FILE: {os.path.relpath(path, directory)} ---")
                    for i, (body, deps) in enumerate(effects):
                        # print first 2 lines and last line of body
                        lines = body.split('\n')
                        body_summary = lines[0] if len(lines) == 1 else f"{lines[0]} ... {lines[-1]}"
                        print(f"Effect {i+1}: deps=[{deps}], body={body_summary}")
            except Exception as e:
                pass
