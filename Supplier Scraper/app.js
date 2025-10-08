/* State */
const state = {
  rows: [], // [{sku, url, htmlText, parsed}]
  suppliersConfig: null, // { suppliers: { name: { selectors } } }
  results: [],
  activeSupplier: 'Scooter Center',
  proxyTemplate: '',
};

/* Elements */
const el = {
  fileCsv: document.getElementById('file-csv'),
  csvStatus: document.getElementById('csv-status'),
  rowsTbody: document.getElementById('rows-tbody'),
  parseBtn: document.getElementById('btn-parse'),
  downloadBtn: document.getElementById('btn-download'),
  resultsTbody: document.getElementById('results-tbody'),
  supplierSelect: document.getElementById('supplier-select'),
  proxyTemplate: document.getElementById('proxy-template'),
  btnTemplate: document.getElementById('btn-download-template'),
  parseStatus: document.getElementById('parse-status'),
  btnNew: document.getElementById('btn-new'),
  btnSave: document.getElementById('btn-save'),
  btnLoad: document.getElementById('btn-load'),
  fileLoadSession: document.getElementById('file-load-session'),
};

/* Utilities */
function downloadBlob(filename, content, type = 'text/plain'){
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 0);
}

function csvEscape(value){
  if (value == null) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
  return s;
}

function toCsv(rows){
  const header = ['SKU','Supplier','URL','Title','Product Code','Price','Description','Stock Level'];
  const lines = [header.join(',')];
  for (const r of rows){
    lines.push([
      csvEscape(r.sku),
      csvEscape(r.supplier),
      csvEscape(r.url),
      csvEscape(r.title),
      csvEscape(r.productCode),
      csvEscape(r.price),
      csvEscape(r.description),
      csvEscape(r.stockLevel),
    ].join(','));
  }
  return lines.join('\n');
}

function ensureDefaultSuppliers(){
  if (!state.suppliersConfig) state.suppliersConfig = getDefaultSuppliers();
  if (el.supplierSelect){
    el.supplierSelect.innerHTML = '';
    const names = Object.keys(state.suppliersConfig.suppliers);
    for (const name of names){
      const opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      if (name === state.activeSupplier) opt.selected = true;
      el.supplierSelect.appendChild(opt);
    }
  }
}

function getDefaultSuppliers(){
  return {
    suppliers: {
      'Scooter Center': {
        description: 'Scooter Center storefront',
        selectors: {
          title: '.p-name h1 a',
          productCode: '.model-name',
          price: '.product-price span',
          description: '.product-description, .desc',
          stockLevel: '.detail-versand',
        }
      }
    }
  };
}

/* Rendering */
function renderRows(){
  if (!el.rowsTbody) return;
  el.rowsTbody.innerHTML = '';
  state.rows.forEach((row, idx)=>{
    const tr = document.createElement('tr');
    const status = row.status ? row.status : '';
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${row.sku || ''}</td>
      <td><a href="${row.url || '#'}" target="_blank" rel="noreferrer">${row.url || ''}</a></td>
      <td>${status}</td>
    `;
    el.rowsTbody.appendChild(tr);
  });
}

function renderResults(){
  el.resultsTbody.innerHTML = '';
  for (const r of state.results){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.sku || ''}</td>
      <td>${r.supplier || ''}</td>
      <td><a href="${r.url || '#'}" target="_blank" rel="noreferrer">${r.url || ''}</a></td>
      <td>${r.title || ''}</td>
      <td>${r.productCode || ''}</td>
      <td>${r.price || ''}</td>
      <td>${r.description || ''}</td>
      <td>${r.stockLevel || ''}</td>
    `;
    el.resultsTbody.appendChild(tr);
  }
}

/* Helpers */
function setRowStatus(index, text, ok){
  state.rows[index].status = text ? (ok ? `<span class="badge ok">${text}</span>` : `<span class=\"badge\">${text}</span>`) : '';
  renderRows();
}

function handleCsvFile(file){
  el.csvStatus.textContent = 'Parsing CSV...';
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (res)=>{
      const required = ['SKU','URL'];
      const fields = res.meta && res.meta.fields ? res.meta.fields : [];
      const missing = required.filter(r=>!fields.includes(r));
      if (missing.length){
        el.csvStatus.textContent = 'Missing columns: ' + missing.join(', ');
        state.rows = [];
        renderRows();
        return;
      }
      state.rows = res.data.map(row=>({
        sku: (row['SKU']||'').trim(),
        url: (row['URL']||'').trim(),
        htmlText: '',
        status: '',
      }));
      el.csvStatus.textContent = `Loaded ${state.rows.length} row(s).`;
      renderRows();
    },
    error: (err)=>{
      el.csvStatus.textContent = 'CSV error: ' + (err && err.message ? err.message : String(err));
    }
  });
}

function parseHtmlForRow(row){
  const supplierName = state.activeSupplier || row.supplier;
  const cfg = state.suppliersConfig && state.suppliersConfig.suppliers[supplierName];
  const selectors = cfg ? cfg.selectors : null;
  if (!row.htmlText){
    return { sku: row.sku, supplier: supplierName, url: row.url, title: '', productCode: '', price: '', description: '', stockLevel: '' };
  }
  try{
    const parser = new DOMParser();
    const doc = parser.parseFromString(row.htmlText, 'text/html');
    function pick(sel){
      if (!selectors || !selectors[sel]) return '';
      const el = doc.querySelector(selectors[sel]);
      return el ? el.textContent.trim() : '';
    }
    // Generic supplier parsing
    return {
      sku: row.sku,
      supplier: supplierName,
      url: row.url,
      title: pick('title'),
      productCode: pick('productCode'),
      price: pick('price'),
      description: pick('description'),
      stockLevel: pick('stockLevel'),
    };
  }catch(err){
    console.error('Parse error', err);
    return { sku: row.sku, supplier: supplierName, url: row.url, title: '', productCode: '', price: '', description: '', stockLevel: '' };
  }
}

async function fetchAndParseRow(index){
  const row = state.rows[index];
  const supplierName = state.activeSupplier;
  try{
    setRowStatus(index, 'Fetching...', false);
    const targetUrl = (function(){
      const t = state.proxyTemplate && state.proxyTemplate.trim();
      if (!t) return row.url;
      if (t.includes('{url}')) return t.replace('{url}', encodeURIComponent(row.url));
      const sep = t.includes('?') ? '&' : '?';
      return t + sep + 'url=' + encodeURIComponent(row.url);
    })();
    const res = await fetch(targetUrl, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();
    row.htmlText = html;
    setRowStatus(index, 'Parsing...', false);
    const parsed = parseHtmlForRow(row);
    // merge/replace in results by SKU+URL key
    const key = row.sku + '|' + row.url;
    const idx = state.results.findIndex(r=> (r.sku + '|' + r.url) === key);
    if (idx >= 0) state.results[idx] = parsed; else state.results.push(parsed);
    setRowStatus(index, 'Done', true);
    renderResults();
  }catch(err){
    console.error('Fetch/parse failed', err);
    setRowStatus(index, 'Error: ' + (err && err.message ? err.message : 'Failed'), false);
    // Still add a placeholder result so totals reflect attempts
    const placeholder = {
      sku: row.sku,
      supplier: state.activeSupplier,
      url: row.url,
      title: '',
      productCode: '',
      price: '',
      description: '',
      stockLevel: ''
    };
    const key = row.sku + '|' + row.url;
    const idx = state.results.findIndex(r=> (r.sku + '|' + r.url) === key);
    if (idx >= 0) state.results[idx] = placeholder; else state.results.push(placeholder);
    renderResults();
  }
}

async function parseAll(){
  ensureDefaultSuppliers();
  el.parseStatus.textContent = 'Parsing...';
  state.results = [];
  await Promise.all(state.rows.map((_, i)=> fetchAndParseRow(i)));
  el.parseStatus.textContent = `Parsed ${state.results.length}/${state.rows.length} row(s).`;
  el.downloadBtn.disabled = state.results.length === 0;
}

/* Session save/load */
function newSession(){
  state.rows = [];
  state.results = [];
  state.suppliersConfig = null;
  state.activeSupplier = 'Scooter Center';
  el.csvStatus.textContent = '';
  el.parseStatus.textContent = '';
  renderRows();
  renderResults();
  ensureDefaultSuppliers();
}

function saveSession(){
  const data = JSON.stringify(state, null, 2);
  downloadBlob('session.json', data, 'application/json');
}

function loadSessionFromFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const loaded = JSON.parse(String(reader.result||'{}'));
      state.rows = loaded.rows || [];
      state.results = loaded.results || [];
      state.suppliersConfig = loaded.suppliersConfig || null;
      state.activeSupplier = loaded.activeSupplier || state.activeSupplier || 'Scooter Center';
      renderRows();
      renderResults();
      ensureDefaultSuppliers();
    }catch(err){
      alert('Failed to load session: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/* Init */
function init(){
  ensureDefaultSuppliers();
  renderRows();
  renderResults();

  el.fileCsv.addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0];
    if (file) handleCsvFile(file);
  });
  el.parseBtn.addEventListener('click', parseAll);
  el.downloadBtn.addEventListener('click', ()=>{
    const csv = toCsv(state.results);
    downloadBlob('products.csv', csv, 'text/csv');
  });
  if (el.supplierSelect){
    el.supplierSelect.addEventListener('change', ()=>{
      state.activeSupplier = el.supplierSelect.value;
    });
  }
  if (el.proxyTemplate){
    el.proxyTemplate.addEventListener('input', ()=>{
      state.proxyTemplate = el.proxyTemplate.value;
    });
  }
  el.btnTemplate.addEventListener('click', ()=>{
    const csv = 'SKU,URL\nABC-123,https://example.com/product-1';
    downloadBlob('suppliers.template.csv', csv, 'text/csv');
  });
  el.btnNew.addEventListener('click', newSession);
  el.btnSave.addEventListener('click', saveSession);
  el.btnLoad.addEventListener('click', ()=> el.fileLoadSession.click());
  el.fileLoadSession.addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0];
    if (file) loadSessionFromFile(file);
  });
}

document.addEventListener('DOMContentLoaded', init);


