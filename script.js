document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("currentYear");
    if (year) year.textContent = new Date().getFullYear();

    // Cada servicio del catálogo puede añadirse a "Mi selección".
    const serviceRows = [...document.querySelectorAll(".servicio-item")];
    serviceRows.forEach((row, index) => {
        const name = row.querySelector(":scope > span:first-child");
        const price = row.querySelector(".precio");
        if (!name || !price) return;
        row.dataset.serviceId = String(index);
        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "service-add-button";
        addButton.textContent = "Agregar";
        addButton.setAttribute("aria-pressed", "false");
        addButton.setAttribute("aria-label", "Agregar " + name.textContent.trim());
        row.appendChild(addButton);
    });

    const selection = new Map();
    const lotusIcon = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 39c-8-4-13-11-13-19 6 1 11 5 13 12 2-7 7-11 13-12 0 8-5 15-13 19Z"/><path d="M24 39c-4-8-4-17 0-25 4 8 4 17 0 25Z"/><path d="M24 39C14 39 7 34 4 26c8-1 15 3 20 13Zm0 0c10 0 17-5 20-13-8-1-15 3-20 13Z"/></svg>';
    const floating = document.createElement("button");
    floating.type = "button";
    floating.className = "selection-fab";
    floating.innerHTML = lotusIcon + '<span>Mi selección</span><b class="selection-count">0</b>';
    floating.setAttribute("aria-label", "Abrir mi selección");
    floating.hidden = true;
    document.body.appendChild(floating);

    const panel = document.createElement("div");
    panel.className = "booking-overlay";
    panel.innerHTML = `
        <section class="booking-panel" role="dialog" aria-modal="true" aria-labelledby="selection-title">
            <button type="button" class="booking-close" aria-label="Cerrar">×</button>
            <span class="eyebrow">SPA TRENDY KIM</span>
            <h2 id="selection-title">Mi <em>selección</em></h2>
            <p class="booking-lead">Revisa tus servicios y solicita tu cita.</p>
            <div class="selection-list"><p class="selection-empty">Aún no has elegido servicios. Vuelve al catálogo y toca “Agregar” en los que deseas.</p></div>
            <div class="selection-total" hidden><span>Total estimado</span><strong></strong></div>
            <form class="appointment-form">
                <label>Tu nombre<input name="name" type="text" autocomplete="name" placeholder="Nombre y apellido" required></label>
                <label>Tu número de WhatsApp<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Tu número de contacto" required></label>
                <fieldset>
                    <legend>¿Qué jornada prefieres?</legend>
                    <div class="shift-options">
                        <label><input type="radio" name="shift" value="Mañana" required><span>Mañana</span></label>
                        <label><input type="radio" name="shift" value="Tarde" required><span>Tarde</span></label>
                    </div>
                </fieldset>
                <label>Elige la fecha de tu cita<input name="date" type="date" required></label>
                <p class="booking-note">Tu solicitud se enviará por WhatsApp. La cita quedará pendiente de confirmación.</p>
                <button class="booking-submit" type="submit">Solicitar mi cita <span aria-hidden="true">↗</span></button>
            </form>
        </section>`;
    document.body.appendChild(panel);

    const dateInput = panel.querySelector('input[name="date"]');
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = localToday;

    const count = floating.querySelector(".selection-count");
    const list = panel.querySelector(".selection-list");
    const total = panel.querySelector(".selection-total");
    const totalValue = total.querySelector("strong");

    function getRowData(row) {
        const title = row.closest(".grupo-servicios")?.querySelector(".titulo-grupo h3")?.textContent.trim() || "Servicio";
        const name = row.querySelector(":scope > span:first-child")?.textContent.trim() || "Servicio";
        const priceText = row.querySelector(".precio")?.textContent.trim() || "Por definir";
        const amount = Number(priceText.replace(/[^0-9]/g, "")) || 0;
        return { id: row.dataset.serviceId, title, name, priceText, amount };
    }

    function renderSelection() {
        count.textContent = String(selection.size);
        floating.hidden = selection.size === 0;
        list.innerHTML = "";
        if (!selection.size) {
            list.innerHTML = '<p class="selection-empty">Aún no has elegido servicios. Vuelve al catálogo y toca “Agregar” en los que deseas.</p>';
            total.hidden = true;
            return;
        }
        selection.forEach(item => {
            const line = document.createElement("div");
            line.className = "selection-line";
            const description = document.createElement("div");
            const group = document.createElement("small");
            group.textContent = item.title;
            const name = document.createElement("strong");
            name.textContent = item.name;
            description.append(group, name);
            const price = document.createElement("span");
            price.textContent = item.priceText;
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "selection-remove";
            remove.textContent = "Quitar";
            remove.setAttribute("aria-label", "Quitar " + item.name);
            remove.addEventListener("click", () => {
                selection.delete(item.id);
                const row = document.querySelector('.servicio-item[data-service-id="' + item.id + '"]');
                const button = row?.querySelector(".service-add-button");
                if (button) { button.textContent = "Agregar"; button.setAttribute("aria-pressed", "false"); }
                renderSelection();
            });
            line.append(description, price, remove);
            list.appendChild(line);
        });
        const knownPrices = [...selection.values()].filter(item => item.amount > 0);
        const unknown = [...selection.values()].some(item => item.amount === 0);
        const sum = knownPrices.reduce((acc, item) => acc + item.amount, 0);
        total.hidden = false;
        total.querySelector("span").textContent = unknown ? "Subtotal de precios publicados" : "Total estimado";
        totalValue.textContent = "$" + sum.toLocaleString("es-CO") + " COP" + (unknown ? " + servicios por cotizar" : "");
    }

    document.addEventListener("click", event => {
        const button = event.target.closest(".service-add-button");
        if (!button) return;
        const row = button.closest(".servicio-item");
        const item = getRowData(row);
        if (selection.has(item.id)) {
            selection.delete(item.id);
            button.textContent = "Agregar";
            button.setAttribute("aria-pressed", "false");
        } else {
            selection.set(item.id, item);
            button.textContent = "✓ Añadido";
            button.setAttribute("aria-pressed", "true");
        }
        renderSelection();
    });

    function openPanel() {
        panel.classList.add("is-open");
        document.body.classList.add("booking-open");
        panel.querySelector(".booking-close").focus();
    }
    function closePanel() {
        panel.classList.remove("is-open");
        document.body.classList.remove("booking-open");
        floating.focus();
    }
    floating.addEventListener("click", openPanel);
    panel.querySelector(".booking-close").addEventListener("click", closePanel);
    panel.addEventListener("click", event => { if (event.target === panel) closePanel(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && panel.classList.contains("is-open")) closePanel(); });

    panel.querySelector(".appointment-form").addEventListener("submit", event => {
        event.preventDefault();
        if (!selection.size) {
            alert("Primero elige al menos un servicio del catálogo.");
            closePanel();
            document.querySelector("#unas")?.scrollIntoView({ behavior: "smooth" });
            return;
        }
        const form = new FormData(event.currentTarget);
        const date = new Date(form.get("date") + "T12:00:00");
        const dateLabel = date.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const items = [...selection.values()].map(item => "- " + item.title + ": " + item.name + " (" + item.priceText + ")").join("\n");
        const message = [
            "Hola, quiero solicitar una cita en Spa Trendy Kim.",
            "",
            "Servicios elegidos:",
            items,
            "",
            "Nombre: " + form.get("name"),
            "WhatsApp: " + form.get("phone"),
            "Jornada preferida: " + form.get("shift"),
            "Fecha preferida: " + dateLabel,
            "",
            "Quedo pendiente de confirmación. ¡Gracias!"
        ].join("\n");
        window.open("https://wa.me/573172326970?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    });

    renderSelection();
});
