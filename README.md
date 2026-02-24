# user-auth

## Nodejs, Express, JWT auth

### Installation:

`npm i`


### Usage:

#### Local set up:

rename `.env.example` to `.env` and set environment variables

initialize the db:

`db:init:dev`

run the server:

`npm run dev`

open:

`http://localhost:3000`


#### Remote set up:

use `.env.example` to set environment variables

`db:init:prod`

`npm run build` and `npm run start`

---
***Default Admin is added during initialization:***
```json
{
    "email": "admin@example.com",
    "password": "password123"
}
```
---

### Endpoints:


**POST /auth/register**\
get initial `accessToken` and `refreshToken`
```json
{
  "fullname": "User",
  "birthdate": "1991-01-01",
  "email": "user@example.com",
  "password": "password123"
}
```

**POST /auth/login**\
get `accessToken` and `refreshToken`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```


**POST /auth/refresh**\
get new `accessToken` and `refreshToken`

**POST /auth/logout**\
sign out

---

Use Bearer token auth:\
`Bearer <access_token>`

### User routes:

**GET /api/users**\
list users.\
for admins only

**GET /api/users/:id**\
get user by id.\
for admins and users (self)

**PATCH /api/users/:id/block**\
deactivate user by id.\
for admins and users (self)
