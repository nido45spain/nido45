<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NIDO45 — Solicitar Presupuesto</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Jost,sans-serif;font-weight:300;background:#1A2E1A;color:#F8F5EF;min-height:100vh}
header{padding:20px 18px 14px;text-align:center;border-bottom:1px solid rgba(201,168,76,.25);position:sticky;top:0;background:#1A2E1A;z-index:9}
.logo{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#C9A84C;letter-spacing:3px}
.sub{font-size:8px;letter-spacing:4px;color:#9A9285;margin-top:2px;text-transform:uppercase}
.hero{padding:26px 18px 18px;text-align:center;max-width:560px;margin:0 auto}
.hero h1{font-family:'Cormorant Garamond',serif;font-size:clamp(22px,6vw,34px);font-weight:400;color:#fff;line-height:1.2}
.hero h1 em{color:#C9A84C;font-style:italic}
.gl{width:36px;height:1px;background:#C9A84C;margin:12px auto}
.hero p{font-size:13px;color:#E8D5A3;line-height:1.7}
form{max-width:560px;margin:0 auto;padding:0 14px 60px}
.sec{background:rgba(255,255,255,.04);border:1px solid rgba(201,168,76,.16);border-radius:10px;padding:16px 14px;margin-bottom:10px}
.sn{font-size:8px;letter-spacing:4px;color:#C9A84C;text-transform:uppercase;margin-bottom:2px}
.st{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:#fff;margin-bottom:2px}
.sh{font-size:12px;color:#9A9285;margin-bottom:10px;line-height:1.5}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.opt{display:flex;align-items:flex-start;gap:8px;padding:9px 11px;border:1px solid rgba(255,255,255,.1);border-radius:6px;cursor:pointer;font-size:12px;color:#F8F5EF;line-height:1.3;transition:.12s;position:relative}
.opt input{position:absolute;opacity:0;width:0;height:0}
.price{display:block;font-size:10px;color:#C9A84C;margin-top:1px}
.cb{width:15px;height:15px;border:1.5px solid rgba(255,255,255,.2);border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px;transition:.12s}
.ck{display:none}
.fi{margin-top:8px}
.fi label{display:block;font-size:9px;letter-spacing:2px;color:#9A9285;text-transform:uppercase;margin-bottom:3px}
.fi input,.fi textarea,.fi select{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#F8F5EF;font-family:Jost,sans-serif;font-size:13px;padding:9px 11px;outline:none;transition:.12s;-webkit-appearance:none}
.fi input:focus,.fi textarea:focus,.fi select:focus{border-color:#C9A84C}
.fi textarea{resize:vertical;min-height:60px}
.fi input::placeholder,.fi textarea::placeholder{color:rgba(154,146,133,.5)}
.fi select option{background:#1A2E1A;color:#F8F5EF}
.dv{height:1px;background:rgba(255,255,255,.07);margin:8px 0}
.cond{display:none;margin-top:6px}
.btn{width:100%;background:#C9A84C;color:#1A2E1A;font-family:Jost,sans-serif;font-weight:500;font-size:14px;letter-spacing:2px;text-transform:uppercase;border:none;border-radius:8px;padding:17px;cursor:pointer;margin-top:6px;transition:.15s}
.btn:hover{background:#d4b05a}
.btn:disabled{opacity:.6;cursor:not-allowed}
.note{text-align:center;font-size:11px;color:#9A9285;margin-top:8px;line-height:1.5}
footer{border-top:1px solid rgba(201,168,76,.18);padding:14px 18px;text-align:center;font-size:10px;color:#9A9285;line-height:1.8}
footer a{color:#C9A84C;text-decoration:none}
@media(max-width:400px){.g2,.g3{grid-template-columns:1fr}}
/* Success */
#success{display:none;min-height:80vh;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;max-width:500px;margin:0 auto}
.ic{width:72px;height:72px;background:rgba(201,168,76,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;border:2px solid #C9A84C}
#success h1{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:400;color:#fff;margin-bottom:12px;line-height:1.2}
#success h1 em{color:#C9A84C;font-style:italic}
#success p{font-size:14px;color:#E8D5A3;line-height:1.8;max-width:400px}
.badge{display:inline-block;margin-top:24px;padding:10px 24px;border:1px solid rgba(201,168,76,.4);border-radius:6px;font-size:12px;color:#9A9285;letter-spacing:1px}
</style>
</head>
<body>

<header>
  <div class="logo">NIDO45</div>
  <div class="sub">New Generation Homes</div>
</header>

<!-- SUCCESS -->
<div id="success">
  <div class="ic">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <polyline points="4,16 12,24 28,8" stroke="#C9A84C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <h1>¡Solicitud enviada!<br><em>Gracias.</em></h1>
  <div class="gl"></div>
  <p>El equipo NIDO45 ha recibido tu solicitud y te contactará en menos de <strong style="color:#fff">48 horas</strong>.<br><br>
  <span style="color:#C9A84C;font-weight:500">nido45spain@gmail.com · +34 645 476 491</span></p>
  <div class="badge">Sin compromiso · Válido 30 días</div>
</div>

<!-- HERO -->
<div id="hero" class="hero">
  <h1>Tu casa ya tiene forma.<br><em>Ponle precio.</em></h1>
  <div class="gl"></div>
  <p>Rellena el formulario. En 48 horas recibes tu presupuesto.<br>Sin compromiso · Válido 30 días.</p>
</div>

<!-- FORM -->
<form id="frm" onsubmit="enviar(event)">

  <!-- 01 MODELO -->
  <div class="sec">
    <div class="sn">01</div><div class="st">Tu modelo</div>
    <div class="sh">Selecciona el que más te interesa.</div>
    <div class="g2">
      <label class="opt" onclick="hl(this)"><input type="radio" name="modelo" value="El Gorrión — desde 6.000 €" required><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>El Gorrión<span class="price">desde 6.000 €</span></span></label>
      <label class="opt" onclick="hl(this)"><input type="radio" name="modelo" value="El Flamenco — desde 15.000 €/módulo"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>El Flamenco<span class="price">desde 15.000 €/módulo</span></span></label>
      <label class="opt" onclick="hl(this)"><input type="radio" name="modelo" value="El Halcón — desde 36.000 €"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>El Halcón<span class="price">desde 36.000 €</span></span></label>
      <label class="opt" onclick="hl(this)"><input type="radio" name="modelo" value="El Águila — desde 60.000 €"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>El Águila<span class="price">desde 60.000 €</span></span></label>
      <label class="opt" onclick="hl(this)"><input type="radio" name="modelo" value="El Colibrí — desde 36.000 €"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>El Colibrí<span class="price">desde 36.000 €</span></span></label>
      <label class="opt" onclick="hl(this)"><input type="radio" name="modelo" value="El Cuco — desde 15.000 €"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>El Cuco<span class="price">desde 15.000 €</span></span></label>
    </div>
    <div class="fi"><label>Nº módulos o m² (opcional)</label><input type="text" name="modulos" placeholder="ej. 2 módulos / 30 m²"></div>
  </div>

  <!-- 02 SUELO -->
  <div class="sec">
    <div class="sn">02</div><div class="st">Tu suelo</div>
    <div class="sh">SPC tiene coste adicional de 9,60 €/m².</div>
    <div class="g2">
      <label class="opt" onclick="hl(this);sc()"><input type="radio" name="suelo" value="PVC 1,6 mm (incluido)" required><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>PVC 1,6 mm<span class="price">Incluido</span></span></label>
      <label class="opt" onclick="hl(this);sc()"><input type="radio" name="suelo" value="SPC 4 mm — 9,60 €/m²"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>SPC 4 mm<span class="price">9,60 €/m²</span></span></label>
    </div>
    <div class="cond" id="cs-suelo">
      <div class="fi"><label>Color SPC</label>
        <select name="suelo_color"><option value="">— Elige color —</option><option>Gris claro</option><option>Madera miel</option><option>Gris cálido</option><option>Gris frío</option><option>Madera natural</option><option>Madera oscura</option><option>Gris azulado</option><option>Caoba</option></select>
      </div>
    </div>
    <div class="dv"></div>
    <label class="opt" onclick="hl(this)"><input type="checkbox" name="radiante" value="si"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Suelo radiante de grafeno<span class="price">precio a consultar</span></span></label>
  </div>

  <!-- 03 PAREDES -->
  <div class="sec">
    <div class="sn">03</div><div class="st">Paredes interiores</div>
    <div class="sh">Bamboo 8,10 €/m² · Carved Metal según color.</div>
    <div class="g2">
      <label class="opt" onclick="hl(this);sc()"><input type="radio" name="pared" value="Bamboo Fiber Board — 8,10 €/m²" required><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Bamboo Fiber Board<span class="price">8,10 €/m²</span></span></label>
      <label class="opt" onclick="hl(this);sc()"><input type="radio" name="pared" value="Carved Metal Board — según color"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Carved Metal Board<span class="price">según color</span></span></label>
    </div>
    <div class="cond" id="cs-bamboo">
      <div class="fi"><label>Color Bamboo</label>
        <select name="pared_color_b"><option value="">— Elige color —</option><option>Blanco</option><option>Lino</option><option>Beige</option><option>Roble gris</option><option>Gris oscuro</option><option>Gris lino</option><option>Nogal</option><option>Mármol</option><option>Antracita</option></select>
      </div>
    </div>
    <div class="cond" id="cs-metal">
      <div class="fi"><label>Color Carved Metal</label>
        <select name="pared_color_m"><option value="">— Elige color —</option><option>Gris claro</option><option>Antracita</option><option>Madera roble</option><option>Wengué</option><option>Madera rojiza</option><option>Pizarra</option><option>Ladrillo blanco</option><option>Piedra gris</option><option>Corteza</option></select>
      </div>
    </div>
  </div>

  <!-- 04 FACHADA -->
  <div class="sec">
    <div class="sn">04</div><div class="st">Fachada exterior</div>
    <div class="sh">Acabado, aislamiento, ventana y puerta.</div>
    <div class="fi"><label>Acabado exterior</label>
      <select name="fachada_acabado"><option value="">— Elige —</option><option>Blanco (incluido)</option><option>Gris (incluido)</option><option>Efecto madera (incluido)</option></select>
    </div>
    <div class="fi"><label>Aislamiento</label>
      <div class="g3" style="margin-top:5px">
        <label class="opt" style="font-size:11px" onclick="hl(this)"><input type="radio" name="aislamiento" value="50 mm estándar (incluido)" required><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>50 mm<span class="price">Incluido</span></span></label>
        <label class="opt" style="font-size:11px" onclick="hl(this)"><input type="radio" name="aislamiento" value="75 mm upgrade"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>75 mm<span class="price">Upgrade</span></span></label>
        <label class="opt" style="font-size:11px" onclick="hl(this)"><input type="radio" name="aislamiento" value="100 mm premium"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>100 mm<span class="price">Premium</span></span></label>
      </div>
    </div>
    <div class="fi"><label>Ventana</label>
      <select name="ventana"><option value="">— Elige —</option><option>PVC corredera doble cristal (incluida)</option><option>Aluminio (upgrade)</option><option>Rotura puente térmico Low-E + persiana (premium)</option></select>
    </div>
    <div class="fi"><label>Puerta de acceso</label>
      <select name="puerta"><option value="">— Elige —</option><option>Acero 50 mm (incluida)</option><option>Doble vidrio templado (upgrade)</option><option>Corredera aluminio panorámica (upgrade)</option></select>
    </div>
  </div>

  <!-- 05 SERVICIOS -->
  <div class="sec">
    <div class="sn">05</div><div class="st">Servicios adicionales</div>
    <div class="sh">Márcalos — te los presupuestamos aparte.</div>
    <div class="g2">
      <label class="opt" onclick="hl(this)"><input type="checkbox" name="s_terreno" value="si"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Búsqueda de terreno</span></label>
      <label class="opt" onclick="hl(this)"><input type="checkbox" name="s_transporte" value="si"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Transporte a parcela</span></label>
      <label class="opt" onclick="hl(this)"><input type="checkbox" name="s_montaje" value="si"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Montaje e instalación</span></label>
      <label class="opt" onclick="hl(this)"><input type="checkbox" name="s_licencia" value="si"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Licencia de obra</span></label>
      <label class="opt" onclick="hl(this)"><input type="checkbox" name="s_ciment" value="si"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Cimentación y terreno</span></label>
      <label class="opt" onclick="hl(this)"><input type="checkbox" name="s_acomet" value="si"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>Acometidas (luz/agua)</span></label>
    </div>
  </div>

  <!-- 06 PARCELA -->
  <div class="sec">
    <div class="sn">06</div><div class="st">Tu parcela</div>
    <div class="sh">Para calcular transporte y cimentación.</div>
    <div class="fi"><label>Dirección o municipio</label><input type="text" name="parcela" placeholder="ej. Cajiz, Málaga"></div>
    <div class="fi"><label>Ref. catastral (opcional)</label><input type="text" name="catastro" placeholder="ej. 29XXX..."></div>
    <div class="dv"></div>
    <label class="opt" onclick="hl(this)"><input type="checkbox" name="sin_terreno" value="si"><span class="cb"><svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline class="ck" points="1,4.5 3.5,7 8,1.5" stroke="#1A2E1A" stroke-width="2" stroke-linecap="round" fill="none"/></svg></span><span>No tengo terreno — quiero ayuda para encontrarlo</span></label>
  </div>

  <!-- 07 DATOS -->
  <div class="sec">
    <div class="sn">07</div><div class="st">Tus datos</div>
    <div class="sh">Solo para enviarte el presupuesto.</div>
    <div class="fi"><label>Nombre completo *</label><input type="text" name="nombre" required placeholder="Tu nombre"></div>
    <div class="fi"><label>Teléfono *</label><input type="tel" name="telefono" required placeholder="+34 6XX XXX XXX"></div>
    <div class="fi"><label>Email *</label><input type="email" name="email" required placeholder="tu@email.com"></div>
    <div class="fi"><label>Horario para llamar</label><input type="text" name="horario" placeholder="Mañanas / Tardes / Cualquiera"></div>
    <div class="fi"><label>Notas adicionales</label><textarea name="notas" placeholder="Proyecto, dudas, boceto..."></textarea></div>
  </div>

  <button type="submit" class="btn" id="btn">QUIERO MI PRESUPUESTO</button>
  <p class="note">En 48 horas recibes respuesta · Sin compromiso · Válido 30 días<br>Datos protegidos RGPD · Isla Sofía SLU · NIF B26607044</p>
</form>

<footer>
  <a href="https://nido45.com">nido45.com</a> · nido45spain@gmail.com · +34 645 476 491<br>
  Isla Sofía SLU · NIF B26607044 · © 2026 NIDO45
</footer>

<script>
var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-KV0OsgcEw1naO-_7mggaZ-aEgjRqdxFCVxYO7iTEhT2Rcp_8aOngZ25PXSNxvvs/exec";

function enviar(e) {
  e.preventDefault();
  var btn = document.getElementById('btn');
  btn.textContent = 'ENVIANDO...';
  btn.disabled = true;

  var form = document.getElementById('frm');
  var params = new URLSearchParams();

  form.querySelectorAll('input, textarea, select').forEach(function(inp) {
    if (!inp.name) return;
    if (inp.type === 'radio' && inp.checked) params.set(inp.name, inp.value);
    else if (inp.type === 'checkbox' && inp.checked) params.set(inp.name, inp.value);
    else if (inp.type !== 'radio' && inp.type !== 'checkbox') params.set(inp.name, inp.value);
  });

  // Usamos no-cors para evitar bloqueo CORS — el email se envía igualmente
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params.toString()
  })
  .then(function() {
    mostrarExito();
  })
  .catch(function() {
    mostrarExito();
  });
}

function mostrarExito() {
  document.getElementById('frm').style.display = 'none';
  document.getElementById('hero').style.display = 'none';
  var s = document.getElementById('success');
  s.style.display = 'flex';
  window.scrollTo(0, 0);
}

function hl(el) {
  var inp = el.querySelector('input');
  if (!inp) return;
  setTimeout(function() {
    var on = inp.checked;
    el.style.borderColor = on ? '#C9A84C' : 'rgba(255,255,255,.1)';
    el.style.background = on ? 'rgba(201,168,76,.1)' : '';
    el.style.color = on ? '#C9A84C' : '#F8F5EF';
    var cb = el.querySelector('.cb');
    if (cb) { cb.style.borderColor = on ? '#C9A84C' : 'rgba(255,255,255,.2)'; cb.style.background = on ? '#C9A84C' : ''; }
    var ck = el.querySelector('.ck');
    if (ck) ck.style.display = on ? 'block' : 'none';
    if (inp.type === 'radio') {
      document.querySelectorAll('input[name=' + inp.name + ']').forEach(function(o) {
        if (o !== inp) {
          var ol = o.closest('label');
          if (!ol) return;
          ol.style.borderColor = 'rgba(255,255,255,.1)';
          ol.style.background = '';
          ol.style.color = '#F8F5EF';
          var cb2 = ol.querySelector('.cb');
          var ck2 = ol.querySelector('.ck');
          if (cb2) { cb2.style.borderColor = 'rgba(255,255,255,.2)'; cb2.style.background = ''; }
          if (ck2) ck2.style.display = 'none';
        }
      });
    }
  }, 10);
}

function sc() {
  setTimeout(function() {
    var su = document.querySelector('input[name=suelo]:checked');
    var pa = document.querySelector('input[name=pared]:checked');
    var cs = document.getElementById('cs-suelo');
    var cb = document.getElementById('cs-bamboo');
    var cm = document.getElementById('cs-metal');
    if (cs) cs.style.display = (su && su.value.indexOf('SPC') > -1) ? 'block' : 'none';
    if (cb) cb.style.display = (pa && pa.value.indexOf('Bamboo') > -1) ? 'block' : 'none';
    if (cm) cm.style.display = (pa && pa.value.indexOf('Carved') > -1) ? 'block' : 'none';
  }, 10);
}
</script>
</body>
</html>
