module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Tags', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }).then(() => queryInterface.createTable('TasksTags', {
    TaskId: {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: 'Tasks',
        key: 'id',
      },
      onDelete: 'set null',
    },
    TagId: {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: 'Tags',
        key: 'id',
      },
      onDelete: 'set null',
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  })),
  down: queryInterface => queryInterface.dropTable('TasksTags').then(() => queryInterface.dropTable('Tags')),
};
