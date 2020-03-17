require('dotenv').config({ path: '.env' });

const knex = require('knex')({
	client: 'pg',
	connection: {
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_READ_USER,
		password: process.env.DB_READ_PASSWORD,
		database: process.env.DB_NAME
	}
});

module.exports.db = (oath) => {
	if (oath != 'user') {
		knex.client.config.connection.user = process.env.DB_WRITE_USER
		knex.client.config.connection.password = process.env.DB_WRITE_PASSWORD
		knex.client.connectionSettings.user = process.env.DB_WRITE_USER
		knex.client.connectionSettings.password = process.env.DB_WRITE_PASSWORD
	}

	return knex;
}