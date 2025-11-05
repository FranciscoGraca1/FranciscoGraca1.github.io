/*CONFIG DA API*/
const API_BASE = 'https://deisishop.pythonanywhere.com';
const PATH = {
  produtos: '/products',
  categorias: '/products/categories',
  buy: '/buy/'
};

/* ESTADO DA APP  */
let todosOsProdutos = [];               // cache dos produtos
let cesto = [];                         // itens no cesto (também em localStorage)
const estadoUI = {                      // filtro/ordenação/pesquisa
  categoriaKey: '',
  ordenacao: '',                        // '', 'preco-asc', 'preco-desc'
  pesquisa: ''
};

/* HELPERS */
const $ = (id) => document.getElementById(id);
const norm = (s) => (s ?? '').toString().trim().toLowerCase();
const catKey = (s) => norm(s);
function setEstado(msg) { const el = $('estado'); if (el) el.textContent = msg || ''; }

/* Normaliza o produto no formato usado pela UI (inclui rating). */
function normalizarProduto(p) {
  const category = p.category ?? p.categoria ?? (Array.isArray(p.categories) ? p.categories[0] : '') ?? '';
  return {
    id: p.id ?? p._id ?? p.sku ?? String(Math.random()).slice(2),
    title: p.title ?? p.name ?? 'Produto',
    price: Number(p.price ?? p.preco ?? p.unit_price ?? 0),
    description: p.description ?? p.descricao ?? '',
    image: p.image ?? p.thumbnail ?? p.imagem ?? '',
    category,
    categoryKey: catKey(category),

    // rating da API
    ratingRate: Number(p.rating?.rate ?? p.rate ?? 0),   // 0..5
    ratingCount: Number(p.rating?.count ?? p.count ?? 0) // nº de avaliações
  };
}

// CHAMADAS À API
async function getJSON(path) {
  const res = await fetch(API_BASE + path, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function postJSON(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || ('HTTP ' + res.status));
  return data;
}

// ARRANQUE
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const ano = $('ano');
  if (ano) { const y = String(new Date().getFullYear()); ano.textContent = y; ano.setAttribute('datetime', y); }

  carregarCestoGuardado();
  ligarEventosUI();
  ligarCheckout();

  setEstado('A carregar produtos e categorias...');
  try {
    const [produtos, categorias] = await Promise.all([
      getJSON(PATH.produtos),
      getJSON(PATH.categorias).catch(() => [])
    ]);

    const dataProdutos = Array.isArray(produtos) ? produtos : (produtos.items || produtos.data || []);
    todosOsProdutos = dataProdutos.map(normalizarProduto);

    const dataCatsOrig = Array.isArray(categorias) ? categorias : (categorias.items || categorias.data || []);
    const dataCats = dataCatsOrig.length ? dataCatsOrig
                                         : [...new Set(todosOsProdutos.map(p => p.category).filter(Boolean))];

    preencherSelectCategorias(dataCats);
    aplicarTudoEDesenhar();
    setEstado(`Foram carregados ${todosOsProdutos.length} produtos.`);
  } catch (e) {
    console.error(e);
    setEstado('Não foi possível carregar os produtos.');
  }

  mostrarCesto();
}

// FILTRO / ORDENAR / PESQUISAR
function preencherSelectCategorias(categorias) {
  const select = $('filtro-categoria');
  if (!select) return;

  const lista = (categorias || [])
    .map(c => typeof c === 'string' ? c : (c?.name ?? c?.title ?? c?.id ?? ''))
    .filter(Boolean);

  select.textContent = '';
  const optAll = document.createElement('option');
  optAll.value = ''; optAll.textContent = 'Todas as categorias';
  select.appendChild(optAll);

  [...new Set(lista)].sort((a,b)=>a.localeCompare(b)).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = catKey(cat);
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function ligarEventosUI() {
  $('filtro-categoria')?.addEventListener('change', (e) => {
    estadoUI.categoriaKey = e.target.value;
    aplicarTudoEDesenhar();
  });

  $('ordenacao')?.addEventListener('change', (e) => {
    estadoUI.ordenacao = e.target.value;    // '', 'preco-asc', 'preco-desc'
    aplicarTudoEDesenhar();
  });

  const inp = $('pesquisa');
  if (inp) {
    let t;
    inp.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { estadoUI.pesquisa = inp.value; aplicarTudoEDesenhar(); }, 250);
    });
  }
}

function aplicarTudoEDesenhar() {
  const root = $('lista-produtos');
  if (root) root.textContent = '';

  let lista = estadoUI.categoriaKey
    ? todosOsProdutos.filter(p => p.categoryKey === estadoUI.categoriaKey)
    : todosOsProdutos.slice();

  const q = norm(estadoUI.pesquisa);
  if (q) lista = lista.filter(p => norm(p.title).includes(q) || norm(p.description).includes(q));

  if (estadoUI.ordenacao === 'preco-asc')  lista.sort((a,b)=>a.price-b.price);
  if (estadoUI.ordenacao === 'preco-desc') lista.sort((a,b)=>b.price-a.price);

  carregarProdutos(lista);

  const partes = [];
  if (estadoUI.categoriaKey) partes.push('categoria selecionada');
  if (q) partes.push(`a pesquisar "${estadoUI.pesquisa}"`);
  if (estadoUI.ordenacao) partes.push(estadoUI.ordenacao.replace('-', ' '));
  setEstado(`A mostrar ${lista.length} produto(s)` + (partes.length ? ` (${partes.join(', ')})` : '.'));
}

/* =============== RENDER DE PRODUTOS =============== */
function carregarProdutos(lista) {
  const host = $('lista-produtos');
  if (!host) return;
  const frag = document.createDocumentFragment();
  lista.forEach(p => frag.appendChild(criarProduto(p)));
  host.appendChild(frag);
}

/* Estrelinhas de rating (0..5) + contagem */
function criarRating(rate = 0, count = 0) {
  const wrap = document.createElement('div');
  wrap.className = 'rating';

  const n = Math.max(0, Math.min(5, Number(rate) || 0));
  const cheias = Math.round(n);

  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('span');
    s.className = 'star' + (i <= cheias ? ' filled' : '');
    s.textContent = '★';
    wrap.appendChild(s);
  }
  if (count > 0) {
    const sm = document.createElement('small');
    sm.textContent = `(${count})`;
    wrap.appendChild(sm);
  }
  return wrap;
}

function criarProduto(produto) {
  const artigo = document.createElement('article');
  artigo.className = 'produto';

  const h3 = document.createElement('h3'); h3.textContent = produto.title;

  const ratingEl = criarRating(produto.ratingRate, produto.ratingCount); // ★★★★☆

  const img = document.createElement('img');
  img.src = produto.image || 'https://via.placeholder.com/300x200?text=Produto';
  img.alt = produto.title;

  const desc = document.createElement('p'); desc.textContent = produto.description || 'Sem descrição.';
  const preco = document.createElement('p'); preco.textContent = 'Preço: €' + Number(produto.price).toFixed(2);

  const btn = document.createElement('button');
  btn.textContent = '+ Adicionar ao Cesto';
  btn.addEventListener('click', () => adicionarAoCesto(produto));

  artigo.append(h3, ratingEl, img, desc, preco, btn);
  return artigo;
}

/*CESTO (localStorage)*/
function guardarCesto() {
  try { localStorage.setItem('meuCesto', JSON.stringify(cesto)); }
  catch(e){ console.warn('localStorage guardar falhou:', e); }
}
function carregarCestoGuardado() {
  try { cesto = JSON.parse(localStorage.getItem('meuCesto') || '[]'); }
  catch { cesto = []; }
}
function adicionarAoCesto(produto) {
  const existente = cesto.find(p => p.id === produto.id);
  if (existente) existente.quantidade += 1;
  else cesto.push({ id: produto.id, title: produto.title, price: produto.price, quantidade: 1 });
  guardarCesto(); mostrarCesto();
}
function removerDoCesto(id) {
  cesto = cesto.filter(i => i.id !== id);
  guardarCesto(); mostrarCesto();
}
function mostrarCesto() {
  const ul = $('lista-cesto');
  const out = $('total');
  if (!ul || !out) return;

  ul.textContent = '';
  let total = 0;
  const frag = document.createDocumentFragment();

  cesto.forEach(item => {
    const li = document.createElement('li');
    const sp = document.createElement('span');
    sp.textContent = `${item.title} — €${Number(item.price).toFixed(2)} × ${item.quantidade}`;
    const btn = document.createElement('button');
    btn.textContent = 'Remover';
    btn.addEventListener('click', () => removerDoCesto(item.id));
    li.append(sp, btn);
    frag.appendChild(li);
    total += Number(item.price) * Number(item.quantidade);
  });

  ul.appendChild(frag);
  out.textContent = '€' + total.toFixed(2);
}

/*CHECKOUT (POST /buy/)*/
function ligarCheckout() {
  const form = $('checkout-form');
  const btn  = $('btn-comprar');
  const box  = $('checkout-resultado');
  if (!form || !btn || !box) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!cesto.length) { box.innerHTML = `<p class="erro">O cesto está vazio.</p>`; return; }

    // ids repetidos consoante a quantidade
    const ids = [];
    cesto.forEach(i => { for (let k=0; k<Number(i.quantidade||0); k++) ids.push(i.id); });

    const payload = {
      products: ids,
      student: Boolean($('chk-estudante')?.checked),
      coupon:  $('inp-cupao')?.value.trim() || undefined,
      name:    $('inp-nome')?.value.trim()  || undefined
    };

    const old = btn.textContent; btn.disabled = true; btn.textContent = 'A processar...'; box.innerHTML = '';

    try {
      const data = await postJSON(PATH.buy, payload);
      if (data.error) throw new Error(data.error);

      box.innerHTML = `
        <div class="ok">
          <p><strong>Total final:</strong> € ${Number(data.totalCost).toFixed(2)}</p>
          <p><strong>Referência de pagamento:</strong> ${data.reference}</p>
          ${data.example ? `<p class="msg">${data.example}</p>` : ''}
        </div>
      `;

      // Se quiseres limpar o cesto após compra, descomenta:
      // cesto = []; guardarCesto(); mostrarCesto();

    } catch (e) {
      box.innerHTML = `<p class="erro">Falha no checkout: ${e.message}</p>`;
    } finally {
      btn.disabled = false; btn.textContent = old;
    }
  });
}
