import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { AskDeliveryEntity, IBuildingAddress, MsgIntentFunc } from "types";
import { replaceDeliveryText } from "../replace/delivery";
import { extractAddressIA } from "@/services/ia/extractAddress";
import { saveChat } from "@/services/save";

export const askDelivery: MsgIntentFunc = async ({
  original,
  normalized,
  chat,
}) => {
  const n = removeDuplicateWords(replaceDeliveryText(normalized));

  if (
    original.match(
      /\b((q|c)ua(n|m)t(o|u)|conto|taxa|pre(c|ss?)o|valor?|qual|frete|tarifa|cust(o|a))\b/g,
    )
  ) {
    await saveChat(chat.id, { customerAskDeliveryFee: true });
  }

  const r = !!n.match(
    /((quanto|quero) (entrega|retirada)|^(retirada|entrega))/g,
  );
  if (r) {
    const entities = n.match(/retirada/g)
      ? ({ type: "pickup" } as AskDeliveryEntity)
      : await extractAddressIA(
          original
            // .replace(
            //   /\b(obr?i?ga?d?o?a?|pfv|por\s+favor?|quero|querer|vou|vai|ser)\b/g,
            //   "",
            // )
            // .replace(
            //   /\b(entrega|pra|para|trazer|levar|vim|fica)\b/g,
            //   // /\b(e|a|o|entrega|pra|para|trazer|levar|vim|subindo|sobe|(d|a)o lado|perto|entra(ndo)?|entre|da|do|de|na|no|prox(im(o|a))?|em cima|em\s*baixo|fica|(entra|desce)(ndo)?)\b/g,
            //   "",
            // )
            // .replace(/\b((eh?\s+)?(a(q|k)u?i?\s+)?(na|no))\b/g, "")
            .replace(/^tv\.? /g, "travessa ")
            .replace(/^r\.? /g, "rua ")
            .replace(/^av\.? /g, "avenida ")
            .replace(/^lad\.? /g, "ladeira ")
            .replace(/^ala?\.? /g, "alameda ")
            .replace(/(?<!rua\s)\bless(a|e|i)\b/g, "rua: lessa ribeiro")
            .replace(/\b(vida nova)\b/g, "bairro: vida nova")
            .replace(/\b(itinga)\b/g, "bairro: itinga")
            .replace(/\b(cass?a(n|m)(g|j)(e|i))\b/g, "bairro: sao cristovao")
            .replace(/\b(itap(u|o)a(n|m)?)\b/g, "bairro: itapua")
            .replace(/\b(sao cr?istova?o)\b/g, "bairro: sao cristovao")
            .replace(/\s+/g, " ")
            .trim(),
        );

    return {
      intent: "askDelivery",
      entities,
    };
  } else {
    return false;
  }
};
