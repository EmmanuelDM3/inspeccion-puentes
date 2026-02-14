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
            
            const trigger = (typeof event !== 'undefined' && event?.target) ? event.target : document.activeElement;
            const targetBtn = trigger?.closest?.('.severity-btn');
            if (targetBtn) {
                targetBtn.classList.add('selected');
            }
            document.getElementById('severity_value_' + id).value = level;
            
            calcularCalificaciones();
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


