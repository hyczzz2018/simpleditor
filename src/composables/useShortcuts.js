export function registerShortcuts(vm) {
  const handler = event => {
    if (!(event.ctrlKey || event.metaKey)) {
      return
    }

    const key = event.key.toLowerCase()
    if (key === 's') {
      event.preventDefault()
      vm.saveDocument()
      return
    }

    if (key === 'o') {
      event.preventDefault()
      vm.importFile()
      return
    }

    if (key === '/') {
      event.preventDefault()
      vm.shortcutPanelVisible = !vm.shortcutPanelVisible
    }
  }

  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}
