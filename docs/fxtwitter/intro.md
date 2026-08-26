# API Overview | FxEmbed
FxEmbed provides a public API for X/Twitter and Bluesky. These are the same APIs that power the embed service itself and more.

We’ve built abstractions between different platforms to make it easier to support multiple at once and adapt your own work between them.

FxEmbed provides three separate API surfaces:

The most feature-complete API, covering X/Twitter data.

*   **Base URL**: `https://api.fxtwitter.com`
*   **Spec**: [FxTwitter API Reference](https://docs.fxembed.com/api/twitter/operations/)
*   Posts, threads, conversations, profiles, search, trends, typeahead

Bluesky / AT Protocol data, with response shapes aligned to the FxTwitter API where applicable.

*   **Base URL**: `https://api.fxbsky.app`
*   **Spec**: [FxBluesky API Reference](https://docs.fxembed.com/api/bluesky/operations/)
*   Posts, threads, conversations, profiles, search

All current endpoints are under the `/2/` path prefix (API v2). The legacy v1 endpoints (i.e., `/:handle/status/:id`) still work for backward compatibility but don’t support all the latest features.

All API responses are JSON with `Content-Type: application/json`. Every response includes a `code` field that mirrors the HTTP status code, making it easy to check for errors even when the HTTP status is `200`.

```

{
  "code": 200,
  "status": {
    "id": "123456789",
    "url": "https://twitter.com/user/status/123456789",
    "text": "Hello, world!",
    "author": { ... },
    "media": { ... },
    ...
  }
}
```


List endpoints (search results, timelines, followers, etc.) return a `cursor` object with `top` and `bottom` fields. Pass `cursor.bottom` as the `cursor` query parameter to fetch the next page.

```

{
  "code": 200,
  "results": [ ... ],
  "cursor": {
    "top": "...",
    "bottom": "..."
  }
}
```


API v2 has a rate limit of 1000 requests per minute (16.7 requests per second) per IP address. We believe this is generous enough for most legitimate applications. If you need more, it might be worth [self-hosting](https://docs.fxembed.com/deployment/) your own instance.

OpenAPI specifications
----------------------

[Section titled “OpenAPI specifications”](#openapi-specifications)

Machine-readable OpenAPI 3.0 specs are available at runtime:

*   FxTwitter: `https://api.fxtwitter.com/2/openapi.json`
*   FxBluesky: `https://api.fxbsky.app/2/openapi.json`