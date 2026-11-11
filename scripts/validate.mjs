#!/usr/bin/env node
// Valida los datos: cada propuesta debe tener fuente y fecha, tema válido, formato neutral.
// Uso: npm run validate   (sale con código 1 si hay errores)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const load = (f) => {
  try { return JSON.parse(readFileSync(f, 'utf8')); }
  catch (e) { err(`${f}: JSON inválido (${e.message})`); return null; }
};

const partidos = load(join(root, 'partidos.json')) ?? [];
const temas = load(join(root, 'temas.json')) ?? [];
const temaIds = new Set(temas.map((t) => t.id));
const TIPOS = new Set(['programa', 'nota_prensa', 'boe', 'congreso', 'jec', 'medio']);
const today = new Date().toISOString().slice(0, 10);
// Lenguaje valorativo a evitar (aviso, revisar a mano).
const VALORATIVAS = /\b(hist[oó]ric[oa]s?|brutal(es)?|desastros[oa]s?|extremist[ao]s?|radical(es)?|ambicios[oa]s?|valiente(s)?|ineficaz|fracaso|vergonzos[oa]s?|innovador(a|es|as)?|revolucionari[oa]s?|justo[s]?|injust[oa]s?)\b/i;

const ids = new Set();
for (const p of partidos) {
  if (ids.has(p.id)) err(`partidos.json: id duplicado ${p.id}`);
  ids.add(p.id);
  for (const k of ['nombre', 'siglas', 'color']) if (!p[k]) err(`partidos.json[${p.id}]: falta ${k}`);
  if (!/^#[0-9a-f]{6}$/i.test(p.color ?? '')) err(`partidos.json[${p.id}]: color no es #rrggbb`);
  if (!p.candidato?.nombre) err(`partidos.json[${p.id}]: falta candidato.nombre`);
  if (p.candidato?.verificado && !p.candidato.fuenteUrl) err(`partidos.json[${p.id}]: candidato verificado sin fuenteUrl`);
  if (p.programa?.estado === 'publicado' && !/^https:\/\//.test(p.programa.url ?? '')) err(`partidos.json[${p.id}]: programa publicado sin URL https`);
}

const stats = {};
const files = readdirSync(join(root, 'propuestas')).filter((f) => f.endsWith('.json'));
for (const id of ids) if (!files.includes(`${id}.json`)) err(`Falta propuestas/${id}.json`);

for (const f of files) {
  const d = load(join(root, 'propuestas', f));
  if (!d) continue;
  const where = (x) => `propuestas/${f}${x ? '#' + x : ''}`;
  if (`${d.partido}.json` !== f || !ids.has(d.partido)) err(`${where()}: "partido" (${d.partido}) no coincide con el fichero o no existe`);
  for (const t of d.temasRevisados ?? []) if (!temaIds.has(t)) err(`${where()}: temasRevisados con tema desconocido ${t}`);
  const seen = new Set();
  stats[d.partido] = {};
  for (const [i, p] of (d.propuestas ?? []).entries()) {
    const w = where(p.id ?? `#${i}`);
    if (!p.id) err(`${w}: falta id`);
    else if (seen.has(p.id)) err(`${w}: id duplicado`);
    seen.add(p.id);
    if (!temaIds.has(p.tema)) err(`${w}: tema inválido "${p.tema}"`);
    stats[d.partido][p.tema] = (stats[d.partido][p.tema] ?? 0) + 1;
    if (!p.resumen || typeof p.resumen !== 'string') err(`${w}: falta resumen`);
    else {
      const frases = p.resumen.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/).length;
      if (frases > 2) err(`${w}: el resumen tiene ${frases} frases (máx. 2)`);
      if (p.resumen.length > 320) err(`${w}: resumen demasiado largo (${p.resumen.length} > 320)`);
      if (VALORATIVAS.test(p.resumen)) warns.push(`${w}: posible lenguaje valorativo en el resumen`);
    }
    if (p.cita !== undefined && (typeof p.cita !== 'string' || p.cita.length > 300)) err(`${w}: cita inválida o > 300 caracteres`);
    if (!p.fuente || !/^https:\/\//.test(p.fuente.url ?? '')) err(`${w}: falta fuente.url https`);
    if (!p.fuente?.titulo) err(`${w}: falta fuente.titulo`);
    if (p.fuente?.origen !== undefined && typeof p.fuente.origen !== 'string') err(`${w}: fuente.origen debe ser texto`);
    if (!TIPOS.has(p.fuente?.tipo)) err(`${w}: fuente.tipo inválido`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fechaConsulta ?? '') || isNaN(Date.parse(p.fechaConsulta))) err(`${w}: fechaConsulta ausente o no es AAAA-MM-DD`);
    else if (p.fechaConsulta > today) err(`${w}: fechaConsulta en el futuro`);
    if (!['verificado', 'sin_verificar'].includes(p.verificacion)) err(`${w}: verificacion debe ser "verificado" o "sin_verificar"`);
    if (p.verificacion === 'verificado' && p.fuente?.tipo === 'medio') err(`${w}: una fuente de medio no puede marcarse como verificada`);
  }
}

// Informe de equilibrio (neutralidad): nº de propuestas por partido.
console.log('Propuestas por partido:');
for (const p of partidos) {
  const n = Object.values(stats[p.id] ?? {}).reduce((a, b) => a + b, 0);
  console.log(`  ${p.id.padEnd(14)} ${n}`);
}
warns.forEach((w) => console.warn('AVISO  ' + w));
if (errors.length) {
  console.error(`\n${errors.length} error(es):`);
  errors.forEach((e) => console.error('  ✖ ' + e));
  process.exit(1);
}
console.log('\n✔ Datos válidos');
