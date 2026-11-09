import { tempoAtras } from "~/util/date";

function formatShortAddress(addressName: string) {
  const parts = addressName.split(",");
  return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : addressName;
}

function likeButtonHtml(id: number, likesCount: number, liked: boolean) {
  const likedClass = liked
    ? "text-indigo-500"
    : "hover:text-indigo-500";

  return `
    <div class="flex items-center space-x-1">
      <button data-id="${id}" class="btn-like cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-[18px] ${likedClass}" viewBox="0 0 24 24">
          <path fill="currentColor" d="M23 10a2 2 0 0 0-2-2h-6.32l.96-4.57c.02-.1.03-.21.03-.32c0-.41-.17-.79-.44-1.06L14.17 1L7.59 7.58C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73zM1 21h4V9H1z"/>
        </svg>
      </button>
      <div class="text-xs contador">${likesCount}</div>
    </div>
  `;
}

export function buildOccurrencePopupHtml(options: {
  nomeOcorrencia: string;
  addressName: string;
  createdAt: string;
  id: number;
  likesCount: number;
  likedByAuthUser: boolean;
  isOwner: boolean;
}) {
  const {
    nomeOcorrencia,
    addressName,
    createdAt,
    id,
    likesCount,
    likedByAuthUser,
    isOwner,
  } = options;

  const closeButton = isOwner
    ? `
      <button data-id="${id}" style="cursor: pointer;"
        class="px-2 py-1 text-xs font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 btn-remover">
        Encerrar
      </button>
    `
    : "";

  return `
    <div>
      <p class="text-base"><strong>${nomeOcorrencia}</strong></p>
      <ul>
        <li>${formatShortAddress(addressName)}</li>
        <li class="text-xs text-gray-500">${tempoAtras(createdAt)}</li>
      </ul>
      <div class="mt-4 flex justify-between">
        ${likeButtonHtml(id, likesCount, likedByAuthUser)}
        <div>${closeButton}</div>
      </div>
    </div>
  `;
}

export const INFORM_PROBLEM_POPUP_HTML = `
  <button id="abrir-modal"
    class="bg-indigo-700 hover:bg-indigo-800 text-white text-sm px-3 py-1 rounded shadow cursor-pointer">
    Informar Problema
  </button>
`;

export function buildRecenterButtonHtml() {
  return `
    <button id="btn-recentralizar"
      class="mb-1 block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-lg shadow-md cursor-pointer flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" id="btn-recentralizar-texto" class="w-4 h-4 me-1 text-white" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 6.5A2.5 2.5 0 0 1 14.5 9a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 9.5 9A2.5 2.5 0 0 1 12 6.5M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5c0 1 0 3 5 9.71C17 12 17 10 17 9a5 5 0 0 0-5-5"/>
      </svg>
      <svg aria-hidden="true" role="status" class="w-4 h-4 me-1 text-white animate-spin hidden" id="btn-recentralizar-loading" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
      </svg>
      Localização Atual
    </button>
  `;
}

export function formatTableAddress(address: string | null) {
  if (!address) return "";
  const parts = address.split(",");
  return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : address;
}
