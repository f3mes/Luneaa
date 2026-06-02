<script setup>
import { ref } from 'vue'

const config = ref({ prefix: '!', welcomeMessage: '' })

const saveSettings = async () => {
  await fetch(`/api/settings/1495067644783624343`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config.value)
  })
  alert('Paramètres sauvegardés')
}
</script>

<template>
  <div class="space-y-4">
    <input v-model="config.prefix" class="bg-dark p-2 rounded w-full border border-gray-700" placeholder="Préfixe">
    <button @click="saveSettings" class="bg-discord px-4 py-2 rounded">Sauvegarder</button>
  </div>
</template>