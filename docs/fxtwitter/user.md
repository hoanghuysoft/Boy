[Skip to content](https://docs.fxembed.com/api/twitter/operations/2profilehandle/#_top)

# Get user profile

GET

/2/profile/{handle}

Select code sampleFetchcURL

```
const url = 'https://api.fxtwitter.com/2/profile/X?about_account=1';

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

  --url 'https://api.fxtwitter.com/2/profile/X?about_account=1'
```

- FxTwitter API host

Returns profile fields for a user. Optional `about_account` / `aboutAccount` (truthy) adds `about_account` on the user when available.

## Parameters

[Section titled “Parameters”](https://docs.fxembed.com/api/twitter/operations/2profilehandle/#parameters)

### Path Parameters

[Section titled “Path Parameters”](https://docs.fxembed.com/api/twitter/operations/2profilehandle/#path-parameters)

**handle**

required

string

##### Example

```
X
```

Username without @, or numeric user id as `id:<rest_id>` (e.g. `id:783214`). Case-insensitive `id:` prefix.

### Query Parameters

[Section titled “Query Parameters”](https://docs.fxembed.com/api/twitter/operations/2profilehandle/#query-parameters)

**about\_account**

string

##### Example

```
1
```

If truthy, include `about_account` on author when available

**aboutAccount**

string

Alias for about\_account

## Responses

[Section titled “Responses”](https://docs.fxembed.com/api/twitter/operations/2profilehandle/#responses)

### 200

[Section titled “200”](https://docs.fxembed.com/api/twitter/operations/2profilehandle/#200)

Profile (check `code`)

Media typeapplication/json

object

**code**

required

number

**message**

required

string

**user**

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

**reason**

Set to `suspended` when the user is suspended; omitted for plain not found.

string

Allowed values: suspended

**id**

Numeric user id when the upstream payload includes it.

string

##### Example

```
{

  "user": {

    "type": "profile",

    "verification": {

      "type": "organization"

    }

  },

  "reason": "suspended"

}
```

### 400

[Section titled “400”](https://docs.fxembed.com/api/twitter/operations/2profilehandle/#400)

Invalid path or query parameters

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

[Section titled “404”](https://docs.fxembed.com/api/twitter/operations/2profilehandle/#404)

User not found, suspended (`reason`: `suspended`, `message`: User is suspended), or unavailable

Media typeapplication/json

object

**code**

required

number

**message**

required

string

**user**

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

**reason**

Set to `suspended` when the user is suspended; omitted for plain not found.

string

Allowed values: suspended

**id**

Numeric user id when the upstream payload includes it.

string

##### Example

```
{

  "user": {

    "type": "profile",

    "verification": {

      "type": "organization"

    }

  },

  "reason": "suspended"

}
```