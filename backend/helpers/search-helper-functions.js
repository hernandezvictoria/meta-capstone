const {
    SkinTypes,
    SkinConcerns,
    ProductTypes,
} = require("../../common-enums.js");

const cleanSearchQuery = (searchTerm) => {
    const termToEnum = {}; // hm to store related terms to skin types and concerns

    termToEnum["combo"] = SkinTypes.COMBINATION;
    termToEnum["wrinkles"] = SkinConcerns.WRINKLES;
    termToEnum["fine"] = SkinConcerns.WRINKLES;
    termToEnum["lines"] = SkinConcerns.WRINKLES;
    termToEnum["line"] = SkinConcerns.WRINKLES;
    termToEnum["rough"] = SkinConcerns.TEXTURE;
    termToEnum["smooth"] = SkinConcerns.TEXTURE;
    termToEnum["dark"] = SkinConcerns.HYPERPIGMENTATION;
    termToEnum["spots"] = SkinConcerns.HYPERPIGMENTATION;
    termToEnum["hyperpigmentation"] = SkinConcerns.HYPERPIGMENTATION;
    termToEnum["redness"] = SkinConcerns.REDNESS;
    termToEnum["irritation"] = SkinConcerns.REDNESS;
    termToEnum["damaged"] = SkinConcerns.REDNESS;
    termToEnum["red"] = SkinConcerns.REDNESS;
    termToEnum["acne"] = SkinConcerns.ACNE;
    termToEnum["blemish"] = SkinConcerns.ACNE;
    termToEnum["blemishes"] = SkinConcerns.ACNE;
    termToEnum["pimple"] = SkinConcerns.ACNE;
    termToEnum["pimples"] = SkinConcerns.ACNE;
    termToEnum["dull"] = SkinConcerns.DULLNESS;
    termToEnum["dry"] = SkinConcerns.DRYNESS;
    termToEnum["lotion"] = ProductTypes.moisturizer;
    termToEnum["eye"] = ProductTypes.eye_cream; // not a great soln for eye cream rn
    termToEnum["cream"] = ProductTypes.moisturizer;
    termToEnum["wash"] = ProductTypes.cleanser;
    termToEnum["retinoid"] = ProductTypes.retinol;
    const stopWords = ["skin", "and", "for", "face"];

    let cleanedSearchTerm = searchTerm.replace(/-/g, " ");
    const queryArray = cleanedSearchTerm
        .split(" ")
        .filter((q) => {
            if (!stopWords.includes(q)) {
                return q;
            }
        }) // remove filler words from query, can add more later
        .map((q) => (q in termToEnum ? termToEnum[q] : q)) // map terms to enums
        .map((q) => q.toLowerCase());

    return queryArray;
};

module.exports = { cleanSearchQuery };
