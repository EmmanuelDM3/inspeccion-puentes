        // Establecer fecha predeterminada (hoy) y límite máximo
        document.addEventListener('DOMContentLoaded', function() {
            const fechaInput = document.getElementById('fechaInspeccion');
            const today = new Date().toISOString().split('T')[0];
            fechaInput.value = today;
            fechaInput.max = today;
        });

        // Función para obtener ubicación GPS
        function obtenerUbicacion() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        document.getElementById('latitud').value = position.coords.latitude.toFixed(6);
                        document.getElementById('longitud').value = position.coords.longitude.toFixed(6);
                        alert('✓ Ubicación capturada correctamente');
                    },
                    function(error) {
                        alert('Error al obtener ubicación: ' + error.message);
                    }
                );
            } else {
                alert('La geolocalización no está soportada por este navegador.');
            }
        }

        // Mostrar/ocultar campos "Otro"
        function mostrarCampoOtro(selectId, divId) {
            const select = document.getElementById(selectId);
            const div = document.getElementById(divId);
            
            if (select.value === 'Otro') {
                div.classList.remove('hidden');
            } else {
                div.classList.add('hidden');
            }
        }

        // Actualizar código Pre/Post automáticamente
        document.getElementById('anioConstruccion').addEventListener('input', function() {
            const anio = parseInt(this.value);
            const codigo = document.getElementById('codigoPrePost');
            
            if (anio && !isNaN(anio)) {
                if (anio < 2011) {
                    codigo.value = 'PRE-CÓDIGO';
                } else {
                    codigo.value = 'POST-CÓDIGO';
                }
            } else {
                codigo.value = '';
            }
        });

        // Actualizar visibilidad de sección de fundación
        function actualizarVisibilidadFundacion() {
            const tipoFundacion = document.getElementById('tipoFundacion').value;
            const seccionFundacion = document.getElementById('seccionFundacion');
            const alertaNoVisible = document.getElementById('fundacionNoVisible');
            
            if (tipoFundacion === 'No visible') {
                seccionFundacion.style.display = 'none';
                alertaNoVisible.style.display = 'flex';
            } else {
                seccionFundacion.style.display = 'block';
                alertaNoVisible.style.display = 'none';
            }
        }

        // Toggle escala de severidad
        function toggleSeverityScale(id) {
            const checkbox = document.getElementById('check_' + id);
            const scale = document.getElementById('severity_' + id);
            
            if (checkbox.checked) {
                scale.classList.add('active');
            } else {
                scale.classList.remove('active');
                // Limpiar selección
                const buttons = scale.querySelectorAll('.severity-btn');
                buttons.forEach(btn => btn.classList.remove('selected'));
                document.getElementById('severity_value_' + id).value = '';
            }
            
            calcularCalificaciones();
        }

        // Seleccionar nivel de severidad
        function selectSeverity(id, level) {
            const buttons = document.querySelectorAll(`#severity_${id} .severity-btn`);
            buttons.forEach(btn => btn.classList.remove('selected'));
            
            event.target.closest('.severity-btn').classList.add('selected');
            document.getElementById('severity_value_' + id).value = level;
            
            calcularCalificaciones();
        }

        // Preview de fotos
        function previewPhoto(id) {
            const input = document.getElementById('photo_' + id);
            const preview = document.getElementById('preview_' + id);
            
            preview.innerHTML = '';
            
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    preview.appendChild(img);
                };
                
                reader.readAsDataURL(input.files[0]);
            }
        }

        // Calcular calificaciones automáticamente
        function calcularCalificaciones() {
            // Arrays de IDs por categoría
            const superEstructura = ['fisuras', 'corrosion', 'deflexiones', 'impacto', 'humedad', 
                                    'juntas_estado', 'juntas_limpieza', 'carpeta', 'drenaje'];
            
            const subEstructura = ['estribos_integridad', 'estribos_alineacion', 'asentamiento',
                                  'pilares_integridad', 'pilares_verticalidad', 'pilares_corrosion',
                                  'apoyos', 'cabezal', 'impacto_fundacion', 'socavacion', 'lavado', 'protecciones'];
            
            const cauce = ['obstruccion', 'vegetacion', 'gaviones_talud', 'erosion_taludes'];
            
            // Calcular mínimo de cada categoría
            const califSuper = calcularMinimo(superEstructura);
            const califSub = calcularMinimo(subEstructura);
            const califCauce = calcularMinimo(cauce);
            
            // Calificación General = mínimo de las tres
            const califGeneral = Math.min(califSuper, califSub, califCauce);
            
            // Actualizar display
            document.getElementById('calif_superestructura').textContent = califSuper || '-';
            document.getElementById('calif_subestructura').textContent = califSub || '-';
            document.getElementById('calif_cauce').textContent = califCauce || '-';
            document.getElementById('calif_general').textContent = califGeneral || '-';
            
            // Determinar prioridad y estado
            if (califGeneral) {
                let prioridad, estado, colorClass;
                
                // Verificar socavación crítica
                const socavacion = parseInt(document.getElementById('severity_value_socavacion')?.value);
                
                if (socavacion === 1 || socavacion === 2 || califGeneral <= 2) {
                    prioridad = 'ALTA';
                    estado = califGeneral === 1 ? 'D - Crítico' : 'C - Pobre';
                    colorClass = 'priority-high';
                } else if (califGeneral === 3) {
                    prioridad = 'MEDIA';
                    estado = 'B - Regular';
                    colorClass = 'priority-medium';
                } else {
                    prioridad = 'BAJA';
                    estado = 'A - Bueno';
                    colorClass = 'priority-low';
                }
                
                const prioridadEl = document.getElementById('nivel_prioridad');
                prioridadEl.textContent = prioridad;
                prioridadEl.className = 'result-value ' + colorClass;
                
                const estadoEl = document.getElementById('estado_global');
                estadoEl.textContent = estado;
                estadoEl.className = 'result-value ' + colorClass;
            }
        }

        function calcularMinimo(arrayIds) {
            let minimo = 5;
            let hayValores = false;
            
            arrayIds.forEach(id => {
                const checkbox = document.getElementById('check_' + id);
                const value = document.getElementById('severity_value_' + id);
                
                if (checkbox && checkbox.checked && value && value.value) {
                    hayValores = true;
                    const val = parseInt(value.value);
                    if (val < minimo) {
                        minimo = val;
                    }
                }
            });
            
            return hayValores ? minimo : null;
        }

        // Manejar envío del formulario
      // PEGA ESTE NUEVO BLOQUE
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
