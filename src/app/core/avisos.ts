import { Injectable, signal } from '@angular/core';
import { Resultado } from './models';

export interface Aviso {
  id: number;
  texto: string;
  ok: boolean;
}

/** Cola de mensajes emergentes para dar respuesta a cada acción del usuario. */
@Injectable({ providedIn: 'root' })
export class Avisos {
  readonly lista = signal<Aviso[]>([]);
  private contador = 0;

  /** Muestra el resultado de una operación y lo devuelve por si hace falta encadenar. */
  mostrar(resultado: Resultado): Resultado {
    const aviso: Aviso = { id: ++this.contador, texto: resultado.mensaje, ok: resultado.ok };
    this.lista.update((lista) => [...lista, aviso]);
    setTimeout(() => this.cerrar(aviso.id), resultado.ok ? 3500 : 5500);
    return resultado;
  }

  cerrar(id: number): void {
    this.lista.update((lista) => lista.filter((a) => a.id !== id));
  }
}
