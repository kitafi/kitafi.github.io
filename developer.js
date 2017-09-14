let express = require('express')

app = express()

app.use('/assets', express.static('developer/assets'))

app.get('/vocabulary', function(req, res) {
    res.send('show vocab')
})

app.get('/word/:word', function(req, res) {
    let word = req.params.word

    res.send('show ' + word)
})

app.listen(4000)
