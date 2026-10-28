import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CapacitacionNotif {
  id: string;
  titulo: string;
  modalidad: string;
  fechaEvento?: string | null;
  descripcion?: string;
  enlace?: string;
  imagenUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = environment.apiUrl;

  capacitaciones = signal<CapacitacionNotif[]>([]);
  vistasIds = signal<string[]>([]);
  cargando = signal<boolean>(false);

  /** Cantidad de capacitaciones no vistas por el estudiante actual */
  cantidadNoVistas = computed(() => {
    const vistas = new Set(this.vistasIds());
    return this.capacitaciones().filter((c) => !vistas.has(c.id)).length;
  });

  /** Lista de capacitaciones con indicador de si ya fue leída */
  notificacionesConEstado = computed(() => {
    const vistas = new Set(this.vistasIds());
    return this.capacitaciones().map((c) => ({
      ...c,
      leida: vistas.has(c.id),
    }));
  });

  private getStorageKey(): string | null {
    const u = this.auth.usuario();
    return u ? `sigice_notif_vistas_${u.id}` : null;
  }

  cargarVistasDesdeStorage() {
    const key = this.getStorageKey();
    if (!key) {
      this.vistasIds.set([]);
      return;
    }
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      this.vistasIds.set(Array.isArray(arr) ? arr : []);
    } catch {
      this.vistasIds.set([]);
    }
  }

  async cargar() {
    const u = this.auth.usuario();
    if (!u || u.rol !== 'ESTUDIANTE') {
      this.capacitaciones.set([]);
      this.vistasIds.set([]);
      return;
    }
    this.cargarVistasDesdeStorage();
    this.cargando.set(true);
    try {
      const res = await this.http.get<CapacitacionNotif[]>(`${this.api}/capacitaciones/mias`).toPromise();
      this.capacitaciones.set(res || []);
    } catch {
      this.capacitaciones.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  marcarComoVista(id: string) {
    const key = this.getStorageKey();
    const current = this.vistasIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      this.vistasIds.set(updated);
      if (key) {
        localStorage.setItem(key, JSON.stringify(updated));
      }
    }
  }

  marcarTodasComoVistas() {
    const key = this.getStorageKey();
    const allIds = this.capacitaciones().map((c) => c.id);
    this.vistasIds.set(allIds);
    if (key) {
      localStorage.setItem(key, JSON.stringify(allIds));
    }
  }
}
