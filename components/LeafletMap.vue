<template>
  <div>
    <div
      v-if="isClient"
      class="relative h-[700px] lg:h-[800px] w-full overflow-hidden rounded-md shadow"
    >
      <div ref="mapContainer" class="h-full w-full" />
      <div
        v-if="loadingOcurrences"
        class="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 rounded-md bg-white/80 backdrop-blur-sm dark:bg-gray-950/80"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="size-10 animate-spin text-indigo-600 dark:text-indigo-400"
        />
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
          Carregando ocorrências…
        </p>
      </div>
    </div>
  </div>
  <UModal
    v-model:open="modalAberto"
    title="Criar Ocorrência"
    :close="{
      color: 'tertiary',
      variant: 'outline',
      class: 'rounded-full',
      onClick() {
        enderecoAchado = null;
        descricao = '';
      },
    }"
  >
    <template #body>
      <div>
        <!-- Formulário aqui -->
        <form @submit.prevent="salvarOcorrencia" class="space-y-4">
          <UFormField label="Endereço" size="lg" readonly>
            <UInput
              :loading="carregando"
              size="lg"
              :value="enderecoAchado?.display_name ?? null"
              readonly
              class="w-full"
              color="tertiary"
            />
            <p
              class="mt-2 text-sm text-yellow-600 dark:text-yellow-500"
              v-if="erroEndereco"
            >
              Não foi possível obter o endereço, mas ainda é possível salvar a
              ocorrência.
            </p>
          </UFormField>

          <UFormField label="Categoria" required size="lg">
            <USelect
              v-model="selectedType"
              :items="options"
              class="w-full"
              placeholder="Selecione uma categoria"
              color="tertiary"
            />
          </UFormField>
          <UFormField label="Descrição do problema" size="lg">
            <UTextarea
              placeholder="Descreva a Ocorrência"
              v-model="descricao"
              color="tertiary"
              class="w-full"
              :maxlength="maxLength"
              aria-describedby="character-count"
              :ui="{ trailing: 'pointer-events-none' }"
            >
              <template #trailing>
                <div
                  id="character-count"
                  class="absolute bottom-1 right-2 text-xs text-muted tabular-nums"
                  aria-live="polite"
                  role="status"
                >
                  {{ descricao?.length }}/{{ maxLength }}
                </div>
              </template>
            </UTextarea>
          </UFormField>
          <UButton
            type="submit"
            :loading="ocurrenceStore.loading || carregando"
            :disabled="selectedType === null || selectedType === undefined"
            color="tertiary"
            :ui="{ base: 'text-white cursor-pointer ' }"
            block
          >
            Salvar
          </UButton>
        </form>
      </div>
    </template>
  </UModal>
  <UModal
    v-model:open="modalFinalizarOcorrencia"
    title="Encerrar Ocorrência"
    :close="{
      onClick() {
        resetFormFinalizarOcorrencia();
      },
    }"
  >
    <template #body>
      <UForm
        :schema="inactiveOccurrenceSchema"
        :state="inactiveOcurrenceState"
        @submit="onSubmitInactivateOcurrence"
        class="space-y-4"
      >
        <div class="flex justify-between space-x-4">
          <UFormField
            label="Qual o motivo do encerramento?"
            required
            size="lg"
            name="type_closure"
            class="w-full"
          >
            <USelect
              placeholder="Escolha o tipo"
              v-model="inactiveOcurrenceState.type_closure"
              :items="tiposEncerramentoOcorrencia"
              class="w-full"
            />
          </UFormField>
          <UFormField
            :label="
              inactiveOcurrenceState.type_closure === 'resolved'
                ? 'Data de solução do problema?'
                : 'Data de quando aconteceu?'
            "
            name="resolution_date"
            class="w-full"
            size="lg"
            v-if="
              inactiveOcurrenceState.type_closure === 'other' ||
              inactiveOcurrenceState.type_closure === 'resolved'
            "
          >
            <UInput
              v-model="inactiveOcurrenceState.resolution_date"
              color="tertiary"
              class="w-full"
              type="date"
            />
          </UFormField>
        </div>

        <UFormField
          label="Descreva o motivo?"
          size="lg"
          name="solution_description"
          required
          v-if="
            inactiveOcurrenceState.type_closure === 'other' ||
            inactiveOcurrenceState.type_closure === 'resolved'
          "
        >
          <UTextarea
            v-model="inactiveOcurrenceState.solution_description"
            color="tertiary"
            class="w-full"
            :maxlength="500"
            aria-describedby="character-count"
            :ui="{ trailing: 'pointer-events-none' }"
          >
            <template #trailing>
              <div
                id="character-count"
                class="absolute bottom-1 right-2 text-xs text-muted tabular-nums"
                aria-live="polite"
                role="status"
              >
                {{ inactiveOcurrenceState.solution_description?.length }}/{{
                  500
                }}
              </div>
            </template>
          </UTextarea>
        </UFormField>

        <UButton
          type="submit"
          color="error"
          :ui="{ base: 'text-white cursor-pointer ' }"
          :loading="ocurrenceStore.loading"
          block
        >
          Encerrar
        </UButton>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useReverseGeocoding } from "@/composables/useReverseGeocoding";
import type { FormSubmitEvent } from "@nuxt/ui";
import { markerIcons } from "@/util/makerIcons";
import { useOcurrenceStore } from "#imports";
import { tempoAtras } from "@/util/date";
import { useAuthStore } from "#imports";
import { useTypesOcurrencesService } from "#imports";
import type { ITypeOcurrence } from "~/interfaces/ITypeOcurrence";
import type { ILocationPoint } from "~/interfaces/ILocationPoint";
import type { IOcurrencePayload } from "~/interfaces/IOcurrencePayload";
import type { EnderecoNominatim } from "~/interfaces/EnderecoNominatim";
import {
  inactiveOccurrenceSchema,
  type InactivateOcurrenceSchema,
} from "@/validators/inactivateOcurrenceSchema";
import { TypeOccurrenceClosure } from "~/enums/TypeOcurrenceClosure";
const mapContainer = ref<HTMLElement | null>(null);
const marcadoresAtivos = new Map<number, L.Marker>();
const isClient = ref(false);
const localizacaoSelecionada = ref<{ lat: number; lng: number } | null>(null);
const descricao = ref("");
const categoria = ref("");
const enderecoAchado = ref<EnderecoNominatim | null>(null);
const { buscarEndereco, carregando, erroEndereco } = useReverseGeocoding();

const carregandoLocalizacao = ref(false);
const maxLength = 250;
const authStore = useAuthStore();
const ocurrenceStore = useOcurrenceStore();
const { ocurrences, loadingOcurrences } = storeToRefs(ocurrenceStore);
const typesOcurrenceService = useTypesOcurrencesService();
const { fetchTypesOcurrence } = typesOcurrenceService;
const modalAberto = ref(false);

const ocorrenciaRemover = ref<null | number>(null);

const modalFinalizarOcorrencia = ref(false);

const tiposEncerramentoOcorrencia = ref([
  {
    label: "Problema Resolvido",
    value: "resolved",
  },
  {
    label: "Criei Errado",
    value: "mistake",
  },
  {
    label: "Outro motivo",
    value: "other",
  },
]);
const inactiveOcurrenceState = reactive<Partial<InactivateOcurrenceSchema>>({
  type_closure: TypeOccurrenceClosure.RESOLVED,
  solution_description: undefined,
  resolution_date: undefined,
});
async function onSubmitInactivateOcurrence(
  event: FormSubmitEvent<InactivateOcurrenceSchema>
) {
  if (ocorrenciaRemover.value != null) {
    await removerOcorrencia(event.data, ocorrenciaRemover.value);
  }
}

let marcador: L.Marker | null = null;
let map: L.Map;

const toast = useToast();

const types = ref<ITypeOcurrence[]>([]);
const loading = ref(true);
const selectedType = ref<number | undefined>(undefined);

function adicionarLegenda() {
  const legenda = new L.Control({ position: "bottomright" });

  legenda.onAdd = function () {
    const div = L.DomUtil.create(
      "div",
      "leaflet-legend  p-2 rounded-2xl text-sm space-y-1 shadow-2xl bg-white border border-gray-200  "
    );

    const categorias = Object.keys(markerIcons);

    div.innerHTML = categorias
      .filter((categoria) => categoria !== "Padrao")
      .map((categoria) => {
        const { icon, nome } = markerIcons[categoria];
        return `
  <div class="flex items-center gap-2">
    <img src="${icon.options.iconUrl}" class="w-[24px] md:w-[32px]" />
    <span class="text-gray-700  text-xs lg:text-sm">${nome}</span>
  </div>
  `;
      })
      .join("");

    return div;
  };

  legenda.addTo(map);
}

function adicionarMarcadoresSalvos() {
  ocurrences.value.forEach((ocorrencia) => {
    const {
      id,
      description,
      location,
      type_id,
      address_name,
      city,
      country,
      created_at,
      state,
      user_id,
      likes_count,
      liked_by_auth_user,
    } = ocorrencia;

    const marcadorData = markerIcons[type_id] || markerIcons["Padrao"];
    const icon = marcadorData.icon;
    const nomeOcorrencia = marcadorData.nome;

    const marker = L.marker(
      [location.coordinates[1], location.coordinates[0]],
      {
        icon,
      }
    ).addTo(map);

    if (authStore.user?.id === user_id) {
      const likedClass = liked_by_auth_user
        ? "text-indigo-500"
        : "hover:text-indigo-500";
      marker.bindPopup(`
        <div>
          <p class="text-base"><strong>${nomeOcorrencia}</strong><br /></p>

          <ul>
            <li>${`${address_name.split(",")[0]}, ${
              address_name?.split(",")[1]
            }`}</li>
            <li class="text-xs text-gray-500">${tempoAtras(created_at)}</li>
          </ul>

          <div class="mt-4 flex justify-between ">
          <div class="flex items-center space-x-1">
          <button data-id="${id}" class="btn-like cursor-pointer ">
      
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] ${likedClass}" cursor-pointer" viewBox="0 0 24 24"><path fill="currentColor" d="M23 10a2 2 0 0 0-2-2h-6.32l.96-4.57c.02-.1.03-.21.03-.32c0-.41-.17-.79-.44-1.06L14.17 1L7.59 7.58C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73zM1 21h4V9H1z"/></svg>
          </button>
           <div class="text-xs contador"> ${likes_count} </div>

          </div>
          <div class="">
            <button data-id="${id}" style="cursor: pointer;"
              class="px-2 py-1 text-xs font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 btn-remover">
              Encerrar
            </button>
          </div>
          </div>
        </div>
      `);
    } else {
      marker.bindPopup(`
        <div>
          <p class="text-base"><strong>${nomeOcorrencia}</strong><br /></p>

          <ul>
            <li>${`${address_name.split(",")[0]}, ${
              address_name?.split(",")[1]
            }`}</li>
            <li class="text-xs text-gray-500">${tempoAtras(created_at)}</li>
          </ul>

          <div class="mt-4 flex justify-between">
          <div class="flex items-center space-x-1">
          <button ">
      
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] " viewBox="0 0 24 24"><path fill="currentColor" d="M23 10a2 2 0 0 0-2-2h-6.32l.96-4.57c.02-.1.03-.21.03-.32c0-.41-.17-.79-.44-1.06L14.17 1L7.59 7.58C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73zM1 21h4V9H1z"/></svg>
          </button>
           <div class="text-xs contador"> ${likes_count} </div>

          </div>

          </div>

          </div>
        </div>
      `);
    }

    marcadoresAtivos.set(id, marker);
  });
}

async function removerOcorrencia(form: InactivateOcurrenceSchema, id: number) {
  await ocurrenceStore
    .inactive(form, id)
    .then(() => {
      const marcador = marcadoresAtivos.get(id);
      if (marcador) {
        marcador.closeTooltip();
        marcador.remove();
        marcadoresAtivos.delete(id);

        resetFormFinalizarOcorrencia();
      }
      toast.add({
        title: "Ocorrência inativada",
        description: "Ocorrência inativada com sucesso",
        color: "success",
      });
    })
    .catch(() => {
      toast.add({
        title: "Erro",
        description: "Não foi possível inativar a ocorrência",
        color: "error",
      });
    });
}

function resetFormFinalizarOcorrencia() {
  ocorrenciaRemover.value = null;
  inactiveOcurrenceState.type_closure = TypeOccurrenceClosure.RESOLVED;
  inactiveOcurrenceState.solution_description = undefined;
  inactiveOcurrenceState.resolution_date = undefined;
  modalFinalizarOcorrencia.value = false;
}

async function atualizarMarcador(lat: number, lng: number) {
  localizacaoSelecionada.value = { lat, lng };

  const iconePadrao = markerIcons["Padrao"].icon;

  if (!marcador) {
    marcador = L.marker([lat, lng], {
      draggable: true,
      icon: iconePadrao,
    }).addTo(map);

    marcador
      .setLatLng([lat, lng])
      .bindPopup(
        `
          <button id="abrir-modal"
            class="bg-indigo-700 hover:bg-indigo-800 text-white text-sm px-3 py-1 rounded shadow cursor-pointer">
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
    })
    .bindPopup(
      `
        <button id="abrir-modal"
          class="bg-indigo-700 hover:bg-indigo-800 text-white text-sm px-3 py-1 rounded shadow cursor-pointer">
          Informar Problema
        </button>
      `
    )
    .openPopup();
}

async function salvarOcorrencia() {
  if (!localizacaoSelecionada.value) {
    alert("Preencha a descrição e marque a localização.");
    return;
  }
  const location: ILocationPoint = {
    type: "Point",
    coordinates: [
      localizacaoSelecionada.value.lat,
      localizacaoSelecionada.value.lng,
    ],
  };
  const ocurrencePayload: IOcurrencePayload = {
    location: location,
    type_id: selectedType.value ?? 1,
    description: descricao.value,
    address_name: enderecoAchado.value?.display_name,
    city: enderecoAchado.value?.address.city,
    state: enderecoAchado.value?.address.state,
    country: enderecoAchado.value?.address.country,
  };

  await ocurrenceStore
    .addOcurrence(ocurrencePayload)
    .then(() => {
      recarregarMarcadores();
      toast.add({
        title: "Ocorrência criada",
        description: "Ocorrência salva com sucesso.",
        color: "success",
      });
    })
    .catch(() => {
      toast.add({
        title: "Erro",
        description: "Não foi possível salvar ocorrência.",
        color: "error",
      });
      recarregarMarcadores();
    })
    .finally(() => {
      descricao.value = "";
      modalAberto.value = false;
    });
}

function adicionarBotaoRecentrar() {
  const botao = new L.Control({ position: "bottomright" });

  botao.onAdd = function () {
    const div = L.DomUtil.create("div");

    div.innerHTML = `
        <button id="btn-recentralizar"
          class="mb-1 block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg shadow-md cursor-pointer flex items-center justify-center ">
          <svg xmlns="http://www.w3.org/2000/svg" id="btn-recentralizar-texto" class=" w-4 h-4 me-1 text-white " viewBox="0 0 24 24"><path fill="currentColor" d="M12 6.5A2.5 2.5 0 0 1 14.5 9a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 9.5 9A2.5 2.5 0 0 1 12 6.5M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5c0 1 0 3 5 9.71C17 12 17 10 17 9a5 5 0 0 0-5-5"/></svg>



                <svg aria-hidden="true" role="status" class="w-4 h-4 me-1 text-white animate-spin hidden" id="btn-recentralizar-loading" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
  </svg>
          Localização Atual

        </button>
      `;

    // Impede que o clique no botão afete o mapa abaixo
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return div;
  };

  botao.addTo(map);
}

const options = computed(() =>
  types.value.map((t) => ({
    label: t.name,
    value: t.id,
  }))
);

watch(
  () => authStore.user?.id,
  () => recarregarMarcadores()
);

function recarregarMarcadores() {
  marcadoresAtivos.forEach((m) => m.remove());
  marcadoresAtivos.clear();
  adicionarMarcadoresSalvos();
}

let handleDocumentClick: (e: Event) => void;
let handleMapClick: (e: L.LeafletMouseEvent) => void;

onMounted(async () => {
  isClient.value = true;
  await nextTick();
  await ocurrenceStore.loadOcurrences();

  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, { closePopupOnClick: false }).setView(
    [-1.45, -48.49],
    13
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

  handleMapClick = async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    await atualizarMarcador(lat, lng);
  };
  map.on("click", handleMapClick);

  handleDocumentClick = async (e: Event) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains("btn-remover")) {
      const id = Number(target.dataset.id);

      ocorrenciaRemover.value = id;
      modalFinalizarOcorrencia.value = true;

      //removerOcorrencia(id);
    }
    // Substitua seu if por isso:
    const btnLike = (target as HTMLElement).closest(".btn-like") as HTMLElement;

    if (btnLike) {
      const id = btnLike.getAttribute("data-id");
      if (!id) return;

      ocurrenceStore
        .toggleLikeOcurrence(Number(id))
        .then((updatedOcurrence) => {
          if (!updatedOcurrence) return;

          // busca o popup
          const popupEl = btnLike.closest(".leaflet-popup-content");
          const contadorEl = popupEl?.querySelector(".contador") as HTMLElement;
          const svgEl = btnLike.querySelector("svg");

          if (svgEl) {
            // converte de forma segura
            const svgElement = svgEl as unknown as HTMLElement;

            if (updatedOcurrence.liked_by_auth_user) {
              svgElement.classList.add("text-indigo-500");
            } else {
              svgElement.classList.remove("text-indigo-500");
            }
          }

          if (contadorEl) {
            contadorEl.textContent = String(updatedOcurrence.likes_count);
          }

          if (svgEl) {
            if (updatedOcurrence.liked_by_auth_user) {
              svgEl.classList.add("text-indigo-500");
            } else {
              svgEl.classList.remove("text-indigo-500");
            }
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

    if (target.id === "btnInformarProblema") {
      const el = document.querySelector("form");
      el?.scrollIntoView({ behavior: "smooth" });
    }
    if (target.id === "abrir-modal") {
      if (authStore.user === null || authStore.user === undefined) {
        toast.add({
          title: "Erro",
          description: "Faça o login pra informar uma ocorrência",
          color: "error",
        });
      } else {
        modalAberto.value = true;

        if (
          localizacaoSelecionada.value?.lat &&
          localizacaoSelecionada.value?.lng
        ) {
          enderecoAchado.value =
            (await buscarEndereco(
              localizacaoSelecionada.value?.lat,
              localizacaoSelecionada.value?.lng
            )) ?? null;
        }
      }
    }
    if (target.id === "btn-recentralizar") {
      const botao = target as HTMLButtonElement;
      const texto = document.getElementById("btn-recentralizar-texto");
      const spinner = document.getElementById("btn-recentralizar-loading");

      botao.disabled = true;
      carregandoLocalizacao.value = true;
      texto?.classList.add("hidden");
      spinner?.classList.remove("hidden");

      const finalizar = () => {
        carregandoLocalizacao.value = false;
        botao.disabled = false;
        texto?.classList.remove("hidden");
        spinner?.classList.add("hidden");
      };

      if ("geolocation" in navigator) {
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
      } else {
        toast.add({
          title: "Geolocalização não disponível no seu navegador.",
          icon: "i-heroicons-map-pin",
          color: "error",
        });
        finalizar();
      }
    }
  };
  document.addEventListener("click", handleDocumentClick);
  // adicionar marcadores anteriores
  adicionarMarcadoresSalvos();
  try {
    types.value = await fetchTypesOcurrence();
  } finally {
    loading.value = false;
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
    map.remove(); // limpa o mapa do Leaflet (importante em SPA)
  }
});
</script>
