import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BudgetTotals from "../components/BudgetTotals";
import "../budget-page.css";

type Household = {
  id: number;
  name: string;
  role: "OWNER" | "MEMBER";
};

type HouseholdPerson = {
  userId: number | null;
  name: string | null;
  email: string;
  status: "OWNER" | "MEMBER" | "INVITED";
};

type Expense = {
  id: number;
  householdId: number;
  paidByUserId: number;
  amount: number | string;
  description: string | null;
  createdAt: string;
  paidByUser: {
    id: number;
    name: string;
  };
};

type ExpenseTotals = {
  memberTotals: Record<string, number>;
  generalTotal: number;
};

const moneyFormatter = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
});

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatMoney(value: number | string) {
  const numericValue = Number(value);
  return moneyFormatter.format(
    Number.isFinite(numericValue) ? numericValue : 0,
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

export default function BudgetPage() {
  const navigate = useNavigate();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [people, setPeople] = useState<HouseholdPerson[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totals, setTotals] = useState<ExpenseTotals>({
    memberTotals: {},
    generalTotal: 0,
  });

  const [paidByUserId, setPaidByUserId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHouseholds() {
      try {
        setError("");

        const response = await fetch("/api/households", {
          credentials: "include",
        });

        if (response.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ?? "Impossible de charger les foyers.",
          );
        }

        if (!active) return;

        const loadedHouseholds = data.households as Household[];

        setHouseholds(loadedHouseholds);
        setHouseholdId(loadedHouseholds[0]?.id ?? null);
      } catch (caughtError) {
        if (!active) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger les foyers.",
        );
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
    if (householdId === null) {
      return;
    }

    let active = true;

    async function loadBudget() {
      try {
        setIsLoadingBudget(true);
        setError("");
        setMessage("");

        const [membersResponse, expensesResponse, totalsResponse] =
          await Promise.all([
            fetch(`/api/households/${householdId}/members`, {
              credentials: "include",
            }),
            fetch(`/api/expenses?householdId=${householdId}`, {
              credentials: "include",
            }),
            fetch(`/api/expenses/totals?householdId=${householdId}`, {
              credentials: "include",
            }),
          ]);

        if (
          membersResponse.status === 401 ||
          expensesResponse.status === 401 ||
          totalsResponse.status === 401
        ) {
          navigate("/login", { replace: true });
          return;
        }

        const [membersData, expensesData, totalsData] =
          await Promise.all([
            membersResponse.json(),
            expensesResponse.json(),
            totalsResponse.json(),
          ]);

        if (!membersResponse.ok) {
          throw new Error(
            membersData.error ??
              "Impossible de charger les membres du foyer.",
          );
        }

        if (!expensesResponse.ok) {
          throw new Error(
            expensesData.error ??
              "Impossible de charger les d\u00e9penses.",
          );
        }

        if (!totalsResponse.ok) {
          throw new Error(
            totalsData.error ??
              "Impossible de charger les totaux.",
          );
        }

        if (!active) return;

        const loadedPeople = (
          membersData.people as HouseholdPerson[]
        ).filter(
          (person) =>
            person.userId !== null &&
            person.status !== "INVITED",
        );

        setPeople(loadedPeople);
        setExpenses(expensesData.expenses as Expense[]);
        setTotals(totalsData as ExpenseTotals);

        setPaidByUserId((current) => {
          const currentStillExists = loadedPeople.some(
            (person) => person.userId === current,
          );

          if (currentStillExists) {
            return current;
          }

          return loadedPeople[0]?.userId ?? null;
        });
      } catch (caughtError) {
        if (!active) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Impossible de charger le budget du foyer.",
        );
      } finally {
        if (active) {
          setIsLoadingBudget(false);
        }
      }
    }

    void loadBudget();

    return () => {
      active = false;
    };
  }, [householdId, navigate]);

  async function reloadExpensesAndTotals(
    targetHouseholdId: number,
  ) {
    const [expensesResponse, totalsResponse] = await Promise.all([
      fetch(`/api/expenses?householdId=${targetHouseholdId}`, {
        credentials: "include",
      }),
      fetch(
        `/api/expenses/totals?householdId=${targetHouseholdId}`,
        {
          credentials: "include",
        },
      ),
    ]);

    if (
      expensesResponse.status === 401 ||
      totalsResponse.status === 401
    ) {
      navigate("/login", { replace: true });
      return;
    }

    const [expensesData, totalsData] = await Promise.all([
      expensesResponse.json(),
      totalsResponse.json(),
    ]);

    if (!expensesResponse.ok) {
      throw new Error(
        expensesData.error ??
          "Impossible de recharger les d\u00e9penses.",
      );
    }

    if (!totalsResponse.ok) {
      throw new Error(
        totalsData.error ??
          "Impossible de recharger les totaux.",
      );
    }

    setExpenses(expensesData.expenses as Expense[]);
    setTotals(totalsData as ExpenseTotals);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      householdId === null ||
      paidByUserId === null ||
      isSaving
    ) {
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(
        "Le montant doit \u00eatre un nombre sup\u00e9rieur \u00e0 0.",
      );
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/expenses", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          householdId,
          paidByUserId,
          amount: numericAmount,
          description: description.trim() || undefined,
        }),
      });

      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Impossible d'ajouter la d\u00e9pense.",
        );
      }

      setAmount("");
      setDescription("");
      setMessage("D\u00e9pense ajout\u00e9e avec succ\u00e8s.");

      await reloadExpensesAndTotals(householdId);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible d'ajouter la d\u00e9pense.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="budget-page">
        <header className="budget-page-header">
          <p className="eyebrow">Budget du foyer</p>
          <h1>
            {"Suivez les d\u00e9penses partag\u00e9es."}
          </h1>
          <p>
            {
              "Enregistrez les d\u00e9penses, identifiez le membre qui a pay\u00e9 et consultez les totaux du foyer."
            }
          </p>
        </header>

        {isLoadingHouseholds && <p>Chargement...</p>}

        {error && (
          <p className="budget-feedback error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="budget-feedback success" role="status">
            {message}
          </p>
        )}

        {!isLoadingHouseholds && households.length === 0 && (
          <div className="page-placeholder">
            <h2>Aucun foyer</h2>
            <p>
              {
                "Cr\u00e9ez ou rejoignez un foyer avant d'enregistrer des d\u00e9penses."
              }
            </p>
          </div>
        )}

        {households.length > 0 && householdId !== null && (
          <>
            {households.length > 1 && (
              <section className="budget-card budget-household-card">
                <label htmlFor="budget-household">
                  {"Foyer utilis\u00e9"}
                </label>

                <select
                  id="budget-household"
                  className="budget-select"
                  value={householdId}
                  onChange={(event) =>
                    setHouseholdId(Number(event.target.value))
                  }
                >
                  {households.map((household) => (
                    <option
                      key={household.id}
                      value={household.id}
                    >
                      {household.name}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {isLoadingBudget ? (
              <p>Chargement du budget...</p>
            ) : (
              <>
                <div className="budget-main-grid">
                  <section className="budget-card">
                    <div className="budget-card-header">
                      <div
                        className="budget-card-icon"
                        aria-hidden="true"
                      >
                        $
                      </div>

                      <div>
                        <h2>
                          {"Ajouter une d\u00e9pense"}
                        </h2>
                        <p>
                          {
                            "Ajoutez un achat et indiquez le membre qui l'a pay\u00e9."
                          }
                        </p>
                      </div>
                    </div>

                    {people.length === 0 ? (
                      <p className="budget-empty">
                        {
                          "Aucun membre actif n'est disponible pour enregistrer une d\u00e9pense."
                        }
                      </p>
                    ) : (
                      <form
                        className="budget-form"
                        onSubmit={handleSubmit}
                      >
                        <div className="budget-field">
                          <label htmlFor="budget-payer">
                            {"Pay\u00e9 par"}
                          </label>

                          <select
                            id="budget-payer"
                            value={paidByUserId ?? ""}
                            onChange={(event) =>
                              setPaidByUserId(
                                Number(event.target.value),
                              )
                            }
                            required
                          >
                            {people.map((person) => (
                              <option
                                key={person.userId}
                                value={person.userId ?? ""}
                              >
                                {person.name ?? person.email}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="budget-field">
                          <label htmlFor="budget-amount">
                            Montant
                          </label>

                          <input
                            id="budget-amount"
                            type="number"
                            min="0.01"
                            max="1000000"
                            step="0.01"
                            inputMode="decimal"
                            value={amount}
                            onChange={(event) =>
                              setAmount(event.target.value)
                            }
                            placeholder="Ex. 42.50"
                            required
                          />
                        </div>

                        <div className="budget-field budget-description-field">
                          <label htmlFor="budget-description">
                            Description
                          </label>

                          <input
                            id="budget-description"
                            value={description}
                            onChange={(event) =>
                              setDescription(event.target.value)
                            }
                            maxLength={240}
                            placeholder="Ex. Epicerie de la semaine"
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn btn-primary budget-add-button"
                          disabled={isSaving}
                        >
                          {isSaving
                            ? "Ajout..."
                            : "Ajouter la d\u00e9pense"}
                        </button>
                      </form>
                    )}
                  </section>

                  <BudgetTotals
                    memberTotals={totals.memberTotals}
                    generalTotal={totals.generalTotal}
                  />
                </div>

                <section className="budget-history-card">
                  <div className="budget-history-heading">
                    <div>
                      <h2>
                        {"Historique des d\u00e9penses"}
                      </h2>
                      <p>
                        {
                          "Les achats les plus r\u00e9cents apparaissent en premier."
                        }
                      </p>
                    </div>

                    <span className="budget-count">
                      {expenses.length}{" "}
                      {expenses.length === 1
                        ? "d\u00e9pense"
                        : "d\u00e9penses"}
                    </span>
                  </div>

                  {expenses.length === 0 ? (
                    <p className="budget-empty">
                      {
                        "Aucune d\u00e9pense n'a encore \u00e9t\u00e9 enregistr\u00e9e pour ce foyer."
                      }
                    </p>
                  ) : (
                    <ul className="budget-expenses">
                      {expenses.map((expense) => (
                        <li
                          key={expense.id}
                          className="budget-expense-item"
                        >
                          <div className="budget-expense-copy">
                            <strong>
                              {expense.description?.trim() ||
                                "D\u00e9pense du foyer"}
                            </strong>

                            <span>
                              {expense.paidByUser.name}
                              {" \u00b7 "}
                              {formatDate(expense.createdAt)}
                            </span>
                          </div>

                          <span className="budget-expense-amount">
                            {formatMoney(expense.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
