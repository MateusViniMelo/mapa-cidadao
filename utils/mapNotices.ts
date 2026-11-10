export const mapNotices = {
  loginRequired: {
    title: "Erro",
    description: "Faça o login pra informar uma ocorrência",
    color: "error" as const,
  },
  pointRequired: {
    title: "Localização necessária",
    description: "Marque a localização no mapa antes de salvar.",
    color: "warning" as const,
  },
  created: {
    title: "Ocorrência criada",
    description: "Ocorrência salva com sucesso.",
    color: "success" as const,
  },
  createError: {
    title: "Erro",
    description: "Não foi possível salvar ocorrência.",
    color: "error" as const,
  },
  likeError: {
    title: "Erro",
    description: "Não foi possível dar like na ocorrência",
    color: "error" as const,
  },
  inactivated: {
    title: "Ocorrência inativada",
    description: "Ocorrência inativada com sucesso",
    color: "success" as const,
  },
  inactivateError: {
    title: "Erro",
    description: "Não foi possível inativar a ocorrência",
    color: "error" as const,
  },
  geoUnavailable: {
    title: "Geolocalização não disponível no seu navegador.",
    icon: "i-heroicons-map-pin",
    color: "error" as const,
  },
  geoDenied: {
    title: "Não foi possível obter sua localização.",
    description:
      "Verifique se você concedeu permissão de acesso à sua localização para este site nas configurações do navegador e tente novamente.",
    icon: "i-heroicons-x-circle",
    color: "error" as const,
    duration: 10000,
  },
};
