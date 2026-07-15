import { getSimCards, toSimOption } from './simCardService.js'

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

export async function loadProductSimCards({ productLabel, assignedSimCardNumber, timeoutMs = 5000 } = {}) {
  console.log('')
  console.log(LINE)
  console.log(`📡 [${productLabel}] CHARGEMENT DES CARTES SIM`)
  console.log(LINE)

  if (assignedSimCardNumber) {
    console.log(`🔒 SIM assignée pour ce produit : ${assignedSimCardNumber}`)
  } else {
    console.log('🔓 Aucune SIM assignée — sélection libre')
  }

  const { ok, status, data } = await getSimCards(timeoutMs)
  if (!ok) {
    console.error(`❌ [${productLabel}] Échec récupération SIM — HTTP ${status || '—'}`)
    console.log(LINE)
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

  console.log(`✅ [${productLabel}] ${list.length} carte(s) SIM récupérée(s) :`)
  list.forEach(s => console.log(`   • ${s.simCardUid} | ${s.simCardNumber} | ${s.provider || '—'} | ${s.phoneNumber || '—'}`))

  if (assignedSimCardNumber) {
    if (autoSim) {
      console.log(`🎯 [${productLabel}] SIM auto-sélectionnée : ${autoSim.simCardUid} (${autoSim.simCardNumber})`)
    } else {
      console.warn(`⚠️  [${productLabel}] SIM assignée ${assignedSimCardNumber} introuvable dans la liste !`)
    }
  }

  console.log(LINE)
  console.log('')

  return {
    ok: true,
    status,
    simOptions: opts,
    simList: list,
    selectedSim: autoSim ? autoSim.simCardUid : '',
  }
}
