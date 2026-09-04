require('dotenv').config()

const mongoose = require('mongoose')

const LEGACY_INDEX_NAME = 'slug_1'

const removeLegacySlugIndex = async () => {
  let database

  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not configured.')
    }

    await mongoose.connect(process.env.MONGO_URI)
    database = mongoose.connection.db

    const shops = database.collection('shops')
    const indexes = await shops.indexes()
    const legacyIndex = indexes.find((index) => index.name === LEGACY_INDEX_NAME)

    if (legacyIndex) {
      await shops.dropIndex(LEGACY_INDEX_NAME)
    }

    const remainingIndexes = await shops.indexes()
    console.log(JSON.stringify({
      database: database.databaseName,
      slug_1_exists: Boolean(legacyIndex),
      slug_1_removed: Boolean(legacyIndex),
      remaining_shop_indexes: remainingIndexes.map((index) => index.name),
    }, null, 2))
  } catch {
    console.error('Legacy slug index migration failed.')
    process.exitCode = 1
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }
  }
}

removeLegacySlugIndex()