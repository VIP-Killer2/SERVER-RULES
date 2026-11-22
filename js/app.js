(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const state = { open: new Set() };

  function ukrainian(value) {
    if (value && typeof value === "object") return value.uk || value.ua || "";
    return value ?? "";
  }

  function flatten(groups) {
    if (!Array.isArray(groups)) return [];
    return groups.flatMap(group => (group.articles || []).map(article => ({
      number: article.number,
      title: ukrainian(article.title),
      rule: ukrainian(article.rule),
      punishment: ukrainian(article.punishment),
      groupTitle: ukrainian(group.title)
    })));
  }

  const datasets = {
    legislation: flatten(window.BUKOVEL_RULES),
    criminal: flatten(window.BUKOVEL_CRIMINAL)
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function normalize(value) {
    return String(value ?? "").toLocaleLowerCase("uk").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function renderSection(sectionKey) {
    const data = datasets[sectionKey] || [];
    const list = $(`#${sectionKey}List`);
    const empty = $(`#${sectionKey}Empty`);
    const count = $(`#${sectionKey}Count`);
    const query = normalize($(`#${sectionKey}Search`).value);
    const filtered = data.filter(article => normalize([
      article.number, article.title, article.groupTitle, article.rule, article.punishment
    ].join(" ")).includes(query));

    const groups = [];
    for (const article of filtered) {
      let group = groups.find(item => item.title === article.groupTitle);
      if (!group) {
        group = { title: article.groupTitle, items: [] };
        groups.push(group);
      }
      group.items.push(article);
    }

    list.innerHTML = groups.map(group => `
      <div class="chapter-block">
        <div class="chapter-heading"><span></span><h3>${escapeHtml(group.title)}</h3><small>${group.items.length}</small></div>
        <div class="article-grid">${group.items.map(article => {
          const id = `${sectionKey}-${article.number}`;
          const isOpen = state.open.has(id);
          return `
            <article class="article-card ${isOpen ? "expanded" : ""}" data-article="${escapeHtml(id)}">
              <button class="article-toggle" type="button" aria-expanded="${isOpen}" aria-controls="${escapeHtml(id)}-body">
                <span class="article-number">${escapeHtml(article.number)}</span>
                <span class="article-heading"><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(group.title)}</small></span>
                <span class="toggle-icon" aria-hidden="true">${isOpen ? "−" : "+"}</span>
              </button>
              <div class="article-body" id="${escapeHtml(id)}-body" ${isOpen ? "" : "hidden"}>
                <div class="detail-label">ЗМІСТ СТАТТІ</div>
                <p>${escapeHtml(article.rule)}</p>
                <div class="punishment-box"><span class="detail-label">ПОКАРАННЯ</span><p>${escapeHtml(article.punishment)}</p></div>
              </div>
            </article>`;
        }).join("")}</div>
      </div>`).join("");

    count.textContent = `${filtered.length} ${articleWord(filtered.length)}`;
    empty.hidden = filtered.length !== 0;
    list.hidden = filtered.length === 0;
  }

  function articleWord(number) {
    const lastTwo = number % 100;
    const last = number % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return "статей";
    if (last === 1) return "стаття";
    if (last >= 2 && last <= 4) return "статті";
    return "статей";
  }

  function renderAll() {
    renderSection("legislation");
    renderSection("criminal");
  }

  document.addEventListener("click", event => {
    const toggle = event.target.closest(".article-toggle");
    if (toggle) {
      const card = toggle.closest("[data-article]");
      const id = card.dataset.article;
      if (state.open.has(id)) state.open.delete(id);
      else state.open.add(id);
      renderSection(id.startsWith("criminal-") ? "criminal" : "legislation");
      return;
    }

    const nav = event.target.closest(".nav-card");
    if (nav) {
      document.querySelectorAll(".nav-card").forEach(item => item.classList.toggle("active", item === nav));
      document.querySelectorAll(".content-section").forEach(item => item.classList.toggle("active", item.id === nav.dataset.target));
      window.scrollTo({ top: $(".section-nav").offsetTop - 12, behavior: "smooth" });
    }
  });

  $("#legislationSearch").addEventListener("input", () => renderSection("legislation"));
  $("#criminalSearch").addEventListener("input", () => renderSection("criminal"));
  $("#year").textContent = new Date().getFullYear();

  if (window.matchMedia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const layer = $(".snow-layer");
    for (let i = 0; i < 34; i++) {
      const flake = document.createElement("i");
      flake.className = "snowflake";
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.animationDuration = `${9 + Math.random() * 13}s`;
      flake.style.animationDelay = `${-Math.random() * 18}s`;
      flake.style.opacity = `${0.25 + Math.random() * 0.65}`;
      const size = 2 + Math.random() * 3;
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;
      flake.style.setProperty("--drift", `${Math.round(Math.random() * 70 - 35)}px`);
      layer.append(flake);
    }
  }

  renderAll();
})();
