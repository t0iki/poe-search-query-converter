import { describe, it, expect } from 'vitest';
import { ItemParser } from '../lib/itemParser';
import { ModMatcher } from '../lib/modMatcher';
import { QueryBuilder } from '../lib/queryBuilder';
import modDatabase from '../../data/mods.json';

describe('Special Unique Items', () => {
  const modMatcher = new ModMatcher(modDatabase);

  it("should handle Watcher's Eye with 'while affected by' mods", () => {
    const itemText = `Rarity: Unique
Watcher's Eye
Prismatic Jewel
--------
Item Level: 86
--------
Limited to: 1
--------
--------
--------
4% increased maximum Energy Shield
5% increased maximum Life
6% increased maximum Mana
+24% to Critical Strike Multiplier while affected by Anger
Regenerate 2% of Life per second while affected by Vitality`;

    const parsedItem = ItemParser.parseItem(itemText);
    const matchedMods = modMatcher.matchAllMods(parsedItem);
    const query = QueryBuilder.buildQuery(parsedItem, matchedMods);

    expect(parsedItem.name).toBe("Watcher's Eye");
    expect(matchedMods.explicit.length).toBeGreaterThan(0);
    expect(query.query.stats).toBeDefined();
    // Watcher's Eyeは全てのexplicit modを含む
    expect(query.query.stats![0].filters.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle Forbidden Flesh/Flame with paired mod search', () => {
    const fleshText = `Rarity: Unique
Forbidden Flesh
Crimson Jewel
--------
Item Level: 85
--------
Limited to: 1
--------
Requirements:
Class:: Duelist
--------
--------
--------
Allocates Rampart if you have the matching modifier on Forbidden Flame`;

    const parsedFlesh = ItemParser.parseItem(fleshText);
    const matchedFlesh = modMatcher.matchAllMods(parsedFlesh);
    const queryFlesh = QueryBuilder.buildQuery(parsedFlesh, matchedFlesh);

    expect(parsedFlesh.name).toBe("Forbidden Flesh");
    expect(queryFlesh.query.name).toBe("Forbidden Flesh");
  });

  it('should handle Impossible Escape with Passives in Radius mod', () => {
    const itemText = `Rarity: Unique
Impossible Escape
Viridian Jewel
--------
Item Level: 80
--------
Limited to: 1
Radius: Small
--------
--------
--------
Passives in Radius of Imbalanced Guard can be Allocated
without being connected to your tree`;

    const parsedItem = ItemParser.parseItem(itemText);
    const matchedMods = modMatcher.matchAllMods(parsedItem);
    QueryBuilder.buildQuery(parsedItem, matchedMods);

    expect(parsedItem.name).toBe("Impossible Escape");
    expect(parsedItem.mods.some(mod => mod.text.includes('Passives in Radius'))).toBe(true);
  });

  it("should handle The Balance of Terror with 'if you've cast' mods without values", () => {
    const itemText = `Rarity: Unique
The Balance of Terror
Cobalt Jewel
--------
Item Level: 85
--------
Limited to: 1
--------
--------
--------
+14% to all Elemental Resistances
Action Speed cannot be modified to below Base Value if you've cast Temporal Chains in the past 10 seconds
Immune to Exposure if you've cast Elemental Weakness in the past 10 seconds`;

    const parsedItem = ItemParser.parseItem(itemText);
    const matchedMods = modMatcher.matchAllMods(parsedItem);
    
    expect(parsedItem.name).toBe("The Balance of Terror");
    expect(matchedMods.explicit.length).toBeGreaterThan(0);
    
    // Check that "if you've cast" mods don't have values
    const castMods = matchedMods.explicit.filter(() => 
      parsedItem.mods.some(m => m.text.includes("if you've cast"))
    );
    castMods.forEach(mod => {
      expect(mod.value).toBeUndefined();
    });
  });

  it("should handle Sublime Vision with 'while affected by' mods only", () => {
    const itemText = `Rarity: Unique
Sublime Vision
Prismatic Jewel
--------
Item Level: 87
--------
Limited to: 1
--------
--------
--------
Auras from your Skills have 40% increased Effect on you
30% of Cold and Lightning Damage taken as Fire Damage while affected by Purity of Fire
Aura Skills other than Purity of Fire are Disabled`;

    const parsedItem = ItemParser.parseItem(itemText);
    const matchedMods = modMatcher.matchAllMods(parsedItem);
    const query = QueryBuilder.buildQuery(parsedItem, matchedMods);

    expect(parsedItem.name).toBe("Sublime Vision");
    expect(matchedMods.explicit.length).toBe(1);
    expect(query.query.stats).toBeDefined();
  });

  it('should handle Split Personality with all explicit mods', () => {
    const itemText = `Rarity: Unique
Split Personality
Crimson Jewel
--------
Item Level: 79
--------
Limited to: 2
--------
--------
--------
This Jewel's Socket has 25% increased effect per Allocated Passive Skill between
it and your Class' starting location
+5 to Strength
+5 to maximum Life
--------
Corrupted`;

    const parsedItem = ItemParser.parseItem(itemText);
    const matchedMods = modMatcher.matchAllMods(parsedItem);
    const query = QueryBuilder.buildQuery(parsedItem, matchedMods);

    expect(parsedItem.name).toBe("Split Personality");
    expect(parsedItem.corrupted).toBe(true);
    expect(matchedMods.explicit.length).toBeGreaterThan(0);
    expect(query.query.stats).toBeDefined();
  });

  it('should handle The Light of Meaning with Passive Skills in Radius mod', () => {
    const itemText = `Rarity: Unique
The Light of Meaning
Prismatic Jewel
--------
Item Level: 85
--------
Limited to: 1
Radius: Large
--------
--------
--------
Passive Skills in Radius also grant +4% to Chaos Resistance`;

    const parsedItem = ItemParser.parseItem(itemText);
    const matchedMods = modMatcher.matchAllMods(parsedItem);
    const query = QueryBuilder.buildQuery(parsedItem, matchedMods);

    expect(parsedItem.name).toBe("The Light of Meaning");
    expect(matchedMods.explicit.length).toBe(1);
    expect(query.query.stats).toBeDefined();
  });

  it('should handle Megalomaniac with 1 Added Passive Skill mods', () => {
    const itemText = `Rarity: Unique
Megalomaniac
Medium Cluster Jewel
--------
Item Level: 82
--------
Requirements:
Level: 60
--------
--------
--------
Adds 4 Passive Skills
Added Small Passive Skills grant Nothing
1 Added Passive Skill is Brand Loyalty
1 Added Passive Skill is Devastator
1 Added Passive Skill is Genius
--------
Corrupted`;

    const parsedItem = ItemParser.parseItem(itemText);
    const matchedMods = modMatcher.matchAllMods(parsedItem);
    const query = QueryBuilder.buildQuery(parsedItem, matchedMods);

    expect(parsedItem.name).toBe("Megalomaniac");
    expect(parsedItem.corrupted).toBe(true);
    expect(matchedMods.explicit.length).toBe(3);
    expect(query.query.stats).toBeDefined();
    expect(query.query.stats![0].filters.length).toBe(3);
  });
});