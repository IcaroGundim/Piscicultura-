import { describe, it, expect } from 'vitest';
import {
  getLoteValue,
  getDisplayedMetricValue,
  type FieldDef,
} from './tankFields';
import type { BercarioLote } from './types';

function field(over: Partial<FieldDef> & Pick<FieldDef, 'key'>): FieldDef {
  return {
    label: '',
    icon: () => null,
    section: 'capacity',
    ...over,
  };
}

const bercario = {
  peso_entrada_kg: 45,
  qtd_peixes: 15000,
  peso_transferencia_kg: 0.1,
} as unknown as BercarioLote;

describe('getLoteValue', () => {
  it('retorna 0 para lote ausente ou campo não numérico', () => {
    expect(getLoteValue(undefined, 'qtd_peixes')).toBe(0);
    expect(getLoteValue({ qtd_peixes: 'x' } as never, 'qtd_peixes')).toBe(0);
  });

  it('retorna o valor numérico do campo', () => {
    expect(getLoteValue(bercario, 'qtd_peixes')).toBe(15000);
  });
});

describe('getDisplayedMetricValue', () => {
  it('no berçário, peso de entrada é exibido por unidade (em gramas)', () => {
    // (45 kg / 15000 peixes) * escala 1000 = 3 g por peixe
    const result = getDisplayedMetricValue(
      'bercario',
      bercario,
      field({ key: 'peso_entrada_kg', scale: 1000 })
    );
    expect(result).toBe(3);
  });

  it('no berçário com 0 peixes, peso de entrada por unidade é 0', () => {
    const result = getDisplayedMetricValue(
      'bercario',
      { ...bercario, qtd_peixes: 0 } as BercarioLote,
      field({ key: 'peso_entrada_kg', scale: 1000 })
    );
    expect(result).toBe(0);
  });

  it('fora do berçário, peso de entrada usa o valor bruto', () => {
    const lote = { peso_entrada_kg: 500, qtd_peixes: 5000 } as unknown as BercarioLote;
    const result = getDisplayedMetricValue('recria', lote, field({ key: 'peso_entrada_kg' }));
    expect(result).toBe(500);
  });

  it('aplica a escala configurada do campo', () => {
    const result = getDisplayedMetricValue(
      'bercario',
      bercario,
      field({ key: 'peso_transferencia_kg', scale: 1000 })
    );
    expect(result).toBe(100); // 0.1 kg * 1000 = 100 g
  });
});
