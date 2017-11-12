const fs = require('fs')
const path = require('./path')
const util = require('./util')

module.exports = {
  loadDB: loadDB,
  searchDB: searchDB,
  convertToFiles: convertToFiles,
  itemForPath: itemForPath,
}

/*
 * Item Item
 *  path: string
 *  description: string
 *  source: string
 *  tags: Array<string>
 */
function item(path="", source="", description="", tags=[]) {
  return {
    'path': path,
    'source': source,
    'description': description,
    'tags': tags,
  }
}

let emptyItem = item()

// Combine item assuming b more specific than a
function combineItem(a,b) {
  return item(
    b.path,
    b.source,
    [a.description, b.description].filter(x => x != '').join(' | '),
    a.tags.concat(b.tags)
  )
}

// Loads to list of item
function loadDBFromFile(filepath, successCallback) {
  if (!path.isFile(filepath)) {
    util.error("Path is not a file: " + filepath)
  }

  fs.readFile(filepath, 'utf8', function (err,data) {
    if (err) {
      util.error(err)
    }

    // Attempt to parse into json
    // Use item constructor to handle cases of undefined fields)
    let json_data = []
    try {
      json_data = JSON.parse(data)
      json_data = json_data.map(i => item(i.path, i.source, i.description, i.tags))
    } catch(e) {
      util.error(e + '\nin ' + filepath)
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

// Total information for db searching functionality
function db(items, idToFilePathMapping, allFilePaths) {
  return {
    'items': items,                        // list of items
    'idToFilePaths': idToFilePathMapping, // id (item path) -> filepath
    'files': allFilePaths,                // list of all full paths
  }
}

// Construct db from json at dbFilePath, all files from rootDir, and store to owner
function loadDB(dbFilePath, rootDir, owner) {
  loadDBFromFile(dbfile, dbdata => {
    let files = path.directoryWalk(rootDir, 5)
    let mapping = idToPathMapping(files, dbdata.map(item => item.path))
    owner.db = db(dbdata, mapping, files)
  })
}

//
// Search
//
function searchExactTag(db, tag) {
  return db.items.filter(item => item.tags.some(x => x == tag))
}

function searchDB(db, term) {
  return db.items.filter(item => {
    return item.path.includes(term) ||
      item.source.includes(term) ||
      item.description.includes(term) ||
      item.tags.some(t => t.includes(term))
  })
}

// Returns array of files for a given path
function filePathToImages(files, path) {
  if (path.endsWith('/')) {
    return files.filter(x => x.includes(path) && !x.endsWith('/'))
  } else {
    return [path]
  }
}

// Foreach item, convert path into a full path
// If it is a directory, expand to list of files
// Then dedupe
function convertToFiles(db, items) {
  return items
    .map(md => db.idToFilePaths.get(md.path))
    .filter(x => x != undefined)
    .map(x => filePathToImages(db.files, x))
    .reduce((a,b) => a.concat(b))
    .filter((x, index, arr) => {
      // dedupe by taking first index
      return arr.indexOf(x) === index
    })
}

// Return combined file and folder item that applies to a given path
// TODO: use nodejs path.sep
function itemForPath(db, path) {
  parts = path.split('/').filter(x => x != '')

  // want to get item for each of [dir/, dir/dir2/, ... file.ext]
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
    .map(x => db.items.filter(item => item.path == x))
    .reduce((a,b) => a.concat(b))
    .reduce(combineItem, emptyItem)
}

function runFromCommandLine() {
  if (process.argv.length < 5) {
    console.log("Usage: node lib/db.js <path/to/root> <path/to/db.json> <search>...")
    util.error("Not enough args: " + process.argv)
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
