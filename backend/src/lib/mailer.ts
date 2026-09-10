import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type HouseholdInvitationEmail = {
  to: string;
  householdName: string;
  inviterName: string;
  invitationId: number;
};

let transporter: Transporter | undefined;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Configuration courriel manquante: ${name}`);
  }

  return value;
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: getRequiredEnv("GMAIL_USER"),
        pass: getRequiredEnv("GMAIL_APP_PASSWORD"),
      },
    });
  }

  return transporter;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendHouseholdInvitationEmail(
  input: HouseholdInvitationEmail,
): Promise<void> {
  if (
    process.env["NODE_ENV"] === "test" ||
    process.env["VITEST"] === "true"
  ) {
    return;
  }

  const frontendUrl = getRequiredEnv("FRONTEND_URL").replace(/\/+$/, "");
  const mailFrom = getRequiredEnv("MAIL_FROM");
  const householdUrl = `${frontendUrl}/household?invitation=${encodeURIComponent(String(input.invitationId))}`;

  const householdName = input.householdName.replace(/[\r\n]+/g, " ").trim();
  const inviterName = input.inviterName.replace(/[\r\n]+/g, " ").trim();

  await getTransporter().sendMail({
    from: mailFrom,
    to: input.to,
    subject: `Invitation à rejoindre ${householdName} sur MealSaver`,
    text: [
      `Bonjour,`,
      ``,
      `${inviterName} vous invite à rejoindre le foyer "${householdName}" sur MealSaver.`,
      ``,
      `Connectez-vous avec cette adresse courriel puis ouvrez la page suivante pour accepter l'invitation :`,
      householdUrl,
      ``,
      `Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message.`,
      ``,
      `MealSaver`,
    ].join("\n"),
    html: `
      <h2>Invitation MealSaver</h2>
      <p>Bonjour,</p>
      <p>
        <strong>${escapeHtml(inviterName)}</strong> vous invite à rejoindre
        le foyer <strong>${escapeHtml(householdName)}</strong> sur MealSaver.
      </p>
      <p>
        Connectez-vous avec cette adresse courriel puis ouvrez votre espace
        foyer pour accepter l'invitation.
      </p>
      <p>
        <a href="${escapeHtml(householdUrl)}">Voir et accepter l'invitation</a>
      </p>
      <p>Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message.</p>
      <p>MealSaver</p>
    `,
  });
}

type HouseholdMemberLeftEmail = {
  to: string;
  householdName: string;
  memberName: string;
  memberEmail: string;
};

export async function sendHouseholdMemberLeftEmail(
  input: HouseholdMemberLeftEmail,
): Promise<void> {
  if (
    process.env["NODE_ENV"] === "test" ||
    process.env["VITEST"] === "true"
  ) {
    return;
  }

  const mailFrom = getRequiredEnv("MAIL_FROM");
  const householdName = input.householdName.replace(/[\r\n]+/g, " ").trim();
  const memberName = input.memberName.replace(/[\r\n]+/g, " ").trim();
  const memberEmail = input.memberEmail.replace(/[\r\n]+/g, " ").trim();

  await getTransporter().sendMail({
    from: mailFrom,
    to: input.to,
    subject: `${memberName} a quitté ${householdName} sur MealSaver`,
    text: [
      "Bonjour,",
      "",
      `${memberName} (${memberEmail}) vient de quitter le foyer "${householdName}".`,
      "",
      "Son compte MealSaver n'a pas été supprimé.",
      "",
      "MealSaver",
    ].join("\n"),
    html: `
      <h2>Membre ayant quitté le foyer</h2>
      <p>Bonjour,</p>
      <p>
        <strong>${escapeHtml(memberName)}</strong>
        (${escapeHtml(memberEmail)}) vient de quitter le foyer
        <strong>${escapeHtml(householdName)}</strong>.
      </p>
      <p>Son compte MealSaver n'a pas été supprimé.</p>
      <p>MealSaver</p>
    `,
  });
}
