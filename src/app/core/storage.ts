import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Acceso a localStorage tolerante a fallos y seguro en SSR:
 * en el servidor (o si el navegador bloquea el almacenamiento) devuelve
 * el valor por defecto en vez de reventar.
 */
@Injectable({ providedIn: 'root' })
export class Almacenamiento {
  readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  leer<T>(clave: string, porDefecto: T): T {
    if (!this.esNavegador) return porDefecto;
    try {
      const crudo = localStorage.getItem(clave);
      if (crudo === null) return porDefecto;
      return JSON.parse(crudo) as T;
    } catch {
      return porDefecto;
    }
  }

  escribir(clave: string, valor: unknown): void {
    if (!this.esNavegador) return;
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // Cuota llena o almacenamiento deshabilitado: la app sigue funcionando en memoria.
    }
  }

  borrar(claves: string[]): void {
    if (!this.esNavegador) return;
    for (const clave of claves) {
      try {
        localStorage.removeItem(clave);
      } catch {
        // Ignorado a propósito.
      }
    }
  }
}
