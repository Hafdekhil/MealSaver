const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function plusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const asset = (name) => `assets/${name}`;
const productImages = {
  "Lait demi-écrémé": asset("scan-milk.svg"),
  "Œufs": asset("food-omelette.svg"),
  "Tomates": asset("food-pasta.svg"),
  "Brocoli": asset("hero-produce.svg"),
  "Riz basmati": asset("hero-produce.svg"),
  "Pain complet": asset("food-soup.svg"),
  "Yaourt nature": asset("scan-milk.svg"),
  "Pommes": asset("hero-produce.svg")
};

const defaultState = {
  inventory: [
    { name: "Lait demi-écrémé", qty: "1 L", zone: "Frigo", expiry: plusDays(2), owner: "Kevin" },
    { name: "Tomates", qty: "500 g", zone: "Frigo", expiry: plusDays(1), owner: "Hafedh" },
    { name: "Œufs", qty: "12 unités", zone: "Frigo", expiry: plusDays(5), owner: "Jean Jacques" },
    { name: "Brocoli", qty: "1 tête", zone: "Frigo", expiry: plusDays(4), owner: "Danensky" },
    { name: "Riz basmati", qty: "1 kg", zone: "Garde-manger", expiry: plusDays(30), owner: "Hafedh" },
    { name: "Yaourt nature", qty: "4 pots", zone: "Frigo", expiry: plusDays(6), owner: "Kevin" },
    { name: "Pain complet", qty: "1 sac", zone: "Garde-manger", expiry: plusDays(3), owner: "Jean Jacques" }
  ],
  shopping: [
    { item: "Oignons", member: "Hafedh", done: false },
    { item: "Ail", member: "Kevin", done: false },
    { item: "Citron", member: "Jean Jacques", done: true },
    { item: "Pâtes complètes", member: "Danensky", done: false }
  ],
  members: [
    { name: "Hafedh Dekhil", role: "Backend / base de données", initial: "H", task: "Architecture API et inventaire" },
    { name: "Jean Jacques Arquero", role: "Frontend / UI", initial: "J", task: "Écrans Web et mobile" },
    { name: "Kevin Mai", role: "Collaboration / groupe", initial: "K", task: "Foyer, membres et liste" },
    { name: "Danensky", role: "DevOps / tests", initial: "D", task: "GitHub Pages, tests et documentation" }
  ]
};

const recipes = [
  { title: "Pâtes aux légumes", time: "20 min", impact: "Avec vos restes", img: asset("food-pasta.svg"), needs: ["Oignons", "Ail"], uses: ["Tomates", "Brocoli"] },
  { title: "Omelette au brocoli", time: "15 min", impact: "Prête rapidement", img: asset("food-omelette.svg"), needs: ["Fromage"], uses: ["Œufs", "Brocoli"] },
  { title: "Soupe anti-gaspi", time: "25 min", impact: "Réduit les pertes", img: asset("food-soup.svg"), needs: ["Bouillon"], uses: ["Tomates", "Pain complet"] },
  { title: "Bol riz & légumes", time: "18 min", impact: "Repas économique", img: asset("hero-produce.svg"), needs: ["Sauce soya"], uses: ["Riz basmati", "Brocoli"] }
];

const scanSamples = [
  { name: "Lait demi-écrémé", qty: "1 L", zone: "Frigo", expiry: plusDays(2), image: asset("scan-milk.svg"), tags: ["Produit laitier", "Expire bientôt", "Frigo"] },
  { name: "Tomates", qty: "500 g", zone: "Frigo", expiry: plusDays(1), image: asset("food-pasta.svg"), tags: ["Légume", "À utiliser", "Recette possible"] },
  { name: "Œufs", qty: "12 unités", zone: "Frigo", expiry: plusDays(5), image: asset("food-omelette.svg"), tags: ["Protéine", "Disponible", "Petit déjeuner"] }
];

function loadState() {
  try {
    const stored = localStorage.getItem("mealsaver-commercial-state");
    return stored ? JSON.parse(stored) : structuredClone(defaultState);
  } catch (_) {
    return structuredClone(defaultState);
  }
}

let state = loadState();
let scanIndex = 0;
let detected = null;

function saveState() {
  localStorage.setItem("mealsaver-commercial-state", JSON.stringify(state));
}

function daysLeft(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((expiry - today) / 86400000);
}

function expiryInfo(dateStr) {
  const d = daysLeft(dateStr);
  if (d < 0) return { text: "Expiré", cls: "danger" };
  if (d === 0) return { text: "Expire aujourd’hui", cls: "danger" };
  if (d === 1) return { text: "Expire demain", cls: "warning" };
  if (d <= 3) return { text: `Expire dans ${d} jours`, cls: "warning" };
  return { text: `Expire dans ${d} jours`, cls: "success" };
}

function imageFor(name) {
  return productImages[name] || asset("hero-produce.svg");
}

function navigateApp(page) {
  if (!$(".app-page")) return;
  $$(".app-page").forEach(section => section.classList.toggle("active", section.id === `${page}-page`));
  $$(".app-nav").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  const titles = {
    dashboard: "Bonjour la famille Durand 👋",
    inventory: "Inventaire du foyer",
    scan: "Scan intelligent",
    recipes: "Recettes anti-gaspillage",
    shopping: "Liste collaborative",
    group: "Foyer collaboratif",
    alerts: "Alertes importantes"
  };
  const title = $("#app-title");
  if (title) title.textContent = titles[page] || "MealSaver";
  history.replaceState(null, "", `#${page}`);
}

function renderStats() {
  const root = $("#stats-grid");
  if (!root) return;
  const soon = state.inventory.filter(item => daysLeft(item.expiry) <= 3).length;
  const stats = [
    { value: soon, label: "aliments à consommer", icon: "🔥" },
    { value: state.inventory.length, label: "aliments suivis", icon: "🥬" },
    { value: "48$", label: "économies estimées", icon: "💵" },
    { value: "12.4kg", label: "déchets évités", icon: "🌿" }
  ];
  root.innerHTML = stats.map(s => `<article class="stat-card"><div><b>${s.value}</b><span>${s.label}</span></div><i>${s.icon}</i></article>`).join("");
}

function renderInventory() {
  const root = $("#inventory-list");
  if (!root) return;
  root.innerHTML = state.inventory.map((item, index) => {
    const info = expiryInfo(item.expiry);
    return `<article class="inventory-item">
      <div class="item-left"><img src="${imageFor(item.name)}" alt="${item.name}"><div><b>${item.name}</b><small>${item.qty} • ${item.zone} • ajouté par ${item.owner || "foyer"}</small></div></div>
      <div class="item-actions"><span class="tag ${info.cls}">${info.text}</span><button class="ghost-btn" data-remove-food="${index}">Retirer</button></div>
    </article>`;
  }).join("");
}

function recipeMarkup(recipe) {
  return `<article class="recipe-card"><img src="${recipe.img}" alt="${recipe.title}"><div class="body"><h4>${recipe.title}</h4><div class="meta-row"><span>⏱ ${recipe.time}</span><span>🌿 ${recipe.impact}</span></div><div class="tag-row"><span class="tag success">Utilise : ${recipe.uses.join(", ")}</span><span class="tag warning">Manque : ${recipe.needs.join(", ")}</span></div><button class="btn btn-primary full" data-add-needs="${recipe.needs.join("|")}">Ajouter les manquants</button></div></article>`;
}

function renderRecipes() {
  const grid = $("#recipe-grid");
  const dash = $("#dashboard-recipes");
  if (grid) grid.innerHTML = recipes.map(recipeMarkup).join("");
  if (dash) dash.innerHTML = recipes.slice(0, 3).map(recipeMarkup).join("");
}

function renderAlerts() {
  const alerts = state.inventory.filter(item => daysLeft(item.expiry) <= 3).sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry));
  const html = alerts.length ? alerts.map(item => {
    const info = expiryInfo(item.expiry);
    return `<article class="alert-item urgent"><img src="${imageFor(item.name)}" alt="${item.name}"><div><b>${item.name}</b><small>${info.text} • ${item.qty} • ${item.zone}</small></div></article>`;
  }).join("") : `<p>Aucune alerte critique pour le moment.</p>`;
  if ($("#dashboard-alerts")) $("#dashboard-alerts").innerHTML = html;
  if ($("#alerts-page-list")) $("#alerts-page-list").innerHTML = html;
}

function renderShopping() {
  const root = $("#shopping-list");
  if (!root) return;
  root.innerHTML = state.shopping.map((item, index) => `<article class="shopping-item ${item.done ? "done" : ""}"><div class="shopping-left"><button class="check" data-toggle-shop="${index}">${item.done ? "✓" : ""}</button><div><b>${item.item}</b><small>Assigné à ${item.member}</small></div></div><button class="ghost-btn" data-remove-shop="${index}">Retirer</button></article>`).join("");
}

function renderMembers() {
  const root = $("#member-grid");
  if (!root) return;
  root.innerHTML = state.members.map(member => `<article class="member-card"><div class="member-avatar">${member.initial}</div><h3>${member.name}</h3><p>${member.role}</p><div class="tag-row"><span class="tag">${member.task}</span></div></article>`).join("");
}

function renderAll() {
  renderStats();
  renderInventory();
  renderRecipes();
  renderAlerts();
  renderShopping();
  renderMembers();
}

function setupAppEvents() {
  document.addEventListener("click", event => {
    const nav = event.target.closest("[data-page]");
    if (nav?.dataset.page && nav.classList.contains("app-nav")) navigateApp(nav.dataset.page);
    const jump = event.target.closest("[data-page-jump]");
    if (jump?.dataset.pageJump) navigateApp(jump.dataset.pageJump);

    const removeFood = event.target.closest("[data-remove-food]");
    if (removeFood) {
      state.inventory.splice(Number(removeFood.dataset.removeFood), 1);
      saveState(); renderAll();
    }

    const removeShop = event.target.closest("[data-remove-shop]");
    if (removeShop) {
      state.shopping.splice(Number(removeShop.dataset.removeShop), 1);
      saveState(); renderShopping();
    }

    const toggleShop = event.target.closest("[data-toggle-shop]");
    if (toggleShop) {
      const index = Number(toggleShop.dataset.toggleShop);
      state.shopping[index].done = !state.shopping[index].done;
      saveState(); renderShopping();
    }

    const addNeeds = event.target.closest("[data-add-needs]");
    if (addNeeds) {
      addNeeds.dataset.addNeeds.split("|").forEach(item => {
        if (!state.shopping.some(s => s.item.toLowerCase() === item.toLowerCase())) state.shopping.push({ item, member: "Kevin", done: false });
      });
      saveState(); renderShopping(); navigateApp("shopping");
    }
  });

  const foodForm = $("#food-form");
  if (foodForm) foodForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(foodForm));
    state.inventory.unshift({ ...data, owner: "Hafedh" });
    foodForm.reset(); saveState(); renderAll();
  });

  const shoppingForm = $("#shopping-form");
  if (shoppingForm) shoppingForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(shoppingForm));
    state.shopping.unshift({ item: data.item, member: data.member, done: false });
    shoppingForm.reset(); saveState(); renderShopping();
  });

  const switchScan = $("#switch-scan");
  if (switchScan) switchScan.addEventListener("click", () => {
    scanIndex = (scanIndex + 1) % scanSamples.length;
    const sample = scanSamples[scanIndex];
    $("#scan-image").src = sample.image;
    detected = null;
    $("#detected-name").textContent = "En attente d’analyse";
    $("#detected-detail").textContent = "La reconnaissance propose un aliment. L’utilisateur valide avant l’ajout à l’inventaire.";
    $("#detected-tags").innerHTML = "";
    $("#add-detected").disabled = true;
  });

  const analyzeScan = $("#analyze-scan");
  if (analyzeScan) analyzeScan.addEventListener("click", () => {
    detected = scanSamples[scanIndex];
    $("#detected-name").textContent = detected.name;
    $("#detected-detail").textContent = `${detected.qty} • ${detected.zone} • expiration estimée : ${detected.expiry}`;
    $("#detected-tags").innerHTML = detected.tags.map(tag => `<span class="tag">${tag}</span>`).join("");
    $("#add-detected").disabled = false;
  });

  const addDetected = $("#add-detected");
  if (addDetected) addDetected.addEventListener("click", () => {
    if (!detected) return;
    state.inventory.unshift({ name: detected.name, qty: detected.qty, zone: detected.zone, expiry: detected.expiry, owner: "Scan" });
    saveState(); renderAll(); navigateApp("inventory");
  });
}

function setupLandingTabs() {
  const data = {
    dashboard: { title: "Dashboard commercial", text: "Vue d’ensemble du foyer : priorités, économies, impact environnemental et suggestions immédiates.", list: ["Indicateurs clairs", "Alertes visibles", "CTA vers scan et recettes"] },
    inventory: { title: "Inventaire professionnel", text: "Liste structurée des aliments avec quantité, zone, expiration et personne responsable.", list: ["Filtres réutilisables", "Cartes produits", "Actions rapides"] },
    scan: { title: "Scan intelligent MVP", text: "Écran de reconnaissance assistée avec validation humaine avant ajout à l’inventaire.", list: ["Photo ou téléversement", "Résultat détecté", "Validation manuelle"] },
    recipes: { title: "Recettes anti-gaspillage", text: "Suggestions visuelles qui utilisent les aliments disponibles et complètent la liste d’épicerie.", list: ["Temps de préparation", "Ingrédients utilisés", "Manquants ajoutables"] }
  };
  const frame = $("#shot-frame");
  if (!frame) return;
  $$(".tab").forEach(tab => tab.addEventListener("click", () => {
    $$(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const shot = data[tab.dataset.shot];
    $("#shot-title").textContent = shot.title;
    $("#shot-text").textContent = shot.text;
    $("#shot-list").innerHTML = shot.list.map(item => `<li>${item}</li>`).join("");
    frame.innerHTML = renderCodedShot(tab.dataset.shot);
  }));
  frame.innerHTML = renderCodedShot("dashboard");
}

function renderCodedShot(type) {
  const commonSidebar = `<aside class="shot-sidebar"><b>MealSaver</b><span>Dashboard</span><span>Inventaire</span><span>Scan</span><span>Recettes</span></aside>`;
  if (type === "inventory") {
    return `<div class="shot-ui">${commonSidebar}<main><h3>Inventaire du foyer</h3><div class="shot-filters"><i></i><i></i><i></i></div><div class="shot-list"><article></article><article></article><article></article><article></article></div></main></div>`;
  }
  if (type === "scan") {
    return `<div class="shot-ui">${commonSidebar}<main><h3>Scan intelligent</h3><div class="shot-scan"><img src="assets/scan-milk.svg" alt="Scan"></div><div class="shot-result"></div></main></div>`;
  }
  if (type === "recipes") {
    return `<div class="shot-ui">${commonSidebar}<main><h3>Recettes avec vos ingrédients</h3><div class="shot-recipes"><img src="assets/food-pasta.svg" alt=""><img src="assets/food-omelette.svg" alt=""><img src="assets/food-soup.svg" alt=""></div></main></div>`;
  }
  return `<div class="shot-ui">${commonSidebar}<main><h3>Bonjour famille Durand</h3><div class="shot-stats"><i></i><i></i><i></i></div><div class="shot-dashboard"><img src="assets/food-pasta.svg" alt=""><img src="assets/scan-milk.svg" alt=""></div></main></div>`;
}

renderAll();
setupAppEvents();
setupLandingTabs();
if ($(".app-page")) navigateApp(location.hash ? location.hash.replace("#", "") : "dashboard");
