// ████████████████████████████████████████████████████████████████████████████
// NIDO45 — PATCH v2 COMPLETO: Precios llave en mano + Flujos A/B/C
// ────────────────────────────────────────────────────────────────────────────
// INSTRUCCIONES DE INSTALACIÓN:
//   1. Abre script.google.com → proyecto Nido45 → archivo Presupuestos.gs
//   2. Ve al FINAL del archivo y pega TODO este contenido
//   3. Guarda (Ctrl+S) → las funciones redefinidas sobreescriben las originales
//   4. Ejecuta testGenerarPDF_v2() para verificar precios en el Logger
//   5. Deploy → Implementar como aplicación web → Nueva versión
//
// DEPENDENCIAS QUE ESTE PARCHE REDEFINE (sobreescriben las originales):
//   DUA_POR_CONTENEDOR, EXTRAS_M2, PRECIOS_V2, LLAVE_EN_MANO, DISTANCIAS_KM
//   desglosarc_CIF(), calcularDistanciaKm(), calcularPrecios()
//   generarPresupuesto(), buildPresupuestoHTML(), notificarHugo()
//
// DEPENDENCIAS QUE USA DEL ARCHIVO ORIGINAL (no redefinidas aquí):
//   fmt(), logoSVG(), detectarModelo(), generarReferencia()
//   htmlToPDF(), guardarEnDrive(), CONFIG, PRECIOS
// ████████████████████████████████████████████████████████████████████████████


// ── DUA POR TIPO DE CONTENEDOR (€ por unidad) ────────────────────────────────
// Actualizar si cambian las tarifas de la aduana de Algeciras
var DUA_POR_CONTENEDOR = {
  "40HQ":   200,   // contenedor 40 pies high cube
  "20ft":   150,   // contenedor 20 pies estándar
  "propio": 0      // estructura propia sin contenedor (Colibrí)
};


// ── EXTRAS POR M² (€/m²) ─────────────────────────────────────────────────────
// Redefine la variable del archivo original para garantizar consistencia
var EXTRAS_M2 = {
  spc:      9,    // suelo SPC vinílico premium
  radiante: 15,   // suelo radiante por agua
  bamboo:   9,    // paredes Bamboo Fiber Board
  carbon:   12,   // paredes Carbon / Carved
  fachada:  10    // fachada en color personalizado (se aplica al 70% de m²_paredes)
};


// ── TABLA DE MODELOS v2 (nidos, m2, contenedor) ──────────────────────────────
var PRECIOS_V2 = {
  "Gorrión":  { nidos: 1,  m2: 14.3,  pvp: 6000,  m2_suelo: 14.3,  m2_paredes: 24.9,  cont_tipo: "40HQ",   cont_num: 1 },
  "Halcón":   { nidos: 6,  m2: 90.0,  pvp: 36000, m2_suelo: 90.0,  m2_paredes: 89.7,  cont_tipo: "40HQ",   cont_num: 1 },
  "Águila":   { nidos: 10, m2: 150.0, pvp: 60000, m2_suelo: 150.0, m2_paredes: 114.4, cont_tipo: "40HQ",   cont_num: 2 },
  "Flamenco": { nidos: 2,  m2: 20.0,  pvp: 15000, m2_suelo: 14.3,  m2_paredes: 24.9,  cont_tipo: "20ft",   cont_num: 1 },
  "Colibrí":  { nidos: 3,  m2: 32.0,  pvp: 36000, m2_suelo: 32.0,  m2_paredes: 31.6,  cont_tipo: "propio", cont_num: 1 },
  "Cuco 36":  { nidos: 3,  m2: 36.0,  pvp: 17500, m2_suelo: 36.0,  m2_paredes: 43.1,  cont_tipo: "40HQ",   cont_num: 1 },
  "Cuco 68":  { nidos: 6,  m2: 65.0,  pvp: 25000, m2_suelo: 65.0,  m2_paredes: 80.5,  cont_tipo: "40HQ",   cont_num: 1 }
};


// ── PRECIOS LLAVE EN MANO (€) ────────────────────────────────────────────────
var LLAVE_EN_MANO = {
  montadores_nido:  800,  // € por nido
  instaladores:    5000,  // € fijo por proyecto
  transporte_nido:  500,  // € por nido (base: Algeciras→Málaga = 130 km)
  descarga_nido:    250,  // € por nido
  despacho_nido:    250,  // € por nido
  km_ref:           130   // km de referencia Algeciras→Málaga
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


// ── DESGLOSE CIF / IVA / DUA ──────────────────────────────────────────────────
// pvp       = precio total de fábrica (USD convertido a €)
// cont_tipo = "40HQ" | "20ft" | "propio"
// cont_num  = número de contenedores
// Fórmula:  pvp = CIF + IVA_importación + DUA
//           CIF = (pvp - DUA) / 1.21
//           IVA = CIF * 0.21
function desglosarc_CIF(pvp, cont_tipo, cont_num) {
  var duaU = DUA_POR_CONTENEDOR[cont_tipo] !== undefined
             ? DUA_POR_CONTENEDOR[cont_tipo]
             : 200;
  var dua  = duaU * (cont_num || 1);
  var cif  = Math.round((pvp - dua) / 1.21);
  var iva  = pvp - dua - cif;
  return {
    cif:      cif,
    iva:      iva,
    dua:      dua,
    cont_str: (cont_num || 1) + "×" + (cont_tipo || "40HQ")
  };
}


// ── DISTANCIA EN KM DESDE ALGECIRAS ──────────────────────────────────────────
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

  // Extras de producto
  var eSPC  = (d.suelo    && d.suelo.indexOf("SPC")    > -1) ? Math.round(m2S * EXTRAS_M2.spc)      : 0;
  var eRad  = (d.radiante && d.radiante.indexOf("agua") > -1) ? Math.round(m2S * EXTRAS_M2.radiante) : 0;
  var eBam  = (d.paredes  && d.paredes.indexOf("Bamboo") > -1) ? Math.round(m2P * EXTRAS_M2.bamboo)  : 0;
  var eCar  = (d.paredes  && (d.paredes.indexOf("Carbon") > -1 || d.paredes.indexOf("Carved") > -1)) ? Math.round(m2P * EXTRAS_M2.carbon) : 0;
  var eFach = (d.fachada_color && d.fachada_color.toLowerCase().indexOf("color") > -1) ? Math.round(m2P * 0.7 * EXTRAS_M2.fachada) : 0;

  var pvpProd = pvpBase + eSPC + eRad + eBam + eCar + eFach;
  var ci      = desglosarc_CIF(pvpBase, pv2.cont_tipo || "40HQ", pv2.cont_num || 1);

  // Servicios LEM
  var distKm  = calcularDistanciaKm(d.parcela || "");
  var tpNido  = Math.round(LLAVE_EN_MANO.transporte_nido * distKm / LLAVE_EN_MANO.km_ref);
  var mont    = nidos * LLAVE_EN_MANO.montadores_nido;
  var inst    = LLAVE_EN_MANO.instaladores;
  var transp  = nidos * tpNido;
  var descar  = nidos * LLAVE_EN_MANO.descarga_nido;
  var desp    = nidos * LLAVE_EN_MANO.despacho_nido;

  // Arquitecto + Perito: 12% si ≤50m², 10% si >50m²
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
    // Alias de compatibilidad con código original
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
  var logo  = logoSVG();
  var fecha = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy");
  var flujo = d.flujo || "B";

  // ── Sección terreno (flujo A) ──
  var secTerreno = "";
  if (flujo === "A") {
    var presTerreno = d.presupuesto_terreno
      ? fmt(parseFloat(d.presupuesto_terreno)) : "por determinar";
    var comInmob  = d.precio_terreno
      ? fmt(Math.round(parseFloat(d.precio_terreno) * 0.025)) : "2,5% del precio final";
    var comNido45 = d.precio_terreno
      ? fmt(Math.round(parseFloat(d.precio_terreno) * 0.025)) : "2,5% del precio final";
    secTerreno = '<div class="section terreno">'
      + '<h3>Servicio de b&uacute;squeda de terreno</h3>'
      + '<p>En base a su inversi&oacute;n prevista de <strong>' + presTerreno + '</strong>,'
      + ' Nido45 y su red de partners inmobiliarios localizar&aacute;n parcelas urbanas'
      + ' disponibles en la zona indicada.</p>'
      + '<table class="desglose">'
      + '<tr><td>Comisi&oacute;n partner inmobiliario</td><td class="num">' + comInmob + '</td></tr>'
      + '<tr><td>Comisi&oacute;n Nido45 (gesti&oacute;n)</td><td class="num">' + comNido45 + '</td></tr>'
      + '<tr class="subtotal"><td colspan="2">Precio del terreno: en documento separado adjunto</td></tr>'
      + '</table></div>';
  }

  // ── Aviso terreno no urbano (flujo C) ──
  var secAviso = "";
  if (flujo === "C") {
    secAviso = '<div class="aviso-naranja">'
      + '<strong>NOTA IMPORTANTE &mdash; Terreno no urbanizable</strong><br>'
      + 'Nido45 declina toda responsabilidad respecto a la viabilidad urban&iacute;stica,'
      + ' licencias de obra, permisos de uso del suelo y cualquier tr&aacute;mite'
      + ' administrativo derivado de la condici&oacute;n no urbana de la parcela indicada.'
      + ' El cliente asume &iacute;ntegramente la responsabilidad de verificar la legalidad'
      + ' de la construcci&oacute;n antes de realizar cualquier pago.'
      + ' Nido45 prestar&aacute; &uacute;nicamente los servicios t&eacute;cnicos y log&iacute;sticos'
      + ' detallados en este presupuesto.</div>';
  }

  // ── Filas de extras de producto ──
  var extrasHTML = "";
  if (p.extraSPC > 0)     extrasHTML += '<tr><td class="indent">+ Suelo SPC</td><td class="num">+' + fmt(p.extraSPC) + '</td></tr>';
  if (p.extraRadiante > 0) extrasHTML += '<tr><td class="indent">+ Suelo radiante por agua</td><td class="num">+' + fmt(p.extraRadiante) + '</td></tr>';
  if (p.extraBamboo > 0)  extrasHTML += '<tr><td class="indent">+ Paredes Bamboo Fiber</td><td class="num">+' + fmt(p.extraBamboo) + '</td></tr>';
  if (p.extraCarbon > 0)  extrasHTML += '<tr><td class="indent">+ Paredes Carbon/Carved</td><td class="num">+' + fmt(p.extraCarbon) + '</td></tr>';
  if (p.extraFachada > 0) extrasHTML += '<tr><td class="indent">+ Fachada color personalizado</td><td class="num">+' + fmt(p.extraFachada) + '</td></tr>';

  var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">'
    + '<style>'
    + 'body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a1a;padding:32px;max-width:780px;margin:auto}'
    + 'h2{color:#1a3c5e;font-size:16px;border-bottom:2px solid #1a3c5e;padding-bottom:4px;margin-top:24px}'
    + 'h3{color:#2c6e9e;font-size:14px;margin-top:16px}'
    + '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}'
    + '.ref{font-size:11px;color:#666;text-align:right;line-height:1.7}'
    + '.section{margin-bottom:20px}'
    + '.terreno{background:#f0f7ff;border-left:4px solid #2c6e9e;padding:14px;border-radius:4px}'
    + '.aviso-naranja{background:#fff7e6;border-left:4px solid #e07b00;padding:14px;border-radius:4px;margin-bottom:20px;font-size:12px}'
    + 'table{width:100%;border-collapse:collapse;margin-top:8px}'
    + 'table.desglose td{padding:6px 8px;border-bottom:1px solid #ebebeb;vertical-align:top}'
    + 'table.desglose tr.subtotal td{font-weight:bold;background:#f5f5f5;border-top:2px solid #ccc}'
    + 'table.desglose tr.total td{font-weight:bold;background:#1a3c5e;color:#fff;font-size:14px;padding:10px 8px}'
    + '.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}'
    + '.indent{padding-left:22px!important}'
    + '.sub{font-size:11px;color:#888}'
    + '.pagos{background:#f0fff4;border:1px solid #34a853;border-radius:6px;padding:16px;margin-top:20px}'
    + '.pagos h3{color:#1e7e34;margin-top:0}'
    + '.pagos table td{padding:7px 8px;border-bottom:1px solid #c8e6c9}'
    + '.pagos table tr.pago-total td{font-weight:bold;border-top:2px solid #34a853;background:#e6f4ea}'
    + '.clausulas{font-size:11px;color:#555;background:#fafafa;border:1px solid #ddd;padding:14px;border-radius:4px;margin-top:24px}'
    + '.clausulas h4{color:#333;font-size:12px;margin:10px 0 4px}'
    + '.clausulas h4:first-child{margin-top:0}'
    + '.badge{display:inline-block;background:#1a3c5e;color:#fff;padding:2px 10px;border-radius:12px;font-size:11px;margin-left:6px}'
    + '.firma{margin-top:32px;display:flex;gap:48px}'
    + '.firma .bloque{flex:1;border-top:1px solid #bbb;padding-top:10px;font-size:11px;color:#666;line-height:1.8}'
    + 'footer{text-align:center;font-size:10px;color:#bbb;margin-top:36px;border-top:1px solid #eee;padding-top:10px}'
    + '</style></head><body>'
    + '<div class="header">'
    + '<div>' + logo + '</div>'
    + '<div class="ref"><strong style="font-size:15px">PRESUPUESTO</strong><br>'
    + ref + '<br>Fecha: ' + fecha + '<br>'
    + '<span style="color:#aaa">V&aacute;lido 30 d&iacute;as</span></div>'
    + '</div>'
    + secAviso
    + '<div class="section"><h2>Datos del cliente</h2>'
    + '<table class="desglose">'
    + '<tr><td><strong>Nombre</strong></td><td>' + (d.nombre||"—") + '</td>'
    + '<td><strong>Tel&eacute;fono</strong></td><td>' + (d.telefono||"—") + '</td></tr>'
    + '<tr><td><strong>Email</strong></td><td>' + (d.email||"—") + '</td>'
    + '<td><strong>Ubicaci&oacute;n parcela</strong></td><td>' + (d.parcela||"Por determinar") + '</td></tr>'
    + '</table></div>'
    + secTerreno
    + '<div class="section"><h2>Modelo: ' + modelo
    + ' <span class="badge">' + p.nidos + '&nbsp;nido' + (p.nidos > 1 ? 's' : '') + '</span>'
    + ' <span class="badge">' + p.m2Mod + '&nbsp;m&sup2;</span></h2>'
    + '<table class="desglose">'
    + '<tr><td>Precio base de f&aacute;brica</td><td class="num">' + fmt(p.pvpBase) + '</td></tr>'
    + extrasHTML
    + '<tr class="subtotal"><td>Subtotal producto</td><td class="num">' + fmt(p.pvpProd) + '</td></tr>'
    + '</table>'
    + '<p class="sub" style="margin-top:6px">Desglose aduanero estimado: CIF&nbsp;' + fmt(p.cifInfo.cif)
    + '&nbsp;+&nbsp;IVA&nbsp;importaci&oacute;n&nbsp;' + fmt(p.cifInfo.iva)
    + '&nbsp;+&nbsp;DUA&nbsp;' + fmt(p.cifInfo.dua) + '&nbsp;(' + p.cifInfo.cont_str + ')</p></div>'
    + '<div class="section"><h2>Servicios llave en mano</h2>'
    + '<table class="desglose">'
    + '<tr><td>Montadores<br><span class="sub">' + p.nidos + ' nidos &times; 800 &euro;/nido</span></td><td class="num">' + fmt(p.montadores) + '</td></tr>'
    + '<tr><td>Instaladores (el&eacute;ctrica, fontaner&iacute;a, climatizaci&oacute;n)<br><span class="sub">Precio fijo por proyecto</span></td><td class="num">' + fmt(p.instaladores) + '</td></tr>'
    + '<tr><td>Transporte Algeciras &rarr; parcela<br><span class="sub">' + p.nidos + ' nidos &times; ' + fmt(p.tpNido) + '/nido &middot; ' + p.distKm + ' km</span></td><td class="num">' + fmt(p.transporte) + '</td></tr>'
    + '<tr><td>Descarga en parcela<br><span class="sub">' + p.nidos + ' nidos &times; 250 &euro;/nido</span></td><td class="num">' + fmt(p.descarga) + '</td></tr>'
    + '<tr><td>Despacho de aduanas<br><span class="sub">' + p.nidos + ' nidos &times; 250 &euro;/nido</span></td><td class="num">' + fmt(p.despachoT) + '</td></tr>'
    + '<tr><td>Arquitecto + Perito<br><span class="sub">' + Math.round(p.pctArq * 100) + '% sobre CIF ' + fmt(p.cifInfo.cif) + ' &middot; ' + p.m2Mod + ' m&sup2;</span></td><td class="num">' + fmt(p.arqPerito) + '</td></tr>'
    + '<tr class="total"><td><strong>TOTAL LLAVE EN MANO</strong></td><td class="num"><strong>' + fmt(p.totalLEM) + '</strong></td></tr>'
    + '</table></div>'
    + '<div class="pagos"><h3>Plan de pagos</h3><table>'
    + '<tr><td><strong>Pago 1 &mdash; Reserva (30%)</strong><br><span class="sub">Confirma el pedido e inicia fabricaci&oacute;n.</span></td><td class="num"><strong>' + fmt(p.pago1) + '</strong></td></tr>'
    + '<tr><td><strong>Pago 2 &mdash; Casa lista en f&aacute;brica (40%)</strong><br><span class="sub">Validaci&oacute;n fotogr&aacute;fica o visita a f&aacute;brica.</span></td><td class="num"><strong>' + fmt(p.pago2) + '</strong></td></tr>'
    + '<tr><td><strong>Pago 3 &mdash; Llegada a destino (20%)</strong><br><span class="sub">Inspecci&oacute;n de perito independiente.</span></td><td class="num"><strong>' + fmt(p.pago3) + '</strong></td></tr>'
    + '<tr><td><strong>Pago 4 &mdash; Entrega de llaves (10%)</strong><br><span class="sub">Obra completada y certificada.</span></td><td class="num"><strong>' + fmt(p.pago4) + '</strong></td></tr>'
    + '<tr class="pago-total"><td>TOTAL</td><td class="num">' + fmt(p.totalLEM) + '</td></tr>'
    + '</table></div>'
    + '<div class="clausulas">'
    + '<h4>CONDICIONES GENERALES Y CL&Aacute;USULA DE NO DEVOLUCI&Oacute;N</h4>'
    + '<p>El presente presupuesto tiene car&aacute;cter vinculante desde el momento en que el cliente realice cualquier pago, quedando formalizado el encargo de los servicios descritos.</p>'
    + '<p><strong>NO DEVOLUCI&Oacute;N DE PAGOS:</strong> Una vez efectuado cualquier pago parcial o total, el cliente renuncia expresamente al derecho de devoluci&oacute;n de los importes abonados en caso de desistimiento voluntario, cancelaci&oacute;n del pedido o cambio de decisi&oacute;n. Los pagos realizados quedan retenidos por Nido45 como compensaci&oacute;n por los costes operativos, de gesti&oacute;n, reserva de fabricaci&oacute;n y servicios activados, conforme a lo previsto en el art&iacute;culo 1.124 y concordantes del C&oacute;digo Civil espa&ntilde;ol y la legislaci&oacute;n de consumidores aplicable.</p>'
    + '<h4>VALIDEZ Y CONDICIONES</h4>'
    + '<p>Presupuesto v&aacute;lido por 30 d&iacute;as naturales desde la fecha de emisi&oacute;n. No incluye: tasas municipales de obra, IBI, suministros de agua/luz durante la instalaci&oacute;n, vallado de parcela ni jardiner&iacute;a. El precio de f&aacute;brica se expresa en d&oacute;lares (USD); el importe en euros puede variar seg&uacute;n el tipo de cambio del d&iacute;a de pago.</p>'
    + '</div>'
    + '<div class="firma">'
    + '<div class="bloque">Firma del cliente<br><br><br>Nombre y DNI: _______________________<br>Fecha: ' + fecha + '</div>'
    + '<div class="bloque">Nido45<br><br><br>casamodularhm@gmail.com<br>www.nido45.es</div>'
    + '</div>'
    + '<footer>Nido45 &middot; Casa modular de calidad &middot; casamodularhm@gmail.com &middot; Ref: ' + ref + '</footer>'
    + '</body></html>';

  return html;
}


// ── NOTIFICACIÓN INTERNA [NIDO45] ─────────────────────────────────────────────
function notificarHugo(d, ref, url, p) {
  var asunto = "[NIDO45] Nuevo presupuesto — " + ref + " · " + (d.nombre || "Lead");
  var body   = "Presupuesto generado.\n\n";
  body += "Cliente:   " + (d.nombre   || "—") + "\n";
  body += "Teléfono:  " + (d.telefono || "—") + "\n";
  body += "Email:     " + (d.email    || "—") + "\n";
  body += "Modelo:    " + (d.modelo   || "—") + " (" + p.nidos + " nidos)\n";
  body += "Flujo:     " + (d.flujo    || "B") + "\n";
  body += "Zona:      " + (d.parcela  || "—") + " · " + p.distKm + " km desde Algeciras\n\n";
  body += "────────────────────────────────────────────\n";
  body += "TOTAL LLAVE EN MANO: " + fmt(p.totalLEM) + "\n";
  body += "  · Producto:        " + fmt(p.pvpProd) + "\n";
  body += "  · Montadores:      " + fmt(p.montadores) + " (" + p.nidos + " × 800 €/nido)\n";
  body += "  · Instaladores:    " + fmt(p.instaladores) + " (fijo)\n";
  body += "  · Transporte:      " + fmt(p.transporte) + " (" + p.nidos + " × " + fmt(p.tpNido) + "/nido, " + p.distKm + " km)\n";
  body += "  · Descarga:        " + fmt(p.descarga) + "\n";
  body += "  · Despacho aduas:  " + fmt(p.despachoT) + "\n";
  body += "  · Arq+Perito:      " + fmt(p.arqPerito) + " (" + Math.round(p.pctArq * 100) + "% CIF)\n\n";
  body += "PLAN DE PAGOS\n";
  body += "  Pago 1 (30% reserva):            " + fmt(p.pago1) + "\n";
  body += "  Pago 2 (40% casa lista fábrica): " + fmt(p.pago2) + "\n";
  body += "  Pago 3 (20% llegada a destino):  " + fmt(p.pago3) + "\n";
  body += "  Pago 4 (10% entrega llaves):     " + fmt(p.pago4) + "\n\n";
  body += "PDF: " + url + "\n\n";
  body += "Mover a '2 · FABRICACIÓN' en Airtable cuando el cliente pague la reserva.\n\nRef: " + ref;
  MailApp.sendEmail({ to: CONFIG.EMAIL_HUGO, subject: asunto, body: body });
}


// ── TEST — ejecutar desde el editor para verificar precios ───────────────────
function testGenerarPDF_v2() {
  var casos = [
    { nombre: "Test Halcón Málaga",    email: CONFIG.EMAIL_HUGO, telefono: "+34 600 000 000",
      modelo: "Halcón · 36.000 €",    suelo: "SPC 4 mm (9 €/m²)",  radiante: "Sin suelo radiante",
      paredes: "Mejora A — Bamboo Fiber Board (9 €/m²)", fachada_color: "Blanco (Incluido)",
      parcela: "Vélez-Málaga, Málaga", flujo: "B" },
    { nombre: "Test Cuco 36 Madrid",   email: CONFIG.EMAIL_HUGO, telefono: "+34 700 000 000",
      modelo: "Cuco 36 · 17.500 €",   suelo: "Vinílico (Incluido)", radiante: "Sin suelo radiante",
      paredes: "Vinílico blanco (Incluido)", fachada_color: "color personalizado",
      parcela: "Madrid",               flujo: "B" },
    { nombre: "Test Águila Barcelona", email: CONFIG.EMAIL_HUGO, telefono: "+34 800 000 000",
      modelo: "Águila · 60.000 €",    suelo: "Vinílico (Incluido)", radiante: "Suelo radiante por agua",
      paredes: "Vinílico blanco (Incluido)", fachada_color: "Blanco (Incluido)",
      parcela: "Barcelona",            flujo: "C" }
  ];

  casos.forEach(function(d) {
    var modelo = detectarModelo(d.modelo);
    var p      = calcularPrecios(d, modelo);
    Logger.log("\n=== " + d.nombre + " ===");
    Logger.log("Modelo:       " + modelo + " | " + p.nidos + " nidos | " + p.m2Mod + " m²");
    Logger.log("CIF/IVA/DUA:  " + fmt(p.cifInfo.cif) + " / " + fmt(p.cifInfo.iva) + " / " + fmt(p.cifInfo.dua) + " (" + p.cifInfo.cont_str + ")");
    Logger.log("Distancia:    " + p.distKm + " km | Transp/nido: " + fmt(p.tpNido));
    Logger.log("─ Producto:   " + fmt(p.pvpProd) + "  (base " + fmt(p.pvpBase) + " + extras " + fmt(p.pvpProd - p.pvpBase) + ")");
    Logger.log("─ Montadores: " + fmt(p.montadores));
    Logger.log("─ Instalad.:  " + fmt(p.instaladores));
    Logger.log("─ Transporte: " + fmt(p.transporte));
    Logger.log("─ Descarga:   " + fmt(p.descarga));
    Logger.log("─ Despacho:   " + fmt(p.despachoT));
    Logger.log("─ Arq+Perito: " + fmt(p.arqPerito) + " (" + Math.round(p.pctArq * 100) + "% CIF)");
    Logger.log("══════════════════════════════════════");
    Logger.log("TOTAL LEM:    " + fmt(p.totalLEM));
    Logger.log("Pago 1 (30%): " + fmt(p.pago1));
    Logger.log("Pago 2 (40%): " + fmt(p.pago2));
    Logger.log("Pago 3 (20%): " + fmt(p.pago3));
    Logger.log("Pago 4 (10%): " + fmt(p.pago4));
  });
}
