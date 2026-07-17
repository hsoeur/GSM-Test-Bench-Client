import { logger } from './loggerService.js'
import { getSimCards, toSimOption } from './simCardService.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

export async function loadProductSimCards({ productLabel, assignedSimCardNumber, timeoutMs = 5000 } = {}) {
  logger.info('')
  logger.info(LINE)
  logger.info(`📡 [${productLabel}] CHARGEMENT DES CARTES SIM`)
  logger.info(LINE)

  if (assignedSimCardNumber) {
    logger.info(`🔒 SIM assignée pour ce produit : ${assignedSimCardNumber}`)
  } else {
    logger.info('🔓 Aucune SIM assignée — sélection libre')
  }

  const { ok, status, data } = await getSimCards(timeoutMs)
  if (!ok) {
    logger.error(`❌ [${productLabel}] Échec récupération SIM — HTTP ${status || '—'}`)
    logger.info(LINE)
    return {
      ok: false,
      status,
      simOptions: [],
      simList: [],
      selectedSim: '',
      errorMessage: `Échec de récupération des SIM (HTTP ${status || '—'})`,
    }
  }

  const list = Array.isArray(data) ? data : []
  const opts = list.map(toSimOption)
  const autoSim = assignedSimCardNumber
    ? list.find(s => String(s.simCardNumber || '') === String(assignedSimCardNumber))
    : null

  logger.info(`✅ [${productLabel}] ${list.length} carte(s) SIM récupérée(s) :`)
  list.forEach(s => logger.info(`   • ${s.simCardUid} | ${s.simCardNumber} | ${s.provider || '—'} | ${s.phoneNumber || '—'}`))

  if (assignedSimCardNumber) {
    if (autoSim) {
      logger.info(`🎯 [${productLabel}] SIM auto-sélectionnée : ${autoSim.simCardUid} (${autoSim.simCardNumber})`)
    } else {
      logger.warn(`⚠️  [${productLabel}] SIM assignée ${assignedSimCardNumber} introuvable dans la liste !`)
    }
  }

  logger.info(LINE)
  logger.info('')

  return {
    ok: true,
    status,
    simOptions: opts,
    simList: list,
    selectedSim: autoSim ? autoSim.simCardUid : '',
  }
}
