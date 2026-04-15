import { Recipe, CUISINE_TAGS } from '../../types';
import { imageUrl } from '../../utils/imageUrl';

const CUISINE_TAG_SET = new Set<string>(CUISINE_TAGS);

/** Builds a schema.org Recipe JSON-LD object for structured data in search results. */
export function buildRecipeJsonLd(recipe: Recipe): Record<string, unknown> {
  const cuisineTag = recipe.tags.find((tag) => CUISINE_TAG_SET.has(tag));

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: imageUrl(recipe.coverImage),
    author: {
      '@type': 'Person',
      name: recipe.author.username,
    },
    datePublished: recipe.createdAt,
    totalTime: `PT${recipe.cookingTime}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeCategory: recipe.tags[0] ?? recipe.difficulty,
    ...(cuisineTag && { recipeCuisine: cuisineTag }),
    recipeIngredient: recipe.ingredients.map(
      (ingredient) => `${ingredient.amount} ${ingredient.name}`,
    ),
    recipeInstructions: recipe.steps.map((step) => ({
      '@type': 'HowToStep',
      text: step.instruction,
      ...(step.title && { name: step.title }),
    })),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${recipe.nutrition.calories} calories`,
      proteinContent: `${recipe.nutrition.protein}g`,
      carbohydrateContent: `${recipe.nutrition.carbs}g`,
      fatContent: `${recipe.nutrition.fat}g`,
    },
  };
}

/** Builds a schema.org BreadcrumbList for recipe detail pages. */
export function buildBreadcrumbJsonLd(recipe: Recipe): Record<string, unknown> {
  const category = recipe.tags[0] ?? 'Recipes';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: '/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category,
        item: `/feed?tag=${encodeURIComponent(category)}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: recipe.title,
      },
    ],
  };
}
