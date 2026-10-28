import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { guardarToken, leerToken, limpiarToken, limpiarTokenLegado } from './token-storage';
import { cifrarLogin, LoginCryptoParameters } from './login-crypto';

export interface SsoExchange {
  necesitaCompletar: boolean;
  access_token?: string;
  temp?: string;
}

export interface Usuario {
  id: string;
  correo: string;
  nombre: string;
  semestre: number;
  rol: 'ESTUDIANTE' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = `${environment.apiUrl}/auth`;

  token = signal<string | null>(leerToken());
  usuario = signal<Usuario | null>(null);
  logueado = computed(() => !!this.token());
  esAdmin = computed(() => this.usuario()?.rol === 'ADMIN');

  private perfilEnCurso: Promise<void> | null = null;

  constructor() {
    limpiarTokenLegado();
  }

  cargarPerfil(): Promise<void> {
    if (!this.token()) return Promise.resolve();
    // Reutiliza la petición en curso (authGuard y roleGuard corren en paralelo).
    this.perfilEnCurso ??= (async () => {
      try {
        const u = await this.http.get<Usuario>(`${this.base}/me`).toPromise();
        if (u) this.usuario.set(u);
      } catch {
        this.salir(false);
      } finally {
        this.perfilEnCurso = null;
      }
    })();
    return this.perfilEnCurso;
  }

  guardarSesion(access_token: string) {
    guardarToken(access_token);
    this.token.set(access_token);
  }

  async ingresar(correo: string, password: string) {
    const parameters = await this.http
      .get<LoginCryptoParameters>(`${this.base}/login-crypto`)
      .toPromise();
    if (!parameters) throw new Error('No se pudieron obtener los parámetros de cifrado');
    const envelope = await cifrarLogin({ correo, password }, parameters);
    const r = await this.http.post<{ access_token: string }>(`${this.base}/login`, envelope).toPromise();
    this.guardarSesion(r!.access_token);
    await this.cargarPerfil();
  }

  solicitarRecuperacion(correo: string) {
    return this.http.post<{ mensaje: string }>(`${this.base}/recuperar`, { correo }).toPromise();
  }

  restablecerClave(token: string, password: string) {
    return this.http.post<{ mensaje: string }>(`${this.base}/restablecer`, { token, password }).toPromise();
  }

  salir(redirigir = true) {
    limpiarToken();
    this.limpiarTempSso();
    this.token.set(null);
    this.usuario.set(null);
    if (redirigir) this.router.navigate(['/auth/login']);
  }

  intercambiarSso() {
    return this.http
      .post<SsoExchange>(`${this.base}/sso/exchange`, {}, { withCredentials: true })
      .toPromise()
      .then((r) => r!);
  }

  guardarTempSso(temp: string) {
    this.tempSso = temp;
  }

  leerTempSso() {
    return this.tempSso;
  }

  limpiarTempSso() {
    this.tempSso = null;
  }

  ssoStatus() {
    return this.http.get<{ enabled: boolean }>(`${this.base}/sso-status`).toPromise();
  }

  actualizarSemestre(semestre: number) {
    return this.http.patch<Usuario>(`${this.base}/mi-semestre`, { semestre }).toPromise().then((u) => {
      if (u) this.usuario.set(u);
      return u;
    });
  }

  completarSso(temp: string, semestre: number, aceptoDatos: boolean) {
    return this.http
      .post<{ access_token: string }>(`${this.base}/sso/completar`, { temp, semestre, aceptoDatos })
      .toPromise()
      .then((r) => {
        this.guardarSesion(r!.access_token);
        this.limpiarTempSso();
        return this.cargarPerfil();
      });
  }

  private tempSso: string | null = null;
}
