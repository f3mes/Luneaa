<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { io } from 'socket.io-client'

const logs = ref([])
const terminalBox = ref(null)
let socket = null

onMounted(() => {
  socket = io({ path: '/socket.io' }) 

  socket.on('terminal-log', async (data) => {
    logs.value.push(data)
    
    if (logs.value.length > 100) logs.value.shift()

    await nextTick()
    if (terminalBox.value) {
      terminalBox.value.scrollTop = terminalBox.value.scrollHeight
    }
  })
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})

const restartBot = () => {
  if(confirm('⚠️ ALERTE : Veux-tu forcer le redémarrage du bot ? (Il se rallumera tout seul dans 3 sec)')) {
    socket.emit('restart-bot')
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <div class="flex justify-between items-center border-b border-gray-700 pb-4">
      <h2 class="text-2xl font-bold flex items-center gap-2">💻 Console Maître (Live)</h2>
      <button @click="restartBot" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
        🔄 Forcer le Redémarrage
      </button>
    </div>

    <div ref="terminalBox" class="bg-[#0c0c0c] border border-gray-800 rounded-xl p-4 flex-grow overflow-y-auto font-mono text-sm shadow-inner min-h-[500px]">
      <div v-if="logs.length === 0" class="text-gray-600 italic animate-pulse">En attente d'interception des signaux systèmes...</div>
      
      <div v-for="(log, index) in logs" :key="index" class="mb-1 leading-relaxed" :class="log.type === 'error' ? 'text-red-500' : 'text-[#4af626]'">
        <span class="text-gray-600 select-none">[{{ new Date().toLocaleTimeString() }}]</span>
        <span class="ml-3 break-words">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>