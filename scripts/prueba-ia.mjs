// Prueba de humo de los proveedores de IA (T00).
// Uso: npm run prueba:ia   (lee las claves de .env.local)
// Hace una llamada mínima a cada proveedor configurado y muestra si respondió.

const proveedores = [
  { nombre: "Meta Model API (Muse Spark)", url: process.env.META_API_URL || "https://api.meta.ai/v1", clave: process.env.MODEL_API_KEY, modelo: process.env.MUSE_MODELO || "muse-spark-1.3" },
  { nombre: "Baseten (Muse Spark Open)", url: process.env.MODELO_ABIERTO_URL, clave: process.env.MODELO_ABIERTO_KEY, modelo: process.env.MODELO_ABIERTO_ID },
  { nombre: "NVIDIA (Muse Glimmer)", url: process.env.NVIDIA_API_URL || "https://integrate.api.nvidia.com/v1", clave: process.env.NVIDIA_API_KEY, modelo: process.env.NVIDIA_MODELO || "meta/muse-glimmer-30b" },
];

let fallos = 0;
for (const p of proveedores) {
  if (!p.clave || !p.url || !p.modelo) {
    console.log(`⏭️  ${p.nombre}: sin configurar (se omite)`);
    continue;
  }
  const inicio = Date.now();
  try {
    const r = await fetch(`${p.url.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.clave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: p.modelo,
        messages: [{ role: "user", content: "Responde solo con la palabra: listo" }],
        max_tokens: 400,
      }),
    });
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(cuerpo).slice(0, 300)}`);
    const texto = cuerpo.choices?.[0]?.message?.content ?? "(sin texto)";
    console.log(`✅ ${p.nombre} · ${p.modelo} · ${Date.now() - inicio} ms → ${String(texto).trim().slice(0, 80)}`);
    console.log(`   tokens: entrada=${cuerpo.usage?.prompt_tokens ?? "?"} salida=${cuerpo.usage?.completion_tokens ?? "?"}`);
  } catch (e) {
    fallos++;
    console.log(`❌ ${p.nombre} · ${p.modelo}: ${e.message}`);
  }
}

// Lista de modelos de Meta, para confirmar los IDs exactos (voz incluida).
if (process.env.MODEL_API_KEY) {
  try {
    const r = await fetch(`${(process.env.META_API_URL || "https://api.meta.ai/v1").replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}` },
    });
    const cuerpo = await r.json();
    const ids = (cuerpo.data ?? []).map((m) => m.id);
    console.log(`\nModelos disponibles en tu clave de Meta (${ids.length}):\n  ${ids.join("\n  ")}`);
  } catch (e) {
    console.log(`\nNo se pudo listar los modelos de Meta: ${e.message}`);
  }
}

process.exit(fallos ? 1 : 0);
