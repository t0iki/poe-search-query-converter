export class ItemParser {
    static extractNumbers(text) {
        const numbers = text.match(/\d+(\.\d+)?/g);
        return numbers ? numbers.map(n => parseFloat(n)) : [];
    }
    static getModType(text) {
        if (text.includes('(enchant)'))
            return 'enchant';
        if (text.includes('(implicit)'))
            return 'implicit';
        if (text.includes('(crafted)'))
            return 'crafted';
        if (text.includes('(fractured)'))
            return 'fractured';
        return 'explicit';
    }
    static cleanModText(text) {
        return text
            .replace(/\(enchant\)/g, '')
            .replace(/\(implicit\)/g, '')
            .replace(/\(crafted\)/g, '')
            .replace(/\(fractured\)/g, '')
            .trim();
    }
    static parseItem(itemText) {
        const lines = itemText.split('\n').map(line => line.trim()).filter(line => line);
        const parsedItem = {
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
                }
                else if (headerLineCount === 0) {
                    parsedItem.name = line;
                    headerLineCount++;
                }
                else if (headerLineCount === 1) {
                    parsedItem.baseType = line;
                    headerLineCount++;
                }
            }
            else if (line.startsWith('Item Level:')) {
                parsedItem.itemLevel = parseInt(line.replace('Item Level:', '').trim());
            }
            else if (line.startsWith('Requirements:')) {
                parsedItem.requirements = {};
                i++;
                while (i < lines.length && lines[i] !== '--------') {
                    const reqLine = lines[i];
                    if (reqLine.startsWith('Level:')) {
                        parsedItem.requirements.level = parseInt(reqLine.replace('Level:', '').trim());
                    }
                    else if (reqLine.startsWith('Str:')) {
                        parsedItem.requirements.str = parseInt(reqLine.replace('Str:', '').trim());
                    }
                    else if (reqLine.startsWith('Dex:')) {
                        parsedItem.requirements.dex = parseInt(reqLine.replace('Dex:', '').trim());
                    }
                    else if (reqLine.startsWith('Int:')) {
                        parsedItem.requirements.int = parseInt(reqLine.replace('Int:', '').trim());
                    }
                    i++;
                }
                i--;
            }
            else if (line === 'Corrupted') {
                parsedItem.corrupted = true;
            }
            else if (line === 'Fractured Item') {
                parsedItem.fractured = true;
            }
            else if (!line.startsWith('Quality:') &&
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
                line !== 'Unique' &&
                line !== 'Rare' &&
                line !== 'Magic' &&
                line !== 'Normal' &&
                line !== parsedItem.name &&
                line !== parsedItem.baseType) {
                const modType = this.getModType(line);
                const cleanText = this.cleanModText(line);
                const values = this.extractNumbers(cleanText);
                if (cleanText) {
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
