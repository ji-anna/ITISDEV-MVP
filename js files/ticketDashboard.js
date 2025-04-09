document.addEventListener("DOMContentLoaded", () => {
    // Enable tab switching on click
    const tabButtons = document.querySelectorAll(".tabs li");
    const tabContents = document.querySelectorAll(".tab-content");
  
    tabButtons.forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-tab");
  
        // Remove active class from all
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(tab => tab.classList.remove("active"));
  
        // Activate selected
        button.classList.add("active");
        document.getElementById(targetId).classList.add("active");
      });
    });
  });
  