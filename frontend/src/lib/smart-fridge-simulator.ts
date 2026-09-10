export type SmartFridgeMeasurementPayload = {
  householdId: number;
  sourceId: string;
  metric: "temperature_c";
  value: number;
  measuredAt: string;
};

export const SMART_FRIDGE_SOURCE_ID = "sim-fridge-01";

export function produceSmartFridgeMeasurement(
  householdId: number,
  mode: "normal" | "aberrant" = "normal",
): SmartFridgeMeasurementPayload {
  const value =
    mode === "aberrant"
      ? 999
      : Number((3 + Math.random() * 3).toFixed(1));

  return {
    householdId,
    sourceId: SMART_FRIDGE_SOURCE_ID,
    metric: "temperature_c",
    value,
    measuredAt: new Date().toISOString(),
  };
}
