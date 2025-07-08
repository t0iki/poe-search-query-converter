export class ClusterJewelHandler {
    static isClusterJewel(baseType) {
        return baseType.toLowerCase().includes('cluster jewel');
    }
    static parseClusterJewelEnchants(mods) {
        const enchant = {};
        for (const mod of mods) {
            if (mod.type !== 'enchant')
                continue;
            // Adds # Passive Skills
            if (mod.text.startsWith('Adds') && mod.text.includes('Passive Skills')) {
                enchant.passiveCount = mod.values?.[0];
            }
            // # Added Passive Skills are Jewel Sockets
            else if (mod.text.includes('Added Passive Skills are Jewel Sockets')) {
                enchant.jewelSockets = mod.values?.[0];
            }
            // Added Small Passive Skills grant:
            else if (mod.text.startsWith('Added Small Passive Skills grant:')) {
                enchant.passiveGrant = mod.text.replace('Added Small Passive Skills grant:', '').trim();
            }
        }
        return enchant;
    }
    static createClusterJewelFilters(baseType, mods) {
        if (!this.isClusterJewel(baseType)) {
            return [];
        }
        const filters = [];
        const enchants = this.parseClusterJewelEnchants(mods);
        // Passive count
        if (enchants.passiveCount) {
            filters.push({
                id: 'enchant.stat_3086156145',
                value: {
                    min: enchants.passiveCount,
                    max: enchants.passiveCount
                },
                disabled: false
            });
        }
        // Jewel sockets
        if (enchants.jewelSockets) {
            filters.push({
                id: 'enchant.stat_4079888060',
                value: {
                    min: enchants.jewelSockets,
                    max: enchants.jewelSockets
                },
                disabled: false
            });
        }
        // Passive grant
        if (enchants.passiveGrant) {
            const optionId = this.passiveGrantOptions.get(enchants.passiveGrant);
            if (optionId) {
                filters.push({
                    id: 'enchant.stat_3948993189',
                    value: {
                        option: optionId
                    },
                    disabled: false
                });
            }
        }
        return filters;
    }
}
ClusterJewelHandler.passiveGrantOptions = new Map([
    ['Axe Attacks deal 12% increased Damage with Hits and Ailments', 1],
    ['Sword Attacks deal 12% increased Damage with Hits and Ailments', 1],
    ['Staff Attacks deal 12% increased Damage with Hits and Ailments', 2],
    ['Mace or Sceptre Attacks deal 12% increased Damage with Hits and Ailments', 2],
    ['Claw Attacks deal 12% increased Damage with Hits and Ailments', 3],
    ['Dagger Attacks deal 12% increased Damage with Hits and Ailments', 3],
    ['12% increased Damage with Bows', 4],
    ['12% increased Damage Over Time with Bow Skills', 4],
    ['Wand Attacks deal 12% increased Damage with Hits and Ailments', 5],
    ['12% increased Damage with Two Handed Weapons', 6],
    ['12% increased Attack Damage while Dual Wielding', 7],
    ['12% increased Attack Damage while holding a Shield', 8],
    ['10% increased Attack Damage', 9],
    ['10% increased Spell Damage', 10],
    ['10% increased Elemental Damage', 11],
    ['12% increased Physical Damage', 12],
    ['12% increased Fire Damage', 13],
    ['12% increased Lightning Damage', 14],
    ['12% increased Cold Damage', 15],
    ['12% increased Chaos Damage', 16],
    ['Minions deal 10% increased Damage', 17],
    ['12% increased Burning Damage', 18],
    ['12% increased Chaos Damage over Time', 19],
    ['12% increased Physical Damage over Time', 20],
    ['12% increased Cold Damage over Time', 21],
    ['10% increased Damage over Time', 22],
    ['10% increased Effect of Non-Damaging Ailments', 23],
    ['10% increased Damage while affected by a Herald', 26],
    ['Minions deal 10% increased Damage while you are affected by a Herald', 27],
    ['Exerted Attacks deal 20% increased Damage', 28],
]);
