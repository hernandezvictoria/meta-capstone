const express = require('express')
const { PrismaClient } = require('../generated/prisma/index.js')
const { SkinTypes, SkinConcerns, ProductTypes } = require('../enums.js')

const prisma = new PrismaClient()
const router = express.Router()
var jaccard = require('jaccard');

const computeProductScore = (product, lovedProducts, dislikedProducts, userSkinType, userSkinConcerns) => {

    // =========== get overlap between skin types and skin concerns ===========

    let productSkinTypeScore = 0;
    let ingredientSkinTypeScore = 0;
    for (const skinType of userSkinType) {
        if (product.skin_type.includes(skinType)) {
            productSkinTypeScore += 1; // add up product skin type matches
        }
        for (ingredient of product.ingredients) {
            if (ingredient.skin_type.includes(skinType)) {
                ingredientSkinTypeScore += 1; // add up ingredient skin type matches
            }
        }
    }
    productSkinTypeScore = productSkinTypeScore / userSkinType.length; // proportion of skin types satisfied by product, userSkinType.length is nonzero
    if(product.ingredients.length > 0){ // else, score remains zero
        ingredientSkinTypeScore = ingredientSkinTypeScore / product.ingredients.length; // proportion of ingredients satisfying skin types
    }

    // repeat for skin concerns
    let productConcernsScore = 0;
    let ingredientConcernsScore = 0;
    for (const concern of userSkinConcerns) {
        if (product.concerns.includes(concern)) {
            productConcernsScore += 1; // add up product skin concern matches
        }
        for (ingredient of product.ingredients) {
            if (ingredient.concerns.includes(concern)) {
                ingredientConcernsScore += 1; // add up ingredient skin concern matches
            }
        }
    }
    productConcernsScore = productConcernsScore / userSkinConcerns.length; // proportion of skin concerns satisfied by product, userSkinConcerns.length is nonzero
    if(product.ingredients.length > 0){ // else, score remains zero
        ingredientConcernsScore = ingredientConcernsScore / product.ingredients.length; // proportion of ingredients satisfying skin concerns
    }

    // ========== get popularity score of product ==========
    let popularityScore = 0;
    const likeCount = product.loved_by_user.length;
    const dislikeCount = product.disliked_by_user.length;
    if (likeCount + dislikeCount > 0) { // else, score remains zero
        popularityScore = (likeCount - dislikeCount) / (likeCount + dislikeCount); // normalize by total count and multiply by 2
    }

    // ========== bonus points: overlap with loved and disliked products ===========
    // get overlap with loved products
    let lovedProductOverlapScore = 0;
    let lovedProductIngredientSimilarityScore = 0;
    for (const lovedProduct of lovedProducts) {
        if(lovedProduct.id === product.id) { // ignore if product is already loved
            continue;
        }

        if(lovedProduct.brand === product.brand) {
            lovedProductOverlapScore += 0.1; // boost for loved brand
        }

        // jaccard index computes similarity between two sets
        lovedProductIngredientSimilarityScore += jaccard.index(lovedProduct.ingredients, product.ingredients);
    }
    lovedProductOverlapScore += lovedProductIngredientSimilarityScore / lovedProducts.length; // average jaccard score of loved products

    // penalize for overlap with disliked products
    let dislikedProductOverlapScore = 0;
    let dislikedProductIngredientSimilarityScore = 0;
    for(const dislikedProduct of dislikedProducts) {
        if(dislikedProduct.id === product.id) { // ignore if product is already disliked
            continue;
        }

        if(dislikedProduct.brand === product.brand) {
            dislikedProductOverlapScore -= 0.1; // penalize for disliked brand
        }

        // jaccard index computes similarity between two sets, produces a number between 0 and 1
        dislikedProductIngredientSimilarityScore -= jaccard.index(dislikedProduct.ingredients, product.ingredients); // penalize for ingredient overlap
    }

    dislikedProductOverlapScore += dislikedProductIngredientSimilarityScore / dislikedProducts.length; // average jaccard score of disliked products
    const bonusScore = lovedProductOverlapScore + dislikedProductOverlapScore;

    // ========== combine all scores ===========
    let totalScore = 4; // default score
    totalScore += productSkinTypeScore * 3; // can adjust weights further
    totalScore += ingredientSkinTypeScore * 0.5;
    totalScore += productConcernsScore * 1;
    totalScore += ingredientConcernsScore * 0.5;
    totalScore += popularityScore * 1;
    totalScore += bonusScore;

    // in theory, a product can get above 10 points with bonus score, so cap it at 10
    totalScore = Math.min(totalScore, 10);

}
