const fs = require('fs')

module.exports = {
  isDir: isDir,
  isFile: isFile,
  join: join,
  removeDuplicateSlash: removeDuplicateSlash,
  removeLeadingSlash: removeLeadingSlash,
  up: up
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
  return parts.slice(0,parts.length-1).join('')
}

function isDir(path) {
  return fs.lstatSync(path).isDirectory()
}

function isFile(path) {
  return fs.lstatSync(path).isFile()
}

