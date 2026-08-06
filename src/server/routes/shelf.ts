import { Router } from "express";

export const shelfRouter = Router();

shelfRouter.get("/", (_req, res) => {
  res.render("shelf", {
    assets: {
      js: "/assets/shelf.js",
      css: ["/assets/shared.css", "/assets/shelf.css"],
    },
  });
});
