import partidosRaw from '../data/partidos.json';
import temasRaw from '../data/temas.json';
import eleccion from '../data/eleccion.json';

export type Fuente = {
  url: string;
  titulo: string;
  tipo: 'programa' | 'nota_prensa' | 'boe' | 'congreso' | 'jec' | 'medio';
  pagina?: string;
};
export type Propuesta = {
  id: string;
  tema: string;
  resumen: string;
  cita?: string;
  fuente: Fuente;
  fechaConsulta: string;
  verificacion: 'verificado' | 'sin_verificar';
};
export type Partido = (typeof partidosRaw)[number];
export type Tema = { id: string; nombre: string };
type Fichero = { partido: string; temasRevisados: string[]; propuestas: Propuesta[] };

const ficheros = import.meta.glob<Fichero>('../data/propuestas/*.json', {
  eager: true,
  import: 'default',
});

// Orden alfabético fijo por nombre, igual en toda la web (neutralidad).
export const partidos: Partido[] = [...partidosRaw].sort((a, b) =>
  a.nombre.localeCompare(b.nombre, 'es'),
);
export const temas: Tema[] = temasRaw;
export { eleccion };

export const temaNombre = (id: string) => temas.find((t) => t.id === id)?.nombre ?? id;
export const getPartido = (id: string) => partidos.find((p) => p.id === id);

function fichero(partidoId: string): Fichero {
  const f = Object.entries(ficheros).find(([k]) => k.endsWith(`/${partidoId}.json`))?.[1];
  return f ?? { partido: partidoId, temasRevisados: [], propuestas: [] };
}

export type EstadoTema =
  | { tipo: 'propuestas'; propuestas: Propuesta[] }
  | { tipo: 'no_consta' } // revisado y sin mención
  | { tipo: 'pendiente' }; // aún sin revisar: NO equivale a "no consta"

export function estadoTema(partidoId: string, temaId: string): EstadoTema {
  const f = fichero(partidoId);
  const ps = f.propuestas.filter((p) => p.tema === temaId);
  if (ps.length) return { tipo: 'propuestas', propuestas: ps };
  if (f.temasRevisados.includes(temaId)) return { tipo: 'no_consta' };
  return { tipo: 'pendiente' };
}

export const propuestasDe = (partidoId: string) => fichero(partidoId).propuestas;

export function todasLasPropuestas() {
  return partidos.flatMap((p) => propuestasDe(p.id).map((x) => ({ ...x, partido: p.id })));
}

export const url = (path: string) =>
  (import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '')).replace(/\/{2,}$/, '/');
