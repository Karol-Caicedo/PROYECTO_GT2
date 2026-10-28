import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { UiService } from '../../shared/ui/ui.service';

interface Cap { id: string; titulo: string; descripcion: string; enlace: string; imagenUrl?: string; estado: string; clics?: number; semestres?: { semestre: number }[]; modalidad: string; fechaEvento?: string }

@Component({
  selector: 'app-caps-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatDatepickerModule, PageHeaderComponent, StatusChipComponent],
  styles: [`
    .dos-columnas { display: grid; grid-template-columns: 1.2fr 1fr; gap: var(--esp-4); align-items: start; }
    @media (max-width: 1000px) { .dos-columnas { grid-template-columns: 1fr; } }
    fieldset { border: 1px solid var(--borde); border-radius: var(--radio-m); padding: var(--esp-4); margin: 0 0 var(--esp-4); }
    legend { font-weight: 700; color: var(--azul-900); padding: 0 var(--esp-2); font-size: var(--t-cuerpo); }
    .fila { display: flex; gap: var(--esp-3); flex-wrap: wrap; align-items: flex-start; }
    .fila > * { flex: 1 1 200px; }
    .chips-sem { display: flex; gap: var(--esp-2); flex-wrap: wrap; margin-top: var(--esp-2); }
    .chip-sem {
      min-width: 48px; min-height: 44px; border-radius: var(--radio-chip);
      border: 2px solid var(--borde); background: var(--superficie);
      font: 700 var(--t-cuerpo) var(--fuente); color: var(--texto); cursor: pointer;
      transition: all var(--transicion-rapida);
    }
    .chip-sem:hover:not(:disabled) { border-color: var(--azul-500); }
    .chip-sem.elegido { background: var(--azul-500); border-color: var(--azul-500); color: var(--superficie); }
    .chip-sem:disabled { opacity: 0.45; cursor: not-allowed; }
    .chip-sem.todos { min-width: auto; padding: 0 var(--esp-4); }
    .card-publicadas { position: sticky; top: var(--esp-4); }
    @media (max-width: 1000px) {
      .card-publicadas { position: static; }
      fieldset { padding: var(--esp-3) var(--esp-2); }
    }
    .lista-items-cap { max-height: 620px; overflow-y: auto; padding-right: var(--esp-1); }
    .portada-placeholder .material-symbols-outlined { font-size: 56px; color: var(--superficie); }
    .item-cap { display: flex; gap: var(--esp-3); align-items: center; padding: var(--esp-3) 0; border-bottom: 1px solid var(--borde); flex-wrap: wrap; }
    .item-cap:last-child { border-bottom: none; }
    .item-info { flex: 1 1 220px; }
    .item-info b { color: var(--azul-900); display: block; }
    .item-info small { color: var(--texto-secundario); font-size: var(--t-secundario); }
    .item-cap app-status-chip { display: inline-flex; align-items: center; align-self: center; }
    .item-acciones { display: flex; align-items: center; gap: var(--esp-1); align-self: center; }
    .subir { display: flex; gap: var(--esp-3); align-items: center; flex-wrap: wrap; font-size: var(--t-secundario); }
    .miniatura { width: 96px; height: 54px; object-fit: cover; border-radius: var(--radio-s); border: 1px solid var(--borde); }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Capacitaciones"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Capacitaciones' }]" />

      <div class="dos-columnas">
        <mat-card><mat-card-content>
          <h2 class="titulo-seccion">Nueva capacitación</h2>
          <form [formGroup]="form" (ngSubmit)="crear()">
            <fieldset><legend>Información</legend>
              <div class="fila">
                <mat-form-field><mat-label>Título</mat-label><input matInput formControlName="titulo" maxlength="120" /></mat-form-field>
                <mat-form-field><mat-label>Descripción</mat-label><input matInput formControlName="descripcion" /></mat-form-field>
              </div>
            </fieldset>
            <fieldset><legend>Enlace e imagen</legend>
              <mat-form-field class="full-width"><mat-label>Enlace</mat-label><input matInput formControlName="enlace" type="url" placeholder="https://" /></mat-form-field>
              <div class="subir">
                <label for="imagen">Imagen (jpg, png o webp, máx. 2 MB):</label>
                <input #fileInput id="imagen" type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)" />
                @if (vistaPreviaImg()) { <img class="miniatura" [src]="vistaPreviaImg()" alt="Vista previa de la imagen elegida" /> }
              </div>
              @if (errorArchivo()) { <p class="error" role="alert">{{ errorArchivo() }}</p> }
            </fieldset>
            <fieldset><legend>Semestres destino</legend>
              <div class="chips-sem" role="group" aria-label="Semestres destino">
                <button type="button" class="chip-sem todos" [class.elegido]="todos()" [attr.aria-pressed]="todos()" (click)="toggleTodos()">Todos</button>
                @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                  <button type="button" class="chip-sem" [class.elegido]="todos() || semSel().includes(s)"
                    [disabled]="todos()" [attr.aria-pressed]="todos() || semSel().includes(s)"
                    [attr.aria-label]="'Semestre ' + s" (click)="toggleSem(s)">{{ s }}</button>
                }
              </div>
            </fieldset>
            <fieldset><legend>Visibilidad</legend>
              <div class="fila">
                <mat-form-field>
                  <mat-label>Visible desde</mat-label>
                  <input matInput [matDatepicker]="pickerDesde" (click)="pickerDesde.open()" [min]="hoy" formControlName="visibleDesde" placeholder="dd/mm/aaaa" />
                  <mat-datepicker-toggle matIconSuffix [for]="pickerDesde"></mat-datepicker-toggle>
                  <mat-datepicker #pickerDesde></mat-datepicker>
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Visible hasta</mat-label>
                  <input matInput [matDatepicker]="pickerHasta" (click)="pickerHasta.open()" [min]="form.value.visibleDesde || hoy" formControlName="visibleHasta" placeholder="dd/mm/aaaa" />
                  <mat-datepicker-toggle matIconSuffix [for]="pickerHasta"></mat-datepicker-toggle>
                  <mat-datepicker #pickerHasta></mat-datepicker>
                </mat-form-field>
              </div>
            </fieldset>
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button mat-raised-button color="primary" [disabled]="form.invalid || guardando()">{{ guardando() ? 'Guardando…' : 'Publicar capacitación' }}</button>
          </form>
        </mat-card-content></mat-card>

        <mat-card class="card-publicadas"><mat-card-content>
          <h2 class="titulo-seccion">Publicadas ({{ filtradas().length }})</h2>
          <div class="barra-filtros" style="position:static;margin-bottom:var(--esp-3)">
            <mat-form-field subscriptSizing="dynamic"><mat-label>Estado</mat-label><mat-select [value]="filtroEstado()" (selectionChange)="filtroEstado.set($event.value)">
              <mat-option value="publicado">Publicado</mat-option>
            </mat-select></mat-form-field>
            <mat-form-field subscriptSizing="dynamic"><mat-label>Semestre</mat-label><mat-select [value]="filtroSem()" (selectionChange)="filtroSem.set($event.value)">
              <mat-option value="">Todos</mat-option>
              @for (s of [1,2,3,4,5,6,7,8,9]; track s) { <mat-option [value]="s">S{{ s }}</mat-option> }
            </mat-select></mat-form-field>
          </div>
          @if (!filtradas().length) {
            <p class="texto-secundario">No hay capacitaciones con esos filtros.</p>
          }
          <div class="lista-items-cap">
            @for (c of filtradas(); track c.id) {
              <div class="item-cap">
                <div class="item-info">
                  <b>{{ c.titulo }}</b>
                  <small>{{ c.clics ?? 0 }} clics · Sem: {{ semStr(c) }}</small>
                </div>
                <app-status-chip [estado]="c.estado" />
                <div class="item-acciones">
                  @if (c.estado === 'publicado') {
                    <button mat-icon-button (click)="notificar(c)" aria-label="Notificar por correo" title="Notificar por correo">
                      <span class="material-symbols-outlined" aria-hidden="true">send</span>
                    </button>
                  }
                  <button mat-icon-button color="warn" (click)="eliminar(c)" aria-label="Eliminar capacitación" title="Eliminar">
                    <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                  </button>
                </div>
              </div>
            }
          </div>
        </mat-card-content></mat-card>
      </div>
    </div>
  `,
})
export class CapacitacionesAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private api = environment.apiUrl;
  readonly hoy = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  caps = signal<Cap[]>([]);
  temas = signal<{ id: string; nombre: string }[]>([]);
  semSel = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  todos = signal(true);
  filtroEstado = signal('publicado');
  filtroSem = signal<string | number>('');
  archivo: File | null = null;
  vistaPreviaImg = signal<string | null>(null);
  errorArchivo = signal('');
  error = signal('');
  guardando = signal(false);

  form = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: [''],
    enlace: [''],
    temaId: [''],
    modalidad: ['virtual'],
    estado: ['publicado'],
    fechaEvento: ['' as string | Date],
    visibleDesde: ['' as string | Date, Validators.required],
    visibleHasta: ['' as string | Date, Validators.required],
  });

  private readonly STORAGE_KEY = 'sigice_borrador_capacitacion';

  async ngOnInit() {
    this.recuperarBorrador();
    this.form.valueChanges.subscribe(() => this.guardarBorrador());
    await this.cargar();
    const t = await this.http.get<{ id: string; nombre: string }[]>(`${this.api}/temas/admin/todos`).toPromise().catch(() => []);
    this.temas.set(t || []);
  }

  private guardarBorrador() {
    try {
      const data = {
        ...this.form.value,
        todos: this.todos(),
        semSel: this.semSel(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch { /* noop */ }
  }

  private recuperarBorrador() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.form.patchValue({
        titulo: data.titulo || '',
        descripcion: data.descripcion || '',
        enlace: data.enlace || '',
        temaId: data.temaId || '',
        modalidad: data.modalidad || 'virtual',
        estado: data.estado || 'publicado',
        fechaEvento: data.fechaEvento ? new Date(data.fechaEvento) : '',
        visibleDesde: data.visibleDesde ? new Date(data.visibleDesde) : '',
        visibleHasta: data.visibleHasta ? new Date(data.visibleHasta) : '',
      });
      if (typeof data.todos === 'boolean') this.todos.set(data.todos);
      if (Array.isArray(data.semSel)) this.semSel.set(data.semSel);
    } catch { /* noop */ }
  }

  private limpiarBorrador() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch { /* noop */ }
  }

  async cargar() {
    const r = await this.http.get<Cap[]>(`${this.api}/capacitaciones`).toPromise().catch(() => []);
    this.caps.set(r || []);
  }
  filtradas() {
    return this.caps().filter((c) =>
      (!this.filtroEstado() || c.estado === this.filtroEstado()) &&
      (this.filtroSem() === '' || (c.semestres || []).some((s) => s.semestre === Number(this.filtroSem()))),
    );
  }
  semStr(c: Cap) {
    return (c.semestres || []).map((s) => s.semestre).join(', ');
  }
  toggleTodos() {
    this.todos.set(!this.todos());
    this.guardarBorrador();
  }
  toggleSem(s: number) {
    const c = this.semSel();
    this.semSel.set(c.includes(s) ? c.filter((x) => x !== s) : [...c, s]);
    this.guardarBorrador();
  }
  onFile(e: Event) {
    this.errorArchivo.set('');
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] || null;
    if (f) {
      if (f.size > 2 * 1024 * 1024) {
        this.errorArchivo.set('La imagen no puede superar 2 MB.');
        input.value = '';
        this.archivo = null;
        this.vistaPreviaImg.set(null);
        return;
      }
      this.archivo = f;
      const reader = new FileReader();
      reader.onload = () => {
        this.vistaPreviaImg.set(reader.result as string);
      };
      reader.onerror = () => {
        this.errorArchivo.set('No se pudo leer la imagen.');
        this.vistaPreviaImg.set(null);
      };
      reader.readAsDataURL(f);
    } else {
      this.archivo = null;
      this.vistaPreviaImg.set(null);
    }
  }
  async crear() {
    this.error.set('');
    this.guardando.set(true);
    try {
      const fd = new FormData();
      for (const [k, v] of Object.entries(this.form.value)) {
        if (v !== null && v !== undefined && v !== '') {
          if ((v as unknown) instanceof Date) {
            fd.append(k, (v as unknown as Date).toISOString());
          } else {
            fd.append(k, String(v));
          }
        }
      }
      fd.append('semestres', JSON.stringify(this.todos() ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : this.semSel()));
      if (this.archivo) fd.append('imagen', this.archivo);
      await this.http.post(`${this.api}/capacitaciones`, fd).toPromise();
      this.limpiarBorrador();
      this.form.reset({ modalidad: 'virtual', estado: 'publicado' });
      this.archivo = null;
      this.vistaPreviaImg.set(null);
      if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
      await this.cargar();
      this.ui.exito('Capacitación guardada.');
    } catch (e: any) {
      const backendMsg = e?.error?.message;
      const texto = Array.isArray(backendMsg)
        ? backendMsg.join('. ')
        : (typeof backendMsg === 'string' ? backendMsg : 'No se pudo guardar. Revisa los datos e inténtalo de nuevo.');
      this.error.set(texto);
    } finally {
      this.guardando.set(false);
    }
  }
  async eliminar(c: Cap) {
    const ok = await this.ui.confirmar({ titulo: 'Eliminar capacitación', mensaje: `¿Eliminar "${c.titulo}"? Esta acción no se puede deshacer.`, textoConfirmar: 'Eliminar', peligro: true });
    if (!ok) return;
    await this.http.delete(`${this.api}/capacitaciones/${c.id}`).toPromise();
    await this.cargar();
    this.ui.exito('Capacitación eliminada.');
  }
  async notificar(c: Cap) {
    const ok = await this.ui.confirmar({ titulo: 'Notificar por correo', mensaje: `Enviar "${c.titulo}" a los estudiantes de los semestres destino (${this.semStr(c)})?`, textoConfirmar: 'Enviar' });
    if (!ok) return;
    const r = await this.http.post<{ enviados: number }>(`${this.api}/capacitaciones/${c.id}/notificar`, {}).toPromise();
    this.ui.exito(`Notificación enviada a ${r?.enviados ?? 0} estudiantes.`);
  }
}
