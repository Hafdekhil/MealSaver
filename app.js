const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const productImages = {
  "Lait demi-écrémé": "assets/product-milk.svg",
  "Œufs": "assets/product-eggs.svg",
  "Tomates": "assets/product-tomatoes.svg",
  "Brocoli": "assets/product-broccoli.svg",
  "Riz basmati": "assets/product-rice.svg",
  "Pain complet": "assets/recipe-soup.svg",
  "Yaourt nature": "assets/product-milk.svg",
  "Pommes": "assets/product-tomatoes.svg"
};

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
  members: [
    { name: "Hafedh Dekhil", role: "Backend / base de données", initial: "H", task: "Architecture API et inventaire" },
    { name: "Jean Jacques Arquero", role: "Frontend / UI", initial: "J", task: "Écrans Web et mobile" },
    { name: "Kevin Mai", role: "Collaboration / groupe", initial: "K", task: "Foyer, membres et liste" },
    { name: "Danensky", role: "DevOps / tests", initial: "D", task: "GitHub Pages, tests, documentation" }
  ]
};

const recipes = [
  { title: "Pâtes aux légumes", time: "20 min", impact: "Avec vos restes", img: "assets/recipe-pasta.svg", needs: ["Oignons", "Ail"], uses: ["Tomates", "Brocoli"] },
  { title: "Omelette au brocoli", time: "15 min", impact: "Prête rapidement", img: "assets/recipe-omelette.svg", needs: ["Fromage"], uses: ["Œufs", "Brocoli"] },
  { title: "Soupe anti-gaspi", time: "25 min", impact: "Réduit les pertes", img: "assets/recipe-soup.svg", needs: ["Bouillon"], uses: ["Tomates", "Pain complet"] }
];

let state = loadState();
let scanIndex = 0;
let detected = null;
const scanSamples = [
  { name: "Lait demi-écrémé", qty: "1 L", zone: "Frigo", expiry: plusDays(2), image: "assets/product-milk.svg", tags: ["Produit laitier", "Expire bientôt", "Frigo"] },
  { name: "Tomates", qty: "500 g", zone: "Frigo", expiry: plusDays(1), image: "assets/product-tomatoes.svg", tags: ["Légume", "À utiliser", "Recette possible"] },
  { name: "Œufs", qty: "12 unités", zone: "Frigo", expiry: plusDays(5), image: "assets/product-eggs.svg", tags: ["Protéine", "Disponible", "Petit déjeuner"] }
];

function plusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function loadState() {
  try { return JSON.parse(localStorage.getItem("mealsaver-state")) || structuredClone(defaultState); }
  catch { return structuredClone(defaultState); }
}
function saveState() { localStorage.setItem("mealsaver-state", JSON.stringify(state)); }
function daysLeft(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const expiry = new Date(dateStr + "T00:00:00");
  return Math.ceil((expiry - today) / 86400000);
}
function expiryLabel(dateStr) {
  const d = daysLeft(dateStr);
  if (d < 0) return { text: "Expiré", cls: "warning" };
  if (d === 0) return { text: "Expire aujourd’hui", cls: "warning" };
  if (d === 1) return { text: "Expire demain", cls: "warning" };
  if (d <= 3) return { text: `Expire dans ${d} jours`, cls: "warning" };
  return { text: `Expire dans ${d} jours`, cls: "success" };
}
function imageFor(name) { return productImages[name] || "assets/hero-basket.svg"; }

function navigate(page) {
  $$(".page").forEach(p => p.classList.toggle("active-page", p.id === page));
  $$(".nav").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  const titles = {dashboard:"Bonjour la famille Durand 👋",inventory:"Inventaire du foyer",scan:"Scan intelligent",recipes:"Recettes anti-gaspillage",list:"Liste collaborative",group:"Foyer collaboratif",alerts:"Alertes importantes"};
  $("#page-title").textContent = titles[page] || "MealSaver";
  history.replaceState(null, "", `#${page}`);
}

function renderStats() {
  const soon = state.inventory.filter(i => daysLeft(i.expiry) <= 3).length;
  const stats = [
    [soon, "aliments à consommer bientôt", "🔥"],
    [state.inventory.length, "aliments dans l’inventaire", "🥬"],
    ["48 $", "économies estimées ce mois-ci", "💵"],
    ["12,4 kg", "déchets évités", "🌿"]
  ];
  $("#stats-grid").innerHTML = stats.map(([n, p, icon]) => `<article class="stat-card"><div><div class="number">${n}</div><p>${p}</p></div><div class="stat-icon">${icon}</div></article>`).join("");
}

function renderInventory() {
  $("#inventory-list").innerHTML = state.inventory.map((item, idx) => {
    const ex = expiryLabel(item.expiry);
    return `<article class="inventory-item">
      <div class="item-left"><img src="${imageFor(item.name)}" alt="${item.name}"><div class="item-title"><strong>${item.name}</strong><small>${item.qty} • ${item.zone} • ajouté par ${item.owner || "foyer"}</small></div></div>
      <div class="item-actions"><span class="${ex.cls}">${ex.text}</span><button class="ghost" data-remove-food="${idx}">Retirer</button></div>
    </article>`;
  }).join("");
}

function renderRecipes(root = "#recipe-grid") {
  const html = recipes.map(r => `<article class="recipe-card">
    <img src="${r.img}" alt="${r.title}"><div class="body"><h4>${r.title}</h4><div class="meta"><span>⏱ ${r.time}</span><span>🌿 ${r.impact}</span></div>
    <div class="tag-row" style="margin-top:10px"><span class="success">Utilise : ${r.uses.join(", ")}</span><span class="warning">Manque : ${r.needs.join(", ")}</span></div>
    <button class="primary full" data-add-needs="${r.needs.join("|")}">Ajouter les manquants</button></div>
  </article>`).join("");
  $(root).innerHTML = html;
}

function renderAlerts() {
  const alerts = state.inventory.filter(i => daysLeft(i.expiry) <= 3).sort((a,b) => daysLeft(a.expiry)-daysLeft(b.expiry));
  const html = alerts.length ? alerts.map(item => {
    const ex = expiryLabel(item.expiry);
    return `<article class="alert-item urgent"><img src="${imageFor(item.name)}" alt="${item.name}"><div><strong>${item.name}</strong><small>${ex.text} • ${item.qty} • ${item.zone}</small></div></article>`;
  }).join("") : `<p class="muted">Aucune alerte critique pour le moment.</p>`;
  $("#dashboard-alerts").innerHTML = html;
  $("#alerts-page-list").innerHTML = html;
}

function renderShopping() {
  $("#shopping-list").innerHTML = state.shopping.map((s, idx) => `<article class="shopping-item ${s.done ? "done" : ""}">
    <div class="shopping-left"><button class="check" data-toggle-shop="${idx}">${s.done ? "✓" : ""}</button><div><strong>${s.item}</strong><small>Assigné à ${s.member}</small></div></div>
    <button class="ghost" data-remove-shop="${idx}">Retirer</button>
  </article>`).join("");
}

function renderMembers() {
  $("#member-grid").innerHTML = state.members.map(m => `<article class="member-card"><div class="member-avatar">${m.initial}</div><h3>${m.name}</h3><p>${m.role}</p><div class="tag-row" style="margin-top:12px"><span class="tag">${m.task}</span></div></article>`).join("");
}

function renderAll() {
  renderStats(); renderInventory(); renderRecipes(); renderRecipes("#dashboard-recipes"); renderAlerts(); renderShopping(); renderMembers();
}

function setupEvents() {
  document.addEventListener("click", (e) => {
    const nav = e.target.closest(".nav, .nav-shortcut");
    if (nav?.dataset.page) navigate(nav.dataset.page);
    const remFood = e.target.closest("[data-remove-food]");
    if (remFood) { state.inventory.splice(+remFood.dataset.removeFood, 1); saveState(); renderAll(); }
    const remShop = e.target.closest("[data-remove-shop]");
    if (remShop) { state.shopping.splice(+remShop.dataset.removeShop, 1); saveState(); renderAll(); }
    const tog = e.target.closest("[data-toggle-shop]");
    if (tog) { state.shopping[+tog.dataset.toggleShop].done = !state.shopping[+tog.dataset.toggleShop].done; saveState(); renderShopping(); }
    const addNeeds = e.target.closest("[data-add-needs]");
    if (addNeeds) {
      addNeeds.dataset.addNeeds.split("|").forEach(item => {
        if (!state.shopping.some(s => s.item.toLowerCase() === item.toLowerCase())) state.shopping.push({ item, member: "Kevin", done: false });
      });
      saveState(); renderShopping(); navigate("list");
    }
  });
  $("#food-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    state.inventory.unshift({ ...data, owner: "Hafedh" });
    e.target.reset(); saveState(); renderAll();
  });
  $("#shopping-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    state.shopping.unshift({ item: data.item, member: data.member, done: false });
    e.target.reset(); saveState(); renderShopping();
  });
  $("#switch-scan").addEventListener("click", () => {
    scanIndex = (scanIndex + 1) % scanSamples.length;
    $("#scan-image").src = scanSamples[scanIndex].image;
    detected = null;
    $("#detected-name").textContent = "En attente d’analyse";
    $("#detected-detail").textContent = "Téléversement ou photo de l’aliment, reconnaissance, validation, puis ajout à l’inventaire.";
    $("#detected-tags").innerHTML = "";
    $("#add-detected").disabled = true;
  });
  $("#analyze-scan").addEventListener("click", () => {
    detected = scanSamples[scanIndex];
    $("#detected-name").textContent = detected.name;
    $("#detected-detail").textContent = `${detected.qty} • ${detected.zone} • expiration estimée : ${detected.expiry}`;
    $("#detected-tags").innerHTML = detected.tags.map(t => `<span class="tag">${t}</span>`).join("");
    $("#add-detected").disabled = false;
  });
  $("#add-detected").addEventListener("click", () => {
    if (!detected) return;
    state.inventory.unshift({ name: detected.name, qty: detected.qty, zone: detected.zone, expiry: detected.expiry, owner: "Scan" });
    saveState(); renderAll(); navigate("inventory");
  });
  $("#quick-add").addEventListener("click", () => navigate("inventory"));
}

renderAll();
setupEvents();
navigate(location.hash?.replace("#", "") || "dashboard");
