"use strict";
/**
 * SupremeAI-branded model tiers.
 *
 * Users never see provider/model ids — only SupremeAI tier names. The mapping
 * from a tier to the underlying gateway model id is internal.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_TIERS = void 0;
exports.tierToModel = tierToModel;
exports.modelToTier = modelToTier;
exports.MODEL_TIERS = [
    { id: "auto", label: "SupremeAI Auto (Smart routing)", model: "auto" },
    { id: "fast", label: "SupremeAI Fast", model: "llama-3.1-8b-instant" },
    { id: "balanced", label: "SupremeAI Balanced", model: "gpt-4o-mini" },
    { id: "pro", label: "SupremeAI Pro", model: "claude-sonnet-4-5" },
];
function tierToModel(tierOrModel) {
    const found = exports.MODEL_TIERS.find((t) => t.id === tierOrModel);
    if (found)
        return found.model;
    // allow passing a raw gateway model id through
    return tierOrModel || "auto";
}
function modelToTier(model) {
    const found = exports.MODEL_TIERS.find((t) => t.model === model);
    return found ? found.id : "auto";
}
//# sourceMappingURL=models.js.map