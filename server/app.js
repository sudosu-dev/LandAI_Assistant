import express from "express";
import cors from "cors";
import morgan from "morgan";
import apiRouterV1 from "#api/index";

const app = express();

app.use(express.json());

if (process.env.NODE_ENV === "development") {
  console.log(
    "Running in development mode: Permissive CORS and morgan logging enabled."
  );
  app.use(cors());
  app.use(morgan("dev"));
} else {
  const corsOptions = {
    origin: process.env.FRONTEND_URL,
  };
  console.log(
    `Production mode: Allowing requests from origin: ${process.env.FRONTEND_URL}`
  );
  app.use(cors(corsOptions));
  // ----------------------
}

app.use("/api/v1", apiRouterV1);

app.use((err, req, res, next) => {
  switch (err.code) {
    case "22P02":
      return res.status(400).send(err.message);
    case "23505":
      return res.status(400).send(err.detail);
    default:
      next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Sorry! Something went wrong.");
});

export default app;
