var express = require('express')
var path = require('path')
var bodyParser = require('body-parser')
var fs = require('fs')
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
	fileName = __dirname + '/' + ((fileName.replace('@[^\/\\a-zA-Z0-9\-\._]@', '', )).replace('@\.{2,}@' , '')).replace('@\?.*$@' , '');
	return fileName ;
}

app.post('/saveChanges', function (req, res) {
  let html = "", startTemplateUrl

  if (req.body.startTemplateUrl) {
    startTemplateUrl = sanitizeFileName(req.body.startTemplateUrl)
    // html = file_get_contents(startTemplateUrl)
    html = fs.readFileSync(startTemplateUrl).toString()
  } else if (req.body.html) {
    html = req.body.html.substring(0, MAX_FILE_LIMIT)
  }
  console.log('Wtf', )
  fileName = sanitizeFileName(req.body.fileName)

  fs.writeFile(fileName, html, 'utf8', function (err) {
    if (err) {
      console.log(err)
      return res.status(500).send(err)
    }

    res.status(200).send('Saved')
  })

})

app.post('/new_pages', (req, res) => {
  let pageRef = req.body,  fileDir, shortName

  let html = fs.readFileSync('new-page-blank-template.html').toString()
  fileDir = __dirname + 'pages/' + sanitizeFileName(pageRef.fileName)
  shorrName = 'pages/' + sanitizeFileName(pageRef.fileName)

  fs.writeFile(fileDir, html, (err) => {
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