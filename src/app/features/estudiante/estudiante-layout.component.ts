import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LayoutService } from '../../layout/layout.service';

/** Estudiante: menú lateral Azul 900 organizado igual que el admin + contenido */
@Component({
  selector: 'app-estudiante-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, MatSidenavModule],
  styles: [`
    .estudiante { min-height: calc(100vh - 65px); }
    .lateral { width: 248px; background: var(--azul-900); color: var(--superficie); border: none; padding: var(--esp-4) var(--esp-2); }
    .titulo-lateral { font-size: var(--t-secundario); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.75; padding: 0 var(--esp-3) var(--esp-2); margin: 0; }
    nav { display: flex; flex-direction: column; gap: var(--esp-1); }
    nav a {
      display: flex; align-items: center; gap: var(--esp-3);
      color: var(--superficie); text-decoration: none; font-weight: 600; font-size: var(--t-cuerpo);
      padding: var(--esp-3); border-radius: var(--radio-m);
      border-left: 4px solid transparent;
      transition: background var(--transicion-rapida);
      min-height: 44px;
    }
    nav a:hover { background: rgb(255 255 255 / 10%); }
    nav a.activa { background: var(--azul-100); color: var(--azul-900); border-left-color: var(--verde-500); }
    .contenido { padding: var(--esp-5) var(--esp-4) var(--esp-10); max-width: 1160px; }
    @media (max-width: 900px) { .contenido { padding: var(--esp-4) var(--esp-2) var(--esp-10); } }
  `],
  template: `
    <mat-sidenav-container class="estudiante" autosize>
      <mat-sidenav class="lateral" [mode]="movil() ? 'over' : 'side'" [opened]="abierto()"
        (closedStart)="alCerrarMovil()" aria-label="Menú del estudiante">
        <p class="titulo-lateral">Estudiante</p>
        <nav>
          @for (item of items; track item.ruta) {
            <a [routerLink]="item.ruta" routerLinkActive="activa" (click)="alNavegar()">
              <span class="material-symbols-outlined" aria-hidden="true">{{ item.icono }}</span>{{ item.texto }}
            </a>
          }
        </nav>
      </mat-sidenav>
      <mat-sidenav-content>
        <div class="contenido"><router-outlet></router-outlet></div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class EstudianteLayoutComponent {
  private layout = inject(LayoutService);
  private breakpoint = inject(BreakpointObserver);

  items = [
    { ruta: '/encuesta', texto: 'Encuesta Intereses', icono: 'poll' },
    { ruta: '/encuesta-asignaturas', texto: 'Encuesta Materias', icono: 'menu_book' },
    { ruta: '/capacitaciones', texto: 'Capacitaciones', icono: 'school' },
  ];

  movil = toSignal(
    this.breakpoint.observe('(max-width: 900px)').pipe(map((r) => r.matches)),
    { initialValue: window.innerWidth <= 900 },
  );

  abierto = computed(() => this.layout.menuAbierto() ?? !this.movil());

  constructor() {
    effect(() => {
      this.movil();
      this.layout.restablecerMenu();
    });
    effect(() => {
      this.layout.menuEfectivo.set(this.abierto());
    });
  }

  alNavegar() {
    if (this.movil()) this.layout.menuAbierto.set(false);
  }

  alCerrarMovil() {
    if (this.movil()) this.layout.menuAbierto.set(false);
  }
}
