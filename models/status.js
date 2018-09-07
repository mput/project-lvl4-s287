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

  return Status;
};
