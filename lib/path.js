const fs = require('fs')

module.exports = {
  directoryWalk: directoryWalk,
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

