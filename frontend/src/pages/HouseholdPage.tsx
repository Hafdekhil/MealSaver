import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

type ReceivedInvitation = {
  id: number;
  email: string;
  status: "PENDING";
  createdAt: string;
  household: {
    id: number;
    name: string;
  };
  invitedBy: {
    name: string;
  };
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
  const [searchParams] = useSearchParams();
  const invitationParam = searchParams.get("invitation");
  const targetedInvitationId =
    invitationParam && /^\d+$/.test(invitationParam)
      ? Number(invitationParam)
      : null;

  const [householdName, setHouseholdName] = useState("");
  const [households, setHouseholds] = useState<Household[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loadError, setLoadError] = useState("");
  const [householdError, setHouseholdError] = useState("");
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false);
  const [deletingHouseholdId, setDeletingHouseholdId] = useState<number | null>(null);
  const [householdActionError, setHouseholdActionError] = useState("");

  const [people, setPeople] = useState<HouseholdPerson[]>([]);
  const [peopleError, setPeopleError] = useState("");
  const [memberActionError, setMemberActionError] = useState("");
  const [memberActionSuccess, setMemberActionSuccess] = useState("");
  const [removingMembershipId, setRemovingMembershipId] = useState<number | null>(null);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);

  const [invitationEmail, setInvitationEmail] = useState("");
  const [invitationHouseholdId, setInvitationHouseholdId] = useState<number | null>(null);
  const [invitationError, setInvitationError] = useState("");
  const [invitationSuccess, setInvitationSuccess] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [cancelingInvitationId, setCancelingInvitationId] = useState<number | null>(null);
  const [receivedInvitations, setReceivedInvitations] = useState<ReceivedInvitation[]>([]);
  const [receivedInvitationError, setReceivedInvitationError] = useState("");
  const [receivedInvitationSuccess, setReceivedInvitationSuccess] = useState("");
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<number | null>(null);
  const [decliningInvitationId, setDecliningInvitationId] = useState<number | null>(null);
  const [leavingHouseholdId, setLeavingHouseholdId] = useState<number | null>(null);

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
        const firstOwnedHousehold = availableHouseholds.find(
          (item) => item.role === "OWNER",
        );

        setInvitationHouseholdId((current) =>
          current !== null &&
          availableHouseholds.some(
            (item) => item.id === current && item.role === "OWNER",
          )
            ? current
            : firstOwnedHousehold?.id ?? null,
        );

        if (availableHouseholds.length === 1) {
          setHousehold(availableHouseholds[0] ?? null);
        } else {
          setHousehold(null);
        }
        try {
          const invitationResponse = await fetch(
            "/api/households/invitations",
            { credentials: "include" },
          );

          if (!active) return;

          if (invitationResponse.status === 401) {
            navigate("/", { replace: true });
            return;
          }

          const invitationData = await invitationResponse.json();

          if (!invitationResponse.ok) {
            throw new Error(
              invitationData.error ?? "Impossible de charger vos invitations.",
            );
          }

          if (active) {
            setReceivedInvitations(
              invitationData.invitations as ReceivedInvitation[],
            );
          }
        } catch {
          if (active) {
            setReceivedInvitationError(
              "Impossible de charger vos invitations.",
            );
          }
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

    const invitationHousehold =
      household?.role === "OWNER"
        ? household
        : households.find(
            (item) =>
              item.id === invitationHouseholdId && item.role === "OWNER",
          );

    if (!invitationHousehold) {
      setInvitationError("Sélectionnez un foyer dont vous êtes propriétaire.");
      return;
    }

    setInvitationError("");
    setInvitationSuccess("");

    try {
      setIsInviting(true);

      const response = await fetch(
        `/api/households/${invitationHousehold.id}/invitations`,
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

  async function handleDeleteHousehold(targetHousehold: Household) {
    if (targetHousehold.role !== "OWNER") {
      return;
    }

    const confirmed = window.confirm(
      `Supprimer définitivement le foyer "${targetHousehold.name}" ? Les membres, invitations et données partagées de ce foyer seront supprimés. Les comptes MealSaver des utilisateurs ne seront pas supprimés.`,
    );

    if (!confirmed) return;

    setHouseholdActionError("");

    try {
      setDeletingHouseholdId(targetHousehold.id);

      const response = await fetch(
        `/api/households/${targetHousehold.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      if (!response.ok) {
        setHouseholdActionError(
          data.error ?? "Impossible de supprimer ce foyer.",
        );
        return;
      }

      const remainingHouseholds = households.filter(
        (item) => item.id !== targetHousehold.id,
      );

      setHouseholds(remainingHouseholds);

      if (!household || household.id === targetHousehold.id) {
        setPeople([]);
        setHousehold(
          remainingHouseholds.length === 1
            ? remainingHouseholds[0] ?? null
            : null,
        );
      }
    } catch {
      setHouseholdActionError(
        "Impossible de communiquer avec le serveur MealSaver.",
      );
    } finally {
      setDeletingHouseholdId(null);
    }
  }
  async function handleRemoveMember(person: HouseholdPerson) {
    if (
      !household ||
      household.role !== "OWNER" ||
      person.status !== "MEMBER" ||
      !person.membershipId
    ) {
      return;
    }

    const membershipId = person.membershipId;
    const displayName = person.name ?? person.email;

    const confirmed = window.confirm(
      `Retirer ${displayName} du foyer ? Son compte MealSaver ne sera pas supprimé.`,
    );

    if (!confirmed) return;

    setMemberActionError("");
    setMemberActionSuccess("");

    try {
      setRemovingMembershipId(membershipId);

      const response = await fetch(
        `/api/households/${household.id}/members/${membershipId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      if (!response.ok) {
        setMemberActionError(
          data.error ?? "Impossible de retirer ce membre du foyer.",
        );
        return;
      }

      setPeople((current) =>
        current.filter((item) => item.membershipId !== membershipId),
      );

      setMemberActionSuccess(
        data.message ?? `${displayName} a été retiré du foyer.`,
      );
    } catch {
      setMemberActionError(
        "Impossible de communiquer avec le serveur MealSaver.",
      );
    } finally {
      setRemovingMembershipId(null);
    }
  }
  async function handleCancelInvitation(invitation: HouseholdPerson) {
    if (!household || household.role !== "OWNER") return;
    const invitationId = invitation.invitationId;

    if (!invitationId) return;

    const confirmed = window.confirm(
      `Annuler l'invitation envoyée à ${invitation.email} ?`,
    );

    if (!confirmed) return;

    setInvitationError("");
    setInvitationSuccess("");

    try {
      setCancelingInvitationId(invitationId);

      const response = await fetch(
        `/api/households/${household.id}/invitations/${invitationId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      if (!response.ok) {
        setInvitationError(
          data.error ?? "Impossible d'annuler l'invitation.",
        );
        return;
      }

      setPeople((current) =>
        current.filter((person) => person.invitationId !== invitationId),
      );

      setInvitationSuccess(
        data.message ?? `Invitation annulée pour ${invitation.email}.`,
      );
    } catch {
      setInvitationError(
        "Impossible de communiquer avec le serveur MealSaver.",
      );
    } finally {
      setCancelingInvitationId(null);
    }
  }
  async function handleDeclineInvitation(invitation: ReceivedInvitation) {
    const confirmed = window.confirm(
      `Refuser l'invitation à rejoindre "${invitation.household.name}" ?`,
    );

    if (!confirmed) return;

    setReceivedInvitationError("");
    setReceivedInvitationSuccess("");

    try {
      setDecliningInvitationId(invitation.id);

      const response = await fetch(
        `/api/households/invitations/${invitation.id}/decline`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      if (!response.ok) {
        setReceivedInvitationError(
          data.error ?? "Impossible de refuser l'invitation.",
        );
        return;
      }

      setReceivedInvitations((current) =>
        current.filter((item) => item.id !== invitation.id),
      );

      setReceivedInvitationSuccess(
        data.message ?? "Invitation refusée.",
      );

      navigate("/household", { replace: true });
    } catch {
      setReceivedInvitationError(
        "Impossible de communiquer avec le serveur MealSaver.",
      );
    } finally {
      setDecliningInvitationId(null);
    }
  }

  async function handleLeaveHousehold(targetHousehold: Household) {
    if (targetHousehold.role !== "MEMBER") {
      return;
    }

    const confirmed = window.confirm(
      `Quitter le foyer "${targetHousehold.name}" ? Vous perdrez l'accès à ce foyer, mais votre compte MealSaver ne sera pas supprimé.`,
    );

    if (!confirmed) return;

    setHouseholdActionError("");

    try {
      setLeavingHouseholdId(targetHousehold.id);

      const response = await fetch(
        `/api/households/${targetHousehold.id}/membership`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      if (!response.ok) {
        setHouseholdActionError(
          data.error ?? "Impossible de quitter ce foyer.",
        );
        return;
      }

      const remainingHouseholds = households.filter(
        (item) => item.id !== targetHousehold.id,
      );

      setHouseholds(remainingHouseholds);

      if (!household || household.id === targetHousehold.id) {
        setPeople([]);
        setHousehold(
          remainingHouseholds.length === 1
            ? remainingHouseholds[0] ?? null
            : null,
        );
      }
    } catch {
      setHouseholdActionError(
        "Impossible de communiquer avec le serveur MealSaver.",
      );
    } finally {
      setLeavingHouseholdId(null);
    }
  }
  async function handleAcceptInvitation(invitationId: number) {
    setReceivedInvitationError("");
    setReceivedInvitationSuccess("");

    try {
      setAcceptingInvitationId(invitationId);

      const response = await fetch(
        `/api/households/invitations/${invitationId}/accept`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        navigate("/", { replace: true });
        return;
      }

      if (!response.ok) {
        setReceivedInvitationError(
          data.error ?? "Impossible d'accepter l'invitation.",
        );
        return;
      }

      const joinedHousehold = data.household as Household;

      setReceivedInvitations((current) =>
        current.filter((invitation) => invitation.id !== invitationId),
      );

      setHouseholds((current) =>
        current.some((item) => item.id === joinedHousehold.id)
          ? current.map((item) =>
              item.id === joinedHousehold.id ? joinedHousehold : item,
            )
          : [...current, joinedHousehold],
      );

      setHousehold(joinedHousehold);
      setReceivedInvitationSuccess(
        data.message ?? "Invitation acceptee. Vous etes maintenant membre.",
      );
      navigate("/household", { replace: true });
    } catch {
      setReceivedInvitationError(
        "Impossible de communiquer avec le serveur MealSaver.",
      );
    } finally {
      setAcceptingInvitationId(null);
    }
  }
  function renderReceivedInvitations() {
    const orderedInvitations =
      targetedInvitationId === null
        ? receivedInvitations
        : [...receivedInvitations].sort((a, b) => {
            if (a.id === targetedInvitationId) return -1;
            if (b.id === targetedInvitationId) return 1;
            return 0;
          });

    const targetedInvitationMissing =
      targetedInvitationId !== null &&
      !receivedInvitations.some(
        (invitation) => invitation.id === targetedInvitationId,
      );

    if (
      receivedInvitations.length === 0 &&
      !receivedInvitationError &&
      !receivedInvitationSuccess &&
      !targetedInvitationMissing
    ) {
      return null;
    }

    return (
      <section className="household-create-card">
        <h2>
          {targetedInvitationId !== null
            ? "Invitation au foyer"
            : "Invitations reçues"}
        </h2>

        <p>
          Acceptez l'invitation pour rejoindre le foyer existant. Vous n'avez
          pas besoin de créer un nouveau foyer.
        </p>

        {orderedInvitations.length > 0 && (
          <div className="household-invitations">
            {orderedInvitations.map((invitation) => (
              <div
                className="household-member-card"
                key={`received-invitation-${invitation.id}`}
              >
                <div className="household-member-info">
                  <strong>{invitation.household.name}</strong>
                  <span>
                    {invitation.invitedBy.name} vous invite à rejoindre ce foyer.
                  </span>
                  <span>{invitation.email}</span>
                </div>

                <span className="household-badge">Invité — En attente</span>

                <div className="household-actions">
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={
                      acceptingInvitationId === invitation.id ||
                      decliningInvitationId === invitation.id
                    }
                    onClick={() => void handleAcceptInvitation(invitation.id)}
                  >
                    {acceptingInvitationId === invitation.id
                      ? "Acceptation..."
                      : "Accepter"}
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={
                      decliningInvitationId === invitation.id ||
                      acceptingInvitationId === invitation.id
                    }
                    onClick={() => void handleDeclineInvitation(invitation)}
                  >
                    {decliningInvitationId === invitation.id
                      ? "Refus..."
                      : "Refuser"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {targetedInvitationMissing &&
          !receivedInvitationError &&
          !receivedInvitationSuccess && (
            <p className="form-message form-error" role="alert">
              Cette invitation n'est pas disponible pour le compte actuellement
              connecté. Connectez-vous avec l'adresse courriel qui a reçu
              l'invitation. Elle peut également avoir déjà été acceptée ou
              annulée.
            </p>
          )}

        {receivedInvitationError && (
          <p className="form-message form-error" role="alert">
            {receivedInvitationError}
          </p>
        )}

        {receivedInvitationSuccess && (
          <p className="form-message form-success" role="status">
            {receivedInvitationSuccess}
          </p>
        )}
      </section>
    );
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

        <div className="household-multi-grid">
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
          <div className="household-invitations">
            {households.map((item) => (
              <div
                className="household-invitation-item"
                key={`manage-household-${item.id}`}
              >
                <div className="household-member-info">
                  <strong>{item.name}</strong>
                  <span>{getRoleLabel(item.role)}</span>
                </div>

                <div className="household-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setHousehold(item)}
                  >
                    Ouvrir
                  </button>

                  {item.role === "OWNER" ? (
                    <button
                      type="button"
                      className="button button-danger"
                      disabled={deletingHouseholdId === item.id}
                      onClick={() => void handleDeleteHousehold(item)}
                    >
                      {deletingHouseholdId === item.id
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={leavingHouseholdId === item.id}
                      onClick={() => void handleLeaveHousehold(item)}
                    >
                      {leavingHouseholdId === item.id
                        ? "Départ..."
                        : "Quitter"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {householdActionError && (
            <p className="form-message form-error" role="alert">
              {householdActionError}
            </p>
          )}
        </section>
        {households.some((item) => item.role === "OWNER") && (
          <section className="household-create-card">
            <h2>Inviter un membre</h2>
            <p>
              Vous pouvez inviter un membre à tout moment dans un foyer dont
              vous êtes propriétaire.
            </p>

            <form className="auth-form" onSubmit={handleInviteMember}>
              <label htmlFor="invitation-household">Foyer</label>
              <select
                id="invitation-household"
                className="household-select"
                value={invitationHouseholdId ?? ""}
                onChange={(event) =>
                  setInvitationHouseholdId(Number(event.target.value))
                }
                required
              >
                {households
                  .filter((item) => item.role === "OWNER")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>

              <label htmlFor="multi-household-invitation-email">
                Courriel du membre
              </label>
              <input
                id="multi-household-invitation-email"
                type="email"
                value={invitationEmail}
                onChange={(event) => setInvitationEmail(event.target.value)}
                autoComplete="email"
                placeholder="membre@exemple.com"
                required
              />

              <button
                className="button button-primary button-large"
                type="submit"
                disabled={isInviting || invitationHouseholdId === null}
              >
                {isInviting ? "Envoi..." : "Envoyer l'invitation"}
              </button>
            </form>

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
          </section>
        )}
        </div>

        {renderReceivedInvitations()}
      </main>
    );
  }

  if (
    !household &&
    households.length === 0 &&
    (receivedInvitations.length > 0 || targetedInvitationId !== null)
  ) {
    return (
      <main className="household-dashboard">
        <section className="household-dashboard-header">
          <div>
            <p className="eyebrow">Invitation MealSaver</p>
            <h1>Rejoignez votre foyer.</h1>
            <p>
              Vous avez été invité à rejoindre un foyer existant. Aucune
              création de foyer n'est nécessaire.
            </p>
          </div>
        </section>

        {renderReceivedInvitations()}
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

        {renderReceivedInvitations()}
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

          {household.role === "OWNER" && (
            <button
              type="button"
              className="button button-danger"
              disabled={deletingHouseholdId === household.id}
              onClick={() => void handleDeleteHousehold(household)}
            >
              {deletingHouseholdId === household.id
                ? "Suppression..."
                : "Supprimer le foyer"}
            </button>
          )}
          {household.role === "MEMBER" && (
            <button
              type="button"
              className="button button-secondary"
              disabled={leavingHouseholdId === household.id}
              onClick={() => void handleLeaveHousehold(household)}
            >
              {leavingHouseholdId === household.id
                ? "Départ..."
                : "Quitter le foyer"}
            </button>
          )}

        </div>
      </section>

      {householdActionError && (
        <p className="form-message form-error" role="alert">
          {householdActionError}
        </p>
      )}

      {renderReceivedInvitations()}

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

                    {household.role === "OWNER" &&
                      person.status === "MEMBER" &&
                      person.membershipId && (
                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={
                            removingMembershipId === person.membershipId
                          }
                          onClick={() => void handleRemoveMember(person)}
                        >
                          {removingMembershipId === person.membershipId
                            ? "Retrait..."
                            : "Retirer"}
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}

            {memberActionError && (
              <p className="form-message form-error" role="alert">
                {memberActionError}
              </p>
            )}

            {memberActionSuccess && (
              <p className="form-message form-success" role="status">
                {memberActionSuccess}
              </p>
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

                    {household.role === "OWNER" &&
                      invitation.invitationId && (
                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={
                            cancelingInvitationId === invitation.invitationId
                          }
                          onClick={() =>
                            void handleCancelInvitation(invitation)
                          }
                        >
                          {cancelingInvitationId === invitation.invitationId
                            ? "Annulation..."
                            : "Annuler"}
                        </button>
                      )}
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
