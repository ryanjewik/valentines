import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import re
import json
import argparse
import sys

# IMPORTANT:
# Keep this neutral during training to preserve instruction-following.
# Add "Ryan texting style" at inference via your Ollama SYSTEM prompt instead.
SYSTEM_PROMPT = "You are a helpful assistant."

def is_useful(text: str) -> bool:
    """Filter out SMS junk that degrades instruction-following when trained on."""
    t = text.lower().strip()
    if len(t) < 2:
        return False
    if len(t) > 500:
        return False  # long forwarded messages / copypastas
    if "verification code" in t:
        return False
    if re.search(r"\b\d{5,}\b", t):
        return False

    # Contact cards & carrier messages
    if any(kw in t for kw in [
        "personal information", "[contact]", "contact card",
        "voicemail", "mailbox", "your account", "has been activated",
        "your plan", "data usage", "autopay", "payment received",
        "service alert", "network update", "member since",
    ]):
        return False

    # Contact metadata ("Joined. Mon May 19, 2008" etc)
    if re.search(r"\bjoined\b", t):
        return False
    if re.search(r"\b(?:mon|tue|wed|thu|fri|sat|sun)\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)", t):
        return False
    if re.search(r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s*\d{4}", t):
        return False

    # Dictionary definitions that the model memorizes
    if re.search(r"^\[?(?:verb|noun|adj|adverb)\]?\s", t):
        return False
    if re.search(r"^\d+\.\s+(?:to |a |the |an )", t):
        return False  # numbered dictionary entries

    # Forwarded / copypasta messages (heuristic: very long single block)
    if re.search(r"it is (?:not that|the way)", t) and len(t) > 100:
        return False

    # Spam / marketing
    if any(kw in t for kw in [
        "unsubscribe", "subscribe", "click here", "free trial",
        "limited time", "act now", "congratulations", "you have won",
        "claim your", "opt out", "reply stop",
    ]):
        return False

    # Automated / system messages
    if any(kw in t for kw in [
        "do not reply", "this is an automated", "no-reply",
        "your order", "tracking number", "has shipped",
        "appointment reminder", "scheduled for",
    ]):
        return False

    # Image attributions / wiki references
    if any(kw in t for kw in [
        "wikimedia", "commons", "via getty", "shutterstock",
        "photo credit", "image source", "creative commons",
    ]):
        return False

    return True

def load_messages(xml_path: str):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    msgs = []
    for sms in root.findall("sms"):
        body = (sms.attrib.get("body", "") or "").strip()
        msg_type = sms.attrib.get("type")  # 1=received, 2=sent
        try:
            date = int(sms.attrib.get("date", "0")) // 1000
            time = datetime.fromtimestamp(date)
        except Exception:
            time = datetime.fromtimestamp(0)

        if not body:
            continue

        # normalize links (both http URLs and bare domains)
        body = re.sub(r"http\S+", "", body)
        body = re.sub(r"\b\w+\.(?:com|org|net|io|co|me|info|biz|edu|gov)\b", "", body)
        body = body.strip()
        if not body:
            continue

        msgs.append({
            "role": "assistant" if msg_type == "2" else "user",
            "text": body,
            "time": time,
        })

    msgs.sort(key=lambda x: x["time"])
    return msgs

def build_pairs(msgs, gap_minutes: int = 30):
    convos = []
    current = []
    for msg in msgs:
        if not is_useful(msg["text"]):
            continue

        if current:
            gap = msg["time"] - current[-1]["time"]
            if gap > timedelta(minutes=gap_minutes):
                convos.append(current)
                current = []

        current.append(msg)

    if current:
        convos.append(current)

    pairs = []
    for convo in convos:
        for i in range(len(convo) - 1):
            if convo[i]["role"] == "user" and convo[i + 1]["role"] == "assistant":
                user_msg = convo[i]["text"]
                reply = convo[i + 1]["text"]
                if len(reply.strip()) > 1:
                    pairs.append((user_msg, reply))
    return pairs

def write_sms_chat_jsonl(pairs, out_path="train_instructions.jsonl"):
    """
    Writes chat-format JSONL:
    {"messages":[{"role":"system","content":...},{"role":"user","content":...},{"role":"assistant","content":...}]}
    """
    with open(out_path, "w", encoding="utf-8") as f:
        for user_msg, reply in pairs:
            ex = {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                    {"role": "assistant", "content": reply},
                ]
            }
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

def main(argv):
    parser = argparse.ArgumentParser(description="Clean SMS backup and write chat-format jsonl")
    parser.add_argument("xml", nargs="?", default="sms.xml", help="Path to sms.xml")
    parser.add_argument("--out", default="train_instructions.jsonl", help="Output SMS chat jsonl path")
    parser.add_argument("--gap", type=int, default=30, help="Conversation split gap in minutes (default: 30)")
    args = parser.parse_args(argv)

    msgs = load_messages(args.xml)
    pairs = build_pairs(msgs, gap_minutes=args.gap)
    write_sms_chat_jsonl(pairs, args.out)

    print(f"Created {len(pairs)} SMS pairs -> {args.out}")

if __name__ == "__main__":
    main(sys.argv[1:])
