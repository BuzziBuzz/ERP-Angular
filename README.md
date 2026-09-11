# ERP Drinks

ERP local para un negocio de bebidas y alimentos, hecho con Angular 22 (standalone, zoneless).
Todos los datos se guardan en el `localStorage` del navegador: no hay backend ni base de datos.

## Arrancar

```bash
npm install
npm start
```

Abre `http://localhost:4200/`.

## Navegación

La barra de búsqueda ocupa todo el centro de la cabecera y funciona en vivo: filtra la lista del
módulo que estés viendo (productos, ventas, órdenes, movimientos, empleados). El botón de **3 puntos**
a la derecha abre el menú de módulos, con contadores de carrito, stock bajo y compras pendientes.

| Módulo | Ruta | Qué hace |
| --- | --- | --- |
| Panel | `/` | KPIs del negocio, alertas, últimos movimientos y respaldo de datos |
| Ventas | `/ventas` | Punto de venta, cobro con IVA e historial con cancelación |
| Catálogo | `/catalogo` | Productos por categoría, agregar al carrito |
| Stock | `/stock` | Existencias, costos, margen, alta y baja de productos |
| Compras | `/compras` | Órdenes a proveedores y recepción de mercancía |
| Finanzas | `/finanzas` | Ingresos, egresos, utilidad y gastos manuales |
| Nóminas | `/nominas` | Padrón de empleados y generación de nómina mensual |

## Cómo se conectan los módulos

Los módulos no son pantallas sueltas: comparten un solo estado (`src/app/core/erp-store.ts`).

- **Cobrar una venta** descuenta stock y registra un ingreso en finanzas.
- **Cancelar una venta** devuelve el stock y registra el egreso que la contrarresta.
- **Recibir una orden de compra** suma stock, actualiza el costo del producto y registra un egreso.
- **Generar una nómina** registra el egreso del periodo (una nómina por periodo).
- Los movimientos generados por otros módulos no se pueden borrar a mano: se revierte el documento origen.

## Estructura

```
src/app/
  core/       estado (ErpStore), modelos, almacenamiento local, avisos, pipes
  data/       datos iniciales (productos, categorías, empleados, proveedores)
  paginas/    un componente por módulo, cargado con lazy loading
  search/     barra de búsqueda global + menú de 3 puntos
  sidebar/    filtro de categorías del catálogo
  galeria/    tarjetas de producto
  avisos/     mensajes emergentes de resultado
```

## Datos

- Se guardan bajo las claves `erp.*` del `localStorage` de cada navegador.
- Desde el Panel puedes **exportar** un respaldo JSON, **restaurarlo** y **reiniciar** a los datos de ejemplo.
- El renderizado es del lado del cliente (`RenderMode.Client`) porque `localStorage` solo existe en el
  navegador; así el HTML del servidor nunca discrepa de los datos reales.

> El ISR y el IMSS de la nómina se estiman con tasas fijas por tramo para presupuestar el costo.
> No sustituyen el cálculo fiscal oficial: valida los importes con tu contador.

## Pruebas

```bash
npm test
```

Cubren la lógica de negocio del store (ventas, compras, nóminas, inventario, persistencia) y los
componentes de búsqueda, catálogo y categorías.
