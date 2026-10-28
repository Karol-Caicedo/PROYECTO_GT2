import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-sso-callback',
  standalone: true,
  imports: [CommonModule],
  template: `<p style="padding:24px">Validando tu cuenta institucional…</p>`,
})
export class SsoCallbackComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  async ngOnInit() {
    try {
      const r = await this.auth.intercambiarSso();
      if (r.necesitaCompletar && r.temp) {
        this.auth.guardarTempSso(r.temp);
        await this.router.navigate(['/auth/sso-completar']);
        return;
      }
      if (!r.access_token) {
        await this.router.navigate(['/auth/login']);
        return;
      }
      this.auth.guardarSesion(r.access_token);
      await this.auth.cargarPerfil();
      const u = this.auth.usuario();
      await this.router.navigate([u?.rol === 'ADMIN' ? '/admin/dashboard' : '/encuesta']);
    } catch {
      await this.router.navigate(['/auth/login']);
    }
  }
}
