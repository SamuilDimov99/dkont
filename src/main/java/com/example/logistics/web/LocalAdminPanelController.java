package com.example.logistics.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Controller
public class LocalAdminPanelController {

    private final boolean enabled;

    public LocalAdminPanelController(@Value("${admin.local-panel.enabled:false}") boolean enabled) {
        this.enabled = enabled;
    }

    @GetMapping(value = "/local-admin", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> localAdmin(HttpServletRequest request) {
        if (!enabled) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Local admin panel is disabled.");
        }
        if (!isLocalhost(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Local admin panel is only available from localhost.");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(ADMIN_PANEL_HTML);
    }

    private boolean isLocalhost(HttpServletRequest request) {
        String remoteAddress = request.getRemoteAddr();
        if ("127.0.0.1".equals(remoteAddress) || "0:0:0:0:0:0:0:1".equals(remoteAddress) || "::1".equals(remoteAddress)) {
            return true;
        }
        try {
            return InetAddress.getByName(remoteAddress).isLoopbackAddress();
        } catch (UnknownHostException exception) {
            return false;
        }
    }

    private static final String ADMIN_PANEL_HTML = """
            <!doctype html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Dkont Local Admin</title>
              <style>
                * { box-sizing: border-box; }
                body { margin: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; }
                main { width: min(980px, calc(100vw - 32px)); margin: 32px auto; display: grid; gap: 20px; }
                header { display: flex; justify-content: space-between; align-items: end; gap: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 16px; }
                h1, h2 { margin: 0; }
                h1 { font-size: 28px; }
                h2 { font-size: 18px; }
                p { margin: 6px 0 0; color: #475569; }
                section { background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; display: grid; gap: 14px; }
                form { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-items: end; }
                label { display: grid; gap: 6px; font-size: 13px; font-weight: 650; color: #334155; }
                input, select { width: 100%; min-height: 38px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; font: inherit; }
                button { min-height: 38px; border: 0; border-radius: 6px; padding: 8px 12px; background: #0f172a; color: white; font-weight: 700; cursor: pointer; }
                button.secondary { background: #e2e8f0; color: #0f172a; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 14px; }
                th { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
                .toolbar { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
                .message { min-height: 22px; color: #475569; }
                .error { color: #b91c1c; }
                @media (max-width: 760px) {
                  header, .toolbar { align-items: stretch; flex-direction: column; }
                  form { grid-template-columns: 1fr; }
                  table { display: block; overflow-x: auto; }
                }
              </style>
            </head>
            <body>
              <main>
                <header>
                  <div>
                    <h1>Dkont Local Admin</h1>
                    <p>Available only when opened from localhost. Uses GET and POST requests to /api/user.</p>
                  </div>
                  <button class="secondary" type="button" id="refresh">Refresh users</button>
                </header>

                <section>
                  <h2>Create user</h2>
                  <form id="createUser">
                    <label>Username<input name="username" autocomplete="off" required></label>
                    <label>Password<input name="passwordHash" type="password" required></label>
                    <label>Email<input name="email" type="email" required></label>
                    <label>Role<select name="role"><option>ADMIN</option><option>EMPLOYEE</option><option>CLIENT</option></select></label>
                    <button type="submit">Create user</button>
                  </form>
                  <div class="message" id="message"></div>
                </section>

                <section>
                  <div class="toolbar">
                    <h2>Users</h2>
                    <span class="message" id="count"></span>
                  </div>
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Username</th><th>Email</th><th>Name</th><th>Role</th><th>Created</th></tr>
                    </thead>
                    <tbody id="users"></tbody>
                  </table>
                </section>
              </main>

              <script>
                const usersBody = document.getElementById("users");
                const message = document.getElementById("message");
                const count = document.getElementById("count");

                async function request(url, options = {}) {
                  const response = await fetch(url, {
                    headers: { "Content-Type": "application/json" },
                    ...options
                  });
                  if (!response.ok) throw new Error(await response.text());
                  if (response.status === 204) return null;
                  return response.json();
                }

                function showMessage(text, isError = false) {
                  message.textContent = text;
                  message.className = isError ? "message error" : "message";
                }

                function renderUsers(users) {
                  count.textContent = `${users.length} user${users.length === 1 ? "" : "s"}`;
                  usersBody.innerHTML = users.map((user) => `
                    <tr>
                      <td>${escapeHtml(user.id)}</td>
                      <td>${escapeHtml(user.username)}</td>
                      <td>${escapeHtml(user.email)}</td>
                      <td>${escapeHtml(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim())}</td>
                      <td>${escapeHtml(user.role)}</td>
                      <td>${escapeHtml(user.createdAt ?? "")}</td>
                    </tr>
                  `).join("");
                }

                function escapeHtml(value) {
                  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;"
                  }[char]));
                }

                async function loadUsers() {
                  showMessage("Loading users...");
                  const users = await request("/api/user");
                  renderUsers(users);
                  showMessage("Users loaded.");
                }

                document.getElementById("refresh").addEventListener("click", () => {
                  loadUsers().catch((error) => showMessage(error.message, true));
                });

                document.getElementById("createUser").addEventListener("submit", async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const payload = Object.fromEntries(new FormData(form));
                  try {
                    await request("/api/user", {
                      method: "POST",
                      body: JSON.stringify(payload)
                    });
                    form.reset();
                    await loadUsers();
                    showMessage("User created.");
                  } catch (error) {
                    showMessage(error.message, true);
                  }
                });

                loadUsers().catch((error) => showMessage(error.message, true));
              </script>
            </body>
            </html>
            """;
}
