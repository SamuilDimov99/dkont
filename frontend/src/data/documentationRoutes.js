export const documentationRoutes = [
  {
    path: "/documentation",
    title: "Overview",
    eyebrow: "Developer documentation",
    sections: [
      ["Purpose", "Dkont is an educational logistics management application for clients, employees, offices, shipments, pricing, role-based views, and reports."],
      ["Runtime", "The backend is a Spring Boot REST API with PostgreSQL storage. The frontend is a React and Vite application that talks to the API through the Vite proxy."],
      ["Access", "The public app starts at the login screen. Developer-only pages are available directly at /checklist, /assignment, and /documentation when enabled."],
    ],
  },
  {
    path: "/documentation/api",
    title: "API",
    eyebrow: "Backend routes",
    sections: [
      ["Authentication", "POST /login accepts username and password, then returns the user id, username, email, role, and optional client id. POST /api/register creates a client session."],
      ["Data", "GET /api/snapshot returns the current companies, offices, employees, clients, and shipments used by the React UI after login."],
      ["Operations", "POST /api/shipments creates shipments, POST /api/shipments/{id}/deliver marks a shipment delivered, and DELETE /api/{resource}/{id} removes supported resources."],
      ["Reports", "GET /api/reports accepts optional from and to dates and returns revenue, open shipments, and shipment totals for the selected range."],
    ],
  },
  {
    path: "/documentation/frontend",
    title: "Frontend",
    eyebrow: "React routes",
    sections: [
      ["App shell", "The main authenticated interface is built with React Router. The Dkont logo is bundled from frontend/src/assets/images."],
      ["Dashboard", "Anonymous users cannot see dashboard data. A successful login loads the API snapshot and opens the dashboard view."],
      ["Role views", "Admin and employee roles can manage operational data. Client views filter shipments to records where the selected client is the sender or receiver."],
    ],
  },
  {
    path: "/documentation/development",
    title: "Development",
    eyebrow: "Local workflow",
    sections: [
      ["Backend", "Run mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8082 from the project root."],
      ["Frontend", "Run npm run dev from the frontend directory and open http://localhost:5173."],
      ["Verification", "Use mvn test for backend tests and npm run build from frontend to validate the React bundle."],
      ["Seed users", "Demo users include admin / admin, plus elena, nikolay, maria, ivan, and stella with password demo."],
    ],
  },
];
