file_path = r"E:\Alanove\VS Code\Bloomina_dashboard\src\pages\admin\AdminOrders.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find any state hooks for loading
import re
loading_states = re.findall(r'const\s+\[\s*loading\s*,\s*setLoading\s*\]\s*=\s*useState\(.*?\)', content)
print("Loading state hook:", loading_states)

# Search for any setLoading calls
set_loadings = re.findall(r'setLoading\(.*?\)', content)
print("setLoading calls:", set_loadings)
