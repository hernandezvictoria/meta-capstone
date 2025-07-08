var jaccard = require('jaccard');

// given a product, compute its score based on user preferences
const computeProductScore = (product, lovedProducts, dislikedProducts, userSkinType, userSkinConcerns) => {

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
                tempIngredientScore += 1; // add up ingredient skin type matches
            }
        }
        tempIngredientScore = tempIngredientScore / userSkinType.length; // proportion of skin types satisfied by ingredient, userSkinType.length is nonzero
        ingredientSkinTypeScore += tempIngredientScore;
    }
    productSkinTypeScore = productSkinTypeScore / userSkinType.length; // proportion of skin types satisfied by product, userSkinType.length is nonzero
    ingredientSkinTypeScore /= product.ingredients.length; // average skin type score of ingredients

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
                tempIngredientScore += 1;
            }
        }
        tempIngredientScore = tempIngredientScore / userSkinConcerns.length;
        ingredientConcernsScore += tempIngredientScore;
    }
    productConcernsScore = productConcernsScore / userSkinConcerns.length; // proportion of skin concerns satisfied by product, userSkinConcerns.length is nonzero
    ingredientConcernsScore /= product.ingredients.length; // average concerns score of ingredients

    // ========== get popularity score of product ==========
    let popularityScore = 0;
    const likeCount = product.loved_by_user.length;
    const dislikeCount = product.disliked_by_user.length;
    if (likeCount + dislikeCount > 0) { // else, score remains zero
        popularityScore = (likeCount - dislikeCount) / (likeCount + dislikeCount); // normalize by total count
    }

    // ========== bonus points: overlap with loved and disliked products ===========
    // get overlap with loved products
    let lovedProductOverlapScore = 0;
    let lovedProductIngredientSimilarityScore = 0;
    let isProductLoved = false;
    for (const lovedProduct of lovedProducts) {
        if(lovedProduct.id === product.id) { // ignore if product is already loved
            isProductLoved = true;
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
    if(lovedProducts.length - (isProductLoved ? 1 : 0) > 0) {
        // subtract by 1 if product is already loved, to avoid double counting
        lovedProductOverlapScore += lovedProductIngredientSimilarityScore / (lovedProducts.length - (isProductLoved ? 1 : 0)); // average jaccard score of loved products
    }

    // penalize for overlap with disliked products
    let dislikedProductOverlapScore = 0;
    let dislikedProductIngredientSimilarityScore = 0;
    let isProductDisliked = false;
    for(const dislikedProduct of dislikedProducts) {
        if(dislikedProduct.id === product.id) { // ignore if product is already disliked
            isProductDisliked = true;
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
    if(dislikedProducts.length - (isProductDisliked ? 1 : 0) > 0) {
        dislikedProductOverlapScore += dislikedProductIngredientSimilarityScore / (dislikedProducts.length - (isProductDisliked ? 1 : 0)); // average jaccard score of disliked products
    }

    const bonusScore = lovedProductOverlapScore + dislikedProductOverlapScore;

    // ========== combine all scores ===========
    let totalScore = 0;
    totalScore += productSkinTypeScore * 5; // can adjust weights further
    totalScore += ingredientSkinTypeScore * 1;
    totalScore += productConcernsScore * 2.5;
    totalScore += ingredientConcernsScore * 0.5;
    totalScore += popularityScore * 1;
    totalScore += bonusScore;

    // in theory, a product can get above 10 points with bonus score, so cap it at 10
    totalScore = Math.min(totalScore, 10);
    return totalScore;
}

module.exports = computeProductScore;
