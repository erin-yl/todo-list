// Project module that manages a collection of todo items

import Todo from './todo.js';

class Project {
  constructor(name) {
    this.id = `project-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`; // Unique ID
    this.name = name;
    this.todos = [];
  }

  addTodo(todoItem) {
    if (!(todoItem instanceof Todo)) return false;
    if (this.todos.some((todo) => todo.id === todoItem.id)) return false;

    this.todos.push(todoItem);
    return true;
  }

  removeTodo(todoId) {
    this.todos = this.todos.filter((todo) => todo.id !== todoId);
  }

  getTodoById(todoId) {
    return this.todos.find((todo) => todo.id === todoId);
  }

  getAllTodos() {
    return [...this.todos]; // Return a copy to prevent direct modification
  }

  getTodosByPriority(priorityLevel) {
    return this.todos.filter((todo) => todo.priority === priorityLevel);
  }

  getTodosByCompletion(completionStatus) {
    return this.todos.filter((todo) => todo.completed === completionStatus);
  }

  getTodosByTag(tag) {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return this.getAllTodos(); // Return all todos if tag is empty

    return this.todos.filter((todo) =>
      todo.tags.some((t) => t.toLowerCase() === trimmedTag),
    );
  }

  getUniqueTags() {
    const allTags = new Set();
    this.todos.forEach((todo) => {
      todo.tags.forEach((tag) => allTags.add(tag.trim()));
    });
    return Array.from(allTags).sort();
  }
}

export default Project;