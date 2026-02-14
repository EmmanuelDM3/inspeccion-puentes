/**
 * Configura aquí la carpeta raíz en Drive donde quieres guardar las inspecciones.
 * Ejemplo: https://drive.google.com/drive/folders/ABC123... -> usa solo ABC123...
 */
const ROOT_FOLDER_ID = 'REEMPLAZAR_CON_ID_DE_CARPETA_RAIZ';

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
    guardarFotosEnCarpeta(carpetaPuente, fotos);

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
        fotosGuardadas: fotos.length
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

function guardarFotosEnCarpeta(carpeta, fotos) {
  fotos.forEach(function(foto, index) {
    if (!foto || !foto.contenidoBase64) return;

    const bytes = Utilities.base64Decode(foto.contenidoBase64);
    const tipoMime = foto.tipoMime || 'application/octet-stream';
    const nombreOriginal = foto.nombre || `foto_${index + 1}`;
    const nombreArchivo = `${String(index + 1).padStart(2, '0')}_${sanitizarNombre(nombreOriginal)}`;

    const blob = Utilities.newBlob(bytes, tipoMime, nombreArchivo);
    carpeta.createFile(blob);
  });
}

function sanitizarNombre(nombre) {
  return String(nombre || 'sin_nombre')
    .trim()
    .replace(/[\\/:*?"<>|#%{}~&]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}
