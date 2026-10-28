import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  styles: [`
    .fondo { min-height: calc(100vh - 65px); display: grid; place-items: center; padding: var(--esp-6) var(--esp-2);
      background:
        linear-gradient(color-mix(in srgb, var(--azul-900) 62%, transparent), color-mix(in srgb, var(--azul-900) 42%, transparent)),
        url('/assets/fondo.jpeg') center / cover no-repeat;
    }
    .tarjeta.mat-mdc-card { width: 100%; max-width: 460px; padding: var(--esp-4); background: var(--superficie); }
    .logo { display: block; height: 84px; width: auto; max-width: 100%; margin: 0 auto var(--esp-2); }
    h1 { font-size: var(--t-titulo-md); color: var(--azul-900); text-align: center; margin: 0; }
    .sub { text-align: center; color: var(--texto-secundario); font-size: var(--t-secundario); margin: var(--esp-1) 0 var(--esp-5); }
    .divisor { display: flex; align-items: center; gap: var(--esp-2); color: var(--texto-secundario); font-size: var(--t-secundario); margin: var(--esp-4) 0; }
    .divisor::before, .divisor::after { content: ''; flex: 1; border-top: 1px solid var(--borde); }
    .sso { display: flex; gap: var(--esp-2); flex-wrap: wrap; }
    .sso a { flex: 1 1 140px; }
    .pie { text-align: center; margin-top: var(--esp-4); font-size: var(--t-secundario); }
    .pie a { color: var(--azul-700); font-weight: 700; }
    .formulario-login { display: flex; flex-direction: column; align-items: center; width: 100%; gap: var(--esp-3); }
    .campo-grupo { width: 100%; display: flex; flex-direction: column; }
    .etiqueta-campo { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--azul-900); margin-bottom: 6px; }
    .campo-contenedor {
      display: flex; align-items: center; gap: var(--esp-2); width: 100%;
      background: var(--superficie); border: 1.5px solid var(--borde); border-radius: 14px;
      padding: 0 var(--esp-3); height: 48px; box-sizing: border-box; overflow: hidden;
      transition: border-color var(--transicion-rapida), box-shadow var(--transicion-rapida);
    }
    .campo-contenedor:focus-within {
      border-color: var(--azul-500);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--azul-500) 25%, transparent), 0 0 10px color-mix(in srgb, var(--azul-500) 20%, transparent);
    }
    .campo-contenedor.con-error { border-color: var(--error); }
    .icono-campo { color: var(--texto-secundario); font-size: 20px; flex-shrink: 0; user-select: none; }
    .campo-contenedor:focus-within .icono-campo { color: var(--azul-500); }
    .input-campo {
      flex: 1; width: 100%; height: 100%; border: none; outline: none; background: transparent;
      color: var(--texto); font-family: inherit; font-size: 14px;
    }
    .input-campo:-webkit-autofill,
    .input-campo:-webkit-autofill:hover,
    .input-campo:-webkit-autofill:focus,
    .input-campo:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px var(--superficie) inset !important;
      box-shadow: 0 0 0 1000px var(--superficie) inset !important;
      -webkit-text-fill-color: var(--texto) !important;
      caret-color: var(--texto) !important;
      transition: background-color 600000s ease-in-out 0s, color 600000s ease-in-out 0s !important;
    }
    .input-campo::placeholder { color: var(--texto-secundario); opacity: 0.65; }
    .error-texto { color: var(--error); font-size: 12px; margin-top: 4px; font-weight: 500; }
    .olvido-enlace {
      align-self: flex-end;
      margin-top: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--azul-700);
      text-decoration: none;
      transition: color var(--transicion-rapida);
    }
    .olvido-enlace:hover {
      color: var(--azul-500);
      text-decoration: underline;
    }
    .btn-ingresar {
      background: #f59e0b; color: var(--azul-900); font-family: inherit; font-weight: 700;
      font-size: 15px; letter-spacing: 0.02em; border: none; border-radius: 14px;
      padding: 10px 32px; min-width: 150px; max-width: 190px; cursor: pointer;
      margin-top: var(--esp-2); box-shadow: 0 2px 6px rgba(245, 158, 11, 0.35);
      transition: background var(--transicion-rapida), transform var(--transicion-rapida), box-shadow var(--transicion-rapida);
    }
    .btn-ingresar:hover:not(:disabled) {
      background: #d97706; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
    }
    .btn-ingresar:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  `],
  template: `
    <div class="fondo">
      <mat-card class="tarjeta">
        <mat-card-content>
          <img class="logo" src="assets/logo.jpg" alt="Escudo de la Universidad del Pacífico" />
          <h1>SIGICE</h1>
          <p class="sub">Ingeniería de Sistemas · Proyección Social</p>
          <form [formGroup]="form" (ngSubmit)="entrar()" class="formulario-login">
            <div class="campo-grupo">
              <label for="campo-correo" class="etiqueta-campo">Correo institucional</label>
              <div class="campo-contenedor" [class.con-error]="form.controls.correo.invalid && form.controls.correo.touched">
                <span class="material-symbols-outlined icono-campo" aria-hidden="true">person</span>
                <input
                  id="campo-correo"
                  formControlName="correo"
                  type="email"
                  autocomplete="username"
                  placeholder="ej. usuario@unipacifico.edu.co"
                  class="input-campo"
                />
              </div>
              @if (form.controls.correo.invalid && form.controls.correo.touched) {
                <span class="error-texto">Escribe un correo válido</span>
              }
            </div>

            <div class="campo-grupo">
              <label for="campo-password" class="etiqueta-campo">Contraseña</label>
              <div class="campo-contenedor" [class.con-error]="form.controls.password.invalid && form.controls.password.touched">
                <span class="material-symbols-outlined icono-campo" aria-hidden="true">lock</span>
                <input
                  id="campo-password"
                  formControlName="password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="input-campo"
                />
              </div>
              @if (form.controls.password.invalid && form.controls.password.touched) {
                <span class="error-texto">Escribe tu contraseña</span>
              }
              <a routerLink="/auth/recuperar" class="olvido-enlace">¿Olvidaste tu contraseña?</a>
            </div>

            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

            <button type="submit" class="btn-ingresar" [disabled]="form.invalid || cargando()">
              {{ cargando() ? 'Ingresando…' : 'Ingresar' }}
            </button>
          </form>
          @if (sso()) {
            <div class="divisor" aria-hidden="true">o continúa con tu cuenta institucional</div>
            <div class="sso">
              <a mat-stroked-button color="primary" [href]="api + '/auth/google'">Google</a>
              <a mat-stroked-button color="primary" [href]="api + '/auth/microsoft'">Microsoft</a>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  api = environment.apiUrl;
  error = signal('');
  cargando = signal(false);
  sso = signal(false);
  form = this.fb.group({ correo: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });

  async ngOnInit() {
    try {
      sessionStorage.removeItem('sigice_login_draft');
    } catch { /* almacenamiento no disponible */ }

    try {
      const s = await this.auth.ssoStatus();
      this.sso.set(!!s?.enabled);
    } catch { /* SSO apagado */ }
  }

  async entrar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.auth.ingresar(this.form.value.correo!, this.form.value.password!);
      const u = this.auth.usuario();
      this.router.navigate([u?.rol === 'ADMIN' ? '/admin/dashboard' : '/encuesta']);
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.status === 401) {
        this.error.set('Usuario o contraseña no encontrados');
        return;
      }

      const msg = (e as { error?: { message?: string } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(', ') : msg || 'Credenciales inválidas');
    } finally {
      this.cargando.set(false);
    }
  }
}
