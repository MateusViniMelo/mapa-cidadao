import { initFlowbite } from "flowbite";
import { useFlowbite } from "~/composables/useFlowbite";

export function useInitFlowbite() {
  onMounted(() => {
    useFlowbite(() => {
      initFlowbite();
    });
  });
}
