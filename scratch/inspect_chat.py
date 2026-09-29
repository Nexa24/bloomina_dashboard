import sqlite3
import json

db_path = r"C:\Users\Anoop\AppData\Roaming\Code\User\workspaceStorage\ed461427d11f05187c549358e12e6734\state.vscdb"
conn = sqlite3.connect(db_path)
c = conn.cursor()

keys = ["chat.ChatSessionStore.index", "memento/interactive-session", "memento/interactive-session-view-copilot"]

for k in keys:
    c.execute("SELECT value FROM ItemTable WHERE key = ?", (k,))
    row = c.fetchone()
    if row:
        val = row[0]
        print(f"=== KEY: {k} ===")
        try:
            parsed = json.loads(val)
            print(json.dumps(parsed, indent=2)[:2000])
        except Exception as e:
            print(val[:2000])
        print("="*60)

conn.close()
