(() => {
  const $ = (selector) => document.querySelector(selector);
  const languageScreen = $("#language-screen");
  const homeScreen = $("#home-screen");
  const rulesScreen = $("#rules-screen");
  const categoryList = $("#category-list");
  const searchInput = $("#article-search");
  const emptyState = $("#empty-state");
  let language = localStorage.getItem("bukovel-language") || "";
  let currentSection = "server";

  const sectionNames = {
    uk: { server: "Правила сервера", criminal: "Кримінальний кодекс" },
    ru: { server: "Правила сервера", criminal: "Уголовный кодекс" }
  };

  function t(key) {
    return (window.BUKOVEL_I18N[language] || window.BUKOVEL_I18N.uk)[key] || key;
  }

  function applyLanguage() {
    document.documentElement.lang = language || "uk";
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = t(key);
    });
    searchInput.placeholder = t("searchPlaceholder");
    $("#search-help").textContent = t("searchHelp");
    if (!rulesScreen.classList.contains("hidden")) renderArticles();
  }

  function chooseLanguage(value) {
    language = value;
    localStorage.setItem("bukovel-language", value);
    languageScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
    rulesScreen.classList.add("hidden");
    applyLanguage();
  }

  function showLanguagePicker() {
    languageScreen.classList.remove("hidden");
    homeScreen.classList.add("hidden");
    rulesScreen.classList.add("hidden");
  }

  function dataForSection() {
    // Дані додамо після отримання й перевірки повного тексту правил.
    return currentSection === "server" ? (window.BUKOVEL_RULES || []) : (window.BUKOVEL_CRIMINAL || []);
  }

  function articleMatches(article, query) {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return true;
    const fields = [article.number, article.title, article.rule, article.punishment]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    return fields.includes(q);
  }

  function renderArticles() {
    const query = searchInput.value;
    const categories = dataForSection();
    categoryList.innerHTML = "";
    let shown = 0;

    categories.forEach((category, index) => {
      const articles = (category.articles || []).filter(article => articleMatches(article, query));
      if (!articles.length) return;
      shown += articles.length;

      const wrapper = document.createElement("section");
      wrapper.className = "category";
      const toggle = document.createElement("button");
      toggle.className = "category-toggle";
      toggle.type = "button";
      toggle.innerHTML = `<span></span><span aria-hidden="true">⌄</span>`;
      toggle.firstElementChild.textContent = category.title || `Категорія ${index + 1}`;

      const list = document.createElement("div");
      list.className = "article-list";
      articles.forEach(article => {
        const card = document.createElement("article");
        card.className = "article";
        const title = document.createElement("h3");
        title.textContent = `${article.number || ""} ${article.title || ""}`.trim();
        const rule = document.createElement("p");
        rule.textContent = article.rule || "";
        card.append(title, rule);
        if (article.punishment) {
          const punishment = document.createElement("p");
          punishment.className = "punishment";
          punishment.textContent = `${t("punishment")}: ${article.punishment}`;
          card.append(punishment);
        }
        list.append(card);
      });
      toggle.addEventListener("click", () => {
        list.classList.toggle("hidden");
        toggle.lastElementChild.textContent = list.classList.contains("hidden") ? "⌄" : "⌃";
      });
      wrapper.append(toggle, list);
      categoryList.append(wrapper);
    });

    emptyState.classList.toggle("hidden", shown > 0);
    emptyState.textContent = categories.length ? t("noResults") : t("noArticles");
    if (categories.length && !shown && !query.trim()) emptyState.textContent = t("noArticles");
  }

  document.querySelectorAll("[data-language]").forEach(button => {
    button.addEventListener("click", () => chooseLanguage(button.dataset.language));
  });
  document.querySelectorAll("[data-section]").forEach(button => {
    button.addEventListener("click", () => {
      currentSection = button.dataset.section;
      homeScreen.classList.add("hidden");
      rulesScreen.classList.remove("hidden");
      $("#section-heading").textContent = sectionNames[language][currentSection];
      searchInput.value = "";
      renderArticles();
    });
  });
  $("#change-language").addEventListener("click", showLanguagePicker);
  $("#rules-language").addEventListener("click", showLanguagePicker);
  $("#back-home").addEventListener("click", () => {
    rulesScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
  });
  searchInput.addEventListener("input", renderArticles);

  const snow = $("#snow");
  for (let i = 0; i < 42; i++) {
    const flake = document.createElement("span");
    flake.className = "snowflake";
    flake.textContent = Math.random() > .5 ? "❄" : "•";
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.animationDuration = `${8 + Math.random() * 15}s`;
    flake.style.animationDelay = `${-Math.random() * 20}s`;
    flake.style.fontSize = `${8 + Math.random() * 13}px`;
    snow.append(flake);
  }

  if (language === "uk" || language === "ru") chooseLanguage(language);
  else showLanguagePicker();
})();
