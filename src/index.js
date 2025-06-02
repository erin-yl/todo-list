import appLogic from './appLogic.js';
import domController from './domController.js';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  let currentSearchTerm = '';
  let currentPriorityFilter = 'all';
  let currentTagFilter = null;
  let currentSortCriteria = { field: 'dueDate', direction: 'asc' };

  const searchInput = document.getElementById('search-todos-input');
  const priorityFilterSelect = document.getElementById('priority-filter');
  const tagFilterArea = document.getElementById('tag-filter-area');
  const tagFilterClearBtn = document.getElementById('tag-filter-clear-btn');
  const sortTodosSelect = document.getElementById('sort-todos');

  function refreshTagCloud() {
    let tagsForCloud = [];
    const currentProject = appLogic.getCurrentProject();
    const isGlobalMode = currentSearchTerm && currentSearchTerm.trim() !== '';

    if (isGlobalMode) {
      tagsForCloud = appLogic.getAllTagsAcrossProjects();
    } else if (currentProject) {
      const projectData = appLogic.getProjectById(currentProject.id);
      tagsForCloud = projectData ? projectData.getUniqueTags() : [];
    } else {
      tagsForCloud = appLogic.getAllTagsAcrossProjects();
    }
    domController.renderTagCloud(tagsForCloud, currentTagFilter);
  }

  function updateAndRenderTodos() {
    let todosToDisplay = [];
    let viewTitle = '';
    const isGlobalMode = currentSearchTerm && currentSearchTerm.trim() !== '';
    const currentProjectFromSidebar = appLogic.getCurrentProject();

    if (isGlobalMode) {
      // Active global search
      viewTitle = `Search results for '${currentSearchTerm}'`;
      const allTodosWithProjectInfo = appLogic.getAllTodosWithProjectInfo();
      todosToDisplay = appLogic.searchTodosInList(allTodosWithProjectInfo, currentSearchTerm);
    } else if (currentProjectFromSidebar) {
      const projectData = appLogic.getProjectById(currentProjectFromSidebar.id);
      if (projectData) {
        viewTitle = projectData.name;
        todosToDisplay = projectData.getAllTodos();
      } else {
        viewTitle = 'Project not found';
        todosToDisplay = [];
      }
    } else {
      viewTitle = 'Select a project or search';
      todosToDisplay = [];
    }

    refreshTagCloud();

    let filteredTodos = [...todosToDisplay];
    if (currentPriorityFilter !== 'all') {
      filteredTodos = filteredTodos.filter(todo => todo.priority === currentPriorityFilter);
    }

    if (currentTagFilter) {
      const lowerTagFilter = currentTagFilter.toLowerCase();
      filteredTodos = filteredTodos.filter(todo =>
        todo.tags.some(t => t.toLowerCase() === lowerTagFilter)
      );
    }

    let sortedTodos = appLogic.sortTodos(filteredTodos, currentSortCriteria.field, currentSortCriteria.direction);

    const renderData = {
      name: viewTitle,
      todos: sortedTodos,
      isGlobalSearch: isGlobalMode
    };
    domController.renderTodos(renderData);
    domController.updateProjectTitle(viewTitle);
    domController.elements.addTodoBtn.style.display = currentProjectFromSidebar ? 'block' : 'none';
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      updateAndRenderTodos();
    });
  }

  if (priorityFilterSelect) {
    priorityFilterSelect.addEventListener('change', (e) => {
      currentPriorityFilter = e.target.value;
      updateAndRenderTodos();
    });
  }
  if (tagFilterArea) {
    tagFilterArea.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag-filter-item')) {
        const clickedTag = e.target.dataset.tag;
        if (currentTagFilter === clickedTag) {
          currentTagFilter = null; // Toggle off
        } else {
          currentTagFilter = clickedTag;
        }
        updateAndRenderTodos();
      }
    });
  }

  if (tagFilterClearBtn) {
    tagFilterClearBtn.addEventListener('click', () => {
      if (currentTagFilter !== null) {
        currentTagFilter = null;
        updateAndRenderTodos();
      }
    });
  }

  // Project event listeners
  domController.elements.addProjectBtn.addEventListener('click', () => {
    domController.openProjectModal();
  });

  domController.elements.closeProjectModalBtn.addEventListener('click', () => {
    domController.closeProjectModal();
  });

  // Project form submission
  domController.elements.projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const projectData = domController.getProjectFormData();
    if (projectData) {
      let result;
      let action = 'added';
      if (projectData.id) { // Editing existing project
        result = appLogic.updateProject(projectData.id, projectData.name);
        action = 'updated';
        if (result && result.error === 'duplicate') {
          domController.showNotification(`Project name "${projectData.name}" already exists.`, 'error');
          return;
        }
      } else { // Adding new project
        result = appLogic.addProject(projectData.name);
      }

      if (result && !result.error) {
        if (action === 'added') appLogic.setCurrentProject(result.id);
        refreshProjectsList();
        updateAndRenderTodos();
        domController.closeProjectModal();
        domController.showNotification(`Project "${result.name}" ${action}.`, 'success');
      } else if (action === 'added') {
        domController.showNotification('Unable to add project. Name might be invalid.', 'error');
      }
    }
  });

  if (sortTodosSelect) {
    sortTodosSelect.addEventListener('change', (e) => {
      const [field, direction] = e.target.value.split('_');
      currentSortCriteria = { field, direction };
      updateAndRenderTodos();
    });
  }

  // Actions on a project
  domController.elements.projectsListUL.addEventListener('click', (e) => {
    const projectLi = e.target.closest('li[data-project-id]');
    if (!projectLi) return;

    const projectId = projectLi.dataset.projectId;
    if (e.target.classList.contains('edit-project-btn')) {
      const projectToEdit = appLogic.getProjectById(projectId);
      if (projectToEdit) {
        domController.openProjectModal(projectToEdit);
      }
    } else if (e.target.classList.contains('delete-project-btn')) {
      const projectToDelete = appLogic.getProjectById(projectId);
      if (projectToDelete && confirm(`You will permanently delete project "${projectToDelete.name}" and all its tasks.`)) {
        const result = appLogic.removeProject(projectId);
        if (result.success) {
          domController.showNotification(`Project "${result.removedProjectName}" deleted.`, 'success');
          refreshProjectsList();
          // If the current project was deleted, updateAndRenderTodos will handle it based on new currentProject from appLogic
          updateAndRenderTodos();
        } else if (result.error === 'last_project') {
          domController.showNotification('Unable to delete the last project.', 'error');
        } else {
          domController.showNotification('Unable to delete project.', 'error');
        }
      }
    } else if (e.target.closest('.project-name') || e.target === projectLi) { // Click on name or li itself
      if (appLogic.getCurrentProject()?.id !== projectId) {
        appLogic.setCurrentProject(projectId);
        refreshProjectsList();
        currentSearchTerm = '';

        if (searchInput) searchInput.value = '';
        currentPriorityFilter = 'all'; // Reset priority filter
        if (priorityFilterSelect) priorityFilterSelect.value = 'all'; // Reset select element
        currentTagFilter = null;
        currentSortCriteria = { field: 'dueDate', direction: 'asc' }; // Reset sort
        if (sortTodosSelect) sortTodosSelect.value = 'dueDate_asc';
        currentTagFilter = null;
        updateAndRenderTodos();
      }
    }
  });

  // To-do event listeners
  domController.elements.addTodoBtn.addEventListener('click', () => {
    const currentProject = appLogic.getCurrentProject();
    if (currentProject) {
      domController.openTodoModal(null, currentProject.id);
    } else {
      domController.showNotification('Please select project to add task.', 'warning');
    }
  });

  domController.elements.closeTodoModalBtn.addEventListener('click', () => {
    domController.closeTodoModal();
  });

  // To-do form submission
  domController.elements.todoForm.addEventListener('submit', (e) => {
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
        domController.showNotification(todoData.id ? 'Task updated.' : 'Task added.', 'success');
      } else {
        domController.showNotification('Unable to update task.', 'error');
      }
    }
  });

  // Actions on todo items
  domController.elements.todosListUL.addEventListener('click', (e) => {
    const target = e.target;
    const todoLi = target.closest('li[data-todo-id]');
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

    if (target.classList.contains('delete-todo-btn')) {
      const project = appLogic.getProjectById(projectIdForAction);
      const todoToDelete = project.getTodoById(todoId);
      if (confirm(`You will permanently delete task "${todoToDelete.title}".`)) {
        appLogic.removeTodoFromProject(projectIdForAction, todoId);
        domController.showNotification('Task deleted.', 'success');
        updateAndRenderTodos();
      }
    } else if (target.classList.contains('edit-todo-btn')) {
      const todoToEdit = appLogic
        .getProjectById(projectIdForAction)
        ?.getTodoById(todoId);
      if (todoToEdit) {
        domController.openTodoModal(todoToEdit, projectIdForAction);
      }
    } else if (target.classList.contains('todo-checkbox')) {
      appLogic.toggleTodoComplete(projectIdForAction, todoId);
      updateAndRenderTodos();
    } else if (target.classList.contains('expand-todo-btn')) {
      const detailsDiv = todoLi.querySelector('.todo-full-details');
      if (detailsDiv) {
        const isHidden = detailsDiv.classList.contains('hidden');
        if (isHidden) {
          detailsDiv.classList.remove('hidden');
          detailsDiv.classList.add('visible');
          target.innerHTML = '&#8722;'; // Minus sign (hide)
          target.title = 'Hide details';
          todoLi.classList.add('details-expanded');
        } else {
          detailsDiv.classList.add('hidden');
          detailsDiv.classList.remove('visible');
          target.innerHTML = '&#43;'; // Plus sign (show)
          target.title = "Show details";
          todoLi.classList.remove('details-expanded');
        }
      }
    }
  });

  // Close modals if clicked outside
  window.addEventListener('click', (e) => {
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
    domController.updateProjectTitle('Add a project');
    domController.renderTodos(null);
  }

  // Helper functions to refresh project list
  function refreshProjectsList() {
    const projects = appLogic.getAllProjects();
    const currentProject = appLogic.getCurrentProject();
    domController.renderProjects(
      projects,
      currentProject ? currentProject.id : null,
    );
  }

  // Initial setup
  domController.initializeUI();
  refreshProjectsList();
  updateAndRenderTodos();
});