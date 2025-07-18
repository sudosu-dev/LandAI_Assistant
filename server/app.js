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
  const frontendUrl = process.env.FRONTEND_URL;

  const corsOptions = {
    origin: function (origin, callback) {
      console.log(`[CORS] Request Origin: ${origin}`);
      console.log(`[CORS] Whitelisted URL: ${frontendUrl}`);

      if (!origin || origin === frontendUrl) {
        console.log("[CORS] Origin is allowed. Allowing request.");
        callback(null, true);
      } else {
        console.error(
          "[CORS] Origin does not match whitelist. Blocking request."
        );
        callback(new Error("Not allowed by CORS"));
      }
    },
  };
  app.use(cors(corsOptions));
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
