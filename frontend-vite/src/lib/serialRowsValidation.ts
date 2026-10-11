export type SerialInputRow = {
  serialNumber: string
  note?: string
  imageUrl?: string
}

export function parseFilledSerials(rows: SerialInputRow[]) {
  return rows
    .map((r) => ({
      serialNumber: r.serialNumber.trim(),
      note: (r.note ?? '').trim(),
      imageUrl: (r.imageUrl ?? '').trim(),
    }))
    .filter((r) => r.serialNumber)
}

/** Returns an error message or null when valid */
export function validateSerialList(filled: { serialNumber: string }[]): string | null {
  if (filled.length === 0) return 'Add at least one serial number'
  const sns = filled.map((r) => r.serialNumber)
  if (new Set(sns).size !== sns.length) return 'Serial numbers must be unique'
  return null
}
