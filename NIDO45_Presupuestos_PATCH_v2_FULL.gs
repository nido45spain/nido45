// ████████████████████████████████████████████████████████████████████████████
// NIDO45 — PATCH v2 COMPLETO: Precios llave en mano + Flujos A/B/C
// ────────────────────────────────────────────────────────────────────────────
// INSTRUCCIONES DE INSTALACIÓN:
//   1. Abre script.google.com → proyecto Nido45 → archivo Presupuestos.gs
//   2. Ve al FINAL del archivo y pega TODO este contenido
//   3. Guarda (Ctrl+S) → las funciones redefinidas aquí sobreescriben las originales
//   4. Ejecuta testGenerarPDF_v2() para verificar precios antes de deployar
//   5. Deploy → Implementar como aplicación web → Nueva versión
// ████████████████████████████████████████████████████████████████████████████

// ── TABLA DE MODELOS v2 (nidos, m2, contenedor) ──────────────────────────────
var PRECIOS_V2 = {
  "Gorrión":  { nidos: 1,  m2: 14.3,  pvp: 6000,  m2_suelo: 14.3,  m2_paredes: 24.9,  cont_tipo: "40HQ", cont_num: 1 },
  "Halcón":   { nidos: 6,  m2: 90.0,  pvp: 36000, m2_suelo: 90.0,  m2_paredes: 89.7,  cont_tipo: "40HQ", cont_num: 1 },
  "Águila":   { nidos: 10, m2: 150.0, pvp: 60000, m2_suelo: 150.0, m2_paredes: 114.4, cont_tipo: "40HQ", cont_num: 2 },
  "Flamenco": { nidos: 2,  m2: 20.0,  pvp: 15000, m2_suelo: 14.3,  m2_paredes: 24.9,  cont_tipo: "20ft", cont_num: 1 },
  "Colibrí":  { nidos: 3,  m2: 32.0,  pvp: 36000, m2_suelo: 32.0,  m2_paredes: 31.6,  cont_tipo: "propio", cont_num: 1 },
  "Cuco 36":  { nidos: 3,  m2: 36.0,  pvp: 17500, m2_suelo: 36.0,  m2_paredes: 43.1,  cont_tipo: "40HQ", cont_num: 1 },
  "Cuco 68":  { nidos: 6,  m2: 65.0,  pvp: 25000, m2_suelo: 65.0,  m2_paredes: 80.5,  cont_tipo: "40HQ", cont_num: 1 }
};

// ── PRECIOS LLAVE EN MANO (€) ────────────────────────────────────────────────
var LLAVE_EN_MANO = {
  montadores_nido:  800,   // € por nido
  instaladores:    5000,   // € fijo por proyecto
  transporte_nido:  500,   // € por nido (base: Algeciras→Málaga = 130 km)
  descarga_nido:    250,   // € por nido
  despacho_nido:    250,   // € por nido
  km_ref:           130    // km referencia Algeciras→Málaga
};

// ── TABLA DISTANCIAS DESDE ALGECIRAS (km) ────────────────────────────────────
var DISTANCIAS_KM = {
  "algeciras":5,"tarifa":30,"la linea":22,"los barrios":12,"san roque":18,
  "cadiz":50,"jerez":82,"el puerto":65,"sanlucar":87,"chipiona":95,
  "malaga":130,"marbella":108,"estepona":87,"fuengirola":100,"torremolinos":118,
  "benalmadena":112,"nerja":172,"velez":155,"almayate":138,"antequera":145,
  "ronda":97,"coin":120,"alhaurin":125,
  "sevilla":212,"dos hermanas":219,"alcala de guadaira":222,"utrera":188,
  "huelva":262,"moguer":268,"lepe":280,"ayamonte":298,
  "granada":232,"otura":238,"motril":190,"loja":185,"baza":312,
  "almeria":352,"roquetas":345,"nijar":330,"vera":385,
  "cordoba":267,"lucena":220,"pozoblanco":315,
  "jaen":312,"linares":278,"ubeda":320,"baeza":308,
  "murcia":433,"cartagena":418,"lorca":405,
  "alicante":543,"elche":532,"torrevieja":518,"benidorm":512,
  "cocentaina":562,"alcoy":568,"denia":540,
  "valencia":613,"castellon":668,"gandia":580,
  "zaragoza":873,"huesca":953,"teruel":758,
  "barcelona":1113,"tarragona":1003,"lleida":963,"girona":1163,
  "bilbao":1083,"vitoria":1003,"san sebastian":1163,
  "pamplona":1023,"logrono":953,
  "santander":1073,"oviedo":1133,"gijon":1143,"aviles":1153,
  "a coruna":1303,"santiago":1273,"vigo":1253,"pontevedra":1263,"lugo":1333,
  "valladolid":758,"burgos":838,"leon":878,"salamanca":708,"zamora":748,
  "madrid":658,"alcobendas":668,"getafe":652,"mostoles":655,"leganes":650,
  "alcala":683,"colmenar":682,"san martin":662,"guadalajara":693,"alcazar":593,
  "toledo":628,"talavera":608,"ciudad real":493,"albacete":543,
  "badajoz":423,"caceres":473,"merida":398,"plasencia":533,
  "gran canaria":1953,"arucas":1953,"las palmas":1953,
  "tenerife":2003,"santa cruz":2003,
  "lanzarote":1853,"fuerteventura":1903,
  "ibiza":753,"palma":853,"menorca":953,
  "sintra":463,"lisboa":453,"setubal":473,"porto":623,
  "_default":130
};

function calcularDistanciaKm(parcela) {
  if (!parcela) return LLAVE_EN_MANO.km_ref;
  var p = parcela.toLowerCase()
    .replace(/[áàä]/g,"a").replace(/[éèë]/g,"e").replace(/[íìï]/g,"i")
    .replace(/[óòö]/g,"o").replace(/[úùü]/g,"u").replace(/ñ/g,"n");
  var best = null, bestLen = 0;
  for (var city in DISTANCIAS_KM) {
    if (city === "_default") continue;
    if (p.indexOf(city) > -1 && city.length > bestLen) {
      best = city; bestLen = city.length;
    }
  }
  return best ? DISTANCIAS_KM[best] : DISTANCIAS_KM["_default"];
}

// ── CALCULO DE PRECIOS LLAVE EN MANO ─────────────────────────────────────────
function calcularPrecios(d, modelo) {
  var pv2     = PRECIOS_V2[modelo] || PRECIOS[modelo] || {};
  var pvpBase = pv2.pvp        || 0;
  var m2S     = pv2.m2_suelo   || 0;
  var m2P     = pv2.m2_paredes || 0;
  var nidos   = pv2.nidos      || 1;
  var m2Mod   = pv2.m2         || m2S;

  var eSPC  = (d.suelo    && d.suelo.indexOf("SPC")    > -1) ? Math.round(m2S * EXTRAS_M2.spc)      : 0;
  var eRad  = (d.radiante && d.radiante.indexOf("agua") > -1) ? Math.round(m2S * EXTRAS_M2.radiante) : 0;
  var eBam  = (d.paredes  && d.paredes.indexOf("Bamboo") > -1) ? Math.round(m2P * EXTRAS_M2.bamboo)  : 0;
  var eCar  = (d.paredes  && (d.paredes.indexOf("Carbon") > -1 || d.paredes.indexOf("Carved") > -1)) ? Math.round(m2P * EXTRAS_M2.carbon) : 0;
  var eFach = (d.fachada_color && d.fachada_color.toLowerCase().indexOf("color") > -1) ? Math.round(m2P * 0.7 * EXTRAS_M2.fachada) : 0;

  var pvpProd = pvpBase + eSPC + eRad + eBam + eCar + eFach;
  var ci      = desglosarc_CIF(pvpBase, pv2.cont_tipo || "40HQ", pv2.cont_num || 1);

  var distKm  = calcularDistanciaKm(d.parcela || "");
  var tpNido  = Math.round(LLAVE_EN_MANO.transporte_nido * distKm / LLAVE_EN_MANO.km_ref);
  var mont    = nidos * LLAVE_EN_MANO.montadores_nido;
  var inst    = LLAVE_EN_MANO.instaladores;
  var transp  = nidos * tpNido;
  var descar  = nidos * LLAVE_EN_MANO.descarga_nido;
  var desp    = nidos * LLAVE_EN_MANO.despacho_nido;
  var pctArq  = (m2Mod <= 50) ? 0.12 : 0.10;
  var arqPer  = Math.round(ci.cif * pctArq);
  var total   = pvpProd + mont + inst + transp + descar + desp + arqPer;

  return {
    pvpBase: pvpBase, pvpProd: pvpProd,
    extraSPC: eSPC, extraRadiante: eRad, extraBamboo: eBam, extraCarbon: eCar, extraFachada: eFach,
    cifInfo: ci,
    nidos: nidos, distKm: distKm, tpNido: tpNido,
    montadores: mont, instaladores: inst,
    transporte: transp, descarga: descar, despachoT: desp,
    arqPerito: arqPer, pctArq: pctArq,
    totalLEM: total,
    pago1: Math.round(total * 0.30),
    pago2: Math.round(total * 0.40),
    pago3: Math.round(total * 0.20),
    pago4: Math.round(total * 0.10),
    m2Suelo: m2S, m2Paredes: m2P, m2Mod: m2Mod,
    pvpBeneficio: pvpBase,
    montajeMin: mont, montajeMax: mont,
    arqMin: arqPer, arqMax: arqPer,
    totalMin: total, totalMax: total
  };
}

// ── GENERADOR PRINCIPAL ───────────────────────────────────────────────────────
function generarPresupuesto(datos) {
  var ref     = generarReferencia(datos.nombre);
  var modelo  = detectarModelo(datos.modelo || "");
  var precios = calcularPrecios(datos, modelo);
  datos._nidos = precios.nidos;
  var html    = buildPresupuestoHTML(datos, modelo, precios, ref);
  var pdf     = htmlToPDF(html, ref);
  var url     = guardarEnDrive(pdf, ref);
  notificarHugo(datos, ref, url, precios);
  return url;
}

// ── HTML PRESUPUESTO LLAVE EN MANO ────────────────────────────────────────────
function buildPresupuestoHTML(d, modelo, p, ref) {
  var logo   = logoSVG();
  var fecha  = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy");
  var flujo  = d.flujo || "B";

  var secTerreno = "";
  if (flujo === "A") {
    var presTerreno = d.presupuesto_terreno ? fmt(parseFloat(d.presupuesto_terreno)) : "por determinar";
    var comInmob    = d.precio_terreno ? fmt(Math.round(parseFloat(d.precio_terreno) * 0.025)) : "2,5% del precio final";
    var comNido45   = d.precio_terreno ? fmt(Math.round(parseFloat(d.precio_terreno) * 0.025)) : "2,5% del precio final";
    secTerreno = '<div class="section terreno">'
      + '<h3>🏡 Servicio de búsqueda de terreno</h3>'
      + '<p>En base a su inversión prevista de <strong>' + presTerreno + '</strong>, Nido45 y su red de partners inmobiliarios localizarán parcelas urbanas disponibles en la zona indicada.</p>'
      + '<table class="desglose"><tr><td>Comisión partner inmobiliario</td><td class="num">' + comInmob + '</td></tr>'
      + '<tr><td>Comisión Nido45 (gestión)</td><td class="num">' + comNido45 + '</td></tr>'
      + '<tr class="subtotal"><td colspan="2">Precio del terreno: en documento separado adjunto</td></tr></table>'
      + '</div>';
  }

  var secDescarga = "";
  if (flujo === "C") {
    secDescarga = '<div class="aviso aviso-naranja">'
      + '<strong>⚠️ NOTA IMPORTANTE — Terreno no urbanizable</strong><br>'
      + 'Nido45 declina toda responsabilidad respecto a la viabilidad urbanística, licencias de obra, permisos de uso del suelo y cualquier trámite administrativo derivado de la condición no urbana de la parcela indicada. '
      + 'El cliente asume íntegramente la responsabilidad de verificar la legalidad de la construcción en dicha parcela antes de realizar cualquier pago. '
      + 'Nido45 prestará únicamente los servicios técnicos y logísticos detallados en este presupuesto.</div>';
  }

  var extrasHTML = "";
  if (p.extraSPC > 0)    extrasHTML += '<tr><td>&nbsp;&nbsp;&nbsp;+ Suelo SPC</td><td class="num">+' + fmt(p.extraSPC) + '</td></tr>';
  if (p.extraRadiante>0) extrasHTML += '<tr><td>&nbsp;&nbsp;&nbsp;+ Suelo radiante por agua</td><td class="num">+' + fmt(p.extraRadiante) + '</td></tr>';
  if (p.extraBamboo > 0) extrasHTML += '<tr><td>&nbsp;&nbsp;&nbsp;+ Paredes Bamboo Fiber</td><td class="num">+' + fmt(p.extraBamboo) + '</td></tr>';
  if (p.extraCarbon > 0) extrasHTML += '<tr><td>&nbsp;&nbsp;&nbsp;+ Paredes Carbon/Carved</td><td class="num">+' + fmt(p.extraCarbon) + '</td></tr>';
  if (p.extraFachada> 0) extrasHTML += '<tr><td>&nbsp;&nbsp;&nbsp;+ Fachada color personalizado</td><td class="num">+' + fmt(p.extraFachada) + '</td></tr>';

  var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">'
    + '<style>'
    + 'body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;margin:0;padding:32px;max-width:780px;margin:auto}'
    + 'h2{color:#1a3c5e;font-size:16px;border-bottom:2px solid #1a3c5e;padding-bottom:4px}'
    + 'h3{color:#2c6e9e;font-size:14px;margin-top:20px}'
    + '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}'
    + '.ref{font-size:11px;color:#666;text-align:right}'
    + '.section{margin-bottom:24px}'
    + '.terreno{background:#f0f7ff;border-left:4px solid #2c6e9e;padding:14px;border-radius:4px}'
    + '.aviso-naranja{background:#fff7e6;border-left:4px solid #e07b00;padding:14px;border-radius:4px;margin-bottom:20px}'
    + 'table{width:100%;border-collapse:collapse;margin-top:8px}'
    + 'table.desglose td{padding:6px 8px;border-bottom:1px solid #e8e8e8}'
    + 'table.desglose tr.subtotal td{font-weight:bold;background:#f5f5f5;border-top:2px solid #ccc}'
    + 'table.desglose tr.total td{font-weight:bold;background:#1a3c5e;color:#fff;font-size:15px;padding:10px 8px}'
    + '.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}'
    + '.pagos{background:#f0fff4;border:1px solid #34a853;border-radius:6px;padding:16px;margin-top:20px}'
    + '.pagos h3{color:#1e7e34;margin-top:0}'
    + '.pagos table td{padding:7px 8px;border-bottom:1px solid #c8e6c9}'
    + '.pagos table tr.pago-total td{font-weight:bold;border-top:2px solid #34a853}'
    + '.clausulas{font-size:11px;color:#555;background:#fafafa;border:1px solid #ddd;padding:14px;border-radius:4px;margin-top:24px}'
    + '.clausulas h4{color:#333;font-size:12px;margin:8px 0 4px}'
    + '.firma{margin-top:32px;display:flex;gap:48px}'
    + '.firma .bloque{flex:1;border-top:1px solid #aaa;padding-top:8px;font-size:11px;color:#666}'
    + '.badge-nidos{display:inline-block;background:#1a3c5e;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;margin-left:8px}'
    + 'footer{text-align:center;font-size:10px;color:#aaa;margin-top:40px;border-top:1px solid #eee;padding-top:10px}'
    + '</style></head><body>'
    + '<div class="header">'
    + '<div>' + logo + '<br><span style="font-size:11px;color:#888">Casa modular de calidad. Desde China directo a tu parcela.</span></div>'
    + '<div class="ref"><strong>PRESUPUESTO</strong><br>' + ref + '<br>Fecha: ' + fecha + '<br><span style="font-size:10px;color:#aaa">Válido 30 días</span></div>'
    + '</div>'
    + '<div class="section"><h2>Datos del cliente</h2>'
    + '<table class="desglose">'
    + '<tr><td><strong>Nombre</strong></td><td>' + (d.nombre||"—") + '</td><td><strong>Teléfono</strong></td><td>' + (d.telefono||"—") + '</td></tr>'
    + '<tr><td><strong>Email</strong></td><td>' + (d.email||"—") + '</td><td><strong>Ubicación parcela</strong></td><td>' + (d.parcela||"Por determinar") + '</td></tr>'
    + '</table></div>'
    + secDescarga
    + secTerreno
    + '<div class="section"><h2>Modelo seleccionado: ' + modelo + ' <span class="badge-nidos">' + p.nidos + ' nido' + (p.nidos>1?"s":"") + '</span></h2>'
    + '<table class="desglose">'
    + '<tr><td>Precio base de fábrica (' + modelo + ')</td><td class="num">' + fmt(p.pvpBase) + '</td></tr>'
    + extrasHTML
    + '<tr class="subtotal"><td>Subtotal producto (con extras)</td><td class="num">' + fmt(p.pvpProd) + '</td></tr>'
    + '</table>'
    + '<p style="font-size:11px;color:#777;margin-top:6px">Desglose aduanero: CIF ' + fmt(p.cifInfo.cif) + ' + IVA import. ' + fmt(p.cifInfo.iva) + ' + DUA ' + fmt(p.cifInfo.dua) + ' (' + p.cifInfo.cont_str + ')</p>'
    + '</div>'
    + '<div class="section"><h2>Servicios llave en mano</h2>'
    + '<table class="desglose">'
    + '<tr><td>🏗️ Montadores <span style="font-size:11px;color:#888">(' + p.nidos + ' nidos × 800 €/nido)</span></td><td class="num">' + fmt(p.montadores) + '</td></tr>'
    + '<tr><td>⚡ Instaladores eléctrica, fontanería, climatización <span style="font-size:11px;color:#888">(precio fijo por proyecto)</span></td><td class="num">' + fmt(p.instaladores) + '</td></tr>'
    + '<tr><td>🚛 Transporte Algeciras → parcela <span style="font-size:11px;color:#888">(' + p.nidos + ' nidos × ' + fmt(p.tpNido) + '/nido · ' + p.distKm + ' km)</span></td><td class="num">' + fmt(p.transporte) + '</td></tr>'
    + '<tr><td>🏋️ Descarga en parcela <span style="font-size:11px;color:#888">(' + p.nidos + ' nidos × 250 €/nido)</span></td><td class="num">' + fmt(p.descarga) + '</td></tr>'
    + '<tr><td>📋 Despacho de aduanas <span style="font-size:11px;color:#888">(' + p.nidos + ' nidos × 250 €/nido)</span></td><td class="num">' + fmt(p.despachoT) + '</td></tr>'
    + '<tr><td>📐 Arquitecto + Perito <span style="font-size:11px;color:#888">(' + Math.round(p.pctArq*100) + '% sobre CIF ' + fmt(p.cifInfo.cif) + ' · ' + p.m2Mod + ' m²)</span></td><td class="num">' + fmt(p.arqPerito) + '</td></tr>'
    + '<tr class="total"><td><strong>TOTAL LLAVE EN MANO</strong></td><td class="num"><strong>' + fmt(p.totalLEM) + '</strong></td></tr>'
    + '</table></div>'
    + '<div class="pagos"><h3>💳 Plan de pagos</h3><table>'
    + '<tr><td><strong>Pago 1 — Reserva (30%)</strong><br><span style="font-size:11px;color:#555">Confirma el pedido. Inicia fabricación.</span></td><td class="num"><strong>' + fmt(p.pago1) + '</strong></td></tr>'
    + '<tr><td><strong>Pago 2 — Casa lista en fábrica (40%)</strong><br><span style="font-size:11px;color:#555">Validación fotográfica / visita a fábrica.</span></td><td class="num"><strong>' + fmt(p.pago2) + '</strong></td></tr>'
    + '<tr><td><strong>Pago 3 — Llegada a destino (20%)</strong><br><span style="font-size:11px;color:#555">Inspección de perito independiente.</span></td><td class="num"><strong>' + fmt(p.pago3) + '</strong></td></tr>'
    + '<tr><td><strong>Pago 4 — Entrega de llaves (10%)</strong><br><span style="font-size:11px;color:#555">Obra completada y certificada.</span></td><td class="num"><strong>' + fmt(p.pago4) + '</strong></td></tr>'
    + '<tr class="pago-total"><td>TOTAL</td><td class="num">' + fmt(p.totalLEM) + '</td></tr>'
    + '</table></div>'
    + '<div class="clausulas">'
    + '<h4>⚖️ CONDICIONES GENERALES Y CLÁUSULA DE NO DEVOLUCIÓN</h4>'
    + '<p>El presente presupuesto tiene carácter vinculante desde el momento en que el cliente realice cualquier pago, quedando formalizado el encargo de los servicios descritos.</p>'
    + '<p><strong>NO DEVOLUCIÓN DE PAGOS:</strong> Una vez efectuado cualquier pago parcial o total, el cliente renuncia expresamente al derecho de devolución de los importes abonados en caso de desistimiento voluntario, cancelación del pedido o cambio de decisión. Los pagos realizados quedan retenidos por Nido45 como compensación por los costes operativos, de gestión, reserva de fabricación y servicios activados, conforme a lo previsto en el artículo 1.124 y concordantes del Código Civil español y la legislación de consumidores aplicable.</p>'
    + '<h4>📋 Validez y condiciones</h4>'
    + '<p>Presupuesto válido por 30 días naturales desde la fecha de emisión. Los precios incluyen los servicios detallados. No incluye: tasas municipales de obra, IBI, suministros de agua/luz durante la instalación, vallado de parcela ni jardinería. Precio de la casa de fábrica expresado en dólares estadounidenses (USD); el importe en euros puede variar según el tipo de cambio del día de pago.</p>'
    + '</div>'
    + '<div class="firma">'
    + '<div class="bloque">Firma cliente<br><br><br>Nombre y DNI: ___________________________<br>Fecha: ' + fecha + '</div>'
    + '<div class="bloque">Nido45<br><br><br>casamodularhm@gmail.com<br>www.nido45.es</div>'
    + '</div>'
    + '<footer>Nido45 · Casa modular de calidad · casamodularhm@gmail.com · Ref: ' + ref + '</footer>'
    + '</body></html>';

  return html;
}

// ── NOTIFICACIÓN INTERNA [NIDO45] ─────────────────────────────────────────────
function notificarHugo(d, ref, url, p) {
  var asunto = "[NIDO45] Nuevo presupuesto — " + ref + " · " + (d.nombre||"Lead");
  var cuerpo  = "Presupuesto generado.\n\n";
  cuerpo += "Cliente:   " + (d.nombre  ||"—") + "\n";
  cuerpo += "Teléfono:  " + (d.telefono||"—") + "\n";
  cuerpo += "Email:     " + (d.email   ||"—") + "\n";
  cuerpo += "Modelo:    " + (d.modelo  ||"—") + " (" + p.nidos + " nidos)\n";
  cuerpo += "Flujo:     " + (d.flujo   ||"B") + "\n";
  cuerpo += "Zona:      " + (d.parcela ||"—") + " · " + p.distKm + " km desde Algeciras\n\n";
  cuerpo += "────────────────────────────────────────────\n";
  cuerpo += "TOTAL LLAVE EN MANO: " + fmt(p.totalLEM) + "\n";
  cuerpo += "  · Producto:        " + fmt(p.pvpProd) + "\n";
  cuerpo += "  · Montadores:      " + fmt(p.montadores) + " (" + p.nidos + " × 800 €/nido)\n";
  cuerpo += "  · Instaladores:    " + fmt(p.instaladores) + " (fijo)\n";
  cuerpo += "  · Transporte:      " + fmt(p.transporte) + " (" + p.nidos + " × " + fmt(p.tpNido) + "/nido, " + p.distKm + " km)\n";
  cuerpo += "  · Descarga:        " + fmt(p.descarga) + "\n";
  cuerpo += "  · Despacho aduas:  " + fmt(p.despachoT) + "\n";
  cuerpo += "  · Arq+Perito:      " + fmt(p.arqPerito) + " (" + Math.round(p.pctArq*100) + "% CIF)\n\n";
  cuerpo += "PLAN DE PAGOS\n";
  cuerpo += "  Pago 1 (30% reserva):            " + fmt(p.pago1) + "\n";
  cuerpo += "  Pago 2 (40% casa lista fábrica): " + fmt(p.pago2) + "\n";
  cuerpo += "  Pago 3 (20% llegada a destino):  " + fmt(p.pago3) + "\n";
  cuerpo += "  Pago 4 (10% entrega llaves):     " + fmt(p.pago4) + "\n\n";
  cuerpo += "PDF: " + url + "\n\n";
  cuerpo += "Mover a 'Presupuesto enviado' en Airtable para enviar email al cliente.\n\nRef: " + ref;
  MailApp.sendEmail({ to: CONFIG.EMAIL_HUGO, subject: asunto, body: cuerpo });
}

// ── TEST ──────────────────────────────────────────────────────────────────────
function testGenerarPDF_v2() {
  var casos = [
    { nombre:"Test Halcón Málaga", email:CONFIG.EMAIL_HUGO, telefono:"+34 600 000 000",
      modelo:"Halcón · 36.000 €", suelo:"SPC 4 mm (9 €/m²)", radiante:"Sin suelo radiante",
      paredes:"Mejora A — Bamboo Fiber Board (9 €/m²)", fachada_color:"Blanco (Incluido)",
      parcela:"Vélez-Málaga, Málaga", flujo:"B" },
    { nombre:"Test Cuco 36 Madrid", email:CONFIG.EMAIL_HUGO, telefono:"+34 700 000 000",
      modelo:"Cuco 36 · 17.500 €", suelo:"Vinílico (Incluido)", radiante:"Sin suelo radiante",
      paredes:"Vinílico blanco (Incluido)", fachada_color:"color personalizado",
      parcela:"Madrid", flujo:"B" },
    { nombre:"Test Águila Barcelona", email:CONFIG.EMAIL_HUGO, telefono:"+34 800 000 000",
      modelo:"Águila · 60.000 €", suelo:"Vinílico (Incluido)", radiante:"Suelo radiante por agua",
      paredes:"Vinílico blanco (Incluido)", fachada_color:"Blanco (Incluido)",
      parcela:"Barcelona", flujo:"C" }
  ];

  casos.forEach(function(d) {
    var modelo  = detectarModelo(d.modelo);
    var p       = calcularPrecios(d, modelo);
    Logger.log("\n=== " + d.nombre + " ===");
    Logger.log("Modelo: " + modelo + " | " + p.nidos + " nidos | " + p.m2Mod + " m²");
    Logger.log("Distancia: " + p.distKm + " km | Transp/nido: " + fmt(p.tpNido));
    Logger.log("Producto:     " + fmt(p.pvpProd));
    Logger.log("Montadores:   " + fmt(p.montadores));
    Logger.log("Instaladores: " + fmt(p.instaladores));
    Logger.log("Transporte:   " + fmt(p.transporte));
    Logger.log("Descarga:     " + fmt(p.descarga));
    Logger.log("Despacho:     " + fmt(p.despachoT));
    Logger.log("Arq+Perito:   " + fmt(p.arqPerito) + " (" + Math.round(p.pctArq*100) + "% CIF " + fmt(p.cifInfo.cif) + ")");
    Logger.log("─────────────────────────────────────");
    Logger.log("TOTAL LEM:    " + fmt(p.totalLEM));
    Logger.log("Pago 1 (30%): " + fmt(p.pago1));
    Logger.log("Pago 2 (40%): " + fmt(p.pago2));
    Logger.log("Pago 3 (20%): " + fmt(p.pago3));
    Logger.log("Pago 4 (10%): " + fmt(p.pago4));
  });
}
