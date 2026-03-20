export function createThemeController(vm) {
  const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

  const apply = event => {
    const isDark = !!(event && event.matches)
    vm.isDarkTheme = isDark
  }

  if (media) {
    apply(media)
    if (media.addEventListener) {
      media.addEventListener('change', apply)
    } else if (media.addListener) {
      media.addListener(apply)
    }
  }

  return () => {
    if (!media) {
      return
    }
    if (media.removeEventListener) {
      media.removeEventListener('change', apply)
    } else if (media.removeListener) {
      media.removeListener(apply)
    }
  }
}
