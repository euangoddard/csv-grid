type CellValue = string | number | boolean | null

interface DataGridXLOptions {
  data?: CellValue[][]
  columns?: Array<{
    title?: string
    source?: string | number
    width?: number
    align?: 'left' | 'center' | 'right'
  }>
}

interface DataGridXLEvents {
  on(event: 'documentchange', callback: () => void): void
  on(event: string, callback: (...args: unknown[]) => void): void
}

declare class DataGridXL {
  constructor(containerId: string, options?: DataGridXLOptions)
  getData(): CellValue[][]
  setData(data: CellValue[][], columns?: DataGridXLOptions['columns']): void
  events: DataGridXLEvents
  static createEmptyData(rows: number, cols: number): CellValue[][]
}

interface Window {
  DataGridXL: typeof DataGridXL
}
