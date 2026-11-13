/* ==========================================================================
   DOCUMENTACIÓN JAVASCRIPT ES6 · LÓGICA DE APLICACIÓN (app.js)
   Autora: María Morales Castillo
   Arquitectura: Modularización por capas (Configuración / Datos / Utilidades /
   Renderizado / Controladores de Interfaz) bajo patrón IIFE sin dependencias.
   Compatibilidad: 100% funcional en entorno local (file://) y servidor web.
   ========================================================================== */

(() => {
  "use strict";

  // ------------------------------------------------------------------------
  // 1. CONFIGURACIÓN GLOBAL DE INTERFAZ Y DICCIONARIOS DE ESTADO
  // ------------------------------------------------------------------------
  /**
   * Constantes globales de comportamiento UI sincronizadas con estilos.css.
   */
  const CONFIG_UI = Object.freeze({
    BREAKPOINT_MOVIL: 640, // Sincronizado con @media (max-width: 640px)
    UMBRAL_ARRASTRE_PX: 3, // Distancia mínima en px para distinguir arrastre de clic
    URL_FALLBACK: "https://github.com/Maria-Morales-Dev"
  });

  /**
   * Diccionario extensible de estados posibles de un proyecto.
   * Para añadir un nuevo estado en el futuro, basta con registrar su clave aquí
   * y definir su clase visual en estilos.css.
   */
  const ESTADOS_PROYECTO = Object.freeze({
    Completado: {
      claseBadge: "badge-estado-completado",
      claseModal: "ficha-estado-completo",
      textoModal: "PROYECTO COMPLETADO"
    },
    "En Proceso": {
      claseBadge: "badge-estado-proceso",
      claseModal: "ficha-estado-proceso",
      textoModal: "EN PROCESO"
    }
  });

  // ------------------------------------------------------------------------
  // 2. SANEAMIENTO DEFENSIVO DE ALMACENAMIENTO LOCAL
  // ------------------------------------------------------------------------
  try {
    localStorage.removeItem("portfolio-projects");
    localStorage.removeItem("portfolio_dam_maria_proyectos");
    localStorage.removeItem("portfolio_proyectos_dam");
  } catch (_error) {
    // Control defensivo ante navegadores con bloqueo de almacenamiento local
  }

  // ------------------------------------------------------------------------
  // 3. CAPA DE DATOS: CATÁLOGO DE PROYECTOS (SINGLE SOURCE OF TRUTH)
  // ------------------------------------------------------------------------
  /**
   * Definición de tipo para un proyecto técnico del portafolio.
   * @typedef {Object} ProyectoTecnico
   * @property {string} id - Identificador único del proyecto (sin espacios, ej. "proj-03-nombre").
   * @property {string} titulo - Nombre principal del sistema o aplicación.
   * @property {string} etiquetaTipo - Tipo de proyecto (ej. "App de Escritorio", "App Android", "API REST").
   * @property {"Completado" | "En Proceso"} estado - Estado actual del desarrollo.
   * @property {string} subtitulo - Resumen técnico de la tecnología principal.
   * @property {string} descripcion - Explicación funcional y arquitectónica.
   * @property {string} categoria - Categoría técnica principal.
   * @property {string[]} tecnologias - Lista de tecnologías mostradas como etiquetas.
   * @property {string} arquitectura - Patrón de diseño o arquitectura aplicada.
   * @property {string} baseDatos - Sistema gestor o motor de persistencia utilizado.
   * @property {string} urlGit - Enlace seguro al repositorio en GitHub.
   * @property {string} fecha - Año de realización del proyecto.
   */

  /**
   * ========================================================================
   * GUÍA RÁPIDA PARA AÑADIR NUEVOS PROYECTOS:
   * Copia y pega la siguiente plantilla al final del array PROYECTOS_OFICIALES:
   *
   * {
   *   id: "proj-03-nuevo-proyecto",
   *   titulo: "Nombre del Proyecto",
   *   etiquetaTipo: "Web / Móvil / Escritorio",
   *   estado: "En Proceso", // "Completado" o "En Proceso"
   *   subtitulo: "Resumen técnico breve en una línea",
   *   descripcion: "Descripción completa de funcionalidades y arquitectura.",
   *   categoria: "Java",
   *   tecnologias: ["Java", "SQL", "Git"],
   *   arquitectura: "MVC / MVVM / Capas",
   *   baseDatos: "PostgreSQL / SQLite / MySQL",
   *   urlGit: "https://github.com/Maria-Morales-Dev",
   *   fecha: "2026"
   * }
   *
   * Nota: La rejilla CSS y las fichas técnicas se adaptan automáticamente.
   * ========================================================================
   * @type {ProyectoTecnico[]}
   */
  const PROYECTOS_OFICIALES = [
    {
      id: "proj-01-almacen-java",
      titulo: "Sistema de Gestión de Almacén e Inventario",
      etiquetaTipo: "App de Escritorio",
      estado: "En Proceso",
      subtitulo: "Aplicación de escritorio Java con arquitectura MVC y persistencia JDBC",
      descripcion: "Software de gestión empresarial para el control de stock, movimientos de inventario y pedidos. Implementa el patrón Data Access Object (DAO) para aislar la lógica de negocio del acceso a la base de datos relacional, manejando transacciones ACID y control estricto de excepciones.",
      categoria: "Java",
      tecnologias: ["Java 17", "JDBC", "PostgreSQL", "Patrón DAO"],
      arquitectura: "Modelo-Vista-Controlador (MVC) con patrón DAO",
      baseDatos: "PostgreSQL 15 (Diseño relacional en 3ª Forma Normal)",
      urlGit: "https://github.com/Maria-Morales-Dev",
      fecha: "2026"
    },
    {
      id: "proj-02-control-kotlin",
      titulo: "Terminal Móvil de Registro y Tareas",
      etiquetaTipo: "App Android",
      estado: "En Proceso",
      subtitulo: "Aplicación Android nativa en Kotlin con persistencia SQLite",
      descripcion: "Aplicación móvil orientada a operarios técnicos para el registro de partes de trabajo, incidencias y fichajes en movilidad. Diseñada siguiendo la arquitectura MVVM recomendada, utilizando SQLite local para funcionamiento completo sin conexión a red.",
      categoria: "Kotlin",
      tecnologias: ["Kotlin", "Android SDK", "Room SQLite", "MVVM"],
      arquitectura: "Model-View-ViewModel (MVVM) con Repositorio",
      baseDatos: "SQLite embebida con abstracción relacional y migraciones",
      urlGit: "https://github.com/Maria-Morales-Dev",
      fecha: "2026"
    }
  ];

  // ------------------------------------------------------------------------
  // 4. ESTADO EN MEMORIA DE LA APLICACIÓN
  // ------------------------------------------------------------------------
  /** @type {ProyectoTecnico[]} */
  let listaProyectos = [];

  /** @type {HTMLElement | null} Elemento que tenía el foco antes de abrir el modal */
  let ultimoElementoEnfocado = null;

  // ------------------------------------------------------------------------
  // 5. UTILIDADES DEFENSIVAS Y NORMALIZACIÓN DE DATOS
  // ------------------------------------------------------------------------
  /**
   * Escapa caracteres especiales HTML para prevenir fallos de maquetación
   * o inyección de código (XSS) al renderizar cadenas dinámicas.
   *
   * @param {unknown} valor - Dato de entrada a sanear.
   * @returns {string} Cadena de texto segura para insertar en HTML.
   */
  function escaparHtml(valor) {
    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Valida que una URL utilice un protocolo seguro (http o https).
   *
   * @param {string} url - URL candidata.
   * @returns {string} URL validada o URL segura por defecto.
   */
  function sanitizarUrl(url) {
    const candidata = String(url ?? "").trim();
    if (/^https?:\/\//i.test(candidata)) {
      return escaparHtml(candidata);
    }
    return CONFIG_UI.URL_FALLBACK;
  }

  /**
   * Garantiza que cualquier proyecto añadido cumpla la estructura esperada,
   * aplicando valores por defecto seguros ante propiedades omitidas.
   *
   * @param {Partial<ProyectoTecnico>} datosCrudos - Objeto de proyecto original.
   * @param {number} indice - Posición dentro del catálogo.
   * @returns {ProyectoTecnico} Proyecto normalizado listo para renderizar.
   */
  function normalizarProyecto(datosCrudos, indice) {
    const tecnologiasValidas =
      Array.isArray(datosCrudos.tecnologias) && datosCrudos.tecnologias.length > 0
        ? datosCrudos.tecnologias.map((t) => String(t).trim()).filter(Boolean)
        : ["Software"];

    const estadoValido =
      datosCrudos.estado && Object.prototype.hasOwnProperty.call(ESTADOS_PROYECTO, datosCrudos.estado)
        ? datosCrudos.estado
        : "En Proceso";

    return {
      id: String(datosCrudos.id || `proj-auto-${indice + 1}`),
      titulo: String(datosCrudos.titulo || "Proyecto de Software"),
      etiquetaTipo: String(datosCrudos.etiquetaTipo || "Aplicación"),
      estado: estadoValido,
      subtitulo: String(datosCrudos.subtitulo || "Desarrollo multiplataforma"),
      descripcion: String(datosCrudos.descripcion || "Sin descripción detallada disponible."),
      categoria: String(datosCrudos.categoria || "General"),
      tecnologias: tecnologiasValidas,
      arquitectura: String(datosCrudos.arquitectura || "Arquitectura modular"),
      baseDatos: String(datosCrudos.baseDatos || "Persistencia local/relacional"),
      urlGit: String(datosCrudos.urlGit || CONFIG_UI.URL_FALLBACK),
      fecha: String(datosCrudos.fecha || String(new Date().getFullYear()))
    };
  }

  /**
   * Obtiene los metadatos visuales correspondientes al estado del proyecto.
   *
   * @param {string} estado - Estado del proyecto ("Completado" o "En Proceso").
   */
  function obtenerMetaEstado(estado) {
    return ESTADOS_PROYECTO[estado] || ESTADOS_PROYECTO["En Proceso"];
  }

  // ------------------------------------------------------------------------
  // 6. CAPA DE PRESENTACIÓN: RENDERIZADO DE PROYECTOS Y FICHAS TÉCNICAS
  // ------------------------------------------------------------------------
  /**
   * Genera el bloque HTML de etiquetas tecnológicas reutilizable tanto en
   * tarjetas como en la ficha técnica modal.
   *
   * @param {string[]} tecnologias - Lista de tecnologías.
   * @returns {string} HTML de las etiquetas.
   */
  function construirEtiquetasHtml(tecnologias) {
    return tecnologias
      .map((tec) => `<span class="badge-tag">${escaparHtml(tec)}</span>`)
      .join("");
  }

  /**
   * Construye la plantilla HTML segura de una tarjeta de proyecto.
   *
   * @param {ProyectoTecnico} proyecto - Datos normalizados del proyecto.
   * @returns {HTMLElement} Elemento <article> listo para insertar en el DOM.
   */
  function crearTarjetaProyecto(proyecto) {
    const articulo = document.createElement("article");
    articulo.className = "card-base card-proyecto";

    const metaEstado = obtenerMetaEstado(proyecto.estado);
    const etiquetasHtml = construirEtiquetasHtml(proyecto.tecnologias);
    const urlSegura = sanitizarUrl(proyecto.urlGit);
    const tituloSeguro = escaparHtml(proyecto.titulo);
    const idSeguro = escaparHtml(proyecto.id);

    articulo.innerHTML = `
      <div class="proyecto-body">
        <div>
          <h3 class="card-titulo">${tituloSeguro}</h3>
          <div class="proyecto-badge-wrap">
            <span class="badge-tag badge-estado ${metaEstado.claseBadge}">
              <span class="punto-estado" aria-hidden="true">●</span>
              ${escaparHtml(proyecto.estado)}
            </span>
            <span class="badge-tag">${escaparHtml(proyecto.etiquetaTipo)}</span>
          </div>
          <div class="card-meta">${escaparHtml(proyecto.fecha)} · ${escaparHtml(proyecto.arquitectura)}</div>
          <div class="card-subtitulo">${escaparHtml(proyecto.subtitulo)}</div>
          <p class="card-cuerpo">${escaparHtml(proyecto.descripcion)}</p>
        </div>
        <div class="card-tags" aria-label="Tecnologías empleadas en el proyecto">
          ${etiquetasHtml}
        </div>
      </div>

      <div class="proyecto-pie">
        <a href="${urlSegura}" target="_blank" rel="noopener noreferrer" class="enlace-git" aria-label="Ver repositorio en GitHub de ${tituloSeguro}">
          &gt; GitHub
        </a>
        <button type="button" class="btn-ficha" data-accion="abrir-ficha" data-proyecto-id="${idSeguro}" aria-label="Abrir ficha técnica de ${tituloSeguro}">
          Ficha Técnica »
        </button>
      </div>
    `;

    return articulo;
  }

  /**
   * Renderiza el catálogo completo de proyectos usando un DocumentFragment
   * para minimizar reflujos del navegador (máximo rendimiento de pintado).
   */
  function renderizarProyectos() {
    const contenedor = document.getElementById("rejilla-proyectos");
    if (!contenedor) return;

    const fragmento = document.createDocumentFragment();
    listaProyectos.forEach((proyecto) => {
      fragmento.appendChild(crearTarjetaProyecto(proyecto));
    });

    contenedor.innerHTML = "";
    contenedor.appendChild(fragmento);
  }

  // ------------------------------------------------------------------------
  // 7. CONTROLADOR DE VENTANA MODAL: FICHA TÉCNICA DETALLADA
  // ------------------------------------------------------------------------
  /**
   * Abre la ventana modal inyectando los detalles técnicos del proyecto
   * seleccionado y gestionando la accesibilidad del foco y el scroll.
   *
   * @param {string} id - Identificador único del proyecto.
   */
  function abrirFichaTecnica(id) {
    const proyecto = listaProyectos.find((item) => item.id === id);
    if (!proyecto) return;

    const modal = document.getElementById("modal-ficha-tecnica");
    const contenido = document.getElementById("contenido-ficha-tecnica");
    if (!modal || !contenido) return;

    const metaEstado = obtenerMetaEstado(proyecto.estado);
    const etiquetasHtml = construirEtiquetasHtml(proyecto.tecnologias);
    const urlSegura = sanitizarUrl(proyecto.urlGit);

    contenido.innerHTML = `
      <div class="ficha-modal-wrap">
        <div>
          <div class="ficha-metas-fila">
            <span class="badge-tag">${escaparHtml(proyecto.etiquetaTipo)}</span>
            <span aria-hidden="true">·</span>
            <span class="card-meta">AÑO ${escaparHtml(proyecto.fecha)}</span>
            <span aria-hidden="true">·</span>
            <span class="${metaEstado.claseModal}">${escaparHtml(metaEstado.textoModal)}</span>
          </div>
          <h3 class="card-titulo ficha-titulo-principal">${escaparHtml(proyecto.titulo)}</h3>
          <div class="card-subtitulo">${escaparHtml(proyecto.subtitulo)}</div>
        </div>

        <div class="ficha-grid-especificaciones">
          <div class="ficha-caja-especificacion">
            <div class="label">PATRÓN DE ARQUITECTURA</div>
            <div class="valor">${escaparHtml(proyecto.arquitectura)}</div>
          </div>
          <div class="ficha-caja-especificacion">
            <div class="label">BASE DE DATOS / PERSISTENCIA</div>
            <div class="valor">${escaparHtml(proyecto.baseDatos)}</div>
          </div>
        </div>

        <div class="ficha-descripcion-bloque">
          <h4 class="card-titulo">Descripción y Objetivos Técnicos</h4>
          <p class="card-cuerpo">${escaparHtml(proyecto.descripcion)}</p>
        </div>

        <div>
          <div class="card-meta">Stack &amp; Herramientas:</div>
          <div class="card-tags">
            ${etiquetasHtml}
          </div>
        </div>

        <div class="ficha-pie-acciones">
          <a href="${urlSegura}" target="_blank" rel="noopener noreferrer" class="boton-primario">
            &gt; Ver Código
          </a>
          <button type="button" class="boton-secundario" data-accion="cerrar-ficha">
            Cerrar Ficha
          </button>
        </div>
      </div>
    `;

    // Guardar referencia del foco actual y bloquear scroll del documento de fondo
    ultimoElementoEnfocado = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    modal.classList.add("activo");
    modal.setAttribute("aria-hidden", "false");

    // Restablecer posición de scroll interna del modal al abrir un nuevo proyecto
    const modalContent = modal.querySelector(".modal-content");
    if (modalContent) {
      modalContent.scrollTop = 0;
    }

    // Mover foco al botón de cierre dentro de la ficha para navegación por teclado
    const botonCerrar = contenido.querySelector('[data-accion="cerrar-ficha"]');
    if (botonCerrar instanceof HTMLElement) {
      botonCerrar.focus();
    }
  }

  /**
   * Cierra la ventana modal de ficha técnica y restaura el foco y scroll previos.
   */
  function cerrarFichaTecnica() {
    const modal = document.getElementById("modal-ficha-tecnica");
    if (!modal || !modal.classList.contains("activo")) return;

    modal.classList.remove("activo");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (ultimoElementoEnfocado) {
      ultimoElementoEnfocado.focus();
      ultimoElementoEnfocado = null;
    }
  }

  /**
   * Habilita el desplazamiento fluido mediante arrastre con ratón (drag-to-scroll)
   * dentro de la ventana modal, evitando activar enlaces al soltar tras arrastrar.
   *
   * @param {HTMLElement} modalContent - Contenedor desplazable de la modal.
   */
  function configurarArrastreModal(modalContent) {
    let estaArrastrando = false;
    let inicioY = 0;
    let scrollInicial = 0;
    let haHabidoMovimiento = false;

    modalContent.addEventListener("mousedown", (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.closest("button, a, input, select, textarea")) return;

      // Permite arrastrar con botón izquierdo (0) o botón derecho (2)
      if (e.button === 0 || e.button === 2) {
        estaArrastrando = true;
        haHabidoMovimiento = false;
        inicioY = e.clientY;
        scrollInicial = modalContent.scrollTop;
        modalContent.style.cursor = "grabbing";
        modalContent.style.userSelect = "none";
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!estaArrastrando) return;
      const diferenciaY = e.clientY - inicioY;
      if (Math.abs(diferenciaY) > CONFIG_UI.UMBRAL_ARRASTRE_PX) {
        haHabidoMovimiento = true;
      }
      modalContent.scrollTop = scrollInicial - diferenciaY;
    });

    const finalizarArrastre = () => {
      if (!estaArrastrando) return;
      estaArrastrando = false;
      modalContent.style.cursor = "";
      modalContent.style.userSelect = "";
    };

    window.addEventListener("mouseup", finalizarArrastre);

    // Previene clics accidentales sobre elementos si el usuario estaba arrastrando
    modalContent.addEventListener(
      "click",
      (e) => {
        if (haHabidoMovimiento) {
          e.preventDefault();
          e.stopPropagation();
          haHabidoMovimiento = false;
        }
      },
      true
    );

    // Suprime menú contextual nativo dentro del modal para permitir arrastre derecho
    modalContent.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  /**
   * Registra los eventos de apertura/cierre mediante delegación de eventos (sin inline JS).
   */
  function configurarEventosModales() {
    const rejilla = document.getElementById("rejilla-proyectos");
    if (rejilla) {
      rejilla.addEventListener("click", (evento) => {
        if (!(evento.target instanceof Element)) return;
        const boton = evento.target.closest('[data-accion="abrir-ficha"]');
        if (boton instanceof HTMLElement && boton.dataset.proyectoId) {
          abrirFichaTecnica(boton.dataset.proyectoId);
        }
      });
    }

    const modal = document.getElementById("modal-ficha-tecnica");
    if (modal) {
      modal.addEventListener("click", (evento) => {
        if (evento.target === modal) {
          cerrarFichaTecnica();
          return;
        }
        if (evento.target instanceof Element && evento.target.closest('[data-accion="cerrar-ficha"]')) {
          cerrarFichaTecnica();
        }
      });
    }

    const btnCerrarSuperior = document.getElementById("btn-cerrar-modal-superior");
    if (btnCerrarSuperior) {
      btnCerrarSuperior.addEventListener("click", cerrarFichaTecnica);
    }

    const modalContent = document.querySelector(".modal-content");
    if (modalContent instanceof HTMLElement) {
      configurarArrastreModal(modalContent);
    }
  }

  // ------------------------------------------------------------------------
  // 8. CONTROLADOR DE NAVEGACIÓN MÓVIL Y EVENTOS GLOBALES
  // ------------------------------------------------------------------------
  /**
   * Alterna la visibilidad del menú desplegable móvil sincronizando estados ARIA.
   */
  function toggleMenuMovil() {
    const menu = document.getElementById("menu-movil-desplegable");
    const boton = document.getElementById("btn-menu-movil");
    if (!menu) return;

    const estaActivo = menu.classList.toggle("activo");
    if (boton) {
      boton.setAttribute("aria-expanded", estaActivo ? "true" : "false");
    }
  }

  /**
   * Cierra el menú desplegable móvil y restablece su estado ARIA.
   */
  function cerrarMenuMovil() {
    const menu = document.getElementById("menu-movil-desplegable");
    const boton = document.getElementById("btn-menu-movil");
    if (!menu) return;

    menu.classList.remove("activo");
    if (boton) {
      boton.setAttribute("aria-expanded", "false");
    }
  }

  /**
   * Registra los eventos del menú hamburguesa, cierre por clic externo,
   * tecla Escape y ajuste automático al redimensionar la ventana.
   */
  function configurarEventosNavegacion() {
    const botonMenu = document.getElementById("btn-menu-movil");
    if (botonMenu) {
      botonMenu.addEventListener("click", toggleMenuMovil);
    }

    const menu = document.getElementById("menu-movil-desplegable");
    if (menu) {
      menu.addEventListener("click", (evento) => {
        if (evento.target instanceof Element && evento.target.closest('[data-cerrar-menu="true"]')) {
          cerrarMenuMovil();
        }
      });
    }

    // Cierre al hacer clic fuera del menú desplegable
    document.addEventListener("click", (evento) => {
      if (!menu || !menu.classList.contains("activo")) return;
      if (!(evento.target instanceof Node)) return;

      const clicDentroMenu = menu.contains(evento.target);
      const clicEnBoton = botonMenu ? botonMenu.contains(evento.target) : false;

      if (!clicDentroMenu && !clicEnBoton) {
        cerrarMenuMovil();
      }
    });

    // Cierre accesible de modales y menú mediante la tecla Escape
    window.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") {
        cerrarFichaTecnica();
        cerrarMenuMovil();
      }
    });

    // Cierre automático si la pantalla supera el breakpoint móvil
    window.addEventListener("resize", () => {
      if (window.innerWidth > CONFIG_UI.BREAKPOINT_MOVIL) {
        cerrarMenuMovil();
      }
    });
  }

  // ------------------------------------------------------------------------
  // 9. PUNTO DE ENTRADA E INICIALIZACIÓN DE LA APLICACIÓN
  // ------------------------------------------------------------------------
  /**
   * Inicializa la capa de datos normalizada, renderiza el catálogo de proyectos
   * y conecta todos los controladores de interfaz.
   */
  function inicializarApp() {
    listaProyectos = PROYECTOS_OFICIALES.map(normalizarProyecto);
    renderizarProyectos();
    configurarEventosModales();
    configurarEventosNavegacion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarApp);
  } else {
    inicializarApp();
  }
})();
