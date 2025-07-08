export const up = (pgm) => {
  pgm.addColumns("messages", {
    document_id: {
      type: "integer",
      references: "documents",
      onDelete: "SET NULL",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns("messages", ["document_id"]);
};
