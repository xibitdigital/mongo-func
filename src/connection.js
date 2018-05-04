import {MongoClient} from "mongodb"
import * as R from "ramda"

let connectionPool = {}

export function getConnection(connectionObject) {
  return new Promise((resolve, reject) => {
    const connectionString =
      typeof connectionObject === "string"
        ? connectionObject
        : connectionObject.connectionString
    const options =
      typeof connectionObject === "string"
        ? {}
        : R.omit(["connectionString"], connectionObject)
    let hasConnection = R.pick([connectionString], connectionPool)
    if (R.keys(hasConnection).length !== 0) {
      resolve(connectionPool[connectionString])
    } else {
      MongoClient.connect(connectionString, options, (err, client) => {
        let database = connectionString.match(/.+:\d+\/([a-z-_.]+)/i)[1]

        if (err || database === "") {
          reject(err)
        } else {
          let db = client.db(database)
          connectionPool[connectionString] = db
          resolve(db)
        }
      })
    }
  })
}

let getCollection = R.curry((collectionName, db) => {
  return db.collection(collectionName)
})

export let connectToCollection = collectionName => {
  return R.composeP(getCollection(collectionName), getConnection)
}
