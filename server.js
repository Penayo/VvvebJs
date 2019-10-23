var express = require('express')
var path = require('path')
var bodyParser = require('body-parser')
var fs = require('fs')
var Inflector = require('inflected')
var multer = require('multer')
// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(req.params)
    if (file.mimetype.split('/')[0] === 'image') {
      if (!fs.existsSync(__dirname + '/pages/' + req.params.page + '/img')) {
        fs.mkdirSync(__dirname + '/pages/' + req.params.page + '/img')
      }
      cb(null, 'pages/' + req.params.page + '/img')
    } else {
        cb(null, 'pages/public')
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload_middleware = multer({ storage: storage })


const MAX_FILE_LIMIT = 1024 * 1024 * 2 // 2 MB

var app = express();
// app.set('view engine', 'vash');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.use(express.static('public'))
app.use('/pages', express.static('pages'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/editor.html'))
  // res.send('Hello World!');
});

function sanitizeFileName(fileName) {
	//sanitize, remove double dot .. and remove get parameters if any
	fileName = '/' + ((fileName.replace('@[^\/\\a-zA-Z0-9\-\._]@', '', )).replace('@\.{2,}@' , '')).replace('@\?.*$@' , '');
	return fileName ;
}

app.post('/saveChanges', function (req, res) {
  let html = "", startTemplateUrl

  if (req.body.startTemplateUrl) {
    startTemplateUrl = __dirname + sanitizeFileName(req.body.startTemplateUrl)
    // html = file_get_contents(startTemplateUrl)
    html = fs.readFileSync(startTemplateUrl).toString()
  } else if (req.body.html) {
    html = req.body.html.substring(0, MAX_FILE_LIMIT)
  }
  console.log('Wtf', )
  fileName = __dirname + sanitizeFileName(req.body.fileName)

  fs.writeFile(fileName, html, 'utf8', function (err) {
    if (err) {
      console.log(err)
      return res.status(500).send(err)
    }

    res.status(200).send('Saved')
  })

})

app.get('/get_pages', function (req, res) {

  function walkSync(dir, filelist, page) {
    var files = fs.readdirSync(dir)
    filelist = filelist || []
  
    files.forEach(function(file) {
      if (fs.statSync(dir + file).isDirectory()) {
        let url = 'pages/' + file
        let page = {
          name: Inflector.underscore(file),
          title: Inflector.titleize(Inflector.camelize(Inflector.underscore(file))),
          baseUrl: url,
          url: url, assets: []
        }

        filelist = walkSync(dir + file + '/', filelist, page)
      }

      else {
        let name = file.split('.')[0]
        let type = file.split('.')[1]

        if (type === 'html') {
          page.url = page.url + '/' + file
          filelist.push(page)
        } else {
          page.assets.push(page.baseUrl + '/' + file)
        }
      }
    })
  
    return filelist
  }

  let files = walkSync(__dirname + '/pages/')

  res.status(200).send(files)
})

app.post('/upload/:page', upload_middleware.single('file'), function (req, res) {
  const file = req.file

  if (!file) {
    const error = new Error('Please upload a file')
    error.httpStatusCode = 400
    return res.status(500).send(error)
  }
  console.log(file)
  console.log(file.path.replace('pages\\' + req.params.page + '\\', ''))
  res.send(file.path.replace('pages\\' + req.params.page + '\\', ''))

  /* res
    .status(200)
    .send('File uploaded successfully!') */

})

app.post('/new_page', (req, res) => {
  let pageRef = req.body,  fileDir, shortName, dir

  let html = fs.readFileSync(__dirname + '/new-page-blank-template.html').toString()
  let dirName = pageRef.fileName.split('.')[0]

  fileDir = __dirname + '/pages' + sanitizeFileName(dirName)
  shortName = 'pages/' + dirName + '/index.html'
  fs.mkdirSync(fileDir)

  fs.writeFile(__dirname + '/' + shortName, html, (err) => {
    if (err) {
      console.log(err)
      return res.status(500).send(err)
    }
    res.status(200).send({ url: shortName })
  })
})

app.listen(3003, function () {
  console.log('Example app listening on port 3003!');
})