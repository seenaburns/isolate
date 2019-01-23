import userData from "./userData";
import scrollbar from "./scrollbar";
import menu from "./menu";

export default {
  set: set,
  toggle: toggle
};

function toggle(): void {
  set(!nightmodeEnabled());
}

function set(enabled: boolean): void {
  if (enabled) {
    document.querySelector("body").classList.add("nightmode");
  } else {
    document.querySelector("body").classList.remove("nightmode");
  }

  scrollbar.setNightmode(enabled);
  menu.Options.NightMode = enabled;
  menu.UpdateMenu();

  userData.SetKey("night_mode", enabled, "settings.json");
}

function nightmodeEnabled(): boolean {
  return document.querySelector("body").classList.contains("nightmode");
}
