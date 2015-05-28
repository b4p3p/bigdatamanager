#BigDataManager#

* Datas
```
db.datas.createIndex( { projectNames: 1, id: 1 }, { unique: true } )
```

* Projects
```
db.projects.createIndex( { projectNames: 1, userProject: 1 }, { unique: true } )
db.projects.insert( { projectName: "oim0", userProject: "oim" })
db.projects.insert( { projectName: "oim1", userProject: "oim" })
db.projects.insert( { projectName: "oim2", userProject: "oim" })
db.projects.insert( { projectName: "oim3", userProject: "oim" })
db.projects.insert( { projectName: "oim4", userProject: "oim" })
db.projects.insert( { projectName: "oim5", userProject: "oim" })
db.projects.insert( { projectName: "oim6", userProject: "oim" })
db.projects.insert( { projectName: "oim7", userProject: "oim" })
db.projects.insert( { projectName: "oim8", userProject: "oim" })
db.projects.insert( { projectName: "oim9", userProject: "oim" })
db.projects.insert( { projectName: "oim10", userProject: "oim" })
db.projects.insert( { projectName: "oim11", userProject: "oim" })
db.projects.insert( { projectName: "oim12", userProject: "oim" })
db.projects.insert( { projectName: "oim13", userProject: "oim" })
db.projects.insert( { projectName: "oim14", userProject: "oim" })
db.projects.insert( { projectName: "oim15", userProject: "oim" })
db.projects.insert( { projectName: "oim16", userProject: "oim" })
db.projects.insert( { projectName: "oim17", userProject: "oim" })
db.projects.insert( { projectName: "oim18", userProject: "oim" })
db.projects.insert( { projectName: "oim19", userProject: "oim" })
```

* Nations:
```
db.nations.createIndex( { name: 1 }, { unique: true } )
db.nations.insert( [ { name: "italy" }, {name: "france" }, {name: "spain" } ])
```

* Regions:
```
db.regions.createIndex( { 'properties.NAME_1': 1, 'properties.NAME_0': 1  }, { unique: true } )
```

* Tags:
```
db.tags.createIndex( { tag: 1, projectName: 1 }, { unique: true } )
db.tags.insert( [ 
    {projectName: "oim", tag:"omofobia" }, 
    {projectName: "oim", tag:"donne" },
    {projectName: "oim", tag:"razzismo" },
    {projectName: "oim", tag:"diversità" }
])
```
* ricerca intervallo

```
db.datas.aggregate([
{
    $group:{
      _id:"$item",
      date:{$min:"date"}
    }
}
])

db.datas.aggregate(
  { $group: { 
        _id : "$name",
        data_min: {$min: "$date"},
        data_max: {$max: "$date"}
     }
  }
)

```

* ricerca spaziale

```
db.addr_poly.find({
    loc:{
        $geoIntersects: {
            $geometry: {
              type: "Point" ,
              coordinates: [1, 1]
            }
         }
     }
});

db.geo.find({
    "loc": {
        "$geoWithin": {
            "$geometry":{
                "type": "MultiPolygon",
                "coordinates": [
                    [[ [ 0, 0 ], [ 0, 25 ], [ 25, 25 ], [ 25, 0 ], [ 0, 0 ] ]],
                    [[ [ 40, 40 ], [ 40, 75 ], [ 75, 75 ], [ 75, 40 ], [ 40, 40 ] ]],
                    [[ [ 80, 80 ], [ 80, 90 ], [ 90, 90 ], [ 90, 80 ], [ 80, 80 ] ]]
                ]
            }
        }
    }
})

```



