import { FormEvent, useState } from "react";

export function AddFoodForm({ householdId }: { householdId: number }) {
  const [name, setName] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ householdId, name }),
    });
    if (response.ok) setName("");
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="food-name">Aliment</label>
      <input id="food-name" value={name} onChange={(e) => setName(e.target.value)} required />
      <button type="submit">Ajouter</button>
    </form>
  );
}
