import re
import sys
import xml.etree.ElementTree as ET

ADVANCE = re.compile(
    r"^(continue|next|get started|start|skip|accept|agree|i agree|confirm|done|ok|allow|not now|later|maybe later|got it|close)$",
    re.I,
)
SECRET_HINT = re.compile(r"\b(pin|passcode|password)\b", re.I)


def center(bounds):
    x1, y1, x2, y2 = map(int, re.findall(r"\d+", bounds))
    return (x1 + x2) // 2, (y1 + y2) // 2


nodes = list(ET.parse(sys.argv[1]).iter("node"))

field = next(
    (n for n in nodes if "EditText" in (n.get("class") or "") and n.get("enabled") == "true"),
    None,
)
if field is not None:
    print("type", *center(field.get("bounds")))
    sys.exit()

for node in nodes:
    label = (node.get("text") or node.get("content-desc") or "").strip()
    if ADVANCE.match(label) and node.get("enabled") == "true":
        print("tap", *center(node.get("bounds")), label)
        sys.exit()

screen_text = " ".join((n.get("text") or "") + " " + (n.get("content-desc") or "") for n in nodes)
print("type-blind" if SECRET_HINT.search(screen_text) else "stop")
