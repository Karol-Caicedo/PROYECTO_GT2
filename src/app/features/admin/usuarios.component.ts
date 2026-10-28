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
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { UiService } from '../../shared/ui/ui.service';
import { AuthService } from '../../core/auth.service';

interface Usuario {
  id: string;
  correo: string;
  nombre: string;
  numeroIdentificacion?: string | null;
  semestre: number;
  rol: 'ESTUDIANTE' | 'ADMIN';
}

@Component({
  selector: 'app-editar-usuario-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule],
  styles: [`
    .dialogo-editar {
      padding: var(--esp-6);
      width: 100%;
      box-sizing: border-box;
    }
    .titulo-seccion {
      margin: 0 0 var(--esp-4);
      color: var(--azul-900);
      font-size: var(--t-titulo-md, 22px);
      font-weight: 700;
    }
    form {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    mat-form-field {
      width: 100% !important;
      display: block !important;
      margin-bottom: var(--esp-2);
    }
    :host ::ng-deep .mat-mdc-form-field {
      width: 100% !important;
      display: block !important;
    }
    :host ::ng-deep .mat-mdc-text-field-wrapper {
      width: 100% !important;
    }
    :host ::ng-deep .mat-mdc-form-field-flex {
      width: 100% !important;
    }
    :host ::ng-deep .mat-mdc-form-field-infix {
      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }
    :host ::ng-deep .mat-mdc-input-element {
      width: 100% !important;
    }
    .acciones-dialogo {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--esp-3);
      margin-top: var(--esp-4);
    }
  `],
  template: `
    <div class="dialogo-editar">
      <h2 class="titulo-seccion">Editar usuario</h2>
      <form [formGroup]="form" (ngSubmit)="guardar()">
        <mat-form-field class="full-width">
          <mat-label>Identificación *</mat-label>
          <input matInput formControlName="numeroIdentificacion" placeholder="Número de identificación" />
          @if (form.controls.numeroIdentificacion.invalid && form.controls.numeroIdentificacion.touched) {
            <mat-error>El número de identificación es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Nombre completo</mat-label>
          <input matInput formControlName="nombre" />
          @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Correo institucional</mat-label>
          <input matInput formControlName="correo" type="email" />
          @if (form.controls.correo.invalid && form.controls.correo.touched) {
            <mat-error>Escribe un correo válido</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="rol">
            <mat-option value="ESTUDIANTE">Estudiante</mat-option>
            <mat-option value="ADMIN">Administrador</mat-option>
          </mat-select>
        </mat-form-field>

        @if (form.get('rol')?.value !== 'ADMIN') {
          <mat-form-field class="full-width">
            <mat-label>Semestre</mat-label>
            <mat-select formControlName="semestre">
              @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                <mat-option [value]="s">Semestre {{ s }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field class="full-width">
          <mat-label>Nueva contraseña (opcional)</mat-label>
          <input matInput [type]="mostrarPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" placeholder="Déjala vacía para conservar la actual" />
          <button mat-icon-button matSuffix type="button" (click)="mostrarPassword.set(!mostrarPassword())" [attr.aria-label]="mostrarPassword() ? 'Ocultar contraseña' : 'Ver contraseña'" [title]="mostrarPassword() ? 'Ocultar contraseña' : 'Ver contraseña'">
            <span class="material-symbols-outlined" aria-hidden="true">{{ mostrarPassword() ? 'visibility_off' : 'visibility' }}</span>
          </button>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <mat-error>Mínimo 8 caracteres</mat-error>
          }
        </mat-form-field>

        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

        <div class="acciones-dialogo">
          <button mat-button type="button" (click)="ref.close()">Cancelar</button>
          <button mat-raised-button color="primary" [disabled]="form.invalid || cargando()">
            {{ cargando() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class EditarUsuarioDialogComponent {
  ref = inject<MatDialogRef<EditarUsuarioDialogComponent>>(MatDialogRef);
  datos = inject(MAT_DIALOG_DATA) as { usuario: Usuario };
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  error = signal('');
  cargando = signal(false);
  mostrarPassword = signal(false);

  form = this.fb.group({
    numeroIdentificacion: [this.datos.usuario.numeroIdentificacion || '', Validators.required],
    nombre: [this.datos.usuario.nombre, Validators.required],
    correo: [this.datos.usuario.correo, [Validators.required, Validators.email]],
    semestre: [this.datos.usuario.semestre || 1],
    rol: [this.datos.usuario.rol, Validators.required],
    password: ['', [Validators.minLength(8)]],
  });

  constructor() {
    this.actualizarValidadoresSemestre(this.form.get('rol')?.value);
    this.form.get('rol')?.valueChanges.subscribe((r) => {
      this.actualizarValidadoresSemestre(r);
    });
  }

  private actualizarValidadoresSemestre(rol: string | null | undefined) {
    const semControl = this.form.controls.semestre;
    if (rol === 'ADMIN') {
      semControl.clearValidators();
    } else {
      semControl.setValidators([Validators.required, Validators.min(1), Validators.max(9)]);
    }
    semControl.updateValueAndValidity();
  }

  async guardar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      const val = this.form.value;
      const esAdmin = val.rol === 'ADMIN';
      const body: Record<string, unknown> = {
        numeroIdentificacion: val.numeroIdentificacion?.trim() || null,
        nombre: val.nombre,
        correo: val.correo,
        semestre: esAdmin ? 1 : Number(val.semestre || 1),
        rol: val.rol,
      };
      if (val.password && val.password.trim().length > 0) {
        body['password'] = val.password.trim();
      }

      await this.http.patch(`${this.api}/usuarios/${this.datos.usuario.id}`, body).toPromise();
      this.ref.close(true);
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo actualizar el usuario.');
    } finally {
      this.cargando.set(false);
    }
  }
}

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatDialogModule, PageHeaderComponent, StatusChipComponent],
  styles: [`
    .dos-columnas { display: grid; grid-template-columns: 340px 1fr; gap: var(--esp-4); align-items: start; margin-top: var(--esp-4); }
    @media (max-width: 900px) { .dos-columnas { grid-template-columns: 1fr; } }
    .dos-columnas mat-form-field { width: 100% !important; display: block !important; }
    .dos-columnas ::ng-deep .mat-mdc-form-field { width: 100% !important; display: block !important; }
    .dos-columnas ::ng-deep .mat-mdc-text-field-wrapper { width: 100% !important; }
    .dos-columnas ::ng-deep .mat-mdc-form-field-infix { width: 100% !important; min-width: 0 !important; }
    .acciones { display: flex; gap: var(--esp-1); justify-content: flex-end; align-items: center; }
    .btn-accion-editar {
      color: var(--azul-500);
      transition: background-color 0.2s, color 0.2s;
    }
    .btn-accion-editar:hover {
      background-color: var(--azul-50);
      color: var(--azul-700);
    }
    .btn-accion-borrar {
      color: var(--error);
      transition: background-color 0.2s, color 0.2s;
    }
    .btn-accion-borrar:hover {
      background-color: var(--error-fondo);
    }
    .mat-column-acc {
      width: 100px;
      text-align: right;
    }
    .filtros-header {
      display: flex;
      gap: var(--esp-2);
      flex-wrap: wrap;
      align-items: center;
    }
    .barra-busqueda-header {
      min-width: 260px;
    }
    .barra-busqueda-header ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: var(--superficie, #ffffff) !important;
      border-radius: var(--radio-s, 8px);
    }
    .icono-buscar {
      color: var(--texto-secundario);
      font-size: 20px;
      margin-right: var(--esp-2);
      margin-left: var(--esp-1);
    }
    .filtro-semestre-header {
      min-width: 210px;
    }
    .filtro-semestre-header ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: var(--superficie, #ffffff) !important;
      border-radius: var(--radio-s, 8px);
    }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Usuarios"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Usuarios' }]">
        <div class="filtros-header">
          <mat-form-field subscriptSizing="dynamic" class="barra-busqueda-header">
            <span matPrefix class="material-symbols-outlined icono-buscar" aria-hidden="true">search</span>
            <mat-label>Buscar usuario</mat-label>
            <input matInput [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" placeholder="Nombre o identificación" />
            @if (busqueda()) {
              <button mat-icon-button matSuffix type="button" (click)="busqueda.set('')" aria-label="Limpiar búsqueda" title="Limpiar">
                <span class="material-symbols-outlined" aria-hidden="true" style="font-size:18px">close</span>
              </button>
            }
          </mat-form-field>
          <mat-form-field subscriptSizing="dynamic" class="filtro-semestre-header">
            <mat-label>Filtrar por semestre</mat-label>
            <mat-select [value]="filtroSemestre()" (selectionChange)="filtroSemestre.set($event.value)">
              <mat-option value="">Todos los semestres</mat-option>
              @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                <mat-option [value]="s">Semestre {{ s }}</mat-option>
              }
              <mat-option value="ADMIN">Solo Administradores</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </app-page-header>
      <div class="dos-columnas">
        <mat-card><mat-card-content>
          <h2 class="titulo-seccion">Nuevo usuario</h2>
          <form [formGroup]="form" (ngSubmit)="crear()">
            <mat-form-field class="full-width">
              <mat-label>Identificación *</mat-label>
              <input matInput formControlName="numeroIdentificacion" placeholder="Número de identificación" />
              @if (form.controls.numeroIdentificacion.invalid && form.controls.numeroIdentificacion.touched) {
                <mat-error>El número de identificación es obligatorio</mat-error>
              }
            </mat-form-field>
            <mat-form-field class="full-width"><mat-label>Nombre completo</mat-label><input matInput formControlName="nombre" /></mat-form-field>
            <mat-form-field class="full-width"><mat-label>Correo institucional</mat-label>
              <input matInput formControlName="correo" type="email" placeholder="usuario@gmail.com" />
            </mat-form-field>
            <mat-form-field class="full-width"><mat-label>Contraseña inicial (mínimo 8)</mat-label>
              <input matInput formControlName="password" type="password" autocomplete="new-password" />
            </mat-form-field>
            <mat-form-field class="full-width"><mat-label>Rol</mat-label>
              <mat-select formControlName="rol">
                <mat-option value="ESTUDIANTE">Estudiante</mat-option>
                <mat-option value="ADMIN">Administrador</mat-option>
              </mat-select>
            </mat-form-field>
            @if (form.get('rol')?.value !== 'ADMIN') {
              <mat-form-field class="full-width"><mat-label>Semestre</mat-label>
                <mat-select formControlName="semestre">
                  @for (s of [1,2,3,4,5,6,7,8,9]; track s) { <mat-option [value]="s">Semestre {{ s }}</mat-option> }
                </mat-select>
              </mat-form-field>
            }
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid || guardando()">
              {{ guardando() ? 'Creando…' : 'Crear usuario' }}
            </button>
          </form>
        </mat-card-content></mat-card>
        <mat-card><mat-card-content>
          <h2 class="titulo-seccion">Usuarios ({{ usuariosFiltrados().length }})</h2>
          @if (!usuarios().length) {
            <p class="texto-secundario">Aún no hay usuarios. Crea el primero con el formulario.</p>
          } @else if (!usuariosFiltrados().length) {
            <p class="texto-secundario">No se encontraron usuarios para el filtro seleccionado.</p>
          } @else {
            <div class="tabla-responsive"><table mat-table [dataSource]="usuariosFiltrados()">
              <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Usuario</th>
                <td mat-cell *matCellDef="let u">
                  <b>{{ u.nombre }}</b>
                  @if (u.numeroIdentificacion) {
                    <br /><small style="color:var(--azul-700); font-weight:600">ID: {{ u.numeroIdentificacion }}</small>
                  }
                  <br /><small style="color:var(--texto-secundario)">{{ u.correo }}</small>
                </td></ng-container>
              <ng-container matColumnDef="rol"><th mat-header-cell *matHeaderCellDef>Rol</th>
                <td mat-cell *matCellDef="let u"><app-status-chip [texto]="u.rol === 'ADMIN' ? 'Admin' : 'Estudiante'" [tono]="u.rol === 'ADMIN' ? 'ambar' : 'azul'" /></td></ng-container>
              <ng-container matColumnDef="semestre"><th mat-header-cell *matHeaderCellDef>Sem.</th>
                <td mat-cell *matCellDef="let u">{{ u.rol === 'ADMIN' ? '—' : 'S' + u.semestre }}</td></ng-container>
              <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let u">
                <div class="acciones">
                  <button mat-icon-button class="btn-accion-editar" (click)="editar(u)" aria-label="Editar usuario" title="Editar">
                    <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                  </button>
                  <button mat-icon-button class="btn-accion-borrar" (click)="eliminar(u)" aria-label="Eliminar usuario" title="Eliminar">
                    <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                  </button>
                </div>
              </td></ng-container>
              <tr mat-header-row *matHeaderRowDef="['nombre','rol','semestre','acc']"></tr>
              <tr mat-row *matRowDef="let r; columns: ['nombre','rol','semestre','acc']"></tr>
            </table></div>
          }
        </mat-card-content></mat-card>
      </div>
    </div>
  `,
})
export class UsuariosAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private api = environment.apiUrl;
  usuarios = signal<Usuario[]>([]);
  filtroSemestre = signal<string | number>('');
  busqueda = signal('');
  error = signal('');
  guardando = signal(false);

  usuariosFiltrados = computed(() => {
    const f = this.filtroSemestre();
    const q = this.busqueda().trim().toLowerCase();
    let lista = this.usuarios();
    if (f !== '' && f !== 'TODOS') {
      if (f === 'ADMIN') {
        lista = lista.filter((u) => u.rol === 'ADMIN');
      } else {
        lista = lista.filter((u) => u.rol === 'ESTUDIANTE' && u.semestre === Number(f));
      }
    }
    if (q) {
      lista = lista.filter((u) =>
        (u.nombre && u.nombre.toLowerCase().includes(q)) ||
        (u.numeroIdentificacion && u.numeroIdentificacion.toLowerCase().includes(q)) ||
        (u.correo && u.correo.toLowerCase().includes(q))
      );
    }
    return lista;
  });
  form = this.fb.group({
    numeroIdentificacion: ['', Validators.required],
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    semestre: [1],
    rol: ['ESTUDIANTE' as 'ESTUDIANTE' | 'ADMIN', Validators.required],
  });

  constructor() {
    this.actualizarValidadoresSemestre(this.form.get('rol')?.value);
    this.form.get('rol')?.valueChanges.subscribe((r) => {
      this.actualizarValidadoresSemestre(r);
    });
  }

  private actualizarValidadoresSemestre(rol: string | null | undefined) {
    const semControl = this.form.controls.semestre;
    if (rol === 'ADMIN') {
      semControl.clearValidators();
    } else {
      semControl.setValidators([Validators.required, Validators.min(1), Validators.max(9)]);
    }
    semControl.updateValueAndValidity();
  }

  private readonly STORAGE_KEY = 'sigice_borrador_usuario';

  async ngOnInit() {
    this.recuperarBorrador();
    this.form.valueChanges.subscribe(() => this.guardarBorrador());
    await this.cargar();
  }

  private guardarBorrador() {
    try {
      const { password: _password, ...seguro } = this.form.value;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(seguro));
    } catch { /* noop */ }
  }

  private recuperarBorrador() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.form.patchValue({
        numeroIdentificacion: data.numeroIdentificacion || '',
        nombre: data.nombre || '',
        correo: data.correo || '',
        semestre: data.semestre || 1,
        rol: data.rol || 'ESTUDIANTE',
      });
      // Reescribe el borrador sin la contraseña de versiones anteriores.
      this.guardarBorrador();
    } catch { /* noop */ }
  }

  private limpiarBorrador() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch { /* noop */ }
  }

  async cargar() {
    const r = await this.http.get<Usuario[]>(`${this.api}/usuarios`).toPromise().catch(() => []);
    this.usuarios.set(r || []);
  }
  async crear() {
    this.error.set('');
    this.guardando.set(true);
    try {
      const val = this.form.value;
      const esAdmin = val.rol === 'ADMIN';
      await this.http.post(`${this.api}/usuarios`, {
        ...val,
        numeroIdentificacion: val.numeroIdentificacion?.trim() || undefined,
        semestre: esAdmin ? 1 : Number(val.semestre || 1),
      }).toPromise();
      this.limpiarBorrador();
      this.form.reset({ numeroIdentificacion: '', semestre: 1, rol: 'ESTUDIANTE' });
      await this.cargar();
      this.ui.exito('Usuario creado. Compártele su clave inicial por un canal seguro.');
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo crear el usuario.');
    } finally {
      this.guardando.set(false);
    }
  }
  editar(u: Usuario) {
    this.dialog.open(EditarUsuarioDialogComponent, {
      data: { usuario: u },
      width: '540px',
      maxWidth: '95vw',
    })
      .afterClosed().toPromise().then((ok) => {
        if (ok) {
          this.ui.exito('Usuario actualizado.');
          this.cargar();
        }
      });
  }
  async eliminar(u: Usuario) {
    if (this.auth.usuario()?.id === u.id) {
      this.ui.error('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }
    const ok = await this.ui.confirmar({
      titulo: 'Eliminar usuario',
      mensaje: `¿Estás seguro de que deseas eliminar al usuario "${u.nombre}" (${u.correo})?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;

    try {
      await this.http.delete(`${this.api}/usuarios/${u.id}`).toPromise();
      this.ui.exito('Usuario eliminado correctamente.');
      await this.cargar();
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.ui.error(Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo eliminar el usuario.');
    }
  }
}
