import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * El ERP guarda todo en localStorage, que solo existe en el navegador.
 * Se renderiza en cliente para que no haya diferencias entre el HTML del
 * servidor y los datos reales del usuario.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
