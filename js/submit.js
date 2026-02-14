function validarCoordenadasRD() {
    const lat = parseFloat(document.getElementById('latitud').value);
    const lon = parseFloat(document.getElementById('longitud').value);

    const latValida = !isNaN(lat) && lat >= 17.3 && lat <= 20.2;
    const lonValida = !isNaN(lon) && lon >= -72.1 && lon <= -68.1;

    if (!latValida || !lonValida) {
        showToast('Las coordenadas deben estar dentro de un rango válido para República Dominicana.', 'error');
        return false;
    }

    return true;
}

function validarSeveridadesCompletas() {
    const checkboxes = document.querySelectorAll('input[id^="check_"]');

    for (const checkbox of checkboxes) {
        if (!checkbox.checked) continue;

        const id = checkbox.id.replace('check_', '');
        const severityValue = document.getElementById(`severity_value_${id}`);

        if (severityValue && !severityValue.value) {
            showToast('Debe seleccionar nivel de severidad para cada defecto marcado.', 'error');
            document.getElementById(`severity_${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
    }

    return true;
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

function leerArchivoComoDataURL(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`No se pudo leer el archivo ${archivo.name}`));
        reader.readAsDataURL(archivo);
    });
}

async function recopilarFotosSeleccionadas() {
    const inputsFoto = Array.from(document.querySelectorAll('input[type="file"]'));
    const fotos = [];

    for (const input of inputsFoto) {
        const archivo = input.files?.[0];
        if (!archivo) continue;

        const dataURL = await leerArchivoComoDataURL(archivo);
        const base64 = dataURL.split(',')[1] || '';

        fotos.push({
            campo: input.id,
            nombre: archivo.name,
            tipoMime: archivo.type || 'application/octet-stream',
            tamanioBytes: archivo.size,
            contenidoBase64: base64
        });
    }

    return fotos;
}

async function enviarReporte(scriptURL, params) {
    const response = await fetch(scriptURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: params
    });

    if (!response.ok) {
        throw new Error(`El servidor respondió con HTTP ${response.status}`);
    }

    let payload;
    try {
        payload = await response.json();
    } catch (parseError) {
        throw new Error('El servidor no devolvió JSON válido. Revisa el deployment de Apps Script.');
    }

    if (!payload || payload.ok !== true) {
        const detalle = payload?.error ? ` Detalle: ${payload.error}` : '';
        throw new Error(`Apps Script no confirmó el guardado.${detalle}`);
    }

    return payload;
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

let progressIntervalId = null;

function actualizarBarraEnvio(porcentaje, mensaje) {
    const progress = document.getElementById('submitProgress');
    const fill = document.getElementById('submitProgressFill');
    const label = document.getElementById('submitProgressLabel');

    if (!progress || !fill || !label) return;

    const valor = Math.max(0, Math.min(100, porcentaje));
    progress.classList.add('visible');
    progress.setAttribute('aria-hidden', 'false');
    fill.style.width = `${valor}%`;
    if (mensaje) {
        label.textContent = mensaje;
    }
}

function iniciarBarraEnvio() {
    let progreso = 8;
    actualizarBarraEnvio(progreso, 'Preparando envío...');

    progressIntervalId = window.setInterval(() => {
        if (progreso >= 92) return;

        const incremento = Math.max(1, Math.round((92 - progreso) / 8));
        progreso += incremento;
        actualizarBarraEnvio(progreso, 'Enviando a base de datos...');
    }, 260);
}

function finalizarBarraEnvio(exito) {
    if (progressIntervalId) {
        window.clearInterval(progressIntervalId);
        progressIntervalId = null;
    }

    actualizarBarraEnvio(100, exito ? 'Envío confirmado.' : 'No se pudo confirmar el envío.');
}

function ocultarBarraEnvio() {
    const progress = document.getElementById('submitProgress');
    const fill = document.getElementById('submitProgressFill');
    const label = document.getElementById('submitProgressLabel');

    if (!progress || !fill || !label) return;

    window.setTimeout(() => {
        progress.classList.remove('visible');
        progress.setAttribute('aria-hidden', 'true');
        fill.style.width = '0%';
        label.textContent = 'Preparando envío...';
    }, 500);
}

// Manejar envío del formulario
document.getElementById('inspectionForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validarCoordenadasRD() || !validarSeveridadesCompletas() || !validarReglaCritica()) {
        return;
    }

    // Bloquear botón para evitar múltiples envíos
    const submitBtn = document.querySelector('.submit-btn');
    const submitBtnText = submitBtn.querySelector('.submit-btn-text');
    const originalText = submitBtnText ? submitBtnText.textContent : submitBtn.textContent.trim();
    if (submitBtnText) {
        submitBtnText.textContent = 'Enviando a Base de Datos MOPC...';
    } else {
        submitBtn.textContent = 'Enviando a Base de Datos MOPC...';
    }
    iniciarBarraEnvio();
    submitBtn.disabled = true;

    try {
        const fotos = await recopilarFotosSeleccionadas();

        // Captura de datos para el Servidor (Metodología AASHTO MBE)
        const formData = {
            identificador: document.getElementById('identificador').value,
            nombreEstructura: document.getElementById('nombreEstructura').value,
            provincia: document.getElementById('provincia').value,
            latitud: document.getElementById('latitud').value,
            longitud: document.getElementById('longitud').value,
            tipoEstructura: document.getElementById('tipoEstructura').value,
            califSuper: document.getElementById('calif_superestructura').textContent,
            califSub: document.getElementById('calif_subestructura').textContent,
            califCauce: document.getElementById('calif_cauce').textContent,
            accionRecomendada: document.getElementById('accionRecomendada').value,
            riesgoIdentificado: document.getElementById('riesgoIdentificado').value,
            puenteCarpeta: document.getElementById('nombreEstructura').value,
            fotos: JSON.stringify(fotos)
        };

        // URL de tu motor lógico en Apps Script
        const scriptURL = 'https://script.google.com/macros/s/AKfycby_dqUNkyPIDkvd_QCBj-U_MAIhBv8wthqWqqmlTpQKLysGUnUMKJ2V_YNwXwVRsnhM/exec';

        // Preparar envío
        const params = new URLSearchParams(formData);

        const resultado = await enviarReporte(scriptURL, params);
        finalizarBarraEnvio(true);
        showToast(`✓ Reporte enviado y confirmado (${resultado.fotosGuardadas || 0} fotos).`, 'success');

        this.reset();
        reiniciarResultados();
        limpiarUIEvaluacion();
        if (typeof limpiarBorrador === 'function') {
            limpiarBorrador();
        }
    } catch (error) {
        console.error('Error!', error.message);
        finalizarBarraEnvio(false);
        showToast(`No se pudo confirmar el envío: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        if (submitBtnText) {
            submitBtnText.textContent = originalText;
        } else {
            submitBtn.textContent = originalText;
        }
        ocultarBarraEnvio();
    }
});
