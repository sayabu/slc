import config from "@/data/buildings.json";
export const buildings = config;
export function buildingConfig(id: string) {
  const value = buildings.find((b) => b.id === id);
  if (!value) throw new Error("Select a supported building type.");
  return value;
}
