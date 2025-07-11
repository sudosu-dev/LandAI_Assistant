/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable("roles", {
    id: "id",
    name: { type: "varchar(50)", notNull: true, unique: true },
    permission_level: { type: "integer", notNull: true },
  });

  pgm.createTable("users", {
    id: "id",
    email: { type: "varchar(255)", notNull: true, unique: true },
    password_hash: { type: "varchar(255)", notNull: true },
    first_name: { type: "varchar(100)" },
    last_name: { type: "varchar(100)" },
    company: { type: "varchar(255)" },
    role_id: { type: "integer", references: '"roles"', onDelete: "SET NULL" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("conversations", {
    id: "id",
    user_id: { type: "integer", references: '"users"', onDelete: "CASCADE" },
    title: { type: "varchar(255)" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("documents", {
    id: "id",
    user_id: { type: "integer", references: '"users"', onDelete: "CASCADE" },
    conversation_id: {
      type: "integer",
      references: '"conversations"',
      onDelete: "CASCADE",
    },
    filename: { type: "varchar(255)", notNull: true },
    file_path: { type: "varchar(500)", notNull: true },
    file_type: { type: "varchar(50)" },
    file_size: { type: "integer" },
    upload_date: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("messages", {
    id: "id",
    conversation_id: {
      type: "integer",
      references: '"conversations"',
      onDelete: "CASCADE",
    },
    role_id: { type: "integer", references: '"roles"', onDelete: "SET NULL" },
    content: { type: "text", notNull: true },
    agent_type: { type: "varchar(50)" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("seed_market_data", {
    id: "id",
    county: { type: "varchar(100)", notNull: true },
    transaction_date: { type: "date" },
    doc_stamps: { type: "decimal(12, 2)" },
    net_mineral_acres: { type: "decimal(10, 4)" },
    price_per_acre: { type: "decimal(10, 2)", notNull: true },
    source: { type: "varchar(100)" },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  // Drop tables in reverse order of creation
  pgm.dropTable("seed_market_data");
  pgm.dropTable("messages");
  pgm.dropTable("documents");
  pgm.dropTable("conversations");
  pgm.dropTable("users");
  pgm.dropTable("roles");
};
