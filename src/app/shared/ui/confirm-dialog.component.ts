import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
}

/** Diálogo de confirmación (reemplaza window.confirm). Devuelve true/false. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  styles: [`
    .dialogo { padding: var(--esp-6); max-width: 440px; background: #ffffff; border-radius: var(--radio-l); }
    h2 { color: var(--azul-900); font-size: var(--t-titulo-sm); margin: 0 0 var(--esp-2); display: flex; gap: var(--esp-2); align-items: center; }
    h2 .material-symbols-outlined { color: var(--azul-500); }
    h2.peligro .material-symbols-outlined { color: var(--error); }
    p { color: var(--texto-secundario); font-size: var(--t-cuerpo); margin: 0 0 var(--esp-5); }
    .acciones { display: flex; justify-content: flex-end; gap: var(--esp-2); }
  `],
  template: `
    <div class="dialogo" role="alertdialog" aria-labelledby="titulo-confirm" aria-describedby="mensaje-confirm">
      <h2 id="titulo-confirm" [class.peligro]="datos.peligro">
        <span class="material-symbols-outlined" aria-hidden="true">{{ datos.peligro ? 'warning' : 'help' }}</span>
        {{ datos.titulo }}
      </h2>
      <p id="mensaje-confirm">{{ datos.mensaje }}</p>
      <div class="acciones">
        <button mat-button (click)="cerrar(false)">{{ datos.textoCancelar || 'Cancelar' }}</button>
        <button mat-raised-button [color]="datos.peligro ? 'warn' : 'primary'" (click)="cerrar(true)">
          {{ datos.textoConfirmar || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    private ref: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public datos: DatosConfirmacion,
  ) {}
  cerrar(valor: boolean) { this.ref.close(valor); }
}
