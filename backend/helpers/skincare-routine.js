const { HarshIngredientTypes, ProductTypes } = require("../enums.js");
const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();
const {
    computeConcernScore,
    computeSkinTypeScore,
} = require("./scoring-helper-functions.js");

let incompatibleProductsMap = new Map(); // Maps product id -> set of product ids that it is incompatible with
const INCOMPATIBLE_PRODUCTS_DEDUCTION = 5; // skincare routine score deduction for having incompatible products
const MAX_ROUTINE_LENGTH = 6; // maximum number of products in a skincare routine

/**
 * Parses ingredient type to determine if it is an active, exfoliant, or retinol.
 * @param {String} ingredientType - Type of ingredient.
 * @returns {Object} - Object with boolean values for hasActive, hasExfoliantOrRetinol.
 */
const parseIngredientForHarsh = (ingredientType) => {
    let hasActive = false;
    let hasExfoliantOrRetinol = false;
    if (Object.values(HarshIngredientTypes).includes(ingredientType)) {
        if (ingredientType === HarshIngredientTypes.ACTIVE) {
            hasActive = true;
        } else {
            hasExfoliantOrRetinol = true;
        }
    }
    return { hasActive, hasExfoliantOrRetinol };
};

/**
 * Returns false if two ingredients are not compatible with each other.
 * Exfoliants are not compatible with other exfoliants, retinols, or actives.
 * Retinols are not compatible with other retinols, exfoliants, or actives.
 * Actives are not compatible with other exfoliants or retinols, but are compatible with other actives.
 * @param {list} ingredients1 - List of ingredients objects.
 * @param {list} ingredients2 - List of ingredients objects.
 * @returns {boolean} - True if the two lists of ingredients are compatible, false otherwise.
 */
const isCompatibleIngredients = (ingredients1, ingredients2) => {
    let ingredients1HasExfoliantOrRetinol = false; // boolean to check if ingredients1 has an exfoliant or retinol
    let ingredients1HasActive = false; // boolean to check if ingredients1 has an active

    // Check if ingredients1 has exfoliants, retinols, or actives
    for (const ingredient of ingredients1) {
        const { hasActive, hasExfoliantOrRetinol } = parseIngredientForHarsh(
            ingredient.ingredient_type
        );
        if (hasActive) {
            ingredients1HasActive = hasActive ? true : false;
        }
        if (hasExfoliantOrRetinol) {
            ingredients1HasExfoliantOrRetinol = hasExfoliantOrRetinol
                ? true
                : false;
        }
    }

    // If ingredients1 does not have harsh ingredients, then it is compatible with any other ingredients list
    if (!ingredients1HasActive && !ingredients1HasExfoliantOrRetinol) {
        return true;
    }

    for (const ingredient of ingredients2) {
        const { hasActive, hasExfoliantOrRetinol } = parseIngredientForHarsh(
            ingredient.ingredient_type
        );
        if (hasActive) {
            // actives are not compatible with exfoliants or retinols
            if (ingredients1HasExfoliantOrRetinol) {
                return false;
            }
        } else if (hasExfoliantOrRetinol) {
            // exfoliants and retinols are not compatible with actives or other exfoliants or retinols
            if (ingredients1HasActive || ingredients1HasExfoliantOrRetinol) {
                return false;
            }
        }
    }
    return true;
};

/**
 * Returns true if two products' types are compatible with each other.
 * Retinols are not compatible with other retinols.
 * @param {enum} productType1 -
 * @param {enum} productType2
 * @returns {boolean} - True if the two products' types are compatible, false otherwise.
 */
const isCompatibleProductTypes = (productType1, productType2) => {
    if (productType1 === ProductTypes.RETINOL) {
        if (productType2 === ProductTypes.RETINOL) {
            return false;
        }
    }
    return true;
};

/**
 * Adds product 1 to product 2's incompatible products list and vice versa.
 * @param {number} product1Id - ID of product 1.
 * @param {number} product2Id - ID of product 2.
 */
const addToIncompatibleProducts = (product1Id, product2Id) => {
    if (!incompatibleProductsMap.has(product1Id)) {
        incompatibleProductsMap.set(product1Id, new Set());
    }
    if (!incompatibleProductsMap.has(product2Id)) {
        incompatibleProductsMap.set(product2Id, new Set());
    }
    incompatibleProductsMap.set(
        product1Id,
        incompatibleProductsMap.get(product1Id).add(product2Id)
    );
    incompatibleProductsMap.set(
        product2Id,
        incompatibleProductsMap.get(product2Id).add(product1Id)
    );
};

/**
 * Sets the incompatible products for each product in the database.
 */
const setIncompatibleProductsMap = async () => {
    const allProducts = await prisma.productInfo.findMany({
        include: { ingredients: true },
    });
    for (const product1 of allProducts) {
        for (const product2 of allProducts) {
            // ids are in chronological order in DB (but don't necessarily start at 1)
            // If the product ids are the same or if products have already been compared, skip
            if (product2.id <= product1.id) {
                continue;
            }

            if (
                !isCompatibleProductTypes(
                    product1.product_type,
                    product2.product_type
                )
            ) {
                addToIncompatibleProducts(product1.id, product2.id);
                continue; // skip checking ingredients
            }

            if (
                !isCompatibleIngredients(
                    product1.ingredients,
                    product2.ingredients
                )
            ) {
                addToIncompatibleProducts(product1.id, product2.id);
            }
        }
    }
};

/**
 * Iterates through the skincare routine to fetch information used for scoring.
 * Parses all information in one for loop to avoid multiple iterations over the same data.
 * @param {list} routine - List of product objects in the user's skincare routine.
 * @returns {object} - Object with products' product types, skin types, skin concerns, and product ids.
 */
const parseSkincareRoutine = (routine) => {
    const productTypes = [];
    let skinTypes = [];
    let skinConcerns = [];
    let productIds = [];

    for (const product of routine) {
        productTypes.push(product.product_type);
        skinTypes = [...skinTypes, ...product.skin_type];
        skinConcerns = [...skinConcerns, ...product.concerns];
        productIds.push(product.id);
    }

    const productTypesSet = new Set(productTypes);
    const skinTypesSet = new Set(skinTypes);
    const skinConcernsSet = new Set(skinConcerns);

    return { productTypesSet, skinTypesSet, skinConcernsSet, productIds };
};

/**
 * Returns a multiplier based on the number of missing products in the skincare routine.
 * Every skincare routine should have at least one cleanser, moisturizer, and sunscreen.
 * @param {set} productTypesSet - Unique product types in the skincare routine.
 * @returns {object} - Object with the missing products multiplier and message.
 */
const computeMissingProductsMultiplier = (productTypesSet) => {
    // set.has has O(1) time complexity
    const sunscreen = productTypesSet.has(ProductTypes.SUNSCREEN) ? 1 : 0;
    const cleanser = productTypesSet.has(ProductTypes.CLEANSER) ? 1 : 0;
    const moisturizer = productTypesSet.has(ProductTypes.MOISTURIZER) ? 1 : 0;

    const sum = sunscreen + cleanser + moisturizer;
    const message =
        sum === 3
            ? ""
            : "make sure your routine has a cleanser, moisturizer, and sunscreen!";

    return { multiplier: sum / 3, message };
};

/**
 * Returns a deduction based on whether the skincare routine has incompatible products.
 * Same deduction for having any incompatible products, regardless of how many.
 * @param {list} productIds - List of product ids in the skincare routine.
 * @returns {object} - The deduction for having any incompatible products and message.
 */
const computeIncompatibleProductsDeduction = (productIds) => {
    let allIncompatibleProductsSet = new Set(); // use set to avoid duplicates, efficient for O(1) lookup
    const incompatibilityMessage =
        "your routine has too many products with harsh ingredients!";

    for (const id of productIds) {
        if (allIncompatibleProductsSet.has(id)) {
            // if product in incompatible products map, return early
            return {
                deduction: INCOMPATIBLE_PRODUCTS_DEDUCTION,
                message: incompatibilityMessage,
            };
        }
        if (incompatibleProductsMap.has(id)) {
            // add each element of the product's incompatible products set to the overall set
            incompatibleProductsMap
                .get(id)
                .forEach((productId) =>
                    allIncompatibleProductsSet.add(productId)
                );
        }
    }

    // check if any of the products in the routine are in the overall set of incompatible products
    return productIds.some((id) => allIncompatibleProductsSet.has(id))
        ? {
              deduction: INCOMPATIBLE_PRODUCTS_DEDUCTION,
              message: incompatibilityMessage,
          }
        : { deduction: 0, message: "" };
};

/**
 * Half point deduction for each product added after the MAX_ROUTINE_LENGTHth product.
 * @param {number} routineLength - The length of the skincare routine.
 * @returns {object} - The deduction for having too many products and message.
 */
const computeExcessiveProductsDeduction = (routineLength) => {
    if (routineLength > MAX_ROUTINE_LENGTH) {
        return {
            deduction: (routineLength - MAX_ROUTINE_LENGTH) * 0.5,
            message: "try simplifying your routine by removing some products!",
        };
    } else {
        return { deduction: 0, message: "" };
    }
};

/**
 * Half point deduction for each product that doesn't meet any of the user's skin types or skin concerns.
 * @param {list} routine - List of product objects in the user's skincare routine.
 * @param {list} userSkinType - List of user's skin types.
 * @param {list} userSkinConcerns - List of user's skin concerns.
 * @returns {object} - The deduction for having unnecessary products and message.
 */
const computeUnnecessaryProductsDeduction = (
    routine,
    userSkinType,
    userSkinConcerns
) => {
    let numUnnecessaryProducts = 0;
    for (const product of routine) {
        const skinTypeScore = computeSkinTypeScore(product, userSkinType);
        if (
            skinTypeScore.productSkinTypeScore > 0 ||
            skinTypeScore.ingredientSkinTypeScore
        ) {
            continue; // short circuit if product meets at least one of user's skin types
        } else {
            const concernScore = computeConcernScore(product, userSkinConcerns);
            if (
                concernScore.productConcernsScore === 0 &&
                concernScore.ingredientConcernsScore === 0
            ) {
                numUnnecessaryProducts++;
            }
        }
    }

    return numUnnecessaryProducts === 0
        ? { deduction: 0, message: "" }
        : {
              deduction: numUnnecessaryProducts * 0.5,
              message:
                  "try removing some products that don't meet your skin's needs!",
          };
};

/**
 * Returns a score based on the number of skin types and skin concerns satisfied by the skincare routine.
 * Proportion of skin types and skin concerns satisfied normalized to a 10 point scale.
 * 10 if all skin types and skin concerns are satisfied, 0 if none are satisfied.
 * Ignores ingredient skin type and skin concerns covered, only checks products' skin type and skin concerns.
 * @param {set} skinTypesSet
 * @param {set} skinConcernsSet
 * @param {list} userSkinType
 * @param {list} userSkinConcerns
 * @returns {object} - Pure score and message.
 */
const computePureScore = (
    skinTypesSet,
    skinConcernsSet,
    userSkinType,
    userSkinConcerns
) => {
    let numSkinTypesSatisfied = 0;
    let numSkinConcernsSatisfied = 0;

    for (const skinType of userSkinType) {
        if (skinTypesSet.has(skinType)) {
            numSkinTypesSatisfied += 1; // add up overall skin type matches
        }
    }

    for (const skinConcern of userSkinConcerns) {
        if (skinConcernsSet.has(skinConcern)) {
            numSkinConcernsSatisfied += 1; // add up overall skin concern matches
        }
    }

    // proportion of skin types and skin concerns satisfied normalized to a 10 point scale
    return (
        (10 * (numSkinTypesSatisfied + numSkinConcernsSatisfied)) /
        (userSkinType.length + userSkinConcerns.length)
    );
};

/**
 * Returns a score based on how compatible a user's skincare routine is with their skin type and skin concerns.
 * @param {list} routine - List of product objects in the user's skincare routine.
 * @param {object} user - User object to compute skincare routine score for.
 * @returns {object} - Object with the skincare routine score and message.
 */
const computeSkincareRoutineScore = async (routine, user) => {
    if (routine.length === 0) {
        return {
            score: 0,
            message:
                "add products to your routine to get a skincare routine score!",
        };
    }

    let message = "";

    const { productTypesSet, skinTypesSet, skinConcernsSet, productIds } =
        parseSkincareRoutine(routine);

    // compute incompatible products only once
    if (incompatibleProductsMap.size === 0) {
        await setIncompatibleProductsMap();
    }

    // =============== Missing Products ===============
    const missingProducts = computeMissingProductsMultiplier(productTypesSet);
    const missingProductsMultiplier = missingProducts.multiplier;
    // missing products message has highest precedence, with decreasing precedence for each deduction's message
    message = missingProducts.message;

    // =============== Incompatible Products ===============
    const incompatibleProducts =
        computeIncompatibleProductsDeduction(productIds);
    const incompatibleProductsDeduction = incompatibleProducts.deduction;
    if (message === "") {
        // if no missing products message, use incompatible products message
        message = incompatibleProducts.message;
    }

    // =============== Excessive Products ===============
    const excessiveProducts = computeExcessiveProductsDeduction(routine.length);
    const excessiveProductsDeduction = excessiveProducts.deduction;
    if (message === "") {
        message = excessiveProducts.message;
    }

    // =============== Unnecessary Products ===============
    const unnecessaryProducts = computeUnnecessaryProductsDeduction(
        routine,
        user.skin_type,
        user.concerns
    );
    const unnecessaryProductsDeduction = unnecessaryProducts.deduction;
    if (message === "") {
        message = unnecessaryProducts.message;
    }

    // =============== Pure Score ===============
    const pureScore = computePureScore(
        skinTypesSet,
        skinConcernsSet,
        user.skin_type,
        user.concerns
    );

    // =============== Total Score ===============
    let totalScore =
        pureScore * missingProductsMultiplier -
        incompatibleProductsDeduction -
        excessiveProductsDeduction -
        unnecessaryProductsDeduction;

    totalScore = Math.max(totalScore, 0); // ensure score is non-negative
    totalScore = Math.round(totalScore * 10) / 10; // round to 1 decimal place

    if (message === "") {
        // set message if no message has been set yet
        if (totalScore >= 8) {
            message = "your routine is great for your skin's needs!";
        } else if (totalScore >= 6) {
            message = "your routine meets your skin's needs!";
        } else if (totalScore >= 4) {
            message = "your routine is okay for your skin's needs";
        } else {
            message = "your routine doesn't meet your skin's needs";
        }
    }

    return { score: totalScore, message };
};

// ============= GETTERS USED FOR TESTING =============
const getIncompatibleProducts = () => {
    return incompatibleProductsMap;
};

module.exports = {
    isCompatibleIngredients,
    setIncompatibleProductsMap,
    getIncompatibleProducts,
    computeMissingProductsMultiplier,
    computeIncompatibleProductsDeduction,
    computeUnnecessaryProductsDeduction,
    computePureScore,
    parseSkincareRoutine,
    computeSkincareRoutineScore,
};
