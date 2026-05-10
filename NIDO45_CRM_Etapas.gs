// ████████████████████████████████████████████████████████████████████████████
// NIDO45 — CRM ETAPAS · Motor de triggers completo
// v1.0 — Polling Airtable + Webhook endpoint
// ────────────────────────────────────────────────────────────────────────────
//
// INSTRUCCIONES DE INSTALACIÓN (leer antes de pegar):
//
// 1. En script.google.com → abre el proyecto de Presupuestos → añade un nuevo
//    archivo .gs con nombre "NIDO45_CRM_Etapas" y pega este contenido.
//
// 2. Configura las propiedades del script (Archivo → Propiedades del proyecto
//    → Propiedades del script) con estas claves:
//      AIRTABLE_TOKEN   → tu token de Airtable (starts with "pat...")
//      (EMAIL_DESTINO está hardcodeado en la constante de abajo)
//
// 3. ACTIVAR POLLING: Ejecuta la función instalarTriggerPolling() UNA SOLA VEZ.
//    Esto instala un trigger de tiempo que llama a pollAirtableEtapas() cada 5 min.
//
// 4. WEBHOOK (opcional, más inmediato): Despliega este script como Web App
//    separado (Deploy → New deployment → Web App → Execute as Me → Anyone).
//    Copia la URL del webhook y configura en Airtable:
//    Automations → Trigger: "When record matches condition [Etapa changes]"
//    → Action: "Send HTTP request" → POST → URL del webhook
//    → Body: {"recordId":"{{Record ID}}","etapa":"{{Etapa}}","datos":{...}}
//
// 5. AÑADIR ETAPAS LEM EN AIRTABLE (manual):
//    Abre la tabla "Contactos" → campo "Etapa" → edita opciones → añade:
//    FABRICACIÓN · CASA LISTA · ENVÍO · LLEGADA A DESTINO ·
//    TRANSPORTE E INSTALACIÓN · OBRA · ENTREGA DE LLAVES
//
// 6. ELIMINAR EL TRIGGER DUPLICADO (bug de emails repetidos):
//    Apps Script → Triggers (icono reloj) → elimina cualquier trigger de tiempo
//    que no sea el de pollAirtableEtapas.
//
// ████████████████████████████████████████████████████████████████████████████

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────
var EMAIL_DESTINO    = 'casamodularhm@gmail.com'; // Todos los correos van aquí por ahora
var AIRTABLE_BASE    = 'appYzLd8OUL2Kdw73';
var AIRTABLE_TABLE   = 'tblbduDaBy3LYNzyR';

// IDs de campo Airtable
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
// WEBHOOK ENDPOINT (doPost)
// Recibe llamadas de Airtable Automation o cualquier webhook
// ─────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var payload  = JSON.parse(e.postData.contents);
    var recordId = payload.recordId || '';
    var etapa    = payload.etapa    || '';

    if (!etapa || !recordId) {
      return _jsonResp({ok: false, error: 'Faltan campos: recordId / etapa'});
    }

    // Si el webhook incluye los datos ya resueltos, los usa directamente
    // Si no, los obtiene de Airtable
    var datos = (payload.datos && payload.datos.nombre)
      ? payload.datos
      : _fetchDatosRecord(recordId);

    procesarCambioEtapa(recordId, etapa, datos);

    // Actualiza el estado guardado para evitar que el polling reprocese
    PropertiesService.getScriptProperties().setProperty('etapa_' + recordId, etapa);

    return _jsonResp({ok: true, etapa: etapa, recordId: recordId});
  } catch (err) {
    Logger.log('doPost ERROR: ' + err.toString());
    return _jsonResp({ok: false, error: err.toString()});
  }
}

// ─────────────────────────────────────────────────────────────
// POLLING AIRTABLE
// Instalar con instalarTriggerPolling() una sola vez
// ─────────────────────────────────────────────────────────────
function instalarTriggerPolling() {
  // Elimina triggers previos del mismo nombre para evitar duplicados
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'pollAirtableEtapas') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('pollAirtableEtapas')
    .timeBased()
    .everyMinutes(5)
    .create();
  Logger.log('Trigger de polling instalado (cada 5 min).');
}

function pollAirtableEtapas() {
  var token = PropertiesService.getScriptProperties().getProperty('AIRTABLE_TOKEN');
  if (!token) {
    Logger.log('ERROR: AIRTABLE_TOKEN no configurado en propiedades del script.');
    return;
  }

  var url = 'https://api.airtable.com/v0/' + AIRTABLE_BASE + '/' + AIRTABLE_TABLE
    + '?fields[]=' + encodeURIComponent('Nombre')
    + '&fields[]=' + encodeURIComponent('Email')
    + '&fields[]=' + encodeURIComponent('Teléfono')
    + '&fields[]=' + encodeURIComponent('Etapa')
    + '&fields[]=' + encodeURIComponent('Modelo de interés')
    + '&fields[]=' + encodeURIComponent('Nidos')
    + '&fields[]=' + encodeURIComponent('Ubicación')
    + '&fields[]=' + encodeURIComponent('URL PDF')
    + '&fields[]=' + encodeURIComponent('Flujo')
    + '&fields[]=' + encodeURIComponent('ID_CRM');

  var opts = {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  };

  var resp = UrlFetchApp.fetch(url, opts);
  if (resp.getResponseCode() !== 200) {
    Logger.log('Airtable API error ' + resp.getResponseCode() + ': ' + resp.getContentText());
    return;
  }

  var records = JSON.parse(resp.getContentText()).records || [];
  var props   = PropertiesService.getScriptProperties();

  records.forEach(function(rec) {
    var etapaObj    = rec.fields[F_ETAPA] || rec.fields['Etapa'];
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
// LÓGICA PRINCIPAL: enrutador de etapas
// ─────────────────────────────────────────────────────────────
function procesarCambioEtapa(recordId, etapa, datos) {
  Logger.log('[CRM] Etapa: "' + etapa + '" | ' + datos.nombre + ' (' + datos.idCRM + ')');

  switch (etapa) {

    // ── PRE-VENTA ──────────────────────────────────────────
    case 'Presupuesto enviado':
      _enviarPresupuestoCliente(datos);
      break;

    case 'Venta cerrada -> Flujo Llave en Mano':
      _enviarVentaCerradaNido45(datos);
      break;

    // ── LEM: 8 ETAPAS ─────────────────────────────────────
    case 'FABRICACIÓN':
      _enviarFabrica(datos);
      _enviarArquitecto(datos);
      break;

    case 'CASA LISTA':
      _enviarCasaListaCliente(datos);
      break;

    case 'ENVÍO':
      _enviarEnvioFabrica(datos);
      _enviarEnvioDespachoAduanas(datos);
      break;

    case 'LLEGADA A DESTINO':
      _enviarLlegadaPerito(datos);
      _enviarLlegadaCliente(datos);
      break;

    case 'TRANSPORTE E INSTALACIÓN':
      _enviarTransporteDespacho(datos);
      _enviarTransportePerito(datos);
      break;

    case 'OBRA':
      _enviarObraCliente(datos);
      break;

    case 'ENTREGA DE LLAVES':
      _enviarEntregaLlavesCliente(datos);
      _enviarEntregaLlavesNido45(datos);
      break;

    default:
      Logger.log('[CRM] Etapa "' + etapa + '" sin acción configurada.');
  }
}

// ─────────────────────────────────────────────────────────────
// CORREOS — PRE-VENTA
// ─────────────────────────────────────────────────────────────

// [CLIENTE] Presupuesto enviado
function _enviarPresupuestoCliente(d) {
  var asunto = '[CLIENTE] Presupuesto Llave en Mano NIDO45 — ' + d.nombre
             + ' · ' + d.modelo + ' · Ref: ' + d.idCRM;

  var pdfBloque = d.urlPDF
    ? '<p style="margin:16px 0;">'
      + '<a href="' + d.urlPDF + '" style="background:#1a3c5e;color:#fff;padding:12px 24px;'
      + 'text-decoration:none;font-weight:bold;font-family:Arial,sans-serif;">📄 Abrir Presupuesto PDF</a>'
      + '</p>'
      + '<p style="font-size:11px;color:#888;font-family:Arial,sans-serif;">'
      + 'Si el botón no funciona, copia este enlace: ' + d.urlPDF + '</p>'
    : '<p style="color:#c0392b;font-family:Arial,sans-serif;">'
      + '⚠ PDF no disponible aún. Adjuntar manualmente antes de enviar al cliente.</p>';

  var html = _cab('PARA: CLIENTE', 'Tu propuesta personalizada — ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>,</p>'
    + '<p>Adjuntamos tu <strong>propuesta comercial llave en mano</strong> personalizada NIDO45. '
    + 'El presupuesto incluye sin excepción todos los servicios hasta la entrega de llaves: '
    + 'transporte CIF, despacho de aduanas, descarga en parcela, montadores, instaladores y honorarios de arquitecto y perito.</p>'
    + _tabla([
        ['Cliente', d.nombre],
        ['Modelo', d.modelo + (d.nidos ? ' · ' + d.nidos + ' nido(s)' : '')],
        ['Ubicación', d.parcela || '—'],
        ['Flujo', d.flujo],
        ['Referencia', d.idCRM]
      ])
    + pdfBloque
    + '<hr style="border:none;border-top:1px solid #eee;margin:20px 0;">'
    + '<p><strong>Próximo paso — Señal de reserva (30%):</strong><br>'
    + 'Para confirmar tu pedido, realiza la transferencia de la señal de reserva:</p>'
    + '<p style="background:#f7f4ee;padding:12px;border-left:3px solid #b8943c;">'
    + '· Beneficiario: <strong>Isla Sofía SLU</strong><br>'
    + '· IBAN: <strong>ES26 3058 0794 3727 2001 3940</strong> (Cajamar)<br>'
    + '· Concepto: <strong>Ref. ' + d.idCRM + ' — ' + d.nombre + ' — Pago 1/4</strong></p>'
    + '<p style="font-size:11px;color:#888;border-left:3px solid #d4a853;padding-left:10px;line-height:1.7;">'
    + '<strong>CLÁUSULA DE NO DEVOLUCIÓN:</strong> Una vez efectuado cualquier pago parcial o total, '
    + 'el cliente renuncia expresamente al derecho de devolución de los importes abonados en caso de '
    + 'desistimiento voluntario, cancelación del pedido o cambio de decisión. Los pagos quedan retenidos '
    + 'por Nido45 como compensación por costes operativos y de gestión, conforme al art. 1.124 del Código Civil.</p>'
    + '<p>¿Alguna duda? Estamos a tu disposición:<br>'
    + '📞 <a href="tel:+34645476491">+34 645 476 491</a> · '
    + '✉ <a href="mailto:nido45spain@gmail.com">nido45spain@gmail.com</a></p>'
    + '<p>Un cordial saludo,<br><strong>Hugo Andrés Perea Lisbona</strong><br>'
    + 'Director Comercial NIDO45 · Isla Sofía SLU</p>'
    + _pie() + '</div>';

  _send(asunto, html);
}

// [NIDO45] Venta cerrada
function _enviarVentaCerradaNido45(d) {
  var asunto = '[NIDO45] Venta cerrada — ' + d.nombre + ' · ' + d.modelo + ' · Iniciar LEM';
  var html = _cab('PARA: NIDO45', 'Venta cerrada · Iniciar Flujo Llave en Mano')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p><strong>¡Venta confirmada!</strong> El cliente ha aceptado el presupuesto y ha realizado el pago de reserva del 30%.</p>'
    + _tabla([
        ['Cliente', d.nombre],
        ['Email', d.email],
        ['Teléfono', d.telefono],
        ['Modelo', d.modelo + (d.nidos ? ' · ' + d.nidos + ' nido(s)' : '')],
        ['Ubicación', d.parcela || '—'],
        ['Flujo', d.flujo],
        ['Referencia', d.idCRM]
      ])
    + '<p><strong>Acción inmediata:</strong> Mueve el registro a la etapa <strong>FABRICACIÓN</strong> '
    + 'en el CRM para disparar los correos automáticos a fábrica y arquitecto.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// CORREOS — ETAPA 2: FABRICACIÓN
// ─────────────────────────────────────────────────────────────

// [FÁBRICA]
function _enviarFabrica(d) {
  var asunto = '[FÁBRICA] Nuevo pedido NIDO45 — ' + d.modelo + ' · ' + d.nombre + ' · Ref: ' + d.idCRM;
  var html = _cab('PARA: FÁBRICA', 'Pedido confirmado — ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Estimado equipo de fábrica,</p>'
    + '<p>Confirmamos el inicio de fabricación del siguiente pedido NIDO45:</p>'
    + _tabla([
        ['Referencia', d.idCRM],
        ['Modelo', d.modelo],
        ['Nidos', d.nidos || '—'],
        ['Cliente final', d.nombre],
        ['Destino', d.parcela || '—'],
        ['Flujo', d.flujo]
      ])
    + '<p>Plazo acordado: <strong>18 días hábiles</strong> desde confirmación de este pedido.</p>'
    + '<p>Una vez lista la casa, notificar a NIDO45 para coordinar inspección fotográfica y embarque.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// [ARQUITECTO]
function _enviarArquitecto(d) {
  var asunto = '[ARQUITECTO] Nuevo proyecto NIDO45 — ' + d.modelo + ' · ' + d.parcela + ' · Ref: ' + d.idCRM;
  var html = _cab('PARA: ARQUITECTO', 'Nuevo proyecto — ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Estimado arquitecto / perito,</p>'
    + '<p>Iniciamos un nuevo proyecto NIDO45 que requerirá tu supervisión técnica:</p>'
    + _tabla([
        ['Referencia', d.idCRM],
        ['Modelo', d.modelo],
        ['Nidos', d.nidos || '—'],
        ['Cliente', d.nombre],
        ['Ubicación parcela', d.parcela || '—'],
        ['Flujo', d.flujo]
      ])
    + '<p>Tu intervención incluye:</p>'
    + '<ul><li>Supervisión y certificación técnica del proyecto</li>'
    + '<li>Coordinación con montadores e instaladores</li>'
    + '<li>Peritaje de recepción a llegada del módulo</li>'
    + '<li>Informe final para entrega de llaves</li></ul>'
    + '<p>La casa estará lista aprox. en <strong>18 días hábiles</strong>. Te avisaremos con antelación al embarque.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// CORREOS — ETAPA 3: CASA LISTA
// ─────────────────────────────────────────────────────────────

// [CLIENTE] Pago 2/4
function _enviarCasaListaCliente(d) {
  var asunto = '[CLIENTE] Tu casa NIDO45 está lista — ' + d.nombre + ' · ' + d.modelo + ' — Pago 2/4';
  var html = _cab('PARA: CLIENTE', '¡Tu casa está lista en fábrica! · Pago 2/4')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>,</p>'
    + '<p>¡Excelente noticia! Tu casa NIDO45 <strong>' + d.modelo + '</strong> ha completado el proceso '
    + 'de fabricación y está lista para la inspección y el embarque.</p>'
    + _tabla([['Modelo', d.modelo], ['Referencia', d.idCRM], ['Estado', 'Lista en fábrica · Pendiente embarque']])
    + '<p>Para autorizar el embarque necesitamos confirmar el <strong>segundo pago (40% del total)</strong>:</p>'
    + '<p style="background:#f7f4ee;padding:12px;border-left:3px solid #b8943c;">'
    + '· Beneficiario: <strong>Isla Sofía SLU</strong><br>'
    + '· IBAN: <strong>ES26 3058 0794 3727 2001 3940</strong> (Cajamar)<br>'
    + '· Concepto: <strong>Ref. ' + d.idCRM + ' — ' + d.nombre + ' — Pago 2/4</strong></p>'
    + '<p>Una vez confirmado el pago, autorizaremos el embarque y te informaremos del plazo de llegada.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// CORREOS — ETAPA 4: ENVÍO
// ─────────────────────────────────────────────────────────────

// [FÁBRICA] Luz verde embarque
function _enviarEnvioFabrica(d) {
  var asunto = '[FÁBRICA] Luz verde para embarque — ' + d.modelo + ' · Ref: ' + d.idCRM;
  var html = _cab('PARA: FÁBRICA', 'Autorización de embarque — ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Estimado equipo de fábrica,</p>'
    + '<p>El cliente ha confirmado el pago 2/4. <strong>Queda autorizado el embarque</strong> del siguiente pedido:</p>'
    + _tabla([['Referencia', d.idCRM], ['Modelo', d.modelo], ['Cliente', d.nombre], ['Destino', d.parcela || '—']])
    + '<p>Por favor, coordinar con el agente de aduanas y confirmar fecha de embarque y número de BL a NIDO45.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// [DESPACHO DE ADUANAS] Nueva carga
function _enviarEnvioDespachoAduanas(d) {
  var asunto = '[DESPACHO DE ADUANAS] Nueva importación NIDO45 — ' + d.modelo + ' · Ref: ' + d.idCRM;
  var html = _cab('PARA: DESPACHO DE ADUANAS', 'Gestión de importación — ' + d.modelo)
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Estimado despacho de aduanas,</p>'
    + '<p>Les informamos del inicio de una nueva importación NIDO45:</p>'
    + _tabla([
        ['Referencia', d.idCRM],
        ['Descripción', 'Casa prefabricada modular — ' + d.modelo],
        ['Nidos', d.nidos || '—'],
        ['Cliente final', d.nombre],
        ['Destino', d.parcela || '—'],
        ['Régimen', 'Importación CIF · Origen fábrica China']
      ])
    + '<p>En breve remitiremos la documentación de embarque: BL, packing list y factura comercial.</p>'
    + '<p>Puerto de entrada: pendiente de confirmar con fábrica. Les informaremos en cuanto dispongamos del BL.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// CORREOS — ETAPA 5: LLEGADA A DESTINO
// ─────────────────────────────────────────────────────────────

// [PERITO] Inspección de recepción
function _enviarLlegadaPerito(d) {
  var asunto = '[PERITO] Módulo llegado a destino — ' + d.modelo + ' · ' + d.nombre + ' · ' + d.parcela;
  var html = _cab('PARA: PERITO', 'Módulo en destino · Inspección de recepción')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Estimado perito,</p>'
    + '<p>El módulo del siguiente proyecto ha llegado al puerto de destino:</p>'
    + _tabla([['Referencia', d.idCRM], ['Modelo', d.modelo], ['Cliente', d.nombre], ['Parcela destino', d.parcela || '—']])
    + '<p>Por favor, coordinar y realizar la <strong>inspección de recepción</strong> del módulo '
    + 'y emitir el informe de peritaje correspondiente.</p>'
    + '<p>Una vez recibido el informe, procederemos a coordinar el transporte a parcela con el despacho de aduanas.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// [CLIENTE] Casa en España + Pago 3/4
function _enviarLlegadaCliente(d) {
  var asunto = '[CLIENTE] Tu casa ha llegado a España — ' + d.nombre + ' · ' + d.modelo + ' — Pago 3/4';
  var html = _cab('PARA: CLIENTE', 'Tu casa ha llegado a España · Pago 3/4')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>,</p>'
    + '<p>¡Tu casa NIDO45 <strong>' + d.modelo + '</strong> ha llegado a España y se encuentra en el puerto de destino!</p>'
    + '<p>Nuestro perito está coordinando la inspección de recepción. Una vez validada, organizaremos el transporte hasta tu parcela.</p>'
    + '<p>Para proceder con el transporte e instalación, necesitamos el <strong>tercer pago (20%)</strong>:</p>'
    + '<p style="background:#f7f4ee;padding:12px;border-left:3px solid #b8943c;">'
    + '· Beneficiario: <strong>Isla Sofía SLU</strong><br>'
    + '· IBAN: <strong>ES26 3058 0794 3727 2001 3940</strong> (Cajamar)<br>'
    + '· Concepto: <strong>Ref. ' + d.idCRM + ' — ' + d.nombre + ' — Pago 3/4</strong></p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// CORREOS — ETAPA 6: TRANSPORTE E INSTALACIÓN
// ─────────────────────────────────────────────────────────────

// [DESPACHO DE ADUANAS] Transporte a parcela
function _enviarTransporteDespacho(d) {
  var asunto = '[DESPACHO DE ADUANAS] Coordinar transporte a parcela — ' + d.modelo + ' · Ref: ' + d.idCRM;
  var html = _cab('PARA: DESPACHO DE ADUANAS', 'Transporte a parcela autorizado')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Estimado despacho de aduanas,</p>'
    + '<p>El cliente ha confirmado el pago 3/4. Rogamos coordinen el transporte del módulo '
    + 'desde el puerto hasta la parcela del cliente:</p>'
    + _tabla([['Referencia', d.idCRM], ['Modelo', d.modelo], ['Cliente', d.nombre], ['Destino parcela', d.parcela || '—']])
    + '<p>Coordinar la fecha de entrega con el perito asignado para que supervise la descarga e instalación.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// [PERITO] Coordinar montadores e instaladores
function _enviarTransportePerito(d) {
  var asunto = '[PERITO] Coordinar montaje e instalación en parcela — ' + d.modelo + ' · ' + d.nombre;
  var html = _cab('PARA: PERITO', 'Coordinar equipo de obra en parcela')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Estimado perito,</p>'
    + '<p>El transporte a parcela ha sido autorizado. Por favor, coordinar la presencia en obra de:</p>'
    + '<ul><li><strong>Montadores</strong> — ' + (d.nidos || '—') + ' nido(s) × 800 €/nido</li>'
    + '<li><strong>Equipo de descarga</strong> — ' + (d.nidos || '—') + ' nido(s) × 250 €/nido</li>'
    + '<li><strong>Instaladores</strong> — eléctrica, fontanería y climatización (precio fijo)</li></ul>'
    + _tabla([['Referencia', d.idCRM], ['Modelo', d.modelo], ['Cliente', d.nombre], ['Parcela', d.parcela || '—']])
    + '<p>Confirmar fecha prevista de inicio de obra a NIDO45 para notificar al cliente.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// CORREOS — ETAPA 7: OBRA
// ─────────────────────────────────────────────────────────────

// [CLIENTE] Inicio de obra + Pago 4/4
function _enviarObraCliente(d) {
  var asunto = '[CLIENTE] Inicio de obra — ' + d.nombre + ' · ' + d.modelo + ' — Pago final 4/4';
  var html = _cab('PARA: CLIENTE', 'Inicio de obra en tu parcela · Pago final 4/4')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>,</p>'
    + '<p>¡El equipo NIDO45 ha comenzado los trabajos de montaje e instalación de tu casa '
    + '<strong>' + d.modelo + '</strong>! Nuestro perito está supervisando todos los trabajos.</p>'
    + '<p>Para proceder con la entrega de llaves, necesitamos confirmar el <strong>pago final (10%)</strong>:</p>'
    + '<p style="background:#f7f4ee;padding:12px;border-left:3px solid #b8943c;">'
    + '· Beneficiario: <strong>Isla Sofía SLU</strong><br>'
    + '· IBAN: <strong>ES26 3058 0794 3727 2001 3940</strong> (Cajamar)<br>'
    + '· Concepto: <strong>Ref. ' + d.idCRM + ' — ' + d.nombre + ' — Pago 4/4 (FINAL)</strong></p>'
    + '<p>Una vez confirmado el pago y finalizadas las instalaciones, procederemos a la entrega formal de llaves.</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// CORREOS — ETAPA 8: ENTREGA DE LLAVES
// ─────────────────────────────────────────────────────────────

// [CLIENTE] Entrega final
function _enviarEntregaLlavesCliente(d) {
  var asunto = '[CLIENTE] ¡Entrega de llaves! NIDO45 — ' + d.nombre + ' · ' + d.modelo;
  var html = _cab('PARA: CLIENTE', '🎉 ¡Bienvenido a tu nueva casa NIDO45!')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>Hola <strong>' + d.nombre + '</strong>,</p>'
    + '<p>¡Es un placer comunicarte que tu casa NIDO45 <strong>' + d.modelo + '</strong> '
    + 'ha sido completada y está lista para que la disfrutes!</p>'
    + _tabla([
        ['Referencia', d.idCRM],
        ['Modelo', d.modelo],
        ['Garantía estructura', '3 años'],
        ['Garantía instalaciones', '1 año']
      ])
    + '<p>En breve recibirás el <strong>Acta de Recepción</strong> para su firma. '
    + 'Este documento formaliza la entrega y activa la garantía.</p>'
    + '<p>¡Gracias por confiar en NIDO45! Estamos siempre a tu disposición para cualquier consulta posventa.<br>'
    + '📞 <a href="tel:+34645476491">+34 645 476 491</a> · '
    + '✉ <a href="mailto:nido45spain@gmail.com">nido45spain@gmail.com</a></p>'
    + '<p>Un abrazo,<br><strong>Hugo Andrés Perea Lisbona</strong><br>'
    + 'Director Comercial NIDO45</p>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// [NIDO45] Cierre del expediente
function _enviarEntregaLlavesNido45(d) {
  var asunto = '[NIDO45] Proyecto completado · Entrega de llaves — ' + d.nombre + ' · ' + d.idCRM;
  var html = _cab('PARA: NIDO45', 'Proyecto completado · Archivar expediente')
    + '<div style="font-family:Arial,sans-serif;padding:20px;">'
    + '<p>El proyecto ha llegado a la etapa final: <strong>ENTREGA DE LLAVES</strong>.</p>'
    + _tabla([['Referencia', d.idCRM], ['Cliente', d.nombre], ['Modelo', d.modelo], ['Parcela', d.parcela || '—']])
    + '<p><strong>Pendiente:</strong></p>'
    + '<ul><li>Emitir y firmar Acta de Recepción con el cliente</li>'
    + '<li>Archivar expediente completo en Drive</li>'
    + '<li>Solicitar reseña / testimonio al cliente</li></ul>'
    + _pie() + '</div>';
  _send(asunto, html);
}

// ─────────────────────────────────────────────────────────────
// HELPERS PRIVADOS
// ─────────────────────────────────────────────────────────────

function _send(asunto, htmlBody) {
  try {
    GmailApp.sendEmail(EMAIL_DESTINO, asunto, '', {htmlBody: htmlBody});
    Logger.log('[CRM] Email enviado → ' + EMAIL_DESTINO + ' | ' + asunto.substring(0, 60) + '...');
  } catch (err) {
    Logger.log('[CRM] ERROR enviando email: ' + err.toString());
  }
}

function _cab(etiqueta, titulo) {
  return '<div style="background:#1a3c5e;color:#fff;padding:12px 20px;font-family:Arial,sans-serif;">'
    + '<div style="font-size:10px;letter-spacing:2px;color:#d4a853;text-transform:uppercase;">' + etiqueta + '</div>'
    + '<div style="font-size:17px;font-weight:700;margin-top:4px;">' + titulo + '</div>'
    + '</div>';
}

function _tabla(filas) {
  var rows = filas.map(function(f) {
    return '<tr>'
      + '<td style="padding:5px 10px;font-weight:600;color:#555;font-size:12px;white-space:nowrap;">' + f[0] + '</td>'
      + '<td style="padding:5px 10px;font-size:12px;">' + (f[1] || '—') + '</td>'
      + '</tr>';
  }).join('');
  return '<table style="border-collapse:collapse;width:100%;margin:14px 0;border:1px solid #eee;">' + rows + '</table>';
}

function _pie() {
  return '<hr style="border:none;border-top:1px solid #eee;margin:24px 0 8px;">'
    + '<p style="font-family:Arial,sans-serif;font-size:10px;color:#aaa;line-height:1.8;">'
    + 'NIDO45 · Isla Sofía SLU · NIF B26607044 · El Capitán, Almayate, 29792 Málaga<br>'
    + 'nido45spain@gmail.com · +34 645 476 491 · nido45.com<br>'
    + '<em>Mensaje generado automáticamente por el sistema CRM NIDO45</em></p>';
}

function _jsonResp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _parseDatosRecord(fields, recId) {
  return {
    nombre:   fields[F_NOMBRE]  || fields['Nombre']           || '',
    email:    fields[F_EMAIL]   || fields['Email']             || '',
    telefono: fields[F_TELEFONO]|| fields['Teléfono']          || '',
    modelo:   _selectName(fields[F_MODELO] || fields['Modelo de interés']),
    nidos:    fields[F_NIDOS]   || fields['Nidos']             || 0,
    parcela:  fields[F_PARCELA] || fields['Ubicación']         || '',
    urlPDF:   fields[F_URL_PDF] || fields['URL PDF']           || '',
    flujo:    _selectName(fields[F_FLUJO] || fields['Flujo']),
    idCRM:    fields[F_ID_CRM]  || fields['ID_CRM']            || recId
  };
}

function _selectName(val) {
  if (!val) return '';
  return (typeof val === 'object' && val.name) ? val.name : String(val);
}

function _fetchDatosRecord(recordId) {
  var token = PropertiesService.getScriptProperties().getProperty('AIRTABLE_TOKEN');
  if (!token) return {};
  var url  = 'https://api.airtable.com/v0/' + AIRTABLE_BASE + '/' + AIRTABLE_TABLE + '/' + recordId;
  var resp = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() !== 200) return {};
  var rec = JSON.parse(resp.getContentText());
  return _parseDatosRecord(rec.fields || {}, recordId);
}

// ─────────────────────────────────────────────────────────────
// TEST MANUAL — ejecutar desde el editor para probar un correo
// ─────────────────────────────────────────────────────────────
function testPresupuestoEnviado() {
  procesarCambioEtapa('recTEST', 'Presupuesto enviado', {
    nombre: 'María García López', email: 'test@ejemplo.com', telefono: '+34 600 000 000',
    modelo: 'Halcón', nidos: 6, parcela: 'Vélez-Málaga, Málaga',
    urlPDF: 'https://drive.google.com/file/d/EJEMPLO/view',
    flujo: 'B — Terreno urbano', idCRM: 'c099-TEST'
  });
}

function testFabricacion() {
  procesarCambioEtapa('recTEST', 'FABRICACIÓN', {
    nombre: 'María García López', email: 'test@ejemplo.com', telefono: '+34 600 000 000',
    modelo: 'Halcón', nidos: 6, parcela: 'Vélez-Málaga, Málaga', urlPDF: '',
    flujo: 'B — Terreno urbano', idCRM: 'c099-TEST'
  });
}

function testTodasLasEtapas() {
  var d = {
    nombre: 'Test Completo', email: 'test@ejemplo.com', telefono: '+34 600 000 000',
    modelo: 'Cuco 36', nidos: 3, parcela: 'Almayate, Málaga', urlPDF: '',
    flujo: 'B — Terreno urbano', idCRM: 'cTEST-ALL'
  };
  var etapas = [
    'Presupuesto enviado', 'Venta cerrada -> Flujo Llave en Mano',
    'FABRICACIÓN', 'CASA LISTA', 'ENVÍO',
    'LLEGADA A DESTINO', 'TRANSPORTE E INSTALACIÓN', 'OBRA', 'ENTREGA DE LLAVES'
  ];
  etapas.forEach(function(etapa) {
    procesarCambioEtapa('recTEST', etapa, d);
    Utilities.sleep(500);
  });
  Logger.log('Test completo. Revisa ' + EMAIL_DESTINO);
}
