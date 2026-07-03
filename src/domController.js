// Display controller module that handles DOM manipulations

import { format, isValid as isValidDate } from 'date-fns';

const domController = (() => {
  // DOM element selectors
  const projectsListUL = document.getElementById('projects-list');
  const addProjectBtn = document.getElementById('add-project-btn');
  const currentProjectTitle = document.getElementById('current-project-title');
  const addTodoBtn = document.getElementById('add-todo-btn');
  const todosListUL = document.getElementById('todos-list');
  const tagFilterArea = document.getElementById('tag-filter-area');
  const clearTagFilterBtn = document.getElementById('clear-tag-filter-btn');
  const notificationArea = document.getElementById('notification-area');

  // Project modal
  const projectModal = document.getElementById('project-modal');
  const projectForm = document.getElementById('project-form');
  const projectIdInput = document.getElementById('project-id'); // Hidden input for project editing
  const projectNameInput = document.getElementById('project-name-input');
  const saveProjectBtn = document.getElementById('save-project-btn');
  const closeProjectModalBtn = document.getElementById('close-project-modal');

  // Todo modal
  const todoModal = document.getElementById('todo-modal');
  const todoForm = document.getElementById('todo-form');
  const todoIdInput = document.getElementById('todo-id'); // Hidden input for todo editing
  const todoTitleInput = document.getElementById('todo-title-input');
  const todoDescriptionInput = document.getElementById('todo-description-input',
  );
  const todoDueDateInput = document.getElementById('todo-dueDate-input');
  const todoPriorityInput = document.getElementById('todo-priority-input');
  const todoTagsInput = document.getElementById('todo-tags-input');
  const closeTodoModalBtn = document.getElementById('close-todo-modal');

  // Helper functions to remove all child nodes
  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function formatDateForDisplay(date) {
    if (date instanceof Date && isValidDate(date)) { //
      return format(date, 'MMM dd, yyyy'); //
    }
    return 'No date set';
  }

  // Project rendering
  function renderProjects(projects, currentProjectId) {
    clearElement(projectsListUL);
    if (!projects || projects.length === 0) {
      const span = document.createElement('span');
      span.textContent = 'No projects yet.';
      projectsListUL.appendChild(span);
      return;
    }

    projects.forEach((project) => {
      const li = document.createElement('li');
      li.dataset.projectId = project.id;

      const nameSpan = document.createElement('span');
      nameSpan.classList.add('project-name');
      nameSpan.textContent = project.name;
      li.appendChild(nameSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.classList.add('project-actions');

      const moreBtn = document.createElement('button');
      moreBtn.classList.add('more-actions-btn');
      moreBtn.innerHTML = '<span class="material-symbols-outlined">more_vert</span>';
      moreBtn.title = "More options";
      actionsDiv.appendChild(moreBtn);

      const dropdown = document.createElement('ul');
      dropdown.classList.add('actions-dropdown');
      // Edit option
      const editLi = document.createElement('li');
      editLi.textContent = 'Edit';
      editLi.classList.add('edit-project');
      dropdown.appendChild(editLi);
      // Delete option
      const deleteLi = document.createElement('li');
      deleteLi.textContent = 'Delete';
      deleteLi.classList.add('delete-project');
      dropdown.appendChild(deleteLi);

      actionsDiv.appendChild(dropdown);
      li.appendChild(actionsDiv);

      if (project.id === currentProjectId) {
        li.classList.add("active");
      }
      projectsListUL.appendChild(li);
    });
  }

  function updateProjectTitle(title) {
    currentProjectTitle.textContent = title || 'No project selected';
  }

  // To-do rendering
  function renderTodos(projectOrSearchResults) {
    clearElement(todosListUL);

    const isGlobalSearch = projectOrSearchResults && projectOrSearchResults.isGlobalSearch === true;
    const todos = projectOrSearchResults ? projectOrSearchResults.todos : [];
    const displayName = projectOrSearchResults ? projectOrSearchResults.name : 'Select a Project';

    updateProjectTitle(displayName);

    if (!todos || todos.length === 0) {
      const resultsP = document.createElement('p');
      if (isGlobalSearch) {
        resultsP.textContent = 'No tasks found matching your search.';
      } else if (projectOrSearchResults) {
        resultsP.textContent = 'No tasks in this project yet.';
      } else {
        resultsP.textContent = 'Select a project or enter a search term.';
      }
      todosListUL.appendChild(resultsP);

      return;
    }

    todos.forEach(todo => {
      const li = document.createElement('li');
      li.dataset.todoId = todo.id;

      if (isGlobalSearch && todo.originalProjectId) {
        li.dataset.originalProjectId = todo.originalProjectId;
      }
      if (todo.completed) {
        li.classList.add('todo-completed');
      }

      const todoPreviewContent = document.createElement('div');
      todoPreviewContent.classList.add('todo-preview-content');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.classList.add('todo-checkbox');
      checkbox.dataset.todoId = todo.id;

      const todoInfoDiv = document.createElement('div');
      todoInfoDiv.classList.add('todo-info');

      const titleSpan = document.createElement('span');
      titleSpan.classList.add('todo-title');
      titleSpan.textContent = todo.title;

      const dueDateSpan = document.createElement('span');
      dueDateSpan.classList.add('todo-due-date');
      dueDateSpan.textContent = `Due: ${formatDateForDisplay(todo.dueDate)}`;

      const prioritySpan = document.createElement('span');
      prioritySpan.classList.add('priority-label', `priority-${todo.priority}`);
      const priorityText = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
      prioritySpan.textContent = `${priorityText}`;

      todoInfoDiv.appendChild(checkbox);
      todoInfoDiv.appendChild(titleSpan);
      todoInfoDiv.appendChild(dueDateSpan);
      todoInfoDiv.appendChild(prioritySpan);

      // Project name display in global search result
      if (isGlobalSearch && todo.projectName) {
        const projectLabelSpan = document.createElement('span');
        projectLabelSpan.classList.add('todo-project-label');
        projectLabelSpan.textContent = `Project: ${todo.projectName}`;
        todoInfoDiv.appendChild(projectLabelSpan);
      }

      const actionsDiv = document.createElement('div');
      actionsDiv.classList.add('todo-actions');

      const expandBtn = document.createElement('button');
      expandBtn.classList.add('expand-todo-btn');
      expandBtn.innerHTML = '<span class="material-symbols-outlined">expand_circle_down</span>';
      expandBtn.title = 'Show details';
      actionsDiv.appendChild(expandBtn);

      const moreBtn = document.createElement('button');
      moreBtn.classList.add('more-actions-btn');
      moreBtn.innerHTML = '<span class="material-symbols-outlined">more_vert</span>';
      moreBtn.title = "More options";
      actionsDiv.appendChild(moreBtn);

      const dropdown = document.createElement('ul');
      dropdown.classList.add('actions-dropdown');
      // Edit option
      const editLi = document.createElement('li');
      editLi.textContent = 'Edit';
      editLi.classList.add('edit-todo');
      dropdown.appendChild(editLi);
      // Delete option
      const deleteLi = document.createElement('li');
      deleteLi.textContent = 'Delete';
      deleteLi.classList.add('delete-todo');
      dropdown.appendChild(deleteLi);

      actionsDiv.appendChild(dropdown);

      todoPreviewContent.appendChild(todoInfoDiv);
      todoPreviewContent.appendChild(actionsDiv);
      li.appendChild(todoPreviewContent);

      const fullDetailsDiv = document.createElement('div');
      fullDetailsDiv.classList.add('todo-full-details', 'hidden');

      const descriptionText = document.createTextNode(todo.description || 'No description');
      fullDetailsDiv.appendChild(descriptionText);

      // Tags display
      if (todo.tags && todo.tags.length > 0) {
        const tagsDiv = document.createElement('div');
        tagsDiv.classList.add('todo-tags-display');
        todo.tags.forEach((tag) => {
          const tagSpan = document.createElement('span');
          tagSpan.classList.add('tag-label');
          tagSpan.textContent = tag;
          tagsDiv.appendChild(tagSpan);
        });
        fullDetailsDiv.appendChild(tagsDiv);
      }

      li.appendChild(fullDetailsDiv);
      todosListUL.appendChild(li);
    });
  }

  // Modal handling
  function openProjectModal(projectToEdit = null) {
    clearFormErrors(projectForm);
    projectForm.reset();
    projectIdInput.value = ''; // Clear hidden ID field
    saveProjectBtn.textContent = 'Save';

    if (projectToEdit) {
      projectIdInput.value = projectToEdit.id;
      projectNameInput.value = projectToEdit.name;
    }
    projectModal.classList.add('show');
    projectNameInput.focus();
  }

  function closeProjectModal() {
    projectModal.classList.remove('show');
  }

  function openTodoModal(todoToEdit = null, currentProjectId) {
    clearFormErrors(todoForm);
    todoForm.reset();
    todoIdInput.value = ''; // Clear hidden ID field

    if (todoToEdit) {
      todoIdInput.value = todoToEdit.id;
      todoTitleInput.value = todoToEdit.title;
      todoDescriptionInput.value = todoToEdit.description;
      todoDueDateInput.value = (todoToEdit.dueDate && isValidDate(todoToEdit.dueDate))
        ? format(todoToEdit.dueDate, 'yyyy-MM-dd') // Format Date obj for input
        : ''; // Empty string for null or invalid date
      todoPriorityInput.value = todoToEdit.priority;
      todoTagsInput.value = todoToEdit.getTagsString();
    }
    todoForm.dataset.currentProjectId = currentProjectId;
    todoModal.classList.add('show');
    todoTitleInput.focus();
  }

  function closeTodoModal() {
    todoModal.classList.remove('show');
  }

  // Form data getters
  function getProjectFormData() {
    clearFormErrors(projectForm);
    let isValid = true;
    const name = projectNameInput.value.trim();
    const id = projectIdInput.value;

    if (projectNameInput.validity.valueMissing) {
      showFieldError(projectNameInput, 'Project name is required.');
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
      showFieldError(todoTitleInput, 'Task name is required.');
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
    formElement.querySelectorAll('div').forEach(fieldContainer => {
      const input = fieldContainer.querySelector('.form-input');
      const helpSpan = fieldContainer.querySelector('.help-message');
      const errorSpan = fieldContainer.querySelector('.error-message');

      if (input) {
        input.classList.remove('is-invalid');
        input.setCustomValidity('');
      }
      if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.style.display = 'none';
      }
      if (helpSpan) {
        helpSpan.style.display = 'block';
      }
    });
  }

  function showFieldError(inputElement, message) {
    const fieldContainer = inputElement.parentElement;
    const helpSpan = fieldContainer.querySelector('.help-message');
    const errorSpan = fieldContainer.querySelector('.error-message');

    inputElement.classList.add('is-invalid');
    inputElement.setCustomValidity(message);

    if (errorSpan) {
      errorSpan.textContent = message;
      errorSpan.style.display = 'block';
    }
    if (helpSpan) {
      helpSpan.style.display = 'none';
    }
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;

    notificationArea.appendChild(notification);

    // Remove notification from DOM after animation completes
    notification.addEventListener('animationend', (e) => {
      if (e.animationName === 'fadeOutNotification') {
        notification.remove();
      }
    });
  }

  function renderTagCloud(tags, activeTag) {
    if (!tagFilterArea) return;
    clearElement(tagFilterArea);

    if (tags && tags.length > 0) {
      tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.classList.add('tag-filter-item');
        tagElement.textContent = tag;
        tagElement.dataset.tag = tag;
        if (tag === activeTag) {
          tagElement.classList.add('active');
        }
        tagFilterArea.appendChild(tagElement);
      });
    } else {
      const noTagsMsg = document.createElement('span');
      noTagsMsg.textContent = 'No tags available for filtering.';
      noTagsMsg.style.fontSize = '0.875rem';
      tagFilterArea.appendChild(noTagsMsg);
    }

    if (clearTagFilterBtn) {
      clearTagFilterBtn.style.display = activeTag ? 'inline' : 'none';
    }
    if (clearTagFilterBtn && !tagFilterArea.contains(clearTagFilterBtn) && tags.length > 0) {
      tagFilterArea.appendChild(clearTagFilterBtn);
    }
  }

  // Initial state
  function initializeUI() {
    updateProjectTitle('Loading projects...');
    clearElement(todosListUL);
    const li = document.createElement('li');
    li.textContent = 'Select or add a project to see your tasks.';
    todosListUL.appendChild(li);
    addTodoBtn.style.display = 'none';
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
    renderTagCloud,
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
      clearTagFilterBtn,
    },
  };
})();

export default domController;