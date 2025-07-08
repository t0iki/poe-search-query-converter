import { PoeTradeQuery, ParsedItem, StatFilter } from '../types/poe';
import { ClusterJewelHandler } from './clusterJewelHandler';

/**
 * QueryBuilder - Builds PoE trade API queries
 * Supports only Unique/Unknown items and Cluster Jewels
 */
export class QueryBuilder {
  static buildQuery(parsedItem: ParsedItem, filtersByType: { [key: string]: StatFilter[] }): PoeTradeQuery {
    const query: PoeTradeQuery = {
      query: {
        status: {
          option: 'online'
        }
      },
      sort: {
        price: 'asc'
      }
    };

    // UniqueアイテムまたはUnknownアイテムの場合
    if (parsedItem.rarity === 'Unique' || parsedItem.rarity === 'Unknown') {
      query.query.name = parsedItem.name;
      query.query.type = parsedItem.baseType;
      
      const stats = [];
      
      // Watcher's Eyeの場合はexplicit modを追加
      if (parsedItem.name === "Watcher's Eye" && filtersByType.explicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.explicit,
          disabled: false
        });
      }
      
      // Forbidden FleshまたはForbidden Flameの場合はexplicit modを追加
      if ((parsedItem.name === "Forbidden Flesh" || parsedItem.name === "Forbidden Flame") && filtersByType.explicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.explicit,
          disabled: false
        });
      }
      
      // Impossible Escapeの場合はexplicit modを追加
      if (parsedItem.name === "Impossible Escape" && filtersByType.explicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.explicit,
          disabled: false
        });
      }
      
      // The Balance of Terrorの場合はexplicit modを追加
      if (parsedItem.name === "The Balance of Terror" && filtersByType.explicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.explicit,
          disabled: false
        });
      }
      
      // Sublime Visionの場合はexplicit modを追加
      if (parsedItem.name === "Sublime Vision" && filtersByType.explicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.explicit,
          disabled: false
        });
      }
      
      // Split Personalityの場合はexplicit modを追加
      if (parsedItem.name === "Split Personality" && filtersByType.explicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.explicit,
          disabled: false
        });
      }
      
      // The Light of Meaningの場合はexplicit modを追加
      if (parsedItem.name === "The Light of Meaning" && filtersByType.explicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.explicit,
          disabled: false
        });
      }
      
      // Megalomaniacの場合はexplicit modを追加
      if (parsedItem.name === "Megalomaniac" && filtersByType.explicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.explicit,
          disabled: false
        });
      }
      
      // Corruptedの場合はimplicit modを追加
      if (parsedItem.corrupted && filtersByType.implicit.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.implicit,
          disabled: false
        });
      }
      
      if (stats.length > 0) {
        query.query.stats = stats;
      }
      
      query.query.filters = {
        misc_filters: {
          filters: {}
        }
      };
      
      if (parsedItem.corrupted && query.query.filters.misc_filters) {
        query.query.filters.misc_filters.filters.corrupted = {
          option: true
        };
      }
      
      return query;
    }

    // Cluster Jewelの場合（Megalomaniacは既にUnique処理で対応済み）
    if (ClusterJewelHandler.isClusterJewel(parsedItem.baseType) && parsedItem.name !== "Megalomaniac") {
      const stats = [];
      
      // enchant mods (passive skills, jewel sockets, etc.)
      if (filtersByType.enchant.length > 0) {
        stats.push({
          type: 'and',
          filters: filtersByType.enchant,
          disabled: false
        });
      }

      // explicit と fractured mods
      const explicitFilters = [
        ...filtersByType.explicit,
        ...filtersByType.fractured
      ];
      
      if (explicitFilters.length > 0) {
        stats.push({
          type: 'and',
          filters: explicitFilters,
          disabled: false
        });
      }

      if (stats.length > 0) {
        query.query.stats = stats;
      }

      query.query.filters = {
        misc_filters: {
          filters: {}
        }
      };

      if (parsedItem.fractured && query.query.filters.misc_filters) {
        query.query.filters.misc_filters.filters.fractured_item = {
          option: true
        };
      }

      return query;
    }

    // それ以外のアイテムは対応しない
    throw new Error('Only Unique/Unknown items and Cluster Jewels are supported');
  }

  static buildUrl(query: PoeTradeQuery, league: string = 'Settlers'): string {
    const baseUrl = 'https://www.pathofexile.com/trade/search';
    const encodedLeague = encodeURIComponent(league);
    const encodedQuery = encodeURIComponent(JSON.stringify(query));
    
    return `${baseUrl}/${encodedLeague}?q=${encodedQuery}`;
  }
}