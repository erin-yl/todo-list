// Todo item module that manages todo objects

import { format, parse } from "date-fns";

class Todo {
  constructor(
    title,
    description,
    dueDate,
    priority,
    tags = [],
    completed = false,
  ) {
    this.id = `todo-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`; // Unique ID
    this.title = title;
    this.description = description;

    // Handle date as local dates
    this.dueDate = null;
    if (dueDate) {
      let dateToProcess;
      if (dueDate instanceof Date) {
        // For sample data using Date objects
        dateToProcess = dueDate;
      } else if (typeof dueDate === "string") {
        // For HTML form inputs
        dateToProcess = parse(dueDate.trim(), "yyyy-MM-dd", new Date());
      } 
      if (dateToProcess && !isNaN(dateToProcess.valueOf())) {
        this.dueDate = format(dateToProcess, "yyyy-MM-dd"); // Store consistently
      }
    }
    
    this.priority = priority;
    this.tags = Array.isArray(tags) ? tags : [];
    this.completed = completed;
  }

  toggleComplete() {
    this.completed = !this.completed;
  }

  updateDetails(details) {
    if (details.title) this.title = details.title;
    if (details.description) this.description = details.description;

    if (details.dueDate !== undefined) {
      if (details.dueDate && typeof details.dueDate === "string") {
        const parsedDate = parse(details.dueDate.trim(), "yyyy-MM-dd", new Date());
        this.dueDate = !isNaN(parsedDate.valueOf())
          ? format(parsedDate, "yyyy-MM-dd")
          : null;
      } else {
        this.dueDate = null;
      }
    }
    
    if (details.priority) {
      if (["low", "medium", "high"].includes(details.priority)) {
        this.priority = details.priority;
      }
    }

    if (details.tags && Array.isArray(details.tags)) {
      this.tags = details.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
  }

  addTag(tag) {
    const trimmedTag = tag.trim();
    if (trimmedTag && !this.tags.includes(trimmedTag)) {
      this.tags.push(trimmedTag);
    }
  }

  removeTag(tagToRemove) {
    const trimmedTagToRemove = tagToRemove.trim();
    this.tags = this.tags.filter((tag) => tag !== trimmedTagToRemove);
  }

  // Helper to get a string representation of tags
  getTagsString() {
    return this.tags.join(", ");
  }

  // Helper to set tags from a comma-separated string
  setTagsFromString(tagsString) {
    if (typeof tagsString === "string") {
      this.tags = tagsString
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
  }
}

export default Todo;
