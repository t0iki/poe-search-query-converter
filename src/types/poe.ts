export interface PoeMod {
  id: string;
  text: string;
  type: string;
  option?: {
    options: Array<{
      id: number;
      text: string;
    }>;
  };
}

export interface ModGroup {
  id: string;
  label: string;
  entries: PoeMod[];
}

export interface ModDatabase {
  result: ModGroup[];
}

export interface StatFilter {
  id: string;
  value?: {
    min?: number;
    max?: number;
    option?: number;
  };
  disabled?: boolean;
}

export interface QueryStat {
  type: string;
  value?: {
    min?: number;
    max?: number;
  };
  filters: StatFilter[];
  disabled?: boolean;
}

export interface PoeTradeQuery {
  query: {
    status?: {
      option: string;
    };
    name?: string;
    type?: string;
    stats?: QueryStat[];
    filters?: {
      type_filters?: any;
      weapon_filters?: any;
      armour_filters?: any;
      misc_filters?: {
        filters: {
          corrupted?: {
            option: boolean;
          };
          fractured_item?: {
            option: boolean;
          };
          [key: string]: any;
        };
      };
      [key: string]: any;
    };
  };
  sort?: {
    [key: string]: string;
  };
}

export interface ItemMod {
  text: string;
  type: 'enchant' | 'implicit' | 'explicit' | 'crafted' | 'fractured';
  values?: number[];
}

export interface ParsedItem {
  rarity: string;
  name: string;
  baseType: string;
  itemLevel: number;
  requirements?: {
    level?: number;
    str?: number;
    dex?: number;
    int?: number;
  };
  mods: ItemMod[];
  corrupted?: boolean;
  fractured?: boolean;
}