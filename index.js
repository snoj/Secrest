var restify = require('restify');
var ev = require('email-validation');
var app = restify.createServer();
var profiles = require("./profiles");
var maildir_conf = require('./maildir.json');
var _ = require('lodash');
var mailcomposer = require('mailcomposer');
var fs = require('fs');
var os = require('os');
var maildirTpl = _.template(maildir_conf.basedir);

app.use(restify.bodyParser());
app.get("/profile/:email", function(req, res) {
  var parsedAddr = ev.parse(req.params.email);
  var rProfile = _.first(_.filter([profiles[req.params.email], profiles[parsedAddr.domain]], _.isObject));
  if(rProfile)
    res.send(rProfile);
  else
    res.send(404, {});
});
app.post('/store/:mailboxid', function(req, res) {
  var mail = mailcomposer({
    from: req.body.mail_from,
    to: req.body.rcpt_to,
    subject: "Encrypted Message",
    attachments: [{
      filename: "email.eml.gpg",
      content: req.body.message.data,
      contentType: "application/pgp-encrypted"
    }],
    text: "A message from the NSA."
  });

  mail.build(function(err, message) {
    var messageid = [Date.now(), Math.random(), os.uptime()].join("");
    var tmpfp = maildirTpl(req.body) + "/tmp/" + messageid;
    var newfp = maildirTpl(req.body) + "/new/" + messageid;

    fs.writeFile(tmpfp, message, {encoding: 'utf8'}, function(err) {
      if(!!err)
        console.log(err);
      if(!!!err)
        fs.rename(tmpfp, newfp, function() {});
    });
  });
  res.send({});
});

app.listen(8085,'127.0.0.1');
