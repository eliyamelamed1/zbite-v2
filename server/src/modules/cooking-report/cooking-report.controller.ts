import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';

import { CookingReportService } from './cooking-report.service';
import { RecipeIdParamsSchema, CreateReportBodySchema } from './cooking-report.schemas';
import { ValidationError } from '../../shared/errors';
import { parsePaginationQuery } from '../../shared/utils/pagination';

/** Consumes multipart parts and returns the image file and notes field. */
async function parseReportMultipart(
  request: FastifyRequest,
): Promise<{ imageFile: MultipartFile | null; notes: string }> {
  const parts = request.parts();
  let imageFile: MultipartFile | null = null;
  let notes = '';

  for await (const part of parts) {
    if (part.type === 'field' && part.fieldname === 'notes') {
      notes = part.value as string;
    }

    if (part.type === 'file' && part.fieldname === 'image') {
      imageFile = part;
    }
  }

  return { imageFile, notes };
}

/** Cooking report controller -- parses requests, calls service, shapes responses. */
export const CookingReportController = {
  /** Handle POST /:recipeId/reports -- create a cooking report. */
  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const { imageFile, notes: rawNotes } = await parseReportMultipart(request);

    if (!imageFile) {
      throw new ValidationError('Image is required');
    }

    const { notes } = CreateReportBodySchema.parse({ notes: rawNotes });

    // authUser is set by the auth preHandler -- safe to assert
    const report = await CookingReportService.createReport({
      userId: request.authUser!.id,
      recipeId,
      imageFile,
      notes,
    });

    return reply.status(201).send({ report });
  },

  /** Handle GET /:recipeId/reports -- list cooking reports for a recipe. */
  async getReports(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const { page, limit, skip } = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
    );

    const result = await CookingReportService.getReports({ recipeId, page, limit, skip });

    return reply.send(result);
  },
};
