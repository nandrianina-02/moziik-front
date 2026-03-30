// src/utils/domino.js
export function generateDominos() {
  const dominos = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      dominos.push({ left: i, right: j });
    }
  }
  return shuffle(dominos);
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}