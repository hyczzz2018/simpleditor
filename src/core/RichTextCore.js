export default class RichTextCore {
  constructor(holder, options = {}) {
    this.holder = holder
    this.options = options
  }

  init(initialContent) {
    if (!this.holder) {
      throw new Error('Editor holder is required.')
    }
    this.holder.innerHTML = initialContent || '<p><br></p>'
    this.holder.setAttribute('contenteditable', this.options.readOnly ? 'false' : 'true')
  }

  setReadOnly(readOnly) {
    if (this.holder) {
      this.holder.setAttribute('contenteditable', readOnly ? 'false' : 'true')
    }
  }

  focus() {
    if (this.holder) {
      this.holder.focus()
    }
  }

  exec(command, value = null) {
    this.focus()
    document.execCommand(command, false, value)
  }

  getHTML() {
    return this.holder ? this.holder.innerHTML : ''
  }

  setHTML(html) {
    if (this.holder) {
      this.holder.innerHTML = html || '<p><br></p>'
    }
  }

  getText() {
    return this.holder ? this.holder.innerText : ''
  }

  isEmpty() {
    return !this.getText().trim()
  }
}
