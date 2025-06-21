#!/usr/bin/env node

/**
 * Database Statistics Script
 * 
 * This script provides information about the database structure,
 * including tables, columns, and their data types.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const chalk = require('chalk');
const Table = require('cli-table3');

// Create a new connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      freezeTableName: true,
      underscored: true,
      quoteIdentifiers: false
    }
  }
);

/**
 * Get information about all tables in the database
 */
async function getDatabaseStats() {
  try {
    console.log(chalk.blue.bold('\n📊 Database Statistics\n'));
    
    // Get all tables in the public schema
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );

    // Create a table for the list of tables
    const tablesTable = new Table({
      head: [chalk.cyan.bold('Table Name'), chalk.cyan.bold('Row Count')],
      colWidths: [30, 15],
      style: { head: ['cyan'] }
    });

    // For each table, get its structure and row count
    for (const { tablename } of tables) {
      if (tablename === 'spatial_ref_sys') continue; // Skip PostGIS system table
      
      try {
        // Get row count
        const [countResult] = await sequelize.query(
          `SELECT COUNT(*) FROM "${tablename}"`,
          { type: sequelize.QueryTypes.SELECT }
        );
        const rowCount = countResult.count || '0';
        
        tablesTable.push([chalk.yellow(tablename), rowCount]);
      } catch (error) {
        console.error(`Error getting info for table ${tablename}:`, error.message);
        tablesTable.push([chalk.red(tablename), 'Error']);
      }
    }

    console.log(chalk.cyan.bold('\n📋 Database Tables:\n'));
    console.log(tablesTable.toString());

    // Show table structures
    for (const { tablename } of tables) {
      if (tablename === 'spatial_ref_sys') continue;
      
      try {
        // Get table columns
        const [columns] = await sequelize.query(
          `SELECT column_name, data_type, is_nullable, column_default 
           FROM information_schema.columns 
           WHERE table_name = '${tablename}'
           ORDER BY ordinal_position`
        );

        if (columns.length > 0) {
          const table = new Table({
            head: [
              chalk.cyan.bold('Column'), 
              chalk.cyan.bold('Type'), 
              chalk.cyan.bold('Nullable'),
              chalk.cyan.bold('Default')
            ],
            colWidths: [25, 25, 10, 30],
            style: { head: ['cyan'] }
          });

          columns.forEach(col => {
            table.push([
              chalk.yellow(col.column_name),
              col.data_type,
              col.is_nullable === 'YES' ? 'Yes' : 'No',
              col.column_default || 'NULL'
            ]);
          });

          console.log(`\n📋 Table: ${chalk.green.bold(tablename)}\n`);
          console.log(table.toString());
        }
      } catch (error) {
        console.error(`\n❌ Error getting columns for table ${tablename}:`, error.message);
      }
    }

    // Get foreign key constraints
    console.log('\n🔗 Foreign Key Constraints:\n');
    try {
      const [constraints] = await sequelize.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY';
      `);

      if (constraints.length > 0) {
        const fkTable = new Table({
          head: [
            chalk.cyan.bold('Table'),
            chalk.cyan.bold('Column'),
            chalk.cyan.bold('References'),
            chalk.cyan.bold('Referenced Column')
          ],
          colWidths: [20, 20, 20, 20],
          style: { head: ['cyan'] }
        });

        constraints.forEach(constraint => {
          fkTable.push([
            constraint.table_name,
            constraint.column_name,
            constraint.foreign_table_name,
            constraint.foreign_column_name
          ]);
        });

        console.log(fkTable.toString());
      } else {
        console.log('No foreign key constraints found.');
      }
    } catch (error) {
      console.error('Error getting foreign key constraints:', error.message);
    }

  } catch (error) {
    console.error('❌ Error getting database stats:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
getDatabaseStats();
