// ████████████████████████████████████████████████████████████████████████████
// NIDO45 — PATCH v2 COMPLETO: Precios llave en mano + Flujos A/B/C
// v2.1 — Transporte por puerto óptimo (Algeciras/Valencia/Barcelona/Bilbao/
//         Las Palmas/Santa Cruz/Palma/Lisboa)
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
var DUA_POR_CONTENEDOR = {
  "40HQ":   200,
  "20ft":   150,
  "propio": 0
};


// ── EXTRAS POR M² (€/m²) ─────────────────────────────────────────────────────
var EXTRAS_M2 = {
  spc:      9,
  radiante: 15,
  bamboo:   9,
  carbon:   12,
  fachada:  10
};


// ── TABLA DE MODELOS v2 ───────────────────────────────────────────────────────
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
  montadores_nido:  800,
  instaladores:    5000,
  transporte_nido:  500,  // € por nido (base: cualquier puerto → 130 km de referencia)
  descarga_nido:    250,
  despacho_nido:    250,
  km_ref:           130   // km de referencia (equivale a Algeciras→Málaga)
};


// ── TABLA DE DISTANCIAS DESDE EL PUERTO ÓPTIMO ───────────────────────────────
// Estructura: "nombre_normalizado": { km: X, puerto: "NombrePuerto" }
// km = distancia terrestre desde el puerto óptimo hasta el destino
// El coste marítimo China→puerto es fijo (incluido en los 500€/nido base)
// Para islas: km incluye ferry + carretera estimados
var DISTANCIAS_KM = {

  // ── ANDALUCÍA → Algeciras ──────────────────────────────────────────────────
  "algeciras":          { km: 5,   puerto: "Algeciras" },
  "tarifa":             { km: 30,  puerto: "Algeciras" },
  "la linea":           { km: 22,  puerto: "Algeciras" },
  "los barrios":        { km: 12,  puerto: "Algeciras" },
  "san roque":          { km: 18,  puerto: "Algeciras" },
  "cadiz":              { km: 50,  puerto: "Algeciras" },
  "jerez":              { km: 82,  puerto: "Algeciras" },
  "el puerto":          { km: 65,  puerto: "Algeciras" },
  "sanlucar":           { km: 87,  puerto: "Algeciras" },
  "chipiona":           { km: 95,  puerto: "Algeciras" },
  "malaga":             { km: 130, puerto: "Algeciras" },
  "marbella":           { km: 108, puerto: "Algeciras" },
  "estepona":           { km: 87,  puerto: "Algeciras" },
  "fuengirola":         { km: 100, puerto: "Algeciras" },
  "torremolinos":       { km: 118, puerto: "Algeciras" },
  "benalmadena":        { km: 112, puerto: "Algeciras" },
  "nerja":              { km: 172, puerto: "Algeciras" },
  "velez":              { km: 155, puerto: "Algeciras" },
  "almayate":           { km: 138, puerto: "Algeciras" },
  "antequera":          { km: 145, puerto: "Algeciras" },
  "ronda":              { km: 97,  puerto: "Algeciras" },
  "coin":               { km: 120, puerto: "Algeciras" },
  "alhaurin":           { km: 125, puerto: "Algeciras" },
  "sevilla":            { km: 212, puerto: "Algeciras" },
  "dos hermanas":       { km: 219, puerto: "Algeciras" },
  "alcala de guadaira": { km: 222, puerto: "Algeciras" },
  "utrera":             { km: 188, puerto: "Algeciras" },
  "huelva":             { km: 262, puerto: "Algeciras" },
  "moguer":             { km: 268, puerto: "Algeciras" },
  "lepe":               { km: 280, puerto: "Algeciras" },
  "ayamonte":           { km: 298, puerto: "Algeciras" },
  "granada":            { km: 232, puerto: "Algeciras" },
  "otura":              { km: 238, puerto: "Algeciras" },
  "motril":             { km: 190, puerto: "Algeciras" },
  "loja":               { km: 185, puerto: "Algeciras" },
  "baza":               { km: 312, puerto: "Algeciras" },
  "almeria":            { km: 352, puerto: "Algeciras" },
  "roquetas":           { km: 345, puerto: "Algeciras" },
  "nijar":              { km: 330, puerto: "Algeciras" },
  "vera":               { km: 385, puerto: "Algeciras" },
  "cordoba":            { km: 267, puerto: "Algeciras" },
  "lucena":             { km: 220, puerto: "Algeciras" },
  "pozoblanco":         { km: 315, puerto: "Algeciras" },
  "jaen":               { km: 312, puerto: "Algeciras" },
  "linares":            { km: 278, puerto: "Algeciras" },
  "ubeda":              { km: 320, puerto: "Algeciras" },
  "baeza":              { km: 308, puerto: "Algeciras" },

  // ── EXTREMADURA → Algeciras (más cercano que Valencia) ────────────────────
  "badajoz":            { km: 423, puerto: "Algeciras" },
  "caceres":            { km: 473, puerto: "Algeciras" },
  "merida":             { km: 398, puerto: "Algeciras" },
  "plasencia":          { km: 533, puerto: "Algeciras" },

  // ── MURCIA → Valencia ─────────────────────────────────────────────────────
  "murcia":             { km: 240, puerto: "Valencia" },
  "cartagena":          { km: 260, puerto: "Valencia" },
  "lorca":              { km: 290, puerto: "Valencia" },

  // ── COMUNIDAD VALENCIANA → Valencia ───────────────────────────────────────
  "valencia":           { km: 15,  puerto: "Valencia" },
  "castellon":          { km: 75,  puerto: "Valencia" },
  "gandia":             { km: 65,  puerto: "Valencia" },
  "denia":              { km: 100, puerto: "Valencia" },
  "benidorm":           { km: 120, puerto: "Valencia" },
  "alicante":           { km: 160, puerto: "Valencia" },
  "elche":              { km: 175, puerto: "Valencia" },
  "torrevieja":         { km: 195, puerto: "Valencia" },
  "cocentaina":         { km: 70,  puerto: "Valencia" },
  "alcoy":              { km: 80,  puerto: "Valencia" },

  // ── MADRID + CASTILLA-LA MANCHA → Valencia ────────────────────────────────
  "madrid":             { km: 355, puerto: "Valencia" },
  "alcobendas":         { km: 365, puerto: "Valencia" },
  "getafe":             { km: 360, puerto: "Valencia" },
  "mostoles":           { km: 360, puerto: "Valencia" },
  "leganes":            { km: 355, puerto: "Valencia" },
  "alcala":             { km: 385, puerto: "Valencia" },
  "colmenar":           { km: 375, puerto: "Valencia" },
  "san martin":         { km: 370, puerto: "Valencia" },
  "guadalajara":        { km: 290, puerto: "Valencia" },
  "cuenca":             { km: 190, puerto: "Valencia" },
  "albacete":           { km: 165, puerto: "Valencia" },
  "ciudad real":        { km: 265, puerto: "Valencia" },
  "toledo":             { km: 390, puerto: "Valencia" },
  "talavera":           { km: 430, puerto: "Valencia" },
  "alcazar":            { km: 295, puerto: "Valencia" },

  // ── CATALUÑA + ARAGÓN → Barcelona ────────────────────────────────────────
  "barcelona":          { km: 15,  puerto: "Barcelona" },
  "tarragona":          { km: 100, puerto: "Barcelona" },
  "lleida":             { km: 170, puerto: "Barcelona" },
  "girona":             { km: 100, puerto: "Barcelona" },
  "zaragoza":           { km: 310, puerto: "Barcelona" },
  "huesca":             { km: 235, puerto: "Barcelona" },
  "teruel":             { km: 290, puerto: "Barcelona" },

  // ── PAÍS VASCO + NORTE + GALICIA + CASTILLA Y LEÓN → Bilbao ──────────────
  "bilbao":             { km: 15,  puerto: "Bilbao" },
  "vitoria":            { km: 65,  puerto: "Bilbao" },
  "san sebastian":      { km: 100, puerto: "Bilbao" },
  "pamplona":           { km: 155, puerto: "Bilbao" },
  "logrono":            { km: 135, puerto: "Bilbao" },
  "santander":          { km: 105, puerto: "Bilbao" },
  "oviedo":             { km: 190, puerto: "Bilbao" },
  "gijon":              { km: 200, puerto: "Bilbao" },
  "aviles":             { km: 195, puerto: "Bilbao" },
  "a coruna":           { km: 530, puerto: "Bilbao" },
  "santiago":           { km: 500, puerto: "Bilbao" },
  "vigo":               { km: 555, puerto: "Bilbao" },
  "pontevedra":         { km: 540, puerto: "Bilbao" },
  "lugo":               { km: 430, puerto: "Bilbao" },
  "valladolid":         { km: 280, puerto: "Bilbao" },
  "burgos":             { km: 120, puerto: "Bilbao" },
  "leon":               { km: 200, puerto: "Bilbao" },
  "salamanca":          { km: 380, puerto: "Bilbao" },
  "zamora":             { km: 340, puerto: "Bilbao" },
  "palencia":           { km: 210, puerto: "Bilbao" },
  "segovia":            { km: 330, puerto: "Bilbao" },
  "avila":              { km: 350, puerto: "Bilbao" },
  "soria":              { km: 230, puerto: "Bilbao" },

  // ── CANARIAS ORIENTALES → Las Palmas ─────────────────────────────────────
  "las palmas":         { km: 5,   puerto: "Las Palmas" },
  "gran canaria":       { km: 15,  puerto: "Las Palmas" },
  "arucas":             { km: 10,  puerto: "Las Palmas" },
  "lanzarote":          { km: 150, puerto: "Las Palmas" },
  "arrecife":           { km: 155, puerto: "Las Palmas" },
  "fuerteventura":      { km: 180, puerto: "Las Palmas" },
  "puerto del rosario": { km: 185, puerto: "Las Palmas" },

  // ── CANARIAS OCCIDENTALES → Santa Cruz de Tenerife ───────────────────────
  "santa cruz":         { km: 5,   puerto: "Santa Cruz de Tenerife" },
  "tenerife":           { km: 15,  puerto: "Santa Cruz de Tenerife" },
  "la laguna":          { km: 10,  puerto: "Santa Cruz de Tenerife" },
  "la palma":           { km: 120, puerto: "Santa Cruz de Tenerife" },
  "la gomera":          { km: 110, puerto: "Santa Cruz de Tenerife" },
  "el hierro":          { km: 160, puerto: "Santa Cruz de Tenerife" },

  // ── BALEARES → Palma de Mallorca ─────────────────────────────────────────
  "palma":              { km: 10,  puerto: "Palma de Mallorca" },
  "mallorca":           { km: 40,  puerto: "Palma de Mallorca" },
  "menorca":            { km: 200, puerto: "Palma de Mallorca" },
  "mahon":              { km: 200, puerto: "Palma de Mallorca" },
  "ibiza":              { km: 160, puerto: "Palma de Mallorca" },
  "formentera":         { km: 180, puerto: "Palma de Mallorca" },

  // ── PORTUGAL → Lisboa ─────────────────────────────────────────────────────
  "lisboa":             { km: 25,  puerto: "Lisboa" },
  "sintra":             { km: 40,  puerto: "Lisboa" },
  "setubal":            { km: 50,  puerto: "Lisboa" },
  "sines":              { km: 55,  puerto: "Lisboa" },
  "faro":               { km: 280, puerto: "Lisboa" },
  "algarve":            { km: 290, puerto: "Lisboa" },
  "porto":              { km: 310, puerto: "Lisboa" },
  "braga":              { km: 360, puerto: "Lisboa" },
  "coimbra":            { km: 200, puerto: "Lisboa" },
  "portugal":           { km: 150, puerto: "Lisboa" },

  "_default":           { km: 130, puerto: "Algeciras" }
};


// ── DESGLOSE CIF / IVA / DUA ──────────────────────────────────────────────────
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


// ── PUERTO ÓPTIMO + DISTANCIA TERRESTRE ──────────────────────────────────────
// Devuelve { km: Number, puerto: String }
function calcularDistanciaKm(parcela) {
  if (!parcela) return DISTANCIAS_KM["_default"];
  var p = parcela.toLowerCase()
    .replace(/[áàä]/g,"a").replace(/[éèë]/g,"e").replace(/[íìï]/g,"i")
    .replace(/[óòö]/g,"o").replace(/[úùü]/g,"u").replace(/ñ/g,"n");
  var best = null, bestLen = 0;
  for (var city in DISTANCIAS_KM) {
    if (city === "_default") continue;
    if (p.indexOf(city) > -1 && city.length > bestLen) {
      best = city;
      bestLen = city.length;
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

  var pvpProd  = pvpBase + eSPC + eRad + eBam + eCar + eFach;
  var ci       = desglosarc_CIF(pvpBase, pv2.cont_tipo || "40HQ", pv2.cont_num || 1);

  var distInfo = calcularDistanciaKm(d.parcela || "");
  var distKm   = distInfo.km;
  var puerto   = distInfo.puerto;

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
    puerto: puerto,
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
  var logo  = logoSVG();
  var fecha = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy");
  var flujo = d.flujo || "B";

  var secTerreno = "";
  if (flujo === "A") {
    var presTerreno = d.presupuesto_terreno ? fmt(parseFloat(d.presupuesto_terreno)) : "por determinar";
    var comInmob  = d.precio_terreno ? fmt(Math.round(parseFloat(d.precio_terreno) * 0.025)) : "2,5% del precio final";
    var comNido45 = d.precio_terreno ? fmt(Math.round(parseFloat(d.precio_terreno) * 0.025)) : "2,5% del precio final";
    secTerreno = '<div class="section terreno">'
      + '<h3>Servicio de b&uacute;squeda de terreno</h3>'
      + '<p>En base a su inversi&oacute;n prevista de <strong>' + presTerreno + '</strong>, Nido45 y su red de partners inmobiliarios localizar&aacute;n parcelas urbanas disponibles en la zona indicada.</p>'
      + '<table class="desglose">'
      + '<tr><td>Comisi&oacute;n partner inmobiliario</td><td class="num">' + comInmob + '</td></tr>'
      + '<tr><td>Comisi&oacute;n Nido45 (gesti&oacute;n)</td><td class="num">' + comNido45 + '</td></tr>'
      + '<tr class="subtotal"><td colspan="2">Precio del terreno: en documento separado adjunto</td></tr>'
      + '</table></div>';
  }

  var secAviso = "";
  if (flujo === "C") {
    secAviso = '<div class="aviso-naranja">'
      + '<strong>NOTA IMPORTANTE &mdash; Terreno no urbanizable</strong><br>'
      + 'Nido45 declina toda responsabilidad respecto a la viabilidad urban&iacute;stica, licencias de obra, permisos de uso del suelo y cualquier tr&aacute;mite administrativo derivado de la condici&oacute;n no urbana de la parcela indicada. '
      + 'El cliente asume &iacute;ntegramente la responsabilidad de verificar la legalidad de la construcci&oacute;n antes de realizar cualquier pago. '
      + 'Nido45 prestar&aacute; &uacute;nicamente los servicios t&eacute;cnicos y log&iacute;sticos detallados en este presupuesto.</div>';
  }

  var extrasHTML = "";
  if (p.extraSPC > 0)      extrasHTML += '<tr><td class="indent">+ Suelo SPC</td><td class="num">+' + fmt(p.extraSPC) + '</td></tr>';
  if (p.extraRadiante > 0) extrasHTML += '<tr><td class="indent">+ Suelo radiante por agua</td><td class="num">+' + fmt(p.extraRadiante) + '</td></tr>';
  if (p.extraBamboo > 0)   extrasHTML += '<tr><td class="indent">+ Paredes Bamboo Fiber</td><td class="num">+' + fmt(p.extraBamboo) + '</td></tr>';
  if (p.extraCarbon > 0)   extrasHTML += '<tr><td class="indent">+ Paredes Carbon/Carved</td><td class="num">+' + fmt(p.extraCarbon) + '</td></tr>';
  if (p.extraFachada > 0)  extrasHTML += '<tr><td class="indent">+ Fachada color personalizado</td><td class="num">+' + fmt(p.extraFachada) + '</td></tr>';

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
    + '.clausulas h4{color:#333;font-size:12px;margin:10px 0 4px}.clausulas h4:first-child{margin-top:0}'
    + '.badge{display:inline-block;background:#1a3c5e;color:#fff;padding:2px 10px;border-radius:12px;font-size:11px;margin-left:6px}'
    + '.firma{margin-top:32px;display:flex;gap:48px}'
    + '.firma .bloque{flex:1;border-top:1px solid #bbb;padding-top:10px;font-size:11px;color:#666;line-height:1.8}'
    + 'footer{text-align:center;font-size:10px;color:#bbb;margin-top:36px;border-top:1px solid #eee;padding-top:10px}'
    + '</style></head><body>'
    + '<div class="header"><div>' + logo + '</div>'
    + '<div class="ref"><strong style="font-size:15px">PRESUPUESTO</strong><br>' + ref + '<br>Fecha: ' + fecha + '<br><span style="color:#aaa">V&aacute;lido 30 d&iacute;as</span></div></div>'
    + secAviso
    + '<div class="section"><h2>Datos del cliente</h2><table class="desglose">'
    + '<tr><td><strong>Nombre</strong></td><td>' + (d.nombre||"—") + '</td><td><strong>Tel&eacute;fono</strong></td><td>' + (d.telefono||"—") + '</td></tr>'
    + '<tr><td><strong>Email</strong></td><td>' + (d.email||"—") + '</td><td><strong>Ubicaci&oacute;n parcela</strong></td><td>' + (d.parcela||"Por determinar") + '</td></tr>'
    + '</table></div>'
    + secTerreno
    + '<div class="section"><h2>Modelo: ' + modelo + ' <span class="badge">' + p.nidos + '&nbsp;nido' + (p.nidos > 1 ? 's' : '') + '</span> <span class="badge">' + p.m2Mod + '&nbsp;m&sup2;</span></h2>'
    + '<table class="desglose">'
    + '<tr><td>Precio base de f&aacute;brica</td><td class="num">' + fmt(p.pvpBase) + '</td></tr>'
    + extrasHTML
    + '<tr class="subtotal"><td>Subtotal producto</td><td class="num">' + fmt(p.pvpProd) + '</td></tr>'
    + '</table>'
    + '<p class="sub" style="margin-top:6px">Desglose aduanero estimado: CIF&nbsp;' + fmt(p.cifInfo.cif) + '&nbsp;+&nbsp;IVA&nbsp;importaci&oacute;n&nbsp;' + fmt(p.cifInfo.iva) + '&nbsp;+&nbsp;DUA&nbsp;' + fmt(p.cifInfo.dua) + '&nbsp;(' + p.cifInfo.cont_str + ')</p></div>'
    + '<div class="section"><h2>Servicios llave en mano</h2><table class="desglose">'
    + '<tr><td>Montadores<br><span class="sub">' + p.nidos + ' nidos &times; 800 &euro;/nido</span></td><td class="num">' + fmt(p.montadores) + '</td></tr>'
    + '<tr><td>Instaladores (el&eacute;ctrica, fontaner&iacute;a, climatizaci&oacute;n)<br><span class="sub">Precio fijo por proyecto</span></td><td class="num">' + fmt(p.instaladores) + '</td></tr>'
    + '<tr><td>Transporte ' + p.puerto + ' &rarr; parcela<br><span class="sub">' + p.nidos + ' nidos &times; ' + fmt(p.tpNido) + '/nido &middot; ' + p.distKm + ' km</span></td><td class="num">' + fmt(p.transporte) + '</td></tr>'
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
  body += "Zona:      " + (d.parcela  || "—") + "\n";
  body += "Puerto:    " + p.puerto + " → " + p.distKm + " km terrestres\n\n";
  body += "────────────────────────────────────────────\n";
  body += "TOTAL LLAVE EN MANO: " + fmt(p.totalLEM) + "\n";
  body += "  · Producto:        " + fmt(p.pvpProd) + "\n";
  body += "  · Montadores:      " + fmt(p.montadores) + " (" + p.nidos + " × 800 €/nido)\n";
  body += "  · Instaladores:    " + fmt(p.instaladores) + " (fijo)\n";
  body += "  · Transporte:      " + fmt(p.transporte) + " (" + p.puerto + ", " + p.distKm + " km, " + fmt(p.tpNido) + "/nido)\n";
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


// ── TEST ──────────────────────────────────────────────────────────────────────
function testGenerarPDF_v2() {
  var casos = [
    { nombre: "Test Halcón Málaga",         modelo: "Halcón · 36.000 €",
      suelo: "SPC 4 mm (9 €/m²)",           radiante: "Sin suelo radiante",
      paredes: "Mejora A — Bamboo Fiber Board (9 €/m²)", fachada_color: "Blanco (Incluido)",
      parcela: "Vélez-Málaga, Málaga",      flujo: "B", email: CONFIG.EMAIL_HUGO, telefono: "+34 600 000 000" },
    { nombre: "Test Cuco 36 Madrid",        modelo: "Cuco 36 · 17.500 €",
      suelo: "Vinílico (Incluido)",          radiante: "Sin suelo radiante",
      paredes: "Vinílico blanco (Incluido)", fachada_color: "color personalizado",
      parcela: "Madrid",                     flujo: "B", email: CONFIG.EMAIL_HUGO, telefono: "+34 700 000 000" },
    { nombre: "Test Águila Barcelona",      modelo: "Águila · 60.000 €",
      suelo: "Vinílico (Incluido)",          radiante: "Suelo radiante por agua",
      paredes: "Vinílico blanco (Incluido)", fachada_color: "Blanco (Incluido)",
      parcela: "Barcelona",                  flujo: "C", email: CONFIG.EMAIL_HUGO, telefono: "+34 800 000 000" },
    { nombre: "Test Gorrión Bilbao",        modelo: "Gorrión · 6.000 €",
      suelo: "Vinílico (Incluido)",          radiante: "Sin suelo radiante",
      paredes: "Vinílico blanco (Incluido)", fachada_color: "Blanco (Incluido)",
      parcela: "Bilbao",                     flujo: "B", email: CONFIG.EMAIL_HUGO, telefono: "+34 900 000 000" },
    { nombre: "Test Flamenco Gran Canaria", modelo: "Flamenco · 15.000 €",
      suelo: "Vinílico (Incluido)",          radiante: "Sin suelo radiante",
      paredes: "Vinílico blanco (Incluido)", fachada_color: "Blanco (Incluido)",
      parcela: "Gran Canaria",               flujo: "B", email: CONFIG.EMAIL_HUGO, telefono: "+34 610 000 000" },
    { nombre: "Test Colibrí Lisboa",        modelo: "Colibrí · 36.000 €",
      suelo: "Vinílico (Incluido)",          radiante: "Sin suelo radiante",
      paredes: "Vinílico blanco (Incluido)", fachada_color: "Blanco (Incluido)",
      parcela: "Sintra, Lisboa",             flujo: "B", email: CONFIG.EMAIL_HUGO, telefono: "+351 900 000 000" }
  ];

  casos.forEach(function(d) {
    var modelo = detectarModelo(d.modelo);
    var p      = calcularPrecios(d, modelo);
    Logger.log("\n=== " + d.nombre + " ===");
    Logger.log("Puerto:       " + p.puerto + " (" + p.distKm + " km terrestres)");
    Logger.log("Modelo:       " + modelo + " | " + p.nidos + " nidos | " + p.m2Mod + " m²");
    Logger.log("CIF/IVA/DUA:  " + fmt(p.cifInfo.cif) + " / " + fmt(p.cifInfo.iva) + " / " + fmt(p.cifInfo.dua));
    Logger.log("─ Producto:   " + fmt(p.pvpProd));
    Logger.log("─ Montadores: " + fmt(p.montadores));
    Logger.log("─ Instalad.:  " + fmt(p.instaladores));
    Logger.log("─ Transporte: " + fmt(p.transporte) + "  (" + fmt(p.tpNido) + "/nido)");
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
