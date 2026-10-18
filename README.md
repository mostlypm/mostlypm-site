# mostlypm.com

Gayatri's site: notes on building products in the AI-native era, played as a **Product Quest**.
*Mostly PM thinking. Fully working product.*

A plain static site: HTML, one CSS file and two small scripts. No framework, nothing to build on the host.

## How the site behaves

- **Quest (home page):** a level map. Start → Understand → Prove → Shape & ship → Co-op mode, plus an optional side quest. Each level is a one-minute mini-game that teaches one post, and every post can also be read directly.
- **Mo, the guide:** greets visitors and offers *Play the quest*, *Just read* or *Classic mode*. Returning visitors get a greeting that matches their progress.
- **A new quest every week:** each ISO week picks one product world (Clinic intake, Loan file review, Support inbox) and shuffles the cases and questions. Everyone sees the same quest that week. Lifetime XP, badges and the weekly streak carry over; the levels reset.
- **Landing:** first-time visitors land on classic mode. Anyone who chooses the game (Play the quest) lands in the game on later visits, until they switch back to classic. **Mood of the day** in the game: Friday is Double XP, weekends are relaxed.
- **Game mode is only the quest** (home page map, Mo, levels). **Notes, posts and Work with me are always classic** (calm reading layout). They link into the game with a "Play the quest" button and "Play it" banners on posts. The home page also has a classic version (hero, How I work, notes), switched with the Classic/Game mode button.
- Progress is stored only in the visitor's browser (localStorage).

## Structure

```
index.html                 Quest home page (the quest log between <!-- POSTS --> markers is generated)
work/index.html            Work with me ("co-op mode": offers and booking)
assets/game.css            All styles, game and classic
assets/game.js             Game engine: weekly rotation, moods, guide, mini-games, XP
assets/quests.js           Game content: worlds, eval cases, questions  <- edit this to keep it fresh
assets/diagrams/*.svg      Flow diagrams used in the series posts
assets/notes/<post>/       Images for a post
content/notes/*.md         Posts (Markdown with a small front-matter block)
notes/                     Generated from content/notes. Don't edit by hand.
scripts/build.py           Turns content/notes into notes/ pages, the quest log and sitemap.xml
```

## Keeping the game fresh

Open `assets/quests.js`:

- **Add a world:** copy one of the `worlds` entries and change its desk scene, eval cases and MVP features. It joins the weekly rotation automatically.
- **Add cases:** add more `cases` to a world. Four are picked each week.
- **Add questions:** add to `start` or `side`.

## Writing a new post

1. Add `content/notes/my-post.md`:
   ```
   ---
   title: My post title
   dek: One-line summary shown under the title
   kicker: AI Learnings
   kind: note          # series | case | note
   level:              # optional: 0-3 or side, links the post to a game level
   order: 10
   date: 2026-11-01
   ---

   Post body in Markdown...
   ```
   An image followed by an italic line becomes a figure with a caption.
2. Build (once: `pip install markdown`): `python3 scripts/build.py`
3. Commit the `.md` file and the generated pages.

## Preview locally

```
python3 -m http.server 8000
```
then open http://localhost:8000. Links are root-relative, so open the site through a server, not as a file.

## Deploy

Any static host works: Cloudflare Pages, Netlify or Vercel. Import this repo, framework "None", no build command, output directory = root. Then add the domain **mostlypm.com** and update its DNS (it currently points at Lovable).

## Still to fill in

**Intro-call form (Work with me page).** Visitors fill in their name, email and what they're building.
1. Create a free form at formspree.io, with your inbox as the address it sends to.
2. Paste the form URL (`https://formspree.io/f/...`) into `data-endpoint` on `#book-form` in `work/index.html`.
Until then the form still works: it opens the visitor's email app with the message ready, addressed to `data-email` (hello@mostlypm.com). So also set up that mailbox, or a forward, where the domain is registered.

## House rules for posts

- No prices in blog posts. Prices live only on the Work with me page (`work/index.html`), so a change is made in one place. End a post with a link to `/work/` instead.
- Game questions must make sense to a first-time visitor (see the note at the top of `assets/quests.js`).
- After changing `assets/game.css`, `game.js` or `quests.js`, bump the `?v=` tag on their links (in `index.html`, `work/index.html` and `scripts/build.py`) so visitors' browsers fetch the new file.
