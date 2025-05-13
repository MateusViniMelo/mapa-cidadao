<template>
    <div v-if="isClient" ref="mapContainer" class="h-[500px] w-full rounded-md shadow" />

    <div v-if="localizacaoSelecionada" class="mt-4 text-sm text-gray-200 space-y-2">
        <div>
            <strong>Localização selecionada:</strong><br />
            Latitude: {{ localizacaoSelecionada.lat.toFixed(5) }}<br />
            Longitude: {{ localizacaoSelecionada.lng.toFixed(5) }}
        </div>
        <form action="" class="max-w-sm mx-auto" @submit.prevent="salvarOcorrencia">

            <div class="mb-5">
                <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Descreva a
                    Ocorrência</label>
                <input type="text" v-model="descricao"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500" />
            </div>

            <div class="mb-5">

                <label for="countries" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Selecione a
                    categoria</label>
                <select v-model="categoria"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500">
                    <option value="">Selecione uma categoria</option>
                    <option value="Iluminação">Iluminação</option>
                    <option value="Buraco">Buraco</option>
                    <option value="Alagamento">Alagamento</option>
                    <option value="Lixo">Lixo</option>
                    <option value="Outros">Outros</option>
                </select>

            </div>

            <UButton type="submit" :disabled="descricao.length === 0 || categoria.length === 0" color="info"> Salvar
                Ocorrência
            </UButton>
        </form>

        {{ endereco?.display_name }}
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useReverseGeocoding } from '@/composables/useReverseGeocoding'
import { useOcorrenciasStore } from '@/stores/ocorrencias'
import { markerIcons } from '@/util/makerIcons'

const mapContainer = ref<HTMLElement | null>(null)
const marcadoresAtivos = new Map<number, L.Marker>()
const isClient = ref(false)
const localizacaoSelecionada = ref<{ lat: number; lng: number } | null>(null)
const descricao = ref('')
const categoria = ref('')
const { endereco, buscarEndereco } = useReverseGeocoding()
const store = useOcorrenciasStore()

let marcador: L.Marker | null = null
let map: L.Map

function adicionarLegenda() {
    const legenda = new L.Control({ position: 'bottomright' })

    legenda.onAdd = function () {
        const div = L.DomUtil.create('div', 'leaflet-legend bg-white p-2 rounded shadow text-sm space-y-1')

        const categorias = Object.keys(markerIcons)

        div.innerHTML = categorias.map(categoria => `
      <div class="flex items-center gap-2">
        <img src="${markerIcons[categoria].options.iconUrl}" width="20" height="32" />
        <span class="text-gray-900">${categoria}</span>
      </div>
    `).join('')

        return div
    }

    legenda.addTo(map)
}

function adicionarMarcadoresSalvos() {
    store.lista.forEach(ocorrencia => {
        const { id, descricao, localizacao, categoria } = ocorrencia

        const icon = markerIcons[categoria] || markerIcons['Outros']

        const marker = L.marker([localizacao.lat, localizacao.lng], {
            icon
        }).addTo(map)

        marker.bindPopup(`
      <div>
       <p class="mb-0.5">  <strong>Ocorrência: ${categoria}</strong><br/></p>
        
        ${descricao}<br/>
        <button data-id="${id}" style="cursor: pointer;" class=" px-3 py-2 text-xs font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-80 btn-remover">Remover</button>
      </div>
    `)

        marcadoresAtivos.set(id, marker)
    })
}
function removerOcorrencia(id: number) {
    const marcador = marcadoresAtivos.get(id)
    if (marcador) {
        marcador.closeTooltip()
        marcador.remove()
        marcadoresAtivos.delete(id)
    }
    store.remove(id)
}

async function atualizarMarcador(lat: number, lng: number) {
    localizacaoSelecionada.value = { lat, lng }
    await buscarEndereco(lat, lng)

    if (!marcador) {
        marcador = L.marker([lat, lng], { draggable: true }).addTo(map)
    }

    marcador.setLatLng([lat, lng]).openPopup()

    marcador.on('moveend', async (e) => {
        const novaPosicao = e.target.getLatLng()
        localizacaoSelecionada.value = { lat: novaPosicao.lat, lng: novaPosicao.lng }
        await buscarEndereco(novaPosicao.lat, novaPosicao.lng)
    })
}

function salvarOcorrencia() {
    if (!localizacaoSelecionada.value || !descricao.value) {
        alert('Preencha a descrição e marque a localização.')
        return
    }

    store.adicionar({
        descricao: descricao.value,
        localizacao: localizacaoSelecionada.value,
        categoria: categoria.value
    })

    alert('Ocorrência salva com sucesso!')
    descricao.value = ''
    adicionarMarcadoresSalvos()
}

onMounted(async () => {
    isClient.value = true
    await nextTick()

    store.carregar()

    if (!mapContainer.value) return

    map = L.map(mapContainer.value, { closePopupOnClick: false }).setView([-1.45, -48.49], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    adicionarLegenda() // 👈 aqui

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    // marcador atual
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                await atualizarMarcador(coords.latitude, coords.longitude)
                map.setView([coords.latitude, coords.longitude], 16)
            },
            err => console.error('Erro ao obter localização:', err)
        )
    }

    // clique no mapa
    map.on('click', async e => {
        const { lat, lng } = e.latlng
        await atualizarMarcador(lat, lng)
    })
    document.addEventListener('click', e => {
        const target = e.target as HTMLElement
        if (target.classList.contains('btn-remover')) {
            const id = Number(target.dataset.id)
            removerOcorrencia(id)
        }
    })
    // adicionar marcadores anteriores
    adicionarMarcadoresSalvos()
})
</script>
