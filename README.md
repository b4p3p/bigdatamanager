#BigDataManager#

* Avvio mongo

 mongod --setParameter textSearchEnabled=true

* Indexes

```
db.users.createIndex( { username: 1 }, { unique: true } )

db.datas.createIndex( {sprojectName: 1, id: 1 }, { unique: true } )

db.datas.createIndex(
   { text : "text" },
   { default_language: "italian" },
   { language_override: "ln" }
)

db.datas.createIndex( {projectName: 1} );

db.projects.createIndex( { projectNames: 1, userProject: 1 }, { unique: true } )

db.nations.createIndex( { name: 1 }, { unique: true } )

db.regions.createIndex( { 'properties.NAME_1': 1, 'properties.NAME_0': 1  }, { unique: true } )

db.tags.createIndex( { tag: 1, projectName: 1 }, { unique: true } )

```




