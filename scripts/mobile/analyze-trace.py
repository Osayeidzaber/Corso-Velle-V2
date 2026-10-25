"""Attribute renderer main-thread long tasks in a Chrome trace to scripts/activities."""
import json, sys, collections

trace = json.load(open(sys.argv[1], encoding='utf8'))
ev = trace['traceEvents'] if isinstance(trace, dict) else trace
mains = {(e['pid'], e['tid']) for e in ev if e.get('name') == 'thread_name' and e['args'].get('name') == 'CrRendererMain'}
busy = collections.Counter()
for e in ev:
    if (e.get('pid'), e.get('tid')) in mains and e.get('name') == 'RunTask' and e.get('dur'):
        busy[(e['pid'], e['tid'])] += e['dur']
main = busy.most_common(1)[0][0]
X = sorted([e for e in ev if (e.get('pid'), e.get('tid')) == main and e.get('ph') == 'X' and e.get('dur')], key=lambda e: e['ts'])
t0 = X[0]['ts']
short = lambda u: (u or '').split('/')[-1].split('?')[0] or '(none)'

def label(e):
    n = e['name']; d = e.get('args', {}).get('data', {}) or {}
    if n == 'FunctionCall': return f"JS {short(d.get('url'))}:{d.get('functionName') or 'anon'}"
    if n in ('EvaluateScript', 'v8.compileModule', 'v8.evaluateModule', 'v8.compile'): return f"{n} {short(d.get('url') or e.get('args', {}).get('fileName'))}"
    if n == 'EventDispatch': return f"event {d.get('type')}"
    if n == 'TimerFire': return 'timer'
    if n in ('FireAnimationFrame', 'Layout', 'UpdateLayoutTree', 'Paint', 'PrePaint', 'ParseHTML', 'ParseAuthorStyleSheet', 'Decode Image', 'IntersectionObserverController::computeIntersections', 'RunMicrotasks', 'FireIdleCallback', 'Layerize', 'Commit'): return n
    return None

longs = [e for e in X if e['name'] == 'RunTask' and e['dur'] > 50000]
rows = []
for task in longs:
    end = task['ts'] + task['dur']
    sums = collections.Counter()
    for e in X:
        if e['ts'] < task['ts']: continue
        if e['ts'] >= end: break
        if e is task: continue
        k = label(e)
        if k: sums[k] += e['dur']
    rows.append((round((task['ts'] - t0) / 1000), round(task['dur'] / 1000), [f"{k} {round(v/1000)}ms" for k, v in sums.most_common(6)]))
print('main thread', main, 'long tasks', len(longs), 'total', round(sum(t['dur'] for t in longs) / 1000), 'ms; blocking (>50ms part)', round(sum(t['dur'] - 50000 for t in longs) / 1000), 'ms')
for at, dur, top in rows: print(f"  @{at}ms {dur}ms :: " + ' | '.join(top))
tot = collections.Counter()
for e in X:
    if e['name'] == 'FunctionCall': tot[short((e.get('args', {}).get('data') or {}).get('url'))] += e['dur']
print('JS FunctionCall time by script:', ', '.join(f"{k} {round(v/1000)}ms" for k, v in tot.most_common(10)))
for n in ('Layout', 'UpdateLayoutTree', 'Paint', 'IntersectionObserverController::computeIntersections', 'FireAnimationFrame'):
    print(n, round(sum(e['dur'] for e in X if e['name'] == n) / 1000), 'ms')
