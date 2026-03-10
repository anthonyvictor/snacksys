import { IProduct } from "../product";

/**
 * Função principal para calcular o preço mínimo do produto.
 * @param product O objeto Product a ser avaliado.
 * @returns O preço mínimo total (basePrice + custo mínimo dos modifiers), ou null se os requisitos mínimos (min) não puderem ser atendidos devido à indisponibilidade/estoque.
 */
export function getMinProductPrice(product: IProduct): number | null {
  let totalModifierCost = 0;

  // 1. Itera sobre todos os modifiers do produto
  for (const modifier of product.modifiers) {
    if (!modifier.active || !modifier.original.active) {
      continue; // Ignora modifiers inativos
    }

    // Se min for 0, este modifier não adiciona custo obrigatório ao preço mínimo
    if (modifier.min === 0) {
      continue;
    }

    // 2. Filtra as opções ativas e com estoque suficiente
    const availableOptions = modifier.options.filter(
      (option) =>
        option.original.active &&
        option.active &&
        (option.original.stock === null ||
          option.original.stock === undefined ||
          option.original.stock > 0),
    );

    // 3. Verifica a viabilidade de satisfazer o 'min'
    if (availableOptions.length === 0) {
      console.error(
        `Erro: Modifier "${modifier.original.internalName}" requer ${modifier.min} seleção(ões), mas não há opções disponíveis.`,
      );
      return null; // Não é possível atender ao requisito mínimo
    }

    let minModifierCost = 0;

    if (modifier.original.repeatable) {
      // Caso 3A: Se for repetível, escolhemos a opção mais barata 'min' vezes.
      const cheapestOption = availableOptions.reduce(
        (min, current) => (current.price < min.price ? current : min),
        availableOptions[0],
      );

      const cheapestPrice = cheapestOption.price;

      // O conjunto de preços selecionados é [cheapestPrice, cheapestPrice, ...] (requiredSelections vezes)
      switch (modifier.original.pricingStrategy) {
        case "sum":
          minModifierCost = cheapestPrice * modifier.min;
          break;
        case "average":
        case "highest":
        case "lowest":
          // Como todos os preços são iguais, a média, o maior e o menor são o próprio preço
          minModifierCost = cheapestPrice;
          break;
      }
    } else {
      // Caso 3B: Se não for repetível, precisamos de opções únicas.
      if (availableOptions.length < modifier.min) {
        console.error(
          `Erro: Modifier "${modifier.original.internalName}" requer ${modifier.min} seleções únicas, mas só há ${availableOptions.length} opções disponíveis.`,
        );
        return null; // Não é possível atender ao requisito mínimo
      }

      // Ordena as opções por preço e pega as 'min' mais baratas
      const sortedOptions = availableOptions.sort((a, b) => a.price - b.price);
      const selectedPrices = sortedOptions
        .slice(0, modifier.min)
        .map((o) => o.price);

      // Aplica a estratégia de precificação ao conjunto de preços selecionados
      switch (modifier.original.pricingStrategy) {
        case "sum":
          minModifierCost = selectedPrices.reduce(
            (sum, price) => sum + price,
            0,
          );
          break;
        case "average":
          const sum = selectedPrices.reduce((s, price) => s + price, 0);
          minModifierCost = sum / selectedPrices.length;
          break;
        case "highest":
          minModifierCost = Math.max(...selectedPrices);
          break;
        case "lowest":
          minModifierCost = Math.min(...selectedPrices);
          break;
      }
    }

    // 4. Acumula o custo mínimo do modifier ao total
    totalModifierCost += minModifierCost;
  }

  // 5. Retorna o preço base mais o custo total dos modifiers
  return product.basePrice + totalModifierCost;
}
