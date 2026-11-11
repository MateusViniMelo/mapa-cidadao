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
          :icon-url="markerFor(ocorrencia.type_id).iconUrl"
          :address-name="ocorrencia.address_name"
          :created-at="ocorrencia.created_at"
          :occurrence-id="ocorrencia.id"
          :likes-count="ocorrencia.likes_count"
          :liked="ocorrencia.liked_by_auth_user"
          :liking="likingId === ocorrencia.id"
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
      anchor="bottom"
      :offset="draftPopupOffset"
      :close-on-click="false"
      max-width="none"
    >
      <MapPopupContent mode="draft" @inform="emit('inform')" />
    </MglPopup>

    <MglNavigationControl
      position="top-right"
      :show-compass="false"
      :show-zoom="true"
    />

    <MglCustomControl position="bottom-right" class="maplibregl-ctrl mc-floating">
      <div class="mc-ctrl" @click.stop>
        <div class="mc-legend-card">
          <button
            type="button"
            class="mc-legend__toggle"
            :aria-expanded="legendOpen"
            aria-controls="map-legend"
            @click="legendOpen = !legendOpen"
          >
            <span>Legenda</span>
            <svg
              class="mc-legend__chevron"
              :class="{ 'is-open': legendOpen }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <ul v-show="legendOpen" id="map-legend" class="mc-legend">
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
          @click="onLocate"
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
import { useCurrentLocation } from "~/composables/useCurrentLocation";
import {
  MglCustomControl,
  MglMap,
  MglMarker,
  MglNavigationControl,
  MglPopup,
  useMap,
} from "@indoorequal/vue-maplibre-gl";
import type { IOccurrence } from "~/interfaces/IOccurrence";
import { legendMarkers, markerFor, markerIcons } from "~/util/makerIcons";
import {
  MAP_CENTER,
  MAP_ZOOM,
  occurrenceLngLat,
  placeCurrentLocation,
  rasterStyle,
} from "~/utils/mapBasemap";

defineProps<{
  occurrences: IOccurrence[];
  userId: number | null;
  likingId: number | null;
}>();

const point = defineModel<{ lat: number; lng: number } | null>("point", {
  default: null,
});

const emit = defineEmits<{
  inform: [];
  like: [id: number];
  close: [id: number];
  "locate-error": [reason: "unavailable" | "denied"];
}>();

const cartoApiKey = useRuntimeConfig().public.cartoApiKey;
const style = computed(() => rasterStyle(cartoApiKey));
const legend = legendMarkers();
const legendOpen = ref(
  import.meta.client ? window.matchMedia("(min-width: 640px)").matches : true,
);
const draftPopupOffset: [number, number] = [
  0,
  -(markerIcons.Padrao.iconSize[1] + 10),
];
const focusToken = ref(0);
const { locating, request } = useCurrentLocation();
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

async function onLocate() {
  const outcome = await request(
    "geolocation" in navigator ? navigator.geolocation : undefined,
  );
  if (outcome.status === "unavailable") {
    emit("locate-error", "unavailable");
    return;
  }
  if (outcome.status === "denied") {
    const err = outcome.error;
    console.error("Erro ao obter localização:", err);
    emit("locate-error", "denied");
    return;
  }
  const coords = {
    latitude: outcome.latitude,
    longitude: outcome.longitude,
  };
  const placed = placeCurrentLocation(coords.latitude, coords.longitude);
  mapInstance.map?.jumpTo(placed.view);
  point.value = placed.point;
  focusToken.value += 1;
}
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
  width: min(18rem, calc(100vw - 4.5rem));
  background: transparent;
  color: var(--mc-ink);
  font-family: var(--mc-font);
  font-weight: 400;
  line-height: 1.3;
  text-align: left;
}

.mc-legend-card {
  overflow: hidden;
  background: var(--mc-card);
  border: 1px solid var(--mc-rule);
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
  border-radius: var(--mc-radius);
  box-shadow: var(--mc-shadow);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
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

.mc-legend__toggle {
  display: flex;
  width: 100%;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.85rem;
  background: transparent;
  color: var(--mc-ink);
  border: 0;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}
.mc-legend__toggle:hover {
  background: color-mix(in oklch, var(--mc-accent) 10%, transparent);
}
.mc-legend__toggle:focus-visible {
  outline: 2px solid var(--mc-accent);
  outline-offset: -2px;
}
.mc-legend__chevron {
  width: 1rem;
  height: 1rem;
  flex: none;
  transition: transform 0.2s var(--mc-ease);
}
.mc-legend__chevron.is-open {
  transform: rotate(180deg);
}

.mc-legend {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.1rem;
  margin: 0;
  padding: 0.35rem 0.85rem 0.7rem;
  list-style: none;
  border-top: 1px solid var(--mc-rule);
}
.mc-legend__item {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  min-height: 1.75rem;
  font-size: 0.875rem;
  line-height: 1.25;
}
.mc-legend__item span {
  overflow-wrap: break-word;
}
.mc-legend__icon {
  width: 1.15rem;
  height: auto;
  flex: none;
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
  .mc-locate__spin,
  .mc-legend__chevron {
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

.maplibregl-map .maplibregl-popup:has(.mc-inform) .maplibregl-popup-content {
  min-width: 17.5rem;
  padding: 0.4rem 3.55rem 0.4rem 0.4rem;
}

.maplibregl-map .maplibregl-popup-content {
  min-width: 15rem;
  max-width: min(19rem, calc(100vw - 2.5rem));
  padding: 0;
  overflow: hidden;
  background: var(--mc-card);
  color: var(--mc-ink);
  border: 1px solid var(--mc-rule);
  border-radius: var(--mc-radius);
  box-shadow: var(--mc-shadow);
  font-family: var(--mc-font);
  font-weight: 400;
  animation: mc-popup-in 0.24s var(--mc-ease) both;
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
  top: 0.4rem;
  right: 0.35rem;
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: var(--mc-radius);
  color: var(--mc-ink-soft);
  font: 1.15rem/1 var(--mc-font);
  transition: background-color 0.2s var(--mc-ease);
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
.maplibregl-map .maplibregl-ctrl-attrib a:hover {
  color: var(--mc-accent);
}

.maplibregl-map .maplibregl-ctrl-group {
  overflow: hidden;
  background: var(--mc-card);
  border: 1px solid var(--mc-rule);
  border-radius: var(--mc-radius);
  box-shadow: var(--mc-shadow);
}
.maplibregl-map .maplibregl-ctrl-group button {
  width: 2.75rem;
  height: 2.75rem;
  background-color: transparent;
}
.maplibregl-map .maplibregl-ctrl-group button + button {
  border-top: 1px solid var(--mc-rule);
}
.maplibregl-map .maplibregl-ctrl-group button:hover {
  background-color: color-mix(in oklch, var(--mc-accent) 12%, var(--mc-card));
}
.maplibregl-map .maplibregl-ctrl-group button:focus-visible {
  outline: 2px solid var(--mc-accent);
  outline-offset: -2px;
}
.dark .maplibregl-map .maplibregl-ctrl-icon {
  filter: invert(1);
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
