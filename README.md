# Propuestas 29N

Web estática (Astro + Tailwind + TypeScript) para comparar las propuestas de los partidos en las elecciones generales de España.

**Estado: Fase 2 (estructura).** Aún no hay propuestas cargadas; los datos de partidos y candidatos están marcados como «sin verificar».

## Comandos
- `npm install` · `npm run dev` · `npm run validate` · `npm run build`

## Datos (`src/data/`)
- `partidos.json`, `temas.json`, `eleccion.json`
- `propuestas/<partido>.json`: `temasRevisados` (temas ya mirados en la fuente; si uno no tiene propuestas se muestra «No consta en su programa», si no está revisado, «Pendiente de revisar») y `propuestas` (id, tema, resumen ≤2 frases, cita opcional, fuente{url,titulo,tipo}, fechaConsulta, verificacion).

La guía completa de actualización y despliegue se escribirá en la Fase 6.
