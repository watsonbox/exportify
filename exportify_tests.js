var lastRequestedURL;
casper.on('navigation.requested', function(url, navigationType, navigationLocked, isMainFrame) {
  lastRequestedURL = url;
});

casper.on('remote.message', function(message) {
  this.echo('Remote message: ' + message);
});

casper.on("page.error", function (msg, trace) {
  this.echo("Page error: " + msg + " - " + trace);
});

casper.start();

casper.open('http://localhost:8080/exportify.html');

casper.waitUntilVisible('#loginButton', function() {
  this.test.assertTitle("Exportify", "Exportify main page is loaded");
  this.click('#loginButton');
})

casper.wait(500, function() {
  this.test.assertEquals(
    lastRequestedURL,
    "https://accounts.spotify.com/authorize?" +
      "client_id=9950ac751e34487dbbe027c4fd7f8e99&" +
      "redirect_uri=https://rawgit.com/watsonbox/exportify/master/exportify.html&" +
      "scope=playlist-read-private playlist-read-collaborative&" +
      "response_type=token"
  );
});

casper.run(function() {
  this.test.done();
});
