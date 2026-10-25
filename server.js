// Relé do TSE — repassa, byte a byte, só requisições pra
// resultados.tse.jus.br. Existe pra contornar o bloqueio de IP que a
// Akamai (CDN do TSE) aplica contra a rede da Cloudflare; roda numa rede
// diferente (Fly.io / Render, dependendo de onde for publicado).
//
// Não inventa, não filtra, não decora nenhum dado — só repassa o que o
// TSE responde, do jeito que respondeu.

const http = require("http");
const https = require("https");

const DOMINIO_PERMITIDO = "resultados.tse.jus.br";
const PORT = process.env.PORT || 3000;

function tratar(req, res) {
  const url = new URL(req.url, "http://localhost:" + PORT);
  const alvo = url.searchParams.get("url");

  if (url.pathname === "/" && !alvo) {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("relé TSE no ar — uso: ?url=https://resultados.tse.jus.br/...");
  }

  if (!alvo) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("uso: ?url=https://resultados.tse.jus.br/...");
  }

  let alvoUrl;
  try {
    alvoUrl = new URL(alvo);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("url inválida");
  }

  if (alvoUrl.protocol !== "https:" || alvoUrl.hostname !== DOMINIO_PERMITIDO) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("domínio não permitido — só " + DOMINIO_PERMITIDO);
  }

  const upstream = https.get(alvoUrl.toString(), (tseRes) => {
    const chunks = [];
    tseRes.on("data", (chunk) => chunks.push(chunk));
    tseRes.on("end", () => {
      res.writeHead(tseRes.statusCode || 502, {
        "Content-Type": tseRes.headers["content-type"] || "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(Buffer.concat(chunks));
    });
  });

  upstream.on("error", (erro) => {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("falha ao buscar do TSE: " + erro.message);
  });

  upstream.setTimeout(10000, () => upstream.destroy(new Error("timeout de 10s buscando o TSE")));
}

http.createServer(tratar).listen(PORT, () => {
  console.log("relé TSE ouvindo na porta " + PORT);
});
