<template>
  <div class="app-shell">
    <main class="app-main">
      <SimpleditorEditor />
    </main>
  </div>
</template>

<script>
import SimpleditorEditor from './components/SimpleditorEditor.vue'

export default {
  name: 'App',
  components: {
    SimpleditorEditor,
  },
}
</script>
