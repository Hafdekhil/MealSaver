import { Router } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";

export const smartFridgeRouter = Router();

const TECHNICAL_SENSOR_MIN_C = -100;
const TECHNICAL_SENSOR_MAX_C = 100;

const measurementSchema = z.object({
  householdId: z.number().int().positive(),
  sourceId: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/),
  metric: z.literal("temperature_c"),
  value: z.number().finite(),
  measuredAt: z.string().datetime({ offset: true }),
});

function serializeMeasurement(measurement: {
  id: number;
  householdId: number;
  sourceId: string;
  temperatureC: number;
  measuredAt: Date;
  receivedAt: Date;
}) {
  return {
    id: measurement.id,
    householdId: measurement.householdId,
    sourceId: measurement.sourceId,
    metric: "temperature_c" as const,
    value: measurement.temperatureC,
    measuredAt: measurement.measuredAt.toISOString(),
    receivedAt: measurement.receivedAt.toISOString(),
  };
}

async function userCanAccessHousehold(
  householdId: number,
  userId: number,
) {
  return prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });
}

smartFridgeRouter.post("/measurements", async (req, res, next) => {
  try {
    const userId = Number(res.locals["userId"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        error: "Non authentifié",
      });
    }

    const parsed = measurementSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Mesure invalide",
      });
    }

    const measurement = parsed.data;
    const membership = await userCanAccessHousehold(
      measurement.householdId,
      userId,
    );

    if (!membership) {
      return res.status(403).json({
        error: "Accès refusé",
      });
    }

    // Contrat technique du simulateur : une valeur au-delà de cette plage
    // est considérée comme une trame de capteur manifestement aberrante.
    // Ce contrôle ne constitue pas un seuil de sécurité alimentaire.
    if (
      measurement.value < TECHNICAL_SENSOR_MIN_C ||
      measurement.value > TECHNICAL_SENSOR_MAX_C
    ) {
      return res.status(422).json({
        error: "Mesure aberrante",
        code: "OUT_OF_SENSOR_RANGE",
        message:
          "La mesure a été reçue mais rejetée car elle sort de la plage technique du capteur simulé.",
      });
    }

    const created = await prisma.smartFridgeMeasurement.create({
      data: {
        householdId: measurement.householdId,
        sourceId: measurement.sourceId,
        temperatureC: measurement.value,
        measuredAt: new Date(measurement.measuredAt),
      },
    });

    return res.status(201).json({
      measurement: serializeMeasurement(created),
    });
  } catch (error) {
    return next(error);
  }
});

smartFridgeRouter.get(
  "/measurements/latest",
  async (req, res, next) => {
    try {
      const userId = Number(res.locals["userId"]);
      const householdId = Number(req.query["householdId"]);

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({
          error: "Non authentifié",
        });
      }

      if (!Number.isInteger(householdId) || householdId <= 0) {
        return res.status(400).json({
          error: "Foyer invalide",
        });
      }

      const membership = await userCanAccessHousehold(
        householdId,
        userId,
      );

      if (!membership) {
        return res.status(403).json({
          error: "Accès refusé",
        });
      }

      const latest = await prisma.smartFridgeMeasurement.findFirst({
        where: {
          householdId,
        },
        orderBy: [
          {
            measuredAt: "desc",
          },
          {
            id: "desc",
          },
        ],
      });

      return res.status(200).json({
        measurement: latest ? serializeMeasurement(latest) : null,
      });
    } catch (error) {
      return next(error);
    }
  },
);
