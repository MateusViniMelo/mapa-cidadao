export function formatShortAddress(addressName: string) {
  const parts = addressName.split(",");
  if (parts.length < 2) return addressName;
  return `${parts[0].trim()}, ${parts[1].trim()}`;
}

export function formatTableAddress(address: string | null) {
  if (!address) return "";
  const parts = address.split(",");
  return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : address;
}
