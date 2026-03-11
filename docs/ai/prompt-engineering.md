# Técnicas de Prompt Engineering

Este documento recoge estrategias de creación de prompts para obtener mejores resultados con IA.

---

## 1. Rol claro: desarrollador senior

**Prompt**

> Actúa como un desarrollador senior de JavaScript/TypeScript.  
> Revisa el archivo `app.js` de mi proyecto y:  
> 1) Señala los 3 problemas de diseño o legibilidad más importantes.  
> 2) Propón mejoras concretas sin cambiar todavía el código.  
> 3) Explica en lenguaje sencillo por qué cada mejora es importante.

**Por qué funciona**  
Rol muy claro + objetivo concreto ⇒ respuestas menos genéricas y más útiles.

---

## 2. Rol + acción: refactor guiado

**Prompt**

> Actúa como un desarrollador senior de front-end.  
> Quiero refactorizar esta función de `app.js` para hacerla más legible y fácil de testear:  
>  
> ```js
> <PEGA AQUÍ LA FUNCIÓN ACTUAL>
> ```  
>  
> Devuélveme:  
> - Una versión refactorizada de la función.  
> - Una lista corta (3–5 puntos) explicando los cambios clave y el beneficio de cada uno.

**Por qué funciona**  
Marca rol, trozo de código y formato de salida, forzando explicación y no solo código.

---

## 3. Few-shot: estilo de mejora de funciones

**Prompt**

> EJEMPLO 1  
> Código:  
> ```js
> function suma(a, b) {
>   return a + b;
> }
> ```  
>  
> Mejora esperada (resumen):  
> - Añadir tipos JSDoc.  
> - Validar que los parámetros son números.  
>  
> EJEMPLO 2  
> Código:  
> ```js
> function getColor(intensidad) {
>   if (intensidad === "alta") return "bg-red-600";
>   if (intensidad === "media") return "bg-orange-400";
>   return "bg-teal-500";
> }
> ```  
>  
> Mejora esperada (resumen):  
> - Extraer el mapa de intensidades a un objeto constante.  
> - Lanzar error si la intensidad no es válida.  
>  
> INSTRUCCIÓN  
> Ahora aplica el mismo tipo de mejoras (tipado, validaciones y separación de constantes) a esta función de mi `app.js`:  
> ```js
> <PEGA AQUÍ OTRA FUNCIÓN DE app.js>
> ```  

**Por qué funciona**  
Usa ejemplos (few-shot) para fijar el tipo de mejoras y el estilo esperado.

---

## 4. Razonamiento paso a paso (chain-of-thought ligero)

**Prompt**

> Quiero que pienses paso a paso.  
> Primero, sin mostrarme código aún, analiza esta función de `app.js` y escríbeme en 5–7 puntos qué problemas ves y qué alternativas hay:  
> ```js
> <FUNCIÓN DE app.js>
> ```  
>  
> Solo después de esa lista, proponme una versión mejorada de la función.

**Por qué funciona**  
Separa análisis y solución, y obliga a razonar antes de cambiar código.

---

## 5. Restricciones claras en el resultado

**Prompt**

> Refactoriza la siguiente parte de `app.js` para mejorar la legibilidad, pero con estas restricciones:  
> - No cambies ningún nombre de función pública ni los `id` del DOM.  
> - No uses ninguna librería nueva.  
> - La solución final debe caber en menos de 30 líneas.  
>  
> Código original:  
> ```js
> <BLOQUE DE CÓDIGO DE app.js>
> ```  

**Por qué funciona**  
Las restricciones claras acotan la respuesta y evitan cambios rompientes.

---

## 6. Documentar flujo con pasos numerados

**Prompt**

> Lee mi archivo `app.js` y descríbeme el flujo completo de la aplicación de entrenamientos semanales en forma de pasos numerados, por ejemplo:  
> 1) Qué ocurre al cargar la página.  
> 2) Qué pasa al añadir una tarea.  
> 3) Qué pasa al borrar una tarea.  
> 4) Cómo funciona el buscador.  
> 5) Cómo se gestiona el modo oscuro.  
>  
> Usa frases cortas y concretas.

**Por qué funciona**  
Pide vista global del flujo, ideal para documentar y comprobar entendimiento.

---

## 7. Generar documentación en tu propio estilo

**Prompt**

> Usando el estilo que ya tengo en `docs/ai/cursor-workflow.md`, genera una nueva sección que explique cómo funciona `app.js` (lista de tareas) para un compañero de clase que no conoce el proyecto.  
> Incluye:  
> - Un resumen corto.  
> - Una explicación por secciones (carga inicial, añadir/borrar, buscador, modo oscuro).  
> - Sin código, solo texto.

**Por qué funciona**  
Referencia un estilo previo y un público concreto, así la documentación encaja mejor en el proyecto.

---

## 8. Uso de MCP (GitHub) con intención clara

**Prompt**

> Usa el servidor MCP de GitHub configurado en Cursor para leer el `README.md` del repositorio `OWNER/REPO`.  
> A partir de ese contenido:  
> - Resúmelo en 5 frases.  
> - Dime 3 mejoras concretas que podría hacerle a la documentación.  
> - Indica si falta alguna sección importante (por ejemplo: instalación, uso, tests).

**Por qué funciona**  
Obliga a usar MCP de GitHub y define una salida estructurada fácil de reutilizar.

---

## 9. Prompt de “profesor” (para aprender)

**Prompt**

> Actúa como profesor de programación front-end.  
> A partir de este código de `app.js`:  
> ```js
> <FRAGMENTO DE app.js>
> ```  
>  
> 1) Explícamelo como si fuera principiante.  
> 2) Señálame 3 errores típicos que podría cometer alguien al escribir algo parecido.  
> 3) Propón un pequeño ejercicio para mejorar mi comprensión de este código.

**Por qué funciona**  
Coloca a la IA en rol de profesor y la orienta a explicación + práctica.

---

## 10. Prompt combinado: rol + few-shot + restricciones

**Prompt**

> Actúa como desarrollador senior de front-end.  
> Aquí tienes un ejemplo de cómo quiero que transformes funciones:  
>  
> EJEMPLO  
> Antes:  
> ```js
> function getIntensityLabel(intensidad) {
>   if (intensidad === "alta") return "Alta intensidad";
>   if (intensidad === "media") return "Media intensidad";
>   return "Baja intensidad";
> }
> ```  
> Después (estilo deseado):  
> - Código más declarativo.  
> - Uso de un mapa constante para evitar if encadenados.  
>  
> Ahora aplica ese mismo estilo a esta parte de `app.js` (sin cambiar comportamiento ni nombres públicos):  
> ```js
> <OTRO FRAGMENTO DE app.js>
> ```  

**Por qué funciona**  
Combina rol, ejemplo y restricciones, guiando el estilo sin romper el comportamiento.

