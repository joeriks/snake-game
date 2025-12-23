# Snake Breeder: Hognose Edition — Technical Specifications

> **Purpose**: Single source of truth for all implementation details.

---

## 1. Data Models

### 1.1 Species Definition

```javascript
const SPECIES = {
  WESTERN: {
    id: 'western',
    scientificName: 'Heterodon nasicus',
    commonName: 'Western Hognose',
    baseValue: 100,
    availableMorphs: 'ALL', // Full morph gene pool
    biomes: ['prairie', 'badlands', 'desert'],
    clutchSize: { min: 8, max: 25 },
    incubationDays: 60
  },
  EASTERN: {
    id: 'eastern',
    scientificName: 'Heterodon platirhinos',
    commonName: 'Eastern Hognose',
    baseValue: 150,
    availableMorphs: ['ALBINO', 'AXANTHIC', 'ANACONDA', 'ARCTIC'],
    naturalPhases: ['PATTERNED', 'MELANISTIC', 'PATTERNLESS', 'GREEN'],
    biomes: ['prairie', 'badlands', 'rocky'],
    clutchSize: { min: 10, max: 30 },
    incubationDays: 55
  },
  SOUTHERN: {
    id: 'southern',
    scientificName: 'Heterodon simus',
    commonName: 'Southern Hognose',
    baseValue: 500, // Rare conservation species
    availableMorphs: ['NORMAL'], // Very limited captive morphs
    biomes: ['coastal'],
    clutchSize: { min: 6, max: 14 },
    incubationDays: 50,
    unlockRequirement: { biome: 'coastal', discovered: 10 }
  }
};
```

### 1.2 Gene Definitions

```javascript
const GENES = {
  // === RECESSIVE (need 2 copies to express) ===
  ALBINO: {
    id: 'albino',
    name: 'Albino',
    inheritance: 'RECESSIVE',
    description: 'Lacks melanin, red/orange/yellow coloring',
    visualTraits: { melanin: 0, eyeColor: 'red' },
    rarity: 1, // 1=common, 5=legendary
    species: ['western', 'eastern']
  },
  AXANTHIC: {
    id: 'axanthic',
    name: 'Axanthic',
    inheritance: 'RECESSIVE',
    description: 'No red/yellow pigment, grayscale',
    visualTraits: { xanthophores: 0 },
    rarity: 2,
    species: ['western', 'eastern']
  },
  LAVENDER: {
    id: 'lavender',
    name: 'Lavender',
    inheritance: 'RECESSIVE',
    description: 'Purple/pink hue',
    visualTraits: { hue: 'lavender', eyeColor: 'dark' },
    rarity: 3,
    species: ['western']
  },
  CARAMEL: {
    id: 'caramel',
    name: 'Caramel',
    inheritance: 'RECESSIVE',
    description: 'T+ albino, caramel coloring',
    visualTraits: { hue: 'caramel', belly: 'white' },
    rarity: 2,
    species: ['western']
  },
  SABLE: {
    id: 'sable',
    name: 'Sable',
    inheritance: 'RECESSIVE',
    description: 'Increased melanin, dark brown',
    visualTraits: { melanin: 2, brightness: -0.3 },
    rarity: 3,
    species: ['western']
  },
  HYPO: {
    id: 'hypo',
    name: 'Hypo',
    inheritance: 'RECESSIVE',
    description: 'Reduced dark pigments',
    visualTraits: { melanin: 0.5, belly: 'gray' },
    rarity: 1,
    species: ['western', 'eastern']
  },

  // === INCOMPLETE DOMINANT (1 copy = visual, 2 = super) ===
  ANACONDA: {
    id: 'anaconda',
    name: 'Anaconda',
    inheritance: 'INCOMPLETE_DOMINANT',
    description: 'Reduced pattern, black belly',
    superForm: 'SUPERCONDA',
    visualTraits: { pattern: 0.5, bellyColor: 'black' },
    rarity: 2,
    species: ['western', 'eastern']
  },
  ARCTIC: {
    id: 'arctic',
    name: 'Arctic',
    inheritance: 'INCOMPLETE_DOMINANT',
    description: 'High contrast, dark outlines',
    superForm: 'SUPERARCTIC',
    visualTraits: { contrast: 1.5, outline: 'dark' },
    rarity: 3,
    species: ['western', 'eastern']
  },

  // === DOMINANT (1 copy = visual) ===
  LEMON_GHOST: {
    id: 'lemon_ghost',
    name: 'Lemon Ghost',
    inheritance: 'DOMINANT',
    description: 'Increased yellow pigmentation',
    visualTraits: { yellow: 1.5 },
    rarity: 2,
    species: ['western']
  },
  CINNAMON: {
    id: 'cinnamon',
    name: 'Cinnamon',
    inheritance: 'DOMINANT',
    description: 'Distinctive head pattern, brown',
    visualTraits: { hue: 'cinnamon', headPattern: 'unique' },
    rarity: 2,
    species: ['western']
  }
};

// Super forms for incomplete dominant genes
const SUPER_FORMS = {
  SUPERCONDA: {
    id: 'superconda',
    name: 'Superconda',
    baseGene: 'ANACONDA',
    description: 'Patternless dorsal',
    visualTraits: { pattern: 0, bellyColor: 'black' },
    rarity: 4
  },
  SUPERARCTIC: {
    id: 'superarctic',
    name: 'Superarctic',
    baseGene: 'ARCTIC',
    description: 'Black and white only',
    visualTraits: { contrast: 2, saturation: 0 },
    rarity: 4
  }
};
```

### 1.3 Combo Morphs

```javascript
const COMBO_MORPHS = {
  SNOW: {
    name: 'Snow',
    requires: ['ALBINO', 'AXANTHIC'],
    rarity: 4,
    priceMultiplier: 4
  },
  YETI: {
    name: 'Yeti',
    requires: ['ALBINO', 'AXANTHIC', 'ANACONDA'],
    rarity: 5,
    priceMultiplier: 6
  },
  SUNBURST: {
    name: 'Sunburst',
    requires: ['SABLE', 'ALBINO'],
    rarity: 4,
    priceMultiplier: 8
  },
  SUBZERO: {
    name: 'Subzero',
    requires: ['ALBINO', 'SUPERARCTIC'],
    rarity: 5,
    priceMultiplier: 12
  },
  MOONDUST: {
    name: 'Moondust',
    requires: ['SUPERARCTIC', 'LAVENDER'],
    rarity: 5,
    priceMultiplier: 20
  },
  SWISS_CHOCOLATE: {
    name: 'Swiss Chocolate',
    requires: ['SPECIAL_ULTRA_RARE'],
    rarity: 5,
    priceMultiplier: 40,
    spawnChance: 0.0001
  }
};
```

### 1.4 Snake Entity

```javascript
class Snake {
  constructor(config) {
    this.id = generateUUID();
    this.species = config.species; // 'western' | 'eastern' | 'southern'
    this.sex = config.sex; // 'male' | 'female'
    this.genotype = config.genotype; // Map of gene -> alleles
    this.phenotype = null; // Calculated from genotype
    this.birthDate = Date.now();
    this.origin = config.origin; // 'wild' | 'bred'
    this.parentIds = config.parentIds || null;
    this.stats = {
      health: 100,
      fertility: 1.0,
      clutchesProduced: 0
    };
  }
}

// Genotype structure example:
// {
//   albino: ['a', 'A'],     // Het albino (Aa)
//   anaconda: ['An', '+'],  // Visual anaconda (An+)
//   arctic: ['+', '+']      // Normal (++)
// }
```

---

## 2. Genetics Engine

### 2.1 Inheritance Rules

```javascript
function calculatePhenotype(genotype, species) {
  const expressed = [];
  
  for (const [geneId, alleles] of Object.entries(genotype)) {
    const gene = GENES[geneId.toUpperCase()];
    
    switch (gene.inheritance) {
      case 'RECESSIVE':
        // Both alleles must be recessive to express
        if (alleles[0] === alleles[1] && alleles[0] === geneId.toLowerCase()) {
          expressed.push(geneId);
        }
        break;
        
      case 'INCOMPLETE_DOMINANT':
        const mutantCount = alleles.filter(a => a !== '+').length;
        if (mutantCount === 1) {
          expressed.push(geneId); // Single copy = visual
        } else if (mutantCount === 2) {
          expressed.push(gene.superForm); // Double = super form
        }
        break;
        
      case 'DOMINANT':
        // One copy is enough
        if (alleles.some(a => a !== '+')) {
          expressed.push(geneId);
        }
        break;
    }
  }
  
  return expressed;
}
```

### 2.2 Breeding Function

```javascript
function breed(parent1, parent2) {
  if (parent1.species !== parent2.species) {
    throw new Error('Cannot crossbreed different species');
  }
  
  const species = SPECIES[parent1.species.toUpperCase()];
  const clutchSize = randomInt(species.clutchSize.min, species.clutchSize.max);
  const offspring = [];
  
  for (let i = 0; i < clutchSize; i++) {
    const childGenotype = {};
    
    for (const geneId of Object.keys(parent1.genotype)) {
      const allele1 = randomChoice(parent1.genotype[geneId]);
      const allele2 = randomChoice(parent2.genotype[geneId]);
      childGenotype[geneId] = [allele1, allele2];
    }
    
    offspring.push(new Snake({
      species: parent1.species,
      sex: Math.random() > 0.5 ? 'male' : 'female',
      genotype: childGenotype,
      origin: 'bred',
      parentIds: [parent1.id, parent2.id]
    }));
  }
  
  return offspring;
}
```

---

## 3. Biome Configuration

```javascript
const BIOMES = {
  prairie: {
    name: 'Prairie Grasslands',
    unlocked: true,
    terrain: { grass: 0.7, dirt: 0.2, rock: 0.1 },
    spawnTable: {
      western: { weight: 0.8, morphChances: { normal: 0.7, het: 0.25, visual: 0.05 } },
      eastern: { weight: 0.2, morphChances: { patterned: 0.6, melanistic: 0.1, patternless: 0.3 } }
    },
    encounterRate: 0.15
  },
  badlands: {
    name: 'Sandy Badlands',
    unlocked: false,
    unlockCost: 1000,
    terrain: { sand: 0.6, rock: 0.3, scrub: 0.1 },
    spawnTable: {
      western: { weight: 0.6, morphChances: { anaconda: 0.2, normal: 0.5, het: 0.3 } },
      eastern: { weight: 0.4, morphChances: { green: 0.15, patterned: 0.85 } }
    },
    encounterRate: 0.12
  },
  rocky: {
    name: 'Rocky Outcrops',
    unlocked: false,
    unlockCost: 2500,
    terrain: { rock: 0.7, grass: 0.2, cave: 0.1 },
    spawnTable: {
      eastern: { weight: 0.8, morphChances: { arctic: 0.15, melanistic: 0.2, normal: 0.65 } },
      western: { weight: 0.2, morphChances: { arctic: 0.1, axanthic: 0.1, normal: 0.8 } }
    },
    encounterRate: 0.08
  },
  desert: {
    name: 'Desert Dunes',
    unlocked: false,
    unlockCost: 5000,
    terrain: { sand: 0.8, rock: 0.15, oasis: 0.05 },
    spawnTable: {
      western: { weight: 1.0, morphChances: { lavender: 0.1, sable: 0.1, rare: 0.02, normal: 0.78 } }
    },
    encounterRate: 0.06
  },
  coastal: {
    name: 'Coastal Scrub',
    unlocked: false,
    unlockCost: 10000,
    terrain: { scrub: 0.5, sand: 0.3, marsh: 0.2 },
    spawnTable: {
      southern: { weight: 1.0, morphChances: { normal: 0.95, rare: 0.05 } }
    },
    encounterRate: 0.04,
    conservationBonus: 2.0
  }
};
```

---

## 4. Pricing Formula

```javascript
function calculatePrice(snake) {
  const species = SPECIES[snake.species.toUpperCase()];
  let price = species.baseValue;
  
  // Gender: females +30%
  if (snake.sex === 'female') price *= 1.3;
  
  // Expressed morphs
  const phenotype = calculatePhenotype(snake.genotype, snake.species);
  for (const morph of phenotype) {
    const gene = GENES[morph] || SUPER_FORMS[morph];
    price *= (1 + gene.rarity * 0.5);
  }
  
  // Combo morph bonus
  for (const combo of Object.values(COMBO_MORPHS)) {
    if (combo.requires.every(g => phenotype.includes(g))) {
      price *= combo.priceMultiplier;
    }
  }
  
  // Het genes: +15% each
  const hetCount = countHetGenes(snake.genotype);
  price *= (1 + hetCount * 0.15);
  
  // Proven breeder: +20%
  if (snake.stats.clutchesProduced > 0) price *= 1.2;
  
  // Southern species conservation bonus
  if (snake.species === 'southern') price *= 2.0;
  
  return Math.round(price);
}
```

**Price Tiers**:
| Tier | Range | Examples |
|------|-------|----------|
| Common | $50-150 | Normal, single het |
| Uncommon | $150-350 | Albino, Anaconda |
| Rare | $350-800 | Snow, Lavender |
| Very Rare | $800-2,000 | Superconda, Sunburst |
| Legendary | $2,000-8,000+ | Moondust, Swiss Chocolate |

---

## 5. UI Specifications

### Color Palette

```css
:root {
  --bg-dark: #1a1a2e;
  --bg-medium: #16213e;
  --accent-gold: #e6a117;
  --accent-green: #4ecca3;
  --common: #9ca3af;
  --uncommon: #22c55e;
  --rare: #3b82f6;
  --very-rare: #a855f7;
  --legendary: #f59e0b;
}
```

### Layout

```
┌─────────────────────────────────────────┐
│  $ Money | Discovered | Biome           │
├─────────────────────────────────────────┤
│                                         │
│            3D VIEWPORT                  │
│                                         │
├─────────────────────────────────────────┤
│  [Explore] [Collection] [Breed] [Market]│
└─────────────────────────────────────────┘
```

---

## 6. Project Structure

```
snake-game/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.js
│   ├── config/
│   │   ├── species.js
│   │   ├── genes.js
│   │   └── biomes.js
│   ├── core/
│   │   ├── Game.js
│   │   ├── Snake.js
│   │   ├── Genetics.js
│   │   └── SaveManager.js
│   ├── world/
│   │   ├── World.js
│   │   ├── Terrain.js
│   │   └── Controls.js
│   └── ui/
│       ├── HUD.js
│       ├── BreedingPanel.js
│       └── MarketPanel.js
└── public/
    └── models/
```

---

## 7. Implementation Phases

1. **Foundation**: Vite + Three.js setup, config files, Snake class
2. **3D World**: Terrain, camera, placeholder visuals
3. **Core Loop**: Exploration, encounters, collection
4. **Economy**: Pricing, marketplace, save/load
5. **Polish**: 3D models, audio, achievements
