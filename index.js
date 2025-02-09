import { getLocation } from '../locraw';
import PogObject from '../PogData';
import { Huds } from "../Krun/Huds";
import { settings } from "./config.js";
import { getStackedCreatures, getSeaCreature, getTimeLeft, formatNumber, isRod, getCapFilledAmount, getRarityColour, get2dDistance, getCurrentDay, getCurrentHour, getSeaCreatureCap } from "./utils.js";
import { permanentData } from "./graphs.js";



const hudData = new PogObject("SeaCreatureTracker", {});
const huds = new Huds(hudData);
register("command", () => {
  huds.open();
}).setName("seacreaturetrackerhud");
register("gameUnload", () => {
  huds.save();
  hudData.save();
})

const playerUsername = Player.getName();

let players = {[playerUsername]: {creatures: [], xp: [], count: 0}};

let locraw = {mode: "", gametype: ""};
register("worldLoad", () => {
  getLocation(true).then((location) => {
    locraw = JSON.parse(location);
  })
})

register("worldLoad", () => {
  players = {[playerUsername]: {creatures: [], xp: [], count: 0}};
  checkReg.unregister();
  renderReg.unregister();
})

let castRodTime = Date.now();
register("playerInteract", () => {
  if (locraw.gametype != "SKYBLOCK") return;
  if (!settings.seaCreatureTracker) {
    checkReg.unregister();
    renderReg.unregister();
    return;
  }
  if (!isRod(Player.getHeldItem())) return;
  castRodTime = Date.now();
  if (!players[playerUsername].started) players[playerUsername].started = Date.now();
  if (isRod(Player.getHeldItem())) {
    checkReg.register();
    renderReg.register();
  }
})
register("step", () => {
  if (!settings.seaCreatureTracker) {
    checkReg.unregister();
    renderReg.unregister();
    return;
  }
  if (Date.now() - castRodTime < 30000) return;
  if (isRod(Player.getHeldItem())) return;
  checkReg.unregister();
  renderReg.unregister();
  players = {[playerUsername]: {creatures: [], xp: [], count: 0}};
}).setDelay(30)

// const setPlayedWith = (owner, name) => {
//   if (!permanentData.playedWith[getCurrentDay()]) {
//     permanentData.playedWith[getCurrentDay()] = {};
//   }
//   if (!permanentData.playedWith[getCurrentDay()][getCurrentHour()]) {
//     permanentData.playedWith[getCurrentDay()][getCurrentHour()] = {players: {}}
//   }
//   if (!permanentData.playedWith[getCurrentDay()][getCurrentHour()].players[owner]) {
//     permanentData.playedWith[getCurrentDay()][getCurrentHour()].players[owner] = {creatures: []}
//   }
//   permanentData.playedWith[getCurrentDay()][getCurrentHour()].players[owner].creatures.push({name, island: locraw.mode, time: Date.now()});
//   permanentData.save();
// }

let seaCreatures = [];
let hooks = [];
let checkReg = register("tick", () => {
  if (!settings.seaCreatureTracker) return;
  const olderSeaCreatures = seaCreatures.slice();
  let oldSeaCreatures = seaCreatures.slice();
  World.getAllEntitiesOfType(net.minecraft.entity.item.EntityArmorStand).forEach(entity => {
    const scData = getSeaCreature(entity);
    if (!scData) return;
    const name = scData[0];
    const uuid = entity.getUUID().toString();
    if (!oldSeaCreatures.some(sc => sc.uuid == uuid)) {
      
      const hookedBy = hooks.filter(hook => get2dDistance([hook.getX(), hook.getZ()], [entity.getX(), entity.getZ()]) < 3).sort((a,b) => get2dDistance([a.getX(), a.getZ()], [entity.getX(), entity.getZ()]) - get2dDistance([b.getX(), b.getZ()], [entity.getX(), entity.getZ()]) )?.[0];
      const owner = name == "Baby Magma Slug"? 
        olderSeaCreatures
          .filter(sc => sc.name == "Magma Slug")
          .sort((a,b) => a.entity.distanceTo(entity) - b.entity.distanceTo(entity))?.[0]?.owner
        : (hookedBy? new Entity(hookedBy.entity.field_146042_b).getName() : null);
      if (!owner) return;
      if (!players[owner]) {
        players[owner] = {creatures: [], xp: [], started: Date.now()};
      }

      seaCreatures.push({name, entity, uuid, owner, xp: scData[1].fishing_experience});
      new Thread(() => {
        players[owner].lastCaught = Date.now();
        players[owner].creatures.push({name, entity, uuid, owner, colour: getRarityColour(scData[1].rarity), item: scData[1].item, spawned: Date.now()});
        players[owner].stackedCreatures = getStackedCreatures(players[owner].creatures);
        players[owner].count = getCapFilledAmount(players[owner].creatures);
        //setPlayedWith(owner, name);
        if (owner == playerUsername && name !== "Baby Magma Slug") permanentData.caughtCreatures.push({name, time: Date.now(), island: locraw.mode, xp: scData[1].fishing_experience*(Number(settings.fishingWisdom)+100)/100, wisdom: Number(settings.fishingWisdom)});
        if (name !== "Baby Magma Slug" && owner == playerUsername && players[playerUsername].count >= getSeaCreatureCap(locraw)) {
          Client.showTitle("&cSea Creature Cap!", "", 0, 40, 0);
          World.playSound("random.anvil_land", 1, 1);
        }
      }).start();
      
    }
    oldSeaCreatures = oldSeaCreatures.filter(sc => sc.uuid !== uuid);
  })

  for (let creature of oldSeaCreatures) {
    seaCreatures = seaCreatures.filter(sc => sc.uuid !== creature.uuid);
    if (!players[creature.owner]) continue;
    players[creature.owner].creatures = players[creature.owner].creatures.filter(sc => sc.uuid !== creature.uuid);
    new Thread(() => {
      players[creature.owner].stackedCreatures = getStackedCreatures(players[creature.owner].creatures);
      players[creature.owner].count = getCapFilledAmount(players[creature.owner].creatures);
      if (creature.name == "Baby Magma Slug") return;
      players[creature.owner].xp.push(creature.xp);
      let totalExp = players[creature.owner].xp.reduce((a,b) => a+b, 0);
      if (creature.owner == playerUsername) {
        totalExp *= (Number(settings.fishingWisdom)+100)/100;
      }
      let xp = formatNumber(60*60*1000/(Date.now() - players[creature.owner].started)*totalExp);
      players[creature.owner].xpPerHour = creature.owner == playerUsername? xp + " &9☯" + Number(settings.fishingWisdom) : xp;
    }).start();

  }
  
  try {
    hooks = World.getAllEntitiesOfType(net.minecraft.entity.projectile.EntityFishHook);
  }
  catch(e) {

  }
}).unregister()

const creatureHud = huds.createTextHud("creatures", 10, 10, "&ePlayer\n&b  Creature\n&b  Creature\n&ePlayer\n&b  Creature\n&b  Creature");
creatureHud.onDraw((x, y, str) => {
  Renderer.translate(x, y);
  Renderer.scale(creatureHud.getScale());
  Renderer.drawStringWithShadow(str, 0, 0);
  Renderer.finishDraw();
})

let renderReg = register("renderOverlay", () => {
  if (huds.isOpen() || !settings.seaCreatureTracker) return;
  let i = 0;
  for (let player in players) {
    let playerData = players[player];
    if (player !== playerUsername) {
      if (settings.onlyShowYourCreatures) continue;
      if (Date.now() - playerData.lastCaught > 30000) {
        delete players[player];
        continue;
      }
    }
    
    Renderer.translate(creatureHud.getX(), creatureHud.getY()+i*11*creatureHud.getScale());
    Renderer.scale(creatureHud.getScale());
    Renderer.drawStringWithShadow("&e" + (player == playerUsername? "&l" : "") + player + " &7(" + playerData.count + "/" + getSeaCreatureCap(locraw) + ")", 0, 0);
    Renderer.finishDraw();
    i++;
    Renderer.translate(creatureHud.getX(), creatureHud.getY()+i*11*creatureHud.getScale());
    Renderer.scale(creatureHud.getScale());
    Renderer.drawStringWithShadow("&3Exp/h &f" + (playerData.xpPerHour?? "&cUnknown"), 0, 0);
    Renderer.finishDraw();
    i++
    let xI = 0;
    if (!playerData.stackedCreatures) break;
    for (let sc of playerData.stackedCreatures) {
      if (xI > 5) {
        xI = 0;
        i += 1.7;
      }
      Renderer.translate(creatureHud.getX()+xI*16*creatureHud.getScale(), creatureHud.getY()+i*11*creatureHud.getScale());
      Renderer.scale(creatureHud.getScale());
      Renderer.drawCircle(sc.colour, 8, 8, 8, 16);
      Renderer.finishDraw();
      Renderer.translate(creatureHud.getX()+xI*16*creatureHud.getScale(), creatureHud.getY()+i*11*creatureHud.getScale(), 100);
      Renderer.scale(creatureHud.getScale());
      sc.item.draw(0, 0);
      Renderer.finishDraw();
      Tessellator.disableDepth();
      Renderer.translate(creatureHud.getX()+xI*16*creatureHud.getScale() + (3 - sc.count.toString().length) * 5*creatureHud.getScale() + 1*creatureHud.getScale(), creatureHud.getY()+i*11*creatureHud.getScale() + 9*creatureHud.getScale());
      Renderer.scale(creatureHud.getScale());
      Renderer.drawStringWithShadow(sc.count, 0, 0);
      Renderer.finishDraw();
      Renderer.translate(creatureHud.getX()+xI*16*creatureHud.getScale(), creatureHud.getY()+i*11*creatureHud.getScale());
      Renderer.scale(creatureHud.getScale()/2);
      Renderer.drawStringWithShadow("&c&l" + getTimeLeft(5*60-(Date.now() - sc.spawned)/1000), 0, 0);
      Tessellator.enableDepth();
      Renderer.finishDraw();
      xI++;
    }
    if (playerData.stackedCreatures.length > 0) i += 1.6;
  }
}).unregister()
