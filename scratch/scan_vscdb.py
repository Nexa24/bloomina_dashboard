import sqlite3
import glob
import json
import os

db_paths = glob.glob(r'C:\Users\Anoop\AppData\Roaming\Code\User\workspaceStorage\*\state.vscdb')
print(f"Total state.vscdb found: {len(db_paths)}")

matches = []
for db in db_paths:
    ws_dir = os.path.dirname(db)
    ws_json = os.path.join(ws_dir, 'workspace.json')
    ws_info = ""
    if os.path.exists(ws_json):
        try:
            with open(ws_json, 'r', encoding='utf-8') as f:
                ws_info = f.read()
        except:
            pass
    try:
        conn = sqlite3.connect(db)
        c = conn.cursor()
        c.execute("SELECT key, value FROM ItemTable")
        rows = c.fetchall()
        for k, v in rows:
            v_str = str(v)
            if 'bloomina' in v_str.lower() or 'bloomina' in ws_info.lower():
                if any(t in v_str.lower() for t in ['chat', 'session', 'prompt', 'message', 'conversation', 'turn']):
                    print(f"Match in {db} (ws: {ws_info.strip()}) | Key: {k}")
                    print(f"Length: {len(v_str)}")
                    # print sample
                    sample = v_str[:250].replace('\n', ' ')
                    print(f"Sample: {sample}")
                    print("-" * 50)
        conn.close()
    except Exception as e:
        pass
