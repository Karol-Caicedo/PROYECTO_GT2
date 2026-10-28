import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { NotificacionesService } from '../../core/notificaciones.service';
import { AuthImageDirective } from '../../core/auth-image.directive';
import { ImagenesService } from '../../core/imagenes.service';

interface Cap {
  id: string;
  titulo: string;
  descripcion: string;
  enlace: string;
  imagenUrl?: string;
  fechaEvento?: string;
  modalidad: string;
  semestres?: { semestre: number }[];
}

@Component({
  selector: 'app-detalle-capacitacion-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, AuthImageDirective],
  styles: [`
    .dialogo-detalle {
      width: auto;
      max-width: 560px;
      min-width: min(320px, 92vw);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      margin: 0 auto;
    }
    .contenedor-img {
      width: 100%;
      background: var(--azul-50, #f0f7fc);
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      border-bottom: 1px solid var(--borde, #e2e8f0);
    }
    .detalle-img {
      max-width: 100%;
      max-height: 50vh;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      background: var(--fondo-pagina, #f8fafc);
    }
    .btn-ver-tamano-completo {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(11, 58, 94, 0.88);
      color: #ffffff;
      padding: 4px 10px;
      border-radius: var(--radio-pildora, 16px);
      font-size: 11px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      transition: background 0.2s, transform 0.2s;
    }
    .btn-ver-tamano-completo:hover {
      background: var(--azul-900);
      transform: scale(1.02);
    }
    .cuerpo-detalle {
      padding: var(--esp-3) var(--esp-4);
      display: flex;
      flex-direction: column;
      gap: var(--esp-2);
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--esp-2);
      align-items: center;
    }
    .fecha {
      display: inline-flex;
      align-items: center;
      gap: var(--esp-1);
      font-size: var(--t-secundario);
      font-weight: 700;
      color: var(--azul-700);
      background: var(--azul-50);
      padding: 3px 8px;
      border-radius: var(--radio-pildora);
    }
    .titulo {
      margin: 0;
      font-size: var(--t-titulo-sm, 18px);
      font-weight: 700;
      color: var(--azul-900);
      line-height: 1.3;
    }
    .desc {
      margin: 0;
      font-size: var(--t-secundario, 14px);
      color: var(--texto);
      line-height: 1.5;
      white-space: pre-line;
      max-height: 180px;
      overflow-y: auto;
    }
    .acciones-dialogo {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--esp-2);
      padding: var(--esp-2) var(--esp-4) var(--esp-3);
      border-top: 1px solid var(--borde, #e2e8f0);
    }
    .btn-enlace {
      display: inline-flex;
      align-items: center;
      gap: var(--esp-1);
    }
  `],
  template: `
    <div class="dialogo-detalle">
      @if (c.imagenUrl) {
        <div class="contenedor-img">
          <img class="detalle-img" [appAuthImage]="c.imagenUrl" [alt]="'Imagen de ' + c.titulo" />
          <button type="button" class="btn-ver-tamano-completo" title="Ver imagen en tamaño original" (click)="abrirImagen(c.imagenUrl)">
            <span class="material-symbols-outlined" style="font-size:16px" aria-hidden="true">zoom_in</span>
            <span>Ver imagen completa</span>
          </button>
        </div>
      }
      <div class="cuerpo-detalle">
        @if (c.fechaEvento) {
          <div class="meta">
            <span class="fecha"><span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">event</span>{{ c.fechaEvento | date:'mediumDate' }}</span>
          </div>
        }
        <h2 class="titulo">{{ c.titulo }}</h2>
        @if (c.descripcion) {
          <p class="desc">{{ c.descripcion }}</p>
        } @else {
          <p class="desc texto-secundario" style="font-style:italic">Sin descripción adicional disponible.</p>
        }
      </div>
      <div class="acciones-dialogo">
        <button mat-button type="button" (click)="ref.close()">Cerrar</button>
        @if (c.enlace) {
          <button mat-raised-button color="primary" class="btn-enlace" (click)="irAlEnlace()">
            <span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">open_in_new</span>
            Abrir enlace
          </button>
        }
      </div>
    </div>
  `
})
export class DetalleCapacitacionDialogComponent implements OnInit {
  ref = inject<MatDialogRef<DetalleCapacitacionDialogComponent>>(MatDialogRef);
  data = inject<{ cap: Cap }>(MAT_DIALOG_DATA);
  private http = inject(HttpClient);
  private notifService = inject(NotificacionesService);
  private imagenes = inject(ImagenesService);
  private api = environment.apiUrl;

  get c(): Cap { return this.data.cap; }

  ngOnInit() {
    if (this.c?.id) {
      this.notifService.marcarComoVista(this.c.id);
    }
  }

  abrirImagen(url: string) {
    void this.imagenes.abrir(url);
  }

  async irAlEnlace() {
    const c = this.c;
    if (!c.enlace) return;
    try {
      const r = await this.http.post<{ enlace: string }>(`${this.api}/capacitaciones/${c.id}/clic`, {}).toPromise();
      window.open(r?.enlace || c.enlace, '_blank', 'noopener');
    } catch {
      window.open(c.enlace, '_blank', 'noopener');
    }
  }
}

@Component({
  selector: 'app-mis-capacitaciones',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule, PageHeaderComponent, EmptyStateComponent, AuthImageDirective],
  styles: [`
    .grid-caps { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--esp-4); }
    .cap { display: flex; flex-direction: column; overflow: hidden; transition: box-shadow var(--transicion-media), transform var(--transicion-media); }
    .cap:hover { box-shadow: var(--sombra-2); }
    .portada { aspect-ratio: 16 / 9; width: 100%; object-fit: cover; display: block; background: var(--azul-50); }
    .portada-placeholder {
      aspect-ratio: 16 / 9; display: grid; place-items: center;
      background: linear-gradient(135deg, var(--azul-500), var(--verde-500));
    }
    .portada-placeholder .material-symbols-outlined { font-size: 56px; color: var(--superficie); opacity: 0.9; }
    .cuerpo { display: flex; flex-direction: column; gap: var(--esp-2); padding: var(--esp-4); flex: 1; }
    .fecha { display: flex; align-items: center; gap: var(--esp-1); font-size: var(--t-secundario); font-weight: 700; color: var(--azul-700); }
    .titulo { font-size: var(--t-titulo-sm); color: var(--azul-900); margin: 0; }
    .desc { font-size: var(--t-secundario); color: var(--texto-secundario); margin: 0; flex: 1; }
    .acciones { padding: 0 var(--esp-4) var(--esp-4); }
    .cargando { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--esp-4); }
  `],
  template: `
    <div class="pagina">
      <app-page-header titulo="Capacitaciones para tu semestre"
        subtitulo="Oportunidades vigentes seleccionadas para ti por Proyección Social"
        [miga]="[{ texto: 'Inicio', ruta: '/capacitaciones' }, { texto: 'Capacitaciones' }]" />

      @if (cargando()) {
        <div class="cargando" role="status" aria-label="Cargando capacitaciones">
          <div class="skeleton" style="height:280px"></div><div class="skeleton" style="height:280px"></div><div class="skeleton" style="height:280px"></div>
        </div>
      } @else if (fallo()) {
        <mat-card><mat-card-content class="estado-vacio" role="alert">
          <span class="material-symbols-outlined icono-grande" aria-hidden="true">cloud_off</span>
          <h3>No se pudieron cargar</h3><p>Revisa tu conexión e inténtalo de nuevo.</p>
          <button mat-raised-button color="primary" (click)="cargar()">Reintentar</button>
        </mat-card-content></mat-card>
      } @else if (!caps().length) {
        <app-empty-state icono="school" titulo="Aún no hay capacitaciones para tu semestre"
          mensaje="Proyección Social publicará aquí las próximas oportunidades. Vuelve pronto." />
      } @else {
        <div class="grid-caps">
          @for (c of caps(); track c.id) {
            <mat-card class="cap">
              @if (c.imagenUrl) {
                <img class="portada" [appAuthImage]="c.imagenUrl" [alt]="'Imagen de ' + c.titulo" loading="lazy" />
              } @else {
                <div class="portada-placeholder" role="img" [attr.aria-label]="'Sin imagen para ' + c.titulo">
                  <span class="material-symbols-outlined" aria-hidden="true">school</span>
                </div>
              }
              <div class="cuerpo">
                @if (c.fechaEvento) {
                  <div style="display:flex;gap:8px;align-items:center">
                    <span class="fecha"><span class="material-symbols-outlined" aria-hidden="true">event</span>{{ c.fechaEvento | date:'mediumDate' }}</span>
                  </div>
                }
                <h2 class="titulo">{{ c.titulo }}</h2>
                @if (c.descripcion) {
                  <p class="desc">{{ c.descripcion.slice(0, 140) }}{{ c.descripcion.length > 140 ? '…' : '' }}</p>
                }
              </div>
              <div class="acciones">
                <button mat-raised-button color="primary" class="full-width" (click)="verDetalle(c)">Ver más</button>
              </div>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class MisCapacitacionesComponent implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private notifService = inject(NotificacionesService);
  private api = environment.apiUrl;
  caps = signal<Cap[]>([]);
  cargando = signal(true);
  fallo = signal(false);

  async ngOnInit() {
    await this.cargar();
    const abrirId = this.route.snapshot.queryParamMap.get('abrir');
    if (abrirId) {
      const encontrada = this.caps().find((c) => c.id === abrirId);
      if (encontrada) {
        this.verDetalle(encontrada);
      }
    }
  }

  async cargar() {
    this.cargando.set(true);
    this.fallo.set(false);
    try {
      const r = await this.http.get<Cap[]>(`${this.api}/capacitaciones/mias`).toPromise();
      this.caps.set(r || []);
    } catch {
      this.fallo.set(true);
    } finally {
      this.cargando.set(false);
    }
  }

  verDetalle(c: Cap) {
    this.notifService.marcarComoVista(c.id);
    this.dialog.open(DetalleCapacitacionDialogComponent, {
      data: { cap: c },
      maxWidth: '92vw',
      maxHeight: '90vh',
      autoFocus: false,
    });
  }
}
