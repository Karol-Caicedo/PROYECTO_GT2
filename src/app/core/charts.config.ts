import { Chart, ChartConfiguration } from 'chart.js';

/* ============================================================
   PALETA CENTRALIZADA DE GRÁFICOS (Chart.js)
   - Serie principal: azul · segunda serie: verde
   - Series extra: azul 900, verde 900, azul 100 (borde azul), gris
   - Mapa de calor: secuencia blanco → azul → azul 900 (sin arcoíris)
   - Tooltips: fondo Azul 900, texto blanco
   ============================================================ */
export const GRAFICOS = {
  azul: '#1976B9',
  verde: '#39864A',
  azul900: '#0B3A5E',
  verde900: '#1C4A27',
  azulClaro: '#DCEBF6',
  gris: '#9AA5B1',
  rejilla: '#E4EBF0',
  texto: '#52606D',
  tooltipFondo: '#0B3A5E',
} as const;

/** Aplica tipografía y color base a todos los gráficos. Llamar una vez al arrancar. */
export function aplicarTemaGraficos(): void {
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.font.size = 13;
  Chart.defaults.color = GRAFICOS.texto;
}

const tooltipComun: ChartConfiguration['options'] = {
  plugins: {
    tooltip: {
      backgroundColor: GRAFICOS.tooltipFondo,
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
    },
    legend: { labels: { usePointStyle: true, pointStyle: 'rectRounded' } },
  },
};

function escalasCartesianas(extra = {}): ChartConfiguration['options'] {
  return {
    scales: {
      x: { grid: { color: GRAFICOS.rejilla }, ticks: { color: GRAFICOS.texto } },
      y: { grid: { color: GRAFICOS.rejilla }, ticks: { color: GRAFICOS.texto, precision: 0 }, beginAtZero: true },
    },
    ...extra,
  };
}

export function opcionesBarrasHorizontales(): ChartConfiguration['options'] {
  return {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    ...escalasCartesianas(), ...tooltipComun,
  } as ChartConfiguration['options'];
}

export function opcionesBarrasVerticales(): ChartConfiguration['options'] {
  return {
    responsive: true, maintainAspectRatio: false,
    ...escalasCartesianas(), ...tooltipComun,
  } as ChartConfiguration['options'];
}

export function opcionesLinea(): ChartConfiguration['options'] {
  return {
    responsive: true, maintainAspectRatio: false,
    ...escalasCartesianas(),
    ...tooltipComun,
    elements: { line: { tension: 0.25 }, point: { radius: 5, hoverRadius: 7 } },
  } as ChartConfiguration['options'];
}

/** Color secuencial blanco → azul → azul 900. Las celdas siempre llevan el valor numérico. */
export function colorMapaCalor(valor: number | undefined, maximo: number): { fondo: string; texto: string } {
  if (!valor || maximo <= 0) return { fondo: '#FFFFFF', texto: GRAFICOS.texto };
  const t = Math.min(1, valor / maximo);
  const lerp = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const blanco = [255, 255, 255], azul = [25, 118, 185], azul900 = [11, 58, 94];
  const rgb = t < 0.6 ? lerp(blanco, azul, t / 0.6) : lerp(azul, azul900, (t - 0.6) / 0.4);
  return { fondo: `rgb(${rgb.join(',')})`, texto: t < 0.45 ? GRAFICOS.texto : '#FFFFFF' };
}
