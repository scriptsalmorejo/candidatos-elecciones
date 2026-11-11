# Propuestas 29N

Web estática en español (Astro + Tailwind + TypeScript) para ver y comparar qué propone cada partido en las elecciones generales de España del 29 de noviembre de 2026. Sin backend ni base de datos: todos los datos son archivos JSON dentro del repo.

Partidos incluidos: Frente Amplio, Partido Popular, PSOE, Podemos y Vox (orden alfabético).

## Estado de los datos

**Todas las propuestas están marcadas «sin verificar».** Proceden de dos recopilaciones hechas a partir de prensa y agregadores (ver `fuentes/`), no de los programas originales. A fecha 11-nov-2026 solo el PP había presentado programa completo; el resto de partidos aún no lo había publicado. Para pasar una propuesta a «verificado» hay que contrastarla con el documento original (ver [Verificar una propuesta](#verificar-una-propuesta)).

## Funcionalidades

- Portada con los partidos, candidato/a y enlace al programa.
- Página por partido (`/partido/<id>/`) con propuestas agrupadas por tema.
- Comparador (`/comparador/`): 2 a 4 partidos y un tema, en columnas. La URL es compartible (`?p=pp,vox&tema=vivienda`).
- Buscador (`/buscar/`) con filtro por tema y partido.
- Modo claro/oscuro y diseño responsive.
- Cada propuesta enlaza a su fuente.

## Desarrollo

Requiere Node 22 o superior.

```bash
npm install
npm run dev        # servidor local en http://localhost:4321
npm run validate   # valida los datos
npm run build      # valida y genera dist/
npm run preview    # sirve dist/ en local
npm run check      # comprueba tipos
```

## Estructura de datos (`src/data/`)

| Archivo | Contenido |
|---|---|
| `eleccion.json` | Fecha y convocatoria (`verificado: false` hasta contrastar con el BOE). |
| `temas.json` | Lista de temas (`id` y `nombre`). |
| `partidos.json` | Partidos: `id`, `nombre`, `siglas`, `color`, `candidato`, `programa`, `web`, `notas`. |
| `propuestas/<partido>.json` | Propuestas de un partido. |

### Propuestas

```json
{
  "partido": "pp",
  "temasRevisados": ["vivienda"],
  "propuestas": [
    {
      "id": "pp-vivienda-01",
      "tema": "vivienda",
      "resumen": "Máximo dos frases, en tono neutro.",
      "cita": "Cita literal corta (opcional, máx. 300 caracteres).",
      "fuente": {
        "url": "https://…",
        "titulo": "Título del documento",
        "tipo": "programa",
        "pagina": "12",
        "origen": "Texto opcional, p. ej. medios citados por una recopilación"
      },
      "fechaConsulta": "2026-11-11",
      "verificacion": "verificado"
    }
  ]
}
```

- `tipo` de fuente: `programa`, `nota_prensa`, `boe`, `congreso`, `jec` o `medio`.
- `verificacion`: `verificado` o `sin_verificar`. Una fuente de tipo `medio` nunca puede ser `verificado`.
- `tema` debe ser un `id` de `temas.json`.

### «No consta» frente a «Pendiente de revisar»

- Un tema con propuestas las muestra.
- Un tema **sin propuestas** y listado en `temasRevisados` muestra **«No consta en su programa»**. Solo añade un tema a `temasRevisados` cuando hayas leído la fuente completa y no aparezca.
- Un tema sin propuestas y **no** listado en `temasRevisados` muestra **«Pendiente de revisar»**. No equivale a que el partido no diga nada.

## Cómo actualizar los datos

1. **Añadir o editar una propuesta:** abre `src/data/propuestas/<partido>.json` y añade el objeto siguiendo el esquema. Usa `id` únicos con el patrón `<partido>-<tema>-NN`.
2. **Escribir con neutralidad:** mismo formato y tono para todos los partidos, máximo dos frases, sin adjetivos valorativos. Resume lo que dice el propio partido, no sus críticos. Los términos propios de un partido van entre comillas.
3. **Candidato/a o programa:** edita `partidos.json`. Si pones `candidato.verificado: true`, añade `candidato.fuenteUrl`. Si pones `programa.estado: "publicado"`, añade `programa.url` con https.
4. **Nuevo tema:** añádelo a `temas.json`. Los temas se muestran en ese orden.
5. **Nuevo partido:** añádelo a `partidos.json` y crea `src/data/propuestas/<id>.json` con `{ "partido": "<id>", "temasRevisados": [], "propuestas": [] }`. Se ordena solo alfabéticamente.
6. Ejecuta `npm run validate` y revisa en `npm run dev`.

### Verificar una propuesta

1. Localiza el texto en el documento original del partido (programa, nota de prensa oficial, BOE…).
2. Sustituye la fuente por la original: `url` del documento, `titulo`, `tipo`, `pagina` y, si aplica, `cita` literal. Quita `origen`.
3. Cambia `verificacion` a `verificado` y actualiza `fechaConsulta`.

## Validador (`scripts/validate.mjs`)

`npm run build` lo ejecuta antes de compilar, así que un dato incorrecto impide el despliegue. Comprueba:

- JSON válido, partidos y temas existentes, `id` únicos.
- Cada propuesta tiene fuente (`url` https, `titulo`, `tipo`) y `fechaConsulta` en formato `AAAA-MM-DD` y no futura.
- Resumen de máximo 2 frases y 320 caracteres; cita de máximo 300.
- Una fuente de medio no se marca como verificada.
- Avisa (sin fallar) si detecta lenguaje valorativo en un resumen. Revísalo a mano.

Al final imprime cuántas propuestas tiene cada partido, para vigilar el equilibrio.

## Despliegue en GitHub Pages

El workflow `.github/workflows/deploy.yml` construye y publica la web al hacer push a `main`.

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Fusiona la rama de trabajo en `main` (o lanza el workflow a mano desde la pestaña Actions).
3. La web queda en `https://<usuario>.github.io/<repo>/`. El workflow calcula `SITE` y `BASE` a partir del repositorio.

Para otro hosting:

- **Netlify o Vercel:** comando `npm run build`, directorio de salida `dist`. No definas `BASE`; si el sitio está en la raíz del dominio, no hace falta nada más. Define `SITE` con la URL final.
- **Dominio propio en GitHub Pages:** define `BASE=/` y `SITE=https://tu-dominio` en el workflow.

## Neutralidad

- Orden alfabético fijo en toda la web.
- El color de cada partido es solo un acento; el texto y el contraste son iguales para todos.
- Sin recomendaciones de voto ni valoraciones.
- Los medios solo se usan como apoyo y se citan siempre.

## Estructura del repo

```
fuentes/            recopilaciones recibidas (PDF) usadas como fuente provisional
scripts/validate.mjs
src/data/           datos JSON
src/pages/          portada, partido, comparador, buscador, metodología
src/components/     tarjeta de propuesta, logo, estado vacío
.github/workflows/  despliegue en GitHub Pages
```

## Limitaciones conocidas

- Los logos son monogramas con siglas; los logotipos oficiales son marcas registradas y habría que tomarlos de la web oficial y citarlos.
- Los enlaces de las propuestas cargadas apuntan al PDF de `fuentes/` en la rama de trabajo. Cambiarán al fusionar o renombrar la rama, y deben sustituirse por las fuentes originales.
- Candidatos, fecha de las elecciones y enlaces a programas siguen sin verificar contra BOE, Junta Electoral Central y webs oficiales.
