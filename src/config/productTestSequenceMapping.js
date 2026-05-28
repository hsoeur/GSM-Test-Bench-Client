/**
 * Mapping between product UIDs and their corresponding test sequence files
 * 
 * Each product can have its own test sequence configuration.
 * If a product is not found in the mapping, the default sequence will be used.
 */

export const PRODUCT_TEST_SEQUENCES = {
  // Product-specific test sequences
  '61PT00567A': 'testSequence-61PT00567A.json',
  '61PT00571A': 'testSequence-61PT00571A.json',
  '61PT00505F': 'testSequence-61PT00505F.json',
  '71PT00634A': 'testSequence-71PT00634A.json',
  
  
  // Add your product mappings here
  // Example: '61PT00567B': 'testSequence-61PT00567B.json',
}

/**
 * Get the test sequence file name for a given product UID
 * @param {string} productUid - The product UID to look up
 * @returns {string} The test sequence file name (e.g., 'testSequence-default.json')
 */
export function getTestSequenceForProduct(productUid) {
  if (!productUid) return 'testSequence-default.json'
  
  const mappedFile = PRODUCT_TEST_SEQUENCES[productUid]
  if (mappedFile) {
    return mappedFile
  }
  
  // Return default sequence if no mapping found
  return 'testSequence-default.json'
}

export default {
  PRODUCT_TEST_SEQUENCES,
  getTestSequenceForProduct,
}
