import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TonoChip = 'azul' | 'verde' | 'gris' | 'ambar' | 'rojo';

const MAPA_ESTADOS: Record<string, { texto: string; tono: TonoChip }> = {
  publicado: { texto: 'Publicado', tono: 'verde' },
  borrador: { texto: 'Borrador', tono: 'gris' },
  activo: { texto: 'Activo', tono: 'azul' },
  inactivo: { texto: 'Inactivo', tono: 'gris' },
  nueva: { texto: 'Nueva', tono: 'azul' },
  revisada: { texto: 'Revisada', tono: 'ambar' },
  aceptada: { texto: 'Aceptada', tono: 'verde' },
  virtual: { texto: 'Virtual', tono: 'azul' },
  presencial: { texto: 'Presencial', tono: 'verde' },
  seleccion: { texto: 'Selección', tono: 'azul' },
  calificacion: { texto: 'Calificación', tono: 'verde' },
};

/** Chip de estado con color + texto (nunca solo color: incluye etiqueta). */
@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: inline-flex; align-items: center; }
    .chip-estado {
      display: inline-flex; align-items: center; gap: var(--esp-1);
      border-radius: var(--radio-chip);
      padding: var(--esp-1) var(--esp-3);
      font-size: var(--t-secundario); font-weight: 700; white-space: nowrap;
    }
    .chip-estado .punto { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .chip-azul { background: var(--azul-100); color: var(--azul-900); }
    .chip-verde { background: var(--verde-100); color: var(--verde-900); }
    .chip-gris { background: var(--gris-100); color: var(--texto-secundario); }
    .chip-ambar { background: var(--advertencia-fondo); color: var(--texto); border: 1px solid var(--advertencia-borde); }
    .chip-rojo { background: var(--error-fondo); color: var(--error); }
  `],
  template: `<span class="chip-estado" [ngClass]="'chip-' + tono"><span class="punto" aria-hidden="true"></span>{{ texto }}</span>`,
})
export class StatusChipComponent {
  @Input() texto = '';
  @Input() tono: TonoChip = 'gris';
  @Input() set estado(v: string) {
    const m = MAPA_ESTADOS[(v || '').toLowerCase()];
    if (m) { this.texto = this.texto || m.texto; this.tono = m.tono; }
    else if (!this.texto) { this.texto = v; }
  }
}
