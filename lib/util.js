const electron = require('electron')

module.exports = {
  link: link,
  externalLink: externalLink,
  setHTML: setHTML,
  error: error
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

function setHTML(node, element) {
  node.innerHTML = ''
  node.appendChild(element)
}

function error(e) {
  console.error('\x1b[31m%s\x1b[0m', e)
  process.exit(1)
}
