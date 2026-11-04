/** Frases seguras para síntesis incremental. El resto se conserva hasta el siguiente trozo. */
export function cortarFrases(texto: string, final = false): { frases: string[]; resto: string } {
  const frases: string[] = [];
  let inicio = 0;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (!/[.?!…\n]/.test(c)) continue;
    if (c === ".") {
      if (/\d/.test(texto[i - 1] ?? "") && (i + 1 === texto.length || /\d/.test(texto[i + 1]))) continue;
      const prefijo = texto.slice(inicio, i + 1);
      if (/\b(?:sr|sra|srta|dr|dra|prof|ud|uds|etc|ej|aprox|pág|págs|núm|cap|art|fig|ee|uu|mr|mrs|ms|vs)\.$/i.test(prefijo) || /\b[A-Z]\.$/.test(prefijo)) continue;
    }
    // Esperar un carácter de contexto evita cortar decimales y signos repartidos entre chunks.
    if (!final && i === texto.length - 1 && c !== "\n") continue;
    if (/[.?!…]/.test(texto[i + 1] ?? " ")) continue;
    if (c !== "\n" && i + 1 < texto.length && !/\s/.test(texto[i + 1])) continue;
    const frase = texto.slice(inicio, i + 1).trim();
    if (frase) frases.push(...limitarFrase(frase));
    inicio = i + 1;
  }
  let resto = texto.slice(inicio);
  // También limita texto sin puntuación; nunca espera un párrafo arbitrariamente largo.
  while (resto.length > 140) {
    const corte = resto.lastIndexOf(" ", 140);
    const n = corte > 0 ? corte : 140;
    frases.push(resto.slice(0, n).trim());
    resto = resto.slice(n).trimStart();
  }
  if (final && resto.trim()) { frases.push(...limitarFrase(resto.trim())); resto = ""; }
  return { frases, resto };
}

export function limitarFrase(texto: string): string[] {
  const partes: string[] = [];
  while (texto.length > 140) {
    const espacio = texto.lastIndexOf(" ", 140);
    const n = espacio > 0 ? espacio : 140;
    partes.push(texto.slice(0, n));
    texto = texto.slice(n).trimStart();
  }
  if (texto) partes.push(texto);
  return partes;
}
