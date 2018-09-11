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

    default: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      unique: {
        args: true,
        msg: 'There can be only one default status',
      },
      set(val) {
        this.setDataValue('default', val === true ? val : null);
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

    Status.addScope('defaultScope', {
      order: ['default', 'createdAt'],
    }, {
      override: true,
    });
  };

  return Status;
};
