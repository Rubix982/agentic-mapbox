"""Read the parameter tables of each endpoint on Mapbox's API reference pages.

    python3 -I experiments/mcp/docs_params.py DOCS_DIR OUT.json

DOCS_DIR holds the pages as fetched (see compare.mjs for the list); they are Mapbox's text and are not committed.
OUT.json gets, for every endpoint section: its heading, method and URL template, and each parameter's name, type,
which table it is in (required / optional / other), and its description, which compare.mjs uses to find stated
defaults, allowed values and ranges. The committed results keep names, types and the extracted constraints only.
"""
import html, json, os, re, sys
from html.parser import HTMLParser

def text(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()

class Tables(HTMLParser):
    """Top-level tables only; a table nested in a cell (a list of allowed values, say) stays part of that cell's text.
    The docs leave <tr>, <td> and <th> unclosed, so a row or cell ends where the next one at the same depth begins."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.done = [], []
        self.code = None  # text of the <code> element being read, if any

    def _close_cell(self, t):
        if t['cell'] is not None:
            (t['head'] if t['in_head'] else t['row']).append(re.sub(r'\s+', ' ', ''.join(t['cell'])).strip())
            if not t['in_head']:
                t['row_codes'].append(t['codes'])
            t['cell'], t['codes'] = None, []

    def _close_row(self, t):
        self._close_cell(t)
        if t['row']:
            t['rows'].append((t['row'], t['row_codes']))
        t['row'], t['row_codes'] = [], []

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.stack.append({'head': [], 'rows': [], 'row': [], 'row_codes': [], 'cell': None, 'codes': [], 'in_head': False, 'nested': bool(self.stack)})
            return
        if tag == 'code':
            self.code = []
        if not self.stack:
            return
        t = self.stack[-1]
        if tag == 'thead':
            t['in_head'] = True
        elif tag == 'tbody':
            self._close_cell(t); t['in_head'] = False
        elif tag == 'tr':
            if t['in_head']:
                self._close_cell(t)
            else:
                self._close_row(t)
        elif tag in ('td', 'th'):
            self._close_cell(t); t['cell'] = []

    def handle_endtag(self, tag):
        if tag == 'code' and self.code is not None:
            value = ''.join(self.code).strip()
            for t in self.stack:
                if t['cell'] is not None and value:
                    t['codes'].append(value)
            self.code = None
            return
        if tag == 'table' and self.stack:
            t = self.stack.pop()
            self._close_row(t)
            if not t['nested']:
                self.done.append(t)

    def handle_data(self, data):
        if self.code is not None:
            self.code.append(data)
        for t in self.stack:
            if t['cell'] is not None:
                t['cell'].append(data)

FLAGS = ('BETA', 'LEGACY', 'DEPRECATED')

def tables(section):
    parser = Tables()
    parser.feed(section)
    out = []
    for t in parser.done:
        header = ' '.join(t['head']).lower()
        if 'parameter' not in header:
            continue
        kind = 'required' if 'required' in header else 'optional' if 'optional' in header else header
        for row, codes in t['rows']:
            if len(row) < 2:
                continue
            words = row[0].split()
            flags = [w for w in words if w in FLAGS]
            name = ' '.join(w for w in words if w not in FLAGS)
            name = re.sub(r'\s*\((path|query|body)\)$', '', name)
            out.append({'name': name, 'flags': flags, 'type': row[1] if len(row) > 2 else '', 'table': kind, 'description': row[-1],
                        'codes': codes[-1] if codes else []})
    return out

def page(path):
    s = open(path, encoding='utf-8').read()
    parts = re.split(r'(<h2[^>]*>.*?</h2>)', s, flags=re.S)
    sections = []
    for i in range(1, len(parts) - 1, 2):
        heading, body = text(parts[i]).rstrip('​').strip(), parts[i + 1]
        ends = [m for m in re.finditer(r'txt-uppercase txt-bold[^>]*>(get|post|put|patch|delete)</div><div[^>]*>(.*?)</div>', body, flags=re.S)]
        params = tables(body)
        if not ends and not params:
            continue
        sections.append({'heading': heading, 'endpoints': [{'method': m.group(1).upper(), 'url': text(m.group(2)).replace(' ', '')} for m in ends], 'params': params})
    return sections

docs, out = sys.argv[1], sys.argv[2]
result = {f[:-5]: page(os.path.join(docs, f)) for f in sorted(os.listdir(docs)) if f.endswith('.html')}
json.dump(result, open(out, 'w'), indent=1, ensure_ascii=False)
for p, secs in result.items():
    for s in secs:
        print(f"{p:28} | {s['heading'][:44]:44} | {' '.join(e['method'] + ' ' + e['url'].split('?')[0].replace('https://api.mapbox.com', '') for e in s['endpoints'])[:70]:70} | {len(s['params'])}")
