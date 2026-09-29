// components/ai_assistant/Markdown.jsx
//
// Small, dependency-free markdown renderer for AI replies. It covers what the
// assistant actually produces — headings, bold/italic, inline code, bullet
// and numbered lists, GitHub-style tables, code blocks and paragraphs — and
// builds React elements directly (no dangerouslySetInnerHTML), so model
// output can never inject HTML or scripts.
import React from "react";

const S = {
  p: { margin: "0 0 8px", lineHeight: 1.6 },
  h: { margin: "10px 0 6px", fontWeight: 700, color: "#0f2433" },
  list: { margin: "0 0 8px", paddingLeft: 22, lineHeight: 1.6 },
  code: { background: "#eef2f6", borderRadius: 4, padding: "1px 5px", fontSize: "0.9em", fontFamily: "Consolas, monospace" },
  pre: { background: "#0f2433", color: "#e8eef5", borderRadius: 8, padding: "10px 12px", overflowX: "auto", fontSize: 12.5, margin: "0 0 8px" },
  tableWrap: { overflowX: "auto", margin: "4px 0 10px", border: "1px solid #e3e8ef", borderRadius: 8 },
  table: { borderCollapse: "collapse", width: "100%", fontSize: 13 },
  th: { background: "#f5f7fa", textAlign: "left", padding: "7px 10px", borderBottom: "1px solid #e3e8ef", fontWeight: 700, whiteSpace: "nowrap" },
  td: { padding: "6px 10px", borderBottom: "1px solid #eef1f4", verticalAlign: "top" },
};

/** Inline formatting: `code`, **bold**, *italic*. */
const inline = (text, keyPrefix = "i") => {
  const out = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (tok.startsWith("`")) out.push(<code key={key} style={S.code}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("**")) out.push(<strong key={key}>{inline(tok.slice(2, -2), key)}</strong>);
    else out.push(<em key={key}>{inline(tok.slice(1, -1), key)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const splitRow = (line) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

const isTableSep = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line || "");

const Markdown = ({ text }) => {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;

    if (!line.trim()) { i++; continue; }

    // fenced code block
    if (line.trim().startsWith("```")) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) body.push(lines[i++]);
      i++;
      blocks.push(<pre key={key} style={S.pre}>{body.join("\n")}</pre>);
      continue;
    }

    // heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const size = [18, 16, 15, 14][h[1].length - 1];
      blocks.push(<div key={key} style={{ ...S.h, fontSize: size }}>{inline(h[2], key)}</div>);
      i++;
      continue;
    }

    // table: header row followed by a |---|---| separator
    if (line.includes("|") && isTableSep(lines[i + 1])) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(splitRow(lines[i++]));
      blocks.push(
        <div key={key} style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{head.map((c, j) => <th key={j} style={S.th}>{inline(c, `${key}h${j}`)}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{head.map((_, j) => <td key={j} style={S.td}>{inline(r[j] || "", `${key}r${ri}c${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // bullet or numbered list
    const listRe = /^\s*([-*•]|\d+[.)])\s+(.*)$/;
    if (listRe.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line);
      const items = [];
      // Stop when a bullet list turns into a numbered one (or vice versa).
      while (i < lines.length && listRe.test(lines[i]) && /^\s*\d+[.)]/.test(lines[i]) === ordered) {
        items.push(lines[i].match(listRe)[2]);
        i++;
      }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={key} style={S.list}>
          {items.map((it, j) => <li key={j}>{inline(it, `${key}l${j}`)}</li>)}
        </Tag>,
      );
      continue;
    }

    // paragraph: consecutive plain lines, kept as line breaks
    const para = [];
    while (
      i < lines.length && lines[i].trim() && !listRe.test(lines[i]) && !/^#{1,4}\s/.test(lines[i])
      && !lines[i].trim().startsWith("```") && !(lines[i].includes("|") && isTableSep(lines[i + 1]))
    ) {
      para.push(lines[i++]);
    }
    blocks.push(
      <p key={key} style={S.p}>
        {para.map((pl, j) => (
          <React.Fragment key={j}>{j > 0 && <br />}{inline(pl, `${key}p${j}`)}</React.Fragment>
        ))}
      </p>,
    );
  }

  // The chat bubble uses white-space: pre-wrap for plain text; reset it here
  // so tables and lists lay out normally (code blocks keep <pre> spacing).
  return <div style={{ whiteSpace: "normal" }}>{blocks}</div>;
};

export default Markdown;
