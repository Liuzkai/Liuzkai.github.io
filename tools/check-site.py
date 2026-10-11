#!/usr/bin/env python3
"""Check generated routes, local links, content preservation and search/feed data."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import xml.etree.ElementTree as ET

site = Path('_site')
required = ['index.html', 'blog/index.html', 'posts/how_to_use_unreal_python/index.html', 'posts/HoutoUsingOpenCLInHoudini/index.html', 'tabs/about/index.html', 'tabs/categories/index.html', 'tabs/tags/index.html', 'tabs/archives/index.html', 'feed.xml', 'sitemap.xml', 'search.json', 'sw.js']
errors = []
for name in required:
    if not (site / name).is_file(): errors.append('Missing route: ' + name)
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.urls=[]
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src') and value: self.urls.append(value)
for page in site.rglob('*.html'):
    parser = Links(); parser.feed(page.read_text())
    for raw in parser.urls:
        url = urlsplit(raw)
        if url.scheme or url.netloc or not url.path: continue
        dest = site / unquote(url.path).lstrip('/') if url.path.startswith('/') else page.parent / unquote(url.path)
        if dest.is_dir(): dest /= 'index.html'
        if not dest.exists(): errors.append(f'{page}: broken local link {raw}')
for source in Path('img').rglob('*'):
    if source.is_file() and not source.name.startswith('.') and (not (site/source).is_file() or source.read_bytes() != (site/source).read_bytes()): errors.append('Changed/missing image: '+str(source))
if (site/'search.json').exists():
    posts = json.loads((site/'search.json').read_text())
    assert {'/posts/how_to_use_unreal_python/', '/posts/HoutoUsingOpenCLInHoudini/'} <= {p['url'] for p in posts}, 'Search index omits legacy posts'
    for post in posts:
        assert post['title'] and post['content'] and post['url'].startswith('/posts/'), 'Incomplete search entry'
        assert (site/post['url'].lstrip('/')/'index.html').is_file(), 'Search URL missing'
for name in ['feed.xml','sitemap.xml']:
    if (site/name).exists(): ET.parse(site/name)
assert 'serviceWorker.register' not in (site/'assets/terminal/blog.js').read_text()
if errors: raise SystemExit('\n'.join(errors))
print(f'PASS: {len(required)} required routes; local links; search, XML; original image bytes.')
