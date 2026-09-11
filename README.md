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

# INFORMACIÓN DEL DESARROLLADOR

## ERP — Sistema de Gestión Empresarial

### Desarrollado por

**Axel Ruiz González**

---

## Acerca del proyecto

Este sistema ERP se encuentra actualmente en desarrollo y tiene como objetivo proporcionar una herramienta integral para la gestión y administración de diferentes procesos empresariales.

El proyecto continuará evolucionando mediante nuevas versiones, funcionalidades y mejoras. Entre las futuras implementaciones se contempla la integración con **bases de datos, APIs y servicios de red**, permitiendo ampliar sus capacidades y facilitar su utilización en diferentes entornos.

La versión actual corresponde a una etapa de desarrollo del proyecto y puede estar sujeta a cambios, mejoras, correcciones y modificaciones en futuras versiones.

---

## Autoría

**Autor y desarrollador:** Axel Ruiz González

El diseño, desarrollo, programación y evolución de este proyecto corresponden a su autor, salvo aquellos componentes, bibliotecas, frameworks o recursos de terceros que se encuentren identificados y estén sujetos a sus respectivas licencias.

Se solicita conservar los créditos de autoría cuando el sistema, su código fuente o partes sustanciales del proyecto sean utilizados, modificados, distribuidos o incorporados en otros proyectos.



---

## Derechos de autor

**© 2026 Axel Ruiz González. Todos los derechos reservados.**

El nombre del desarrollador, la estructura del proyecto, el código fuente original, la documentación, diseños y demás elementos desarrollados específicamente para este ERP pertenecen a su autor, salvo los componentes de terceros utilizados bajo sus respectivas licencias.

Queda prohibida la eliminación o alteración de los avisos de derechos de autor y de los créditos de autoría incluidos en el proyecto sin autorización del autor.

La utilización, modificación, distribución o incorporación del proyecto en otros sistemas deberá respetar las condiciones establecidas por el autor y las licencias correspondientes de los componentes de terceros.

---

## Reconocimiento de autoría

Cuando este sistema o una versión modificada sea utilizado en un proyecto, institución, empresa, demostración, publicación o producto derivado, se recomienda mantener una referencia visible al autor original:

**“Sistema desarrollado originalmente por Axel Ruiz González.”**

En caso de utilizar partes sustanciales del código fuente, se deberá conservar el aviso de derechos de autor correspondiente.

---

## Versionado

El proyecto utilizará un sistema de versiones para identificar su evolución y facilitar el seguimiento de cambios.

**Versión actual:** En desarrollo

Las futuras versiones podrán incorporar:

* Integración con bases de datos.
* Consumo y desarrollo de APIs.
* Funcionamiento mediante red.
* Nuevos módulos empresariales.
* Mejoras de seguridad.
* Optimización del rendimiento.
* Nuevas funcionalidades.
* Corrección de errores.
* Mejoras en la interfaz de usuario.

---

## Estado del proyecto

**Estado:** En desarrollo activo

Las funcionalidades disponibles pueden cambiar entre versiones. Algunas características pueden encontrarse en fase experimental y no representar todavía una versión final o estable del sistema.

---

## Componentes de terceros

Este proyecto puede utilizar herramientas, bibliotecas, frameworks, iconos, fuentes, recursos gráficos u otros componentes desarrollados por terceros.

Cada componente de terceros conserva sus respectivos derechos de autor y se encuentra sujeto a los términos y condiciones de su licencia correspondiente.

Los créditos y avisos de licencia de dichos componentes deberán mantenerse cuando así lo establezcan sus respectivas licencias.

---

## Uso de herramientas de Inteligencia Artificial

Durante el desarrollo de este proyecto se utilizaron herramientas de **Inteligencia Artificial (IA)** como apoyo en determinadas áreas del proceso de desarrollo.

La IA fue utilizada como una herramienta de asistencia para actividades como:

* Generación y revisión de código.
* Identificación y corrección de errores.
* Propuesta de soluciones técnicas.
* Optimización de determinadas funciones.
* Apoyo en la documentación del proyecto.
* Generación y mejora de estructuras, interfaces o componentes.
* Consulta y explicación de conceptos relacionados con las tecnologías utilizadas.

El uso de herramientas de Inteligencia Artificial **no implica que la totalidad del proyecto haya sido generada automáticamente**. El desarrollo, integración, revisión, modificación, pruebas y toma de decisiones sobre el funcionamiento del sistema corresponden al desarrollador.

Todo contenido generado mediante IA fue revisado y, cuando fue necesario, modificado, adaptado o integrado de acuerdo con las necesidades específicas del proyecto.

### Transparencia sobre el uso de IA

Este proyecto reconoce de manera transparente el uso de herramientas de Inteligencia Artificial como recurso de apoyo durante su desarrollo.

La autoría del proyecto, su integración general, decisiones de diseño, implementación y evolución corresponden a:

**Axel Ruiz González**

© 2026 Axel Ruiz González. Todos los derechos reservados.

### Alcance del uso de IA

La utilización de IA se limita a funciones de asistencia y apoyo al desarrollo. No se pretende atribuir a la Inteligencia Artificial la autoría del proyecto completo ni de las decisiones tomadas durante su creación.

Las herramientas de IA utilizadas pueden variar entre versiones del proyecto y podrán ser especificadas en la documentación correspondiente cuando resulte necesario.


## Aviso de uso

Este software se proporciona como un proyecto en desarrollo. El autor podrá modificar, actualizar, ampliar, reemplazar o retirar funcionalidades en futuras versiones.

El uso del sistema deberá realizarse respetando los derechos de autor del proyecto y las licencias de los componentes externos utilizados.

---

## Contacto del desarrollador

**Desarrollador:** Axel Ruiz González
**Proyecto:** ERP — Sistema de Gestión Empresarial
**Año:** 2026
**Estado:** En desarrollo

---

### Aviso de propiedad intelectual

**© 2026 Axel Ruiz González. Todos los derechos reservados.**

Este aviso forma parte del proyecto y deberá conservarse en las versiones, copias o modificaciones que incluyan el código fuente original, salvo que exista autorización expresa del autor o que una licencia aplicable establezca condiciones diferentes.

