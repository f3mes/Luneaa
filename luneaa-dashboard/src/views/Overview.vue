<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ForceGraph3D from '3d-force-graph'

const graphContainer = ref(null)
const isLoading = ref(true)
let graph = null

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
        
        let angle = 0;
        setInterval(() => {
          if(graph) {
            graph.cameraPosition({
              x: 200 * Math.sin(angle),
              z: 200 * Math.cos(angle)
            });
            angle += Math.PI / 800;
          }
        }, 30);
    }, 100);

  } catch (error) {
    console.error("Erreur de chargement de l'univers 3D", error)
  }
})

onUnmounted(() => {
  if (graph) graph._destructor() 
})
</script>

<template>
  <div class="h-full flex flex-col gap-4">
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
        > CTRL: Souris pour orbiter / Molette pour zoomer
      </div>
    </div>
  </div>
</template>