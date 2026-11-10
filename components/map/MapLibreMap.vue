<template>
  <MglMap
    :map-style="style"
    :center="MAP_CENTER"
    :zoom="MAP_ZOOM"
    height="100%"
    @map:click="onMapClick"
  >
    <MglMarker
      v-for="ocorrencia in occurrences"
      :key="ocorrencia.id"
      :coordinates="occurrenceLngLat(ocorrencia.location.coordinates)"
      anchor="bottom"
    >
      <template #marker>
        <img
          :src="markerFor(ocorrencia.type_id).iconUrl"
          :width="markerFor(ocorrencia.type_id).iconSize[0]"
          :height="markerFor(ocorrencia.type_id).iconSize[1]"
          alt=""
          class="mc-pin"
        />
      </template>
      <MglPopup :close-on-click="false" max-width="none">
        <MapPopupContent
          mode="occurrence"
          :type-name="markerFor(ocorrencia.type_id).nome"
          :address-name="ocorrencia.address_name"
          :created-at="ocorrencia.created_at"
          :occurrence-id="ocorrencia.id"
          :likes-count="ocorrencia.likes_count"
          :liked="ocorrencia.liked_by_auth_user"
          :is-owner="userId === ocorrencia.user_id"
          @like="emit('like', $event)"
          @close="emit('close', $event)"
        />
      </MglPopup>
    </MglMarker>

    <MglMarker
      v-if="point"
      v-model:coordinates="draftCoordinates"
      :draggable="true"
      anchor="bottom"
    >
      <template #marker>
        <img
          :src="markerIcons.Padrao.iconUrl"
          :width="markerIcons.Padrao.iconSize[0]"
          :height="markerIcons.Padrao.iconSize[1]"
          alt=""
          class="mc-pin mc-pin--draft"
        />
      </template>
    </MglMarker>

    <MglPopup
      v-if="point"
      :key="focusToken"
      :coordinates="[point.lng, point.lat]"
      :close-on-click="false"
      max-width="none"
    >
      <MapPopupContent mode="draft" @inform="emit('inform')" />
    </MglPopup>

    <MglCustomControl position="bottom-right" class="maplibregl-ctrl mc-floating">
      <div class="mc-ctrl" @click.stop>
        <div class="mc-legend-card">
          <p class="mc-legend__title">Legenda</p>
          <ul class="mc-legend">
            <li v-for="item in legend" :key="item.nome" class="mc-legend__item">
              <img
                :src="item.iconUrl"
                :width="item.iconSize[0]"
                alt=""
                class="mc-legend__icon"
              />
              <span>{{ item.nome }}</span>
            </li>
          </ul>
        </div>
        <button
          type="button"
          class="mc-locate"
          :disabled="locating"
          :aria-busy="locating"
          @click="emit('locate')"
        >
          <span v-if="locating" class="mc-locate__spin" aria-hidden="true" />
          <svg
            v-else
            class="mc-locate__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" />
          </svg>
          Localização Atual
        </button>
      </div>
    </MglCustomControl>
  </MglMap>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  MglCustomControl,
  MglMap,
  MglMarker,
  MglPopup,
  useMap,
} from "@indoorequal/vue-maplibre-gl";
import type { IOccurrence } from "~/interfaces/IOccurrence";
import { legendMarkers, markerFor, markerIcons } from "~/util/makerIcons";
import {
  MAP_CENTER,
  MAP_ZOOM,
  currentLocationView,
  occurrenceLngLat,
  rasterStyle,
} from "~/utils/mapBasemap";

defineProps<{
  occurrences: IOccurrence[];
  userId: number | null;
  locating: boolean;
}>();

const point = defineModel<{ lat: number; lng: number } | null>("point", {
  default: null,
});

const emit = defineEmits<{
  inform: [];
  like: [id: number];
  close: [id: number];
  locate: [];
}>();

const cartoApiKey = useRuntimeConfig().public.cartoApiKey;
const style = computed(() => rasterStyle(cartoApiKey));
const legend = legendMarkers();
const focusToken = ref(0);
const mapInstance = useMap();

const draftCoordinates = computed({
  get() {
    if (!point.value) return MAP_CENTER;
    return [point.value.lng, point.value.lat] as [number, number];
  },
  set(value: { lng: number; lat: number }) {
    point.value = { lat: value.lat, lng: value.lng };
  },
});

function isMapChrome(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(".maplibregl-marker, .maplibregl-popup, .maplibregl-ctrl"),
    )
  );
}

function onMapClick(payload: {
  event: {
    lngLat: { lng: number; lat: number };
    originalEvent: MouseEvent;
  };
}) {
  if (isMapChrome(payload.event.originalEvent.target)) return;
  const { lng, lat } = payload.event.lngLat;
  point.value = { lat, lng };
  focusToken.value += 1;
}

function showCurrentLocation(latitude: number, longitude: number) {
  const view = currentLocationView(latitude, longitude);
  mapInstance.map?.jumpTo(view);
  point.value = { lat: latitude, lng: longitude };
  focusToken.value += 1;
}

defineExpose({ showCurrentLocation, occurrenceLngLat });
</script>

<style scoped>
.mc-pin {
  display: block;
  cursor: pointer;
  transform-origin: 50% 100%;
  filter: drop-shadow(0 6px 8px oklch(0.28 0.04 275 / 0.28));
  transition:
    transform 0.28s var(--mc-ease),
    filter 0.28s var(--mc-ease);
}
.mc-pin:hover {
  transform: translateY(-3px) scale(1.06);
  filter: drop-shadow(0 10px 12px oklch(0.28 0.04 275 / 0.32));
}
.mc-pin--draft {
  cursor: grab;
  animation: mc-drop 0.45s var(--mc-ease) backwards;
}
.mc-pin--draft:active {
  cursor: grabbing;
}

.mc-ctrl {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: min(16rem, calc(100vw - 4.5rem));
  background: transparent;
  color: var(--mc-ink);
  font-family: var(--mc-font);
  font-weight: 550;
  line-height: 1.25;
  text-align: left;
}

.mc-legend-card {
  overflow: hidden;
  background: var(--mc-card);
  border-radius: var(--mc-radius);
  box-shadow: var(--mc-shadow);
}

.mc-locate {
  display: flex;
  width: 100%;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: var(--mc-accent);
  color: var(--mc-on-accent);
  border: 0;
  border-radius: 999px;
  box-shadow: var(--mc-shadow);
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background-color 0.2s var(--mc-ease);
}
.mc-locate:hover:not(:disabled) {
  background: var(--mc-accent-hover);
}
.mc-locate:focus-visible {
  outline: 2px solid var(--mc-accent);
  outline-offset: 3px;
}
.mc-locate:disabled {
  cursor: progress;
  opacity: 0.72;
}
.mc-locate__icon {
  width: 1.1rem;
  height: 1.1rem;
  flex: none;
}
.mc-locate__spin {
  width: 1.05rem;
  height: 1.05rem;
  flex: none;
  border: 2px solid color-mix(in oklch, var(--mc-on-accent) 35%, transparent);
  border-top-color: var(--mc-on-accent);
  border-radius: 50%;
  animation: mc-spin 0.8s linear infinite;
}

.mc-legend__title {
  margin: 0;
  padding: 0.75rem 0.9rem 0.15rem;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--mc-ink-soft);
}

.mc-legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem 0.6rem;
  margin: 0;
  padding: 0.35rem 0.9rem 0.8rem;
  list-style: none;
}
.mc-legend__item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  font-size: 0.78rem;
  line-height: 1.15;
}
.mc-legend__item span {
  overflow-wrap: anywhere;
}
.mc-legend__icon {
  width: 0.95rem;
  height: auto;
  flex: none;
}

@media (min-width: 640px) {
  .mc-ctrl {
    width: 15.5rem;
  }
  .mc-legend {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
  .mc-legend__item {
    padding: 0.28rem 0;
    font-size: 0.84rem;
  }
  .mc-legend__icon {
    width: 1.05rem;
  }
}

@keyframes mc-drop {
  from {
    opacity: 0;
    transform: translateY(-18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes mc-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mc-pin,
  .mc-pin--draft,
  .mc-locate__spin {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition: none;
  }
}
</style>

<style>
.maplibregl-map {
  font-family: var(--mc-font);
}
.maplibregl-map .mc-floating {
  background: transparent;
  border: 0;
  box-shadow: none;
}
.maplibregl-map .maplibregl-canvas-container.maplibregl-interactive {
  cursor: grab;
}
.maplibregl-map .maplibregl-canvas-container.maplibregl-interactive:active {
  cursor: grabbing;
}

.maplibregl-map .maplibregl-popup-content {
  min-width: 15rem;
  max-width: min(19rem, calc(100vw - 2.5rem));
  padding: 0;
  overflow: hidden;
  background: var(--mc-card);
  color: var(--mc-ink);
  border: 0;
  border-radius: var(--mc-radius);
  box-shadow: var(--mc-shadow);
  font-family: var(--mc-font);
  font-weight: 550;
  animation: mc-popup-in 0.34s var(--mc-ease) both;
}
.maplibregl-map [class*="maplibregl-popup-anchor-bottom"] .maplibregl-popup-tip {
  border-top-color: var(--mc-card);
}
.maplibregl-map [class*="maplibregl-popup-anchor-top"] .maplibregl-popup-tip {
  border-bottom-color: var(--mc-card);
}
.maplibregl-map .maplibregl-popup-anchor-left .maplibregl-popup-tip {
  border-right-color: var(--mc-card);
}
.maplibregl-map .maplibregl-popup-anchor-right .maplibregl-popup-tip {
  border-left-color: var(--mc-card);
}
.maplibregl-map .maplibregl-popup-close-button {
  top: 0.55rem;
  right: 0.45rem;
  width: 1.75rem;
  height: 1.75rem;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 999px;
  color: var(--mc-ink-soft);
  font: 1.15rem/1 var(--mc-font);
  transition: background-color 0.18s var(--mc-ease);
}
.maplibregl-map .maplibregl-popup-close-button:hover {
  background: color-mix(in oklch, var(--mc-ink) 8%, transparent);
  color: var(--mc-ink);
}
.maplibregl-map .maplibregl-popup-close-button:focus-visible {
  outline: 2px solid var(--mc-accent);
  outline-offset: 1px;
}

.maplibregl-map .maplibregl-ctrl-attrib.maplibregl-compact,
.maplibregl-map .maplibregl-ctrl-attrib {
  background: color-mix(in oklch, var(--mc-card) 88%, transparent);
  color: var(--mc-ink-soft);
  border-radius: 0.4rem;
  font-family: var(--mc-font);
  font-size: 0.68rem;
}
.maplibregl-map .maplibregl-ctrl-attrib a {
  color: var(--mc-ink-soft);
}

@keyframes mc-popup-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .maplibregl-map .maplibregl-popup-content {
    animation-duration: 0.01ms;
  }
}
</style>
