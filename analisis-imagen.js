/* =====================================================================
   SAMILU · ANÁLISIS DE IMAGEN PÚBLICA
   JavaScript puro (sin librerías)

   ÍNDICE
   01. Utilidades
   02. Respaldo de imágenes
   03. Encabezado: sección actual y progreso de lectura
   04. Diálogos: foco atrapado, Escape y bloqueo de scroll
   05. Menú
   06. Pestañas
   07. Encuesta: gráficos dibujados a partir de las tablas
   08. Metodología: filtro por tipo de técnica
   09. Identidad: anatomía del imagotipo
   10. Reputación: ordenar plataformas
   11. Enlaces que abren una estrategia del plan
   12. Visor de imágenes
   13. Aparición al hacer scroll

   Todo el contenido está en index.html. Este archivo solo añade
   comportamiento: si cambias un texto o un número en el HTML, los
   gráficos y contadores se actualizan solos.
===================================================================== */

(function () {
  "use strict";

  /* ===================================================================
     01. UTILIDADES
  =================================================================== */

  /** Primer elemento que coincide con el selector. */
  const $ = (selector, root = document) => root.querySelector(selector);

  /** Todos los elementos que coinciden, como lista normal. */
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /** ¿El sistema pide reducir el movimiento? */
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** ¿Pantalla de escritorio? (mismo punto de corte que el CSS: 1024 px) */
  const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

  /** Dirección del sitio publicado de SAMILU. */
  const SITIO = "https://k71559676-bit.github.io/Sami/";

  /** Lleva la vista y el foco a una sección y actualiza la dirección (#id). */
  function goToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ block: "start" });
    target.focus({ preventScroll: true });
    window.history.replaceState(null, "", "#" + id);
  }


  /* ===================================================================
     02. RESPALDO DE IMÁGENES
     Si falta un archivo de la carpeta img/, se carga el original desde
     el sitio publicado. Con la carpeta completa esto no hace nada.
  =================================================================== */
  const IMAGENES_ORIGINALES = {
    "logo-samilu.png": "logo samilu.png",
    "hero-selva.jpg": "hero samilu.png",
    "empresa-entorno.jpg": "empresa.png",
    "identidad-visual.jpg": "auditoria-portada.png",
    "crema-untable.jpg": "crema untable.jpeg",
    "barras-energeticas.jpg": "barra.jpeg",
    "miel-saborizada.jpg": "miel saborizada.jpeg",
  };

  $$("img").forEach((img) => {
    const file = (img.getAttribute("src") || "").split("/").pop();
    const original = IMAGENES_ORIGINALES[file];
    if (!original) return;

    const useOriginal = () => {
      img.src = SITIO + "img/" + encodeURI(original);
    };

    if (img.complete && img.naturalWidth === 0) useOriginal();
    else img.addEventListener("error", useOriginal, { once: true });
  });


  /* ===================================================================
     03. ENCABEZADO: SECCIÓN ACTUAL Y PROGRESO DE LECTURA
     Las secciones se leen del índice del menú (#menu-sections):
     para añadir una, basta con añadir allí su enlace.
  =================================================================== */
  const menuButton = $("#menu-open");
  const currentNum = $("#current-num");
  const currentLabel = $("#current-label");
  const progressBar = $("#progress-bar");

  const sections = $$("#menu-sections a")
    .map((link) => {
      const id = link.getAttribute("href").slice(1);
      return {
        id,
        link,
        element: document.getElementById(id),
        num: $(".menu__num", link).textContent.trim(),
        label: link.lastElementChild.textContent.trim(),
      };
    })
    .filter((section) => section.element);

  let activeId = null;

  function updateHeader() {
    // Sección activa: la última cuyo inicio ya pasó el 38 % de la pantalla
    const line = window.innerHeight * 0.38;
    let current = sections[0];
    sections.forEach((section) => {
      if (section.element.getBoundingClientRect().top <= line) current = section;
    });

    if (current && current.id !== activeId) {
      activeId = current.id;
      currentNum.textContent = current.num;
      currentLabel.textContent = current.label;
      menuButton.setAttribute("aria-label", "Abrir menú. Sección actual: " + current.label);
      sections.forEach((section) => {
        if (section === current) section.link.setAttribute("aria-current", "location");
        else section.link.removeAttribute("aria-current");
      });
    }

    // Barra de progreso
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progressBar.style.transform = "scaleX(" + ratio + ")";
  }

  let headerFrame = 0;
  function requestHeaderUpdate() {
    if (headerFrame) return;
    headerFrame = requestAnimationFrame(() => {
      headerFrame = 0;
      updateHeader();
    });
  }

  updateHeader();
  window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
  window.addEventListener("resize", requestHeaderUpdate);


  /* ===================================================================
     04. DIÁLOGOS
     Comportamiento común del menú y del visor: bloquea el scroll de la
     página, mantiene el foco dentro, cierra con Escape y, al cerrar,
     devuelve el foco al elemento que lo abrió.
  =================================================================== */
  const FOCUSABLE = 'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

  function openDialog(container, options) {
    const previous = document.activeElement;
    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;

    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = scrollbar + "px";

    const focusables = () =>
      $$(FOCUSABLE, container).filter((element) => element.getClientRects().length > 0);

    const first = options.initialFocus || focusables()[0];
    if (first) first.focus();

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        options.onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      const outside = !container.contains(active);

      if (event.shiftKey && (active === firstItem || outside)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (active === lastItem || outside)) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKey);

    // Devuelve la función que deshace todo al cerrar
    return function release() {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = "";
      root.style.paddingRight = "";
      if (previous && previous.focus) previous.focus({ preventScroll: true });
    };
  }


  /* ===================================================================
     05. MENÚ
  =================================================================== */
  const menu = $("#menu");
  const menuPages = $("#menu-pages");
  const menuHint = $("#menu-hint");
  const pageButtons = $$("button[aria-controls]", menuPages);
  let releaseMenu = null;

  function openMenu() {
    menu.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    releaseMenu = openDialog(menu, { onClose: closeMenu, initialFocus: $(".menu__close", menu) });
    syncPaneHeight();
  }

  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    if (releaseMenu) {
      releaseMenu();
      releaseMenu = null;
    }
  }

  menuButton.addEventListener("click", openMenu);
  $$("[data-menu-close]", menu).forEach((element) => element.addEventListener("click", closeMenu));

  // Enlaces a secciones de esta página: cierran el menú y luego desplazan
  $$('a[href^="#"]', menu).forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const id = link.getAttribute("href").slice(1);
      closeMenu();
      window.setTimeout(() => goToSection(id), 80);
    });
  });

  // Páginas con apartados: solo una desplegada a la vez
  function setOpenPage(button) {
    pageButtons.forEach((item) => {
      const open = item === button;
      item.setAttribute("aria-expanded", String(open));
      document.getElementById(item.getAttribute("aria-controls")).hidden = !open;
    });
    menuHint.hidden = button !== null;
    syncPaneHeight();
  }

  pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      setOpenPage(isOpen ? null : button);
    });
  });

  // En escritorio el panel de apartados va junto a la lista: la lista
  // crece hasta su altura para que nunca quede recortado.
  function syncPaneHeight() {
    const pane = $(".menu__pane:not([hidden])", menuPages);
    menuPages.style.minHeight = pane && isDesktop() ? pane.scrollHeight + "px" : "";
  }

  window.addEventListener("resize", () => {
    if (!menu.hidden) syncPaneHeight();
  });

  // Los enlaces a otras páginas son relativos (empresa.html…), como en el
  // resto del sitio. Si esta página se abre fuera del sitio publicado,
  // se dirigen a él para que sigan funcionando.
  if (window.location.hostname !== new URL(SITIO).hostname) {
    $$("a[href]", menuPages).forEach((link) => {
      const href = link.getAttribute("href");
      if (!href.startsWith("#") && !/^https?:/.test(href)) link.href = SITIO + href;
    });
  }


  /* ===================================================================
     06. PESTAÑAS
     Funciona con cualquier bloque marcado con data-tabs que contenga
     botones role="tab" (con aria-controls) y paneles role="tabpanel".
     Flechas, Inicio y Fin cambian de pestaña con el teclado.
  =================================================================== */
  const tabGroups = new Map();

  function initTabs(root) {
    const tabs = $$('[role="tab"]', root);
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

    function select(index, moveFocus) {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[i].hidden = !selected;
      });
      if (moveFocus) tabs[index].focus();
      root.dispatchEvent(new CustomEvent("tabchange", { detail: { index: index } }));
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i, false));

      tab.addEventListener("keydown", (event) => {
        const last = tabs.length - 1;
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = i === last ? 0 : i + 1;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = i === 0 ? last : i - 1;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = last;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
      });
    });

    tabGroups.set(root, { select: select, count: tabs.length });
  }

  $$("[data-tabs]").forEach(initTabs);


  /* ===================================================================
     07. ENCUESTA
     Cada pregunta tiene su tabla de frecuencias en el HTML. A partir de
     esos números se dibujan: la barra de la tabla, el panal (una celda
     por persona) y la barra comparativa de cada aspecto.
  =================================================================== */

  /** Letras que se muestran dentro de cada celda del panal. */
  const CODIGOS = { mb: "MB", b: "B", r: "R", m: "M", nv: "NV" };

  /** Respuestas que cuentan como valoración positiva. */
  const POSITIVAS = ["mb", "b"];

  $$("[data-survey]").forEach((survey) => {
    const tabs = $$('[role="tab"]', survey);
    const panels = $$(".question", survey);

    panels.forEach((panel, panelIndex) => {
      // 1. Leer la tabla
      const rows = $$("tbody tr", panel).map((row) => ({
        row: row,
        key: row.dataset.answer,
        label: row.cells[0].textContent.trim(),
        count: parseInt(row.cells[1].textContent, 10) || 0,
      }));
      const total = rows.reduce((sum, item) => sum + item.count, 0) || 1;

      // 2. Tabla: color de cada respuesta y barra proporcional
      rows.forEach((item, i) => {
        const percent = (item.count / total) * 100;
        item.row.classList.add("answer--" + item.key);
        item.row.cells[0].insertAdjacentHTML(
          "beforeend",
          '<span class="freq__track" aria-hidden="true">' +
            '<span class="freq__fill" style="width:' + percent + "%; --d:" + (120 + i * 70) + 'ms"></span>' +
          "</span>"
        );
      });

      // 3. Panal: una celda por persona, en dos filas
      const people = [];
      rows.forEach((item) => {
        for (let n = 0; n < item.count; n++) people.push(item.key);
      });
      const perRow = Math.ceil(people.length / 2);
      const cell = (key, position) =>
        '<span class="hex honeycomb__cell answer--' + key + '" style="--d:' + position * 45 + 'ms">' +
        (CODIGOS[key] || "") + "</span>";

      const comb = $("[data-honeycomb]", panel);
      comb.innerHTML =
        '<div class="honeycomb__row">' +
          people.slice(0, perRow).map((key, i) => cell(key, i)).join("") +
        "</div>" +
        '<div class="honeycomb__row honeycomb__row--offset">' +
          people.slice(perRow).map((key, i) => cell(key, i + perRow)).join("") +
        "</div>";
      comb.setAttribute("role", "img");
      comb.setAttribute(
        "aria-label",
        "De " + total + " personas: " +
          rows.filter((item) => item.count > 0)
              .map((item) => item.count + " " + item.label.toLowerCase())
              .join(", ") + "."
      );

      // 4. Comparación: barra apilada y porcentaje positivo del aspecto
      const tab = tabs[panelIndex];
      if (!tab) return;

      const bar = $("[data-bar]", tab);
      if (bar) {
        bar.innerHTML = rows
          .filter((item) => item.count > 0)
          .map((item) => '<span class="aspect__seg answer--' + item.key + '" style="--n:' + item.count + '"></span>')
          .join("");
      }

      const positive = $("[data-positive]", tab);
      if (positive) {
        const sum = rows
          .filter((item) => POSITIVAS.includes(item.key))
          .reduce((acc, item) => acc + item.count, 0);
        positive.textContent = Math.round((sum / total) * 100) + "%";
      }
    });

    // Botones anterior / siguiente
    const group = tabGroups.get(survey);
    const prev = $("[data-prev]", survey);
    const next = $("[data-next]", survey);
    const nextLabel = $("[data-next-label]", survey);
    const nextDefault = nextLabel.innerHTML;
    let current = 0;

    function updateNav(index) {
      const last = index === panels.length - 1;
      current = index;
      prev.setAttribute("aria-disabled", String(index === 0));
      next.setAttribute("aria-disabled", String(last));
      if (last) nextLabel.textContent = "Última pregunta";
      else nextLabel.innerHTML = nextDefault;
    }

    survey.addEventListener("tabchange", (event) => updateNav(event.detail.index));

    prev.addEventListener("click", () => {
      if (current > 0) group.select(current - 1, false);
    });

    next.addEventListener("click", () => {
      if (current < panels.length - 1) group.select(current + 1, false);
    });
  });


  /* ===================================================================
     08. METODOLOGÍA: FILTRO POR TIPO DE TÉCNICA
     Los botones data-filter atenúan las técnicas de otro tipo.
  =================================================================== */
  $$("[data-method]").forEach((root) => {
    const buttons = $$("[data-filter]", root);
    const items = $$(".technique", root);

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        items.forEach((item) => {
          item.classList.toggle("is-dimmed", filter !== "all" && item.dataset.type !== filter);
        });
      });
    });
  });


  /* ===================================================================
     09. IDENTIDAD: ANATOMÍA DEL IMAGOTIPO
     Al pasar por un elemento de la lista (o al enfocarlo) se resalta su
     marca sobre el logotipo. Un clic lo deja fijado.
  =================================================================== */
  $$("[data-anatomy]").forEach((root) => {
    const buttons = $$("button[data-part]", root);
    const dots = $$(".anatomy__dot", root);
    let pinned = null;

    function show(part) {
      buttons.concat(dots).forEach((element) => {
        element.classList.toggle("is-active", element.dataset.part === part);
      });
    }

    buttons.forEach((button) => {
      const part = button.dataset.part;
      button.setAttribute("aria-pressed", "false");

      button.addEventListener("pointerenter", () => show(part));
      button.addEventListener("focus", () => show(part));
      button.addEventListener("pointerleave", () => show(pinned));
      button.addEventListener("blur", () => show(pinned));

      button.addEventListener("click", () => {
        pinned = pinned === part ? null : part;
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.part === pinned)));
        show(pinned);
      });
    });

    dots.forEach((dot) => {
      dot.addEventListener("pointerenter", () => show(dot.dataset.part));
      dot.addEventListener("pointerleave", () => show(pinned));
    });
  });


  /* ===================================================================
     10. REPUTACIÓN: ORDENAR PLATAFORMAS
     Cada fila indica data-score y data-reviews. Los botones data-sort
     reordenan la lista con un desplazamiento suave.
  =================================================================== */
  $$("[data-rep]").forEach((root) => {
    const list = $(".rep__list", root);
    const items = $$(".platform", list);
    const buttons = $$("[data-sort]", root);

    // Barra de volumen: proporción respecto a la plataforma con más reseñas
    const maxReviews = Math.max.apply(null, items.map((item) => Number(item.dataset.reviews)));
    items.forEach((item) => {
      const share = (Number(item.dataset.reviews) / maxReviews) * 100;
      $(".minibar", item).style.setProperty("--share", share + "%");
    });

    function sortBy(key) {
      const before = new Map(items.map((item) => [item, item.getBoundingClientRect().top]));

      items
        .slice()
        .sort((a, b) => Number(b.dataset[key]) - Number(a.dataset[key]))
        .forEach((item) => list.appendChild(item));

      if (reducedMotion) return;

      items.forEach((item) => {
        const delta = before.get(item) - item.getBoundingClientRect().top;
        if (!delta) return;
        item.animate(
          [{ transform: "translateY(" + delta + "px)" }, { transform: "none" }],
          { duration: 450, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
      });
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        sortBy(button.dataset.sort);
      });
    });
  });


  /* ===================================================================
     11. ENLACES QUE ABREN UNA ESTRATEGIA DEL PLAN
     <a href="#plan" data-goto-tab="plan-tab-3"> selecciona esa pestaña
     antes de desplazarse a la sección.
  =================================================================== */
  $$("[data-goto-tab]").forEach((link) => {
    link.addEventListener("click", () => {
      const tab = document.getElementById(link.dataset.gotoTab);
      if (tab) tab.click();
    });
  });


  /* ===================================================================
     12. VISOR DE IMÁGENES
     Reúne todos los botones data-zoom, en el orden en que aparecen.
     Escape cierra; las flechas cambian de imagen.
  =================================================================== */
  const lightbox = $("#lightbox");
  const zoomButtons = $$("[data-zoom]");

  if (lightbox && zoomButtons.length > 0) {
    const image = $("#lightbox-image");
    const caption = $("#lightbox-caption");
    const counter = $("#lightbox-counter");
    const stage = $("#lightbox-stage");
    const closeButton = $("#lightbox-close");
    let index = 0;
    let releaseLightbox = null;

    function showImage(position) {
      index = (position + zoomButtons.length) % zoomButtons.length;
      const source = $("img", zoomButtons[index]);

      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      caption.textContent = zoomButtons[index].dataset.caption || source.alt;
      counter.textContent = index + 1 + " / " + zoomButtons.length;

      // Reinicia la animación de entrada
      image.classList.remove("swap");
      void image.offsetWidth;
      image.classList.add("swap");
    }

    function onArrows(event) {
      if (event.key === "ArrowRight") showImage(index + 1);
      if (event.key === "ArrowLeft") showImage(index - 1);
    }

    function openLightbox(position) {
      showImage(position);
      lightbox.hidden = false;
      releaseLightbox = openDialog(lightbox, { onClose: closeLightbox, initialFocus: closeButton });
      document.addEventListener("keydown", onArrows);
    }

    function closeLightbox() {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      document.removeEventListener("keydown", onArrows);
      if (releaseLightbox) {
        releaseLightbox();
        releaseLightbox = null;
      }
    }

    zoomButtons.forEach((button, position) => {
      button.setAttribute("aria-label", "Ampliar imagen: " + $("img", button).alt);
      button.addEventListener("click", () => openLightbox(position));
    });

    closeButton.addEventListener("click", closeLightbox);
    $("#lightbox-prev").addEventListener("click", () => showImage(index - 1));
    $("#lightbox-next").addEventListener("click", () => showImage(index + 1));

    // Clic en el fondo (fuera de la imagen) también cierra
    stage.addEventListener("click", (event) => {
      if (event.target === stage) closeLightbox();
    });
  }


  /* ===================================================================
     13. APARICIÓN AL HACER SCROLL
     Los bloques con data-reveal entran suavemente al llegar a la vista.
     Nada se oculta hasta el primer desplazamiento real: así el contenido
     siempre es visible si no hay scroll (impresión, lectores de pantalla).
  =================================================================== */
  if (!reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );

    const arm = () => {
      const limit = window.innerHeight;
      $$("[data-reveal]").forEach((element) => {
        if (element.getBoundingClientRect().top > limit) {
          element.classList.add("will-reveal");
          observer.observe(element);
        }
      });
    };

    window.addEventListener("scroll", arm, { passive: true, once: true });
  }
})();
