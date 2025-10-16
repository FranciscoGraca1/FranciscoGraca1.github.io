
//funcao mouse
const passa = document.querySelector('#passa');

function mouseOver() {
    passa.textContent = 'Obrigado por passares';
}

function mouseOut() {
    passa.textContent = 'Passa o rato por cima';
}

passa.onmouseover = () => mouseOver();
passa.onmouseout = () => mouseOut();


const pintame = document.querySelector('#pintame');

function mudarCorVermelho() {
    pintame.style.color = 'red';
}

function mudarCorVerde() {
    pintame.style.color = 'green';
}

function mudarCorAzul() {
    pintame.style.color = 'blue';
}

document.querySelector('#vermelho').onclick = () => mudarCorVermelho();
document.querySelector('#verde').onclick = () => mudarCorVerde();
document.querySelector('#azul').onclick = () => mudarCorAzul();

//mudar a cor a cada tecla

const input = document.getElementById('tecla');

  // array de cores a percorrer (fora da função)
  const cores = ['red', 'green', 'blue', 'yellow', 'purple', 'black'];
  let i = 0; // índice atual (fora da função)

  function mudaCor(event) {
    input.style.backgroundColor = cores[i];
    i = (i + 1) % cores.length; // dá a volta no fim
  }

  // adiciona o listener UMA vez
  input.addEventListener('keydown', mudaCor);

  //cor em ingles

  const ingles = document.getElementById('ingles');

  function corIngles() {
    const cor = input.value.trim().toLowerCase();
    const cores = ['red','green','blue','yellow','purple','black'];

    if (cores.includes(cor)) {
      ingles.textContent = cor;             // opcional: mostra a palavra
      ingles.style.backgroundColor = cor;   // CORRETO (não é background.color)
      ingles.style.color = (cor === 'yellow') ? 'black' : 'white'; // legibilidade
    } else {
      ingles.style.backgroundColor = '';
      ingles.style.color = '';
    }
  }

  // Atualiza enquanto escreve
  input.addEventListener('input', corIngles);