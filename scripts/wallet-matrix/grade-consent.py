#!/usr/bin/env python3
"""Grade captured consent screens against the personal-wallet integration guideline.

    ./grade-consent.py [results-dir]

Reads the screen text run.sh saved and reports, per wallet, which clauses of
[PW-POT] and [PW-CFG-2] the rendering satisfies. It grades what is on screen,
so a clause can only be judged on scenarios that actually reached a screen.
"""
import re,sys,os,glob,collections

CLAUSES=[
 ('PW-CFG-2','testnet chip'),
 ('PW-POT-1a','status band word'),
 ('PW-POT-1b','service DID shown'),
 ('PW-POT-2a','service block'),
 ('PW-POT-3a','operated-by block'),
 ('PW-POT-2b','Q2/Q3 verdict in words'),
 ('PW-POT-2c','denial hard-blocks accept'),
 ('PW-POT-5','registry link'),
]

def blocks(path):
    txt=open(path,encoding='utf-8',errors='replace').read()
    for m in re.finditer(r'^### (\S+) / (\S+) / (\S+).*?\n(.*?)(?=^### |\Z)',txt,re.S|re.M):
        w,su,sid,body=m.groups()
        scr=body.split('--- screen text ---',1)
        yield w,su,sid,(scr[1] if len(scr)>1 else '')

CONFIRMED={'swiyu':True}   # tapped on device 2026-09-08: Add is inert on a Q2 denial
w_current=[None]

def grade(s):
    L=s.lower()
    r={}
    r['PW-CFG-2'] = 'testnet' in L
    r['PW-POT-1a'] = bool(re.search(r'\b(trusted|untrusted|could not verify|low level of trust)\b',L))
    r['PW-POT-1b'] = 'did:webvh' in L
    r['PW-POT-2a'] = ('service' in L) or ('no ecs-service' in L)
    r['PW-POT-3a'] = ('operated by' in L) or ('no ecs-organization' in L)
    denied = bool(re.search(r'is not an authoriz',L))
    granted = bool(re.search(r'is an authoriz',L))
    r['PW-POT-2b'] = denied or granted
    # Whether a denial actually blocks the accept action cannot be read from text
    # or from the accessibility tree: these wallets render Compose buttons as
    # non-clickable TextViews whose enabled attribute is always true. It has to be
    # tapped on the device. CONFIRMED holds what has been checked that way.
    r['PW-POT-2c'] = CONFIRMED.get(w_current[0],'?') if denied else None
    r['PW-POT-5'] = ('open this did' in L) or ('verana registry' in L) or ('trust details' in L)
    return r

def main():
    d=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'results')
    per=collections.defaultdict(lambda: collections.defaultdict(list))
    seen=collections.Counter()
    for f in sorted(glob.glob(os.path.join(d,'*.txt'))):
        for w,su,sid,scr in blocks(f):
            if not scr.strip(): continue
            if not re.search(r'trusted|authoriz|offers you|asks you for|requests the following',scr,re.I):
                continue   # never reached a consent screen
            seen[w]+=1
            w_current[0]=w
            for k,v in grade(scr).items():
                if v is not None: per[w][k].append(v)
    if not seen: print('no consent screens found in',d); return 1
    hdr='%-11s %5s '%('wallet','scr')+' '.join('%-9s'%c for c,_ in CLAUSES)
    print(hdr); print('-'*len(hdr))
    for w in sorted(per):
        row='%-11s %5d '%(w,seen[w])
        for c,_ in CLAUSES:
            vals=per[w][c]
            if not vals: cell='n/a'
            elif any(v=='?' for v in vals): cell='?'
            elif all(vals): cell='yes'
            elif not any(vals): cell='NO'
            else: cell='%d/%d'%(sum(vals),len(vals))
            row+='%-9s '%cell
        print(row.rstrip())
    print()
    for c,label in CLAUSES: print('  %-10s %s'%(c,label))
    print()
    print('  PW-POT-2c cannot be read from a screen dump: these wallets render Compose')
    print('  buttons as non-clickable TextViews with enabled=true regardless. It must be')
    print('  tapped on the device. Only swiyu has been checked that way (it hard-blocks);')
    print("  the rest show '?' until someone taps them.")
    return 0
sys.exit(main())
