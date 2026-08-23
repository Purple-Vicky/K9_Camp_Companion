// Dates come straight from data.js, so adding a day there is enough.
const names = Object.keys(data.programme);

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
  { match: ["STEM", "Paintball", "Archery", "Leadership", "Adventure Training"], tag: "💧 Water bottle" },
  { match: ["AGS"], tag: "✈️ Aircraft" }
];

// ---------------------------------------------------------------------------
// ROSTER — loaded from cadets.csv.
//
// This file is published on the public web, so it deliberately carries NO
// names or ranks. Cadet number, flight, tent and bed only. A cadet
// identifies themselves by their own number; nothing here identifies a person
// to anyone who does not already have the nominal roll.
//
// DO NOT add name or rank columns to cadets.csv. Keep the nominal roll
// in the camp admin spreadsheet, offline.
//
// To update: in the camp admin sheet, produce a CSV of just these three
// columns -- SN, Flight, Tent, Bed -- and upload it over cadets.csv.
// ---------------------------------------------------------------------------
let roster = {};
let rosterError = "";

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
      bed: (cell[3] || "").trim()
    };
  }

  return out;
}

function cadet() {
  let n = parseInt(cadetId, 10);

  if (!Number.isInteger(n) || n < 1) n = 1;

  const id = String(n).padStart(3, "0");
  const r = roster[id];

  if (!r) return { id, flight: "TBC", tent: "", bed: "", known: false };

  return { id, flight: r.flight || "TBC", tent: r.tent, bed: r.bed, known: true };
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
// SN, tent and bed are read from cadets.csv and are not editable here.
// Like cadets.csv this file carries numbers only, never names.
// ===========================================================================
const ITEMS = ["Phone", "Power bank", "Cable"];
const STAFF_KEY = "k9MobilesLocal";

let mobiles = {};
let mobilesError = "";
let staffEntries = {};

function countOf(v) {
  const s = String(v || "").trim();

  if (!s) return 0;
  if (/^(true|y|yes|x)$/i.test(s)) return 1;

  const n = parseInt(s, 10);

  return Number.isInteger(n) && n > 0 ? n : 0;
}

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
      time: (cell[6] || "").trim()
    };
  }

  return out;
}

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

function nowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Tapping a cell cycles 0 -> 1 -> 2 -> 3 -> 0. Most cadets hand in one of a
// thing, so that is a single tap, and there is no fiddly plus/minus pair to
// hit on a phone in the dark.
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

  el.textContent = held + " items held, " + cadets + " cadets";
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

function ghToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

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

function setPublishMsg(text) {
  const el = document.getElementById("mPubMsg");

  if (el) el.textContent = text;
}

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
  const rows = ["SN,Phone,Power bank,Cable,Other,Status,Time"];

  Object.keys(records).sort().forEach(id => {
    const rec = records[id];

    if (!rec) return;
    if (!ITEMS.reduce((n, k) => n + (rec[k] || 0), 0)) return;

    rows.push([
      parseInt(id, 10),
      rec["Phone"] || "",
      rec["Power bank"] || "",
      rec["Cable"] || "",
      (rec.other || "").replace(/,/g, ";"),
      rec.status || "",
      rec.time || ""
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

function showMobilesText() {
  const csv = mobilesCsvText();
  const out = document.getElementById("mExport");

  out.value = csv.text;
  out.hidden = false;
  out.select();

  document.getElementById("mMsg").textContent =
    csv.count + " cadet(s). Copy this and save it as mobiles.csv.";
}

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

    return `
      <tr>
        <th scope="row">${esc(id)}</th>
        <td class="fixed">${esc(r.tent || "—")}</td>
        <td class="fixed">${esc(r.bed || "—")}</td>
        ${cells}
        <td><button type="button" class="statecell ${state === "OUT" ? "out" : state === "IN" ? "in" : ""}" onclick="toggleReturned('${id}',this)" aria-label="Handed in or returned for cadet ${id}">${state}</button></td>
      </tr>
    `;
  }).join("");

  box.innerHTML = `
    <div class="card">
      <div class="section-title"><h2>📱 Mobiles register</h2><span class="pill info" id="mTotals"></span></div>
      <p class="muted small">Tap a number to change it: 0, 1, 2, 3 and back to 0. Tap the last column to mark items returned. Tent and bed come from cadets.csv and cannot be edited here.</p>

      <div class="gridwrap">
        <table class="mgrid">
          <thead>
            <tr><th>SN</th><th>Tent</th><th>Bed</th><th>📱</th><th>🔋</th><th>🔌</th><th>State</th></tr>
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

function byTime(a, b) {
  return toMinutes(a.time) - toMinutes(b.time);
}

// Everything a cadet does on a given day: the whole-camp items, their own
// flight's rotation, and their flying slot if they have one.
function itemsFor(date) {
  const p = data.programme[date];

  if (!p) return [];

  const c = cadet();
  const items = [...(p.items || [])];

  if (p.flights) {
    items.push(...(p.flights[c.flight] || []));
  }

  const slot = flyingSlotFor(date, c.id);

  if (slot) {
    items.push({
      time: slot,
      title: "Flying Slot",
      location: data.flying.location,
      note: data.flying.note
    });
  }

  return items.sort(byTime);
}

function flyingSlotFor(date, id) {
  const day = data.flying && data.flying.days && data.flying.days[date];
  return day ? day[id] : null;
}

// The item wins if it names a uniform, otherwise the day does. There is
// deliberately no activity-name lookup: one used to silently override the day
// for nine named activities, so a day set to Civvies still showed Greens for
// Leadership. What data.js says is now what cadets see.
function uniformForItem(item, dayUniform) {
  return item.uniform || dayUniform || "TBC";
}

function uniformClass(uniform) {
  return uniforms[uniform] || "";
}

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

  renderWeek(c);
  renderMobiles(c);
  renderStaffGrid();
  renderFlying(c);
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
      <div class="time">${esc(formatTime(item.time))}${item.end ? `<span class="until">–${esc(formatTime(item.end))}</span>` : ""}</div>
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

function renderWeek(c) {
  const box = document.getElementById("week");

  if (!box) return;

  box.innerHTML = names.map(date => {
    const p = data.programme[date];

    // Some days call the flights something else -- 25 Aug uses colours. Show
    // the name the cadet will actually be called by on the day.
    const alias = p.flightNames && p.flightNames[c.flight];

    return `
      <div class="card">
        <div class="section-title">
          <h2>${esc(date)}</h2>
          <span class="pill ${uniformClass(p.uniform)}">DAY: ${esc(p.uniform.toUpperCase())}</span>
        </div>
        ${alias ? `<p class="muted small">You are <b>${esc(alias)}</b> today (Flight ${esc(c.flight)}).</p>` : ""}
        ${itemsFor(date).map(item => eventHtml(item, p.uniform)).join("")}
      </div>
    `;
  }).join("");

  updateNextUp(c);
}

function renderFlying(c) {
  const box = document.getElementById("flying");

  if (!box) return;

  const slots = Object.keys(data.flying.days)
    .map(date => ({ date, time: flyingSlotFor(date, c.id) }))
    .filter(s => s.time);

  const total = Object.keys(data.flying.days)
    .reduce((n, date) => n + Object.keys(data.flying.days[date]).length, 0);

  box.innerHTML = `
    <div class="card">
      <div class="section-title">
        <h2>✈️ Flying</h2>
        <span class="pill blues">${total} ALLOCATED</span>
      </div>
      ${slots.length
        ? slots.map(s => eventHtml({
            time: s.time,
            title: "Your Flying Slot",
            location: data.flying.location,
            note: s.date + " • " + data.flying.note,
            uniform: "Greens"
          }, "Greens")).join("")
        : `<p class="muted">No flying slot allocated to Cadet ${esc(c.id)}. Staff will add slots as they are confirmed.</p>`}
    </div>
  `;
}

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
      const index = names.indexOf(targetDate);

      if (index >= 0 && index < names.length - 1) {
        targetDate = names[index + 1];
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
    <h2>${nextItem ? esc(nextItem.title) : "Check your programme"}</h2>
    <p>
      Cadet ${esc(c.id)} • Flight ${esc(c.flight)}
      ${nextItem ? ` • ${esc(targetDate)} • ${esc(formatTime(nextItem.time))}` : ""}
    </p>
    ${nextItem && nextItem.location ? `<p class="muted small">📍 ${esc(nextItem.location)}</p>` : ""}
    ${nextUniform ? `<span class="pill ${uniformClass(nextUniform)}">👕 ${esc(nextUniform.toUpperCase())}</span>` : ""}
  `;
}

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

function updateMeals() {
  const input = document.getElementById("mealText");

  if (!input) return;

  const text = input.value.trim() || "Menu TBC";

  localStorage.setItem("k9Meal", text);

  const display = document.getElementById("mealDisplay");

  if (display) {
    display.textContent = text;
  }
}

function loadMeal() {
  const display = document.getElementById("mealDisplay");

  if (!display) return;

  display.textContent = localStorage.getItem("k9Meal") || "Menu TBC";
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

function start() {
  const input = document.getElementById("cadetInput");

  if (input) {
    input.value = cadet().id;
  }

  loadMeal();

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
