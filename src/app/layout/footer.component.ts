import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Pie institucional en Azul 900 con texto blanco. */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    footer { background: var(--azul-900); color: var(--superficie); margin-top: auto; width: 100%; }
    .contenido {
      width: 100%;
      box-sizing: border-box;
      padding: var(--esp-4) var(--esp-6);
      display: flex;
      flex-wrap: wrap;
      gap: var(--esp-2) var(--esp-6);
      align-items: center;
      justify-content: space-between;
    }
    .institucional { text-align: left; }
    .nombre { font-weight: 700; font-size: var(--t-cuerpo); margin: 0; text-align: left; }
    .detalle { font-size: var(--t-secundario); opacity: 0.9; margin: var(--esp-1) 0 0; text-align: left; }
    .copy { font-size: var(--t-secundario); opacity: 0.9; margin: 0; text-align: right; margin-left: auto; white-space: nowrap; }
    @media (max-width: 600px) {
      .contenido { padding: var(--esp-3) var(--esp-4); flex-direction: column; align-items: flex-start; }
      .copy { text-align: left; margin-left: 0; margin-top: var(--esp-2); }
    }
  `],
  template: `
    <footer>
      <div class="contenido">
        <div class="institucional">
          <p class="nombre">Universidad del Pacífico · Buenaventura</p>
          <p class="detalle">Programa de Ingeniería de Sistemas — Proyección Social</p>
        </div>
        <p class="copy">© {{ anio }} · SIGICE</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  anio = new Date().getFullYear();
}

