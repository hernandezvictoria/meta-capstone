const { isCompatibleIngredients }= require('../helpers/skincare-routine.js');

const exfoliantIngredients = [
    {
        "id": 1411,
        "name": "avocado oil",
        "ingredient_type": "plant-derived oil",
        "purpose": "moisturizing, nourishing, anti-aging",
        "skin_type": [
            "dry"
        ],
        "concerns": [
            "fine lines & wrinkles",
            "dryness"
        ]
    },
    {
        "id": 1447,
        "name": "retinol",
        "ingredient_type": "retinol",
        "purpose": "anti-aging, reduces wrinkles",
        "skin_type": [
            "dry",
            "oily",
            "combination",
            "normal"
        ],
        "concerns": [
            "fine lines & wrinkles"
        ]
    }
]

const activeIngredients = [
    {
        "id": 499,
        "name": "niacinamide",
        "ingredient_type": "active",
        "purpose": "anti-inflammatory, brightening",
        "skin_type": [
            "dry",
            "oily",
            "combination",
            "normal"
        ],
        "concerns": [
            "redness & irritation",
            "dullness"
        ]
    },
    {
        "id": 1807,
        "name": "zinc pca",
        "ingredient_type": "zinc compound",
        "purpose": "controls oil production, anti-inflammatory, regulates sebum",
        "skin_type": [
            "oily"
        ],
        "concerns": [
            "redness & irritation"
        ]
    }
]

const retinolIngredients = [
    {
        "id": 348,
        "name": "squalane",
        "ingredient_type": "moisturizing, skin softening",
        "purpose": "deeply moisturizes and softens skin",
        "skin_type": [
            "dry"
        ],
        "concerns": [
            "dryness"
        ]
    },
    {
        "id": 1447,
        "name": "retinol",
        "ingredient_type": "retinol",
        "purpose": "anti-aging, reduces wrinkles",
        "skin_type": [
            "dry",
            "oily",
            "combination",
            "normal"
        ],
        "concerns": [
            "fine lines & wrinkles"
        ]
    }
]

const noHarshIngredients = [
    {
        "id": 298,
        "name": "sodium chloride",
        "ingredient_type": "salt, thickening agent",
        "purpose": "adds thickness and stabilizes formulas",
        "skin_type": [
            "dry",
            "oily",
            "combination",
            "normal"
        ]
    }
]

test("test isCompatibleIngredients", async () => {
    expect(isCompatibleIngredients(retinolIngredients, retinolIngredients)).toBe(false);
    expect(isCompatibleIngredients(retinolIngredients, exfoliantIngredients)).toBe(false);
    expect(isCompatibleIngredients(retinolIngredients, activeIngredients)).toBe(false);

    expect(isCompatibleIngredients(exfoliantIngredients, retinolIngredients)).toBe(false);
    expect(isCompatibleIngredients(exfoliantIngredients, exfoliantIngredients)).toBe(false);
    expect(isCompatibleIngredients(exfoliantIngredients, activeIngredients)).toBe(false);

    expect(isCompatibleIngredients(activeIngredients, retinolIngredients)).toBe(false);
    expect(isCompatibleIngredients(activeIngredients, exfoliantIngredients)).toBe(false);
    expect(isCompatibleIngredients(activeIngredients, activeIngredients)).toBe(true);

    expect(isCompatibleIngredients(noHarshIngredients, noHarshIngredients)).toBe(true);
    expect(isCompatibleIngredients(noHarshIngredients, exfoliantIngredients)).toBe(true);
    expect(isCompatibleIngredients(noHarshIngredients, activeIngredients)).toBe(true);
    expect(isCompatibleIngredients(noHarshIngredients, retinolIngredients)).toBe(true);
})
