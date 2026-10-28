# Guía de estilo — SIGICE

Identidad de la Universidad del Pacífico (Buenaventura): el **azul** evoca los
recursos hídricos y el **verde** la riqueza forestal. Proporción de uso:
**60 % blanco/neutros · 30 % azul · 10 % verde**. El azul domina (navegación,
primarios, encabezados); el verde es acento (confirmaciones, “publicado”,
llamadas secundarias). Fondos blancos con aire generoso.

> Regla de oro: **ningún color hardcodeado en componentes**. Todo sale de
> `src/styles/_tokens.scss` vía `var(--...)`. La única excepción es la
> paleta centralizada de gráficos (`src/app/core/charts.config.ts`).

## 1. Colores y uso

| Token                                                        | Hex                                           | Uso                                                               |
| ------------------------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------- |
| `--azul-900`                                                 | `#0B3A5E`                                     | Textos sobre claro, encabezados, footer, tooltips de gráficos     |
| `--azul-700`                                                 | `#125A8D`                                     | Hover/activo del azul, enlaces, fechas destacadas                 |
| `--azul-500`                                                 | `#1976B9`                                     | Primario: botones, navegación, serie principal de gráficos        |
| `--azul-100`                                                 | `#DCEBF6`                                     | Fondos suaves, chips activos, tarjeta seleccionada, iconos        |
| `--azul-50`                                                  | `#F0F7FC`                                     | Fondos de sección, header de tablas, hover de filas               |
| `--verde-900`                                                | `#1C4A27`                                     | Series extra de gráficos, texto de chip verde                     |
| `--verde-700`                                                | `#2B6A39`                                     | **Texto verde pequeño**, checks, contadores, snackbar de éxito    |
| `--verde-500`                                                | `#39864A`                                     | Acento: 2ª serie de gráficos, botón `.btn-acento`, fondos grandes |
| `--verde-100`                                                | `#DDEEE1`                                     | Fondos suaves verdes                                              |
| `--verde-50`                                                 | `#F1F8F3`                                     | Fondos de sección verdes                                          |
| `--texto` / `--texto-secundario`                             | `#1F2933` / `#52606D`                         | Cuerpo / secundario (6.5:1 sobre blanco ✓)                        |
| `--borde` / `--fondo-pagina` / `--superficie` / `--gris-100` | `#D9E2E8` / `#F7FAFC` / `#FFFFFF` / `#EEF2F5` | Bordes, página, tarjetas, chip gris                               |
| `--error` / `--error-fondo`                                  | `#C62828` / `#FBE9E9`                         | **Solo estados de error** (5.6:1 ✓)                               |
| `--advertencia` (+ fondo/borde)                              | `#B26A00` / `#FDF3E3` / `#F0D9A8`             | **Solo avisos** (icono/borde; texto siempre oscuro)               |
| `--grafico-gris` / `--grafico-rejilla`                       | `#9AA5B1` / `#E4EBF0`                         | Series extra, cuadrícula clara                                    |

### Contraste (WCAG AA 4.5:1 texto normal)

- Blanco sobre Azul 500 ≈ 4.8 ✓ · sobre Azul 900/700 ✓ de sobra.
- Blanco sobre Verde 500 ≈ 4.1 ✗ → **texto pequeño siempre en Verde 700**;
  Verde 500 solo en fondos grandes, iconos y botones ≥ 16 px en negrita.
- Prohibidos morados, naranjas o rojos decorativos.

## 2. Tipografía e iconos

Fuente **Inter** (Google Fonts, fallback del sistema). Escala:
28 px títulos de página · 24/20 px secciones · 16 px cuerpo · 14 px
secundario (mínimo permitido). Clases: `.titulo-pagina`, `.titulo-seccion`,
`.texto-secundario`. Iconos: **Material Symbols Outlined**
(`<span class="material-symbols-outlined">nombre</span>`).

## 3. Fundaciones

- **Espaciado** escala 4 px: `--esp-1 (4)` … `--esp-10 (40)`.
- **Radios**: `--radio-m: 8px` (tarjetas, campos, botones),
  `--radio-chip: 999px` (chips), `--radio-l: 16px` (diálogos).
- **Sombras** `--sombra-1/2`, **transiciones** 150–200 ms,
  foco visible con anillo azul 2 px, `prefers-reduced-motion` respetado.
- **Modo oscuro**: no incluido; dejarlo listo = reasignar estas variables
  bajo `[data-theme="oscuro"]` (ver comentario en `_tokens.scss`).

## 4. Componentes (`src/app/shared/ui/` + tema Material 3)

| Componente                                                                   | Uso                                                                                    |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `app-page-header`                                                            | Miga + título + subtítulo + acciones en cada vista                                     |
| `app-metric-card`                                                            | `[icono] [valor] [etiqueta] [acento]` (`azul`/`verde`)                                 |
| `app-status-chip`                                                            | `[estado]="publicado\|borrador\|activo\|…"` o `[texto] [tono]` — siempre texto + color |
| `app-empty-state`                                                            | `[icono] [titulo] [mensaje]` + botón de acción proyectado                              |
| `ConfirmDialogComponent` + `UiService`                                       | `ui.confirmar()`, `ui.exito()`, `ui.error()`, `ui.info()` — nunca `alert`/`confirm`    |
| `.skeleton` / `.alerta-advertencia` / `.barra-filtros` / `.tabla-responsive` | Carga, avisos amables, filtros fijos, tablas con scroll                                |

```html
<app-page-header
  titulo="Temas de interés"
  subtitulo="…"
  [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Temas' }]"
>
  <button mat-raised-button color="primary">Acción</button>
</app-page-header>
<app-metric-card
  icono="how_to_reg"
  valor="128"
  etiqueta="Total de respuestas"
  acento="azul"
/>
<app-status-chip estado="publicado" />
<button class="btn-acento">Exportar CSV</button>
```

## 5. Gráficos (`src/app/core/charts.config.ts`)

Barras principales azul · 2ª serie verde · extras Azul 900, Verde 900,
Azul 100 (borde azul), gris · calor secuencial blanco→azul→azul 900 con valor
numérico en cada celda · líneas con puntos · rejilla clara · tooltips
Azul 900/blanco · DvR: azul = declarado, verde = real (con leyenda y etiquetas,
nunca solo color). Llamar `aplicarTemaGraficos()` una vez al arrancar.

## 6. Patrones de pantalla y responsive

- **Header** blanco + `.franja-marca` 4 px (único degradado permitido) +
  `assets/logo.jpg` (escudo real; `height` fija, `width: auto`).
- **Login**: tarjeta centrada sobre formas suaves Azul 50/Verde 50, logo,
  primario azul, SSO en contorno.
- **Encuesta**: stepper vertical (semestre → temas → revisar);
  tarjetas seleccionables (borde azul + fondo Azul 100 + check verde + texto
  “Listo”); contador “N de 5” + progreso verde; escala 1–5 con botones 48 px.
- **Admin**: sidenav Azul 900 (activo claro + indicador verde); en móvil,
  cajón + hamburguesa. Estudiante móvil: nav inferior con iconos.
- **Breakpoints**: ≤600 px (teléfono 360), ≤900 px (sidenav→cajón),
  ≤1000–1160 px (grillas a 1 columna). Táctil ≥ 44 px en `(pointer: coarse)`;
  tablas y calor con scroll horizontal; imágenes fluidas (`max-width: 100 %`).
- **Estados**: skeletons al cargar, vacío ilustrado, error con reintento,
  éxito con snackbar verde. Footer Azul 900 con nombre, Proyección Social y año.
