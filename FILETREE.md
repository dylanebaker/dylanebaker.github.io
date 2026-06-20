# dylanebaker.github.io — File Tree Map

> Live at **dylanebaker.com** · Hosted via GitHub Pages · Branch: `main`

---

## Tree

```
dylanebaker.github.io/
│
├── index.html                         # Home page — hero, featured projects, skills
├── about.html                         # About page — background & hobbies
├── portfolio.html                     # Portfolio index — list of all projects
├── contact.html                       # Contact page — FormSpree form + social links
├── style.css                          # Single global stylesheet (609 lines)
├── CNAME                              # Custom domain: dylanebaker.com
├── README.md                          # Repo readme
│
├── images/                            # Static image assets
│   ├── dylanheadshot.jpg              # Profile photo (JPEG)
│   ├── dylanheadshot.png              # Profile photo (PNG, used in hero)
│   ├── faviconTB.png                  # Favicon — transparent background
│   ├── faviconWB.png                  # Favicon — white background
│   ├── homepagebg.JPEG                # Background image (JPEG)
│   └── homepagebg.png                 # Background image (PNG)
│
├── projects/                          # Per-project detail pages
│   ├── curve-plotter.html             # Curve Plotter write-up + embedded iframe demo
│   ├── memory-tester-game.html        # Memory Game write-up + embedded iframe demo
│   └── algo-visualizer.html           # Sorting Visualizer write-up + embedded iframe demo
│
├── CurvePlotter/                      # Curve Plotter — WebAssembly build (C++ / SDL3)
│   ├── embed.html                     # Wrapper page loaded by iframe in curve-plotter.html
│   ├── index.js                       # Emscripten JS glue
│   ├── index.wasm                     # Compiled WASM binary
│   └── index.data                     # Emscripten data file (assets bundled)
│
├── memory-game-javascript/            # Memory Game — pure JS rewrite (browser-native)
│   ├── index.html                     # Game entry point (standalone + iframe target)
│   ├── game.js                        # Game logic
│   └── ASSETS/
│       ├── FAVICON.png
│       ├── QuinqueFiveFont.ttf        # Custom pixel font
│       ├── backgroundSFX.ogg          # Background music
│       ├── buttonClick.ogg            # Button click SFX
│       ├── lightON.ogg                # Light-on SFX
│       ├── blueBTN.png / blueBTNpressed.png / blueON.png
│       ├── greenBTN.png / greenBTNpressed.png / greenON.png
│       ├── redBTN.png / redBTNpressed.png / redON.png
│       ├── yellowBTN.png / yellowBTNpressed.png / yellowON.png
│       ├── lightOFF.png
│       ├── startBTN.png
│       └── quitBTN.png
│
└── algo-visualizer/                   # Sorting Algorithm Visualizer — Pygame/web build
    └── web/
        ├── index.html                 # Visualizer entry point (standalone + iframe target)
        └── QuinqueFiveFont.ttf        # Custom pixel font
```

---

## Page Map

| Page | URL | Purpose |
|---|---|---|
| Home | `/` → `index.html` | Hero photo, featured project cards, skills tags |
| Portfolio | `/portfolio.html` | Full project list as styled button-links |
| About | `/about.html` | Bio cards (background + hobbies) |
| Contact | `/contact.html` | FormSpree contact form + email/GitHub/LinkedIn links |
| Curve Plotter | `/projects/curve-plotter.html` | Project detail + live WASM iframe |
| Memory Game | `/projects/memory-tester-game.html` | Project detail + live JS iframe |
| Algo Visualizer | `/projects/algo-visualizer.html` | Project detail + live Pygame iframe |

---

## Architecture Notes

- **Single CSS file** — all pages share `style.css` (or `../style.css` from `/projects/`)
- **No build system** — pure HTML/CSS/JS, deployed directly to GitHub Pages
- **No JavaScript on most pages** — `curve-plotter.html` is the only page with inline JS (iframe height sync logic)
- **FormSpree** handles contact form submissions (endpoint: `formspree.io/f/mojklgwe`)
- **Three embedded demos** — each project page iframes its own self-contained build:
  - CurvePlotter: C++ compiled to WASM via Emscripten
  - Memory Game: Rewritten in vanilla JS (was originally Python/Pygbag)
  - Algo Visualizer: Python/Pygame compiled for web (Pygbag or similar)
- **Color palette** (CSS vars): warm browns, sage greens, soft yellow-greens on a near-white base (`#fbfdf5`)
- **Font**: Inter (Google Fonts), weights 300/400/600/700
- **Favicon**: `faviconTB.png` (transparent bg variant used in `<head>`)
- **Custom domain**: set via `CNAME` file → `dylanebaker.com`

---

## Git History (last 10 commits)

| Hash | Message |
|---|---|
| `21573da` | Ported memory game embedded project to JS |
| `7acc03b` | Imported memory game project as a JS project for faster loading |
| `472d2ff` | Imported sorting algorithm visualizer project |
| `65680bf` | Fixed memory-game pygbag export, updated iframe embed |
| `057bf3a` | Imported portfolio projects and updated pages |
| `b8ed849` | Imported curveplotter project |
| `1676193` | Added favicon |
| `69e0387` | Implemented FormSpree forms to handle contact page submissions |
| `c5858b2` | Updated page layouts and design, added contact section and button-links to socials |
| `c19e31c` | Implemented basic page navigation |
