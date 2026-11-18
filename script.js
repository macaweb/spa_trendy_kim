document.addEventListener("DOMContentLoaded", () => {

    // Feedback táctil explícito para el CTA principal (también en móviles sin hover).
    const heroBookingButton = document.querySelector(".hero-booking-button");
    if (heroBookingButton) {
        const press = () => {
            heroBookingButton.classList.remove("is-pressed");
            void heroBookingButton.offsetWidth;
            heroBookingButton.classList.add("is-pressed");
        };
        const release = () => heroBookingButton.classList.remove("is-pressed");
        heroBookingButton.addEventListener("pointerdown", press);
        ["pointerup", "pointercancel", "pointerleave", "blur"].forEach(eventName => {
            heroBookingButton.addEventListener(eventName, release);
        });
        heroBookingButton.addEventListener("animationend", event => {
            if (event.animationName === "tk-cta-tap") release();
        });
    }

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
    const selectionStorageKey = "spaTrendyKimSelectionV1";
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
                <button class="booking-submit" type="submit">Solicitar mi cita</button>
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

    // Guarda únicamente los servicios elegidos para recuperarlos si se recarga la página.
    function saveSelection() {
        try {
            localStorage.setItem(selectionStorageKey, JSON.stringify([...selection.keys()]));
        } catch (error) {
            console.warn("No fue posible guardar la selección en este navegador.", error);
        }
    }

    function restoreSelection() {
        try {
            const savedIds = JSON.parse(localStorage.getItem(selectionStorageKey) || "[]");
            if (!Array.isArray(savedIds)) return;
            savedIds.forEach(id => {
                const row = serviceRows.find(item => item.dataset.serviceId === String(id));
                if (!row) return;
                const item = getRowData(row);
                selection.set(item.id, item);
                const button = row.querySelector(".service-add-button");
                if (button) {
                    button.textContent = "✓ Añadido";
                    button.setAttribute("aria-pressed", "true");
                }
            });
        } catch (error) {
            console.warn("No fue posible recuperar la selección guardada.", error);
        }
    }

    function renderSelection() {
        count.textContent = String(selection.size);
        floating.hidden = selection.size === 0;
        list.innerHTML = "";
        if (!selection.size) {
            list.innerHTML = '<p class="selection-empty">Aún no has elegido servicios. Vuelve al catálogo y toca “Agregar” en los que deseas.</p>';
            total.hidden = false;
            total.querySelector("span").textContent = "Total estimado";
            totalValue.textContent = "$0 COP";
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
                saveSelection();
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
        saveSelection();
        renderSelection();
    });

    function openPanel() {
        panel.classList.add("is-open");
        document.body.classList.add("booking-open");
        panel.scrollTop = 0;
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

    const appointmentForm = panel.querySelector(".appointment-form");
    const submitButton = appointmentForm.querySelector(".booking-submit");
    submitButton.type = "button";

    // Procesa la solicitud directamente desde el toque, sin depender de la
    // validación automática del navegador ni de un campo de hora específico.
    submitButton.addEventListener("click", () => {
        const nameInput = appointmentForm.elements.namedItem("name");
        const phoneInput = appointmentForm.elements.namedItem("phone");
        const shiftInput = appointmentForm.querySelector('input[name="shift"]:checked');
        const dateValue = appointmentForm.elements.namedItem("date").value;

        const missing = [];
        if (!nameInput.value.trim()) missing.push("tu nombre");
        if (!phoneInput.value.trim()) missing.push("tu número de WhatsApp");
        if (!shiftInput) missing.push("la jornada (mañana o tarde)");
        if (!dateValue) missing.push("la fecha de la cita");
        if (!selection.size) missing.push("al menos un servicio");

        if (missing.length) {
            alert("Para enviar tu solicitud, completa: " + missing.join(", ") + ".");
            return;
        }

        const date = new Date(dateValue + "T12:00:00");
        const dateLabel = date.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const groupedServices = new Map();
        selection.forEach(item => {
            if (!groupedServices.has(item.title)) groupedServices.set(item.title, []);
            groupedServices.get(item.title).push(item);
        });
        const boldHeading = value => {
            const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const bold = "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙";
            return [...value].map(character => {
                const index = normal.indexOf(character);
                return index >= 0 ? bold[index] : character;
            }).join("");
        };

        const serviceLines = [];
        groupedServices.forEach((items, category) => {
            serviceLines.push(boldHeading(category.toLocaleUpperCase("es-CO")) + ":");
            items.forEach(item => {
                serviceLines.push(item.name);
                serviceLines.push("Precio: " + item.priceText);
            });
            serviceLines.push("");
        });
        const knownPrices = [...selection.values()].filter(item => item.amount > 0);
        const hasPendingPrices = [...selection.values()].some(item => item.amount === 0);
        const estimatedTotal = knownPrices.reduce((sum, item) => sum + item.amount, 0);
        const totalLine = "Subtotal de precios publicados: $" +
            estimatedTotal.toLocaleString("es-CO") + " COP" +
            (hasPendingPrices ? " + servicios por cotizar" : "");
        const message = [
            boldHeading("SPA TRENDY KIM"),
            boldHeading("SOLICITUD DE CITA"),
            "",
            boldHeading("SERVICIOS QUE DESEO") + ":",
            "",
            ...serviceLines,
            "────────────",
            boldHeading(hasPendingPrices ? "SUBTOTAL" : "TOTAL ESTIMADO") + ":",
            totalLine,
            "",
            boldHeading("DATOS PARA LA CITA") + ":",
            "Nombre: " + nameInput.value.trim(),
            "WhatsApp: " + phoneInput.value.trim(),
            "Jornada preferida: " + shiftInput.value,
            "Fecha preferida: " + dateLabel,
            "",
            "Solicito confirmar disponibilidad para esta fecha y jornada.",
            "¡Muchas gracias!"
        ].join("\n");

        const whatsappUrl = "https://wa.me/573172326970?text=" + encodeURIComponent(message);

        // Abrir en la misma pestaña evita que el navegador bloquee una ventana
        // nueva creada mediante un clic programático.
        window.location.assign(whatsappUrl);
    });


    // Mantiene marcada la categoría elegida y cierra el desplegable al navegar.
    const categoryLinks = [...document.querySelectorAll(".nav-dropdown-menu a[href^='#']")];
    const markCurrentCategory = hash => {
        categoryLinks.forEach(link => link.classList.toggle("is-current", link.getAttribute("href") === hash));
    };
    categoryLinks.forEach(link => {
        link.addEventListener("click", () => {
            markCurrentCategory(link.getAttribute("href"));
            const dropdown = link.closest(".nav-dropdown");
            if (dropdown) dropdown.removeAttribute("open");
        });
    });
    markCurrentCategory(window.location.hash);
    window.addEventListener("hashchange", () => markCurrentCategory(window.location.hash));

    // Corrige el acceso a Inicio.

    document.querySelectorAll("a[href='#inicio']").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            const dropdown = document.querySelector(".nav-dropdown");
            if (dropdown) dropdown.removeAttribute("open");
            history.replaceState(null, "", window.location.pathname + window.location.search);
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    // Aparición progresiva de secciones al desplazarse por la página.
    const motionTargets = document.querySelectorAll(
        ".intro-strip, .booking-intro, .section-heading, .category-section-heading, .grupo-servicios, .garantia-section, .contacto-section, .catalog-footer"
    );
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
        motionTargets.forEach(element => element.classList.add("is-visible"));
    } else {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
        motionTargets.forEach((element, index) => {
            element.classList.add("reveal-on-scroll");
            if (element.classList.contains("grupo-servicios")) {
                element.style.setProperty("--reveal-delay", (index % 2) * 90 + "ms");
            }
            revealObserver.observe(element);
        });
    }

    restoreSelection();
    renderSelection();
});
