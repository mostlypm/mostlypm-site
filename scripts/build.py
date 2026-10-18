#!/usr/bin/env python3
"""Build the Notes pages for mostlypm.com.

Reads Markdown posts from content/notes/*.md and writes:
  notes/<slug>/index.html   one page per post
  notes/index.html          the Notes list
  index.html                fills the quest log between <!-- POSTS --> markers
  sitemap.xml

Front matter keys: title, dek, kicker, date, order, kind (series | case | note), level (0-3, side).

Usage:  pip install markdown   (once)
        python3 scripts/build.py
"""
import html
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "notes"
SITE_URL = "https://mostlypm.com"
LEVEL_NAME = {"0": "Start", "1": "Level 1", "2": "Level 2", "3": "Level 3", "side": "Side quest"}

HEAD = """<!doctype html>
<html lang="en" class="classic" data-fixed-mode="classic">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="{og_type}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<script>(function(){{var d=new Date(),t=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),c=d.getDay()===1;try{{var s=JSON.parse(localStorage.getItem('mpm-quest-v2')||'null');if(s&&s.modeDay===t)c=!!s.classic}}catch(e){{}}if(c)document.documentElement.classList.add('classic')}})()</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/game.css?v=1018x">
</head>
<body>
<header class="hud">
  <div class="g"><div class="in hud-in">
    <a class="logo" href="/">mostly<span>pm</span></a>
    <nav class="hud-nav" aria-label="Main"><a href="/" class="nav-home">Home</a><a href="/" data-quest-link>Quest</a><a href="/notes/"{notes_current}>Notes</a><a href="/work/">Work with me</a></nav>
    <div class="stats game-only">
      <div class="xp"><span>Week XP</span><span class="xpbar" aria-hidden="true"><i id="xpfill"></i></span><span id="xptext">0 / 1050</span></div>
      <div class="badges" aria-label="Levels cleared this week"><span class="badges-k">Cleared</span><span class="badge" id="b-u" title="Level 1: Understand">1</span><span class="badge" id="b-p" title="Level 2: Prove">2</span><span class="badge" id="b-s" title="Level 3: Shape and ship">3</span><span class="badge wide" id="b-d" title="Side quest">Side</span></div>
    </div>
    <a class="mode-btn" href="/#play" data-play-game>Play the quest</a>
  </div></div>
</header>
<main class="g"><div class="in">
"""

FOOT = """  <footer class="foot"><span>mostlypm · Mostly PM thinking. Fully working product.</span><span>© 2026 Gayatri</span></footer>
</div></main>
<script src="/assets/quests.js?v=1018x"></script>
<script src="/assets/game.js?v=1018x"></script>
</body>
</html>
"""


def e(s):
    return html.escape(s, quote=True)


def parse(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        raise SystemExit(f"{path.name}: missing front matter")
    meta = {}
    for line in m.group(1).splitlines():
        key, _, value = line.partition(":")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] == '"':
            value = value[1:-1]
        meta[key.strip()] = value
    meta["slug"] = path.stem
    meta["order"] = int(meta.get("order", 99))
    meta.setdefault("kind", "note")
    meta.setdefault("level", "")
    body = markdown.markdown(m.group(2), extensions=["extra", "smarty"])
    # image paragraph followed by an italic caption paragraph -> figure
    body = re.sub(r"<p>(<img [^>]*>)</p>\s*<p><em>(.*?)</em></p>",
                  r"<figure>\1<figcaption>\2</figcaption></figure>", body, flags=re.S)
    body = body.replace("<img ", '<img loading="lazy" ')
    body = body.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")
    meta["body"] = body
    return meta


def post_page(post, posts):
    url = f"{SITE_URL}/notes/{post['slug']}/"
    series = [p for p in posts if p["kind"] == "series"]
    play = ""
    if post["level"] in LEVEL_NAME:
        label = "This week's side quest is based on this post." if post["level"] == "side" else f'{LEVEL_NAME[post["level"]]} of this week\'s quest is based on this post.'
        play = (f'<div class="play-banner"><span>{label}</span>'
                f'<a class="btn sm" data-level-link="{post["level"]}" href="/">Play it · 1 min</a></div>')
    nav = ""
    if post["kind"] == "series":
        items = "".join(
            f'<li class="here">{e(p["title"])}</li>' if p["slug"] == post["slug"]
            else f'<li><a href="/notes/{p["slug"]}/">{e(p["title"])}</a></li>' for p in series)
        idx = [p["slug"] for p in series].index(post["slug"])
        nxt = series[idx + 1] if idx + 1 < len(series) else None
        next_link = f'<a class="next-link" href="/notes/{nxt["slug"]}/">Next: {e(nxt["title"])} →</a>' if nxt else ""
        nav = f'{next_link}<aside class="series" aria-label="Series"><div class="k">The new PM workflow · series</div><ol>{items}</ol></aside>'
    else:
        nav = '<aside class="series"><div class="k">Want this for your team?</div><p style="margin:8px 0 0">This is what the <a href="/work/">AI Feature Eval Kit</a> is for.</p></aside>'
    return (
        HEAD.format(title=f"{e(post['title'])} · mostlypm", description=e(post["dek"]), url=url,
                    og_title=e(post["title"]), og_type="article", notes_current="")
        + f"""  <article class="read-wrap">
    <a class="crumb" href="/notes/">← All notes</a>
    <header class="read-head">
      <div class="k">{e(post['kicker'])}</div>
      <h1>{e(post['title'])}</h1>
      <p class="dek">{e(post['dek'])}</p>
      <div class="meta"><span>Gayatri</span><span>{e(post['date'])}</span></div>
    </header>
    {play}
    <div class="paper">
{post['body']}
    </div>
    <aside class="author-box" aria-label="About the author">
      <div class="k">About the author</div>
      <p>I'm Gayatri, a product manager in enterprise software. Right now I'm leading product on an AI-powered due-diligence platform in financial services, where I write the requirements, prototype the screens, and build the quality checks that tell us whether the AI is getting better or worse. I work hands-on with AI coding agents, so the gap between "here's the spec" and "here's a working version you can test" is days, not quarters.</p>
      <a href="/work/">Work with me →</a>
    </aside>
    {nav}
  </article>
"""
        + FOOT
    )


def card(p):
    cls = "post case" if p["kind"] == "case" else "post"
    k = p["kicker"]
    return (f'      <a class="{cls}" href="/notes/{p["slug"]}/"><span class="k">{e(k)}</span>'
            f'<span class="t">{e(p["title"])}</span><span class="s">{e(p["dek"])}</span></a>\n')


def notes_index(posts):
    cards = "".join(card(p) for p in posts)
    return (
        HEAD.format(title="Notes · mostlypm",
                    description="A PM's honest journey into AI: real experiments, working prompts, things that failed.",
                    url=f"{SITE_URL}/notes/", og_title="Notes · mostlypm", og_type="website",
                    notes_current=' aria-current="page"')
        + f"""  <section class="sec" style="border-top:0">
    <h2>Notes</h2>
    <p class="lead">A PM's honest journey into AI: real experiments, working prompts, things that failed, things that surprised me.</p>
    <div class="log">
{cards}    </div>
  </section>
"""
        + FOOT
    )


def main():
    posts = sorted((parse(p) for p in CONTENT.glob("*.md")), key=lambda p: p["order"])
    for post in posts:
        out = ROOT / "notes" / post["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(post_page(post, posts), encoding="utf-8")
        print("wrote", out.relative_to(ROOT))
    (ROOT / "notes" / "index.html").write_text(notes_index(posts), encoding="utf-8")
    print("wrote notes/index.html")

    hub = ROOT / "index.html"
    text = hub.read_text(encoding="utf-8")
    cards = "".join(card(p) for p in posts)
    text = re.sub(r"<!-- POSTS -->.*?(?=\s*</div>\s*</section>)", "<!-- POSTS -->\n" + cards.rstrip("\n"), text, count=1, flags=re.S)
    hub.write_text(text, encoding="utf-8")
    print("updated index.html quest log")

    urls = ["/", "/notes/", "/work/"] + [f"/notes/{p['slug']}/" for p in posts]
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "".join(f"  <url><loc>{SITE_URL}{u}</loc></url>\n" for u in urls)
               + "</urlset>\n")
    (ROOT / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    print("wrote sitemap.xml")


if __name__ == "__main__":
    main()
