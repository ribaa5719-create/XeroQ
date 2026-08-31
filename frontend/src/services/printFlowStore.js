const flowState = globalThis.__xeroqPrintFlow || { selectedFile: null }
globalThis.__xeroqPrintFlow = flowState

export const printFlowStore = {
  setFile: (file) => {
    flowState.selectedFile = file
  },
  getFile: () => flowState.selectedFile,
  clear: () => {
    flowState.selectedFile = null
  },
}
