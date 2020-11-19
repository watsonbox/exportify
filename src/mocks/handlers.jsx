import { rest } from 'msw'

export const handlerCalled = jest.fn()

export const handlers = [
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
