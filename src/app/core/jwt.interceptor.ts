import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { leerToken, limpiarToken } from './token-storage';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = leerToken();
  if (token && req.url.includes('/api/')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error) => {
      const status = error?.status;
      if (status === 401 && token && !req.url.includes('/auth/login')) {
        limpiarToken();
        const router = inject(Router);
        if (!router.url.startsWith('/auth')) void router.navigate(['/auth/login']);
      }
      if (status === 403 && !req.url.includes('/uploads/')) {
        inject(MatSnackBar).open('No tienes permisos para esta acción.', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-error',
        });
      }
      return throwError(() => error);
    }),
  );
};
