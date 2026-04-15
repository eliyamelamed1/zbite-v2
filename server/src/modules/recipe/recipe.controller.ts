import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';

import { RecipeService } from './recipe.service';
import { ValidationError } from '../../shared/errors';
import { parsePaginationQuery } from '../../shared/utils/pagination';
import {
  CreateRecipeBodySchema,
  UpdateRecipeBodySchema,
  RecipeIdParamsSchema,
  UserIdParamsSchema,
  ExploreFeedQuerySchema,
  SearchRecipesQuerySchema,
  PickRecommendQuerySchema,
  PantryRecommendQuerySchema,
} from './recipe.schemas';
import { RECOMMEND_PAGE_SIZE } from './recipe.consts';

const EMPTY_STEP_IMAGE_MAP = '{}';

interface ParsedMultipartData {
  dataString: string;
  stepImageMapString: string;
  coverFile: MultipartFile | null;
  stepImageFiles: MultipartFile[];
}

/** Consumes all parts from a multipart request and returns parsed field/file data. */
async function parseMultipartParts(request: FastifyRequest): Promise<ParsedMultipartData> {
  const parts = request.parts();
  let dataString = '';
  let stepImageMapString = EMPTY_STEP_IMAGE_MAP;
  let coverFile: MultipartFile | null = null;
  const stepImageFiles: MultipartFile[] = [];

  for await (const part of parts) {
    if (part.type === 'field') {
      if (part.fieldname === 'data') {
        dataString = part.value as string;
      }
      if (part.fieldname === 'stepImageMap') {
        stepImageMapString = part.value as string;
      }
    }

    if (part.type === 'file') {
      if (part.fieldname === 'coverImage') {
        coverFile = part;
      }
      if (part.fieldname === 'stepImages') {
        stepImageFiles.push(part);
      }
    }
  }

  return { dataString, stepImageMapString, coverFile, stepImageFiles };
}

/** Recipe controller -- parses requests, calls service, shapes responses. */
export const RecipeController = {
  /** Handle POST / -- create a new recipe from a multipart request. */
  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { dataString, stepImageMapString, coverFile, stepImageFiles } =
      await parseMultipartParts(request);

    if (!dataString) {
      throw new ValidationError('Missing "data" field in multipart body');
    }
    if (!coverFile) {
      throw new ValidationError('Cover image is required');
    }

    const rawData: unknown = JSON.parse(dataString);
    const body = CreateRecipeBodySchema.parse(rawData);
    const stepImageMap: Record<string, number> = JSON.parse(stepImageMapString);

    // authUser is set by the auth preHandler -- safe to assert
    const recipe = await RecipeService.createRecipe({
      body,
      authorId: request.authUser!.id,
      coverFile,
      stepImageFiles,
      stepImageMap,
    });

    return reply.status(201).send({ recipe });
  },

  /** Handle GET /search -- full-text recipe search. */
  async search(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { q, page, limit } = SearchRecipesQuerySchema.parse(request.query);
    const paginationOptions = parsePaginationQuery({ page, limit });
    const result = await RecipeService.searchRecipes(q, paginationOptions);
    return reply.send(result);
  },

  /** Handle GET /explore -- public explore feed with optional personalization. */
  async explore(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = ExploreFeedQuerySchema.parse(request.query);
    const { sort, tag } = query;
    const { page, limit, skip } = parsePaginationQuery(query);

    const result = await RecipeService.getExploreFeed({
      page,
      limit,
      skip,
      sort: sort ?? 'recent',
      tag,
      userId: request.authUser?.id,
    });

    return reply.send(result);
  },

  /** Handle GET /following -- feed of recipes from followed authors. */
  async following(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const paginationOptions = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
    );

    // authUser is set by the auth preHandler -- safe to assert
    const result = await RecipeService.getFollowingFeed(
      request.authUser!.id,
      paginationOptions,
    );

    return reply.send(result);
  },

  /** Handle GET /drafts -- draft recipes for the authenticated user. */
  async drafts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const paginationOptions = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
    );
    const result = await RecipeService.getDrafts(request.authUser!.id, paginationOptions);
    return reply.send(result);
  },

  /** Handle GET /user/:userId -- recipes by a specific user. */
  async userRecipes(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = UserIdParamsSchema.parse(request.params);
    const paginationOptions = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
    );

    const result = await RecipeService.getUserRecipes(userId, paginationOptions);

    return reply.send(result);
  },

  /** Handle GET /:id -- get a single recipe by ID. */
  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = RecipeIdParamsSchema.parse(request.params);
    const recipe = await RecipeService.getRecipe(id, request.authUser?.id);
    return reply.send({ recipe });
  },

  /** Handle PUT /:id -- update a recipe from a multipart request. */
  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = RecipeIdParamsSchema.parse(request.params);
    const { dataString, stepImageMapString, coverFile, stepImageFiles } =
      await parseMultipartParts(request);

    const rawData: unknown = dataString ? JSON.parse(dataString) : {};
    const body = UpdateRecipeBodySchema.parse(rawData);
    const stepImageMap: Record<string, number> = JSON.parse(stepImageMapString);

    // authUser is set by the auth preHandler -- safe to assert
    const recipe = await RecipeService.updateRecipe({
      recipeId: id,
      authorId: request.authUser!.id,
      body,
      coverFile,
      stepImageFiles,
      stepImageMap,
    });

    return reply.send({ recipe });
  },

  /** Handle DELETE /:id -- delete a recipe. */
  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = RecipeIdParamsSchema.parse(request.params);

    // authUser is set by the auth preHandler -- safe to assert
    await RecipeService.deleteRecipe(id, request.authUser!.id);
    return reply.send({ message: 'Recipe deleted' });
  },

  /** Handle GET /:id/related -- recipes with overlapping tags. */
  async related(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = RecipeIdParamsSchema.parse(request.params);
    const RELATED_LIMIT = 4;
    const data = await RecipeService.getRelatedRecipes(id, RELATED_LIMIT);
    return reply.send({ data });
  },

  /** Handle GET /home -- personalized home page data. */
  async home(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await RecipeService.getHomeData(request.authUser?.id);
    return reply.send(result);
  },

  /** Handle GET /recommend -- recipe recommendations by category or ingredients. */
  async recommend(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const rawQuery = request.query as Record<string, string>;
    const mode = rawQuery.mode;
    const userId = request.authUser?.id;

    if (mode === 'pantry') {
      const query = PantryRecommendQuerySchema.parse(rawQuery);
      const { page, limit, skip } = parsePaginationQuery(query, RECOMMEND_PAGE_SIZE);
      const result = await RecipeService.getPantryRecommendations({
        ingredients: query.ingredients,
        maxTime: query.maxTime,
        userId,
        page,
        limit,
        skip,
      });
      return reply.send(result);
    }

    // Default: mode=pick (category-based)
    const query = PickRecommendQuerySchema.parse(rawQuery);
    const { page, limit, skip } = parsePaginationQuery(query, RECOMMEND_PAGE_SIZE);
    const result = await RecipeService.getPickRecommendations({
      category: query.category,
      minTime: query.minTime,
      maxTime: query.maxTime,
      preference: query.preference,
      userId,
      page,
      limit,
      skip,
    });
    return reply.send(result);
  },
};
