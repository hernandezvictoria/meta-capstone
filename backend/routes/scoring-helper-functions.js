var jaccard = require('jaccard');

// given a product, compute its score based on user preferences
const computeProductScore = (product, lovedProducts, dislikedProducts, userSkinType, userSkinConcerns, totalUsers) => {

    // =========== get overlap between skin types and skin concerns ===========
    // skin type overlap
    let productSkinTypeScore = 0;
    let ingredientSkinTypeScore = 0;
    for (const skinType of userSkinType) {
        if (product.skin_type.includes(skinType)) {
            productSkinTypeScore += 1; // add up product skin type matches
        }

        let tempIngredientScore = 0;
        for (ingredient of product.ingredients) {
            if (ingredient.skin_type.includes(skinType)) {
                tempIngredientScore = 1; // if at least one of the ingredients matches the skin type, get a point
            }
        }
        ingredientSkinTypeScore += tempIngredientScore;
    }
    if(userSkinType.length > 0) {
        productSkinTypeScore /= userSkinType.length; // proportion of skin types satisfied by product
    }
    if(product.ingredients.length > 0) {
        // ingredientSkinTypeScore is the number of skin types satisfied by the ingredients' skin types
        ingredientSkinTypeScore /= product.ingredients.length; // proportion of skin types satisfied by ingredients
    }

    // repeat for skin concern overlap
    let productConcernsScore = 0;
    let ingredientConcernsScore = 0;
    for (const concern of userSkinConcerns) {
        if (product.concerns.includes(concern)) {
            productConcernsScore += 1;
        }

        let tempIngredientScore = 0;
        for (ingredient of product.ingredients) {
            if (ingredient.concerns.includes(concern)) {
                tempIngredientScore = 1;
            }
        }
        ingredientConcernsScore += tempIngredientScore;
    }
    if(userSkinConcerns.length > 0) {
        productConcernsScore = productConcernsScore / userSkinConcerns.length; // proportion of skin concerns satisfied by product, userSkinConcerns.length is nonzero
    }
    if(product.ingredients.length > 0) {
        ingredientConcernsScore /= product.ingredients.length; // proportion of skin concerns satisfied by ingredients
    }

    // ========== get popularity score of product ==========
    let popularityScore = 0;
    const likeCount = product.loved_by_user.length;
    const dislikeCount = product.disliked_by_user.length;
    if (totalUsers > 0) {
        popularityScore = (likeCount - dislikeCount) / totalUsers; // normalize by total number of users
    }


    // ========== bonus points: overlap with loved and disliked products ===========
    // get overlap with loved products
    let lovedProductOverlapScore = 0;
    let lovedProductIngredientSimilarityScore = 0;
    let duplicateSubtraction = 0;
    for (const lovedProduct of lovedProducts) {
        if(lovedProduct.id === product.id) { // ignore if product is already loved
            duplicateSubtraction = 1;
            continue;
        }

        if(lovedProduct.brand === product.brand) {
            lovedProductOverlapScore += 0.1; // boost for loved brand
        }

        // jaccard index computes similarity between two sets
        lovedProductIngredientSimilarityScore += jaccard.index(
            lovedProduct.ingredients.map(i => i.id), // convert to array of ids
            product.ingredients.map(i => i.id)
        );
    }
    if(lovedProducts.length - duplicateSubtraction > 0) {
        // subtract by 1 if product is already loved, to avoid double counting
        lovedProductOverlapScore += lovedProductIngredientSimilarityScore / (lovedProducts.length - duplicateSubtraction); // average jaccard score of loved products
    }

    // penalize for overlap with disliked products
    let dislikedProductOverlapScore = 0;
    let dislikedProductIngredientSimilarityScore = 0;
    duplicateSubtraction = 0;
    for(const dislikedProduct of dislikedProducts) {
        if(dislikedProduct.id === product.id) { // ignore if product is already disliked
            duplicateSubtraction = 1;
            continue;
        }

        if(dislikedProduct.brand === product.brand) {
            dislikedProductOverlapScore -= 0.1; // penalize for disliked brand
        }

        dislikedProductIngredientSimilarityScore -= jaccard.index(
            dislikedProduct.ingredients.map(i => i.id),
            product.ingredients.map(i => i.id)
        ) // penalize for ingredient overlap
    }
    if(dislikedProducts.length - duplicateSubtraction > 0) {
        dislikedProductOverlapScore += dislikedProductIngredientSimilarityScore / (dislikedProducts.length - duplicateSubtraction); // average jaccard score of disliked products
    }

    const bonusScore = lovedProductOverlapScore + dislikedProductOverlapScore;

    // ========== combine all scores ===========
    let weights = {}; // can adjust weights further
    weights['productSkinTypeScore'] = 5;
    weights['ingredientSkinTypeScore'] = 1;
    weights['productConcernsScore'] = 2.5;
    weights['ingredientConcernsScore'] = 0.5;
    weights['popularityScore'] = 1;

    let totalScore = 0;
    totalScore += productSkinTypeScore * weights['productSkinTypeScore'];
    totalScore += ingredientSkinTypeScore * weights['ingredientSkinTypeScore'];
    totalScore += productConcernsScore * weights['productConcernsScore'];
    totalScore += ingredientConcernsScore * weights['ingredientConcernsScore'];
    totalScore += popularityScore * weights['popularityScore'];
    totalScore += bonusScore;

    // cap score between 0 and 10
    totalScore = Math.min(totalScore, 10);
    totalScore = Math.max(totalScore, 0);
    totalScore = Math.round(totalScore * 10) / 10; // round to 1 decimal place
    return totalScore;
}

module.exports = computeProductScore;
