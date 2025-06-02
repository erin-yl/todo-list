// App controller module that handles the core logic

import Project from "./project.js";
import Todo from "./todo.js";
import storage from "./storage.js";

const appLogic = (() => {
  let projects = [];
  let currentProject = null;

  function rehydrateProjects(plainProjects) {
    return plainProjects.map((plainProject) => {
      const project = new Project(plainProject.name); // Create new instances of project class
      project.id = plainProject.id;
      project.todos = plainProject.todos.map((plainTodo) => {
        const todo = new Todo( // Create new instances of todo class
          plainTodo.title,
          plainTodo.description,
          plainTodo.dueDate,
          plainTodo.priority,
          plainTodo.tags || [],
          plainTodo.completed,
        );
        todo.id = plainTodo.id;
        return todo;
      });
      return project;
    });
  }

  function createSampleData() {
    const workProject = new Project("Work");
    workProject.addTodo(new Todo("Finish Q2 report", "Compile required data and finalize the conclusion.", new Date(2025, 4, 26), "high", ["report"], false));
    workProject.addTodo(new Todo("Team meeting prep", "Prepare agenda and slides for Monday's team meeting.", new Date(2025, 5, 6), "medium", ["meeting"], false));
    workProject.addTodo(new Todo("Client follow-up", "Call John Doe regarding project Alpha.", "", "medium", ["client"], true));

    const personalProject = new Project("Personal");
    personalProject.addTodo(new Todo("Grocery shopping", "Milk, eggs, chicken, fruits.", new Date(2025, 4, 20), "low", ["home", "shopping"], false));
    personalProject.addTodo(new Todo("Book doctor appointment", "Annual check-up.", new Date(2025, 5, 10), "high", ["health"], false));

    const learningProject = new Project("Learning");
    learningProject.addTodo(new Todo("Webpack Deep Dive", "Understand loaders and plugins.", new Date(2025, 4, 30), "medium", ["dev"], true));
    learningProject.addTodo(new Todo("Read 'The Pragmatic Programmer'", "Chapter 3-5", "", "low", ["reading", "dev"], false));

    projects = [workProject, personalProject, learningProject];
    currentProject = workProject;
    saveProjects();
  }

  function loadProjects() {
    const loadedData = storage.loadData();
    if (loadedData && loadedData.length > 0) {
      projects = rehydrateProjects(loadedData);
      currentProject = projects[0] || null;
    } else {
      createSampleData();
    }
  }

  function saveProjects() {
    storage.saveData(projects);
  }

  // Project management
  function addProject(name) {
    if (
      name &&
      !projects.find((p) => p.name.toLowerCase() === name.toLowerCase())
    ) {
      const newProject = new Project(name);
      projects.push(newProject);
      saveProjects();
      return newProject;
    }
    return null;
  }

  function updateProject(projectId, newName) {
    const projectToUpdate = findProjectById(projectId);
    if (!projectToUpdate) {
      return null;
    }
    if (projects.some(p => p.id !== projectId && p.name.toLowerCase() === newName.toLowerCase())) {
      return { error: "duplicate", project: projectToUpdate };
    }
    projectToUpdate.name = newName;
    saveProjects();
    return projectToUpdate;
  }

  function removeProject(projectId) {
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex > -1) {
      if (projects.length === 1) {
        return { error: "last_project" };
      }
      const removedProject = projects.splice(projectIndex, 1)[0];
      if (currentProject && currentProject.id === projectId) {
        currentProject = projects.length > 0 ? projects[0] : null;
      }
      saveProjects();
      return { success: true, removedProjectName: removedProject.name, newCurrentProject: currentProject };
    }
    return { error: "not_found" };
  }

  function findProjectById(projectId) {
    return projects.find((p) => p.id === projectId);
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

  // Todo management
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
          // eslint-disable-next-line no-unused-vars
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
    return projects.reduce(
      (acc, project) => acc.concat(project.getAllTodos()),
      [],
    );
  }

  function searchTodosInList(todos, searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return todos;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return todos.filter(todo =>
      todo.title.toLowerCase().includes(lowerSearchTerm) ||
      todo.description.toLowerCase().includes(lowerSearchTerm)
    );
  }

  function getAllTodosWithProjectInfo() {
    const allTodosWithProjectInfo = [];
    projects.forEach(project => {
      project.getAllTodos().forEach(todo => {
        allTodosWithProjectInfo.push({
          ...todo,
          originalProjectId: project.id,
          projectName: project.name
        });
      });
    });
    return allTodosWithProjectInfo;
  }

  function filterTodosByTagAcrossProjects(tag) {
    const allTodos = getAllTodosAcrossProjects();
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return allTodos;
    return allTodos.filter((todo) =>
      todo.tags.some((t) => t.toLowerCase() === trimmedTag),
    );
  }

  function filterTodosByPriorityAcrossProjects(priorityLevel) {
    const allTodos = getAllTodosAcrossProjects();
    return allTodos.filter((todo) => todo.priority === priorityLevel);
  }

  function getAllTagsAcrossProjects() {
    const allTags = new Set();
    projects.forEach((project) => {
      project.getUniqueTags().forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }

  loadProjects();

  return {
    addProject,
    updateProject,
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
    searchTodosInList,
    getAllTodosWithProjectInfo,
    filterTodosByTagAcrossProjects,
    filterTodosByPriorityAcrossProjects,
    getAllTagsAcrossProjects,
  };
})();

export default appLogic;