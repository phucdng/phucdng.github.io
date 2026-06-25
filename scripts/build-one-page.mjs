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
  'News-Letters [NL]', 'International Conference Papers', 'Domestic Conference Papers [D]', 'Workshops [W]', 'Posters [P]', 'Granted Projects',
]);

// Links inherited from the original Google Sites publication list. Keys are the
// publication identifiers that appear at the beginning of each entry.
const resourceLinks = {
  J10: 'https://arxiv.org/pdf/2605.25321v1',
  J9: 'https://ieeexplore.ieee.org/document/11039836',
  J8: 'https://ieeexplore.ieee.org/document/11028067',
  J7: 'https://ieeexplore.ieee.org/document/10017169',
  J6: 'https://arxiv.org/pdf/2209.00799.pdf',
  J5: 'https://rev-jec.org/index.php/rev-jec/article/download/234/191',
  J4: 'https://www.researchgate.net/profile/Duc_Phuc_Nguyen/publication/329350438_Log-Likelihood_Ratio_Calculation_Using_3-Bit_Soft-Decision_for_Error_Correction_in_Visible_Light_Communication_Systems/links/5c90a6bd45851564fae6e2e8/Log-Likelihood-Ratio-Calculation-Using-3-Bit-Soft-Decision-for-Error-Correction-in-Visible-Light-Communication-Systems.pdf',
  J3: 'https://www.jstage.jst.go.jp/article/comex/7/1/7_2017XBL0138/_pdf',
  J2: 'https://doi.org/10.12720/jcm.12.2.130-136',
  J1: 'https://doi.org/10.32508/stdj.v18i3.836',
  Pt04: 'https://patentscope.wipo.int/search/en/search.jsf?queryString=%22A%20novel%20unwrapping%20method%20for%20extending%20space-time%20sync%20cycles%22',
  Pt03: 'https://patentscope2.wipo.int/search/en/detail.jsf?docId=WO2025052584',
  Pt02: 'https://patentscope2.wipo.int/search/en/WO2025041258',
  Pt01: 'https://thongke.cesti.gov.vn/images/BCPTXHCN/2025_Ky02/2025-BCTC-Xu-huong-cong-nghe-an-ninh-mang.pdf',
  6: 'https://www2.nict.go.jp/global2/mwcb26/',
  5: 'https://www.nict.go.jp/publication/shuppan/kihou-journal/houkoku71-1r_HTML/2025O-02-01.pdf',
  4: 'https://mentor.ieee.org/802.15/documents',
  3: 'https://www.ceatec.com/',
  2: 'https://www.nict.go.jp/publication/shuppan/kihou-journal/houkoku71-1r_HTML/2025O-02-01.pdf',
  1: 'https://www.nict.go.jp/en/press/2024/02/20-1.html',
  N1: 'https://www.nict.go.jp/publication/shuppan/kihou-journal/houkoku71-1r_HTML/2025O-02-01.pdf',
  N2: 'https://www.ieice.org/cs/gnl/gnl_vol44-1.pdf',
  C22: 'https://ieeexplore.ieee.org/document/11366453',
  C21: 'https://ieeexplore.ieee.org/document/11274605',
  C20: 'https://ieeexplore.ieee.org/document/10760607',
  C19: 'https://ieeexplore.ieee.org/document/10811315',
  C18: 'https://ieeexplore.ieee.org/document/10811250',
  C17: 'https://ken.ieice.org/ken/paper/202411041cGd/',
  C16: 'https://www.dsp.rwth-aachen.de/cms/dsp/der-lehrstuhl/aktuelle-meldungen/~bqqsqr/nict-praesentiert-gemeinsame-forschung-m/?lidx=1',
  C15: 'https://ieeexplore.ieee.org/document/10817412',
  C14: 'https://doi.org/10.1109/nics48868.2019.9023844',
  C13: 'https://ieeexplore.ieee.org/abstract/document/8905168',
  C12: 'https://www.researchgate.net/publication/339819613_Reliability_Enhancement_for_Multi-level_Cell_NAND_Flash_Memory_Using_Error_Asymmetry',
  C11: 'https://arxiv.org/pdf/1805.00359',
  C10: 'https://doi.org/10.1109/ATC.2018.8587521',
  C9: 'https://www.researchgate.net/publication/329956404_Hardware_Implementation_of_A_Non-RLL_Soft-decoding_Beacon-based_Visible_Light_Communication_Receiver',
  C8: 'https://arxiv.org/pdf/1904.00832',
  C7: 'https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-16K18105',
  C6: 'https://www.researchgate.net/profile/Duc_Phuc_Nguyen/publication/311919681_PER_evaluation_of_K-min_Viterbi_decoder_for_wireless_sensors/links/5c90a8b492851c1df94a798b/PER-evaluation-of-K-min-Viterbi-decoder-for-wireless-sensors.pdf',
  C5: 'https://ieeexplore.ieee.org/abstract/document/7888352',
  C4: 'https://ieeexplore.ieee.org/abstract/document/7503678',
  C3: 'https://www.researchgate.net/profile/Duc_Phuc_Nguyen/publication/283025243_A_novel_hardware_architecture_for_Noise_Cancellation_based_on_adaptive_speech_probability_density_function/links/5b1988c9aca272021cf21268/A-novel-hardware-architecture-for-Noise-Cancellation-based-on-adaptive-speech-probability-density-function.pdf',
  C2: 'https://www.researchgate.net/publication/332258414_Hardware-Software_Co-design_of_an_Embedded_System_for_Noise_Cancellation',
  C1: 'https://www.researchgate.net/publication/332258414_Hardware-Software_Co-design_of_an_Embedded_System_for_Noise_Cancellation',
  D11: 'https://www.ieice.org/jpn_r/activities/taikai/general/2026/assets/pdf/Program_2026G.pdf',
  D10: 'https://www.ieice.org/jpn_r/activities/taikai/general/2026/assets/pdf/Program_2026G.pdf',
  D9: 'https://www.ieice.org/publications/ken/summary.php?contribution_id=131664&expandable=1&ken_id=CS&lang=en&presen_date=2024-07-17&schedule_id=8359&society_cd=CS&year=2024',
  D8: 'https://www.ieice.org/publications/conferences/summary.php?ConfCd=2024G&conf_type=G&expandable=0&id=CONF0000141351&lecture_number=B-15-06&session_num=B-15&year=2024',
  D7: 'https://acoustics.jp/cms/wp_asj/wp-content/uploads/004_2023autumn_program.pdf',
  D6: 'https://www.ieice.org/publications/ken/article.php?PageNo=2&day=20170522&expandable=3&ken_id=DC&lang=en&presen_date=&schedule_id=5593&society_cd=ISS&year=2017',
  D5: 'https://ken.ieice.org/ken/paper/20170523CbUE/',
  D4: 'https://ken.ieice.org/ken/paper/201512182be7/',
  W4: 'https://grow-thz.org/workshop/1st-international-workshop-on-global-research-initiative-for-wireless-technology-igrow/program/',
  W3: 'https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-16K18105',
  W2: 'https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-16K18105',
  W1: 'https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-16K18105',
  P11: 'https://beyond5g.nict.go.jp/en/images/20260121Ge-JaB5GWorkshop-DemonstrationDetails.pdf',
  P10: 'https://www.dsp.rwth-aachen.de/cms/dsp/der-lehrstuhl/aktuelle-meldungen/~bqqsqr/nict-praesentiert-gemeinsame-forschung-m/?lidx=1',
  P9: 'https://www.dsp.rwth-aachen.de/cms/dsp/der-lehrstuhl/aktuelle-meldungen/~bqqsqr/nict-praesentiert-gemeinsame-forschung-m/?lidx=1',
  P8: 'https://grow-thz.org/wp-content/uploads/2025/02/IGROW-final-program.pdf',
  P7: 'https://grow-thz.org/wp-content/uploads/2025/02/IGROW-final-program.pdf',
  P6: 'https://beyond5g.nict.go.jp/en/images/20250121Germany-Japan-B5Gworkshop-posterdemo%28Japan%29-details.pdf',
  P5: 'https://mentor.ieee.org/802.15/documents',
  P4: 'https://www.dsp.rwth-aachen.de/cms/dsp/der-lehrstuhl/aktuelle-meldungen/~bqqsqr/nict-praesentiert-gemeinsame-forschung-m/?lidx=1',
  P3: 'https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-16K18105',
  P2: 'https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-16K18105',
  P1: 'https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-16K18105',
  G3: 'https://developer.nvidia.com/academic_gpu_seeding',
  G2: 'https://kaken.nii.ac.jp/ja/grant/KAKENHI-PROJECT-16K18105',
  G1: 'https://fetel.hcmus.edu.vn/de-tai-du-an/',
};

const noResourceLinkKeys = new Set(['D1', 'D2', 'D3']);

function resourceLink(line) {
  const match = line.match(/^\[\s*([^\]]+)\]/);
  const key = match?.[1].replace(/[\s_]+/g, '');
  if (key && noResourceLinkKeys.has(key)) {
    return line.replace(/\s*\(\s*(View|Download)\s*\)\s*([.,])?\s*$/i, (_, _label, punctuation = '') => punctuation);
  }
  const directUrl = key && resourceLinks[key];
  const titleMatch = line.match(/[“"](.+?)[”"]/);
  const title = (titleMatch?.[1] || line.replace(/^\[[^\]]+\]\s*/, '')).replace(/&amp;/g, '&').trim();
  const url = directUrl || `https://www.google.com/search?q=${encodeURIComponent(`"${title}"`)}`;
  const link = (label = 'View') => `(<a class="resource-link" href="${url}" target="_blank" rel="noreferrer" title="${directUrl ? 'Open publication resource' : 'Search this exact title on the web'}">${label}</a>)`;
  if (/\(\s*(View|Download)\s*\)/i.test(line)) {
    return line.replace(/\(\s*(View|Download)\s*\)/i, (_, label) => link(label));
  }
  if (/\.\s*$/.test(line)) return line.replace(/\.(\s*)$/, `${link('View')}.$1`);
  if (/[,]\s*$/.test(line)) return line.replace(/,(\s*)$/, `${link('View')},$1`);
  return `${line} ${link('View')}`;
}

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
    output += `<li>${id === 'publications' ? resourceLink(line) : line}</li>`;
  }
  close();
  return output;
}

const content = Object.fromEntries(await Promise.all(pages.map(async ([id]) => [id, formatArchive(archiveFrom(await readFile(`data/${id}-source.html`, 'utf8'), id), id)])));
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
