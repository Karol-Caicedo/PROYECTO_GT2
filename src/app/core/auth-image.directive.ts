import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ImagenesService } from './imagenes.service';

@Directive({
  selector: 'img[appAuthImage]',
  standalone: true,
})
export class AuthImageDirective implements OnChanges, OnDestroy {
  @Input('appAuthImage') url?: string | null;

  private readonly el = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly imagenes = inject(ImagenesService);
  private sub?: Subscription;
  private objectUrl?: string;

  ngOnChanges() {
    this.limpiar();
    if (!this.url) {
      this.el.nativeElement.removeAttribute('src');
      return;
    }
    this.sub = this.imagenes.obtenerBlob(this.url).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.el.nativeElement.src = this.objectUrl;
        this.el.nativeElement.classList.remove('img-no-disponible');
      },
      error: () => {
        this.el.nativeElement.removeAttribute('src');
        this.el.nativeElement.classList.add('img-no-disponible');
      },
    });
  }

  ngOnDestroy() {
    this.limpiar();
  }

  private limpiar() {
    this.sub?.unsubscribe();
    this.sub = undefined;
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }
}
