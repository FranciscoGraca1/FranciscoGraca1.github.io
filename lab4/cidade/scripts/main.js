// ========= 1) Área que segue o rato =========
const area = document.getElementById("area-move");
const coords = document.getElementById("coords");

area.addEventListener("mousemove", (e) => {              // mousemove
  const r = area.getBoundingClientRect();
  const x = Math.round(e.clientX - r.left);
  const y = Math.round(e.clientY - r.top);
  coords.textContent = `x: ${x}, y: ${y}`;               // altera texto
  area.style.background = `linear-gradient(90deg,#f1f2ff,#ffffff ${x / 4}%)`; // altera estilo
});

area.addEventListener("mouseover", () => {               // mouseover
  area.textContent = "Dentro da área 👍";
});
area.addEventListener("mouseout", () => {                // mouseout
  area.textContent = "Move o rato aqui dentro";
  area.style.background = "#f1f2ff";
});

// ========= 2) Botões que “pintam” a amostra =========
const amostra = document.getElementById("amostra");

document.querySelectorAll(".btn[data-color]").forEach((btn) => {
  btn.addEventListener("click", () => {                  // click
    const cor = btn.dataset.color;
    amostra.textContent = cor;
    amostra.style.background = cor;
    amostra.style.color = "#fff";
  });
});

// ========= 3) Imagem que reage =========
const foto = document.getElementById("foto");
const legenda = document.getElementById("legenda");

foto.addEventListener("mouseover", () => {               // mouseover
  legenda.textContent = "Olha a luz! 🌅";
});
foto.addEventListener("mouseout", () => {                // mouseout
  legenda.textContent = "Praia ao pôr do sol";
});

let efeito = false;
foto.addEventListener("dblclick", () => {                // dblclick
  efeito = !efeito;
  foto.style.filter = efeito ? "grayscale(100%) contrast(1.2)" : "none";
  foto.style.transform = efeito ? "scale(1.02)" : "none";
});

// ========= 4) Contador =========
const contar = document.getElementById("contar");
const reset = document.getElementById("reset");
const saida = document.getElementById("saida");
let n = 0;

contar.addEventListener("click", () => {                 // click
  n++;
  saida.textContent = n;
  saida.style.backgroundColor = n % 2 ? "#e6f4ff" : "#eef";
});

reset.addEventListener("click", () => {                  // click
  n = 0;
  saida.textContent = 0;
  saida.style.backgroundColor = "#eef";
});

// ========= 5) Extra simples: clicar no título muda a cor =========
document.getElementById("titulo").addEventListener("click", (e) => {
  e.target.style.color = e.target.style.color ? "" : "royalblue";
});
