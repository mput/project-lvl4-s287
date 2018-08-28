module.exports = {
  up: queryInterface => queryInterface.addConstraint('Users', ['email'], {
    type: 'unique',
    name: 'uniq_email',
  }),
  down: queryInterface => queryInterface.removeConstraint('Users', 'uniq_email'),
};
