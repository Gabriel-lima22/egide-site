// Gera os prints WebP das miniaturas usadas em /sites/ a partir dos HTMLs desta pasta.
// Uso (na raiz do repositório):  node _miniaturas-fonte/gerar-prints.js
// Detalhes e como atualizar um print: README.md na raiz do repositório
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');            // raiz do site (serve /fonts e /_miniaturas-fonte)
const SAIDA = path.join(RAIZ, 'assets', 'miniaturas');
const ESCALA = 2;                                       // densidade de pixels (2x = nítido em celular)
const QUALIDADE = 0.8;                                  // qualidade do WebP (0 a 1)

// Cada print sai em dois layouts: "desktop" (telas >= 860px) e "mobile" (telas menores).
// As larguras (em px CSS) são as que a miniatura ocupa em /sites/ em cada layout.
const PRINTS = [
  { fonte: 'lacerda.html',     saida: 'lacerda-notebook',     desktop: 480, mobile: 340 },
  { fonte: 'lacerda.html',     saida: 'lacerda-celular',      desktop: 152, mobile: 106 },
  { fonte: 'ocupacional.html', saida: 'ocupacional-notebook', desktop: 480, mobile: 340 },
  { fonte: 'ocupacional.html', saida: 'ocupacional-celular',  desktop: 152, mobile: 106 },
];

const TIPOS = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png' };

function acharChromium() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(require('os').homedir(), '.cache', 'ms-playwright');
  for (const d of fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort().reverse())
    for (const sub of fs.readdirSync(path.join(base, d))) {
      const exe = path.join(base, d, sub, 'chrome');
      if (fs.existsSync(exe)) return exe;
    }
  throw new Error('Chromium não encontrado: defina CHROME_PATH');
}

(async () => {
  const { chromium } = require(process.env.PLAYWRIGHT_CORE || '/root/egide-ads-app/painel/node_modules/playwright-core');
  const servidor = http.createServer((req, res) => {
    const arq = path.join(RAIZ, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
    fs.createReadStream(arq).pipe(res);
  });
  await new Promise(ok => servidor.listen(0, '127.0.0.1', ok));
  const porta = servidor.address().port;
  fs.mkdirSync(SAIDA, { recursive: true });

  const navegador = await chromium.launch({ executablePath: acharChromium(), args: ['--no-sandbox'] });
  const conversor = await navegador.newPage();
  for (const p of PRINTS) for (const layout of ['desktop', 'mobile']) {
    const largura = p[layout];
    const pg = await navegador.newPage({ viewport: { width: largura, height: 800 }, deviceScaleFactor: ESCALA });
    await pg.goto(`http://127.0.0.1:${porta}/_miniaturas-fonte/${p.fonte}?largura=${largura}`);
    await pg.evaluate(async () => {
      document.querySelectorAll('img').forEach(i => { i.loading = 'eager' });
      await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
      await document.fonts.ready;
    });
    await pg.waitForTimeout(300);
    const el = await pg.$('#miniatura');
    const caixa = await el.boundingBox();
    const png = await el.screenshot({ type: 'png' });
    await pg.close();

    // PNG -> WebP usando o próprio Chromium (sem dependências extras)
    const b64 = await conversor.evaluate(async ({ src, q }) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', q).split(',')[1];
    }, { src: 'data:image/png;base64,' + png.toString('base64'), q: QUALIDADE });
    const nome = `${p.saida}-${layout}.webp`;
    fs.writeFileSync(path.join(SAIDA, nome), Buffer.from(b64, 'base64'));
    console.log(`${nome.padEnd(34)} ${Math.round(caixa.width)}x${Math.round(caixa.height)} (width/height do HTML)  ${Math.round(Buffer.from(b64, 'base64').length / 1024)} KB`);
  }
  await navegador.close();
  servidor.close();
})().catch(e => { console.error(e); process.exit(1); });
