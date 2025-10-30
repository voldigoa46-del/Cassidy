import { parseBet } from "@cass-modules/ArielUtils";
import { BriefcaseAPI } from "@cass-modules/BriefcaseAPI";
import {
  ArmorInventoryItem,
  ChequeItem,
  InventoryItem,
  WeaponInventoryItem,
} from "@cass-modules/cassidyUser";
import { Datum } from "@cass-modules/Datum";
import { UNISpectra } from "@cassidy/unispectra";

export const meta: CommandMeta = {
  name: "communityshop",
  description:
    "Request, approve, buy, sell your and the community's custom items!",
  author: "Liane Cagara",
  version: "1.0.0",
  category: "Shopping",
  permissions: [0],
  noPrefix: false,
  waitingTime: 1,
  otherNames: ["comshop", "requestitem", "reqitem", "cshop", "csh"],
  shopPrice: 1000000,
  requirement: "3.0.0",
  icon: "👥",
  cmdType: "cplx_g",
  isGame: true,
};

export const globalKey = "COMSHOP";
export const propKey = "comshop";

export const style: CommandStyle = {
  title: "Community Shop 👥",
  titleFont: "bold",
  contentFont: "none",
};

export type RequestInvItem = InventoryItem & {
  shopPrice: number;
  priceType?: "money" | "gem";
  authorID?: string;
  submissionDate?: number;
};

export const itemTemplate: {
  category: string;
  guide: string;
  data: RequestInvItem;
}[] = [
  {
    guide: `Create your custom pet, keep in mind that the key is the most important here and the sellPrice, the key is for foods like if the key is "uwu" then the food type must be "uwu_food", the sellPrice reflects stats, higher sellPrice means higher hp and stats.`,
    category: "pet",
    data: {
      name: "Donkey",
      icon: "🫏",
      key: "donkey",
      shopPrice: 12999,
      sellPrice: 4500,
      flavorText: "Uncage for a new donkey pet!",
      type: "pet",
    } satisfies RequestInvItem,
  },
  {
    guide: `Generic items have no actual use on their own but some commands might require them or use them. The item interpretation depends on the command file.`,
    category: "generic",
    data: {
      name: "Negative Roll Pass",
      icon: "🎴",
      key: "negaRollPass",
      shopPrice: 6900000000000,
      sellPrice: 0,
      flavorText: "Allows you to have negative bets (jk)",
      type: "generic",
    } satisfies RequestInvItem,
  },
  {
    guide: `Potions are actually useless and just here for the sake of trolling, but you could actually make one.`,
    category: "potion",
    data: {
      name: "Water Breathing Potion",
      icon: "🧪🫧",
      key: "waterPotion",
      sellPrice: 1000000,
      shopPrice: 10000000,
      flavorText:
        "The potion allows your pet to live underwater forever and leave you.",
      type: "potion",
    } satisfies RequestInvItem,
  },
  {
    guide: `Self explanatory, atk will be the attack stat (not exactly the damage but depends on atk stat) and also def and magic stat.`,
    category: "weapon",
    data: {
      name: "Foamblade",
      icon: "🧽",
      key: "foamBlade",
      sellPrice: 1000000,
      shopPrice: 10000000,
      flavorText: "A soft but decently sharp sword for your pet.",
      type: "weapon",
      atk: 15,
      def: 1,
      magic: 0,
    } satisfies WeaponInventoryItem & RequestInvItem,
  },
  {
    guide: `An item with money tied on it. the chequeAmount must be the reward money when used.`,
    category: "cheque",
    data: {
      name: "Idk Custom Cheque",
      icon: "✨💰",
      key: "chequeIdk",
      sellPrice: 1000000,
      shopPrice: 10000000,
      flavorText: "A custom cheque maybe",
      type: "cheque",
      chequeAmount: 9000000,
    } satisfies ChequeItem & RequestInvItem,
  },
  {
    guide: `Self explanatory, def will be the defense stat (not exactly the damage reduction but depends on def stat) and also atk and magic stat.`,
    category: "armor",
    data: {
      name: "Hexagon Plate",
      icon: "🛡️",
      key: "hexaPlate",
      sellPrice: 1000000,
      shopPrice: 10000000,
      flavorText: "Geometrical Gear for damage reduction.",
      type: "armor",
      atk: 5,
      def: 23,
      magic: 0,
    } satisfies ArmorInventoryItem & RequestInvItem,
  },
  {
    guide: `Self explanatory, the saturation is actually the milliseconds of how long the pet will be full. Do not change the type, unless you want a pet food like "cat_food" or "dog_food"`,
    category: "anypet_food",
    data: {
      name: "Sweet Berries",
      icon: "🍒",
      key: "sweetBerries",
      sellPrice: 50000,
      shopPrice: 100000,
      flavorText: "Really expensive berries for any pet.",
      saturation: 6 * 60 * 1000,
      type: "anypet_food",
    },
  },
  {
    guide: `Warning, this is actually deprecated, but you can make a "food" item that works to any pet, it does not heal because the heal attribute gets converted to satuation (random range).`,
    category: "food",
    data: {
      name: "Sweet Berries",
      icon: "🍒",
      key: "sweetBerries",
      sellPrice: 50000,
      shopPrice: 100000,
      flavorText: "Really expensive berries with random result",
      heal: 100,
      type: "food",
    },
  },
  {
    category: "zip",
    guide: `This is an item, with zipContents that also contains an item, self explanatory. All zipContents have 100% chance to be redeemed.`,
    data: {
      name: "Example Pack",
      key: "examplePack",
      icon: "❓🎴",
      flavorText: "Open this example pack for something.",
      type: "zip",
      sellPrice: 1000,
      shopPrice: 10000,
      zipContents: [
        {
          name: "Example reward food 1",
          key: "exampleReward",
          icon: "✨",
          flavorText: "This is the reward maybe",
          type: "anypet_food",
          saturation: 5 * 60 * 1000,
        },
        {
          name: "Example reward food 2",
          key: "exampleReward2",
          icon: "✨",
          flavorText: "This is the reward maybe",
          type: "anypet_food",
          saturation: 5 * 60 * 1000,
        },
        {
          name: "Example reward food 3",
          key: "exampleReward3",
          icon: "✨",
          flavorText: "This is the reward maybe",
          type: "anypet_food",
          saturation: 5 * 60 * 1000,
        },
      ],
    },
  },
];

const home = new BriefcaseAPI(
  {
    isHypen: false,
    inventoryKey: "myreqitem",
    inventoryName: "My Request",
    inventoryIcon: "📤",
    inventoryLimit: Cassidy.invLimit,
    showCollectibles: false,
    showAdminFeat: false,
    ignoreFeature: ["top", "all", "trade", "sell", "use", "transfer"],
  },
  [
    {
      key: "template",
      description: "Get an item template by category.",
      aliases: ["temp", "tmp"],
      args: ["<category>"],
      async handler({ output }, extra) {
        const cat = extra.spectralArgs[0];
        const item = itemTemplate.find(
          (i) => `${i.category}`.toLowerCase() === `${cat || ""}`.toLowerCase()
        );
        if (!cat || !item) {
          return output.reply(
            `📄 Please provide the template category ID as argument, here are the categories:\n\n${itemTemplate
              .map((i) => `${UNISpectra.disc} ${i.category}`)
              .join("\n")}`
          );
        }
        return output.reply(
          `📄 **${cat.toTitleCase()}**\n\n💡 **Guide:**\nThe key is the item ID for typing, name is the item name for listing, icon is the item emoji, flavorText is the item description. Sell price is briefcase sell price (must be lower than half of it's shop price), shop price is the price in the community shop.\n${
            item.guide
          }\n\n**Customize this JSON DATA**:\n\n${JSON.stringify(
            item.data,
            null,
            2
          )}`
        );
      },
    },
    {
      key: "submit",
      description: "Submit a JSON of your requested item.",
      args: ["<json data>"],
      async handler(ctx, extra, bcContext) {
        
      },
    },
  ]
);

export async function entry(ctx: CommandContext) {
  home.runInContext(ctx);
}
