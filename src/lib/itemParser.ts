import { ParsedItem, ItemMod } from '../types/poe';

export class ItemParser {
  private static extractNumbers(text: string): number[] {
    const numbers = text.match(/\d+(\.\d+)?/g);
    return numbers ? numbers.map(n => parseFloat(n)) : [];
  }

  private static getModType(text: string, baseType?: string): ItemMod['type'] {
    if (text.includes('(enchant)')) return 'enchant';
    if (text.includes('(implicit)')) return 'implicit';
    if (text.includes('(crafted)')) return 'crafted';
    if (text.includes('(fractured)')) return 'fractured';
    
    // Cluster Jewelの特定のmodはenchantとして扱う
    if (baseType && baseType.toLowerCase().includes('cluster jewel')) {
      if (text.startsWith('Adds') && text.includes('Passive Skills')) return 'enchant';
      if (text.includes('Added Passive Skills are Jewel Sockets')) return 'enchant';
      if (text.includes('Added Small Passive Skills grant')) return 'enchant';
      if (text.startsWith('1 Added Passive Skill is')) return 'enchant';
    }
    
    return 'explicit';
  }

  private static cleanModText(text: string): string {
    return text
      .replace(/\(enchant\)/g, '')
      .replace(/\(implicit\)/g, '')
      .replace(/\(crafted\)/g, '')
      .replace(/\(fractured\)/g, '')
      .trim();
  }

  static parseItem(itemText: string): ParsedItem {
    const lines = itemText.split('\n').map(line => line.trim()).filter(line => line);
    
    const parsedItem: ParsedItem = {
      rarity: '',
      name: '',
      baseType: '',
      itemLevel: 0,
      mods: []
    };

    let headerLineCount = 0;
    let isInHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line === '--------') {
        isInHeader = false;
        continue;
      }

      if (isInHeader) {
        if (line.startsWith('Rarity:')) {
          parsedItem.rarity = line.replace('Rarity:', '').trim();
          headerLineCount = 0;
        } else if (headerLineCount === 0) {
          parsedItem.name = line;
          headerLineCount++;
        } else if (headerLineCount === 1) {
          parsedItem.baseType = line;
          headerLineCount++;
        }
      } else if (line.startsWith('Item Level:')) {
        parsedItem.itemLevel = parseInt(line.replace('Item Level:', '').trim());
      } else if (line.startsWith('Requirements:')) {
        parsedItem.requirements = {};
        i++;
        while (i < lines.length && lines[i] !== '--------') {
          const reqLine = lines[i];
          if (reqLine.startsWith('Level:')) {
            parsedItem.requirements.level = parseInt(reqLine.replace('Level:', '').trim());
          } else if (reqLine.startsWith('Str:')) {
            parsedItem.requirements.str = parseInt(reqLine.replace('Str:', '').trim());
          } else if (reqLine.startsWith('Dex:')) {
            parsedItem.requirements.dex = parseInt(reqLine.replace('Dex:', '').trim());
          } else if (reqLine.startsWith('Int:')) {
            parsedItem.requirements.int = parseInt(reqLine.replace('Int:', '').trim());
          }
          i++;
        }
        i--;
      } else if (line === 'Corrupted') {
        parsedItem.corrupted = true;
      } else if (line === 'Fractured Item') {
        parsedItem.fractured = true;
      } else if (
        !line.startsWith('Quality:') &&
        !line.startsWith('Physical Damage:') &&
        !line.startsWith('Elemental Damage:') &&
        !line.startsWith('Critical Strike Chance:') &&
        !line.startsWith('Attacks per Second:') &&
        !line.startsWith('Weapon Range:') &&
        !line.startsWith('Armour:') &&
        !line.startsWith('Energy Shield:') &&
        !line.startsWith('Evasion:') &&
        !line.includes('Sockets:') &&
        !line.startsWith('Radius:') &&
        !line.startsWith('Limited to:') &&
        !line.startsWith('"') && // Skip flavor text starting with quotes
        !line.startsWith('-') && // Skip flavor text starting with dash
        line !== 'Unique' &&
        line !== 'Rare' &&
        line !== 'Magic' &&
        line !== 'Normal' &&
        line !== parsedItem.name &&
        line !== parsedItem.baseType
      ) {
        const modType = this.getModType(line, parsedItem.baseType);
        const cleanText = this.cleanModText(line);
        const values = this.extractNumbers(cleanText);
        
        if (cleanText) {
          // Check if this mod continues on the next line
          if (i + 1 < lines.length && lines[i + 1] !== '--------') {
            const nextLine = lines[i + 1];
            // Check if next line is likely a continuation
            if (!nextLine.startsWith('Radius:') && 
                !nextLine.startsWith('Limited to:') &&
                !nextLine.startsWith('"') &&
                !nextLine.startsWith('-') &&
                nextLine !== 'Corrupted' &&
                nextLine !== 'Fractured Item' &&
                !this.getModType(nextLine, parsedItem.baseType).includes('implicit') &&
                !this.getModType(nextLine, parsedItem.baseType).includes('enchant') &&
                !this.getModType(nextLine, parsedItem.baseType).includes('crafted') &&
                !this.getModType(nextLine, parsedItem.baseType).includes('fractured')) {
              // This is likely a continuation of the current mod
              const fullText = cleanText + '\\n' + nextLine;
              const fullValues = this.extractNumbers(fullText);
              parsedItem.mods.push({
                text: fullText,
                type: modType,
                values: fullValues.length > 0 ? fullValues : undefined
              });
              i++; // Skip the next line since we've already processed it
              continue;
            }
          }
          
          parsedItem.mods.push({
            text: cleanText,
            type: modType,
            values: values.length > 0 ? values : undefined
          });
        }
      }
    }

    return parsedItem;
  }
}