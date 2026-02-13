// Manejar envío del formulario
document.getElementById('inspectionForm').addEventListener('submit', function(e) {
    e.preventDefault();

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
        // Enviamos las calificaciones visuales (Escala 1-5)
        califSuper: document.getElementById('calif_superestructura').textContent,
        califSub: document.getElementById('calif_subestructura').textContent,
        califCauce: document.getElementById('calif_cauce').textContent,
        accionRecomendada: document.getElementById('accionRecomendada').value
    };

    // URL de tu motor lógico en Apps Script
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxiboVjPLZFaY1mb26Gzd3BUugYX15PJtLo8GX5Sc0kTAhD4nEe7nyFx9iZVIQqXdU1eA/exec';

    // Preparar envío
    const params = new URLSearchParams(formData);

    fetch(scriptURL, { 
        method: 'POST', 
        mode: 'no-cors', // Modo necesario para Google Apps Script
        body: params
    })
    .then(() => {
        alert('✓ REPORTE ENVIADO\nLos datos se han registrado en el Inventario Nacional de Puentes.');
        this.reset(); // Limpia el formulario
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Reiniciar los labels de calificación
        document.getElementById('calif_superestructura').textContent = '-';
        document.getElementById('calif_subestructura').textContent = '-';
        document.getElementById('calif_cauce').textContent = '-';
        document.getElementById('calif_general').textContent = '-';
        document.getElementById('nivel_prioridad').textContent = '-';
        document.getElementById('estado_global').textContent = '-';
    })
    .catch(error => {
        console.error('Error!', error.message);
        alert('Error de conexión. Verifique su señal de internet.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
});
