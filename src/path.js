const fs = require('fs')

module.exports = {
  directoryWalk: directoryWalk,
  isDir: isDir,
  isFile: isFile,
  join: join,
  removeDuplicateSlash: removeDuplicateSlash,
  removeLeadingSlash: removeLeadingSlash,
  up: up,
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

function removeDuplicateSlash(path) {
  return path.replace('//', '/')
}

function up(path) {
  let parts = path.split('/')
  return parts.slice(0,parts.length-1).join('/')
}

function directoryWalk(path, remainingDepth) {
  if (remainingDepth <= 0) {
    return []
  }

  let contents = fs.readdirSync(path).map(f => join(path,f))
  let files = []
  contents.forEach(f => {
    if (isDir(f)) {
      files.push(f + '/')
      files = files.concat(directoryWalk(f, remainingDepth-1))
    } else {
      files.push(f)
    }
  })
  return files
}

function isDir(path) {
  return fs.lstatSync(path).isDirectory()
}

function isFile(path) {
  return fs.lstatSync(path).isFile()
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
