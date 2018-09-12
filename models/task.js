export default (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [1, 50],
          msg: 'Please provide field within 1 to 50 characters.',
        },
      },
    },
    description: DataTypes.TEXT,
    AssignedToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      set(val) {
        this.setDataValue('AssignedToId', val === '' ? null : val);
      },
    },
  });

  Task.associate = (models) => {
    Task.belongsTo(models.User, { as: 'Creator' });
    Task.belongsTo(models.User, { as: 'AssignedTo' });
    Task.belongsTo(models.Status);
    Task.belongsToMany(models.Tag, { through: 'TasksTags' });
  };

  Task.loadScopes = (models) => {
    Task.addScope('withAssotiation', {
      include: [
        { model: models.User, as: 'Creator' },
        { model: models.User, as: 'AssignedTo' },
        models.Tag,
        models.Status],
    });
  };

  Task.addMethods = (models) => {
    Task.prototype.setAssocitation = async function({ model, as, querry, error }) { // eslint-disable-line
      const association = await models[model].findOne(querry);
      if (!association) {
        const validationError = new models.Sequelize.ValidationErrorItem(error.message, 'Validation error', error.path, querry);
        throw new models.Sequelize.ValidationError('customValidationError', [validationError]);
      }
      this[`set${as || model}`](association);
    };
  };
  return Task;
};
