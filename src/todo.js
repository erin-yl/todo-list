// Todo item module that manages todo objects

class Todo {
  constructor(title, description, dueDate, priority, tags = [], completed = false) {
    this.id = `todo-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`; // Unique ID
    this.title = title;
    this.description = description;
    this.dueDate = dueDate instanceof Date ? dueDate : new Date(dueDate);
    this.priority = priority; // 'low', 'medium', 'high'
    this.tags = Array.isArray(tags) ? tags : [];
    this.completed = completed;
  }

  toggleComplete() {
    this.completed = !this.completed;
  }

  updatePriority(newPriority) {
    if (['low', 'medium', 'high'].includes(newPriority)) {
      this.priority = newPriority;
    } else {
      console.warn("Invalid priority value:", newPriority);
    }
  }

  updateDetails(details) {
    if (details.title) this.title = details.title;
    if (details.description) this.description = details.description;
    if (details.dueDate) this.dueDate = new Date(details.dueDate);
    if (details.priority) this.updatePriority(details.priority);
    if (details.tags && Array.isArray(details.tags)) {
      this.tags = details.tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
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
    this.tags = this.tags.filter(tag => tag !== trimmedTagToRemove);
  }

  // Helper to get a string representation of tags
  getTagsString() {
    return this.tags.join(', ');
  }

  // Helper to set tags from a comma-separated string
  setTagsFromString(tagsString) {
    if (typeof tagsString === 'string') {
      this.tags = tagsString.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
  }
}

export default Todo;