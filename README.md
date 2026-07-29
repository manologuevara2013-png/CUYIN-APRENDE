# Cuyín Aprende

Prototipo de app educativa para primer grado en Mendoza. Enseña lectoescritura
y suma/resta con Cuyín, un guanaco que guía a los chicos por la provincia.

## Ver el prototipo online sin instalar nada

Después de subir esto a GitHub, conectalo con **Vercel** (gratis) y te queda
una URL pública tipo `cuyin-aprende.vercel.app` que podés compartir con
maestras, socios o quien quieras.

---

## Paso 1 · Subirlo a GitHub

**Opción A · Desde el navegador (más fácil desde iPhone)**

1. Andá a [github.com/new](https://github.com/new)
2. Nombre del repo: `cuyin-aprende` (o el que quieras)
3. Marcá "Public"
4. Creá el repo
5. En la pantalla siguiente, tocá **"uploading an existing file"**
6. Arrastrá TODA la carpeta `cuyin-aprende` (con sus archivos y la subcarpeta `src/`)
7. Escribí un mensaje de commit tipo "Primera versión" y confirmá

**Opción B · Con la app móvil de GitHub o Working Copy**

Cloná el repo vacío, copiá los archivos adentro, hacé commit y push.

---

## Paso 2 · Deployarlo con Vercel (gratis, 2 minutos)

1. Andá a [vercel.com](https://vercel.com) y creá cuenta con tu GitHub
2. Tocá **"Add New Project"**
3. Elegí el repo `cuyin-aprende`
4. Vercel detecta automáticamente que es Vite/React — no toques nada
5. Tocá **"Deploy"**
6. En un minuto tenés tu URL pública

Cada vez que hagas un cambio en GitHub, Vercel redeploya solo.

---

## Paso 3 · Para desarrollar localmente (opcional)

Si querés modificar el código en tu compu:

```bash
npm install
npm run dev
```

Y andá a `http://localhost:5173`

---

## Estructura del proyecto

```
cuyin-aprende/
├── index.html          → HTML principal
├── package.json        → Dependencias
├── vite.config.js      → Config del bundler
├── .gitignore
└── src/
    ├── main.jsx        → Punto de entrada React
    └── App.jsx         → TODA la lógica de la app está acá
```

Toda la app está en `src/App.jsx`. Ese es el único archivo que hay que
tocar para cambiar contenido (agregar lecciones, palabras, sumas, etc).

---

## Cómo agregar contenido nuevo

Al principio de `App.jsx` está la constante `GAME` con las zonas y lecciones.
Cada lección tiene actividades. Los tipos disponibles:

- `letterIntro` — presenta una letra
- `findLetter` — buscar la letra escondida en una grilla
- `countObjects` — contar objetos
- `simpleAdd` — sumar
- `simpleSub` — restar
- `wordMatch` — unir palabra con dibujo

Ejemplo — agregar una lección nueva:

```js
{
  id: 'l10',
  name: 'La letra T',
  activities: [
    { type: 'letterIntro', letter: 'T', hint: 'como un tren: tttt' },
    { type: 'findLetter', target: 'T', grid: ['T','A','T','M','T','O','T','E','U'] },
    { type: 'simpleAdd', a: 5, b: 4, object: 'grape' },
  ],
}
```

---

## Limitaciones del prototipo

- El progreso NO se guarda entre sesiones (se resetea al recargar).
  Para producción hay que sumar backend (Firebase, Supabase, etc.)
- La voz usa el sintetizador del teléfono. Para app real conviene grabar
  audio en argentino con voz humana.
- No tiene reconocimiento de voz (el chico no puede leer en voz alta y
  ser evaluado). Requiere integración con Web Speech Recognition o servicio pago.
- Contenido limitado a 9 lecciones. Para cubrir todo el año escolar
  hacen falta ~40-60 lecciones más.
