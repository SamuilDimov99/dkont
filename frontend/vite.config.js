import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const TASK_STATE_PATH = path.resolve(__dirname, "../task-state.json");

function taskStatePlugin() {
  return {
    name: "task-state",
    configureServer(server) {
      server.middlewares.use("/task-state.json", (req, res) => {
        if (req.method === "GET") {
          try {
            const data = fs.existsSync(TASK_STATE_PATH) ? fs.readFileSync(TASK_STATE_PATH, "utf-8") : "{}";
            res.setHeader("Content-Type", "application/json");
            res.end(data);
          } catch {
            res.statusCode = 500;
            res.end("{}");
          }
        } else if (req.method === "PUT") {
          let body = "";
          req.on("data", (chunk) => { body += chunk; });
          req.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              fs.writeFileSync(TASK_STATE_PATH, `${JSON.stringify(parsed, null, 2)}\n`);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(parsed));
            } catch {
              res.statusCode = 400;
              res.end("{}");
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), taskStatePlugin()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true,
      },
      "/maps": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true,
      },
    },
  },
});
