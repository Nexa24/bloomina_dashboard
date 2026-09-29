import json
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

session_file = r"C:\Users\Anoop\AppData\Roaming\Code\User\workspaceStorage\ed461427d11f05187c549358e12e6734\chatSessions\48ec108c-b20b-4a7e-bb57-c0a0a5d97eac.json"

def get_text(obj):
    if isinstance(obj, str):
        return obj
    elif isinstance(obj, dict):
        if 'value' in obj:
            return get_text(obj['value'])
        elif 'text' in obj:
            return get_text(obj['text'])
        elif 'content' in obj:
            return get_text(obj['content'])
        return ""
    elif isinstance(obj, list):
        return "\n".join([get_text(item) for item in obj if item])
    return ""

with open(session_file, 'r', encoding='utf-8') as f:
    data = json.load(f)
    
requests = data.get('requests', [])
print(f"Total Requests: {len(requests)}")

for i, req in enumerate(requests, 1):
    message = req.get('message', {})
    user_text = message.get('text', '') if isinstance(message, dict) else str(message)
    print(f"\n==================== [TURN {i}] ====================")
    print(f"USER: {user_text}")
    response = req.get('response', [])
    assistant_text = get_text(response).strip()
    lines = [l for l in assistant_text.split('\n') if l.strip()]
    summary = lines[-3:] if len(lines) >= 3 else lines
    print(f"ASSISTANT RESULT SUMMARY: {' '.join(summary)[:300]}")
