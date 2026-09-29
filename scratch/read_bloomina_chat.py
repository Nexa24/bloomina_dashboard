import json

session_file = r"C:\Users\Anoop\AppData\Roaming\Code\User\workspaceStorage\ed461427d11f05187c549358e12e6734\chatSessions\48ec108c-b20b-4a7e-bb57-c0a0a5d97eac.json"

try:
    with open(session_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Session Title: {data.get('title')}")
    requests = data.get('requests', [])
    print(f"Total Requests: {len(requests)}")
    
    for i, req in enumerate(requests, 1):
        message = req.get('message', {})
        text = message.get('text', '') if isinstance(message, dict) else str(message)
        print(f"\n--- Request {i} ---")
        print("User:", text)
        response = req.get('response', [])
        response_texts = []
        for r in response:
            if isinstance(r, dict) and 'value' in r:
                response_texts.append(r['value'][:300])
            elif isinstance(r, str):
                response_texts.append(r[:300])
        print("Assistant summary / sample:", ("\n".join(response_texts))[:500])
except Exception as e:
    print("Error:", e)
