export const up = (pgm) => {
  pgm.addColumns("messages", {
    context_data: {
      type: "jsonb",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns("messages", ["context_data"]);
};
