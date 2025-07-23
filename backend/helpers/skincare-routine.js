const { HarshIngredientTypes, ProductTypes } = require("../enums.js");
const { PrismaClient } = require("../generated/prisma/index.js");
const prisma = new PrismaClient();

let incompatibleProducts = new Map(); // Maps product id -> set of product ids that it is incompatible with

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
        const { hasActive, hasExfoliantOrRetinol } = parseIngredientForHarsh(ingredient.ingredient_type);
        if (hasActive) {
            ingredients1HasActive = hasActive ? true : false;
        }
        if (hasExfoliantOrRetinol) {
            ingredients1HasExfoliantOrRetinol = hasExfoliantOrRetinol ? true : false;
        }
    }

    // If ingredients1 does not have harsh ingredients, then it is compatible with any other ingredients list
    if (!ingredients1HasActive && !ingredients1HasExfoliantOrRetinol) {
        return true;
    }

    for (const ingredient of ingredients2) {
        const { hasActive, hasExfoliantOrRetinol } = parseIngredientForHarsh(ingredient.ingredient_type);
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
    if (!incompatibleProducts.has(product1Id)) {
        incompatibleProducts.set(product1Id, new Set());
    }
    if (!incompatibleProducts.has(product2Id)) {
        incompatibleProducts.set(product2Id, new Set());
    }
    incompatibleProducts.set(
        product1Id,
        incompatibleProducts.get(product1Id).add(product2Id)
    );
    incompatibleProducts.set(
        product2Id,
        incompatibleProducts.get(product2Id).add(product1Id)
    );
};

/**
 * Sets the incompatible products for each product in the database.
 */
const setIncompatibleProducts = async () => {
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

// ============= GETTERS USED FOR TESTING =============
const getIncompatibleProducts = () => {
    return incompatibleProducts;
};

module.exports = {
    isCompatibleIngredients,
    setIncompatibleProducts,
    getIncompatibleProducts,
};
