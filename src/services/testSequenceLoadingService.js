import { getTestSequenceForProduct } from '../config/productTestSequenceMapping.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

export async function loadProductTestSequence({ productUid, manufacturingOrderUid } = {}) {
  console.log('')
  console.log(LINE)
  console.log('📋 CHARGEMENT DE LA SÉQUENCE DE TEST (depuis OF)')
  console.log(LINE)
  console.log('🔍 ProductUid (OF):', productUid)
  console.log('🏷️  Manufacturing Order:', manufacturingOrderUid)

  const fileName = getTestSequenceForProduct(productUid)
  const sequenceUrl = `${window.location.origin}/config/${fileName}`

  console.log('📄 Fichier sélectionné:', fileName)
  console.log('🌐 URL complète:', sequenceUrl)

  try {
    const cacheBuster = `?t=${Date.now()}`
    const response = await fetch(`/config/${fileName}${cacheBuster}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const sequence = await response.json()

    console.log('✅ Séquence chargée avec succès!')
    console.log('📊 Nombre d\'étapes:', sequence?.testSequence?.length || 0)
    console.log('📋 Liste des étapes:')
    sequence?.testSequence?.forEach((step, i) => {
      console.log(`   ${i + 1}. [${step.id}] ${step.instruction}`)
      if (step.image) console.log(`      📷 Image: ${step.image}`)
    })
    console.log('📝 Contenu complet:', JSON.stringify(sequence, null, 2))
    console.log(LINE)
    console.log('')

    return { ok: true, sequence, fileName }
  } catch (error) {
    console.error('❌ ERREUR lors du chargement de la séquence')
    console.error('   └─ Fichier:', fileName)
    console.error('   └─ Erreur:', error)
    console.log(LINE)
    console.log('')

    return {
      ok: false,
      sequence: null,
      fileName,
      error,
      errorMessage: `Impossible de charger la séquence de test: ${fileName}`,
    }
  }
}
