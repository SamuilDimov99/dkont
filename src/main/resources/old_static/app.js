const state = {
    data: null,
    role: "ADMIN",
    clientId: null,
};

const labels = {
    TO_OFFICE: "до офис",
    TO_ADDRESS: "до адрес",
    REGISTERED: "регистрирана",
    IN_TRANSIT: "в движение",
    DELIVERED: "получена",
    CANCELLED: "отказана",
    COURIER: "куриер",
    OFFICE_EMPLOYEE: "офис служител",
};

const api = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!response.ok) throw new Error(await response.text());
    if (response.status === 204) return null;
    return response.json();
};

const byId = (collection, id) => collection.find((item) => item.id === Number(id));
const clientName = (id) => {
    const client = byId(state.data.clients, id);
    return client ? `${client.firstName} ${client.lastName}` : `#${id}`;
};

const employeeName = (id) => {
    const employee = byId(state.data.employees, id);
    return employee ? `${employee.firstName} ${employee.lastName}` : `#${id}`;
};

const money = (value) => `${Number(value || 0).toFixed(2)} лв.`;

async function load() {
    state.data = await api("/api/snapshot");
    if (!state.clientId && state.data.clients.length) state.clientId = state.data.clients[0].id;
    render();
}

function render() {
    renderRoleControls();
    renderDashboard();
    renderForms();
    renderTables();
    renderShipments();
    renderReports();
}

function renderRoleControls() {
    document.querySelectorAll("[data-admin]").forEach((button) => {
        button.hidden = state.role === "CLIENT";
    });
    document.getElementById("clientFilterLabel").hidden = state.role !== "CLIENT";
    const clientFilter = document.getElementById("clientFilter");
    clientFilter.innerHTML = state.data.clients.map((client) => `<option value="${client.id}">${client.firstName} ${client.lastName}</option>`).join("");
    clientFilter.value = state.clientId;
}

function renderDashboard() {
    const shipments = visibleShipments();
    document.getElementById("shipmentCount").textContent = shipments.length;
    document.getElementById("openCount").textContent = shipments.filter((item) => !["DELIVERED", "CANCELLED"].includes(item.status)).length;
    document.getElementById("clientCount").textContent = state.data.clients.length;
    document.getElementById("employeeCount").textContent = state.data.employees.length;
    const company = state.data.companies[0];
    document.getElementById("companyInfo").innerHTML = [
        ["Име", company.name],
        ["Адрес", company.address],
        ["Телефон", company.phone],
        ["Имейл", company.email],
    ].map(([key, value]) => `<div><span>${key}</span><strong>${value}</strong></div>`).join("");
}

function renderForms() {
    document.getElementById("shipmentForm").innerHTML = `
        ${selectField("senderClientId", "Подател", state.data.clients, "firstName")}
        ${selectField("receiverClientId", "Получател", state.data.clients, "firstName")}
        ${selectField("registeredByEmployeeId", "Регистрирал", state.data.employees, "firstName")}
        ${selectField("courierId", "Куриер", state.data.employees.filter((item) => item.employeeType === "COURIER"), "firstName")}
        ${selectField("sourceOfficeId", "Начален офис", state.data.offices, "name")}
        ${selectField("destinationOfficeId", "Краен офис", state.data.offices, "name")}
        <label>Тип доставка<select name="deliveryType"><option value="TO_OFFICE">до офис</option><option value="TO_ADDRESS">до адрес</option></select></label>
        <label>Статус<select name="status"><option value="REGISTERED">регистрирана</option><option value="IN_TRANSIT">в движение</option><option value="DELIVERED">получена</option><option value="CANCELLED">отказана</option></select></label>
        <label>Тегло, кг<input name="weight" type="number" min="0.1" step="0.1" value="1.0" required></label>
        <label class="wide">Адрес за доставка<input name="deliveryAddress" placeholder="попълва се при доставка до адрес"></label>
        <button class="wide">Запази пратка</button>
    `;
    document.getElementById("clientForm").innerHTML = `
        <label>Име<input name="firstName" required></label>
        <label>Фамилия<input name="lastName" required></label>
        <label>Телефон<input name="phone" required></label>
        <label>Имейл<input name="email" type="email" required></label>
        <label class="wide">Адрес<input name="address" required></label>
        <button class="wide">Добави клиент</button>
    `;
    document.getElementById("employeeForm").innerHTML = `
        <label>Име<input name="firstName" required></label>
        <label>Фамилия<input name="lastName" required></label>
        <label>Потребител ID<input name="userId" type="number" value="1" required></label>
        ${selectField("officeId", "Офис", state.data.offices, "name")}
        <label>Тип<select name="employeeType"><option value="OFFICE_EMPLOYEE">офис служител</option><option value="COURIER">куриер</option></select></label>
        <button class="wide">Добави служител</button>
    `;
    document.getElementById("officeForm").innerHTML = `
        <label>Име<input name="name" required></label>
        <label>Град<input name="city" required></label>
        <label>Телефон<input name="phone" required></label>
        <label class="wide">Адрес<input name="address" required></label>
        <button class="wide">Добави офис</button>
    `;
}

function selectField(name, label, items, prop) {
    const options = items.map((item) => `<option value="${item.id}">${item[prop]} ${item.lastName || ""}</option>`).join("");
    return `<label>${label}<select name="${name}">${options}</select></label>`;
}

function renderTables() {
    document.getElementById("clientsBody").innerHTML = state.data.clients.map((client) => `
        <tr><td>${client.firstName} ${client.lastName}</td><td>${client.phone}</td><td>${client.email}</td><td>${client.address}</td><td>${deleteButton("clients", client.id)}</td></tr>
    `).join("");
    document.getElementById("employeesBody").innerHTML = state.data.employees.map((employee) => `
        <tr><td>${employeeName(employee.id)}</td><td>${labels[employee.employeeType]}</td><td>${officeName(employee.officeId)}</td><td>${deleteButton("employees", employee.id)}</td></tr>
    `).join("");
    document.getElementById("officesBody").innerHTML = state.data.offices.map((office) => `
        <tr><td>${office.name}</td><td>${office.city}</td><td>${office.address}</td><td>${office.phone}</td><td>${deleteButton("offices", office.id)}</td></tr>
    `).join("");
}

function officeName(id) {
    const office = byId(state.data.offices, id);
    return office ? `${office.name}, ${office.city}` : "";
}

function deleteButton(resource, id) {
    return state.role === "CLIENT" ? "" : `<button class="secondary" data-delete="${resource}:${id}">Изтрий</button>`;
}

function visibleShipments() {
    if (state.role !== "CLIENT") return state.data.shipments;
    return state.data.shipments.filter((shipment) => shipment.senderClientId === Number(state.clientId) || shipment.receiverClientId === Number(state.clientId));
}

function renderShipments() {
    document.getElementById("shipmentsBody").innerHTML = visibleShipments().map((shipment) => `
        <tr>
            <td>${shipment.id}</td>
            <td>${clientName(shipment.senderClientId)}</td>
            <td>${clientName(shipment.receiverClientId)}</td>
            <td>${labels[shipment.deliveryType]}</td>
            <td>${shipment.weight} кг</td>
            <td>${money(shipment.price)}</td>
            <td><span class="status ${shipment.status}">${labels[shipment.status]}</span></td>
            <td>${shipment.sentDate || ""}</td>
            <td class="row-actions">${shipmentActions(shipment)}</td>
        </tr>
    `).join("");
}

function shipmentActions(shipment) {
    if (state.role === "CLIENT") return "";
    const deliver = shipment.status !== "DELIVERED" ? `<button data-deliver="${shipment.id}">Получена</button>` : "";
    return `${deliver}<button class="secondary" data-delete="shipments:${shipment.id}">Изтрий</button>`;
}

async function renderReports() {
    const form = document.getElementById("reportForm");
    const params = new URLSearchParams(new FormData(form));
    const report = await api(`/api/reports?${params.toString()}`);
    document.getElementById("reportSummary").innerHTML = `
        <div><strong>${money(report.revenue)}</strong><span>приходи за периода</span></div>
        <div><strong>${report.shipments.length}</strong><span>общо пратки</span></div>
        <div><strong>${report.openShipments.length}</strong><span>изпратени, но неполучени</span></div>
    `;
    document.getElementById("openShipmentsBody").innerHTML = report.openShipments.map((shipment) => `
        <tr><td>${shipment.id}</td><td>${clientName(shipment.senderClientId)}</td><td>${clientName(shipment.receiverClientId)}</td><td>${labels[shipment.status]}</td><td>${money(shipment.price)}</td></tr>
    `).join("");
}

function formData(form) {
    const data = Object.fromEntries(new FormData(form));
    ["senderClientId", "receiverClientId", "registeredByEmployeeId", "courierId", "sourceOfficeId", "destinationOfficeId", "officeId", "userId"].forEach((key) => {
        if (data[key]) data[key] = Number(data[key]);
    });
    if (data.weight) data.weight = Number(data.weight);
    return data;
}

document.addEventListener("click", async (event) => {
    const tab = event.target.closest("[data-view]");
    if (tab) {
        document.querySelectorAll(".tabs button").forEach((button) => button.classList.remove("active"));
        document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.view).classList.add("active");
    }

    const deliver = event.target.closest("[data-deliver]");
    if (deliver) {
        await api(`/api/shipments/${deliver.dataset.deliver}/deliver`, { method: "POST" });
        await load();
    }

    const deleteTarget = event.target.closest("[data-delete]");
    if (deleteTarget) {
        const [resource, id] = deleteTarget.dataset.delete.split(":");
        await api(`/api/${resource}/${id}`, { method: "DELETE" });
        await load();
    }
});

document.getElementById("roleSelect").addEventListener("change", (event) => {
    state.role = event.target.value;
    render();
});

document.getElementById("clientFilter").addEventListener("change", (event) => {
    state.clientId = Number(event.target.value);
    render();
});

document.getElementById("refreshShipments").addEventListener("click", load);
document.getElementById("reportForm").addEventListener("submit", (event) => {
    event.preventDefault();
    renderReports();
});

document.getElementById("shipmentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await api("/api/shipments", { method: "POST", body: JSON.stringify(formData(event.target)) });
    event.target.reset();
    await load();
});

document.getElementById("clientForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await api("/api/clients", { method: "POST", body: JSON.stringify(formData(event.target)) });
    event.target.reset();
    await load();
});

document.getElementById("employeeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = { companyId: state.data.companies[0].id, ...formData(event.target) };
    await api("/api/employees", { method: "POST", body: JSON.stringify(payload) });
    event.target.reset();
    await load();
});

document.getElementById("officeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = { companyId: state.data.companies[0].id, ...formData(event.target) };
    await api("/api/offices", { method: "POST", body: JSON.stringify(payload) });
    event.target.reset();
    await load();
});

load();
