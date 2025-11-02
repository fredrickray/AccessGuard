import jwt from "jsonwebtoken";
import * as settings from "@config/settings.json";
import { Request } from "express";

const verifyJwt = (req: Request) => {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.split(" ")[1];

  try {
    return jwt.verify(token, settings.jwt.secret, {
      issuer: settings.jwt.issuer,
    });
  } catch (e) {
    return null;
  }
};

export default verifyJwt;
