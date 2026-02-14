diff --git a/js/submit.js b/js/submit.js
index f57a399d40be80297e68421a7bf250fbb3bf9706..6b8b0e7ff159b80070a94f309f21813fa4e7a5a7 100644
--- a/js/submit.js
+++ b/js/submit.js
@@ -33,137 +33,163 @@ function validarSeveridadesCompletas() {
 }
 
 function validarReglaCritica() {
     const califGeneral = Number(document.getElementById('calif_general').textContent);
     const accion = document.getElementById('accionRecomendada').value;
     const riesgo = document.getElementById('riesgoIdentificado').value.trim();
 
     const esCritico = !Number.isNaN(califGeneral) && califGeneral <= 2;
     const accionesUrgentes = ['Inspección Detallada Urgente', 'Restricción de Carga', 'Cierre Inmediato', 'Reemplazo'];
 
     if (esCritico) {
         if (!accionesUrgentes.includes(accion)) {
             showToast('Para calificación crítica (≤2), seleccione una acción urgente.', 'error');
             return false;
         }
 
         if (!riesgo) {
             showToast('Para calificación crítica (≤2), describa el riesgo identificado.', 'error');
             return false;
         }
     }
 
     return true;
 }
 
-async function enviarConFallback(scriptURL, params) {
-    try {
-        const response = await fetch(scriptURL, {
-            method: 'POST',
-            headers: {
-                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
-            },
-            body: params
-        });
+function leerArchivoComoDataURL(archivo) {
+    return new Promise((resolve, reject) => {
+        const reader = new FileReader();
+        reader.onload = () => resolve(reader.result);
+        reader.onerror = () => reject(new Error(`No se pudo leer el archivo ${archivo.name}`));
+        reader.readAsDataURL(archivo);
+    });
+}
 
-        if (!response.ok) {
-            throw new Error(`HTTP ${response.status}`);
-        }
+async function recopilarFotosSeleccionadas() {
+    const inputsFoto = Array.from(document.querySelectorAll('input[type="file"]'));
+    const fotos = [];
 
-        let payload = null;
-        try {
-            payload = await response.json();
-        } catch (_) {
-            // Backend actual puede no responder JSON.
-        }
+    for (const input of inputsFoto) {
+        const archivo = input.files?.[0];
+        if (!archivo) continue;
 
-        return { modo: 'cors', payload };
-    } catch (corsError) {
-        await fetch(scriptURL, {
-            method: 'POST',
-            mode: 'no-cors',
-            body: params
+        const dataURL = await leerArchivoComoDataURL(archivo);
+        const base64 = dataURL.split(',')[1] || '';
+
+        fotos.push({
+            campo: input.id,
+            nombre: archivo.name,
+            tipoMime: archivo.type || 'application/octet-stream',
+            tamanioBytes: archivo.size,
+            contenidoBase64: base64
         });
+    }
 
-        return { modo: 'no-cors' };
+    return fotos;
+}
+
+async function enviarReporte(scriptURL, params) {
+    const response = await fetch(scriptURL, {
+        method: 'POST',
+        headers: {
+            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
+        },
+        body: params
+    });
+
+    if (!response.ok) {
+        throw new Error(`El servidor respondió con HTTP ${response.status}`);
+    }
+
+    let payload;
+    try {
+        payload = await response.json();
+    } catch (parseError) {
+        throw new Error('El servidor no devolvió JSON válido. Revisa el deployment de Apps Script.');
+    }
+
+    if (!payload || payload.ok !== true) {
+        const detalle = payload?.error ? ` Detalle: ${payload.error}` : '';
+        throw new Error(`Apps Script no confirmó el guardado.${detalle}`);
     }
+
+    return payload;
 }
 
 
 function limpiarUIEvaluacion() {
     document.querySelectorAll('.severity-scale').forEach((scale) => {
         scale.classList.remove('active');
         scale.querySelectorAll('.severity-btn').forEach((btn) => btn.classList.remove('selected'));
     });
 
     document.querySelectorAll('input[id^="severity_value_"]').forEach((input) => {
         input.value = '';
     });
 }
 
 function reiniciarResultados() {
     document.getElementById('calif_superestructura').textContent = '-';
     document.getElementById('calif_subestructura').textContent = '-';
     document.getElementById('calif_cauce').textContent = '-';
     document.getElementById('calif_general').textContent = '-';
     document.getElementById('nivel_prioridad').textContent = '-';
     document.getElementById('estado_global').textContent = '-';
 }
 
 // Manejar envío del formulario
 document.getElementById('inspectionForm').addEventListener('submit', async function(e) {
     e.preventDefault();
 
     if (!validarCoordenadasRD() || !validarSeveridadesCompletas() || !validarReglaCritica()) {
         return;
     }
 
     // Bloquear botón para evitar múltiples envíos
     const submitBtn = document.querySelector('.submit-btn');
     const originalText = submitBtn.textContent;
     submitBtn.textContent = 'Enviando a Base de Datos MOPC...';
     submitBtn.disabled = true;
 
-    // Captura de datos para el Servidor (Metodología AASHTO MBE)
-    const formData = {
-        identificador: document.getElementById('identificador').value,
-        nombreEstructura: document.getElementById('nombreEstructura').value,
-        provincia: document.getElementById('provincia').value,
-        latitud: document.getElementById('latitud').value,
-        longitud: document.getElementById('longitud').value,
-        tipoEstructura: document.getElementById('tipoEstructura').value,
-        califSuper: document.getElementById('calif_superestructura').textContent,
-        califSub: document.getElementById('calif_subestructura').textContent,
-        califCauce: document.getElementById('calif_cauce').textContent,
-        accionRecomendada: document.getElementById('accionRecomendada').value,
-        riesgoIdentificado: document.getElementById('riesgoIdentificado').value
-    };
-
-    // URL de tu motor lógico en Apps Script
-    const scriptURL = 'https://script.google.com/macros/s/AKfycbzHjnQlNfquXFyaFewmBu4JJpEzKiVZ_wDM9hDl_mnqAmcK3SkfEfJ55hygqgcKSy99/exec';
-
-    // Preparar envío
-    const params = new URLSearchParams(formData);
-
     try {
-        const resultado = await enviarConFallback(scriptURL, params);
-
-        if (resultado.modo === 'cors') {
-            showToast('✓ Reporte enviado y confirmado por el servidor.', 'success');
-        } else {
-            showToast('✓ Reporte enviado en modo compatibilidad (sin confirmación detallada).', 'warning');
-        }
+        const fotos = await recopilarFotosSeleccionadas();
+
+        // Captura de datos para el Servidor (Metodología AASHTO MBE)
+        const formData = {
+            identificador: document.getElementById('identificador').value,
+            nombreEstructura: document.getElementById('nombreEstructura').value,
+            provincia: document.getElementById('provincia').value,
+            latitud: document.getElementById('latitud').value,
+            longitud: document.getElementById('longitud').value,
+            tipoEstructura: document.getElementById('tipoEstructura').value,
+            califSuper: document.getElementById('calif_superestructura').textContent,
+            califSub: document.getElementById('calif_subestructura').textContent,
+            califCauce: document.getElementById('calif_cauce').textContent,
+            accionRecomendada: document.getElementById('accionRecomendada').value,
+            riesgoIdentificado: document.getElementById('riesgoIdentificado').value,
+            puenteCarpeta: document.getElementById('nombreEstructura').value,
+            fotos: JSON.stringify(fotos)
+        };
+
+        // URL de tu motor lógico en Apps Script
+        const scriptURL = 'https://script.google.com/macros/s/AKfycbzHjnQlNfquXFyaFewmBu4JJpEzKiVZ_wDM9hDl_mnqAmcK3SkfEfJ55hygqgcKSy99/exec';
+
+        // Preparar envío
+        const params = new URLSearchParams(formData);
+
+        const resultado = await enviarReporte(scriptURL, params);
+        showToast(`✓ Reporte enviado y confirmado (${resultado.fotosGuardadas || 0} fotos).`, 'success');
 
         this.reset();
         reiniciarResultados();
         limpiarUIEvaluacion();
         if (typeof limpiarBorrador === 'function') {
             limpiarBorrador();
         }
     } catch (error) {
         console.error('Error!', error.message);
-        showToast('Error de conexión. Verifique su señal de internet.', 'error');
+        showToast(`No se pudo confirmar el envío: ${error.message}`, 'error');
     } finally {
         submitBtn.disabled = false;
         submitBtn.textContent = originalText;
     }
 });
