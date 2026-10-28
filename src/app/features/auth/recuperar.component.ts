import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-recuperar',
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
    .pie { text-align: center; margin-top: var(--esp-4); font-size: var(--t-secundario); }
    .pie a { color: var(--azul-700); font-weight: 700; }
    .exito { display: flex; gap: var(--esp-2); align-items: flex-start; background: var(--verde-100); color: var(--verde-900);
      border-radius: var(--radio-m); padding: var(--esp-3) var(--esp-4); font-size: var(--t-secundario); }
  `],
  template: `
    <div class="fondo">
      <mat-card class="tarjeta">
        <mat-card-content>
          <img class="logo" src="assets/logo.jpg" alt="Escudo de la Universidad del Pacífico" />
          <h1>Recuperar contraseña</h1>
          <p class="sub">Te enviaremos un código válido por 1 hora</p>
          @if (enviado()) {
            <p class="exito" role="status">
              <span class="material-symbols-outlined" aria-hidden="true">mark_email_read</span>
              <span>{{ mensaje() }} Revisa tu bandeja y también el spam.</span>
            </p>
            <p class="pie"><a routerLink="/auth/login">Volver al ingreso</a></p>
          } @else {
            <form [formGroup]="form" (ngSubmit)="enviar()">
              <mat-form-field class="full-width"><mat-label>Correo institucional</mat-label>
                <input matInput formControlName="correo" type="email" autocomplete="username" placeholder="usuario@gmail.com" />
                @if (form.controls.correo.invalid && form.controls.correo.touched) { <mat-error>Escribe un correo válido</mat-error> }
              </mat-form-field>
              @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
              <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid || cargando()">
                {{ cargando() ? 'Enviando…' : 'Enviar código' }}
              </button>
            </form>
            <p class="pie"><a routerLink="/auth/login">Volver al ingreso</a></p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class RecuperarComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  error = signal('');
  mensaje = signal('');
  cargando = signal(false);
  enviado = signal(false);
  form = this.fb.group({ correo: ['', [Validators.required, Validators.email]] });

  async enviar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      const r = await this.auth.solicitarRecuperacion(this.form.value.correo!);
      this.mensaje.set(r?.mensaje || 'Revisa tu correo.');
      this.enviado.set(true);
    } catch {
      this.error.set('No se pudo procesar la solicitud. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
