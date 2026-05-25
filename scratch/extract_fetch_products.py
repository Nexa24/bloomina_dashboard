file_path = r"E:\Alanove\VS Code\Bloomina_dashboard\src\pages\admin\AdminProducts.jsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# find def of fetchProducts
import re
match = re.search(r'const\s+fetchProducts\s*=\s*async\s*\((.*?)\)\s*=>\s*\{', content)
if match:
    start = match.start()
    braces = 0
    pos = start
    while pos < len(content):
        if content[pos] == '{':
            braces += 1
        elif content[pos] == '}':
            braces -= 1
            if braces == 0:
                break
        pos += 1
    print(content[start:pos+1])
else:
    print("Not found")
