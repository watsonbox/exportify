import { rest } from 'msw'

export const handlerCalled = jest.fn()

export const handlers = [
  rest.options('https://api.spotify.com/v1/me', (req, res, ctx) => {
    return res(ctx.text('body'))
  }),

  rest.get('https://api.spotify.com/v1/me', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "display_name" : "watsonbox",
        "external_urls" : {
          "spotify" : "https://open.spotify.com/user/watsonbox"
        },
        "followers" : {
          "href" : null,
          "total" : 6
        },
        "href" : "https://api.spotify.com/v1/users/watsonbox",
        "id" : "watsonbox",
        "images" : [ ],
        "type" : "user",
        "uri" : "spotify:user:watsonbox"
      }
    ))
  }),

  rest.get('https://api.spotify.com/v1/users/watsonbox/tracks', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "href" : "https://api.spotify.com/v1/me/tracks?offset=0&limit=20",
        "items" : [ {
          "added_at" : "2020-07-19T09:24:39Z",
          "track" : {
            "album" : {
              "album_type" : "album",
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "JP", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "ME", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RS", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "US", "UY", "VN", "XK", "ZA" ],
              "external_urls" : {
                "spotify" : "https://open.spotify.com/album/4iwv7b8gDPKztLkKCbWyhi"
              },
              "href" : "https://api.spotify.com/v1/albums/4iwv7b8gDPKztLkKCbWyhi",
              "id" : "4iwv7b8gDPKztLkKCbWyhi",
              "images" : [ {
                "height" : 640,
                "url" : "https://i.scdn.co/image/ab67616d0000b273f485821b346237acbbca07ea",
                "width" : 640
              }, {
                "height" : 300,
                "url" : "https://i.scdn.co/image/ab67616d00001e02f485821b346237acbbca07ea",
                "width" : 300
              }, {
                "height" : 64,
                "url" : "https://i.scdn.co/image/ab67616d00004851f485821b346237acbbca07ea",
                "width" : 64
              } ],
              "name" : "Best of Six By Seven",
              "release_date" : "2017-02-17",
              "release_date_precision" : "day",
              "total_tracks" : 14,
              "type" : "album",
              "uri" : "spotify:album:4iwv7b8gDPKztLkKCbWyhi"
            },
            "artists" : [ {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
              },
              "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
              "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
              "name" : "Six by Seven",
              "type" : "artist",
              "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
            } ],
            "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "JP", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "ME", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RS", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "US", "UY", "VN", "XK", "ZA" ],
            "disc_number" : 1,
            "duration_ms" : 198093,
            "explicit" : false,
            "external_ids" : {
              "isrc" : "UK4UP1300002"
            },
            "external_urls" : {
              "spotify" : "https://open.spotify.com/track/1GrLfs4TEvAZ86HVzXHchS"
            },
            "href" : "https://api.spotify.com/v1/tracks/1GrLfs4TEvAZ86HVzXHchS",
            "id" : "1GrLfs4TEvAZ86HVzXHchS",
            "is_local" : false,
            "name" : "Crying",
            "popularity" : 2,
            "preview_url" : "https://p.scdn.co/mp3-preview/daf08df57a49c215c8c53dc5fe88dec5461f15c9?cid=9950ac751e34487dbbe027c4fd7f8e99",
            "track_number" : 3,
            "type" : "track",
            "uri" : "spotify:track:1GrLfs4TEvAZ86HVzXHchS"
          }
        } ],
        "limit" : 20,
        "next" : null,
        "offset" : 0,
        "previous" : null,
        "total" : 1
      }
    ))
  }),

  // FIXME: Duplication of data
  rest.get('https://api.spotify.com/v1/me/tracks', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "href" : "https://api.spotify.com/v1/me/tracks?offset=0&limit=20",
        "items" : [ {
          "added_at" : "2020-07-19T09:24:39Z",
          "track" : {
            "album" : {
              "album_type" : "album",
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "JP", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "ME", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RS", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "US", "UY", "VN", "XK", "ZA" ],
              "external_urls" : {
                "spotify" : "https://open.spotify.com/album/4iwv7b8gDPKztLkKCbWyhi"
              },
              "href" : "https://api.spotify.com/v1/albums/4iwv7b8gDPKztLkKCbWyhi",
              "id" : "4iwv7b8gDPKztLkKCbWyhi",
              "images" : [ {
                "height" : 640,
                "url" : "https://i.scdn.co/image/ab67616d0000b273f485821b346237acbbca07ea",
                "width" : 640
              }, {
                "height" : 300,
                "url" : "https://i.scdn.co/image/ab67616d00001e02f485821b346237acbbca07ea",
                "width" : 300
              }, {
                "height" : 64,
                "url" : "https://i.scdn.co/image/ab67616d00004851f485821b346237acbbca07ea",
                "width" : 64
              } ],
              "name" : "Best of Six By Seven",
              "release_date" : "2017-02-17",
              "release_date_precision" : "day",
              "total_tracks" : 14,
              "type" : "album",
              "uri" : "spotify:album:4iwv7b8gDPKztLkKCbWyhi"
            },
            "artists" : [ {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
              },
              "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
              "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
              "name" : "Six by Seven",
              "type" : "artist",
              "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
            } ],
            "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "JP", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "ME", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RS", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "US", "UY", "VN", "XK", "ZA" ],
            "disc_number" : 1,
            "duration_ms" : 198093,
            "explicit" : false,
            "external_ids" : {
              "isrc" : "UK4UP1300002"
            },
            "external_urls" : {
              "spotify" : "https://open.spotify.com/track/1GrLfs4TEvAZ86HVzXHchS"
            },
            "href" : "https://api.spotify.com/v1/tracks/1GrLfs4TEvAZ86HVzXHchS",
            "id" : "1GrLfs4TEvAZ86HVzXHchS",
            "is_local" : false,
            "name" : "Crying",
            "popularity" : 2,
            "preview_url" : "https://p.scdn.co/mp3-preview/daf08df57a49c215c8c53dc5fe88dec5461f15c9?cid=9950ac751e34487dbbe027c4fd7f8e99",
            "track_number" : 3,
            "type" : "track",
            "uri" : "spotify:track:1GrLfs4TEvAZ86HVzXHchS"
          }
        } ],
        "limit" : 1,
        "next" : null,
        "offset" : 0,
        "previous" : null,
        "total" : 1
      }
    ))
  }),

  rest.get('https://api.spotify.com/v1/users/watsonbox/playlists', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "href" : "https://api.spotify.com/v1/users/watsonbox/playlists?offset=0&limit=20",
        "items" : [ {
          "collaborative" : false,
          "description" : "",
          "external_urls" : {
            "spotify" : "https://open.spotify.com/playlist/4XOGDpHMrVoH33uJEwHWU5"
          },
          "href" : "https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5",
          "id" : "4XOGDpHMrVoH33uJEwHWU5",
          "images" : [ {
            "height" : 640,
            "url" : "https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80",
            "width" : 640
          } ],
          "name" : "Ghostpoet – Peanut Butter Blues and Melancholy Jam",
          "owner" : {
            "display_name" : "watsonbox",
            "external_urls" : {
              "spotify" : "https://open.spotify.com/user/watsonbox"
            },
            "href" : "https://api.spotify.com/v1/users/watsonbox",
            "id" : "watsonbox",
            "type" : "user",
            "uri" : "spotify:user:watsonbox"
          },
          "primary_color" : null,
          "public" : false,
          "snapshot_id" : "MixjMzFkNjFhYzJkMDkzNmE3OGQ1N2YyYmQ0NTkxYTk5NjBhZmZkYzZi",
          "tracks" : {
            "href" : "https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks",
            "total" : 10
          },
          "type" : "playlist",
          "uri" : "spotify:playlist:4XOGDpHMrVoH33uJEwHWU5"
        } ],
        "limit" : 20,
        "next" : "https://api.spotify.com/v1/users/watsonbox/playlists?offset=20&limit=20",
        "offset" : 0,
        "previous" : null,
        "total" : 1
      }
    ))
  }),

  rest.get('https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "href" : "https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks?offset=0&limit=100",
        "items" : [ {
          "added_at" : "2020-11-03T15:19:04Z",
          "added_by" : {
            "external_urls" : {
              "spotify" : "https://open.spotify.com/user/watsonbox"
            },
            "href" : "https://api.spotify.com/v1/users/watsonbox",
            "id" : "watsonbox",
            "type" : "user",
            "uri" : "spotify:user:watsonbox"
          },
          "is_local" : false,
          "primary_color" : null,
          "track" : {
            "album" : {
              "album_type" : "album",
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/69lEbRQRe29JdyLrewNAvD"
                },
                "href" : "https://api.spotify.com/v1/artists/69lEbRQRe29JdyLrewNAvD",
                "id" : "69lEbRQRe29JdyLrewNAvD",
                "name" : "Ghostpoet",
                "type" : "artist",
                "uri" : "spotify:artist:69lEbRQRe29JdyLrewNAvD"
              } ],
              "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "UY", "VN", "ZA" ],
              "external_urls" : {
                "spotify" : "https://open.spotify.com/album/6jiLkuSnhzDvzsHJlweoGh"
              },
              "href" : "https://api.spotify.com/v1/albums/6jiLkuSnhzDvzsHJlweoGh",
              "id" : "6jiLkuSnhzDvzsHJlweoGh",
              "images" : [ {
                "height" : 640,
                "url" : "https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80",
                "width" : 640
              }, {
                "height" : 300,
                "url" : "https://i.scdn.co/image/ab67616d00001e02306e7640be17c5b3468e6e80",
                "width" : 300
              }, {
                "height" : 64,
                "url" : "https://i.scdn.co/image/ab67616d00004851306e7640be17c5b3468e6e80",
                "width" : 64
              } ],
              "name" : "Peanut Butter Blues and Melancholy Jam",
              "release_date" : "2011",
              "release_date_precision" : "year",
              "total_tracks" : 10,
              "type" : "album",
              "uri" : "spotify:album:6jiLkuSnhzDvzsHJlweoGh"
            },
            "artists" : [ {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/artist/69lEbRQRe29JdyLrewNAvD"
              },
              "href" : "https://api.spotify.com/v1/artists/69lEbRQRe29JdyLrewNAvD",
              "id" : "69lEbRQRe29JdyLrewNAvD",
              "name" : "Ghostpoet",
              "type" : "artist",
              "uri" : "spotify:artist:69lEbRQRe29JdyLrewNAvD"
            } ],
            "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "UY", "VN", "ZA" ],
            "disc_number" : 1,
            "duration_ms" : 241346,
            "episode" : false,
            "explicit" : false,
            "external_ids" : {
              "isrc" : "GBMEF1100339"
            },
            "external_urls" : {
              "spotify" : "https://open.spotify.com/track/7ATyvp3TmYBmGW7YuC8DJ3"
            },
            "href" : "https://api.spotify.com/v1/tracks/7ATyvp3TmYBmGW7YuC8DJ3",
            "id" : "7ATyvp3TmYBmGW7YuC8DJ3",
            "is_local" : false,
            "name" : "One Twos / Run Run Run",
            "popularity" : 22,
            "preview_url" : "https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99",
            "track" : true,
            "track_number" : 1,
            "type" : "track",
            "uri" : "spotify:track:7ATyvp3TmYBmGW7YuC8DJ3"
          },
          "video_thumbnail" : {
            "url" : null
          }
        }, {
          "added_at" : "2020-11-03T15:19:04Z",
          "added_by" : {
            "external_urls" : {
              "spotify" : "https://open.spotify.com/user/watsonbox"
            },
            "href" : "https://api.spotify.com/v1/users/watsonbox",
            "id" : "watsonbox",
            "type" : "user",
            "uri" : "spotify:user:watsonbox"
          },
          "is_local" : false,
          "primary_color" : null,
          "track" : {
            "album" : {
              "album_type" : "album",
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/69lEbRQRe29JdyLrewNAvD"
                },
                "href" : "https://api.spotify.com/v1/artists/69lEbRQRe29JdyLrewNAvD",
                "id" : "69lEbRQRe29JdyLrewNAvD",
                "name" : "Ghostpoet",
                "type" : "artist",
                "uri" : "spotify:artist:69lEbRQRe29JdyLrewNAvD"
              } ],
              "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "UY", "VN", "ZA" ],
              "external_urls" : {
                "spotify" : "https://open.spotify.com/album/6jiLkuSnhzDvzsHJlweoGh"
              },
              "href" : "https://api.spotify.com/v1/albums/6jiLkuSnhzDvzsHJlweoGh",
              "id" : "6jiLkuSnhzDvzsHJlweoGh",
              "images" : [ {
                "height" : 640,
                "url" : "https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80",
                "width" : 640
              }, {
                "height" : 300,
                "url" : "https://i.scdn.co/image/ab67616d00001e02306e7640be17c5b3468e6e80",
                "width" : 300
              }, {
                "height" : 64,
                "url" : "https://i.scdn.co/image/ab67616d00004851306e7640be17c5b3468e6e80",
                "width" : 64
              } ],
              "name" : "Peanut Butter Blues and Melancholy Jam",
              "release_date" : "2011",
              "release_date_precision" : "year",
              "total_tracks" : 10,
              "type" : "album",
              "uri" : "spotify:album:6jiLkuSnhzDvzsHJlweoGh"
            },
            "artists" : [ {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/artist/69lEbRQRe29JdyLrewNAvD"
              },
              "href" : "https://api.spotify.com/v1/artists/69lEbRQRe29JdyLrewNAvD",
              "id" : "69lEbRQRe29JdyLrewNAvD",
              "name" : "Ghostpoet",
              "type" : "artist",
              "uri" : "spotify:artist:69lEbRQRe29JdyLrewNAvD"
            } ],
            "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "UY", "VN", "ZA" ],
            "disc_number" : 1,
            "duration_ms" : 269346,
            "episode" : false,
            "explicit" : false,
            "external_ids" : {
              "isrc" : "GBMEF1000270"
            },
            "external_urls" : {
              "spotify" : "https://open.spotify.com/track/0FNanBLvmFEDyD75Whjj52"
            },
            "href" : "https://api.spotify.com/v1/tracks/0FNanBLvmFEDyD75Whjj52",
            "id" : "0FNanBLvmFEDyD75Whjj52",
            "is_local" : false,
            "name" : "Us Against Whatever Ever",
            "popularity" : 36,
            "preview_url" : "https://p.scdn.co/mp3-preview/e5e39be10697be8755532d02c52319ffa6d58688?cid=9950ac751e34487dbbe027c4fd7f8e99",
            "track" : true,
            "track_number" : 2,
            "type" : "track",
            "uri" : "spotify:track:0FNanBLvmFEDyD75Whjj52"
          },
          "video_thumbnail" : {
            "url" : null
          }
        } ],
        "limit" : 100,
        "next" : null,
        "offset" : 0,
        "previous" : null,
        "total" : 2
      }
    ))
  }),

  rest.get('https://api.spotify.com/v1/artists?ids=4TXdHyuAOl3rAOFmZ6MeKz', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "artists" : [ {
          "external_urls" : {
            "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
          },
          "followers" : {
            "href" : null,
            "total" : 2541
          },
          "genres" : [ "nottingham indie" ],
          "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
          "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
          "images" : [ {
            "height" : 640,
            "url" : "https://i.scdn.co/image/ab67616d0000b273244214fb6bf581d5c7595c6d",
            "width" : 640
          }, {
            "height" : 300,
            "url" : "https://i.scdn.co/image/ab67616d00001e02244214fb6bf581d5c7595c6d",
            "width" : 300
          }, {
            "height" : 64,
            "url" : "https://i.scdn.co/image/ab67616d00004851244214fb6bf581d5c7595c6d",
            "width" : 64
          } ],
          "name" : "Six by Seven",
          "popularity" : 17,
          "type" : "artist",
          "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
        } ]
      }
    ))
  }),

  rest.get('https://api.spotify.com/v1/audio-features?ids=1GrLfs4TEvAZ86HVzXHchS', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "audio_features" : [ {
          "danceability" : 0.416,
          "energy" : 0.971,
          "key" : 0,
          "loudness" : -5.550,
          "mode" : 1,
          "speechiness" : 0.0575,
          "acousticness" : 0.00104,
          "instrumentalness" : 0.0391,
          "liveness" : 0.440,
          "valence" : 0.190,
          "tempo" : 131.988,
          "type" : "audio_features",
          "id" : "1GrLfs4TEvAZ86HVzXHchS",
          "uri" : "spotify:track:1GrLfs4TEvAZ86HVzXHchS",
          "track_href" : "https://api.spotify.com/v1/tracks/1GrLfs4TEvAZ86HVzXHchS",
          "analysis_url" : "https://api.spotify.com/v1/audio-analysis/1GrLfs4TEvAZ86HVzXHchS",
          "duration_ms" : 198093,
          "time_signature" : 4
        } ]
      }
    ))
  }),

  rest.get('https://api.spotify.com/v1/albums?ids=4iwv7b8gDPKztLkKCbWyhi', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "albums" : [ {
          "album_type" : "compilation",
          "artists" : [ {
            "external_urls" : {
              "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
            },
            "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
            "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
            "name" : "Six by Seven",
            "type" : "artist",
            "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
          } ],
          "available_markets" : [ ],
          "copyrights" : [ {
            "text" : "2016 Beggars Banquet Records Ltd.",
            "type" : "C"
          }, {
            "text" : "2016 Beggars Banquet Records Ltd.",
            "type" : "P"
          } ],
          "external_ids" : {
            "upc" : "607618214234"
          },
          "external_urls" : {
            "spotify" : "https://open.spotify.com/album/4iwv7b8gDPKztLkKCbWyhi"
          },
          "genres" : [ "something", "something else" ],
          "href" : "https://api.spotify.com/v1/albums/4iwv7b8gDPKztLkKCbWyhi",
          "id" : "4iwv7b8gDPKztLkKCbWyhi",
          "images" : [ {
            "height" : 640,
            "url" : "https://i.scdn.co/image/ab67616d0000b273f485821b346237acbbca07ea",
            "width" : 640
          }, {
            "height" : 300,
            "url" : "https://i.scdn.co/image/ab67616d00001e02f485821b346237acbbca07ea",
            "width" : 300
          }, {
            "height" : 64,
            "url" : "https://i.scdn.co/image/ab67616d00004851f485821b346237acbbca07ea",
            "width" : 64
          } ],
          "label" : "Beggars Banquet",
          "name" : "Best of Six By Seven",
          "popularity" : 1,
          "release_date" : "2017-02-17",
          "release_date_precision" : "day",
          "total_tracks" : 14,
          "tracks" : {
            "href" : "https://api.spotify.com/v1/albums/4iwv7b8gDPKztLkKCbWyhi/tracks?offset=0&limit=50",
            "items" : [ {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 236080,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/1uWQvbywyUeR1uGdNlfsaZ"
              },
              "href" : "https://api.spotify.com/v1/tracks/1uWQvbywyUeR1uGdNlfsaZ",
              "id" : "1uWQvbywyUeR1uGdNlfsaZ",
              "is_local" : false,
              "name" : "I O U Love (Single Edit)",
              "preview_url" : null,
              "track_number" : 1,
              "type" : "track",
              "uri" : "spotify:track:1uWQvbywyUeR1uGdNlfsaZ"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 246533,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/4T03tsWWaVxbKikT7UUrFk"
              },
              "href" : "https://api.spotify.com/v1/tracks/4T03tsWWaVxbKikT7UUrFk",
              "id" : "4T03tsWWaVxbKikT7UUrFk",
              "is_local" : false,
              "name" : "Candlelight",
              "preview_url" : null,
              "track_number" : 2,
              "type" : "track",
              "uri" : "spotify:track:4T03tsWWaVxbKikT7UUrFk"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 198093,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/1GrLfs4TEvAZ86HVzXHchS"
              },
              "href" : "https://api.spotify.com/v1/tracks/1GrLfs4TEvAZ86HVzXHchS",
              "id" : "1GrLfs4TEvAZ86HVzXHchS",
              "is_local" : false,
              "name" : "Crying",
              "preview_url" : null,
              "track_number" : 3,
              "type" : "track",
              "uri" : "spotify:track:1GrLfs4TEvAZ86HVzXHchS"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 175666,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/0tBJh9kQ0KGLR443BVe4W1"
              },
              "href" : "https://api.spotify.com/v1/tracks/0tBJh9kQ0KGLR443BVe4W1",
              "id" : "0tBJh9kQ0KGLR443BVe4W1",
              "is_local" : false,
              "name" : "For You",
              "preview_url" : null,
              "track_number" : 4,
              "type" : "track",
              "uri" : "spotify:track:0tBJh9kQ0KGLR443BVe4W1"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 276866,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/1htS4aq15EnMMuQ45rZX3b"
              },
              "href" : "https://api.spotify.com/v1/tracks/1htS4aq15EnMMuQ45rZX3b",
              "id" : "1htS4aq15EnMMuQ45rZX3b",
              "is_local" : false,
              "name" : "So Close",
              "preview_url" : null,
              "track_number" : 5,
              "type" : "track",
              "uri" : "spotify:track:1htS4aq15EnMMuQ45rZX3b"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 224453,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/0MJj7LrlhVbrndKAspZc2H"
              },
              "href" : "https://api.spotify.com/v1/tracks/0MJj7LrlhVbrndKAspZc2H",
              "id" : "0MJj7LrlhVbrndKAspZc2H",
              "is_local" : false,
              "name" : "New Year",
              "preview_url" : null,
              "track_number" : 6,
              "type" : "track",
              "uri" : "spotify:track:0MJj7LrlhVbrndKAspZc2H"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 184040,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/5Mu6rl5QEQ0YEhiVopYwJx"
              },
              "href" : "https://api.spotify.com/v1/tracks/5Mu6rl5QEQ0YEhiVopYwJx",
              "id" : "5Mu6rl5QEQ0YEhiVopYwJx",
              "is_local" : false,
              "name" : "Eat Junk Become Junk",
              "preview_url" : null,
              "track_number" : 7,
              "type" : "track",
              "uri" : "spotify:track:5Mu6rl5QEQ0YEhiVopYwJx"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 289840,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/3ZRm7uHtdFK7arB7M0ncHl"
              },
              "href" : "https://api.spotify.com/v1/tracks/3ZRm7uHtdFK7arB7M0ncHl",
              "id" : "3ZRm7uHtdFK7arB7M0ncHl",
              "is_local" : false,
              "name" : "Bochum (Light Up My Life)",
              "preview_url" : null,
              "track_number" : 8,
              "type" : "track",
              "uri" : "spotify:track:3ZRm7uHtdFK7arB7M0ncHl"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 452120,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/4ee5fN6zpDUMKtCSKeqOiD"
              },
              "href" : "https://api.spotify.com/v1/tracks/4ee5fN6zpDUMKtCSKeqOiD",
              "id" : "4ee5fN6zpDUMKtCSKeqOiD",
              "is_local" : false,
              "name" : "Oh! Dear",
              "preview_url" : null,
              "track_number" : 9,
              "type" : "track",
              "uri" : "spotify:track:4ee5fN6zpDUMKtCSKeqOiD"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 382626,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/6xyBZBa8uITHELycRzF2ry"
              },
              "href" : "https://api.spotify.com/v1/tracks/6xyBZBa8uITHELycRzF2ry",
              "id" : "6xyBZBa8uITHELycRzF2ry",
              "is_local" : false,
              "name" : "Always Waiting For ...",
              "preview_url" : null,
              "track_number" : 10,
              "type" : "track",
              "uri" : "spotify:track:6xyBZBa8uITHELycRzF2ry"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 376480,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/5Vf2ryw6CgbYORNjpMqSaW"
              },
              "href" : "https://api.spotify.com/v1/tracks/5Vf2ryw6CgbYORNjpMqSaW",
              "id" : "5Vf2ryw6CgbYORNjpMqSaW",
              "is_local" : false,
              "name" : "Change",
              "preview_url" : null,
              "track_number" : 11,
              "type" : "track",
              "uri" : "spotify:track:5Vf2ryw6CgbYORNjpMqSaW"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 428893,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/5TpY3R5ceANpoRaISiicPP"
              },
              "href" : "https://api.spotify.com/v1/tracks/5TpY3R5ceANpoRaISiicPP",
              "id" : "5TpY3R5ceANpoRaISiicPP",
              "is_local" : false,
              "name" : "Get A Real Tattoo",
              "preview_url" : null,
              "track_number" : 12,
              "type" : "track",
              "uri" : "spotify:track:5TpY3R5ceANpoRaISiicPP"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 343186,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/3m6Em75ed3zFJY7I3pgJ69"
              },
              "href" : "https://api.spotify.com/v1/tracks/3m6Em75ed3zFJY7I3pgJ69",
              "id" : "3m6Em75ed3zFJY7I3pgJ69",
              "is_local" : false,
              "name" : "Another Love Song (Peel Session)",
              "preview_url" : null,
              "track_number" : 13,
              "type" : "track",
              "uri" : "spotify:track:3m6Em75ed3zFJY7I3pgJ69"
            }, {
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/4TXdHyuAOl3rAOFmZ6MeKz"
                },
                "href" : "https://api.spotify.com/v1/artists/4TXdHyuAOl3rAOFmZ6MeKz",
                "id" : "4TXdHyuAOl3rAOFmZ6MeKz",
                "name" : "Six by Seven",
                "type" : "artist",
                "uri" : "spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz"
              } ],
              "available_markets" : [ ],
              "disc_number" : 1,
              "duration_ms" : 429360,
              "explicit" : false,
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/2wEGjrVzVG57e3UjIPdWng"
              },
              "href" : "https://api.spotify.com/v1/tracks/2wEGjrVzVG57e3UjIPdWng",
              "id" : "2wEGjrVzVG57e3UjIPdWng",
              "is_local" : false,
              "name" : "European Me (Live Student Radio Session)",
              "preview_url" : null,
              "track_number" : 14,
              "type" : "track",
              "uri" : "spotify:track:2wEGjrVzVG57e3UjIPdWng"
            } ],
            "limit" : 50,
            "next" : null,
            "offset" : 0,
            "previous" : null,
            "total" : 14
          },
          "type" : "album",
          "uri" : "spotify:album:4iwv7b8gDPKztLkKCbWyhi"
        } ]
      }
    ))
  })
]

export const nullAlbumHandlers = [
  rest.get('https://api.spotify.com/v1/albums?ids=4iwv7b8gDPKztLkKCbWyhi', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "albums" : [ null ]
      }
    ))
  })
]

export const nullTrackHandlers = [
  rest.get('https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks?offset=0&limit=10', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "href" : "https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks?offset=0&limit=100",
        "items" : [
          {
            "added_at" : "2020-11-08T22:12:50Z",
            "added_by" : {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/user/"
              },
              "href" : "https://api.spotify.com/v1/users/",
              "id" : "",
              "type" : "user",
              "uri" : "spotify:user:"
            },
            "is_local" : false,
            "primary_color" : null,
            "track" : null,
            "video_thumbnail" : {
              "url" : null
            }
          }
        ]
      }
    ))
  })
]

export const localTrackHandlers = [
  rest.get('https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks?offset=0&limit=10', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "href" : "https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks?offset=0&limit=100",
        "items" : [
          {
            "added_at" : "2021-02-24T06:12:40Z",
            "added_by" : {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/user/u8ins5esg43wtxk4h66o5d1nb"
              },
              "href" : "https://api.spotify.com/v1/users/u8ins5esg43wtxk4h66o5d1nb",
              "id" : "u8ins5esg43wtxk4h66o5d1nb",
              "type" : "user",
              "uri" : "spotify:user:u8ins5esg43wtxk4h66o5d1nb"
            },
            "is_local" : true,
            "primary_color" : null,
            "track" : {
              "album" : {
                "album_type" : null,
                "artists" : [ ],
                "available_markets" : [ ],
                "external_urls" : { },
                "href" : null,
                "id" : null,
                "images" : [ ],
                "name" : "Heart of Stone",
                "release_date" : null,
                "release_date_precision" : null,
                "type" : "album",
                "uri" : null
              },
              "artists" : [ {
                "external_urls" : { },
                "href" : null,
                "id" : null,
                "name" : "The Waymores",
                "type" : "artist",
                "uri" : null
              } ],
              "available_markets" : [ ],
              "disc_number" : 0,
              "duration_ms" : 128000,
              "explicit" : false,
              "external_ids" : { },
              "external_urls" : { },
              "href" : null,
              "id" : null,
              "is_local" : true,
              "name" : "Heart of Stone",
              "popularity" : 0,
              "preview_url" : null,
              "track_number" : 0,
              "type" : "track",
              "uri" : "spotify:local:The+Waymores:Heart+of+Stone:Heart+of+Stone:128"
            },
            "video_thumbnail" : {
              "url" : null
            }
          }, {
            "added_at" : "2021-02-24T06:12:40Z",
            "added_by" : {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/user/u8ins5esg43wtxk4h66o5d1nb"
              },
              "href" : "https://api.spotify.com/v1/users/u8ins5esg43wtxk4h66o5d1nb",
              "id" : "u8ins5esg43wtxk4h66o5d1nb",
              "type" : "user",
              "uri" : "spotify:user:u8ins5esg43wtxk4h66o5d1nb"
            },
            "is_local" : true,
            "primary_color" : null,
            "track" : {
              "album" : {
                "album_type" : null,
                "artists" : [ ],
                "available_markets" : [ ],
                "external_urls" : { },
                "href" : null,
                "id" : null,
                "images" : [ ],
                "name" : "Heard It Through The Red Wine",
                "release_date" : null,
                "release_date_precision" : null,
                "type" : "album",
                "uri" : null
              },
              "artists" : [ {
                "external_urls" : { },
                "href" : null,
                "id" : null,
                "name" : "Charlie Marie",
                "type" : "artist",
                "uri" : null
              } ],
              "available_markets" : [ ],
              "disc_number" : 0,
              "duration_ms" : 227000,
              "explicit" : false,
              "external_ids" : { },
              "external_urls" : { },
              "href" : null,
              "id" : null,
              "is_local" : true,
              "name" : "Heard It Through The Red Wine",
              "popularity" : 0,
              "preview_url" : null,
              "track_number" : 0,
              "type" : "track",
              "uri" : "spotify:local:Charlie+Marie:Heard+It+Through+The+Red+Wine:Heard+It+Through+The+Red+Wine:227"
            },
            "video_thumbnail" : {
              "url" : null
            }
          }
        ]
      }
    ))
  })
]

export const duplicateTrackHandlers = [
  rest.get('https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks?offset=0&limit=10', (req, res, ctx) => {
    handlerCalled(req.url.toString())

    if (req.headers.get("Authorization") !== "Bearer TEST_ACCESS_TOKEN") {
      return res(ctx.status(401), ctx.json({ message: 'Not authorized' }))
    }

    return res(ctx.json(
      {
        "href" : "https://api.spotify.com/v1/playlists/4XOGDpHMrVoH33uJEwHWU5/tracks?offset=0&limit=100",
        "items" : [
          {
            "added_at" : "2020-11-03T15:19:04Z",
            "added_by" : {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/user/watsonbox"
              },
              "href" : "https://api.spotify.com/v1/users/watsonbox",
              "id" : "watsonbox",
              "type" : "user",
              "uri" : "spotify:user:watsonbox"
            },
            "is_local" : false,
            "primary_color" : null,
            "track" : {
              "album" : {
                "album_type" : "album",
                "artists" : [ {
                  "external_urls" : {
                    "spotify" : "https://open.spotify.com/artist/69lEbRQRe29JdyLrewNAvD"
                  },
                  "href" : "https://api.spotify.com/v1/artists/69lEbRQRe29JdyLrewNAvD",
                  "id" : "69lEbRQRe29JdyLrewNAvD",
                  "name" : "Ghostpoet",
                  "type" : "artist",
                  "uri" : "spotify:artist:69lEbRQRe29JdyLrewNAvD"
                } ],
                "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "UY", "VN", "ZA" ],
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/album/6jiLkuSnhzDvzsHJlweoGh"
                },
                "href" : "https://api.spotify.com/v1/albums/6jiLkuSnhzDvzsHJlweoGh",
                "id" : "6jiLkuSnhzDvzsHJlweoGh",
                "images" : [ {
                  "height" : 640,
                  "url" : "https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80",
                  "width" : 640
                }, {
                  "height" : 300,
                  "url" : "https://i.scdn.co/image/ab67616d00001e02306e7640be17c5b3468e6e80",
                  "width" : 300
                }, {
                  "height" : 64,
                  "url" : "https://i.scdn.co/image/ab67616d00004851306e7640be17c5b3468e6e80",
                  "width" : 64
                } ],
                "name" : "Peanut Butter Blues and Melancholy Jam",
                "release_date" : "2011",
                "release_date_precision" : "year",
                "total_tracks" : 10,
                "type" : "album",
                "uri" : "spotify:album:6jiLkuSnhzDvzsHJlweoGh"
              },
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/69lEbRQRe29JdyLrewNAvD"
                },
                "href" : "https://api.spotify.com/v1/artists/69lEbRQRe29JdyLrewNAvD",
                "id" : "69lEbRQRe29JdyLrewNAvD",
                "name" : "Ghostpoet",
                "type" : "artist",
                "uri" : "spotify:artist:69lEbRQRe29JdyLrewNAvD"
              } ],
              "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "UY", "VN", "ZA" ],
              "disc_number" : 1,
              "duration_ms" : 241346,
              "episode" : false,
              "explicit" : false,
              "external_ids" : {
                "isrc" : "GBMEF1100339"
              },
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/7ATyvp3TmYBmGW7YuC8DJ3"
              },
              "href" : "https://api.spotify.com/v1/tracks/7ATyvp3TmYBmGW7YuC8DJ3",
              "id" : "7ATyvp3TmYBmGW7YuC8DJ3",
              "is_local" : false,
              "name" : "One Twos / Run Run Run",
              "popularity" : 22,
              "preview_url" : "https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99",
              "track" : true,
              "track_number" : 1,
              "type" : "track",
              "uri" : "spotify:track:7ATyvp3TmYBmGW7YuC8DJ3"
            },
            "video_thumbnail" : {
              "url" : null
            }
          },
          {
            "added_at" : "2020-11-20T15:19:04Z",
            "added_by" : {
              "external_urls" : {
                "spotify" : "https://open.spotify.com/user/watsonbox"
              },
              "href" : "https://api.spotify.com/v1/users/watsonbox",
              "id" : "watsonbox",
              "type" : "user",
              "uri" : "spotify:user:watsonbox"
            },
            "is_local" : false,
            "primary_color" : null,
            "track" : {
              "album" : {
                "album_type" : "album",
                "artists" : [ {
                  "external_urls" : {
                    "spotify" : "https://open.spotify.com/artist/69lEbRQRe29JdyLrewNAvD"
                  },
                  "href" : "https://api.spotify.com/v1/artists/69lEbRQRe29JdyLrewNAvD",
                  "id" : "69lEbRQRe29JdyLrewNAvD",
                  "name" : "Ghostpoet",
                  "type" : "artist",
                  "uri" : "spotify:artist:69lEbRQRe29JdyLrewNAvD"
                } ],
                "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "UY", "VN", "ZA" ],
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/album/6jiLkuSnhzDvzsHJlweoGh"
                },
                "href" : "https://api.spotify.com/v1/albums/6jiLkuSnhzDvzsHJlweoGh",
                "id" : "6jiLkuSnhzDvzsHJlweoGh",
                "images" : [ {
                  "height" : 640,
                  "url" : "https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80",
                  "width" : 640
                }, {
                  "height" : 300,
                  "url" : "https://i.scdn.co/image/ab67616d00001e02306e7640be17c5b3468e6e80",
                  "width" : 300
                }, {
                  "height" : 64,
                  "url" : "https://i.scdn.co/image/ab67616d00004851306e7640be17c5b3468e6e80",
                  "width" : 64
                } ],
                "name" : "Peanut Butter Blues and Melancholy Jam",
                "release_date" : "2011",
                "release_date_precision" : "year",
                "total_tracks" : 10,
                "type" : "album",
                "uri" : "spotify:album:6jiLkuSnhzDvzsHJlweoGh"
              },
              "artists" : [ {
                "external_urls" : {
                  "spotify" : "https://open.spotify.com/artist/69lEbRQRe29JdyLrewNAvD"
                },
                "href" : "https://api.spotify.com/v1/artists/69lEbRQRe29JdyLrewNAvD",
                "id" : "69lEbRQRe29JdyLrewNAvD",
                "name" : "Ghostpoet",
                "type" : "artist",
                "uri" : "spotify:artist:69lEbRQRe29JdyLrewNAvD"
              } ],
              "available_markets" : [ "AD", "AE", "AL", "AR", "AT", "AU", "BA", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH", "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR", "GB", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IS", "IT", "JO", "KW", "KZ", "LB", "LI", "LT", "LU", "LV", "MA", "MC", "MD", "MK", "MT", "MX", "MY", "NI", "NL", "NO", "NZ", "OM", "PA", "PE", "PH", "PL", "PS", "PT", "PY", "QA", "RO", "RU", "SA", "SE", "SG", "SI", "SK", "SV", "TH", "TN", "TR", "TW", "UA", "UY", "VN", "ZA" ],
              "disc_number" : 1,
              "duration_ms" : 241346,
              "episode" : false,
              "explicit" : false,
              "external_ids" : {
                "isrc" : "GBMEF1100339"
              },
              "external_urls" : {
                "spotify" : "https://open.spotify.com/track/7ATyvp3TmYBmGW7YuC8DJ3"
              },
              "href" : "https://api.spotify.com/v1/tracks/7ATyvp3TmYBmGW7YuC8DJ3",
              "id" : "7ATyvp3TmYBmGW7YuC8DJ3",
              "is_local" : false,
              "name" : "One Twos / Run Run Run",
              "popularity" : 22,
              "preview_url" : "https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99",
              "track" : true,
              "track_number" : 1,
              "type" : "track",
              "uri" : "spotify:track:7ATyvp3TmYBmGW7YuC8DJ3"
            },
            "video_thumbnail" : {
              "url" : null
            }
          }
        ]
      }
    ))
  })
]
