# 0x04. Files manager
Creating a basic Files manager application on the console with NodeJS, ExpressJS, redis and mongoDB

## What does it do?
Read and stores files on a mongoDB database/server and interact with stored files via routes defined using expressJS

## How do I get Started?
- Install the [redis]() and [mongoDB]() servers
- Run the express app in the background: 
```
node server.js &
```
- Make a curl request to an [endpoint](##Routes) E.g:
```
$ curl 0.0.0.0:5000/status ; echo ""
{"redis":true,"db":true}
$
```

##Routes
_/status_: Retrieve the status of the redis and mongoDB servers, returns a JSON
```
$ curl 0.0.0.0:5000/status ; echo ""
{"redis":true,"db":true}
```

_/stats_: Retrieve no of users and files on the DB, returns a JSON
```
$ curl 0.0.0.0:5000/stats ; echo ""
{"users":4,"files":30}
```

_/users_: Create a new user, post a JSON data of this form: {'email': xxxx@xxx.com, 'password': xxxxx}
```
$ curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com", "password": "toto1234!" }' ; echo ""
{"id":"5f1e7d35c7ba06511e683b21","email":"bob@dylan.com"}
$
```

_/users/me_: Retrieve a user, a token in the X-token header must be passed:
```
$ curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""
{"id":"5f1e7cda04a394508232559d","email":"bob@dylan.com"}
$
```

_/connect_: Sign in the user, an basic64 auth token must be passd in the Authorization header
```
$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"031bffac-3edc-4e51-aaae-1c121317da8a"}
$
```

_/disconnect_: Sign out the user based on the generated token during sign in, also passed via the X-token header
```
$ curl 0.0.0.0:5000/disconnect -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a" ; echo ""

$
```

_/files_:
POST: Create a new file on the DB and user locale, user must be logged in to do so
GET: retrieve all users file documents for a specific parentId and with pagination
```
$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
$ curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }' ; echo ""
{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0}
$ ls /tmp/files_manager/
2a1f4fc3-687b-491a-a3d2-5808a02942c9

$ curl -XGET 0.0.0.0:5000/files?parentId=5f1e881cc7ba06511e683b23 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
[{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}]
$

```

_/files/:id_: retrieve the file document based on the ID, user must be logged in
```
$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
$ curl -XGET 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
[{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0},{"id":"5f1e881cc7ba06511e683b23","userId":"5f1e7cda04a394508232559d","name":"images","type":"folder","isPublic":false,"parentId":0},{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}]
$
```

_/files/:id/publish_: set isPublic to true on the file document based on the ID, user must be logged in
```
$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
$ curl -XGET 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":**false**,"parentId":"5f1e881cc7ba06511e683b23"}
$ curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":**true**,"parentId":"5f1e881cc7ba06511e683b23"}

```
_/files/:id/unpublish_: set isPublic to false on the file document based on the ID, user must be logged in
```
$ curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/unpublish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":**false**,"parentId":"5f1e881cc7ba06511e683b23"}
```

_/files/:id/data_: return the content of the file document based on the ID, user must be logged in:
```
$ curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=" ; echo ""
{"token":"f21fb953-16f9-46ed-8d9c-84c6450ec80f"}
$ curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" ; echo ""
Hello Webstack!

```

##Contribute
To change the port and host to which the app connects i.e make it available on the internet, see the [The Console App Interface](./server.js)
