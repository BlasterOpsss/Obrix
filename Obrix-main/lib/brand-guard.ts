// "OXRIZ" is reserved for the official token. This catches lookalikes such as 0XRIZ, OXR1Z or "OX RIZ".
const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/0/g, 'o').replace(/[1l]/g, 'i')

export const isImpersonation = (name: string, symbol: string) =>
  normalize(name).includes('oxriz') || normalize(symbol).includes('oxriz')

export const RESERVED_MESSAGE = 'The name OXRIZ is reserved for the official token. Please choose a different name and ticker.'
