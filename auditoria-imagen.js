
/* =========================================================
   SAMILU · AUDITORÍA DE IMAGEN
   INTERACCIONES Y ANIMACIONES
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* -----------------------------------------------
       1. CRONOGRAMA INTERACTIVO POR SEMANAS
    ------------------------------------------------ */

    const cronograma = document.querySelector("#cronograma");

    if (cronograma) {
        const semanas = [
            {
                semana: "SEMANA 1",
                titulo: "Planificación",
                descripcion:
                    "Definición del problema, objetivos, métodos e instrumentos para recopilar información."
            },
            {
                semana: "SEMANA 2",
                titulo: "Recopilación",
                descripcion:
                    "Aplicación de encuestas, entrevistas y observación de materiales y canales de comunicación."
            },
            {
                semana: "SEMANA 3",
                titulo: "Análisis",
                descripcion:
                    "Organización de la información, interpretación de los datos e identificación de hallazgos."
            },
            {
                semana: "SEMANA 4",
                titulo: "Informe y propuestas",
                descripcion:
                    "Elaboración del diagnóstico, conclusiones y propuestas de mejora para SAMILU."
            }
        ];

        const botones = cronograma.querySelectorAll(".timeline-tab");
        const semanaTexto = document.querySelector("#timelineWeek");
        const tituloTexto = document.querySelector("#timelineTitle");
        const descripcionTexto = document.querySelector("#timelineDescription");
        const progreso = document.querySelector("#timelineProgress");
        const indicador = document.querySelector("#timelineCaption");
        const panel = cronograma.querySelector(".timeline-panel");

        function mostrarSemana(indice) {
            const datos = semanas[indice];

            if (!datos) return;

            semanaTexto.textContent = datos.semana;
            tituloTexto.textContent = datos.titulo;
            descripcionTexto.textContent = datos.descripcion;

            progreso.style.width =
                `${((indice + 1) / semanas.length) * 100}%`;

            indicador.textContent =
                `Etapa ${indice + 1} de ${semanas.length}`;

            botones.forEach((boton, posicion) => {
                const seleccionado = posicion === indice;

                boton.classList.toggle("active", seleccionado);
                boton.setAttribute(
                    "aria-selected",
                    String(seleccionado)
                );

                boton.tabIndex = seleccionado ? 0 : -1;
            });

            /* Reiniciar la animación del panel */
            if (panel) {
                panel.style.animation = "none";
                void panel.offsetWidth;
                panel.style.animation = "";
            }
        }

        botones.forEach((boton, indice) => {
            boton.addEventListener("click", () => {
                mostrarSemana(indice);
            });

            /* Navegación con flechas del teclado */
            boton.addEventListener("keydown", (evento) => {
                let siguiente = indice;

                if (evento.key === "ArrowRight" ||
                    evento.key === "ArrowDown") {
                    siguiente = (indice + 1) % botones.length;
                } else if (
                    evento.key === "ArrowLeft" ||
                    evento.key === "ArrowUp"
                ) {
                    siguiente =
                        (indice - 1 + botones.length) % botones.length;
                } else if (evento.key === "Home") {
                    siguiente = 0;
                } else if (evento.key === "End") {
                    siguiente = botones.length - 1;
                } else {
                    return;
                }

                evento.preventDefault();
                botones[siguiente].focus();
                mostrarSemana(siguiente);
            });
        });

        mostrarSemana(0);
    }


    /* -----------------------------------------------
       2. VISOR DE IMÁGENES AMPLIADAS
    ------------------------------------------------ */

    const visor = document.querySelector("#imageLightbox");
    const imagenVisor = document.querySelector("#lightboxImage");
    const textoVisor = document.querySelector("#lightboxCaption");
    const botonCerrar = document.querySelector("#lightboxClose");
    const disparadores = document.querySelectorAll(".zoom-trigger");

    let elementoAnterior = null;

    function abrirImagen(boton) {
        if (!visor || !imagenVisor) return;

        const imagen = boton.querySelector("img");
        const ruta = boton.dataset.image ||
            (imagen ? imagen.currentSrc || imagen.src : "");

        if (!ruta) return;

        elementoAnterior = boton;

        imagenVisor.src = ruta;
        imagenVisor.alt = imagen ? imagen.alt : "";

        textoVisor.textContent =
            boton.dataset.caption ||
            (imagen ? imagen.alt : "");

        visor.classList.add("open");
        visor.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        if (botonCerrar) {
            botonCerrar.focus();
        }
    }

    function cerrarImagen() {
        if (!visor) return;

        visor.classList.remove("open");
        visor.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        imagenVisor.src = "";

        if (elementoAnterior) {
            elementoAnterior.focus();
        }
    }

    disparadores.forEach((boton) => {
        boton.addEventListener("click", () => {
            abrirImagen(boton);
        });
    });

    if (botonCerrar) {
        botonCerrar.addEventListener("click", cerrarImagen);
    }

    if (visor) {
        visor.addEventListener("click", (evento) => {
            if (
                evento.target === visor ||
                evento.target === imagenVisor
            ) {
                cerrarImagen();
            }
        });
    }

    document.addEventListener("keydown", (evento) => {
        if (
            evento.key === "Escape" &&
            visor &&
            visor.classList.contains("open")
        ) {
            cerrarImagen();
        }
    });


    /* -----------------------------------------------
       3. ANIMACIONES AL DESPLAZARSE
    ------------------------------------------------ */

    const elementosAnimados = document.querySelectorAll(
        ".objective-card, .topic-card, .method-card, " +
        ".sample-stat, .activity-card, .foda-card, " +
        ".action-card, .results-panel, .conclusions-list article"
    );

    const movimientoReducido = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if ("IntersectionObserver" in window && !movimientoReducido) {
        elementosAnimados.forEach((elemento) => {
            elemento.classList.add("reveal");
        });

        const observador = new IntersectionObserver(
            (entradas, observer) => {
                entradas.forEach((entrada) => {
                    if (entrada.isIntersecting) {
                        entrada.target.classList.add("visible");
                        observer.unobserve(entrada.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -30px 0px"
            }
        );

        elementosAnimados.forEach((elemento) => {
            observador.observe(elemento);
        });
    }


    /* -----------------------------------------------
       4. RESALTAR EL APARTADO ACTUAL DEL ÍNDICE
    ------------------------------------------------ */

    const enlacesIndice = document.querySelectorAll(
        ".audit-index a[href^='#']"
    );

    const secciones = Array.from(enlacesIndice)
        .map((enlace) => {
            const id = enlace.getAttribute("href");
            return document.querySelector(id);
        })
        .filter(Boolean);

    function resaltarIndice(idActual) {
        enlacesIndice.forEach((enlace) => {
            const activo =
                enlace.getAttribute("href") === `#${idActual}`;

            enlace.classList.toggle("active", activo);
        });
    }

    if ("IntersectionObserver" in window && secciones.length) {
        const observadorSecciones = new IntersectionObserver(
            (entradas) => {
                const visibles = entradas
                    .filter((entrada) => entrada.isIntersecting)
                    .sort(
                        (a, b) =>
                            b.intersectionRatio - a.intersectionRatio
                    );

                if (visibles.length) {
                    resaltarIndice(visibles[0].target.id);
                }
            },
            {
                rootMargin: "-18% 0px -65% 0px",
                threshold: [0, 0.15, 0.3, 0.5]
            }
        );

        secciones.forEach((seccion) => {
            observadorSecciones.observe(seccion);
        });
    }

    enlacesIndice.forEach((enlace) => {
        enlace.addEventListener("click", () => {
            const id = enlace.getAttribute("href").slice(1);
            resaltarIndice(id);
        });
    });


    /* -----------------------------------------------
       5. ANIMACIÓN SUAVE DE LOS ENLACES INTERNOS
    ------------------------------------------------ */

    document.querySelectorAll(
        '.pagina-auditoria a[href^="#"]'
    ).forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            const destino = document.querySelector(
                enlace.getAttribute("href")
            );

            if (!destino) return;

            evento.preventDefault();

            destino.scrollIntoView({
                behavior: movimientoReducido ? "auto" : "smooth",
                block: "start"
            });

            history.replaceState(
                null,
                "",
                enlace.getAttribute("href")
            );
        });
    });


    /* -----------------------------------------------
       6. CONFIRMAR QUE LA PÁGINA INICIÓ
    ------------------------------------------------ */

    document.documentElement.classList.add(
        "auditoria-interactiva-lista"
    );

});

