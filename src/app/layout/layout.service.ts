import { Injectable, signal } from '@angular/core';

/** Estado compartido del layout (apertura del menú lateral del admin). */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  /** null = automático (abierto en escritorio, cerrado en móvil). */
  menuAbierto = signal<boolean | null>(null);
  /** Estado efectivo actual del menú (lo sincroniza el admin-layout). */
  menuEfectivo = signal(true);

  /** Invierte el estado efectivo: si está abierto lo cierra y viceversa. */
  alternarMenu() {
    this.menuAbierto.set(!this.menuEfectivo());
  }

  restablecerMenu() {
    this.menuAbierto.set(null);
  }
}
