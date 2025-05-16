// App controller module that handles the core logic

const appLogic = (() => {
  let projects = [];
  let currentProject = null;

  function rehydrateProjects(plainProjects) {
    return plainProjects.map(plainProject => {
      const project = new Project(plainProject.name); // Create new instances of project class
      project.id = plainProject.id;
      project.todos = plainProject.todos.map(plainTodo => {
        const todo = new Todo(  // Create new instances of todo class
          plainTodo.title,
          plainTodo.description,
          new Date(plainTodo.dueDate),
          plainTodo.priority || 'medium',
          plainTodo.tags || [],
          plainTodo.completed
        );
        todo.id = plainTodo.id;
        return todo;
      });
      return project;
    });
  }

  function loadProjects() {
    const loadedData = storage.loadData();
    if (loadedData && loadedData.length > 0) {
      projects = rehydrateProjects(loadedData);
      currentProject = projects[0] || null;
    } else {
      // Create a default project if nothing is loaded
      const defaultProject = new Project("Default");
      projects = [defaultProject];
      currentProject = defaultProject;
      saveProjects();
    }
  }

  function saveProjects() {
    storage.saveData(projects);
  }

  // Project management
  function addProject(name) {
    if (name && !projects.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      const newProject = new Project(name);
      projects.push(newProject);
      saveProjects();
      return newProject;
    }
    console.warn("Project name already exists:", name);
    return null;
  }

  function removeProject(projectId) {
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex > -1) {
      const removedProject = projects.splice(projectIndex, 1)[0];
      if (currentProject && currentProject.id === projectId) {
        currentProject = projects[0] || null;
      }
      saveProjects();
      return removedProject;
    }
    return null;
  }

  function findProjectById(projectId) {
    return projects.find(p => p.id === projectId);
  }

  function getAllProjects() {
    return [...projects];
  }

  function getCurrentProject() {
    return currentProject;
  }

  function setCurrentProject(projectId) {
    const project = findProjectById(projectId);
    if (project) {
      currentProject = project;
      return true;
    }
    return false;
  }

  // To-do management
  function addTodoToProject(projectId, todoDetails) {
    const project = findProjectById(projectId);
    if (project) {
      const { title, description, dueDate, priority, tagsString } = todoDetails;
      const newTodo = new Todo(title, description, dueDate, priority);
      if (tagsString) {
        newTodo.setTagsFromString(tagsString);
      }
      project.addTodo(newTodo);
      saveProjects();
      return newTodo;
    }
    console.warn("Project not found for adding todo:", projectId);
    return null;
  }

  function removeTodoFromProject(projectId, todoId) {
    const project = findProjectById(projectId);
    if (project) {
      project.removeTodo(todoId);
      saveProjects();
      return true;
    }
    return false;
  }

  function updateTodoInProject(projectId, todoId, updatedDetails) {
    const project = findProjectById(projectId);
    if (project) {
      const todo = project.getTodoById(todoId);
      if (todo) {
        if (updatedDetails.tagsString !== undefined) {
          todo.setTagsFromString(updatedDetails.tagsString);
          // Avoid passing tagsString since todo.updateDetails expects tags as an array
          const { tagsString, ...otherDetails } = updatedDetails;
          todo.updateDetails(otherDetails);
        } else {
          todo.updateDetails(updatedDetails);
        }
        saveProjects();
        return todo;
      }
    }
    return null;
  }

  function toggleTodoComplete(projectId, todoId) {
    const project = findProjectById(projectId);
    if (project) {
      const todo = project.getTodoById(todoId);
      if (todo) {
        todo.toggleComplete();
        saveProjects();
        return todo;
      }
    }
    return null;
  }

  function getAllTodosAcrossProjects() {
    return projects.reduce((acc, project) => acc.concat(project.getAllTodos()), []);
  }

  function filterTodosByTagAcrossProjects(tag) {
    const allTodos = getAllTodosAcrossProjects();
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return allTodos;
    return allTodos.filter(todo =>
      todo.tags.some(t => t.toLowerCase() === trimmedTag)
    );
  }

  function filterTodosByPriorityAcrossProjects(priorityLevel) {
    const allTodos = getAllTodosAcrossProjects();
    return allTodos.filter(todo => todo.priority === priorityLevel);
  }

  function getAllUniqueTagsAcrossProjects() {
    const allTags = new Set();
    projects.forEach(project => {
      project.getUniqueTags().forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }

  loadProjects();

  return {
    addProject,
    removeProject,
    findProjectById,
    getAllProjects,
    setCurrentProject,
    getCurrentProject,
    addTodoToProject,
    removeTodoFromProject,
    updateTodoInProject,
    toggleTodoComplete,
    getAllTodosAcrossProjects,
    filterTodosByTagAcrossProjects,
    filterTodosByPriorityAcrossProjects,
    getAllUniqueTagsAcrossProjects
  };
})();

export default appLogic;