import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface Miga { texto: string; ruta?: string }

/** Encabezado de página: miga de pan + título + subtítulo + acciones. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    :host {
      display: block;
      margin-bottom: var(--esp-5);
    }
  `],
  template: `
    @if (miga.length) {
      <nav class="miga" aria-label="Miga de pan">
        @for (m of miga; track m.texto; let last = $last) {
          @if (m.ruta && !last) { <a [routerLink]="m.ruta">{{ m.texto }}</a><span aria-hidden="true">/</span> }
          @else { <span [attr.aria-current]="last ? 'page' : null">{{ m.texto }}</span>@if (!last) { <span aria-hidden="true">/</span> } }
        }
      </nav>
    }
    <div class="cabecera-pagina">
      <div>
        <h1 class="titulo-pagina">{{ titulo }}</h1>
        @if (subtitulo) { <p class="texto-secundario">{{ subtitulo }}</p> }
      </div>
      <div class="acciones"><ng-content /></div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() miga: Miga[] = [];
}
