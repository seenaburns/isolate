const electron = require('electron')

module.exports = {
  link: link,
  externalLink: externalLink,
  externalLinkToLocation: externalLinkToLocation,
}

function link(url, html) {
  let a = document.createElement('a')
  a.href = url
  a.innerHTML = html
  return a
}

function externalLink(url, html) {
  let a = link(url, html)
  a.onclick = e => {
    e.preventDefault();
    electron.shell.openExternal(e.target.href);
  }
  return a
}

function externalLinkToLocation(src, html) {
  let a = link(src, html)
  a.onclick = e => {
    e.preventDefault();
    result = electron.shell.showItemInFolder(src);
  }
  return a
}
