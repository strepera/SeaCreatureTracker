import { @Vigilant, @TextProperty, @ColorProperty, @ButtonProperty, @SwitchProperty, Color } from 'Vigilance';
@Vigilant("SeaCreatureTracker")
class Settings {

  @TextProperty({
    name: "Fishing Wisdom",
    description: "Put in your fishing wisdom to get accurate xp prediction",
    category: "Fishing",
    placeholder: "0"
  })
  fishingWisdom = "";

  @SwitchProperty({
    name: "Sea Creature Tracker",
    description: "Tracks the sea creatures of you and the people around you &c(Does not work with skytils hide fishing hooks)",
    category: "Fishing"
  })
  seaCreatureTracker = true;

  @SwitchProperty({
    name: "Only Show your Creatures",
    description: "Doesn't show the current creatures and xp of other players nearby (requires sea creature tracker to be on)",
    category: "Fishing"
  })
  onlyShowYourCreatures = false;

  @ButtonProperty({
    name: "Edit HUD", 
    description: "Click to edit hud position and size",
    category: "Edit HUD"
  })
  openHUDEdit() {
    ChatLib.command("seacreaturetrackerhud", true);
  }

  // @ButtonProperty({
  //   name: "Open Stats GUI", 
  //   description: "Shows who you have fished with, and what you fished up",
  //   category: "Stats"
  // })
  // openStats() {
  //   ChatLib.command("sctstats", true);
  // }

  constructor() {
    this.initialize(this);
  }
}

export let settings = new Settings();

register("command", () => {
  settings.openGUI();
}).setName("sctracker").setAliases(["sct", "seacreaturetracker"])