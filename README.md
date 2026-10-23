# Anchor

**A daily Catholic prayer companion** — live at [candycain5432.github.io/Anchor](https://candycain5432.github.io/Anchor/).

> “We have this as a sure and steadfast anchor of the soul.” — Hebrews 6:19

## What's inside

- **Today**: a greeting, today's liturgical day and vestment color, a time-aware “Now” prayer, your Daily Rule ring, the Verse of the Day (shareable as an image), an AI daily reflection, the Saint of the Day, the Mass readings, this week's feasts, and nearby churches.
- **Pray**:
  - A guided **Rosary** that goes bead by bead with every prayer on screen, the mysteries, haptics and resume.
  - The **Divine Mercy Chaplet**, **Lectio Divina** with today's Gospel, the **Daily Examen**, **Confession** prep, and a **Silent Prayer** / Holy Hour timer with a bell.
  - **Novenas**, a searchable **prayer library** with favorites, and **saints** with a "find a patron" search.
- **Ask Anchor**: streaming AI answers grounded in Church teaching. It can ask about a specific reading or saint, and conversation history stays on your device.
- **Journal**: prayer intentions (pray for them daily, mark them answered, or get "Help me pray"), gratitude, and notes.
- **Me**: streaks, a 12-week prayer heatmap, milestones, your Daily Rule, push reminders at your own times, theme and text size, and backup/restore.

All personal data lives in `localStorage`. The backend is [Project-Veritas](https://github.com/candycain5432/Project-Veritas).

## Structure

No build step: plain HTML, CSS and native ES modules, served by GitHub Pages.

```
index.html          app shell
css/tokens.css      colors, themes, liturgical colors, type scale
css/app.css         components
js/app.js           boot, router, theme, service worker
js/store.js         localStorage wrapper + migration from pre-9.0 keys
js/api.js           every network call (calendar, readings, verse, backend, Wikipedia, Overpass)
js/practices.js     Daily Rule, log, streaks, milestones, launching practices
js/screens/         today, pray, ask, journal, me, saints
js/features/        beads (Rosary/Chaplet), lectio, timer, examen, novena, reader, share-card
js/data/            prayers, novenas, saints
service-worker.js   offline cache, push, notification deep links
```

## Develop

```sh
python -m http.server 8000     # then open http://localhost:8000
```

To point the app at a local backend, run this in the browser console:

```js
localStorage['anchor:apiBase'] = '"http://localhost:3000"'
```

**When you ship changes**, bump `CACHE_NAME` in `service-worker.js` and `VERSION` in `js/screens/me.js`. If you add a JS or CSS file, add it to `STATIC_ASSETS` too.

Console helpers: `Anchor.forceUpdate()`, `Anchor.clearCaches()`, `Anchor.listCaches()`.

Deep links (used by notifications and home-screen shortcuts): `./?open=rosary|chaplet|readings|examen|lectio|confession|ask|journal|me`.
