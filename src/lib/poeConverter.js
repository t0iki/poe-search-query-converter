import { ItemParser } from './itemParser';
import { ModMatcher } from './modMatcher';
import { QueryBuilder } from './queryBuilder';
import modsData from '../../data/mods.json';
export class PoeConverter {
    constructor() {
        this.modMatcher = new ModMatcher(modsData);
    }
    convertToTradeUrl(itemText, league = 'Settlers') {
        const parsedItem = ItemParser.parseItem(itemText);
        const filtersByType = this.modMatcher.matchAllMods(parsedItem);
        const query = QueryBuilder.buildQuery(parsedItem, filtersByType);
        return QueryBuilder.buildUrl(query, league);
    }
    convertToQuery(itemText) {
        const parsedItem = ItemParser.parseItem(itemText);
        const filtersByType = this.modMatcher.matchAllMods(parsedItem);
        return QueryBuilder.buildQuery(parsedItem, filtersByType);
    }
    parseItemText(itemText) {
        return ItemParser.parseItem(itemText);
    }
}
