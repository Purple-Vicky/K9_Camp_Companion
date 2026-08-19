const names = ["22 Aug","23 Aug","24 Aug","25 Aug","26 Aug","27 Aug","28 Aug"];

let cadetId = localStorage.getItem("k9CadetId") || "001";

const uniforms = {
  "Greens": "greens",
  "Blues": "blues",
  "Civvies": "civvies"
};

function cadet() {
  let n = parseInt(cadetId, 10);

  if (!Number.isInteger(n) || n < 1 || n > 68) {
    n = 1;
  }

  const id = String(n).padStart(3, "0");
  const flight = "ABCD"[Math.floor((n - 1) / 17)];

  return { id, flight };
}

function setId(v) {
  cadetId = v;
  localStorage.setItem("k9CadetId", v);
  render();
}

function itemsFor(date) {
  const p = data.programme[date];
  const c = cadet();

  if (p.flight_items) {
    return p.flight_items[c.flight] || [];
  }

  return p.items || [];
}

function render() {
  const c = cadet();

  document.querySelectorAll("[data-id]").forEach(x => {
    x.textContent = c.id;
  });

  document.querySelectorAll("[data-flight]").forEach(x => {
    x.textContent = "Flight " + c.flight;
  });

  renderWeek(c);
  renderUniform();
}

function renderWeek(c) {
  const box = document.getElementById("week");

  if (!box) return;

  box.innerHTML = "";

  names.forEach(date => {
    const p = data.programme[date];
    const items = itemsFor(date);

    box.innerHTML += `
      <div class="card">
        <div class="section-title">
          <h2>${date}</h2>
          <span class="pill ${uniforms[p.uniform] || ""}">
            ${p.uniform.toUpperCase()}
          </span>
        </div>

        ${items.map(e => `
          <div class="event">
            <div class="time">${e[0]}</div>

            <div>
              <h3>${e[1]}</h3>

              ${e[2] ? `<p>${e[2]}</p>` : ""}

              ${
                ["STEM","Paintball","Archery","Leadership"].includes(e[1])
                  ? `<span class="tag">💧 Water bottle</span>`
                  : ""
              }
            </div>
          </div>
        `).join("")}
      </div>
    `;
  });

  const monday = itemsFor("24 Aug")[0];

  const next = document.getElementById("next");

  if (next) {
    next.innerHTML = `
      <small>🐾 K9 SAYS… NEXT UP</small>
      <h2>${monday ? monday[1] : "Check your programme"}</h2>
      <p>
        Cadet ${c.id} • Flight ${c.flight} • Monday 08:00
      </p>
    `;
  }
}

function renderUniform() {
  const u = document.getElementById("uniformDay");

  if (!u) return;

  const current = u.dataset.current || "civvies";

  u.innerHTML = `
    <img
      class="uniform-img"
      src="images/uniform-${current}.png"
      alt="K9 uniform guide"
    >
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

  document.querySelectorAll(".bottom button").forEach(x => {
    x.classList.remove("active");
  });

  if (btn) {
    btn.classList.add("active");
  }
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

  display.textContent =
    localStorage.getItem("k9Meal") || "Menu TBC";
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("cadetInput");

  if (input) {
    input.value = cadet().id;
  }

  const uniformDay = document.getElementById("uniformDay");

  if (uniformDay) {
    uniformDay.dataset.current = "civvies";
  }

  render();
  loadMeal();
});
