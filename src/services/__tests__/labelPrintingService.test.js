import { beforeEach, describe, expect, it, vi } from 'vitest'

const printBySerialNumberMock = vi.fn()
const getMachineNameMock = vi.fn()

vi.mock('../printService.js', () => ({ printBySerialNumber: printBySerialNumberMock }))
vi.mock('../machineService.js', () => ({ getMachineName: getMachineNameMock }))
vi.mock('../../config/runtimeConfig.js', () => ({
  getPrintLabelConfig: () => ({ productUid: 'LABEL-PRODUCT', usageSuffix: 'TKE' }),
  getLoggingConfig: () => ({ level: 'silent', http: false }),
}))

describe('labelPrintingService', () => {
  beforeEach(() => {
    printBySerialNumberMock.mockReset().mockResolvedValue({ ok: true, status: 202 })
    getMachineNameMock.mockReset().mockReturnValue('PC-PROD-03')
  })

  it('routes both labels through the detected machine with stable job ids', async () => {
    const { printConfiguredLabelsForProduct } = await import('../labelPrintingService.js')

    await printConfiguredLabelsForProduct('SOURCE-PRODUCT', { ofUid: 'OF-12', serialLabel: 'SN-34' })

    expect(printBySerialNumberMock).toHaveBeenCalledTimes(2)
    expect(printBySerialNumberMock).toHaveBeenNthCalledWith(1, {
      jobId: 'PC-PROD-03-OF-12-SN-34-Gateway-Montage-Portail-ASM-TKE',
      machineName: 'PC-PROD-03',
      manufacturingOrderUid: 'OF-12',
      productUid: 'LABEL-PRODUCT',
      serialNumber: 'SN-34',
      uidUsage: 'Gateway Montage Portail ASM TKE',
    })
  })

  it('refuses to print without a detected machine', async () => {
    getMachineNameMock.mockReturnValue(null)
    const { printConfiguredLabelsForProduct } = await import('../labelPrintingService.js')

    await expect(printConfiguredLabelsForProduct('SOURCE-PRODUCT', {
      ofUid: 'OF-12',
      serialLabel: 'SN-34',
    })).rejects.toThrow('Aucun poste configuré')
    expect(printBySerialNumberMock).not.toHaveBeenCalled()
  })

  it('surfaces the API error with the failing label context and stops the workflow', async () => {
    printBySerialNumberMock.mockRejectedValueOnce(
      new Error("Poste inconnu — Aucune imprimante n'est configurée pour le poste 'PC-PROD-03'."),
    )
    const { printConfiguredLabelsForProduct } = await import('../labelPrintingService.js')

    await expect(printConfiguredLabelsForProduct('SOURCE-PRODUCT', {
      ofUid: 'OF-12',
      serialLabel: 'SN-34',
    })).rejects.toThrow(
      "Échec de l’impression de l’étiquette « Portail ASM » : Poste inconnu — Aucune imprimante n'est configurée pour le poste 'PC-PROD-03'.",
    )
    expect(printBySerialNumberMock).toHaveBeenCalledTimes(1)
  })

  it('identifies an error on the designation label', async () => {
    printBySerialNumberMock
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        data: { title: 'Erreur d’impression', detail: 'La transmission vers l’imprimante a échoué.' },
      })
    const { printConfiguredLabelsForProduct } = await import('../labelPrintingService.js')

    await expect(printConfiguredLabelsForProduct('SOURCE-PRODUCT', {
      ofUid: 'OF-12',
      serialLabel: 'SN-34',
    })).rejects.toThrow(
      'Échec de l’impression de l’étiquette « Désignation » : Erreur d’impression — La transmission vers l’imprimante a échoué.',
    )
  })
})
