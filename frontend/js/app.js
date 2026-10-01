// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):
//   - async function getExpenses()          fetch(API_URL), return the JSON
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })
//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
//   - async function refresh()              get the list, then call renderTable and renderSummary
//   - renderTable(list)                     build the table rows from the array the API returned
//   - renderSummary(list)                   update the summary cards
//   - applyFilter()                         re-render with the list filtered by category
//
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).

const API_URL = "http://localhost:3000/api/expenses";

// Show loading spinner
function showSpinner() {
    document
        .getElementById("loadingSpinner")
        .classList.remove("d-none");
}

// Hide loading spinner
function hideSpinner() {
    document
        .getElementById("loadingSpinner")
        .classList.add("d-none");
}

// Show Bootstrap alert
function showAlert(message, type = "danger") {
    const alertContainer = document.getElementById("alertContainer");

    alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button"
              class="btn-close"
              data-bs-dismiss="alert">
      </button>
    </div>
  `;
}

/// 1. Get expenses from the API
async function getExpenses() {
    showSpinner();

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load expenses");
        }

        const expenses = await response.json();
        return expenses;

    } catch (error) {
        showAlert("Failed to load expenses.", "danger");
        console.error(error);
        return [];

    } finally {
        hideSpinner();
    }
}

function getCategoryBadge(category) {
    const colors = {
        Food: "success",
        Transport: "primary",
        Bills: "danger",
        Entertainment: "warning",
        Other: "secondary"
    };

    return colors[category] || "secondary";
}



// 2. Display expenses in the table
function renderTable(list) {
    const tableBody = document.getElementById("expenseTableBody");

    tableBody.innerHTML = "";

    list.forEach(expense => {
        const row = document.createElement("tr");

        row.innerHTML = `
      <td>${expense.title}</td>
      <td>$${expense.amount}</td>
      <td>
      <span class="badge text-bg-${getCategoryBadge(expense.category)}"> ${expense.category}</span>
      </td>
      <td>${expense.date}</td>
      <td>
       <button class="btn btn-sm btn-warning" onclick="openEditModal(${expense.id}, '${expense.title}', ${expense.amount}, '${expense.category}', '${expense.date}')">Edit</button>
       <button class="btn btn-sm btn-danger"  onclick="handleDelete(${expense.id})">Delete</button>
      </td>
    `;

        tableBody.appendChild(row);
    });
}

// Display summary information
function renderSummary(list) {

    const total = list.reduce((sum, expense) => {
        return sum + Number(expense.amount);
    }, 0);

    const count = list.length;

    const highest = list.length > 0
        ? Math.max(...list.map(expense => Number(expense.amount)))
        : 0;

    document.getElementById("totalAmount").textContent = `$${total.toFixed(2)}`;
    document.getElementById("expenseCount").textContent = count;
    document.getElementById("highestExpense").textContent = `$${highest.toFixed(2)}`;
}

// Store all expenses
let allExpenses = [];

// Filter expenses by category
function applyFilter() {
    const selectedCategory =
        document.getElementById("categoryFilter").value;

    const searchText =
        document.getElementById("searchInput").value.toLowerCase();

    let filteredExpenses = allExpenses;

    // Filter by category
    if (selectedCategory !== "All") {
        filteredExpenses = filteredExpenses.filter(expense =>
            expense.category === selectedCategory
        );
    }

    // Search by title
    if (searchText !== "") {
        filteredExpenses = filteredExpenses.filter(expense =>
            expense.title.toLowerCase().includes(searchText)
        );
    }

    renderTable(filteredExpenses);
}

// Run filter when category changes
document
    .getElementById("categoryFilter")
    .addEventListener("change", applyFilter);

// Run search while typing
document
    .getElementById("searchInput")
    .addEventListener("input", applyFilter);


async function handleDelete(id) {
    const confirmed = confirm("Are you sure you want to delete this expense?");

    if (!confirmed) {
        return;
    }

    await deleteExpense(id);
    await refresh();
}

function openEditModal(id, title, amount, category, date) {

    document.getElementById("editId").value = id;
    document.getElementById("editTitle").value = title;
    document.getElementById("editAmount").value = amount;
    document.getElementById("editCategory").value = category;
    document.getElementById("editDate").value = date;

    const editModal = new bootstrap.Modal(
        document.getElementById("editModal")
    );

    editModal.show();
}
const editForm = document.getElementById("editForm");

editForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("editId").value;

    const data = {
        title: document.getElementById("editTitle").value,
        amount: Number(document.getElementById("editAmount").value),
        category: document.getElementById("editCategory").value,
        date: document.getElementById("editDate").value
    };

    await updateExpense(id, data);

    const modalElement = document.getElementById("editModal");
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();

    await refresh();
});

// 3. Get the data and display it
async function refresh() {
    const expenses = await getExpenses();

    allExpenses = expenses;

    renderTable(allExpenses);
    renderSummary(allExpenses);
}

// 4. Add expense to the API
async function addExpense(data) {
    showSpinner();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to add expense");
        }

        showAlert("Expense added successfully!", "success");

        return result;

    } catch (error) {
        showAlert(error.message, "danger");
        console.error(error);
        return null;

    } finally {
        hideSpinner();
    }
}
// Delete expense from the API
async function deleteExpense(id) {
    showSpinner();

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to delete expense");
        }

        showAlert("Expense deleted successfully!", "success");

        return result;

    } catch (error) {
        showAlert(error.message, "danger");
        console.error(error);
        return null;

    } finally {
        hideSpinner();
    }
}

// Update expense in the API
async function updateExpense(id, data) {
    showSpinner();

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to update expense");
        }

        showAlert("Expense updated successfully!", "success");

        return result;

    } catch (error) {
        showAlert(error.message, "danger");
        console.error(error);
        return null;

    } finally {
        hideSpinner();
    }
}

// 5. Handle form submit
const expenseForm = document.getElementById("expenseForm");

expenseForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const data = {
        title: document.getElementById("title").value,
        amount: Number(document.getElementById("amount").value),
        category: document.getElementById("category").value,
        date: document.getElementById("date").value
    };

    await addExpense(data);

    expenseForm.reset();

    await refresh();
});


// 6. Run when the page loads
refresh();

// Dark Mode
const darkModeBtn = document.getElementById("darkModeBtn");

darkModeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
});