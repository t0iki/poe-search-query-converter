import { ItemParser } from './itemParser';
import { ModMatcher } from './modMatcher';
import { QueryBuilder } from './queryBuilder';
import { ModDatabase } from '../types/poe';
import modsData from '../../data/mods.json';

export class PoeConverter {
  private modMatcher: ModMatcher;

  constructor() {
    this.modMatcher = new ModMatcher(modsData as ModDatabase);
  }

  convertToTradeUrl(itemText: string, league: string = 'Settlers'): string {
    const parsedItem = ItemParser.parseItem(itemText);
    
    const filtersByType = this.modMatcher.matchAllMods(parsedItem);
    
    const query = QueryBuilder.buildQuery(parsedItem, filtersByType);
    
    return QueryBuilder.buildUrl(query, league);
  }

  convertToQuery(itemText: string): object {
    const parsedItem = ItemParser.parseItem(itemText);
    
    const filtersByType = this.modMatcher.matchAllMods(parsedItem);
    
    return QueryBuilder.buildQuery(parsedItem, filtersByType);
  }

  parseItemText(itemText: string) {
    return ItemParser.parseItem(itemText);
  }
}