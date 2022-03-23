const
  express = require('express'),
  serveStatic = require('serve-static'),
  port = process.env.PORT || 7000

const app = express()

app.use(serveStatic(__dirname + '/dist/spa'))
app.listen(port)