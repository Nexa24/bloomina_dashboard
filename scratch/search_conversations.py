import os
import json
import re
import sys
import argparse
from datetime import datetime

BRAIN_DIR = r"C:\Users\Anoop\.gemini\antigravity-ide\brain"

def safe_print(text=""):
    try:
        print(text)
    except UnicodeEncodeError:
        encoding = sys.stdout.encoding or 'utf-8'
        print(text.encode(encoding, errors='replace').decode(encoding))

def get_clean_request(content):
    if not content:
        return ""
    # Extract content between <USER_REQUEST> and </USER_REQUEST>
    match = re.search(r"<USER_REQUEST>(.*?)</USER_REQUEST>", content, re.DOTALL)
    if match:
        req = match.group(1).strip()
        # Take first line or first 120 characters for list view
        lines = [l for l in req.split('\n') if l.strip()]
        return " | ".join(lines)[:120]
    return content.strip().split('\n')[0][:120]

def list_conversations():
    if not os.path.exists(BRAIN_DIR):
        safe_print(f"Error: Brain directory not found at {BRAIN_DIR}")
        return

    conversations = []
    
    # Iterate through all subdirectories in brain directory
    for item in os.listdir(BRAIN_DIR):
        item_path = os.path.join(BRAIN_DIR, item)
        if not os.path.isdir(item_path):
            continue
            
        # Verify if it's a UUID/conversation folder
        if not re.match(r'^[a-f0-9\-]{36}$', item):
            continue
            
        log_path = os.path.join(item_path, ".system_generated", "logs", "transcript.jsonl")
        if not os.path.exists(log_path):
            log_path = os.path.join(item_path, ".system_generated", "logs", "overview.txt")
        if not os.path.exists(log_path):
            continue
            
        first_user_input = None
        user_input_count = 0
        last_timestamp = None
        first_timestamp = None
        
        try:
            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    try:
                        data = json.loads(line)
                        timestamp = data.get("created_at") or data.get("timestamp")
                        if timestamp:
                            last_timestamp = timestamp
                            if not first_timestamp:
                                first_timestamp = timestamp
                        
                        if data.get("type") == "USER_INPUT":
                            user_input_count += 1
                            if not first_user_input:
                                first_user_input = get_clean_request(data.get("content", ""))
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            safe_print(f"Error reading {log_path}: {e}")
            continue
            
        if not first_user_input:
            first_user_input = "(No user request found)"
            
        # Try to parse timestamps
        first_date = None
        if first_timestamp:
            try:
                first_date = datetime.fromisoformat(first_timestamp.replace('Z', '+00:00'))
            except:
                pass
                
        conversations.append({
            "id": item,
            "first_request": first_user_input,
            "turns": user_input_count,
            "start_time": first_timestamp or "Unknown",
            "last_time": last_timestamp or "Unknown",
            "start_date_obj": first_date or datetime.min
        })
        
    # Sort conversations by start date descending
    conversations.sort(key=lambda x: x["start_date_obj"], reverse=True)
    
    safe_print("\n## Past Conversations Index\n")
    safe_print("| # | Conversation ID | Start Time | Turns | First User Request |")
    safe_print("|---|-----------------|------------|-------|--------------------|")
    for idx, c in enumerate(conversations, 1):
        start_str = c["start_time"]
        if c["start_date_obj"] != datetime.min:
            start_str = c["start_date_obj"].strftime("%Y-%m-%d %H:%M:%S")
            
        safe_print(f"| {idx} | `{c['id']}` | {start_str} | {c['turns']} | {c['first_request']} |")
    safe_print(f"\nTotal conversations found: {len(conversations)}\n")

def search_conversations(query):
    if not os.path.exists(BRAIN_DIR):
        safe_print(f"Error: Brain directory not found at {BRAIN_DIR}")
        return

    safe_print(f"\nSearching past conversations for: '{query}'\n")
    matches = []
    
    for item in os.listdir(BRAIN_DIR):
        item_path = os.path.join(BRAIN_DIR, item)
        if not os.path.isdir(item_path):
            continue
            
        if not re.match(r'^[a-f0-9\-]{36}$', item):
            continue
            
        log_path = os.path.join(item_path, ".system_generated", "logs", "transcript.jsonl")
        if not os.path.exists(log_path):
            log_path = os.path.join(item_path, ".system_generated", "logs", "overview.txt")
        if not os.path.exists(log_path):
            continue
            
        try:
            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, line in enumerate(f, 1):
                    if query.lower() in line.lower():
                        try:
                            data = json.loads(line)
                            content = data.get("content", "")
                            # If query matches inside content
                            if query.lower() in content.lower():
                                # Extract snippet
                                match_idx = content.lower().find(query.lower())
                                start_idx = max(0, match_idx - 50)
                                end_idx = min(len(content), match_idx + len(query) + 100)
                                snippet = content[start_idx:end_idx].replace('\n', ' ').strip()
                                if start_idx > 0:
                                    snippet = "..." + snippet
                                if end_idx < len(content):
                                    snippet = snippet + "..."
                                    
                                matches.append({
                                    "id": item,
                                    "timestamp": data.get("created_at") or "Unknown",
                                    "type": data.get("type", "UNKNOWN"),
                                    "snippet": snippet
                                })
                        except json.JSONDecodeError:
                            matches.append({
                                "id": item,
                                "timestamp": "Unknown",
                                "type": "RAW_MATCH",
                                "snippet": line[:150].strip()
                            })
        except Exception as e:
            continue
            
    if not matches:
        safe_print("No matches found.")
        return
        
    safe_print(f"Found {len(matches)} match(es):\n")
    safe_print("| Conversation ID | Step Type | Timestamp | Match Snippet |")
    safe_print("|-----------------|-----------|-----------|---------------|")
    for m in matches:
        ts_str = m["timestamp"]
        try:
            ts_date = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
            ts_str = ts_date.strftime("%Y-%m-%d %H:%M:%S")
        except:
            pass
        safe_print(f"| `{m['id']}` | {m['type']} | {ts_str} | {m['snippet']} |")
    safe_print()

def view_conversation(conv_id):
    conv_path = os.path.join(BRAIN_DIR, conv_id)
    if not os.path.exists(conv_path):
        safe_print(f"Error: Conversation directory '{conv_id}' not found.")
        return
        
    log_path = os.path.join(conv_path, ".system_generated", "logs", "transcript.jsonl")
    if not os.path.exists(log_path):
        log_path = os.path.join(conv_path, ".system_generated", "logs", "overview.txt")
    if not os.path.exists(log_path):
        safe_print(f"Error: Transcript log for conversation '{conv_id}' does not exist.")
        return
        
    safe_print(f"\n# Transcript for Conversation: {conv_id}\n")
    
    try:
        with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    source = data.get("source")
                    step_type = data.get("type")
                    content = data.get("content", "")
                    timestamp = data.get("created_at") or ""
                    
                    if timestamp:
                        try:
                            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                            timestamp = dt.strftime("%Y-%m-%d %H:%M:%S")
                        except:
                            pass
                    
                    if step_type == "USER_INPUT":
                        req_match = re.search(r"<USER_REQUEST>(.*?)</USER_REQUEST>", content, re.DOTALL)
                        req_text = req_match.group(1).strip() if req_match else content.strip()
                        safe_print(f"\n=== USER ({timestamp}) ===")
                        safe_print(req_text)
                        safe_print("-" * 50)
                    elif source == "MODEL" and content:
                        safe_print(f"\n=== AGENT ({timestamp}) ===")
                        safe_print(content.strip())
                        safe_print("-" * 50)
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        safe_print(f"Error reading transcript: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage and search past conversations.")
    parser.add_argument("--list", action="store_true", help="List all past conversations.")
    parser.add_argument("--search", type=str, help="Search for keyword in past conversations.")
    parser.add_argument("--view", type=str, help="View the transcript of a specific conversation ID.")
    
    args = parser.parse_args()
    
    if args.list:
        list_conversations()
    elif args.search:
        search_conversations(args.search)
    elif args.view:
        view_conversation(args.view)
    else:
        list_conversations()
