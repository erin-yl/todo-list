// Todo item module that manages todo objects

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

    // Standardize dueDate to be a Date object or null
    this.dueDate = null;
    if (dueDate instanceof Date && !isNaN(dueDate.valueOf())) {
      // For sample data using Date objects
      this.dueDate = dueDate;
    } else if (typeof dueDate === 'string' && dueDate.trim() !== '') {
      // For HTML form inputs
      const parsedDate = new Date(dueDate.trim());
      this.dueDate = !isNaN(parsedDate.valueOf()) ? parsedDate : null;
    } else {
      this.dueDate = null;
    }

    this.priority = priority;
    this.tags = Array.isArray(tags) ? tags : [];
    this.completed = completed;
  }

  toggleComplete() {
    this.completed = !this.completed;
  }

  updateDetails(details) {
    if (details.title !== undefined) this.title = details.title;
    if (details.description !== undefined) this.description = details.description;

    if (details.dueDate !== undefined) {
      if (details.dueDate instanceof Date && !isNaN(details.dueDate.valueOf())) {
        this.dueDate = details.dueDate;
      } else if (typeof details.dueDate === 'string' && details.dueDate.trim() !== '') {
        const parsedDate = new Date(details.dueDate.trim());
        this.dueDate = !isNaN(parsedDate.valueOf()) ? parsedDate : null;
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
    } else if (details.tagsString !== undefined) {
      this.setTagsFromString(details.tagsString);
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