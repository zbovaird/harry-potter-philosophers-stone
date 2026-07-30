import { CHARACTERS } from "./characters.js";

export function setupCharacterSelect({ gridEl, confirmBtn, onConfirm, lastCharacter }) {
  let selected = lastCharacter && CHARACTERS.some((c) => c.id === lastCharacter) ? lastCharacter : null;

  gridEl.innerHTML = "";
  for (const character of CHARACTERS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "character-card";
    btn.dataset.id = character.id;
    btn.innerHTML = `
      <div class="swatch" style="background:${character.color}"></div>
      <div class="name">${character.name}</div>
      <div class="blurb">${character.blurb}</div>
    `;
    btn.addEventListener("click", () => {
      selected = character.id;
      for (const child of gridEl.children) {
        child.classList.toggle("selected", child.dataset.id === selected);
      }
      confirmBtn.disabled = false;
    });
    if (character.id === selected) btn.classList.add("selected");
    gridEl.appendChild(btn);
  }

  confirmBtn.disabled = !selected;
  confirmBtn.onclick = () => {
    if (!selected) return;
    onConfirm(selected);
  };

  return {
    getSelected: () => selected,
  };
}
