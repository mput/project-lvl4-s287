export default (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
  });

  Task.associate = (models) => {
    Task.belongsTo(models.User, { as: 'creator' });
    Task.belongsTo(models.User, { as: 'assignedTo' });
    Task.belongsTo(models.Status);
  };
  return Task;
};
