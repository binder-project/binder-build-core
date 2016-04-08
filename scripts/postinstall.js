var fs = require('fs')
var path = require('path')

var fileName = 'core.conf'

var binderDir = path.join(process.env['HOME'], '.binder')
var src = path.join(__dirname, '../conf/main.json')
var dst = path.join(binderDir, fileName)

fs.exists(binderDir, function (exists) {
  if (!exists) {
    fs.mkdirSync(binderDir)
  }
  fs.createReadStream(src).pipe(fs.createWriteStream(dst))
})
