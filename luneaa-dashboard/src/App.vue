<script setup>
import { ref, onMounted } from 'vue'

const isAuthenticated = ref(false)
const user = ref(null)

onMounted(async () => {
  try {
    const response = await fetch('http://45.43.163.139:25685/api/user', {
      credentials: 'include' 
    })
    
    if (response.ok) {
      const data = await response.json()
      user.value = data
      isAuthenticated.value = true
    }
  } catch (error) {
    console.error("Erreur de connexion à l'API", error)
  }
})

const loginWithDiscord = () => {
  window.location.href = 'http://45.43.163.139:25685/auth/discord'
}
</script>

<template>
  <div class="min-h-screen bg-dark text-white font-sans flex items-center justify-center selection:bg-discord">
    
    <!-- Écran de Connexion -->
    <div v-if="!isAuthenticated" class="text-center p-10 bg-darker rounded-2xl shadow-2xl border border-gray-800 w-full max-w-md">
      <div class="text-6xl mb-6">🌑</div>
      <h1 class="text-3xl font-bold mb-2">Luneaa Panel</h1>
      <p class="text-gray-400 mb-8 text-sm">Administration sécurisée de l'infrastructure.</p>
      
      <button @click="loginWithDiscord" class="bg-discord hover:bg-blue-600 transition-all duration-200 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-3 w-full shadow-lg">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-19.32-72.15ZM42.68,65.22c-5.36,0-9.81-4.9-9.81-10.86s4.35-10.86,9.81-10.86,9.92,4.9,9.81,10.86c0,5.96-4.45,10.86-9.81,10.86Zm41.72,0c-5.36,0-9.81-4.9-9.81-10.86s4.35-10.86,9.81-10.86,9.92,4.9,9.81,10.86c0,5.96-4.45,10.86-9.81,10.86Z"/></svg>
        Se connecter avec Discord
      </button>
    </div>

    <!-- Écran Dashboard (Maquette) -->
    <div v-else class="w-full max-w-7xl p-8 h-screen flex flex-col">
      <header class="flex justify-between items-center mb-8 bg-darker p-4 rounded-xl border border-gray-800">
        <h2 class="text-2xl font-bold text-discord flex items-center gap-3"><span class="text-3xl">🌑</span> Luneaa</h2>
        <button @click="isAuthenticated = false" class="text-red-400 hover:text-red-500 font-bold transition-colors">Déconnexion</button>
      </header>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
        <!-- Module Navigation -->
        <aside class="bg-darker p-6 rounded-xl border border-gray-800 flex flex-col gap-4">
          <h3 class="text-gray-400 uppercase text-sm font-bold tracking-wider mb-2">Menu</h3>
          <button class="text-left py-2 px-4 rounded bg-dark text-white font-medium hover:bg-gray-700 transition">📊 Statistiques</button>
          <button class="text-left py-2 px-4 rounded text-gray-400 font-medium hover:bg-dark hover:text-white transition">⚙️ Paramètres</button>
          <button class="text-left py-2 px-4 rounded text-gray-400 font-medium hover:bg-dark hover:text-white transition">🛡️ Modération</button>
        </aside>

        <!-- Zone de Contenu Principal -->
        <main class="md:col-span-2 bg-darker p-6 rounded-xl border border-gray-800">
           <h3 class="text-xl font-bold mb-6">Vue d'ensemble</h3>
           <!-- Ajout futur des graphiques ou tables de données -->
        </main>
      </div>
    </div>

  </div>
</template>