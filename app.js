const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function plusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const foodPhotos = {
  "Lait demi-écrémé": "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80",
  "Œufs": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80",
  "Tomates": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
  "Brocoli": "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80",
  "Riz basmati": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
  "Pain complet": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
  "Yaourt nature": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80"
};

const recipePhotos = [
  "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80"
];

const officialMembers = [
  {
    name: "Hafedh Dekhil",
    role: "Backend · architecture · données · logique métier",
    initial: "H"
  },
  {
    name: "Jean Jacques Arquero",
    role: "Jira · GitHub · documentation · suivi Scrum",
    initial: "J"
  },
  {
    name: "Kevin Mai",
    role: "Frontend · interface utilisateur · UX · maquettes",
    initial: "K"
  },
  {
    name: "Danensky",
    role: "Tests · validation · qualité",
    initial: "D"
  }
];

const defaultState = {
  inventory: [
    { name: "Lait demi-écrémé", qty: "1 L", zone: "Frigo", expiry: plusDays(2), owner: "Kevin" },
    { name: "Œufs", qty: "12 unités", zone: "Frigo", expiry: plusDays(5), owner: "Jean Jacques" },
    { name: "Tomates", qty: "500 g", zone: "Frigo", expiry: plusDays(1), owner: "Hafedh" },
    { name: "Brocoli", qty: "1 tête", zone: "Frigo", expiry: plusDays(4), owner: "Danensky" },
    { name: "Riz basmati", qty: "1 kg", zone: "Garde-manger", expiry: plusDays(30), owner: "Hafedh" },
    { name: "Yaourt nature", qty: "4 pots", zone: "Frigo", expiry: plusDays(6), owner: "Kevin" }
  ],
  shopping: [
    { item: "Oignons", member: "Hafedh", done: false },
    { item: "Ail", member: "Kevin", done: false },
    { item: "Citron", member: "Jean Jacques", done: true },
    { item: "Pâtes complètes", member: "Danensky", done: false }
  ],
  members: officialMembers
};

const recipes = [
  {
    title: "Pâtes aux légumes",
    time: "20 min",
    impact: "Avec vos restes",
    needs: ["Oignons", "Ail"],
    uses: ["Tomates", "Brocoli"],
    img: recipePhotos[0]
  },
  {
    title: "Omelette au brocoli",
    time: "15 min",
    impact: "Rapide et protéiné",
    needs: ["Fromage"],
    uses: ["Œufs", "Brocoli"],
    img: recipePhotos[1]
  },
  {
    title: "Soupe anti-gaspi",
    time: "25 min",
    impact: "Réduit les pertes",
    needs: ["Bouillon"],
    uses: ["Tomates", "Pain complet"],
    img: recipePhotos[2]
  }
];

let state = load();
let scanIndex = 0;
let detected = null;
let inventoryFilter = "all";

const scans = [
  {
    name: "Lait demi-écrémé",
    qty: "1 L",
    zone: "Frigo",
    expiry: plusDays(2),
    img: foodPhotos["Lait demi-écrémé"],
    tags: ["Produit laitier", "À consommer bientôt", "Frigo"]
  },
  {
    name: "Tomates",
    qty: "500 g",
    zone: "Frigo",
    expiry: plusDays(1),
    img: foodPhotos["Tomates"],
    tags: ["Légume", "Prioritaire", "Recette possible"]
  },
  {
    name: "Œufs",
    qty: "12 unités",
    zone: "Frigo",
    expiry: plusDays(5),
    img: foodPhotos["Œufs"],
    tags: ["Protéine", "Disponible", "À confirmer"]
  }
];

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem("mealsaver-commercial-v4"));
    if (!stored) return structuredClone(defaultState);

    return {
      inventory: Array.isArray(stored.inventory) ? stored.inventory : structuredClone(defaultState.inventory),
      shopping: Array.isArray(stored.shopping) ? stored.shopping : structuredClone(defaultState.shopping),
      // Les rôles de l'équipe sont ceux de la version actuelle du projet.
      members: structuredClone(officialMembers)
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function save() {
  localStorage.setItem("mealsaver-commercial-v4", JSON.stringify(state));
}

function daysLeft(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dateStr + "T00:00:00") - today) / 86400000);
}

function statusFor(dateStr) {
  const n = daysLeft(dateStr);

  if (n < 0) return ["Date dépassée", "urgent"];
  if (n === 0) return ["Expire aujourd’hui", "urgent"];
  if (n === 1) return ["Expire demain", "urgent"];
  if (n <= 3) return [`Expire dans ${n} jours`, "urgent"];

  return [`Expire dans ${n} jours`, "ok"];
}

function foodImg(name) {
  return (
    foodPhotos[name] ||
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
  );
}

function switchScreen(id) {
  $$(".app-screen").forEach((screen) => {
    screen.classList.toggle("active-screen", screen.id === id);
  });

  $$(".app-nav").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === id);
  });

  const titles = {
    dash: "Bonjour famille Durand 👋",
    inventory: "Inventaire du foyer",
    scan: "Scan intelligent MVP",
    recipes: "Recettes anti-gaspillage",
    list: "Liste collaborative",
    group: "Foyer collaboratif"
  };

  const title = $("#app-title");
  if (title) title.textContent = titles[id] || "MealSaver";
}

function renderRecipes(target) {
  const container = $(target);
  if (!container) return;

  container.innerHTML = recipes
    .map(
      (recipe) => `
        <article class="recipe-item">
          <img
            src="${recipe.img}"
            alt="${escapeHtml(recipe.title)}"
            onerror="this.onerror=null;this.src='assets/shot-recipes.png';"
          />
          <div>
            <h4>${escapeHtml(recipe.title)}</h4>
            <small>⏱ ${escapeHtml(recipe.time)} · ${escapeHtml(recipe.impact)}</small>
            <p><b>Utilise :</b> ${recipe.uses.map(escapeHtml).join(", ")}</p>
            <button
              class="btn btn-soft add-needs"
              data-needs="${recipe.needs.map(escapeHtml).join("|")}"
            >
              Ajouter les manquants
            </button>
          </div>
        </article>
      `
    )
    .join("");
}

function filteredInventory() {
  if (inventoryFilter === "fridge") {
    return state.inventory
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.zone === "Frigo");
  }

  if (inventoryFilter === "pantry") {
    return state.inventory
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.zone === "Garde-manger");
  }

  if (inventoryFilter === "urgent") {
    return state.inventory
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => daysLeft(item.expiry) <= 3);
  }

  return state.inventory.map((item, index) => ({ item, index }));
}

function renderInventory() {
  const list = $("#inventoryList");
  if (!list) return;

  const items = filteredInventory();

  $$(".filters [data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === inventoryFilter);
    button.setAttribute(
      "aria-pressed",
      button.dataset.filter === inventoryFilter ? "true" : "false"
    );
  });

  if (!items.length) {
    list.innerHTML = `
      <div class="inventory-empty">
        Aucun aliment ne correspond à ce filtre.
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map(({ item: food, index }) => {
      const [statusText, statusClass] = statusFor(food.expiry);

      return `
        <article class="food-row">
          <div class="food-left">
            <img
              src="${foodImg(food.name)}"
              alt="${escapeHtml(food.name)}"
              onerror="this.onerror=null;this.src='assets/shot-inventory.png';"
            />
            <div>
              <strong>${escapeHtml(food.name)}</strong>
              <small>
                ${escapeHtml(food.qty)} ·
                ${escapeHtml(food.zone)} ·
                ajouté par ${escapeHtml(food.owner)}
              </small>
            </div>
          </div>

          <div class="inventory-actions">
            <span class="status ${statusClass}">
              ${escapeHtml(statusText)}
            </span>
            <button
              class="remove-food"
              type="button"
              data-i="${index}"
              aria-label="Retirer ${escapeHtml(food.name)} de l’inventaire"
            >
              Retirer
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAlerts() {
  const list = state.inventory
    .filter((food) => daysLeft(food.expiry) <= 3)
    .sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry));

  const html = list
    .map(
      (food) => `
        <article class="alert-row">
          <div class="food-left">
            <img
              src="${foodImg(food.name)}"
              alt="${escapeHtml(food.name)}"
              onerror="this.onerror=null;this.src='assets/shot-inventory.png';"
            />
            <div>
              <strong>${escapeHtml(food.name)}</strong>
              <small>${escapeHtml(statusFor(food.expiry)[0])} · ${escapeHtml(food.qty)}</small>
            </div>
          </div>
          <span class="status urgent">Priorité</span>
        </article>
      `
    )
    .join("");

  if ($("#dashAlerts")) {
    $("#dashAlerts").innerHTML =
      html || "<p>Aucune alerte prioritaire dans cette démo.</p>";
  }
}

function renderShopping() {
  const list = $("#shoppingList");
  if (!list) return;

  list.innerHTML = state.shopping
    .map(
      (shoppingItem, index) => `
        <article class="shop-row ${shoppingItem.done ? "done" : ""}">
          <div class="food-left">
            <button class="check toggle-shop" data-i="${index}" type="button">
              ${shoppingItem.done ? "✓" : ""}
            </button>
            <div>
              <strong>${escapeHtml(shoppingItem.item)}</strong>
              <small>Assigné à ${escapeHtml(shoppingItem.member)}</small>
            </div>
          </div>

          <button class="text-link remove-shop" data-i="${index}" type="button">
            Retirer
          </button>
        </article>
      `
    )
    .join("");
}

function renderMembers() {
  const grid = $("#memberGrid");
  if (!grid) return;

  grid.innerHTML = officialMembers
    .map(
      (member) => `
        <article class="member">
          <b>${escapeHtml(member.initial)}</b>
          <h3>${escapeHtml(member.name)}</h3>
          <p>${escapeHtml(member.role)}</p>
        </article>
      `
    )
    .join("");
}

function renderAll() {
  renderRecipes("#dashRecipes");
  renderRecipes("#recipeList");
  renderInventory();
  renderAlerts();
  renderShopping();
  renderMembers();
}

function initApp() {
  if (!document.body.classList.contains("app-body")) return;

  renderAll();

  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-screen]");
    if (nav) switchScreen(nav.dataset.screen);

    const filter = event.target.closest("[data-filter]");
    if (filter) {
      inventoryFilter = filter.dataset.filter;
      renderInventory();
    }

    const removeFood = event.target.closest(".remove-food");
    if (removeFood) {
      state.inventory.splice(Number(removeFood.dataset.i), 1);
      save();
      renderAll();
    }

    const removeShop = event.target.closest(".remove-shop");
    if (removeShop) {
      state.shopping.splice(Number(removeShop.dataset.i), 1);
      save();
      renderShopping();
    }

    const toggleShop = event.target.closest(".toggle-shop");
    if (toggleShop) {
      const item = state.shopping[Number(toggleShop.dataset.i)];
      if (item) item.done = !item.done;
      save();
      renderShopping();
    }

    const addNeeds = event.target.closest(".add-needs");
    if (addNeeds) {
      addNeeds.dataset.needs.split("|").forEach((item) => {
        if (
          !state.shopping.some(
            (shoppingItem) =>
              shoppingItem.item.toLowerCase() === item.toLowerCase()
          )
        ) {
          state.shopping.push({
            item,
            member: "Kevin",
            done: false
          });
        }
      });

      save();
      renderShopping();
      switchScreen("list");
    }
  });

  $("#foodForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.target));

    state.inventory.unshift({
      ...data,
      owner: "Hafedh"
    });

    event.target.reset();
    inventoryFilter = "all";
    save();
    renderAll();
  });

  $("#shoppingForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.target));

    state.shopping.unshift({
      item: data.item,
      member: data.member,
      done: false
    });

    event.target.reset();
    save();
    renderShopping();
  });

  $("#changeScan")?.addEventListener("click", () => {
    scanIndex = (scanIndex + 1) % scans.length;
    $("#scanImg").src = scans[scanIndex].img;

    detected = null;
    $("#detectedTitle").textContent = "En attente d’analyse";
    $("#detectedMeta").textContent =
      "Image → résultat simulé → validation utilisateur → inventaire.";
    $("#detectedTags").innerHTML = "";
    $("#addDetected").disabled = true;
  });

  $("#analyzeScan")?.addEventListener("click", () => {
    detected = scans[scanIndex];

    $("#detectedTitle").textContent = detected.name;
    $("#detectedMeta").textContent =
      `${detected.qty} · ${detected.zone} · date proposée : ${detected.expiry}`;

    $("#detectedTags").innerHTML = detected.tags
      .map((tag) => `<span>${escapeHtml(tag)}</span>`)
      .join("");

    $("#addDetected").disabled = false;
  });

  $("#addDetected")?.addEventListener("click", () => {
    if (!detected) return;

    state.inventory.unshift({
      name: detected.name,
      qty: detected.qty,
      zone: detected.zone,
      expiry: detected.expiry,
      owner: "Hafedh"
    });

    save();
    inventoryFilter = "all";
    renderAll();
    switchScreen("inventory");
  });

  $("#quickAdd")?.addEventListener("click", () => {
    inventoryFilter = "all";
    switchScreen("inventory");
    renderInventory();

    setTimeout(() => {
      $("#foodForm input[name='name']")?.focus();
    }, 50);
  });
}

function initLanding() {
  if (document.body.classList.contains("app-body")) return;

  const toggle = $(".menu-toggle");
  toggle?.addEventListener("click", () => {
    $(".desktop-nav")?.classList.toggle("open");
  });
}

initLanding();
initApp();
