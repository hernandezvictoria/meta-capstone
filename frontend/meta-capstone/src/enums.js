const SkinTypes = Object.freeze({
    OILY: "oily",
    DRY: "dry",
    COMBINATION: "combination",
    NORMAL: "normal",
});

const SkinConcerns = Object.freeze({
    WRINKLES: "fine lines & wrinkles",
    TEXTURE: "texture",
    HYPERPIGMENTATION: "hyperpigmentation (dark spots)",
    REDNESS: "redness & irritation",
    ACNE: "acne & blemishes",
    DULLNESS: "dullness",
    DRYNESS: "dryness",
});

const ProductTypes = Object.freeze({
    SERUM: "serum",
    TONER: "toner",
    SUNSCREEN: "sunscreen",
    MOISTURIZER: "moisturizer",
    RETINOL: "retinol",
    MASK: "mask",
    CLEANSER: "cleanser",
    EYE: "eye cream",
});

const ProfileFilters = Object.freeze({
    USERINFO: "user info",
    LIKED: "liked",
    SAVED: "saved",
    DISLIKED: "disliked",
});

const InteractionTypes = Object.freeze({
    LIKE: "like",
    DISLIKE: "dislike",
    SAVE: "save",
    REMOVE_LIKE: "remove_like",
    REMOVE_DISLIKE: "remove_dislike",
    REMOVE_SAVE: "remove_save",
    OPEN_MODAL: "open_modal",
});

const Pages = Object.freeze({
    HOME: "home",
    PROFILE: "profile",
    ROUTINE: "routine",
});

export {
    SkinTypes,
    SkinConcerns,
    ProductTypes,
    ProfileFilters,
    InteractionTypes,
    Pages,
};
