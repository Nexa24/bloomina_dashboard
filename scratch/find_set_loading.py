file_path = r"E:\Alanove\VS Code\Bloomina_dashboard\src\contexts\AdminAuthContext.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = re.finditer(r'setLoading\(.*?\)', content)
for m in matches:
    print(m.group(0), "at index", m.start())
