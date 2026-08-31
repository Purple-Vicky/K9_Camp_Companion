// Dates come straight from data.js, so adding a day there is enough.
const names = Object.keys(data.programme);

const CAMP_YEAR = 2026;

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "22 Aug" -> "Sat". Worked out rather than written down, so it cannot drift
// out of step with the dates if a day is added or moved.
function dayName(date) {
  const bits = String(date).trim().split(/\s+/);
  const day = parseInt(bits[0], 10);
  const month = MONTHS[bits[1]];

  if (!Number.isInteger(day) || month === undefined) return "";

  return WEEKDAYS[new Date(CAMP_YEAR, month, day).getDay()];
}

const isStaff = new URLSearchParams(window.location.search).get("staff") === "true";

let cadetId = new URLSearchParams(window.location.search).get("cadet") || localStorage.getItem("k9CadetId") || "001";

const uniforms = {
  "Greens": "greens",
  "Blues": "blues",
  "Civvies": "civvies",
  "Sports": "sports"
};

// Extra markers shown under an activity. An activity gets a tag when its
// title contains any of the words in "match". Add a line here to give any
// activity its own marker.
const activityTags = [
  { match: ["STEM", "Paintball", "Archery", "Leadership", "Adventure Training", "Drill", "Bridge Building"], tag: "💧 Water bottle" },
  { match: ["AGS"], tag: "✈️ Aircraft" }
];

// ---------------------------------------------------------------------------
// ROSTER — loaded from cadets.csv.
//
// This file is published on the public web, so it deliberately carries NO
// names or ranks. Cadet number, flight, tent and any notice only. A cadet
// identifies themselves by their own number; nothing here identifies a person
// to anyone who does not already have the nominal roll.
//
// DO NOT add name or rank columns to cadets.csv. Keep the nominal roll
// in the camp admin spreadsheet, offline.
//
// To update: in the camp admin sheet, produce a CSV of just these
// columns -- SN, Flight, Tent, Notice -- and upload it over cadets.csv.
// Notice is a per-cadet message shown as an alert; leave it blank for most.
// ---------------------------------------------------------------------------
let roster = {};
let rosterError = "";

// cadets.csv is the roster: SN, Flight, Tent, Notice. Keyed by the padded
// three-digit serial so a lookup straight from the URL parameter works.
function parseRoster(text) {
  const out = {};
  const lines = text.trim().split(/\r?\n/);

  // Tolerate the header row being present or not.
  const start = /^\s*sn\b/i.test(lines[0]) ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const cell = lines[i].split(",");

    if (!cell.length || !cell[0].trim()) continue;

    const n = parseInt(cell[0], 10);

    if (!Number.isInteger(n)) continue;

    out[String(n).padStart(3, "0")] = {
      flight: (cell[1] || "").trim().toUpperCase(),
      tent: (cell[2] || "").trim(),
      // Free text for one cadet, shown to them as an alert. Used for things
      // like a tent move: "GO TO M5".
      notice: (cell[3] || "").trim()
    };
  }

  return out;
}

// Resolves the cadet named in the URL or in localStorage. Always returns a
// record, even for a serial that is not on the roster, so a mistyped number
// shows an empty programme rather than a blank screen.
function cadet() {
  let n = parseInt(cadetId, 10);

  if (!Number.isInteger(n) || n < 1) n = 1;

  const id = String(n).padStart(3, "0");
  const r = roster[id];

  if (!r) return { id, flight: "TBC", tent: "", notice: "", known: false };

  return { id, flight: r.flight || "TBC", tent: r.tent, notice: r.notice, known: true };
}

// ===========================================================================
// MOBILES REGISTER
//
// What each cadet handed in. Published in mobiles.csv:
//
//   SN, Phone, Power bank, Cable, Other, Status, Time
//
// Item columns hold a COUNT, since a cadet may hand in two phones. A tick
// (TRUE, Y, YES, X) reads as 1, so either style works.
//
// Staff edit the grid under More with ?staff=true. Those edits live on that
// device, because a static site has nowhere shared to put them, and they
// override the published file so staff always see the live picture. Export
// when collection is done and upload the result as mobiles.csv, which is what
// puts it on the cadets' phones.
//
// SN and tent are read from cadets.csv and are not editable here.
// Like cadets.csv this file carries numbers only, never names.
// ===========================================================================
const ITEMS = ["Phone", "Power bank", "Cable"];
const STAFF_KEY = "k9MobilesLocal";

let mobiles = {};
let mobilesError = "";
let staffEntries = {};

// Mobiles cells get filled in by hand, so accept a count, a tick, a Y or a
// blank and normalise all of them to a number.
function countOf(v) {
  const s = String(v || "").trim();

  if (!s) return 0;
  if (/^(true|y|yes|x)$/i.test(s)) return 1;

  const n = parseInt(s, 10);

  return Number.isInteger(n) && n > 0 ? n : 0;
}

// mobiles.csv is the published phone and power bank register, same shape as
// the roster parse above.
function parseMobiles(text) {
  const out = {};
  const lines = text.trim().split(/\r?\n/);
  const start = /^\s*sn\b/i.test(lines[0]) ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const cell = lines[i].split(",");
    const n = parseInt(cell[0], 10);

    if (!Number.isInteger(n)) continue;

    out[String(n).padStart(3, "0")] = {
      "Phone": countOf(cell[1]),
      "Power bank": countOf(cell[2]),
      "Cable": countOf(cell[3]),
      other: (cell[4] || "").trim(),
      status: (cell[5] || "").trim().toUpperCase(),
      time: (cell[6] || "").trim(),
      // Asked at hand-in. Both are blank until asked, which is deliberately
      // different from an answer: "" is unknown, "0" is has never flown.
      flown: (cell[7] || "").trim(),
      bronze: (cell[8] || "").trim().toUpperCase()
    };
  }

  return out;
}

// Staff taps live on the staff device until they are published. A corrupt or
// missing store must not stop the page loading, hence the catch.
function loadStaffEntries() {
  try {
    staffEntries = JSON.parse(localStorage.getItem(STAFF_KEY)) || {};
  } catch (e) {
    staffEntries = {};
  }
}

function saveStaffEntries() {
  localStorage.setItem(STAFF_KEY, JSON.stringify(staffEntries));
}

// This device's edits win over the published file.
function mobileRecord(id) {
  return staffEntries[id] || mobiles[id] || null;
}

// Turn a record into the list a cadet reads.
function itemList(rec) {
  if (!rec) return [];

  const out = [];

  ITEMS.forEach(item => {
    const n = rec[item] || 0;

    if (n === 1) out.push(item);
    else if (n > 1) out.push(n + " × " + item);
  });

  (rec.other || "").split(";").forEach(o => {
    const t = o.trim();

    if (t) out.push(t);
  });

  return out;
}

// Collection and return times are stamped in local time to match the HH:MM
// strings used everywhere else.
function nowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Tapping a cell cycles 0 -> 1 -> 2 -> 3 -> 0. Most cadets hand in one of a
// thing, so that is a single tap, and there is no fiddly plus/minus pair to
// hit on a phone in the dark.
// Asked at hand-in, when every cadet passes a staff member anyway.
// Blank means not asked; 0 means never flown. Keeping those apart matters,
// because "never flown" is the group that gets priority and "not asked" is
// a cadet still to chase.
function cycleFlown(id, el) {
  const rec = mobileRecord(id) || {};
  const order = ["", "0", "1", "2", "3", "4", "5+"];
  const next = order[(order.indexOf(String(rec.flown || "")) + 1) % order.length];

  const updated = Object.assign({}, rec);

  updated.flown = next;
  updated.time = nowHHMM();

  staffEntries[id] = updated;
  saveStaffEntries();

  el.textContent = next || "–";
  el.className = "qty flown" + (next === "0" ? " never" : next ? " on" : "");

  noteSaved(id);
  updateStaffTotals();
}

// Would they give up York Air Museum for Bronze flying instead?
function cycleBronze(id, el) {
  const rec = mobileRecord(id) || {};
  const order = ["", "Y", "N"];
  const next = order[(order.indexOf(String(rec.bronze || "")) + 1) % order.length];

  const updated = Object.assign({}, rec);

  updated.bronze = next;
  updated.time = nowHHMM();

  staffEntries[id] = updated;
  saveStaffEntries();

  el.textContent = next || "–";
  el.className = "qty bz" + (next === "Y" ? " yes" : next === "N" ? " no" : "");

  noteSaved(id);
  updateStaffTotals();
}

// Writes a tap through to the local store, stamping the collection time when
// the first item of the night comes in.
function cycleItem(id, item, el) {
  const rec = mobileRecord(id) || {};
  const next = ((rec[item] || 0) + 1) % 4;

  const updated = {
    "Phone": rec["Phone"] || 0,
    "Power bank": rec["Power bank"] || 0,
    "Cable": rec["Cable"] || 0,
    other: rec.other || "",
    time: nowHHMM()
  };

  updated[item] = next;

  const total = ITEMS.reduce((n, k) => n + updated[k], 0);

  // Holding nothing means there is nothing to be IN.
  updated.status = total ? (rec.status === "OUT" ? "OUT" : "IN") : "";

  staffEntries[id] = updated;
  saveStaffEntries();

  // Update just this cell and the totals, so the grid does not jump under a
  // thumb mid-collection.
  el.textContent = next || "";
  el.className = "qty" + (next ? " on" : "");

  const state = el.closest("tr").querySelector(".statecell");

  if (state) {
    state.textContent = updated.status;
    state.className = "statecell " + (updated.status === "OUT" ? "out" : updated.status === "IN" ? "in" : "");
  }

  noteSaved(id);
  updateStaffTotals();
  renderMobiles(cadet());
}

// Marks everything a cadet handed in as returned, or undoes it. Cadets who
// handed nothing in are ignored so the button cannot create a phantom record.
function toggleReturned(id, el) {
  const rec = mobileRecord(id);

  if (!rec || !ITEMS.reduce((n, k) => n + (rec[k] || 0), 0)) return;

  const updated = Object.assign({}, rec);

  updated.status = rec.status === "OUT" ? "IN" : "OUT";
  updated.time = nowHHMM();

  staffEntries[id] = updated;
  saveStaffEntries();

  el.textContent = updated.status === "OUT" ? "OUT" : "IN";
  el.className = "statecell " + (updated.status === "OUT" ? "out" : "in");

  noteSaved(id);
  updateStaffTotals();
  renderMobiles(cadet());
}

// Every tap is stored immediately. Say so, or staff have no way to know the
// register is being kept and will wonder whether they need to press something.
function noteSaved(id) {
  const msg = document.getElementById("mMsg");

  if (msg) msg.textContent = "Saved cadet " + id + " on this device at " + formatTime(nowHHMM()) + ".";
}

// Running count in the staff header so the duty NCO can reconcile against the
// tent without counting cells by eye.
function updateStaffTotals() {
  const el = document.getElementById("mTotals");

  if (!el) return;

  let held = 0, cadets = 0;

  Object.keys(roster).forEach(id => {
    const rec = mobileRecord(id);

    if (!rec) return;

    const n = ITEMS.reduce((t, k) => t + (rec[k] || 0), 0);

    if (n && rec.status !== "OUT") { held += n; cadets++; }
  });

  let never = 0, bronze = 0, asked = 0;

  Object.keys(roster).forEach(id => {
    const r = mobileRecord(id);

    if (!r) return;
    if (r.flown !== undefined && r.flown !== "") { asked++; if (String(r.flown) === "0") never++; }
    if (String(r.bronze).toUpperCase() === "Y") bronze++;
  });

  el.textContent = held + " items · " + cadets + " cadets · " + asked + " asked, " + never + " never flown, " + bronze + " want Bronze";
}

// ---------------------------------------------------------------------------
// PUBLISH TO CADETS
//
// Commits mobiles.csv straight to the repo through the GitHub API, so the
// register reaches cadets' phones without exporting a file and uploading it
// by hand.
//
// This needs a GitHub token, which is entered on the staff device and kept in
// that device's local storage. It is never committed and never leaves the
// browser except in the request to github.com.
//
// Use a FINE-GRAINED token limited to this one repository, with Contents set
// to read and write and nothing else, and an expiry at the end of camp. Then
// a lost phone means at worst someone can edit this repo until that date,
// rather than reaching the whole account.
//
// Revoke at github.com/settings/personal-access-tokens when camp is over.
// ---------------------------------------------------------------------------
const REPO = "Purple-Vicky/K9_Camp_Companion";
const BRANCH = "main";
const TOKEN_KEY = "k9GhToken";

// The publish token: fine-grained, repo-scoped, and expected to expire at the
// end of camp. It is held unencrypted in localStorage, which is why publishing
// is a staff-device feature and the token is never committed.
function ghToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

// Stored rather than held in memory so the duty NCO does not have to paste the
// token again on every shift change. Clearing the box clears the token.
function saveToken() {
  const box = document.getElementById("mToken");
  const t = box.value.trim();

  if (!t) {
    localStorage.removeItem(TOKEN_KEY);
    setPublishMsg("Token cleared from this device.");
  } else {
    localStorage.setItem(TOKEN_KEY, t);
    setPublishMsg("Token saved on this device. Publish is ready.");
  }

  box.value = "";
  renderPublishState();
}

// Publish status line. Kept separate from the token state so a failed upload
// does not wipe the message saying whether a token is stored.
function setPublishMsg(text) {
  const el = document.getElementById("mPubMsg");

  if (el) el.textContent = text;
}

// Shows whether a token is stored, without ever showing the token itself.
function renderPublishState() {
  const el = document.getElementById("mTokenState");

  if (!el) return;

  const has = !!ghToken();

  el.textContent = has ? "Token set on this device" : "No token on this device — publish will not work yet";
  el.className = "muted small" + (has ? "" : " warn");
}

// UTF-8 safe, since "Other" is free text and may not be plain ASCII.
function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";

  bytes.forEach(b => { bin += String.fromCharCode(b); });

  return btoa(bin);
}

// Commits mobiles.csv to the repo through the GitHub Contents API. Needs the
// current file SHA, so it reads before it writes; a 409 means someone else
// published in between and the read has to be retried.
function publishMobiles() {
  const token = ghToken();

  if (!token) {
    setPublishMsg("Add a GitHub token below first.");
    return;
  }

  const csv = mobilesCsvText();

  if (!csv.count) {
    setPublishMsg("Nothing to publish yet. Record some items first.");
    return;
  }

  const url = "https://api.github.com/repos/" + REPO + "/contents/mobiles.csv";
  const headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json"
  };

  setPublishMsg("Publishing…");

  // Read what is already published first, for two reasons: the API needs the
  // file's sha to replace it, and other staff may have published cadets this
  // device knows nothing about. Overwriting with only this device's entries
  // would wipe their work, so the two are merged.
  fetch(url + "?ref=" + BRANCH, { headers, cache: "no-cache" })
    .then(r => (r.ok ? r.json() : r.status === 404 ? {} : Promise.reject(r)))
    .then(current => {
      let merged = {};

      if (current.content) {
        // atob gives bytes; decode them as UTF-8.
        const bin = atob(current.content.replace(/\n/g, ""));
        const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));

        merged = parseMobiles(new TextDecoder().decode(bytes));
      }

      // This device's entries are the newer word on the cadets it touched.
      Object.keys(staffEntries).forEach(id => { merged[id] = staffEntries[id]; });

      const text = mobilesCsvFrom(merged);

      return fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: "Update mobiles register (" + text.count + " cadets, " + formatTime(nowHHMM()) + ")",
          content: toBase64(text.text + "\n"),
          branch: BRANCH,
          sha: current.sha
        })
      }).then(r => (r.ok ? r.json() : Promise.reject(r))).then(() => text.count);
    })
    .then(total => {
      // Everything on this device is now published. Clearing it means a later
      // publish by someone else is not overridden by this device's stale copy.
      staffEntries = {};
      saveStaffEntries();

      return loadMobiles().then(() => {
        const grid = document.getElementById("mobilesStaff");

        if (grid) grid.dataset.built = "";

        renderStaffGrid();
        renderMobiles(cadet());
        setPublishMsg("Published. " + total + " cadet(s) now on the register. Cadets will see it in a minute or two.");
      });
    })
    .catch(err => {
      const status = err && err.status;

      if (status === 401) setPublishMsg("GitHub rejected the token. It may be wrong or expired — add it again below.");
      else if (status === 403) setPublishMsg("Token lacks permission. It needs Contents: read and write on this repository.");
      else if (status === 404) setPublishMsg("Repository or file not found. Check the token covers " + REPO + ".");
      else if (status === 409) setPublishMsg("Someone else changed mobiles.csv. Reload the page and publish again.");
      else setPublishMsg("Could not publish — no signal, or GitHub is unreachable. Your entries are still saved on this device.");
    });
}

// Build the file from an arbitrary set of records, so the same code serves
// both a local save and a merged publish.
function mobilesCsvFrom(records) {
  const rows = ["SN,Phone,Power bank,Cable,Other,Status,Time,Flown,Bronze"];

  Object.keys(records).sort().forEach(id => {
    const rec = records[id];

    if (!rec) return;

    // A cadet who handed nothing in may still have answered the flying
    // questions, so keep the row if there is anything at all to keep.
    const held = ITEMS.reduce((n, k) => n + (rec[k] || 0), 0);

    if (!held && !rec.flown && !rec.bronze) return;

    rows.push([
      parseInt(id, 10),
      rec["Phone"] || "",
      rec["Power bank"] || "",
      rec["Cable"] || "",
      (rec.other || "").replace(/,/g, ";"),
      rec.status || "",
      rec.time || "",
      rec.flown || "",
      rec.bronze || ""
    ].join(","));
  });

  return { text: rows.join("\n"), count: rows.length - 1 };
}

// What this device would save: the published register with its own edits on
// top, which is also what the grid is showing.
function mobilesCsvText() {
  const merged = {};

  Object.keys(mobiles).forEach(id => { merged[id] = mobiles[id]; });
  Object.keys(staffEntries).forEach(id => { merged[id] = staffEntries[id]; });

  return mobilesCsvFrom(merged);
}

// Save the register as a real mobiles.csv file. Some phone browsers refuse a
// script-triggered download, so if that happens the text is shown to copy
// instead rather than the button appearing to do nothing.
function saveMobilesCsv() {
  const csv = mobilesCsvText();
  const msg = document.getElementById("mMsg");

  if (!csv.count) {
    msg.textContent = "Nothing to save yet. Record some items first.";
    return;
  }

  try {
    const blob = new Blob([csv.text], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "mobiles.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    msg.textContent = "Saved mobiles.csv with " + csv.count + " cadet(s). Upload it to the repo to show it on cadets' phones.";
  } catch (e) {
    showMobilesText();
    msg.textContent = "This browser blocked the download. Copy the text below and save it as mobiles.csv.";
  }
}

// Fallback for when publishing is not available: put the CSV on screen so it
// can be copied off the device by hand.
function showMobilesText() {
  const csv = mobilesCsvText();
  const out = document.getElementById("mExport");

  out.value = csv.text;
  out.hidden = false;
  out.select();

  document.getElementById("mMsg").textContent =
    csv.count + " cadet(s). Copy this and save it as mobiles.csv.";
}

// Destructive and unrecoverable once the tab is closed, so it confirms first.
function clearStaffEntries() {
  if (!confirm("Clear every mobile entry held on this device? Export first if you have not uploaded them.")) return;

  staffEntries = {};
  saveStaffEntries();

  const grid = document.getElementById("mobilesStaff");

  if (grid) grid.dataset.built = "";

  renderStaffGrid();
  renderMobiles(cadet());
}

// Built once. After that only the tapped cell and the totals change, so the
// grid never jumps while staff are working down it.
// ---------------------------------------------------------------------------
// STAFF DAY OVERVIEW (?staff=true)
//
// Staff need the whole day at a glance, not one cadet's view: every flight
// side by side so it is obvious who is where and who has moved. Built from
// the same data as the cadet view, so the two cannot disagree.
// ---------------------------------------------------------------------------
const FLIGHTS = ["A", "B", "C", "D"];

// Everything one flight does on a date, ignoring any individual cadet.
function flightItems(date, f) {
  const p = data.programme[date];

  if (!p) return [];

  return [...(p.items || []), ...((p.flights && p.flights[f]) || [])].sort(byTime);
}

// Staff copy of one day's programme, including the per-flight splits that the
// cadet view hides behind whichever flight that cadet is in.
function renderStaffDay() {
  const box = document.getElementById("staffDay");

  if (!box) return;

  box.hidden = !isStaff;

  if (!isStaff) return;

  const date = staffDayDate || todayOrFirst();
  const p = data.programme[date];

  if (!p) { box.innerHTML = ""; return; }

  // Every distinct start time across the four flights, in order.
  const times = [];

  FLIGHTS.forEach(f => flightItems(date, f).forEach(i => {
    if (times.indexOf(i.time) === -1) times.push(i.time);
  }));

  times.sort((a, b) => toMinutes(a) - toMinutes(b));

  const moves = p.flightMoves || {};
  const movedBy = {};

  Object.keys(moves).forEach(id => {
    movedBy[moves[id]] = (movedBy[moves[id]] || []).concat(id);
  });

  const headCount = {};

  Object.keys(roster).forEach(id => {
    const f = moves[id] || roster[id].flight;
    headCount[f] = (headCount[f] || 0) + 1;
  });

  const rows = times.map(t => {
    const cells = FLIGHTS.map(f => {
      const hit = flightItems(date, f).filter(i => i.time === t);

      if (!hit.length) return `<td class="none"></td>`;

      // Whole-camp items look the same in every column; mark them once.
      const common = (p.items || []).some(i => i.time === t && i.title === hit[0].title);

      return `<td class="${common ? "common" : ""}">
        <b>${esc(hit[0].title)}</b>
        ${hit[0].location ? `<span class="where">${esc(hit[0].location)}</span>` : ""}
      </td>`;
    }).join("");

    const label = formatTime(t);

    return `<tr><th scope="row">${esc(label)}</th>${cells}</tr>`;
  }).join("");

  const dayPicker = names.map(d =>
    `<option value="${esc(d)}"${d === date ? " selected" : ""}>${esc(dayName(d))} ${esc(d)}</option>`
  ).join("");

  box.innerHTML = `
    <div class="card">
      <div class="section-title">
        <h2>🗓️ Day overview</h2>
        <span class="pill ${uniformClass(p.uniform)}">${esc(p.uniform.toUpperCase())}</span>
      </div>

      <select id="staffDayPick" onchange="setStaffDay(this.value)">${dayPicker}</select>

      ${Object.keys(moves).length
        ? `<p class="muted small">Moved today: ${FLIGHTS.filter(f => movedBy[f]).map(f =>
            `<b>${esc(f)}</b> &larr; ${movedBy[f].map(esc).join(", ")}`).join(" &nbsp;·&nbsp; ")}</p>`
        : ""}

      <div class="gridwrap">
        <table class="daygrid">
          <thead>
            <tr><th></th>${FLIGHTS.map(f =>
              `<th>${esc(f)}<span class="hc">${headCount[f] || 0}</span></th>`).join("")}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <p class="muted small">Shaded rows are whole-camp. A blank cell means that flight has nothing scheduled at that time.</p>
    </div>
  `;
}

let staffDayDate = "";

// Defaults the staff view to the real date while camp is running, and to the
// first day of camp outside it.
function todayOrFirst() {
  const now = new Date();
  const guess = `${now.getDate()} Aug`;

  return (now.getMonth() === 7 && names.indexOf(guess) > -1) ? guess : names[0];
}

function setStaffDay(d) {
  staffDayDate = d;
  renderStaffDay();
}

// The mobiles grid: a row per cadet in flight then serial order, matching the
// order the paper collection sheets are printed in.
function renderStaffGrid() {
  const box = document.getElementById("mobilesStaff");

  if (!box) return;

  box.hidden = !isStaff;

  if (!isStaff) return;

  if (box.dataset.built === "1") {
    updateStaffTotals();
    return;
  }

  const ids = Object.keys(roster).sort();

  if (!ids.length) {
    box.innerHTML = `<div class="card"><h2>📱 Mobiles</h2><p class="muted">Waiting for cadets.csv.</p></div>`;
    return;
  }

  const rows = ids.map(id => {
    const r = roster[id];
    const rec = mobileRecord(id) || {};

    const cells = ITEMS.map(item => {
      const n = rec[item] || 0;

      return `<td><button type="button" class="qty${n ? " on" : ""}" onclick="cycleItem('${id}','${item}',this)" aria-label="${item} for cadet ${id}">${n || ""}</button></td>`;
    }).join("");

    const state = rec.status === "OUT" ? "OUT" : (rec.status === "IN" ? "IN" : "");
    const fl = String(rec.flown || "");
    const bz = String(rec.bronze || "");

    return `
      <tr>
        <th scope="row">${esc(id)}</th>
        <td class="fixed">${esc(r.tent || "—")}</td>
        ${cells}
        <td><button type="button" class="qty flown${fl === "0" ? " never" : fl ? " on" : ""}" onclick="cycleFlown('${id}',this)" aria-label="Flights flown by cadet ${id}">${esc(fl || "–")}</button></td>
        <td><button type="button" class="qty bz${bz === "Y" ? " yes" : bz === "N" ? " no" : ""}" onclick="cycleBronze('${id}',this)" aria-label="Bronze instead of York for cadet ${id}">${esc(bz || "–")}</button></td>
        <td><button type="button" class="statecell ${state === "OUT" ? "out" : state === "IN" ? "in" : ""}" onclick="toggleReturned('${id}',this)" aria-label="Handed in or returned for cadet ${id}">${state}</button></td>
      </tr>
    `;
  }).join("");

  box.innerHTML = `
    <div class="card">
      <div class="section-title"><h2>📱 Mobiles register</h2><span class="pill info" id="mTotals"></span></div>
      <p class="muted small">Tap to change. <b>Flown</b> is how many AEF flights they have had before: – means not asked, <b>0</b> means never. <b>Bronze</b> is whether they would give up York for Bronze flying: Y, N or – if not asked.</p>

      <div class="gridwrap">
        <table class="mgrid">
          <thead>
            <tr><th>SN</th><th>Tent</th><th>📱</th><th>🔋</th><th>🔌</th><th>Flown</th><th>Bronze</th><th>State</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <textarea id="mExport" rows="6" hidden readonly></textarea>
      <p class="muted small" id="mMsg">Edits are held on this device. Export and upload mobiles.csv to show them to cadets.</p>
      <button type="button" class="big-btn" onclick="publishMobiles()">PUBLISH TO CADETS</button>
      <p class="muted small" id="mPubMsg">Sends the register straight to the app, so cadets can see it.</p>
      <p class="muted small" id="mTokenState"></p>

      <details>
        <summary class="small">GitHub token (set once per device)</summary>
        <p class="muted small">Create a <b>fine-grained</b> token at github.com/settings/personal-access-tokens, limited to this repository, with <b>Contents: read and write</b> and an expiry at the end of camp. Paste it here. It stays on this device.</p>
        <input id="mToken" type="password" placeholder="github_pat_…" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button type="button" class="big-btn ghost" onclick="saveToken()">SAVE TOKEN ON THIS DEVICE</button>
      </details>

      <details>
        <summary class="small">If publishing will not work</summary>
        <p class="muted small">Publishing needs a signal. With none, get the register off this device by hand and upload it as mobiles.csv when you are back in range.</p>
        <button type="button" class="big-btn ghost" onclick="saveMobilesCsv()">SAVE AS A FILE</button>
        <button type="button" class="big-btn ghost" onclick="showMobilesText()">SHOW TEXT TO COPY</button>
      </details>

      <details>
        <summary class="small">Danger zone</summary>
        <p class="muted small">Wipes every entry held on this device. Anything not yet published is lost.</p>
        <button type="button" class="big-btn ghost" onclick="clearStaffEntries()">CLEAR THIS DEVICE</button>
      </details>
    </div>
  `;

  box.dataset.built = "1";
  updateStaffTotals();
  renderPublishState();
}

// What one cadet sees.
function renderMobiles(c) {
  const box = document.getElementById("mobiles");

  if (!box) return;

  const rec = mobileRecord(c.id);
  const items = itemList(rec);

  let body, pill;

  if (mobilesError && !rec) {
    body = `<p class="muted">${esc(mobilesError)}</p>`;
    pill = "";
  } else if (!items.length) {
    body = `<p class="muted">Nothing recorded against Cadet ${esc(c.id)}. If you handed something in, speak to your Flight Staff.</p>`;
    pill = `<span class="pill info">NONE RECORDED</span>`;
  } else {
    const out = rec.status === "OUT";

    body = `
      <p>${out ? "Returned to you" : "Held by staff"}:</p>
      <p class="items">${items.map(i => `<span class="tag">${esc(i)}</span>`).join("")}</p>
      ${rec.time ? `<p class="muted small">Updated ${esc(formatTime(rec.time))}</p>` : ""}
    `;
    pill = `<span class="pill ${out ? "greens" : "info"}">${out ? "RETURNED" : "HANDED IN"}</span>`;
  }

  box.innerHTML = `
    <div class="card">
      <div class="section-title"><h2>📱 Mobiles</h2>${pill}</div>
      ${body}
      <p class="muted small">Staff hold the register. This shows what is recorded against your cadet number.</p>
    </div>
  `;
}

// Remembered so a cadet only types their number once on their own phone.
function setId(v) {
  cadetId = v;
  localStorage.setItem("k9CadetId", v);
  render();
}

// Text from data.js goes into innerHTML, so escape it.
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

// Comparable integer for sorting and for finding what is on next.
function toMinutes(time) {
  const [h, m] = String(time).split(":");
  return Number(h) * 60 + Number(m);
}

// Times are stored as "HH:MM" in data.js so they sort and compare correctly.
// Everything shown to a cadet goes through here and comes out military style:
// "07:00" becomes "0700 hrs".
function formatTime(time) {
  const parts = String(time).split(":");

  if (parts.length !== 2) return String(time);

  return parts[0].padStart(2, "0") + parts[1].padStart(2, "0") + " hrs";
}

// An unparseable time, such as "TBC", sorts to the top of the day rather than
// landing at random, so an unconfirmed slot is the first thing a cadet sees.
function byTime(a, b) {
  const x = toMinutes(a.time);
  const y = toMinutes(b.time);

  return (Number.isNaN(x) ? -1 : x) - (Number.isNaN(y) ? -1 : y);
}

// Everything a cadet does on a given day: the whole-camp items, their own
// flight's rotation, and their flying slot if they have one.
function itemsFor(date) {
  const p = data.programme[date];

  if (!p) return [];

  const c = cadet();
  const items = [...(p.items || [])];

  // A day can move a cadet into another flight just for that day, without
  // touching the roster. Used when flying pulls cadets out of their own flight.
  const flight = (p.flightMoves && p.flightMoves[c.id]) || c.flight;

  if (p.flights) {
    items.push(...(p.flights[flight] || []));
  }

  const slot = flyingSlotFor(date, c.id);

  // Being listed at all is the allocation; a standby is listed as RESERVE
  // rather than a time. AEF takes the whole day, so a cadet with no specific
  // slot time is out all day rather than free until some unknown moment --
  // showing a bare "TBC" would have them waiting around for a time that is
  // never coming.
  if (slot !== null && slot !== undefined) {
    const reserve = isReserve(slot);
    const timed = !reserve && slot && !/^tbc$/i.test(slot);

    items.push({
      time: timed ? slot : "TBC",
      allDay: !timed,
      title: reserve ? "Flying Reserve" : "Air Experience Flying",
      location: reserve ? "" : data.flying.location,
      note: reserve
        ? "Standby all day, in case a slot frees up."
        : (timed ? data.flying.note : "At the AEF line all day. " + data.flying.note),
      uniform: "Greens"
    });
  }

  return items.sort(byTime);
}

// A cadet's slot on a given flying day, or null if they are not on that list.
function flyingSlotFor(date, id) {
  const day = data.flying && data.flying.days && data.flying.days[date];
  return day ? day[id] : null;
}

// A standby rather than a booked slot.
function isReserve(v) {
  return String(v).trim().toUpperCase() === "RESERVE";
}

// The item wins if it names a uniform, otherwise the day does. There is
// deliberately no activity-name lookup: one used to silently override the day
// for nine named activities, so a day set to Civvies still showed Greens for
// Leadership. What data.js says is now what cadets see.
function uniformForItem(item, dayUniform) {
  return item.uniform || dayUniform || "TBC";
}

// Maps a uniform name to its colour class; unknown names simply get no colour.
function uniformClass(uniform) {
  return uniforms[uniform] || "";
}

// Single entry point for a redraw. Everything that changes what the cadet sees
// funnels through here rather than patching the DOM in place.
function render() {
  const c = cadet();

  document.querySelectorAll("[data-id]").forEach(x => {
    x.textContent = c.id;
  });

  document.querySelectorAll("[data-flight]").forEach(x => {
    x.textContent = "Flight " + c.flight;
  });

  document.querySelectorAll("[data-tent]").forEach(x => {
    x.textContent = c.tent ? "Tent " + c.tent : "";
    x.hidden = !c.tent;
  });

  document.querySelectorAll("[data-roster-error]").forEach(x => {
    x.textContent = rosterError;
    x.hidden = !rosterError;
  });

  renderAlerts(c);

  renderWeek(c);
  renderMobiles(c);
  renderStaffDay();
  renderStaffGrid();
  renderFlying(c);
}

// A cadet's own message from the Notice column of cadets.csv. Sits at the top
// of the home screen so a tent move is not something they have to go looking
// for.
function renderAlerts(c) {
  const box = document.getElementById("alerts");

  if (!box) return;

  const notice = c.notice || "";

  box.innerHTML = `
    <div class="card${notice ? " alert" : ""}">
      <div class="section-title">
        <h2>📢 K9 Alerts</h2>
        <span>${notice ? "❗" : "🐾"}</span>
      </div>
      ${notice
        ? `<p class="noticetext">${esc(notice)}</p>
           <p class="muted small">For Cadet ${esc(c.id)}. Ask your Flight Staff if you are unsure.</p>`
        : `<p class="muted">No new alerts.</p>`}
    </div>
  `;
}

// One activity row.
function eventHtml(item, dayUniform) {
  let label = "";

  if (item.type === "meal") {
    label = item.title === "Lunch"
      ? `<span class="pill info">🥪 PACKED LUNCH</span>`
      : `<span class="pill info">🍽️ MEAL</span>`;
  } else if (item.type === "lightsout") {
    label = `<span class="pill info">🧸 LIGHTS OUT</span>`;
  } else {
    const uniform = uniformForItem(item, dayUniform);
    label = `<span class="pill ${uniformClass(uniform)}">👕 ${esc(uniform.toUpperCase())}</span>`;
  }

  const tags = activityTags
    .filter(t => t.match.some(a => item.title.includes(a)))
    .map(t => `<span class="tag">${t.tag}</span>`)
    .join("");

  return `
    <div class="event">
      <div class="time">${item.allDay
        ? `<span class="allday">ALL<br>DAY</span>`
        : esc(formatTime(item.time)) + (item.end ? `<span class="until">–${esc(formatTime(item.end))}</span>` : "")}</div>
      <div>
        <h3>${esc(item.title)}</h3>
        ${label}
        ${item.location ? `<p class="muted small">📍 ${esc(item.location)}</p>` : ""}
        ${item.note ? `<p>${esc(item.note)}</p>` : ""}
        ${tags}
      </div>
    </div>
  `;
}

// Which dates a cadet may see. Staff see everything; cadets see up to the
// date camp.showUpTo names, so a plan that has not been confirmed is not read
// as gospel the night before.
function visibleDates() {
  if (isStaff) return names;

  const setting = String((data.camp && data.camp.showUpTo) || "today").trim();

  if (/^all$/i.test(setting)) return names;

  const today = todayOrFirst();
  const from = names.indexOf(today);
  const cutoff = /^today$/i.test(setting) ? today : setting;
  const to = names.indexOf(cutoff);

  // An unrecognised date is safer read as "today" than as "everything".
  if (to === -1 || to < from) return [today];

  // Days already gone are dropped as well: a cadet wants today and whatever
  // has been released, not a record of Saturday.
  return names.slice(from, to + 1);
}

// The week view, limited to the days visibleDates() allows.
function renderWeek(c) {
  const box = document.getElementById("week");

  if (!box) return;

  const shown = visibleDates();
  const last = names.indexOf(shown[shown.length - 1]);
  const held = names.length - 1 - last;

  box.innerHTML = shown.map(date => {
    const p = data.programme[date];
    // Two optional per-day overrides. flightMoves puts a named cadet with a
    // different flight for that day only, and is in use. flightNames renames
    // the flights for one day; nothing sets it now, but the read is kept
    // because the programme has used it before and absent keys fall through
    // harmlessly. Either way, show the cadet the name they will be called by.
    const dayFlight = (p.flightMoves && p.flightMoves[c.id]) || c.flight;
    const alias = p.flightNames && p.flightNames[dayFlight];
    const moved = p.flightMoves && p.flightMoves[c.id];

    return `
      <div class="card">
        <div class="section-title">
          <h2>${esc(dayName(date))} ${esc(date)}</h2>
          <span class="pill ${uniformClass(p.uniform)}">DAY: ${esc(p.uniform.toUpperCase())}</span>
        </div>
        ${moved ? `<p class="noticetext" style="font-size:15px">Today you are with <b>Flight ${esc(moved)}</b>, not ${esc(c.flight)}.</p>` : ""}
        ${alias ? `<p class="muted small">You are <b>${esc(alias)}</b> today (Flight ${esc(dayFlight)}).</p>` : ""}
        ${itemsFor(date).map(item => eventHtml(item, p.uniform)).join("")}
      </div>
    `;
  }).join("") + (held
    ? `<div class="card held">
         <div class="section-title"><h2>🔒 Rest of the week</h2><span class="pill info">${held} DAY${held > 1 ? "S" : ""}</span></div>
         <p class="muted">The next day is released once staff have confirmed it. Check back in the morning, or ask your Flight Staff.</p>
       </div>`
    : "");

  updateNextUp(c);
}

// The flying view: this cadet's slots across every flying day, booked or
// reserve, plus the days flying was cancelled.
function renderFlying(c) {
  const box = document.getElementById("flying");

  if (!box) return;

  const slots = Object.keys(data.flying.days)
    .map(date => ({ date, time: flyingSlotFor(date, c.id) }))
    .filter(s => s.time !== null && s.time !== undefined);

  // Count one day, not the week. Totalling every day gave a number like "22
  // flying", which is true of the camp and useless to the cadet reading it.
  // Show the day they are on if they have one, otherwise today.
  const countDate = (slots[0] && slots[0].date) || todayOrFirst();
  const dayList = data.flying.days[countDate] || {};

  let booked = 0, standby = 0;

  Object.keys(dayList).forEach(id => {
    if (isReserve(dayList[id])) standby++;
    else booked++;
  });

  // Where they sit in the order cadets are called forward.
  const queued = (data.flying.priority || []).indexOf(c.id) + 1;

  const paperwork = `<p class="muted small">Your TG 21, TG 23, AVMED1 and medical review form must be with staff before you can fly.</p>`;

  box.innerHTML = `
    <div class="card">
      <div class="section-title">
        <h2>✈️ Flying</h2>
        ${isStaff && booked ? `<span class="pill blues">${esc(dayName(countDate))} ${esc(countDate)} · ${booked} FLYING${standby ? " · " + standby + " RES" : ""}</span>` : ""}
      </div>
      ${slots.length
        ? slots.map(s => isReserve(s.time)
            ? `<p class="items"><span class="pill info">RESERVE</span></p>
               <p>You are a <b>reserve</b> for flying on ${esc(s.date)}.</p>
               <p class="muted">You are not booked on. Be ready in case a slot frees up, and check with your Flight Staff on the day.</p>`
            : eventHtml({
                time: s.time || "TBC",
                // No specific time means the whole day at AEF, not an unknown
                // moment to hang around waiting for.
                allDay: !s.time || /^tbc$/i.test(s.time),
                title: "Air Experience Flying",
                location: data.flying.location,
                note: s.date + " • " + (!s.time || /^tbc$/i.test(s.time)
                  ? "At the AEF line all day. " + data.flying.note
                  : data.flying.note),
                uniform: "Greens"
              }, "Greens")).join("")
          + (queued ? `<p class="muted">You are <b>number ${queued}</b> in the order cadets are called forward.</p>` : "")
          + paperwork
        : queued
          ? `<p class="items"><span class="pill info">ON THE LIST</span></p>
             <p>You are <b>number ${queued}</b> in the order for Air Experience Flying.</p>
             <p class="muted">The day is not fixed yet. Your slot will appear here once staff confirm it, and in My Week too.</p>` + paperwork
          : `<p class="muted">No flying slot allocated to Cadet ${esc(c.id)}. Staff will add slots as they are confirmed.</p>`}
    </div>
  `;
}

// The Next Up card. Picks the next event today by clock time, and falls
// through to the first event of the next visible day once today is done.
function updateNextUp(c) {
  const next = document.getElementById("next");

  if (!next) return;

  const now = new Date();
  const campStart = new Date(2026, 7, 22, 0, 0);
  const campEnd = new Date(2026, 7, 28, 23, 59);

  let targetDate;

  if (now < campStart) {
    targetDate = names[0];
  } else {
    targetDate = `${now.getDate()} Aug`;

    if (now.getMonth() !== 7 || !names.includes(targetDate)) {
      targetDate = names[names.length - 1];
    }
  }

  let nextItem = null;

  if (now >= campStart && now <= campEnd) {
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    nextItem = itemsFor(targetDate).find(item => toMinutes(item.time) > minutesNow);

    if (!nextItem) {
      // Rolling into tomorrow would show the first item of a day that is
      // still being held back, so only roll as far as the cadet may see.
      const shown = visibleDates();
      const index = shown.indexOf(targetDate);

      if (index >= 0 && index < shown.length - 1) {
        targetDate = shown[index + 1];
        nextItem = itemsFor(targetDate)[0] || null;
      }
    }
  } else {
    nextItem = itemsFor(targetDate)[0] || null;
  }

  const special = nextItem && (nextItem.type === "meal" || nextItem.type === "lightsout");

  const nextUniform = nextItem && !special
    ? uniformForItem(nextItem, data.programme[targetDate].uniform)
    : "";

  next.innerHTML = `
    <small>🐾 K9 SAYS… NEXT UP</small>
    <h2>${nextItem ? esc(nextItem.title) : "Nothing more today"}</h2>
    <p>
      Cadet ${esc(c.id)} • Flight ${esc(c.flight)}
      ${nextItem ? ` • ${esc(targetDate)} • ${esc(formatTime(nextItem.time))}` : ""}
    </p>
    ${nextItem && nextItem.location ? `<p class="muted small">📍 ${esc(nextItem.location)}</p>` : ""}
    ${nextUniform ? `<span class="pill ${uniformClass(nextUniform)}">👕 ${esc(nextUniform.toUpperCase())}</span>` : ""}
  `;
}

// Tab switching for the five bottom-bar views.
function show(id, btn) {
  document.querySelectorAll(".view").forEach(x => {
    x.classList.remove("active");
  });

  const section = document.getElementById(id);

  if (section) {
    section.classList.add("active");
  }

  document.querySelectorAll(".nav button, .bottom button").forEach(x => {
    x.classList.remove("active");
  });

  if (btn) btn.classList.add("active");
}

// Pull in the roster, then draw. If cadets.csv cannot be read the programme
// still works; only the flight and tent drop out.
function loadRoster() {
  return fetch("cadets.csv", { cache: "no-cache" })
    .then(r => {
      if (!r.ok) throw new Error("cadets.csv returned " + r.status);
      return r.text();
    })
    .then(text => {
      roster = parseRoster(text);

      if (!Object.keys(roster).length) {
        rosterError = "cadets.csv was read but contained no cadets. Columns should be SN, Flight, Tent.";
      }
    })
    .catch(e => {
      roster = {};
      rosterError = "Could not load cadets.csv (" + e.message + "). Flight and tent are unavailable.";
    });
}

// Published register. A missing file is not an error: it just means nothing
// has been collected yet.
function loadMobiles() {
  return fetch("mobiles.csv", { cache: "no-cache" })
    .then(r => {
      if (!r.ok) throw new Error("mobiles.csv returned " + r.status);
      return r.text();
    })
    .then(text => {
      mobiles = parseMobiles(text);
      mobilesError = "";
    })
    .catch(e => {
      mobiles = {};
      mobilesError = "Could not load the mobiles register (" + e.message + "). Ask your Flight Staff what is recorded.";
    });
}

// Boot: load the roster and register, then draw. Called once from index.html.
function start() {
  const input = document.getElementById("cadetInput");

  if (input) {
    input.value = cadet().id;
  }

  loadStaffEntries();

  Promise.all([loadRoster(), loadMobiles()]).then(() => {
    if (input) input.value = cadet().id;
    render();
  });
}

// This file is loaded dynamically, so DOMContentLoaded may already have
// fired by the time it runs. Waiting for an event that has been and gone
// would leave the app blank, so check first.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
