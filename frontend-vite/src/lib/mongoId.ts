/** Matches a 24-hex MongoDB ObjectId string (browser-side guard before API calls). */
export const MONGO_OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/

export function isMongoObjectIdString(id: string | undefined): boolean {
  return !!id && MONGO_OBJECT_ID_RE.test(id)
}
