## Traingon Crawler API (Flask)

Run the server, then call these endpoints on:

- `http://127.0.0.1:5000`
- (or your LAN IP, e.g. `http://192.168.1.14:5000`)

## Cache

Responses are cached in-memory for 300 seconds (`SimpleCache`). Different query params produce different cache entries.

## Data models (common fields)

### Video card
```json
{
  "video_url": "https://traingon.top/video/slug",
  "title": "Some Title",
  "views": "50.7K views",
  "duration": "26:08",
  "hot": false,
  "thumb_url": "https://.../thumb.jpg"
}
```

## Endpoints

### 1) Hero slider

`GET /slider_items`

Response:
```json
{
  "slider_items": [
    {
      "active": true,
      "category": "Vietnam",
      "title": "Scream Out Loud - Bevis x Lucas",
      "description": "....",
      "video_url": "https://traingon.top/video/scream-out-loud-bevis-x-lucas",
      "background_image": "https://.../ScreamOutLoud-BevisLucas-Traingon.jpg"
    }
  ]
}
```

### 2) Sections (Latest / Most Viewed / Least Viewed)

`GET /sections`

Response:
```json
{
  "sections": [
    {
      "heading": "Latest",
      "more_url": "https://traingon.top/latest",
      "items": [
        {
          "video_url": "https://traingon.top/video/....",
          "title": "....",
          "views": "....",
          "duration": "....",
          "hot": false,
          "thumb_url": "https://...jpg"
        }
      ]
    }
  ]
}
```

### 3) Video details + related videos

`GET /video_detail?video_url=<url_or_slug>`

- `video_url` can be a full URL like `https://traingon.top/video/haitai9098`
  or a slug-like value (the crawler will build the full URL).

Response:
```json
{
  "video_detail": {
    "title": "巨根搬家公司 - haitai9098",
    "views": "50.7K views",
    "duration": "26:08",
    "uploaded": "1 months ago",
    "category": "China",
    "category_url": "https://traingon.top/category/china",
    "description": "....",
    "tags": ["#china", "#haitai9098"],
    "tag_urls": ["https://traingon.top/tag/china", "https://traingon.top/tag/haitai9098"],
    "poster_url": "https://...jpg",
    "stream_url": "https://...mp4",
    "download_url": "https://...mp4?dl=1",
    "extra_images": ["https://.../thumb (1).jpg", "https://.../thumb (2).jpg"],
    "episodes": [
      { "episode": 1, "url": "https://.../Vuanghichngu-traingon%20%281%29.mp4" },
      { "episode": 2, "url": "https://.../Vuanghichngu-traingon%20%282%29.mp4" }
    ]
  },
  "related_videos": [
    {
      "video_url": "https://traingon.top/video/related-1",
      "title": "....",
      "views": "....",
      "duration": "....",
      "hot": false,
      "thumb_url": "https://...jpg"
    }
  ]
}
```

### 4) Tag list (paged)

`GET /tag?tag=<tag>&page=<n>`

Example:
- `GET /tag?tag=china&page=1`

Response:
```json
{
  "tag": "china",
  "page": 1,
  "total_pages": 12,
  "items": [
    {
      "video_url": "https://traingon.top/video/....",
      "title": "....",
      "views": "....",
      "duration": "....",
      "hot": false,
      "thumb_url": "https://...jpg"
    }
  ]
}
```

### 5) Category list (bar in header)

`GET /categories`

Response:
```json
{
  "categories": [
    { "name": "China", "url": "https://traingon.top/category/china" },
    { "name": "Vietnam", "url": "https://traingon.top/category/vietnam" }
  ]
}
```

### 6) Category page (paged)

`GET /category?category=<slug>&page=<n>`

Example:
- `GET /category?category=china&page=2`

Response:
```json
{
  "category": "china",
  "page": 2,
  "total_pages": 9,
  "items": [
    {
      "video_url": "https://traingon.top/video/....",
      "title": "....",
      "views": "....",
      "duration": "....",
      "hot": false,
      "thumb_url": "https://...jpg"
    }
  ]
}
```

### 7) Search page (paged)

`GET /search?q=<query>&page=<n>`

Example:
- `GET /search?q=bo&page=1`

Response:
```json
{
  "q": "bo",
  "page": 1,
  "total_pages": 4,
  "items": [
    {
      "video_url": "https://traingon.top/video/....",
      "title": "....",
      "views": "....",
      "duration": "....",
      "hot": false,
      "thumb_url": "https://...jpg"
    }
  ]
}
```

### 8) Latest Videos (paged)

`GET /latest?page=<n>`

Example:
- `GET /latest?page=1`

Response:
```json
{
  "page": 1,
  "total_pages": 30,
  "items": [
    {
      "video_url": "https://traingon.top/video/....",
      "title": "....",
      "views": "....",
      "duration": "....",
      "hot": false,
      "thumb_url": "https://...jpg"
    }
  ]
}
```

### 9) Popular Videos (paged)

`GET /popular?page=<n>`

Example:
- `GET /popular?page=1`

Response:
```json
{
  "page": 1,
  "total_pages": 30,
  "items": [
    {
      "video_url": "https://traingon.top/video/....",
      "title": "....",
      "views": "....",
      "duration": "....",
      "hot": false,
      "thumb_url": "https://...jpg"
    }
  ]
}
```

### 10) Least Viewed Videos (paged)

`GET /least-viewed?page=<n>`

Example:
- `GET /least-viewed?page=1`

Response:
```json
{
  "page": 1,
  "total_pages": 30,
  "items": [
    {
      "video_url": "https://traingon.top/video/....",
      "title": "....",
      "views": "....",
      "duration": "....",
      "hot": false,
      "thumb_url": "https://...jpg"
    }
  ]
}
```

### 11) Chat messages (CBox Archive + optional pagination)

`GET /chat?i=<i>&c=<c>`

- `i` (optional): start message ID/index
- `c` (optional): page direction/offset

Examples:
- `GET /chat` (returns the absolute latest messages)
- `GET /chat?i=2376&c=3` (paginates backward to fetch older messages prior to ID 2376)

Response:
```json
{
  "messages": [
    {
      "id": "2376",
      "uid": "0",
      "time": 1779439017,
      "date": "22 May 26, 03:36 PM",
      "name": "cutie_",
      "body": "josephmrkao185 pleaseeee",
      "avatar_url": null,
      "is_admin": false
    }
  ]
}
```

### 12) Health check

`GET /health`

Response:
```json
{ "status": "ok" }
```
