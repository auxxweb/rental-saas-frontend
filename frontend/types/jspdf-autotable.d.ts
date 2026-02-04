import { jsPDF } from 'jspdf'

declare module 'jspdf-autotable' {
  export interface UserOptions {
    head?: any[][]
    body?: any[][]
    foot?: any[][]
    startY?: number
    margin?: number | { top?: number; right?: number; bottom?: number; left?: number }
    pageBreak?: 'auto' | 'avoid' | 'always'
    rowPageBreak?: 'auto' | 'avoid'
    tableWidth?: 'auto' | 'wrap' | number
    showHead?: 'everyPage' | 'firstPage' | 'never'
    showFoot?: 'everyPage' | 'lastPage' | 'never'
    tableLineColor?: number | number[]
    tableLineWidth?: number
    styles?: any
    headStyles?: any
    bodyStyles?: any
    footStyles?: any
    alternateRowStyles?: any
    columnStyles?: any
    theme?: 'striped' | 'grid' | 'plain'
    horizontalPageBreak?: boolean
    horizontalPageBreakRepeat?: number | number[]
    didParseCell?: (data: any) => void
    didDrawCell?: (data: any) => void
    didDrawPage?: (data: any) => void
    [key: string]: any
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): jsPDF
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number
    }
  }
}
