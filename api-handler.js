const scriptURL = 'https://script.google.com/macros/s/AKfycbxiboVjPLZFaY1mb26Gzd3BUugYX15PJtLo8GX5Sc0kTAhD4nEe7nyFx9iZVIQqXdU1eA/exec';

document.getElementById('inspectionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando a Base de Datos MOPC...';
    submitBtn.disabled = true;

    // Recopilación de datos básicos [cite: 1785-1797]
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
        accionRecomendada: document.getElementById('accionRecomendada').value
    };

    const params = new URLSearchParams(formData);
    
    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
    })
    .then(() => {
        alert('✓ REPORTE ENVIADO');
        this.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        // Reiniciar labels [cite: 1813-1818]
    })
    .catch(error => {
        console.error('Error!', error.message);
        submitBtn.disabled = false;
    });
});
