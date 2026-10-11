/**
 * Smoke tests for serial row validation (mirrors src/lib/serialRowsValidation.ts).
 * Run from frontend-vite: node scripts/serial-rows-validation-smoke.mjs
 */
import assert from 'node:assert'

function parseFilledSerials(rows) {
  return rows
    .map((r) => ({
      serialNumber: String(r.serialNumber ?? '').trim(),
      note: String(r.note ?? '').trim(),
      imageUrl: String(r.imageUrl ?? '').trim(),
    }))
    .filter((r) => r.serialNumber)
}

function validateSerialList(filled) {
  if (filled.length === 0) return 'Add at least one serial number'
  const sns = filled.map((r) => r.serialNumber)
  if (new Set(sns).size !== sns.length) return 'Serial numbers must be unique'
  return null
}

assert.strictEqual(
  validateSerialList(parseFilledSerials([{ serialNumber: '  A  ' }, { serialNumber: '' }])),
  null
)
assert.strictEqual(validateSerialList(parseFilledSerials([])), 'Add at least one serial number')
assert.strictEqual(
  validateSerialList(parseFilledSerials([{ serialNumber: 'x' }, { serialNumber: 'x' }])),
  'Serial numbers must be unique'
)

console.log('serial-rows-validation-smoke: OK')
