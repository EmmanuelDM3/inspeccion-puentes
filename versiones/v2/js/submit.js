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

async function enviarConFallback(scriptURL, params) {
    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        let payload = null;
        try {
            payload = await response.json();
        } catch (_) {
            // Backend actual puede no responder JSON.
        }

        return { modo: 'cors', payload };
    } catch (corsError) {
        await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            body: params
        });

        return { modo: 'no-cors' };
    }
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
        riesgoIdentificado: document.getElementById('riesgoIdentificado').value
    };

    // URL de tu motor lógico en Apps Script
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxiboVjPLZFaY1mb26Gzd3BUugYX15PJtLo8GX5Sc0kTAhD4nEe7nyFx9iZVIQqXdU1eA/exec';

    // Preparar envío
    const params = new URLSearchParams(formData);

    try {
        const resultado = await enviarConFallback(scriptURL, params);

        if (resultado.modo === 'cors') {
            showToast('✓ Reporte enviado y confirmado por el servidor.', 'success');
        } else {
            showToast('✓ Reporte enviado en modo compatibilidad (sin confirmación detallada).', 'warning');
        }

        this.reset();
        reiniciarResultados();
        if (typeof limpiarBorrador === 'function') {
            limpiarBorrador();
        }
    } catch (error) {
        console.error('Error!', error.message);
        showToast('Error de conexión. Verifique su señal de internet.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
