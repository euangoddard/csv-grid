export type Format = 'csv' | 'tsv'

export function delimiterFor(format: Format): string {
  return format === 'tsv' ? '\t' : ','
}

export function formatFromFileName(name: string): Format {
  return name.toLowerCase().endsWith('.tsv') ? 'tsv' : 'csv'
}
