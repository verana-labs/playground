import re
import sys
import xml.etree.ElementTree as ET

LABELS = {
    "onboard": ["get started", "continue", "next", "skip", "accept", "agree", "i agree", "confirm",
                "done", "ok", "allow", "not now", "maybe later", "later", "got it", "go to home", "close"],
    "accept": ["share", "add", "issue", "accept", "confirm", "continue", "next", "allow",
               "done", "ok", "go to home", "close"],
}
SECRET_HINT = re.compile(r"\b(pin|passcode|password)\b", re.I)


def center(bounds):
    x1, y1, x2, y2 = map(int, re.findall(r"\d+", bounds))
    return (x1 + x2) // 2, (y1 + y2) // 2


def label(node):
    return (node.get("text") or node.get("content-desc") or "").strip().lower()


xml_path, mode = sys.argv[1], sys.argv[2]
nodes = [n for n in ET.parse(xml_path).iter("node") if n.get("enabled") == "true"]

field = next((n for n in nodes if "EditText" in (n.get("class") or "")), None)
if field is not None:
    print("type", *center(field.get("bounds")))
    sys.exit()

for wanted in LABELS[mode]:
    node = next((n for n in nodes if label(n).startswith(wanted)), None)
    if node is not None:
        print("tap", *center(node.get("bounds")), wanted.replace(" ", "_"))
        sys.exit()

screen_text = " ".join(label(n) for n in nodes)
print("type-blind" if SECRET_HINT.search(screen_text) else "stop")
