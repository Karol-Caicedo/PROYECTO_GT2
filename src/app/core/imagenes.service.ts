import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImagenesService {
  private readonly http = inject(HttpClient);

  resolver(url: string): string {
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    if (url.startsWith('/api/')) {
      const base = environment.apiUrl.replace(/\/api\/?$/, '');
      return `${base}${url}`;
    }
    return url;
  }

  obtenerBlob(url: string) {
    return this.http.get(this.resolver(url), { responseType: 'blob' });
  }

  async abrir(url: string): Promise<void> {
    const blob = await firstValueFrom(this.obtenerBlob(url));
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }
}
