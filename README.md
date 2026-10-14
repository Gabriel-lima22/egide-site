# egidedigital.com.br

Site da Égide Digital. HTML estático, sem build: cada página é uma pasta com `index.html`
(CSS e JS embutidos). A pasta do repositório no VPS **é** a pasta publicada, então salvar um
arquivo lá já coloca no ar.

| Caminho | O que é |
|---|---|
| `index.html`, `sites/`, `secretaria/`, `trafego-pago/`, `politica-de-privacidade/`, `termos-de-servico/` | as 6 páginas |
| `fonts/` | fontes servidas pelo próprio site (Archivo e Marcellus, subset latin) |
| `assets/` | imagens; `assets/miniaturas/` são os prints dos sites de clientes usados em `/sites/` |
| `_miniaturas-fonte/` | fontes dos prints (não é publicada) |

O nginx devolve 404 para `/_miniaturas-fonte/` e para este `README.md`: os dois ficam no
repositório, mas fora do site.

## Miniaturas de `/sites/`

As telas de notebook e celular de `/sites/` mostram prints dos sites dos clientes que rolam
sozinhos. Cada print existe em dois layouts, escolhidos pela largura da tela com `<picture>`:

- `*-desktop.webp`: telas de 860px ou mais
- `*-mobile.webp`: telas menores

| Print | Fonte | Onde aparece |
|---|---|---|
| `lacerda-notebook` | `_miniaturas-fonte/lacerda.html` | notebook do topo e do portfólio |
| `lacerda-celular` | `_miniaturas-fonte/lacerda.html` | celular do portfólio |
| `ocupacional-notebook` | `_miniaturas-fonte/ocupacional.html` | notebook do portfólio |
| `ocupacional-celular` | `_miniaturas-fonte/ocupacional.html` | celular do topo e do portfólio |

`_miniaturas-fonte/` guarda também as fotos (`assets/`) e as fontes (`fonts/`) que só as
miniaturas usam.

### Como atualizar um print

1. Edite o HTML do cliente em `_miniaturas-fonte/` (`lacerda.html` ou `ocupacional.html`).
   Para conferir no navegador, sirva a raiz do repositório e abra
   `/_miniaturas-fonte/lacerda.html?largura=480`.
2. Na raiz do repositório, rode:

   ```bash
   /opt/node/bin/node _miniaturas-fonte/gerar-prints.js
   ```

   O script usa o Chromium do Playwright que já existe no VPS e grava os 8 arquivos em
   `assets/miniaturas/`. Para cada um, ele mostra as dimensões e o tamanho:

   ```
   lacerda-notebook-desktop.webp      480x1005 (width/height do HTML)  92 KB
   ```

3. Se a altura de algum print mudou, atualize o `width`/`height` correspondente em
   `sites/index.html`. O `<img>` leva as dimensões do print desktop e o `<source>` as do mobile.
   Sem isso, o navegador reserva a proporção errada enquanto a imagem carrega.
4. Confira `/sites/` no celular e no computador, faça o commit e o push.

**Cliente novo:** crie `_miniaturas-fonte/<cliente>.html` copiando um dos existentes, acrescente
as linhas dele em `PRINTS`, no início do `gerar-prints.js`, e use os prints gerados em
`sites/index.html` no mesmo formato `<picture>` dos atuais. Inclua um `alt` com o nome do
cliente e o tipo de site.

**Larguras:** são as que a tela da miniatura ocupa em `/sites/` (notebook 480px no desktop e
340px no celular; celular 152px e 106px). O print sai com o dobro de pixels para ficar nítido.
Se o layout de `/sites/` mudar, ajuste essas larguras em `PRINTS`.

**Precisa de:** Node em `/opt/node/bin/node`, `playwright-core` em
`/root/egide-ads-app/painel/node_modules`, ou outro caminho indicado em `PLAYWRIGHT_CORE`, e o
Chromium em `~/.cache/ms-playwright`, ou outro caminho indicado em `CHROME_PATH`.
