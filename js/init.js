// Establecer fecha predeterminada (hoy) y límite máximo
document.addEventListener('DOMContentLoaded', function() {
    const fechaInput = document.getElementById('fechaInspeccion');
    const today = new Date().toISOString().split('T')[0];
    fechaInput.value = today;
    fechaInput.max = today;
});
