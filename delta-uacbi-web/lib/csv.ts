export function escapeCsv(value: string | number | null | undefined) {
  const str = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(str)) {
    // Neutraliza formula injection (Excel/Sheets ejecutan valores que empiezan con estos caracteres).
    return escapeCsv(`'${str}`);
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
