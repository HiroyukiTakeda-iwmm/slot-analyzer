// Reset AsyncStorage mock before each test
beforeEach(() => {
  const AsyncStorage = require('./__mocks__/async-storage');
  AsyncStorage.__resetStore();
  jest.clearAllMocks();
});
