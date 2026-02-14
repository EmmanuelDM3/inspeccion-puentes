const DRAFT_STORAGE_KEY = 'inspeccionPuentes:v2:draft';

function serializarFormulario(form) {
    const draft = {};

    form.querySelectorAll('input, select, textarea').forEach((field) => {
        if (!field.id || field.type === 'file') return;

        if (field.type === 'checkbox' || field.type === 'radio') {
            draft[field.id] = field.checked;
            return;
        }

        draft[field.id] = field.value;
    });

    return draft;
}

function sincronizarEstadoVisualEvaluacion(form) {
    form.querySelectorAll('input[id^="check_"]').forEach((checkbox) => {
        const id = checkbox.id.replace('check_', '');
        const scale = document.getElementById(`severity_${id}`);
        const hidden = document.getElementById(`severity_value_${id}`);

        if (!scale) return;

        if (checkbox.checked) {
            scale.classList.add('active');
        } else {
            scale.classList.remove('active');
        }

        const selectedLevel = hidden?.value;
        scale.querySelectorAll('.severity-btn').forEach((btn) => {
            const matchesLevel = btn.classList.contains(`level-${selectedLevel}`);
            btn.classList.toggle('selected', Boolean(selectedLevel) && matchesLevel);
        });
    });
}

function aplicarBorrador(form, draft) {
    Object.entries(draft).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (!field) return;

        if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = Boolean(value);
            return;
        }

        field.value = value;
    });

    sincronizarEstadoVisualEvaluacion(form);

    if (typeof actualizarVisibilidadFundacion === 'function') {
        actualizarVisibilidadFundacion();
    }

    if (typeof calcularCalificaciones === 'function') {
        calcularCalificaciones();
    }
}

function guardarBorrador(form) {
    try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(serializarFormulario(form)));
    } catch (error) {
        console.warn('No se pudo guardar borrador local', error);
    }
}

function restaurarBorrador(form) {
    try {
        const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!draftRaw) return;

        const draft = JSON.parse(draftRaw);
        aplicarBorrador(form, draft);
        if (window.showToast) {
            window.showToast('Se restauró automáticamente el borrador local.', 'info');
        }
    } catch (error) {
        console.warn('No se pudo restaurar el borrador', error);
    }
}

function limpiarBorrador() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
}

window.limpiarBorrador = limpiarBorrador;

window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inspectionForm');
    if (!form) return;

    restaurarBorrador(form);

    form.addEventListener('input', () => guardarBorrador(form));
    form.addEventListener('change', () => guardarBorrador(form));

    setInterval(() => guardarBorrador(form), 10000);

    window.addEventListener('beforeunload', () => guardarBorrador(form));
});
