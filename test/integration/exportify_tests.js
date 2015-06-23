var lastRequestedURL;
casper.on('navigation.requested', function(url, navigationType, navigationLocked, isMainFrame) {
  lastRequestedURL = url;
});

casper.on('page.initialized', function(page) {
  this.page.injectJs('test/support/casper_helpers.js');
});

casper.on('remote.message', function(message) {
  this.echo('Remote message: ' + message);
});

// Log errors
casper.on("page.error", function(msg, trace) {
  this.echo("Error:    " + msg, "ERROR");
  this.echo("file:     " + trace[0].file, "WARNING");
  this.echo("line:     " + trace[0].line, "WARNING");
  this.echo("function: " + trace[0]["function"], "WARNING");
});

casper.test.begin("Testing initial authentication redirect", 2, function(test) {
  casper.start('http://localhost:8080/exportify.html');

  casper.waitUntilVisible('#loginButton', function() {
    test.assertTitle("Exportify", "Exportify main page is loaded");
    this.click('#loginButton');
  })

  casper.then(function() {
    test.assertEquals(
      lastRequestedURL,
      "https://accounts.spotify.com/authorize?" +
        "client_id=9950ac751e34487dbbe027c4fd7f8e99&" +
        "redirect_uri=https:%2F%2Frawgit.com%2Fwatsonbox%2Fexportify%2Fmaster%2Fexportify.html&" +
        "scope=playlist-read-private playlist-read-collaborative&" +
        "response_type=token",
      "Redirected to Spotify authentication page"
    );
  });

  casper.run(function() {
    test.done();
  });
});
