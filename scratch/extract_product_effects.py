import re

file_path = r"E:\Alanove\VS Code\Bloomina_dashboard\src\pages\admin\AdminProducts.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find all occurrences of useEffect in this file
matches = re.finditer(r'useEffect\s*\(', content)
for i, m in enumerate(matches):
    start = m.start()
    # Find matching closing bracket
    braces = 0
    pos = start
    while pos < len(content):
        if content[pos] == '(':
            braces += 1
        elif content[pos] == ')':
            braces -= 1
            if braces == 0:
                break
        pos += 1
    print(f"\n--- Effect {i+1} ---")
    print(content[start:pos+1])
