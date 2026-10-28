import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-sso-completar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule, MatButtonModule],
  styles: [`
    .fondo { min-height: calc(100vh - 65px); display: grid; place-items: center; padding: var(--esp-6) var(--esp-2);
      background: radial-gradient(600px 300px at 50% 0%, var(--verde-50), transparent 70%), var(--azul-50); }
    .tarjeta.mat-mdc-card { width: 100%; max-width: 520px; padding: var(--esp-4); background: var(--superficie); }
    .logo { display: block; height: 76px; width: auto; max-width: 100%; margin: 0 auto var(--esp-2); }
    h1 { font-size: var(--t-titulo-md); color: var(--azul-900); text-align: center; margin: 0; }
    .sub { text-align: center; color: var(--texto-secundario); font-size: var(--t-secundario); margin: var(--esp-1) 0 var(--esp-5); }
    .consentimiento { font-size: var(--t-secundario); }
  `],
  template: `
    <div class="fondo">
      <mat-card class="tarjeta">
        <mat-card-content>
          <img class="logo" src="assets/logo.jpg" alt="Escudo de la Universidad del Pacífico" />
          <h1>Completa tu registro institucional</h1>
          <p class="sub">Ingresaste con tu cuenta institucional. Confirma tu semestre y autoriza el tratamiento de datos (Ley 1581 de 2012).</p>
          <form [formGroup]="form" (ngSubmit)="completar()">
            <mat-form-field class="full-width"><mat-label>Semestre actual</mat-label>
              <mat-select formControlName="semestre">
                @for (s of [1,2,3,4,5,6,7,8,9]; track s) { <mat-option [value]="s">Semestre {{ s }}</mat-option> }
              </mat-select></mat-form-field>
            <p class="consentimiento"><mat-checkbox formControlName="aceptoDatos">Autorizo el tratamiento de mis datos personales.</mat-checkbox></p>
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button mat-raised-button color="primary" class="full-width" [disabled]="form.invalid">Continuar</button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class SsoCompletarComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  error = signal('');
  temp = this.auth.leerTempSso() ?? '';
  form = this.fb.group({ semestre: [1, [Validators.required, Validators.min(1), Validators.max(9)]], aceptoDatos: [false, Validators.requiredTrue] });

  constructor() {
    if (!this.temp) this.router.navigate(['/auth/login']);
  }

  ngOnDestroy() {
    this.auth.limpiarTempSso();
  }

  async completar() {
    try {
      await this.auth.completarSso(this.temp, Number(this.form.value.semestre!), !!this.form.value.aceptoDatos);
      this.router.navigate(['/encuesta']);
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string } })?.error?.message;
      this.error.set(typeof msg === 'string' ? msg : 'No se pudo completar el registro');
    }
  }
}
