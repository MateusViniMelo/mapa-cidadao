<template>
  <div>
    <div
      v-if="isClient"
      class="relative h-[700px] lg:h-[800px] w-full overflow-hidden rounded-md shadow"
    >
      <div ref="mapContainer" class="h-full w-full" />
      <MapLoadingOverlay v-if="loadingOccurrences" />
    </div>
  </div>

  <CreateOccurrenceModal
    v-model:open="modalAberto"
    v-model:selected-type="selectedType"
    v-model:description="descricao"
    :address="enderecoAchado"
    :loading-address="carregando"
    :address-error="erroEndereco"
    :type-options="typeOptions"
    :loading="occurrenceStore.loading || carregando"
    :max-length="MAX_DESCRIPTION_LENGTH"
    @submit="salvarOcorrencia"
    @close="resetCreateForm"
  />

  <CloseOccurrenceModal
    v-model:open="modalFinalizarOcorrencia"
    :loading="occurrenceStore.loading"
    @submit="onSubmitInactivateOccurrence"
    @close="resetCloseForm"
  />
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useReverseGeocoding } from "~/composables/useReverseGeocoding";
import { toRequestCoordinates } from "~/utils/occurrencePoint";
import { markerIcons } from "~/util/makerIcons";
import type { ITypeOccurrence } from "~/interfaces/ITypeOccurrence";
import type { ILocationPoint } from "~/interfaces/ILocationPoint";
import type { IOccurrencePayload } from "~/interfaces/IOccurrencePayload";
import type { InactivateOccurrenceSchema } from "~/validators/inactivateOccurrenceSchema";
import {
  buildOccurrencePopupHtml,
  buildRecenterButtonHtml,
  INFORM_PROBLEM_POPUP_HTML,
} from "~/utils/mapPopup";

const MAX_DESCRIPTION_LENGTH = 250;
const DEFAULT_MAP_CENTER: L.LatLngExpression = [-1.45, -48.49];
const DEFAULT_MAP_ZOOM = 13;

const mapContainer = ref<HTMLElement | null>(null);
const marcadoresAtivos = new Map<number, L.Marker>();
const isClient = ref(false);
const localizacaoSelecionada = ref<{ lat: number; lng: number } | null>(null);
const descricao = ref("");
const enderecoAchado = ref<Awaited<ReturnType<typeof buscarEndereco>>>(null);
const { buscarEndereco, carregando, erroEndereco } = useReverseGeocoding();

const authStore = useAuthStore();
const occurrenceStore = useOccurrenceStore();
const { occurrences, loadingOccurrences } = storeToRefs(occurrenceStore);

const modalAberto = ref(false);
const ocorrenciaRemover = ref<number | null>(null);
const modalFinalizarOcorrencia = ref(false);

const types = ref<ITypeOccurrence[]>([]);
const selectedType = ref<number | undefined>(undefined);

let marcador: L.Marker | null = null;
let map: L.Map;
let handleDocumentClick: (e: Event) => void;
let handleMapClick: (e: L.LeafletMouseEvent) => void;

const toast = useToast();

const typeOptions = computed(() =>
  types.value.map((type) => ({
    label: type.name,
    value: type.id,
  }))
);

function resetCreateForm() {
  enderecoAchado.value = null;
  descricao.value = "";
}

function resetCloseForm() {
  ocorrenciaRemover.value = null;
}

function adicionarLegenda() {
  const legenda = new L.Control({ position: "bottomright" });

  legenda.onAdd = function () {
    const div = L.DomUtil.create(
      "div",
      "leaflet-legend p-2 rounded-2xl text-sm space-y-1 shadow-2xl bg-white border border-gray-200"
    );

    div.innerHTML = Object.keys(markerIcons)
      .filter((categoria) => categoria !== "Padrao")
      .map((categoria) => {
        const { icon, nome } = markerIcons[categoria];
        return `
          <div class="flex items-center gap-2">
            <img src="${icon.options.iconUrl}" class="w-[24px] md:w-[32px]" />
            <span class="text-gray-700 text-xs lg:text-sm">${nome}</span>
          </div>
        `;
      })
      .join("");

    return div;
  };

  legenda.addTo(map);
}

function adicionarMarcadoresSalvos() {
  occurrences.value.forEach((ocorrencia) => {
    const {
      id,
      location,
      type_id,
      address_name,
      created_at,
      user_id,
      likes_count,
      liked_by_auth_user,
    } = ocorrencia;

    const marcadorData = markerIcons[type_id] || markerIcons.Padrao;
    const marker = L.marker(
      [location.coordinates[1], location.coordinates[0]],
      { icon: marcadorData.icon }
    ).addTo(map);

    marker.bindPopup(
      buildOccurrencePopupHtml({
        nomeOcorrencia: marcadorData.nome,
        addressName: address_name,
        createdAt: created_at,
        id,
        likesCount: likes_count,
        likedByAuthUser: liked_by_auth_user,
        isOwner: authStore.user?.id === user_id,
      })
    );

    marcadoresAtivos.set(id, marker);
  });
}

async function removerOcorrencia(form: InactivateOccurrenceSchema, id: number) {
  try {
    await occurrenceStore.inactive(form, id);

    const marcadorAtivo = marcadoresAtivos.get(id);
    if (marcadorAtivo) {
      marcadorAtivo.closeTooltip();
      marcadorAtivo.remove();
      marcadoresAtivos.delete(id);
    }

    modalFinalizarOcorrencia.value = false;
    resetCloseForm();

    toast.add({
      title: "Ocorrência inativada",
      description: "Ocorrência inativada com sucesso",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Erro",
      description: "Não foi possível inativar a ocorrência",
      color: "error",
    });
  }
}

async function onSubmitInactivateOccurrence(data: InactivateOccurrenceSchema) {
  if (ocorrenciaRemover.value != null) {
    await removerOcorrencia(data, ocorrenciaRemover.value);
  }
}

async function atualizarMarcador(lat: number, lng: number) {
  localizacaoSelecionada.value = { lat, lng };

  const iconePadrao = markerIcons.Padrao.icon;

  if (!marcador) {
    marcador = L.marker([lat, lng], {
      draggable: true,
      icon: iconePadrao,
    }).addTo(map);
  }

  marcador
    .setLatLng([lat, lng])
    .bindPopup(INFORM_PROBLEM_POPUP_HTML)
    .openPopup();

  marcador.on("moveend", (event) => {
    const novaPosicao = event.target.getLatLng();
    localizacaoSelecionada.value = {
      lat: novaPosicao.lat,
      lng: novaPosicao.lng,
    };
  });
}

async function salvarOcorrencia() {
  if (!localizacaoSelecionada.value) {
    toast.add({
      title: "Localização necessária",
      description: "Marque a localização no mapa antes de salvar.",
      color: "warning",
    });
    return;
  }

  const location: ILocationPoint = {
    type: "Point",
    coordinates: toRequestCoordinates(
      localizacaoSelecionada.value.lat,
      localizacaoSelecionada.value.lng,
    ),
  };

  const occurrencePayload: IOccurrencePayload = {
    location,
    type_id: selectedType.value ?? 1,
    description: descricao.value,
    address_name: enderecoAchado.value?.display_name,
    city: enderecoAchado.value?.address.city,
    state: enderecoAchado.value?.address.state,
    country: enderecoAchado.value?.address.country,
  };

  try {
    await occurrenceStore.addOccurrence(occurrencePayload);
    recarregarMarcadores();
    toast.add({
      title: "Ocorrência criada",
      description: "Ocorrência salva com sucesso.",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Erro",
      description: "Não foi possível salvar ocorrência.",
      color: "error",
    });
    recarregarMarcadores();
  } finally {
    resetCreateForm();
    modalAberto.value = false;
  }
}

function adicionarBotaoRecentrar() {
  const botao = new L.Control({ position: "bottomright" });

  botao.onAdd = function () {
    const div = L.DomUtil.create("div");
    div.innerHTML = buildRecenterButtonHtml();

    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return div;
  };

  botao.addTo(map);
}

function recarregarMarcadores() {
  marcadoresAtivos.forEach((marker) => marker.remove());
  marcadoresAtivos.clear();
  adicionarMarcadoresSalvos();
}

function handleLikeClick(btnLike: HTMLElement) {
  const id = btnLike.getAttribute("data-id");
  if (!id) return;

  occurrenceStore
    .toggleLikeOccurrence(Number(id))
    .then((updatedOccurrence) => {
      if (!updatedOccurrence) return;

      const popupEl = btnLike.closest(".leaflet-popup-content");
      const contadorEl = popupEl?.querySelector(".contador") as HTMLElement | null;
      const svgEl = btnLike.querySelector("svg");

      if (contadorEl) {
        contadorEl.textContent = String(updatedOccurrence.likes_count);
      }

      if (svgEl) {
        svgEl.classList.toggle(
          "text-indigo-500",
          updatedOccurrence.liked_by_auth_user
        );
      }
    })
    .catch(() => {
      toast.add({
        title: "Erro",
        description: "Não foi possível dar like na ocorrência",
        color: "error",
      });
    });
}

async function openCreateModal() {
  if (!authStore.user) {
    toast.add({
      title: "Erro",
      description: "Faça o login pra informar uma ocorrência",
      color: "error",
    });
    return;
  }

  modalAberto.value = true;

  if (localizacaoSelecionada.value) {
    enderecoAchado.value =
      (await buscarEndereco(
        localizacaoSelecionada.value.lat,
        localizacaoSelecionada.value.lng
      )) ?? null;
  }
}

function recentralizarMapa(target: HTMLButtonElement) {
  const texto = document.getElementById("btn-recentralizar-texto");
  const spinner = document.getElementById("btn-recentralizar-loading");

  target.disabled = true;
  texto?.classList.add("hidden");
  spinner?.classList.remove("hidden");

  const finalizar = () => {
    target.disabled = false;
    texto?.classList.remove("hidden");
    spinner?.classList.add("hidden");
  };

  if (!("geolocation" in navigator)) {
    toast.add({
      title: "Geolocalização não disponível no seu navegador.",
      icon: "i-heroicons-map-pin",
      color: "error",
    });
    finalizar();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      await atualizarMarcador(coords.latitude, coords.longitude);
      map.setView([coords.latitude, coords.longitude], 16);
      finalizar();
    },
    (err) => {
      toast.add({
        title: "Não foi possível obter sua localização.",
        description:
          "Verifique se você concedeu permissão de acesso à sua localização para este site nas configurações do navegador e tente novamente.",
        icon: "i-heroicons-x-circle",
        color: "error",
        duration: 10000,
      });
      console.error("Erro ao obter localização:", err);
      finalizar();
    }
  );
}

watch(() => authStore.user?.id, () => recarregarMarcadores());

onMounted(async () => {
  isClient.value = true;
  await nextTick();
  await occurrenceStore.loadOccurrences();

  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, { closePopupOnClick: false }).setView(
    DEFAULT_MAP_CENTER,
    DEFAULT_MAP_ZOOM
  );

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }
  ).addTo(map);

  adicionarLegenda();
  adicionarBotaoRecentrar();

  handleMapClick = async (event: L.LeafletMouseEvent) => {
    const { lat, lng } = event.latlng;
    await atualizarMarcador(lat, lng);
  };
  map.on("click", handleMapClick);

  handleDocumentClick = async (event: Event) => {
    const target = event.target as HTMLElement;

    if (target.classList.contains("btn-remover")) {
      ocorrenciaRemover.value = Number(target.dataset.id);
      modalFinalizarOcorrencia.value = true;
      return;
    }

    const btnLike = target.closest(".btn-like") as HTMLElement | null;
    if (btnLike) {
      handleLikeClick(btnLike);
      return;
    }

    if (target.id === "abrir-modal") {
      await openCreateModal();
      return;
    }

    if (target.id === "btn-recentralizar") {
      recentralizarMapa(target as HTMLButtonElement);
    }
  };

  document.addEventListener("click", handleDocumentClick);
  adicionarMarcadoresSalvos();

  try {
    const { types_occurrence } = await $fetch<{ types_occurrence: ITypeOccurrence[] }>(
      "/api/types-occurrence",
    );
    types.value = types_occurrence;
  } catch (error) {
    console.error("Erro ao carregar tipos de ocorrência:", error);
  }
});

onUnmounted(() => {
  if (map && handleMapClick) {
    map.off("click", handleMapClick);
  }
  if (handleDocumentClick) {
    document.removeEventListener("click", handleDocumentClick);
  }
  if (map) {
    map.remove();
  }
});
</script>
