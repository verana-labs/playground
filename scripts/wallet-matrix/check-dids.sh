#!/usr/bin/env bash
# Sweep every cast service for did:webvh logs swiyu's resolver will reject.
#   ./check-dids.sh
# A log is BROKEN when any entry signs its proof with a bare did:key:z... instead
# of did:key:z...#z.... swiyu replays from version 1, so one bad entry is fatal
# and cannot be repaired by rolling the image. See README.md.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WF="${WORKFLOWS_DIR:-$HERE/../../.github/workflows}"

python3 - "$WF" <<'PYEOF'
import json,glob,re,subprocess,sys,os,concurrent.futures as cf
wf=sys.argv[1]
hosts=set()
for f in glob.glob(os.path.join(wf,'*','orgs','*','config.env')):
    cast=f.split(os.sep)[-4]
    for line in open(f):
        m=re.match(r'^INGRESS_HOST="([^"]*)"',line.strip())
        if m: hosts.add((cast,m.group(1).replace('__NETWORK__','testnet')))
def check(item):
    cast,h=item
    r=subprocess.run(['curl','-sS','--fail','-m','90','https://%s/.well-known/did.jsonl'%h],
                     capture_output=True,text=True)
    if r.returncode: return (cast,h,'UNREACHABLE',r.stderr.strip()[:60])
    try: lines=[json.loads(l) for l in r.stdout.splitlines() if l.strip()]
    except Exception as e: return (cast,h,'UNPARSEABLE',str(e)[:60])
    bad=[]
    for i,d in enumerate(lines,1):
        pr=d.get('proof'); pr=[pr] if isinstance(pr,dict) else (pr or [])
        for p in pr:
            if '#' not in p.get('verificationMethod',''):
                bad.append((i,d.get('versionTime','?')[:10]))
    if bad:
        return (cast,h,'BROKEN','%d/%d entries bare, first v%s (%s)'%(len(bad),len(lines),bad[0][0],bad[0][1]))
    return (cast,h,'ok','%d entries'%len(lines))
with cf.ThreadPoolExecutor(6) as ex: res=sorted(ex.map(check,hosts))
bad=0
for cast,h,st,det in res:
    if st!='ok': bad+=1
    print('%-9s %-46s %-12s %s'%(cast,h.replace('.testnet.verana.network',''),st,det))
print('\n%d of %d services need attention'%(bad,len(res)))
sys.exit(1 if bad else 0)
PYEOF
