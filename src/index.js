import appLogic from "./appLogic.js";
import domController from "./domController.js";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  let currentSearchTerm = "";
  let currentPriorityFilter = "all";
  let currentTagFilter = null;
  // let currentSortCriteria = { field: "dueDate", direction: "asc" };

  const searchInput = document.getElementById("search-todos-input");
  const priorityFilterSelect = document.getElementById("priority-filter");

  function updateAndRenderTodos() {
    let todosToDisplay = [];
    let viewTitle = "";
    const currentProjectFromSidebar = appLogic.getCurrentProject(); // Project selected in sidebar

    // Determine the base list of todos
    if (currentSearchTerm && currentSearchTerm.trim() !== "") {
      // Active global search
      viewTitle = `Search Results for "${currentSearchTerm}"`;
      const allTodosWithProjectInfo = appLogic.getAllTodosWithProjectInfo();
      todosToDisplay = appLogic.searchTodosInList(allTodosWithProjectInfo, currentSearchTerm);

      // Apply global filters/sort to search results
      if (currentPriorityFilter !== "all") {
        todosToDisplay = todosToDisplay.filter(todo => todo.priority === currentPriorityFilter);
      }
      if (currentTagFilter) {
        const lowerTagFilter = currentTagFilter.toLowerCase();
        todosToDisplay = todosToDisplay.filter(todo =>
          todo.tags.some(t => t.toLowerCase() === lowerTagFilter)
        );
      }
      // TODO: Apply global sort: todosToDisplay = appLogic.sortTodos(todosToDisplay, ...);

      domController.renderTodos({
        name: viewTitle,
        todos: todosToDisplay,
        isGlobalSearch: true
      });
    } else {
      // If no global search, display current project"s todos
      if (currentProjectFromSidebar) {
        const projectData = appLogic.findProjectById(currentProjectFromSidebar.id);
        if (projectData) {
          viewTitle = projectData.name;
          todosToDisplay = projectData.getAllTodos();

          // Apply project-specific filters/sort
          if (currentPriorityFilter !== "all") {
            todosToDisplay = todosToDisplay.filter(todo => todo.priority === currentPriorityFilter);
          }
          if (currentTagFilter) {
            todosToDisplay = todosToDisplay.filter(todo =>
              projectData.getTodosByTag(currentTagFilter)
                .some(t => t.id === todo.id)
            );
          }
          // TODO: Apply project-specific sort: todosToDisplay = appLogic.sortTodos(todosToDisplay, ...);

          domController.renderTodos({ ...projectData, todos: todosToDisplay, isGlobalSearch: false });
        } else {
          domController.renderTodos(null);
          viewTitle = "Project not found";
        }
      } else {
        domController.renderTodos(null);
        viewTitle = "Select a Project";
      }
    }
    domController.updateProjectTitle(viewTitle);

    // addTodoBtn is visible if a project is selected, regardless of search
    domController.elements.addTodoBtn.style.display = currentProjectFromSidebar ? "block" : "none";
  }

  // Initial Setup
  domController.initializeUI();
  refreshProjectsList();
  updateAndRenderTodos();

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchTerm = e.target.value;
      updateAndRenderTodos();
    });
  }

  // function refreshTodosList() {
  //   const currentProject = appLogic.getCurrentProject();
  //   if (currentProject) {
  //     // Get the project from appLogic to ensure it has the latest todos
  //     const updatedCurrentProject = appLogic.findProjectById(currentProject.id);
  //     domController.renderTodos(updatedCurrentProject);
  //   } else {
  //     domController.renderTodos(null); // No project selected, clear todos view
  //     domController.updateProjectTitle("Select a project");
  //   }
  // }

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
        updateAndRenderTodos();
        domController.showNotification("Project added.", "success");
        domController.closeProjectModal();
      } else {
        domController.showNotification("Unable to create project. Project name already exists.", "error");
      }
    }
  });

  // Actions on a project
  domController.elements.projectsListUL.addEventListener("click", (e) => {
    const projectLi = e.target.closest("li[data-project-id]");
    if (!projectLi) return;
    const projectId = projectLi.dataset.projectId;

    if (e.target.classList.contains("edit-project-btn")) { /* ... */ }
    else if (e.target.classList.contains("delete-project-btn")) { /* ... */ }
    else if (e.target.closest(".project-name") || e.target === projectLi) {
      if (appLogic.getCurrentProject()?.id !== projectId || (currentSearchTerm && currentSearchTerm.trim() !== "")) {
        appLogic.setCurrentProject(projectId);
        refreshProjectsList();
        currentSearchTerm = "";
        if (searchInput) searchInput.value = "";
        currentPriorityFilter = "all";
        if (priorityFilterSelect) priorityFilterSelect.value = "all";
        currentTagFilter = null;
        updateAndRenderTodos();
      }
    }
  });

  // To-do event listeners
  domController.elements.addTodoBtn.addEventListener("click", () => {
    const currentProject = appLogic.getCurrentProject();
    if (currentProject) {
      domController.openTodoModal(null, currentProject.id);
    } else {
      domController.showNotification("Please select a project to add a task.", "warning");
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
      let success = false;
      if (todoData.id) { // Editing existing todo
        if (appLogic.updateTodoInProject(todoData.currentProjectId, todoData.id, todoData)) {
          success = true;
        }
      } else { // Adding new todo
        if (appLogic.addTodoToProject(todoData.currentProjectId, todoData)) {
          success = true;
        }
      }

      if (success) {
        updateAndRenderTodos();
        domController.closeTodoModal();
        domController.showNotification(todoData.id ? "Task updated." : "Task added.", "success");
      } else {
        domController.showNotification("Unable to save task.", "error");
      }
    }
  });

  // Actions on todo items
  domController.elements.todosListUL.addEventListener("click", (e) => {
    const target = e.target;
    const todoLi = target.closest("li[data-todo-id]");
    if (!todoLi) return;

    const todoId = todoLi.dataset.todoId;
    // Determine the project ID
    let projectIdForAction = todoLi.dataset.originalProjectId; // From global search
    if (!projectIdForAction) {
      const currentProject = appLogic.getCurrentProject();
      if (currentProject) {
        projectIdForAction = currentProject.id;
      }
    }

    if (!todoId || !projectIdForAction) return;

    if (target.classList.contains("delete-todo-btn")) {
      if (confirm("You will permanently delete this task.")) {
        appLogic.removeTodoFromProject(projectIdForAction, todoId);
        domController.showNotification("Task deleted.", "success");
        updateAndRenderTodos();
      }
    } else if (target.classList.contains("edit-todo-btn")) {
      const todoToEdit = appLogic
        .findProjectById(projectIdForAction)
        ?.getTodoById(todoId);
      if (todoToEdit) {
        domController.openTodoModal(todoToEdit, projectIdForAction);
      }
    } else if (target.classList.contains("todo-checkbox")) {
      appLogic.toggleTodoComplete(projectIdForAction, todoId);
      updateAndRenderTodos();
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
    updateAndRenderTodos();
  } else if (appLogic.getAllProjects().length > 0) {
    // If no current project but projects exist, select the first one
    const firstProject = appLogic.getAllProjects()[0];
    appLogic.setCurrentProject(firstProject.id);
    refreshProjectsList();
    updateAndRenderTodos();
  } else {
    domController.updateProjectTitle("Add a project");
    domController.renderTodos(null);
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

  updateAndRenderTodos();
});