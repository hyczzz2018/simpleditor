import Vue from 'vue'
import App from './App.vue'
import store from './stores/editorStore'
import './assets/css/style.css'
import './assets/css/global.css'
import './assets/css/editor.css'
import './assets/css/components.css'

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
