<template>
  <div>
    <div
      v-if="isClient"
      ref="mapContainer"
      class="h-[800px] w-full rounded-md shadow"
    />

    <div
      id="modalInformar"
      ref="modalRef"
      class="fixed top-0 left-0 right-0 z-[9999] hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full bg-transparent"
    >
      <div class="relative w-full h-full max-w-md md:h-auto">
        <div class="relative bg-white rounded-lg shadow dark:bg-gray-800">
          <div
            class="flex items-start justify-between p-4 border-b rounded-t dark:border-gray-700"
          >
            <h3 class="text- font-semibold text-gray-900 dark:text-white">
              Informar Ocorrência
            </h3>
            <button
              type="button"
              @click="modalInstance?.hide()"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          <div class="p-4 md:p-5">
            <!-- Formulário aqui -->
            <form @submit.prevent="salvarOcorrencia" class="space-y-4">
              <UFormField label="Ocorrência" required size="lg">
                <UInput
                  placeholder="Descreva a Ocorrência"
                  v-model="descricao"
                  color="secondary"
                  class="w-full"
                  
                />
              </UFormField>

              <UFormField label="Categoria" required size="lg">
                <USelect
                  v-model="categoria"
                  :items="tiposOcorrencias"
                  class="w-full"
                  placeholder="Selecione uma categoria"
                  color="secondary"
                
                />
              </UFormField>
              <UButton
                type="submit"
                :disabled="descricao.length === 0 || categoria.length === 0"
                color="info"
                block
              >
                Salvar
              </UButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useReverseGeocoding } from "@/composables/useReverseGeocoding";
import { useOcorrenciasStore } from "@/stores/ocorrencias";
import { markerIcons } from "@/util/makerIcons";
import { Modal } from "flowbite";
import { tempoAtras } from "@/util/date";

const modalInstance = ref<Modal | null>(null);
const modalRef = ref<HTMLElement | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
const marcadoresAtivos = new Map<number, L.Marker>();
const isClient = ref(false);
const localizacaoSelecionada = ref<{ lat: number; lng: number } | null>(null);
const descricao = ref("");
const categoria = ref("");
const { endereco, buscarEndereco } = useReverseGeocoding();
const store = useOcorrenciasStore();

const modalAberto = ref(false);
const iconSelecionado = new L.Icon({
  iconUrl: "/images/marking-icons/marker-icon-blue.png",
  shadowUrl: "/images/marking-icons/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

let marcador: L.Marker | null = null;
let map: L.Map;

const toast = useToast();

const tiposOcorrencias = ref(["Iluminação", "Buraco", "Alagamento", "Lixo"]);

function adicionarLegenda() {
  const legenda = new L.Control({ position: "bottomright" });

  legenda.onAdd = function () {
    const div = L.DomUtil.create(
      "div",
      "leaflet-legend bg-white p-2 rounded shadow text-sm space-y-1"
    );

    const categorias = Object.keys(markerIcons);

    div.innerHTML = categorias
      .map((categoria) => {
        if (categoria !== "Padrao") {
          return `
<div class="flex items-center gap-2">
<img src="${markerIcons[categoria].options.iconUrl}" width="50" />
<span class="text-gray-900">${categoria}</span>
</div>
`;
        }
      })
      .join("");

    return div;
  };

  legenda.addTo(map);
}
function showToast(title: string) {
  toast.add({ title });
}
function adicionarMarcadoresSalvos() {
  store.lista.forEach((ocorrencia) => {
    const { id, descricao, localizacao, categoria, nome_local, data } =
      ocorrencia;

    const icon = markerIcons[categoria] || markerIcons["Outros"];

    const marker = L.marker([localizacao.lat, localizacao.lng], {
      icon,
    }).addTo(map);

    marker.bindPopup(`
       <div>
            <p class="text-base"> <strong>${categoria}</strong><br /></p>

            <ul>
              <li>${nome_local} </li>
              <li class="text-xs text-gray-500">${tempoAtras(data)} </li>
            
            </ul>
            <div class="text-right mt-4">
            <button data-id="${id}" style="cursor: pointer;"
                class=" px-2 py-1 text-xs font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-80 btn-remover">
                Remover
            </button>
            </div>
        </div>
    `);

    marcadoresAtivos.set(id, marker);
  });
}
function removerOcorrencia(id: number) {
  const marcador = marcadoresAtivos.get(id);
  if (marcador) {
    marcador.closeTooltip();
    marcador.remove();
    marcadoresAtivos.delete(id);
  }
  store.remove(id);
}

async function atualizarMarcador(lat: number, lng: number) {
  localizacaoSelecionada.value = { lat, lng };

  await buscarEndereco(lat, lng);

  if (!marcador) {
    marcador = L.marker([lat, lng], {
      draggable: true,
      icon: markerIcons["Padrao"],
    }).addTo(map);
    marcador
      .setLatLng([lat, lng])
      .bindPopup(
        `
     <button id="abrir-modal"
    class="bg-blue-600 text-white text-sm px-3 py-1 rounded shadow hover:bg-blue-700">
    Informar Problema
  </button>
  `
      )
      .openPopup();
  }

  marcador.setLatLng([lat, lng]).openPopup();

  marcador
    .on("moveend", async (e) => {
      const novaPosicao = e.target.getLatLng();
      localizacaoSelecionada.value = {
        lat: novaPosicao.lat,
        lng: novaPosicao.lng,
      };
      await buscarEndereco(novaPosicao.lat, novaPosicao.lng);
    })
    .bindPopup(
      `
     <button id="abrir-modal"
    class="bg-blue-600 text-white text-sm px-3 py-1 rounded shadow hover:bg-blue-700">
    Informar Problema
  </button>
`
    )
    .openPopup();
}

function salvarOcorrencia() {
  if (!localizacaoSelecionada.value || !descricao.value) {
    alert("Preencha a descrição e marque a localização.");
    return;
  }

  store.adicionar({
    descricao: descricao.value,
    localizacao: localizacaoSelecionada.value,
    categoria: categoria.value,
    nome_local: endereco.value?.display_name
      ? `${endereco.value?.display_name.split(",")[0]}, ${
          endereco.value?.display_name.split(",")[1]
        }`
      : "",
    data: new Date(),
  });

  showToast("Ocorrência salva com sucesso!");
  descricao.value = "";
  adicionarMarcadoresSalvos();
  modalInstance?.value?.hide();
}

onMounted(async () => {
  isClient.value = true;
  await nextTick();

  store.carregar();

  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, { closePopupOnClick: false }).setView(
    [-1.45, -48.49],
    13
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  adicionarLegenda();

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // marcador atual
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        await atualizarMarcador(coords.latitude, coords.longitude);
        map.setView([coords.latitude, coords.longitude], 16);
      },
      (err) => console.error("Erro ao obter localização:", err)
    );
  }

  // clique no mapa
  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;
    await atualizarMarcador(lat, lng);
  });
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains("btn-remover")) {
      const id = Number(target.dataset.id);
      removerOcorrencia(id);
    }

    if (target.id === "btnInformarProblema") {
      const el = document.querySelector("form");
      el?.scrollIntoView({ behavior: "smooth" });
    }
    if (target.id === "abrir-modal") {
      modalAberto.value = true;

      // flowbite: mostrar modal
      if (modalRef.value) {
        modalInstance.value = new Modal(modalRef.value, {
          backdropClasses: "hidden",
        });
        modalInstance.value.show();
      }
    }
  });
  // adicionar marcadores anteriores
  adicionarMarcadoresSalvos();
});
</script>
