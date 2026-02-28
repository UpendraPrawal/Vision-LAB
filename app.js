/* ============================================================
   VISIONLAB — app.js
   OpenCV.js Browser Image Processing Toolkit
   ============================================================ */

'use strict';

// ── STATE ────────────────────────────────────────────────────
let cvReady   = false;
let globalMat = null;   // shared Mat for all modules
let globalFile = null;  // original File reference
const LOADER_MIN_MS = 1000;
const LOADER_FALLBACK_MS = 3000;
const loaderStartedAt = Date.now();
let loaderHidden = false;

// Per-module result mats (cleared on new global upload)
let histMat2 = null;
let faceCascade = null;

// Chart instances
let histGrayChart = null, histColorChart = null, threshHistChart = null;

// Sample 5x5 matrix for threshold demo
const SAMPLE_MATRIX = [
  [ 45, 120, 200,  85, 160],
  [230,  10,  75, 190,  55],
  [100, 145, 220,  30, 175],
  [ 15,  90, 130, 255,  70],
  [180,  60, 110, 240,  25]
];

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (document.body && !document.body.classList.contains('loader-active')) {
    document.body.classList.add('loader-active');
  }
  buildMobileNav();
  buildMatrixDemo(127);
  initDragDrop();
});

function hideLoaderNow() {
  if (loaderHidden) return;
  loaderHidden = true;
  const loading = document.getElementById('loadingScreen');
  if (loading) loading.classList.add('hidden');
  if (document.body) {
    document.body.classList.remove('loader-active');
    document.body.classList.add('page-ready');
  }
}

function hideLoaderAfterMinDelay() {
  const elapsed = Date.now() - loaderStartedAt;
  const remaining = Math.max(0, LOADER_MIN_MS - elapsed);
  setTimeout(hideLoaderNow, remaining);
}

function onOpenCvReady() {
  cvReady = true;
  document.getElementById('cvDot').classList.add('ready');
  document.getElementById('cvStatusText').textContent = 'OpenCV Ready';
  hideLoaderAfterMinDelay();
  buildMatrixDemo(127);
}

// Fallback: hide loader after 3s even if cv not ready
setTimeout(() => {
  hideLoaderNow();
}, LOADER_FALLBACK_MS);

// ── GLOBAL IMAGE UPLOAD ───────────────────────────────────────
function handleGlobalUpload(event) {
  if (!checkCV()) return;
  const file = event.target.files[0];
  if (!file) return;
  loadImageFromFile(file, img => {
    // Free previous
    if (globalMat) globalMat.delete();
    globalMat  = cv.imread(img);
    globalFile = file;

    // Update header info
    document.getElementById('globalFileName').textContent = file.name;
    document.getElementById('globalFileMeta').textContent =
      `${globalMat.cols}×${globalMat.rows} · ${(file.size / 1024).toFixed(1)} KB`;
    document.getElementById('globalFileInfo').style.display = 'flex';
    document.getElementById('globalBadge').style.display    = 'inline-block';
    document.getElementById('noImageHint').style.display    = 'none';

    // Push to all modules
    applyGlobalToAllModules();
  });
}

function applyGlobalToAllModules() {
  if (!globalMat) return;
  applyToSec0();
  applyToSec1();
  applyToSec2();
  applyToSec3();
  applyToSec4();
  applyToSec5();
  applyToSec6();
  applyToSec7();
  applyToSec8();
}

// ── MODULE 01 — Image Reading ─────────────────────────────────
function applyToSec0() {
  const src = globalMat.clone();

  // Original display
  const origWrap = document.getElementById('originalWrap');
  origWrap.innerHTML = '';
  const c1 = makeCanvas();
  origWrap.appendChild(c1);
  cv.imshow(c1, src);

  // BGR → RGB
  const rgb = new cv.Mat();
  cv.cvtColor(src, rgb, cv.COLOR_BGR2RGB);
  const rgbWrap = document.getElementById('rgbWrap');
  rgbWrap.innerHTML = '';
  const c2 = makeCanvas();
  rgbWrap.appendChild(c2);
  cv.imshow(c2, rgb);

  src.delete(); rgb.delete();

  // Update upload zone label
  const zone = document.getElementById('sec0UploadZone');
  if (zone) zone.querySelector('h3').textContent = globalFile ? globalFile.name : 'Image loaded';
}

// ── MODULE 02 — Properties ────────────────────────────────────
function applyToSec1() {
  const m = globalMat;
  showCanvas('propsImgWrap', m);

  const rows = m.rows, cols = m.cols, ch = m.channels();
  const totalPx  = rows * cols;
  const totalRGB = totalPx * ch;

  set('statRows',     rows);
  set('statCols',     cols);
  set('statChannels', ch);
  set('statPixels',   totalPx.toLocaleString());
  set('statRGB',      totalRGB.toLocaleString());
  set('statType',     m.depth() === 0 ? 'uint8' : 'float32');
  set('statSize',     globalFile ? `${(globalFile.size / 1024).toFixed(1)} KB` : '—');
  set('statRes',      `${cols} × ${rows}`);

  document.getElementById('propsStats').style.display = 'grid';
  document.getElementById('pixelSampleWrap').style.display = 'block';
  buildPixelTable(m);
}

function buildPixelTable(mat) {
  const table = document.getElementById('pixelTable');
  table.innerHTML = '';
  const hdr = table.insertRow();
  ['', 'Col 0','Col 1','Col 2','Col 3','Col 4'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; hdr.appendChild(th);
  });
  for (let r = 0; r < Math.min(5, mat.rows); r++) {
    const row = table.insertRow();
    const th = document.createElement('th'); th.textContent = `Row ${r}`; row.appendChild(th);
    for (let c = 0; c < Math.min(5, mat.cols); c++) {
      const td = row.insertCell();
      const px = mat.ucharPtr(r, c);
      td.classList.add('pixel-cell');

      const value = document.createElement('span');
      value.className = 'pixel-cell-value';
      const swatch = document.createElement('span');
      swatch.className = 'pixel-cell-swatch';

      if (mat.channels() >= 3) {
        value.textContent = `[${px[0]}, ${px[1]}, ${px[2]}]`;
        swatch.style.backgroundColor = `rgb(${px[2]},${px[1]},${px[0]})`;
      } else {
        value.textContent = px[0];
        swatch.style.backgroundColor = `rgb(${px[0]},${px[0]},${px[0]})`;
      }
      td.appendChild(value);
      td.appendChild(swatch);
    }
  }
}

// ── MODULE 03 — Color & Intensity ────────────────────────────
function applyToSec2() {
  showCanvas('colorOrigWrap', globalMat);
  document.getElementById('channelPanels').style.display = 'none';
  document.getElementById('intensityStats').style.display = 'none';
  setPlaceholder('colorResultWrap', 'Apply an operation');
}

function applyGrayscale() {
  if (!globalMat) { noImgAlert(); return; }
  const gray = new cv.Mat();
  cv.cvtColor(globalMat, gray, cv.COLOR_RGBA2GRAY);
  showCanvas('colorResultWrap', gray);
  showIntensityStats(gray.data, gray.rows * gray.cols, false);
  document.getElementById('channelPanels').style.display = 'none';
  gray.delete();
}

function splitChannels() {
  if (!globalMat) { noImgAlert(); return; }
  const rgba = new cv.Mat();
  cv.cvtColor(globalMat, rgba, cv.COLOR_RGBA2BGRA);
  const chs = new cv.MatVector();
  cv.split(rgba, chs);
  const B = chs.get(0), G = chs.get(1), R = chs.get(2);

  cv.imshow(document.getElementById('chanB'), B);
  cv.imshow(document.getElementById('chanG'), G);
  cv.imshow(document.getElementById('chanR'), R);
  document.getElementById('channelPanels').style.display = 'grid';
  showCanvas('colorResultWrap', R);
  showIntensityStats(G.data, G.rows * G.cols, false);

  B.delete(); G.delete(); R.delete(); rgba.delete(); chs.delete();
}

function rgbIntensity() {
  if (!globalMat) { noImgAlert(); return; }
  const total = globalMat.rows * globalMat.cols;
  let rS = 0, gS = 0, bS = 0;
  for (let i = 0; i < total; i++) {
    const px = globalMat.ucharPtr(Math.floor(i / globalMat.cols), i % globalMat.cols);
    rS += px[0]; gS += px[1]; bS += px[2];
  }
  const rM = (rS/total).toFixed(2), gM = (gS/total).toFixed(2), bM = (bS/total).toFixed(2);
  const labels = ['MEAN RED','MEAN GREEN','MEAN BLUE','AVG COMBINED'];
  const vals   = [rM, gM, bM, ((parseFloat(rM)+parseFloat(gM)+parseFloat(bM))/3).toFixed(2)];
  const ids    = ['iMean','iMin','iMax','iStd'];
  labels.forEach((l,i) => {
    document.getElementById('intensityStats').children[i].querySelector('.stat-label').textContent = l;
  });
  ids.forEach((id, i) => set(id, vals[i]));
  document.getElementById('intensityStats').style.display = 'grid';
  document.getElementById('channelPanels').style.display = 'none';
}

function showIntensityStats(data, total, useLabels) {
  const s = computeStats(data, total);
  set('iMean', s.mean); set('iMin', s.min); set('iMax', s.max); set('iStd', s.std);
  if (!useLabels) {
    ['MEAN INTENSITY','MIN INTENSITY','MAX INTENSITY','STD DEVIATION'].forEach((l,i) => {
      document.getElementById('intensityStats').children[i].querySelector('.stat-label').textContent = l;
    });
  }
  document.getElementById('intensityStats').style.display = 'grid';
}

// ── MODULE 04 — Histograms ────────────────────────────────────
function applyToSec3() {
  showCanvas('histImgWrap', globalMat);
  drawHistogram();
}

function drawHistogram() {
  if (!globalMat) return;
  const bins = parseInt(document.getElementById('histBins').value);
  const gray = new cv.Mat();
  cv.cvtColor(globalMat, gray, cv.COLOR_RGBA2GRAY);
  showCanvas('histGrayWrap', gray);

  const grayHist = computeHistogram(gray, bins);
  const labels   = Array.from({length: bins}, (_, i) => Math.floor(i * 256 / bins));

  // Grayscale chart
  if (histGrayChart) histGrayChart.destroy();
  histGrayChart = new Chart(
    document.getElementById('histGrayChart').getContext('2d'),
    barChartConfig(labels, grayHist, 'Grayscale', '#00d4f0')
  );

  // RGB chart
  const total   = globalMat.rows * globalMat.cols;
  const binSize = Math.ceil(256 / bins);
  const rH = new Array(bins).fill(0), gH = new Array(bins).fill(0), bH = new Array(bins).fill(0);
  for (let i = 0; i < total; i++) {
    const c = i % globalMat.cols, r = Math.floor(i / globalMat.cols);
    const px = globalMat.ucharPtr(r, c);
    rH[Math.min(Math.floor(px[0]/binSize), bins-1)]++;
    gH[Math.min(Math.floor(px[1]/binSize), bins-1)]++;
    bH[Math.min(Math.floor(px[2]/binSize), bins-1)]++;
  }
  if (histColorChart) histColorChart.destroy();
  histColorChart = new Chart(
    document.getElementById('histColorChart').getContext('2d'),
    lineChartConfig(labels, rH, gH, bH)
  );

  gray.delete();
}

function handleHistUpload2(event) {
  if (!checkCV()) return;
  const file = event.target.files[0]; if (!file) return;
  loadImageFromFile(file, img => {
    if (histMat2) histMat2.delete();
    histMat2 = cv.imread(img);
    showCanvas('hist2Wrap', histMat2);
    compareHistograms();
  });
}

function compareHistograms() {
  if (!globalMat || !histMat2) return;
  const bins = 64;
  const g1 = new cv.Mat(), g2 = new cv.Mat();
  cv.cvtColor(globalMat, g1, cv.COLOR_RGBA2GRAY);
  cv.cvtColor(histMat2,  g2, cv.COLOR_RGBA2GRAY);

  const h1 = computeHistogram(g1, bins), h2 = computeHistogram(g2, bins);
  const s1 = h1.reduce((a,b)=>a+b,0), s2 = h2.reduce((a,b)=>a+b,0);
  const n1 = h1.map(v=>v/s1), n2 = h2.map(v=>v/s2);
  const m1 = n1.reduce((a,b)=>a+b,0)/bins, m2 = n2.reduce((a,b)=>a+b,0)/bins;

  let num=0, d1=0, d2=0, chi=0, inter=0;
  for (let i=0; i<bins; i++) {
    num  += (n1[i]-m1)*(n2[i]-m2);
    d1   += (n1[i]-m1)**2;
    d2   += (n2[i]-m2)**2;
    if (n1[i]>0) chi += ((n1[i]-n2[i])**2)/n1[i];
    inter += Math.min(n1[i], n2[i]);
  }
  const corr = (num / Math.sqrt(d1*d2)).toFixed(4);

  document.getElementById('histCompareResult').innerHTML = `
    <div style="width:100%">
      <div style="font-family:var(--sans);font-weight:600;color:var(--text-bright);margin-bottom:12px;font-size:13px;">Comparison Results</div>
      <div class="stats-grid" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="stat-card">
          <div class="stat-label">Correlation</div>
          <div class="stat-value ${parseFloat(corr)>0.8?'green':'orange'}">${corr}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Chi-Square</div>
          <div class="stat-value">${chi.toFixed(4)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Intersection</div>
          <div class="stat-value green">${inter.toFixed(4)}</div>
        </div>
      </div>
    </div>`;
  g1.delete(); g2.delete();
}

// ── MODULE 05 — Transformations ──────────────────────────────
function applyToSec4() {
  showCanvas('transOrigWrap', globalMat);
  setPlaceholder('transResultWrap', 'Apply a transformation');
  document.getElementById('brightnessSlider').value = 0;
  document.getElementById('contrastSlider').value   = 100;
  document.getElementById('alphaSlider').value      = 100;
  document.getElementById('betaSlider').value       = 0;
  set('brightnessVal', '0'); set('contrastVal', '1.00x');
  set('alphaVal', '1.00');   set('betaVal', '0');
}

function applyNegative() {
  if (!globalMat) { noImgAlert(); return; }
  const r = new cv.Mat();
  cv.bitwise_not(globalMat, r);
  showCanvas('transResultWrap', r);
  r.delete();
}
function resetTrans() {
  if (!globalMat) return;
  showCanvas('transResultWrap', globalMat);
}
function updateBrightness() {
  const v = parseInt(document.getElementById('brightnessSlider').value);
  set('brightnessVal', v);
  if (!globalMat) return;
  const r = new cv.Mat();
  globalMat.convertTo(r, -1, 1, v);
  showCanvas('transResultWrap', r);
  r.delete();
}
function updateContrast() {
  const v = parseInt(document.getElementById('contrastSlider').value) / 100;
  set('contrastVal', v.toFixed(2) + 'x');
  if (!globalMat) return;
  const r = new cv.Mat();
  globalMat.convertTo(r, -1, v, 0);
  showCanvas('transResultWrap', r);
  r.delete();
}
function applyAlphaBeta() {
  const a = parseInt(document.getElementById('alphaSlider').value) / 100;
  const b = parseInt(document.getElementById('betaSlider').value);
  set('alphaVal', a.toFixed(2)); set('betaVal', b);
  if (!globalMat) return;
  const r = new cv.Mat();
  globalMat.convertTo(r, -1, a, b);
  showCanvas('transResultWrap', r);
  r.delete();
}

// ── MODULE 06 — Thresholding ──────────────────────────────────
function applyToSec5() {
  showCanvas('threshOrigWrap', globalMat);
  applyThreshold();
}

function applyThreshold() {
  if (!globalMat) return;
  const val  = parseInt(document.getElementById('threshSlider').value);
  const type = parseInt(document.getElementById('threshType').value);
  set('threshVal', val);

  const gray   = new cv.Mat();
  const result = new cv.Mat();
  cv.cvtColor(globalMat, gray, cv.COLOR_RGBA2GRAY);
  cv.threshold(gray, result, val, 255, type);
  showCanvas('threshResultWrap', result);
  drawThreshHistogram(gray, result);

  gray.delete(); result.delete();
}

function drawThreshHistogram(gray, threshed) {
  const bins  = 64;
  const gH    = computeHistogram(gray, bins);
  const tH    = computeHistogram(threshed, bins);
  const labels = Array.from({length: bins}, (_, i) => Math.floor(i * 4));

  if (threshHistChart) threshHistChart.destroy();
  threshHistChart = new Chart(
    document.getElementById('threshHistChart').getContext('2d'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Original',     data: gH, backgroundColor: 'rgba(0,212,240,0.25)', borderColor: 'rgba(0,212,240,0.7)', borderWidth: 1, barPercentage: 1, categoryPercentage: 1 },
          { label: 'Thresholded',  data: tH, backgroundColor: 'rgba(240,96,48,0.25)', borderColor: 'rgba(240,96,48,0.7)', borderWidth: 1, barPercentage: 1, categoryPercentage: 1 }
        ]
      },
      options: chartOptions()
    }
  );
}

function updateMatrixThresh() {
  const v = parseInt(document.getElementById('matThreshSlider').value);
  set('matThreshVal', v);
  buildMatrixDemo(v);
}

function buildMatrixDemo(threshold) {
  ['matInput','matOutput'].forEach(id => document.getElementById(id).innerHTML = '');
  for (let r = 0; r < 5; r++) {
    const inRow  = document.getElementById('matInput').insertRow();
    const outRow = document.getElementById('matOutput').insertRow();
    for (let c = 0; c < 5; c++) {
      const v    = SAMPLE_MATRIX[r][c];
      const outV = v > threshold ? 255 : 0;
      const inTd = inRow.insertCell();
      inTd.textContent = v;
      inTd.style.color = `rgb(${v},${v},${v})`;
      const outTd = outRow.insertCell();
      outTd.textContent = outV;
      outTd.style.color   = outV === 255 ? 'var(--green)' : 'var(--text-dim)';
      outTd.style.fontWeight = outV === 255 ? '600' : '400';
    }
  }
}

// ── MODULE 07 — Geometric ─────────────────────────────────────
function applyToSec6() {
  showCanvas('geoOrigWrap', globalMat);
  setPlaceholder('geoResultWrap', 'Apply an operation');
}

function applyFlip(code) {
  if (!globalMat) { noImgAlert(); return; }
  const r = new cv.Mat();
  cv.flip(globalMat, r, code);
  showCanvas('geoResultWrap', r);
  r.delete();
}
function applyRotate90(code) {
  if (!globalMat) { noImgAlert(); return; }
  const r = new cv.Mat();
  cv.rotate(globalMat, r, code);
  showCanvas('geoResultWrap', r);
  r.delete();
}
function applyRotateCustom() {
  const angle = parseInt(document.getElementById('rotSlider').value);
  set('rotVal', angle + '\u00b0');
  if (!globalMat) return;
  const cx = globalMat.cols / 2, cy = globalMat.rows / 2;
  const M  = cv.getRotationMatrix2D(new cv.Point(cx, cy), angle, 1.0);
  const r  = new cv.Mat();
  cv.warpAffine(globalMat, r, M, new cv.Size(globalMat.cols, globalMat.rows),
    cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
  showCanvas('geoResultWrap', r);
  M.delete(); r.delete();
}
function applyTranslation() {
  const tx = parseInt(document.getElementById('txSlider').value);
  const ty = parseInt(document.getElementById('tySlider').value);
  set('txVal', tx + 'px'); set('tyVal', ty + 'px');
  if (!globalMat) return;
  const M = cv.matFromArray(2, 3, cv.CV_64F, [1, 0, tx, 0, 1, ty]);
  const r = new cv.Mat();
  cv.warpAffine(globalMat, r, M, new cv.Size(globalMat.cols, globalMat.rows),
    cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
  showCanvas('geoResultWrap', r);
  M.delete(); r.delete();
}
function applyScaling() {
  const sx = parseInt(document.getElementById('scaleXSlider').value) / 100;
  const sy = parseInt(document.getElementById('scaleYSlider').value) / 100;
  const method = parseInt(document.getElementById('scaleMethod').value);
  set('scaleXVal', sx.toFixed(2) + 'x'); set('scaleYVal', sy.toFixed(2) + 'x');
  if (!globalMat) return;
  const nW = Math.max(1, Math.round(globalMat.cols * sx));
  const nH = Math.max(1, Math.round(globalMat.rows * sy));
  const r  = new cv.Mat();
  cv.resize(globalMat, r, new cv.Size(nW, nH), 0, 0, method);
  showCanvas('geoResultWrap', r);
  r.delete();
}

// ── MODULE 08 — Interpolation ─────────────────────────────────
function applyToSec7() {
  showCanvas('interpOrigWrap', globalMat);
  applyInterpolation();
}

function applyInterpolation() {
  if (!globalMat) return;
  const scale = parseInt(document.getElementById('interpScale').value) / 100;
  set('interpScaleVal', scale.toFixed(2) + 'x');
  const nW = Math.max(1, Math.round(globalMat.cols * scale));
  const nH = Math.max(1, Math.round(globalMat.rows * scale));
  const dsize = new cv.Size(nW, nH);

  const nn    = new cv.Mat();
  const cubic = new cv.Mat();
  cv.resize(globalMat, nn,    dsize, 0, 0, cv.INTER_NEAREST);
  cv.resize(globalMat, cubic, dsize, 0, 0, cv.INTER_CUBIC);
  showCanvas('interpNNWrap',    nn);
  showCanvas('interpCubicWrap', cubic);
  nn.delete(); cubic.delete();
}

// ── MODULE 09 — Face Detection ────────────────────────────────
function applyToSec8() {
  showCanvas('faceOrigWrap', globalMat);
  setPlaceholder('faceResultWrap', 'Click Detect Faces to run detection');
  document.getElementById('faceInfo').style.display    = 'none';
  document.getElementById('croppedFaces').style.display = 'none';
}

async function detectFaces() {
  if (!globalMat) { noImgAlert(); return; }
  if (!checkCV()) return;
  const btn = document.getElementById('detectBtn');
  btn.textContent = 'Loading classifier...';
  btn.disabled = true;

  try {
    if (!faceCascade) {
      const res    = await fetch('https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml');
      const buffer = await res.arrayBuffer();
      cv.FS_createDataFile('/', 'haarcascade_frontalface_default.xml', new Uint8Array(buffer), true, false, false);
      faceCascade = new cv.CascadeClassifier();
      faceCascade.load('haarcascade_frontalface_default.xml');
    }
    btn.textContent = 'Detecting...';

    const gray   = new cv.Mat();
    cv.cvtColor(globalMat, gray, cv.COLOR_RGBA2GRAY);
    cv.equalizeHist(gray, gray);

    const faces  = new cv.RectVector();
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, new cv.Size(30, 30), new cv.Size());

    const result = globalMat.clone();
    const grid   = document.getElementById('croppedGrid');
    grid.innerHTML = '';

    for (let i = 0; i < faces.size(); i++) {
      const f = faces.get(i);
      cv.rectangle(result, new cv.Point(f.x, f.y),
        new cv.Point(f.x + f.width, f.y + f.height), [0, 232, 150, 255], 2);

      const roi        = globalMat.roi(f);
      const cropCanvas = document.createElement('canvas');
      cv.imshow(cropCanvas, roi);
      const card = document.createElement('div');
      card.className = 'face-card';
      const label = document.createElement('div');
      label.className = 'face-card-label';
      label.textContent = `Face ${i+1}\n${f.width}×${f.height}px`;
      card.appendChild(cropCanvas);
      card.appendChild(label);
      grid.appendChild(card);
      roi.delete();
    }

    showCanvas('faceResultWrap', result);
    document.getElementById('faceInfo').style.display = 'block';
    document.getElementById('faceStats').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Faces Detected</div>
          <div class="stat-value ${faces.size()>0?'green':'orange'}">${faces.size()}</div></div>
        <div class="stat-card"><div class="stat-label">Image Size</div>
          <div class="stat-value">${globalMat.cols}×${globalMat.rows}</div></div>
        <div class="stat-card"><div class="stat-label">Scale Factor</div>
          <div class="stat-value">1.1</div></div>
        <div class="stat-card"><div class="stat-label">Min Neighbors</div>
          <div class="stat-value">3</div></div>
      </div>
      ${faces.size()===0 ? '<div class="info-box" style="margin-top:12px;"><strong>No faces detected.</strong> Try a clearer front-facing photo with good lighting.</div>' : ''}`;

    if (faces.size() > 0) document.getElementById('croppedFaces').style.display = 'block';
    gray.delete(); faces.delete(); result.delete();

  } catch (err) {
    alert('Face detection error: ' + err.message +
      '\n\nNote: Requires internet access to download the Haar Cascade XML file.');
    console.error(err);
  } finally {
    btn.textContent = 'Detect Faces';
    btn.disabled = false;
  }
}

// ── NAVIGATION ────────────────────────────────────────────────
const SECTION_NAMES = [
  'Image Reading', 'Properties', 'Color & Intensity', 'Histograms',
  'Transformations', 'Thresholding', 'Geometric', 'Interpolation', 'Face Detection'
];

function showSection(idx) {
  document.querySelectorAll('.section').forEach((s, i) => s.classList.toggle('active', i === idx));
  document.querySelectorAll('.nav-item').forEach((n, i) => n.classList.toggle('active', i === idx));
  document.querySelectorAll('.mobile-nav-item').forEach((n, i) => n.classList.toggle('active', i === idx));
}

function buildMobileNav() {
  const nav = document.getElementById('mobileNav');
  SECTION_NAMES.forEach((name, i) => {
    const el = document.createElement('div');
    el.className = 'mobile-nav-item' + (i === 0 ? ' active' : '');
    el.textContent = String(i+1).padStart(2,'0') + ' ' + name;
    el.onclick = () => showSection(i);
    nav.appendChild(el);
  });
}

// ── DRAG & DROP (section 01 upload zone) ─────────────────────
function initDragDrop() {
  const zone = document.getElementById('sec0UploadZone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/'))
      triggerGlobalLoad(file);
  });
}

function triggerGlobalLoad(file) {
  const input = document.getElementById('globalUploadInput');
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  handleGlobalUpload({ target: { files: [file] } });
}

// ── HELPERS ───────────────────────────────────────────────────
function checkCV() {
  if (!cvReady) { alert('OpenCV.js is still loading. Please wait a moment.'); return false; }
  return true;
}
function noImgAlert() {
  alert('Please upload an image first using the Upload button in the header.');
}
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function makeCanvas() {
  const c = document.createElement('canvas');
  c.style.maxWidth = '100%';
  return c;
}
function showCanvas(wrapId, mat) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  wrap.innerHTML = '';
  const c = makeCanvas();
  wrap.appendChild(c);
  cv.imshow(c, mat);
}
function setPlaceholder(wrapId, text) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  wrap.innerHTML = `<div class="canvas-placeholder">
    <svg class="ph-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>${text}
  </div>`;
}
function loadImageFromFile(file, callback) {
  const img = new Image();
  img.onload = () => callback(img);
  img.src = URL.createObjectURL(file);
}
function computeStats(data, total) {
  let sum = 0, min = 255, max = 0;
  for (let i = 0; i < total; i++) {
    sum += data[i];
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const mean = sum / total;
  let variance = 0;
  for (let i = 0; i < total; i++) variance += (data[i] - mean) ** 2;
  return { mean: mean.toFixed(2), min, max, std: Math.sqrt(variance / total).toFixed(2) };
}
function computeHistogram(mat, bins) {
  const binSize = Math.ceil(256 / bins);
  const hist    = new Array(bins).fill(0);
  const total   = mat.rows * mat.cols;
  for (let i = 0; i < total; i++)
    hist[Math.min(Math.floor(mat.data[i] / binSize), bins-1)]++;
  return hist;
}

// ── CHART CONFIGS ─────────────────────────────────────────────
function chartOptions(extra) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { labels: { color: '#7898a8', font: { family: 'IBM Plex Mono', size: 10 } } }
    },
    scales: {
      x: { ticks: { color: '#506070', maxTicksLimit: 10, font: { size: 10 } }, grid: { color: '#1a2535' } },
      y: { ticks: { color: '#506070', font: { size: 10 } }, grid: { color: '#1a2535' } }
    },
    ...extra
  };
}
function barChartConfig(labels, data, label, color) {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label, data,
        backgroundColor: color + '40', borderColor: color + 'b0',
        borderWidth: 1, barPercentage: 1, categoryPercentage: 1 }]
    },
    options: { ...chartOptions(), plugins: { legend: { display: false } } }
  };
}
function lineChartConfig(labels, rH, gH, bH) {
  const mk = (label, data, color) => ({
    label, data,
    borderColor: color, backgroundColor: color + '18',
    borderWidth: 1.5, pointRadius: 0, fill: true, tension: 0.3
  });
  return {
    type: 'line',
    data: { labels, datasets: [mk('R', rH, '#f04050'), mk('G', gH, '#00e896'), mk('B', bH, '#00d4f0')] },
    options: chartOptions()
  };
}
