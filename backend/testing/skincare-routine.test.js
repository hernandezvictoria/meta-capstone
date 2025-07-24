const {
    isCompatibleIngredients,
    setIncompatibleProductsMap,
    getIncompatibleProducts,
    computeMissingProductsMultiplier,
    computeIncompatibleProductsDeduction,
    computeUnnecessaryProductsDeduction,
    computePureScore,
    parseSkincareRoutine,
    computeSkincareRoutineScore,
} = require("../helpers/skincare-routine.js");
const { ProductTypes, SkinTypes, SkinConcerns } = require("../enums.js");

const exfoliantIngredients = [
    {
        id: 1411,
        name: "avocado oil",
        ingredient_type: "plant-derived oil",
        purpose: "moisturizing, nourishing, anti-aging",
        skin_type: ["dry"],
        concerns: ["fine lines & wrinkles", "dryness"],
    },
    {
        id: 1447,
        name: "retinol",
        ingredient_type: "retinol",
        purpose: "anti-aging, reduces wrinkles",
        skin_type: ["dry", "oily", "combination", "normal"],
        concerns: ["fine lines & wrinkles"],
    },
];

const activeIngredients = [
    {
        id: 499,
        name: "niacinamide",
        ingredient_type: "active",
        purpose: "anti-inflammatory, brightening",
        skin_type: ["dry", "oily", "combination", "normal"],
        concerns: ["redness & irritation", "dullness"],
    },
    {
        id: 1807,
        name: "zinc pca",
        ingredient_type: "zinc compound",
        purpose: "controls oil production, anti-inflammatory, regulates sebum",
        skin_type: ["oily"],
        concerns: ["redness & irritation"],
    },
];

const retinolIngredients = [
    {
        id: 348,
        name: "squalane",
        ingredient_type: "moisturizing, skin softening",
        purpose: "deeply moisturizes and softens skin",
        skin_type: ["dry"],
        concerns: ["dryness"],
    },
    {
        id: 1447,
        name: "retinol",
        ingredient_type: "retinol",
        purpose: "anti-aging, reduces wrinkles",
        skin_type: ["dry", "oily", "combination", "normal"],
        concerns: ["fine lines & wrinkles"],
    },
];

const noHarshIngredients = [
    {
        id: 298,
        name: "sodium chloride",
        ingredient_type: "salt, thickening agent",
        purpose: "adds thickness and stabilizes formulas",
        skin_type: ["dry", "oily", "combination", "normal"],
    },
];

test("test isCompatibleIngredients", async () => {
    expect(
        isCompatibleIngredients(retinolIngredients, retinolIngredients)
    ).toBe(false);
    expect(
        isCompatibleIngredients(retinolIngredients, exfoliantIngredients)
    ).toBe(false);
    expect(isCompatibleIngredients(retinolIngredients, activeIngredients)).toBe(
        false
    );

    expect(
        isCompatibleIngredients(exfoliantIngredients, retinolIngredients)
    ).toBe(false);
    expect(
        isCompatibleIngredients(exfoliantIngredients, exfoliantIngredients)
    ).toBe(false);
    expect(
        isCompatibleIngredients(exfoliantIngredients, activeIngredients)
    ).toBe(false);

    expect(isCompatibleIngredients(activeIngredients, retinolIngredients)).toBe(
        false
    );
    expect(
        isCompatibleIngredients(activeIngredients, exfoliantIngredients)
    ).toBe(false);
    expect(isCompatibleIngredients(activeIngredients, activeIngredients)).toBe(
        true
    );

    expect(
        isCompatibleIngredients(noHarshIngredients, noHarshIngredients)
    ).toBe(true);
    expect(
        isCompatibleIngredients(noHarshIngredients, exfoliantIngredients)
    ).toBe(true);
    expect(isCompatibleIngredients(noHarshIngredients, activeIngredients)).toBe(
        true
    );
    expect(
        isCompatibleIngredients(noHarshIngredients, retinolIngredients)
    ).toBe(true);
});

test("test setIncompatibleProducts", async () => {
    await setIncompatibleProductsMap();
    const incompatibleProducts = getIncompatibleProducts();

    const serumWithActives = 36;
    const serum2WithActives = 1;
    const retinol = 7;
    const tonerWithExfoliant = 14;
    const noHarshIngredients = 4;

    // products don't have themselves
    expect(incompatibleProducts.get(retinol).has(retinol)).toBe(false);
    expect(
        incompatibleProducts.get(serumWithActives).has(serumWithActives)
    ).toBe(false);
    expect(
        incompatibleProducts.get(tonerWithExfoliant).has(tonerWithExfoliant)
    ).toBe(false);

    // product with no harsh ingredients is compatible with all
    expect(incompatibleProducts.has(noHarshIngredients)).toBe(false);
    expect(incompatibleProducts.get(retinol).has(noHarshIngredients)).toBe(
        false
    );
    expect(
        incompatibleProducts.get(serumWithActives).has(noHarshIngredients)
    ).toBe(false);
    expect(
        incompatibleProducts.get(serumWithActives).has(noHarshIngredients)
    ).toBe(false);

    // two-way incompatibility
    expect(incompatibleProducts.get(retinol).has(serumWithActives)).toBe(true);
    expect(incompatibleProducts.get(serumWithActives).has(retinol)).toBe(true);
    expect(incompatibleProducts.get(retinol).has(tonerWithExfoliant)).toBe(
        true
    );
    expect(incompatibleProducts.get(tonerWithExfoliant).has(retinol)).toBe(
        true
    );
    expect(
        incompatibleProducts.get(serumWithActives).has(tonerWithExfoliant)
    ).toBe(true);
    expect(
        incompatibleProducts.get(tonerWithExfoliant).has(serumWithActives)
    ).toBe(true);

    // actives are still compatible with each other
    expect(
        incompatibleProducts.get(serum2WithActives).has(serumWithActives)
    ).toBe(false);
    expect(
        incompatibleProducts.get(serumWithActives).has(serum2WithActives)
    ).toBe(false);
});

test("test computeMissingProductsMultiplier", () => {
    const meetsAllRequirements = new Set([
        ProductTypes.SERUM,
        ProductTypes.TONER,
        ProductTypes.MOISTURIZER,
        ProductTypes.SUNSCREEN,
        ProductTypes.CLEANSER,
    ]);
    const meetsAllRequirementsExceptSunscreen = new Set([
        ProductTypes.MOISTURIZER,
        ProductTypes.CLEANSER,
    ]);
    const meetsAllRequirementsExceptMoisturizer = new Set([
        ProductTypes.SERUM,
        ProductTypes.CLEANSER,
        ProductTypes.SUNSCREEN,
    ]);
    const meetsAllRequirementsExceptCleanser = new Set([
        ProductTypes.CLEANSER,
        ProductTypes.SUNSCREEN,
    ]);
    const missingTwo = new Set([ProductTypes.SERUM, ProductTypes.MOISTURIZER]);
    const missingThree = new Set([ProductTypes.SERUM, ProductTypes.TONER]);

    expect(
        computeMissingProductsMultiplier(meetsAllRequirements).multiplier
    ).toBe(1);
    expect(computeMissingProductsMultiplier(meetsAllRequirements).message).toBe(
        ""
    );
    expect(
        computeMissingProductsMultiplier(meetsAllRequirementsExceptSunscreen)
            .multiplier
    ).toBe(2 / 3);
    expect(
        computeMissingProductsMultiplier(meetsAllRequirementsExceptSunscreen)
            .message
    ).toBe(
        "make sure your routine has a cleanser, moisturizer, and sunscreen!"
    );
    expect(
        computeMissingProductsMultiplier(meetsAllRequirementsExceptMoisturizer)
            .multiplier
    ).toBe(2 / 3);
    expect(
        computeMissingProductsMultiplier(meetsAllRequirementsExceptCleanser)
            .multiplier
    ).toBe(2 / 3);
    expect(computeMissingProductsMultiplier(missingTwo).multiplier).toBe(1 / 3);
    expect(computeMissingProductsMultiplier(missingThree).multiplier).toBe(0);
});

test("test computeIncompatibleProductsDeduction", async () => {
    await setIncompatibleProductsMap();
    const serumWithActives = 36;
    const serum2WithActives = 1;
    const retinol = 7;
    const tonerWithExfoliant = 14;
    const noHarshIngredients = 4;

    const compatible = [
        serum2WithActives,
        serumWithActives,
        noHarshIngredients,
    ];
    const incompatible = [retinol, tonerWithExfoliant, serumWithActives];
    const incompatible3 = [retinol, serumWithActives];

    expect(computeIncompatibleProductsDeduction(compatible).deduction).toBe(0);
    expect(computeIncompatibleProductsDeduction(compatible).message).toBe("");
    expect(computeIncompatibleProductsDeduction(incompatible).deduction).toBe(
        5
    );
    expect(computeIncompatibleProductsDeduction(incompatible).message).toBe(
        "your routine has too many products with harsh ingredients!"
    );
    expect(computeIncompatibleProductsDeduction(incompatible3).deduction).toBe(
        5
    );
});

//fake user
const userSkinTypes = [SkinTypes.DRY, SkinTypes.NORMAL];
const userSkinConcerns = [SkinConcerns.DRYNESS, SkinConcerns.FINE_LINES];

// fake products
const meetsDryAndNormal = {
    concerns: [],
    skin_type: [SkinTypes.DRY, SkinTypes.NORMAL],
    ingredients: [],
};
const meetsDrynessAndDryAndNormal = {
    concerns: [SkinConcerns.DRYNESS, SkinConcerns.REDNESS],
    skin_type: [SkinTypes.DRY, SkinTypes.NORMAL],
    ingredients: [],
};
const meetsDrynessAndNormal = {
    concerns: [SkinConcerns.DRYNESS],
    skin_type: [SkinTypes.NORMAL],
    ingredients: [],
};
const meetsFineLines = {
    concerns: [SkinConcerns.FINE_LINES],
    skin_type: [SkinTypes.OILY],
    ingredients: [],
};
const meetsNone = {
    concerns: [SkinConcerns.ACNE],
    skin_type: [SkinTypes.OILY, SkinTypes],
    ingredients: [],
};

// fake routines
const meetsAll = [meetsDrynessAndDryAndNormal, meetsFineLines];
const meetsAll2 = [
    meetsDrynessAndDryAndNormal,
    meetsDrynessAndNormal,
    meetsFineLines,
];
const meets1 = [meetsFineLines, meetsNone];
const meets0 = [meetsNone];
const meets3 = [meetsDrynessAndDryAndNormal, meetsDrynessAndNormal, meetsNone];

test("test computeUnnecessaryProductsDeduction", () => {
    expect(
        computeUnnecessaryProductsDeduction(
            meetsAll,
            userSkinTypes,
            userSkinConcerns
        ).deduction
    ).toBe(0);
    expect(
        computeUnnecessaryProductsDeduction(
            meetsAll2,
            userSkinTypes,
            userSkinConcerns
        ).deduction
    ).toBe(0);
    expect(
        computeUnnecessaryProductsDeduction(
            meets1,
            userSkinTypes,
            userSkinConcerns
        ).deduction
    ).toBe(0.5);
    expect(
        computeUnnecessaryProductsDeduction(
            meets0,
            userSkinTypes,
            userSkinConcerns
        ).deduction
    ).toBe(0.5);
    expect(
        computeUnnecessaryProductsDeduction(
            meets3,
            userSkinTypes,
            userSkinConcerns
        ).deduction
    ).toBe(0.5);
});

test("test computePureScore", () => {
    const parsedMeetsAll = parseSkincareRoutine(meetsAll);
    parsedMeetsAll2 = parseSkincareRoutine(meetsAll2);
    const parsedMeets0 = parseSkincareRoutine(meets0);
    const parsedMeets1 = parseSkincareRoutine(meets1);
    const parsedMeets3 = parseSkincareRoutine(meets3);

    expect(
        computePureScore(
            parsedMeetsAll.skinTypesSet,
            parsedMeetsAll.skinConcernsSet,
            userSkinTypes,
            userSkinConcerns
        )
    ).toBe(10);
    expect(
        computePureScore(
            parsedMeetsAll2.skinTypesSet,
            parsedMeetsAll2.skinConcernsSet,
            userSkinTypes,
            userSkinConcerns
        )
    ).toBe(10);
    expect(
        computePureScore(
            parsedMeets1.skinTypesSet,
            parsedMeets1.skinConcernsSet,
            userSkinTypes,
            userSkinConcerns
        )
    ).toBe(10 / 4);
    expect(
        computePureScore(
            parsedMeets0.skinTypesSet,
            parsedMeets0.skinConcernsSet,
            userSkinTypes,
            userSkinConcerns
        )
    ).toBe(0);
    expect(
        computePureScore(
            parsedMeets3.skinTypesSet,
            parsedMeets3.skinConcernsSet,
            userSkinTypes,
            userSkinConcerns
        )
    ).toBe((10 * 3) / 4);
});

const user = {
    username: "victoria",
    concerns: ["acne & blemishes"],
    skin_type: ["dry", "normal"],
    loved_products: [],
    saved_products: [],
    disliked_products: [],
};

// products
const tonerMeetsAll = {
    id: 37,
    brand: "Tower 28 Beauty",
    name: "SOS Daily Rescue Facial Spray with Hypochlorous Acid",
    image: "https://www.sephora.com/productimages/sku/s2527844-main-zoom.jpg?imwidth=270&pb=clean-at-sephora",
    product_type: "toner",
    price: "28",
    concerns: ["acne & blemishes", "redness & irritation"],
    skin_type: ["dry", "oily", "combination", "normal"],
    ingredients: [
        {
            id: 330,
            name: "sodium chloride",
            ingredient_type: "salt, thickening agent",
            purpose: "adds thickness and stabilizes formulas",
            skin_type: ["dry", "oily", "combination", "normal"],
            concerns: [],
        },
    ],
    score: 9.5,
};

const sunscreen = {
    id: 76,
    brand: "SEPHORA COLLECTION",
    name: "Daily Mineral Sunscreen Cream SPF 30",
    image: "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg",
    product_type: "sunscreen",
    price: "20",
    concerns: ["dryness"],
    skin_type: ["dry", "oily", "combination", "normal"],
    ingredients: [
        {
            id: 763,
            name: "zinc oxide",
            ingredient_type: "mineral",
            purpose: "sunscreen, soothing, anti-inflammatory",
            skin_type: ["dry", "oily", "combination", "normal"],
            concerns: [
                "hyperpigmentation (dark spots)",
                "redness & irritation",
            ],
        },
    ],
    score: 7,
};

const cleanser = {
    id: 5,
    brand: "Bioderma",
    name: "Sensibio H2O Micellar Water",
    image: "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg",
    product_type: "cleanser",
    price: "15",
    concerns: ["redness & irritation"],
    skin_type: ["dry", "normal"],
    ingredients: [
        {
            id: 3190,
            name: "cucumber extract",
            ingredient_type: "botanical extract",
            purpose: "soothes, hydrates, and refreshes skin",
            skin_type: ["dry"],
            concerns: ["redness & irritation", "dryness"],
        },
    ],
    score: 6,
};

const moisturizer = {
    id: 68,
    brand: "fresh",
    name: "Rose & Hyaluronic Acid Deep Hydration Moisturizer",
    image: "https://www.sephora.com/productimages/sku/s2458230-main-zoom.jpg?imwidth=270&pb=clean-at-sephora",
    product_type: "moisturizer",
    price: "46",
    concerns: ["texture", "dullness", "dryness"],
    skin_type: ["dry", "oily", "combination", "normal"],
    ingredients: [
        {
            id: 954,
            name: "hyaluronic acid",
            ingredient_type: "humectant",
            purpose: "moisturizing, skin plumping",
            skin_type: ["dry"],
            concerns: ["dryness"],
        },
    ],
    score: 6,
};

const retinol = {
    id: 73,
    brand: "The INKEY List",
    name: "Retinol Fine Lines and Wrinkles Serum",
    image: "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg",
    product_type: "retinol",
    price: "16",
    concerns: ["fine lines & wrinkles", "texture"],
    skin_type: ["dry", "oily", "combination", "normal"],
    ingredients: [],
    score: 6,
};

const exfoliant = {
    id: 14,
    brand: "The Ordinary",
    name: "Glycolic Acid 7% Exfoliating and Brightening Daily Toner",
    image: "https://placeholderimagegenerator.com/wp-content/uploads/2024/12/Light-placeholder-image-portrait_jpg_.jpg",
    product_type: "toner",
    price: "13",
    concerns: ["texture", "dullness"],
    skin_type: ["dry", "oily", "combination", "normal"],
    ingredients: [
        {
            id: 413,
            name: "glycolic acid",
            ingredient_type: "exfoliant",
            purpose: "promotes cell turnover, improves skin tone and texture",
            skin_type: ["dry", "oily"],
            concerns: [],
        },
    ],
    score: 6,
};

test("test computeScore", async () => {
    //sample routines
    const bestRoutine = [tonerMeetsAll, cleanser, moisturizer, sunscreen];
    const meetsAllWithRetinol = [
        tonerMeetsAll,
        cleanser,
        moisturizer,
        retinol,
        sunscreen,
    ];
    const meetsAllButAcne = [cleanser, moisturizer, retinol, sunscreen];
    const doesntHaveCleanser = [tonerMeetsAll, moisturizer, sunscreen];
    const doesntHaveCleanserOrSunscreen = [tonerMeetsAll, moisturizer];
    const tooManyHarsh = [
        tonerMeetsAll,
        cleanser,
        exfoliant,
        moisturizer,
        retinol,
        sunscreen,
    ];
    const tooManyHarshAndMissingSuncreen = [
        tonerMeetsAll,
        cleanser,
        exfoliant,
        moisturizer,
        retinol,
    ];

    const bestRoutineScore = await computeSkincareRoutineScore(
        bestRoutine,
        user
    );
    expect(bestRoutineScore.score).toBe(10);
    expect(bestRoutineScore.message).toBe(
        "your routine is great for your skin's needs!"
    );

    const meetsAllWithRetinolScore = await computeSkincareRoutineScore(
        meetsAllWithRetinol,
        user
    );
    expect(meetsAllWithRetinolScore.score).toBe(10);
    expect(meetsAllWithRetinolScore.message).toBe(
        "your routine is great for your skin's needs!"
    );

    const meetsAllButAcneScore = await computeSkincareRoutineScore(
        meetsAllButAcne,
        user
    );
    expect(meetsAllButAcneScore.score).toBe(6.7);
    expect(meetsAllButAcneScore.message).toBe(
        "your routine meets your skin's needs!"
    );

    const doesntHaveCleanserScore = await computeSkincareRoutineScore(
        doesntHaveCleanser,
        user
    );
    expect(doesntHaveCleanserScore.score).toBe(6.7);
    expect(doesntHaveCleanserScore.message).toBe(
        "make sure your routine has a cleanser, moisturizer, and sunscreen!"
    );

    const doesntHaveCleanserOrSunscreenScore =
        await computeSkincareRoutineScore(doesntHaveCleanserOrSunscreen, user);
    expect(doesntHaveCleanserOrSunscreenScore.score).toBe(3.3);
    expect(doesntHaveCleanserOrSunscreenScore.message).toBe(
        "make sure your routine has a cleanser, moisturizer, and sunscreen!"
    );

    const tooManyHarshScore = await computeSkincareRoutineScore(
        tooManyHarsh,
        user
    );
    expect(tooManyHarshScore.score).toBe(5);
    expect(tooManyHarshScore.message).toBe(
        "your routine has too many products with harsh ingredients!"
    );

    const tooManyHarshAndMissingSuncreenScore =
        await computeSkincareRoutineScore(tooManyHarshAndMissingSuncreen, user);
    expect(tooManyHarshAndMissingSuncreenScore.score).toBe(1.7);
    expect(tooManyHarshAndMissingSuncreenScore.message).toBe(
        "make sure your routine has a cleanser, moisturizer, and sunscreen!"
    );
});
