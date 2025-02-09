const addButton = (gui, x, y, color, text, hoverfn, clickfn) => {
  const sX = x/Renderer.screen.getWidth();
  const sY = y/Renderer.screen.getHeight();
  const width = Renderer.getStringWidth(text);
  gui.registerDraw((mx, my) => {
    const rx = sX*Renderer.screen.getWidth();
    const ry = sY*Renderer.screen.getHeight();
    if (mx > rx-width/2-2 && mx < rx-width/2+width+2 && my > ry && my < ry+12) {
      Renderer.drawRect(Renderer.GRAY, rx-width/2-2, ry-2, width+4, 14);
      hoverfn();
    }
    else {
      Renderer.drawRect(color, rx-width/2-2, ry-2, width+4, 14);
    }
    Renderer.drawStringWithShadow(text, rx-width/2, ry);
  })
  gui.registerClicked((mx, my) => {
    const rx = sX*Renderer.screen.getWidth();
    const ry = sY*Renderer.screen.getHeight();
    if (mx > rx-2 && mx < rx+width+2 && my > ry && my < ry+12) {
      clickfn();
    }
  })
}

import PogObject from '../PogData';
export const permanentData = new PogObject("SeaCreatureTracker", {
  caughtCreatures: [],
  playedWith: {}
}, "playerData.json")
permanentData.autosave();

const mainGui = new Gui();
const scGui = new Gui();
let playerGui = new Gui();

addButton(mainGui, Renderer.screen.getWidth()/2, Renderer.screen.getHeight()/2-15, Renderer.GOLD, "Sea Creatures", () => {}, () => {scGui.open()});
addButton(mainGui, Renderer.screen.getWidth()/2, Renderer.screen.getHeight()/2, Renderer.RED, "Players Fished With", () => {}, () => {setupPlayerGui()});

let selectedDay;
let selectedHour;
const setupPlayerGui = () => {
  playerGui = new Gui();
  let days = Object.entries(permanentData.playedWith);
  for (let i = 0; i < days.length; i++) {
    addButton(playerGui, i*32, 0, Renderer.BLACK, new Date(days[i][0]*24*60*60*1000).getDate(), () => {}, () => {selectedDay = Object.entries(days[i][1])});
    let hours = Object.entries(days[i][1]);
    for (let i2 = 0; i2 < hours.length; i2++) {
      let data = hours[i2];
      addButton(playerGui, i2*32, 24, Renderer.BLACK, new Date(hours[i2][0]*60*60*1000).getHours(), () => {}, () => {selectedHour = Object.entries(data[1].players)});
    }
  }
  playerGui.open();
}
playerGui.registerDraw(() => {
  Renderer.drawRect(Renderer.color(0, 0, 0, 150), 0, 0, Renderer.screen.getWidth(), Renderer.screen.getHeight());
  if (!selectedHour) return;
  let i = 0;
  for (let arr of selectedHour) {
    Renderer.drawStringWithShadow(arr[0] + " (" + arr[1].creatures.length + ")", 0, 24+i*12);
    i++;
  }
})

register("command", () => {
  mainGui.open();
}).setName("sctstats")