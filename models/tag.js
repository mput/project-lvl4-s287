export default (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'Such a tag already exists',
      },
      validate: {
        len: {
          args: [1, 50],
          msg: 'Please provide field within 1 to 50 characters.',
        },
      },
    },
  });

  Tag.associate = (models) => {
    Tag.belongsToMany(models.Task, { through: 'TasksTags' });
  };
  return Tag;
};
