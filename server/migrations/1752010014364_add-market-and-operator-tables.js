/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Create the table for Oklahoma County Records data
  pgm.createTable("market_data", {
    id: "id",
    county: { type: "varchar(100)", notNull: true },
    doc_stamps: { type: "decimal(12, 2)" },
    net_mineral_acres: { type: "decimal(10, 4)" },
    price_per_acre: { type: "decimal(10, 2)" },
    transaction_date: { type: "date" },
    source_url: { type: "text" },
    scraped_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Create the table for Oklahoma Corporation Commission data
  pgm.createTable("operator_activity", {
    id: "id",
    operator_name: { type: "varchar(200)", notNull: true },
    county: { type: "varchar(100)", notNull: true },
    permit_number: { type: "varchar(50)" },
    permit_date: { type: "date" },
    well_location: { type: "text" },
    scraped_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("market_data");
  pgm.dropTable("operator_activity");
};
