const TOKEN_KEY = 'token';
let memoria: string | null = null;

/** El token se limita a la pestaña actual y nunca se escribe en localStorage. */
export function leerToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? memoria;
  } catch {
    return memoria;
  }
}

export function guardarToken(token: string): void {
  memoria = token;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Sin sessionStorage la sesión sigue en memoria a través de AuthService.
  }
}

export function limpiarToken(): void {
  memoria = null;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
}

/** Elimina la copia legada; no se migra para forzar una sesión nueva. */
export function limpiarTokenLegado(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // noop
  }
}
