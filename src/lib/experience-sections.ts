// ---- Structured experience content: six canonical sections ----
//
// Experience content is stored as free text with an optional structured
// prefix. Sections are written as Markdown-ish headings on their own line,
// e.g. "## Startup Cost". Anything before the first "## " heading is the
// intro/overview.
//
// This module is shared by:
//  - the experience detail page (renders sections as cards)
//  - the share/edit forms (builds `content` from intro + section fields)
//  - the edit form (parses stored `content` back into the fields)

export interface ExperienceSectionDef {
  /** Stable machine key used in form state. */
  key: string;
  /** Canonical heading text, e.g. "Startup Cost". */
  heading: string;
  /** Icon-ish label (emoji — no extra deps). */
  icon: string;
  /** Short helper shown next to the form field. */
  hint: string;
}

// Platform-wide canonical section order.
export const EXPERIENCE_SECTIONS: ExperienceSectionDef[] = [
  {
    key: "startup_cost",
    heading: "Startup Cost",
    icon: "₹",
    hint: "How much did you need to get started?",
  },
  {
    key: "timeline",
    heading: "Timeline",
    icon: "📅",
    hint: "How long did it take, and what were the key milestones?",
  },
  {
    key: "monthly_income",
    heading: "Monthly Income",
    icon: "📈",
    hint: "What does the income/earnings picture look like?",
  },
  {
    key: "what_i_teach",
    heading: "What I'll Teach",
    icon: "🎯",
    hint: "What will a PathMate learn on a call with you?",
  },
  {
    key: "who_this_is_for",
    heading: "Who This Is For",
    icon: "👥",
    hint: "Who would get the most out of booking a call with you?",
  },
  {
    key: "what_you_get",
    heading: "What You'll Get",
    icon: "🎁",
    hint: "What does a booked call include?",
  },
];

/** Lookup by normalized heading text (lowercase, trailing colon stripped). */
const SECTION_BY_HEADING = new Map<string, ExperienceSectionDef>(
  EXPERIENCE_SECTIONS.map((s) => [normalizeHeading(s.heading), s]),
);

function normalizeHeading(heading: string): string {
  return heading.trim().replace(/:$/, "").toLowerCase();
}

export interface ParsedSection {
  /** The heading text exactly as written in the content, e.g. "Startup Cost". */
  heading: string;
  /** Icon from the canonical def, or a generic bullet for unknown headings. */
  icon: string;
  /** The section body (trimmed). */
  body: string;
}

export interface ParsedExperienceContent {
  /** Text before the first "## " heading (trimmed). Empty for legacy content. */
  intro: string;
  /** Parsed sections, in document order. Empty for legacy content. */
  sections: ParsedSection[];
  /** True when the content used the structured "## Heading" format. */
  isStructured: boolean;
}

/**
 * Parse stored `content` into an intro plus structured sections.
 *
 * Splits on lines that start with "## ". Any text before the first heading
 * becomes the intro. Unknown headings are preserved (with a generic icon) so
 * no content is ever dropped. Content without any "## " heading is treated as
 * legacy: the whole thing becomes the intro and `sections` is empty.
 */
export function parseExperienceContent(content: string): ParsedExperienceContent {
  if (!content) return { intro: "", sections: [], isStructured: false };

  const lines = content.split("\n");
  const headingIdx: number[] = [];
  lines.forEach((line, i) => {
    if (line.startsWith("## ")) headingIdx.push(i);
  });

  if (headingIdx.length === 0) {
    return {
      intro: content.trim(),
      sections: [],
      isStructured: false,
    };
  }

  const intro = lines
    .slice(0, headingIdx[0])
    .join("\n")
    .trim();

  const sections: ParsedSection[] = [];
  headingIdx.forEach((start, i) => {
    const end = i + 1 < headingIdx.length ? headingIdx[i + 1] : lines.length;
    const heading = lines[start].replace(/^##\s+/, "").trim();
    const body = lines.slice(start + 1, end).join("\n").trim();
    if (!body) return; // skip empty sections
    const def = SECTION_BY_HEADING.get(normalizeHeading(heading));
    sections.push({
      heading,
      icon: def?.icon ?? "•",
      body,
    });
  });

  return { intro, sections, isStructured: true };
}

/**
 * Build `content` from an intro plus the six canonical section fields.
 * Sections with non-empty (trimmed) values are appended in canonical order as
 * "\n\n## <Heading>\n<value>". The intro is stored as-is when non-empty.
 */
export function buildExperienceContent(
  intro: string,
  sections: Record<string, string>,
): string {
  const parts: string[] = [];
  const introTrimmed = intro.trim();
  if (introTrimmed) parts.push(introTrimmed);

  for (const def of EXPERIENCE_SECTIONS) {
    const value = (sections[def.key] ?? "").trim();
    if (value) {
      parts.push(`## ${def.heading}\n${value}`);
    }
  }

  return parts.join("\n\n");
}

/** Initial empty section field state (all six keys → ""). */
export function emptySectionFields(): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const def of EXPERIENCE_SECTIONS) fields[def.key] = "";
  return fields;
}

/**
 * Extract the six canonical section fields from stored `content`, mirroring
 * parseExperienceContent so the edit form round-trips cleanly.
 */
export function sectionFieldsFromContent(
  content: string,
): { intro: string; fields: Record<string, string> } {
  const parsed = parseExperienceContent(content);
  const fields = emptySectionFields();
  for (const section of parsed.sections) {
    const def = SECTION_BY_HEADING.get(normalizeHeading(section.heading));
    if (def) fields[def.key] = section.body;
  }
  return { intro: parsed.intro, fields };
}
