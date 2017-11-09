const fs = require('fs')
const path = require('./path')

module.exports = {
  filePathToImages: filePathToImages,
  idToPathMapping: idToPathMapping,
  loadDBFromFile: loadDBFromFile,
  metadataForPath: metadataForPath,
  searchDb: searchDb,
  searchExactTag: searchExactTag
}

function error(e) {
  console.error('\x1b[31m%s\x1b[0m', e)
  process.exit(1)
}

function loadDBFromFile(filepath, successCallback) {
  if (!path.isFile(filepath)) {
    error("Path is not a file: " + filepath)
  }

  fs.readFile(filepath, 'utf8', function (err,data) {
    if (err) {
      error(err)
    }

    try {
      json_data = JSON.parse(data)
    } catch(e) {
      error(e + '\nin ' + filepath)
    }
    successCallback(json_data)
  });
}

/*
 * Search needs some mapping from db object (some id) to file path
 * In the future this may be stored on disk or in a db
 * For now take a root path, do a directory walk and return (id, path) if f returns an id for some
 * path along the directory walk
 */
function idToPathMapping(files, ids) {
  return new Map(files
    .map(f => {
      let match = ids.find(id => f.endsWith(id))
      if (match != undefined)
        return [match, f]
      else
        return undefined
    })
    .filter(x => x != undefined))
}

function searchExactTag(db, tag) {
  return db.filter(item => item.tags.some(x => x == tag))
}

function searchDb(db, term) {
  return db.filter(item => {
    return item.path.includes(term) ||
      item.source.includes(term) ||
      item.description.includes(term) ||
      item.tags.some(t => t.includes(term))
  })
}

function filePathToImages(files, path) {
  if (path.endsWith('/')) {
    return files.filter(x => x.includes(path) && !x.endsWith('/'))
  } else {
    return path
  }
}

let emptyMetadata = {
    'path': '',
    'source': '',
    'description': '',
    'tags': []
}

// Combine metadata assuming b more specific than a
function combineMetadata(a,b) {
  return {
    'path': b.path,
    'source': b.source,
    'description': a.description + ' | ' + b.description,
    'tags': a.tags.concat(b.tags)
  }
}

// Return combined file and folder metadata that applies to a given path
// TODO: use nodejs path.sep
function metadataForPath(db, path) {
  parts = path.split('/').filter(x => x != '')

  // want to get metadata for each of [dir/, dir/dir2/, ... file.ext]
  // map parts to match this format
  // last item is a file
  path_prefixes = parts.map((x, index, arr) => {
    if (index == 0) {
      return x + '/'
    } else if (index != arr.length - 1) {
      return arr.slice(0,index).join('/') + '/' + x + '/'
    } else {
      return x
    }
  })

  return path_prefixes
    .map(x => db.filter(item => item.path == x))
    .reduce((a,b) => a.concat(b))
    .reduce(combineMetadata, emptyMetadata)
}

function runFromCommandLine() {
  if (process.argv.length < 5) {
    console.log("Usage: node lib/db.js <path/to/root> <path/to/db.json> <search>...")
    error("Not enough args: " + process.argv)
  }

  root_dir = process.argv[2]
  dbfile = process.argv[3]
  search = process.argv[4]

  loadDBFromFile(dbfile, x => {
    let files = path.directoryWalk(root_dir, 5)
    let db_to_path_mapping = idToPathMapping(files, x.map(item => item.path))
    console.log(
      searchDb(x, search)
        .map(x => db_to_path_mapping.get(x.path))
        .filter(x => x != undefined)
        .map(x => filePathToImages(files, x))
    )
  })
}

// runFromCommandLine()
