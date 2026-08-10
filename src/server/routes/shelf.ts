import { Router } from "express";
import { requirePageAuth } from "../lib/pageAuth.ts";

export const shelfRouter = Router();

shelfRouter.use(requirePageAuth);

shelfRouter.get("/", (req, res) => {
  res.render("shelf", {
    user: req.sessionUser,
    assets: {
      js: "/assets/shelf.js",
      css: ["/assets/shared.css", "/assets/shelf.css"],
    },
  });
});
