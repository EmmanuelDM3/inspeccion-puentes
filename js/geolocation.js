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

/ Preview de fotos
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
