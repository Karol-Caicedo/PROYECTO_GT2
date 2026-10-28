import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rol = route.data?.['rol'] as string | undefined;
  // Los guards se ejecutan en paralelo: al refrescar la página el perfil aún no
  // está cargado, así que se espera antes de validar el rol.
  if (rol && !auth.usuario()) await auth.cargarPerfil();
  if (rol && auth.usuario()?.rol !== rol) {
    return router.createUrlTree([auth.token() ? '/encuesta' : '/auth/login']);
  }
  return true;
};
