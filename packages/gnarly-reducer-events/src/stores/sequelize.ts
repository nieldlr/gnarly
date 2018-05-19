import sequelizeModels from '../models/sequelize'

import {
  SequelizeTypeStorer,
} from '@xlnt/gnarly-core'

const makeSequelizeTypeStore = (
  Sequelize: any,
  sequelize: any,
  key: string,
) => {
  const {
    Events,
  } = sequelizeModels(Sequelize, sequelize, key)

  // the type store
  return {
    __setup: async (reset: boolean = false) => {
      await Events.sync({ force: reset })
    },
    store: SequelizeTypeStorer(Sequelize, {
      events: Events,
    }),
  }
}

export default makeSequelizeTypeStore
