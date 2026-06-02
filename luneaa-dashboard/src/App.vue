<!-- src/App.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const isAuthenticated = ref(false)
const user = ref(null)
const router = useRouter()

onMounted(async () => {
  try {
    const response = await fetch('/api/user')
    if (response.ok) {
      user.value = await response.json()
      isAuthenticated.value = true
    }
  } catch (error) {
    console.error("Erreur de connexion à l'API", error)
  }
})

const loginWithDiscord = () => {
  window.location.href = '/auth/discord'
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
        Se connecter avec Discord
      </button>
    </div>

    <!-- Application Sécurisée -->
    <div v-else class="w-full max-w-7xl p-8 h-screen flex flex-col">
      <header class="flex justify-between items-center mb-8 bg-darker p-4 rounded-xl border border-gray-800">
        <h2 class="text-2xl font-bold text-discord flex items-center gap-3"><span class="text-3xl">🌑</span> Luneaa</h2>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3 bg-dark px-4 py-2 rounded-lg border border-gray-700">
            <img :src="user.avatar" class="w-8 h-8 rounded-full border border-gray-600">
            <span class="font-bold">{{ user.username }}</span>
          </div>
          <button @click="isAuthenticated = false" class="text-red-400 hover:text-red-500 font-bold transition-colors">Déconnexion</button>
        </div>
      </header>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow">
        <!-- Navigation Latérale -->
        <aside class="bg-darker p-6 rounded-xl border border-gray-800 flex flex-col gap-2 md:col-span-1">
          <h3 class="text-gray-400 uppercase text-xs font-bold tracking-wider mb-2 ml-2">Menu Principal</h3>
          <router-link to="/" class="py-2 px-4 rounded font-medium transition" active-class="bg-discord text-white" exact-active-class="bg-discord text-white" :class="[$route.path === '/' ? '' : 'text-gray-400 hover:bg-dark hover:text-white']">📊 Vue d'ensemble</router-link>
          <router-link to="/settings" class="py-2 px-4 rounded font-medium transition" active-class="bg-discord text-white" :class="[$route.path === '/settings' ? '' : 'text-gray-400 hover:bg-dark hover:text-white']">⚙️ Paramètres</router-link>
          <router-link to="/moderation" class="py-2 px-4 rounded font-medium transition" active-class="bg-discord text-white" :class="[$route.path === '/moderation' ? '' : 'text-gray-400 hover:bg-dark hover:text-white']">🛡️ Modération</router-link>
        </aside>

        <!-- Zone de Contenu Dynamique -->
        <main class="md:col-span-3 bg-darker p-6 rounded-xl border border-gray-800 overflow-y-auto">
           <router-view></router-view>
        </main>
      </div>
    </div>
  </div>
</template>