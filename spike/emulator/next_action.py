import re
import sys
import xml.etree.ElementTree as ET

LABELS = {
    "onboard": ["create password", "get started", "start", "continue", "next", "skip", "accept", "agree",
                "i agree", "confirm", "done", "ok", "allow", "not now", "maybe later", "later", "no thanks",
                "decline", "got it", "go to home", "close"],
    "accept": ["unlock", "log in", "login", "share", "add", "issue", "accept", "confirm", "continue", "next",
               "allow", "done", "ok", "go to home", "close"],
}
ACCEPT_CONTROLS = ["share", "add", "issue", "accept", "allow"]
SECRET_HINT = re.compile(r"\b(pin|passcode|password)\b", re.I)
WAIT_HINT = re.compile(r"please wait|loading|may take up to|resolving", re.I)
SUCCESS_HINT = re.compile(r"success|added to your wallet|successfully|shared|issued|completed", re.I)
ERROR_HINT = re.compile(r"something went wrong|went wrong|failed|invalid|not supported|no matching credential|unable to", re.I)
TERMINAL = {"close", "done", "go to home"}


def center(bounds):
    x1, y1, x2, y2 = map(int, re.findall(r"\d+", bounds))
    return (x1 + x2) // 2, (y1 + y2) // 2


def label(node):
    return (node.get("text") or node.get("content-desc") or "").strip().lower()


def is_field(node):
    return "EditText" in (node.get("class") or "")


def is_empty(node):
    text = (node.get("text") or "").strip()
    return not text or text == (node.get("hint") or "").strip()


def first_labelled(nodes, wanted_labels):
    for wanted in wanted_labels:
        node = next((n for n in nodes if not is_field(n) and label(n).startswith(wanted)), None)
        if node is not None:
            return wanted, node
    return None, None


xml_path, mode = sys.argv[1], sys.argv[2]
root = ET.parse(xml_path).getroot()
parents = {child: parent for parent in root.iter() for child in parent}


def clickable_node(node):
    current = node
    while current is not None and current.tag == "node":
        if current.get("clickable") == "true":
            return current
        current = parents.get(current)
    return None


def enabled(node):
    current = clickable_node(node)
    if current is None:
        current = node
    return current.get("enabled") == "true"


all_nodes = list(root.iter("node"))
nodes = [n for n in all_nodes if enabled(n)]
screen_text = " ".join(label(n) for n in all_nodes)

if mode == "find":
    wanted = sys.argv[3].lower()
    node = next((n for n in nodes if label(n).startswith(wanted)), None)
    print(*center(node.get("bounds"))) if node is not None else print("none")
    sys.exit()

if mode == "error":
    match = ERROR_HINT.search(screen_text)
    print(match.group(0) if match else "")
    sys.exit()

if mode == "gate":
    wanted = node = None
    for word in ACCEPT_CONTROLS:
        node = next((n for n in all_nodes if not is_field(n) and clickable_node(n) is not None and label(n).startswith(word)), None)
        if node is not None:
            wanted = word
            break
    print(f"{wanted}:enabled={str(enabled(node)).lower()}" if node is not None else "none")
    sys.exit()

if WAIT_HINT.search(screen_text):
    print("wait")
    sys.exit()

asks_secret = bool(SECRET_HINT.search(screen_text))
fields = [n for n in nodes if is_field(n)] if asks_secret else []
empty = next((n for n in fields if is_empty(n)), None)
if empty is not None:
    print("type", *center(empty.get("bounds")))
    sys.exit()

wanted, node = first_labelled(nodes, LABELS[mode])
if node is not None and mode == "accept" and wanted in TERMINAL and not SUCCESS_HINT.search(screen_text):
    print("stop")
elif node is not None:
    action = "finish" if mode == "accept" and wanted in TERMINAL else "tap"
    print(action, *center(node.get("bounds")), wanted.replace(" ", "_"))
elif fields:
    print("enter")
elif asks_secret:
    print("type-blind")
else:
    print("stop")
