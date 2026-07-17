import { callGsm, hangupGsm } from './gsmService.js'

export function startGsmAudioCheck({ phoneNumber, onStatusChange } = {}) {
  if (!phoneNumber) {
    onStatusChange?.('error')
    return {
      ok: false,
      errorMessage: "Aucune carte SIM sélectionnée ou numéro de téléphone manquant. Vérifiez la configuration SIM.",
    }
  }

  onStatusChange?.('calling')

  callGsm({ phoneNumber, audioOk: true })
    .then(({ ok }) => {
      onStatusChange?.(ok ? 'connected' : 'error')
    })
    .catch(() => {
      onStatusChange?.('error')
    })

  return { ok: true }
}

export async function hangupGsmAudioCheck() {
  await hangupGsm()
}
