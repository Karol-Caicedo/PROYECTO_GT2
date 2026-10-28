import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { MetricCardComponent } from '../../shared/ui/metric-card.component';
import {
  GRAFICOS, colorMapaCalor,
  opcionesBarrasHorizontales, opcionesBarrasVerticales, opcionesLinea,
} from '../../core/charts.config';

export interface GrupoDesglose {
  grupoId: string;
  profesor: string;
  codigoGrupo: string;
  horario: string;
  activo: boolean;
  reportesDificultad: number;
  totalEstudiantesEvaluaron: number;
  promedioSatisfaccion: number;
  porcentajeDeDificultad: number;
}

export interface DesgloseAsignatura {
  periodo: { id: string; nombre: string };
  asignatura: { id: string; nombre: string; codigo: string | null; semestre: number };
  totalDificultad: number;
  totalEvaluaciones: number;
  promedioSatisfaccion: number;
  grupos: GrupoDesglose[];
}

type TipoDashboard = 'temas' | 'materias';
type GraficoTemas = 'top' | 'tasa' | 'calor' | 'comparativo';
type GraficoMaterias = 'top' | 'desglose' | 'tasa' | 'calor' | 'comparativo';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    BaseChartDirective,
    PageHeaderComponent,
    MetricCardComponent,
  ],
  styles: [`

    .tabs-tipo-dashboard {
      display: flex; gap: var(--esp-2); margin-bottom: var(--esp-4);
      background: var(--azul-50); padding: 4px; border-radius: var(--radio-m);
      width: fit-content; border: 1px solid var(--borde);
    }
    .btn-tab-dashboard {
      display: inline-flex; align-items: center; gap: var(--esp-2);
      padding: var(--esp-2) var(--esp-4); border-radius: var(--radio-s);
      border: none; background: transparent; color: var(--texto-secundario);
      font-weight: 600; font-size: var(--t-cuerpo); cursor: pointer;
      transition: all var(--transicion-rapida); min-height: 40px;
    }
    .btn-tab-dashboard.activo {
      background: var(--superficie); color: var(--azul-900);
      box-shadow: var(--sombra-1); font-weight: 700;
    }
    .barra-filtros { margin-bottom: var(--esp-6); display: flex; gap: var(--esp-3); flex-wrap: wrap; }
    .metricas { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--esp-4); margin-bottom: var(--esp-5); }
    .grafico { height: 320px; position: relative; }
    .grafico.alto { height: 380px; }
    .titulo-grafico { font-size: var(--t-titulo-sm); color: var(--azul-900); margin: 0; display: flex; gap: var(--esp-2); align-items: center; }
    .titulo-grafico .material-symbols-outlined { color: var(--azul-500); }
    .desc-grafico { font-size: var(--t-secundario); color: var(--texto-secundario); margin: var(--esp-1) 0 var(--esp-4); }
    .tabla-calor { border-collapse: separate; border-spacing: 3px; }
    .tabla-calor th { font-size: 12px; color: var(--texto-secundario); padding: var(--esp-1); }
    .tabla-calor td:first-child { font-size: var(--t-secundario); font-weight: 600; color: var(--azul-900); max-width: 220px; }
    .celda-calor { min-width: 44px; min-height: 40px; display: grid; place-items: center; border-radius: var(--radio-s); font-weight: 700; font-size: var(--t-secundario); border: 1px solid var(--borde); }
    .leyenda-calor { display: flex; align-items: center; gap: var(--esp-2); font-size: 12px; color: var(--texto-secundario); margin-top: var(--esp-3); }
    .leyenda-calor .barra { width: 120px; height: 10px; border-radius: 999px; background: linear-gradient(90deg, var(--superficie), var(--azul-500), var(--azul-900)); border: 1px solid var(--borde); }
    .resumen-recordatorios { display: flex; gap: var(--esp-4); flex-wrap: wrap; margin-top: var(--esp-2); }
    .resumen-recordatorios > div { background: var(--azul-50); padding: var(--esp-3); border-radius: var(--radio-s); min-width: 140px; }
    .resumen-recordatorios .valor { display: block; font-size: 20px; font-weight: 700; color: var(--azul-900); }
    .resumen-recordatorios .etiqueta { font-size: 12px; color: var(--texto-secundario); }
    .grafico-entrada { animation: grafico-entrada 180ms ease-out; }
    @keyframes grafico-entrada { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

    /* Estilos drill-down y desglose por docente y grupo */
    .chip-info-docente {
      display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
      color: #92400e; background: #fef3c7; border: 1px solid #fde68a; padding: 4px 10px; border-radius: var(--radio-s);
    }
    .seccion-drilldown-top {
      margin-top: var(--esp-4); padding-top: var(--esp-3); border-top: 1px dashed var(--borde);
    }
    .titulo-drilldown {
      font-size: 13px; font-weight: 700; color: var(--azul-900); display: block; margin-bottom: var(--esp-2);
    }
    .pills-top-materias { display: flex; gap: var(--esp-2); flex-wrap: wrap; }
    .pill-materia {
      display: inline-flex; align-items: center; gap: var(--esp-2);
      padding: var(--esp-2) var(--esp-3); border-radius: var(--radio-s);
      border: 1px solid var(--borde); background: var(--superficie);
      color: var(--texto-primario); cursor: pointer; transition: all var(--transicion-rapida);
      font-size: 13px; font-weight: 600;
    }
    .pill-materia:hover {
      border-color: var(--azul-500); background: var(--azul-50); color: var(--azul-900);
    }
    .pill-materia.activa {
      border-color: var(--azul-700); background: var(--azul-100); color: var(--azul-900); font-weight: 700;
    }
    .pill-badge {
      background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700;
      padding: 2px 6px; border-radius: 999px;
    }
    .icono-flecha { font-size: 16px; color: var(--azul-600); }

    .header-desglose-seccion {
      display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--esp-2);
    }
    .selector-asignatura-desglose { margin-bottom: var(--esp-4); }
    .form-field-asig { min-width: 300px; width: 100%; max-width: 480px; }
    .resumen-asig-desglose {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--esp-3); margin-bottom: var(--esp-4);
    }
    .tarjeta-resumen-asig {
      background: var(--azul-50); border: 1px solid var(--borde); border-radius: var(--radio-s);
      padding: var(--esp-3); display: flex; flex-direction: column; gap: 2px;
    }
    .tarjeta-resumen-asig.alerta-borde { border-left: 4px solid #f59e0b; }
    .etiqueta-resumen { font-size: 12px; color: var(--texto-secundario); font-weight: 600; }
    .valor-resumen { font-size: 18px; font-weight: 800; color: var(--azul-900); }
    .color-alerta { color: #b45309; }

    .subtitulo-desglose {
      font-size: 15px; font-weight: 700; color: var(--azul-900); margin: var(--esp-3) 0 var(--esp-2);
    }
    .grafico-grupos-bloque { margin-bottom: var(--esp-4); }

    .grid-grupos-docentes {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--esp-3);
    }
    .card-grupo-detalle {
      border: 1px solid var(--borde); border-radius: var(--radio-m); background: var(--superficie);
      padding: var(--esp-3) var(--esp-4); box-shadow: var(--sombra-1); display: flex; flex-direction: column; gap: var(--esp-3);
      transition: all var(--transicion-rapida);
    }
    .card-grupo-detalle:hover { border-color: var(--azul-300); }
    .card-grupo-detalle.prioritario { border-top: 3px solid #f59e0b; }
    .card-grupo-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--esp-2); }
    .tag-grupo {
      display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase;
      background: var(--azul-100); color: var(--azul-900); padding: 2px 8px; border-radius: var(--radio-s);
      margin-bottom: 4px;
    }
    .nombre-profesor { margin: 0; font-size: 15px; font-weight: 700; color: var(--azul-900); }
    .badge-dificultad {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: #f8fafc; border: 1px solid var(--borde); border-radius: var(--radio-s); padding: 4px 8px; min-width: 60px;
    }
    .badge-dificultad.con-dificultad { background: #fef3c7; border-color: #fde68a; }
    .badge-dificultad .num-dif { font-size: 18px; font-weight: 800; color: #b45309; line-height: 1; }
    .badge-dificultad .txt-dif { font-size: 10px; font-weight: 700; color: #92400e; }

    .card-grupo-body { display: flex; flex-direction: column; gap: var(--esp-2); }
    .info-fila { display: flex; align-items: flex-start; gap: var(--esp-2); font-size: 13px; }
    .icono-info { font-size: 18px; color: var(--azul-600); margin-top: 1px; flex-shrink: 0; }
    .label-fila { color: var(--texto-secundario); display: block; font-size: 11px; }
    .valor-horario { color: var(--azul-900); font-weight: 700; font-size: 13px; }

    .empty-grupos {
      text-align: center; padding: var(--esp-6); background: var(--superficie);
      border: 1px dashed var(--borde); border-radius: var(--radio-m);
    }
    .empty-grupos .icono-vacio { font-size: 48px; color: var(--texto-secundario); margin-bottom: var(--esp-2); }

    @media (max-width: 600px) {
      .grafico { height: 280px; }
      .grafico.alto { height: 320px; }
      .barra-filtros mat-form-field { flex: 1 1 100%; }
      .tabla-calor td:first-child { max-width: 140px; }
    }
  `],

  template: `
    <div class="pagina">
      <app-page-header
        titulo="Dashboard institucional"
        subtitulo="Monitoreo de intereses tecnológicos y evaluación de asignaturas del programa"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Dashboard' }]"
      />

      <!-- Selector de Tipo de Dashboard: Temas vs Materias -->
      <div class="tabs-tipo-dashboard" role="tablist">
        <button
          type="button"
          class="btn-tab-dashboard"
          [class.activo]="tipoDashboard() === 'temas'"
          (click)="setTipoDashboard('temas')"
        >
          <span class="material-symbols-outlined">interests</span>
          Temas de Capacitación
        </button>

        <button
          type="button"
          class="btn-tab-dashboard"
          [class.activo]="tipoDashboard() === 'materias'"
          (click)="setTipoDashboard('materias')"
        >
          <span class="material-symbols-outlined">menu_book</span>
          Asignaturas / Materias
        </button>
      </div>

      <!-- Filtros generales -->
      <div class="barra-filtros" role="group" aria-label="Filtros del dashboard">
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>Periodo</mat-label>
          <mat-select [value]="periodoId()" (selectionChange)="periodoId.set($event.value); recargar()">
            @for (p of periodos(); track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }} {{ p.activo ? '(activo)' : '' }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field subscriptSizing="dynamic">
          <mat-label>Semestre</mat-label>
          <mat-select [value]="semestre()" (selectionChange)="semestre.set($event.value); recargar()">
            <mat-option [value]="''">Todos los semestres</mat-option>
            @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
              <mat-option [value]="s">Semestre {{ s }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (tipoDashboard() === 'temas') {
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Gráfico</mat-label>
            <mat-select [value]="graficoTemas()" (selectionChange)="graficoTemas.set($event.value)">
              @for (g of opcionesGraficoTemas; track g.id) {
                <mat-option [value]="g.id">{{ g.texto }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        } @else {
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Gráfico de asignaturas</mat-label>
            <mat-select [value]="graficoMaterias()" (selectionChange)="graficoMaterias.set($event.value)">
              @for (g of opcionesGraficoMaterias; track g.id) {
                <mat-option [value]="g.id">{{ g.texto }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
      </div>

      <!-- Estado cargando / fallo -->
      @if (cargando()) {
        <div class="metricas" role="status" aria-label="Cargando métricas">
          <div class="skeleton" style="height:110px"></div>
          <div class="skeleton" style="height:110px"></div>
          <div class="skeleton" style="height:110px"></div>
          <div class="skeleton" style="height:110px"></div>
        </div>
        <div class="skeleton" style="height:340px"></div>
      } @else if (fallo()) {
        <mat-card>
          <mat-card-content class="estado-vacio" role="alert">
            <span class="material-symbols-outlined icono-grande" aria-hidden="true">cloud_off</span>
            <h3>No se pudieron cargar los datos</h3>
            <p>Revisa tu conexión o vuelve a intentarlo.</p>
            <button mat-raised-button color="primary" (click)="recargar()">Reintentar</button>
          </mat-card-content>
        </mat-card>
      } @else {

        <!-- ========================================== -->
        <!-- DASHBOARD 1: TEMAS DE CAPACITACIÓN        -->
        <!-- ========================================== -->
        @if (tipoDashboard() === 'temas') {
          <div class="metricas">
            <app-metric-card icono="how_to_reg" [valor]="resumen()?.totalRespuestas ?? '0'" etiqueta="Total de respuestas" acento="azul" />
            <app-metric-card icono="group" [valor]="resumen()?.totalEstudiantes ?? '0'" etiqueta="Estudiantes registrados" acento="azul" />
            <app-metric-card icono="percent" [valor]="(tasaGlobal() * 100).toFixed(1) + ' %'" etiqueta="Tasa de respuesta global" acento="verde" />
            <app-metric-card icono="emoji_events" [valor]="resumen()?.top1?.nombre || '–'" [etiqueta]="'Tema n.º 1' + (resumen()?.top1 ? ' · ' + resumen()?.top1?.valor + (modo() === 'calificacion' ? ' prom.' : ' votos') : '')" acento="azul" />
          </div>

          @switch (graficoTemas()) {
            @case ('top') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">leaderboard</span>Top 5 de temas ({{ modo() === 'calificacion' ? 'promedio' : 'votos' }})</h2>
                <p class="desc-grafico">Los temas con más interés declarado en el periodo y filtro elegidos.</p>
                @if (top().length) {
                  <div class="grafico alto"><canvas baseChart [data]="topData()" [options]="hbar" [type]="'bar'"></canvas></div>
                } @else {
                  <p class="texto-secundario">Aún no hay respuestas de estudiantes registradas para este periodo/filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('tasa') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">group</span>Tasa de respuesta por semestre</h2>
                <p class="desc-grafico">Estudiantes que respondieron frente al total registrado en cada semestre.</p>
                @if (tasa().length) {
                  <div class="grafico alto"><canvas baseChart [data]="tasaData()" [options]="vbar" [type]="'bar'"></canvas></div>
                } @else {
                  <p class="texto-secundario">Aún no hay datos para este filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('calor') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">grid_on</span>Mapa de calor temas × semestres</h2>
                <p class="desc-grafico">Intensidad del interés por tema en cada semestre.</p>
                @if (heatFilas().length) {
                  <div style="overflow:auto"><table class="tabla-calor">
                    <tr><th scope="col">Tema</th>@for (s of [1,2,3,4,5,6,7,8,9]; track s) { <th scope="col">S{{s}}</th> }</tr>
                    @for (tema of heatFilas(); track tema) {
                      <tr><td>{{ tema }}</td>
                        @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                          <td><div class="celda-calor" [style.background]="celda(tema, s).fondo" [style.color]="celda(tema, s).texto">{{ heat()[tema]?.[s] ?? 0 }}</div></td>
                        }</tr>
                    }
                  </table></div>
                  <div class="leyenda-calor" aria-hidden="true"><span>Menor</span><span class="barra"></span><span>Mayor</span></div>
                } @else { <p class="texto-secundario">Aún no hay respuestas para este filtro.</p> }
              </mat-card-content></mat-card>
            }


            @case ('comparativo') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">show_chart</span>Comparativo entre periodos</h2>
                <p class="desc-grafico">Evolución del tema seleccionado a lo largo de los periodos.</p>
                <mat-form-field subscriptSizing="dynamic"><mat-label>Tema</mat-label><mat-select [value]="temaComp()" (selectionChange)="temaComp.set($event.value); cargarComp()">
                  @for (t of todosTemas(); track t.id) { <mat-option [value]="t.id">{{ t.nombre }}</mat-option> }
                </mat-select></mat-form-field>
                @if (comp().length) {
                  <div class="grafico mt"><canvas baseChart [data]="compData()" [options]="line" [type]="'line'"></canvas></div>
                } @else {
                  <p class="texto-secundario">No hay datos de este tema en los periodos registrados.</p>
                }
              </mat-card-content></mat-card>
            }
          }
        }

        <!-- ========================================== -->
        <!-- DASHBOARD 2: ASIGNATURAS / MATERIAS        -->
        <!-- ========================================== -->
        @if (tipoDashboard() === 'materias') {
          <div class="metricas">
            <app-metric-card icono="menu_book" [valor]="resumenMaterias()?.totalRespuestas ?? '0'" etiqueta="Respuestas de materias" acento="azul" />
            <app-metric-card icono="group" [valor]="resumenMaterias()?.totalEstudiantes ?? '0'" etiqueta="Estudiantes registrados" acento="azul" />
            <app-metric-card icono="percent" [valor]="((resumenMaterias()?.tasaGlobal || 0) * 100).toFixed(1) + ' %'" etiqueta="Tasa de respuesta global" acento="verde" />
            <app-metric-card
              icono="warning"
              [valor]="resumenMaterias()?.top1?.nombre || 'Ninguna'"
              [etiqueta]="'Mayor dificultad' + (resumenMaterias()?.top1 ? ' · ' + resumenMaterias()?.top1?.valor + ' reportes' : '')"
              acento="azul"
            />
          </div>

          @switch (graficoMaterias()) {
            @case ('top') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--esp-2)">
                  <div>
                    <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">warning</span>Top 5 de asignaturas con dificultad reportada</h2>
                    <p class="desc-grafico">Materias donde los estudiantes han solicitado mayor apoyo y refuerzo académico.</p>
                  </div>
                  @if (topMaterias().length) {
                    <span class="chip-info-docente">
                      <span class="material-symbols-outlined" style="font-size:16px">info</span>
                      Haz clic en una materia para ver qué profesor y horario la dictan
                    </span>
                  }
                </div>

                @if (topMaterias().length) {
                  <div class="grafico alto"><canvas baseChart [data]="topMateriasData()" [options]="hbar" [type]="'bar'"></canvas></div>

                  <!-- Accesos directos para desglose de cada asignatura del Top -->
                  <div class="seccion-drilldown-top">
                    <span class="titulo-drilldown">Profundizar por docente y horarios:</span>
                    <div class="pills-top-materias">
                      @for (t of topMaterias(); track t.asignaturaId) {
                        <button
                          type="button"
                          class="pill-materia"
                          [class.activa]="asigDesgloseSeleccionada() === t.asignaturaId"
                          (click)="seleccionarMateriaParaDesglose(t.asignaturaId)"
                          title="Inspeccionar qué docentes y horarios imparten esta materia"
                        >
                          <span class="pill-nombre">{{ t.nombre }}</span>
                          <span class="pill-badge">{{ t.valor }} reportes</span>
                          <span class="material-symbols-outlined icono-flecha">arrow_forward</span>
                        </button>
                      }
                    </div>
                  </div>
                } @else {
                  <p class="texto-secundario">Aún no hay reportes de dificultad registrados en las asignaturas para este filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('desglose') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <div class="header-desglose-seccion">
                  <div>
                    <h2 class="titulo-grafico">
                      <span class="material-symbols-outlined" aria-hidden="true">person_search</span>
                      Desglose de dificultad por Profesor, Grupo y Horario
                    </h2>
                  </div>
                </div>

                <div class="selector-asignatura-desglose">
                  <mat-form-field subscriptSizing="dynamic" class="form-field-asig">
                    <mat-label>Seleccionar asignatura a inspeccionar</mat-label>
                    <mat-select [value]="asigDesgloseSeleccionada()" (selectionChange)="cargarDesglose($event.value)">
                      @for (a of todasAsignaturas(); track a.id) {
                        <mat-option [value]="a.id">{{ a.nombre }} (Semestre {{ a.semestre }})</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                @if (cargandoDesglose()) {
                  <div style="padding:var(--esp-6); text-align:center">
                    <p class="texto-secundario">Consultando grupos, profesores y horarios de la asignatura...</p>
                  </div>
                } @else if (desgloseMateria()) {
                  <!-- Resumen de la asignatura seleccionada -->
                  <div class="resumen-asig-desglose">
                    <div class="tarjeta-resumen-asig">
                      <span class="etiqueta-resumen">Materia</span>
                      <span class="valor-resumen">{{ desgloseMateria()?.asignatura?.nombre }}</span>
                      <small class="texto-secundario">Semestre {{ desgloseMateria()?.asignatura?.semestre }}</small>
                    </div>

                    <div class="tarjeta-resumen-asig alerta-borde">
                      <span class="etiqueta-resumen">Total dificultades reportadas</span>
                      <span class="valor-resumen color-alerta">{{ desgloseMateria()?.totalDificultad }}</span>
                      <small class="texto-secundario">de {{ desgloseMateria()?.totalEvaluaciones }} evaluaciones recibidas</small>
                    </div>

                    <div class="tarjeta-resumen-asig">
                      <span class="etiqueta-resumen">Índice de dificultad</span>
                      <span class="valor-resumen">
                        {{ desgloseMateria()?.totalEvaluaciones ? (((desgloseMateria()!.totalDificultad / desgloseMateria()!.totalEvaluaciones) * 100).toFixed(0) + '%') : '0%' }}
                      </span>
                      <small class="texto-secundario">de alumnos evaluados</small>
                    </div>

                    <div class="tarjeta-resumen-asig">
                      <span class="etiqueta-resumen">Grupos / Docentes</span>
                      <span class="valor-resumen">{{ desgloseMateria()?.grupos?.length || 0 }}</span>
                      <small class="texto-secundario">en oferta académica</small>
                    </div>
                  </div>

                  <!-- Gráfico comparativo entre grupos / profesores si hay grupos -->
                  @if (desgloseMateria()!.grupos.length > 0) {
                    <div class="grafico-grupos-bloque">
                      <h3 class="subtitulo-desglose">Comparativo de reportes de dificultad por docente y grupo</h3>
                      <div class="grafico"><canvas baseChart [data]="desgloseGruposChartData()" [options]="hbar" [type]="'bar'"></canvas></div>
                    </div>

                    <!-- Tarjetas detalladas operativas para planificar la capacitación -->
                    <h3 class="subtitulo-desglose" style="margin-top:var(--esp-4)">Detalle operativo por grupo para planeación de capacitaciones</h3>
                    <div class="grid-grupos-docentes">
                      @for (g of desgloseMateria()!.grupos; track g.grupoId) {
                        <div class="card-grupo-detalle" [class.prioritario]="g.reportesDificultad > 0">
                          <div class="card-grupo-header">
                            <div>
                              <span class="tag-grupo">{{ g.codigoGrupo }}</span>
                              <h4 class="nombre-profesor">{{ g.profesor }}</h4>
                            </div>
                            <div class="badge-dificultad" [class.con-dificultad]="g.reportesDificultad > 0">
                              <span class="num-dif">{{ g.reportesDificultad }}</span>
                              <span class="txt-dif">dificultades</span>
                            </div>
                          </div>

                          <div class="card-grupo-body">
                            <div class="info-fila">
                              <span class="material-symbols-outlined icono-info">schedule</span>
                              <div>
                                <span class="label-fila">Horario de clase:</span>
                                <strong class="valor-horario">{{ g.horario }}</strong>
                              </div>
                            </div>

                            <div class="info-fila">
                              <span class="material-symbols-outlined icono-info">pie_chart</span>
                              <div>
                                <span class="label-fila">Concentración en la materia:</span>
                                <strong>{{ g.porcentajeDeDificultad }}% del total</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-grupos">
                      <span class="material-symbols-outlined icono-vacio">assignment_late</span>
                      <p>Esta asignatura no tiene grupos con profesores ni horarios configurados aún.</p>
                      <a mat-flat-button color="primary" routerLink="/admin/asignaturas">
                        Configurar profesores y grupos en Asignaturas
                      </a>
                    </div>
                  }
                } @else {
                  <p class="texto-secundario">Selecciona una asignatura para inspeccionar el reporte por profesor y grupo.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('tasa') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">group</span>Tasa de respuesta en encuesta de materias</h2>
                <p class="desc-grafico">Estudiantes que completaron la encuesta de materias frente al total de su semestre.</p>
                @if (tasaMaterias().length) {
                  <div class="grafico alto"><canvas baseChart [data]="tasaMateriasData()" [options]="vbar" [type]="'bar'"></canvas></div>
                } @else {
                  <p class="texto-secundario">Aún no hay respuestas para este filtro.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('calor') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">grid_on</span>Mapa de calor de dificultades: Asignatura × Semestre</h2>
                <p class="desc-grafico">Concentración de dificultades académicas por materia a través de los semestres.</p>
                @if (heatFilasMaterias().length) {
                  <div style="overflow:auto"><table class="tabla-calor">
                    <tr><th scope="col">Asignatura</th>@for (s of [1,2,3,4,5,6,7,8,9]; track s) { <th scope="col">S{{s}}</th> }</tr>
                    @for (asig of heatFilasMaterias(); track asig) {
                      <tr><td>{{ asig }}</td>
                        @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                          <td><div class="celda-calor" [style.background]="celdaMaterias(asig, s).fondo" [style.color]="celdaMaterias(asig, s).texto">{{ heatMaterias()[asig]?.[s] ?? 0 }}</div></td>
                        }</tr>
                    }
                  </table></div>
                  <div class="leyenda-calor" aria-hidden="true"><span>Menos dificultad</span><span class="barra"></span><span>Mayor dificultad</span></div>
                } @else {
                  <p class="texto-secundario">Aún no hay datos de dificultad registrados para la matriz.</p>
                }
              </mat-card-content></mat-card>
            }

            @case ('comparativo') {
              <mat-card class="mt grafico-entrada"><mat-card-content>
                <h2 class="titulo-grafico"><span class="material-symbols-outlined" aria-hidden="true">show_chart</span>Comparativo de asignatura entre periodos</h2>
                <p class="desc-grafico">Evolución de reportes de dificultad y satisfacción de una asignatura a lo largo del tiempo.</p>
                <mat-form-field subscriptSizing="dynamic">
                  <mat-label>Seleccionar asignatura</mat-label>
                  <mat-select [value]="asigComp()" (selectionChange)="asigComp.set($event.value); cargarCompMaterias()">
                    @for (a of todasAsignaturas(); track a.id) {
                      <mat-option [value]="a.id">{{ a.nombre }} (Semestre {{ a.semestre }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                @if (compMaterias().length) {
                  <div class="grafico mt"><canvas baseChart [data]="compMateriasData()" [options]="line" [type]="'line'"></canvas></div>
                } @else {
                  <p class="texto-secundario">No hay registros históricos de esta asignatura en los periodos evaluados.</p>
                }
              </mat-card-content></mat-card>
            }
          }
        }

      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  tipoDashboard = signal<TipoDashboard>('temas');
  periodos = signal<{ id: string; nombre: string; activo: boolean }[]>([]);
  periodoId = signal('');
  semestre = signal<string | number>('');

  cargando = signal(true);
  fallo = signal(false);

  // TEMAS
  modo = signal('');
  todosTemas = signal<{ id: string; nombre: string }[]>([]);
  temaComp = signal('');
  resumen = signal<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null } | null>(null);
  top = signal<{ nombre: string; valor: number }[]>([]);
  tasa = signal<{ semestre: number; respondieron: number; total: number; tasa: number }[]>([]);
  heat = signal<Record<string, Record<number, number>>>({});
  comp = signal<{ periodo: string; valor: number }[]>([]);
  graficoTemas = signal<GraficoTemas>('top');
  opcionesGraficoTemas: { id: GraficoTemas; texto: string }[] = [
    { id: 'top', texto: 'Top 5 de temas' },
    { id: 'tasa', texto: 'Tasa de respuesta por semestre' },
    { id: 'calor', texto: 'Mapa de calor temas × semestres' },
    { id: 'comparativo', texto: 'Comparativo entre periodos' },
  ];

  // MATERIAS / ASIGNATURAS
  todasAsignaturas = signal<{ id: string; nombre: string; semestre: number }[]>([]);
  asigComp = signal('');
  resumenMaterias = signal<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null } | null>(null);
  topMaterias = signal<{ asignaturaId: string; nombre: string; semestre: number; valor: number; promedioSatisfaccion: number }[]>([]);
  satisfaccionMaterias = signal<{ asignaturaId: string; nombre: string; semestre: number; promedio: number }[]>([]);
  tasaMaterias = signal<{ semestre: number; respondieron: number; total: number; tasa: number }[]>([]);
  heatMaterias = signal<Record<string, Record<number, number>>>({});
  compMaterias = signal<{ periodo: string; promedio: number; dificultadCount: number }[]>([]);
  graficoMaterias = signal<GraficoMaterias>('top');
  opcionesGraficoMaterias: { id: GraficoMaterias; texto: string }[] = [
    { id: 'top', texto: 'Top 5 dificultad reportada' },
    { id: 'desglose', texto: 'Desglose por Docente, Grupo y Horario' },
    { id: 'tasa', texto: 'Tasa de respuesta por semestre' },
    { id: 'calor', texto: 'Mapa de calor Asignatura × Semestre' },
    { id: 'comparativo', texto: 'Comparativo entre periodos' },
  ];

  // Desglose de grupos y horarios
  desgloseMateria = signal<DesgloseAsignatura | null>(null);
  asigDesgloseSeleccionada = signal<string>('');
  cargandoDesglose = signal<boolean>(false);


  // Opciones Chart.js
  hbar: ChartConfiguration['options'] = opcionesBarrasHorizontales();
  vbar: ChartConfiguration['options'] = opcionesBarrasVerticales();
  line: ChartConfiguration['options'] = opcionesLinea();

  // Data bindings Temas
  topData = () => ({
    labels: this.top().map((t) => t.nombre),
    datasets: [{ label: this.modo() === 'calificacion' ? 'Promedio' : 'Votos', data: this.top().map((t) => t.valor), backgroundColor: GRAFICOS.azul, borderRadius: 6 }],
  });
  tasaData = () => ({
    labels: this.tasa().map((t) => `S${t.semestre}`),
    datasets: [
      { label: 'Registrados', data: this.tasa().map((t) => t.total), backgroundColor: GRAFICOS.azulClaro, borderColor: GRAFICOS.azul, borderWidth: 1, borderRadius: 6 },
      { label: 'Respondieron', data: this.tasa().map((t) => t.respondieron), backgroundColor: GRAFICOS.azul, borderRadius: 6 },
    ],
  });

  compData = () => ({
    labels: this.comp().map((c) => c.periodo),
    datasets: [{ label: 'Evolución del tema', data: this.comp().map((c) => c.valor), borderColor: GRAFICOS.azul, backgroundColor: GRAFICOS.azul, fill: false }],
  });
  heatFilas = () => Object.keys(this.heat());
  tasaGlobal = () => this.resumen()?.tasaGlobal ?? 0;

  // Data bindings Materias
  topMateriasData = () => ({
    labels: this.topMaterias().map((t) => t.nombre),
    datasets: [{ label: 'Reportes de dificultad', data: this.topMaterias().map((t) => t.valor), backgroundColor: '#f59e0b', borderRadius: 6 }],
  });
  satisfaccionMateriasData = () => ({
    labels: this.satisfaccionMaterias().map((s) => s.nombre),
    datasets: [{ label: 'Promedio de satisfacción (1 a 5)', data: this.satisfaccionMaterias().map((s) => s.promedio), backgroundColor: GRAFICOS.azul, borderRadius: 6 }],
  });
  tasaMateriasData = () => ({
    labels: this.tasaMaterias().map((t) => `S${t.semestre}`),
    datasets: [
      { label: 'Registrados', data: this.tasaMaterias().map((t) => t.total), backgroundColor: GRAFICOS.azulClaro, borderColor: GRAFICOS.azul, borderWidth: 1, borderRadius: 6 },
      { label: 'Respondieron', data: this.tasaMaterias().map((t) => t.respondieron), backgroundColor: GRAFICOS.azul, borderRadius: 6 },
    ],
  });
  compMateriasData = () => ({
    labels: this.compMaterias().map((c) => c.periodo),
    datasets: [
      { label: 'Reportes de dificultad', data: this.compMaterias().map((c) => c.dificultadCount), borderColor: '#f59e0b', backgroundColor: '#f59e0b', fill: false },
      { label: 'Satisfacción promedio', data: this.compMaterias().map((c) => c.promedio), borderColor: GRAFICOS.azul, backgroundColor: GRAFICOS.azul, fill: false },
    ],
  });

  desgloseGruposChartData = () => {
    const d = this.desgloseMateria();
    if (!d || !d.grupos.length) return { labels: [], datasets: [] };
    return {
      labels: d.grupos.map((g) => `${g.codigoGrupo} (${g.profesor})`),
      datasets: [
        {
          label: 'Reportes de dificultad',
          data: d.grupos.map((g) => g.reportesDificultad),
          backgroundColor: '#f59e0b',
          borderRadius: 6,
        },
      ],
    };
  };

  heatFilasMaterias = () => Object.keys(this.heatMaterias());

  maxCalor(): number {
    return Math.max(1, ...Object.values(this.heat()).flatMap((r) => Object.values(r)));
  }
  celda(tema: string, s: number) {
    return colorMapaCalor(this.heat()[tema]?.[s], this.maxCalor());
  }

  maxCalorMaterias(): number {
    return Math.max(1, ...Object.values(this.heatMaterias()).flatMap((r) => Object.values(r)));
  }
  celdaMaterias(asig: string, s: number) {
    return colorMapaCalor(this.heatMaterias()[asig]?.[s], this.maxCalorMaterias());
  }

  async ngOnInit() {
    const ps = await this.http.get<{ id: string; nombre: string; activo: boolean }[]>(`${this.api}/periodos`).toPromise().catch(() => []);
    this.periodos.set(ps || []);
    const activo = (ps || []).find((p) => p.activo);
    if (activo) this.periodoId.set(activo.id);

    const temas = await this.http.get<{ id: string; nombre: string }[]>(`${this.api}/temas/admin/todos`).toPromise().catch(() => []);
    this.todosTemas.set(temas || []);
    if (temas?.length) this.temaComp.set(temas[0].id);

    const asigs = await this.http.get<{ id: string; nombre: string; semestre: number }[]>(`${this.api}/asignaturas/admin/todas`).toPromise().catch(() => []);
    this.todasAsignaturas.set(asigs || []);
    if (asigs?.length) {
      this.asigComp.set(asigs[0].id);
      this.asigDesgloseSeleccionada.set(asigs[0].id);
    }

    await this.recargar();
  }

  setTipoDashboard(tipo: TipoDashboard) {
    this.tipoDashboard.set(tipo);
    this.recargar();
  }

  async recargar() {
    if (this.tipoDashboard() === 'temas') {
      await this.cargarTemas();
      await this.cargarComp();
    } else {
      await this.cargarMaterias();
      await this.cargarCompMaterias();
      if (this.asigDesgloseSeleccionada()) {
        await this.cargarDesglose();
      }
    }
  }

  qs() {
    const p = this.periodoId() ? `periodoId=${this.periodoId()}` : '';
    const s = this.semestre() ? `&semestre=${this.semestre()}` : '';
    return `?${p}${s}`;
  }

  async cargarTemas() {
    this.cargando.set(true);
    this.fallo.set(false);
    try {
      const q = this.qs();
      const [top, tasa, heat, resumen] = await Promise.all([
        this.http.get<{ modo: string; items: { nombre: string; valor: number }[] }>(`${this.api}/dashboard/top-temas${q}`).toPromise().catch(() => null),
        this.http.get<{ porSemestre: { semestre: number; respondieron: number; total: number; tasa: number }[] }>(`${this.api}/dashboard/tasa-respuesta${q}`).toPromise().catch(() => null),
        this.http.get<{ matriz: Record<string, Record<number, number>> }>(`${this.api}/dashboard/heatmap${q}`).toPromise().catch(() => null),
        this.http.get<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null }>(`${this.api}/dashboard/resumen${q}`).toPromise().catch(() => null),
      ]);
      if (!top || !tasa || !heat || !resumen) { this.fallo.set(true); return; }
      this.top.set(top.items);
      this.modo.set(top.modo);
      this.tasa.set(tasa.porSemestre);
      this.heat.set(heat.matriz);
      this.resumen.set(resumen);
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarComp() {
    if (!this.temaComp()) return;
    const r = await this.http.get<{ periodo: string; valor: number }[]>(`${this.api}/dashboard/comparativo?temaId=${this.temaComp()}`).toPromise().catch(() => []);
    this.comp.set(r || []);
  }

  async cargarMaterias() {
    this.cargando.set(true);
    this.fallo.set(false);
    try {
      const q = this.qs();
      const [top, tasa, heat, satisfaccion, resumen] = await Promise.all([
        this.http.get<{ items: { asignaturaId: string; nombre: string; semestre: number; valor: number; promedioSatisfaccion: number }[] }>(`${this.api}/dashboard-materias/top-asignaturas${q}`).toPromise().catch(() => null),
        this.http.get<{ porSemestre: { semestre: number; respondieron: number; total: number; tasa: number }[] }>(`${this.api}/dashboard-materias/tasa-respuesta${q}`).toPromise().catch(() => null),
        this.http.get<{ matriz: Record<string, Record<number, number>> }>(`${this.api}/dashboard-materias/heatmap${q}`).toPromise().catch(() => null),
        this.http.get<{ items: { asignaturaId: string; nombre: string; semestre: number; promedio: number }[] }>(`${this.api}/dashboard-materias/satisfaccion${q}`).toPromise().catch(() => null),
        this.http.get<{ totalRespuestas: number; totalEstudiantes: number; tasaGlobal: number; top1: { nombre: string; valor: number } | null }>(`${this.api}/dashboard-materias/resumen${q}`).toPromise().catch(() => null),
      ]);

      if (!top || !tasa || !heat || !satisfaccion || !resumen) { this.fallo.set(true); return; }
      this.topMaterias.set(top.items || []);
      this.tasaMaterias.set(tasa.porSemestre || []);
      this.heatMaterias.set(heat.matriz || {});
      this.satisfaccionMaterias.set(satisfaccion.items || []);
      this.resumenMaterias.set(resumen);

      if (top.items?.length && !this.asigDesgloseSeleccionada()) {
        this.asigDesgloseSeleccionada.set(top.items[0].asignaturaId);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  async cargarCompMaterias() {
    if (!this.asigComp()) return;
    const r = await this.http.get<{ periodo: string; promedio: number; dificultadCount: number }[]>(`${this.api}/dashboard-materias/comparativo?asignaturaId=${this.asigComp()}`).toPromise().catch(() => []);
    this.compMaterias.set(r || []);
  }

  async seleccionarMateriaParaDesglose(asigId: string) {
    this.asigDesgloseSeleccionada.set(asigId);
    this.graficoMaterias.set('desglose');
    await this.cargarDesglose(asigId);
  }

  async cargarDesglose(asignaturaId?: string) {
    const aid = asignaturaId || this.asigDesgloseSeleccionada();
    if (!aid) return;
    this.asigDesgloseSeleccionada.set(aid);
    this.cargandoDesglose.set(true);
    try {
      const p = this.periodoId() ? `&periodoId=${this.periodoId()}` : '';
      const r = await this.http
        .get<DesgloseAsignatura>(`${this.api}/dashboard-materias/desglose-grupos?asignaturaId=${aid}${p}`)
        .toPromise()
        .catch(() => null);
      this.desgloseMateria.set(r ?? null);
    } finally {
      this.cargandoDesglose.set(false);
    }
  }
}


