# cdp-roma-2026
AI changes the work. Who changes the people? · CDP · Rome · 26 November 2026

One deck for the whole morning: Part one (Human-AI collaboration), Part two (Change management), Part three (Case sprint).
Open `index.html`. Arrow keys, space or click to advance (left 20% of the screen goes back), `F` for full screen.
`index.html#N` jumps to slide N.

- `G`: chapter navigator.
- `B` or `.`: black screen.
- `T` / `R`: start or pause / reset the countdown on an exercise slide.
- `V`: play or pause the video on screen. The Hinton clip plays from `video/`, offline; if the file is missing it falls back to YouTube.
- `?`: shortcuts.

Zoom tours (Programma 101, the 1920 machine shop, the red flag, the worksheet) advance one detail per click.

## Files
- `index.html`: slides and styles. `stage.js`: controller (reveals, zoom tours, timers, video).
- `img/`: photos (Wikimedia Commons, credited on each slide), CDP and Headspring logos, worksheet pages.
- `video/hinton-radiology.mp4`: Geoff Hinton on radiology, Creative Destruction Lab.
- `FUENTES.md`: every figure and story, with its source and caveats.

## Writing rules
Every line on a slide speaks to the audience. No internal notes, no times outside the agenda, short sentences, short sources ("Source: Paul David, 1990"). Details and caveats live in `FUENTES.md`.

For a local rehearsal: `python3 -m http.server 8765` in this folder, then open `http://localhost:8765/`.
