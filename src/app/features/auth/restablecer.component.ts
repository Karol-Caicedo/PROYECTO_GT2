import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

function clavesIguales(control: AbstractControl): ValidationErrors | null {
  const grupo = control as { value?: { password?: string; password2?: string } };
  if (!grupo.value) return null;
  return grupo.value.password === grupo.value.password2 ? null : { distintas: true };
}

@Component({
  selector: 'app-restablecer',
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
          <h1>Nueva contraseña</h1>
          <p class="sub">Ingresa el código de tu correo. Vence en 1 hora y solo sirve una vez.</p>
          @if (listo()) {
            <p class="exito" role="status">
              <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
              <span>{{ mensaje() }}</span>
            </p>
            <p class="pie"><a routerLink="/auth/login">Ingresar con mi nueva clave</a></p>
          } @else {
            <form [formGroup]="form" (ngSubmit)="enviar()">
              <mat-form-field class="full-width"><mat-label>Código de recuperación</mat-label>
                <input matInput formControlName="token" autocomplete="off" autocapitalize="off" spellcheck="false" />
                @if (form.controls.token.invalid && form.controls.token.touched) { <mat-error>Ingresa el código recibido por correo</mat-error> }
              </mat-form-field>
              <mat-form-field class="full-width"><mat-label>Nueva contraseña (mínimo 8 caracteres)</mat-label>
                <input matInput formControlName="password" type="password" autocomplete="new-password" />
                @if (form.controls.password.invalid && form.controls.password.touched) { <mat-error>Mínimo 8 caracteres</mat-error> }
              </mat-form-field>
              <mat-form-field class="full-width"><mat-label>Confirma la contraseña</mat-label>
                <input matInput formControlName="password2" type="password" autocomplete="new-password" />
                @if (form.hasError('distintas') && form.controls.password2.touched) { <mat-error>Las contraseñas no coinciden</mat-error> }
              </mat-form-field>
              @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
              <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid || cargando()">
                {{ cargando() ? 'Guardando…' : 'Guardar nueva contraseña' }}
              </button>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class RestablecerComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  error = signal('');
  mensaje = signal('');
  cargando = signal(false);
  listo = signal(false);
  form = this.fb.group(
    {
      token: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password2: ['', Validators.required],
    },
    { validators: clavesIguales },
  );

  async enviar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      const r = await this.auth.restablecerClave(this.form.value.token!, this.form.value.password!);
      this.mensaje.set(r?.mensaje || 'Contraseña actualizada.');
      this.listo.set(true);
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(typeof msg === 'string' ? msg : 'No se pudo restablecer. Solicita un código nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
