const CONTAINER_ID = 'simpleditor-toast-container'
const TOAST_DURATION = 2600

function ensureContainer() {
  let container = document.getElementById(CONTAINER_ID)
  if (container) {
    return container
  }

  container = document.createElement('div')
  container.id = CONTAINER_ID
  Object.assign(container.style, {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: '9999',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    pointerEvents: 'none',
    maxWidth: '360px',
  })
  document.body.appendChild(container)
  return container
}

function createToast(message) {
  const toast = document.createElement('div')
  toast.textContent = message
  Object.assign(toast.style, {
    background: 'rgba(24, 28, 39, 0.94)',
    color: '#ffffff',
    padding: '12px 14px',
    borderRadius: '12px',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.22)',
    fontSize: '14px',
    lineHeight: '1.5',
    letterSpacing: '0.01em',
    pointerEvents: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transform: 'translateY(-6px)',
    opacity: '0',
    transition: 'opacity 160ms ease, transform 160ms ease',
    wordBreak: 'break-word',
  })
  return toast
}

export function showMessage(message) {
  if (!message || typeof document === 'undefined') {
    return
  }

  const container = ensureContainer()
  const toast = createToast(String(message))
  container.appendChild(toast)

  window.requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  })

  window.setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(-6px)'
    window.setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
      if (!container.childElementCount && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }, 180)
  }, TOAST_DURATION)
}
