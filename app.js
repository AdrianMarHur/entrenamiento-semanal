/**
 * Versión FINAL
 * ---------------------------------------------------------
 * Funciones Refactorizadas clave:
 * - mostrarTarea(tarea)            [creación segura + .tarea-text + X roja]
 * - filtrarTareas(query)           [normaliza y usa display para compatibilidad]
 * - actualizarEstadoVacio()        [usa computedStyle para contar visibles]
 * - setTareas(next) + renderLista()[estado + re-render + reaplicar filtro]
 * - applyTheme(), toggleTheme()    [tema + a11y]
 */
/**
 * App Final con mejoras:
 * - Helpers: cx(), delegate(), BADGE + safeBadge()
 * - Componente TaskItem()
 * - Comentarios JSDoc agregados en español
 */

/* ============================================================
   Helpers generales
   ============================================================ */

/**
 * Combina clases Tailwind de forma limpia.
 * @param {...string} classes - Clases a combinar.
 * @returns {string} - Cadena final con clases unidas.
 */
const cx = (...classes) => classes.filter(Boolean).join(" ");

/**
 * Delegación de eventos (evita repetir closest() en varios handlers).
 * @param {Element} root - Contenedor donde escuchamos.
 * @param {string} type - Tipo de evento (p. ej. "click").
 * @param {string} selector - Selector del elemento objetivo.
 * @param {function(Event, Element):void} handler - Función ejecutada cuando coincide.
 */
function delegate(root, type, selector, handler) {
  root.addEventListener(type, (ev) => {
    const target = ev.target instanceof Element ? ev.target.closest(selector) : null;
    if (target && root.contains(target)) handler(ev, target);
  });
}

/**
 * Normaliza un string para comparación y búsqueda:
 * - pasa a minúsculas
 * - elimina tildes
 * - colapsa espacios
 * @param {string} [s=""] - Texto original.
 * @returns {string} - Texto normalizado.
 */
function norm(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Crea un "debounce" para limitar la frecuencia de ejecución.
 * @param {function} fn - Función original.
 * @param {number} ms - Milisegundos de espera.
 * @returns {function} - Nueva función con debounce.
 */
function debounce(fn, ms = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Envía un mensaje accesible a la región aria-live.
 * @param {string} msg - Mensaje visible para lectores de pantalla.
 */
function announce(msg) {
  const live = document.getElementById("live");
  if (live) live.textContent = msg;
}

/* ============================================================
   Mapeo de intensidades
   ============================================================ */

const BADGE = {
  high: "bg-red-600",
  medium: "bg-orange-400",
  low: "bg-teal-500",
};

/**
 * Retorna la clase CSS apropiada para el punto de color según intensidad.
 * @param {"high"|"medium"|"low"} intensity - Intensidad de la tarea.
 * @returns {string} Clase CSS correspondiente.
 */
const safeBadge = (intensity) => BADGE[intensity] ?? BADGE.medium;

/* ============================================================
   Componente TaskItem
   ============================================================ */

/**
 * Crea el elemento <li> que representa una tarea.
 * @param {{id:number, text:string, intensity:string}} task - Datos de la tarea.
 * @returns {HTMLLIElement} - Elemento <li> completamente armado.
 */
function TaskItem({ id, text, intensity }) {
  const li = document.createElement("li");
  li.dataset.id = id;
  li.dataset.intensity = intensity;

  li.className = cx(
    "flex items-center justify-between gap-3 p-3",
    "bg-white dark:bg-slate-800",
    "border border-slate-300 dark:border-slate-700 rounded-lg",
    "hover:bg-slate-100 dark:hover:bg-slate-700 transition"
  );

  const left = document.createElement("span");
  left.className = "inline-flex items-center gap-2";

  const dot = document.createElement("span");
  dot.className = cx("inline-block w-2.5 h-2.5 rounded-full", safeBadge(intensity));

  const spanText = document.createElement("span");
  spanText.className = "task-text";
  spanText.textContent = text;

  left.append(dot, spanText);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = cx(
    "delete-task px-2 py-1 rounded",
    "bg-red-600 text-white hover:bg-red-700",
    "active:scale-95 transition"
  );
  delBtn.textContent = "✖";
  delBtn.setAttribute("aria-label", "Borrar tarea");

  li.append(left, delBtn);
  return li;
}

/* ============================================================
   DOM refs
   ============================================================ */
const taskForm          = document.getElementById("task-form");
const taskInput         = document.getElementById("task-input");
const intensitySelect   = document.getElementById("intensity-select");
const taskList          = document.querySelector(".task-list");
const searchInput       = document.getElementById("task-search");
const emptyState        = document.getElementById("empty-state");
const formErrorSummary  = document.getElementById("form-error-summary");
const taskInputError    = document.getElementById("task-input-error");
const intensityError    = document.getElementById("intensity-select-error");
const themeToggle       = document.getElementById("theme-toggle");
const themeIcon         = document.getElementById("theme-icon");

/* ============================================================
   State
   ============================================================ */
const state = {
  tasks: [],
  theme: "light",
};

/* ============================================================
   Storage (load/save)
   ============================================================ */

/**
 * Carga tareas desde localStorage.
 * @returns {Array<{id:number,text:string,intensity:string}>}
 */
function loadTasks() {
  try { return JSON.parse(localStorage.getItem("tareas")) || []; }
  catch { return []; }
}

/**
 * Guarda tareas en localStorage.
 */
function saveTasks() {
  try { localStorage.setItem("tareas", JSON.stringify(state.tasks)); } catch {}
}

/**
 * Obtiene el tema guardado.
 * @returns {string|null}
 */
function getStoredTheme() {
  try { return localStorage.getItem("tema"); } catch { return null; }
}

/**
 * Guarda el tema (light/dark).
 * @param {string} mode
 */
function saveTheme(mode) {
  try { localStorage.setItem("tema", mode); } catch {}
}

/* ============================================================
   Validación (ya existente)
   ============================================================ */

const RULES = {
  minLength: 3,
  maxLength: 80,
  maxTasks: 200,
  blockChars: /[<>]/g,
  requireWord: /[\p{L}\p{N}]/u,
  bannedWords: ["prueba", "test"],
};

/**
 * Muestra error en un campo (UI + accesibilidad).
 * @param {HTMLElement} inputEl 
 * @param {HTMLElement} errorEl 
 * @param {string} msg 
 */
function setFieldError(inputEl, errorEl, msg) {
  inputEl.setAttribute("aria-invalid", "true");
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}

/**
 * Limpia error en un campo.
 * @param {HTMLElement} inputEl 
 * @param {HTMLElement} errorEl 
 */
function clearFieldError(inputEl, errorEl) {
  inputEl.removeAttribute("aria-invalid");
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

/**
 * Establece el resumen de errores del formulario.
 * @param {string} msg 
 */
function setFormErrorSummary(msg) {
  formErrorSummary.textContent = msg;
  formErrorSummary.classList.remove("hidden");
}

/**
 * Limpia el resumen de errores.
 */
function clearFormErrorSummary() {
  formErrorSummary.classList.add("hidden");
  formErrorSummary.textContent = "";
}

/**
 * Valida el texto de una tarea.
 * @param {string} rawText 
 * @param {Array} tasks 
 * @returns {{ok:boolean, msg?:string, text?:string}}
 */
function validateTaskText(rawText, tasks) {
  const cleaned = rawText.replace(/\s+/g, " ").trim();
  if (!cleaned) return { ok: false, msg: "Escribe una tarea." };

  if (RULES.blockChars.test(cleaned))
    return { ok: false, msg: "No se permiten < o >." };

  if (cleaned.length < RULES.minLength)
    return { ok: false, msg: `Mínimo ${RULES.minLength} caracteres.` };

  if (cleaned.length > RULES.maxLength)
    return { ok: false, msg: `Máximo ${RULES.maxLength} caracteres.` };

  if (!RULES.requireWord.test(cleaned))
    return { ok: false, msg: "Debe contener letras o números." };

  const normalized = norm(cleaned);

  if (RULES.bannedWords.some(w => normalized.includes(norm(w))))
    return { ok: false, msg: "La tarea contiene palabras no permitidas." };

  if (tasks.some(t => norm(t.text) === normalized))
    return { ok: false, msg: "Esa tarea ya existe." };

  return { ok: true, text: cleaned };
}

/**
 * Valida la intensidad (high/medium/low).
 * @param {string} intensity
 */
function validateIntensity(intensity) {
  const allowed = new Set(["high", "medium", "low"]);
  return allowed.has(intensity)
    ? { ok: true }
    : { ok: false, msg: "Intensidad inválida." };
}

/**
 * Valida si ya se llegó al límite de tareas.
 * @param {number} count 
 * @returns {{ok:boolean,msg?:string}}
 */
function validateMaxTasks(count) {
  return count >= RULES.maxTasks
    ? { ok: false, msg: `Máximo ${RULES.maxTasks} tareas.` }
    : { ok: true };
}