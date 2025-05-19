// Storage module that uses localStorage mechanism

const STORAGE_KEY = "todoAppProjects";

const storage = {
  saveData: function (data) {
    // Save project objects
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serializedData);
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  },

  loadData: function () {
    try {
      const serializedData = localStorage.getItem(STORAGE_KEY);
      if (serializedData === null) {
        return undefined;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      return undefined;
    }
  },

  clearData: function () {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing data from localStorage:", error);
    }
  },
};

export default storage;
