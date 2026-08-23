// Dates come straight from data.js, so adding a day there is enough.
const names = Object.keys(data.programme);

let cadetId = new URLSearchParams(window.location.search).get("cadet") || localStorage.getItem("k9CadetId") || "001";

const uniforms = {
  "Greens": "greens",
  "Blues": "blues",
  "Civvies": "civvies",
  "Sports": "sports"
};

// Fallback only. An item's own "uniform" field in data.js always wins, and
// anything not listed here falls back to the uniform of the day.
const activityUniforms = {
  "STEM": "Greens",
  "Paintball": "Greens",
  "Archery": "Greens",
  "Leadership": "Greens",
  "Section Visit": "Blues",
  "Camp Photo": "Blues",
  "Parade": "Blues",
  "Evening Activity": "Civvies",
  "Free Time": "Civvies"
};

// Activities that need a water bottle prompt.
const needsWater = ["STEM", "Paintball", "Archery", "Leadership", "Adventure Training"];

// Flight allocation, in blocks of 15. Move a cadet by cutting their number
// out of one flight and pasting it into another.
// 060 is a spare slot in D, held for a late arrival. Everyone up to 059 is
// on the nominal roll.
const flightList = {
  A: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
  B: [16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
  C: [31,32,33,34,35,36,37,38,39,40,41,42,43,44,45],
  D: [46,47,48,49,50,51,52,53,54,55,56,57,58,59,60]
};

function flightFor(n) {
  return Object.keys(flightList).find(f => flightList[f].includes(n));
}

function cadet() {
  let n = parseInt(cadetId, 10);

  if (!Number.isInteger(n) || n < 1 || n > 60) n = 1;

  const id = String(n).padStart(3, "0");
  const flight = flightFor(n) || "TBC";

  return { id, flight };
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

// An item's own uniform wins, then the activity lookup, then the day's.
function uniformForItem(item, dayUniform) {
  return item.uniform || activityUniforms[item.title] || dayUniform || "TBC";
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

  document.querySelectorAll("[data-camp-location]").forEach(x => {
    x.textContent = data.camp.location;
  });

  renderWeek(c);
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

  const water = needsWater.some(a => item.title.includes(a))
    ? `<span class="tag">💧 Water bottle</span>`
    : "";

  return `
    <div class="event">
      <div class="time">${esc(item.time)}</div>
      <div>
        <h3>${esc(item.title)}</h3>
        ${label}
        ${item.location ? `<p class="muted small">📍 ${esc(item.location)}</p>` : ""}
        ${item.note ? `<p>${esc(item.note)}</p>` : ""}
        ${water}
      </div>
    </div>
  `;
}

function renderWeek(c) {
  const box = document.getElementById("week");

  if (!box) return;

  box.innerHTML = names.map(date => {
    const p = data.programme[date];

    return `
      <div class="card">
        <div class="section-title">
          <h2>${esc(date)}</h2>
          <span class="pill ${uniformClass(p.uniform)}">DAY: ${esc(p.uniform.toUpperCase())}</span>
        </div>
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
      ${nextItem ? ` • ${esc(targetDate)} • ${esc(nextItem.time)}` : ""}
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

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("cadetInput");

  if (input) {
    input.value = cadet().id;
  }

  render();
  loadMeal();
});
