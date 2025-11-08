/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('department_points_history', (table) => {
    table.increments('id').primary();
    table.integer('complaint_id').notNullable().index();
    table.string('department').notNullable().index();
    table.string('status').notNullable();
    table.integer('points_awarded').notNullable().defaultTo(0);
    table.timestamp('date').notNullable().defaultTo(knex.fn.now());
    table.unique(['complaint_id', 'status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('department_points_history');
};
