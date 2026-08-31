# K9 RAFAC Camp Companion

A single-page web app the cadets open on their phones to see their own
programme, their flight, their tent and their flying slots. Staff open the same
page with `?staff=true` and get the whole camp plus the mobile phone register.

Built for RAF Leeming, 22–28 August 2026. No server, no build step, no
dependencies — it is plain HTML, CSS and JavaScript served straight from GitHub
Pages.

**Live:** https://purple-vicky.github.io/K9_Camp_Companion/

---

## Who sees what

| URL | Shows |
|---|---|
| `/` | Cadet view. Asks for a serial, remembers it after that. |
| `/?cadet=019` | Cadet view for serial 019. This is the form printed on wristbands. |
| `/?staff=true` | Staff view: every flight's programme, the mobiles register, publish controls. |

The cadet's number is kept in `localStorage` under `k9CadetId`, so they type it
once.

---

## Files

| File | What it is |
|---|---|
| **`data.js`** | **The programme.** This is the file you edit day to day. |
| `cadets.csv` | Roster: `SN,Flight,Tent,Notice`. 55 cadets. |
| `mobiles.csv` | Published phone / power bank register. Written by the app, not by hand. |
| `script.js` | All the logic. ~1370 lines, commented by section. |
| `index.html` | Page shell and the five tab views. |
| `style.css` | Styling, including the uniform colour classes. |
| `sw.js` | Service worker, so the app opens on a weak signal. |
| `wristbands.html` | Printable sheet of per-cadet QR/URL wristbands. |
| `manifest.webmanifest` | Makes it installable as a home-screen app. |

Everything the app needs is fetched at runtime, so a change to `data.js` or
`cadets.csv` is live as soon as GitHub Pages rebuilds (usually under a minute).

---

## Editing the programme

`data.js` has three top-level keys: `camp`, `programme` and `flying`.

### A day

```js
"26 Aug": {
  uniform: "Civvies",              // the day's default uniform
  items: [                          // things the whole camp does
    { time: "07:00", title: "Breakfast", location: "Dining Facility",
      note: "", type: "meal" },
    { time: "18:00", title: "Free Time", location: "", note: "" }
  ],
  flights: {                        // things one flight does
    A: [ { time: "09:00", title: "Adventure Training", location: "Adrenaline",
           uniform: "Sports", note: "Travel in civvies and change there" } ],
    B: [ ... ], C: [ ... ], D: [ ... ]
  }
}
```

- `items` go to everyone; `flights` go only to that flight. A cadet sees their
  own flight's entries merged into the whole-camp ones, sorted by time.
- `time` and `end` are `"HH:MM"` strings — 24 hour, always two digits, because
  they are sorted and compared as text before being turned into minutes.
- `uniform` and `note` on an individual item override the day's defaults. This
  is how "Bronze Wings cadets stay on camp in MTP" is expressed without
  splitting the flight into two.
- `type` drives the icon: `meal`, `packed`, `lightsout`. Omit it for a normal
  event.

### Two per-day escape hatches

- `flightMoves: { "003": "D" }` — puts one cadet with a different flight for
  that day only. In use.
- `flightNames: { A: "Blue" }` — renames the flights for one day. Nothing sets
  it currently; the code still reads it.

---

## Releasing days to cadets

`camp.showUpTo` controls how far ahead cadets can see, so nobody reads a plan
that has not been confirmed:

```js
showUpTo: "today"    // only today
showUpTo: "26 Aug"   // up to and including that date
showUpTo: "all"      // the whole week
```

Staff with `?staff=true` always see everything regardless of this setting.

---

## Flying

`data.flying.days` maps a date to the cadets on that day's list:

```js
"26 Aug": { "NNN": "09:30", "NNN": "10:15", "NNN": "RESERVE" }
```

The value is the slot time, `"TBC"` if it is not fixed yet, or `"RESERVE"` for a
standby. A day
present but empty (`"27 Aug": {}`) means flying was cancelled — the app says so,
which is deliberate: cadets need to see that it was cancelled, not just that
they are absent from a list.

---

## The mobile phone register

Staff collect phones and power banks each night on the staff view. Tapping a
cell cycles `0 → 1 → 2 → 3 → 0`, because most cadets hand in one of a thing and
that should be a single tap.

Entries are held on the collecting device in `localStorage` (`k9MobilesLocal`)
until they are published. **Publishing commits `mobiles.csv` straight to this
repo** through the GitHub Contents API.

That needs a token, pasted into the staff view once and kept in `localStorage`
under `k9GhToken`. It should be:

- **fine-grained**, with Contents: read and write on this repo only,
- **expiring at the end of camp**,
- **on the duty device only** — it is stored unencrypted, so treat any device
  that has held it as needing the token revoked afterwards.

There is an export button that just shows the CSV as text, for when publishing
is not available and it has to be copied off by hand.

---

## Deploying

Work happens on `feature/roster`, which is mirrored to `main`. GitHub Pages
serves `main`.

```bash
git add -A
git commit -m "what changed"
git push origin feature/roster
git push origin feature/roster:main
```

Pages usually rebuilds within a minute. If a change does not appear, it is
almost always the browser cache rather than the deploy — hard-reload before
going looking for a bug.

### Check `data.js` before you push

There is no build step, so a stray brace in `data.js` takes the whole app down
for every cadet with no warning. Count the braces after editing:

```bash
awk '{o+=gsub(/{/,"{"); c+=gsub(/}/,"}"); a+=gsub(/\[/,"["); b+=gsub(/\]/,"]")} END{print "braces",o,c," brackets",a,b}' data.js
```

Both pairs must match. Then open the page and check the console is clean.

---

## Privacy

This repository is **public**, and anything committed to it stays in the git
history even after it is deleted from the current files.

- The app addresses cadets by **serial number only**. Keep it that way.
- Never commit names, dates of birth, service numbers, medical or consent
  information, next-of-kin details or contact details.
- Never commit a token.

Nominal rolls and anything else carrying personal data belong on the squadron's
own storage, not here.

---

## The printed sheets

The paper side of camp — coach manifests, night duty rotas, phone collection
sheets, flying lists, section rotas — is **not in this repository**. It lives in
a separate folder of HTML files rendered to A4 PDFs, kept on squadron storage
because those sheets do carry names.

They are rendered with headless Chrome:

```bash
chrome.exe --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf=out.pdf sheet.html
```

If a sheet silently loses its last rows, a section has overflowed the page.
Compare the number of `<section` tags in the HTML against `/Count N` in the PDF;
if they differ, something spilled.

---

## Notes for whoever picks this up

- `data.js` is the file you want. Almost every request during camp is a
  `data.js` edit and a push.
- The programme changed daily and often mid-day. Expect to edit it live, and
  expect the printed sheets to need regenerating whenever you do — the two are
  kept in step by hand.
- Times are the fiddly part. Keep them `"HH:MM"`, and remember `end` is
  optional: leave it off for anything without a fixed finish.

---

## State at handover

The camp has run. What is in this repository now is the **structure, not the
data**:

- `cadets.csv` keeps its 55 rows of `SN,Flight,Tent` so the shape of a roster is
  visible. The `Notice` column is empty.
- `mobiles.csv` has its 55 rows and no entries.
- `data.js` keeps the full week's programme, but the cadet allocations have been
  cleared: `flying.priority` and every `flying.days` entry are empty, and
  `flightMoves` is empty. The comments explain the shape each one takes.
- No names, ages, medical information or staff details remain in any file.

To run another camp from this, edit the dates and the programme in `data.js`,
replace `cadets.csv`, and fill the allocations back in.
