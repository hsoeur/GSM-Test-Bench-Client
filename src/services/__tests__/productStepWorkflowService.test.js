import { beforeEach, describe, expect, it, vi } from 'vitest'

const startGsmAudioCheckMock = vi.fn()
const hangupGsmAudioCheckMock = vi.fn()
const submitOkTraceabilityAndPrintLabelsMock = vi.fn()

vi.mock('../productGsmStepService.js', () => ({
  startGsmAudioCheck: startGsmAudioCheckMock,
  hangupGsmAudioCheck: hangupGsmAudioCheckMock,
}))

vi.mock('../productFinalizationService.js', () => ({
  submitOkTraceabilityAndPrintLabels: submitOkTraceabilityAndPrintLabelsMock,
}))

const { handleProductWorkflowStep } = await import('../productStepWorkflowService.js')

function createHarness() {
  let state = {
    selectedSim: '',
    isReady: null,
    gsmCallStatus: 'idle',
    phonieResult: null,
    batteryResult: null,
    switchOffResult: null,
    checkIntercoResult: null,
  }
  let stepIndex = 0
  let error = ''

  return {
    get state() {
      return state
    },
    get stepIndex() {
      return stepIndex
    },
    get error() {
      return error
    },
    setTestData: (updater) => {
      state = typeof updater === 'function' ? updater(state) : updater
    },
    setCurrentStepIndex: (updater) => {
      stepIndex = typeof updater === 'function' ? updater(stepIndex) : updater
    },
    setError: (message) => {
      error = message
    },
    submitTraceability: vi.fn(),
    resetAll: vi.fn(),
  }
}

describe('handleProductWorkflowStep', () => {
  beforeEach(() => {
    startGsmAudioCheckMock.mockReset()
    hangupGsmAudioCheckMock.mockReset()
    submitOkTraceabilityAndPrintLabelsMock.mockReset()
    vi.stubGlobal('localStorage', { setItem: vi.fn() })
  })

  it('selects and persists SIM then moves to next step', async () => {
    const harness = createHarness()

    await handleProductWorkflowStep({
      stepId: 'select-sim',
      value: 'SIM-01',
      simSelectId: 'simSelectA',
      ...harness,
    })

    expect(harness.state.selectedSim).toBe('SIM-01')
    expect(localStorage.setItem).toHaveBeenCalledWith('sim:last:simSelectA', 'SIM-01')
    expect(harness.stepIndex).toBe(1)
  })

  it('submits KO and jumps to final step when check-init fails', async () => {
    const harness = createHarness()

    await handleProductWorkflowStep({
      stepId: 'check-init',
      value: 'ko',
      steps: [{ id: 'scan-label' }, { id: 'check-init' }, { id: 'test-complete' }],
      ...harness,
    })

    expect(harness.state.isReady).toBe(false)
    expect(harness.submitTraceability).toHaveBeenCalledWith('KO')
    expect(harness.stepIndex).toBe(2)
  })

  it('sets an error when GSM start has no phone number', async () => {
    const harness = createHarness()
    startGsmAudioCheckMock.mockReturnValue({ ok: false, errorMessage: 'missing phone' })

    await handleProductWorkflowStep({
      stepId: 'check-init',
      value: 'ok',
      selectedSimPhone: '',
      ...harness,
    })

    expect(harness.error).toBe('missing phone')
    expect(harness.stepIndex).toBe(0)
  })

  it('hangs up GSM and submits OK when phonie is valid and no later checks exist', async () => {
    const harness = createHarness()
    hangupGsmAudioCheckMock.mockResolvedValue()

    await handleProductWorkflowStep({
      stepId: 'test-phonie',
      value: 'ok',
      steps: [{ id: 'test-phonie' }],
      ...harness,
    })

    expect(hangupGsmAudioCheckMock).toHaveBeenCalledTimes(1)
    expect(harness.state.gsmCallStatus).toBe('idle')
    expect(harness.state.phonieResult).toBe('ok')
    expect(harness.submitTraceability).toHaveBeenCalledWith('OK')
    expect(harness.stepIndex).toBe(1)
  })

  it('finalizes traceability and printing when battery test succeeds', async () => {
    const harness = createHarness()
    submitOkTraceabilityAndPrintLabelsMock.mockResolvedValue()
    const scannedProduct = { serialLabel: '123' }

    await handleProductWorkflowStep({
      stepId: 'test-battery',
      value: 'ok',
      productUid: '71PT00634A',
      scannedProduct,
      ...harness,
    })

    expect(harness.state.batteryResult).toBe('ok')
    expect(submitOkTraceabilityAndPrintLabelsMock).toHaveBeenCalledWith({
      productUid: '71PT00634A',
      scannedProduct,
      submitTraceability: harness.submitTraceability,
    })
    expect(harness.stepIndex).toBe(1)
  })

  it('resets the flow on test-complete', async () => {
    const harness = createHarness()

    await handleProductWorkflowStep({
      stepId: 'test-complete',
      ...harness,
    })

    expect(harness.resetAll).toHaveBeenCalledTimes(1)
  })
})
