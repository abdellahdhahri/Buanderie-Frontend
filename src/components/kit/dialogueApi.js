let pousser = null;
const enAttente = [];
let compteur = 0;

export function ouvrirDialogue(options = {}) {
  return new Promise((resolve) => {
    const d = { ...options, id: ++compteur, resolve };
    if (pousser) pousser(d);
    else enAttente.push(d);
  });
}

export function brancherDialogues(fn) {
  pousser = fn;
  enAttente.splice(0).forEach(fn);
  return () => { if (pousser === fn) pousser = null; };
}

export const Swal = {
  fire(a, b, c) {
    const options = a && typeof a === 'object' ? a : { title: a, text: b, icon: c };
    return ouvrirDialogue(options);
  },
};

export default Swal;
