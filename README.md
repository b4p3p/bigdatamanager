#BigDataManager#

* Indexes

```
db.datas.createIndex( { projectNames: 1, id: 1 }, { unique: true } )
db.datas.createIndex( {text: "text"} );
db.projects.createIndex( { projectNames: 1, userProject: 1 }, { unique: true } )
db.nations.createIndex( { name: 1 }, { unique: true } )
db.regions.createIndex( { 'properties.NAME_1': 1, 'properties.NAME_0': 1  }, { unique: true } )
db.tags.createIndex( { tag: 1, projectName: 1 }, { unique: true } )

```




