import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token()) {
    router.navigate(['/auth/login']);
    return false;
  }
  if (!auth.usuario()) await auth.cargarPerfil();
  if (!auth.token()) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};
