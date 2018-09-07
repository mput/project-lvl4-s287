export default (sequelize, DataTypes) => {
  const Status = sequelize.define('Status', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'Such a status already exists',
      },
      validate: {
        len: {
          args: [3, 50],
          msg: 'Please provide field within 3 to 50 characters.',
        },
      },
    },
  });

  Status.associate = (models) => {
    Status.hasMany(models.Task);
  };

  Status.loadScopes = (models) => {
    Status.addScope('withTasksCount', {
      attributes: { include: [[sequelize.fn('COUNT', sequelize.col('Tasks.id')), 'tasksCount']] },
      include: [{
        model: models.Task,
        attributes: [],
      }],
      group: ['Status.id'],
    });
  };

  return Status;
};
