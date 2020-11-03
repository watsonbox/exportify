//casper.options.clientScripts = ['test/support/jquery.mockjax.js'];

var lastRequestedURL;
casper.on('navigation.requested', function(url, navigationType, navigationLocked, isMainFrame) {
  lastRequestedURL = url;
});

// casper.options.onResourceReceived = function(C, response) {
//     this.echo(JSON.stringify(response.headers));
// };

// casper.options.onResourceRequested = function(C, request) {
//   this.echo(JSON.stringify(request.url));
//   this.echo(JSON.stringify(request.headers));
// };

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
      "https://accounts.spotify.com/login?continue=" +
        encodeURIComponent(
          "https://accounts.spotify.com/authorize?" +
          "scope=playlist-read-private+playlist-read-collaborative&" +
          "response_type=token&" +
          "redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fexportify.html&" +
          "client_id=9950ac751e34487dbbe027c4fd7f8e99"
        ),
      "https://accounts.spotify.com/login?" +
      "Redirected to Spotify authentication page"
    );
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Testing initial authentication redirect with different client id", 2, function(test) {
  casper.start('http://localhost:8080/exportify.html?app_client_id=123456');

  casper.waitUntilVisible('#loginButton', function() {
    test.assertTitle("Exportify", "Exportify main page is loaded");
    this.click('#loginButton');
  })

  casper.then(function() {
    test.assertEquals(
      lastRequestedURL,
      "https://accounts.spotify.com/login?continue=" +
        encodeURIComponent(
          "https://accounts.spotify.com/authorize?" +
          "scope=playlist-read-private+playlist-read-collaborative&" +
          "response_type=token&" +
          "redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fexportify.html&" +
          "client_id=123456"
        ),
      "Redirected to Spotify authentication page"
    );
  });

  casper.run(function() {
    test.done();
  });
});

casper.test.begin("Testing loading and displaying playlists", 10, function(test) {
  casper.viewport(1000, 1000);

  casper.start('http://localhost:8080/exportify.html#access_token=TOKEN', function() {
    this.evaluate(function() {
      $.mockjax({
        url: "https://api.spotify.com/v1/me",
        contentType: 'text/json',
        proxy: 'test/assets/mocks/watsonbox.json'
      });

      $.mockjax({
        url: "https://api.spotify.com/v1/users/watsonbox/playlists",
        contentType: 'text/json',
        proxy: 'test/assets/mocks/watsonbox_playlists.json'
      });
    });
  });

  casper.waitUntilVisible('#playlists', function() {
    // Ghostpoet
    test.assertSelectorHasText('#playlists table tbody tr:nth-child(1) td:nth-child(2)', 'Ghostpoet – Peanut Butter Blues and Melancholy Jam');
    test.assertSelectorHasText('#playlists table tbody tr:nth-child(1) td:nth-child(3)', 'watsonbox');
    test.assertSelectorHasText('#playlists table tbody tr:nth-child(1) td:nth-child(4)', '10');
    test.assertExists('#playlists table tbody tr:nth-child(1) td:nth-child(5) i.fa-times-circle-o');
    test.assertExists('#playlists table tbody tr:nth-child(1) td:nth-child(6) i.fa-times-circle-o');

    // Lazy Afternoon
    test.assertSelectorHasText('#playlists table tbody tr:nth-child(2) td:nth-child(2)', 'Lazy Afternoon Phranakorn Nornlen');
    test.assertSelectorHasText('#playlists table tbody tr:nth-child(2) td:nth-child(3)', 'watsonbox');
    test.assertSelectorHasText('#playlists table tbody tr:nth-child(2) td:nth-child(4)', '12');
    test.assertExists('#playlists table tbody tr:nth-child(2) td:nth-child(5) i.fa-times-circle-o');
    test.assertExists('#playlists table tbody tr:nth-child(2) td:nth-child(6) i.fa-times-circle-o');
  });

  casper.wait(1000, function() {
    this.captureSelector('exportify.png', 'body');
  });

  casper.run(function() {
    test.done();
  });
});
