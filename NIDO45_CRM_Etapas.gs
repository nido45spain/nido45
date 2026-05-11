// ████████████████████████████████████████████████████████████████████████████
// NIDO45 — CRM ETAPAS · Motor de triggers completo
// v1.3 — correos [CLIENTE] van a d.email + BCC a EMAIL_DESTINO
// ████████████████████████████████████████████████████████████████████████████

var EMAIL_DESTINO = 'casamodularhm@gmail.com';
var AIRTABLE_BASE  = 'appYzLd8OUL2Kdw73';
var AIRTABLE_TABLE = 'tblbduDaBy3LYNzyR';

// IDs de campo
var F_NOMBRE   = 'fldSzjegYRs4B6q8J';
var F_EMAIL    = 'fldj5CB880MLq4ysa';
var F_TELEFONO = 'fldcQhjCqoPe3dO7l';
var F_ETAPA    = 'fldBfARbTIQNhXGSR';
var F_MODELO   = 'fld8qWRnerenM6H7q';
var F_NIDOS    = 'fldgvJCygpJzuu8QY';
var F_PARCELA  = 'fldpWVOSbreF7FvGw';
var F_URL_PDF  = 'fldldEENrrmDppooh';
var F_FLUJO    = 'fldvHoEJ4IGKHMzPv';
var F_ID_CRM   = 'fldJBRYHdjVTyLKfe';

// ─────────────────────────────────────────────────────────────
// WEBHOOK
// ─────────────────────────────────────────────────────────────
function doPostWebhook(e) {
  try {
    var payload  = JSON.parse(e.postData.contents);
    var recordId = payload.recordId || '';
    var etapa    = payload.etapa    || '';
    if (!etapa || !recordId) {
      return _jsonResp({ok: false, error: 'Faltan campos: recordId / etapa'});
    }
    var datos = (payload.datos && payload.datos.nombre)
      ? payload.datos
      : _fetchDatosRecord(recordId);
    procesarCambioEtapa(recordId, etapa, datos);
    PropertiesService.getScriptProperties().setProperty('etapa_' + recordId, etapa);
    return _jsonResp({ok: true, etapa: etapa, recordId: recordId});
  } catch (err) {
    Logger.log('doPostWebhook ERROR: ' + err.toString());
    return _jsonResp({ok: false, error: err.toString()});
  }
}

// ─────────────────────────────────────────────────────────────
// POLLING
// ─────────────────────────────────────────────────────────────
function instalarTriggerPolling() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'pollAirtableEtapas') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('pollAirtableEtapas').timeBased().everyMinutes(5).create();
  Logger.log('Trigger de polling instalado (cada 5 min).');
}

function pollAirtableEtapas() {
  var token = PropertiesService.getScriptProperties().getProperty('AIRTABLE_TOKEN');
  if (!token) { Logger.log('ERROR: AIRTABLE_TOKEN no configurado.'); return; }

  var url = 'https://api.airtable.com/v0/' + AIRTABLE_BASE + '/' + AIRTABLE_TABLE
    + '?returnFieldsByFieldId=true';

  var resp = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (resp.getResponseCode() !== 200) {
    Logger.log('Airtable error ' + resp.getResponseCode() + ': ' + resp.getContentText());
    return;
  }

  var records = JSON.parse(resp.getContentText()).records || [];
  var props   = PropertiesService.getScriptProperties();

  records.forEach(function(rec) {
    var etapaObj    = rec.fields[F_ETAPA];
    var etapaActual = etapaObj ? (etapaObj.name || etapaObj) : '';
    var etapaGuard  = props.getProperty('etapa_' + rec.id) || '';
    if (etapaActual && etapaActual !== etapaGuard) {
      var datos = _parseDatosRecord(rec.fields, rec.id);
      procesarCambioEtapa(rec.id, etapaActual, datos);
      props.setProperty('etapa_' + rec.id, etapaActual);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// ENRUTADOR DE ETAPAS
// ─────────────────────────────────────────────────────────────
function procesarCambioEtapa(recordId, etapa, datos) {
  Logger.log('[CRM] Etapa: "' + etapa + '" | ' + datos.nombre + ' (' + datos.idCRM + ')');
  switch (etapa) {
    case 'Presupuesto enviado':              _enviarPresupuestoCliente(datos); break;
    case 'Venta cerrada -> Flujo Llave en Mano': _enviarVentaCerradaNido45(datos); break;
    case 'FABRICACI\u00d3N':
    case 'FABRICACION':    _enviarFabrica(datos); _enviarArquitecto(datos); break;
    case 'CASA LISTA':     _enviarCasaListaCliente(datos); break;
    case 'ENV\u00cdO':
    case 'ENVIO':          _enviarEnvioFabrica(datos); _enviarEnvioDespachoAduanas(datos); break;
    case 'LLEGADA A DESTINO': _enviarLlegadaPerito(datos); _enviarLlegadaCliente(datos); break;
    case 'TRANSPORTE E INSTALACI\u00d3N':
    case 'TRANSPORTE E INSTALACION': _enviarTransporteDespacho(datos); _enviarTransportePerito(datos); break;
    case 'OBRA':           _enviarObraCliente(datos); break;
    case 'ENTREGA DE LLAVES': _enviarEntregaLlavesCliente(datos); _enviarEntregaLlavesNido45(datos); break;
    default: Logger.log('[CRM] Etapa "' + etapa + '" sin accion configurada.');
  }
}

// ─────────────────────────────────────────────────────────────
// CORREOS [CLIENTE] — van a d.email + BCC EMAIL_DESTINO
// ─────────────────────────────────────────────────────────────

function _enviarPresupuestoCliente(d) {
  var asunto = '[CLIENTE] Presupuesto Llave en Mano NIDO45 - ' + d.nombre + ' - ' + d.modelo + ' - Ref: ' + d.idCRM;
  var pdfBloque = d.urlPDF
    ? '<p style="margin:16px 0;"><a href="' + d.urlPDF + '" style="background:#1a3c5e;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;font-family:Arial,sans-serif;">Abrir Presupuesto PDF</a></p>'
      + '<p style="font-size:11px;color:#888;font-family:Arial,sans-serif;">Si el boton no funciona: ' + d.urlPDF + '</p>'
    : '<p style="color:#c0392b;font-family:Arial,sans-serif;">PDF no disponible aun. Adjuntar manualmente.</p>';
  var html = _cab('PARA: CLIENTE', 'Tu propuesta personalizada - ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>,</p>'
    + '<p>Adjuntamos tu <strong>propuesta comercial llave en mano</strong> personalizada NIDO45.</p>'
    + _tabla([['Cliente',d.nombre],['Modelo',d.modelo+(d.nidos?' - '+d.nidos+' nido(s)':'')],['Ubicacion',d.parcela||'-'],['Flujo',d.flujo],['Referencia',d.idCRM]])
    + pdfBloque
    + '<hr style="border:none;border-top:1px solid #eee;margin:20px 0;">'
    + '<p><strong>Senal de reserva (30%):</strong></p>'
    + '<p style="background:#f7f4ee;padding:12px;border-left:3px solid #b8943c;">- Beneficiario: <strong>Isla Sofia SLU</strong><br>- IBAN: <strong>ES26 3058 0794 3727 2001 3940</strong> (Cajamar)<br>- Concepto: <strong>Ref. ' + d.idCRM + ' - ' + d.nombre + ' - Pago 1/4</strong></p>'
    + '<p style="font-size:11px;color:#888;border-left:3px solid #d4a853;padding-left:10px;line-height:1.7;"><strong>CLAUSULA DE NO DEVOLUCION:</strong> Una vez efectuado cualquier pago, el cliente renuncia al derecho de devolucion en caso de desistimiento voluntario. Los importes quedan retenidos por Nido45 como compensacion por costes operativos, conforme al art. 1.124 CC.</p>'
    + '<p>Tel: <a href="tel:+34645476491">+34 645 476 491</a> | Email: <a href="mailto:nido45spain@gmail.com">nido45spain@gmail.com</a></p>'
    + '<p>Un cordial saludo,<br><strong>Hugo Andres Perea Lisbona</strong><br>Director Comercial NIDO45</p>'
    + _pie() + '</div>';
  _sendCliente(asunto, html, d.email);
}

function _enviarCasaListaCliente(d) {
  var asunto = '[CLIENTE] Tu casa NIDO45 esta lista - ' + d.nombre + ' - ' + d.modelo + ' - Pago 2/4';
  var html = _cab('PARA: CLIENTE','Tu casa esta lista en fabrica - Pago 2/4')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>, tu casa <strong>' + d.modelo + '</strong> ha completado fabricacion.</p>'
    + _tabla([['Modelo',d.modelo],['Referencia',d.idCRM],['Estado','Lista en fabrica - Pendiente embarque']])
    + '<p>Para autorizar el embarque: <strong>segundo pago (40%)</strong>:</p>'
    + '<p style="background:#f7f4ee;padding:12px;border-left:3px solid #b8943c;">- Isla Sofia SLU - IBAN ES26 3058 0794 3727 2001 3940 (Cajamar) - Concepto: Ref. ' + d.idCRM + ' - Pago 2/4</p>'
    + _pie() + '</div>';
  _sendCliente(asunto, html, d.email);
}

function _enviarLlegadaCliente(d) {
  var asunto = '[CLIENTE] Tu casa ha llegado a Espana - ' + d.nombre + ' - ' + d.modelo + ' - Pago 3/4';
  var html = _cab('PARA: CLIENTE','Tu casa ha llegado a Espana - Pago 3/4')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>, tu casa <strong>' + d.modelo + '</strong> ha llegado a Espana.</p>'
    + '<p>Para proceder con transporte e instalacion, <strong>tercer pago (20%)</strong>:</p>'
    + '<p style="background:#f7f4ee;padding:12px;border-left:3px solid #b8943c;">- Isla Sofia SLU - IBAN ES26 3058 0794 3727 2001 3940 - Concepto: Ref. ' + d.idCRM + ' - Pago 3/4</p>'
    + _pie() + '</div>';
  _sendCliente(asunto, html, d.email);
}

function _enviarObraCliente(d) {
  var asunto = '[CLIENTE] Inicio de obra - ' + d.nombre + ' - ' + d.modelo + ' - Pago final 4/4';
  var html = _cab('PARA: CLIENTE','Inicio de obra - Pago final 4/4')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>, el equipo NIDO45 ha comenzado el montaje de tu <strong>' + d.modelo + '</strong>.</p>'
    + '<p><strong>Pago final (10%)</strong> para proceder con entrega de llaves:</p>'
    + '<p style="background:#f7f4ee;padding:12px;border-left:3px solid #b8943c;">- Isla Sofia SLU - IBAN ES26 3058 0794 3727 2001 3940 - Concepto: Ref. ' + d.idCRM + ' - Pago 4/4 (FINAL)</p>'
    + _pie() + '</div>';
  _sendCliente(asunto, html, d.email);
}

function _enviarEntregaLlavesCliente(d) {
  var asunto = '[CLIENTE] Entrega de llaves NIDO45 - ' + d.nombre + ' - ' + d.modelo;
  var html = _cab('PARA: CLIENTE','Bienvenido a tu nueva casa NIDO45')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>, tu casa <strong>' + d.modelo + '</strong> esta lista para disfrutarla.</p>'
    + _tabla([['Referencia',d.idCRM],['Modelo',d.modelo],['Garantia estructura','3 anos'],['Garantia instalaciones','1 ano']])
    + '<p>Recibiras el <strong>Acta de Recepcion</strong> para firmar y activar la garantia.</p>'
    + '<p>Un abrazo,<br><strong>Hugo Andres Perea Lisbona</strong> - Director Comercial NIDO45</p>'
    + _pie() + '</div>';
  _sendCliente(asunto, html, d.email);
}

// ─────────────────────────────────────────────────────────────
// CORREOS INTERNOS — solo a EMAIL_DESTINO
// ─────────────────────────────────────────────────────────────

function _enviarVentaCerradaNido45(d) {
  var asunto = '[NIDO45] Venta cerrada - ' + d.nombre + ' - ' + d.modelo + ' - Iniciar LEM';
  var html = _cab('PARA: NIDO45', 'Venta cerrada - Iniciar Flujo Llave en Mano')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p><strong>Venta confirmada.</strong> Pago reserva 30% recibido.</p>'
    + _tabla([['Cliente',d.nombre],['Email',d.email],['Telefono',d.telefono],['Modelo',d.modelo+(d.nidos?' - '+d.nidos+' nido(s)':'')],['Ubicacion',d.parcela||'-'],['Flujo',d.flujo],['Referencia',d.idCRM]])
    + '<p><strong>Accion:</strong> Mover a etapa <strong>FABRICACION</strong> para disparar correos a fabrica y arquitecto.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

function _enviarFabrica(d) {
  var asunto = '[FABRICA] Nuevo pedido NIDO45 - ' + d.modelo + ' - ' + d.nombre + ' - Ref: ' + d.idCRM;
  var html = _cab('PARA: FABRICA','Pedido confirmado - ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Confirmamos inicio de fabricacion:</p>'
    + _tabla([['Referencia',d.idCRM],['Modelo',d.modelo],['Nidos',d.nidos||'-'],['Cliente',d.nombre],['Destino',d.parcela||'-'],['Flujo',d.flujo]])
    + '<p>Plazo: <strong>18 dias habiles</strong>. Notificar a NIDO45 al finalizar para coordinar embarque.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

function _enviarArquitecto(d) {
  var asunto = '[ARQUITECTO] Nuevo proyecto NIDO45 - ' + d.modelo + ' - ' + d.parcela + ' - Ref: ' + d.idCRM;
  var html = _cab('PARA: ARQUITECTO','Nuevo proyecto - ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Nuevo proyecto NIDO45 que requerira tu supervision tecnica:</p>'
    + _tabla([['Referencia',d.idCRM],['Modelo',d.modelo],['Nidos',d.nidos||'-'],['Cliente',d.nombre],['Ubicacion parcela',d.parcela||'-'],['Flujo',d.flujo]])
    + '<ul><li>Supervision y certificacion tecnica</li><li>Coordinacion con montadores e instaladores</li><li>Peritaje de recepcion</li><li>Informe final para entrega de llaves</li></ul>'
    + '<p>Casa lista aprox. en <strong>18 dias habiles</strong>. Te avisaremos antes del embarque.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

function _enviarEnvioFabrica(d) {
  var asunto = '[FABRICA] Luz verde para embarque - ' + d.modelo + ' - Ref: ' + d.idCRM;
  var html = _cab('PARA: FABRICA','Autorizacion de embarque - ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Pago 2/4 confirmado. <strong>Queda autorizado el embarque:</strong></p>'
    + _tabla([['Referencia',d.idCRM],['Modelo',d.modelo],['Cliente',d.nombre],['Destino',d.parcela||'-']])
    + '<p>Coordinar con agente de aduanas y confirmar fecha y BL a NIDO45.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

function _enviarEnvioDespachoAduanas(d) {
  var asunto = '[DESPACHO DE ADUANAS] Nueva importacion NIDO45 - ' + d.modelo + ' - Ref: ' + d.idCRM;
  var html = _cab('PARA: DESPACHO DE ADUANAS','Gestion de importacion - ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Nueva importacion NIDO45 en curso:</p>'
    + _tabla([['Referencia',d.idCRM],['Descripcion','Casa prefabricada modular - '+d.modelo],['Nidos',d.nidos||'-'],['Cliente',d.nombre],['Destino',d.parcela||'-'],['Regimen','Importacion CIF - Origen fabrica China']])
    + '<p>Remitiremos BL, packing list y factura comercial en breve.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

function _enviarLlegadaPerito(d) {
  var asunto = '[PERITO] Modulo llegado a destino - ' + d.modelo + ' - ' + d.nombre + ' - ' + d.parcela;
  var html = _cab('PARA: PERITO','Modulo en destino - Inspeccion de recepcion')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Modulo llegado al puerto de destino:</p>'
    + _tabla([['Referencia',d.idCRM],['Modelo',d.modelo],['Cliente',d.nombre],['Parcela destino',d.parcela||'-']])
    + '<p>Por favor, coordinar <strong>inspeccion de recepcion</strong> y emitir informe de peritaje.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

function _enviarTransporteDespacho(d) {
  var asunto = '[DESPACHO DE ADUANAS] Coordinar transporte a parcela - ' + d.modelo + ' - Ref: ' + d.idCRM;
  var html = _cab('PARA: DESPACHO DE ADUANAS','Transporte a parcela autorizado')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Pago 3/4 confirmado. Coordinar transporte desde puerto a parcela:</p>'
    + _tabla([['Referencia',d.idCRM],['Modelo',d.modelo],['Cliente',d.nombre],['Destino parcela',d.parcela||'-']])
    + '<p>Coordinar fecha con perito para supervisar descarga e instalacion.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

function _enviarTransportePerito(d) {
  var asunto = '[PERITO] Coordinar montaje e instalacion - ' + d.modelo + ' - ' + d.nombre;
  var html = _cab('PARA: PERITO','Coordinar equipo de obra en parcela')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Transporte a parcela autorizado. Coordinar en obra:</p>'
    + '<ul><li><strong>Montadores</strong> - ' + (d.nidos||'-') + ' nido(s) x 800 EUR/nido</li>'
    + '<li><strong>Descarga</strong> - ' + (d.nidos||'-') + ' nido(s) x 250 EUR/nido</li>'
    + '<li><strong>Instaladores</strong> - electrica, fontaneria, climatizacion (precio fijo)</li></ul>'
    + _tabla([['Referencia',d.idCRM],['Modelo',d.modelo],['Cliente',d.nombre],['Parcela',d.parcela||'-']])
    + _pie() + '</div>';
  _send(asunto, html);
}

function _enviarEntregaLlavesNido45(d) {
  var asunto = '[NIDO45] Proyecto completado - ' + d.nombre + ' - ' + d.idCRM;
  var html = _cab('PARA: NIDO45','Proyecto completado - Archivar expediente')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Etapa final: <strong>ENTREGA DE LLAVES</strong>.</p>'
    + _tabla([['Referencia',d.idCRM],['Cliente',d.nombre],['Email',d.email],['Modelo',d.modelo],['Parcela',d.parcela||'-']])
    + '<ul><li>Emitir y firmar Acta de Recepcion</li><li>Archivar expediente en Drive</li><li>Solicitar resena al cliente</li></ul>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// HELPERS DE ENVÍO
// ─────────────────────────────────────────────────────────────

// Correos internos: solo a EMAIL_DESTINO
function _send(asunto, htmlBody) {
  try {
    GmailApp.sendEmail(EMAIL_DESTINO, asunto, '', {htmlBody: htmlBody});
    Logger.log('[CRM] OK (interno): ' + asunto.substring(0, 70));
  } catch (err) {
    Logger.log('[CRM] ERROR email: ' + err.toString());
  }
}

// Correos [CLIENTE]: a d.email con BCC EMAIL_DESTINO
// Si d.email está vacío, envía solo a EMAIL_DESTINO
function _sendCliente(asunto, htmlBody, clienteEmail) {
  try {
    if (clienteEmail && clienteEmail.indexOf('@') > -1) {
      GmailApp.sendEmail(clienteEmail, asunto, '', {
        htmlBody: htmlBody,
        bcc: EMAIL_DESTINO
      });
      Logger.log('[CRM] OK (cliente): ' + clienteEmail + ' | ' + asunto.substring(0, 60));
    } else {
      // Sin email de cliente: va solo a EMAIL_DESTINO con aviso en asunto
      GmailApp.sendEmail(EMAIL_DESTINO, '[SIN EMAIL CLIENTE] ' + asunto, '', {htmlBody: htmlBody});
      Logger.log('[CRM] AVISO: sin email cliente, enviado a EMAIL_DESTINO | ' + asunto.substring(0, 60));
    }
  } catch (err) {
    Logger.log('[CRM] ERROR email cliente: ' + err.toString());
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS GENERALES
// ─────────────────────────────────────────────────────────────

function _cab(etiqueta, titulo) {
  return '<div style="background:#1a3c5e;color:#fff;padding:12px 20px;font-family:Arial,sans-serif;">'
    + '<div style="font-size:10px;letter-spacing:2px;color:#d4a853;text-transform:uppercase;">' + etiqueta + '</div>'
    + '<div style="font-size:17px;font-weight:700;margin-top:4px;">' + titulo + '</div></div>';
}

function _tabla(filas) {
  return '<table style="border-collapse:collapse;width:100%;margin:14px 0;border:1px solid #eee;">'
    + filas.map(function(f) {
        return '<tr><td style="padding:5px 10px;font-weight:600;color:#555;font-size:12px;white-space:nowrap;">' + f[0] + '</td>'
          + '<td style="padding:5px 10px;font-size:12px;">' + (f[1]||'-') + '</td></tr>';
      }).join('')
    + '</table>';
}

function _pie() {
  return '<hr style="border:none;border-top:1px solid #eee;margin:24px 0 8px;">'
    + '<p style="font-family:Arial,sans-serif;font-size:10px;color:#aaa;line-height:1.8;">'
    + 'NIDO45 - Isla Sofia SLU - NIF B26607044 - El Capitan, Almayate, 29792 Malaga<br>'
    + 'nido45spain@gmail.com - +34 645 476 491 - nido45.com<br>'
    + '<em>Mensaje generado automaticamente por el sistema CRM NIDO45</em></p>';
}

function _jsonResp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function _parseDatosRecord(fields, recId) {
  return {
    nombre:   fields[F_NOMBRE]   || '',
    email:    fields[F_EMAIL]    || '',
    telefono: fields[F_TELEFONO] || '',
    modelo:   _selectName(fields[F_MODELO]),
    nidos:    fields[F_NIDOS]    || 0,
    parcela:  fields[F_PARCELA]  || '',
    urlPDF:   fields[F_URL_PDF]  || '',
    flujo:    _selectName(fields[F_FLUJO]),
    idCRM:    fields[F_ID_CRM]   || recId
  };
}

function _selectName(val) {
  if (!val) return '';
  return (typeof val === 'object' && val.name) ? val.name : String(val);
}

function _fetchDatosRecord(recordId) {
  var token = PropertiesService.getScriptProperties().getProperty('AIRTABLE_TOKEN');
  if (!token) return {};
  var resp = UrlFetchApp.fetch(
    'https://api.airtable.com/v0/' + AIRTABLE_BASE + '/' + AIRTABLE_TABLE
      + '/' + recordId + '?returnFieldsByFieldId=true',
    { method: 'GET', headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) return {};
  var rec = JSON.parse(resp.getContentText());
  return _parseDatosRecord(rec.fields || {}, recordId);
}

// ─────────────────────────────────────────────────────────────
// TEST MANUAL
// ─────────────────────────────────────────────────────────────
function testPresupuestoEnviado() {
  procesarCambioEtapa('recTEST', 'Presupuesto enviado', {
    nombre:'Maria Garcia Lopez', email:'test@ejemplo.com', telefono:'+34 600 000 000',
    modelo:'Halcon', nidos:6, parcela:'Velez-Malaga, Malaga',
    urlPDF:'https://drive.google.com/file/d/EJEMPLO/view',
    flujo:'B', idCRM:'c099-TEST'
  });
}

function testTodasLasEtapas() {
  var d = { nombre:'Test', email:'test@ejemplo.com', telefono:'+34 600 000 000',
    modelo:'Cuco 36', nidos:3, parcela:'Almayate, Malaga', urlPDF:'',
    flujo:'B', idCRM:'cTEST-ALL' };
  ['Presupuesto enviado','Venta cerrada -> Flujo Llave en Mano','FABRICACION',
   'CASA LISTA','ENVIO','LLEGADA A DESTINO','TRANSPORTE E INSTALACION','OBRA','ENTREGA DE LLAVES'
  ].forEach(function(etapa) { procesarCambioEtapa('recTEST', etapa, d); Utilities.sleep(300); });
  Logger.log('Test completo -> cliente: test@ejemplo.com, BCC: ' + EMAIL_DESTINO);
}
