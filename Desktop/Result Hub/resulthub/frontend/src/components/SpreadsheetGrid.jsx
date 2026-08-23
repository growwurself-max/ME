import { useEffect, useMemo, useRef, useState } from 'react';

// ---- Shared paste parsing (mirrors the backend excelService) ----

const DELIMITERS = ['\t', ',', ';', '|'];

export function parseSpreadsheetText(text) {
  const cleaned = String(text ?? '').replace(/^\uFEFF/, '');
  if (!cleaned.trim()) return [];
  const firstLine = cleaned.split(/\r?\n/).find((line) => line.trim() !== '');
  let delimiter = '\t';
  if (firstLine) {
    let bestCount = 0;
    for (const d of DELIMITERS) {
      const count = firstLine.split(d).length - 1;
      if (count > bestCount) {
        delimiter = d;
        bestCount = count;
      }
    }
  }
  return cleaned
    .split(/\r?\n/)
    .map((line) => splitLine(line, delimiter))
    .map((row) => row.map((cell) => String(cell ?? '').trim()))
    .filter((row) => !row.every((cell) => cell === ''));
}

function splitLine(line, delimiter) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

const normHeader = (v) => String(v ?? '')
  .replace(/^\uFEFF/, '')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .trim().toLowerCase()
  .replace(/[\s_\-./()#]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Excel / Google-Sheets style editable grid.
 *
 * Props:
 *  - columns: string[]               column headers (fixed, sticky, non-editable)
 *  - rows: string[][]                controlled cell values
 *  - onChange: (rows) => void        called whenever cell values change
 *  - cellStatus: (r, c) => object    optional per-cell status: { tone: 'ok'|'error'|'warn', message }
 *  - readOnly: boolean
 *
 * Behaviour:
 *  - Fixed header row (never editable), sticky while scrolling.
 *  - Arrow-key / Tab / Enter navigation, Enter moves down.
 *  - Multi-cell paste from a spreadsheet: split rows & columns, auto-create
 *    rows, and automatically drop a pasted header row.
 *  - A blank row is always shown first so pasting has an obvious target.
 *  - Row delete button (hover the row number) and a right-click context menu
 *    (Delete row / Clear row / Insert row below / Clear cell).
 */
export default function SpreadsheetGrid({
  columns = [],
  rows = [],
  onChange,
  cellStatus,
  readOnly = false,
  matchHeaderRow,
}) {
  const [active, setActive] = useState({ r: 0, c: 0 });
  const [menu, setMenu] = useState(null);
  const inputRefs = useRef({});

  const blankRow = columns.map(() => '');
  // Always show a first empty row so pasting has an obvious target cell.
  const displayRows = rows.length === 0 ? [blankRow] : rows;

  const normalize = (r, c) => (rows[r]?.[c] ?? '');

  const focus = (r, c, select = true) => {
    setActive({ r, c });
    const el = inputRefs.current[`${r}-${c}`];
    if (el) {
      el.focus();
      if (select) el.select();
    }
  };

  const updateCell = (r, c, value) => {
    if (readOnly) return;
    const next = rows.map((row) => [...row]);
    while (next.length <= r) next.push(new Array(columns.length).fill(''));
    while (next[r].length <= c) next[r].push('');
    next[r][c] = value;
    onChange?.(next);
  };

  const deleteRow = (r) => {
    if (readOnly) return;
    const next = rows.filter((_, i) => i !== r);
    onChange?.(next);
    setActive({ r: Math.min(r, next.length - 1), c: 0 });
  };

  const clearRow = (r) => {
    if (readOnly) return;
    const next = rows.map((row, i) => (i === r ? columns.map(() => '') : [...row]));
    onChange?.(next);
  };

  const insertRowBelow = (r) => {
    if (readOnly) return;
    const next = [];
    rows.forEach((row, i) => {
      next.push([...row]);
      if (i === r) next.push(new Array(columns.length).fill(''));
    });
    onChange?.(next);
    setActive({ r: r + 1, c: 0 });
  };

  const clearCell = (r, c) => {
    if (readOnly) return;
    updateCell(r, c, '');
  };

  const handlePaste = (event) => {
    if (readOnly) return;
    const text = event.clipboardData?.getData('text/plain') || '';
    if (!text.trim()) return;
    event.preventDefault();
    let pasted = parseSpreadsheetText(text);
    if (pasted.length === 0) return;

    // If the pasted first row matches the fixed column headers, treat it as a
    // pasted header (copied together with data from Excel/Sheets) and drop it.
    // Consumers may supply a custom matcher (e.g. alias-tolerant subject
    // headers like "Maths" for "Mathematics"); the default is exact matching.
    const first = pasted[0];
    const headerMatch = matchHeaderRow
      ? matchHeaderRow(first, columns)
      : columns.length > 0 &&
        first.length >= columns.length &&
        first.every((cell, i) => normHeader(cell) === normHeader(columns[i]));
    if (headerMatch) pasted = pasted.slice(1);
    if (pasted.length === 0) return;

    const { r, c } = active;
    const next = rows.map((row) => [...row]);
    pasted.forEach((rowData, dr) => {
      const targetR = r + dr;
      while (next.length <= targetR) next.push(new Array(columns.length).fill(''));
      rowData.forEach((cell, dc) => {
        const targetC = c + dc;
        while (next[targetR].length <= targetC) next[targetR].push('');
        if (targetC < columns.length) next[targetR][targetC] = cell;
      });
    });
    onChange?.(next);
    setActive({
      r: Math.min(r + pasted.length - 1, next.length - 1),
      c: Math.min(c + pasted[0].length - 1, columns.length - 1),
    });
  };

  const handleKeyDown = (event, r, c) => {
    if (readOnly) return;
    const target = event.target;
    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          if (c > 0) focus(r, c - 1);
          else if (r > 0) focus(r - 1, columns.length - 1);
          else focus(0, 0);
        } else {
          if (c < columns.length - 1) focus(r, c + 1);
          else {
            const next = rows.map((row) => [...row]);
            if (r === next.length - 1) {
              next.push(new Array(columns.length).fill(''));
              onChange?.(next);
            }
            focus(r + 1, 0);
          }
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (r === rows.length - 1) {
          const next = rows.map((row) => [...row]);
          next.push(new Array(columns.length).fill(''));
          onChange?.(next);
          focus(r + 1, c);
        } else {
          focus(r + 1, c);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        focus(Math.min(r + 1, Math.max(0, rows.length - 1)), c);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focus(Math.max(r - 1, 0), c);
        break;
      case 'ArrowLeft':
        if (target.selectionStart === 0 && c > 0) {
          event.preventDefault();
          focus(r, c - 1);
        }
        break;
      case 'ArrowRight':
        if (target.selectionEnd === target.value.length && c < columns.length - 1) {
          event.preventDefault();
          focus(r, c + 1);
        }
        break;
      default:
        break;
    }
  };

  // Close the context menu on any outside interaction.
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  // Auto-size each column from the header and longest cell content.
  const colWidths = useMemo(() => {
    return columns.map((header, ci) => {
      let max = String(header).length;
      displayRows.forEach((row) => {
        max = Math.max(max, String(row[ci] ?? '').length);
      });
      return Math.min(Math.max(max + 3, 16), 340);
    });
  }, [columns, displayRows]);

  const statusOf = (r, c) => cellStatus?.(r, c) || null;

  return (
    <div className="overflow-auto rounded-xl border border-slate-300 dark:border-slate-700" data-spreadsheet>
      <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th
              className="sticky top-0 z-20 border-b border-r border-slate-300 bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              style={{ minWidth: 56, width: 56 }}
            >
              #
            </th>
            {columns.map((header, ci) => (
              <th
                key={ci}
                className="sticky top-0 z-20 whitespace-nowrap border-b border-r border-slate-300 bg-slate-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                style={{ minWidth: colWidths[ci] }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, r) => (
            <tr key={r} className={r % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'}>
              <td className="border-b border-r border-slate-200 bg-slate-50 px-1 py-0 text-center text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="group relative flex h-9 items-center justify-center">
                  <span>{r + 1}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={`Delete row ${r + 1}`}
                      title="Delete row"
                      className="absolute right-0 hidden h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-rose-100 hover:text-rose-600 group-hover:flex dark:hover:bg-rose-900/40 dark:hover:text-rose-400"
                      onClick={() => deleteRow(r)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </td>
              {columns.map((_, c) => {
                const status = statusOf(r, c);
                let toneClass = 'bg-white dark:bg-slate-900';
                if (status?.tone === 'error') {
                  toneClass = 'bg-rose-50 dark:bg-rose-950/50';
                } else if (status?.tone === 'warn') {
                  toneClass = 'bg-amber-50 dark:bg-amber-950/40';
                } else if (status?.tone === 'ok') {
                  toneClass = 'bg-emerald-50/60 dark:bg-emerald-950/30';
                }
                return (
                  <td
                    key={c}
                    className={`border-b border-r border-slate-200 p-0 dark:border-slate-800 ${r % 2 === 1 && !status ? 'bg-slate-50 dark:bg-slate-800/40' : ''}`}
                    onContextMenu={(e) => {
                      if (readOnly) return;
                      e.preventDefault();
                      setMenu({ r, c, x: e.clientX, y: e.clientY });
                    }}
                  >
                    <input
                      ref={(el) => {
                        inputRefs.current[`${r}-${c}`] = el;
                      }}
                      className={`h-9 w-full min-w-0 whitespace-nowrap rounded-none border-0 px-3 text-sm outline-none transition-colors focus:bg-brand-50 focus:ring-2 focus:ring-inset focus:ring-brand-500 dark:focus:bg-brand-950/40 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${toneClass} ${
                        readOnly ? 'cursor-default' : 'cursor-text'
                      } ${r % 2 === 1 && !status ? 'bg-slate-50 dark:bg-slate-800/40' : ''} ${r % 2 === 0 && !status ? 'bg-white dark:bg-slate-900' : ''}`}
                      value={normalize(r, c)}
                      title={status?.message || ''}
                      placeholder={String(normalize(r, c)).trim() === '' ? 'Paste or type here' : ''}
                      onChange={(e) => updateCell(r, c, e.target.value)}
                      onFocus={() => setActive({ r, c })}
                      onKeyDown={(e) => handleKeyDown(e, r, c)}
                      onPaste={handlePaste}
                      readOnly={readOnly}
                      aria-label={`${columns[c]} row ${r + 1}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {menu && (
        <div
          className="fixed z-50 min-w-[10rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-800"
          style={{
            left: Math.min(menu.x, window.innerWidth - 180),
            top: Math.min(menu.y, window.innerHeight - 180),
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { deleteRow(menu.r); setMenu(null); }}
          >
            Delete row
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { clearRow(menu.r); setMenu(null); }}
          >
            Clear row
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { insertRowBelow(menu.r); setMenu(null); }}
          >
            Insert row below
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { clearCell(menu.r, menu.c); setMenu(null); }}
          >
            Clear cell
          </button>
        </div>
      )}
    </div>
  );
}