<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ForceGraph3D from '3d-force-graph'

const graphContainer = ref(null)
const isLoading = ref(true)
const selectedNode = ref(null)
const currentView = ref('galaxy') 
let graph = null
let rotationInterval = null


const getColor = (group) => {
  const colors = {
    1: '#ffffff',
    2: '#5865F2', 
    3: '#FEE75C', 
    4: '#ED4245', 
    5: '#57F287' 
  };
  return colors[group] || '#aaaaaa';
}


const loadUniverse = async (type, guildId = null) => {
  isLoading.value = true;
  selectedNode.value = null;
  
  const url = type === 'galaxy' ? '/api/network' : `/api/network/${guildId}`;
  const res = await fetch(url);
  const data = await res.json();

  if (graph) {
    graph.graphData(data); 
  }

  currentView.value = type;
  isLoading.value = false;
}

onMounted(() => {
  setTimeout(() => {
    graph = ForceGraph3D()(graphContainer.value)
      .backgroundColor('#09090b')
      .nodeResolution(32) 
      .nodeColor(node => getColor(node.group))
      .nodeLabel('name')
      .nodeVal('val')
      .linkWidth(1)
      .linkColor(() => 'rgba(255,255,255,0.1)')
      .onNodeClick(node => {
  if (currentView.value === 'galaxy' && node.id !== 'Bot') {
    graph.cameraPosition({ x: node.x, y: node.y, z: node.z - 50 }, node, 1000);
    setTimeout(() => loadUniverse('system', node.id), 1000);
  }
  else if (currentView.value === 'system' && node.id !== 'Center') {
    graph.cameraPosition({ x: node.x * 1.5, y: node.y * 1.5, z: node.z * 1.5 }, node, 1000);
    selectedNode.value = node;
  }
})
      
      graph.d3Force('charge').strength(-150);
      graph.d3Force('link').distance(60);

      loadUniverse('galaxy');

      let angle = 0;
      rotationInterval = setInterval(() => {
        if(graph && !selectedNode.value) {
          graph.cameraPosition({ x: 200 * Math.sin(angle), z: 200 * Math.cos(angle) });
          angle += Math.PI / 1500;
        }
      }, 30);
  }, 100);
})

onUnmounted(() => {
  if (graph) graph._destructor()
  clearInterval(rotationInterval)
})

const backToGalaxy = () => {
  selectedNode.value = null;
  loadUniverse('galaxy');
}
</script>

<template>
  <div class="h-full flex flex-col gap-4 relative">
    <div class="flex justify-between items-center border-b border-gray-800 pb-4">
      <h2 class="text-2xl font-bold flex items-center gap-3">
        <span v-if="currentView === 'galaxy'">🌌 Cartographie Globale</span>
        <span v-else>🪐 Système Solaire du Serveur</span>
      </h2>
      
      <button v-if="currentView === 'system'" @click="backToGalaxy" class="bg-discord hover:bg-blue-600 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2">
        🚀 Retour à la Galaxie
      </button>
    </div>

    <div class="relative flex-grow bg-[#09090b] border border-gray-800 rounded-xl overflow-hidden shadow-inner min-h-[500px]">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center z-10 bg-[#09090b]/80 text-discord animate-pulse font-bold text-xl backdrop-blur-sm">
        Saut en Hyperespace...
      </div>

      <div ref="graphContainer" class="absolute inset-0"></div>
    </div>

    <div v-if="selectedNode" class="absolute top-24 right-8 bg-[#0c0c0c]/95 backdrop-blur-md border border-gray-700 rounded-xl p-6 shadow-2xl w-80 text-white z-20 transition-all">
        <div class="flex justify-between items-start mb-4">
            <h3 class="font-bold text-xl flex items-center gap-2 border-b border-gray-700 pb-2 w-full">
               <span :style="{ color: getColor(selectedNode.group) }">⬤</span>
               {{ selectedNode.name }}
            </h3>
        </div>
        
        <div class="space-y-4 font-mono text-sm">
            <div class="bg-dark p-3 rounded border border-gray-800">
                <span class="text-gray-400 block mb-1">Type de structure</span>
                <span class="font-bold text-white">{{ selectedNode.details.type }}</span>
            </div>
            
            <div class="bg-dark p-3 rounded border border-gray-800">
                <span class="text-gray-400 block mb-1">Entrées (Lignes Prisma)</span>
                <span class="font-bold text-2xl text-green-400">{{ selectedNode.details.rows }}</span>
            </div>
        </div>

        <button @click="selectedNode = null" class="mt-6 w-full bg-gray-800 hover:bg-gray-700 py-2 rounded font-bold transition">Fermer l'analyse</button>
    </div>

  </div>
</template>