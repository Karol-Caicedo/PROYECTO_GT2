import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

export type AcentoMetrica = 'azul' | 'verde';

/** Tarjeta de métrica: icono + cifra grande + etiqueta. */
@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  styles: [`
    .metrica { display: flex; gap: var(--esp-3); align-items: flex-start; padding: var(--esp-4); }
    .icono-metrica {
      display: grid; place-items: center; width: 48px; height: 48px; flex-shrink: 0;
      border-radius: var(--radio-m);
    }
    .icono-metrica.azul { background: var(--azul-100); color: var(--azul-700); }
    .icono-metrica.verde { background: var(--verde-100); color: var(--verde-700); }
    .cifra { font-size: var(--t-titulo-md); font-weight: 800; color: var(--azul-900); margin: 0; line-height: 1.2; word-break: break-word; }
    .etiqueta { font-size: var(--t-secundario); color: var(--texto-secundario); margin: var(--esp-1) 0 0; }
  `],
  template: `
    <mat-card><mat-card-content class="metrica">
      <span class="icono-metrica" [ngClass]="acento" aria-hidden="true">
        <span class="material-symbols-outlined">{{ icono }}</span>
      </span>
      <div>
        <p class="cifra">{{ valor }}</p>
        <p class="etiqueta">{{ etiqueta }}</p>
      </div>
    </mat-card-content></mat-card>
  `,
})
export class MetricCardComponent {
  @Input() icono = 'insights';
  @Input() valor: string | number = '–';
  @Input() etiqueta = '';
  @Input() acento: AcentoMetrica = 'azul';
}
