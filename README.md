# Cuyín Aprende

Prototipo de app educativa para primer grado en Mendoza.

## Publicarlo con GitHub Pages (todo dentro de GitHub, sin Vercel)

### Paso 1 · Subir a GitHub

1. Andá a [github.com/new](https://github.com/new)
2. Nombre del repo: **`cuyin-aprende`** exactamente (importante — si le ponés otro nombre hay que ajustar `vite.config.js`)
3. Marcá "Public"
4. Creá el repo
5. Tocá **"uploading an existing file"**
6. Subí TODOS los archivos y carpetas del proyecto (incluyendo la carpeta oculta `.github/`)
7. Confirmá el commit

### Paso 2 · Activar GitHub Pages

1. En tu repo, andá a **Settings** (arriba a la derecha)
2. En el menú izquierdo, **Pages**
3. En "Build and deployment" → "Source" → elegí **"GitHub Actions"**
4. Guardá

### Paso 3 · Esperá que se publique

1. Andá a la pestaña **Actions** del repo
2. Vas a ver corriendo el workflow "Deploy to GitHub Pages"
3. Cuando termine (2-3 minutos), volvé a **Settings → Pages**
4. Ahí arriba te aparece la URL pública tipo `https://tu-usuario.github.io/cuyin-aprende/`

Cada vez que hagas un cambio y hagas commit, se re-publica solo.

---

## Si preferís Vercel (más simple, pero fuera de GitHub)

1. Cambiá `base: '/cuyin-aprende/'` por `base: './'` en `vite.config.js`
2. En vercel.com, "Sign up with GitHub" → "Add New Project" → elegí el repo → Deploy
3. Listo, URL pública tipo `cuyin-aprende.vercel.app`

---

## Estructura del proyecto

```
cuyin-aprende/
├── .github/workflows/deploy.yml   → Deploy automático a Pages
├── index.html                     → HTML principal
├── package.json                   → Dependencias
├── vite.config.js                 → Config del bundler
├── .gitignore
└── src/
    ├── main.jsx                   → Entrada React
    └── App.jsx                    → TODA la app está acá
```

## Cómo agregar contenido

Al principio de `src/App.jsx` está `GAME`, la constante con zonas y lecciones.
Tipos de actividad disponibles: `letterIntro`, `findLetter`, `countObjects`,
`simpleAdd`, `simpleSub`, `wordMatch`.

Ejemplo — nueva lección con la letra T:

```js
{
  id: 'l10',
  name: 'La letra T',
  activities: [
    { type: 'letterIntro', letter: 'T', hint: 'como un tren' },
    { type: 'findLetter', target: 'T', grid: ['T','A','T','M','T','O','T','E','U'] },
    { type: 'simpleAdd', a: 5, b: 4, object: 'grape' },
  ],
}
```

## Limitaciones del prototipo

- Progreso NO persistente entre sesiones (se resetea al recargar)
- Voz por sintetizador — para app real conviene audio grabado en argentino
- Sin reconocimiento de voz (el chico no puede leer en voz alta todavía)
- 9 lecciones — para el año completo hacen falta ~40-60 más
