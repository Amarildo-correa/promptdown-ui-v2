import { describe, it, expect } from 'vitest';
import { truncate } from '../../public/js/lib/truncate.js';

describe('truncate(text, maxLength)', () => {
  it('retorna a string intacta quando menor ou igual ao limite', () => {
    expect(truncate('Olá mundo', 20)).toBe('Olá mundo');
    expect(truncate('exato', 5)).toBe('exato');
  });

  it('adiciona … quando a string excede o limite', () => {
    const result = truncate('Palavra longa demais para caber aqui', 20);
    expect(result.endsWith('…')).toBe(true);
  });

  it('não excede maxLength caracteres (incluindo o …)', () => {
    const result = truncate('Um texto bem longo que deve ser cortado corretamente', 30);
    expect([...result].length).toBeLessThanOrEqual(30);
  });

  it('não corta palavras no meio — termina em fronteira de palavra', () => {
    const original = 'Título com várias palavras interessantes';
    const result = truncate(original, 25);
    const semReticencias = result.slice(0, -1).trimEnd();
    // Cada palavra do resultado deve existir integralmente no original
    const palavrasResultado = semReticencias.split(/\s+/);
    const palavrasOriginais = original.split(/\s+/);
    palavrasResultado.forEach(p => {
      expect(palavrasOriginais).toContain(p);
    });
  });

  it('retorna string vazia para entrada não-string', () => {
    expect(truncate(null, 10)).toBe('');
    expect(truncate(undefined, 10)).toBe('');
    expect(truncate(42, 10)).toBe('');
  });

  it('lida com string sem espaços — corta no maxLength', () => {
    const result = truncate('abcdefghijklmnopqrstuvwxyz', 10);
    expect(result.endsWith('…')).toBe(true);
    expect([...result].length).toBeLessThanOrEqual(11);
  });

  it('caso FP-004: título com >120 chars fica com …', () => {
    const titulo = 'Esta é uma frase longa '.repeat(6).trim();
    const result = truncate(titulo, 120);
    expect([...result].length).toBeLessThanOrEqual(120);
    expect(result.endsWith('…')).toBe(true);
  });
});
