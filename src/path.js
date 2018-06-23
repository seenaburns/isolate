module.exports = {
  join: join,
  removeLeadingSlash: removeLeadingSlash,
  toWindowsPath: toWindowsPath,
}

function join(a,b) {
  return removeDuplicateSlash(a + '/' + b)
}

function removeLeadingSlash(path) {
  if (path.length > 0 && path[0] == '/') {
    return path.slice(1,path.length)
  } else {
    return path
  }
}

// Hacky function to convert unix paths to windows paths
// img elements in the ui still work with unix paths on windows, but
// - showItemInFolder and copy both need the leading slash removed
// - showItemInFolder will not highlight the item in the folder if there are forward slashes in the
//   path
//
// Translates /C:/path/like/this.png -> C:\path\like\this.png
function toWindowsPath(path) {
    if (path.length > 0 && path[0] == '/') {
      path = path.substr(1)
    }
    return path.replace(/\//g, '\\')
}
