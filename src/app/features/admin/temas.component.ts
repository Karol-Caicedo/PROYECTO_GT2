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

interface Tema { id: string; nombre: string; descripcion?: string; activo: boolean }

@Component({
  selector: 'app-temas-admin',
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
    .dos-columnas { display: grid; grid-template-columns: 340px 1fr; gap: var(--esp-4); align-items: start; }
    @media (max-width: 900px) { .dos-columnas { grid-template-columns: 1fr; } }
    .acciones { display: flex; gap: var(--esp-1); justify-content: flex-end; }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Temas de interés" subtitulo="Se muestran en orden aleatorio en la encuesta del estudiante"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Temas' }]" />
      <div class="dos-columnas">
        <!-- Formulario Crear / Editar -->
        <mat-card>
          <mat-card-content>
            <h2 class="titulo-seccion">{{ editandoId() ? 'Editar tema' : 'Nuevo tema' }}</h2>
            <form [formGroup]="form" (ngSubmit)="guardar()">
              <mat-form-field class="full-width">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="nombre" maxlength="120" />
              </mat-form-field>

              <mat-form-field class="full-width">
                <mat-label>Descripción corta</mat-label>
                <input matInput formControlName="descripcion" maxlength="200" />
              </mat-form-field>

              @if (editandoId()) {
                <mat-form-field class="full-width">
                  <mat-label>Estado</mat-label>
                  <mat-select formControlName="activo">
                    <mat-option [value]="true">Activo</mat-option>
                    <mat-option [value]="false">Inactivo</mat-option>
                  </mat-select>
                </mat-form-field>
              }

              <div style="display:flex; gap:var(--esp-2); margin-top:var(--esp-2)">
                <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid">
                  {{ editandoId() ? 'Actualizar' : 'Crear tema' }}
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

        <!-- Lista de temas -->
        <mat-card>
          <mat-card-content>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--esp-3); flex-wrap:wrap; gap:var(--esp-2)">
              <h2 class="titulo-seccion" style="margin:0">
                Temas ({{ temas().length }})
              </h2>

              <button
                mat-flat-button
                [color]="todosActivos() ? 'warn' : 'primary'"
                (click)="toggleTodos()"
                type="button"
                [disabled]="temas().length === 0"
              >
                <span class="material-symbols-outlined" aria-hidden="true" style="font-size:18px; margin-right:4px">
                  {{ todosActivos() ? 'block' : 'check_circle' }}
                </span>
                {{ textoBotonToggle() }}
              </button>
            </div>

            @if (!temas().length) {
              <p class="texto-secundario">Aún no hay temas. Crea el primero con el formulario.</p>
            } @else {
              <div class="tabla-responsive">
                <table mat-table [dataSource]="temas()">
                  <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef>Nombre</th>
                    <td mat-cell *matCellDef="let t">
                      <b>{{ t.nombre }}</b><br />
                      <small style="color:var(--texto-secundario)">{{ t.descripcion }}</small>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="activo">
                    <th mat-header-cell *matHeaderCellDef>Estado</th>
                    <td mat-cell *matCellDef="let t">
                      <app-status-chip [estado]="t.activo ? 'activo' : 'inactivo'" />
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="acc">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let t">
                      <div class="acciones">
                        <button mat-icon-button (click)="editar(t)" aria-label="Editar tema" title="Editar">
                          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                        </button>
                        <button mat-icon-button color="warn" (click)="eliminar(t)" aria-label="Eliminar tema" title="Eliminar">
                          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="['nombre','activo','acc']"></tr>
                  <tr mat-row *matRowDef="let r; columns: ['nombre','activo','acc']"></tr>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class TemasAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private api = environment.apiUrl;

  temas = signal<Tema[]>([]);
  editandoId = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.maxLength(200)]],
    activo: [true],
  });

  todosActivos = computed(() => {
    const lista = this.temas();
    return lista.length > 0 && lista.every((t) => t.activo);
  });

  textoBotonToggle = computed(() => {
    return this.todosActivos() ? 'Inactivar todos' : 'Activar todos';
  });

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    const r = await this.http.get<Tema[]>(`${this.api}/temas/admin/todos`).toPromise().catch(() => []);
    this.temas.set(r || []);
  }

  editar(t: Tema) {
    this.editandoId.set(t.id);
    this.form.patchValue({
      nombre: t.nombre,
      descripcion: t.descripcion || '',
      activo: t.activo,
    });
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', descripcion: '', activo: true });
  }

  async guardar() {
    if (this.form.invalid) return;
    const { nombre, descripcion, activo } = this.form.value;
    const id = this.editandoId();

    try {
      if (id) {
        await this.http.patch(`${this.api}/temas/${id}`, {
          nombre,
          descripcion: descripcion || null,
          activo: activo ?? true,
        }).toPromise();
        this.ui.exito('Tema actualizado.');
        this.cancelarEdicion();
      } else {
        await this.http.post(`${this.api}/temas`, {
          nombre,
          descripcion: descripcion || null,
        }).toPromise();
        this.ui.exito('Tema creado.');
        this.form.reset({ nombre: '', descripcion: '', activo: true });
      }
      await this.cargar();
    } catch {
      this.ui.error(id ? 'No se pudo actualizar el tema.' : 'No se pudo crear el tema.');
    }
  }

  async toggleTodos() {
    const nuevoEstado = !this.todosActivos();
    const accion = nuevoEstado ? 'activar' : 'inactivar';

    const ok = await this.ui.confirmar({
      titulo: `${nuevoEstado ? 'Activar' : 'Inactivar'} temas`,
      mensaje: `¿Estás seguro de que deseas ${accion} todos los temas?`,
      textoConfirmar: nuevoEstado ? 'Activar' : 'Inactivar',
      peligro: !nuevoEstado,
    });
    if (!ok) return;

    try {
      await this.http.patch(`${this.api}/temas/admin/cambiar-estado-todos`, {
        activo: nuevoEstado,
      }).toPromise();
      this.ui.exito(`Temas ${nuevoEstado ? 'activados' : 'inactivados'} exitosamente.`);
      await this.cargar();
    } catch {
      this.ui.error('No se pudo cambiar el estado de los temas.');
    }
  }

  async eliminar(t: Tema) {
    const ok = await this.ui.confirmar({
      titulo: 'Eliminar tema',
      mensaje: `¿Eliminar "${t.nombre}"?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;

    try {
      await this.http.delete(`${this.api}/temas/${t.id}`).toPromise();
      this.ui.exito('Tema eliminado.');
      if (this.editandoId() === t.id) this.cancelarEdicion();
      await this.cargar();
    } catch {
      this.ui.error('No se pudo eliminar el tema.');
    }
  }
}

