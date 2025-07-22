const { HarshIngredientTypes } = require('../enums.js');

/**
 * Returns false if two ingredients are not compatible with each other.
 * Exfoliants are not compatible with other exfoliants, retinols, or actives.
 * Retinos are not compatible with other retinols, exfoliants, or actives.
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
        if (Object.values(HarshIngredientTypes).includes(ingredient.ingredient_type)) {
            if (ingredient.ingredient_type === HarshIngredientTypes.ACTIVE) {
                ingredients1HasActive = true;
            } else {
                ingredients1HasExfoliantOrRetinol = true;
            }
        }
    }

    // If ingredients1 does not have harsh ingredients, then it is compatible with any other ingredients list
    if (!ingredients1HasActive && !ingredients1HasExfoliantOrRetinol) {
        return true;
    }

    for (const ingredient of ingredients2) {
        if (Object.values(HarshIngredientTypes).includes(ingredient.ingredient_type)) {
            if (ingredient.ingredient_type === HarshIngredientTypes.ACTIVE) {
                // actives are not compatible with exfoliants or retinols
                if (ingredients1HasExfoliantOrRetinol) {
                    return false;
                }
            } else {
                // exfoliants and retinols are not compatible with actives or other exfoliants or retinols
                if (ingredients1HasActive || ingredients1HasExfoliantOrRetinol) {
                    return false;
                }
            }
        }
    }
    return true;
}


module.exports = {isCompatibleIngredients};
