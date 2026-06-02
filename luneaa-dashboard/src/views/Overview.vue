
<script setup>
import { ref, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const chartData = ref({ labels: [], datasets: [] })
const logs = ref([])

onMounted(async () => {
  const res = await fetch('/api/analytics')
  const data = await res.json()
  
  logs.value = data.logs
  chartData.value = {
    labels: data.labels,
    datasets: [{
      label: 'Commandes traitées',
      backgroundColor: '#5865F2',
      borderColor: '#5865F2',
      data: data.commands
    }]
  }
})
</script>

<template>
  <div class="space-y-8">
    <h2 class="text-2xl font-bold">Analytique Luneaa</h2>
    
    <div class="bg-dark p-6 rounded-xl border border-gray-700 h-64">
      <Line v-if="chartData.labels.length" :data="chartData" :options="{ responsive: true, maintainAspectRatio: false }" />
    </div>

    <div class="bg-dark p-6 rounded-xl border border-gray-700">
      <h3 class="font-bold mb-4">Dernières actions de modération</h3>
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="text-gray-400 text-sm">
            <th class="py-2">Action</th>
            <th class="py-2">Utilisateur</th>
            <th class="py-2">Heure</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id" class="border-t border-gray-800">
            <td class="py-2 text-red-400">{{ log.action }}</td>
            <td class="py-2">{{ log.user }}</td>
            <td class="py-2">{{ log.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>