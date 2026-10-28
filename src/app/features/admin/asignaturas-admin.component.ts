import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { UiService } from '../../shared/ui/ui.service';

export interface Grupo {
  id: string;
  profesor: string;
  codigoGrupo: string;
  horario: string;
  activo: boolean;
}

export interface Asignatura {
  id: string;
  nombre: string;
  codigo?: string;
  semestre: number;
  activo: boolean;
  grupos?: Grupo[];
}

@Component({
  selector: 'app-asignaturas-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    StatusChipComponent,
  ],
  styles: [`
    .dos-columnas { display: grid; grid-template-columns: 360px 1fr; gap: var(--esp-4); align-items: start; }
    @media (max-width: 900px) { .dos-columnas { grid-template-columns: 1fr; } }
    .filtros-asignaturas { display: flex; gap: var(--esp-3); flex-wrap: wrap; margin-bottom: var(--esp-3); }
    .filtros-asignaturas mat-form-field { flex: 1 1 180px; }
    .acciones { display: flex; gap: var(--esp-1); justify-content: flex-end; }
    .chip-semestre {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 2px 8px; border-radius: var(--radio-s);
      font-size: var(--t-secundario); font-weight: 700;
      background: var(--azul-100); color: var(--azul-900);
    }
    .panel-grupos-card { margin-top: var(--esp-4); border: 1px solid var(--azul-300); background: #f8fafc; }
    .header-panel-grupos { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--esp-3); }
    .grupo-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--esp-2) var(--esp-3); background: var(--superficie);
      border-radius: var(--radio-s); border: 1px solid var(--borde); margin-bottom: var(--esp-2);
    }
    .grupo-item-info { display: flex; flex-direction: column; gap: 2px; }
    .grupo-badge { font-weight: 700; color: var(--azul-900); font-size: 13px; }
    .grupo-profesor { font-size: 13px; color: var(--texto-primario); font-weight: 600; }
    .grupo-horario { font-size: 12px; color: var(--texto-secundario); }
  `],
  template: `
    <div class="pagina">
      <app-page-header
        titulo="Plan de estudios — Asignaturas"
        subtitulo="Gestión de asignaturas, docentes y grupos por semestre para encuestas y refuerzos académicos"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Asignaturas' }]"
      />

      <div class="dos-columnas">
        <!-- Columna Izquierda: Formulario Crear/Editar Asignatura y Gestión de Grupos -->
        <div style="display:flex; flex-direction:column; gap:var(--esp-4)">
          <mat-card>
            <mat-card-content>
              <h2 class="titulo-seccion">{{ editandoId() ? 'Editar asignatura' : 'Nueva asignatura' }}</h2>
              <form [formGroup]="form" (ngSubmit)="guardar()">
                <mat-form-field class="full-width">
                  <mat-label>Nombre de la asignatura</mat-label>
                  <input matInput formControlName="nombre" maxlength="150" placeholder="Ej. Cálculo Diferencial" />
                </mat-form-field>

                <mat-form-field class="full-width">
                  <mat-label>Código (opcional)</mat-label>
                  <input matInput formControlName="codigo" maxlength="50" placeholder="Ej. IS-101" />
                </mat-form-field>

                <mat-form-field class="full-width">
                  <mat-label>Semestre del pensum (1 a 9)</mat-label>
                  <mat-select formControlName="semestre">
                    @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                      <mat-option [value]="s">Semestre {{ s }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <div style="display:flex; gap:var(--esp-2); margin-top:var(--esp-2)">
                  <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid">
                    {{ editandoId() ? 'Actualizar' : 'Crear asignatura' }}
                  </button>
                  @if (editandoId()) {
                    <button type="button" mat-stroked-button (click)="cancelarEdicion()">
                      Cancelar
                    </button>
                  }
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Panel de Gestión de Grupos de la Asignatura Seleccionada -->
          @if (asignaturaParaGrupos()) {
            <mat-card class="panel-grupos-card">
              <mat-card-content>
                <div class="header-panel-grupos">
                  <div>
                    <h2 class="titulo-seccion" style="margin:0; font-size:16px; color:var(--azul-900)">
                      <span class="material-symbols-outlined" style="vertical-align:middle; font-size:18px; margin-right:4px">groups</span>
                      Grupos y horarios
                    </h2>
                    <small class="texto-secundario">{{ asignaturaParaGrupos()?.nombre }} (Semestre {{ asignaturaParaGrupos()?.semestre }})</small>
                  </div>
                  <button mat-icon-button (click)="cerrarPanelGrupos()" title="Cerrar panel de grupos">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>

                <!-- Formulario agregar nuevo grupo -->
                <form [formGroup]="formGrupo" (ngSubmit)="guardarGrupo()" style="margin-bottom:var(--esp-4)">
                  <mat-form-field class="full-width" subscriptSizing="dynamic" style="margin-bottom:var(--esp-2)">
                    <mat-label>Profesor / Docente</mat-label>
                    <input matInput formControlName="profesor" placeholder="Ej. Prof. Lucio Pérez" />
                  </mat-form-field>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--esp-2); margin-bottom:var(--esp-2)">
                    <mat-form-field subscriptSizing="dynamic">
                      <mat-label>Código de grupo</mat-label>
                      <input matInput formControlName="codigoGrupo" placeholder="Ej. Grupo D1" />
                    </mat-form-field>

                    <button mat-flat-button color="primary" [disabled]="formGrupo.invalid || guardandoGrupo()" style="height:56px">
                      {{ guardandoGrupo() ? 'Guardando...' : '+ Añadir grupo' }}
                    </button>
                  </div>

                  <mat-form-field class="full-width" subscriptSizing="dynamic">
                    <mat-label>Horario de clases</mat-label>
                    <input matInput formControlName="horario" placeholder="Ej. Lunes 8-10 am y Jueves 9-11 am" />
                  </mat-form-field>
                </form>

                <!-- Listado de grupos configurados -->
                <h3 style="font-size:13px; font-weight:700; color:var(--texto-secundario); margin:0 0 var(--esp-2)">
                  Grupos asignados ({{ listaGrupos().length }})
                </h3>

                @if (!listaGrupos().length) {
                  <p class="texto-secundario" style="font-size:13px">Aún no hay grupos creados para esta materia.</p>
                } @else {
                  @for (g of listaGrupos(); track g.id) {
                    <div class="grupo-item">
                      <div class="grupo-item-info">
                        <span class="grupo-badge">{{ g.codigoGrupo }} — <span class="grupo-profesor">{{ g.profesor }}</span></span>
                        <span class="grupo-horario">⏰ {{ g.horario }}</span>
                      </div>
                      <button mat-icon-button color="warn" (click)="eliminarGrupo(g.id)" title="Eliminar grupo">
                        <span class="material-symbols-outlined" style="font-size:18px">delete</span>
                      </button>
                    </div>
                  }
                }
              </mat-card-content>
            </mat-card>
          }
        </div>

        <!-- Columna Derecha: Lista de asignaturas -->
        <mat-card>
          <mat-card-content>
            <div class="filtros-asignaturas">
              <mat-form-field subscriptSizing="dynamic">
                <mat-label>Buscar asignatura</mat-label>
                <input matInput [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" placeholder="Filtrar por nombre..." />
              </mat-form-field>

              <mat-form-field subscriptSizing="dynamic">
                <mat-label>Filtrar por semestre</mat-label>
                <mat-select [value]="semestreFiltro()" (selectionChange)="semestreFiltro.set($event.value)">
                  <mat-option [value]="''">Todos los semestres</mat-option>
                  @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                    <mat-option [value]="s">Semestre {{ s }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--esp-3); flex-wrap:wrap; gap:var(--esp-2)">
              <h2 class="titulo-seccion" style="margin:0">
                Asignaturas ({{ asignaturasFiltradas().length }} de {{ asignaturas().length }})
              </h2>

              <button
                mat-flat-button
                [color]="todasActivas() ? 'warn' : 'primary'"
                (click)="toggleTodas()"
                type="button"
                [disabled]="asignaturas().length === 0"
              >
                <span class="material-symbols-outlined" aria-hidden="true" style="font-size:18px; margin-right:4px">
                  {{ todasActivas() ? 'block' : 'check_circle' }}
                </span>
                {{ textoBotonToggle() }}
              </button>
            </div>

            @if (!asignaturasFiltradas().length) {
              <p class="texto-secundario">No se encontraron asignaturas con los filtros aplicados.</p>
            } @else {
              <div class="tabla-responsive">
                <table mat-table [dataSource]="asignaturasFiltradas()">
                  <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef>Asignatura</th>
                    <td mat-cell *matCellDef="let a">
                      <b>{{ a.nombre }}</b>
                      @if (a.codigo) {
                        <small class="texto-secundario" style="margin-left:6px">({{ a.codigo }})</small>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="semestre">
                    <th mat-header-cell *matHeaderCellDef>Semestre Pensum</th>
                    <td mat-cell *matCellDef="let a">
                      <span class="chip-semestre">Semestre {{ a.semestre }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="grupos">
                    <th mat-header-cell *matHeaderCellDef>Docentes / Grupos</th>
                    <td mat-cell *matCellDef="let a">
                      <button
                        mat-stroked-button
                        type="button"
                        [color]="asignaturaParaGrupos()?.id === a.id ? 'primary' : ''"
                        (click)="seleccionarParaGrupos(a)"
                        style="min-height:30px; font-size:12px; padding:0 8px"
                      >
                        <span class="material-symbols-outlined" style="font-size:16px; margin-right:4px">groups</span>
                        {{ (a.grupos?.length || 0) }} grupo(s)
                      </button>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="activo">
                    <th mat-header-cell *matHeaderCellDef>Estado</th>
                    <td mat-cell *matCellDef="let a">
                      <app-status-chip [estado]="a.activo ? 'activo' : 'inactivo'" />
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="acc">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let a">
                      <div class="acciones">
                        <button mat-icon-button (click)="editar(a)" aria-label="Editar asignatura" title="Editar">
                          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                        </button>
                        <button mat-icon-button color="warn" (click)="eliminar(a)" aria-label="Eliminar asignatura" title="Eliminar">
                          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="['nombre', 'semestre', 'grupos', 'activo', 'acc']"></tr>
                  <tr mat-row *matRowDef="let r; columns: ['nombre', 'semestre', 'grupos', 'activo', 'acc']"></tr>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,

})
export class AsignaturasAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private api = environment.apiUrl;

  asignaturas = signal<Asignatura[]>([]);
  busqueda = signal('');
  semestreFiltro = signal<string | number>('');
  editandoId = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    codigo: ['', [Validators.maxLength(50)]],
    semestre: [1, [Validators.required, Validators.min(1), Validators.max(9)]],
  });

  asignaturasFiltradas = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const sem = this.semestreFiltro();
    return this.asignaturas().filter((a) => {
      const coincideNombre = !q || a.nombre.toLowerCase().includes(q) || (a.codigo && a.codigo.toLowerCase().includes(q));
      const coincideSem = sem === '' || a.semestre === Number(sem);
      return coincideNombre && coincideSem;
    });
  });

  todasActivas = computed(() => {
    const sem = this.semestreFiltro();
    const lista = sem !== ''
      ? this.asignaturas().filter((a) => a.semestre === Number(sem))
      : this.asignaturas();
    return lista.length > 0 && lista.every((a) => a.activo);
  });

  textoBotonToggle = computed(() => {
    const sem = this.semestreFiltro();
    const activas = this.todasActivas();
    if (sem !== '') {
      return activas ? `Inactivar semestre ${sem}` : `Activar semestre ${sem}`;
    }
    return activas ? 'Inactivar todas' : 'Activar todas';
  });

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    const res = await this.http.get<Asignatura[]>(`${this.api}/asignaturas/admin/todas`).toPromise().catch(() => []);
    this.asignaturas.set(res || []);
  }

  async guardar() {
    if (this.form.invalid) return;
    const { nombre, codigo, semestre } = this.form.value;
    const id = this.editandoId();

    if (id) {
      await this.http.patch(`${this.api}/asignaturas/${id}`, { nombre, codigo: codigo || null, semestre }).toPromise();
      this.ui.exito('Asignatura actualizada.');
      this.cancelarEdicion();
    } else {
      await this.http.post(`${this.api}/asignaturas`, { nombre, codigo: codigo || null, semestre }).toPromise();
      this.ui.exito('Asignatura creada.');
      this.form.reset({ nombre: '', codigo: '', semestre: 1 });
    }
    await this.cargar();
  }

  editar(a: Asignatura) {
    this.editandoId.set(a.id);
    this.form.patchValue({ nombre: a.nombre, codigo: a.codigo || '', semestre: a.semestre });
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', codigo: '', semestre: 1 });
  }

  async toggleTodas() {
    const sem = this.semestreFiltro();
    const nuevoEstado = !this.todasActivas();
    const accion = nuevoEstado ? 'activar' : 'inactivar';
    const alcance = sem !== '' ? `todas las asignaturas del semestre ${sem}` : 'todas las asignaturas';

    const ok = await this.ui.confirmar({
      titulo: `${nuevoEstado ? 'Activar' : 'Inactivar'} asignaturas`,
      mensaje: `¿Estás seguro de que deseas ${accion} ${alcance}?`,
      textoConfirmar: nuevoEstado ? 'Activar' : 'Inactivar',
      peligro: !nuevoEstado,
    });
    if (!ok) return;

    try {
      await this.http.patch(`${this.api}/asignaturas/admin/cambiar-estado-todas`, {
        activo: nuevoEstado,
        semestre: sem !== '' ? Number(sem) : undefined,
      }).toPromise();
      this.ui.exito(`Asignaturas ${nuevoEstado ? 'activadas' : 'inactivadas'} exitosamente.`);
      await this.cargar();
    } catch {
      this.ui.error('No se pudo cambiar el estado de las asignaturas.');
    }
  }

  async eliminar(a: Asignatura) {
    const ok = await this.ui.confirmar({
      titulo: 'Eliminar asignatura',
      mensaje: `¿Eliminar "${a.nombre}" (Semestre ${a.semestre})?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    try {
      await this.http.delete(`${this.api}/asignaturas/${a.id}`).toPromise();
      this.ui.exito('Asignatura eliminada.');
      if (this.editandoId() === a.id) this.cancelarEdicion();
      if (this.asignaturaParaGrupos()?.id === a.id) this.cerrarPanelGrupos();
      await this.cargar();
    } catch {
      this.ui.error('No se pudo eliminar la asignatura.');
    }
  }

  // --- GESTIÓN DE GRUPOS, DOCENTES Y HORARIOS ---
  asignaturaParaGrupos = signal<Asignatura | null>(null);
  listaGrupos = signal<Grupo[]>([]);
  guardandoGrupo = signal<boolean>(false);

  formGrupo = this.fb.group({
    profesor: ['', [Validators.required, Validators.maxLength(150)]],
    codigoGrupo: ['', [Validators.required, Validators.maxLength(50)]],
    horario: ['', [Validators.required, Validators.maxLength(150)]],
  });

  async seleccionarParaGrupos(a: Asignatura) {
    if (this.asignaturaParaGrupos()?.id === a.id) {
      this.cerrarPanelGrupos();
      return;
    }
    this.asignaturaParaGrupos.set(a);
    await this.cargarGrupos(a.id);
  }

  cerrarPanelGrupos() {
    this.asignaturaParaGrupos.set(null);
    this.listaGrupos.set([]);
    this.formGrupo.reset({ profesor: '', codigoGrupo: '', horario: '' });
  }

  async cargarGrupos(asigId: string) {
    try {
      const gs = await this.http.get<Grupo[]>(`${this.api}/asignaturas/${asigId}/grupos`).toPromise();
      this.listaGrupos.set(gs || []);
    } catch {
      this.listaGrupos.set([]);
    }
  }

  async guardarGrupo() {
    const asig = this.asignaturaParaGrupos();
    if (!asig || this.formGrupo.invalid) return;

    this.guardandoGrupo.set(true);
    try {
      const { profesor, codigoGrupo, horario } = this.formGrupo.value;
      await this.http.post(`${this.api}/asignaturas/${asig.id}/grupos`, {
        profesor,
        codigoGrupo,
        horario,
      }).toPromise();
      this.ui.exito('Grupo agregado exitosamente.');
      this.formGrupo.reset({ profesor: '', codigoGrupo: '', horario: '' });
      await this.cargarGrupos(asig.id);
      await this.cargar();
    } catch {
      this.ui.error('No se pudo guardar el grupo.');
    } finally {
      this.guardandoGrupo.set(false);
    }
  }

  async eliminarGrupo(grupoId: string) {
    const asig = this.asignaturaParaGrupos();
    const ok = await this.ui.confirmar({
      titulo: 'Eliminar grupo',
      mensaje: '¿Deseas eliminar este grupo y su horario asociado?',
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;

    try {
      await this.http.delete(`${this.api}/asignaturas/grupos/${grupoId}`).toPromise();
      this.ui.exito('Grupo eliminado.');
      if (asig) {
        await this.cargarGrupos(asig.id);
        await this.cargar();
      }
    } catch {
      this.ui.error('No se pudo eliminar el grupo.');
    }
  }
}

