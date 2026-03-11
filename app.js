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
 * App con mejoras:
 * - Helpers: cx(), delegate(), BADGE + safeBadge()
 * - Componente TaskItem() limpio
 */

/* ===================== Helpers generales ===================== */

// Combina clases Tailwind de forma limpia
const cx = (...classes) => classes.filter(Boolean).join(" ");

// Delegación de eventos para evitar repeats de closest()
function delegate(root, type, selector, handler) {
  root.addEventListener(type, (ev) => {
    const target = ev.target instanceof Element ? ev.target.closest(selector) : null;
    if (target && root.contains(target)) handler(ev, target);
  });
}

// Normalizador para búsquedas y validación
function norm(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Debounce para suavizar búsqueda
function debounce(fn, ms = 180) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Anunciar mensajes accesibles
function announce(msg) {
  const live = document.getElementById("live");
  if (live) live.textContent = msg;
}

/* ===================== Mapeo intensidades ===================== */

// Colores Tailwind por intensidad (más limpio que if/else)
const BADGE = {
  high: "bg-red-600",
  medium: "bg-orange-400",
  low: "bg-teal-500",
};

const safeBadge = (intensity) => BADGE[intensity] ?? BADGE.medium;

/* ===================== Componente TaskItem ===================== */
/**
 * Crea de forma segura un <li> completo, con su punto de color,
 * su texto, su X roja y atributos dataset.
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

/* ===================== DOM refs ===================== */
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const intensitySelect = document.getElementById("intensity-select");
const taskList = document.querySelector(".task-list");
const searchInput = document.getElementById("task-search");
const emptyState = document.getElementById("empty-state");
const formErrorSummary = document.getElementById("form-error-summary");
const taskInputError = document.getElementById("task-input-error");
const intensityError = document.getElementById("intensity-select-error");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

/* ===================== State ===================== */
const state = {
  tasks: [],
  theme: "light",
};

/* ===================== Storage ===================== */
function loadTasks() {
  try { return JSON.parse(localStorage.getItem("tareas")) || []; }
  catch { return []; }
}

function saveTasks() {
  try { localStorage.setItem("tareas", JSON.stringify(state.tasks)); } catch {}
}

function getStoredTheme() {
  try { return localStorage.getItem("tema"); } catch { return null; }
}

function saveTheme(mode) {
  try { localStorage.setItem("tema", mode); } catch {}
}

/* ===================== Validaciones (ya configuradas) ===================== */
const RULES = {
  minLength: 3,
  maxLength: 80,
  maxTasks: 200,
  blockChars: /[<>]/g,
  requireWord: /[\p{L}\p{N}]/u,
  bannedWords: ["prueba", "test"],
};

function setFieldError(inputEl, errorEl, msg) {
  inputEl.setAttribute("aria-invalid", "true");
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}

function clearFieldError(inputEl, errorEl) {
  inputEl.removeAttribute("aria-invalid");
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

function setFormErrorSummary(msg) {
  formErrorSummary.textContent = msg;
  formErrorSummary.classList.remove("hidden");
}

function clearFormErrorSummary() {
  formErrorSummary.classList.add("hidden");
  formErrorSummary.textContent = "";
}

// Validación del texto
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

function validateIntensity(intensity) {
  const allowed = new Set(["high", "medium", "low"]);
  return allowed.has(intensity)
    ? { ok: true }
    : { ok: false, msg: "Intensidad inválida." };
}

function validateMaxTasks(count) {
  return count >= RULES.maxTasks
    ? { ok: false, msg: `Máximo ${RULES.maxTasks} tareas.` }
    : { ok: true };
}

/* ===================== Theme ===================== */
function applyTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  state.theme = isDark ? "dark" : "light";
  themeIcon.textContent = isDark ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-pressed", String(isDark));
}

function toggleTheme() {
  applyTheme(state.theme !== "dark");
  saveTheme(state.theme);
}

function initTheme() {
  const stored = getStoredTheme();
  const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = stored ? stored === "dark" : prefers;
  applyTheme(isDark);
}

/* ===================== Render ===================== */
function renderList() {
  taskList.textContent = "";
  const q = searchInput.value;

  state.tasks.forEach((task) => {
    taskList.appendChild(TaskItem(task));
  });

  if (q) filterTasks(q);
  else updateEmptyState();
}

function updateEmptyState() {
  const visible = [...taskList.querySelectorAll("li")]
    .some(li => getComputedStyle(li).display !== "none");
  emptyState.style.display = visible ? "none" : "";
}

/* ===================== Filtering ===================== */
function filterTasks(query) {
  const q = norm(query);
  taskList.querySelectorAll("li").forEach(li => {
    const txt = li.querySelector(".task-text");
    const content = norm(txt.textContent);
    li.style.display = content.includes(q) ? "" : "none";
  });
  updateEmptyState();
}

/* ===================== State setter ===================== */
function setTasks(next) {
  state.tasks = next;
  saveTasks();
  renderList();
}

/* ===================== Init ===================== */
initTheme();
state.tasks = loadTasks();
renderList();

/* ===================== Live validation ===================== */
taskInput.addEventListener(
  "input",
  debounce(() => {
    clearFieldError(taskInput, taskInputError);
    const check = validateTaskText(taskInput.value, state.tasks);
    if (!check.ok)
      setFieldError(taskInput, taskInputError, check.msg);
  }, 220)
);

/* ===================== Form submit ===================== */
let submitLocked = false;

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (submitLocked) return;
  submitLocked = true;
  setTimeout(() => (submitLocked = false), 700);

  clearFormErrorSummary();
  clearFieldError(taskInput, taskInputError);
  clearFieldError(intensitySelect, intensityError);

  const limit = validateMaxTasks(state.tasks.length);
  if (!limit.ok) {
    setFormErrorSummary(limit.msg);
    taskInput.focus();
    return;
  }

  const rawText = taskInput.value;
  const intensity = intensitySelect.value;

  const textCheck = validateTaskText(rawText, state.tasks);
  if (!textCheck.ok) {
    setFieldError(taskInput, taskInputError, textCheck.msg);
    setFormErrorSummary("Corrige los errores del formulario.");
    taskInput.focus();
    return;
  }

  const intCheck = validateIntensity(intensity);
  if (!intCheck.ok) {
    setFieldError(intensitySelect, intensityError, intCheck.msg);
    setFormErrorSummary("Corrige los errores del formulario.");
    intensitySelect.focus();
    return;
  }

  const newTask = {
    id: Date.now(),
    text: textCheck.text,
    intensity,
  };

  setTasks([...state.tasks, newTask]);
  taskForm.reset();
  announce(UI_TEXT.added);

  if (searchInput.value) filterTasks(searchInput.value);
});

/* ===================== Delete (delegated) ===================== */
delegate(taskList, "click", ".delete-task", (_e, btn) => {
  const li = btn.closest("li");
  const id = Number(li.dataset.id);

  setTasks(state.tasks.filter(t => t.id !== id));
  announce(UI_TEXT.removed);

  if (searchInput.value) filterTasks(searchInput.value);
});

/* ===================== Search ===================== */
searchInput.addEventListener(
  "input",
  debounce(() => filterTasks(searchInput.value), 180)
);

/* ===================== Theme toggle ===================== */
themeToggle.addEventListener("click", toggleTheme);