/**
 * Genetics Engine
 * Handles breeding logic and wild snake generation
 */

import { Snake } from './Snake.js';

export class Genetics {
    constructor(morphData) {
        this.morphData = morphData;
        this.biomeSpawns = this.buildBiomeSpawnTables();
    }

    /**
     * Build spawn tables for each biome
     */
    buildBiomeSpawnTables() {
        // Simplified biome data - should match SPECIFICATIONS.md
        return {
            prairie: {
                species: { western: 0.8, eastern: 0.2 },
                morphChances: {
                    normal: 0.65,
                    hetSingle: 0.25,
                    hetDouble: 0.08,
                    visual: 0.02
                },
                commonGenes: ['albino', 'hypo']
            },
            badlands: {
                species: { western: 0.6, eastern: 0.4 },
                morphChances: {
                    normal: 0.50,
                    hetSingle: 0.30,
                    hetDouble: 0.12,
                    visual: 0.08
                },
                commonGenes: ['anaconda', 'albino', 'hypo']
            },
            rocky: {
                species: { western: 0.2, eastern: 0.8 },
                morphChances: {
                    normal: 0.55,
                    hetSingle: 0.28,
                    hetDouble: 0.12,
                    visual: 0.05
                },
                commonGenes: ['arctic', 'axanthic']
            },
            desert: {
                species: { western: 1.0 },
                morphChances: {
                    normal: 0.40,
                    hetSingle: 0.30,
                    hetDouble: 0.18,
                    visual: 0.12
                },
                commonGenes: ['lavender', 'sable', 'caramel']
            },
            coastal: {
                species: { southern: 1.0 },
                morphChances: {
                    normal: 0.90,
                    hetSingle: 0.08,
                    hetDouble: 0.02,
                    visual: 0.00
                },
                commonGenes: []
            }
        };
    }

    /**
     * Generate a random wild snake for a biome
     */
    generateWildSnake(biomeId) {
        const biome = this.biomeSpawns[biomeId] || this.biomeSpawns.prairie;

        // Pick species based on biome weights
        const species = this.weightedRandom(biome.species);

        // Determine sex (50/50)
        const sex = Math.random() > 0.5 ? 'male' : 'female';

        // Generate genotype
        const genotype = this.generateWildGenotype(biome, species);

        return new Snake({
            species,
            sex,
            genotype,
            origin: 'wild'
        }, this.morphData);
    }

    /**
     * Generate a wild snake from a seed (deterministic)
     * Used for world-placed snakes that need to be consistent
     */
    generateWildSnakeFromSeed(seed, species, rarity) {
        // Create a simple seeded random function
        const seededRandom = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };

        // Determine sex from seed
        const sex = seededRandom() > 0.5 ? 'male' : 'female';

        // Generate genotype based on rarity
        const genotype = {};
        const genes = this.morphData.genes;

        // Get genes available for this species
        const availableGenes = Object.entries(genes)
            .filter(([id, gene]) => gene.species?.includes(species))
            .map(([id]) => id);

        // Initialize all genes as wild type
        availableGenes.forEach(geneId => {
            genotype[geneId] = ['+', '+'];
        });

        // Rarity determines what morphs we get
        // 0.0-0.6: Normal (60%)
        // 0.6-0.85: Het single (25%)
        // 0.85-0.95: Het double (10%)
        // 0.95-1.0: Visual morph (5%)

        if (rarity > 0.6 && availableGenes.length > 0) {
            // Pick a gene using seed
            const geneIndex = Math.floor(seededRandom() * availableGenes.length);
            const gene = availableGenes[geneIndex];

            if (rarity > 0.95) {
                // Visual - homozygous
                const geneData = genes[gene];
                if (geneData?.inheritance === 'recessive') {
                    genotype[gene] = [gene, gene];
                } else {
                    genotype[gene] = [gene, '+'];
                }
            } else if (rarity > 0.85) {
                // Double het
                genotype[gene] = [gene, '+'];
                if (availableGenes.length > 1) {
                    const gene2Index = Math.floor(seededRandom() * availableGenes.length);
                    const gene2 = availableGenes[gene2Index];
                    if (gene2 !== gene) {
                        genotype[gene2] = [gene2, '+'];
                    }
                }
            } else {
                // Single het
                genotype[gene] = [gene, '+'];
            }
        }

        return new Snake({
            species,
            sex,
            genotype,
            origin: 'wild'
        }, this.morphData);
    }

    /**
     * Generate genotype for wild snake based on biome
     */
    generateWildGenotype(biome, species) {
        const genotype = {};
        const genes = this.morphData.genes;

        // Determine morph type
        const morphType = this.weightedRandom(biome.morphChances);

        // Get genes available for this species
        const availableGenes = Object.entries(genes)
            .filter(([id, gene]) => gene.species?.includes(species))
            .map(([id]) => id);

        // Initialize all genes as wild type
        availableGenes.forEach(geneId => {
            genotype[geneId] = ['+', '+'];
        });

        // Add genes based on morph type
        if (morphType === 'hetSingle') {
            // One het gene
            const gene = this.pickFromBiomeGenes(biome, availableGenes);
            if (gene) {
                genotype[gene] = [gene, '+'];
            }
        } else if (morphType === 'hetDouble') {
            // Two het genes
            const selectedGenes = this.pickMultipleFromBiomeGenes(biome, availableGenes, 2);
            selectedGenes.forEach(gene => {
                genotype[gene] = [gene, '+'];
            });
        } else if (morphType === 'visual') {
            // One visual gene (homozygous recessive or incomplete dominant)
            const gene = this.pickFromBiomeGenes(biome, availableGenes);
            if (gene) {
                const geneData = this.morphData.genes[gene];
                if (geneData.inheritance === 'recessive') {
                    // Homozygous for visual
                    genotype[gene] = [gene, gene];
                } else {
                    // One copy for dominant/incomplete dominant
                    genotype[gene] = [gene, '+'];
                }
            }
        }
        // else normal - all wild type

        return genotype;
    }

    /**
     * Pick a gene from biome common genes or random
     */
    pickFromBiomeGenes(biome, available) {
        const pool = biome.commonGenes.length > 0
            ? biome.commonGenes.filter(g => available.includes(g))
            : available;

        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * Pick multiple genes from biome
     */
    pickMultipleFromBiomeGenes(biome, available, count) {
        const result = [];
        const pool = [...available];

        for (let i = 0; i < count && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool.splice(idx, 1)[0]);
        }

        return result;
    }

    /**
     * Breed two snakes and produce offspring
     */
    breed(parent1, parent2) {
        if (parent1.species !== parent2.species) {
            throw new Error('Cannot crossbreed different species');
        }

        if (parent1.sex === parent2.sex) {
            throw new Error('Need one male and one female');
        }

        const species = this.morphData.species[parent1.species];
        const clutchSize = this.randomInt(species.clutchSize?.min || 8, species.clutchSize?.max || 25);

        const offspring = [];

        for (let i = 0; i < clutchSize; i++) {
            const childGenotype = {};

            // For each gene, inherit one allele from each parent
            const allGenes = new Set([
                ...Object.keys(parent1.genotype),
                ...Object.keys(parent2.genotype)
            ]);

            for (const geneId of allGenes) {
                const p1Alleles = parent1.genotype[geneId] || ['+', '+'];
                const p2Alleles = parent2.genotype[geneId] || ['+', '+'];

                // Random allele from each parent
                const allele1 = p1Alleles[Math.floor(Math.random() * 2)];
                const allele2 = p2Alleles[Math.floor(Math.random() * 2)];

                childGenotype[geneId] = [allele1, allele2];
            }

            offspring.push(new Snake({
                species: parent1.species,
                sex: Math.random() > 0.5 ? 'male' : 'female',
                genotype: childGenotype,
                origin: 'bred',
                parentIds: [parent1.id, parent2.id]
            }, this.morphData));
        }

        // Update parent stats
        const female = parent1.sex === 'female' ? parent1 : parent2;
        female.stats.clutchesProduced++;

        return offspring;
    }

    /**
     * Predict offspring outcomes (Punnett square style)
     */
    predictOffspring(parent1, parent2) {
        const predictions = [];

        // For each gene, calculate probability
        const allGenes = new Set([
            ...Object.keys(parent1.genotype),
            ...Object.keys(parent2.genotype)
        ]);

        for (const geneId of allGenes) {
            const gene = this.morphData.genes[geneId];
            if (!gene) continue;

            const p1Alleles = parent1.genotype[geneId] || ['+', '+'];
            const p2Alleles = parent2.genotype[geneId] || ['+', '+'];

            // Calculate outcomes
            const outcomes = {};
            for (const a1 of p1Alleles) {
                for (const a2 of p2Alleles) {
                    const key = [a1, a2].sort().join('/');
                    outcomes[key] = (outcomes[key] || 0) + 0.25;
                }
            }

            predictions.push({
                gene: gene.name,
                geneId,
                outcomes
            });
        }

        return predictions;
    }

    /**
     * Weighted random selection
     */
    weightedRandom(weights) {
        const entries = Object.entries(weights);
        const total = entries.reduce((sum, [, w]) => sum + w, 0);
        let random = Math.random() * total;

        for (const [key, weight] of entries) {
            random -= weight;
            if (random <= 0) return key;
        }

        return entries[entries.length - 1][0];
    }

    /**
     * Random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
