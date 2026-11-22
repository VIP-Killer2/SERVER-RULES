(() => {
  const $ = (s) => document.querySelector(s);
  const cards = $("#cards"), search = $("#search"), notice = $("#notice");
  let lang = localStorage.getItem("lviv-rp-lang") || "uk";
  let section = "criminal";

  function currentData() {
    return section === "criminal" ? window.CRIMINAL_DATA[lang] : window.LEGISLATION_DATA[lang];
  }
  function applyLanguage() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const value = window.LANG[lang][key];
      if (value !== undefined) el.innerHTML = value;
    });
    document.querySelectorAll(".lang-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.lang === lang));
    search.placeholder = window.LANG[lang].searchHint;
    render();
  }
  function render() {
    const t = window.LANG[lang];
    $("#section-title").textContent = section === "criminal" ? t.criminalTitle : t.legislationTitle;
    $("#section-description").textContent = section === "criminal" ? t.criminalDesc : t.legislationDesc;
    notice.hidden = section !== "criminal";
    notice.textContent = section === "criminal" ? t.criminalNotice : "";
    const query = search.value.trim().toLocaleLowerCase(lang === "uk" ? "uk" : "ru");
    const items = currentData().filter(item => [item.number,item.title,item.subtitle,item.text].join(" ").toLocaleLowerCase(lang === "uk" ? "uk" : "ru").includes(query));
    cards.innerHTML = "";
    items.forEach(item => {
      const article = document.createElement("article");
      article.className = "document-card";
      const toggle = document.createElement("button");
      toggle.className = "card-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-expanded","false");
      const number = document.createElement("span");
      number.className = "card-number";
      number.textContent = item.number;
      const copy = document.createElement("span");
      copy.className = "card-copy";
      const title = document.createElement("span");
      title.className = "card-title";
      title.textContent = item.title;
      const subtitle = document.createElement("span");
      subtitle.className = "card-subtitle";
      subtitle.textContent = item.subtitle;
      copy.append(title,subtitle);
      const chevron = document.createElement("span");
      chevron.className = "card-chevron";
      chevron.textContent = "⌄";
      toggle.append(number,copy,chevron);
      const body = document.createElement("div");
      body.className = "card-body";
      const inner = document.createElement("div");
      inner.className = "card-body-inner";
      const text = document.createElement("div");
      text.className = "card-text";
      item.text.split("\n").forEach(line => {
        const p = document.createElement("p");
        p.textContent = line;
        text.appendChild(p);
      });
      inner.appendChild(text); body.appendChild(inner);
      toggle.addEventListener("click", () => {
        const open = article.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      article.append(toggle,body);
      cards.appendChild(article);
    });
    $("#empty").hidden = items.length !== 0;
  }
  document.querySelectorAll(".lang-btn").forEach(btn => btn.addEventListener("click", () => {
    lang = btn.dataset.lang;
    localStorage.setItem("lviv-rp-lang",lang);
    applyLanguage();
  }));
  document.querySelectorAll(".section-tab").forEach(btn => btn.addEventListener("click", () => {
    section = btn.dataset.section;
    document.querySelectorAll(".section-tab").forEach(tab => tab.classList.toggle("active",tab === btn));
    search.value = "";
    render();
  }));
  search.addEventListener("input",render);
  document.addEventListener("keydown",e => {
    if (e.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) {
      e.preventDefault(); search.focus();
    }
    if (e.key === "Escape" && document.activeElement === search) {
      search.value = ""; render(); search.blur();
    }
  });
  $("#year").textContent = new Date().getFullYear();
  const snow = $("#snow");
  for (let i=0;i<34;i++) {
    const flake = document.createElement("span");
    flake.className = "snowflake";
    flake.textContent = i%4===0 ? "✧" : "•";
    flake.style.left = Math.random()*100+"%";
    flake.style.animationDuration = (9+Math.random()*15)+"s";
    flake.style.animationDelay = (-Math.random()*20)+"s";
    flake.style.fontSize = (5+Math.random()*9)+"px";
    snow.appendChild(flake);
  }
  applyLanguage();
})();
