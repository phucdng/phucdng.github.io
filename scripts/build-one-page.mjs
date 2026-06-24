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
  const lines = [...match[1].matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map(([, value]) => value.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter(value => value && !['Google Sites', 'Report abuse', page[0].toUpperCase() + page.slice(1), 'Awards - Honor', 'Teaching'].includes(value));
  return lines.map(normalize);
}

function normalize(line) {
  return line
    .replace(/^[-+]\s*/, '')
    .replace(/Vietnam National University-Ho Chi Minh City/g, 'Vietnam National University, Ho Chi Minh City')
    .replace(/Duc-Phuc NGUYEN, PhD/g, 'Nguyen Duc Phuc, PhD')
    .replace(/phuc\.dnguy@gmai\.com or nguyenducphuc@ieee\.org/g, 'nguyenducphuc@ieee.org')
    .replace(/Master of Science – 9\/2012 – 9\/2015\)/g, 'Master of Science (September 2012–September 2015)')
    .replace(/Mother's tongue/g, 'Native language')
    .replace(/TPC's Member/g, 'TPC Member')
    .replace(/Honor program/g, 'Honors Program')
    .replace(/\s+-\s+/g, ' – ')
    .replace(/\s+,/g, ',')
    .trim();
}

const sectionHeadings = new Set([
  'Appointments', 'Educational History', 'Professional Activities', 'Research Visiting, Training', 'Languages',
  'Selected Journal papers [J]', 'Patents [Pt]', 'Demonstrations/ Proof of Concept presented in International/Domestic Exhibitions [D]',
  'News-Letters [NL]', 'International Conference Papers', 'Workshops [W]', 'Posters [P]', 'Granted Projects',
]);

function formatArchive(lines, id) {
  const numbered = id === 'publications';
  const tag = numbered ? 'ol' : 'ul';
  let open = false;
  let output = '';
  const close = () => { if (open) { output += `</${tag}>`; open = false; } };
  for (const line of lines) {
    const isHeading = sectionHeadings.has(line) || (id === 'teaching' && /^20\d{2}$/.test(line)) || (id === 'profile' && /^(Membership|Editorship|Reviewer):?$/.test(line));
    if (isHeading) { close(); output += `<h3>${line.replace(/\s*\[[^\]]+\]$/, '')}</h3>`; continue; }
    if (!open) { output += `<${tag} class="archive-list">`; open = true; }
    output += `<li>${line}</li>`;
  }
  close();
  return output;
}

const content = Object.fromEntries(await Promise.all(pages.map(async ([id]) => [id, formatArchive(archiveFrom(await readFile(`${id}.html`, 'utf8'), id), id)])));
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
  <meta name="description" content="Academic profile and publications of Nguyen Duc Phuc, PhD.">
  <title>Nguyen Duc Phuc, PhD</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav aria-label="Primary navigation">
      <a class="brand" href="#home">NGUYEN DUC PHUC</a>
      <div class="nav-links">
        ${pages.map(([id, title]) => `<a href="#${id}">${title}</a>`).join('')}
      </div>
    </nav>
    <div class="masthead" id="home">
      <p class="kicker">Researcher · National Institute of Information and Communications Technology, Japan</p>
      <h1>Nguyen Duc Phuc, PhD</h1>
      <p class="summary">Research interests include AI-driven 6G wireless communications, UAV communications, and hardware, embedded, and simulation platforms for wireless and optical systems.</p>
      <div class="quick-links"><a href="mailto:nguyenducphuc@ieee.org">nguyenducphuc@ieee.org</a><a href="https://orcid.org/0000-0002-7136-8924" target="_blank" rel="noreferrer">ORCID</a><a href="https://github.com/phucdng" target="_blank" rel="noreferrer">GitHub</a></div>
    </div>
  </header>
  <main>${sections}
  </main>
  <footer>© <span id="year"></span> Nguyen Duc Phuc</footer>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
`;

await writeFile('index.html', page, 'utf8');
