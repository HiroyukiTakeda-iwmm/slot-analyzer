let store = {};

module.exports = {
  setItem: jest.fn((key, value) => {
    return Promise.resolve().then(() => {
      store[key] = value;
    });
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve().then(() => {
      return store[key] || null;
    });
  }),
  removeItem: jest.fn((key) => {
    return Promise.resolve().then(() => {
      delete store[key];
    });
  }),
  clear: jest.fn(() => {
    return Promise.resolve().then(() => {
      store = {};
    });
  }),
  getAllKeys: jest.fn(() => {
    return Promise.resolve().then(() => {
      return Object.keys(store);
    });
  }),
  multiGet: jest.fn((keys) => {
    return Promise.resolve().then(() => {
      return keys.map((key) => [key, store[key] || null]);
    });
  }),
  multiSet: jest.fn((pairs) => {
    return Promise.resolve().then(() => {
      pairs.forEach(([key, value]) => {
        store[key] = value;
      });
    });
  }),
  multiRemove: jest.fn((keys) => {
    return Promise.resolve().then(() => {
      keys.forEach((key) => {
        delete store[key];
      });
    });
  }),
  // For test cleanup
  __resetStore: () => {
    store = {};
  },
};
