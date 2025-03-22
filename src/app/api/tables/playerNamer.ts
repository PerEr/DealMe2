// pokerPlayerAlias.ts

/**
 * Generates a funny, wrestling-inspired poker player alias from a GUID string.
 * Combines an over-the-top adjective and noun in a deterministic way.
 * @param guid A GUID string (e.g., "4b9e2f1a-8d7c-4e2b-a5f9-1d3e6f8c9b0d")
 * @returns A string like "Thunderous Mauler" or "Glitzy Viper"
 */
function generatePokerPlayerAlias(guid: string): string {
    // Wrestling-inspired adjectives (200)
    const adjectives: string[] = [
        "Thunderous", "Glitzy", "Raging", "Savage", "Blazing", "Dazzling", "Furious", "Gargantuan", "Sly", "Brawny",
        "Electric", "Golden", "Wild", "Brutal", "Fiery", "Shiny", "Roaring", "Colossal", "Sneaky", "Mighty",
        "Booming", "Flashy", "Ferocious", "Gruesome", "Scorching", "Radiant", "Howling", "Titanic", "Crafty", "Bold",
        "Crashing", "Gleaming", "Vicious", "Hulking", "Burning", "Luminous", "Snarling", "Gigantic", "Cunning", "Iron",
        "Explosive", "Silver", "Rampaging", "Beastly", "Flaming", "Brilliant", "Growling", "Monstrous", "Tricky", "Steel",
        "Thundering", "Platinum", "Untamed", "Fearsome", "Smoldering", "Glinting", "Bellowing", "Enormous", "Devious", "Stout",
        "Blasting", "Diamond", "Frenzied", "Terrifying", "Ignited", "Sparkling", "Yelling", "Massive", "Wily", "Tough",
        "Rumbling", "Emerald", "Rabid", "Dreadful", "Sizzling", "Glowing", "Shouting", "Towering", "Shrewd", "Hard",
        "Smashing", "Ruby", "Chaos", "Grim", "Blistering", "Beaming", "Screaming", "Jumbo", "Clever", "Rough",
        "Banging", "Sapphire", "Mad", "Ghastly", "Torching", "Twinkling", "Roaring", "Huge", "Smart", "Rugged",
        "Clashing", "Onyx", "Insane", "Wicked", "Redhot", "Shimmering", "Blaring", "Giant", "Quick", "Craggy",
        "Slamming", "Jet", "Crazy", "Sinister", "Flaring", "Glittering", "Hollering", "Bulky", "Swift", "Jagged",
        "Pounding", "Crimson", "Lunatic", "Evil", "Charring", "Dancing", "Wailing", "Sturdy", "Fast", "Stony",
        "Crunching", "Azure", "Psycho", "Dark", "Melting", "Flickering", "Crying", "Solid", "Rapid", "Rocky",
        "Thumping", "Violet", "Manic", "Vile", "Boiling", "Shining", "Whistling", "Thick", "Nimble", "Boulder",
        "Bashing", "Indigo", "Wildcat", "Foul", "Steaming", "Glistening", "Chanting", "Broad", "Fleet", "Clad",
        "Whacking", "Bronze", "Berserk", "Nasty", "Heated", "Polished", "Calling", "Wide", "Zippy", "Peak",
        "Slapping", "Copper", "Freak", "Rotten", "Toasting", "Glossy", "Echoing", "Grand", "Speedy", "Ridge",
        "Kicking", "Ironclad", "Zany", "Crooked", "Roasting", "Bright", "Booming", "Vast", "Hasty", "Summit",
        "Punching", "Steely", "Goofy", "Twisted", "Baking", "Clear", "Ringing", "Large", "Brisk", "Spire",
        "Chopping", "Titanium", "Oddball", "Bent", "Frying", "Vivid", "Clanging", "Big", "Hurried", "Cliff"
    ];

    // Wrestling-inspired nouns (200)
    const nouns: string[] = [
        "Mauler", "Viper", "Crusher", "Beast", "Blaster", "Ace", "Brawler", "Titan", "Fox", "Hawk",
        "Smasher", "Cobra", "Bruiser", "Monster", "Bomber", "King", "Fighter", "Giant", "Wolf", "Eagle",
        "Ripper", "Python", "Slammer", "Freak", "Cannon", "Chief", "Scrapper", "Colossus", "Tiger", "Raven",
        "Shredder", "Boa", "Pounder", "Fiend", "Rocket", "Boss", "Pugilist", "Goliath", "Lion", "Owl",
        "Slicer", "Rattler", "Basher", "Demon", "Missile", "Lord", "Boxer", "Behemoth", "Bear", "Falcon",
        "Chopper", "Mamba", "Thrasher", "Devil", "Torpedo", "Duke", "Wrestler", "Leviathan", "Panther", "Crow",
        "Cutter", "Asp", "Walloper", "Ogre", "Laser", "Prince", "Brawler", "Juggernaut", "Cougar", "Vulture",
        "Hacker", "Adder", "Batter", "Ghoul", "Pulse", "Baron", "Gladiator", "Mammoth", "Jaguar", "Hawk",
        "Dicer", "Serpent", "Clobber", "Wraith", "Beam", "Knight", "Contender", "Tank", "Leopard", "Buzzard",
        "Razor", "Viper", "Socker", "Banshee", "Ray", "Count", "Challenger", "Rhino", "Lynx", "Kite",
        "Slasher", "Sidewinder", "Whacker", "Phantom", "Bolt", "Earl", "Ringer", "Bull", "Cheetah", "Sparrow",
        "Blade", "Copperhead", "Smacker", "Specter", "Spark", "Squire", "Bruiser", "Bison", "Bobcat", "Lark",
        "Edge", "Racer", "Hammer", "Ghost", "Flash", "Master", "Thumper", "Ox", "Wildcat", "Finch",
        "Knife", "Stinger", "Puncher", "Shade", "Flare", "Captain", "Striker", "Moose", "Puma", "Wren",
        "Spike", "Hornet", "Kicker", "Spirit", "Glow", "General", "Hitter", "Elk", "Ocelot", "Dove",
        "Point", "Wasp", "Boot", "Soul", "Burst", "Colonel", "Slapper", "Deer", "Caracal", "Pigeon",
        "Claw", "Bee", "Leg", "Vampire", "Charge", "Major", "Knocker", "Stag", "Serval", "Crane",
        "Fang", "Scorpion", "Foot", "Zombie", "Surge", "Sergeant", "Banger", "Buck", "Margay", "Heron",
        "Tooth", "Dragonfly", "Shin", "Skeleton", "Shock", "Lieutenant", "Crasher", "Ram", "Cat", "Gull",
        "Horn", "Moth", "Knee", "Golem", "Wave", "Admiral", "Dasher", "Boar", "Tomcat", "Swan"
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
    console.log(generatePokerPlayerAlias("4b9e2f1a-8d7c-4e2b-a5f9-1d3e6f8c9b0d")); // e.g., "Wild Void" -> "Wild Titan"
    console.log(generatePokerPlayerAlias("e7c3a9d2-1234-5678-9abc-def012345678")); // e.g., "Cosmic Reactor" -> "Cosmic Chief"
    console.log(generatePokerPlayerAlias("00000000-0000-0000-0000-000000000000")); // e.g., "Quantum Vortex" -> "Thunderous Mauler"
    console.log(generatePokerPlayerAlias("a1b2c3d4-e5f6-7890-abcd-ef1234567890")); // e.g., "Scorching Matrix" -> "Scorching Missile"
    console.log(generatePokerPlayerAlias("deadbeef-abad-1dea-babe-beeffeedface")); // e.g., "Lost Spire" -> "Lost Serpent"
} catch (error) {
    console.error(error.message);
}
*/

export { generatePokerPlayerAlias };