// ████████████████████████████████████████████████████████████████████████████
// NIDO45 — PATCH v2 COMPLETO: Precios llave en mano + Flujos A/B/C
// v2.2 — PDF propuesta comercial completa (12 secciones)
// ────────────────────────────────────────────────────────────────────────────
// INSTRUCCIONES:
//   1. Abre script.google.com → Presupuestos.gs → pega al FINAL
//   2. Guarda → ejecuta testGenerarPDF_v2() → Deploy → Nueva versión
//
// REDEFINE:  DUA_POR_CONTENEDOR, EXTRAS_M2, PRECIOS_V2, LLAVE_EN_MANO,
//            DISTANCIAS_KM, desglosarc_CIF(), calcularDistanciaKm(),
//            calcularPrecios(), generarPresupuesto(), buildPresupuestoHTML(),
//            notificarHugo()
// USA DEL ORIGINAL: fmt(), logoSVG(), detectarModelo(), generarReferencia(),
//            htmlToPDF(), guardarEnDrive(), CONFIG, PRECIOS
// ████████████████████████████████████████████████████████████████████████████

var DUA_POR_CONTENEDOR = { "40HQ": 200, "20ft": 150, "propio": 0 };

var EXTRAS_M2 = { spc: 9, radiante: 15, bamboo: 9, carbon: 12, fachada: 10 };

var PRECIOS_V2 = {
  "Gorrión":  { nidos:1,  m2:14.3,  pvp:6000,  m2_suelo:14.3,  m2_paredes:24.9,  cont_tipo:"40HQ",   cont_num:1 },
  "Halcón":   { nidos:6,  m2:90.0,  pvp:36000, m2_suelo:90.0,  m2_paredes:89.7,  cont_tipo:"40HQ",   cont_num:1 },
  "Águila":   { nidos:10, m2:150.0, pvp:60000, m2_suelo:150.0, m2_paredes:114.4, cont_tipo:"40HQ",   cont_num:2 },
  "Flamenco": { nidos:2,  m2:20.0,  pvp:15000, m2_suelo:14.3,  m2_paredes:24.9,  cont_tipo:"20ft",   cont_num:1 },
  "Colibrí":  { nidos:3,  m2:32.0,  pvp:36000, m2_suelo:32.0,  m2_paredes:31.6,  cont_tipo:"propio", cont_num:1 },
  "Cuco 36":  { nidos:3,  m2:36.0,  pvp:17500, m2_suelo:36.0,  m2_paredes:43.1,  cont_tipo:"40HQ",   cont_num:1 },
  "Cuco 68":  { nidos:6,  m2:65.0,  pvp:25000, m2_suelo:65.0,  m2_paredes:80.5,  cont_tipo:"40HQ",   cont_num:1 }
};

var LLAVE_EN_MANO = {
  montadores_nido: 800, instaladores: 5000, transporte_nido: 500,
  descarga_nido: 250, despacho_nido: 250, km_ref: 130
};

var DISTANCIAS_KM = {
  "algeciras":{km:5,puerto:"Algeciras"},"tarifa":{km:30,puerto:"Algeciras"},
  "la linea":{km:22,puerto:"Algeciras"},"los barrios":{km:12,puerto:"Algeciras"},
  "san roque":{km:18,puerto:"Algeciras"},"cadiz":{km:50,puerto:"Algeciras"},
  "jerez":{km:82,puerto:"Algeciras"},"el puerto":{km:65,puerto:"Algeciras"},
  "sanlucar":{km:87,puerto:"Algeciras"},"chipiona":{km:95,puerto:"Algeciras"},
  "malaga":{km:130,puerto:"Algeciras"},"marbella":{km:108,puerto:"Algeciras"},
  "estepona":{km:87,puerto:"Algeciras"},"fuengirola":{km:100,puerto:"Algeciras"},
  "torremolinos":{km:118,puerto:"Algeciras"},"benalmadena":{km:112,puerto:"Algeciras"},
  "nerja":{km:172,puerto:"Algeciras"},"velez":{km:155,puerto:"Algeciras"},
  "almayate":{km:138,puerto:"Algeciras"},"antequera":{km:145,puerto:"Algeciras"},
  "ronda":{km:97,puerto:"Algeciras"},"coin":{km:120,puerto:"Algeciras"},
  "alhaurin":{km:125,puerto:"Algeciras"},"sevilla":{km:212,puerto:"Algeciras"},
  "dos hermanas":{km:219,puerto:"Algeciras"},"alcala de guadaira":{km:222,puerto:"Algeciras"},
  "utrera":{km:188,puerto:"Algeciras"},"huelva":{km:262,puerto:"Algeciras"},
  "moguer":{km:268,puerto:"Algeciras"},"lepe":{km:280,puerto:"Algeciras"},
  "ayamonte":{km:298,puerto:"Algeciras"},"granada":{km:232,puerto:"Algeciras"},
  "otura":{km:238,puerto:"Algeciras"},"motril":{km:190,puerto:"Algeciras"},
  "loja":{km:185,puerto:"Algeciras"},"baza":{km:312,puerto:"Algeciras"},
  "almeria":{km:352,puerto:"Algeciras"},"roquetas":{km:345,puerto:"Algeciras"},
  "nijar":{km:330,puerto:"Algeciras"},"vera":{km:385,puerto:"Algeciras"},
  "cordoba":{km:267,puerto:"Algeciras"},"lucena":{km:220,puerto:"Algeciras"},
  "pozoblanco":{km:315,puerto:"Algeciras"},"jaen":{km:312,puerto:"Algeciras"},
  "linares":{km:278,puerto:"Algeciras"},"ubeda":{km:320,puerto:"Algeciras"},
  "baeza":{km:308,puerto:"Algeciras"},
  "badajoz":{km:423,puerto:"Algeciras"},"caceres":{km:473,puerto:"Algeciras"},
  "merida":{km:398,puerto:"Algeciras"},"plasencia":{km:533,puerto:"Algeciras"},
  "murcia":{km:240,puerto:"Valencia"},"cartagena":{km:260,puerto:"Valencia"},
  "lorca":{km:290,puerto:"Valencia"},"valencia":{km:15,puerto:"Valencia"},
  "castellon":{km:75,puerto:"Valencia"},"gandia":{km:65,puerto:"Valencia"},
  "denia":{km:100,puerto:"Valencia"},"benidorm":{km:120,puerto:"Valencia"},
  "alicante":{km:160,puerto:"Valencia"},"elche":{km:175,puerto:"Valencia"},
  "torrevieja":{km:195,puerto:"Valencia"},"cocentaina":{km:70,puerto:"Valencia"},
  "alcoy":{km:80,puerto:"Valencia"},
  "madrid":{km:355,puerto:"Valencia"},"alcobendas":{km:365,puerto:"Valencia"},
  "getafe":{km:360,puerto:"Valencia"},"mostoles":{km:360,puerto:"Valencia"},
  "leganes":{km:355,puerto:"Valencia"},"alcala":{km:385,puerto:"Valencia"},
  "colmenar":{km:375,puerto:"Valencia"},"san martin":{km:370,puerto:"Valencia"},
  "guadalajara":{km:290,puerto:"Valencia"},"cuenca":{km:190,puerto:"Valencia"},
  "albacete":{km:165,puerto:"Valencia"},"ciudad real":{km:265,puerto:"Valencia"},
  "toledo":{km:390,puerto:"Valencia"},"talavera":{km:430,puerto:"Valencia"},
  "alcazar":{km:295,puerto:"Valencia"},
  "barcelona":{km:15,puerto:"Barcelona"},"tarragona":{km:100,puerto:"Barcelona"},
  "lleida":{km:170,puerto:"Barcelona"},"girona":{km:100,puerto:"Barcelona"},
  "zaragoza":{km:310,puerto:"Barcelona"},"huesca":{km:235,puerto:"Barcelona"},
  "teruel":{km:290,puerto:"Barcelona"},
  "bilbao":{km:15,puerto:"Bilbao"},"vitoria":{km:65,puerto:"Bilbao"},
  "san sebastian":{km:100,puerto:"Bilbao"},"pamplona":{km:155,puerto:"Bilbao"},
  "logrono":{km:135,puerto:"Bilbao"},"santander":{km:105,puerto:"Bilbao"},
  "oviedo":{km:190,puerto:"Bilbao"},"gijon":{km:200,puerto:"Bilbao"},
  "aviles":{km:195,puerto:"Bilbao"},"a coruna":{km:530,puerto:"Bilbao"},
  "santiago":{km:500,puerto:"Bilbao"},"vigo":{km:555,puerto:"Bilbao"},
  "pontevedra":{km:540,puerto:"Bilbao"},"lugo":{km:430,puerto:"Bilbao"},
  "valladolid":{km:280,puerto:"Bilbao"},"burgos":{km:120,puerto:"Bilbao"},
  "leon":{km:200,puerto:"Bilbao"},"salamanca":{km:380,puerto:"Bilbao"},
  "zamora":{km:340,puerto:"Bilbao"},"palencia":{km:210,puerto:"Bilbao"},
  "segovia":{km:330,puerto:"Bilbao"},"avila":{km:350,puerto:"Bilbao"},
  "soria":{km:230,puerto:"Bilbao"},
  "las palmas":{km:5,puerto:"Las Palmas"},"gran canaria":{km:15,puerto:"Las Palmas"},
  "arucas":{km:10,puerto:"Las Palmas"},"lanzarote":{km:150,puerto:"Las Palmas"},
  "arrecife":{km:155,puerto:"Las Palmas"},"fuerteventura":{km:180,puerto:"Las Palmas"},
  "santa cruz":{km:5,puerto:"Santa Cruz de Tenerife"},
  "tenerife":{km:15,puerto:"Santa Cruz de Tenerife"},
  "la laguna":{km:10,puerto:"Santa Cruz de Tenerife"},
  "la palma":{km:120,puerto:"Santa Cruz de Tenerife"},
  "la gomera":{km:110,puerto:"Santa Cruz de Tenerife"},
  "el hierro":{km:160,puerto:"Santa Cruz de Tenerife"},
  "palma":{km:10,puerto:"Palma de Mallorca"},"mallorca":{km:40,puerto:"Palma de Mallorca"},
  "menorca":{km:200,puerto:"Palma de Mallorca"},"mahon":{km:200,puerto:"Palma de Mallorca"},
  "ibiza":{km:160,puerto:"Palma de Mallorca"},"formentera":{km:180,puerto:"Palma de Mallorca"},
  "lisboa":{km:25,puerto:"Lisboa"},"sintra":{km:40,puerto:"Lisboa"},
  "setubal":{km:50,puerto:"Lisboa"},"sines":{km:55,puerto:"Lisboa"},
  "faro":{km:280,puerto:"Lisboa"},"algarve":{km:290,puerto:"Lisboa"},
  "porto":{km:310,puerto:"Lisboa"},"braga":{km:360,puerto:"Lisboa"},
  "coimbra":{km:200,puerto:"Lisboa"},"portugal":{km:150,puerto:"Lisboa"},
  "_default":{km:130,puerto:"Algeciras"}
};

function desglosarc_CIF(pvp, cont_tipo, cont_num) {
  var duaU = DUA_POR_CONTENEDOR[cont_tipo] !== undefined ? DUA_POR_CONTENEDOR[cont_tipo] : 200;
  var dua  = duaU * (cont_num || 1);
  var cif  = Math.round((pvp - dua) / 1.21);
  var iva  = pvp - dua - cif;
  return { cif:cif, iva:iva, dua:dua, cont_str:(cont_num||1)+"×"+(cont_tipo||"40HQ") };
}

function calcularDistanciaKm(parcela) {
  if (!parcela) return DISTANCIAS_KM["_default"];
  var p = parcela.toLowerCase()
    .replace(/[áàä]/g,"a").replace(/[éèë]/g,"e").replace(/[íìï]/g,"i")
    .replace(/[óòö]/g,"o").replace(/[úùü]/g,"u").replace(/ñ/g,"n");
  var best = null, bestLen = 0;
  for (var city in DISTANCIAS_KM) {
    if (city === "_default") continue;
    if (p.indexOf(city) > -1 && city.length > bestLen) { best = city; bestLen = city.length; }
  }
  return best ? DISTANCIAS_KM[best] : DISTANCIAS_KM["_default"];
}

function calcularPrecios(d, modelo) {
  var pv2     = PRECIOS_V2[modelo] || PRECIOS[modelo] || {};
  var pvpBase = pv2.pvp || 0, m2S = pv2.m2_suelo || 0, m2P = pv2.m2_paredes || 0;
  var nidos   = pv2.nidos || 1, m2Mod = pv2.m2 || m2S;
  var eSPC  = (d.suelo    && d.suelo.indexOf("SPC")    > -1) ? Math.round(m2S * EXTRAS_M2.spc)      : 0;
  var eRad  = (d.radiante && d.radiante.indexOf("agua") > -1) ? Math.round(m2S * EXTRAS_M2.radiante) : 0;
  var eBam  = (d.paredes  && d.paredes.indexOf("Bamboo") > -1) ? Math.round(m2P * EXTRAS_M2.bamboo)  : 0;
  var eCar  = (d.paredes  && (d.paredes.indexOf("Carbon") > -1 || d.paredes.indexOf("Carved") > -1)) ? Math.round(m2P * EXTRAS_M2.carbon) : 0;
  var eFach = (d.fachada_color && d.fachada_color.toLowerCase().indexOf("color") > -1) ? Math.round(m2P * 0.7 * EXTRAS_M2.fachada) : 0;
  var pvpProd = pvpBase + eSPC + eRad + eBam + eCar + eFach;
  var ci      = desglosarc_CIF(pvpBase, pv2.cont_tipo || "40HQ", pv2.cont_num || 1);
  var di      = calcularDistanciaKm(d.parcela || "");
  var distKm  = di.km, puerto = di.puerto;
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
    pvpBase:pvpBase, pvpProd:pvpProd,
    extraSPC:eSPC, extraRadiante:eRad, extraBamboo:eBam, extraCarbon:eCar, extraFachada:eFach,
    cifInfo:ci, nidos:nidos, distKm:distKm, tpNido:tpNido, puerto:puerto,
    montadores:mont, instaladores:inst, transporte:transp, descarga:descar, despachoT:desp,
    arqPerito:arqPer, pctArq:pctArq, totalLEM:total,
    pago1:Math.round(total*0.30), pago2:Math.round(total*0.40),
    pago3:Math.round(total*0.20), pago4:Math.round(total*0.10),
    m2Suelo:m2S, m2Paredes:m2P, m2Mod:m2Mod,
    pvpBeneficio:pvpBase, montajeMin:mont, montajeMax:mont,
    arqMin:arqPer, arqMax:arqPer, totalMin:total, totalMax:total
  };
}

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

function buildPresupuestoHTML(d, modelo, p, ref) {
  var logo  = logoSVG();
  var fecha = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy");
  var flujo = d.flujo || "B";
  var modeloDesc = {
    "Gorrión":"Vivienda mínima · Flat Pack · 1 nido · 14,3 m²",
    "Halcón":"Vivienda unifamiliar · 6 nidos · 90 m² · 3 dormitorios",
    "Águila":"Villa de lujo · 10 nidos · 150 m² · 4 dormitorios",
    "Flamenco":"Casa modular · 2 nidos · 20 m² · 1 dormitorio",
    "Colibrí":"Casa High-Tech · 3 nidos · 32 m² · 2 dormitorios",
    "Cuco 36":"Casa móvil · 3 nidos · 36 m² · 2 dormitorios",
    "Cuco 68":"Casa móvil amplia · 6 nidos · 65 m² · 3 dormitorios"
  }[modelo] || (modelo + " · " + p.m2Mod + " m²");
  var aislamientoStr = d.aislamiento || "50 mm (Incluido)";
  var extrasList = [];
  if (p.extraSPC > 0)      extrasList.push("Suelo SPC 4 mm (+9 €/m²)");
  if (p.extraRadiante > 0) extrasList.push("Suelo radiante por agua (+40 €/m²)");
  if (p.extraBamboo > 0)   extrasList.push("Paredes Bamboo Fiber Board (+9 €/m²)");
  if (p.extraCarbon > 0)   extrasList.push("Paredes Carbon Crystal Board (+9 €/m²)");
  if (p.extraFachada > 0)  extrasList.push("Fachada color personalizado (+9 €/m²)");
  var extrasStr = extrasList.length > 0 ? extrasList.join(" · ") : "Sin mejoras (configuración estándar)";
  var secTerreno = "";
  if (flujo === "A") {
    var presTerreno = d.presupuesto_terreno ? fmt(parseFloat(d.presupuesto_terreno)) : "por determinar";
    var comInmob  = d.precio_terreno ? fmt(Math.round(parseFloat(d.precio_terreno)*0.025)) : "2,5% del precio final";
    var comNido45 = d.precio_terreno ? fmt(Math.round(parseFloat(d.precio_terreno)*0.025)) : "2,5% del precio final";
    secTerreno = '<div class="section"><div class="section-title">SERVICIO DE B&Uacute;SQUEDA DE TERRENO</div>'
      + '<div class="info-box info-blue"><p>En base a la inversi&oacute;n prevista de <strong>' + presTerreno + '</strong>, Nido45 y su red de partners inmobiliarios localizar&aacute;n parcelas urbanas disponibles en la zona indicada. El precio del terreno se entregar&aacute; en documento separado.</p></div>'
      + '<table class="data-table"><thead><tr><th>CONCEPTO</th><th>IMPORTE</th></tr></thead><tbody>'
      + '<tr><td>Comisi&oacute;n partner inmobiliario</td><td class="num">' + comInmob + '</td></tr>'
      + '<tr><td>Comisi&oacute;n Nido45 (gesti&oacute;n y coordinaci&oacute;n)</td><td class="num">' + comNido45 + '</td></tr>'
      + '<tr class="row-subtotal"><td>Precio del terreno</td><td class="num">Documento aparte</td></tr>'
      + '</tbody></table></div>';
  }
  var secAviso = "";
  if (flujo === "C") {
    secAviso = '<div class="warning-box"><strong>NOTA IMPORTANTE &mdash; Terreno no urbanizable</strong><br>Nido45 declina toda responsabilidad respecto a la viabilidad urban&iacute;stica, licencias de obra, permisos de uso del suelo y cualquier tr&aacute;mite administrativo derivado de la condici&oacute;n no urbana de la parcela indicada. El cliente asume &iacute;ntegramente la responsabilidad de verificar la legalidad de la construcci&oacute;n antes de realizar cualquier pago.</div>';
  }
  var css = '<style>@page{margin:18mm 15mm}body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#1a1a1a;margin:0;padding:0;background:#fff}h1{font-size:18pt;color:#1a3c5e;font-weight:700;margin:0;line-height:1.2}.page-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:5mm;border-bottom:3pt solid #1a3c5e;margin-bottom:6mm}.ph-left .subtitle{font-size:10pt;color:#b8943c;font-weight:700;letter-spacing:0.05em;margin-top:1mm}.ph-left h1{font-size:16pt;color:#1a3c5e;margin:0}.ph-left .modelo-desc{font-size:8pt;color:#555;margin-top:2mm}.ph-right{text-align:right;font-size:8pt;color:#555;line-height:1.8}.ph-right .ref-num{font-size:11pt;font-weight:700;color:#1a3c5e}.section{margin-bottom:6mm;page-break-inside:avoid}.section-title{background:#1a3c5e;color:#fff;padding:2mm 4mm;font-size:8.5pt;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:3mm}.section-title.gold{background:#b8943c}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.info-card{border:0.5pt solid #ddd;padding:3mm 4mm;font-size:8pt;line-height:1.8}.info-card .label{font-size:6.5pt;font-weight:700;color:#b8943c;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.5mm}.info-card .name{font-size:10pt;font-weight:700;color:#1a3c5e}.info-card .role{font-size:7.5pt;color:#777}table{width:100%;border-collapse:collapse;font-size:8.5pt}table.data-table thead tr{background:#1a3c5e;color:#fff}table.data-table th{padding:2mm 3mm;text-align:left;font-weight:700;font-size:7.5pt;letter-spacing:0.05em}table.data-table th.num{text-align:right}table.data-table td{padding:2mm 3mm;border-bottom:0.3pt solid #e8e8e8;vertical-align:top}table.data-table td.num{text-align:right;white-space:nowrap;font-weight:500}table.data-table tr.row-section td{background:#f0f5fa;font-weight:700;color:#1a3c5e;font-size:7.5pt;letter-spacing:0.05em;text-transform:uppercase;border-top:1pt solid #1a3c5e}table.data-table tr.row-subtotal td{background:#f7f4ee;font-weight:700;border-top:1pt solid #ccc}table.data-table tr.row-total td{background:#1a3c5e;color:#fff;font-weight:700;font-size:10pt;padding:3mm}table.data-table tr.row-total td.num{text-align:right}table.pagos-table th{background:#1a3c5e;color:#fff;padding:2mm 3mm;font-size:7.5pt;font-weight:700}table.pagos-table td{padding:2.5mm 3mm;border-bottom:0.3pt solid #e8e8e8;font-size:8.5pt}table.pagos-table td.num{text-align:right;font-weight:700;color:#1a3c5e}table.pagos-table tr.total-row td{background:#f7f4ee;font-weight:700;border-top:2pt solid #1a3c5e}.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.comp-block{border:0.5pt solid #ddd;padding:3mm}.comp-block .comp-title{font-size:7pt;font-weight:700;color:#b8943c;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:1.5mm;border-bottom:0.5pt solid #e8e8e8;padding-bottom:1mm}.comp-block ul{padding-left:3.5mm;margin:0}.comp-block li{font-size:7.5pt;color:#444;line-height:1.7;list-style:disc}.no-incl{columns:2;column-gap:6mm}.no-incl li{font-size:8pt;line-height:1.9;list-style:none;padding-left:3mm}.no-incl li::before{content:"✗ ";color:#c0392b;font-weight:700}.info-box{border-left:3pt solid #1a3c5e;padding:2.5mm 4mm;font-size:8pt;line-height:1.6;margin-bottom:3mm;background:#f5f8fc}.info-box.info-blue{background:#f0f5fa;border-color:#1a3c5e}.info-box.info-gold{background:#fefaf3;border-color:#b8943c}.warning-box{background:#fff7e6;border-left:3pt solid #e07b00;padding:3mm 4mm;font-size:8pt;line-height:1.6;margin-bottom:4mm}.legal-text{font-size:7pt;color:#666;line-height:1.7}.legal-text strong{color:#333}.firma-grid{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:2mm}.firma-block{border:0.5pt solid #ddd;padding:4mm}.firma-block .fb-title{font-size:7pt;font-weight:700;color:#1a3c5e;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2mm;border-bottom:0.5pt solid #ddd;padding-bottom:1.5mm}.firma-line{border-bottom:0.5pt solid #999;margin:6mm 0 1mm;width:100%}.firma-desc{font-size:7pt;color:#777;line-height:1.6}footer{text-align:center;font-size:7pt;color:#aaa;border-top:0.3pt solid #ddd;padding-top:2mm;margin-top:6mm}.page-break{page-break-before:always}</style>';
  var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' + css + '</head><body>';
  // CABECERA
  html += '<div class="page-header"><div class="ph-left"><div class="subtitle">PROPUESTA COMERCIAL — LLAVE EN MANO</div><h1>' + modelo + '</h1><div class="modelo-desc">' + modeloDesc + ' &nbsp;|&nbsp; ' + p.nidos + ' nido' + (p.nidos>1?'s':'') + ' &nbsp;|&nbsp; ' + p.m2Mod + ' m&sup2;</div></div><div class="ph-right">' + logo + '<div class="ref-num">' + ref + '</div><div>Fecha: ' + fecha + '</div><div>V&aacute;lido hasta: ' + Utilities.formatDate(new Date(new Date().getTime()+30*24*60*60*1000),"Europe/Madrid","dd/MM/yyyy") + '</div></div></div>';
  html += secAviso;
  // 1. DATOS
  html += '<div class="section"><div class="section-title">Datos de la propuesta</div><div class="two-col"><div class="info-card"><div class="label">Presentado por</div><div class="name">Hugo Andr&eacute;s Perea Lisbona</div><div class="role">Director Comercial &middot; NIDO45</div><div class="role">Distribuidor Autorizado &middot; Isla Sof&iacute;a SLU</div><div style="margin-top:2mm;font-size:8pt;line-height:1.8"><a href="tel:+34645476491" style="color:#1a3c5e;text-decoration:none">+34 645 476 491</a><br><a href="mailto:nido45spain@gmail.com" style="color:#1a3c5e;text-decoration:none">nido45spain@gmail.com</a><br><a href="https://nido45.com" style="color:#1a3c5e;text-decoration:none">nido45.com</a></div></div><div class="info-card"><div class="label">Presentado a</div><div class="name">' + (d.nombre||'—') + '</div><div style="margin-top:2mm;font-size:8pt;line-height:1.8">' + (d.email?'<a href="mailto:'+d.email+'" style="color:#1a3c5e;text-decoration:none">'+d.email+'</a><br>':'') + (d.telefono?d.telefono+'<br>':'') + (d.parcela?'<span style="color:#555">Parcela: '+d.parcela+'</span>':'') + '</div></div></div></div>';
  // 2. EL PROYECTO
  html += '<div class="section"><div class="section-title">El proyecto</div><table class="data-table"><tbody><tr><td style="width:40%"><strong>Modelo</strong></td><td>' + modelo + ' &mdash; ' + p.nidos + ' nido' + (p.nidos>1?'s':'') + ' &middot; ' + p.m2Mod + ' m&sup2;</td></tr><tr><td><strong>Aislamiento t&eacute;rmico</strong></td><td>' + aislamientoStr + '</td></tr><tr><td><strong>Mejoras de producto</strong></td><td>' + extrasStr + '</td></tr><tr><td><strong>Puerto CIF &amp; log&iacute;stica</strong></td><td>Puerto de entrada: <strong>' + p.puerto + '</strong> &middot; ' + p.cifInfo.cont_str + ' &middot; Flete CIF incluido (origen: f&aacute;brica China)</td></tr><tr><td><strong>Transporte terrestre</strong></td><td>' + p.puerto + ' &rarr; parcela &middot; ' + p.distKm + ' km &middot; ' + fmt(p.tpNido) + '/nido</td></tr><tr><td><strong>Plazo de fabricaci&oacute;n</strong></td><td>18 d&iacute;as h&aacute;biles desde confirmaci&oacute;n de pago 1</td></tr><tr><td><strong>Plazo de entrega estimado</strong></td><td>~60 d&iacute;as naturales desde firma del contrato</td></tr><tr><td><strong>Garant&iacute;a</strong></td><td>3 a&ntilde;os estructura &middot; 1 a&ntilde;o componentes e instalaciones</td></tr></tbody></table></div>';
  // 3. COMPONENTES
  html += '<div class="section"><div class="section-title">Componentes incluidos</div><div class="comp-grid"><div class="comp-block"><div class="comp-title">Estructura</div><ul><li>Marco perimetral acero galvanizado Q235B</li><li>Columnas y vigas de carga laminadas en fr&iacute;o</li><li>Herrajes, torniller&iacute;a y anclajes de alta resistencia</li><li>Placa base para cimentaci&oacute;n (sin cimentaci&oacute;n)</li></ul></div><div class="comp-block"><div class="comp-title">Cerramiento y aislamiento</div><ul><li>Panel s&aacute;ndwich V950 &middot; ' + aislamientoStr + '</li><li>Cubierta chapa corrugada galvanizada</li><li>Falso techo aluminio laminado</li><li>Suelo: tablero cemento-fibra + ' + (p.extraSPC>0?'SPC 4 mm':'PVC 1,6 mm') + '</li>' + (p.extraRadiante>0?'<li>Suelo radiante por agua (tuber&iacute;as + termostato)</li>':'') + '</ul></div><div class="comp-block"><div class="comp-title">Carpinter&iacute;a y fachada</div><ul><li>Ventana: ' + (d.ventanas||'PVC corredera doble cristal') + '</li><li>Puerta: ' + (d.puerta||'Acero 50 mm') + '</li><li>Fachada: Panel Metal Carved 16 mm &middot; ' + (d.fachada_color||'Blanco') + '</li>' + (p.extraBamboo>0?'<li>Paredes int.: Bamboo Fiber Board</li>':'') + (p.extraCarbon>0?'<li>Paredes int.: Carbon Crystal Board</li>':'') + '</ul></div><div class="comp-block"><div class="comp-title">Instalaci&oacute;n el&eacute;ctrica</div><ul><li>Cuadro de distribuci&oacute;n + protecciones</li><li>Cableado completo + canalizaciones</li><li>Iluminaci&oacute;n LED integrada</li><li>Tomas de corriente y puntos de datos</li></ul></div><div class="comp-block"><div class="comp-title">Ba&ntilde;o completo</div><ul><li>Inodoro, lavabo empotrado, ducha</li><li>Mampara vidrio templado</li><li>Revestimiento cer&aacute;mico piso y paredes</li><li>Griferías y accesorios</li></ul></div><div class="comp-block"><div class="comp-title">Log&iacute;stica de origen</div><ul><li>' + p.cifInfo.cont_str + ' &middot; embalaje y precintado</li><li>Flete mar&iacute;timo CIF &mdash; China &rarr; <strong>' + p.puerto + '</strong></li><li>Seguro de carga mar&iacute;tima</li><li>Documentaci&oacute;n CE y declaraci&oacute;n de conformidad</li></ul></div></div></div>';
  // 4. DESGLOSE
  html += '<div class="section page-break"><div class="section-title gold">Desglose econ&oacute;mico</div><table class="data-table"><thead><tr><th>CONCEPTO</th><th class="num" style="width:60px">IVA</th><th class="num" style="width:90px">IMPORTE</th></tr></thead><tbody><tr class="row-section"><td colspan="3">PRODUCTO</td></tr><tr><td>M&oacute;dulos + equipamiento completo, flete CIF incluido</td><td class="num">21%</td><td class="num">' + fmt(p.cifInfo.cif) + '</td></tr>' + (p.pvpProd-p.pvpBase>0?'<tr><td>&nbsp;&nbsp;&nbsp;Mejoras de producto</td><td class="num">21%</td><td class="num">+' + fmt(p.pvpProd-p.pvpBase) + '</td></tr>':'') + '<tr><td>&nbsp;&nbsp;&nbsp;IVA importaci&oacute;n 21% sobre CIF</td><td class="num">—</td><td class="num">' + fmt(p.cifInfo.iva) + '</td></tr><tr><td>&nbsp;&nbsp;&nbsp;DUA despacho arancelario (' + p.cifInfo.cont_str + ')</td><td class="num">—</td><td class="num">' + fmt(p.cifInfo.dua) + '</td></tr><tr class="row-subtotal"><td>Precio base m&oacute;dulos entregados en Espa&ntilde;a</td><td class="num">—</td><td class="num">' + fmt(p.pvpProd) + '</td></tr><tr class="row-section"><td colspan="3">SERVICIOS LLAVE EN MANO</td></tr><tr><td>Montadores <span style="font-size:7.5pt;color:#888">(' + p.nidos + ' nidos &times; 800 &euro;/nido)</span></td><td class="num">21%</td><td class="num">' + fmt(p.montadores) + '</td></tr><tr><td>Instaladores &mdash; el&eacute;ctrica, fontaner&iacute;a, climatizaci&oacute;n <span style="font-size:7.5pt;color:#888">(precio fijo)</span></td><td class="num">21%</td><td class="num">' + fmt(p.instaladores) + '</td></tr><tr><td>Transporte ' + p.puerto + ' &rarr; parcela <span style="font-size:7.5pt;color:#888">(' + p.nidos + ' nidos &times; ' + fmt(p.tpNido) + '/nido &middot; ' + p.distKm + ' km)</span></td><td class="num">21%</td><td class="num">' + fmt(p.transporte) + '</td></tr><tr><td>Descarga en parcela <span style="font-size:7.5pt;color:#888">(' + p.nidos + ' nidos &times; 250 &euro;/nido)</span></td><td class="num">21%</td><td class="num">' + fmt(p.descarga) + '</td></tr><tr><td>Despacho de aduanas <span style="font-size:7.5pt;color:#888">(' + p.nidos + ' nidos &times; 250 &euro;/nido)</span></td><td class="num">21%</td><td class="num">' + fmt(p.despachoT) + '</td></tr><tr><td>Arquitecto + Perito <span style="font-size:7.5pt;color:#888">(' + Math.round(p.pctArq*100) + '% sobre CIF ' + fmt(p.cifInfo.cif) + ' &middot; ' + p.m2Mod + ' m&sup2;)</span></td><td class="num">21%</td><td class="num">' + fmt(p.arqPerito) + '</td></tr><tr class="row-total"><td><strong>TOTAL LLAVE EN MANO</strong></td><td class="num">—</td><td class="num"><strong>' + fmt(p.totalLEM) + '</strong></td></tr></tbody></table><p style="font-size:7pt;color:#888;margin-top:2mm;">* Importes en euros. IVA 21% sobre servicios en España. Tipo de cambio USD/EUR del día de pago. IVA vivienda habitual: 10% (verificar con asesor fiscal).</p></div>';
  // 5. NO INCLUIDOS
  html += '<div class="section"><div class="section-title">Servicios no incluidos</div><ul class="no-incl"><li>Cimentaci&oacute;n y movimiento de tierras</li><li>Acometida el&eacute;ctrica a red general</li><li>Acometida de agua y saneamiento</li><li>Licencia de obra municipal</li><li>Mobiliario y electrodom&eacute;sticos</li><li>Vallado y urbanizaci&oacute;n de parcela</li><li>Jardiner&iacute;a y paisajismo</li><li>Modificaciones posteriores a la firma</li></ul></div>';
  html += secTerreno;
  // 6. PAGOS
  html += '<div class="section"><div class="section-title gold">Calendario de pagos</div><table class="pagos-table"><thead><tr><th style="width:30px">#</th><th>HITO</th><th>MOMENTO</th><th class="num">%</th><th class="num">IMPORTE</th></tr></thead><tbody><tr><td><strong>1</strong></td><td>Se&ntilde;al de reserva</td><td>Firma del contrato</td><td class="num">30%</td><td class="num">' + fmt(p.pago1) + '</td></tr><tr><td><strong>2</strong></td><td>Salida de f&aacute;brica</td><td>Inspecci&oacute;n fotogr&aacute;fica / visita + embarque</td><td class="num">40%</td><td class="num">' + fmt(p.pago2) + '</td></tr><tr><td><strong>3</strong></td><td>Llegada a parcela</td><td>Recepci&oacute;n e inspecci&oacute;n de perito</td><td class="num">20%</td><td class="num">' + fmt(p.pago3) + '</td></tr><tr><td><strong>4</strong></td><td>Entrega de llaves</td><td>Firma del acta de recepci&oacute;n</td><td class="num">10%</td><td class="num">' + fmt(p.pago4) + '</td></tr><tr class="total-row"><td colspan="3"><strong>TOTAL LLAVE EN MANO</strong></td><td class="num"><strong>100%</strong></td><td class="num"><strong>' + fmt(p.totalLEM) + '</strong></td></tr></tbody></table><div class="info-box info-gold" style="margin-top:3mm;font-size:8pt;"><strong>Datos bancarios para transferencia:</strong><br>Beneficiario: <strong>Isla Sof&iacute;a SLU</strong> &middot; NIF B26607044<br>IBAN: <strong>ES26 3058 0794 3727 2001 3940</strong> &middot; Entidad: Cajamar<br>Concepto: Ref. ' + ref + ' &mdash; ' + (d.nombre||'') + ' &mdash; indicar hito (1/2/3/4)</div></div>';
  // 7. DATOS FISCALES
  html += '<div class="section"><div class="section-title">Datos fiscales</div><div class="two-col"><div class="info-card" style="font-size:8pt;line-height:2"><strong>Raz&oacute;n social:</strong> Isla Sof&iacute;a SLU<br><strong>NIF:</strong> B26607044<br><strong>Domicilio:</strong> El Capit&aacute;n, Almayate, 29792 M&aacute;laga<br><strong>Email:</strong> nido45spain@gmail.com<br><strong>Tel&eacute;fono:</strong> +34 645 476 491<br><strong>Web:</strong> nido45.com</div><div class="info-card" style="font-size:8pt;line-height:2"><strong>IVA aplicable:</strong><br>10% &mdash; vivienda habitual (a verificar con asesor fiscal)<br>21% &mdash; segunda residencia, inversi&oacute;n, uso no residencial<br><br><strong>Confidencialidad:</strong><br>Documento confidencial. Uso exclusivo del destinatario.</div></div></div>';
  // 8. CLAUSULAS
  html += '<div class="section"><div class="section-title">Condiciones generales y cl&aacute;usula de no devoluci&oacute;n</div><div class="legal-text"><p style="margin-bottom:2mm;">El presente presupuesto tiene car&aacute;cter vinculante desde el momento en que el cliente realice cualquier pago, quedando formalizado el encargo de los servicios descritos.</p><p style="margin-bottom:2mm;"><strong>NO DEVOLUCI&Oacute;N DE PAGOS:</strong> Una vez efectuado cualquier pago parcial o total, el cliente renuncia expresamente al derecho de devoluci&oacute;n de los importes abonados en caso de desistimiento voluntario, cancelaci&oacute;n del pedido o cambio de decisi&oacute;n. Los pagos realizados quedan retenidos por Nido45 como compensaci&oacute;n por los costes operativos, de gesti&oacute;n, reserva de fabricaci&oacute;n y servicios activados, conforme a lo previsto en el art&iacute;culo 1.124 y concordantes del C&oacute;digo Civil espa&ntilde;ol y la legislaci&oacute;n de consumidores aplicable.</p><p style="margin-bottom:2mm;"><strong>VALIDEZ:</strong> Presupuesto v&aacute;lido 30 d&iacute;as naturales desde la fecha de emisi&oacute;n. No incluye tasas municipales de obra, IBI, suministros durante la instalaci&oacute;n, vallado ni jardiner&iacute;a. Precio de f&aacute;brica en USD; el importe en euros puede variar seg&uacute;n el tipo de cambio del d&iacute;a de pago.</p><p><strong>PROTECCI&Oacute;N DE DATOS (RGPD):</strong> Los datos personales facilitados ser&aacute;n tratados por Isla Sof&iacute;a SLU para la gesti&oacute;n de la relaci&oacute;n comercial, conforme al Reglamento (UE) 2016/679. Puede ejercer sus derechos en nido45spain@gmail.com.</p></div></div>';
  // 9. FIRMA
  html += '<div class="section"><div class="section-title">Conformidad y firma</div><div class="firma-grid"><div class="firma-block"><div class="fb-title">Presentado por</div><div style="font-size:8.5pt;line-height:1.8;margin-bottom:3mm;">Hugo Andr&eacute;s Perea Lisbona<br><span style="color:#777;font-size:7.5pt">Director Comercial NIDO45<br>Distribuidor Autorizado<br>Isla Sof&iacute;a SLU &middot; NIF B26607044</span></div><div class="firma-line"></div><div class="firma-desc">Firma y sello &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Fecha: ' + fecha + '</div></div><div class="firma-block"><div class="fb-title">Conforme el cliente</div><div style="font-size:8.5pt;line-height:1.8;margin-bottom:3mm;">D./D&ntilde;a. ' + (d.nombre||'___________________________') + '<br><span style="color:#777;font-size:7.5pt">DNI / NIF: ___________________________<br>En representaci&oacute;n de (si procede): _______________</span></div><div class="firma-line"></div><div class="firma-desc">Firma &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Fecha y lugar:</div></div></div><div class="legal-text" style="margin-top:3mm;font-size:7pt;">Hugo Andr&eacute;s Perea Lisbona act&uacute;a como Distribuidor Autorizado de los productos NIDO45 en Espa&ntilde;a y Portugal, en nombre y representaci&oacute;n de Isla Sof&iacute;a SLU. La firma de este documento implica la aceptaci&oacute;n de las condiciones generales descritas y el compromiso de los pagos acordados. Documento confidencial de uso exclusivo del destinatario.</div></div>';
  html += '<footer>Nido45 &middot; Isla Sof&iacute;a SLU &middot; NIF B26607044 &middot; El Capit&aacute;n, Almayate, 29792 M&aacute;laga &middot; nido45spain@gmail.com &middot; Ref: ' + ref + '</footer>';
  html += '</body></html>';
  return html;
}

function notificarHugo(d, ref, url, p) {
  var asunto = "[NIDO45] Nuevo presupuesto — " + ref + " · " + (d.nombre || "Lead");
  var body   = "Presupuesto generado.\n\nCliente:   " + (d.nombre||"—") + "\nTeléfono:  " + (d.telefono||"—") + "\nEmail:     " + (d.email||"—") + "\nModelo:    " + (d.modelo||"—") + " (" + p.nidos + " nidos)\nFlujo:     " + (d.flujo||"B") + "\nZona:      " + (d.parcela||"—") + "\nPuerto:    " + p.puerto + " → " + p.distKm + " km terrestres\n\n────────────────────────────────────────────\nTOTAL LLAVE EN MANO: " + fmt(p.totalLEM) + "\n  · Producto:        " + fmt(p.pvpProd) + "\n  · Montadores:      " + fmt(p.montadores) + " (" + p.nidos + " × 800 €/nido)\n  · Instaladores:    " + fmt(p.instaladores) + " (fijo)\n  · Transporte:      " + fmt(p.transporte) + " (" + p.puerto + ", " + p.distKm + " km)\n  · Descarga:        " + fmt(p.descarga) + "\n  · Despacho aduas:  " + fmt(p.despachoT) + "\n  · Arq+Perito:      " + fmt(p.arqPerito) + " (" + Math.round(p.pctArq*100) + "% CIF)\n\nPAGOS: " + fmt(p.pago1) + " | " + fmt(p.pago2) + " | " + fmt(p.pago3) + " | " + fmt(p.pago4) + "\n\nPDF: " + url + "\n\nRef: " + ref;
  MailApp.sendEmail({ to: CONFIG.EMAIL_HUGO, subject: asunto, body: body });
}

function testGenerarPDF_v2() {
  var casos = [
    { nombre:"Test Halcón Málaga", modelo:"Halcón · 36.000 €", suelo:"SPC 4 mm (9 €/m²)", radiante:"Sin suelo radiante", paredes:"Mejora A — Bamboo Fiber Board (9 €/m²)", fachada_color:"Blanco (Incluido)", aislamiento:"50 mm (Incluido)", ventanas:"PVC corredera doble cristal (Incluida)", puerta:"Acero 50 mm (Incluida)", parcela:"Vélez-Málaga, Málaga", flujo:"B", email:CONFIG.EMAIL_HUGO, telefono:"+34 600 000 000" },
    { nombre:"Test Cuco 36 Madrid", modelo:"Cuco 36 · 17.500 €", suelo:"Vinílico (Incluido)", radiante:"Sin suelo radiante", paredes:"Vinílico blanco (Incluido)", fachada_color:"color personalizado", aislamiento:"50 mm (Incluido)", parcela:"Madrid", flujo:"B", email:CONFIG.EMAIL_HUGO, telefono:"+34 700 000 000" },
    { nombre:"Test Águila Barcelona", modelo:"Águila · 60.000 €", suelo:"Vinílico (Incluido)", radiante:"Suelo radiante por agua", paredes:"Vinílico blanco (Incluido)", fachada_color:"Blanco (Incluido)", aislamiento:"50 mm (Incluido)", parcela:"Barcelona", flujo:"C", email:CONFIG.EMAIL_HUGO, telefono:"+34 800 000 000" },
    { nombre:"Test Colibrí Lisboa", modelo:"Colibrí · 36.000 €", suelo:"Vinílico (Incluido)", radiante:"Sin suelo radiante", paredes:"Vinílico blanco (Incluido)", fachada_color:"Blanco (Incluido)", aislamiento:"50 mm (Incluido)", parcela:"Sintra, Lisboa", flujo:"A", presupuesto_terreno:"60000", email:CONFIG.EMAIL_HUGO, telefono:"+351 900 000 000" }
  ];
  casos.forEach(function(d) {
    var modelo = detectarModelo(d.modelo);
    var p      = calcularPrecios(d, modelo);
    Logger.log("\n=== " + d.nombre + " ===");
    Logger.log("Puerto: " + p.puerto + " (" + p.distKm + " km) | Flujo: " + (d.flujo||"B"));
    Logger.log("CIF/IVA/DUA: " + fmt(p.cifInfo.cif) + " / " + fmt(p.cifInfo.iva) + " / " + fmt(p.cifInfo.dua));
    Logger.log("TOTAL LEM: " + fmt(p.totalLEM) + " | Pagos: " + fmt(p.pago1) + "/" + fmt(p.pago2) + "/" + fmt(p.pago3) + "/" + fmt(p.pago4));
  });
}
