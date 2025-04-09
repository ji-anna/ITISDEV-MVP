document.addEventListener("DOMContentLoaded", () => {

    const tabButtons = document.querySelectorAll(".tabs li");
    const tabContents = document.querySelectorAll(".tab-content");
  
    tabButtons.forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-tab");
  
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(tab => tab.classList.remove("active"));
  
        button.classList.add("active");
        document.getElementById(targetId).classList.add("active");
      });
    });
  });
  