const isLocalDev =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  window.location.port === '4200';

export const environment = {
  production: !isLocalDev,
  apiUrl: isLocalDev ? 'http://localhost:3000/api' : 'https://proyectogtbackend-production.up.railway.app/api',
};
