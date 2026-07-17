import { logger } from './loggerService.js'
import { getTestSequenceForProduct } from '../config/productTestSequenceMapping.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

export async function loadProductTestSequence({ productUid, manufacturingOrderUid } = {}) {
  logger.info('')
  logger.info(LINE)
  logger.info('📋 CHARGEMENT DE LA SÉQUENCE DE TEST (depuis OF)')
  logger.info(LINE)
  logger.info('🔍 ProductUid (OF):', productUid)
  logger.info('🏷️  Manufacturing Order:', manufacturingOrderUid)

  const fileName = getTestSequenceForProduct(productUid)
  const sequenceUrl = `${window.location.origin}/config/${fileName}`

  logger.info('📄 Fichier sélectionné:', fileName)
  logger.info('🌐 URL complète:', sequenceUrl)

  try {
    const cacheBuster = `?t=${Date.now()}`
    const response = await fetch(`/config/${fileName}${cacheBuster}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const sequence = await response.json()

    logger.info('✅ Séquence chargée avec succès!')
    logger.info('📊 Nombre d\'étapes:', sequence?.testSequence?.length || 0)
    logger.info('📋 Liste des étapes:')
    sequence?.testSequence?.forEach((step, i) => {
      logger.info(`   ${i + 1}. [${step.id}] ${step.instruction}`)
      if (step.image) logger.info(`      📷 Image: ${step.image}`)
    })
    logger.info('📝 Contenu complet:', JSON.stringify(sequence, null, 2))
    logger.info(LINE)
    logger.info('')

    return { ok: true, sequence, fileName }
  } catch (error) {
    logger.error('❌ ERREUR lors du chargement de la séquence')
    logger.error('   └─ Fichier:', fileName)
    logger.error('   └─ Erreur:', error)
    logger.info(LINE)
    logger.info('')

    return {
      ok: false,
      sequence: null,
      fileName,
      error,
      errorMessage: `Impossible de charger la séquence de test: ${fileName}`,
    }
  }
}
