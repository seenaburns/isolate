// Scrollbar
// Windows scrollbar is very visually intrusive, so this creates an OSX-like scrollbar on windows
//
// This module will inject css into the style blocks in <head>
// This is because of a few properties I've found
// - body { ::-webkit-scrollbar {} } does not work, so the body, body.nightmode trick is not possible
// - you cannot have two ::-webkit-scrollbar-thumb blocks, only one will be used. This means you
//   cannot have most in css, and only define the color separately
// - this should only be used for windows, and in css I would need a body.windows like
//   body.nightmode to include based on a class set by js
//
// CSS:
// Giving padding and rounding is tricky, and handled by having an invisible border on
// scrollbar-thumb. However, adding the border means scrollbar.width and
// scrollbar-thumb.border-radius have to be increased to compensate

module.exports = {
  Init: Init,
  SetNightmode: SetNightmode,
}

// Init unchanging scrollbar style, then invoke SetNightmode
function Init(nightmode) {
  document.querySelector('head #scrollbar-style').innerHTML = `
    ::-webkit-scrollbar {
      background: none;
      width: 14px;
      height: 14px;
    }
    ::-webkit-scrollbar-corner {
      display: none;
    }
    ::-webkit-scrollbar-track {
      background: none;
    }
  `
  SetNightmode(nightmode)
}

// Set just -webkit-scrollbar-thumb with the color based on nightmode
// Because only one -webkit-scrollbar-thumb will be used, have to redefine in its entirety
function SetNightmode(nightmode) {
  color = '#ccc'
  if (nightmode) {
    color = '#fff'
  }

  document.querySelector('head #scrollbar-color-style').innerHTML = `
    ::-webkit-scrollbar-thumb {
      background: ${color};
      border: 4px solid rgba(0,0,0,0);
      background-clip: padding-box;
      border-radius: 8px;
    }
  `
}
