import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    html: '<p></p>',
    readOnly: false,
    saved: true,
    currentBlock: 'paragraph',
    currentAlignment: 'left',
    currentFontFamily: 'Microsoft YaHei',
    currentFontSize: '16px',
    currentTextColor: '#1f2937',
    currentBgColor: '#ffffff',
    annotationMode: false
  },
  mutations: {
    setHtml(state, html) {
      state.html = html
    },
    setReadOnly(state, value) {
      state.readOnly = value
    },
    setSaved(state, value) {
      state.saved = value
    },
    patchState(state, payload) {
      Object.keys(payload).forEach(key => {
        state[key] = payload[key]
      })
    }
  }
})
