import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconButton } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../core/auth.service';
import { LayoutService } from './layout.service';
import { NotificacionesService, CapacitacionNotif } from '../core/notificaciones.service';

/** Encabezado blanco con franja institucional, logo y perfil de usuario alineado a la derecha. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconButton,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule,
  ],
  styles: [`
    .cabecera {
      background: var(--superficie);
      color: var(--texto);
      border-bottom: 1px solid var(--borde);
      padding: 0 var(--esp-4);
      min-height: 64px;
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }
    .marca { display: flex; align-items: center; gap: var(--esp-3); text-decoration: none; color: inherit; min-width: 0; flex-shrink: 1; }
    .marca > span:last-child { min-width: 0; }
    .marca img { height: 42px; width: auto; max-width: 100%; }
    .nombre-usuario { overflow: hidden; text-overflow: ellipsis; max-width: 160px; font-weight: 600; }
    .toolbar-spacer { flex: 1 1 auto; }
    .perfil-usuario {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: var(--esp-2);
      flex-shrink: 0;
    }
    .btn-perfil {
      height: 40px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 var(--esp-2) !important;
      vertical-align: middle !important;
    }
    .btn-perfil ::ng-deep .mdc-button__label {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
      vertical-align: middle !important;
    }
    .perfil-contenido {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 100%;
      vertical-align: middle;
    }
    .icono-perfil {
      font-size: 22px !important;
      width: 22px !important;
      height: 22px !important;
      line-height: 22px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      vertical-align: middle !important;
      margin: 0 !important;
      flex-shrink: 0;
    }
    .btn-notificaciones {
      position: relative !important;
      width: 40px !important;
      height: 40px !important;
      color: var(--azul-700);
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background-color 0.2s, color 0.2s;
    }
    .btn-notificaciones:hover {
      background-color: var(--azul-50);
      color: var(--azul-900);
    }
    .icono-campana {
      font-size: 24px !important;
      line-height: 24px !important;
      display: block !important;
    }
    .badge-notif {
      position: absolute;
      top: 4px;
      right: 4px;
      background: var(--error);
      color: #ffffff;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      min-width: 15px;
      height: 15px;
      line-height: 15px;
      text-align: center;
      padding: 0 3px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      border: 1.5px solid var(--superficie);
      z-index: 2;
    }
    ::ng-deep .menu-notif-panel {
      max-width: 360px !important;
      width: 340px !important;
      border-radius: var(--radio-m, 12px) !important;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15) !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .menu-notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--esp-3) var(--esp-4);
      background: var(--azul-50);
    }
    .menu-notif-titulo {
      display: flex;
      align-items: center;
      gap: var(--esp-1);
      font-weight: 700;
      color: var(--azul-900);
      font-size: var(--t-cuerpo, 16px);
    }
    .chip-notif-total {
      font-size: 11px;
      font-weight: 700;
      background: var(--azul-100);
      color: var(--azul-900);
      padding: 2px 8px;
      border-radius: var(--radio-s, 8px);
    }
    .menu-notif-vacio {
      padding: var(--esp-5) var(--esp-4);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--esp-1);
    }
    .icono-vacio {
      font-size: 36px;
      color: var(--texto-secundario);
      opacity: 0.6;
      margin-bottom: var(--esp-1);
    }
    .menu-notif-lista {
      max-height: 320px;
      overflow-y: auto;
    }
    .item-notif {
      display: flex !important;
      align-items: flex-start !important;
      gap: var(--esp-2) !important;
      padding: var(--esp-3) var(--esp-4) !important;
      height: auto !important;
      line-height: normal !important;
      border-bottom: 1px solid var(--borde) !important;
      white-space: normal !important;
    }
    .item-notif:hover {
      background-color: var(--azul-50) !important;
    }
    .item-notif.item-leida {
      opacity: 0.75;
      background: #fafbfc !important;
    }
    .item-notif.item-leida:hover {
      opacity: 1;
      background-color: var(--azul-50) !important;
    }
    .item-notif-icono {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--azul-100);
      color: var(--azul-700);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .item-notif-icono.icono-leida {
      background: var(--gris-100, #eef2f5);
      color: var(--texto-secundario);
    }
    .item-notif-info {
      flex: 1;
      min-width: 0;
      text-align: left;
    }
    .item-notif-etiqueta-fila {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }
    .item-notif-etiqueta {
      font-size: 11px;
      font-weight: 700;
      color: var(--azul-700);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .punto-nueva {
      font-size: 10px;
      font-weight: 800;
      color: #ffffff;
      background: var(--error);
      padding: 1px 6px;
      border-radius: 10px;
      letter-spacing: 0.3px;
    }
    .item-notif-nombre {
      font-size: 13px;
      font-weight: 600;
      color: var(--texto);
      line-height: 1.3;
      margin-bottom: 4px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .item-notif-nombre.texto-atenuado {
      color: var(--texto-secundario);
      font-weight: 500;
    }
    .item-notif-meta {
      display: flex;
      align-items: center;
      gap: var(--esp-2);
      font-size: 11px;
      color: var(--texto-secundario);
    }
    .meta-tag {
      background: var(--verde-50);
      color: var(--verde-900);
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .menu-notif-footer {
      padding: var(--esp-2);
      text-align: center;
      background: var(--superficie);
    }
    .menu-notif-footer button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--esp-1);
      font-weight: 600;
      font-size: 13px;
      color: var(--azul-700);
    }
    @media (max-width: 600px) {
      .cabecera { padding: 0 var(--esp-2); }
      .marca img { height: 34px; }
      .marca .nombre { font-size: var(--t-secundario); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 38vw; display: inline-block; vertical-align: bottom; }
      .nombre-usuario { display: none; }
      .chip-sem { font-size: 12px; padding: 2px var(--esp-2); }
    }
    .marca .nombre { font-size: var(--t-cuerpo); font-weight: 800; color: var(--azul-900); line-height: 1.2; }
    .marca .sub { font-size: 12px; color: var(--texto-secundario); line-height: 1.2; }
    .chip-sem { background: var(--verde-100); color: var(--verde-900); font-weight: 700; }
    .btn-menu { margin-right: var(--esp-1); }
    @media (max-width: 900px) {
      .marca .sub { display: none; }
    }
  `],
  template: `
    <div class="franja-marca" aria-hidden="true"></div>
    <mat-toolbar class="cabecera">
      @if (auth.logueado()) {
        <button mat-icon-button class="btn-menu" (click)="layout.alternarMenu()"
          [attr.aria-label]="layout.menuEfectivo() ? 'Cerrar menú' : 'Abrir menú'"
          [attr.aria-expanded]="layout.menuEfectivo()">
          <span class="material-symbols-outlined" aria-hidden="true">{{ layout.menuEfectivo() ? 'close' : 'menu' }}</span>
        </button>
      }
      <a class="marca" [routerLink]="auth.esAdmin() ? '/admin/dashboard' : '/encuesta'" aria-label="Inicio · SIGICE">
        <img src="assets/logo.jpg" alt="Escudo de la Universidad del Pacífico" />
        <span>
          <span class="nombre">SIGICE</span><br />
          <span class="sub">Ingeniería de Sistemas · Proyección Social</span>
        </span>
      </a>

      <span class="toolbar-spacer"></span>

      @if (auth.logueado()) {
        <div class="perfil-usuario">
          @if (!auth.esAdmin()) {
            <mat-chip class="chip-sem" aria-label="Tu semestre actual">S{{ auth.usuario()?.semestre }}</mat-chip>

            <!-- Botón de notificaciones -->
            <button mat-icon-button class="btn-notificaciones" [matMenuTriggerFor]="menuNotif"
              aria-label="Notificaciones de capacitaciones disponibles" title="Notificaciones de capacitaciones">
              <span class="material-symbols-outlined icono-campana" aria-hidden="true">
                {{ notifService.cantidadNoVistas() > 0 ? 'notifications_active' : 'notifications' }}
              </span>
              @if (notifService.cantidadNoVistas() > 0) {
                <span class="badge-notif">{{ notifService.cantidadNoVistas() }}</span>
              }
            </button>

            <!-- Menú desplegable de notificaciones -->
            <mat-menu #menuNotif="matMenu" class="menu-notif-panel" xPosition="before">
              <div class="menu-notif-header" (click)="$event.stopPropagation()">
                <div class="menu-notif-titulo">
                  <span class="material-symbols-outlined" style="font-size:20px; color:var(--azul-700)">notifications</span>
                  <span>Notificaciones</span>
                </div>
                @if (notifService.cantidadNoVistas() > 0) {
                  <span class="chip-notif-total">{{ notifService.cantidadNoVistas() }} nueva{{ notifService.cantidadNoVistas() === 1 ? '' : 's' }}</span>
                } @else if (notifService.capacitaciones().length > 0) {
                  <span class="chip-notif-total" style="background:var(--verde-100); color:var(--verde-900)">Al día</span>
                }
              </div>

              <mat-divider></mat-divider>

              @if (notifService.cargando()) {
                <div class="menu-notif-vacio" (click)="$event.stopPropagation()">
                  <p class="texto-secundario" style="margin:0">Cargando notificaciones...</p>
                </div>
              } @else if (notifService.capacitaciones().length === 0) {
                <div class="menu-notif-vacio" (click)="$event.stopPropagation()">
                  <span class="material-symbols-outlined icono-vacio" aria-hidden="true">notifications_paused</span>
                  <p style="margin:0; font-weight:600; color:var(--texto)">No tienes notificaciones</p>
                  <p class="texto-secundario" style="margin:4px 0 0; font-size:12px">Te avisaremos cuando haya capacitaciones disponibles para tu semestre.</p>
                </div>
              } @else {
                <div class="menu-notif-lista">
                  @for (c of notifService.notificacionesConEstado(); track c.id) {
                    <button mat-menu-item class="item-notif" [class.item-leida]="c.leida" (click)="entrarACapacitacion(c)">
                      <div class="item-notif-icono" [class.icono-leida]="c.leida">
                        <span class="material-symbols-outlined" aria-hidden="true">{{ c.leida ? 'done' : 'school' }}</span>
                      </div>
                      <div class="item-notif-info">
                        <div class="item-notif-etiqueta-fila">
                          <span class="item-notif-etiqueta">Capacitación disponible</span>
                          @if (!c.leida) {
                            <span class="punto-nueva">NUEVA</span>
                          }
                        </div>
                        <div class="item-notif-nombre" [class.texto-atenuado]="c.leida">{{ c.titulo }}</div>
                        @if (c.fechaEvento) {
                          <div class="item-notif-meta">
                            <span>{{ c.fechaEvento | date:'mediumDate' }}</span>
                          </div>
                        }
                      </div>
                    </button>
                  }
                </div>

                <mat-divider></mat-divider>
                <div class="menu-notif-footer" (click)="$event.stopPropagation()">
                  <button mat-button (click)="verTodas()">
                    <span>Ver todas las capacitaciones</span>
                    <span class="material-symbols-outlined" style="font-size:18px" aria-hidden="true">arrow_forward</span>
                  </button>
                </div>
              }
            </mat-menu>
          }

          <button mat-button class="btn-perfil" [matMenuTriggerFor]="menu" [attr.aria-label]="'Cuenta de ' + auth.usuario()?.nombre">
            <span class="perfil-contenido">
              <span class="material-symbols-outlined icono-perfil" aria-hidden="true">account_circle</span>
              <span class="nombre-usuario">{{ auth.usuario()?.nombre }}</span>
            </span>
          </button>
          <mat-menu #menu="matMenu">
            <p style="padding:0 16px;font-size:14px;color:var(--texto-secundario)">{{ auth.usuario()?.correo }}</p>
            <button mat-menu-item (click)="salir()"><span class="material-symbols-outlined" aria-hidden="true">logout</span>&nbsp;Cerrar sesión</button>
          </mat-menu>
        </div>
      }
    </mat-toolbar>
  `,
})
export class HeaderComponent {
  auth = inject(AuthService);
  layout = inject(LayoutService);
  notifService = inject(NotificacionesService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const u = this.auth.usuario();
      if (u && u.rol === 'ESTUDIANTE') {
        this.notifService.cargar();
      }
    });
  }

  entrarACapacitacion(c: CapacitacionNotif) {
    this.notifService.marcarComoVista(c.id);
    this.router.navigate(['/capacitaciones'], { queryParams: { abrir: c.id } });
  }

  verTodas() {
    this.router.navigate(['/capacitaciones']);
  }

  salir() {
    this.auth.salir();
    this.layout.restablecerMenu();
    this.router.navigate(['/auth/login']);
  }
}
