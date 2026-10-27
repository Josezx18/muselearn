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

// Muse Voice Transcribe: envía 1 s de silencio en WAV (24 kHz, mono, 16 bits).
// No hay voz, así que el texto sale vacío; lo que importa es que responda 200.
if (process.env.MODEL_API_KEY) {
  const modeloVoz = process.env.MUSE_VOZ_MODELO || "muse-voice-transcribe-1.0";
  const hz = 24000, datos = hz * 2; // 1 s de muestras de 16 bits
  const wav = Buffer.alloc(44 + datos);
  wav.write("RIFF", 0); wav.writeUInt32LE(36 + datos, 4); wav.write("WAVE", 8);
  wav.write("fmt ", 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(hz, 24); wav.writeUInt32LE(hz * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(datos, 40);
  const formulario = new FormData();
  formulario.append("request", new Blob([JSON.stringify({ mode: "PUSH_TO_TALK", model: modeloVoz, audioEncoding: "WAV", languageBias: ["Spanish", "English"] })], { type: "application/json" }));
  formulario.append("audio", new Blob([wav], { type: "audio/wav" }), "silencio.wav");
  const inicio = Date.now();
  try {
    const base = (process.env.META_API_URL || "https://api.meta.ai/v1").replace(/\/$/, "");
    const r = await fetch(`${base}/asr/transcribe?sessionId=prueba-muselearn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}` },
      body: formulario,
    });
    const cuerpo = await r.text();
    if (!r.ok) throw new Error(`${r.status} ${cuerpo.slice(0, 300)}`);
    console.log(`✅ Muse Voice Transcribe · ${modeloVoz} · ${Date.now() - inicio} ms → respuesta: ${cuerpo.slice(0, 120)}`);
  } catch (e) {
    fallos++;
    console.log(`❌ Muse Voice Transcribe · ${modeloVoz}: ${e.message}`);
  }
}

process.exit(fallos ? 1 : 0);
