import appLogic from './appLogic.js';
import domController from './domController.js';
import { format as formatDateFns, startOfDay as startOfDayFns } from 'date-fns';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  let currentSearchTerm = '';
  let currentPriorityFilter = 'all';
  let currentTagFilter = null;
  let currentSortCriteria = { field: 'dueDate', direction: 'asc' };
  let currentDueDateFilter = null;

  const searchInput = document.getElementById('search-todos-input');
  const priorityFilterSelect = document.getElementById('priority-filter');
  const tagFilterArea = document.getElementById('tag-filter-area');
  const clearTagFilterBtn = document.getElementById('clear-tag-filter-btn');
  const sortTodosSelect = document.getElementById('sort-todos');
  const dueDateFilterInput = document.getElementById('due-date-filter-input');
  const clearDateFilterBtn = document.getElementById('clear-date-filter-btn');
  const showTodayTasksBtn = document.getElementById('show-today-tasks-btn');

  function refreshTagCloud(isGlobalMode = false) {
    let tagsForCloud = [];
    const currentProject = appLogic.getCurrentProject();

    if (isGlobalMode) { // True if date filter or global search is active
      tagsForCloud = appLogic.getTagsAcrossProjects();
    } else if (currentProject) {
      const projectData = appLogic.getProjectById(currentProject.id);
      tagsForCloud = projectData ? projectData.getUniqueTags() : [];
    } else {
      tagsForCloud = appLogic.getTagsAcrossProjects();
    }
    domController.renderTagCloud(tagsForCloud, currentTagFilter);
  }

  function updateAndRenderTodos() {
    let todosToDisplay = [];
    let viewTitle = '';
    let isGlobalMode = false;
    const currentProjectFromSidebar = appLogic.getCurrentProject();

    // Global due date mode
    if (currentDueDateFilter) {
      viewTitle = `Tasks due on ${formatDateFns(new Date(currentDueDateFilter + 'T00:00:00'), 'MMM dd, yyyy')}`;
      todosToDisplay = appLogic.getTodosDueOnDate(currentDueDateFilter);
      isGlobalMode = true;
      if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'block';
      // Clear search when date filter is active
      if (searchInput) searchInput.value = '';
      currentSearchTerm = '';
      // Deselect project in sidebar visually
      refreshProjectsList(null);

      // Global search mode
    } else if (currentSearchTerm && currentSearchTerm.trim() !== '') {
      viewTitle = `Search results for '${currentSearchTerm}'`;
      const allTodosWithProjectInfo = appLogic.getTodosWithProjectInfo();
      todosToDisplay = appLogic.searchTodosInList(allTodosWithProjectInfo, currentSearchTerm);
      isGlobalMode = true;
      if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'none';
      // Deselect project in sidebar visually
      refreshProjectsList(null);

      // Project mode
    } else if (currentProjectFromSidebar) {
      const projectData = appLogic.getProjectById(currentProjectFromSidebar.id);
      todosToDisplay = projectData ? projectData.getAllTodos() : [];
      viewTitle = projectData ? projectData.name : 'Project not found';
      refreshProjectsList(currentProjectFromSidebar.id);
      if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'none';
      refreshProjectsList(currentProjectFromSidebar.id);

      // Default or no selection
    } else {
      viewTitle = 'Select a date, project, or search';
      todosToDisplay = [];
      isGlobalMode = false;
      if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'none';
      refreshProjectsList(null);
    }

    refreshTagCloud(isGlobalMode || !currentProjectFromSidebar);

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

  if (dueDateFilterInput) {
    dueDateFilterInput.addEventListener('change', (e) => {
      currentDueDateFilter = e.target.value;
      currentSearchTerm = '';
      if (searchInput) searchInput.value = '';
      updateAndRenderTodos();
    });
  }

  if (clearDateFilterBtn) {
    clearDateFilterBtn.addEventListener('click', () => {
      currentDueDateFilter = null;
      if (dueDateFilterInput) dueDateFilterInput.value = '';
      clearDateFilterBtn.style.display = 'none';
      updateAndRenderTodos();
    });
  }

  if (showTodayTasksBtn) {
    showTodayTasksBtn.addEventListener('click', () => {
      const today = formatDateFns(startOfDayFns(new Date()), 'yyyy-MM-dd');
      currentDueDateFilter = today;
      if (dueDateFilterInput) dueDateFilterInput.value = today;
      currentSearchTerm = '';
      if (searchInput) searchInput.value = '';
      updateAndRenderTodos();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchTerm = e.target.value;
      if (currentSearchTerm.trim() !== '') {
        currentDueDateFilter = null;
        if (dueDateFilterInput) dueDateFilterInput.value = '';
        if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'none';
      }
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

  if (clearTagFilterBtn) {
    clearTagFilterBtn.addEventListener('click', () => {
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

  // Helper function to manage multiple dropdowns
  function closeAllDropdowns(exceptThisOne = null) {
    document.querySelectorAll('.actions-dropdown.visible').forEach(dropdown => {
      if (dropdown !== exceptThisOne) {
        dropdown.classList.remove('visible');
      }
    });
  }

  document.addEventListener('click', (e) => {
    // If click is not on a more button or inside a dropdown, close all dropdowns
    if (!e.target.closest('.more-actions-btn') && !e.target.closest('.actions-dropdown')) {
      closeAllDropdowns();
    }
  });

  // Actions on a project
  domController.elements.projectsListUL.addEventListener('click', (e) => {
    const projectLi = e.target.closest('li[data-project-id]');
    if (!projectLi) return;

    const projectId = projectLi.dataset.projectId;
    if (e.target.classList.contains('more-actions-btn')) {
      e.stopPropagation(); // Prevent project selection click when opening dropdown
      const dropdown = e.target.nextElementSibling;
      if (dropdown && dropdown.classList.contains('actions-dropdown')) {
        closeAllDropdowns(dropdown);
        dropdown.classList.toggle('visible');
      }
    } else if (e.target.classList.contains('edit-project')) {
      closeAllDropdowns();
      const projectToEdit = appLogic.getProjectById(projectId);
      if (projectToEdit) {
        domController.openProjectModal(projectToEdit);
      }
    } else if (e.target.classList.contains('delete-project')) {
      closeAllDropdowns();
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
      // Ensure dropdown clicks don't trigger project selection
      if (!e.target.closest('.actions-dropdown') && !e.target.closest('.more-actions-btn')) {
        closeAllDropdowns();

        const selectedProjectId = appLogic.getCurrentProject()?.id;
        if (selectedProjectId !== projectId || currentDueDateFilter || currentSearchTerm) {
          appLogic.setCurrentProject(projectId);
          currentSearchTerm = '';

          if (searchInput) searchInput.value = '';
          currentPriorityFilter = 'all';
          if (priorityFilterSelect) priorityFilterSelect.value = 'all';
          currentTagFilter = null;
          currentSortCriteria = { field: 'dueDate', direction: 'asc' };
          if (sortTodosSelect) sortTodosSelect.value = 'dueDate_asc';
          currentDueDateFilter = null;
          if (dueDateFilterInput) dueDateFilterInput.value = '';
          if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'none';
          updateAndRenderTodos();
        }
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

    if (e.target.classList.contains('more-actions-btn')) {
      e.stopPropagation();
      const dropdown = e.target.nextElementSibling;
      if (dropdown && dropdown.classList.contains('actions-dropdown')) {
        closeAllDropdowns(dropdown);
        dropdown.classList.toggle('visible');
      }

    } else if (target.classList.contains('delete-todo')) {
      closeAllDropdowns();
      const project = appLogic.getProjectById(projectIdForAction);
      const todoToDelete = project.getTodoById(todoId);
      if (confirm(`You will permanently delete task "${todoToDelete.title}".`)) {
        appLogic.removeTodoFromProject(projectIdForAction, todoId);
        domController.showNotification('Task deleted.', 'success');
        updateAndRenderTodos();
      }

    } else if (target.classList.contains('edit-todo')) {
      closeAllDropdowns();
      const todoToEdit = appLogic
        .getProjectById(projectIdForAction)
        ?.getTodoById(todoId);
      if (todoToEdit) {
        domController.openTodoModal(todoToEdit, projectIdForAction);
      }

    } else if (target.classList.contains('todo-checkbox')) {
      closeAllDropdowns();
      appLogic.toggleTodoComplete(projectIdForAction, todoId);
      updateAndRenderTodos();
      
    } else if (target.classList.contains('expand-todo-btn')) {
      closeAllDropdowns();
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
          target.title = 'Show details';
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

  // Helper function to refresh project list
  function refreshProjectsList(currentProjectId = null) {
    const projects = appLogic.getAllProjects();
    domController.renderProjects(projects, currentProjectId);
  }

  // Initial setup
  domController.initializeUI();
  refreshProjectsList(appLogic.getCurrentProject()?.id); // Initially highlight selected project

  // Default to today's tasks
  const todayDefault = formatDateFns(startOfDayFns(new Date()), 'yyyy-MM-dd');
  currentDueDateFilter = todayDefault;
  if (dueDateFilterInput) dueDateFilterInput.value = todayDefault;
  if (clearDateFilterBtn) clearDateFilterBtn.style.display = 'block';

  updateAndRenderTodos(); //
});