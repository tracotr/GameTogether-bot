module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		user_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		game_list: {
			type: DataTypes.JSON,
            allowNull: true,
		},
	}, {
		timestamps: false,
	});
};