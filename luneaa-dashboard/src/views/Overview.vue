<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ForceGraph3D from '3d-force-graph'

const graphContainer = ref(null)
const isLoading = ref(true)
const selectedNode = ref(null) 
let graph = null
let rotationInterval = null

onMounted(async () => {
  try {
    const res = await fetch('/api/network')
    const data = await res.json()
    isLoading.value = false

    setTimeout(() => {
      graph = ForceGraph3D()(graphContainer.value)
        .graphData(data)
        .backgroundColor('#000000')
        .nodeLabel('name')
        .nodeAutoColorBy('group')
        .nodeVal('val')
        .linkDirectionalParticles(2)
        .linkDirectionalParticleSpeed(d => d.value * 0.001 || 0.005)
        .onNodeClick(node => {
          if (node.id === 'Bot') return; 
          

          const distance = 100;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          
          graph.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node, 
            2000  
          );

          selectedNode.value = node;
        });
        
        let angle = 0;
        rotationInterval = setInterval(() => {
          if(graph && !selectedNode.value) {
            graph.cameraPosition({
              x: 200 * Math.sin(angle),
              z: 200 * Math.cos(angle)
            });
            angle += Math.PI / 800;
          }
        }, 30);
    }, 100);

  } catch (error) {
    console.error("Erreur de chargement 3D", error)
  }
})

onUnmounted(() => {
  if (graph) graph._destructor()
  clearInterval(rotationInterval)
})

const closePanel = () => {
    selectedNode.value = null;
    graph.cameraPosition({ x: 0, y: 0, z: 200 }, { x: 0, y: 0, z: 0 }, 2000);
}
</script>

<template>
  <div class="h-full flex flex-col gap-4 relative">
    <div class="flex justify-between items-center border-b border-gray-700 pb-4">
      <h2 class="text-2xl font-bold flex items-center gap-2">🌌 Cartographie Réseau 3D</h2>
    </div>

    <div class="relative flex-grow bg-black border border-gray-800 rounded-xl overflow-hidden shadow-inner min-h-[500px]">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center z-10 text-discord animate-pulse font-bold text-xl">
        Calcul des coordonnées spatiales...
      </div>

      <div ref="graphContainer" class="absolute inset-0"></div>
      
      <div class="absolute bottom-4 left-4 z-10 text-xs text-gray-500 font-mono pointer-events-none">
        > MOTEUR: WebGL / Three.js<br>
        > CTRL: Clic gauche sur une planète pour l'analyser
      </div>
    </div>

    <div v-if="selectedNode" class="absolute top-20 right-8 bg-[#0c0c0c]/90 backdrop-blur-md border border-gray-700 rounded-xl p-6 shadow-2xl w-80 text-white z-20 transition-all">
        <div class="flex justify-between items-start mb-4">
            <h3 class="font-bold text-xl text-discord break-words pr-4">{{ selectedNode.name }}</h3>
            <button @click="closePanel" class="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
        </div>
        
        <div class="space-y-3 font-mono text-sm">
            <div class="flex justify-between border-b border-gray-800 pb-1">
                <span class="text-gray-400">ID Serveur</span>
                <span class="text-[10px] self-end">{{ selectedNode.id }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-800 pb-1">
                <span class="text-gray-400">Membres</span>
                <span class="text-green-400 font-bold">{{ selectedNode.details.members }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-800 pb-1">
                <span class="text-gray-400">Salons Actifs</span>
                <span>{{ selectedNode.details.channels }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-800 pb-1">
                <span class="text-gray-400">Rôles Définis</span>
                <span>{{ selectedNode.details.roles }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-800 pb-1">
                <span class="text-gray-400">Boosts Nitro</span>
                <span class="text-[#f47fff] font-bold">{{ selectedNode.details.boosts }}</span>
            </div>
        </div>

        <div class="mt-6">
            <h4 class="text-xs text-gray-500 uppercase font-bold mb-2">Modules actifs (Simulation)</h4>
            <div class="flex flex-wrap gap-2">
                <span class="bg-gray-800 text-xs px-2 py-1 rounded">Modération</span>
                <span class="bg-gray-800 text-xs px-2 py-1 rounded">Logs</span>
                <span v-if="selectedNode.details.members > 10" class="bg-discord/20 text-discord border border-discord/30 text-xs px-2 py-1 rounded">Premium</span>
            </div>
        </div>
    </div>

  </div>
</template>