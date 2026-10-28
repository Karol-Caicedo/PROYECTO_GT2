import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { UiService } from '../../shared/ui/ui.service';

interface Periodo {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  modoEncuesta: string;
  encuestaAsignaturasActiva?: boolean;
}

@Component({
  selector: 'app-periodos-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule, MatDatepickerModule, PageHeaderComponent, StatusChipComponent],
  styles: [`
    .card-crear { margin-bottom: var(--esp-6); }
    .card-historial { margin-top: var(--esp-6); }
    .form-crear { display: flex; gap: var(--esp-3); flex-wrap: wrap; align-items: flex-start; }
    .form-crear mat-form-field { flex: 1 1 180px; }
    .acciones { display: flex; gap: var(--esp-1); justify-content: flex-end; align-items: center; }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Periodos académicos" subtitulo="Solo puede haber un periodo activo a la vez"
        [miga]="[{ texto: 'Administración', ruta: '/admin/dashboard' }, { texto: 'Periodos' }]" />
      <mat-card class="card-crear"><mat-card-content>
        <h2 class="titulo-seccion">Crear periodo</h2>
        <form [formGroup]="form" (ngSubmit)="crear()" class="form-crear">
          <mat-form-field><mat-label>Nombre (ej. 2026-2)</mat-label><input matInput formControlName="nombre" /></mat-form-field>
          <mat-form-field>
            <mat-label>Inicio</mat-label>
            <input matInput [matDatepicker]="pickerInicio" (click)="pickerInicio.open()" formControlName="fechaInicio" placeholder="dd/mm/aaaa" />
            <mat-datepicker-toggle matIconSuffix [for]="pickerInicio"></mat-datepicker-toggle>
            <mat-datepicker #pickerInicio></mat-datepicker>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Fin</mat-label>
            <input matInput [matDatepicker]="pickerFin" (click)="pickerFin.open()" formControlName="fechaFin" placeholder="dd/mm/aaaa" />
            <mat-datepicker-toggle matIconSuffix [for]="pickerFin"></mat-datepicker-toggle>
            <mat-datepicker #pickerFin></mat-datepicker>
          </mat-form-field>
          <mat-form-field><mat-label>Modo de encuesta</mat-label><mat-select formControlName="modoEncuesta">
            <mat-option value="seleccion">Selección (hasta 5 temas)</mat-option>
          </mat-select>
            <mat-hint>Define cómo responden los estudiantes</mat-hint></mat-form-field>
          <button mat-raised-button color="primary" [disabled]="form.invalid">Crear</button>
        </form>
      </mat-card-content></mat-card>
      <mat-card class="card-historial"><mat-card-content>
        <h2 class="titulo-seccion">Historial de periodos</h2>
        <div class="tabla-responsive"><table mat-table [dataSource]="periodos()">
          <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Periodo</th>
            <td mat-cell *matCellDef="let p"><b>{{ p.nombre }}</b><br /><small style="color:var(--texto-secundario)">{{ p.fechaInicio | date:'mediumDate' }} – {{ p.fechaFin | date:'mediumDate' }}</small></td></ng-container>
          <ng-container matColumnDef="modo"><th mat-header-cell *matHeaderCellDef>Modo</th>
            <td mat-cell *matCellDef="let p"><app-status-chip [estado]="p.modoEncuesta" /></td></ng-container>
          <ng-container matColumnDef="encuestaAsig"><th mat-header-cell *matHeaderCellDef>Encuesta Materias</th>
            <td mat-cell *matCellDef="let p">
              <button mat-stroked-button [color]="p.encuestaAsignaturasActiva ? 'primary' : ''" (click)="toggleEncuestaAsignaturas(p)" title="Habilitar/deshabilitar encuesta de materias para este periodo">
                <span class="material-symbols-outlined" style="font-size:16px; vertical-align:-3px">{{ p.encuestaAsignaturasActiva ? 'check_circle' : 'cancel' }}</span>
                {{ p.encuestaAsignaturasActiva ? 'Habilitada' : 'Deshabilitada' }}
              </button>
            </td></ng-container>
          <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p"><app-status-chip [estado]="p.activo ? 'activo' : 'inactivo'" /></td></ng-container>
          <ng-container matColumnDef="acc"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let p">
            <div class="acciones">
              @if (!p.activo) {
                <button mat-stroked-button color="primary" (click)="activar(p)">
                  <span class="material-symbols-outlined" aria-hidden="true" style="vertical-align:-4px">play_arrow</span>&nbsp;Activar
                </button>
              }
              <button mat-icon-button color="warn" (click)="eliminar(p)" aria-label="Eliminar periodo" title="Eliminar">
                <span class="material-symbols-outlined" aria-hidden="true">delete</span>
              </button>
            </div>
          </td></ng-container>
          <tr mat-header-row *matHeaderRowDef="['nombre','modo','encuestaAsig','estado','acc']"></tr>
          <tr mat-row *matRowDef="let r; columns: ['nombre','modo','encuestaAsig','estado','acc']"></tr>
        </table></div>
      </mat-card-content></mat-card>
    </div>
  `,
})
export class PeriodosAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private ui = inject(UiService);
  private api = environment.apiUrl;
  periodos = signal<Periodo[]>([]);
  form = this.fb.group({
    nombre: ['', Validators.required],
    fechaInicio: ['' as string | Date, Validators.required],
    fechaFin: ['' as string | Date, Validators.required],
    modoEncuesta: ['seleccion', Validators.required],
  });

  private readonly STORAGE_KEY = 'sigice_borrador_periodo';

  async ngOnInit() {
    this.recuperarBorrador();
    this.form.valueChanges.subscribe(() => this.guardarBorrador());
    await this.cargar();
  }

  private guardarBorrador() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.form.value));
    } catch { /* noop */ }
  }

  private recuperarBorrador() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.form.patchValue({
        nombre: data.nombre || '',
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : '',
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : '',
        modoEncuesta: data.modoEncuesta || 'seleccion',
      });
    } catch { /* noop */ }
  }

  private limpiarBorrador() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch { /* noop */ }
  }

  async cargar() {
    const r = await this.http.get<Periodo[]>(`${this.api}/periodos`).toPromise().catch(() => []);
    this.periodos.set(r || []);
  }
  async crear() {
    const val = this.form.value;
    const toYmd = (d: any) => {
      if (!d) return '';
      if (d instanceof Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return String(d).split('T')[0];
    };
    await this.http.post(`${this.api}/periodos`, {
      ...val,
      fechaInicio: toYmd(val.fechaInicio),
      fechaFin: toYmd(val.fechaFin),
      activo: false,
    }).toPromise();
    this.limpiarBorrador();
    this.form.reset({ modoEncuesta: 'seleccion' });
    await this.cargar();
    this.ui.exito('Periodo creado.');
  }
  async activar(p: Periodo) {
    const ok = await this.ui.confirmar({ titulo: 'Activar periodo', mensaje: `Activar ${p.nombre}? El periodo activo actual se cerrará.`, textoConfirmar: 'Activar' });
    if (!ok) return;
    await this.http.post(`${this.api}/periodos/${p.id}/activar`, {}).toPromise();
    await this.cargar();
    this.ui.exito(`Periodo ${p.nombre} activado.`);
  }
  async eliminar(p: Periodo) {
    const ok = await this.ui.confirmar({ titulo: 'Eliminar periodo', mensaje: `¿Eliminar ${p.nombre}?`, textoConfirmar: 'Eliminar', peligro: true });
    if (!ok) return;
    try {
      await this.http.delete(`${this.api}/periodos/${p.id}`).toPromise();
      this.ui.exito('Periodo eliminado.');
    } catch {
      this.ui.error('No se puede eliminar el periodo activo.');
    }
    await this.cargar();
  }
  async toggleEncuestaAsignaturas(p: Periodo) {
    const nueva = !p.encuestaAsignaturasActiva;
    await this.http.patch(`${this.api}/periodos/${p.id}/encuesta-asignaturas`, {
      encuestaAsignaturasActiva: nueva,
    }).toPromise();
    this.ui.exito(`Encuesta de asignaturas ${nueva ? 'habilitada' : 'deshabilitada'} para ${p.nombre}.`);
    await this.cargar();
  }
}
