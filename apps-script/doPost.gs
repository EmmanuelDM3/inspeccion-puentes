/**
 * Configura aquí la carpeta raíz en Drive donde quieres guardar las inspecciones.
 * Ejemplo: https://drive.google.com/drive/folders/ABC123... -> usa solo ABC123...
 */
const ROOT_FOLDER_ID = 'REEMPLAZAR_CON_ID_DE_CARPETA_RAIZ';

const OBLIGATORIAS_PRF_MAP = {
  foto_vista1: 'PRF_001',
  foto_vista2: 'PRF_002',
  foto_tablero: 'PRF_003',
  foto_super: 'PRF_004',
  foto_sub: 'PRF_005',
  foto_cauce: 'PRF_006'
};


const CAMPOS_OPCIONALES = [
  'photo_fisuras',
  'photo_corrosion',
  'photo_deflexiones',
  'photo_impacto',
  'photo_humedad',
  'photo_juntas_estado',
  'photo_juntas_limpieza',
  'photo_carpeta',
  'photo_drenaje',
  'photo_estribos_integridad',
  'photo_estribos_alineacion',
  'photo_asentamiento',
  'photo_pilares_integridad',
  'photo_pilares_verticalidad',
  'photo_pilares_corrosion',
  'photo_apoyos',
  'photo_cabezal',
  'photo_impacto_fundacion',
  'photo_socavacion',
  'photo_lavado',
  'photo_protecciones',
  'photo_obstruccion',
  'photo_vegetacion',
  'photo_gaviones_talud',
  'photo_erosion_taludes',
  'photo_barandas',
  'photo_superficie_rodadura',
  'photo_ancho_calzada_eval',
  'photo_galibo',
  'photo_otros'
];

const OPCIONALES_MAP = CAMPOS_OPCIONALES.reduce(function(acumulado, campo, index) {
  acumulado[campo] = `OPC_${String(index + 1).padStart(3, '0')}`;
  return acumulado;
}, {});

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const d = e.parameter;

    const cSuper = parseInt(d.califSuper, 10) || 5;
    const cSub = parseInt(d.califSub, 10) || 5;
    const cCauce = parseInt(d.califCauce, 10) || 5;

    const cg = Math.min(cSuper, cSub, cCauce);

    let prioridad = '';
    if (cg <= 2) {
      prioridad = 'ALTA';
    } else if (cg === 3) {
      prioridad = 'MEDIA';
    } else {
      prioridad = 'BAJA';
    }

    const fotos = parseFotos(d.fotos);
    const carpetaPuente = crearCarpetaPuente(d.puenteCarpeta || d.nombreEstructura || d.identificador || 'Puente_sin_nombre');
    const resultadoGuardado = guardarFotosEnCarpeta(carpetaPuente, fotos);

    sheet.appendRow([
      new Date(),
      d.identificador || '',
      d.nombreEstructura || '',
      d.provincia || '',
      d.latitud || '',
      d.longitud || '',
      d.tipoEstructura || '',
      cSuper,
      cSub,
      cCauce,
      cg,
      prioridad,
      d.accionRecomendada || '',
      d.riesgoIdentificado || '',
      carpetaPuente.getUrl(),
      fotos.length
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        folderUrl: carpetaPuente.getUrl(),
        fotosGuardadas: resultadoGuardado.totalGuardadas,
        fotosObligatoriasGuardadas: resultadoGuardado.obligatoriasGuardadas,
        fotosOpcionalesGuardadas: resultadoGuardado.opcionalesGuardadas
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function parseFotos(rawFotos) {
  if (!rawFotos) return [];

  try {
    const fotos = JSON.parse(rawFotos);
    return Array.isArray(fotos) ? fotos : [];
  } catch (error) {
    return [];
  }
}

function crearCarpetaPuente(nombreBase) {
  if (ROOT_FOLDER_ID === 'REEMPLAZAR_CON_ID_DE_CARPETA_RAIZ') {
    throw new Error('Debes configurar ROOT_FOLDER_ID con el ID real de tu carpeta raíz en Drive.');
  }

  const raiz = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const nombreLimpio = sanitizarNombre(nombreBase);
  const nombreFinal = `${nombreLimpio}_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss')}`;

  return raiz.createFolder(nombreFinal);
}

function guardarFotosEnCarpeta(carpetaPuente, fotos) {
  const fechaBase = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');

  const carpetaObligatorias = carpetaPuente.createFolder('01_Obligatorias');
  const carpetaOpcionales = carpetaPuente.createFolder('02_Opcionales');
  const subcarpetasOpcionales = crearSubcarpetasOpcionales(carpetaOpcionales);

  let totalGuardadas = 0;
  let obligatoriasGuardadas = 0;
  let opcionalesGuardadas = 0;

  fotos.forEach(function(foto, index) {
    if (!foto || !foto.contenidoBase64) return;

    const bytes = Utilities.base64Decode(foto.contenidoBase64);
    const tipoMime = foto.tipoMime || 'application/octet-stream';
    const campo = sanitizarNombre(foto.campo || `campo_${index + 1}`);
    const extension = obtenerExtensionArchivo(foto.nombre, tipoMime);
    const sufijoSecuencia = `${fechaBase}_${String(index + 1).padStart(3, '0')}`;

    let carpetaDestino = carpetaOpcionales;
    let nombreArchivo = '';

    if (OBLIGATORIAS_PRF_MAP[campo]) {
      carpetaDestino = carpetaObligatorias;
      nombreArchivo = `${OBLIGATORIAS_PRF_MAP[campo]}_${sufijoSecuencia}.${extension}`;
      obligatoriasGuardadas += 1;
    } else {
      carpetaDestino = subcarpetasOpcionales[campo] || carpetaOpcionales;
      const codigoOpcional = OPCIONALES_MAP[campo] || 'OPC_999';
      nombreArchivo = `${codigoOpcional}_${campo}_${sufijoSecuencia}.${extension}`;
      opcionalesGuardadas += 1;
    }

    const blob = Utilities.newBlob(bytes, tipoMime, nombreArchivo);
    carpetaDestino.createFile(blob);
    totalGuardadas += 1;
  });

  return {
    totalGuardadas,
    obligatoriasGuardadas,
    opcionalesGuardadas
  };
}

function crearSubcarpetasOpcionales(carpetaOpcionales) {
  const subcarpetas = {};

  CAMPOS_OPCIONALES.forEach(function(campo) {
    const codigoOpcional = OPCIONALES_MAP[campo] || 'OPC_999';
    const nombreSubcarpeta = `${codigoOpcional}_${campo}`;
    subcarpetas[campo] = carpetaOpcionales.createFolder(nombreSubcarpeta);
  });

  return subcarpetas;
}

function obtenerExtensionArchivo(nombreOriginal, tipoMime) {
  const nombre = String(nombreOriginal || '').trim();
  const match = nombre.match(/\.([a-zA-Z0-9]{1,8})$/);

  if (match && match[1]) {
    return match[1].toLowerCase();
  }

  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif'
  };

  return mimeMap[tipoMime] || 'bin';
}

function sanitizarNombre(nombre) {
  return String(nombre || 'sin_nombre')
    .trim()
    .replace(/[\\/:*?"<>|#%{}~&]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}
