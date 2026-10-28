import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

/** Estado vacío reutilizable: ilustración (icono), título, mensaje y acción. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card><mat-card-content class="estado-vacio" role="status">
      <span class="material-symbols-outlined icono-grande" aria-hidden="true">{{ icono }}</span>
      <h3>{{ titulo }}</h3>
      <p>{{ mensaje }}</p>
      <ng-content />
    </mat-card-content></mat-card>
  `,
})
export class EmptyStateComponent {
  @Input() icono = 'inbox';
  @Input() titulo = 'Sin resultados';
  @Input() mensaje = 'No hay elementos para mostrar en este momento.';
}
