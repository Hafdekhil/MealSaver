import { useState } from "react";
import type { FormEvent } from "react";

type StorageLocation = "FRIDGE" | "PANTRY" | "FREEZER";

type AddFoodFormProps = {
  householdId: number;
  onCreated?: () => void;
};

export function AddFoodForm({ householdId, onCreated }: AddFoodFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [storageLocation, setStorageLocation] =
    useState<StorageLocation>("FRIDGE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Le nom de l'aliment est obligatoire.");
      return;
    }

    const parsedQuantity =
      quantity.trim() === "" ? undefined : Number(quantity);

    if (
      parsedQuantity !== undefined &&
      (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0)
    ) {
      setError("La quantité doit être supérieure à 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          householdId,
          name: trimmedName,
          ...(parsedQuantity !== undefined
            ? { quantity: parsedQuantity }
            : {}),
          ...(unit.trim() ? { unit: unit.trim() } : {}),
          ...(expiresAt ? { expiresAt } : {}),
          storageLocation,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? "Impossible d'ajouter l'aliment.");
        return;
      }

      setName("");
      setQuantity("");
      setUnit("");
      setExpiresAt("");
      setStorageLocation("FRIDGE");
      setSuccess("Aliment ajouté à l'inventaire.");
      onCreated?.();
    } catch {
      setError("Impossible de communiquer avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <label htmlFor="food-name">Aliment</label>
        <input
          id="food-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          required
        />
      </div>

      <div>
        <label htmlFor="food-quantity">Quantité</label>
        <input
          id="food-quantity"
          type="number"
          min="0.01"
          step="any"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="food-unit">Unité</label>
        <input
          id="food-unit"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          maxLength={30}
        />
      </div>

      <div>
        <label htmlFor="food-location">Emplacement</label>
        <select
          id="food-location"
          value={storageLocation}
          onChange={(event) =>
            setStorageLocation(event.target.value as StorageLocation)
          }
          required
        >
          <option value="FRIDGE">Frigo</option>
          <option value="PANTRY">Garde-manger</option>
          <option value="FREEZER">Congélateur</option>
        </select>
      </div>

      <div>
        <label htmlFor="food-expiration">Date d'expiration</label>
        <input
          id="food-expiration"
          type="date"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
      </div>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
