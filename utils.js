const getSuffix = (num) => {
  num = Math.abs(num);
  if (num >= 1000000000000) return "T";
  else if (num >= 1000000000) return "B";
  else if (num >= 1000000) return "M";
  else if (num >= 1000) return "k";
  return "";
}

const suffixes = {
  "T": 1000000000000,
  "B": 1000000000,
  "M": 1000000,
  "k": 1000,
  "": 1
}

export const formatNumber = (num, decimals = 2) => {
  num = parseFloat(num);
  if (!num) return 0;
  if (num < 1000 && num > -1000) return Math.floor(num);

  const suffix = getSuffix(num);
  num /= suffixes[suffix];

  if (num.toFixed(decimals).endsWith(("0".repeat(decimals)))) {
    return Math.floor(num) + suffix;
  }
  return num.toFixed(decimals) + suffix;
}

export const getTimeLeft = (time) => {  
  let weeks = Math.floor(time / 604800);
  let days = Math.floor((time % 604800) / 86400);
  let hours = Math.floor(((time % 604800) % 86400) / 3600);
  let minutes = Math.floor((((time % 604800) % 86400) % 3600) / 60);
  let seconds = Math.floor((((time % 604800) % 86400) % 3600) % 60);

  if (weeks >= 1) return `${weeks}w ${days}d`;
  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  if (minutes >= 1) return `${minutes}:${seconds}`
  return `${seconds}s`
}

export const getSkyblockId = (item) => {
  return item.getNBT().getCompoundTag("tag")?.getCompoundTag("ExtraAttributes")?.getString("id");
}

export const getCapFilledAmount = (creatures) => {
  return Math.ceil(creatures.reduce((a,b) => {
    return a + (b.name == "Baby Magma Slug"? 0.33 : 1);
  }, 0));
}

export const getRarityColour = (rarity) => {
  switch (rarity) {
    case "COMMON": 
      return Renderer.WHITE;
    case "UNCOMMON":
      return Renderer.GREEN;
    case "RARE": 
      return Renderer.BLUE;
    case "EPIC":
      return Renderer.DARK_PURPLE;
    case "LEGENDARY":
      return Renderer.GOLD;
    case "MYTHIC":
      return Renderer.LIGHT_PURPLE;
    default: 
      return Renderer.WHITE;
  }
}

export const get2dDistance = (pos1, pos2) => {
  return Math.sqrt(Math.abs(pos1[0]-pos2[0])**2 + Math.abs(pos1[1]-pos2[1])**2);
}

export const getCurrentDay = () => {
  return Math.floor(Date.now()/1000/60/60/24);
}

export const getCurrentHour = () => {
  return Math.floor(Date.now()/1000/60/60);
}

export const getSeaCreatureCap = (locraw) => {
  switch(locraw.mode) {
    case "crimson_isle":
      return 5;
    case "crystal_hollows":
      return 20;
    default:
      return 60;
  }
}

export const isRod = (item) => {
  if (!item) return;
  if (item.getID() != 346) return;
  if (["SOUL_WHIP", "CARNIVAL_FISHING_ROD", "GRAPPLING_HOOK"].includes(getSkyblockId(item))) return;
  return true;
}

const getItemFromString = (nbtStr) => {
  const MCItemStack = Java.type("net.minecraft.item.ItemStack");
  const nbt = net.minecraft.nbt.JsonToNBT.func_180713_a(nbtStr);
  return new Item(MCItemStack.func_77949_a(nbt));
}
const neuItemToCt = (item) => {
  let nbt = {
    id: item.itemid,
    Count: 1,
    Damage: item.damage
  }
  let ctitem = new Item(net.minecraft.item.ItemStack.func_77949_a(NBT.parse(nbt).rawNBT)); // loadItemStackFromNBT()
  let nbtString = ctitem.getRawNBT().toString().replace(",", ",tag:" + item.nbttag + ",");
  return getItemFromString(nbtString);
}

const SeaCreatures = JSON.parse(FileLib.read("SeaCreatureTracker", "SeaCreatures.json"));
for (let key in SeaCreatures) {
  SeaCreatures[key].item = neuItemToCt(SeaCreatures[key].item);
}

export const getSeaCreature = (entity) => {
  const name = entity.getName();
  if (name.indexOf("§") !== 0) return;
  const match = name.match(/(?:§2|§2 |§c|§l|§5Corrupted )([a-zA-Z ]+)/);
  if (!match) return;
  if (!SeaCreatures[match[1]]) return;
  return [match[1], SeaCreatures[match[1]]];
}

export const getStackedCreatures = (creatures) => {
  return creatures
    .filter((sc1, i) => i == creatures.indexOf(creatures.find(sc2 => sc1.name == sc2.name)))
    .map(obj => Object.assign(obj, {
      count: creatures.filter(sc3 => sc3.name == obj.name).length
    }))
}