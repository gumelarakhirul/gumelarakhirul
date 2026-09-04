import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const ACTIVITY_START = "<!-- AUTO:ACTIVITY:START -->";
export const ACTIVITY_END = "<!-- AUTO:ACTIVITY:END -->";

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function badgeSegment(value) {
  return encodeURIComponent(String(value).replaceAll("-", "--").replaceAll("_", "__").replaceAll(" ", "_"));
}

function renderLinks(links) {
  return links.map((link) => {
    const logo = link.logo ? `&logo=${encodeURIComponent(link.logo)}&logoColor=white` : "";
    const image = `https://img.shields.io/badge/${badgeSegment(link.label)}-${badgeSegment(link.value)}-${link.color}?style=for-the-badge${logo}`;
    return `  <a href="${link.url}"><img alt="${link.label}" src="${image}"></a>`;
  }).join("\n");
}

function renderFocus(focus) {
  return [
    "| Area | What I am exploring |",
    "| --- | --- |",
    ...focus.map((item) => `| **${escapeCell(item.name)}** | ${escapeCell(item.description)} |`)
  ].join("\n");
}

function renderProjects(projects) {
  return [
    "| Project | Focus | Why it matters |",
    "| --- | --- | --- |",
    ...projects.map((project) => {
      const homepage = project.homepage ? ` [Live](${project.homepage})` : "";
      return `| [**${escapeCell(project.name)}**](${project.url}) | ${escapeCell(project.focus)} | ${escapeCell(project.summary)}${homepage} |`;
    })
  ].join("\n");
}

function extractActivity(readme) {
  const startIndex = readme.indexOf(ACTIVITY_START);
  const endIndex = readme.indexOf(ACTIVITY_END);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return null;
  return readme.slice(startIndex + ACTIVITY_START.length, endIndex).trim();
}

async function readExistingActivity(readmePath) {
  try {
    const existing = await readFile(readmePath, "utf8");
    return extractActivity(existing);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function generateProfileReadme({ config, manifest, readmePath }) {
  const existingActivity = await readExistingActivity(readmePath);
  const activity = existingActivity || "_Recent public activity will appear here after the workflow runs._";
  const activitySection = config.activity.enabled
    ? `\n## Recent Activity\n\n${ACTIVITY_START}\n${activity}\n${ACTIVITY_END}\n`
    : "";
  const featuredWorkSection = config.projects.length > 0
    ? `\n## Featured Work\n\n${renderProjects(config.projects)}\n`
    : "";
  const toolkitGroups = [
    ["Languages", ["TypeScript", "JavaScript", "SQL"]],
    ["Frontend", ["React", "React Native", "Next.js", "Tailwind CSS"]],
    ["Backend", ["Node.js", "NextAuth", "Prisma"]],
    ["Databases", ["PostgreSQL", "SQL Server"]],
    ["Tools", ["Git", "GitHub Actions", "Automation"]]
  ];
  const technologyBadges = {
    "TypeScript": "https://img.shields.io/badge/TypeScript-0B1220?style=for-the-badge&logo=typescript&logoColor=3178C6",
    "JavaScript": "https://img.shields.io/badge/JavaScript-0B1220?style=for-the-badge&logo=javascript&logoColor=F7DF1E",
    "SQL": "https://img.shields.io/badge/SQL-0B1220?style=for-the-badge&logo=databricks&logoColor=FF3621",
    "React": "https://img.shields.io/badge/React-0B1220?style=for-the-badge&logo=react&logoColor=61DAFB",
    "React Native": "https://img.shields.io/badge/React_Native-0B1220?style=for-the-badge&logo=react&logoColor=00D8FF",
    "Next.js": "https://img.shields.io/badge/Next.js-0B1220?style=for-the-badge&logo=next.js&logoColor=FFFFFF",
    "Tailwind CSS": "https://img.shields.io/badge/Tailwind_CSS-0B1220?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4",
    "Node.js": "https://img.shields.io/badge/Node.js-0B1220?style=for-the-badge&logo=node.js&logoColor=5FA04E",
    "NextAuth": "https://img.shields.io/badge/NextAuth-0B1220?style=for-the-badge&logo=auth0&logoColor=EB5424",
    "Prisma": "https://img.shields.io/badge/Prisma-0B1220?style=for-the-badge&logo=prisma&logoColor=2D3748",
    "PostgreSQL": "https://img.shields.io/badge/PostgreSQL-0B1220?style=for-the-badge&logo=postgresql&logoColor=4169E1",
    "SQL Server": "https://img.shields.io/badge/SQL_Server-0B1220?style=for-the-badge&logo=microsoftsqlserver&logoColor=CC2927",
    "Git": "https://img.shields.io/badge/Git-0B1220?style=for-the-badge&logo=git&logoColor=F05032",
    "GitHub Actions": "https://img.shields.io/badge/GitHub_Actions-0B1220?style=for-the-badge&logo=githubactions&logoColor=2088FF",
    "Automation": "https://img.shields.io/badge/Automation-0B1220?style=for-the-badge&logo=n8n&logoColor=EA4B71"
  };
  const toolkit = toolkitGroups.map(([category, technologies]) => {
    const available = technologies.filter((technology) => config.techStack.includes(technology));
    const badges = available.map((technology) => `  <img alt="${technology}" src="${technologyBadges[technology]}">`).join("\n");
    return `### ${category}\n\n<p>\n${badges}\n</p>`;
  }).join("\n\n");
  const about = config.profile.about.join("\n\n");

  const readme = `<!-- Generated by GitHub Profile Agent Console. Edit profile.config.json, then run npm run generate. -->
<p align="center">
  <picture>
    <source media="(max-width: 760px) and (prefers-color-scheme: dark)" srcset="./assets/hero/${manifest.assets.mobileDark}">
    <source media="(max-width: 760px)" srcset="./assets/hero/${manifest.assets.mobileLight}">
    <source media="(prefers-color-scheme: dark)" srcset="./assets/hero/${manifest.assets.desktopDark}">
    <source media="(prefers-color-scheme: light)" srcset="./assets/hero/${manifest.assets.desktopLight}">
    <img src="./assets/hero/${manifest.assets.desktopDark}" alt="${config.profile.name} - ${config.profile.headline}" width="100%">
  </picture>
</p>

<p align="center">
${renderLinks(config.links)}
</p>

## About Me

${about}

## Current Focus

${renderFocus(config.focus)}

${featuredWorkSection}
## AI Engineering Direction

${config.research.narrative}

## Languages & Toolkit

${toolkit}

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api/top-langs/?username=${config.profile.username}&layout=compact&hide_border=true&theme=github_dark&langs_count=10">
    <source media="(prefers-color-scheme: light)" srcset="https://github-readme-stats.vercel.app/api/top-langs/?username=${config.profile.username}&layout=compact&hide_border=true&langs_count=10">
    <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${config.profile.username}&layout=compact&hide_border=true&theme=github_dark&langs_count=10" alt="Most-used public repository languages">
  </picture>
</p>

${activitySection}
## Contribution Activity

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${config.profile.username}/${config.profile.username}/output/github-contribution-grid-snake-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${config.profile.username}/${config.profile.username}/output/github-contribution-grid-snake.svg">
    <img width="100%" src="https://raw.githubusercontent.com/${config.profile.username}/${config.profile.username}/output/github-contribution-grid-snake.svg" alt="${config.profile.name} contribution snake animation">
  </picture>
</p>

---

<p align="center">
  ${config.footer}
</p>
`;

  await writeFile(resolve(readmePath), readme);
  return readme;
}
