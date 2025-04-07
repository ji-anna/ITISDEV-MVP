document.addEventListener("DOMContentLoaded", () => {
    const downloadBtn = document.getElementById("downloadTicket");

    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const ticket = document.querySelector(".ticket-receipt");
            if (!ticket) return;

            html2canvas(ticket).then(canvas => {
                const link = document.createElement("a");
                link.download = "parking_ticket_receipt.png";
                link.href = canvas.toDataURL();
                link.click();
            });
        });
    }
});
