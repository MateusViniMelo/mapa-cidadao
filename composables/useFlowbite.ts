export function useFlowbite() {
  if (process.client) {
    import("flowbite").then(() => {
      // Flowbite inicializado
    });
  }
}
