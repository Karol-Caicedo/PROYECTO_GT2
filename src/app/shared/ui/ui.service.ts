import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent, DatosConfirmacion } from './confirm-dialog.component';

/** Avisos y confirmaciones con identidad institucional (reemplaza alert/confirm). */
@Injectable({ providedIn: 'root' })
export class UiService {
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  confirmar(datos: DatosConfirmacion): Promise<boolean> {
    return this.dialog.open(ConfirmDialogComponent, { data: datos, width: '440px' })
      .afterClosed().toPromise().then((v) => v === true);
  }

  exito(mensaje: string) {
    this.snack.open(mensaje, 'Cerrar', { duration: 3000, panelClass: 'snack-exito' });
  }

  error(mensaje: string) {
    this.snack.open(mensaje, 'Cerrar', { duration: 4000, panelClass: 'snack-error' });
  }

  info(mensaje: string) {
    this.snack.open(mensaje, 'Cerrar', { duration: 2500, panelClass: 'snack-info' });
  }
}
