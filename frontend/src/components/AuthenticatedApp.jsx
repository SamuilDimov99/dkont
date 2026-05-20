import { AdminAuthenticatedApp } from "./AdminAuthenticatedApp.jsx";
import { ClientAuthenticatedApp } from "./ClientAuthenticatedApp.jsx";
import { DriverAuthenticatedApp } from "./DriverAuthenticatedApp.jsx";
import { OfficeWorkerAuthenticatedApp } from "./OfficeWorkerAuthenticatedApp.jsx";

export function AuthenticatedApp(props) {
  if (props.session.role === "ADMIN") {
    return <AdminAuthenticatedApp {...props} />;
  }
  if (props.session.role === "EMPLOYEE" && props.session.employeeType === "COURIER") {
    return <DriverAuthenticatedApp {...props} />;
  }
  if (props.session.role === "EMPLOYEE") {
    return <OfficeWorkerAuthenticatedApp {...props} />;
  }
  return <ClientAuthenticatedApp {...props} />;
}
