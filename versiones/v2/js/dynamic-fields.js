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
