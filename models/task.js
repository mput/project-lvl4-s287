export default (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
  });

  Task.associate = (models) => {
    Task.belongsTo(models.User, { as: 'Creator' });
    Task.belongsTo(models.User, { as: 'AssignedTo' });
    Task.belongsTo(models.Status);
  };
  return Task;
};
