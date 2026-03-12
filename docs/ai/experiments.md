# Experimentos con IA

Aquí registraré pruebas, resultados y conclusiones relacionadas con el uso de inteligencia artificial en el proyecto.

// Planteamos 3 pequeños problemas de programación en JavaScript, para resolverlos con IA y sin IA //

(* Problema 1: *)
1. 🔢 Suma de dígitos
Escribe una función sumaDigitos(n) que reciba un número entero positivo y devuelva la suma de todos sus dígitos.

//Solución sin IA:
function sumaDigitos(n){
    let texto = n.toString();
    let suma = 0;
    for(let i=0; i< texto.length; i++){
        suma += Number(texto[i]);
    }
    return suma;
}

//Solución con IA:

function sumaDigitos(n) {
  return String(n).split('').reduce((acc, d) => acc + Number(d), 0);
}

(* Problema 2: *)
2. 🔤 Palabra más larga
Escribe una función palabraMasLarga(frase) que reciba una cadena de texto y devuelva la palabra más larga.
//Solución sin IA:

function palabraMasLarga(frase){
    let palabras = frase.split(" ");
    let masLarga = palabras[0];
    for(let i = 1; i < palabras.length; i++){
        if(palabras[i].length > masLarga.length){
            masLarga = palabras[i];
        }
    }
    return masLarga;
}

//Solución con IA

function palabraMasLarga(frase) {
  return frase.split(' ').reduce((mas, palabra) => 
    palabra.length > mas.length ? palabra : mas
  );
}

(* Problema 3: *)
3. 🔁 Palíndromo
Escribe una función esPalindromo(str) que devuelva true si la cadena se lee igual al derecho que al revés (ignorando mayúsculas).
//Solución sin IA:

function esPalindromo(str){
    let texto = str.toLowerCase();
    let invertido = texto.split("").reverse().join("");
    return texto === invertido;
}

//Solución con IA:

function esPalindromo(str) {
  const limpia = str.toLowerCase();
  return limpia === limpia.split('').reverse().join('');
}


(* Diferencias entre las soluciones sin IA y soluciones con IA: *)
// La principal diferencia es el tiempo invertido, es cierto que estos son problemas muy pequeños de programación y el tiempo dedicado a resolverlos sin IA es muy corto, pero aún así, usando la IA obtienes una solución para los 3 en apeans segundos. Es cierto que algunas diferencias a resaltar puede ser la claridad del código para resolver estos problemas, mis soluciones son más intuitivas y fáciles de entender, sobre todo para alguien que esté empezando a programar, mientras que la IA aportando soluciones correctas, no tiene en consideración el nivel del usuario a menos que se lo especifiquemos con algúm prompt.
Si miramos la comprensión del problema, aquí la IA no se para, simplemente ofrece una solución genérica que funciona, mientras que nosotros vamos paso a paso mostrando más detalladamente el proceso para lograr resolverlo.//

(* Experimento con tres tareas relacionados a mi proyecto: *)

//funciones que esten en mi app.js

// 1)
//mi función de app.js
function delegate(root, type, selector, handler) {
  root.addEventListener(type, (ev) => {
    const target = ev.target instanceof Element ? ev.target.closest(selector) : null;
    if (target && root.contains(target)) handler(ev, target);
  });
}

//función sugerida por IA
function delegate(root, type, selector, handler) {
  root.addEventListener(type, (ev) => {
    const el = ev.target instanceof Element ? ev.target.closest(selector) : null;
    if (!el || !root.contains(el)) return;
    handler(ev, el);
  });
}

// 2)
//mi función de app.js
function norm(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

//función sugerida por IA
function norm(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 3)
//mi función de app.js
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

//función sugerida por IA
function validateTaskText(rawText, tasks) {
  const cleaned = String(rawText).replace(/\s+/g, " ").trim();
  if (!cleaned) return { ok: false, msg: "Escribe una tarea." };

  // Evitar problemas por el flag /g: usar una regex sin /g para test()
  if (/[<>]/.test(cleaned)) return { ok: false, msg: "No se permiten < o >." };

  const len = cleaned.length;
  if (len < RULES.minLength) return { ok: false, msg: `Mínimo ${RULES.minLength} caracteres.` };
  if (len > RULES.maxLength) return { ok: false, msg: `Máximo ${RULES.maxLength} caracteres.` };

  if (!RULES.requireWord.test(cleaned)) return { ok: false, msg: "Debe contener letras o números." };

  const normalized = norm(cleaned);
  if (RULES.bannedWords.some((w) => normalized.includes(norm(w))))
    return { ok: false, msg: "La tarea contiene palabras no permitidas." };

  if (Array.isArray(tasks) && tasks.some((t) => norm(t.text) === normalized))
    return { ok: false, msg: "Esa tarea ya existe." };

  return { ok: true, text: cleaned };
}