import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

interface Tema { id: string; nombre: string; descripcion?: string }
interface Periodo { id: string; nombre: string; modoEncuesta: 'seleccion' | 'calificacion' }

const ICONOS_TEMAS = ['smart_toy', 'database', 'shield', 'cloud', 'settings', 'code', 'smartphone', 'memory', 'bar_chart', 'currency_bitcoin', 'view_in_ar', 'sports_esports', 'precision_manufacturing', 'palette', 'bug_report', 'automation', 'groups', 'rocket_launch', 'workspace_premium', 'translate'];

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatSnackBarModule, MatStepperModule, MatProgressBarModule, RouterLink, PageHeaderComponent, EmptyStateComponent, StatusChipComponent],
  styles: [`
    .info-periodo { display: flex; flex-wrap: wrap; gap: var(--esp-2); align-items: center; margin-bottom: var(--esp-4); }
    .progreso { margin: var(--esp-3) 0 var(--esp-1); }
    .contador { font-size: var(--t-secundario); color: var(--texto-secundario); font-weight: 600; }
    .contador.limite { color: var(--verde-700); }
    .grid-temas { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--esp-3); margin-top: var(--esp-3); }
    .tema-card {
      display: flex; gap: var(--esp-3); align-items: flex-start; text-align: left;
      background: var(--superficie); border: 2px solid var(--borde); border-radius: var(--radio-m);
      padding: var(--esp-4); cursor: pointer; font-family: var(--fuente);
      transition: border-color var(--transicion-rapida), background var(--transicion-rapida), box-shadow var(--transicion-rapida);
      min-height: 88px; width: 100%;
    }
    .tema-card:hover { border-color: var(--azul-500); box-shadow: var(--sombra-1); }
    .tema-card.seleccionada { border-color: var(--azul-500); background: var(--azul-100); }
    .tema-card .icono { display: grid; place-items: center; width: 44px; height: 44px; border-radius: var(--radio-m); background: var(--azul-50); color: var(--azul-700); flex-shrink: 0; }
    .tema-card.seleccionada .icono { background: var(--azul-500); color: var(--superficie); }
    .tema-card b { display: block; color: var(--azul-900); font-size: var(--t-cuerpo); }
    .tema-card small { display: block; color: var(--texto-secundario); font-size: var(--t-secundario); margin-top: var(--esp-1); }
    .tema-card .check { margin-left: auto; color: var(--verde-700); font-weight: 700; font-size: var(--t-secundario); display: flex; align-items: center; gap: var(--esp-1); flex-shrink: 0; }
    .escala { display: flex; gap: var(--esp-2); flex-wrap: wrap; margin-top: var(--esp-1); }
    .punto-escala {
      width: 48px; height: 48px; border-radius: 50%;
      border: 2px solid var(--borde); background: var(--superficie);
      font: 700 var(--t-cuerpo) var(--fuente); color: var(--texto);
      cursor: pointer; transition: all var(--transicion-rapida);
    }
    .punto-escala:hover { border-color: var(--azul-500); }
    .punto-escala.elegido { background: var(--azul-500); border-color: var(--azul-500); color: var(--superficie); }
    .fila-calif { padding: var(--esp-3) 0; border-bottom: 1px solid var(--borde); }
    .fila-calif b { color: var(--azul-900); }
    .nav-pasos { display: flex; justify-content: space-between; gap: var(--esp-2); margin-top: var(--esp-5); flex-wrap: wrap; }
    .resumen-item { display: flex; gap: var(--esp-2); align-items: center; padding: var(--esp-2) 0; border-bottom: 1px solid var(--borde); }
    .resumen-item .material-symbols-outlined { color: var(--verde-700); }
    .confirmacion { text-align: center; padding: var(--esp-8) var(--esp-4); }
    .confirmacion .icono-grande { font-size: 72px; color: var(--verde-500); }
    .confirmacion h2 { color: var(--azul-900); font-size: var(--t-titulo-md); margin: var(--esp-3) 0 var(--esp-2); }
    .confirmacion p { color: var(--texto-secundario); max-width: 480px; margin: 0 auto var(--esp-5); }
    .confirmacion .acciones { display: flex; gap: var(--esp-2); justify-content: center; flex-wrap: wrap; }
    .cargando { display: grid; gap: var(--esp-3); }
    @media (max-width: 600px) {
      .grid-temas { grid-template-columns: 1fr; }
      .tema-card { padding: var(--esp-3); min-height: 72px; }
      .nav-pasos button { flex: 1 1 100%; }
    }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Encuesta de intereses tecnológicos"
        subtitulo="Cuéntanos qué te apasiona para planear las próximas capacitaciones"
        [miga]="[{ texto: 'Inicio', ruta: '/encuesta' }, { texto: 'Encuesta' }]" />

      @if (cargando()) {
        <div class="cargando" aria-label="Cargando encuesta" role="status">
          <div class="skeleton" style="height:64px"></div>
          <div class="skeleton" style="height:120px"></div>
          <div class="skeleton" style="height:120px"></div>
        </div>
      } @else if (!periodo()) {
        <app-empty-state icono="event_busy" titulo="Sin periodo activo"
          mensaje="No hay periodo académico abierto en este momento. Vuelve pronto.">
          <a mat-raised-button color="primary" routerLink="/capacitaciones">Ver capacitaciones</a>
        </app-empty-state>
      } @else if (yaRespondio() || enviado()) {
        <mat-card><mat-card-content class="confirmacion" role="status">
          <span class="material-symbols-outlined icono-grande" aria-hidden="true">check_circle</span>
          <h2>¡Respuestas registradas!</h2>
          <p>Tus intereses para el periodo <b>{{ periodo()!.nombre }}</b> quedaron registrados exitosamente. Las respuestas son definitivas y ayudarán a Proyección Social a programar las capacitaciones de tu semestre.</p>

          <div style="max-width:650px; margin: var(--esp-4) auto var(--esp-6); text-align:left;">
            <h3 style="color:var(--azul-900); margin-bottom:var(--esp-3); font-size:var(--t-cuerpo); font-weight:700">Detalle de tu votación:</h3>
            <div style="display:flex; flex-direction:column; gap:var(--esp-2)">
              @for (t of resumenVotacion(); track t.id) {
                <div class="resumen-item" style="background:var(--superficie); border:1px solid var(--borde); border-radius:var(--radio-s); padding:var(--esp-3); justify-content:space-between;">
                  <div style="display:flex; align-items:flex-start; gap:var(--esp-2)">
                    <span class="material-symbols-outlined" style="color:var(--verde-700); margin-top:2px;">check_circle</span>
                    <div>
                      <b style="color:var(--azul-900); display:block;">{{ t.nombre }}</b>
                      @if (t.descripcion) {
                        <small style="color:var(--texto-secundario); display:block; margin-top:2px;">{{ t.descripcion }}</small>
                      }
                    </div>
                  </div>
                  @if (t.puntaje) {
                    <span style="font-weight:700; color:var(--azul-700); background:var(--azul-50); padding:4px 10px; border-radius:var(--radio-s); white-space:nowrap;">{{ t.puntaje }} / 5</span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="acciones">
            <a mat-raised-button color="primary" routerLink="/encuesta-asignaturas">
              <span class="material-symbols-outlined" style="font-size:18px; margin-right:4px">menu_book</span>
              Evaluar Asignaturas del Semestre
            </a>
            <a mat-stroked-button routerLink="/capacitaciones">Ver capacitaciones</a>
          </div>
        </mat-card-content></mat-card>
      } @else {
        <div style="background:var(--azul-50); border:1px solid var(--borde); border-radius:var(--radio-s); padding:var(--esp-3); margin-bottom:var(--esp-3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--esp-2)">
          <div style="display:flex; align-items:center; gap:var(--esp-2)">
            <span class="material-symbols-outlined" style="color:var(--azul-700)">menu_book</span>
            <span style="font-size:var(--t-secundario); color:var(--azul-900); font-weight:600">También puedes evaluar las asignaturas de tu semestre</span>
          </div>
          <a mat-button color="primary" routerLink="/encuesta-asignaturas">Ir a Encuesta de Asignaturas →</a>
        </div>

        <div class="info-periodo">
          <app-status-chip [estado]="periodo()!.modoEncuesta" />
          <span class="texto-secundario">Periodo {{ periodo()!.nombre }}</span>
        </div>

        <mat-stepper orientation="vertical" #stepper>
          <!-- Paso 1: semestre -->
          <mat-step label="Confirma tu semestre">
            <mat-card class="mt"><mat-card-content>
              <p>Usaremos tu semestre para mostrarte capacitaciones dirigidas a ti y para las estadísticas por semestre.</p>
              <mat-form-field><mat-label>Mi semestre actual</mat-label>
                <mat-select [value]="auth.usuario()?.semestre" (selectionChange)="cambiarSemestre($event.value)">
                  @for (s of [1,2,3,4,5,6,7,8,9]; track s) { <mat-option [value]="s">Semestre {{ s }}</mat-option> }
                </mat-select></mat-form-field>
              <div class="nav-pasos">
                <span></span>
                <button mat-raised-button color="primary" matStepperNext>Continuar</button>
              </div>
            </mat-card-content></mat-card>
          </mat-step>

          <!-- Paso 2: temas -->
          <mat-step [label]="periodo()!.modoEncuesta === 'seleccion' ? 'Elige tus temas' : 'Califica los temas'">
            @if (periodo()!.modoEncuesta === 'seleccion') {
              <p class="contador" [class.limite]="elegidos().length >= 5" role="status">
                {{ elegidos().length }} de 5 temas seleccionados
              </p>
              <mat-progress-bar class="progreso" mode="determinate" [value]="elegidos().length * 20" aria-label="Progreso de selección"></mat-progress-bar>
              @if (elegidos().length >= 5) {
                <p class="contador limite">Llegaste al límite de 5. Quita alguno si quieres elegir otro.</p>
              }
              <div class="grid-temas" role="group" aria-label="Temas disponibles">
                @for (t of temas(); track t.id; let i = $index) {
                  <button type="button" class="tema-card" [class.seleccionada]="esElegido(t.id)"
                    [attr.aria-pressed]="esElegido(t.id)" (click)="toggle(t.id)">
                    <span class="icono" aria-hidden="true"><span class="material-symbols-outlined">{{ iconoTema(i) }}</span></span>
                    <span><b>{{ t.nombre }}</b>@if (t.descripcion) { <small>{{ t.descripcion }}</small> }</span>
                  </button>
                }
              </div>
            } @else {
              <p class="texto-secundario">Toca un número del 1 (me interesa poco) al 5 (me apasiona).</p>
              @for (t of temas(); track t.id) {
                <div class="fila-calif">
                  <b>{{ t.nombre }}</b>
                  <div class="escala" role="group" [attr.aria-label]="'Calificación para ' + t.nombre">
                    @for (n of [1,2,3,4,5]; track n) {
                      <button type="button" class="punto-escala" [class.elegido]="calif()[t.id] === n"
                        [attr.aria-pressed]="calif()[t.id] === n" [attr.aria-label]="n + ' de 5'" (click)="setCalif(t.id, n)">{{ n }}</button>
                    }
                  </div>
                </div>
              }
            }
            <div class="nav-pasos">
              <button mat-button matStepperPrevious>Volver</button>
              <button mat-raised-button color="primary" matStepperNext [disabled]="!pasoTemasValido()">Continuar</button>
            </div>
          </mat-step>

          <!-- Paso 3: revisar y enviar -->
          <mat-step label="Revisa y envía">
            <mat-card class="mt"><mat-card-content>
              <h3 class="titulo-seccion">Tu respuesta del periodo {{ periodo()!.nombre }}</h3>
              @for (t of resumenTemas(); track t.id) {
                <div class="resumen-item">
                  <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  <span>{{ t.nombre }} @if (t.puntaje) { <b>· {{ t.puntaje }}/5</b> }</span>
                </div>
              }
              @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
              <div class="nav-pasos">
                <button mat-button matStepperPrevious>Volver</button>
                <button mat-raised-button color="primary" (click)="enviar()" [disabled]="enviando()">
                  {{ enviando() ? 'Enviando…' : 'Enviar mi respuesta' }}
                </button>
              </div>
            </mat-card-content></mat-card>
          </mat-step>
        </mat-stepper>
      }
    </div>
  `,
})
export class EncuestaComponent implements OnInit {
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);
  auth = inject(AuthService);
  private api = environment.apiUrl;

  periodo = signal<Periodo | null>(null);
  temas = signal<Tema[]>([]);
  elegidos = signal<string[]>([]);
  calif = signal<Record<string, number>>({});
  yaRespondio = signal(false);
  miRespuestaData = signal<any>(null);
  enviado = signal(false);
  enviando = signal(false);
  cargando = signal(true);
  error = signal('');

  private readonly STORAGE_KEY = 'sigice_borrador_encuesta';

  async ngOnInit() {
    await this.auth.cargarPerfil();
    try {
      const r = await this.http.get<{ periodo: Periodo; temas: Tema[] }>(`${this.api}/encuestas/temas-aleatorios`).toPromise();
      this.periodo.set(r!.periodo);
      this.temas.set(r!.temas);
      const mia = await this.http.get<any>(`${this.api}/encuestas/mi-respuesta`).toPromise();
      if (mia && mia.id) {
        this.yaRespondio.set(true);
        this.miRespuestaData.set(mia);
        const items = mia.temas || [];
        if (r!.periodo.modoEncuesta === 'seleccion') this.elegidos.set(items.map((i: any) => i.temaId));
        else {
          const c: Record<string, number> = {};
          for (const i of items) if (i.puntaje) c[i.temaId] = i.puntaje;
          this.calif.set(c);
        }
      } else {
        this.recuperarBorrador(r!.periodo.modoEncuesta);
      }
    } catch {
      this.periodo.set(null);
    } finally {
      this.cargando.set(false);
    }
  }

  private guardarBorrador() {
    if (this.yaRespondio()) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        elegidos: this.elegidos(),
        calif: this.calif(),
      }));
    } catch { /* noop */ }
  }

  private recuperarBorrador(modo: string) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (modo === 'seleccion' && Array.isArray(data.elegidos)) {
        this.elegidos.set(data.elegidos);
      } else if (modo === 'calificacion' && data.calif && Object.keys(data.calif).length) {
        this.calif.set(data.calif);
      }
    } catch { /* noop */ }
  }

  private limpiarBorrador() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch { /* noop */ }
  }

  iconoTema(i: number) { return ICONOS_TEMAS[i % ICONOS_TEMAS.length]; }
  esElegido(id: string) { return this.elegidos().includes(id); }
  toggle(id: string) {
    const cur = this.elegidos();
    if (cur.includes(id)) this.elegidos.set(cur.filter((x) => x !== id));
    else {
      if (cur.length >= 5) return; // el aviso en línea ya informa el límite
      this.elegidos.set([...cur, id]);
    }
    this.guardarBorrador();
  }
  setCalif(id: string, v: number) {
    this.calif.set({ ...this.calif(), [id]: Number(v) });
    this.guardarBorrador();
  }

  pasoTemasValido(): boolean {
    const p = this.periodo();
    if (!p) return false;
    if (p.modoEncuesta === 'seleccion') return this.elegidos().length >= 1 && this.elegidos().length <= 5;
    return Object.keys(this.calif()).length >= 1;
  }

  resumenTemas(): { id: string; nombre: string; descripcion?: string; puntaje?: number }[] {
    const p = this.periodo();
    if (!p) return [];
    if (p.modoEncuesta === 'seleccion') {
      const mapa = new Map(this.temas().map((t) => [t.id, t]));
      return this.elegidos().map((id) => ({
        id,
        nombre: mapa.get(id)?.nombre ?? id,
        descripcion: mapa.get(id)?.descripcion,
      }));
    }
    const mapa = new Map(this.temas().map((t) => [t.id, t]));
    return Object.entries(this.calif()).map(([id, puntaje]) => ({
      id,
      nombre: mapa.get(id)?.nombre ?? id,
      descripcion: mapa.get(id)?.descripcion,
      puntaje,
    }));
  }

  resumenVotacion(): { id: string; nombre: string; descripcion?: string; puntaje?: number | null }[] {
    const mia = this.miRespuestaData();
    if (mia && mia.temas && mia.temas.length) {
      const mapaDetalle = new Map<string, Tema>((mia.temasDetalle || []).map((t: Tema) => [t.id, t]));
      const mapaTemas = new Map<string, Tema>(this.temas().map((t: Tema) => [t.id, t]));
      return mia.temas.map((item: any) => {
        const tema = mapaDetalle.get(item.temaId) || mapaTemas.get(item.temaId);
        return {
          id: item.temaId,
          nombre: tema?.nombre || 'Tema',
          descripcion: tema?.descripcion,
          puntaje: item.puntaje,
        };
      });
    }
    return this.resumenTemas();
  }

  async cambiarSemestre(s: number) {
    await this.auth.actualizarSemestre(s);
    this.snack.open(`Semestre actualizado a ${s}`, 'Cerrar', { duration: 2000, panelClass: 'snack-exito' });
  }

  async enviar() {
    this.error.set('');
    const p = this.periodo();
    if (!p || this.enviando()) return;
    let items: { temaId: string; puntaje?: number }[];
    if (p.modoEncuesta === 'seleccion') {
      items = this.elegidos().map((temaId) => ({ temaId }));
      if (!items.length || items.length > 5) { this.error.set('Debes elegir entre 1 y 5 temas'); return; }
    } else {
      items = Object.entries(this.calif()).map(([temaId, puntaje]) => ({ temaId, puntaje }));
      if (!items.length) { this.error.set('Califica al menos un tema'); return; }
      if (items.some((i) => !i.puntaje || i.puntaje < 1 || i.puntaje > 5)) { this.error.set('Cada calificación debe ser de 1 a 5'); return; }
    }
    const body = { items };
    this.enviando.set(true);
    try {
      const resp = await this.http.post<any>(`${this.api}/encuestas`, body).toPromise();
      this.limpiarBorrador();
      this.miRespuestaData.set(resp);
      this.yaRespondio.set(true);
      this.enviado.set(true);
      this.snack.open('¡Gracias por responder!', 'Cerrar', { duration: 3000, panelClass: 'snack-exito' });
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo enviar');
    } finally {
      this.enviando.set(false);
    }
  }
}
