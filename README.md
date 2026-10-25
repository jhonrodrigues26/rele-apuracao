# Relé TSE — Apuração 2026

Servidor HTTP minúsculo que repassa requisições pra `resultados.tse.jus.br`.
Existe porque a Akamai (CDN do TSE) bloqueia requisições vindas da rede da
Cloudflare Workers — esse relé roda em outra rede (Fly.io ou Render) pra
contornar isso.

Só repassa o domínio `resultados.tse.jus.br`, byte a byte, sem alterar nada.
Não guarda nada, não loga o conteúdo, não tem estado.

## Uso

```
GET /?url=https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.jws
```

## Rodar local

```
npm start
```
