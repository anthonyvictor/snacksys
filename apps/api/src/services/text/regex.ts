function escapeRegExp(string: string) {
  // $& significa a string inteira correspondida
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// const tags = ["cheddar", "bacon", "2x1"];
// const escapedTags = tags.map(escapeRegExp);
// // escapedTags seria: ["cheddar", "bacon", "2x1"] (sem mudança aparente no exemplo)

// const tagComCaracterEspecial = "Pão 2x1 (oferta)";
// const escapedTagEspecial = escapeRegExp(tagComCaracterEspecial);
// // escapedTagEspecial seria: "Pão 2x1 \\(oferta\\)"
