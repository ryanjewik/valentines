import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import re
import json
import argparse
import sys


SYSTEM_PROMPT = "You are Ryan texting casually using slang, short replies, humor, and expressive reactions."


def is_useful(text: str) -> bool:
    t = text.lower()
    if len(t) < 2:
        return False
    if "verification code" in t:
        return False
    if re.search(r"\b\d{5,}\b", t):
        return False
    return True


def load_messages(xml_path: str):
    tree = ET.parse(xml_path)
    root = tree.getroot()

    msgs = []
    for sms in root.findall("sms"):
        body = sms.attrib.get("body", "").strip()
        msg_type = sms.attrib.get("type")  # 1=received, 2=sent
        try:
            date = int(sms.attrib.get("date", "0")) // 1000
            time = datetime.fromtimestamp(date)
        except Exception:
            time = datetime.fromtimestamp(0)

        if not body:
            continue

        # normalize links
        body = re.sub(r"http\S+", "[LINK]", body)

        msgs.append({
            "role": "assistant" if msg_type == "2" else "user",
            "text": body,
            "time": time,
        })

    msgs.sort(key=lambda x: x["time"])
    return msgs


def build_pairs(msgs):
    convos = []
    current = []
    for msg in msgs:
        if not is_useful(msg["text"]):
            continue

        if current:
            gap = msg["time"] - current[-1]["time"]
            if gap > timedelta(minutes=30):
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
                if len(reply) > 1:
                    pairs.append((user_msg, reply))

    return pairs


def write_train_jsonl(pairs, out_path="train.jsonl"):
    with open(out_path, "w", encoding="utf-8") as f:
        for user_msg, reply in pairs:
            example = {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                    {"role": "assistant", "content": reply},
                ]
            }
            f.write(json.dumps(example, ensure_ascii=False) + "\n")


def write_instructions_json(pairs, out_path="train_instructions.json"):
    formatted = []
    for user_msg, reply in pairs:
        prompt = f"Friend: {user_msg}\nRyan:"
        formatted.append({"instruction": prompt, "response": reply})

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(formatted, f, indent=2, ensure_ascii=False)


def main(argv):
    parser = argparse.ArgumentParser(description="Clean SMS backup and format training data")
    parser.add_argument("xml", nargs="?", default="sms.xml", help="Path to sms.xml")
    parser.add_argument("--jsonl", default="train.jsonl", help="Output train jsonl path")
    parser.add_argument("--instructions", default="train_instructions.json", help="Output instructions json path")
    args = parser.parse_args(argv)

    msgs = load_messages(args.xml)
    pairs = build_pairs(msgs)

    write_train_jsonl(pairs, args.jsonl)
    write_instructions_json(pairs, args.instructions)

    print(f"Created {len(pairs)} pairs -> {args.jsonl} and {args.instructions}")


if __name__ == "__main__":
    main(sys.argv[1:])
