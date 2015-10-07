#BigDataManager#

##Installazione##
* Effettuare una pull dal repository
* Lanciare i seguenti comandi

```
bower install
npm install
```

N.B.
prima di lanciare npm install verificare che mongo db sia spento (bug riscontrato)

##Primo Avvio##

* Avviare mongo

```
mongod --setParameter textSearchEnabled=true
```

* In fase di debug molto utile settare:

```
db.setProfilingLevel(0, 10000)
```


* Indexes

```
db.users.createIndex( { username: 1 }, { unique: true } )

db.datas.createIndex(
   { text : "text" },
   { default_language: "italian" },
   { language_override: "ln" }
)

db.datas.createIndex( {projectName: 1} );

db.summaries.createIndex( {project: 1} );

db.projects.createIndex( {projectName: 1 }, { unique: true } )

db.nations.createIndex( { name: 1 }, { unique: true } )

db.regions.createIndex( { 'properties.NAME_1': 1, 'properties.NAME_0': 1  }, { unique: true } )

db.tags.createIndex( { tag: 1, projectName: 1 }, { unique: true } )

```

Creazione utenti
----------------
```
db.users.insert({username:'oim', password:'oim', level:1, firstName:'oim', lastName:'oim', created:new Date()})
db.users.insert({username:'user', password:'user', level:0, firstName:'user', lastName:'user', created:new Date()})
```

Demonizzare node
----------------

* installare upstarter
* creare in /etc/init il seguente file

```
#!upstart
description "bigDataManager"

start on started mountall
stop on shutdown

# Automatically Respawn:
respawn
respawn limit 99 5

env NODE_ENV=production

exec node /home/giuseppe/node/bigdatamanager/bin/www >> /var/log/bigDataManager.log 2>&1
```

* lanciare il servizio creato con: sudo service bigDataManager start


enjoy!





