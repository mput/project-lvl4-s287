import { encrypt } from '../lib/secure';

export default (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: {
        args: true,
        msg: 'Email address already in use!',
      },
      validate: {
        isEmail: {
          msg: 'That doesn\'t looks like an email address',
        },
      },
    },
    passwordDigest: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        this.setDataValue('passwordDigest', encrypt(value));
        this.setDataValue('password', value);
        return value;
      },
      validate: {
        len: [1, +Infinity],
      },
    },
  }, {
    getterMethods: {
      fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
    },
  });

  User.associate = (models) => {
    User.hasMany(models.Task, { as: 'createdTasks', foreignKey: 'CreatorId' });
    User.hasMany(models.Task, { as: 'assignedTasks', foreignKey: 'AssignedToId' });
  };

  User.loadScopes = (models) => {
    User.addScope('withTasksCount', {
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('createdTasks.id'))), 'createdTasksCount'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('assignedTasks.id'))), 'assignedTasksCount'],
        ],
      },
      include: [{
        model: models.Task,
        as: 'createdTasks',
        attributes: [],
      },
      {
        model: models.Task,
        as: 'assignedTasks',
        attributes: [],
      }],
      group: ['User.id'],
    });
  };
  return User;
};
