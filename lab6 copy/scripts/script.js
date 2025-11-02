/* ===============================
   Config & utilitários
================================= */

// Base da API (DEISI Shop)
const API_BASE = 'https://deisishop.pythonanywhere.com';

// Endpoints CORRETOS
const ENDPOINTS = {
  produtos: ['/products'],
  categorias: ['/products/categories']
};

// Estado em memória (para filtrar sem novo fetch)
let todosOsProdutos = [];
let cesto = [];

// Mensagens na UI (loading/erro/sucesso)
function setEstado(msg) {
  const el = document.getElementById('estado');
  if (el) el.textContent = msg || '';
}

// Normalização de produto (tolerante a variações de esquema)
function normalizarProduto(p) {
  return {
    id: p.id ?? p._id ?? p.sku ?? String(Math.random()).slice(2),
    title: p.title ?? p.name ?? 'Produto',
    price: Number(p.price ?? p.preco ?? p.unit_price ?? 0),
    description: p.description ?? p.descricao ?? '',
    image: p.image ?? p.thumbnail ?? p.imagem ?? '',
    category: p.category ?? p.categoria ?? (Array.isArray(p.categories) ? p.categories[0] : '') ?? ''
  };
}

function obterCategoria(prod) {
  return (prod.category ?? '').toString();
}

/* ===============================
   AJAX: fetch com fallback simples
================================= */
function fetchComFallback(paths) {
  return new Promise((resolve, reject) => {
    let i = 0;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s

    const tenta = () => {
      if (i >= paths.length) {
        clearTimeout(timeout);
        return reject(new Error('Nenhum endpoint válido'));
      }
      const url = API_BASE + paths[i];
      console.log('GET', url);

      fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      })
        .then(res => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(json => resolve(json))
        .catch(err => {
          console.warn('Falhou', url, err);
          i += 1;
          tenta();
        });
    };

    tenta();
  });
}

/* ===============================
   Arranque
================================= */
document.addEventListener('DOMContentLoaded', function () {
  // (opcional) ano no rodapé
  const elAno = document.getElementById('ano');
  if (elAno) {
    const y = String(new Date().getFullYear());
    elAno.textContent = y;
    elAno.setAttribute('datetime', y);
  }

  // repõe cesto guardado
  carregarCestoGuardado();

  // carregar produtos + categorias (AJAX)
  inicializarProdutosECategorias();

  // desenha cesto (caso já houvesse itens)
  mostrarCesto();

  // ligar filtro (select será preenchido quando chegarem as categorias)
  ligarEventoFiltro();
});

/* ===============================
   Produtos + Categorias (AJAX)
================================= */
function inicializarProdutosECategorias() {
  setEstado('A carregar produtos e categorias...');

  // Produtos
  fetchComFallback(ENDPOINTS.produtos)
    .then(json => {
      let dados = json;
      if (!Array.isArray(dados)) {
        if (Array.isArray(dados.items)) dados = dados.items;
        else if (Array.isArray(dados.data)) dados = dados.data;
      }
      if (!Array.isArray(dados)) throw new Error('Formato inesperado de produtos');

      todosOsProdutos = dados.map(normalizarProduto);

      // desenhar todos inicialmente
      const listaProdutos = document.getElementById('lista-produtos');
      if (listaProdutos) listaProdutos.textContent = '';
      carregarProdutos(todosOsProdutos);
      setEstado(`Foram carregados ${todosOsProdutos.length} produtos.`);
    })
    .catch(err => {
      console.error('Erro a carregar produtos:', err);
      setEstado('Não foi possível carregar os produtos.');
    });

  // Categorias (paralelo)
  fetchComFallback(ENDPOINTS.categorias)
    .then(preencherSelectCategorias)
    .catch(err => {
      console.warn('Não foi possível carregar categorias (o filtro ficará vazio):', err);
    });
}

/* ===============================
   Filtro por categoria
================================= */
function preencherSelectCategorias(categorias) {
  const select = document.getElementById('filtro-categoria');
  if (!select) return;

  // A API /products/categories costuma devolver um array de strings
  let lista = categorias;
  if (!Array.isArray(lista)) {
    if (Array.isArray(categorias.items)) lista = categorias.items;
    else if (Array.isArray(categorias.data)) lista = categorias.data;
    else lista = [];
  }
  lista = lista
    .map(c => (typeof c === 'string' ? c : (c.name ?? c.title ?? c.id ?? '')))
    .filter(Boolean);

  // limpar e repor "todas"
  select.textContent = '';
  const optAll = document.createElement('option');
  optAll.value = '';
  optAll.textContent = 'Todas as categorias';
  select.appendChild(optAll);

  // preencher (únicas e ordenadas)
  [...new Set(lista)].sort((a, b) => a.localeCompare(b)).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function ligarEventoFiltro() {
  const select = document.getElementById('filtro-categoria');
  if (!select) return;

  select.addEventListener('change', function () {
    const cat = this.value;
    const listaProdutos = document.getElementById('lista-produtos');
    if (listaProdutos) listaProdutos.textContent = '';

    const filtrados = cat
      ? todosOsProdutos.filter(p => obterCategoria(p) === cat)
      : todosOsProdutos.slice();

    carregarProdutos(filtrados);
    setEstado(cat
      ? `A mostrar ${filtrados.length} produto(s) da categoria "${cat}".`
      : `A mostrar ${filtrados.length} produto(s).`);
  });
}

/* ===============================
   Renderização de produtos
================================= */
function carregarProdutos(lista) {
  const listaProdutos = document.getElementById('lista-produtos');
  if (!listaProdutos) return;

  lista.forEach(function (produto) {
    const artigo = criarProduto(produto);
    listaProdutos.appendChild(artigo);
  });
}

function criarProduto(produto) {
  const artigo = document.createElement('article');
  artigo.className = 'produto';

  const titulo = document.createElement('h3');
  titulo.textContent = produto.title;

  const imagem = document.createElement('img');
  imagem.src = produto.image || 'https://via.placeholder.com/300x200?text=Produto';
  imagem.alt = produto.title;

  const descricao = document.createElement('p');
  descricao.textContent = produto.description || 'Sem descrição.';

  const preco = document.createElement('p');
  preco.textContent = 'Preço: €' + Number(produto.price).toFixed(2);

  const botao = document.createElement('button');
  botao.textContent = '+ Adicionar ao Cesto';
  botao.addEventListener('click', function () {
    adicionarAoCesto(produto);
  });

  artigo.appendChild(titulo);
  artigo.appendChild(imagem);
  artigo.appendChild(descricao);
  artigo.appendChild(preco);
  artigo.appendChild(botao);

  return artigo;
}

/* ===============================
   Cesto: adicionar / remover / mostrar
================================= */
function guardarCesto() {
  try {
    localStorage.setItem('meuCesto', JSON.stringify(cesto));
  } catch (e) {
    console.error('Não foi possível guardar no localStorage:', e);
  }
}

function carregarCestoGuardado() {
  try {
    const guardado = localStorage.getItem('meuCesto');
    if (guardado) {
      cesto = JSON.parse(guardado) || [];
    }
  } catch (e) {
    console.warn('Não foi possível ler do localStorage:', e);
    cesto = [];
  }
}

function adicionarAoCesto(produto) {
  const existente = cesto.find(function (p) { return p.id === produto.id; });

  if (existente) {
    existente.quantidade += 1;
  } else {
    cesto.push({
      id: produto.id,
      title: produto.title,
      price: produto.price,
      quantidade: 1
    });
  }

  guardarCesto();
  mostrarCesto();
}

function removerDoCesto(id) {
  cesto = cesto.filter(function (item) { return item.id !== id; });
  guardarCesto();
  mostrarCesto();
}

function mostrarCesto() {
  const listaCesto = document.getElementById('lista-cesto');
  const totalElemento = document.getElementById('total');

  if (!listaCesto || !totalElemento) return;

  listaCesto.textContent = '';

  let total = 0;

  cesto.forEach(function (item) {
    const li = criarProdutoCesto(item);
    listaCesto.appendChild(li);
    total += Number(item.price) * Nu*
