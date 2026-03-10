export const replaceDeliveryText = (text: string, empty = false) => {
  let r = text
    .replace(/[^a-z]/g, " ")
    .replace(/\ba(qu?i?e?|ki)r?\b/g, "aqui")
    .replace(/\bta(sh|ch|x)a\b/g, "taxa")
    .replace(/^tv\.? /g, "travessa ")
    .replace(/^r\.? /g, "rua ")
    .replace(/^av\.? /g, "avenida ")
    .replace(/^lad\.? /g, "ladeira ")
    .replace(/^ala?\.? /g, "alameda ")
    .replace(/\b(sao cr?istova?o)\b/g, "bairro sao cristovao")
    .replace(
      /\b(hos?tel|(super?\s?)?mercad(o|inho)|(em|na)\.+(c|k)a(s|z)a|ata(c|k)ada?o|shop(ing?)?|academia|salao|lanchonete|padaria|farmacia|barbearia|edi?fi?c?i?o?|hospital|es?cola|colegio|rua|av(eni?da?)?|motel|pousada|predio|vila|residencial?|torre|clinica|faculdade|universidade|igreja|creche|bloco|portaria)\b/g,
      "quero entrega",
    )

    .replace(/\b(e(n|m)tr?eg(r?ar?|u?(e|i))?)\b/g, "quero entrega")
    .replace(/\b((na|aqui\s+e(m|s))\s+(casa|hotel|))\b/g, "quero entrega")
    .replace(/\b((pr?a?\s+)?entrega)\b/g, "quero entrega")
    .replace(
      /\b(^(entrega(\s+(aqui|n(o|a)s?|em|des?c?e(n|m)d?o|s(u|o)bi(n|m)?do|(d|a)o))?)$)\b/g,
      "quero entrega",
    )
    .replace(/\b(^(((pr?a?)\s+)?tra(z|s)er?))\b/g, "quero entrega")
    .replace(/\b((bus?car?|pegar?|retirar?)((\s+air?)|$))\b/g, "quero retirada")
    .replace(
      /\b(((vou?|va?mo?s?|vai|indo|pa?r?a?)\s+)?(ai|loja|pizaria|restaurante|lanchonete)?(bus?car?|pegar(\s+air?)?$|retira(r|da)?))\b/g,
      "quero retirada",
    )

    .replace(
      /\b(alto da sereia|alto da alegria|brejo|carasca|lesa ribeiro|campo.+corte|bom\s+natal|beira|cascalh?ei?ra|colh?ina|casange|(bai?x(inh)?a\.+)?musurunga|moro|bate.*coracao|lagoa|28|vinte.+o(i|u)to|(y|i)olanda|parque|sao cristovao|itinga|planeta|fundao)\b/g,
      "quero entrega",
    )

    .replace(/\b((taxa|frete)r?)\b/g, "entrega")
    .replace(
      /\b(quanto.*(entrega|aqui)|(entrega|aqui).*quanto|qual\s+entrega)\b/g,
      empty ? "" : "quanto entrega",
    )
    .replace(
      /\b(taxa|tarifa|frete|pr?a?\s+levar?m?|que\s+levem?|(pra?\s+)?traz(e(m|r))?(\s+aq)?|tragam?)\b/g,
      empty ? "" : "entrega",
    )
    .replace(
      /\b(((cus|es)?ta\s+)?(quanto|conto|qual)(\s+((es|cus)?ta|seria))?\s+(deliver(y|i|e)|taxa|entrega))\b/g,
      empty ? "" : "quanto entrega",
    )

    .replace(
      /\b((fica|muda|aumenta|acrescenta)r?\s+quanto.*(entrega|taxa|frete)|qual\s+taxa)\b/g,
      empty ? "" : "quanto entrega",
    )
    .replace(/\b(quanto\s+aqui)\b/g, empty ? "" : "quanto entrega")
    .replace(
      /\b(aqui(\s+(em|no|na))|perto|prox(imo)?(\s+(a|o|ao|dos?|das?|de|d|a?onde))|des?cendo|subindo|.*(cima|baixo))\b/g,
      empty ? "" : "quero entrega",
    );

  console.log("before fix delivery", text);
  console.log("after fix delivery", r);
  return r;
};
