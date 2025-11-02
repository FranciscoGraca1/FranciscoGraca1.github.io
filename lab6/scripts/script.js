let cesto = [];

document.addEventListener('DOMContentLoaded', function () {
  // (opcional) atualiza ano no rodapé, se existir <time id="ano">
  const elAno = document.getElementById('ano');
  if (elAno) {
    const y = String(new Date().getFullYear());
    elAno.textContent = y;
    elAno.setAttribute('datetime', y);
  }

  // repõe cesto guardado
  carregarCestoGuardado();

  // desenha os produtos na página
  carregarProdutos(produtos);

  // desenha o cesto (caso já tivesse itens guardados)
  mostrarCesto();
});

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

function carregarProdutos(lista) {
  lista.forEach(function (produto) {
    console.log(produto.id, produto.title);
  });

  // 2) inserir no nó-pai
  const listaProdutos = document.getElementById('lista-produtos');
  if (!listaProdutos) return;

  lista.forEach(function (produto) {
    const artigo = criarProduto(produto);
    listaProdutos.appendChild(artigo);
  });
}

function criarProduto(produto) {
  // <article>
  const artigo = document.createElement('article');

  // <h3> título
  const titulo = document.createElement('h3');
  titulo.textContent = produto.title;

  // <img> imagem
  const imagem = document.createElement('img');
  imagem.src = produto.image;
  imagem.alt = produto.title;

  // <p> descrição
  const descricao = document.createElement('p');
  descricao.textContent = produto.description;

  // <p> preço
  const preco = document.createElement('p');
  preco.textContent = 'Preço: €' + Number(produto.price).toFixed(2);

  // <button> adicionar ao cesto
  const botao = document.createElement('button');
  botao.textContent = '+ Adicionar ao Cesto';
  botao.addEventListener('click', function () {
    adicionarAoCesto(produto);
  });

  // montar o article
  artigo.appendChild(titulo);
  artigo.appendChild(imagem);
  artigo.appendChild(descricao);
  artigo.appendChild(preco);
  artigo.appendChild(botao);

  return artigo;
}

// ---------------------------
// Cesto: adicionar / remover / mostrar
// ---------------------------
function adicionarAoCesto(produto) {
  // verifica se já existe
  const existente = cesto.find(function (p) { return p.id === produto.id; });

  if (existente) {
    existente.quantidade += 1;
  } else {
    // copia os campos que interessam + quantidade
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
  // remove usando filter (mantém tudo MENOS o id indicado)
  cesto = cesto.filter(function (item) { return item.id !== id; });

  guardarCesto();
  mostrarCesto();
}

function mostrarCesto() {
  const listaCesto = document.getElementById('lista-cesto');
  const totalElemento = document.getElementById('total');

  if (!listaCesto || !totalElemento) return;

  // limpa a lista
  listaCesto.textContent = '';

  let total = 0;

  cesto.forEach(function (item) {
    const li = criarProdutoCesto(item);
    listaCesto.appendChild(li);
    total += Number(item.price) * Number(item.quantidade);
  });

  totalElemento.textContent = '€' + total.toFixed(2);
}

function criarProdutoCesto(item) {
  // usamos <li> como linha do cesto
  const li = document.createElement('li');

  // texto com nome, preço e quantidade
  const texto = document.createElement('span');
  texto.textContent = item.title + ' — €' + Number(item.price).toFixed(2) + ' × ' + item.quantidade;

  // botão remover
  const botao = document.createElement('button');
  botao.textContent = 'Remover';
  botao.addEventListener('click', function () {
    removerDoCesto(item.id);
  });

  // montar a linha
  li.appendChild(texto);
  li.appendChild(botao);

  return li;
}