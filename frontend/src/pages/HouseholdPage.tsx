import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../household-dashboard.css";

type Household = {
  id: number;
  name: string;
  createdAt: string;
  role: "OWNER" | "MEMBER";
};

type Invitation = {
  id: number;
  email: string;
  status: "PENDING" | "ACCEPTED";
  createdAt?: string;
};


type HouseholdPerson = {
  membershipId?: number;
  invitationId?: number;
  userId: number | null;
  name: string | null;
  email: string;
  status: "OWNER" | "MEMBER" | "INVITED";
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getRoleLabel(role: Household["role"]) {
  return role === "OWNER" ? "Propriétaire" : "Membre";
}

function getPersonStatusLabel(status: HouseholdPerson["status"]) {
  if (status === "OWNER") return "Propriétaire";
  if (status === "INVITED") return "Invité";
  return "Membre";
}

export function HouseholdPage() {
  const navigate = useNavigate();

  const [householdName, setHouseholdName] = useState("");
  const [households, setHouseholds] = useState<Household[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loadError, setLoadError] = useState("");
  const [householdError, setHouseholdError] = useState("");
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false);

  const [people, setPeople] = useState<HouseholdPerson[]>([]);
  const [peopleError, setPeopleError] = useState("");
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);

  const [invitationEmail, setInvitationEmail] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const [invitationSuccess, setInvitationSuccess] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadHouseholds() {
      try {
        const response = await fetch("/api/households", {
          credentials: "include",
        });

        if (!active) return;

        if (response.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error("Impossible de charger les foyers.");
        }

        const data = await response.json();
        const availableHouseholds = data.households as Household[];

        if (!active) return;

        setHouseholds(availableHouseholds);

        if (availableHouseholds.length === 1) {
          setHousehold(availableHouseholds[0] ?? null);
        } else {
          setHousehold(null);
        }
      } catch {
        if (active) {
          setLoadError(
            "Impossible de charger vos foyers auprès du serveur MealSaver.",
          );
        }
      } finally {
        if (active) {
          setIsLoadingHouseholds(false);
        }
      }
    }

    void loadHouseholds();

    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    let active = true;

    async function loadPeople() {
      if (!household) {
        setPeople([]);
        setPeopleError("");
        return;
      }

      try {
        setIsLoadingPeople(true);
        setPeopleError("");

        const response = await fetch(
          `/api/households/${household.id}/members`,
          { credentials: "include" },
        );

        if (!active) return;

        if (response.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error("Impossible de charger les membres du foyer.");
        }

        const data = await response.json();

        if (active) {
          setPeople(data.people as HouseholdPerson[]);
        }
      } catch {
        if (active) {
          setPeopleError("Impossible de charger les membres du foyer.");
        }
      } finally {
        if (active) {
          setIsLoadingPeople(false);
        }
      }
    }

    void loadPeople();

    return () => {
      active = false;
    };
  }, [household, navigate]);

  async function handleCreateHousehold(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setHouseholdError("");

    try {
      setIsCreatingHousehold(true);

      const response = await fetch("/api/households", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: householdName,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      if (!response.ok) {
        setHouseholdError(data.error ?? "Impossible de créer le foyer.");
        return;
      }

      const createdHousehold: Household = {
        ...(data.household as Omit<Household, "role">),
        role: "OWNER",
      };

      setHouseholds((current) => [...current, createdHousehold]);
      setHousehold(createdHousehold);
      setHouseholdName("");
    } catch {
      setHouseholdError(
        "Impossible de communiquer avec le serveur MealSaver.",
      );
    } finally {
      setIsCreatingHousehold(false);
    }
  }

  async function handleInviteMember(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!household || household.role !== "OWNER") return;

    setInvitationError("");
    setInvitationSuccess("");

    try {
      setIsInviting(true);

      const response = await fetch(
        `/api/households/${household.id}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: invitationEmail,
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      if (!response.ok) {
        setInvitationError(
          data.error ?? "Impossible d'envoyer l'invitation.",
        );
        return;
      }

      const invitation = data.invitation as Invitation;

      setPeople((current) => [
        ...current,
        {
          invitationId: invitation.id,
          userId: null,
          name: null,
          email: invitation.email,
          status: "INVITED",
        },
      ]);
      setInvitationSuccess(`Invitation envoyée à ${invitation.email}.`);
      setInvitationEmail("");
    } catch {
      setInvitationError(
        "Impossible de communiquer avec le serveur MealSaver.",
      );
    } finally {
      setIsInviting(false);
    }
  }

  const householdMembers = people.filter(
    (person) => person.status !== "INVITED",
  );
  const pendingInvitations = people.filter(
    (person) => person.status === "INVITED",
  );

  if (isLoadingHouseholds) {
    return (
      <main className="household-dashboard">
        <section className="household-create-card">
          <p>Chargement de votre foyer...</p>
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="household-dashboard">
        <section className="household-create-card">
          <p className="form-message form-error" role="alert">
            {loadError}
          </p>
        </section>
      </main>
    );
  }

  if (!household && households.length > 1) {
    return (
      <main className="household-dashboard">
        <section className="household-dashboard-header">
          <div>
            <p className="eyebrow">Votre foyer</p>
            <h1>Choisissez votre espace.</h1>
            <p>
              Votre compte appartient à plusieurs foyers. Sélectionnez celui
              que vous souhaitez utiliser.
            </p>
          </div>

          <div className="household-status">
            <span className="household-badge">
              {households.length} foyers
            </span>
          </div>
        </section>

        <section className="household-create-card">
          <h2>Choisir mon foyer</h2>
          <p>Le foyer sélectionné devient votre espace actif.</p>

          <label htmlFor="household-select">Foyer actif</label>
          <select
            id="household-select"
            className="household-select"
            defaultValue=""
            onChange={(event) => {
              const selectedId = Number(event.target.value);
              setHousehold(
                households.find((item) => item.id === selectedId) ?? null,
              );
            }}
          >
            <option value="" disabled>
              Sélectionner un foyer
            </option>

            {households.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {getRoleLabel(item.role)}
              </option>
            ))}
          </select>
        </section>
      </main>
    );
  }

  if (!household) {
    return (
      <main className="household-dashboard">
        <section className="household-dashboard-header">
          <div>
            <p className="eyebrow">Votre foyer</p>
            <h1>Créez votre espace partagé.</h1>
            <p>
              Commencez par créer votre foyer MealSaver pour organiser ensemble un
              inventaire alimentaire partagé.
            </p>
          </div>

          <div className="household-status">
            <span className="household-badge">Nouveau foyer</span>
          </div>
        </section>

        <section className="household-create-card">
          <h2>Créer mon foyer</h2>
          <p>Donnez un nom clair à votre foyer pour commencer.</p>

          <form className="auth-form" onSubmit={handleCreateHousehold}>
            <label htmlFor="household-name">Nom du foyer</label>
            <input
              id="household-name"
              type="text"
              value={householdName}
              onChange={(event) => setHouseholdName(event.target.value)}
              minLength={2}
              maxLength={80}
              required
            />

            <p className="field-help">Entre 2 et 80 caractères.</p>

            <button
              className="button button-primary button-large"
              type="submit"
              disabled={isCreatingHousehold}
            >
              {isCreatingHousehold ? "Création..." : "Créer mon foyer"}
            </button>
          </form>

          {householdError && (
            <p className="form-message form-error" role="alert">
              {householdError}
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="household-dashboard">
      <section className="household-dashboard-header">
        <div>
          <p className="eyebrow">Foyer actif</p>
          <h1>{household.name}</h1>
          <p>
            Gérez votre accès au foyer et les invitations autorisées depuis
            votre espace MealSaver.
          </p>
        </div>

        <div className="household-status">
          <span className="household-badge">Foyer actif</span>
          <span
            className={`household-badge${
              household.role === "OWNER" ? " household-badge-owner" : ""
            }`}
          >
            {getRoleLabel(household.role)}
          </span>
        </div>
      </section>

      <section className="household-dashboard-grid">
        <article className="household-panel">
          <header className="household-panel-header">
            <h2>Membres du foyer</h2>
            <p>
              Consultez les propriétaires et les membres actifs de ce foyer.
            </p>
          </header>

          <div className="household-panel-body">
            {isLoadingPeople ? (
              <p className="household-empty">Chargement des membres...</p>
            ) : peopleError ? (
              <p className="form-message form-error" role="alert">
                {peopleError}
              </p>
            ) : householdMembers.length === 0 ? (
              <p className="household-empty">Aucun membre à afficher.</p>
            ) : (
              <div className="household-invitations">
                {householdMembers.map((person) => (
                  <div
                    className="household-member-card"
                    key={
                      person.userId !== null
                        ? `user-${person.userId}`
                        : `invitation-${person.invitationId}`
                    }
                  >
                    <div className="household-avatar">
                      {getInitials(person.name ?? person.email)}
                    </div>

                    <div className="household-member-info">
                      <strong>{person.name ?? person.email}</strong>
                      {person.name && <span>{person.email}</span>}
                    </div>

                    <span
                      className={`household-badge${
                        person.status === "OWNER"
                          ? " household-badge-owner"
                          : ""
                      }`}
                    >
                      {getPersonStatusLabel(person.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {households.length > 1 && (
              <div className="household-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setHousehold(null)}
                >
                  Changer de foyer
                </button>
              </div>
            )}
          </div>
        </article>

        <article className="household-panel">
          <header className="household-panel-header">
            <h2>Invitations</h2>
            <p>
              {household.role === "OWNER"
                ? "Invitez une personne à rejoindre ce foyer."
                : "Les invitations sont réservées au propriétaire du foyer."}
            </p>
          </header>

          <div className="household-panel-body">
            {pendingInvitations.length === 0 ? (
              <p className="household-empty">
                Aucune invitation en attente.
              </p>
            ) : (
              <ul className="household-invitations">
                {pendingInvitations.map((invitation) => (
                  <li
                    className="household-invitation-item"
                    key={`invitation-${invitation.invitationId ?? invitation.email}`}
                  >
                    <strong>{invitation.email}</strong>
                    <span>En attente</span>
                  </li>
                ))}
              </ul>
            )}

            {household.role === "OWNER" ? (
              <form className="auth-form" onSubmit={handleInviteMember}>
                <label htmlFor="invitation-email">
                  Courriel du membre
                </label>

                <input
                  id="invitation-email"
                  type="email"
                  value={invitationEmail}
                  onChange={(event) =>
                    setInvitationEmail(event.target.value)
                  }
                  autoComplete="email"
                  placeholder="membre@exemple.com"
                  required
                />

                <button
                  className="button button-primary button-large"
                  type="submit"
                  disabled={isInviting}
                >
                  {isInviting ? "Envoi..." : "Envoyer l'invitation"}
                </button>
              </form>
            ) : (
              <p className="household-note">
                Seul le propriétaire du foyer peut inviter de nouveaux
                membres.
              </p>
            )}

            {invitationError && (
              <p className="form-message form-error" role="alert">
                {invitationError}
              </p>
            )}

            {invitationSuccess && (
              <p className="form-message form-success" role="status">
                {invitationSuccess}
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
