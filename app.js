/* ==========================================================================
   LÓGICA JAVASCRIPT PROFESIONAL (app.js)
   Portafolio oficial y Currículum Técnico de María Morales Castillo (DAM)
   Java 17, Android (Kotlin), SQL (MySQL/PostgreSQL), Patrones MVC/MVVM y DAO.
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. LIMPIEZA INMEDIATA DE CLAVES OBSOLETAS O DATOS DAÑADOS EN EL NAVEGADOR
// --------------------------------------------------------------------------
try {
  localStorage.removeItem("portfolio-projects");
  localStorage.removeItem("portfolio_dam_maria_proyectos");
  localStorage.removeItem("portfolio_proyectos_dam");
} catch (e) {
  // Manejo defensivo para entornos con restricciones en localStorage
}

// --------------------------------------------------------------------------
// 2. PROYECTOS TÉCNICOS OFICIALES (SINGLE SOURCE OF TRUTH)
// --------------------------------------------------------------------------
const PROYECTOS_OFICIALES = [
  {
    id: "proj-01-almacen-java",
    titulo: "Sistema de Gestión de Almacén e Inventario",
    subtitulo: "Aplicación de escritorio Java con arquitectura MVC y persistencia JDBC",
    descripcion: "Software de gestión empresarial para el control de stock, movimientos de inventario y pedidos. Implementa el patrón Data Access Object (DAO) para aislar la lógica de negocio del acceso a la base de datos relacional, manejando transacciones ACID y control estricto de excepciones.",
    categoria: "Java",
    tecnologias: ["Java 17", "JDBC", "PostgreSQL", "Patrón DAO", "Git"],
    arquitectura: "Modelo-Vista-Controlador (MVC) con patrón DAO",
    baseDatos: "PostgreSQL 15 (Diseño relacional en 3ª Forma Normal)",
    urlGit: "https://github.com/maria-morales-castillo/sistema-almacen-java-jdbc",
    fecha: "2026",
    caracteristicas: "Sentencias preparadas (PreparedStatement); Control transaccional Commit/Rollback; Exportación de datos en XML"
  },
  {
    id: "proj-02-control-kotlin",
    titulo: "Terminal Móvil de Registro y Tareas",
    subtitulo: "Aplicación Android nativa en Kotlin con persistencia SQLite",
    descripcion: "Aplicación móvil orientada a operarios técnicos para el registro de partes de trabajo, incidencias y fichajes en movilidad. Diseñada siguiendo la arquitectura MVVM recomendada, utilizando SQLite local para funcionamiento completo sin conexión a red.",
    categoria: "Kotlin",
    tecnologias: ["Kotlin", "Android SDK", "Room SQLite", "MVVM", "Git"],
    arquitectura: "Model-View-ViewModel (MVVM) con Repositorio",
    baseDatos: "SQLite embebida con abstracción relacional y migraciones",
    urlGit: "https://github.com/maria-morales-castillo/terminal-android-kotlin-sqlite",
    fecha: "2026",
    caracteristicas: "Interfaz adaptativa para smartphones y tablets; Persistencia local sin conexión; Control del ciclo de vida en Android"
  },
  {
    id: "proj-03-motor-sql-datos",
    titulo: "Motor de Consultas y Acceso a Datos Multiformato",
    subtitulo: "Módulo de persistencia relacional SQL, serialización y parseo XML en Java",
    descripcion: "Librería de acceso a datos para entornos multiplataforma. Permite ejecutar consultas SQL complejas sobre esquemas normalizados, gestionar transacciones concurrentes, y sincronizar información entre bases de datos relacionales y archivos XML mediante analizadores DOM.",
    categoria: "Acceso a Datos",
    tecnologias: ["Java", "SQL", "PostgreSQL", "XML DOM/SAX", "JDBC"],
    arquitectura: "Capa de persistencia desacoplada con patrón Factory",
    baseDatos: "Esquema relacional normalizado en 3ª Forma Normal (3FN)",
    urlGit: "https://github.com/maria-morales-castillo/modulo-acceso-datos-sql-xml",
    fecha: "2025",
    caracteristicas: "Pool de conexiones JDBC; Conversor bidireccional SQL-XML; Consultas analíticas con JOIN y GROUP BY"
  }
];

let listaProyectos = [...PROYECTOS_OFICIALES];
let categoriaActiva = "Todos";

// --------------------------------------------------------------------------
// 3. INICIALIZACIÓN ROBUSTA Y A PRUEBA DE ESTADOS DE CARGA
// --------------------------------------------------------------------------
/**
 * Inicializa la aplicación renderizando los proyectos técnicos en una sola columna
 * y vinculando los escuchadores para filtros de categoría, menús y modal de ficha técnica.
 */
function inicializarApp() {
  listaProyectos = [...PROYECTOS_OFICIALES];
  renderizarProyectos(categoriaActiva);
  configurarEventosFiltros();
  configurarEventosModales();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarApp);
} else {
  inicializarApp();
}

// --------------------------------------------------------------------------
// 4. RENDERIZADO VISUAL EN UNA SOLA COLUMNA LIMPIA Y ESTRUCTURADA
// --------------------------------------------------------------------------
/**
 * Renderiza dinámicamente las tarjetas de proyectos técnicos en el contenedor principal.
 * Se muestran en una sola columna con espaciado uniforme, badges diferenciados y sin
 * datos duplicados ni cadenas no deseadas.
 *
 * @param {string} [categoria="Todos"] - Categoría seleccionada para filtrar proyectos.
 */
function renderizarProyectos(categoria = "Todos") {
  const container = document.getElementById("rejilla-proyectos") || document.getElementById("project-list");
  if (!container) return;

  container.innerHTML = "";

  const filtrados = categoria === "Todos" 
    ? listaProyectos 
    : listaProyectos.filter(p => p.categoria === categoria);

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; font-family: var(--fuente-mono); font-size: 0.85rem; color: var(--color-apagado); background: var(--color-papel-puro); border: var(--borde-maestro);">
        NO HAY PROYECTOS REGISTRADOS EN LA CATEGORÍA "${categoria}".
      </div>
    `;
    return;
  }

  filtrados.forEach((p) => {
    const article = document.createElement("article");
    article.className = "card-base card-proyecto";

    const tecs = Array.isArray(p.tecnologias) 
      ? p.tecnologias 
      : (p.tecnologias ? p.tecnologias.split(",") : ["Java", "SQL"]);
    
    const tagsHtml = tecs.map(t => `<span class="badge-tag" style="margin-right: 0.4rem; margin-bottom: 0.4rem; display: inline-flex;">${t.trim()}</span>`).join(" ");

    article.innerHTML = `
      <div class="proyecto-body">
        <div class="card-top">
          <span class="badge-tag">${p.categoria}</span>
          <span class="card-meta">${p.fecha} · ${p.arquitectura}</span>
        </div>
        <h3 class="card-titulo">${p.titulo}</h3>
        <div class="card-subtitulo">${p.subtitulo}</div>
        <p class="card-cuerpo">${p.descripcion}</p>
        <div class="card-tags" aria-label="Tecnologías utilizadas">
          ${tagsHtml}
        </div>
      </div>

      <div class="proyecto-pie">
        <a href="${p.urlGit}" target="_blank" rel="noopener noreferrer" class="enlace-git" aria-label="Ver repositorio Git de ${p.titulo}">
          &gt; GitHub
        </a>
        <button type="button" class="btn-ficha" onclick="abrirFichaTecnica('${p.id}')" aria-label="Abrir ficha técnica de ${p.titulo}">
          Ficha Técnica »
        </button>
      </div>
    `;

    container.appendChild(article);
  });
}

// --------------------------------------------------------------------------
// 5. FILTRADO POR PESTAÑAS Y DESLIZAMIENTO CON CLIC Y ARRASTRE
// --------------------------------------------------------------------------
function configurarEventosFiltros() {
  const tabs = document.querySelectorAll(".tab-btn, .boton-filtro");
  const contenedorTabs = document.querySelector(".filtros-tabs");

  let huboArrastre = false;

  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      if (huboArrastre) return;
      tabs.forEach(t => t.classList.remove("activo"));
      e.target.classList.add("activo");
      categoriaActiva = e.target.getAttribute("data-categoria") || "Todos";
      renderizarProyectos(categoriaActiva);
    });
  });

  if (contenedorTabs) {
    let estaPresionado = false;
    let xInicio = 0;
    let scrollInicio = 0;

    contenedorTabs.addEventListener("mousedown", (e) => {
      estaPresionado = true;
      huboArrastre = false;
      contenedorTabs.classList.add("en-arrastre");
      xInicio = e.pageX - contenedorTabs.offsetLeft;
      scrollInicio = contenedorTabs.scrollLeft;
    });

    contenedorTabs.addEventListener("mouseleave", () => {
      estaPresionado = false;
      contenedorTabs.classList.remove("en-arrastre");
    });

    contenedorTabs.addEventListener("mouseup", () => {
      estaPresionado = false;
      contenedorTabs.classList.remove("en-arrastre");
    });

    contenedorTabs.addEventListener("mousemove", (e) => {
      if (!estaPresionado) return;
      e.preventDefault();
      const xActual = e.pageX - contenedorTabs.offsetLeft;
      const distancia = xActual - xInicio;
      if (Math.abs(distancia) > 5) {
        huboArrastre = true;
      }
      contenedorTabs.scrollLeft = scrollInicio - distancia;
    });
  }
}

// --------------------------------------------------------------------------
// 6. VENTANA MODAL: FICHA TÉCNICA
// --------------------------------------------------------------------------
/**
 * Abre la ventana modal con la ficha técnica detallada del proyecto.
 *
 * @param {string} id - Identificador del proyecto.
 */
function abrirFichaTecnica(id) {
  const p = listaProyectos.find(item => item.id === id);
  if (!p) return;

  const modal = document.getElementById("modal-ficha-tecnica");
  const contenido = document.getElementById("contenido-ficha-tecnica");

  if (modal && contenido) {
    const tecs = Array.isArray(p.tecnologias)
      ? p.tecnologias
      : (p.tecnologias ? String(p.tecnologias).split(",") : [p.categoria || "Java"]);

    const tagsHtml = tecs.map(t => `<span class="badge-tag" style="margin-right: 0.4rem; margin-bottom: 0.4rem; display: inline-flex;">${String(t).trim()}</span>`).join(" ");

    contenido.innerHTML = `
      <div class="ficha-modal-wrap">
        <div>
          <div class="ficha-metas-fila">
            <span class="badge-tag">${p.categoria}</span>
            <span>·</span>
            <span class="card-meta">AÑO ${p.fecha}</span>
            <span>·</span>
            <span style="color: var(--color-acento-verde); font-weight: 700;">PROYECTO COMPLETO</span>
          </div>
          <h3 class="card-titulo" style="font-size: 1.45rem; margin-top: 0.5rem;">${p.titulo}</h3>
          <div class="card-subtitulo">${p.subtitulo}</div>
        </div>

        <div class="ficha-grid-especificaciones">
          <div class="ficha-caja-especificacion">
            <div class="label">PATRÓN DE ARQUITECTURA</div>
            <div class="valor">${p.arquitectura}</div>
          </div>
          <div class="ficha-caja-especificacion">
            <div class="label">BASE DE DATOS / PERSISTENCIA</div>
            <div class="valor">${p.baseDatos}</div>
          </div>
        </div>

        <div class="ficha-descripcion-bloque">
          <h4 class="card-titulo" style="font-size: 1rem;">Descripción y Objetivos Técnicos</h4>
          <p class="card-cuerpo">${p.descripcion}</p>
        </div>

        <div>
          <div class="card-meta" style="margin-bottom: 0.4rem;">Stack &amp; Herramientas:</div>
          <div class="card-tags">
            ${tagsHtml}
          </div>
        </div>

        <div class="ficha-pie-acciones">
          <a href="${p.urlGit}" target="_blank" rel="noopener noreferrer" class="boton-primario">
            &gt; Ver Código en GitHub
          </a>
          <button type="button" class="boton-secundario" onclick="cerrarFichaTecnica()">
            Cerrar Ficha
          </button>
        </div>
      </div>
    `;

    modal.classList.add("activo");
  }
}

/**
 * Cierra la ventana modal de la ficha técnica.
 */
function cerrarFichaTecnica() {
  const modal = document.getElementById("modal-ficha-tecnica");
  if (modal) modal.classList.remove("activo");
}

function configurarEventosModales() {
  const modales = document.querySelectorAll(".modal-overlay");
  modales.forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("activo");
      }
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cerrarFichaTecnica();
      cerrarMenuMovil();
    }
  });
}

// --------------------------------------------------------------------------
// 7. MENÚ MÓVIL
// --------------------------------------------------------------------------
function toggleMenuMovil() {
  const menu = document.getElementById("menu-movil-desplegable");
  const btn = document.getElementById("btn-menu-movil");
  if (menu) {
    const estaActivo = menu.classList.toggle("activo");
    if (btn) {
      btn.setAttribute("aria-expanded", estaActivo ? "true" : "false");
    }
  }
}

function cerrarMenuMovil() {
  const menu = document.getElementById("menu-movil-desplegable");
  const btn = document.getElementById("btn-menu-movil");
  if (menu) {
    menu.classList.remove("activo");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
    }
  }
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("menu-movil-desplegable");
  const btn = document.getElementById("btn-menu-movil");
  if (menu && menu.classList.contains("activo")) {
    if (!menu.contains(e.target) && btn && !btn.contains(e.target)) {
      cerrarMenuMovil();
    }
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 860) {
    cerrarMenuMovil();
  }
});

// Exposición en el objeto global window
window.abrirFichaTecnica = abrirFichaTecnica;
window.cerrarFichaTecnica = cerrarFichaTecnica;
window.toggleMenuMovil = toggleMenuMovil;
window.cerrarMenuMovil = cerrarMenuMovil;
