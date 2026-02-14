# Análisis de funcionamiento del código

## Visión general
La aplicación es un formulario web estático para inspección de puentes, compuesto por:

- `index.html`: estructura completa del formulario y carga de estilos/scripts.
- `css/*.css`: estilos base, layout, componentes y responsive.
- `js/*.js`: lógica de inicialización, geolocalización, campos dinámicos, evaluación de severidad y envío de datos.

No hay backend propio en el repositorio: el envío final se realiza vía `fetch` a un endpoint de Google Apps Script en modo `no-cors`.

## Flujo funcional de extremo a extremo
1. **Carga inicial**
   - Al cargar el DOM, se fija automáticamente la fecha de inspección al día actual y se establece ese mismo día como máximo permitido.
2. **Captura de datos del formulario**
   - El usuario completa datos generales, características del puente, evaluación de defectos y acciones recomendadas.
3. **Apoyo de UX durante el llenado**
   - Geolocalización para autocompletar latitud/longitud.
   - Previsualización de fotos cargadas.
   - Mostrar/ocultar campos de texto cuando se selecciona "Otro".
   - Clasificación pre/post-código automáticamente según año de construcción.
   - Visualización condicional de sección de fundación cuando corresponde.
4. **Evaluación técnica automática**
   - Al marcar defectos y asignar severidad (1–5), se calcula el mínimo por categoría (superestructura, subestructura, cauce) y luego la calificación general (mínimo de las tres).
   - Con la calificación general (y validación específica de socavación) se determina prioridad y estado global.
5. **Envío de reporte**
   - Al enviar, se bloquea el botón para prevenir duplicados, se arma `formData`, se envía al Apps Script y luego se resetea el formulario y los resultados visuales.

## Lógica clave por módulo JavaScript

### `js/init.js`
- Establece fecha por defecto y máxima para `fechaInspeccion` al cargar el DOM.

### `js/geolocation.js`
- `obtenerUbicacion()` usa `navigator.geolocation.getCurrentPosition`.
- Si tiene éxito, escribe latitud/longitud con 6 decimales.
- Si falla o no está disponible, notifica mediante `alert`.

### `js/dynamic-fields.js`
- `previewPhoto(id)`: renderiza una miniatura de la imagen seleccionada usando `FileReader`.
- `mostrarCampoOtro(selectId, divId)`: alterna clase `hidden` cuando la selección es `Otro`.
- Listener en `anioConstruccion`: establece `codigoPrePost` como `PRE-CÓDIGO` (<2011) o `POST-CÓDIGO` (>=2011).
- `actualizarVisibilidadFundacion()`: oculta sección de fundación y muestra alerta cuando `tipoFundacion` es `No visible`.

### `js/evaluation.js`
- `toggleSeverityScale(id)`: activa/desactiva la escala de severidad por defecto observado.
- `selectSeverity(id, level)`: marca el botón de severidad seleccionado y guarda valor oculto.
- `calcularCalificaciones()`:
  - Define listas de ítems por categoría.
  - Obtiene el mínimo de cada grupo con `calcularMinimo`.
  - Calcula `califGeneral` como mínimo global.
  - Asigna prioridad (`ALTA`, `MEDIA`, `BAJA`) y estado (`D`, `C`, `B`, `A`) con reglas explícitas.
  - Aplica clases visuales para resaltar resultado.
- `calcularMinimo(arrayIds)`: evalúa solo ítems marcados con severidad seleccionada.

### `js/submit.js`
- Intercepta `submit`, evita recarga y deshabilita botón temporalmente.
- Construye `formData` con campos esenciales y resultados calculados.
- Envía por `fetch` (`POST`, `no-cors`) al Apps Script.
- En éxito: notifica, reinicia formulario y limpia panel de resultados.
- En error: muestra alerta y reactiva botón.

## Fortalezas observadas
- Separación modular de responsabilidades JavaScript.
- Cálculo automático de condición/criticidad que reduce subjetividad operativa.
- Mecanismo de bloqueo del botón para disminuir dobles envíos.
- Soporte explícito para captura geográfica y evidencia fotográfica.

## Riesgos y oportunidades de mejora
- Uso de `alert` para UX: funcional pero invasivo en campo.
- `selectSeverity` depende de `event` implícito global; convendría recibir el evento por parámetro para mayor compatibilidad.
- `no-cors` impide validar respuesta real del backend; se asume éxito si no hay error de red.
- Validación de datos del lado cliente puede reforzarse (rangos, consistencia entre campos, obligatoriedad contextual).
- La lógica de negocio está completamente en frontend; sería recomendable auditar/replicar reglas en backend para trazabilidad.

## Mejoras funcionales recomendadas (priorizadas)

### 1) Confirmación real de envío (prioridad alta)
**Qué implementar**
- Cambiar integración de `fetch` para recibir respuesta explícita del backend (JSON con `ok`, `id_reporte`, `timestamp`).
- Eliminar dependencia de `no-cors` para poder validar `response.ok` y cuerpo de respuesta.

**Beneficio funcional**
- El inspector sabrá si el reporte se guardó realmente.
- Se pueden mostrar errores de validación del servidor en vez de asumir éxito.

### 2) Guardado local automático y recuperación de borrador (prioridad alta)
**Qué implementar**
- Guardar automáticamente el estado del formulario en `localStorage` cada cierto intervalo o al cambiar campos.
- Al recargar la página, ofrecer restaurar borrador.

**Beneficio funcional**
- Evita pérdida de información por cierres accidentales, batería o señal inestable.
- Muy útil en inspecciones en campo.

### 3) Evidencia fotográfica múltiple con compresión (prioridad alta)
**Qué implementar**
- Permitir varias fotos por componente crítico (superestructura, subestructura, cauce).
- Comprimir imágenes en cliente antes de enviar (resolución/calidad configurable).
- Asociar cada foto a componente + comentario corto.

**Beneficio funcional**
- Mejora trazabilidad técnica y reduce consumo de datos móviles.
- Facilita auditoría posterior por equipo técnico.

### 4) Validaciones técnicas de consistencia (prioridad alta)
**Qué implementar**
- Validar rangos geográficos plausibles para RD (latitud/longitud).
- Exigir severidad si un defecto está marcado.
- Reglas de obligatoriedad condicional (ej.: si estado global es crítico, requerir riesgo identificado y acción urgente).

**Beneficio funcional**
- Aumenta calidad del dato y reduce reportes incompletos o incoherentes.

### 5) Historial y edición de inspecciones (prioridad media)
**Qué implementar**
- Registrar `id` de inspección y permitir abrir/editar registros previos.
- Mostrar evolución por puente (última inspección vs actual).

**Beneficio funcional**
- Habilita seguimiento de deterioro y planificación de mantenimiento basada en tendencia.

### 6) Reporte automático en PDF (prioridad media)
**Qué implementar**
- Generar PDF con datos clave, calificaciones, fotos y firma digital del inspector.
- Opción para descargar y compartir inmediatamente.

**Beneficio funcional**
- Estandariza documentación y facilita procesos administrativos y legales.

### 7) Mejor UX operativa para campo (prioridad media)
**Qué implementar**
- Sustituir `alert` por notificaciones no bloqueantes (toasts).
- Indicador de progreso por secciones y checklist de campos pendientes.
- Modo alto contraste/tamaño de fuente para uso en exteriores.

**Beneficio funcional**
- Reduce fricción durante captura y acelera el tiempo de inspección.

### 8) Reglas de criticidad más ricas (prioridad media)
**Qué implementar**
- Mantener la regla de mínimo, pero agregar ponderaciones por componente.
- Generar recomendaciones automáticas según combinación de defectos (motor de reglas simple).

**Beneficio funcional**
- Priorización más precisa y homogénea entre inspectores.

## Plan sugerido por fases
- **Fase 1 (rápida, alto impacto):** validación real del envío, borrador local, validaciones técnicas.
- **Fase 2:** evidencia fotográfica mejorada + UX de campo.
- **Fase 3:** historial evolutivo, PDF y motor de reglas avanzado.

## Conclusión
El sistema implementa correctamente un flujo integral de inspección visual de puentes en cliente, con cálculo automático de severidades y envío remoto. Es una base funcional sólida para captura de inventario, aunque con margen de mejora en robustez del envío y endurecimiento de validaciones.
