/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: bypass for now */

import util from "node:util";
import {
  ZUpsertProgramWithRequirements,
  ZUpsertRequirements,
} from "@albert-plus/server/convex/http";
import { DrizzleD1Database } from "drizzle-orm/d1";
import * as z from "zod/mini";

export async function bulletinDiscoverSchools(url) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const html = await res.text();
  const regex = /<ul[^>]*class=["']nav levelone["'][^>]*>[\s\S]*?<\/ul>/gi;
  const matches = html.match(regex) || [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const hrefs = [];
  const validSchools = Object.values(
    ZUpsertProgramWithRequirements.shape.school.options
  );
  for (const section of matches) {
    let match;
    while (true) {
      match = linkRegex.exec(section);
      if (match === null) break;
      const url = match[1].trim();
      const name = match[2].replace(/<[^>]+>/g, "").trim();
      if (!validSchools.includes(name)) {
        continue;
      }
      hrefs.push([name, url]);
    }
  }
  return hrefs;
}

export async function scrapeProgramsListFromSchool(urlarray, db, env) {
  const base = "https://bulletins.nyu.edu";
  let target;
  const schoolbaseinfo = ZUpsertProgramWithRequirements.parse({
    name: "",
    level: "undergraduate",
    school: urlarray[0],
    programUrl: "",
    requirements: [],
  });
  const programlist = [];
  if (urlarray[1].startsWith("/undergraduate")) {
    schoolbaseinfo.level = "undergraduate";
  } else {
    schoolbaseinfo.level = "graduate";
  }

  try {
    try {
      target = new URL(urlarray[1], base);
    } catch {
      target = new URL(base);
    }
    const res = await fetch(target);
    const html = await res.text();
    const sitemapMatch = html.match(
      /<div\s+class=["']sitemap["'][^>]*>[\s\S]*?<\/div>/i
    );
    if (!sitemapMatch) {
      return [schoolbaseinfo, []];
    }
    const sitemapHtml = sitemapMatch[0];

    const linkRe = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;

    let m;
    while (true) {
      m = linkRe.exec(sitemapHtml);
      if (m === null) break;
      const href = m[1].trim();
      const name = m[2]
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .trim();
      const absolute = new URL(href, base).toString();
      programlist.push([name, absolute]);
    }
  } catch (err) {
    console.error("Error scraping program:", err);
  }
  return [schoolbaseinfo, programlist];
}

export async function scrapeProgramsFromProgramsList(programarray, db, env) {
  const [schoolbaseinfo, programlist] = programarray;

  const programs = programlist.map(([name, href]) => ({
    name,
    level: schoolbaseinfo.level,
    school: schoolbaseinfo.school,
    programUrl: href,
    requirements: [],
  }));
  return programs;
}

export async function scrapeRequirements(programdet, db, env) {
  const base = "https://bulletins.nyu.edu";
  let target;
  try {
    target = new URL(programdet.programUrl, base);
  } catch {
    target = new URL(base);
  }
  const res = await fetch(target);
  const html = await res.text();

  const stripTags = (s) => s.replace(/<[^>]*>/g, "");
  const htmlunescape = (s) =>
    s
      .replace(/&nbsp;|&#160;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&ndash;|&#8211;/g, "–")
      .replace(/&mdash;|&#8212;/g, "—")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  const cleanText = (s) =>
    htmlunescape(stripTags(s || ""))
      .replace(/\s+/g, " ")
      .trim();

  const curId = 'id="curriculumtextcontainer"';
  let start = html.indexOf(curId);

  start = html.lastIndexOf("<div", start);
  let end =
    html.indexOf('id="sampleplanofstudytextcontainer"', start) !== -1
      ? html.indexOf('id="sampleplanofstudytextcontainer"', start)
      : html.indexOf('id="outcomestextcontainer"', start);
  if (end === -1) end = html.indexOf('id="policiestextcontainer"', start);
  if (end === -1) end = html.length;

  const curriculumHtml = html.slice(start, end);
  let totalCredits = null;
  const curriculumText = cleanText(curriculumHtml);
  const totalMatch = curriculumText.match(/total credits[^0-9]*([0-9]+)/i);
  if (totalMatch) {
    totalCredits = Number.parseInt(totalMatch[1], 10);
  }

  const tableRe =
    /<table\b[^>]*class=["'][^"']*\bsc_courselist\b[^"']*["'][^>]*>[\s\S]*?<\/table>/gi;

  const getPart = (src, pat) => {
    const m = src.match(pat);
    return m ? m[0] : "";
  };
  const colgroupRe = /<colgroup[\s\S]*?<\/colgroup>/i;
  const theadRe = /<thead[\s\S]*?<\/thead>/i;
  const tbodyRe = /<tbody[\s\S]*?<\/tbody>/i;
  const trRe = /<tr\b[^>]*>[\s\S]*?<\/tr>/gi;

  const isBoldHeaderRow = (trHtml) => {
    if (/\bclass=["'][^"']*\bareaheader\b[^"']*["']/.test(trHtml)) return true;
    if (/<strong\b[^>]*>[\s\S]*?<\/strong>/i.test(trHtml)) return true;
    if (/<b\b[^>]*>[\s\S]*?<\/b>/i.test(trHtml)) return true;
    if (
      /<span\b[^>]*\bcourselistcomment\b[^"']*\bareaheader\b[^"']*["'][^>]*>[\s\S]*?<\/span>/i.test(
        trHtml
      )
    )
      return true;
    return false;
  };

  const headerNameFromTr = (trHtml) => {
    let m = trHtml.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i);
    if (m) return cleanText(m[1]);
    m = trHtml.match(/<b\b[^>]*>([\s\S]*?)<\/b>/i);
    if (m) return cleanText(m[1]);
    m = trHtml.match(
      /<span\b[^>]*\bcourselistcomment\b[^"']*\bareaheader\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
    );
    if (m) return cleanText(m[1]);
    return cleanText(trHtml);
  };

  const rebuildTable = (tableOpen, colgroup, thead, rowsHtml) => {
    const openTag = (tableOpen.match(/<table\b[^>]*>/i) || ["<table>"])[0];
    return `${openTag}${colgroup || ""}${
      thead || ""
    }<tbody>${rowsHtml}</tbody></table>`;
  };

  const sections = [];
  let m;
  while (true) {
    m = tableRe.exec(curriculumHtml);
    if (m === null) break;
    const tableHtml = m[0];
    const tableOpenTag = (tableHtml.match(/<table\b[^>]*>/i) || ["<table>"])[0];
    const colgroup = getPart(tableHtml, colgroupRe);
    const thead = getPart(tableHtml, theadRe);
    const tbodyFull = getPart(tableHtml, tbodyRe) || tableHtml;

    const tbodyInner = (tbodyFull.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i) || [
      null,
      "",
    ])[1];
    const trs = tbodyInner.match(trRe) || [];

    let currentName = null;
    let currentRows = [];

    const flush = () => {
      if (currentName && currentRows.length) {
        const sectionTable = rebuildTable(
          tableOpenTag,
          colgroup,
          thead,
          currentRows.join("")
        );
        sections.push([currentName, sectionTable]);
      }
      currentName = null;
      currentRows = [];
    };

    for (let i = 0; i < trs.length; i++) {
      const tr = trs[i];

      if (isBoldHeaderRow(tr)) {
        flush();
        currentName = headerNameFromTr(tr) || "Requirements";
        currentRows.push(tr);
      } else if (currentName) {
        currentRows.push(tr);
      }
    }
    flush();
  }

  const extractPieces = (tableHtml) => {
    const getPart = (src, pat) => {
      const m = src.match(pat);
      return m ? m[0] : "";
    };
    const tbodyFull = getPart(tableHtml, /<tbody[\s\S]*?<\/tbody>/i) || "";
    const tbodyInner = (tbodyFull.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i) || [
      null,
      "",
    ])[1];
    const trs = tbodyInner.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || [];
    return trs;
  };

  const mergedMap = new Map();
  for (const [name, tableHtml] of sections) {
    const trs = extractPieces(tableHtml);
    if (!mergedMap.has(name)) {
      mergedMap.set(name, trs);
    } else {
      const arr = mergedMap.get(name);
      mergedMap.set(name, arr.concat(trs));
    }
  }

  const categorizedSections = [];

  for (const [sectionName, trs] of mergedMap.entries()) {
    const courses = [];
    for (const tr of trs) {
      if (/areaheader|listsum/i.test(tr)) continue;
      const codeMatch = tr.match(/<a[^>]*>([^<]+)<\/a>/i);
      const code = codeMatch ? cleanText(codeMatch[1]) : "";
      const titleMatch = tr.match(/<td[^>]*>(?!<a)[\s\S]*?<\/td>/i);
      let title = "";
      if (titleMatch) title = cleanText(titleMatch[0]);
      const creditsMatch = tr.match(
        /<td[^>]*class=["'][^"']*\bhourscol\b[^"']*["'][^>]*>([\s\S]*?)<\/td>/i
      );
      const creditsRaw = creditsMatch ? cleanText(creditsMatch[1]) : "";
      const credits = creditsRaw ? parseFloat(creditsRaw) || null : null;

      let type = "course";
      if (/orclass/i.test(tr)) {
        type = "alternative";
      }
      if (/courselistcomment/i.test(tr) && !code) {
        if (credits !== null) {
          type = "options";
        } else {
          type = "comment";
        }
      }

      if (type === "comment" && !code && credits === null) {
        continue;
      }

      courses.push({
        type,
        code,
        title,
        credits,
      });
    }

    for (let i = 0; i < courses.length; i++) {
      const row = courses[i];
      if (
        (row.type === "comment" || row.type === "options") &&
        row.title.toLowerCase().includes("select")
      ) {
        let j = i + 1;
        while (j < courses.length && courses[j].type === "course") {
          courses[j].type = "alternative";
          j++;
        }
      }
    }

    for (const row of courses) {
      if (row.type === "course") {
        row.type = "required";
      }
    }

    categorizedSections.push([sectionName, courses]);
  }

  const filteredSections = categorizedSections.filter(
    ([sectionName]) => sectionName !== "General Education Requirements"
  );

  if (totalCredits !== null) {
    filteredSections.push([
      "Total Credits",
      [
        {
          type: "",
          code: "",
          title: "Total Credits",
          credits: totalCredits,
        },
      ],
    ]);
  }

  programdet.requirements = filteredSections;
  return programdet;
}

async function main() {
  const message = await bulletinDiscoverSchools("https://bulletins.nyu.edu");
  const finalarray = [];
  for (const item of message) {
    const plist = await scrapeProgramsListFromSchool(item);
    const programs = await scrapeProgramsFromProgramsList(plist);
    finalarray.push(programs);
  }
  const flatArray = finalarray.flat();
  //Test
  let i = 0;
  for (i = 0; i < flatArray.length; i++) {
    console.log(
      util.inspect(await scrapeRequirements(flatArray[i]), {
        depth: null,
        maxArrayLength: null,
        colors: true,
      })
    );
  }
}

//33 is Classical Civilization Minor
//39 is CS/DS
//40 is CS (BA), 42 is Computer Science / Computer Engineering
//53 is Economics (BA)
//85 is History (BA), 89 is Italian (BA)
//120 is MCB Minor

main().catch(console.error);
