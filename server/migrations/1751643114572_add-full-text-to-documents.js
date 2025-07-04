export const up = (pgm) => {
  pgm.addColumns("documents", {
    full_text: {
      type: "text",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns("documents", ["full_text"]);
};
