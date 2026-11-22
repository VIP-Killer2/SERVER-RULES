(() => {
  "use strict";

  const translations = window.SITE_TRANSLATIONS;
  const state = { lang: localStorage.getItem("lviv-rp-language") || "uk", open: new Set() };
  const $ = (selector, root = document) => root.querySelector(selector);

  function flatten(groups) {
    if (!Array.isArray(groups)) return [];
    return groups.flatMap(group => (group.articles || []).map(article => ({
      ...article,
      groupTitle: group.title || ""
    })));
  }

  const legislation = flatten(window.BUKOVEL_RULES);
  const criminal = flatten(window.BUKOVEL_CRIMINAL);

  function text(key) { return translations[state.lang][key] || translations.uk[key] || key; }

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.title = state.lang === "ru" ? "ЛЬВІВ РП — Законодательство" : "ЛЬВІВ РП — Законодавство";
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (translations[state.lang][key]) el.textContent = text(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = text(el.dataset.i18nPlaceholder);
    });
    $("#languageToggle").innerHTML = (state.lang === "uk" ? "RU" : "UA") + " <span>↗</span>";
    renderAll();
  }

  function normalize(value) {
    return String(value ?? "").toLocaleLowerCase(state.lang === "ru" ? "ru" : "uk").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function cardMarkup(article, sectionKey) {
    const id = `${sectionKey}-${article.number}`;
    const isOpen = state.open.has(id);
    const group = article.groupTitle;
    const groupDisplay = state.lang === "ru" ? group.replace("Загальні положення","Общие положения").replace("Повага та спілкування","Уважение и общение").replace("Правила RP-поведінки","Правила RP-поведения") : group;
    return `
      <article class="article-card ${isOpen ? "expanded" : ""}" data-article="${id}">
        <button class="article-toggle" type="button" aria-expanded="${isOpen}" aria-controls="${id}-body">
          <span class="article-number">${escapeHtml(article.number)}</span>
          <span class="article-heading"><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(groupDisplay)}</small></span>
          <span class="toggle-icon">${isOpen ? "−" : "+"}</span>
        </button>
        <div class="article-body" id="${id}-body" ${isOpen ? "" : "hidden"}>
          <div class="detail-label">${text("rule")}</div>
          <p>${escapeHtml(article.rule)}</p>
          <div class="punishment-box"><span class="detail-label">${text("punishment")}</span><p>${escapeHtml(article.punishment)}</p></div>
        </div>
      </article>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[ch]));
  }

  function renderSection(sectionKey, data, query) {
    const list = $(`#${sectionKey}List`);
    const empty = $(`#${sectionKey}Empty`);
    const count = $(`#${sectionKey}Count`);
    const q = normalize(query);
    const filtered = data.filter(article => normalize([
      article.number, article.title, article.groupTitle, article.rule, article.punishment
    ].join(" ")).includes(q));

    const groups = [];
    for (const article of filtered) {
      let group = groups.find(item => item.title === article.groupTitle);
      if (!group) { group = { title: article.groupTitle, items: [] }; groups.push(group); }
      group.items.push(article);
    }

    list.innerHTML = groups.map(group => `
      <div class="chapter-block">
        <div class="chapter-heading"><span></span><h3>${escapeHtml(group.title)}</h3><small>${group.items.length}</small></div>
        <div class="article-grid">${group.items.map(article => cardMarkup(article, sectionKey)).join("")}</div>
      </div>`).join("");

    count.textContent = `${filtered.length} ${text("articles")}`;
    empty.hidden = filtered.length !== 0;
    list.hidden = filtered.length === 0;
  }

  function renderAll() {
    renderSection("legislation", legislation, $("#legislationSearch").value);
    renderSection("criminal", criminal, $("#criminalSearch").value);
  }

  document.addEventListener("click", event => {
    const toggle = event.target.closest(".article-toggle");
    if (toggle) {
      const article = toggle.closest("[data-article]");
      const id = article.dataset.article;
      state.open.has(id) ? state.open.delete(id) : state.open.add(id);
      const sectionKey = id.split("-")[0];
      const data = sectionKey === "criminal" ? criminal : legislation;
      const search = $(`#${sectionKey}Search`).value;
      renderSection(sectionKey, data, search);
      return;
    }

    const nav = event.target.closest(".nav-card");
    if (nav) {
      document.querySelectorAll(".nav-card").forEach(item => item.classList.toggle("active", item === nav));
      document.querySelectorAll(".content-section").forEach(item => item.classList.toggle("active", item.id === nav.dataset.target));
      window.scrollTo({ top: document.querySelector(".section-nav").offsetTop - 12, behavior: "smooth" });
    }
  });

  $("#languageToggle").addEventListener("click", () => {
    state.lang = state.lang === "uk" ? "ru" : "uk";
    localStorage.setItem("lviv-rp-language", state.lang);
    applyLanguage();
  });
  $("#legislationSearch").addEventListener("input", renderAll);
  $("#criminalSearch").addEventListener("input", renderAll);
  $("#year").textContent = new Date().getFullYear();

  // Subtle snowfall: limited number of flakes and disabled for reduced-motion users.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const layer = $(".snow-layer");
    for (let i = 0; i < 34; i++) {
      const flake = document.createElement("i");
      flake.className = "snowflake";
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.animationDuration = `${9 + Math.random() * 15}s`;
      flake.style.animationDelay = `${-Math.random() * 20}s`;
      flake.style.opacity = `${0.2 + Math.random() * 0.55}`;
      flake.style.setProperty("--drift", `${-35 + Math.random() * 70}px`);
      flake.style.width = flake.style.height = `${2 + Math.random() * 4}px`;
      layer.appendChild(flake);
    }
  }

  // Friendly diagnostic: empty data is visible in console rather than silently failing.
  if (!legislation.length) console.error("Не завантажено BUKOVEL_RULES: перевірте js/legislation.js");
  if (!criminal.length) console.error("Не завантажено BUKOVEL_CRIMINAL: перевірте js/criminal.js");
  applyLanguage();
})();
