document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("currentYear");
    const copyButton = document.getElementById("copyCatalog");
    const shareButton = document.getElementById("sharePage");
    const feedback = document.getElementById("actionFeedback");

    if (year) year.textContent = new Date().getFullYear();

    const catalogText = [
        "TRENDY KIM SPA | CATÁLOGO DE SERVICIOS",
        "",
        "UÑAS TRADICIONAL",
        "Limpieza manos — $15.000",
        "Limpieza pies — $18.000",
        "Tradicional manos - mujer — $20.000",
        "Tradicional pies - mujer — $25.000",
        "Tradicional manos - hombre — $18.000",
        "Tradicional pies - hombre — $20.000",
        "",
        "UÑAS SEMIPERMANENTE",
        "Manos semipermanente — $45.000",
        "Pies semipermanente — $40.000",
        "Semi manos - hombre — $30.000",
        "Semi pies - hombre — $30.000",
        "Retiro de semipermanente — $8.000",
        "",
        "PEDY SPA",
        "Pedy spa tradicional — $45.000",
        "Pedy spa semi — $60.000",
        "",
        "PRESS ON",
        "Uñas press on — $85.000",
        "Retoque press on — $75.000",
        "Uña press on — $5.000",
        "Retiro de press on — $15.000",
        "",
        "BAÑO DE ACRÍLICO",
        "Baño de acrílico — $70.000",
        "Retoque — $70.000",
        "Forrado de acrílico — $75.000",
        "Retoque base rubber — $55.000",
        "Se realiza sobre el largo de tu uña natural."
    ].join("\n");

    const showFeedback = (message) => {
        if (!feedback) return;
        feedback.textContent = message;
    };

    if (copyButton) {
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(catalogText);
                showFeedback("¡Catálogo copiado! Ya puedes compartirlo.");
            } catch (error) {
                showFeedback("No fue posible copiar automáticamente. Puedes seleccionar y copiar los servicios desde la página.");
            }
        });
    }

    if (shareButton) {
        shareButton.addEventListener("click", async () => {
            const shareData = {
                title: "Trendy Kim Spa",
                text: "Conoce los servicios de Trendy Kim Spa.",
                url: window.location.href
            };
            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(window.location.href);
                    showFeedback("¡Enlace copiado! Ya puedes compartir la página.");
                } else {
                    showFeedback("Comparte el enlace de esta página desde la barra del navegador.");
                }
            } catch (error) {
                if (error.name !== "AbortError") showFeedback("No se pudo compartir en este momento.");
            }
        });
    }
});
