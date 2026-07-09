import { getTestSequenceConfig } from './runtimeConfig.js'

/**
 * Get the test sequence file name for a given product UID
 * @param {string} productUid - The product UID to look up
 * @returns {string} The test sequence file name (e.g., 'testSequence-default.json')
 */
export function getTestSequenceForProduct(productUid) {
  const config = getTestSequenceConfig()
  const defaultSequence = config.default || 'testSequence-default.json'
  if (!productUid) return defaultSequence
  
  const mappedFile = config.byProduct?.[productUid]
  if (mappedFile) {
    return mappedFile
  }
  
  // Return default sequence if no mapping found
  return defaultSequence
}

/**
 * 
 */
export default {
  getTestSequenceForProduct,
}
