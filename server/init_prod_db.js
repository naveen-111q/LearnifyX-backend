const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    port: 4000,
    user: '3H3akBGnKbqrb2v.root',
    password: 'SSK40Dp8aK0P1Z0E',
    database: 'test',
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
};

async function initialize() {
    console.log('Connecting to TiDB Cloud...');
    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connected successfully!');

        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        // Remove CREATE DATABASE and USE statements as we are using the 'test' database provided
        const commands = schema
            .replace(/CREATE DATABASE IF NOT EXISTS exam_system;/g, '')
            .replace(/USE exam_system;/g, '')
            .split(';')
            .filter(cmd => cmd.trim().length > 0);

        console.log(`Executing ${commands.length} commands...`);

        for (let cmd of commands) {
            try {
                await connection.query(cmd);
                console.log('Executed:', cmd.trim().substring(0, 50) + '...');
            } catch (err) {
                console.warn('Command failed (skipping):', cmd.trim().substring(0, 50), err.message);
            }
        }

        console.log('Database initialization complete!');
    } catch (err) {
        console.error('Initialization failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

initialize();
