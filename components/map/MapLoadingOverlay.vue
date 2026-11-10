<template>
  <div
    class="mc-loading absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-5"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="mc-loading__pins" aria-hidden="true">
      <span class="mc-loading__pin" />
      <span class="mc-loading__pin" />
      <span class="mc-loading__pin" />
    </div>
    <p class="mc-loading__text">Carregando ocorrências…</p>
  </div>
</template>

<style scoped>
.mc-loading {
  background: color-mix(in oklch, var(--mc-card) 88%, transparent);
  color: var(--mc-ink);
  font-family: var(--mc-font);
  font-weight: 550;
  animation: mc-fade 0.3s var(--mc-ease) both;
}

.mc-loading__pins {
  display: flex;
  align-items: flex-end;
  gap: 0.85rem;
  height: 2.75rem;
}

.mc-loading__pin {
  position: relative;
  width: 1.05rem;
  height: 1.05rem;
  background: var(--mc-accent);
  border-radius: 50% 50% 50% 0;
  box-shadow: 0 8px 14px color-mix(in oklch, var(--mc-accent) 35%, transparent);
  transform: rotate(-45deg);
  animation: mc-pin 1.35s var(--mc-ease) infinite;
}
.mc-loading__pin::after {
  content: "";
  position: absolute;
  inset: 0.28rem;
  background: var(--mc-card);
  border-radius: 50%;
}
.mc-loading__pin:nth-child(2) {
  background: var(--ui-color-tertiary-500);
  animation-delay: 0.18s;
}
.mc-loading__pin:nth-child(3) {
  background: var(--ui-color-tertiary-700);
  animation-delay: 0.36s;
}

.mc-loading__text {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}

@keyframes mc-pin {
  0%,
  60%,
  100% {
    transform: translateY(0) rotate(-45deg);
  }
  30% {
    transform: translateY(-1.4rem) rotate(-45deg);
  }
}
@keyframes mc-fade {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mc-loading,
  .mc-loading__pin {
    animation: none;
  }
}
</style>
