document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("currentYear");
    if (year) year.textContent = new Date().getFullYear();

    const backToTop = document.querySelector(".catalog-footer .back-to-top-footer");
    if (backToTop) {
        backToTop.addEventListener("click", (event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
});
