import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

/** Navegación inferior para estudiantes en celular (solo ≤768px). */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [`
    nav {
      display: none;
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
      background: var(--superficie);
      border-top: 1px solid var(--borde);
      padding: var(--esp-1) var(--esp-2) calc(var(--esp-1) + env(safe-area-inset-bottom));
    }
    @media (max-width: 900px) {
      nav.visible { display: flex; }
    }
    a {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
      text-decoration: none; color: var(--texto-secundario);
      font-size: var(--t-secundario); font-weight: 600; padding: var(--esp-2);
      border-radius: var(--radio-m); min-height: 56px; justify-content: center;
    }
    a.activa { color: var(--azul-700); background: var(--azul-50); }
  `],
  template: `
    @if (auth.logueado() && !auth.esAdmin()) {
      <nav class="visible" aria-label="Navegación principal">
        <a routerLink="/encuesta" routerLinkActive="activa">
          <span class="material-symbols-outlined" aria-hidden="true">poll</span>Encuesta
        </a>
        <a routerLink="/capacitaciones" routerLinkActive="activa">
          <span class="material-symbols-outlined" aria-hidden="true">school</span>Capacitaciones
        </a>
      </nav>
    }
  `,
})
export class BottomNavComponent {
  auth = inject(AuthService);
}
