export function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function formatPercent(value: number, maximumFractionDigits = 1) {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits })}%`;
}

export function formatBRLCompact(value: number) {
  if (Math.abs(value) >= 1_000_000)
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  if (Math.abs(value) >= 1_000)
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return formatBRL(value);
}
