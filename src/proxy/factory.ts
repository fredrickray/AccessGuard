import { createProxyMiddleware } from "http-proxy-middleware";
import { Request, Response } from "express";
import { ServerError } from "@middlewares/error.middleware";

export function createProxy(
  target: string,
  pathRewrite?: { [key: string]: string }
) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request to: ${target}${(req as Request).url}`);
      },
      error: (err, req, res) => {
        console.error(`Error proxying request to ${target}:`, err);

        const response = res as Response;
        if (!response.headersSent) {
          throw new ServerError("Proxy Error", { err: err.message });
          response.status(500).json({
            error: "Proxy Error",
            message: "Something went wrong while proxying the request.",
          });
        }
      },
    },
  });
}
