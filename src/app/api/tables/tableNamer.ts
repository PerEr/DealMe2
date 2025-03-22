// tableNamer.ts

/**
 * Generates a memorable table name from a GUID string.
 * Combines a sci-fi or fantasy adjective and noun in a deterministic way.
 * @param guid A GUID string (e.g., "4b9e2f1a-8d7c-4e2b-a5f9-1d3e6f8c9b0d")
 * @returns A string like "Quantum Vortex" or "Mystic Ogre"
 */
function generateTableName(guid: string): string {
    // Sci-fi and fantasy themed adjectives (200)
    const adjectives: string[] = [
        "Quantum", "Mystic", "Lunar", "Cursed", "Stellar", "Grim", "Rogue", "Shimmering", "Cyber", "Wild",
        "Frozen", "Ancient", "Nova", "Brave", "Warp", "Feral", "Glitch", "Hidden", "Cosmic", "Bold",
        "Nebulous", "Arcane", "Solar", "Haunted", "Galactic", "Dread", "Stealthy", "Radiant", "Digital", "Savage",
        "Icy", "Eternal", "Astral", "Valiant", "Twisted", "Primal", "Corrupted", "Veiled", "Celestial", "Fierce",
        "Plasma", "Enchanted", "Stellar", "Wicked", "Orbital", "Bleak", "Phantom", "Glowing", "Wired", "Untamed",
        "Chilled", "Timeless", "Ethereal", "Noble", "Distorted", "Beastly", "Hacked", "Shadowy", "Infinite", "Iron",
        "Laser", "Spectral", "Meteor", "Doomed", "Cosmo", "Forlorn", "Silent", "Blazing", "Neon", "Rugged",
        "Frosty", "Mythic", "Void", "Heroic", "Bent", "Frenzied", "Glitched", "Obscure", "Starry", "Steel",
        "Flux", "Runed", "Comet", "Fated", "Holo", "Gloomy", "Echoing", "Fiery", "Circuit", "Harsh",
        "Glacial", "Legendary", "Drifting", "Gallant", "Warped", "Monstrous", "Jammed", "Cloaked", "Luminous", "Tough",
        "Pulse", "Sorcerous", "Planetary", "Damned", "Astro", "Wretched", "Hushed", "Scorching", "Tech", "Brutal",
        "Polar", "Fabled", "Abyssal", "Stout", "Curved", "Rabid", "Bugged", "Secret", "Radiated", "Hard",
        "Sonic", "Charmed", "Gravitic", "Lost", "Nebula", "Dire", "Whispering", "Burning", "Nano", "Rough",
        "Snowy", "Epic", "Dimensional", "Vile", "Spatial", "Sorrowful", "Muted", "Flaming", "Micro", "Craggy",
        "Vortex", "Magic", "Ion", "Accursed", "Cosmic", "Mournful", "Faint", "Infernal", "Quantum", "Stony",
        "Thunder", "Bewitched", "Radial", "Ruined", "Stellar", "Desolate", "Quiet", "Smoldering", "Byte", "Jagged",
        "Blizzard", "Sacred", "Temporal", "Foul", "Aerial", "Woeful", "Still", "Ember", "Pixel", "Clad",
        "Shock", "Divine", "Chrono", "Tainted", "Sky", "Grieving", "Calm", "Ashen", "Data", "Boulder",
        "Wave", "Holy", "Phase", "Corrupt", "Cloud", "Bleak", "Silent", "Cinder", "Code", "Rock",
        "Blast", "Blessed", "Shift", "Dark", "Mist", "Lone", "Soft", "Charred", "Bit", "Stone",
        "Ray", "Pure", "Drift", "Evil", "Fog", "Lost", "Hushed", "Soot", "Chip", "Peak",
        "Spark", "True", "Flow", "Vicious", "Haze", "Stray", "Low", "Dust", "Core", "Ridge"
    ];

    // Sci-fi and fantasy themed nouns (200)
    const nouns: string[] = [
        "Vortex", "Rune", "Drone", "Goblin", "Orbit", "Knight", "Nebula", "Witch", "Clone", "Realm",
        "Reactor", "Tower", "Void", "Ogre", "Beacon", "Scroll", "Flux", "Phoenix", "Matrix", "Titan",
        "Blaster", "Sword", "Probe", "Troll", "Galaxy", "Shield", "Cloud", "Sorcerer", "Droid", "Kingdom",
        "Core", "Castle", "Abyss", "Beast", "Signal", "Tome", "Pulse", "Dragon", "Grid", "Giant",
        "Laser", "Blade", "Bot", "Orc", "Star", "Armor", "Mist", "Mage", "Unit", "Empire",
        "Ray", "Axe", "Scout", "Fiend", "System", "Helm", "Veil", "Wizard", "Mech", "Domain",
        "Beam", "Spear", "Sensor", "Demon", "Cluster", "Crown", "Shroud", "Seer", "Rig", "Land",
        "Wave", "Staff", "Radar", "Ghoul", "Field", "Gauntlet", "Fog", "Cleric", "Frame", "Region",
        "Shock", "Bow", "Scan", "Imp", "Zone", "Plate", "Haze", "Druid", "Gear", "Territory",
        "Burst", "Hammer", "Relay", "Wraith", "Sector", "Chain", "Curtain", "Bard", "Device", "Plain",
        "Spark", "Lance", "Link", "Specter", "Rim", "Cloak", "Gloom", "Shaman", "Tool", "Valley",
        "Flare", "Mace", "Node", "Banshee", "Edge", "Robe", "Shadow", "Priest", "Engine", "Hill",
        "Bolt", "Dagger", "Port", "Vampire", "Expanse", "Mask", "Dark", "Monk", "Motor", "Cliff",
        "Surge", "Club", "Gate", "Skeleton", "Belt", "Hood", "Depth", "Ranger", "Unit", "Peak",
        "Charge", "Flail", "Hub", "Zombie", "Ring", "Veil", "Pit", "Thief", "System", "Ridge",
        "Flash", "Whip", "Dock", "Ghost", "Disk", "Cape", "Hole", "Rogue", "Circuit", "Slope",
        "Glow", "Trident", "Base", "Spirit", "Band", "Shawl", "Chasm", "Hunter", "Wire", "Crest",
        "Blast", "Scythe", "Tower", "Shade", "Loop", "Scarf", "Rift", "Scout", "Cable", "Mount",
        "Roar", "Pike", "Station", "Phantom", "Arc", "Glove", "Gulf", "Guard", "Line", "Summit",
        "Pulse", "Arrow", "Post", "Soul", "Span", "Boot", "Canyon", "Warrior", "Thread", "Spire"
    ];

    // Basic input validation
    if (!guid || !/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/.test(guid)) {
        throw new Error("Invalid GUID format. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
    }

    // Remove hyphens and convert to lowercase for consistency
    const cleanGuid = guid.replace(/-/g, "").toLowerCase();

    // Use first two characters for adjective index (0-199)
    const adjIndex = parseInt(cleanGuid.slice(0, 2), 16) % adjectives.length;
    // Use next two characters for noun index (0-199)
    const nounIndex = parseInt(cleanGuid.slice(2, 4), 16) % nouns.length;

    // Combine the selected adjective and noun
    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
}
/*
// Example usage
try {
    console.log(generateTableName("4b9e2f1a-8d7c-4e2b-a5f9-1d3e6f8c9b0d")); // e.g., "Wild Void"
    console.log(generateTableName("e7c3a9d2-1234-5678-9abc-def012345678")); // e.g., "Cosmic Reactor"
    console.log(generateTableName("00000000-0000-0000-0000-000000000000")); // e.g., "Quantum Vortex"
    console.log(generateTableName("a1b2c3d4-e5f6-7890-abcd-ef1234567890")); // e.g., "Scorching Matrix"
    console.log(generateTableName("deadbeef-abad-1dea-babe-beeffeedface")); // e.g., "Lost Spire"
} catch (error) {
    console.error(error.message);
}
*/
export { generateTableName };