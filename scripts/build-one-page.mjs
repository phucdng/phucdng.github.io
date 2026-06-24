import { readFile, writeFile } from 'node:fs/promises';

const pages = [
  ['profile', 'Profile'],
  ['publications', 'Publications'],
  ['awards', 'Awards & Honor'],
  ['teaching', 'Teaching'],
  ['contact', 'Contact'],
];

function archiveFrom(html, page) {
  const match = html.match(/<div class="archive-copy">\s*([\s\S]*?)\s*<\/div>/);
  if (!match) throw new Error(`Archive content not found in ${page}.html`);
  return match[1];
}

const content = Object.fromEntries(await Promise.all(pages.map(async ([id]) => [id, archiveFrom(await readFile(`${id}.html`, 'utf8'), id)])));
const sections = pages.map(([id, title], index) => `
      <section id="${id}">
        <p class="section-label">${String(index + 1).padStart(2, '0')} / ${title}</p>
        <h2>${title}</h2>
        <div class="archive-copy">${content[id]}</div>
      </section>`).join('');

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Academic profile and publications of Duc-Phuc Nguyen, PhD.">
  <title>Duc-Phuc Nguyen, PhD</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav aria-label="Primary navigation">
      <a class="brand" href="#home">DUC-PHUC NGUYEN</a>
      <div class="nav-links">
        ${pages.map(([id, title]) => `<a href="#${id}">${title}</a>`).join('')}
      </div>
    </nav>
    <div class="masthead" id="home">
      <p class="kicker">Researcher · National Institute of Information and Communications Technology, Japan</p>
      <h1>Duc-Phuc Nguyen, PhD</h1>
      <p class="summary">Research interests: AI-driven 6G wireless communications, UAV communications, and hardware, embedded, and simulation platforms for wireless and optical systems.</p>
      <div class="quick-links"><a href="mailto:nguyenducphuc@ieee.org">nguyenducphuc@ieee.org</a><a href="https://orcid.org/0000-0002-7136-8924" target="_blank" rel="noreferrer">ORCID</a><a href="https://github.com/phucdng" target="_blank" rel="noreferrer">GitHub</a></div>
    </div>
  </header>
  <main>${sections}
  </main>
  <footer>© <span id="year"></span> Duc-Phuc Nguyen</footer>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
`;

await writeFile('index.html', page, 'utf8');
