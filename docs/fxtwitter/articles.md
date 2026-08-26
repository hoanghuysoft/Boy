[Skip to content](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#_top)

# List user articles

GET

/2/profile/{handle}/articles

Select code sampleFetchcURL

```
const url = 'https://api.fxtwitter.com/2/profile/example/articles?count=20&lang=es';

const options = {method: 'GET'};

try {

  const response = await fetch(url, options);

  const data = await response.json();

  console.log(data);

} catch (error) {

  console.error(error);

}
```

```
curl --request GET \

  --url 'https://api.fxtwitter.com/2/profile/example/articles?count=20&lang=es'
```

- FxTwitter API host

## Parameters

[Section titled “Parameters”](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#parameters)

### Path Parameters

[Section titled “Path Parameters”](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#path-parameters)

**handle**

required

string

Username without @, or numeric user id as `id:<rest_id>` (e.g. `id:783214`). Case-insensitive `id:` prefix.

### Query Parameters

[Section titled “Query Parameters”](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#query-parameters)

**count**

integer

default: 20>= 1<= 100

Page size (default 20)

**cursor**

string

Pagination cursor from prior response

**lang**

string

##### Example

```
es
```

Target language (ISO 639-1 or 639-5, e.g. `en`, `es`, `zh-cn`) for inline X translations when available; falls back to translation API if missing

## Responses

[Section titled “Responses”](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#responses)

### 200

[Section titled “200”](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#200)

Articles timeline page

Media typeapplication/json

object

**code**

required

number

**results**

required

Array<object>

object

**type**

required

Discriminator: single post/status (API v2).

string

Allowed values: status

**id**

required

string

**url**

required

string

**text**

required

string

**created\_at**

required

string

**created\_timestamp**

required

number

**likes**

required

number

**reposts**

required

number

**quotes**

required

number

**replies**

required

number

**quote**

Any of:

- [APITwitterStatus (recursive)](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-865)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-866)

_APITwitterStatus (recursive)_

Recursive reference — same shape as `APITwitterStatus`.

object

object

**type**

required

Placeholder for an unavailable post (quote/thread).

string

Allowed values: tombstone

**provider**

required

string

Allowed values: twitterblueskymastodontiktok

**reason**

required

Why the post is unavailable

string

Allowed values: deletedsuspendedprivateblockedunavailable

**message**

required

string

**id**

string

**url**

string

**author**

object

**type**

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

string

**name**

string

**screen\_name**

string

**avatar\_url**

string

nullable

**banner\_url**

string

nullable

**description**

string

**raw\_description**

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

string

**url**

string

**protected**

boolean

**followers**

number

**following**

number

**statuses**

number

**media\_count**

number

**likes**

number

**joined**

string

**website**

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**at\_uri**

string

**cid**

string

**poll**

object

**choices**

required

Array<object>

object

**label**

required

string

**count**

required

number

**percentage**

required

number

**total\_votes**

required

number

**ends\_at**

required

string

**time\_left\_en**

required

string

**author**

required

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**media**

required

object

**external**

object

**type**

required

string

Allowed values: video

**url**

required

string

**thumbnail\_url**

string

**height**

number

**width**

number

**photos**

Array<object>

object

**id**

string

**format**

string

**type**

required

string

Allowed values: photogif

**url**

required

string

**width**

required

number

**height**

required

number

**transcode\_url**

string

nullable

**altText**

string

**videos**

Array<object>

object

**id**

string

**format**

string

**type**

required

string

Allowed values: videogif

**url**

required

string

**width**

required

number

**height**

required

number

**thumbnail\_url**

string

nullable

**transcode\_url**

string

nullable

**duration**

required

number

**filesize**

number

**formats**

required

Array<object>

object

**container**

string

Allowed values: mp4webmm3u8

**codec**

string

Allowed values: h264hevcvp9av1

**bitrate**

number

**url**

required

string

**size**

number

**height**

number

**width**

number

**publisher**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**all**

Array

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-871)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-872)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-873)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-874)

object

**id**

string

**format**

string

**type**

required

string

Allowed values: photogif

**url**

required

string

**width**

required

number

**height**

required

number

**transcode\_url**

string

nullable

**altText**

string

object

**id**

string

**format**

string

**type**

required

string

Allowed values: videogif

**url**

required

string

**width**

required

number

**height**

required

number

**thumbnail\_url**

string

nullable

**transcode\_url**

string

nullable

**duration**

required

number

**filesize**

number

**formats**

required

Array<object>

object

**container**

string

Allowed values: mp4webmm3u8

**codec**

string

Allowed values: h264hevcvp9av1

**bitrate**

number

**url**

required

string

**size**

number

**height**

number

**width**

number

**publisher**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

object

**id**

string

**format**

string

**type**

required

string

Allowed values: mosaic\_photo

**url**

required

string

**width**

required

number

**height**

required

number

**formats**

required

object

**webp**

required

string

**jpeg**

required

string

object

**id**

string

**format**

string

**type**

required

string

**url**

required

string

**width**

required

number

**height**

required

number

**mosaic**

object

**id**

string

**format**

string

**type**

required

string

Allowed values: mosaic\_photo

**url**

required

string

**width**

required

number

**height**

required

number

**formats**

required

object

**webp**

required

string

**jpeg**

required

string

**broadcast**

object

**url**

required

string

**width**

required

number

**height**

required

number

**state**

required

string

Allowed values: LIVEENDED

**broadcaster**

required

object

**username**

required

string

**display\_name**

required

string

**id**

required

string

**stream**

object

**url**

required

string

**title**

required

string

**source**

required

string

**orientation**

required

string

Allowed values: landscapeportrait

**broadcast\_id**

required

string

**media\_id**

required

string

**media\_key**

required

string

**is\_high\_latency**

required

boolean

**thumbnail**

required

object

**original**

required

object

**url**

required

string

**small**

object

**url**

required

string

**medium**

object

**url**

required

string

**large**

object

**url**

required

string

**x\_large**

object

**url**

required

string

**raw\_text**

required

object

**text**

required

string

**display\_text\_range**

required

Array<number>

>= 2 items<= 2 items

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**lang**

required

string

nullable

**translation**

object

**text**

required

string

**source\_lang**

required

string

**source\_lang\_en**

required

string

**target\_lang**

required

string

**provider**

required

string

**possibly\_sensitive**

required

boolean

**replying\_to**

required

object

**screen\_name**

required

Handle or account id used in permalinks (@user on X).

string

**status**

required

Parent post id (X: snowflake; Bluesky: record key).

string

**url**

Permalink to the parent post when known.

string

**profile\_url**

Permalink to the parent author profile when known.

string

**display\_name**

Display name of the parent author when known.

string

**source**

required

string

nullable

**embed\_card**

required

string

Allowed values: tweetsummarysummary\_large\_imageplayer

**provider**

required

string

Allowed values: twitter

**views**

number

nullable

**bookmarks**

number

nullable

**community**

object

**id**

required

string

**name**

required

string

**description**

required

string

**created\_at**

required

string

**search\_tags**

required

Array<string>

**is\_nsfw**

required

boolean

**topic**

required

string

nullable

**admin**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**creator**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**join\_policy**

required

string

Allowed values: OpenClosed

**invites\_policy**

required

string

Allowed values: MemberInvitesAllowedMemberInvitesDisabled

**is\_pinned**

required

boolean

**article**

object

**created\_at**

required

string

**modified\_at**

string

**id**

required

string

**title**

required

string

**preview\_text**

required

string

**cover\_media**

required

object

**id**

required

string

**media\_key**

required

string

**media\_id**

required

string

**media\_info**

required

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-853)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-854)

object

**\_\_typename**

required

string

Allowed values: ApiImage

**original\_img\_height**

required

number

**original\_img\_width**

required

number

**original\_img\_url**

required

string

**color\_info**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

object

**\_\_typename**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-820)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-821)

string

Allowed values: ApiVideo

string

Allowed values: ApiGif

**type**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-822)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-823)

string

Allowed values: video

string

Allowed values: animated\_gif

**id**

required

string

**id\_str**

required

string

**ext\_alt\_text**

required

string

nullable

**ext\_media\_color**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

**media\_url**

required

string

**media\_url\_https**

required

string

**url**

required

string

**display\_url**

required

string

**expanded\_url**

required

string

**original\_info**

required

object

**height**

required

number

**width**

required

number

**sizes**

required

object

**original**

required

object

**h**

required

number

**resize**

required

string

Allowed values: fit

**w**

required

number

**video\_info**

required

object

**aspect\_ratio**

required

Array<number>

>= 2 items<= 2 items

**duration\_millis**

required

number

**variants**

required

Array<object>

object

**bitrate**

required

number

**content\_type**

required

string

**url**

required

string

**content**

required

object

**blocks**

Array<object>

default:

object

**key**

required

string

**data**

required

object

**_key_**

additional properties

nullable

**entityRanges**

required

Array<object>

object

**key**

required

number

**length**

required

number

**offset**

required

number

**inlineStyleRanges**

required

Array<object>

object

**length**

required

number

**offset**

required

number

**style**

required

string

**text**

required

string

**type**

required

string

**entityMap**

Array

default:

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-844)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-845)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-846)

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: MARKDOWN

**mutability**

required

string

Allowed values: Mutable

**data**

required

object

**entityKey**

required

string

**markdown**

required

string

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: MEDIA

**mutability**

required

string

Allowed values: Immutable

**data**

required

object

**entityKey**

required

string

**mediaItems**

required

Array<object>

object

**localMediaId**

required

string

**mediaCategory**

required

string

**mediaId**

required

string

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: TWEET

**mutability**

required

string

Allowed values: Immutable

**data**

required

object

**tweetId**

required

string

**media\_entities**

required

Array<object>

object

**id**

required

string

**media\_key**

required

string

**media\_id**

required

string

**media\_info**

required

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-855)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-856)

object

**\_\_typename**

required

string

Allowed values: ApiImage

**original\_img\_height**

required

number

**original\_img\_width**

required

number

**original\_img\_url**

required

string

**color\_info**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

object

**\_\_typename**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-824)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-825)

string

Allowed values: ApiVideo

string

Allowed values: ApiGif

**type**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-826)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-827)

string

Allowed values: video

string

Allowed values: animated\_gif

**id**

required

string

**id\_str**

required

string

**ext\_alt\_text**

required

string

nullable

**ext\_media\_color**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

**media\_url**

required

string

**media\_url\_https**

required

string

**url**

required

string

**display\_url**

required

string

**expanded\_url**

required

string

**original\_info**

required

object

**height**

required

number

**width**

required

number

**sizes**

required

object

**original**

required

object

**h**

required

number

**resize**

required

string

Allowed values: fit

**w**

required

number

**video\_info**

required

object

**aspect\_ratio**

required

Array<number>

>= 2 items<= 2 items

**duration\_millis**

required

number

**variants**

required

Array<object>

object

**bitrate**

required

number

**content\_type**

required

string

**url**

required

string

**is\_note\_tweet**

required

boolean

**community\_note**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**reposted\_by**

required

object

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

string

nullable

**url**

string

**card**

object

**url**

required

string

**title**

string

**description**

string

**domain**

string

**card\_name**

string

**image**

object

**width**

number

**height**

number

**url**

string

**alt**

string

**cursor**

required

object

**top**

required

string

nullable

**bottom**

required

string

nullable

##### Example

```
{

  "results": [\
\
    {\
\
      "type": "status",\
\
      "quote": {\
\
        "type": "tombstone",\
\
        "provider": "twitter",\
\
        "reason": "deleted",\
\
        "author": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        }\
\
      },\
\
      "author": {\
\
        "type": "profile",\
\
        "verification": {\
\
          "type": "organization"\
\
        }\
\
      },\
\
      "media": {\
\
        "external": {\
\
          "type": "video"\
\
        },\
\
        "photos": [\
\
          {\
\
            "type": "photo"\
\
          }\
\
        ],\
\
        "videos": [\
\
          {\
\
            "type": "video",\
\
            "formats": [\
\
              {\
\
                "container": "mp4",\
\
                "codec": "h264"\
\
              }\
\
            ],\
\
            "publisher": {\
\
              "type": "profile",\
\
              "verification": {\
\
                "type": "organization"\
\
              }\
\
            }\
\
          }\
\
        ],\
\
        "all": [\
\
          {\
\
            "type": "photo"\
\
          }\
\
        ],\
\
        "mosaic": {\
\
          "type": "mosaic_photo"\
\
        },\
\
        "broadcast": {\
\
          "state": "LIVE",\
\
          "orientation": "landscape"\
\
        }\
\
      },\
\
      "embed_card": "tweet",\
\
      "provider": "twitter",\
\
      "community": {\
\
        "admin": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        },\
\
        "creator": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        },\
\
        "join_policy": "Open",\
\
        "invites_policy": "MemberInvitesAllowed"\
\
      },\
\
      "article": {\
\
        "cover_media": {\
\
          "media_info": {\
\
            "__typename": "ApiImage"\
\
          }\
\
        },\
\
        "content": {\
\
          "blocks": [],\
\
          "entityMap": []\
\
        },\
\
        "media_entities": [\
\
          {\
\
            "media_info": {\
\
              "__typename": "ApiImage"\
\
            }\
\
          }\
\
        ]\
\
      }\
\
    }\
\
  ]

}
```

### 400

[Section titled “400”](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#400)

Invalid path or query parameters (e.g. `count` out of range)

Media typeapplication/json

object

**code**

required

number

Allowed values: 400

**message**

required

string

##### Example

```
{

  "code": 400

}
```

### 404

[Section titled “404”](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#404)

User not found or empty timeline

Media typeapplication/json

object

**code**

required

number

**results**

required

Array<object>

object

**type**

required

Discriminator: single post/status (API v2).

string

Allowed values: status

**id**

required

string

**url**

required

string

**text**

required

string

**created\_at**

required

string

**created\_timestamp**

required

number

**likes**

required

number

**reposts**

required

number

**quotes**

required

number

**replies**

required

number

**quote**

Any of:

- [APITwitterStatus (recursive)](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-867)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-868)

_APITwitterStatus (recursive)_

Recursive reference — same shape as `APITwitterStatus`.

object

object

**type**

required

Placeholder for an unavailable post (quote/thread).

string

Allowed values: tombstone

**provider**

required

string

Allowed values: twitterblueskymastodontiktok

**reason**

required

Why the post is unavailable

string

Allowed values: deletedsuspendedprivateblockedunavailable

**message**

required

string

**id**

string

**url**

string

**author**

object

**type**

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

string

**name**

string

**screen\_name**

string

**avatar\_url**

string

nullable

**banner\_url**

string

nullable

**description**

string

**raw\_description**

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

string

**url**

string

**protected**

boolean

**followers**

number

**following**

number

**statuses**

number

**media\_count**

number

**likes**

number

**joined**

string

**website**

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**at\_uri**

string

**cid**

string

**poll**

object

**choices**

required

Array<object>

object

**label**

required

string

**count**

required

number

**percentage**

required

number

**total\_votes**

required

number

**ends\_at**

required

string

**time\_left\_en**

required

string

**author**

required

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**media**

required

object

**external**

object

**type**

required

string

Allowed values: video

**url**

required

string

**thumbnail\_url**

string

**height**

number

**width**

number

**photos**

Array<object>

object

**id**

string

**format**

string

**type**

required

string

Allowed values: photogif

**url**

required

string

**width**

required

number

**height**

required

number

**transcode\_url**

string

nullable

**altText**

string

**videos**

Array<object>

object

**id**

string

**format**

string

**type**

required

string

Allowed values: videogif

**url**

required

string

**width**

required

number

**height**

required

number

**thumbnail\_url**

string

nullable

**transcode\_url**

string

nullable

**duration**

required

number

**filesize**

number

**formats**

required

Array<object>

object

**container**

string

Allowed values: mp4webmm3u8

**codec**

string

Allowed values: h264hevcvp9av1

**bitrate**

number

**url**

required

string

**size**

number

**height**

number

**width**

number

**publisher**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**all**

Array

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-875)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-876)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-877)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-878)

object

**id**

string

**format**

string

**type**

required

string

Allowed values: photogif

**url**

required

string

**width**

required

number

**height**

required

number

**transcode\_url**

string

nullable

**altText**

string

object

**id**

string

**format**

string

**type**

required

string

Allowed values: videogif

**url**

required

string

**width**

required

number

**height**

required

number

**thumbnail\_url**

string

nullable

**transcode\_url**

string

nullable

**duration**

required

number

**filesize**

number

**formats**

required

Array<object>

object

**container**

string

Allowed values: mp4webmm3u8

**codec**

string

Allowed values: h264hevcvp9av1

**bitrate**

number

**url**

required

string

**size**

number

**height**

number

**width**

number

**publisher**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

object

**id**

string

**format**

string

**type**

required

string

Allowed values: mosaic\_photo

**url**

required

string

**width**

required

number

**height**

required

number

**formats**

required

object

**webp**

required

string

**jpeg**

required

string

object

**id**

string

**format**

string

**type**

required

string

**url**

required

string

**width**

required

number

**height**

required

number

**mosaic**

object

**id**

string

**format**

string

**type**

required

string

Allowed values: mosaic\_photo

**url**

required

string

**width**

required

number

**height**

required

number

**formats**

required

object

**webp**

required

string

**jpeg**

required

string

**broadcast**

object

**url**

required

string

**width**

required

number

**height**

required

number

**state**

required

string

Allowed values: LIVEENDED

**broadcaster**

required

object

**username**

required

string

**display\_name**

required

string

**id**

required

string

**stream**

object

**url**

required

string

**title**

required

string

**source**

required

string

**orientation**

required

string

Allowed values: landscapeportrait

**broadcast\_id**

required

string

**media\_id**

required

string

**media\_key**

required

string

**is\_high\_latency**

required

boolean

**thumbnail**

required

object

**original**

required

object

**url**

required

string

**small**

object

**url**

required

string

**medium**

object

**url**

required

string

**large**

object

**url**

required

string

**x\_large**

object

**url**

required

string

**raw\_text**

required

object

**text**

required

string

**display\_text\_range**

required

Array<number>

>= 2 items<= 2 items

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**lang**

required

string

nullable

**translation**

object

**text**

required

string

**source\_lang**

required

string

**source\_lang\_en**

required

string

**target\_lang**

required

string

**provider**

required

string

**possibly\_sensitive**

required

boolean

**replying\_to**

required

object

**screen\_name**

required

Handle or account id used in permalinks (@user on X).

string

**status**

required

Parent post id (X: snowflake; Bluesky: record key).

string

**url**

Permalink to the parent post when known.

string

**profile\_url**

Permalink to the parent author profile when known.

string

**display\_name**

Display name of the parent author when known.

string

**source**

required

string

nullable

**embed\_card**

required

string

Allowed values: tweetsummarysummary\_large\_imageplayer

**provider**

required

string

Allowed values: twitter

**views**

number

nullable

**bookmarks**

number

nullable

**community**

object

**id**

required

string

**name**

required

string

**description**

required

string

**created\_at**

required

string

**search\_tags**

required

Array<string>

**is\_nsfw**

required

boolean

**topic**

required

string

nullable

**admin**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**creator**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**join\_policy**

required

string

Allowed values: OpenClosed

**invites\_policy**

required

string

Allowed values: MemberInvitesAllowedMemberInvitesDisabled

**is\_pinned**

required

boolean

**article**

object

**created\_at**

required

string

**modified\_at**

string

**id**

required

string

**title**

required

string

**preview\_text**

required

string

**cover\_media**

required

object

**id**

required

string

**media\_key**

required

string

**media\_id**

required

string

**media\_info**

required

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-857)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-858)

object

**\_\_typename**

required

string

Allowed values: ApiImage

**original\_img\_height**

required

number

**original\_img\_width**

required

number

**original\_img\_url**

required

string

**color\_info**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

object

**\_\_typename**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-828)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-829)

string

Allowed values: ApiVideo

string

Allowed values: ApiGif

**type**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-830)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-831)

string

Allowed values: video

string

Allowed values: animated\_gif

**id**

required

string

**id\_str**

required

string

**ext\_alt\_text**

required

string

nullable

**ext\_media\_color**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

**media\_url**

required

string

**media\_url\_https**

required

string

**url**

required

string

**display\_url**

required

string

**expanded\_url**

required

string

**original\_info**

required

object

**height**

required

number

**width**

required

number

**sizes**

required

object

**original**

required

object

**h**

required

number

**resize**

required

string

Allowed values: fit

**w**

required

number

**video\_info**

required

object

**aspect\_ratio**

required

Array<number>

>= 2 items<= 2 items

**duration\_millis**

required

number

**variants**

required

Array<object>

object

**bitrate**

required

number

**content\_type**

required

string

**url**

required

string

**content**

required

object

**blocks**

Array<object>

default:

object

**key**

required

string

**data**

required

object

**_key_**

additional properties

nullable

**entityRanges**

required

Array<object>

object

**key**

required

number

**length**

required

number

**offset**

required

number

**inlineStyleRanges**

required

Array<object>

object

**length**

required

number

**offset**

required

number

**style**

required

string

**text**

required

string

**type**

required

string

**entityMap**

Array

default:

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-847)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-848)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-849)

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: MARKDOWN

**mutability**

required

string

Allowed values: Mutable

**data**

required

object

**entityKey**

required

string

**markdown**

required

string

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: MEDIA

**mutability**

required

string

Allowed values: Immutable

**data**

required

object

**entityKey**

required

string

**mediaItems**

required

Array<object>

object

**localMediaId**

required

string

**mediaCategory**

required

string

**mediaId**

required

string

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: TWEET

**mutability**

required

string

Allowed values: Immutable

**data**

required

object

**tweetId**

required

string

**media\_entities**

required

Array<object>

object

**id**

required

string

**media\_key**

required

string

**media\_id**

required

string

**media\_info**

required

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-859)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-860)

object

**\_\_typename**

required

string

Allowed values: ApiImage

**original\_img\_height**

required

number

**original\_img\_width**

required

number

**original\_img\_url**

required

string

**color\_info**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

object

**\_\_typename**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-832)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-833)

string

Allowed values: ApiVideo

string

Allowed values: ApiGif

**type**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-834)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-835)

string

Allowed values: video

string

Allowed values: animated\_gif

**id**

required

string

**id\_str**

required

string

**ext\_alt\_text**

required

string

nullable

**ext\_media\_color**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

**media\_url**

required

string

**media\_url\_https**

required

string

**url**

required

string

**display\_url**

required

string

**expanded\_url**

required

string

**original\_info**

required

object

**height**

required

number

**width**

required

number

**sizes**

required

object

**original**

required

object

**h**

required

number

**resize**

required

string

Allowed values: fit

**w**

required

number

**video\_info**

required

object

**aspect\_ratio**

required

Array<number>

>= 2 items<= 2 items

**duration\_millis**

required

number

**variants**

required

Array<object>

object

**bitrate**

required

number

**content\_type**

required

string

**url**

required

string

**is\_note\_tweet**

required

boolean

**community\_note**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**reposted\_by**

required

object

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

string

nullable

**url**

string

**card**

object

**url**

required

string

**title**

string

**description**

string

**domain**

string

**card\_name**

string

**image**

object

**width**

number

**height**

number

**url**

string

**alt**

string

**cursor**

required

object

**top**

required

string

nullable

**bottom**

required

string

nullable

##### Example

```
{

  "results": [\
\
    {\
\
      "type": "status",\
\
      "quote": {\
\
        "type": "tombstone",\
\
        "provider": "twitter",\
\
        "reason": "deleted",\
\
        "author": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        }\
\
      },\
\
      "author": {\
\
        "type": "profile",\
\
        "verification": {\
\
          "type": "organization"\
\
        }\
\
      },\
\
      "media": {\
\
        "external": {\
\
          "type": "video"\
\
        },\
\
        "photos": [\
\
          {\
\
            "type": "photo"\
\
          }\
\
        ],\
\
        "videos": [\
\
          {\
\
            "type": "video",\
\
            "formats": [\
\
              {\
\
                "container": "mp4",\
\
                "codec": "h264"\
\
              }\
\
            ],\
\
            "publisher": {\
\
              "type": "profile",\
\
              "verification": {\
\
                "type": "organization"\
\
              }\
\
            }\
\
          }\
\
        ],\
\
        "all": [\
\
          {\
\
            "type": "photo"\
\
          }\
\
        ],\
\
        "mosaic": {\
\
          "type": "mosaic_photo"\
\
        },\
\
        "broadcast": {\
\
          "state": "LIVE",\
\
          "orientation": "landscape"\
\
        }\
\
      },\
\
      "embed_card": "tweet",\
\
      "provider": "twitter",\
\
      "community": {\
\
        "admin": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        },\
\
        "creator": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        },\
\
        "join_policy": "Open",\
\
        "invites_policy": "MemberInvitesAllowed"\
\
      },\
\
      "article": {\
\
        "cover_media": {\
\
          "media_info": {\
\
            "__typename": "ApiImage"\
\
          }\
\
        },\
\
        "content": {\
\
          "blocks": [],\
\
          "entityMap": []\
\
        },\
\
        "media_entities": [\
\
          {\
\
            "media_info": {\
\
              "__typename": "ApiImage"\
\
            }\
\
          }\
\
        ]\
\
      }\
\
    }\
\
  ]

}
```

### 500

[Section titled “500”](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#500)

Upstream or processing error

Media typeapplication/json

object

**code**

required

number

**results**

required

Array<object>

object

**type**

required

Discriminator: single post/status (API v2).

string

Allowed values: status

**id**

required

string

**url**

required

string

**text**

required

string

**created\_at**

required

string

**created\_timestamp**

required

number

**likes**

required

number

**reposts**

required

number

**quotes**

required

number

**replies**

required

number

**quote**

Any of:

- [APITwitterStatus (recursive)](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-869)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-870)

_APITwitterStatus (recursive)_

Recursive reference — same shape as `APITwitterStatus`.

object

object

**type**

required

Placeholder for an unavailable post (quote/thread).

string

Allowed values: tombstone

**provider**

required

string

Allowed values: twitterblueskymastodontiktok

**reason**

required

Why the post is unavailable

string

Allowed values: deletedsuspendedprivateblockedunavailable

**message**

required

string

**id**

string

**url**

string

**author**

object

**type**

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

string

**name**

string

**screen\_name**

string

**avatar\_url**

string

nullable

**banner\_url**

string

nullable

**description**

string

**raw\_description**

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

string

**url**

string

**protected**

boolean

**followers**

number

**following**

number

**statuses**

number

**media\_count**

number

**likes**

number

**joined**

string

**website**

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**at\_uri**

string

**cid**

string

**poll**

object

**choices**

required

Array<object>

object

**label**

required

string

**count**

required

number

**percentage**

required

number

**total\_votes**

required

number

**ends\_at**

required

string

**time\_left\_en**

required

string

**author**

required

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**media**

required

object

**external**

object

**type**

required

string

Allowed values: video

**url**

required

string

**thumbnail\_url**

string

**height**

number

**width**

number

**photos**

Array<object>

object

**id**

string

**format**

string

**type**

required

string

Allowed values: photogif

**url**

required

string

**width**

required

number

**height**

required

number

**transcode\_url**

string

nullable

**altText**

string

**videos**

Array<object>

object

**id**

string

**format**

string

**type**

required

string

Allowed values: videogif

**url**

required

string

**width**

required

number

**height**

required

number

**thumbnail\_url**

string

nullable

**transcode\_url**

string

nullable

**duration**

required

number

**filesize**

number

**formats**

required

Array<object>

object

**container**

string

Allowed values: mp4webmm3u8

**codec**

string

Allowed values: h264hevcvp9av1

**bitrate**

number

**url**

required

string

**size**

number

**height**

number

**width**

number

**publisher**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**all**

Array

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-879)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-880)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-881)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-882)

object

**id**

string

**format**

string

**type**

required

string

Allowed values: photogif

**url**

required

string

**width**

required

number

**height**

required

number

**transcode\_url**

string

nullable

**altText**

string

object

**id**

string

**format**

string

**type**

required

string

Allowed values: videogif

**url**

required

string

**width**

required

number

**height**

required

number

**thumbnail\_url**

string

nullable

**transcode\_url**

string

nullable

**duration**

required

number

**filesize**

number

**formats**

required

Array<object>

object

**container**

string

Allowed values: mp4webmm3u8

**codec**

string

Allowed values: h264hevcvp9av1

**bitrate**

number

**url**

required

string

**size**

number

**height**

number

**width**

number

**publisher**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

object

**id**

string

**format**

string

**type**

required

string

Allowed values: mosaic\_photo

**url**

required

string

**width**

required

number

**height**

required

number

**formats**

required

object

**webp**

required

string

**jpeg**

required

string

object

**id**

string

**format**

string

**type**

required

string

**url**

required

string

**width**

required

number

**height**

required

number

**mosaic**

object

**id**

string

**format**

string

**type**

required

string

Allowed values: mosaic\_photo

**url**

required

string

**width**

required

number

**height**

required

number

**formats**

required

object

**webp**

required

string

**jpeg**

required

string

**broadcast**

object

**url**

required

string

**width**

required

number

**height**

required

number

**state**

required

string

Allowed values: LIVEENDED

**broadcaster**

required

object

**username**

required

string

**display\_name**

required

string

**id**

required

string

**stream**

object

**url**

required

string

**title**

required

string

**source**

required

string

**orientation**

required

string

Allowed values: landscapeportrait

**broadcast\_id**

required

string

**media\_id**

required

string

**media\_key**

required

string

**is\_high\_latency**

required

boolean

**thumbnail**

required

object

**original**

required

object

**url**

required

string

**small**

object

**url**

required

string

**medium**

object

**url**

required

string

**large**

object

**url**

required

string

**x\_large**

object

**url**

required

string

**raw\_text**

required

object

**text**

required

string

**display\_text\_range**

required

Array<number>

>= 2 items<= 2 items

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**lang**

required

string

nullable

**translation**

object

**text**

required

string

**source\_lang**

required

string

**source\_lang\_en**

required

string

**target\_lang**

required

string

**provider**

required

string

**possibly\_sensitive**

required

boolean

**replying\_to**

required

object

**screen\_name**

required

Handle or account id used in permalinks (@user on X).

string

**status**

required

Parent post id (X: snowflake; Bluesky: record key).

string

**url**

Permalink to the parent post when known.

string

**profile\_url**

Permalink to the parent author profile when known.

string

**display\_name**

Display name of the parent author when known.

string

**source**

required

string

nullable

**embed\_card**

required

string

Allowed values: tweetsummarysummary\_large\_imageplayer

**provider**

required

string

Allowed values: twitter

**views**

number

nullable

**bookmarks**

number

nullable

**community**

object

**id**

required

string

**name**

required

string

**description**

required

string

**created\_at**

required

string

**search\_tags**

required

Array<string>

**is\_nsfw**

required

boolean

**topic**

required

string

nullable

**admin**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**creator**

object

**type**

required

Discriminator: full user profile (API v2).

string

Allowed values: profile

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

required

string

nullable

**banner\_url**

required

string

nullable

**description**

required

string

**raw\_description**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**location**

required

string

**url**

required

string

**protected**

required

boolean

**followers**

required

number

**following**

required

number

**statuses**

required

number

**media\_count**

required

number

**likes**

required

number

**joined**

required

string

**website**

required

object

**url**

required

string

**display\_url**

required

string

**birthday**

object

**day**

number

**month**

number

**year**

number

**verification**

object

**verified**

required

boolean

**type**

required

string

nullable

Allowed values: organizationgovernmentindividual

**verified\_at**

string

nullable

**identity\_verified**

boolean

**verified\_by**

string

**about\_account**

object

**based\_in**

string

nullable

**location\_accurate**

boolean

**created\_country\_accurate**

boolean

nullable

**source**

string

nullable

**username\_changes**

object

**count**

required

number

**last\_changed\_at**

required

string

nullable

**profile\_embed**

boolean

**join\_policy**

required

string

Allowed values: OpenClosed

**invites\_policy**

required

string

Allowed values: MemberInvitesAllowedMemberInvitesDisabled

**is\_pinned**

required

boolean

**article**

object

**created\_at**

required

string

**modified\_at**

string

**id**

required

string

**title**

required

string

**preview\_text**

required

string

**cover\_media**

required

object

**id**

required

string

**media\_key**

required

string

**media\_id**

required

string

**media\_info**

required

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-861)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-862)

object

**\_\_typename**

required

string

Allowed values: ApiImage

**original\_img\_height**

required

number

**original\_img\_width**

required

number

**original\_img\_url**

required

string

**color\_info**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

object

**\_\_typename**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-836)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-837)

string

Allowed values: ApiVideo

string

Allowed values: ApiGif

**type**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-838)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-839)

string

Allowed values: video

string

Allowed values: animated\_gif

**id**

required

string

**id\_str**

required

string

**ext\_alt\_text**

required

string

nullable

**ext\_media\_color**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

**media\_url**

required

string

**media\_url\_https**

required

string

**url**

required

string

**display\_url**

required

string

**expanded\_url**

required

string

**original\_info**

required

object

**height**

required

number

**width**

required

number

**sizes**

required

object

**original**

required

object

**h**

required

number

**resize**

required

string

Allowed values: fit

**w**

required

number

**video\_info**

required

object

**aspect\_ratio**

required

Array<number>

>= 2 items<= 2 items

**duration\_millis**

required

number

**variants**

required

Array<object>

object

**bitrate**

required

number

**content\_type**

required

string

**url**

required

string

**content**

required

object

**blocks**

Array<object>

default:

object

**key**

required

string

**data**

required

object

**_key_**

additional properties

nullable

**entityRanges**

required

Array<object>

object

**key**

required

number

**length**

required

number

**offset**

required

number

**inlineStyleRanges**

required

Array<object>

object

**length**

required

number

**offset**

required

number

**style**

required

string

**text**

required

string

**type**

required

string

**entityMap**

Array

default:

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-850)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-851)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-852)

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: MARKDOWN

**mutability**

required

string

Allowed values: Mutable

**data**

required

object

**entityKey**

required

string

**markdown**

required

string

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: MEDIA

**mutability**

required

string

Allowed values: Immutable

**data**

required

object

**entityKey**

required

string

**mediaItems**

required

Array<object>

object

**localMediaId**

required

string

**mediaCategory**

required

string

**mediaId**

required

string

object

**key**

required

string

**value**

required

object

**type**

required

string

Allowed values: TWEET

**mutability**

required

string

Allowed values: Immutable

**data**

required

object

**tweetId**

required

string

**media\_entities**

required

Array<object>

object

**id**

required

string

**media\_key**

required

string

**media\_id**

required

string

**media\_info**

required

Any of:

- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-863)
- [object](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-864)

object

**\_\_typename**

required

string

Allowed values: ApiImage

**original\_img\_height**

required

number

**original\_img\_width**

required

number

**original\_img\_url**

required

string

**color\_info**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

object

**\_\_typename**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-840)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-841)

string

Allowed values: ApiVideo

string

Allowed values: ApiGif

**type**

required

Any of:

- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-842)
- [string](https://docs.fxembed.com/api/twitter/operations/2profilehandlearticles/#tab-panel-843)

string

Allowed values: video

string

Allowed values: animated\_gif

**id**

required

string

**id\_str**

required

string

**ext\_alt\_text**

required

string

nullable

**ext\_media\_color**

required

object

**palette**

required

Array<object>

object

**percentage**

required

number

**rgb**

required

object

**red**

required

number

**green**

required

number

**blue**

required

number

**media\_url**

required

string

**media\_url\_https**

required

string

**url**

required

string

**display\_url**

required

string

**expanded\_url**

required

string

**original\_info**

required

object

**height**

required

number

**width**

required

number

**sizes**

required

object

**original**

required

object

**h**

required

number

**resize**

required

string

Allowed values: fit

**w**

required

number

**video\_info**

required

object

**aspect\_ratio**

required

Array<number>

>= 2 items<= 2 items

**duration\_millis**

required

number

**variants**

required

Array<object>

object

**bitrate**

required

number

**content\_type**

required

string

**url**

required

string

**is\_note\_tweet**

required

boolean

**community\_note**

required

object

**text**

required

string

**facets**

required

Array<object>

object

**type**

required

Facet kind: e.g. url, mention, hashtag, bold, media, custom\_emoji (Mastodon custom emoji image)

string

**indices**

required

Start and end UTF-16 indices

Array<number>

>= 2 items<= 2 items

**original**

string

**replacement**

string

**display**

string

**id**

string

**reposted\_by**

required

object

**id**

required

string

**name**

required

string

**screen\_name**

required

string

**avatar\_url**

string

nullable

**url**

string

**card**

object

**url**

required

string

**title**

string

**description**

string

**domain**

string

**card\_name**

string

**image**

object

**width**

number

**height**

number

**url**

string

**alt**

string

**cursor**

required

object

**top**

required

string

nullable

**bottom**

required

string

nullable

##### Example

```
{

  "results": [\
\
    {\
\
      "type": "status",\
\
      "quote": {\
\
        "type": "tombstone",\
\
        "provider": "twitter",\
\
        "reason": "deleted",\
\
        "author": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        }\
\
      },\
\
      "author": {\
\
        "type": "profile",\
\
        "verification": {\
\
          "type": "organization"\
\
        }\
\
      },\
\
      "media": {\
\
        "external": {\
\
          "type": "video"\
\
        },\
\
        "photos": [\
\
          {\
\
            "type": "photo"\
\
          }\
\
        ],\
\
        "videos": [\
\
          {\
\
            "type": "video",\
\
            "formats": [\
\
              {\
\
                "container": "mp4",\
\
                "codec": "h264"\
\
              }\
\
            ],\
\
            "publisher": {\
\
              "type": "profile",\
\
              "verification": {\
\
                "type": "organization"\
\
              }\
\
            }\
\
          }\
\
        ],\
\
        "all": [\
\
          {\
\
            "type": "photo"\
\
          }\
\
        ],\
\
        "mosaic": {\
\
          "type": "mosaic_photo"\
\
        },\
\
        "broadcast": {\
\
          "state": "LIVE",\
\
          "orientation": "landscape"\
\
        }\
\
      },\
\
      "embed_card": "tweet",\
\
      "provider": "twitter",\
\
      "community": {\
\
        "admin": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        },\
\
        "creator": {\
\
          "type": "profile",\
\
          "verification": {\
\
            "type": "organization"\
\
          }\
\
        },\
\
        "join_policy": "Open",\
\
        "invites_policy": "MemberInvitesAllowed"\
\
      },\
\
      "article": {\
\
        "cover_media": {\
\
          "media_info": {\
\
            "__typename": "ApiImage"\
\
          }\
\
        },\
\
        "content": {\
\
          "blocks": [],\
\
          "entityMap": []\
\
        },\
\
        "media_entities": [\
\
          {\
\
            "media_info": {\
\
              "__typename": "ApiImage"\
\
            }\
\
          }\
\
        ]\
\
      }\
\
    }\
\
  ]

}
```