const Sequelize = require('sequelize');

module.exports = class SQLiteDB {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: 'config/curate.sqlite',
      define: { timestamps: false }
    });

    class UserPair extends Sequelize.Model {}
    
    UserPair.init({
      discordID: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      lbryID: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      }
    }, { sequelize: this.sequelize, modelName: 'user' });
    UserPair.sync();
    this.model = UserPair;
  }

  /**
   * Gets a pair from a Discord ID
   * @param {string} id 
   */
  async get(id) {
    const item = await this.model.findOne({ where: { discordID: id } });
    return item ? item.get({ plain: true }) : null;
  }

  /**
   * Creates an ID pair
   * @param {string} discordID 
   * @param {string} lbryID 
   */
  pair(discordID, lbryID) {
    return this.model.create({ discordID, lbryID });
  }
};