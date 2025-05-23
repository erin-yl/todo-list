// Display controller module that handles DOM manipulations

import { format, parse } from "date-fns";

const domController = (() => {
  // DOM element selectors
  const projectsListUL = document.getElementById("projects-list");
  const addProjectBtn = document.getElementById("add-project-btn");
  const currentProjectTitle = document.getElementById("current-project-title");
  const addTodoBtn = document.getElementById("add-todo-btn");
  const todosListUL = document.getElementById("todos-list");
  const notificationArea = document.getElementById("notification-area");

  // Project modal
  const projectModal = document.getElementById("project-modal");
  const projectForm = document.getElementById("project-form");
  const projectIdInput = document.getElementById("project-id"); // Hidden input for project editing
  const projectNameInput = document.getElementById("project-name-input");
  const closeProjectModalBtn = document.getElementById("close-project-modal");

  // Todo modal
  const todoModal = document.getElementById("todo-modal");
  const todoForm = document.getElementById("todo-form");
  const todoIdInput = document.getElementById("todo-id"); // Hidden input for todo editing
  const todoTitleInput = document.getElementById("todo-title-input");
  const todoDescriptionInput = document.getElementById("todo-description-input",
  );
  const todoDueDateInput = document.getElementById("todo-dueDate-input");
  const todoPriorityInput = document.getElementById("todo-priority-input");
  const todoTagsInput = document.getElementById("todo-tags-input");
  const closeTodoModalBtn = document.getElementById("close-todo-modal");

  // Helper functions to remove all child nodes
  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function formatDateForDisplay(date) {
    if (!date) return "No date set";
    const dateObj = parse(date, "yyyy-MM-dd", new Date());
    return isNaN(dateObj.valueOf()) ? "No date set" : format(dateObj, "MMM dd, yyyy");
  }

  // Project rendering
  function renderProjects(projects, currentProjectId) {
    clearElement(projectsListUL);
    if (!projects || projects.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No projects yet.";
      li.classList.add("no-items");
      projectsListUL.appendChild(li);
      return;
    }

    projects.forEach((project) => {
      const li = document.createElement("li");
      li.textContent = project.name;
      li.dataset.projectId = project.id;
      if (project.id === currentProjectId) {
        li.classList.add("active");
      }
      projectsListUL.appendChild(li);
    });
  }

  function updateProjectTitle(title) {
    currentProjectTitle.textContent = title || "No project selected";
  }

  // To-do rendering
  function renderTodos(project) {
    clearElement(todosListUL);

    if (!project || !project.todos || project.todos.length === 0) {
      currentProjectTitle.textContent = project
        ? project.name
        : "Select a project";
      const li = document.createElement("li");
      li.textContent = "No tasks in this project yet.";
      li.classList.add("no-items");
      todosListUL.appendChild(li);
      addTodoBtn.style.display = project ? "block" : "none"; // Show add todo if project selected
      return;
    }

    updateProjectTitle(project.name);
    addTodoBtn.style.display = "block";

    project.todos.forEach((todo) => {
      const li = document.createElement("li");
      li.dataset.todoId = todo.id;
      li.classList.add(`priority-${todo.priority}`);
      if (todo.completed) {
        li.classList.add("todo-completed");
      }

      // Checkbox for completion
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.completed;
      checkbox.classList.add("todo-checkbox");
      checkbox.dataset.todoId = todo.id;

      const todoInfoDiv = document.createElement("div");
      todoInfoDiv.classList.add("todo-info");

      const titleSpan = document.createElement("span");
      titleSpan.classList.add("todo-title");
      titleSpan.textContent = todo.title;

      const dueDateSpan = document.createElement("span");
      dueDateSpan.classList.add("todo-due-date");
      dueDateSpan.textContent = `Due: ${formatDateForDisplay(todo.dueDate)}`;

      todoInfoDiv.appendChild(checkbox);
      todoInfoDiv.appendChild(titleSpan);
      todoInfoDiv.appendChild(dueDateSpan);

      // Tags display
      if (todo.tags && todo.tags.length > 0) {
        const tagsDiv = document.createElement("div");
        tagsDiv.classList.add("todo-tags-display");
        todo.tags.forEach((tag) => {
          const tagSpan = document.createElement("span");
          tagSpan.classList.add("tag-label");
          tagSpan.textContent = tag;
          tagsDiv.appendChild(tagSpan);
        });
        todoInfoDiv.appendChild(tagsDiv);
      }

      const actionsDiv = document.createElement("div");
      actionsDiv.classList.add("todo-actions");

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.classList.add("edit-todo-btn");
      editBtn.dataset.todoId = todo.id;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.classList.add("delete-todo-btn");
      deleteBtn.dataset.todoId = todo.id;

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(todoInfoDiv);
      li.appendChild(actionsDiv);
      todosListUL.appendChild(li);
    });
  }

  // Modal handling
  function openProjectModal() {
    projectForm.reset();
    projectModal.style.display = "block";
    projectNameInput.focus();
  }

  function closeProjectModal() {
    projectModal.style.display = "none";
  }

  function openTodoModal(todoToEdit = null, currentProjectId) {
    todoForm.reset();
    todoIdInput.value = ""; // Clear hidden ID field

    if (todoToEdit) {
      todoIdInput.value = todoToEdit.id;
      todoTitleInput.value = todoToEdit.title;
      todoDescriptionInput.value = todoToEdit.description;
      todoDueDateInput.value = todoToEdit.dueDate || "";
      todoPriorityInput.value = todoToEdit.priority;
      todoTagsInput.value = todoToEdit.tags ? todoToEdit.getTagsString() : "";
    }
    todoForm.dataset.currentProjectId = currentProjectId;
    todoModal.style.display = "block";
    todoTitleInput.focus();
  }

  function closeTodoModal() {
    todoModal.style.display = "none";
  }

  // Form data getters
  function getProjectFormData() {
    clearFormErrors(projectForm);
    let isValid = true;
    const name = projectNameInput.value.trim();
    const id = projectIdInput.value;

    if (projectNameInput.validity.valueMissing) {
      showFieldError(projectNameInput, "Project name is required.");
      isValid = false;
    }
    return isValid ? { id, name } : null;
  }

  function getTodoFormData() {
    clearFormErrors(todoForm);
    let isValid = true;
    const title = todoTitleInput.value.trim();
    const description = todoDescriptionInput.value.trim();
    const dueDate = todoDueDateInput.value;
    const priority = todoPriorityInput.value;
    const tagsString = todoTagsInput.value.trim(); // Comma-separated string
    const id = todoIdInput.value;
    const currentProjectId = todoForm.dataset.currentProjectId;

    if (todoTitleInput.validity.valueMissing) {
      showFieldError(todoTitleInput, "Task name is required.");
      isValid = false;
    }

    return isValid 
      ? {
          id,
          title,
          description,
          dueDate,
          priority,
          tagsString,
          currentProjectId
        } 
      : null;
  }

  // Form validation
  function clearFormErrors(formElement) {
    formElement.querySelectorAll(".form-input, .form-select").forEach(input => {
      input.setCustomValidity("");
    });
    formElement.querySelectorAll(".error-message").forEach(span => {
      span.textContent = "";
    });
  }

  function showFieldError(inputElement, message) {
    const helpSpan = inputElement.parentElement.querySelector(".help-message");
    const errorSpan = inputElement.parentElement.querySelector(".error-message");
    
    inputElement.setCustomValidity(message);
    errorSpan.textContent = message;
    if (helpSpan) {
      helpSpan.remove();
    }
  }  

  function showNotification(message, type = "info") { // types: info, success, error, warning
    const notification = document.createElement("div");
    notification.classList.add("notification", type);
    notification.textContent = message;

    notificationArea.appendChild(notification);

    // Remove notification from DOM after animation completes
    notification.addEventListener("animationend", (e) => {
      if (e.animationName === "fadeOutNotification") {
        notification.remove();
      }
    });
  }

  // Initial state
  function initializeUI() {
    updateProjectTitle("Loading projects...");
    clearElement(todosListUL);
    const li = document.createElement("li");
    li.textContent = "Select or add a project to see your tasks.";
    todosListUL.appendChild(li);
    addTodoBtn.style.display = "none";
  }

  return {
    renderProjects,
    renderTodos,
    updateProjectTitle,
    openProjectModal,
    closeProjectModal,
    openTodoModal,
    closeTodoModal,
    getProjectFormData,
    getTodoFormData,
    clearElement,
    showNotification,
    initializeUI,
    elements: {
      projectModal,
      todoModal,
      projectsListUL,
      todosListUL,
      addProjectBtn,
      addTodoBtn,
      projectForm,
      todoForm,
      closeProjectModalBtn,
      closeTodoModalBtn,
    },
  };
})();

export default domController;