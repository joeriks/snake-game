/**
 * Snake Entity Class
 * Represents an individual snake with genetics and stats
 */

export class Snake {
    constructor(config, morphData) {
        this.id = config.id || this.generateId();
        this.species = config.species; // 'western', 'eastern', 'southern'
        this.sex = config.sex; // 'male', 'female'
        this.genotype = config.genotype || {}; // { geneId: [allele1, allele2] }
        this.origin = config.origin || 'wild'; // 'wild', 'bred'
        this.parentIds = config.parentIds || null;
        this.birthDate = config.birthDate || Date.now();
        this.stats = config.stats || {
            health: 100,
            fertility: 1.0,
            clutchesProduced: 0
        };

        this.morphData = morphData;
        this._phenotype = null; // Cached phenotype
    }

    generateId() {
        return 'snake_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Calculate the phenotype (visible traits) from genotype
     */
    getPhenotype() {
        if (this._phenotype) return this._phenotype;

        const expressed = [];
        const genes = this.morphData.genes;

        for (const [geneId, alleles] of Object.entries(this.genotype)) {
            const gene = genes[geneId];
            if (!gene) continue;

            switch (gene.inheritance) {
                case 'recessive':
                    // Both alleles must be recessive to express
                    if (alleles[0] === geneId && alleles[1] === geneId) {
                        expressed.push(geneId);
                    }
                    break;

                case 'incompleteDominant':
                    const mutantCount = alleles.filter(a => a !== '+' && a !== 'wild').length;
                    if (mutantCount === 1) {
                        expressed.push(geneId);
                    } else if (mutantCount === 2 && gene.superForm) {
                        expressed.push(gene.superForm);
                    }
                    break;

                case 'dominant':
                    if (alleles.some(a => a !== '+' && a !== 'wild')) {
                        expressed.push(geneId);
                    }
                    break;

                case 'polygenic':
                    // Polygenic traits are always somewhat expressed if present
                    if (alleles.some(a => a !== '+' && a !== 'wild')) {
                        expressed.push(geneId);
                    }
                    break;
            }
        }

        this._phenotype = expressed;
        return expressed;
    }

    /**
     * Get visible morph gene names
     */
    getVisualGenes() {
        const phenotype = this.getPhenotype();
        const genes = this.morphData.genes;

        return phenotype.map(geneId => {
            const gene = genes[geneId];
            return gene ? gene.name : geneId;
        });
    }

    /**
     * Get het (carrier) gene names
     */
    getHetGenes() {
        const hets = [];
        const genes = this.morphData.genes;
        const phenotype = this.getPhenotype();

        for (const [geneId, alleles] of Object.entries(this.genotype)) {
            const gene = genes[geneId];
            if (!gene || gene.inheritance !== 'recessive') continue;

            // Het = one copy of recessive, not visual
            const copies = alleles.filter(a => a === geneId).length;
            if (copies === 1 && !phenotype.includes(geneId)) {
                hets.push(gene.name);
            }
        }

        return hets;
    }

    /**
     * Get display name based on morphs
     */
    getDisplayName() {
        const visuals = this.getVisualGenes();

        if (visuals.length === 0) {
            return 'Normal';
        }

        // Check for combo morphs first
        const combos = this.morphData.comboMorphs;
        for (const [comboId, combo] of Object.entries(combos)) {
            const phenotype = this.getPhenotype();
            if (combo.requires.every(req => phenotype.includes(req))) {
                return combo.name;
            }
        }

        return visuals.join(' ');
    }

    /**
     * Get species common name
     */
    getSpeciesName() {
        const species = this.morphData.species[this.species];
        return species ? species.commonName : this.species;
    }

    /**
     * Calculate the price of this snake
     */
    calculatePrice() {
        const species = this.morphData.species[this.species];
        const genes = this.morphData.genes;
        const rules = this.morphData.pricingRules;

        let price = species?.basePrice || 100;

        // Gender modifier
        price *= rules.genderMultiplier[this.sex] || 1.0;

        // Visual morph multipliers
        const phenotype = this.getPhenotype();
        for (const geneId of phenotype) {
            const gene = genes[geneId];
            if (gene) {
                const rarityMult = rules.rarityMultipliers[gene.rarity] || 1.0;
                price *= rarityMult;
            }
        }

        // Check for combo morph bonuses
        const combos = this.morphData.comboMorphs;
        for (const combo of Object.values(combos)) {
            if (combo.requires.every(req => phenotype.includes(req))) {
                // Use the combo's base price instead
                price = Math.max(price, combo.basePrice || price);
                break;
            }
        }

        // Het gene bonus
        const hetCount = this.getHetGenes().length;
        price *= (1 + hetCount * rules.hetGeneBonus);

        // Proven breeder bonus
        if (this.stats.clutchesProduced > 0) {
            price *= rules.provenBreederBonus;
        }

        // Species multiplier
        price *= rules.speciesMultipliers[this.species] || 1.0;

        return Math.round(price);
    }

    /**
     * Get rarity tier for styling
     */
    getRarityTier() {
        const price = this.calculatePrice();

        if (price < 200) return 'common';
        if (price < 500) return 'uncommon';
        if (price < 1000) return 'rare';
        if (price < 3000) return 'very-rare';
        return 'legendary';
    }

    /**
     * Serialize snake for saving
     */
    serialize() {
        return {
            id: this.id,
            species: this.species,
            sex: this.sex,
            genotype: this.genotype,
            origin: this.origin,
            parentIds: this.parentIds,
            birthDate: this.birthDate,
            stats: this.stats
        };
    }

    /**
     * Deserialize saved snake data
     */
    static deserialize(data, morphData) {
        return new Snake(data, morphData);
    }
}
