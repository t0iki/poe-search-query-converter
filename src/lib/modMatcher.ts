import { ModDatabase, PoeMod, ItemMod, StatFilter, ParsedItem } from '../types/poe';
import { ClusterJewelHandler } from './clusterJewelHandler';

export class ModMatcher {
  private modDatabase: ModDatabase;
  
  constructor(modDatabase: ModDatabase) {
    this.modDatabase = modDatabase;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\d+(\.\d+)?/g, '#')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const normalized1 = this.normalizeText(str1);
    const normalized2 = this.normalizeText(str2);
    
    if (normalized1 === normalized2) return 1;
    
    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');
    
    const allWords = new Set([...words1, ...words2]);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / allWords.size;
  }

  findMatchingMod(itemMod: ItemMod, forceExplicitSearch: boolean = false): PoeMod | null {
    let bestMatch: PoeMod | null = null;
    let bestScore = 0;

    // 数値を#に置き換えたテキストも試す
    const itemTexts = [
      itemMod.text,
      itemMod.text.replace(/\d+(\.\d+)?/g, '#')
    ];

    for (const group of this.modDatabase.result) {
      // modタイプに応じて適切なグループを選択
      const shouldCheckGroup = forceExplicitSearch ? 
        group.id === 'explicit' : 
        this.shouldCheckGroup(group.id, itemMod.type);
      if (!shouldCheckGroup) continue;

      for (const mod of group.entries) {
        // 各バリエーションのテキストで比較
        for (const itemText of itemTexts) {
          const score = this.calculateSimilarity(itemText, mod.text);
          if (score > bestScore && score > 0.7) {
            bestScore = score;
            bestMatch = mod;
          }
        }
      }
    }

    return bestMatch;
  }

  private shouldCheckGroup(groupId: string, modType: ItemMod['type']): boolean {
    switch (modType) {
      case 'implicit':
        return groupId === 'implicit';
      case 'enchant':
        return groupId === 'enchant';
      case 'crafted':
        return groupId === 'crafted';
      case 'fractured':
        return groupId === 'fractured' || groupId === 'explicit';
      case 'explicit':
      default:
        return groupId === 'explicit' || groupId === 'pseudo';
    }
  }

  createStatFilter(itemMod: ItemMod, poeMod: PoeMod): StatFilter {
    const filter: StatFilter = {
      id: poeMod.id,
      disabled: false
    };

    if (itemMod.values && itemMod.values.length > 0) {
      filter.value = {};
      
      if (itemMod.values.length === 1) {
        filter.value.min = itemMod.values[0];
        filter.value.max = itemMod.values[0];
      } else if (itemMod.values.length === 2) {
        filter.value.min = Math.min(...itemMod.values);
        filter.value.max = Math.max(...itemMod.values);
      } else {
        filter.value.min = Math.min(...itemMod.values);
        filter.value.max = Math.max(...itemMod.values);
      }
    }

    return filter;
  }

  createStatFilterForForbiddenJewel(itemMod: ItemMod, modId: string): StatFilter | null {
    // Extract the skill name from the mod text
    const match = itemMod.text.match(/Allocates (.+) if you have/);
    if (!match) return null;
    
    const skillName = match[1].trim();
    
    // Find the matching mod in the database to get options
    for (const group of this.modDatabase.result) {
      const mod = group.entries.find(m => m.id === modId);
      if (mod && mod.option) {
        const option = mod.option.options.find(opt => opt.text === skillName);
        if (option) {
          return {
            id: modId,
            value: {
              option: option.id
            },
            disabled: false
          };
        }
      }
    }
    
    return null;
  }

  matchAllMods(parsedItem: ParsedItem): { [key: string]: StatFilter[] } {
    const itemMods = parsedItem.mods;
    const filtersByType: { [key: string]: StatFilter[] } = {
      implicit: [],
      enchant: [],
      explicit: [],
      crafted: [],
      fractured: []
    };

    // UniqueアイテムまたはUnknownアイテムの場合
    if (parsedItem.rarity === 'Unique' || parsedItem.rarity === 'Unknown') {
      // Megalomaniacの場合は先に処理（Cluster Jewelだが、Uniqueでもある）
      if (parsedItem.name === "Megalomaniac") {
        // "1 Added Passive Skill is"で始まるmodをフィルタリング
        const passiveSkillMods = itemMods.filter(mod => 
          mod.text.startsWith('1 Added Passive Skill is')
        );
        
        for (const itemMod of passiveSkillMods) {
          // Megalomaniacのpassive skill modはexplicitグループから探す
          const matchedMod = this.findMatchingMod(itemMod, true);
          if (matchedMod) {
            const filter = this.createStatFilter(itemMod, matchedMod);
            filtersByType.explicit.push(filter);
          }
        }
        
        // Corruptedの場合もimplicit modを追加
        if (parsedItem.corrupted) {
          const implicitMods = itemMods.filter(mod => mod.type === 'implicit');
          for (const itemMod of implicitMods) {
            const matchedMod = this.findMatchingMod(itemMod);
            if (matchedMod) {
              const filter = this.createStatFilter(itemMod, matchedMod);
              filtersByType.implicit.push(filter);
            }
          }
        }
        return filtersByType;
      }
      
      // Watcher's Eyeの場合
      if (parsedItem.name === "Watcher's Eye") {
        // "while affected by"を含むmodをフィルタリング
        const affectedByMods = itemMods.filter(mod => 
          mod.text.toLowerCase().includes('while affected by')
        );
        
        for (const itemMod of affectedByMods) {
          const matchedMod = this.findMatchingMod(itemMod);
          if (matchedMod) {
            const filter = this.createStatFilter(itemMod, matchedMod);
            filtersByType[itemMod.type].push(filter);
          }
        }
      }
      
      // Forbidden FleshまたはForbidden Flameの場合
      if (parsedItem.name === "Forbidden Flesh" || parsedItem.name === "Forbidden Flame") {
        // Fleshの場合は"on Forbidden Flame"、Flameの場合は"on Forbidden Flesh"で終わるmodをフィルタリング
        const targetMod = parsedItem.name === "Forbidden Flesh" ? 
          'modifier on Forbidden Flame' : 'modifier on Forbidden Flesh';
        
        const allocatesMods = itemMods.filter(mod => 
          mod.text.endsWith(targetMod)
        );
        
        for (const itemMod of allocatesMods) {
          // 対になるmodのIDを使用
          const modId = parsedItem.name === "Forbidden Flesh" ? 
            "explicit.stat_2460506030" : "explicit.stat_1190333629";
          const filter = this.createStatFilterForForbiddenJewel(itemMod, modId);
          if (filter) {
            filtersByType.explicit.push(filter);
          }
        }
      }
      
      // Impossible Escapeの場合
      if (parsedItem.name === "Impossible Escape") {
        // "Passives in Radius"を含むmodをフィルタリング
        const radiusMods = itemMods.filter(mod => 
          mod.text.includes('Passives in Radius')
        );
        
        for (const itemMod of radiusMods) {
          const matchedMod = this.findMatchingMod(itemMod);
          if (matchedMod) {
            const filter = this.createStatFilter(itemMod, matchedMod);
            filtersByType[itemMod.type].push(filter);
          }
        }
      }
      
      // The Balance of Terrorの場合
      if (parsedItem.name === "The Balance of Terror") {
        // 条件付きmodをフィルタリング ("if you've cast" を含むmod)
        const conditionalMods = itemMods.filter(mod => 
          mod.text.toLowerCase().includes("if you've cast")
        );
        
        for (const itemMod of conditionalMods) {
          const matchedMod = this.findMatchingMod(itemMod);
          if (matchedMod) {
            // The Balance of Terrorの場合は値のレンジを含めない
            const filter: StatFilter = {
              id: matchedMod.id,
              disabled: false
            };
            filtersByType[itemMod.type].push(filter);
          }
        }
      }
      
      // Sublime Visionの場合
      if (parsedItem.name === "Sublime Vision") {
        // "while affected by"を含むmodのみをフィルタリング
        const affectedByMods = itemMods.filter(mod => 
          mod.text.toLowerCase().includes("while affected by")
        );
        
        for (const itemMod of affectedByMods) {
          const matchedMod = this.findMatchingMod(itemMod);
          if (matchedMod) {
            const filter = this.createStatFilter(itemMod, matchedMod);
            filtersByType[itemMod.type].push(filter);
          }
        }
      }
      
      // Split Personalityの場合
      if (parsedItem.name === "Split Personality") {
        // すべてのexplicit modを追加（特定のキーワードに限定しない）
        const explicitMods = itemMods.filter(mod => mod.type === 'explicit');
        
        for (const itemMod of explicitMods) {
          const matchedMod = this.findMatchingMod(itemMod);
          if (matchedMod) {
            const filter = this.createStatFilter(itemMod, matchedMod);
            filtersByType[itemMod.type].push(filter);
          }
        }
      }
      
      // The Light of Meaningの場合
      if (parsedItem.name === "The Light of Meaning") {
        // "Passive Skills in Radius also grant"を含むmodをフィルタリング
        const radiusMods = itemMods.filter(mod => 
          mod.text.includes('Passive Skills in Radius also grant')
        );
        
        for (const itemMod of radiusMods) {
          const matchedMod = this.findMatchingMod(itemMod);
          if (matchedMod) {
            const filter = this.createStatFilter(itemMod, matchedMod);
            filtersByType[itemMod.type].push(filter);
          }
        }
      }
      
      // Corruptedの場合はimplicit modをマッチング
      if (parsedItem.corrupted) {
        const implicitMods = itemMods.filter(mod => mod.type === 'implicit');
        for (const itemMod of implicitMods) {
          const matchedMod = this.findMatchingMod(itemMod);
          if (matchedMod) {
            const filter = this.createStatFilter(itemMod, matchedMod);
            filtersByType.implicit.push(filter);
          }
        }
      }
      return filtersByType;
    }

    // Cluster Jewelの場合（Megalomaniacは既にUnique処理で対応済み）
    if (ClusterJewelHandler.isClusterJewel(parsedItem.baseType) && parsedItem.name !== "Megalomaniac") {
      // 通常のCluster Jewelの処理
      const clusterFilters = ClusterJewelHandler.createClusterJewelFilters(parsedItem.baseType, itemMods);
      filtersByType.enchant.push(...clusterFilters);
      
      // Cluster Jewelのenchantは通常のマッチングをスキップ
      const nonEnchantMods = itemMods.filter(mod => mod.type !== 'enchant');
      
      // 個別modのマッチング
      for (const itemMod of nonEnchantMods) {
        const matchedMod = this.findMatchingMod(itemMod);
        if (matchedMod) {
          const filter = this.createStatFilter(itemMod, matchedMod);
          filtersByType[itemMod.type].push(filter);
        }
      }
      
      return filtersByType;
    }

    // それ以外のアイテムは対応しない
    return filtersByType;
  }

}