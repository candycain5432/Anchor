# Advent parish kit

`node tools/advent-kit/kit.mjs` builds the kit into `/data/GitHub/Anchor-Media/advent-kit/` (outside the repo; override with `OUT=`):

- `flyer-letter.pdf`: US Letter color flyer with a QR code (`?utm_source=flyer`)
- `insert-half-letter.pdf`: half-page bulletin insert, black-and-white safe (`?utm_source=bulletin`)
- `social-1080x1350.png`: an image parishes and groups can post
- `announcements.md`: bulletin blurbs, a pulpit announcement, the email to parishes and launch captions (source: `announcements.md` here)
- `icons/og-advent.jpg` in the repo: the link preview for `/advent/`

It needs `tools/reels/node_modules` (playwright-core) and `qrencode`. The designs are in `kit.html` (`?item=flyer|insert|social|og`).
