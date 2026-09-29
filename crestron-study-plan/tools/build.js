// Builds STUDY-PLAN.md and study-plan.html from plan.json.
// Usage: node crestron-study-plan/tools/build.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'plan.json'), 'utf8'));
const KIND = { read: 'Read', run: 'Run', break: 'Break', build: 'Build', bug: 'Bug hunt' };

// ---- Markdown
const md = [];
md.push(`# ${plan.title}`, '');
md.push('Generated from `plan.json` by `tools/build.js`. Edit the JSON, not this file. The interactive checklist is `study-plan.html`, published at https://claude.ai/artifact/6YCbNS9K455DNiUkxNdwvA (progress syncs across your devices there).', '');
md.push('**Tags:** Read · Run · Break (on purpose) · Build · Bug hunt', '');
md.push('## Source repos', '', '| Key | Repo |', '|---|---|');
for (const r of plan.repos) md.push(`| ${r.key} | [${r.name}](${r.url}) |`);
md.push('', 'Reference docs: `reference/patterns.md`, `reference/gotchas.md`, `reference/repo-index.md`.', '');
for (const [i, p] of plan.phases.entries()) {
  md.push('---', '', `## ${String(i).padStart(2, '0')} · ${p.title} (${p.weeks})`, '', `_${p.goal}_`, '');
  md.push('**Sources**');
  for (const [k, s] of p.sources) md.push(`- **${k}**: ${s}`);
  md.push('');
  for (const t of p.tasks) md.push(`- [ ] **${KIND[t.kind]}**: ${t.text}`);
  md.push('');
}
fs.writeFileSync(path.join(root, 'STUDY-PLAN.md'), md.join('\n'));

// ---- HTML
const tpl = fs.readFileSync(path.join(__dirname, 'page.template.html'), 'utf8');
const json = JSON.stringify(plan).replace(/</g, '\\u003c');
fs.writeFileSync(path.join(root, 'study-plan.html'), tpl.replace('/*PLAN_DATA*/null', json));

const n = plan.phases.reduce((a, p) => a + p.tasks.length, 0);
console.log(`Built ${plan.phases.length} phases, ${n} tasks.`);
