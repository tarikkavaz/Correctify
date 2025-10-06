// Add custom jest matchers from jest-dom
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();
