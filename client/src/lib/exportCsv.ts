/**
 * exportToCsv — client-side CSV download utility.
 *
 * Usage:
 *   exportToCsv([{ Name: 'Alice', Score: 99 }, ...], 'report');
 *   // Downloads "report-2026-04-13.csv"
 */

export function exportToCsv(rows: Record<string, unknown>[], filename = 'export'): void {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const escape = (val: unknown): string => {
        const str = val == null ? '' : String(val);
        // Wrap in quotes if the value contains commas, quotes or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvLines = [
        headers.map(escape).join(','),
        ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
    ];

    const blob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${filename}-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
