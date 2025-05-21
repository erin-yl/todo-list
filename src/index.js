import appLogic from "./appLogic.js";
import domController from "./domController.js";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  domController.initializeUI();
  refreshProjectsList();

  const initialProject = appLogic.getCurrentProject();
  if (initialProject) {
    domController.renderTodos(initialProject);
  } else {
    domController.updateProjectTitle("No projects found. Please add one.");
    domController.renderTodos(null); // Clears the todo list and shows appropriate message
  }

  // Helper functions for refreshing UI
  function refreshProjectsList() {
    const projects = appLogic.getAllProjects();
    const currentProject = appLogic.getCurrentProject();
    domController.renderProjects(
      projects,
      currentProject ? currentProject.id : null,
    );
  }

  function refreshTodosList() {
    const currentProject = appLogic.getCurrentProject();
    if (currentProject) {
      // Get the project from appLogic to ensure it has the latest todos
      const updatedCurrentProject = appLogic.findProjectById(currentProject.id);
      domController.renderTodos(updatedCurrentProject);
    } else {
      domController.renderTodos(null); // No project selected, clear todos view
      domController.updateProjectTitle("Select a project");
    }
  }

  // Project event listeners
  domController.elements.addProjectBtn.addEventListener("click", () => {
    domController.openProjectModal();
  });

  domController.elements.closeProjectModalBtn.addEventListener("click", () => {
    domController.closeProjectModal();
  });

  // Project form submission
  domController.elements.projectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const projectData = domController.getProjectFormData();
    if (projectData) {
      const newProject = appLogic.addProject(projectData.name);
      if (newProject) {
        appLogic.setCurrentProject(newProject.id);
        refreshProjectsList();
        refreshTodosList();
        domController.showNotification("Project added.", "success");
        domController.closeProjectModal();
      } else {
        domController.showNotification("Unable to create project. The project name already exists.", "error");
      }
    }
  });

  // Actions on a project
  domController.elements.projectsListUL.addEventListener("click", (e) => {
    if (e.target.tagName === "LI" && e.target.dataset.projectId) {
      const projectId = e.target.dataset.projectId;
      appLogic.setCurrentProject(projectId);
      refreshProjectsList();
      refreshTodosList();
    }
  });

  // To-do event listeners
  domController.elements.addTodoBtn.addEventListener("click", () => {
    const currentProject = appLogic.getCurrentProject();
    if (currentProject) {
      domController.openTodoModal(null, currentProject.id);
    } else {
      domController.showNotification("Please select a project before adding a task." , "warning");
    }
  });

  domController.elements.closeTodoModalBtn.addEventListener("click", () => {
    domController.closeTodoModal();
  });

  // To-do form submission
  domController.elements.todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const todoData = domController.getTodoFormData();
    if (todoData) {
      if (todoData.id) {
        // Editing existing todo
        appLogic.updateTodoInProject(
          todoData.currentProjectId,
          todoData.id,
          todoData,
        );
        domController.showNotification("Task updated.", "success");
      } else {
        // Adding new todo
        appLogic.addTodoToProject(todoData.currentProjectId, todoData);
        domController.showNotification("Task added.", "success");
      }
      refreshTodosList();
      domController.closeTodoModal();
    }
  });

  // Actions on to-do items
  domController.elements.todosListUL.addEventListener("click", (e) => {
    const target = e.target;
    const todoId = target.closest("li")?.dataset.todoId;
    const currentProject = appLogic.getCurrentProject();

    if (!todoId || !currentProject) return;

    const projectId = currentProject.id;

    if (target.classList.contains("delete-todo-btn")) {
      if (confirm(`You will permanently delete this task.`)) {
        appLogic.removeTodoFromProject(projectId, todoId);
        refreshTodosList();
      }
    } else if (target.classList.contains("edit-todo-btn")) {
      const todoToEdit = appLogic
        .findProjectById(projectId)
        ?.getTodoById(todoId);
      if (todoToEdit) {
        domController.openTodoModal(todoToEdit, projectId);
      }
    } else if (target.classList.contains("todo-checkbox")) {
      appLogic.toggleTodoComplete(projectId, todoId);
      refreshTodosList();
    }
  });

  // Close modals if clicked outside
  window.addEventListener("click", (e) => {
    if (e.target === domController.elements.projectModal) {
      domController.closeProjectModal();
    }
    if (e.target === domController.elements.todoModal) {
      domController.closeTodoModal();
    }
  });

  // Initial render based on loaded data
  if (appLogic.getCurrentProject()) {
    refreshTodosList();
  } else if (appLogic.getAllProjects().length > 0) {
    // If no current project but projects exist, select the first one
    const firstProject = appLogic.getAllProjects()[0];
    appLogic.setCurrentProject(firstProject.id);
    refreshProjectsList();
    refreshTodosList();
  } else {
    domController.updateProjectTitle("Add a project");
    domController.renderTodos(null);
  }
});
