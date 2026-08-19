const names = ["22 Aug","23 Aug","24 Aug","25 Aug","26 Aug","27 Aug","28 Aug"];

let cadetId = localStorage.getItem("k9CadetId") || "001";

const uniforms = {
  "Greens": "greens",
  "Blues": "blues",
  "Civvies": "civvies",
  "Sports": "sports"
};

const activityUniforms = {
  "STEM": "Greens",
  "Paintball": "Greens",
  "Archery": "Greens",
  "Leadership": "Greens",
  "Section Visit": "Blues",
  "York Air Museum": "Civvies",
  "Adventure Training": "Sports",
  "Flying": "Greens",
  "Flying Slot": "Greens",
  "Evening Activity": "Civvies",
  "Camp Photo": "Blues",
  "Parade": "Blues",
  "Free Time": "Civvies"
};

const mealTitles = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Tea",
  "Supper",
  "Evening Meal"
];

function cadet() {
  let n = parseInt(cadetId, 10);

  if (!Number.isInteger(n) || n < 1 || n > 68) n = 1;

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

function isMeal(title) {
  return mealTitles.includes(title);
}

function isLightsOut(title) {
  return title === "Lights Out";
}

function uniformForItem(title, fallback) {
  if (activityUniforms[title]) return activityUniforms[title];

  return fallback || "TBC";
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
          <span class="pill ${uniformClass(p.uniform)}">
            DAY: ${p.uniform.toUpperCase()}
          </span>
        </div>

        ${items.map(e => {

          const title = e[1];
          const meal = isMeal(title);
          const lightsOut = isLightsOut(title);

          let specialLabel = "";

          if (meal) {
            specialLabel =
              title === "Lunch"
                ? `<span class="pill">🥪 PACKED LUNCH</span>`
                : `<span class="pill">🍽️ MEAL</span>`;
          }

          if (lightsOut) {
            specialLabel = `<span class="pill">🧸 LIGHTS OUT</span>`;
          }

          const uniform = uniformForItem(title, p.uniform);

          const showUniform =
            !meal &&
            !lightsOut;

          return `
            <div class="event">
              <div class="time">${e[0]}</div>

              <div>
                <h3>${title}</h3>

                ${
                  showUniform
                    ? `<span class="pill ${uniformClass(uniform)}">
                         👕 ${uniform.toUpperCase()}
                       </span>`
                    : specialLabel
                }

                ${e[2] ? `<p>${e[2]}</p>` : ""}

                ${
                  ["STEM","Paintball","Archery","Leadership"].includes(title)
                    ? `<span class="tag">💧 Water bottle</span>`
                    : ""
                }
              </div>
            </div>
          `;

        }).join("")}
      </div>
    `;
  });

  updateNextUp(c);
}

function updateNextUp(c) {
  const next = document.getElementById("next");

  if (!next) return;

  const now = new Date();

  const campStart = new Date(2026, 7, 22, 0, 0);
  const campEnd = new Date(2026, 7, 28, 23, 59);

  let targetDate;

  if (now < campStart) {
    targetDate = "22 Aug";
  } else {
    const day = now.getDate();
    const month = now.getMonth();

    targetDate = `${day} Aug`;

    if (month !== 7 || !names.includes(targetDate)) {
      targetDate = "28 Aug";
    }
  }

  let items = itemsFor(targetDate);
  let nextItem = null;

  if (now >= campStart && now <= campEnd) {
    const minutesNow =
      now.getHours() * 60 + now.getMinutes();

    nextItem = items.find(item => {
      const parts = item[0].split(":");

      const minutes =
        Number(parts[0]) * 60 + Number(parts[1]);

      return minutes > minutesNow;
    });

    if (!nextItem) {
      const index = names.indexOf(targetDate);

      if (index >= 0 && index < names.length - 1) {
        const tomorrow = names[index + 1];

        nextItem = itemsFor(tomorrow)[0] || null;
        targetDate = tomorrow;
      }
    }
  } else {
    nextItem = items[0] || null;
  }

  const nextUniform = nextItem
    ? uniformForItem(
        nextItem[1],
        data.programme[targetDate].uniform
      )
    : "";

  next.innerHTML = `
    <small>🐾 K9 SAYS… NEXT UP</small>

    <h2>
      ${nextItem ? nextItem[1] : "Check your programme"}
    </h2>

    <p>
      Cadet ${c.id} • Flight ${c.flight}
      ${
        nextItem
          ? ` • ${targetDate} • ${nextItem[0]}`
          : ""
      }
    </p>

    ${
      nextItem &&
      !isMeal(nextItem[1]) &&
      !isLightsOut(nextItem[1])
        ? `<span class="pill ${uniformClass(nextUniform)}">
             👕 ${nextUniform.toUpperCase()}
           </span>`
        : ""
    }
  `;
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

  display.textContent =
    localStorage.getItem("k9Meal") || "Menu TBC";
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("cadetInput");

  if (input) {
    input.value = cadet().id;
  }

  const uniformDay =
    document.getElementById("uniformDay");

  if (uniformDay) {
    uniformDay.dataset.current = "civvies";
  }

  render();
  loadMeal();
});
