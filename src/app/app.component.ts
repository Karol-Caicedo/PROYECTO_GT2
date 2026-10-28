import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './layout/header.component';
import { FooterComponent } from './layout/footer.component';
import { BottomNavComponent } from './layout/bottom-nav.component';
import { aplicarTemaGraficos } from './core/charts.config';

/** Estructura general: encabezado → contenido → pie (+ nav inferior móvil). */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, BottomNavComponent],
  styles: [`
    .app { min-height: 100vh; display: flex; flex-direction: column; }
    main { flex: 1; }
    @media (max-width: 900px) { main { padding-bottom: 72px; } }
  `],
  template: `
    <div class="app">
      <app-header></app-header>
      <main><router-outlet></router-outlet></main>
      <app-footer></app-footer>
      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
})
export class AppComponent {
  constructor() {
    aplicarTemaGraficos();
  }
}
